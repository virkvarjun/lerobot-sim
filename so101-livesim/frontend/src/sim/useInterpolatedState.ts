import { useRef, useCallback } from "react";
import { useFrame } from "@react-three/fiber";

/**
 * Smoothly interpolates an array of joint positions between WebSocket
 * updates so the robot animation stays fluid even if frames arrive at
 * irregular intervals.
 *
 * Returns a ref whose `.current` is always the most recent interpolated
 * joint array.  Call `push(newPositions)` whenever a new WS frame arrives.
 */
export function useInterpolatedJoints(numJoints: number, lerpFactor = 0.15) {
  const target = useRef<number[]>(new Array(numJoints).fill(0));
  const current = useRef<number[]>(new Array(numJoints).fill(0));

  const push = useCallback(
    (positions: number[]) => {
      target.current = positions;
    },
    []
  );

  // Runs every requestAnimationFrame inside the R3F loop
  useFrame(() => {
    for (let i = 0; i < numJoints; i++) {
      current.current[i] += (target.current[i] - current.current[i]) * lerpFactor;
    }
  });

  return { joints: current, push };
}
