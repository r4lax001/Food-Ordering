import React, { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Vector2 } from "three";

function Spinner() {
  const group = useRef();
  const profile = useMemo(() => {
    const points = [];
    for (let i = 0; i <= 16; i++) {
      const t = (i / 16) * 1.47;
      points.push([0.95 * Math.sin(t), 0.91 * Math.cos(t)]);
    }
    points.push([0.97, 0.05], [0.99, 0.1], [0.93, 0.06]);
    return points.map((p) => new Vector2(...p));
  }, []);
  const dome = useMemo(
    () => <meshPhysicalMaterial color="#f6f8fc" roughness={0.18} metalness={0.05} clearcoat={1} clearcoatRoughness={0.15} />,
    []
  );
  useFrame((state, delta) => {
    if (!group.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    group.current.rotation.y += delta * 1.5;
    group.current.position.y = 0.55 + Math.sin(state.clock.elapsedTime * 2.2) * 0.05;
    state.invalidate();
  });
  return (
    <group ref={group}>
      <mesh>
        <latheGeometry args={[profile, 64]} />
        {dome}
      </mesh>
      <mesh position={[0, 0.97, 0]} scale={[1, 0.85, 1]}>
        <sphereGeometry args={[0.09, 20, 14]} />
        {dome}
      </mesh>
      <mesh position={[0, 0.03, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.86, 0.05, 10, 40]} />
        <meshStandardMaterial color="#F45B0B" roughness={0.4} />
      </mesh>
    </group>
  );
}

export default function ClocheScene() {
  return (
    <Canvas
      dpr={[1, 1.5]}
      frameloop="demand"
      gl={{ alpha: true, antialias: true, powerPreference: "low-power" }}
      camera={{ position: [0, 1.7, 3.1], fov: 35 }}
      onCreated={({ camera }) => camera.lookAt(0, 0.55, 0)}
    >
      <ambientLight intensity={0.95} />
      <hemisphereLight args={["#ffffff", "#cfc8bd", 0.9]} />
      <directionalLight position={[-2, 4, 3]} intensity={1.7} color="#fff3e2" />
      <Spinner />
    </Canvas>
  );
}
