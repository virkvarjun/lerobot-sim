"""
FastAPI application — serves the WebSocket endpoint at /ws.

Run with:
    uvicorn app:app --host 0.0.0.0 --port 8000 --reload
"""

from __future__ import annotations

import asyncio
import json
import logging

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from messages import SimState, parse_command
from sim_loop import SimLoop, run_loop

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("so101-livesim")

app = FastAPI(title="SO-101 LiveSim Backend")

# Allow the Vite dev-server origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------- shared state ----------

sim = SimLoop()
clients: set[WebSocket] = set()


async def broadcast(state: SimState) -> None:
    """Send state JSON to every connected client."""
    if not clients:
        return
    data = state.model_dump_json()
    stale: list[WebSocket] = []
    for ws in clients:
        try:
            await ws.send_text(data)
        except Exception:
            stale.append(ws)
    for ws in stale:
        clients.discard(ws)


# ---------- lifecycle ----------

@app.on_event("startup")
async def startup() -> None:
    """Start the background simulation loop."""
    logger.info("Starting simulation loop at %d Hz", sim.hz)
    asyncio.create_task(run_loop(sim, broadcast))


# ---------- WebSocket ----------

@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket) -> None:
    await ws.accept()
    clients.add(ws)
    logger.info("Client connected (%d total)", len(clients))
    try:
        while True:
            raw = await ws.receive_text()
            try:
                data = json.loads(raw)
                cmd = parse_command(data)
                _handle_command(cmd)
            except Exception as exc:
                logger.warning("Bad command: %s", exc)
                await ws.send_text(json.dumps({"error": str(exc)}))
    except WebSocketDisconnect:
        pass
    finally:
        clients.discard(ws)
        logger.info("Client disconnected (%d remaining)", len(clients))


def _handle_command(cmd) -> None:  # type: ignore[type-arg]
    """Dispatch a validated UICommand to the sim."""
    match cmd.type:
        case "play":
            sim.play()
        case "pause":
            sim.pause()
        case "reset":
            sim.reset()
        case "set_params":
            sim.set_params(cmd.params)
        case "set_joint_targets":
            sim.set_joint_targets(cmd.targets)
        case "pick_place":
            sim.pick_place()


# ---------- health check ----------

@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok", "sim_status": sim.status.value}
