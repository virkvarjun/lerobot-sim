import React from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, GizmoHelper, GizmoViewport } from "@react-three/drei";
import GridFloor from "./GridFloor";
import RobotArmPlaceholder from "./RobotArmPlaceholder";
import { useInterpolatedJoints } from "./useInterpolatedState";

interface Scene3DProps {
  jointPositions: number[];
}

/**
 * Three.js scene: dark background, grid floor, orbit controls,
 * subtle axes gizmo, and the placeholder robot arm.
 */
export default function Scene3D({ jointPositions }: Scene3DProps) {
  return (
    <div className="scene-canvas-wrap">
      <Canvas
        camera={{ position: [1.5, 1.8, 2.2], fov: 45, near: 0.01, far: 100 }}
        gl={{ antialias: true }}
      >
        <SceneContent jointPositions={jointPositions} />
      </Canvas>
    </div>
  );
}

/** Inner component so hooks can run inside the Canvas context. */
function SceneContent({ jointPositions }: { jointPositions: number[] }) {
  const { joints, push } = useInterpolatedJoints(6, 0.18);

  // Push new positions whenever they change
  React.useEffect(() => {
    push(jointPositions);
  }, [jointPositions, push]);

  return (
    <>
      {/* Lighting */}
      <color attach="background" args={["#1a1d23"]} />
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 8, 5]} intensity={0.8} castShadow />
      <directionalLight position={[-3, 4, -2]} intensity={0.3} />
      <pointLight position={[0, 3, 0]} intensity={0.2} color="#4b99b7" />

      {/* Floor grid */}
      <GridFloor />

      {/* Bounding box wireframe like the reference */}
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(1.5, 2.0, 1.5)]} />
        <lineBasicMaterial color="#3a5f6f" transparent opacity={0.25} />
      </lineSegments>
      <group position={[0, 1.0, 0]}>
        <lineSegments>
          <edgesGeometry args={[new THREE.BoxGeometry(1.5, 2.0, 1.5)]} />
          <lineBasicMaterial color="#3a5f6f" transparent opacity={0.15} />
        </lineSegments>
      </group>

      {/* Robot arm */}
      <RobotArmPlaceholder jointsRef={joints} />

      {/* Controls */}
      <OrbitControls
        enableDamping
        dampingFactor={0.12}
        minDistance={0.5}
        maxDistance={8}
        target={[0, 0.6, 0]}
      />

      {/* Axis gizmo in corner */}
      <GizmoHelper alignment="bottom-right" margin={[60, 60]}>
        <GizmoViewport
          axisColors={["#ff4444", "#44ff44", "#4488ff"]}
          labelColor="white"
        />
      </GizmoHelper>
    </>
  );
}

// Need THREE for the box geometry in the bounding wireframe
import * as THREE from "three";
