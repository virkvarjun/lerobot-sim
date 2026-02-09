import React, { useCallback } from "react";
import { AreaChart, Area, ResponsiveContainer } from "recharts";
import Panel from "./Panel";
import type { SimState } from "../ws";
import { sendCommand } from "../ws";

interface RightPanelsProps {
  state: SimState | null;
  speedHistory: { t: number; v: number }[];
}

/** Right column: EE speed display, control buttons, sliders. */
export default function RightPanels({ state, speedHistory }: RightPanelsProps) {
  const speed = state?.ee_speed_mps ?? 0;
  const params = state?.params ?? { P1: 0.5, P2: 0.5, P3: 0.5, P4: 0.5, P5: 0.5 };

  const cmd = useCallback((type: string) => () => sendCommand({ type }), []);

  const onSlider = useCallback(
    (key: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
      sendCommand({
        type: "set_params",
        params: { [key]: parseFloat(e.target.value) },
      });
    },
    []
  );

  return (
    <>
      {/* Panel 1 — EE Speed with sparkline */}
      <Panel title="Control">
        <div className="ee-speed-label">EE Speed</div>
        <div className="ee-speed-value">
          {speed.toFixed(1)} <small>m/s</small>
        </div>
        <div className="sparkline-wrap">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={speedHistory} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="speedGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4b99b7" stopOpacity={0.5} />
                  <stop offset="95%" stopColor="#4b99b7" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="v"
                stroke="#4b99b7"
                strokeWidth={2}
                fill="url(#speedGrad)"
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Panel>

      {/* Panel 2 — EE Speed + action buttons */}
      <Panel title="Control">
        <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
          <div>
            <div className="ee-speed-label">EE Speed</div>
            <div className="ee-speed-value" style={{ fontSize: 28 }}>
              {speed.toFixed(1)} <small>m/s</small>
            </div>
          </div>
        </div>
        <div className="btn-row">
          <button className="btn btn-sm" onClick={cmd("pause")}>Pause</button>
          <button className="btn btn-sm" onClick={() => {}}>Record</button>
          <button className="btn btn-sm" onClick={() => {}}>Replay</button>
          <button className="btn btn-sm" onClick={cmd("reset")}>Reset</button>
        </div>
      </Panel>

      {/* Panel 3 — Controls & Metrics (buttons + sliders) */}
      <Panel title="Control &amp; Metrics" className="" >
        <div className="btn-row">
          <button className="btn btn-sm" onClick={cmd("play")}>Play</button>
          <button className="btn btn-sm" onClick={cmd("pause")}>Pause</button>
          <button className="btn btn-sm" onClick={cmd("reset")}>Reset</button>
          <button className="btn btn-sm" onClick={() => {}}>Record</button>
          <button className="btn btn-sm" onClick={() => {}}>Replay</button>
        </div>
        {(["P1", "P2", "P3", "P4", "P5"] as const).map((key) => (
          <div className="slider-row" key={key}>
            <span className="slider-label">{key}</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={params[key] ?? 0.5}
              onChange={onSlider(key)}
            />
          </div>
        ))}
      </Panel>
    </>
  );
}
