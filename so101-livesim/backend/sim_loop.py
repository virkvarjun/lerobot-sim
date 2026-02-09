"""
Core simulation loop.

Runs at ~60 Hz in a background asyncio task and produces SimState
snapshots that the WebSocket broadcaster pushes to all clients.

Play triggers a pick-and-place demo: the robot reaches for a cube,
grips it, moves it to a new location, releases, and returns home.
"""

from __future__ import annotations

import asyncio
import math
import time
from datetime import datetime, timezone

from config import (
    DEFAULT_PARAMS,
    NUM_JOINTS,
    SIM_LOOP_HZ,
)
from messages import RobotStatus, SimState
from robot_kinematics import forward_kinematics


# ---- pick-and-place waypoints (joint-space, radians) ----
# Each waypoint: (joints[6], gripper_open, hold_ticks)
_PICK_PLACE_SEQ: list[tuple[list[float], bool, int]] = [
    # 0  Move above cube
    ([0.3, -0.25, -0.45, 0.0, -0.25, 0.0], True, 30),
    # 1  Lower toward cube
    ([0.3, -0.40, -0.60, 0.0, -0.10, 0.0], True, 25),
    # 2  Close gripper on cube
    ([0.3, -0.40, -0.60, 0.0, -0.10, 0.0], False, 35),
    # 3  Lift cube up
    ([0.3, -0.15, -0.35, 0.0, -0.25, 0.0], False, 30),
    # 4  Swing to drop position
    ([-0.4, -0.15, -0.35, 0.0, -0.25, 0.0], False, 35),
    # 5  Lower to drop height
    ([-0.4, -0.40, -0.60, 0.0, -0.10, 0.0], False, 25),
    # 6  Open gripper — release cube
    ([-0.4, -0.40, -0.60, 0.0, -0.10, 0.0], True, 30),
    # 7  Lift away from cube
    ([-0.4, -0.15, -0.35, 0.0, -0.25, 0.0], True, 25),
    # 8  Return home
    ([0.0, 0.0, 0.0, 0.0, 0.0, 0.0], True, 40),
]

# Smoothing factor — higher = faster convergence
_ALPHA = 0.18


def _compute_cube_start() -> list[float]:
    """Place the cube where the arm's EE is at waypoint 1 (pre-grip)."""
    wp_joints = _PICK_PLACE_SEQ[1][0]
    ee_pos, _ = forward_kinematics(wp_joints)
    return [ee_pos[0], max(ee_pos[1], 0.025), ee_pos[2]]


