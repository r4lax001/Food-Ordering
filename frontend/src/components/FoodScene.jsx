import React, { memo, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Color, Object3D, Vector2 } from "three";

const noise = (i) => {
  const n = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return n - Math.floor(n);
};

const domeMaterial = (
  <meshPhysicalMaterial color="#f6f8fc" roughness={0.16} metalness={0.05} clearcoat={1} clearcoatRoughness={0.1} />
);
const plateMaterial = (
  <meshPhysicalMaterial color="#516081" roughness={0.28} metalness={0.14} clearcoat={0.6} clearcoatRoughness={0.22} />
);
const steelMaterial = <meshStandardMaterial color="#6b7684" roughness={0.3} metalness={0.6} />;
const gripMaterial = <meshStandardMaterial color="#ef9432" roughness={0.45} />;

function Plate() {
  const profile = useMemo(
    () =>
      [
        [0, 0], [0.9, 0], [1.5, 0.02], [1.9, 0.08], [2.1, 0.18], [2.18, 0.3], [2.12, 0.33],
        [1.98, 0.24], [1.75, 0.15], [1.4, 0.1], [0.8, 0.08], [0, 0.08],
      ]
        .reverse()
        .map((p) => new Vector2(...p)),
    []
  );
  return (
    <mesh castShadow receiveShadow>
      <latheGeometry args={[profile, 96]} />
      {plateMaterial}
    </mesh>
  );
}

function Lid() {
  // Dense bell curve so the lathe rings stay smooth, plus a rolled lip.
  const profile = useMemo(() => {
    const outer = [];
    for (let i = 0; i <= 23; i++) {
      const t = (i / 23) * 1.47;
      outer.push([1.69 * Math.sin(t), 1.62 * Math.cos(t) - 0.02]);
    }
    const lip = [[1.7, 0.12], [1.72, 0.17], [1.66, 0.13]];
    const inner = [];
    for (let i = 14; i >= 4; i--) {
      const t = (i / 23) * 1.47;
      inner.push([1.69 * Math.sin(t) * 0.95, 1.62 * Math.cos(t) - 0.06]);
    }
    return [...outer, ...lip, ...inner].map((p) => new Vector2(...p));
  }, []);
  return (
    <group>
      <mesh castShadow receiveShadow>
        <latheGeometry args={[profile, 96]} />
        {domeMaterial}
      </mesh>
      <mesh castShadow position={[0, 1.71, 0]} scale={[1, 0.88, 1]}>
        <sphereGeometry args={[0.15, 32, 24]} />
        {domeMaterial}
      </mesh>
      <mesh position={[0, 1.61, 0]}>
        <cylinderGeometry args={[0.05, 0.065, 0.09, 24]} />
        {domeMaterial}
      </mesh>
    </group>
  );
}

