import React, { memo, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { BufferGeometry, CanvasTexture, Color, DoubleSide, Float32BufferAttribute, Object3D, Vector2 } from "three";

const noise = (i) => {
  const n = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return n - Math.floor(n);
};
// Position-hashed jitter so sphere-seam vertices move together.
const wobble = (x, y, z, f) => Math.sin(x * 37.1 * f + y * 17.7 * f + z * 53.3 * f) * 0.5;

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

function Rice() {
  const ref = useRef();
  useLayoutEffect(() => {
    const o = new Object3D();
    for (let i = 0, j = 0; j < 1800; i++) {
      let x = noise(i) * 2 - 1;
      let y = noise(i + 40) * 2 - 1;
      let z = noise(i + 80) * 2 - 1;
      const l = Math.hypot(x, y, z) || 1;
      x /= l; y /= l; z /= l;
      if (y < -0.15) continue;
      const theta = Math.atan2(z, x);
      const bump = 1 + 0.06 * Math.sin(theta * 3 + 1) + 0.04 * Math.sin(theta * 7);
      o.position.set(
        -0.28 + x * 0.95 * bump,
        0.1 + Math.max(0, y) * 0.58 + 0.02 * Math.abs(Math.sin(theta * 5)),
        -0.05 + z * 0.95 * bump
      );
      o.rotation.set(noise(i) * 3, noise(i + 7) * 3, noise(i + 3) * 3);
      o.scale.set(0.024 + noise(i + 1) * 0.011, 0.02, 0.044 + noise(i + 2) * 0.017);
      o.updateMatrix();
      ref.current.setMatrixAt(j, o.matrix);
      const toasted = noise(i + 12) > 0.93;
      ref.current.setColorAt(
        j,
        new Color().setHSL(0.09 + noise(i + 5) * 0.05, toasted ? 0.3 : 0.14 + noise(i + 6) * 0.14, toasted ? 0.56 + noise(i) * 0.08 : 0.72 + noise(i + 9) * 0.22)
      );
      j++;
    }
    ref.current.instanceMatrix.needsUpdate = true;
    ref.current.instanceColor.needsUpdate = true;
  }, []);
  return (
    <group>
      <mesh castShadow receiveShadow position={[-0.28, 0.09, -0.05]} scale={[0.98, 0.6, 0.98]}>
        <sphereGeometry
          args={[1, 48, 32]}
          onUpdate={(g) => {
            if (g.userData.jittered) return;
            g.userData.jittered = true;
            const p = g.attributes.position;
            for (let i = 0; i < p.count; i++) {
              const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
              const k = 1 + wobble(x, y, z, 3) * 0.05;
              p.setXYZ(i, x * k, y * k, z * k);
            }
            p.needsUpdate = true;
            g.computeVertexNormals();
          }}
        />
        <meshStandardMaterial color="#f3ead6" roughness={0.62} />
      </mesh>
      <instancedMesh ref={ref} args={[null, null, 1800]} castShadow>
        <sphereGeometry args={[1, 8, 6]} />
        <meshStandardMaterial roughness={0.5} />
      </instancedMesh>
    </group>
  );
}

function Chicken() {
  const ref = useRef();
  useLayoutEffect(() => {
    const g = ref.current.geometry;
    if (!g.userData.sculpted) {
      const p = g.attributes.position;
      for (let i = 0; i < p.count; i++) {
        const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
        const k = 1 + 0.18 * Math.sin(x * 12 + y * 9) * Math.cos(z * 11);
        p.setXYZ(i, x * k, y * k, z * k);
      }
      p.needsUpdate = true;
      g.computeVertexNormals();
      g.userData.sculpted = true;
    }
    const o = new Object3D();
    const browns = ["#9a5222", "#b06a2e", "#c8853e", "#7c3c1a", "#a85f28"];
    for (let i = 0; i < 120; i++) {
      const a = i * 2.39996;
      const r = Math.sqrt(noise(i + 5));
      o.position.set(
        0.58 + Math.cos(a) * r * 0.58,
        0.22 + (1 - r) * 0.16 + noise(i) * 0.1,
        0.18 + Math.sin(a) * r * 0.5
      );
      o.rotation.set(noise(i) * 6, a, noise(i + 3) * 6);
      o.scale.set(0.105 + noise(i + 4) * 0.075, 0.062 + noise(i + 7) * 0.05, 0.09 + noise(i + 9) * 0.065);
      o.updateMatrix();
      ref.current.setMatrixAt(i, o.matrix);
      ref.current.setColorAt(i, new Color(browns[i % 5]));
    }
    ref.current.instanceMatrix.needsUpdate = true;
    ref.current.instanceColor.needsUpdate = true;
  }, []);
  return (
    <instancedMesh ref={ref} args={[null, null, 120]} castShadow receiveShadow>
      <icosahedronGeometry args={[1, 2]} />
      <meshStandardMaterial roughness={0.3} metalness={0.05} />
    </instancedMesh>
  );
}

function LeafShape() {
  // One shared basil-leaf geometry with a curved profile and midrib.
  const geometry = useMemo(() => {
    const vertices = [], indices = [];
    for (let i = 0; i <= 12; i++) {
      const t = i / 12;
      const width = Math.sin(t * Math.PI) * 0.13;
      for (const side of [-1, 0, 1]) {
        vertices.push(width * side, Math.sin(t * Math.PI) * 0.045 - Math.abs(side) * 0.025, (t - 0.5) * 0.42);
      }
      if (i < 12) {
        for (let jj = 0; jj < 2; jj++) {
          const n = i * 3 + jj;
          indices.push(n, n + 3, n + 1, n + 1, n + 3, n + 4);
        }
      }
    }
    const g = new BufferGeometry();
    g.setAttribute("position", new Float32BufferAttribute(vertices, 3));
    g.setIndex(indices);
    g.computeVertexNormals();
    return g;
  }, []);
  return geometry;
}

function Leaves() {
  const geometry = LeafShape();
  const greens = ["#2f4419", "#496124", "#344d15", "#3f5c1e"];
  return (
    <group>
      {Array.from({ length: 16 }, (_, i) => (
        <group
          key={i}
          position={[0.58 + Math.cos(i * 2.4) * (0.24 + noise(i) * 0.4), 0.33 + noise(i + 5) * 0.14, 0.18 + Math.sin(i * 2.4) * (0.22 + noise(i + 2) * 0.36)]}
          rotation={[0.2 + noise(i + 1) * 0.5, i * 2.4 + noise(i + 3) * 2, 0.15 + noise(i + 4) * 0.4]}
        >
          <mesh geometry={geometry} castShadow>
            <meshStandardMaterial color={greens[i % 4]} roughness={0.38} side={DoubleSide} />
          </mesh>
          <mesh position={[0, 0.025, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.003, 0.006, 0.36, 5]} />
            <meshStandardMaterial color="#788544" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Chilies() {
  return (
    <group>
      {Array.from({ length: 9 }, (_, i) => (
        <mesh
          key={i}
          castShadow
          position={[0.62 + Math.cos(i * 2.4) * 0.42, 0.24 + noise(i + 2) * 0.16, 0.18 + Math.sin(i * 2.4) * 0.36]}
          rotation={[noise(i) * 3, i, noise(i + 4) * 3]}
        >
          <capsuleGeometry args={[0.024, 0.1, 4, 8]} />
          <meshPhysicalMaterial color={i % 2 ? "#c9401a" : "#ad2612"} roughness={0.3} clearcoat={0.4} />
        </mesh>
      ))}
    </group>
  );
}

function StirFry() {
  return (
    <group>
      <mesh castShadow receiveShadow position={[0.62, 0.1, 0.18]} scale={[0.68, 0.24, 0.58]}>
        <sphereGeometry args={[1, 32, 24]} />
        <meshPhysicalMaterial color="#452a12" roughness={0.22} clearcoat={0.7} clearcoatRoughness={0.25} />
      </mesh>
      <Chicken />
      <Leaves />
      <Chilies />
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

function Steam({ eRef, active, reduced }) {
  const group = useRef();
  const time = useRef(0);
  const texture = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 64;
    const g = c.getContext("2d");
    const grad = g.createRadialGradient(32, 32, 2, 32, 32, 30);
    grad.addColorStop(0, "rgba(255,255,255,1)");
    grad.addColorStop(0.45, "rgba(255,255,255,0.6)");
    grad.addColorStop(0.75, "rgba(255,255,255,0.18)");
    grad.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = grad;
    g.fillRect(0, 0, 64, 64);
    return new CanvasTexture(c);
  }, []);
  const wisps = useMemo(
    () =>
      [
        [-0.55, 0.68, -0.16, 1.5], [-0.1, 0.74, -0.02, 1.8], [0.4, 0.72, 0.12, 1.45], [0.75, 0.68, 0.28, 1.65],
      ].map(([x, y, z, h], w) => ({
        x, y, z, h,
        puffs: Array.from({ length: 3 }, (_, p) => ({
          speed: 0.16 + noise(w * 7 + p) * 0.1,
          phase: noise(w * 9 + p * 3),
          sway: 0.05 + noise(w + p) * 0.05,
          sprite: null,
        })),
      })),
    []
  );
  const collect = (wisp, wispIndex) => {
    wisp.puffs.forEach((puff, p) => {
      puff.sprite = group.current.children[wispIndex].children[p];
    });
  };
  useFrame((state, delta) => {
    if (!group.current || !active) return;
    const open = eRef.current;
    if (open <= 0.45) {
      if (group.current.visible) group.current.visible = false;
      return;
    }
    if (reduced) {
      group.current.visible = true;
      wisps.forEach((wisp, w) => {
        if (!wisp.puffs[0].sprite) collect(wisp, w);
        wisp.puffs.forEach((puff, p) => {
          puff.sprite.position.set(wisp.x + p * 0.05 - 0.05, wisp.y + (p + 1) * 0.28, wisp.z);
          puff.sprite.scale.setScalar(0.32 + p * 0.1);
          puff.sprite.material.opacity = 0.22 - p * 0.04;
        });
      });
      return;
    }
    if (!wisps[0].puffs[0].sprite) wisps.forEach(collect);
    group.current.visible = true;
    time.current += delta;
    wisps.forEach((wisp, w) => {
      wisp.puffs.forEach((puff, p) => {
        const k = (time.current * puff.speed + puff.phase) % 1;
        // Rise and curl toward the viewer so the puffs clear the lifted lid.
        puff.sprite.position.set(
          wisp.x + Math.sin(time.current * 1.8 + w * 2 + p) * puff.sway * (0.3 + k),
          wisp.y + k * wisp.h * 0.85,
          wisp.z + k * 1.9
        );
        const s = 0.26 + k * 0.72;
        puff.sprite.scale.setScalar(s);
        puff.sprite.material.opacity = Math.sin(k * Math.PI) * 0.72;
      });
    });
    state.invalidate();
  });
  return (
    <group ref={group} visible={false}>
      {wisps.map((wisp, w) => (
        <group key={w}>
          {wisp.puffs.map((puff, p) => (
            <sprite key={p}>
              <spriteMaterial map={texture} color="#9fadc2" transparent depthWrite={false} opacity={0} />
            </sprite>
          ))}
        </group>
      ))}
    </group>
  );
}

function Burst({ eRef, active, reduced }) {
  const group = useRef();
  const parts = useRef(null);
  const launched = useRef(false);
  useLayoutEffect(() => {
    parts.current = Array.from({ length: 14 }, (_, i) => ({
      vel: [0, 0, 0],
      pos: [0, 0, 0],
      rest: false,
      seed: noise(i + 1),
    }));
  }, []);
  useFrame((state, delta) => {
    if (!group.current || !active || reduced) return;
    const open = eRef.current;
    if (open < 0.3) {
      launched.current = false;
      return;
    }
    if (!launched.current && open > 0.85) {
      launched.current = true;
      group.current.visible = true;
      parts.current.forEach((part, i) => {
        part.pos = [0.62 + (part.seed - 0.5) * 0.3, 0.35 + noise(i + 3) * 0.1, 0.18 + (noise(i + 7) - 0.5) * 0.3];
        part.vel = [(part.seed - 0.5) * 1.1, 1.4 + noise(i + 9) * 1.1, (noise(i + 11) - 0.5) * 1.1];
        part.rest = false;
      });
    }
    if (!launched.current) return;
    let moving = false;
    parts.current.forEach((part, i) => {
      if (part.rest) return;
      moving = true;
      const dt = Math.min(delta, 0.05);
      part.vel[1] -= 5.5 * dt;
      part.pos[0] += part.vel[0] * dt;
      part.pos[1] += part.vel[1] * dt;
      part.pos[2] += part.vel[2] * dt;
      if (part.pos[1] <= 0.16 && part.vel[1] < 0) {
        part.pos[1] = 0.16;
        part.rest = true;
      }
      const m = group.current.children[i];
      m.position.set(part.pos[0], part.pos[1], part.pos[2]);
      m.rotation.x += delta * 6 * part.seed;
      m.rotation.z += delta * 4;
    });
    if (moving) state.invalidate();
  });
  return (
    <group ref={group} visible={false}>
      {Array.from({ length: 14 }, (_, i) => (
        <mesh key={i}>
          <icosahedronGeometry args={[0.028, 0]} />
          <meshStandardMaterial color={i % 3 === 0 ? "#5a4023" : i % 3 === 1 ? "#7a5a2e" : "#8a2f14"} roughness={0.5} />
        </mesh>
      ))}
    </group>
  );
}

function Sparkles({ active, reduced }) {
  const group = useRef();
  const time = useRef(0);
  const texture = useMemo(() => {
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
    g.fillRect(29, 2, 6, 60);
    const rayX = g.createLinearGradient(2, 0, 62, 0);
    rayX.addColorStop(0, "rgba(255,255,255,0)");
    rayX.addColorStop(0.5, "rgba(255,255,255,0.95)");
    rayX.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = rayX;
    g.fillRect(2, 29, 60, 6);
    return new CanvasTexture(c);
  }, []);
  const stars = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => {
        const a = i * 2.39996 + 0.7;
        const r = 1.75 + noise(i + 2) * 0.85;
        return {
          pos: [Math.cos(a) * r, 0.5 + noise(i) * 2.15, Math.sin(a) * r * 0.9],
          dur: 2 + noise(i + 3) * 2.2,
          phase: noise(i + 5),
          size: 0.15 + noise(i + 7) * 0.18,
          rot: noise(i + 9) * Math.PI,
        };
      }),
    []
  );
  useFrame((state, delta) => {
    if (!group.current || !active) return;
    if (reduced) {
      stars.forEach((s, i) => {
        const sprite = group.current.children[i];
        sprite.position.set(s.pos[0], s.pos[1], s.pos[2]);
        sprite.scale.setScalar(s.size);
        sprite.material.opacity = 0.32;
        sprite.material.rotation = s.rot;
      });
      return;
    }
    time.current += delta;
    stars.forEach((s, i) => {
      const sprite = group.current.children[i];
      const k = (time.current / s.dur + s.phase) % 1;
      const o = Math.sin(k * Math.PI);
      sprite.position.set(s.pos[0], s.pos[1], s.pos[2]);
      sprite.scale.setScalar(s.size * (0.4 + o * 1.15));
      sprite.material.opacity = Math.pow(o, 1.4) * 0.95;
      sprite.material.rotation = s.rot + time.current * 0.3;
    });
    state.invalidate();
  });
  return (
    <group ref={group}>
      {stars.map((s, i) => (
        <sprite key={i}>
          <spriteMaterial map={texture} color="#ffce7a" transparent depthWrite={false} opacity={0} />
        </sprite>
      ))}
    </group>
  );
}

function SpinGroup({ angle, active, reduced, children }) {
  const group = useRef();
  const spin = useRef(0);
  const { invalidate } = useThree();
  useEffect(() => { invalidate(); }, [angle, active, invalidate]);
  useFrame((_, delta) => {
    if (!group.current) return;
    // The owner wants the dish on a permanent turntable, so the spin runs
    // regardless of the OS reduced-motion preference (other effects still
    // honor it inside Meal/Sparkles).
    if (active) {
      spin.current += delta * 0.45;
      group.current.rotation.y = angle + spin.current;
      invalidate();
    } else if (group.current.rotation.y !== angle) {
      group.current.rotation.y = angle;
      invalidate();
    }
  });
  return <group ref={group}>{children}</group>;
}

const Meal = memo(function Meal({ progress, active, reduced }) {
  const lid = useRef();
  const fork = useRef();
  const spoon = useRef();
  const eRef = useRef(0);
  const applied = useRef(-1);
  const bobTime = useRef(0);
  const { invalidate } = useThree();
  useEffect(() => { invalidate(); }, [progress, active, invalidate]);
  useFrame((state, delta) => {
    if (!active) return;
    if (reduced) {
      eRef.current = progress;
    } else {
      eRef.current += (progress - eRef.current) * (1 - Math.exp(-Math.min(delta, 0.05) * 6));
      if (Math.abs(eRef.current - progress) < 0.001) eRef.current = progress;
    }
    const v = eRef.current;
    const e = v * v * (3 - 2 * v);
    if (applied.current !== v) {
      applied.current = v;
      if (lid.current) {
        lid.current.position.y = 1.5 * e;
        lid.current.rotation.z = -0.3 * e;
        lid.current.position.x = 0.25 * e;
      }
      if (fork.current) fork.current.position.x = -1.38 - 0.18 * e;
      if (spoon.current) spoon.current.position.x = 1.42 + 0.18 * e;
      invalidate();
    }
    // Gentle idle bob while the lid is open keeps the scene alive.
    if (!reduced && e > 0.95) {
      bobTime.current += delta;
      if (lid.current) {
        lid.current.position.y = 1.5 + Math.sin(bobTime.current * 1.6) * 0.045;
        lid.current.rotation.z = -0.3 + Math.sin(bobTime.current * 1.1) * 0.02;
      }
      state.invalidate();
    }
  });
  return (
    <group scale={1.26} position={[0, -0.12, 0]}>
      <Plate />
      <Rice />
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
      <Steam eRef={eRef} active={active} reduced={reduced} />
      <Burst eRef={eRef} active={active} reduced={reduced} />
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
      <ambientLight intensity={0.6} />
      <hemisphereLight args={["#ffffff", "#b9bfcc", 0.95]} />
      <directionalLight
        castShadow
        position={[-3.4, 7, 4.4]}
        intensity={2.85}
        color="#fff3e2"
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
      <directionalLight position={[2.5, 2, 5]} intensity={0.6} color="#ffe9d2" />
      <SpinGroup angle={angle} active={active} reduced={reduced}>
        <Meal progress={progress} active={active} reduced={reduced} />
      </SpinGroup>
      <Sparkles active={active} reduced={reduced} />
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.58, 0]}>
        <planeGeometry args={[200, 200]} />
        <shadowMaterial transparent opacity={0.15} />
      </mesh>
    </Canvas>
  );
}