class SimLoop:
    """Manages the running simulation state and produces snapshots."""

    def __init__(self) -> None:
        self.hz: int = SIM_LOOP_HZ
        self.status: RobotStatus = RobotStatus.READY
        self.params: dict[str, float] = dict(DEFAULT_PARAMS)

        # Joint state (radians)
        self.joint_positions: list[float] = [0.0] * NUM_JOINTS
        self.joint_targets: list[float] = [0.0] * NUM_JOINTS

        # Gripper + cube
        self.gripper_open: bool = True
        self._cube_start: list[float] = _compute_cube_start()
        self.cube_pos: list[float] = list(self._cube_start)

        # Pick-and-place sequence state
        self._pp_step: int = 0
        self._pp_hold: int = 0

        # End-effector tracking for speed calc
        self._prev_ee_pos: tuple[float, float, float] = (0.0, 0.0, 0.0)
        self.ee_speed_mps: float = 0.0

        # Timing bookkeeping
        self._tick: int = 0
        self._last_time: float = time.monotonic()
        self._latency_ms: float = 0.0

    # ---- public commands ----

    def play(self) -> None:
        """Start (or restart) the pick-and-place demo."""
        self.status = RobotStatus.RUNNING
        self.gripper_open = True
        self.cube_pos = list(self._cube_start)
        self._pp_step = 0
        self._pp_hold = 0

    def pause(self) -> None:
        self.status = RobotStatus.PAUSED

    def reset(self) -> None:
        self.status = RobotStatus.READY
        self.joint_positions = [0.0] * NUM_JOINTS
        self.joint_targets = [0.0] * NUM_JOINTS
        self.gripper_open = True
        self.cube_pos = list(self._cube_start)
        self._pp_step = 0
        self._pp_hold = 0
        self._prev_ee_pos = (0.0, 0.0, 0.0)
        self.ee_speed_mps = 0.0
        self._tick = 0

    def set_params(self, params: dict[str, float]) -> None:
        for key, val in params.items():
            if key in self.params:
                self.params[key] = max(0.0, min(1.0, val))

    def set_joint_targets(self, targets: list[float]) -> None:
        if len(targets) == NUM_JOINTS:
            self.joint_targets = list(targets)

    def pick_place(self) -> None:
        """Alias — same as play."""
        self.play()

    # ---- internal step ----

    def _step_pick_place(self) -> None:
        """Advance the pick-and-place sequence one tick."""
        if self._pp_step >= len(_PICK_PLACE_SEQ):
            # Sequence complete — stop
            self.status = RobotStatus.READY
            return

        wp_joints, wp_gripper, wp_hold = _PICK_PLACE_SEQ[self._pp_step]

        # Set targets and gripper state
        self.joint_targets = list(wp_joints)
        self.gripper_open = wp_gripper

        # Check if joints are close enough to the waypoint
        err = sum(
            abs(self.joint_positions[i] - wp_joints[i])
            for i in range(NUM_JOINTS)
        )
        if err < 0.08:
            self._pp_hold += 1
            if self._pp_hold >= wp_hold:
                self._pp_step += 1
                self._pp_hold = 0

    def step(self) -> SimState:
        """Advance one simulation tick and return the current state."""
        now = time.monotonic()
        dt = now - self._last_time
        self._last_time = now

        if self.status == RobotStatus.RUNNING:
            self._step_pick_place()

            # Smooth joint positions toward targets
            for i in range(NUM_JOINTS):
                diff = self.joint_targets[i] - self.joint_positions[i]
                self.joint_positions[i] += _ALPHA * diff
            self._tick += 1

        # Forward kinematics
        ee_pos, ee_quat = forward_kinematics(self.joint_positions)

        # If gripper is closed, cube follows end-effector
        if not self.gripper_open:
            self.cube_pos = [ee_pos[0], max(ee_pos[1], 0.025), ee_pos[2]]

        # End-effector speed
        if dt > 0:
            dx = ee_pos[0] - self._prev_ee_pos[0]
            dy = ee_pos[1] - self._prev_ee_pos[1]
            dz = ee_pos[2] - self._prev_ee_pos[2]
            dist = math.sqrt(dx * dx + dy * dy + dz * dz)
            self.ee_speed_mps = dist / dt
        self._prev_ee_pos = ee_pos

        # Latency / load estimates
        self._latency_ms = (time.monotonic() - now) * 1000
        budget = 1.0 / self.hz
        load_pct = min(100.0, (dt / budget) * 50)

        return SimState(
            joint_positions=list(self.joint_positions),
            joint_targets=list(self.joint_targets),
            ee_pos=ee_pos,
            ee_quat=ee_quat,
            ee_speed_mps=round(self.ee_speed_mps, 4),
            gripper_open=self.gripper_open,
            cube_pos=(self.cube_pos[0], self.cube_pos[1], self.cube_pos[2]),
            status=self.status,
            loop_hz=self.hz,
            latency_ms=round(self._latency_ms, 2),
            system_load_pct=round(load_pct, 1),
            timestamp=datetime.now(timezone.utc).isoformat(),
            params=dict(self.params),
        )


async def run_loop(sim: SimLoop, broadcast_fn) -> None:  # type: ignore[type-arg]
    """Async loop that calls sim.step() at the configured Hz."""
    interval = 1.0 / sim.hz
    while True:
        state = sim.step()
        await broadcast_fn(state)
        await asyncio.sleep(interval)
