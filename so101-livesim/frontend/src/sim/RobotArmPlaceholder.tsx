import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * SO-101 style 6-DOF robot arm placeholder.
 *
 * Built from box/cylinder geometries to match the chunky white
 * SO-101 appearance: white body panels, dark motor housings,
 * teal accent dots at joint pivots, and a two-finger gripper.
 *
 * Future: replace with a URDF-loaded mesh.
 */

interface Props {
  jointsRef: React.MutableRefObject<number[]>;
}

// Colours matching the SO-101 reference render
const WHITE = "#f0f0f0";
const DARK = "#2a2a2a";
const ACCENT = "#4b99b7";
const GRAY = "#d8d8d8";

// Scale factor — the robot is modelled in ~0.5m total height,
// scaled up so it looks good in the scene
const S = 2.8;

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
    j0.current.rotation.y = q[0];   // base yaw
    j1.current.rotation.z = q[1];   // shoulder pitch
    j2.current.rotation.z = q[2];   // elbow pitch
    j3.current.rotation.y = q[3];   // wrist roll
    j4.current.rotation.z = q[4];   // wrist pitch
    j5.current.rotation.y = q[5];   // gripper roll
  });

  return (
    <group position={[0, 0, 0]} scale={[S, S, S]}>
      {/* ======= BASE ======= */}
      {/* Bottom plate */}
      <Box args={[0.10, 0.015, 0.10]} y={0.0075} color={DARK} />
      {/* Base body */}
      <Box args={[0.08, 0.04, 0.08]} y={0.035} color={WHITE} />
      {/* Base top plate */}
      <Box args={[0.07, 0.008, 0.07]} y={0.059} color={DARK} />
      {/* Mounting holes (decorative) */}
      <Dot y={0.016} z={0.04} x={0.04} />
      <Dot y={0.016} z={-0.04} x={0.04} />
      <Dot y={0.016} z={0.04} x={-0.04} />
      <Dot y={0.016} z={-0.04} x={-0.04} />

      {/* ======= J0: BASE YAW ======= */}
      <group ref={j0} position={[0, 0.063, 0]}>
        {/* Turret motor housing */}
        <Cyl radius={0.032} height={0.03} y={0.015} color={DARK} />
        <AccentDot y={0.031} />

        {/* ======= J1: SHOULDER PITCH ======= */}
        <group ref={j1} position={[0, 0.03, 0]}>
          {/* Shoulder bracket (two side plates) */}
          <Box args={[0.06, 0.06, 0.015]} y={0.03} z={0.02} color={WHITE} />
          <Box args={[0.06, 0.06, 0.015]} y={0.03} z={-0.02} color={WHITE} />
          {/* Shoulder motor */}
          <Cyl radius={0.018} height={0.04} y={0.03} color={DARK} rotX={Math.PI / 2} />
          <AccentDot y={0.03} z={0.021} />

          {/* Upper arm link */}
          <Box args={[0.04, 0.13, 0.035]} y={0.095} color={WHITE} />
          {/* Detail strips */}
          <Box args={[0.042, 0.005, 0.037]} y={0.07} color={GRAY} />
          <Box args={[0.042, 0.005, 0.037]} y={0.12} color={GRAY} />

          {/* ======= J2: ELBOW PITCH ======= */}
          <group ref={j2} position={[0, 0.16, 0]}>
            {/* Elbow motor housing */}
            <Cyl radius={0.02} height={0.04} y={0} color={DARK} rotX={Math.PI / 2} />
            <AccentDot y={0} z={0.021} />

            {/* Forearm */}
            <Box args={[0.035, 0.12, 0.03]} y={0.07} color={WHITE} />
            <Box args={[0.037, 0.005, 0.032]} y={0.04} color={GRAY} />
            <Box args={[0.037, 0.005, 0.032]} y={0.10} color={GRAY} />

            {/* ======= J3: WRIST ROLL ======= */}
            <group ref={j3} position={[0, 0.13, 0]}>
              {/* Wrist roll motor */}
              <Cyl radius={0.016} height={0.03} y={0.015} color={DARK} />
              <AccentDot y={0.031} />

              {/* ======= J4: WRIST PITCH ======= */}
              <group ref={j4} position={[0, 0.03, 0]}>
                {/* Wrist pitch bracket */}
                <Box args={[0.035, 0.04, 0.012]} y={0.02} z={0.012} color={WHITE} />
                <Box args={[0.035, 0.04, 0.012]} y={0.02} z={-0.012} color={WHITE} />
                <Cyl radius={0.012} height={0.025} y={0.02} color={DARK} rotX={Math.PI / 2} />
                <AccentDot y={0.02} z={0.013} />

                {/* ======= J5: GRIPPER ROLL ======= */}
                <group ref={j5} position={[0, 0.04, 0]}>
                  {/* Gripper mount */}
                  <Box args={[0.03, 0.02, 0.025]} y={0.01} color={WHITE} />

                  {/* Gripper fingers */}
                  <Box args={[0.005, 0.05, 0.02]} y={0.045} x={0.012} color={WHITE} />
                  <Box args={[0.005, 0.05, 0.02]} y={0.045} x={-0.012} color={WHITE} />
                  {/* Finger tips (dark) */}
                  <Box args={[0.006, 0.015, 0.022]} y={0.0775} x={0.012} color={DARK} />
                  <Box args={[0.006, 0.015, 0.022]} y={0.0775} x={-0.012} color={DARK} />
                  {/* Inner grip pads */}
                  <Box args={[0.003, 0.03, 0.016]} y={0.05} x={0.008} color={ACCENT} />
                  <Box args={[0.003, 0.03, 0.016]} y={0.05} x={-0.008} color={ACCENT} />
                </group>
              </group>
            </group>
          </group>
        </group>
      </group>
    </group>
  );
}

