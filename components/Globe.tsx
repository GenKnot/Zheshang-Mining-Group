'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { view } from '../lib/store';
import { webglAvailable } from '../lib/webgl';

const R = 3;
const LON0 = 117; // 朝向镜头的经度
const LAT0 = 26; // 朝向镜头的纬度
const GOLD = '#d4ab6b';
const D2R = Math.PI / 180;

export const PLACES = [
  { name: 'HONG KONG', coord: 'N 22°19′ E 114°10′', lat: 22.32, lon: 114.17 },
  { name: 'HANGZHOU', coord: 'N 30°12′ E 120°12′', lat: 30.21, lon: 120.21 },
];

function toVec(lat: number, lon: number, r = R) {
  const a = lat * D2R;
  const b = (lon - LON0) * D2R;
  return new THREE.Vector3(r * Math.cos(a) * Math.sin(b), r * Math.sin(a), r * Math.cos(a) * Math.cos(b));
}

function Marker({ lat, lon, delay }: { lat: number; lon: number; delay: number }) {
  const rings = useRef<THREE.Group>(null);
  const pos = useMemo(() => toVec(lat, lon), [lat, lon]);
  const quat = useMemo(
    () => new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), pos.clone().normalize()),
    [pos],
  );
  useFrame(({ clock }) => {
    rings.current?.children.forEach((c, i) => {
      const t = (clock.elapsedTime * 0.45 + delay + i * 0.5) % 1;
      c.scale.setScalar(1 + t * 4);
      ((c as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = (1 - t) * 0.9;
    });
  });
  return (
    <group position={pos} quaternion={quat}>
      <mesh>
        <sphereGeometry args={[0.032, 16, 16]} />
        <meshBasicMaterial color="#f3dcae" />
      </mesh>
      <mesh position={[0, 0, 0.26]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.004, 0.004, 0.52, 6]} />
        <meshBasicMaterial color={GOLD} transparent opacity={0.8} />
      </mesh>
      <group ref={rings} position={[0, 0, 0.004]}>
        {[0, 1].map((i) => (
          <mesh key={i}>
            <ringGeometry args={[0.04, 0.046, 48]} />
            <meshBasicMaterial color={GOLD} transparent side={THREE.DoubleSide} depthWrite={false} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function Scene({ labels, still }: { labels: React.RefObject<HTMLDivElement | null>; still: boolean }) {
  const globe = useRef<THREE.Group>(null);
  const s = useRef({ p: 0, mx: 0, my: 0, intro: still ? 1 : 0 });
  const tmp = useMemo(() => new THREE.Vector3(), []);

  // 经纬网
  const grid = useMemo(() => {
    const v: number[] = [];
    const push = (a: THREE.Vector3, b: THREE.Vector3) => v.push(a.x, a.y, a.z, b.x, b.y, b.z);
    for (let lat = -80; lat <= 80; lat += 10)
      for (let i = 0; i < 120; i++) push(toVec(lat, i * 3), toVec(lat, (i + 1) * 3));
    for (let lon = 0; lon < 360; lon += 10)
      for (let i = 0; i < 90; i++) push(toVec(-90 + i * 2, lon), toVec(-90 + (i + 1) * 2, lon));
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
    return g;
  }, []);

  // 均匀分布的点阵
  const dots = useMemo(() => {
    const n = 5200;
    const v = new Float32Array(n * 3);
    const ga = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < n; i++) {
      const y = 1 - (i / (n - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      v[i * 3] = Math.cos(ga * i) * r * (R + 0.006);
      v[i * 3 + 1] = y * (R + 0.006);
      v[i * 3 + 2] = Math.sin(ga * i) * r * (R + 0.006);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(v, 3));
    return g;
  }, []);

  // 两地之间的弧线
  const arc = useMemo(() => {
    const a = toVec(PLACES[0].lat, PLACES[0].lon).normalize();
    const b = toVec(PLACES[1].lat, PLACES[1].lon).normalize();
    const ang = a.angleTo(b);
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 64; i++) {
      const t = i / 64;
      const p = a
        .clone()
        .multiplyScalar(Math.sin((1 - t) * ang) / Math.sin(ang))
        .add(b.clone().multiplyScalar(Math.sin(t * ang) / Math.sin(ang)));
      pts.push(p.multiplyScalar(R * (1 + 0.035 * Math.sin(Math.PI * t))));
    }
    const line = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(pts),
      new THREE.LineBasicMaterial({ color: '#f3dcae' }),
    );
    line.geometry.setDrawRange(0, 0);
    return line;
  }, []);

  const glow = useMemo(
    () => ({
      vertexShader: `varying vec3 vN; void main(){ vN = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
      fragmentShader: `varying vec3 vN; void main(){ float i = pow(0.74 - dot(vN, vec3(0.0,0.0,1.0)), 3.0); gl_FragColor = vec4(0.83,0.67,0.42,1.0) * i; }`,
    }),
    [],
  );

  useFrame(({ camera, size, clock }, dt) => {
    const st = s.current;
    const k = Math.min(1, dt * 3);
    st.p += (view.p - st.p) * k;
    st.mx += (view.mx - st.mx) * k * 0.5;
    st.my += (view.my - st.my) * k * 0.5;
    if (view.ready) st.intro = Math.min(1, st.intro + dt / 2.4);
    const e = 1 - Math.pow(1 - st.intro, 3);

    // 入场：地球转到东亚朝前；之后轻微摆动并跟随鼠标
    const g = globe.current;
    if (g) {
      const sway = still ? 0 : Math.sin(clock.elapsedTime * 0.25) * 0.05;
      g.rotation.x = LAT0 * D2R + st.my * 0.06;
      g.rotation.y = (1 - e) * -1.6 + sway + st.mx * 0.1;
    }

    // 宽屏时地球偏右，竖屏时居中靠下；向下滚动时镜头后退
    const aspect = size.width / size.height;
    const wide = Math.min(1, Math.max(0, (aspect - 0.7) / 0.9));
    const cx = -1.7 * wide;
    const cy = (1 - wide) * 1.9 + st.p * 1.6;
    const cz = 7.4 + (1 - wide) * 2.4 + st.p * 3.2 + (1 - e) * 2.5;
    camera.position.set(cx, cy, cz);
    camera.lookAt(cx, cy, 0);

    arc.geometry.setDrawRange(0, Math.round(65 * Math.min(1, Math.max(0, (st.intro - 0.6) / 0.4))));

    // 把两地的屏幕坐标写给 DOM 标签
    const box = labels.current;
    if (box && g) {
      PLACES.forEach((pl, i) => {
        const el = box.children[i] as HTMLElement;
        tmp.copy(toVec(pl.lat, pl.lon, R)).applyMatrix4(g.matrixWorld).project(camera);
        const x = (tmp.x * 0.5 + 0.5) * size.width;
        const y = (-tmp.y * 0.5 + 0.5) * size.height;
        el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-100%, -50%)`;
        el.style.opacity = String(Math.max(0, Math.min(1, (st.intro - 0.75) * 4)) * Math.max(0, 1 - st.p * 5));
      });
    }
  });

  return (
    <>
      <group ref={globe}>
        <mesh>
          <sphereGeometry args={[R - 0.012, 64, 64]} />
          <meshBasicMaterial color="#0b0d10" />
        </mesh>
        <lineSegments geometry={grid}>
          <lineBasicMaterial color="#8f8a7d" transparent opacity={0.3} />
        </lineSegments>
        <points geometry={dots}>
          <pointsMaterial color={GOLD} size={0.014} sizeAttenuation transparent opacity={0.55} />
        </points>
        <primitive object={arc} />
        {PLACES.map((p, i) => (
          <Marker key={p.name} lat={p.lat} lon={p.lon} delay={i * 0.25} />
        ))}
      </group>
      <mesh scale={1.16}>
        <sphereGeometry args={[R, 48, 48]} />
        <shaderMaterial
          {...glow}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          transparent
          depthWrite={false}
        />
      </mesh>
    </>
  );
}

export default function Globe() {
  if (!webglAvailable()) return null;
  const labels = useRef<HTMLDivElement>(null);
  const still =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  return (
    <>
      <Canvas
        camera={{ fov: 42, near: 0.1, far: 80, position: [-2.1, 0, 8.7] }}
        dpr={[1, 1.75]}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      >
        <Scene labels={labels} still={still} />
      </Canvas>
      <div className="g-labels" ref={labels}>
        {PLACES.map((p) => (
          <div key={p.name}>
            <b>{p.name}</b>
            <span>{p.coord}</span>
          </div>
        ))}
      </div>
    </>
  );
}
