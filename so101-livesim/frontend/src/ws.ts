/**
 * WebSocket connection manager for the SO-101 LiveSim backend.
 *
 * Provides a singleton connection with auto-reconnect and
 * typed message dispatch.
 */

export interface SimState {
  joint_positions: number[];
  joint_targets: number[];
  ee_pos: [number, number, number];
  ee_quat: [number, number, number, number];
  ee_speed_mps: number;
  gripper_open: boolean;
  cube_pos: [number, number, number];
  status: "READY" | "RUNNING" | "PAUSED" | "ERROR";
  mode: "SIM";
  loop_hz: number;
  latency_ms: number;
  system_load_pct: number;
  timestamp: string;
  params: Record<string, number>;
}

type StateCallback = (state: SimState) => void;

const WS_URL = "ws://localhost:8000/ws";
const RECONNECT_MS = 2000;

let socket: WebSocket | null = null;
let listeners: StateCallback[] = [];
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

function connect() {
  if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
    return;
  }

  socket = new WebSocket(WS_URL);

  socket.onopen = () => {
    console.log("[ws] connected");
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
  };

  socket.onmessage = (event) => {
    try {
      const state: SimState = JSON.parse(event.data);
      // Ignore error responses from the server
      if ((state as any).error) return;
      for (const cb of listeners) cb(state);
    } catch {
      // ignore malformed messages
    }
  };

  socket.onclose = () => {
    console.log("[ws] disconnected, reconnecting...");
    scheduleReconnect();
  };

  socket.onerror = () => {
    socket?.close();
  };
}

function scheduleReconnect() {
  if (reconnectTimer) return;
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    connect();
  }, RECONNECT_MS);
}

/** Subscribe to SimState updates. Returns an unsubscribe function. */
export function subscribe(cb: StateCallback): () => void {
  listeners.push(cb);
  connect(); // ensure connection on first subscribe
  return () => {
    listeners = listeners.filter((l) => l !== cb);
  };
}

/** Send a JSON command to the backend. */
export function sendCommand(cmd: Record<string, unknown>) {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(cmd));
  }
}
