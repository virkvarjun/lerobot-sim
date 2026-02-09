import React, { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, GizmoHelper, GizmoViewport, Line } from "@react-three/drei";
import * as THREE from "three";
import GridFloor from "./GridFloor";
import RobotArmPlaceholder from "./RobotArmPlaceholder";
import { useInterpolatedJoints } from "./useInterpolatedState";

interface Scene3DProps {
  jointPositions: number[];
  cubePos: [number, number, number];
  gripperOpen: boolean;
}

export default function Scene3D({ jointPositions, cubePos, gripperOpen }: Scene3DProps) {
  return (
    <div className="scene-canvas-wrap">
      <Canvas
        camera={{ position: [1.5, 1.8, 2.2], fov: 45, near: 0.01, far: 100 }}
        gl={{ antialias: true }}
      >
        <SceneContent jointPositions={jointPositions} cubePos={cubePos} gripperOpen={gripperOpen} />
      </Canvas>
    </div>
  );
}

function SceneContent({ jointPositions, cubePos, gripperOpen }: {
  jointPositions: number[];
  cubePos: [number, number, number];
  gripperOpen: boolean;
}) {
  const { joints, push } = useInterpolatedJoints(6, 0.18);

  React.useEffect(() => {
    push(jointPositions);
  }, [jointPositions, push]);

  return (
    <>
      {/* Background */}
      <color attach="background" args={["#1a1d23"]} />

      {/* Lighting */}
      <ambientLight intensity={0.55} />
      <directionalLight position={[5, 8, 5]} intensity={0.9} />
      <directionalLight position={[-3, 6, -2]} intensity={0.35} />
      <pointLight position={[0, 3, 0]} intensity={0.15} color="#4b99b7" />

      {/* Floor grid */}
      <GridFloor />

      {/* Bounding box wireframe */}
      <group position={[0, 0.85, 0]}>
        <lineSegments>
          <edgesGeometry args={[new THREE.BoxGeometry(1.4, 1.7, 1.4)]} />
          <lineBasicMaterial color="#3a5f6f" transparent opacity={0.2} />
        </lineSegments>
      </group>

      {/* Subtle axis lines on floor */}
      <Line points={[[-1, 0.001, 0], [1, 0.001, 0]]} color="#5a3030" lineWidth={1} transparent opacity={0.35} />
      <Line points={[[0, 0.001, -1], [0, 0.001, 1]]} color="#305a30" lineWidth={1} transparent opacity={0.35} />

      {/* Cube */}
      <PickupCube position={cubePos} gripped={!gripperOpen} />

      {/* Robot arm */}
      <RobotArmPlaceholder jointsRef={joints} />

      {/* Controls */}
      <OrbitControls enableDamping dampingFactor={0.12} minDistance={0.5} maxDistance={8} target={[0, 0.6, 0]} />

      {/* Axis gizmo */}
      <GizmoHelper alignment="bottom-right" margin={[60, 60]}>
        <GizmoViewport axisColors={["#ff4444", "#44ff44", "#4488ff"]} labelColor="white" />
      </GizmoHelper>
    </>
  );
}

/** Animated pickup cube that smoothly follows its server-side position. */
function PickupCube({ position, gripped }: { position: [number, number, number]; gripped: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const target = useRef(new THREE.Vector3(...position));

  React.useEffect(() => {
    // Scale cube pos from robot-frame (metres) to scene units (×2.8 scale)
    target.current.set(position[0] * 2.8, Math.max(position[1] * 2.8, 0.04), position[2] * 2.8);
  }, [position]);

  useFrame(() => {
    if (!meshRef.current) return;
    meshRef.current.position.lerp(target.current, 0.15);
  });

  return (
    <mesh ref={meshRef} position={[position[0] * 2.8, Math.max(position[1] * 2.8, 0.04), position[2] * 2.8]}>
      <boxGeometry args={[0.08, 0.08, 0.08]} />
      <meshStandardMaterial
        color={gripped ? "#e8a030" : "#e07020"}
        metalness={0.1}
        roughness={0.5}
        emissive={gripped ? "#e8a030" : "#e07020"}
        emissiveIntensity={gripped ? 0.15 : 0.05}
      />
    </mesh>
  );
}
