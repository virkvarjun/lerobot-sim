import React from "react";
import type { SimState } from "../ws";

interface TopBarProps {
  state: SimState | null;
}

/** Light-themed top status bar with logo, pills, and settings button. */
export default function TopBar({ state }: TopBarProps) {
  const status = state?.status ?? "READY";
  const mode = state?.mode ?? "SIM";
  const hz = state?.loop_hz ?? 60;
  const latency = state?.latency_ms ?? 0;
  const ts = state?.timestamp
    ? new Date(state.timestamp).toLocaleString()
    : new Date().toLocaleString();

  return (
    <div className="topbar">
      <div className="topbar-logo">SO-101 LiveSim</div>

      <div className="topbar-pills">
        <span className="pill">
          MODE: <strong>{mode}</strong>
        </span>
        <span className="pill">
          STATUS: <strong>{status}</strong>
        </span>
        <span className="pill">
          LOOP RATE: <strong>{hz} Hz</strong>
        </span>
        <span className="pill">
          LATENCY: <strong>{latency.toFixed(1)} ms</strong>
        </span>
        <span className="pill">{ts}</span>
      </div>

      <div className="topbar-right">
        <button className="topbar-btn">
          <GearIcon />
          SETTINGS
        </button>
      </div>
    </div>
  );
}

function GearIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}
