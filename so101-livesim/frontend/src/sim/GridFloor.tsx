import React from "react";
import { Grid } from "@react-three/drei";

/** Ground-plane grid matching the reference dark scene with teal-ish lines. */
export default function GridFloor() {
  return (
    <Grid
      position={[0, 0, 0]}
      args={[10, 10]}
      cellSize={0.1}
      cellThickness={0.5}
      cellColor="#3a5f6f"
      sectionSize={0.5}
      sectionThickness={1}
      sectionColor="#4b99b7"
      fadeDistance={6}
      fadeStrength={1.5}
      infiniteGrid
    />
  );
}
