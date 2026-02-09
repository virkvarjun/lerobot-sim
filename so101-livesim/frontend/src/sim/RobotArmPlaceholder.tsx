import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * SO-101 style 6-DOF robot arm — skeletal bracket construction.
 *
 * Modeled after the real SO-101: parallel white bracket plates,
 * dark rectangular servo motors, visible mounting holes, red accent
 * wires, and a wide two-finger gripper.
 *
 * Future: replace with a URDF-loaded mesh.
 */

interface Props {
  jointsRef: React.MutableRefObject<number[]>;
  /** Updated each frame with the gripper tip's world position. */
  gripperPosRef?: React.MutableRefObject<THREE.Vector3>;
}

// Colours matching the real SO-101
const WHITE = "#f2f2f0";
const DARK = "#3a3a3a";
const SILVER = "#888888";
const WIRE = "#cc4444";
const ACCENT = "#4b99b7";

// Scale factor
const S = 2.8;

export default function RobotArmPlaceholder({ jointsRef, gripperPosRef }: Props) {
  const j0 = useRef<THREE.Group>(null!);
  const j1 = useRef<THREE.Group>(null!);
  const j2 = useRef<THREE.Group>(null!);
  const j3 = useRef<THREE.Group>(null!);
  const j4 = useRef<THREE.Group>(null!);
  const j5 = useRef<THREE.Group>(null!);
  const gripTipRef = useRef<THREE.Group>(null!);

  useFrame(() => {
    const q = jointsRef.current;
    if (!q || q.length < 6) return;
    j0.current.rotation.y = q[0];
    j1.current.rotation.z = q[1];
    j2.current.rotation.z = q[2];
    j3.current.rotation.y = q[3];
    j4.current.rotation.z = q[4];
    j5.current.rotation.y = q[5];

    // Export gripper tip world position
    if (gripperPosRef && gripTipRef.current) {
      gripTipRef.current.getWorldPosition(gripperPosRef.current);
    }
  });

  return (
    <group position={[0, 0, 0]} scale={[S, S, S]}>

      {/* ============ BASE PLATE ============ */}
      {/* Wide flat base with screw holes */}
      <Box w={0.12} h={0.008} d={0.10} y={0.004} c={WHITE} />
      <Box w={0.12} h={0.004} d={0.10} y={0.01} c="#e0e0de" />
      {/* Mounting holes at corners */}
      <Hole x={0.045} z={0.035} y={0.009} />
      <Hole x={-0.045} z={0.035} y={0.009} />
      <Hole x={0.045} z={-0.035} y={0.009} />
      <Hole x={-0.045} z={-0.035} y={0.009} />
      <Hole x={0} z={0.04} y={0.009} />
      <Hole x={0} z={-0.04} y={0.009} />

      {/* Base servo housing */}
      <Servo w={0.05} h={0.035} d={0.04} x={0} y={0.03} z={0} />

      {/* ============ J0: BASE YAW ============ */}
      <group ref={j0} position={[0, 0.05, 0]}>
        {/* Turntable ring */}
        <Cyl r={0.035} h={0.008} y={0.004} c={SILVER} />

        {/* ============ J1: SHOULDER ============ */}
        <group ref={j1} position={[0, 0.008, 0]}>
          {/* Shoulder bracket — two parallel plates with servo between */}
          <Bracket w={0.055} h={0.065} d={0.005} spacing={0.04} y={0.032} />
          {/* Shoulder servo (between brackets, rotated sideways) */}
          <Servo w={0.025} h={0.05} d={0.025} y={0.032} />
          {/* Servo horn accent */}
          <AccentDot y={0.032} z={0.021} />

          {/* Upper arm — parallel rails */}
          <Rail h={0.12} spacing={0.035} y={0.065} thickness={0.006} width={0.03} />
          {/* Wire detail along upper arm */}
          <Wire x1={0.012} y1={0.065} x2={0.015} y2={0.17} />

          {/* ============ J2: ELBOW ============ */}
          <group ref={j2} position={[0, 0.185, 0]}>
            {/* Elbow servo */}
            <Servo w={0.025} h={0.045} d={0.025} y={0} />
            <AccentDot y={0} z={0.021} />

            {/* Elbow bracket plates */}
            <Bracket w={0.045} h={0.04} d={0.005} spacing={0.035} y={0.005} />

            {/* Forearm — parallel rails */}
            <Rail h={0.10} spacing={0.03} y={0.055} thickness={0.005} width={0.025} />
            {/* Wire detail */}
            <Wire x1={-0.01} y1={0.02} x2={-0.012} y2={0.10} />

            {/* ============ J3: WRIST ROLL ============ */}
            <group ref={j3} position={[0, 0.11, 0]}>
              {/* Wrist roll servo */}
              <Servo w={0.022} h={0.035} d={0.022} y={0.017} />
              <AccentDot y={0.035} />

              {/* ============ J4: WRIST PITCH ============ */}
              <group ref={j4} position={[0, 0.035, 0]}>
                {/* Wrist pitch bracket */}
                <Bracket w={0.035} h={0.03} d={0.004} spacing={0.028} y={0.015} />
                <Servo w={0.018} h={0.03} d={0.018} y={0.015} />
                <AccentDot y={0.015} z={0.015} />

                {/* ============ J5: GRIPPER ============ */}
                <group ref={j5} position={[0, 0.03, 0]}>
                  {/* Gripper base plate */}
                  <Box w={0.05} h={0.006} d={0.03} y={0.003} c={WHITE} />

                  {/* Left finger */}
                  <group position={[0.018, 0.006, 0]}>
                    <Box w={0.005} h={0.04} d={0.025} y={0.02} c={WHITE} />
                    {/* Finger tip — angled/tapered */}
                    <Box w={0.005} h={0.025} d={0.02} y={0.053} c={WHITE} />
                    <Box w={0.006} h={0.008} d={0.022} y={0.069} c={DARK} />
                    {/* Grip pad */}
                    <Box w={0.003} h={0.03} d={0.018} y={0.04} x={-0.002} c={SILVER} />
                  </group>

                  {/* Right finger */}
                  <group position={[-0.018, 0.006, 0]}>
                    <Box w={0.005} h={0.04} d={0.025} y={0.02} c={WHITE} />
                    <Box w={0.005} h={0.025} d={0.02} y={0.053} c={WHITE} />
                    <Box w={0.006} h={0.008} d={0.022} y={0.069} c={DARK} />
                    <Box w={0.003} h={0.03} d={0.018} y={0.04} x={0.002} c={SILVER} />
                  </group>

                  {/* Gripper servo (tiny, at base) */}
                  <Servo w={0.015} h={0.02} d={0.015} y={0.01} z={-0.012} />

                  {/* Invisible gripper tip — used to track world position */}
                  <group ref={gripTipRef} position={[0, 0.045, 0]} />
                </group>
              </group>
            </group>
          </group>
        </group>
      </group>
    </group>
  );
}

