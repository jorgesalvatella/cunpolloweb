"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

function BlinkingEye({ position }: { position: [number, number, number] }) {
  const pupilRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!pupilRef.current) return;
    const t = clock.getElapsedTime();
    // Blink every ~3 seconds
    const blink = Math.abs(Math.sin(t * 1.1)) < 0.05 ? 0.01 : 1;
    pupilRef.current.scale.y = blink;
  });

  return (
    <group position={position}>
      {/* White of eye */}
      <mesh>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshStandardMaterial color="#FFFFFF" />
      </mesh>
      {/* Pupil */}
      <mesh ref={pupilRef} position={[0, 0, 0.08]}>
        <sphereGeometry args={[0.06, 12, 12]} />
        <meshStandardMaterial color="#1A1A1A" />
      </mesh>
    </group>
  );
}

export default function ChickenModel() {
  const groupRef = useRef<THREE.Group>(null);
  const leftWingRef = useRef<THREE.Mesh>(null);
  const rightWingRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();

    // Slow rotation
    groupRef.current.rotation.y = Math.sin(t * 0.3) * 0.3;

    // Bounce with squash & stretch
    const bounce = Math.abs(Math.sin(t * 1.5));
    groupRef.current.position.y = bounce * 0.2;
    const squash = 1 + bounce * 0.05;
    const stretch = 1 - bounce * 0.03;
    groupRef.current.scale.set(stretch, squash, stretch);

    // Wing flapping
    if (leftWingRef.current) {
      leftWingRef.current.rotation.z = 0.4 + Math.sin(t * 3) * 0.3;
    }
    if (rightWingRef.current) {
      rightWingRef.current.rotation.z = -0.4 - Math.sin(t * 3) * 0.3;
    }
  });

  return (
    <group ref={groupRef} position={[2, 0, 0]}>
      {/* Body */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.7, 32, 32]} />
        <meshStandardMaterial color="#F5B731" roughness={0.4} metalness={0.05} />
      </mesh>

      {/* Head */}
      <mesh position={[0, 0.85, 0.1]}>
        <sphereGeometry args={[0.4, 32, 32]} />
        <meshStandardMaterial color="#FACA5A" roughness={0.3} metalness={0.05} />
      </mesh>

      {/* Crest (3 red spheres) */}
      <mesh position={[0, 1.3, 0.05]}>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshStandardMaterial color="#D42B2B" />
      </mesh>
      <mesh position={[-0.1, 1.22, 0.05]}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshStandardMaterial color="#E83535" />
      </mesh>
      <mesh position={[0.1, 1.22, 0.05]}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshStandardMaterial color="#E83535" />
      </mesh>

      {/* Wattle (beard) */}
      <mesh position={[0, 0.6, 0.35]}>
        <sphereGeometry args={[0.07, 12, 12]} />
        <meshStandardMaterial color="#D42B2B" />
      </mesh>

      {/* Beak */}
      <mesh position={[0, 0.8, 0.42]} rotation={[0.3, 0, 0]}>
        <coneGeometry args={[0.08, 0.2, 8]} />
        <meshStandardMaterial color="#FF9800" />
      </mesh>

      {/* Eyes */}
      <BlinkingEye position={[-0.15, 0.92, 0.32]} />
      <BlinkingEye position={[0.15, 0.92, 0.32]} />

      {/* Left Wing */}
      <mesh ref={leftWingRef} position={[-0.65, 0.1, 0]}>
        <sphereGeometry args={[0.25, 16, 16]} />
        <meshStandardMaterial color="#E8A317" roughness={0.5} />
      </mesh>

      {/* Right Wing */}
      <mesh ref={rightWingRef} position={[0.65, 0.1, 0]}>
        <sphereGeometry args={[0.25, 16, 16]} />
        <meshStandardMaterial color="#E8A317" roughness={0.5} />
      </mesh>

      {/* Feet */}
      <mesh position={[-0.2, -0.7, 0.15]}>
        <boxGeometry args={[0.12, 0.06, 0.2]} />
        <meshStandardMaterial color="#FF9800" />
      </mesh>
      <mesh position={[0.2, -0.7, 0.15]}>
        <boxGeometry args={[0.12, 0.06, 0.2]} />
        <meshStandardMaterial color="#FF9800" />
      </mesh>
    </group>
  );
}
