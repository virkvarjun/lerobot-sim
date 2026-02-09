"""
Simplified forward-kinematics for a 6-DOF arm (SO-101 approximation).

Uses a DH-like chain of rotations/translations.  This is NOT the real
SO-101 URDF kinematic model — it's a lightweight placeholder that gives
plausible end-effector positions for visualisation.

To integrate the real model later, swap this module with one that loads
the URDF via `yourdfpy` or `pin` (Pinocchio) and computes FK properly.
"""

from __future__ import annotations

import math
from config import LINK_LENGTHS_M


def _rz(angle: float) -> list[list[float]]:
    """3×3 rotation matrix about Z."""
    c, s = math.cos(angle), math.sin(angle)
    return [[c, -s, 0], [s, c, 0], [0, 0, 1]]


def _ry(angle: float) -> list[list[float]]:
    """3×3 rotation matrix about Y."""
    c, s = math.cos(angle), math.sin(angle)
    return [[c, 0, s], [0, 1, 0], [-s, 0, c]]


def _mat_mul(a: list[list[float]], b: list[list[float]]) -> list[list[float]]:
    """Multiply two 3×3 matrices."""
    return [
        [sum(a[i][k] * b[k][j] for k in range(3)) for j in range(3)]
        for i in range(3)
    ]


def _mat_vec(m: list[list[float]], v: list[float]) -> list[float]:
    """Multiply 3×3 matrix by 3-vector."""
    return [sum(m[i][k] * v[k] for k in range(3)) for i in range(3)]


def _vec_add(a: list[float], b: list[float]) -> list[float]:
    return [a[i] + b[i] for i in range(3)]


def _rotation_to_quat(m: list[list[float]]) -> tuple[float, float, float, float]:
    """Convert 3×3 rotation matrix to quaternion (x, y, z, w)."""
    tr = m[0][0] + m[1][1] + m[2][2]
    if tr > 0:
        s = 0.5 / math.sqrt(tr + 1.0)
        w = 0.25 / s
        x = (m[2][1] - m[1][2]) * s
        y = (m[0][2] - m[2][0]) * s
        z = (m[1][0] - m[0][1]) * s
    elif m[0][0] > m[1][1] and m[0][0] > m[2][2]:
        s = 2.0 * math.sqrt(1.0 + m[0][0] - m[1][1] - m[2][2])
        w = (m[2][1] - m[1][2]) / s
        x = 0.25 * s
        y = (m[0][1] + m[1][0]) / s
        z = (m[0][2] + m[2][0]) / s
    elif m[1][1] > m[2][2]:
        s = 2.0 * math.sqrt(1.0 + m[1][1] - m[0][0] - m[2][2])
        w = (m[0][2] - m[2][0]) / s
        x = (m[0][1] + m[1][0]) / s
        y = 0.25 * s
        z = (m[1][2] + m[2][1]) / s
    else:
        s = 2.0 * math.sqrt(1.0 + m[2][2] - m[0][0] - m[1][1])
        w = (m[1][0] - m[0][1]) / s
        x = (m[0][2] + m[2][0]) / s
        y = (m[1][2] + m[2][1]) / s
        z = 0.25 * s
    return (x, y, z, w)


def forward_kinematics(
    joints: list[float],
    link_lengths: list[float] | None = None,
) -> tuple[tuple[float, float, float], tuple[float, float, float, float]]:
    """
    Compute approximate end-effector position and orientation.

    Parameters
    ----------
    joints : list[float]
        6 joint angles in radians.
    link_lengths : list[float] | None
        Per-link lengths; defaults to config values.

    Returns
    -------
    (ee_pos, ee_quat) where ee_pos is (x,y,z) in metres
    and ee_quat is (x,y,z,w).
    """
    L = link_lengths or LINK_LENGTHS_M
    # Identity
    rot: list[list[float]] = [[1, 0, 0], [0, 1, 0], [0, 0, 1]]
    pos: list[float] = [0.0, 0.0, L[0]]  # base height

    # Joint 0: rotate about Z (base yaw)
    rot = _mat_mul(rot, _rz(joints[0]))

    # Joint 1: rotate about Y (shoulder pitch), translate up by L[1]
    rot = _mat_mul(rot, _ry(joints[1]))
    pos = _vec_add(pos, _mat_vec(rot, [0, 0, L[1]]))

    # Joint 2: rotate about Y (elbow pitch), translate by L[2]
    rot = _mat_mul(rot, _ry(joints[2]))
    pos = _vec_add(pos, _mat_vec(rot, [0, 0, L[2]]))

    # Joint 3: rotate about Z (wrist roll), translate by L[3]
    rot = _mat_mul(rot, _rz(joints[3]))
    pos = _vec_add(pos, _mat_vec(rot, [0, 0, L[3]]))

    # Joint 4: rotate about Y (wrist pitch), translate by L[4]
    rot = _mat_mul(rot, _ry(joints[4]))
    pos = _vec_add(pos, _mat_vec(rot, [0, 0, L[4]]))

    # Joint 5: rotate about Z (wrist yaw / gripper), translate by L[5]
    rot = _mat_mul(rot, _rz(joints[5]))
    pos = _vec_add(pos, _mat_vec(rot, [0, 0, L[5]]))

    ee_pos = (pos[0], pos[1], pos[2])
    ee_quat = _rotation_to_quat(rot)
    return ee_pos, ee_quat