/* ---- primitive helpers ---- */

const whiteMat = { color: WHITE, metalness: 0.05, roughness: 0.6 };
const darkMat = { color: DARK, metalness: 0.2, roughness: 0.5 };
const grayMat = { color: GRAY, metalness: 0.05, roughness: 0.7 };
const accentMat = { color: ACCENT, metalness: 0.1, roughness: 0.4 };

function Box({
  args,
  x = 0, y = 0, z = 0,
  color = WHITE,
}: {
  args: [number, number, number];
  x?: number; y?: number; z?: number;
  color?: string;
}) {
  const mat = color === DARK ? darkMat : color === GRAY ? grayMat : color === ACCENT ? accentMat : whiteMat;
  return (
    <mesh position={[x, y, z]}>
      <boxGeometry args={args} />
      <meshStandardMaterial {...mat} color={color} />
    </mesh>
  );
}

function Cyl({
  radius, height,
  x = 0, y = 0, z = 0,
  color = DARK,
  rotX = 0,
}: {
  radius: number; height: number;
  x?: number; y?: number; z?: number;
  color?: string;
  rotX?: number;
}) {
  return (
    <mesh position={[x, y, z]} rotation={[rotX, 0, 0]}>
      <cylinderGeometry args={[radius, radius, height, 24]} />
      <meshStandardMaterial color={color} metalness={0.2} roughness={0.5} />
    </mesh>
  );
}

/** Small decorative circle (screw hole / mounting point). */
function Dot({ x = 0, y = 0, z = 0 }: { x?: number; y?: number; z?: number }) {
  return (
    <mesh position={[x, y, z]}>
      <sphereGeometry args={[0.004, 8, 8]} />
      <meshStandardMaterial color={DARK} />
    </mesh>
  );
}

/** Teal accent dot at a joint pivot. */
function AccentDot({ x = 0, y = 0, z = 0 }: { x?: number; y?: number; z?: number }) {
  return (
    <mesh position={[x, y, z]}>
      <sphereGeometry args={[0.006, 12, 12]} />
      <meshStandardMaterial color={ACCENT} emissive={ACCENT} emissiveIntensity={0.25} />
    </mesh>
  );
}
