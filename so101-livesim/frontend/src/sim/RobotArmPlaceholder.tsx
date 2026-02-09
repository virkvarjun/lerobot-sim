import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * Placeholder 6-DOF robot arm — light/white appearance to match
 * the reference image (white robot on dark 3D background).
 *
 * Future: replace with a URDF-loaded mesh.
 */

interface Props {
  jointsRef: React.MutableRefObject<number[]>;
}

const LINK_LENGTHS = [0.0, 0.077, 0.13, 0.124, 0.126, 0.0615];
const LINK_COLOR = "#e8e8e8";
const JOINT_COLOR = "#d0d0d0";
const EE_COLOR = "#4b99b7";
const BASE_COLOR = "#c0c0c0";

const SCALE = 3.0;

export default function RobotArmPlaceholder({ jointsRef }: Props) {
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
        <meshStandardMaterial color={BASE_COLOR} metalness={0.2} roughness={0.6} />
      </mesh>

      {/* J0 — base yaw */}
      <group ref={j0} position={[0, 0.04 * S, 0]}>
        <Joint radius={0.028 * S} />

        {/* J1 — shoulder pitch */}
        <group ref={j1}>
          <Link length={L[1]} />
          <Joint radius={0.024 * S} y={L[1]} />

          {/* J2 — elbow pitch */}
          <group ref={j2} position={[0, L[1], 0]}>
            <Link length={L[2]} />
            <Joint radius={0.022 * S} y={L[2]} />

            {/* J3 — wrist roll */}
            <group ref={j3} position={[0, L[2], 0]}>
              <Link length={L[3]} />
              <Joint radius={0.02 * S} y={L[3]} />

              {/* J4 — wrist pitch */}
              <group ref={j4} position={[0, L[3], 0]}>
                <Link length={L[4]} />
                <Joint radius={0.018 * S} y={L[4]} />

                {/* J5 — wrist yaw / gripper */}
                <group ref={j5} position={[0, L[4], 0]}>
                  <Link length={L[5]} radius={0.009 * S} />
                  {/* End-effector tip */}
                  <mesh position={[0, L[5], 0]}>
                    <sphereGeometry args={[0.016 * S, 16, 16]} />
                    <meshStandardMaterial color={EE_COLOR} emissive={EE_COLOR} emissiveIntensity={0.15} />
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

function Link({
  length,
  color = LINK_COLOR,
  radius = 0.014 * SCALE,
}: {
  length: number;
  color?: string;
  radius?: number;
}) {
  return (
    <mesh position={[0, length / 2, 0]}>
      <cylinderGeometry args={[radius, radius, length, 20]} />
      <meshStandardMaterial color={color} metalness={0.15} roughness={0.55} />
    </mesh>
  );
}

function Joint({ radius, y = 0 }: { radius: number; y?: number }) {
  return (
    <mesh position={[0, y, 0]}>
      <sphereGeometry args={[radius, 20, 20]} />
      <meshStandardMaterial color={JOINT_COLOR} metalness={0.1} roughness={0.5} />
    </mesh>
  );
}
