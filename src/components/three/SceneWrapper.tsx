"use client";

import { Suspense, useEffect, useState, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import FlameParticles from "./FlameParticles";
import * as THREE from "three";

function ToyBlocks() {
  const redRef = useRef<THREE.Mesh>(null);
  const goldRef = useRef<THREE.Mesh>(null);
  const whiteRef = useRef<THREE.Mesh>(null);
  const redSphereRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (redRef.current) {
      redRef.current.rotation.x = t * 0.3;
      redRef.current.rotation.y = t * 0.5;
      redRef.current.position.y = Math.sin(t * 0.7) * 0.4 + 1.5;
    }
    if (goldRef.current) {
      goldRef.current.rotation.x = t * 0.4;
      goldRef.current.rotation.z = t * 0.3;
      goldRef.current.position.y = Math.sin(t * 0.6 + 1) * 0.4 - 1;
    }
    if (whiteRef.current) {
      whiteRef.current.rotation.y = t * 0.35;
      whiteRef.current.rotation.z = t * 0.2;
      whiteRef.current.position.y = Math.sin(t * 0.5 + 2) * 0.3 + 0.5;
    }
    if (redSphereRef.current) {
      redSphereRef.current.position.y = Math.sin(t * 0.8 + 3) * 0.35 - 0.5;
      redSphereRef.current.rotation.x = t * 0.2;
    }
  });

  return (
    <>
      <mesh ref={redRef} position={[-3.5, 1.5, -2]}>
        <boxGeometry args={[0.6, 0.6, 0.6]} />
        <meshStandardMaterial color="#D42B2B" roughness={0.25} />
      </mesh>
      <mesh ref={goldRef} position={[3.5, -1, -1.5]}>
        <boxGeometry args={[0.5, 0.5, 0.5]} />
        <meshStandardMaterial color="#F5B731" roughness={0.25} />
      </mesh>
      <mesh ref={whiteRef} position={[-2, 0.5, -1]}>
        <boxGeometry args={[0.4, 0.4, 0.4]} />
        <meshStandardMaterial color="#FFFFFF" roughness={0.3} />
      </mesh>
      <mesh ref={redSphereRef} position={[2.5, -0.5, -1.8]}>
        <dodecahedronGeometry args={[0.35, 0]} />
        <meshStandardMaterial color="#E83535" roughness={0.3} />
      </mesh>
    </>
  );
}

function Scene() {
  return (
    <>
      <ambientLight intensity={0.7} />
      <directionalLight position={[5, 5, 5]} intensity={1.2} color="#FFF8E7" />
      <pointLight position={[-3, 2, -2]} intensity={0.6} color="#F5B731" />
      <pointLight position={[3, 1, 2]} intensity={0.5} color="#E83535" />
      <FlameParticles />
      <ToyBlocks />
    </>
  );
}

export default function SceneWrapper() {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  if (reducedMotion) {
    return null;
  }

  return (
    <Suspense fallback={null}>
      <Canvas
        camera={{ position: [0, 1, 5], fov: 50 }}
        style={{ width: "100%", height: "100%" }}
        gl={{ antialias: true, alpha: true }}
      >
        <Scene />
      </Canvas>
    </Suspense>
  );
}
