"""
Strict message schemas for WebSocket communication.

Outbound (server → client): SimState
Inbound  (client → server): UICommand
"""

from __future__ import annotations

from enum import Enum
from typing import Literal

from pydantic import BaseModel, Field


# ---------- enums ----------

class RobotStatus(str, Enum):
    READY = "READY"
    RUNNING = "RUNNING"
    PAUSED = "PAUSED"
    ERROR = "ERROR"


class RobotMode(str, Enum):
    SIM = "SIM"


# ---------- outbound ----------

class SimState(BaseModel):
    """Full state snapshot streamed to clients at ~60 Hz."""

    joint_positions: list[float] = Field(..., min_length=6, max_length=6)
    joint_targets: list[float] = Field(..., min_length=6, max_length=6)
    ee_pos: tuple[float, float, float]
    ee_quat: tuple[float, float, float, float]
    ee_speed_mps: float = 0.0
    gripper_open: bool = True
    cube_pos: tuple[float, float, float] = (0.2, 0.0, 0.0)
    status: RobotStatus = RobotStatus.READY
    mode: RobotMode = RobotMode.SIM
    loop_hz: int = 60
    latency_ms: float = 0.0
    system_load_pct: float = 0.0
    timestamp: str  # ISO-8601
    params: dict[str, float] = {}


# ---------- inbound ----------

class PlayCmd(BaseModel):
    type: Literal["play"] = "play"


class PauseCmd(BaseModel):
    type: Literal["pause"] = "pause"


class ResetCmd(BaseModel):
    type: Literal["reset"] = "reset"


class SetParamsCmd(BaseModel):
    type: Literal["set_params"] = "set_params"
    params: dict[str, float]


class SetJointTargetsCmd(BaseModel):
    type: Literal["set_joint_targets"] = "set_joint_targets"
    targets: list[float] = Field(..., min_length=6, max_length=6)


class PickPlaceCmd(BaseModel):
    type: Literal["pick_place"] = "pick_place"


# Discriminated union of all inbound commands
UICommand = PlayCmd | PauseCmd | ResetCmd | SetParamsCmd | SetJointTargetsCmd | PickPlaceCmd


def parse_command(raw: dict) -> UICommand:
    """Parse a raw dict into a typed UICommand, raising ValueError on failure."""
    cmd_type = raw.get("type")
    dispatch = {
        "play": PlayCmd,
        "pause": PauseCmd,
        "reset": ResetCmd,
        "set_params": SetParamsCmd,
        "set_joint_targets": SetJointTargetsCmd,
        "pick_place": PickPlaceCmd,
    }
    model = dispatch.get(cmd_type)  # type: ignore[arg-type]
    if model is None:
        raise ValueError(f"Unknown command type: {cmd_type}")
    return model.model_validate(raw)
