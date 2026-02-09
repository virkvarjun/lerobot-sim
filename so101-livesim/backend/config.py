"""
Configuration constants for the SO-101 LiveSim backend.
"""

# Simulation settings
SIM_LOOP_HZ: int = 60
NUM_JOINTS: int = 6

# Joint limits (radians) — approximate SO-101 range
JOINT_LIMITS_RAD: list[tuple[float, float]] = [
    (-3.14, 3.14),   # J0 — base rotation
    (-1.57, 2.09),   # J1 — shoulder
    (-2.36, 0.39),   # J2 — elbow
    (-3.14, 3.14),   # J3 — wrist roll
    (-1.57, 1.57),   # J4 — wrist pitch
    (-3.14, 3.14),   # J5 — wrist yaw / gripper
]

# Approximate link lengths (metres) for forward-kinematics placeholder
LINK_LENGTHS_M: list[float] = [0.0, 0.077, 0.13, 0.124, 0.126, 0.0615]

# Motion smoothing factor (0 = no smoothing, 1 = never reach target)
SMOOTHING_ALPHA: float = 0.08

# Default slider parameter values (P1..P5)
DEFAULT_PARAMS: dict[str, float] = {
    "P1": 0.5,
    "P2": 0.5,
    "P3": 0.5,
    "P4": 0.5,
    "P5": 0.5,
}

# Server
HOST: str = "0.0.0.0"
PORT: int = 8000