function Fork() {
  const tineZ = [-0.13, -0.045, 0.045, 0.13];
  return (
    <group>
      {tineZ.map((z, i) => (
        <mesh key={i} castShadow position={[-1.0, 0, z]} rotation={[0, z * 1.1, Math.PI / 2]}>
          <capsuleGeometry args={[0.034, 0.32, 4, 10]} />
          {steelMaterial}
        </mesh>
      ))}
      <mesh castShadow position={[-0.72, 0, 0]} scale={[0.26, 0.05, 0.2]}>
        <sphereGeometry args={[1, 24, 16]} />
        {steelMaterial}
      </mesh>
      <mesh castShadow position={[-0.48, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <capsuleGeometry args={[0.05, 0.22, 4, 12]} />
        {steelMaterial}
      </mesh>
      <mesh castShadow position={[-0.02, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <capsuleGeometry args={[0.062, 0.9, 6, 14]} />
        {steelMaterial}
      </mesh>
      <mesh castShadow position={[0.6, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <capsuleGeometry args={[0.074, 0.44, 6, 14]} />
        {gripMaterial}
      </mesh>
    </group>
  );
}

function Spoon() {
  return (
    <group>
      <mesh castShadow position={[-0.05, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <capsuleGeometry args={[0.058, 0.82, 6, 14]} />
        {steelMaterial}
      </mesh>
      <mesh castShadow position={[-0.45, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <capsuleGeometry args={[0.07, 0.42, 6, 14]} />
        {gripMaterial}
      </mesh>
      <mesh castShadow position={[0.55, 0, 0]} scale={[0.4, 0.13, 0.3]}>
        <sphereGeometry args={[1, 32, 20]} />
        {steelMaterial}
      </mesh>
      <mesh position={[0.56, 0.065, 0]} scale={[0.27, 0.05, 0.2]}>
        <sphereGeometry args={[1, 24, 16]} />
        <meshStandardMaterial color="#4a5466" roughness={0.42} metalness={0.35} />
      </mesh>
    </group>
  );
}

function Grains() {
  const ref = useRef();
  useLayoutEffect(() => {
    const o = new Object3D();
    for (let i = 0, j = 0; j < 120; i++) {
      let x = noise(i) * 2 - 1;
      let y = noise(i + 40) * 2 - 1;
      let z = noise(i + 80) * 2 - 1;
      const l = Math.hypot(x, y, z) || 1;
      x /= l; y /= l; z /= l;
      if (y < 0.42) continue;
      o.position.set(-0.32 + x * 0.78, 0.52 + y * 0.4, -0.05 + z * 0.78);
      o.rotation.set(noise(i) * 3, noise(i + 7) * 3, noise(i + 3) * 3);
      o.scale.set(0.022 + noise(i + 1) * 0.008, 0.018, 0.042 + noise(i + 2) * 0.014);
      o.updateMatrix();
      ref.current.setMatrixAt(j, o.matrix);
      ref.current.setColorAt(j, new Color().setHSL(0.11, 0.18, 0.8 + noise(i + 5) * 0.14));
      j++;
    }
    ref.current.instanceMatrix.needsUpdate = true;
    ref.current.instanceColor.needsUpdate = true;
  }, []);
  return (
    <instancedMesh ref={ref} args={[null, null, 120]} castShadow>
      <sphereGeometry args={[1, 8, 6]} />
      <meshStandardMaterial roughness={0.5} />
    </instancedMesh>
  );
}

function StirFry() {
  const ref = useRef();
  useLayoutEffect(() => {
    const o = new Object3D();
    const greens = ["#4c6b26", "#5d7c33", "#3a5520", "#6d8a3d"];
    for (let i = 0; i < 54; i++) {
      const a = i * 2.39996;
      const r = Math.sqrt(noise(i + 5));
      o.position.set(0.62 + Math.cos(a) * r * 0.55, 0.18 + (1 - r) * 0.18 + noise(i) * 0.05, 0.18 + Math.sin(a) * r * 0.48);
      o.rotation.set(noise(i) * 6, a, noise(i + 3) * 6);
      o.scale.set(0.08 + noise(i + 4) * 0.06, 0.032 + noise(i + 7) * 0.026, 0.065 + noise(i + 9) * 0.05);
      o.updateMatrix();
      ref.current.setMatrixAt(i, o.matrix);
      ref.current.setColorAt(i, new Color(greens[i % 4]));
    }
    ref.current.instanceMatrix.needsUpdate = true;
    ref.current.instanceColor.needsUpdate = true;
  }, []);
  return (
    <group>
      <mesh castShadow receiveShadow position={[0.62, 0.1, 0.18]} scale={[0.6, 0.24, 0.52]}>
        <sphereGeometry args={[1, 24, 16]} />
        <meshStandardMaterial color="#4a5f22" roughness={0.55} />
      </mesh>
      <instancedMesh ref={ref} args={[null, null, 54]} castShadow>
        <icosahedronGeometry args={[1, 1]} />
        <meshStandardMaterial roughness={0.4} />
      </instancedMesh>
      {Array.from({ length: 7 }, (_, i) => (
        <mesh key={i} castShadow position={[0.62 + Math.cos(i * 2.4) * 0.4, 0.22 + noise(i + 2) * 0.14, 0.18 + Math.sin(i * 2.4) * 0.34]} rotation={[noise(i) * 3, i, noise(i + 4) * 3]}>
          <capsuleGeometry args={[0.024, 0.1, 4, 8]} />
          <meshStandardMaterial color={i % 2 ? "#c9401a" : "#b03412"} roughness={0.35} />
        </mesh>
      ))}
    </group>
  );
}

function Specks() {
  const ref = useRef();
  useLayoutEffect(() => {
    const o = new Object3D();
    const spots = [
      [1.15, 1.9, 0.55], [-1.35, 1.55, -0.35], [0.55, 2.25, -0.75], [-0.75, 2.1, 0.8],
      [1.65, 1.3, -0.2], [-1.9, 1.05, 0.45], [0.15, 2.45, 0.35], [-0.35, 1.75, -1.0], [1.0, 1.6, -0.95],
    ];
    spots.forEach((p, i) => {
      o.position.set(p[0], p[1], p[2]);
      o.rotation.set(noise(i) * 6, noise(i + 3) * 6, noise(i + 6) * 6);
      o.scale.setScalar(0.032 + noise(i + 1) * 0.03);
      o.updateMatrix();
      ref.current.setMatrixAt(i, o.matrix);
    });
    ref.current.instanceMatrix.needsUpdate = true;
  }, []);
  return (
    <instancedMesh ref={ref} args={[null, null, 9]}>
      <icosahedronGeometry args={[1, 0]} />
      <meshStandardMaterial color="#a7aeb8" roughness={0.6} />
    </instancedMesh>
  );
}

function Steam() {
  return (
    <group>
      {[[-0.15, 1.15, -0.1, 0.8], [0.3, 1.3, 0.12, 0.95], [0.02, 1.45, 0.28, 0.7]].map(([x, y, z, h], i) => (
        <mesh key={i} position={[x, y, z]} rotation={[0, 0, (i - 1) * 0.12]} scale={[0.5, 1, 0.5]}>
          <capsuleGeometry args={[0.07, h, 4, 10]} />
          <meshStandardMaterial color="#ffffff" transparent opacity={0.26} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}

const Meal = memo(function Meal({ progress, active, reduced }) {
  const lid = useRef();
  const fork = useRef();
  const spoon = useRef();
  const steam = useRef();
  const value = useRef(progress);
  const applied = useRef(-1);
  const { invalidate } = useThree();
  useEffect(() => { invalidate(); }, [progress, active, invalidate]);
  useFrame((_, delta) => {
    if (!active) return;
    if (reduced) {
      value.current = progress;
    } else {
      value.current += (progress - value.current) * (1 - Math.exp(-Math.min(delta, 0.05) * 6));
      if (Math.abs(value.current - progress) < 0.001) value.current = progress;
    }
    const v = value.current;
    const e = v * v * (3 - 2 * v);
    if (applied.current === v) return;
    applied.current = v;
    if (lid.current) {
      lid.current.position.y = 1.5 * e;
      lid.current.rotation.z = -0.3 * e;
      lid.current.position.x = 0.25 * e;
    }
    if (fork.current) fork.current.position.x = -1.38 - 0.18 * e;
    if (spoon.current) spoon.current.position.x = 1.42 + 0.18 * e;
    if (steam.current) {
      steam.current.visible = e > 0.05;
      steam.current.scale.y = Math.max(0.001, e);
    }
    invalidate();
  });
  return (
    <group scale={1.26} position={[0, -0.12, 0]}>
      <Plate />
      <group position={[-0.32, 0.1, -0.05]}>
        <mesh castShadow receiveShadow scale={[0.9, 0.58, 0.9]}>
          <sphereGeometry args={[1, 32, 24]} />
          <meshStandardMaterial color="#f6efe0" roughness={0.6} />
        </mesh>
        <Grains />
      </group>
      <StirFry />
      <group ref={fork} position={[-1.38, 0.26, 1.3]} rotation={[0, 0.32, 0]}>
        <Fork />
      </group>
      <group ref={spoon} position={[1.42, 0.24, 1.2]} rotation={[0, 0.25, 0]}>
        <Spoon />
      </group>
      <group ref={lid}>
        <Lid />
      </group>
      <Specks />
      <group ref={steam}>
        <Steam />
      </group>
    </group>
  );
});

function FitView() {
  const { camera, size, invalidate } = useThree();
  useEffect(() => {
    // Keep the wide cloche composition inside narrow mobile canvases.
    camera.fov = Math.max(36, 2 * Math.atan(4.3 / (8.6 * (size.width / size.height))) * 180 / Math.PI);
    camera.updateProjectionMatrix();
    invalidate();
  }, [camera, size.width, size.height, invalidate]);
  return null;
}

export default function FoodScene({ angle, progress, active, reduced, onFailure }) {
  return (
    <Canvas
      shadows
      camera={{ position: [0, 4.6, 8.1], fov: 40 }}
      dpr={[1, 1.5]}
      frameloop="demand"
      gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}
      onCreated={({ gl, camera }) => {
        camera.lookAt(0, 0.8, 0);
        gl.domElement.addEventListener("webglcontextlost", onFailure, { once: true });
      }}
    >
      <FitView />
      <ambientLight intensity={0.62} />
      <hemisphereLight args={["#ffffff", "#b9bfcc", 1.0]} />
      <directionalLight
        castShadow
        position={[-3.4, 7, 4.4]}
        intensity={2.85}
        color="#fff6e8"
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-4.5}
        shadow-camera-right={4.5}
        shadow-camera-top={4.5}
        shadow-camera-bottom={-4.5}
        shadow-normalBias={0.03}
        shadow-bias={-0.0001}
        shadow-radius={5}
      />
      <directionalLight position={[4.5, 3.4, -3]} intensity={0.9} color="#dfe8ff" />
      <directionalLight position={[2.5, 2, 5]} intensity={0.55} color="#ffe9d2" />
      <group rotation={[0, angle, 0]}>
        <Meal progress={progress} active={active} reduced={reduced} />
      </group>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.58, 0]}>
        <planeGeometry args={[200, 200]} />
        <shadowMaterial transparent opacity={0.15} />
      </mesh>
    </Canvas>
  );
}