/* ================================================================
   Primitive helpers
   ================================================================ */

/** Generic box with positioning. */
function Box({ w, h, d, x = 0, y = 0, z = 0, c = WHITE }: {
  w: number; h: number; d: number;
  x?: number; y?: number; z?: number; c?: string;
}) {
  return (
    <mesh position={[x, y, z]}>
      <boxGeometry args={[w, h, d]} />
      <meshStandardMaterial
        color={c}
        metalness={c === DARK || c === SILVER ? 0.25 : 0.05}
        roughness={c === DARK || c === SILVER ? 0.45 : 0.6}
      />
    </mesh>
  );
}

/** Cylinder primitive. */
function Cyl({ r, h, x = 0, y = 0, z = 0, c = SILVER }: {
  r: number; h: number;
  x?: number; y?: number; z?: number; c?: string;
}) {
  return (
    <mesh position={[x, y, z]}>
      <cylinderGeometry args={[r, r, h, 24]} />
      <meshStandardMaterial color={c} metalness={0.2} roughness={0.5} />
    </mesh>
  );
}

/** Dark rectangular servo motor housing. */
function Servo({ w, h, d, x = 0, y = 0, z = 0 }: {
  w: number; h: number; d: number;
  x?: number; y?: number; z?: number;
}) {
  return (
    <group position={[x, y, z]}>
      <mesh>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color={DARK} metalness={0.3} roughness={0.4} />
      </mesh>
      {/* Servo label strip */}
      <mesh position={[0, 0, d / 2 + 0.001]}>
        <boxGeometry args={[w * 0.6, h * 0.2, 0.001]} />
        <meshStandardMaterial color={SILVER} metalness={0.1} roughness={0.6} />
      </mesh>
    </group>
  );
}

/** Two parallel bracket plates (the skeletal structure). */
function Bracket({ w, h, d, spacing, y = 0 }: {
  w: number; h: number; d: number; spacing: number; y?: number;
}) {
  return (
    <group position={[0, y, 0]}>
      <Box w={w} h={h} d={d} z={spacing / 2} c={WHITE} />
      <Box w={w} h={h} d={d} z={-spacing / 2} c={WHITE} />
      {/* Mounting holes on each plate */}
      <Hole y={h * 0.3} z={spacing / 2 + d / 2 + 0.001} />
      <Hole y={-h * 0.3} z={spacing / 2 + d / 2 + 0.001} />
      <Hole y={h * 0.3} z={-(spacing / 2 + d / 2 + 0.001)} />
      <Hole y={-h * 0.3} z={-(spacing / 2 + d / 2 + 0.001)} />
    </group>
  );
}

/** Two parallel rail bars forming a link segment. */
function Rail({ h, spacing, y = 0, thickness = 0.005, width = 0.025 }: {
  h: number; spacing: number; y?: number; thickness?: number; width?: number;
}) {
  return (
    <group position={[0, y, 0]}>
      <Box w={width} h={h} d={thickness} z={spacing / 2} c={WHITE} />
      <Box w={width} h={h} d={thickness} z={-spacing / 2} c={WHITE} />
      {/* Cross brace at middle */}
      <Box w={width * 0.8} h={thickness} d={spacing} y={0} c={"#e5e5e3"} />
    </group>
  );
}

/** Small dark dot for screw holes. */
function Hole({ x = 0, y = 0, z = 0 }: { x?: number; y?: number; z?: number }) {
  return (
    <mesh position={[x, y, z]}>
      <cylinderGeometry args={[0.002, 0.002, 0.002, 8]} />
      <meshStandardMaterial color={DARK} />
    </mesh>
  );
}

/** Teal accent dot at a joint pivot. */
function AccentDot({ x = 0, y = 0, z = 0 }: { x?: number; y?: number; z?: number }) {
  return (
    <mesh position={[x, y, z]}>
      <sphereGeometry args={[0.005, 12, 12]} />
      <meshStandardMaterial color={ACCENT} emissive={ACCENT} emissiveIntensity={0.3} />
    </mesh>
  );
}

/** Simple wire/cable detail (a thin red cylinder between two points). */
function Wire({ x1, y1, x2, y2 }: { x1: number; y1: number; x2: number; y2: number }) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dx, dy);
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;

  return (
    <mesh position={[mx, my, 0.018]} rotation={[0, 0, -angle]}>
      <cylinderGeometry args={[0.0015, 0.0015, len, 6]} />
      <meshStandardMaterial color={WIRE} roughness={0.8} />
    </mesh>
  );
}
