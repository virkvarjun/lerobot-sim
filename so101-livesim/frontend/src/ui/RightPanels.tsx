import React, { useCallback } from "react";
import { AreaChart, Area, ResponsiveContainer } from "recharts";
import Panel from "./Panel";
import type { SimState } from "../ws";
import { sendCommand } from "../ws";

interface Props {
  state: SimState | null;
  speedHistory: { t: number; v: number }[];
}

/** Right column — 3 stacked HUD panels matching reference layout. */
export default function RightPanels({ state, speedHistory }: Props) {
  const speed = state?.ee_speed_mps ?? 0;
  const params = state?.params ?? { P1: 0.5, P2: 0.5, P3: 0.5, P4: 0.5, P5: 0.5 };

  const cmd = useCallback((type: string) => () => sendCommand({ type }), []);
  const onSlider = useCallback(
    (key: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
      sendCommand({ type: "set_params", params: { [key]: parseFloat(e.target.value) } });
    },
    [],
  );

  return (
    <>
      {/* ---- Panel 1: EE SPEED + chart ---- */}
      <Panel title="Control">
        <div className="ee-speed-label">EE Speed</div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 10 }}>
          <div className="ee-speed-value">
            {speed.toFixed(1)}<small>m/s</small>
          </div>
          <div className="sparkline-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={speedHistory} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4b99b7" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#4b99b7" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="v" stroke="#4b99b7" strokeWidth={1.5}
                      fill="url(#sg)" isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Panel>

      {/* ---- Panel 2: EE SPEED + action buttons ---- */}
      <Panel title="Control">
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ flex: "0 0 auto" }}>
            <div className="ee-speed-label">EE Speed</div>
            <div className="ee-speed-value ee-speed-value-sm">
              {speed.toFixed(1)}<small>m/s</small>
            </div>
          </div>
          <div className="btn-row" style={{ flex: 1, justifyContent: "flex-end" }}>
            <button className="btn" onClick={cmd("pause")}>Pause</button>
            <button className="btn" onClick={() => {}}>Record</button>
            <button className="btn" onClick={() => {}}>Replay</button>
          </div>
        </div>
        <div className="btn-row">
          <button className="btn" onClick={cmd("reset")}>Reset</button>
          <button className="btn" onClick={() => {}}>Replay</button>
        </div>
      </Panel>

      {/* ---- Panel 3: Controls & Metrics (buttons + sliders) ---- */}
      <Panel title="Control &amp; Metrics">
        <div className="btn-row">
          <button className="btn" onClick={cmd("play")}>Play</button>
          <button className="btn" onClick={cmd("pause")}>Pause</button>
          <button className="btn" onClick={cmd("reset")}>Reset</button>
          <button className="btn" onClick={() => {}}>Record</button>
          <button className="btn" onClick={() => {}}>Replay</button>
        </div>
        {(["P1", "P2", "P3", "P4", "P5"] as const).map((k) => (
          <div className="slider-row" key={k}>
            <span className="slider-label">{k}</span>
            <input type="range" min={0} max={1} step={0.01}
                   value={params[k] ?? 0.5} onChange={onSlider(k)} />
          </div>
        ))}
      </Panel>
    </>
  );
}
