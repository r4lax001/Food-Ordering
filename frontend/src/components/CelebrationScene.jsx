import React, { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { CanvasTexture, Vector2 } from "three";

const noise = (i) => {
  const n = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return n - Math.floor(n);
};

function starTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d");
  g.globalCompositeOperation = "lighter";
  const core = g.createRadialGradient(32, 32, 1, 32, 32, 13);
  core.addColorStop(0, "rgba(255,255,255,1)");
  core.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = core;
  g.fillRect(0, 0, 64, 64);
  const rayY = g.createLinearGradient(0, 2, 0, 62);
  rayY.addColorStop(0, "rgba(255,255,255,0)");
  rayY.addColorStop(0.5, "rgba(255,255,255,0.95)");
  rayY.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = rayY;
  g.fillRect(28, 2, 8, 60);
  const rayX = g.createLinearGradient(2, 0, 62, 0);
  rayX.addColorStop(0, "rgba(255,255,255,0)");
  rayX.addColorStop(0.5, "rgba(255,255,255,0.95)");
  rayX.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = rayX;
  g.fillRect(2, 28, 60, 8);
  return new CanvasTexture(c);
}

function Party() {
  const lid = useRef();
  const stars = useRef();
  const time = useRef(0);
  const texture = useMemo(starTexture, []);
  const profile = useMemo(() => {
    const points = [];
    for (let i = 0; i <= 16; i++) {
      const t = (i / 16) * 1.47;
      points.push([1.05 * Math.sin(t), 1.0 * Math.cos(t)]);
    }
    points.push([1.07, 0.05], [1.09, 0.11], [1.02, 0.07]);
    return points.map((p) => new Vector2(...p));
  }, []);
  const dome = useMemo(
    () => <meshPhysicalMaterial color="#f6f8fc" roughness={0.16} metalness={0.05} clearcoat={1} clearcoatRoughness={0.12} />,
    []
  );
  const sparks = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => {
        const angle = (i / 14) * Math.PI * 2 + noise(i) * 0.5;
        return {
          angle,
          reach: 1.3 + noise(i + 3) * 1.2,
          speed: 0.5 + noise(i + 5) * 0.35,
          phase: (i * 0.618034) % 1,
          size: 0.14 + noise(i + 7) * 0.12,
          color: i % 3 === 0 ? "#f4f7ff" : i % 3 === 1 ? "#ffd27a" : "#ff9a3d",
          rot: noise(i + 9) * Math.PI,
        };
      }),
    []
  );
  useFrame((state, delta) => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !lid.current) return;
    time.current += delta;
    // Lid lifts once and stays open, then the star burst loops slowly.
    const e = Math.min(1, time.current / 0.9);
    const eased = e * e * (3 - 2 * e);
    lid.current.position.y = 0.28 + 0.95 * eased;
    lid.current.rotation.z = -0.24 * eased;
    stars.current.children.forEach((sprite, i) => {
      const s = sparks[i];
      const k = (time.current * s.speed + s.phase) % 1;
      const reach = (0.5 + eased * 0.5) * s.reach * Math.sin(k * Math.PI) ** 0.5;
      sprite.position.set(Math.cos(s.angle) * reach, 0.75 + Math.sin(s.angle) * reach * 0.62 + k * 0.25, Math.sin(s.angle) * reach * 0.5);
      sprite.scale.setScalar(s.size * (0.5 + Math.sin(k * Math.PI)));
      sprite.material.opacity = Math.sin(k * Math.PI) * 0.95;
      sprite.material.rotation = s.rot + time.current * 0.6;
    });
    state.invalidate();
  });
  return (
    <group>
      <mesh position={[0, 0, 0]}>
        <latheGeometry
          args={[
            [
              [0, 0], [0.5, 0], [0.85, 0.02], [1.05, 0.08], [1.14, 0.16], [1.18, 0.26],
              [1.12, 0.29], [1.02, 0.2], [0.8, 0.1], [0, 0.08],
            ].map((p) => new Vector2(...p)),
            64,
          ]}
        />
        <meshPhysicalMaterial color="#516081" roughness={0.28} metalness={0.14} clearcoat={0.6} clearcoatRoughness={0.22} />
      </mesh>
      <mesh position={[-0.3, 0.14, 0]} scale={[0.5, 0.3, 0.5]}>
        <sphereGeometry args={[1, 24, 16]} />
        <meshStandardMaterial color="#f6efe0" roughness={0.6} />
      </mesh>
      <mesh position={[0.34, 0.14, 0.08]} scale={[0.34, 0.14, 0.3]}>
        <sphereGeometry args={[1, 24, 16]} />
        <meshStandardMaterial color="#4a5f22" roughness={0.55} />
      </mesh>
      <group ref={lid}>
        <mesh>
          <latheGeometry args={[profile, 64]} />
          {dome}
        </mesh>
        <mesh position={[0, 1.06, 0]} scale={[1, 0.85, 1]}>
          <sphereGeometry args={[0.1, 20, 14]} />
          {dome}
        </mesh>
      </group>
      <group ref={stars}>
        {sparks.map((s, i) => (
          <sprite key={i}>
            <spriteMaterial map={texture} color={s.color} transparent depthWrite={false} opacity={0} />
          </sprite>
        ))}
      </group>
    </group>
  );
}

export default function CelebrationScene() {
  return (
    <Canvas
      dpr={[1, 1.5]}
      frameloop="demand"
      gl={{ alpha: true, antialias: true, powerPreference: "low-power" }}
      camera={{ position: [0, 2.2, 4.4], fov: 38 }}
      onCreated={({ camera }) => camera.lookAt(0, 0.7, 0)}
    >
      <ambientLight intensity={0.95} />
      <hemisphereLight args={["#ffffff", "#cfc8bd", 0.85]} />
      <directionalLight position={[-2.5, 5, 3.5]} intensity={1.8} color="#fff3e2" />
      <directionalLight position={[3, 2, -2]} intensity={0.7} color="#dfe8ff" />
      <Party />
    </Canvas>
  );
}
