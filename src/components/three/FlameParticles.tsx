"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const PER_COLOR = 20;

function ConfettiGroup({ color, seed }: { color: string; seed: number }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const particles = useMemo(() => {
    return Array.from({ length: PER_COLOR }, (_, i) => ({
      x: (Math.random() - 0.5) * 8,
      y: Math.random() * 6 - 2,
      z: (Math.random() - 0.5) * 5,
      speed: 0.15 + Math.random() * 0.35,
      rotSpeed: (Math.random() - 0.5) * 2,
      scale: 0.03 + Math.random() * 0.05,
      offset: seed * 100 + i * 1.7,
    }));
  }, [seed]);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.getElapsedTime();

    particles.forEach((p, i) => {
      const y = ((p.y + t * p.speed) % 8) - 2;
      dummy.position.set(
        p.x + Math.sin(t * 0.4 + p.offset) * 0.4,
        y,
        p.z + Math.cos(t * 0.3 + p.offset) * 0.3
      );
      dummy.rotation.set(
        t * p.rotSpeed + p.offset,
        t * p.rotSpeed * 0.7,
        t * p.rotSpeed * 0.5
      );
      const s = p.scale;
      dummy.scale.set(s * 1.5, s * 0.4, s * 1.2); // Flattened confetti shape
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, PER_COLOR]}>
      <icosahedronGeometry args={[1, 0]} />
      <meshStandardMaterial color={color} transparent opacity={0.8} roughness={0.6} />
    </instancedMesh>
  );
}

export default function FlameParticles() {
  return (
    <>
      <ConfettiGroup color="#D42B2B" seed={0} />
      <ConfettiGroup color="#F5B731" seed={1} />
      <ConfettiGroup color="#FFFFFF" seed={2} />
    </>
  );
}
