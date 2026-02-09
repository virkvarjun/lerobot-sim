import React, { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, GizmoHelper, GizmoViewport, Line } from "@react-three/drei";
import * as THREE from "three";
import GridFloor from "./GridFloor";
import RobotArmPlaceholder from "./RobotArmPlaceholder";
import { useInterpolatedJoints } from "./useInterpolatedState";

interface Scene3DProps {
  jointPositions: number[];
  gripperOpen: boolean;
}

export default function Scene3D({ jointPositions, gripperOpen }: Scene3DProps) {
  return (
    <div className="scene-canvas-wrap">
      <Canvas
        camera={{ position: [1.5, 1.8, 2.2], fov: 45, near: 0.01, far: 100 }}
        gl={{ antialias: true }}
      >
        <SceneContent jointPositions={jointPositions} gripperOpen={gripperOpen} />
      </Canvas>
    </div>
  );
}

function SceneContent({ jointPositions, gripperOpen }: {
  jointPositions: number[];
  gripperOpen: boolean;
}) {
  const { joints, push } = useInterpolatedJoints(6, 0.18);
  const gripperPosRef = useRef(new THREE.Vector3(0, 1.4, 0));

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

      {/* Cube — attaches to gripper only when gripper is close AND closed */}
      <PickupCube gripperClosed={!gripperOpen} gripperPosRef={gripperPosRef} />

      {/* Robot arm — exports gripper tip world position */}
      <RobotArmPlaceholder jointsRef={joints} gripperPosRef={gripperPosRef} />

      {/* Controls */}
      <OrbitControls enableDamping dampingFactor={0.12} minDistance={0.5} maxDistance={8} target={[0, 0.6, 0]} />

      {/* Axis gizmo */}
      <GizmoHelper alignment="bottom-right" margin={[60, 60]}>
        <GizmoViewport axisColors={["#ff4444", "#44ff44", "#4488ff"]} labelColor="white" />
      </GizmoHelper>
    </>
  );
}

/**
 * Pickup cube that sits on the floor.
 *
 * The cube only attaches to the gripper when two conditions are met:
 *   1. The gripper is closed (gripperClosed === true)
 *   2. The gripper tip is physically close to the cube (distance < threshold)
 *
 * This prevents the cube from teleporting into the gripper — the arm must
 * actually reach down to the cube first.
 */
function PickupCube({ gripperClosed, gripperPosRef }: {
  gripperClosed: boolean;
  gripperPosRef: React.MutableRefObject<THREE.Vector3>;
}) {
  // Cube starts on the floor, to the right of the arm — matching where
  // the gripper reaches at waypoint 1 ([0, -1.5, -0.4, 0, 0, 0]).
  // Computed: scene x ≈ 1.10, y ≈ 0.0.  Cube center at y=0.04 (half height).
  const CUBE_START = useMemo(() => new THREE.Vector3(1.1, 0.04, 0), []);
  const ATTACH_DIST = 0.2; // scene units — gripper must be within this to grab

  const meshRef = useRef<THREE.Mesh>(null!);
  const restPos = useRef(CUBE_START.clone());
  const attached = useRef(false);

  useFrame(() => {
    if (!meshRef.current) return;

    const cubePos = meshRef.current.position;
    const gripperPos = gripperPosRef.current;
    const dist = cubePos.distanceTo(gripperPos);

    if (gripperClosed && dist < ATTACH_DIST && !attached.current) {
      // Gripper closed near cube — latch on
      attached.current = true;
    }

    if (!gripperClosed && attached.current) {
      // Gripper opened — drop cube
      attached.current = false;
      restPos.current.copy(cubePos);
      restPos.current.y = Math.max(restPos.current.y, 0.04);
    }

    if (attached.current) {
      // Follow the gripper tip
      cubePos.lerp(gripperPos, 0.3);
    } else {
      // Settle toward rest position
      cubePos.lerp(restPos.current, 0.12);
    }
  });

  return (
    <mesh ref={meshRef} position={CUBE_START.toArray()}>
      <boxGeometry args={[0.08, 0.08, 0.08]} />
      <meshStandardMaterial
        color={attached.current ? "#e8a030" : "#e07020"}
        metalness={0.1}
        roughness={0.5}
        emissive={attached.current ? "#e8a030" : "#e07020"}
        emissiveIntensity={attached.current ? 0.15 : 0.05}
      />
    </mesh>
  );
}
