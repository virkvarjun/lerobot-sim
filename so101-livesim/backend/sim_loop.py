"""
Core simulation loop.

Runs at ~60 Hz in a background asyncio task and produces SimState
snapshots that the WebSocket broadcaster pushes to all clients.
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
    SMOOTHING_ALPHA,
)
from messages import RobotStatus, SimState
from robot_kinematics import forward_kinematics


class SimLoop:
    """Manages the running simulation state and produces snapshots."""

    def __init__(self) -> None:
        self.hz: int = SIM_LOOP_HZ
        self.status: RobotStatus = RobotStatus.READY
        self.params: dict[str, float] = dict(DEFAULT_PARAMS)

        # Joint state (radians)
        self.joint_positions: list[float] = [0.0] * NUM_JOINTS
        self.joint_targets: list[float] = [0.0] * NUM_JOINTS

        # End-effector tracking for speed calc
        self._prev_ee_pos: tuple[float, float, float] = (0.0, 0.0, 0.0)
        self.ee_speed_mps: float = 0.0

        # Timing bookkeeping
        self._tick: int = 0
        self._last_time: float = time.monotonic()
        self._latency_ms: float = 0.0

    # ---- public commands ----

    def play(self) -> None:
        self.status = RobotStatus.RUNNING

    def pause(self) -> None:
        self.status = RobotStatus.PAUSED

    def reset(self) -> None:
        self.status = RobotStatus.READY
        self.joint_positions = [0.0] * NUM_JOINTS
        self.joint_targets = [0.0] * NUM_JOINTS
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

    # ---- internal step ----

    def _generate_targets(self) -> None:
        """
        When RUNNING with default behaviour, generate smooth sine-wave
        targets so the arm moves autonomously. The param sliders P1..P5
        modulate amplitude and frequency per-joint.
        """
        t = self._tick / self.hz  # seconds elapsed
        base_freqs = [0.3, 0.25, 0.35, 0.4, 0.2, 0.15]
        base_amps = [1.0, 0.8, 0.7, 1.2, 0.6, 0.9]

        # P1 scales overall amplitude, P2 scales frequency
        amp_scale = 0.2 + self.params["P1"] * 0.8
        freq_scale = 0.5 + self.params["P2"] * 1.5

        for i in range(NUM_JOINTS):
            self.joint_targets[i] = (
                base_amps[i] * amp_scale
                * math.sin(2 * math.pi * base_freqs[i] * freq_scale * t + i * 0.7)
            )

    def step(self) -> SimState:
        """Advance one simulation tick and return the current state."""
        now = time.monotonic()
        dt = now - self._last_time
        self._last_time = now

        if self.status == RobotStatus.RUNNING:
            self._generate_targets()
            # Smooth joint positions toward targets
            alpha = SMOOTHING_ALPHA
            for i in range(NUM_JOINTS):
                diff = self.joint_targets[i] - self.joint_positions[i]
                self.joint_positions[i] += alpha * diff
            self._tick += 1

        # Forward kinematics
        ee_pos, ee_quat = forward_kinematics(self.joint_positions)

        # End-effector speed (metres per second)
        if dt > 0:
            dx = ee_pos[0] - self._prev_ee_pos[0]
            dy = ee_pos[1] - self._prev_ee_pos[1]
            dz = ee_pos[2] - self._prev_ee_pos[2]
            dist = math.sqrt(dx * dx + dy * dy + dz * dz)
            self.ee_speed_mps = dist / dt
        self._prev_ee_pos = ee_pos

        # Rough latency estimate (time to compute this tick in ms)
        self._latency_ms = (time.monotonic() - now) * 1000

        # Rough CPU load estimate (ratio of compute time to budget)
        budget = 1.0 / self.hz
        load_pct = min(100.0, (dt / budget) * 50)  # rough heuristic

        return SimState(
            joint_positions=list(self.joint_positions),
            joint_targets=list(self.joint_targets),
            ee_pos=ee_pos,
            ee_quat=ee_quat,
            ee_speed_mps=round(self.ee_speed_mps, 4),
            status=self.status,
            loop_hz=self.hz,
            latency_ms=round(self._latency_ms, 2),
            system_load_pct=round(load_pct, 1),
            timestamp=datetime.now(timezone.utc).isoformat(),
            params=dict(self.params),
        )


async def run_loop(sim: SimLoop, broadcast_fn) -> None:  # type: ignore[type-arg]
    """
    Async loop that calls sim.step() at the configured Hz and broadcasts
    the resulting SimState via *broadcast_fn*.
    """
    interval = 1.0 / sim.hz
    while True:
        state = sim.step()
        await broadcast_fn(state)
        await asyncio.sleep(interval)
