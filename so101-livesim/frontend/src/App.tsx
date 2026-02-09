import React, { useState, useEffect, useRef } from "react";
import TopBar from "./ui/TopBar";
import RightPanels from "./ui/RightPanels";
import BottomToolbar from "./ui/BottomToolbar";
import Scene3D from "./sim/Scene3D";
import { subscribe, type SimState } from "./ws";

const SPEED_HISTORY_MAX = 80;

export default function App() {
  const [state, setState] = useState<SimState | null>(null);
  const [speedHistory, setSpeedHistory] = useState<{ t: number; v: number }[]>([]);
  const tickRef = useRef(0);

  useEffect(() => {
    const unsub = subscribe((s) => {
      setState(s);
      tickRef.current += 1;
      if (tickRef.current % 3 === 0) {
        setSpeedHistory((prev) => {
          const next = [...prev, { t: tickRef.current, v: s.ee_speed_mps }];
          if (next.length > SPEED_HISTORY_MAX) next.shift();
          return next;
        });
      }
    });
    return unsub;
  }, []);

  const joints = state?.joint_positions ?? [0, 0, 0, 0, 0, 0];
  const cubePos = state?.cube_pos ?? [0.15, 0.05, 0.1] as [number, number, number];
  const gripperOpen = state?.gripper_open ?? true;

  return (
    <div className="app-layout">
      <TopBar state={state} />

      <div className="main-area">
        {/* Left: 3D scene — ~76% using flex */}
        <div className="scene-column">
          <div className="hud-panel scene-panel">
            <div className="hud-panel-inner">
              <div className="hud-body">
                <div className="scene-label">3D Simulator Area</div>
                <Scene3D jointPositions={joints} cubePos={cubePos as [number, number, number]} gripperOpen={gripperOpen} />
              </div>
            </div>
          </div>
        </div>

        {/* Right: 3 stacked control panels */}
        <div className="right-column">
          <RightPanels state={state} speedHistory={speedHistory} />
        </div>
      </div>

      <BottomToolbar />
    </div>
  );
}
