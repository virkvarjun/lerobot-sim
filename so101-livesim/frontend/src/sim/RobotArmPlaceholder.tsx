import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * Placeholder 6-DOF robot arm built from simple geometries.
 *
 * Each "link" is a cylinder + sphere joint, chained together
 * with the same DH-like convention used by the backend FK:
 *   J0 → Z rotation (base yaw)
 *   J1 → Y rotation (shoulder pitch)
 *   J2 → Y rotation (elbow pitch)
 *   J3 → Z rotation (wrist roll)
 *   J4 → Y rotation (wrist pitch)
 *   J5 → Z rotation (wrist yaw / gripper)
 *
 * Future: replace this with a URDF-loaded mesh.
 */

interface Props {
  /** Ref to a mutable array that is updated by useInterpolatedJoints. */
  jointsRef: React.MutableRefObject<number[]>;
}

const LINK_LENGTHS = [0.0, 0.077, 0.13, 0.124, 0.126, 0.0615];
const LINK_COLOR = "#c8c8c8";
const JOINT_COLOR = "#4b99b7";
const EE_COLOR = "#ff6644";

// Scale everything up for visibility in the scene
const SCALE = 3.0;

export default function RobotArmPlaceholder({ jointsRef }: Props) {
  // Refs for each joint group so we can imperatively set rotations per-frame
  const j0 = useRef<THREE.Group>(null!);
  const j1 = useRef<THREE.Group>(null!);
  const j2 = useRef<THREE.Group>(null!);
  const j3 = useRef<THREE.Group>(null!);
  const j4 = useRef<THREE.Group>(null!);
  const j5 = useRef<THREE.Group>(null!);

  useFrame(() => {
    const q = jointsRef.current;
    if (!q || q.length < 6) return;
    j0.current.rotation.z = q[0];
    j1.current.rotation.y = q[1];
    j2.current.rotation.y = q[2];
    j3.current.rotation.z = q[3];
    j4.current.rotation.y = q[4];
    j5.current.rotation.z = q[5];
  });

  const S = SCALE;
  const L = LINK_LENGTHS.map((l) => l * S);

  return (
    <group position={[0, 0, 0]}>
      {/* Base pedestal */}
      <mesh position={[0, L[0] / 2, 0]}>
        <cylinderGeometry args={[0.06 * S, 0.08 * S, 0.04 * S, 32]} />
        <meshStandardMaterial color="#555" />
      </mesh>

      {/* J0 — base yaw (around Y in Three.js world = Z in robot frame) */}
      <group ref={j0} position={[0, 0.04 * S, 0]} rotation={[0, 0, 0]}>
        <Joint radius={0.025 * S} />

        {/* J1 — shoulder pitch */}
        <group ref={j1} position={[0, 0, 0]}>
          <Link length={L[1]} />
          <Joint radius={0.022 * S} y={L[1]} />

          {/* J2 — elbow pitch */}
          <group ref={j2} position={[0, L[1], 0]}>
            <Link length={L[2]} />
            <Joint radius={0.02 * S} y={L[2]} />

            {/* J3 — wrist roll */}
            <group ref={j3} position={[0, L[2], 0]}>
              <Link length={L[3]} />
              <Joint radius={0.018 * S} y={L[3]} />

              {/* J4 — wrist pitch */}
              <group ref={j4} position={[0, L[3], 0]}>
                <Link length={L[4]} />
                <Joint radius={0.016 * S} y={L[4]} />

                {/* J5 — wrist yaw / gripper */}
                <group ref={j5} position={[0, L[4], 0]}>
                  <Link length={L[5]} color={EE_COLOR} radius={0.008 * S} />
                  {/* End-effector tip */}
                  <mesh position={[0, L[5], 0]}>
                    <sphereGeometry args={[0.015 * S, 16, 16]} />
                    <meshStandardMaterial color={EE_COLOR} emissive={EE_COLOR} emissiveIntensity={0.3} />
                  </mesh>
                </group>
              </group>
            </group>
          </group>
        </group>
      </group>
    </group>
  );
}

/** A single cylindrical link segment. */
function Link({
  length,
  color = LINK_COLOR,
  radius = 0.012 * SCALE,
}: {
  length: number;
  color?: string;
  radius?: number;
}) {
  return (
    <mesh position={[0, length / 2, 0]}>
      <cylinderGeometry args={[radius, radius, length, 16]} />
      <meshStandardMaterial color={color} metalness={0.4} roughness={0.5} />
    </mesh>
  );
}

/** A spherical joint indicator. */
function Joint({ radius, y = 0 }: { radius: number; y?: number }) {
  return (
    <mesh position={[0, y, 0]}>
      <sphereGeometry args={[radius, 16, 16]} />
      <meshStandardMaterial color={JOINT_COLOR} metalness={0.3} roughness={0.4} />
    </mesh>
  );
}
