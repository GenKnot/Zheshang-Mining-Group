'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import type { Lang } from '../lib/content';
import { projects, projLang } from '../lib/site';
import { view } from '../lib/store';
import { webglAvailable } from '../lib/webgl';

const R = 3;
const D2R = Math.PI / 180;
const GOLD = '#d4ab6b';
const HOME: [number, number] = [30.2, 120.2]; // 杭州

/** 经纬度转球面坐标：经度 0 朝向 +z */
// 露天开采的项目画矿坑，其余画井架
const OPEN_PIT = new Set(['suriname-gold', 'south-africa-chrome', 'mozambique-heavy-sands', 'guinea-mining']);

function toVec(lat: number, lon: number, r = R) {
  const a = lat * D2R;
  const b = lon * D2R;
  return new THREE.Vector3(r * Math.cos(a) * Math.sin(b), r * Math.sin(a), r * Math.cos(a) * Math.cos(b));
}

// 各大陆的粗略轮廓（经度, 纬度），只用来决定哪些点落在陆地上
const LAND: [number, number][][] = [
  // 北美
  [[-168, 66], [-156, 71], [-125, 70], [-95, 72], [-80, 70], [-62, 60], [-55, 52], [-66, 44], [-70, 41], [-76, 35], [-81, 31], [-80, 25], [-83, 29], [-90, 29], [-97, 27], [-97, 20], [-90, 18], [-88, 15], [-83, 10], [-79, 8], [-85, 11], [-92, 15], [-105, 19], [-110, 24], [-114, 30], [-118, 34], [-124, 41], [-124, 48], [-130, 55], [-140, 60], [-152, 59], [-160, 55], [-165, 60]],
  // 格陵兰
  [[-55, 60], [-42, 60], [-22, 70], [-20, 80], [-40, 83], [-60, 82], [-70, 77], [-55, 70]],
  // 南美
  [[-80, 8], [-72, 12], [-62, 10], [-52, 5], [-50, 0], [-35, -6], [-39, -15], [-41, -22], [-48, -27], [-54, -34], [-58, -38], [-65, -42], [-68, -52], [-72, -53], [-75, -45], [-71, -30], [-70, -18], [-76, -14], [-81, -5]],
  // 非洲
  [[-17, 15], [-16, 21], [-10, 29], [-6, 35], [10, 37], [11, 33], [20, 32], [32, 31], [35, 28], [37, 20], [43, 11], [51, 11], [48, 4], [41, -3], [39, -10], [40, -16], [35, -24], [32, -29], [26, -34], [19, -34], [15, -27], [12, -17], [13, -8], [9, -1], [9, 4], [4, 6], [-4, 5], [-8, 4], [-13, 8]],
  // 马达加斯加
  [[44, -25], [47, -25], [50, -15], [49, -12], [44, -17]],
  // 欧洲
  [[-9, 37], [-9, 43], [-2, 44], [-5, 48], [2, 51], [5, 54], [8, 57], [5, 59], [6, 62], [14, 68], [25, 71], [40, 68], [45, 68], [60, 69], [60, 55], [50, 46], [40, 47], [37, 45], [28, 41], [23, 37], [20, 40], [13, 45], [18, 40], [15, 38], [8, 44], [3, 43], [0, 39], [-5, 36]],
  // 不列颠
  [[-5, 50], [1, 51], [0, 54], [-3, 58], [-6, 56], [-4, 54]],
  // 亚洲（含中东）
  [[60, 55], [60, 69], [70, 73], [100, 78], [140, 73], [170, 70], [180, 66], [178, 62], [163, 60], [156, 51], [142, 54], [135, 44], [129, 41], [127, 35], [122, 39], [118, 38], [122, 31], [120, 26], [114, 22], [108, 21], [106, 17], [109, 12], [105, 9], [101, 13], [99, 8], [103, 2], [100, 7], [98, 16], [94, 17], [91, 22], [87, 21], [80, 15], [77, 8], [73, 17], [72, 21], [67, 25], [57, 25], [50, 30], [48, 30], [56, 26], [59, 22], [52, 17], [44, 12], [42, 15], [35, 28], [36, 36], [27, 37], [28, 41], [40, 41], [50, 46]],
  // 日本
  [[130, 31], [136, 34], [141, 36], [142, 42], [145, 44], [141, 45], [139, 38], [133, 35]],
  // 东南亚诸岛
  [[95, 5], [104, -5], [106, -6], [100, 2]],
  [[109, 1], [117, 7], [119, 1], [116, -4], [110, -3]],
  [[105, -7], [114, -7], [114, -8.5], [106, -8]],
  [[120, 18], [122, 18], [126, 8], [122, 7], [120, 13]],
  [[131, -1], [141, -3], [150, -6], [147, -10], [141, -9], [134, -4]],
  // 澳大利亚、新西兰
  [[114, -22], [122, -17], [130, -12], [137, -12], [136, -15], [141, -13], [143, -11], [146, -19], [153, -26], [151, -34], [146, -39], [140, -38], [135, -35], [129, -32], [117, -35], [115, -32]],
  [[173, -35], [178, -38], [175, -41], [167, -46], [170, -43]],
];

function onLand(lon: number, lat: number) {
  for (const poly of LAND) {
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const [xi, yi] = poly[i];
      const [xj, yj] = poly[j];
      if (yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside;
    }
    if (inside) return true;
  }
  return false;
}

// 每个区域转到正面时对准的经纬度：取该区域项目位置的平均值
const REGION_VIEW: Record<string, [number, number]> = {};
for (const p of projects) {
  const list = projects.filter((x) => x.region === p.region);
  REGION_VIEW[p.region] = [
    list.reduce((s, x) => s + x.coord[0], 0) / list.length,
    list.reduce((s, x) => s + x.coord[1], 0) / list.length,
  ];
}

function Scene({ labels, still, mobile }: { labels: React.RefObject<HTMLDivElement | null>; still: boolean; mobile: boolean }) {
  const globe = useRef<THREE.Group>(null);
  const marks = useRef<THREE.Group>(null);
  const s = useRef({ p: 0, mx: 0, my: 0, intro: still ? 1 : 0, rotY: -40 * D2R, rotX: 0.25, auto: -40 * D2R, t: 0, act: projects.map(() => 1) });
  const tmp = useMemo(() => ({ a: new THREE.Vector3(), b: new THREE.Vector3() }), []);

  // 经纬网
  const grid = useMemo(() => {
    const v: number[] = [];
    const push = (a: THREE.Vector3, b: THREE.Vector3) => v.push(a.x, a.y, a.z, b.x, b.y, b.z);
    for (let lat = -75; lat <= 75; lat += 15)
      for (let i = 0; i < 120; i++) push(toVec(lat, i * 3), toVec(lat, (i + 1) * 3));
    for (let lon = 0; lon < 360; lon += 15)
      for (let i = 0; i < 90; i++) push(toVec(-90 + i * 2, lon), toVec(-90 + (i + 1) * 2, lon));
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
    return g;
  }, []);

  // 陆地点阵：球面均匀撒点，只保留落在大陆轮廓里的
  const land = useMemo(() => {
    const n = 26000;
    const v: number[] = [];
    const ga = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < n; i++) {
      const y = 1 - (i / (n - 1)) * 2;
      const lat = Math.asin(y) / D2R;
      let lon = ((ga * i) / D2R) % 360;
      if (lon > 180) lon -= 360;
      if (!onLand(lon, lat)) continue;
      const p = toVec(lat, lon, R + 0.008);
      v.push(p.x, p.y, p.z);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
    return g;
  }, []);

  const spots = useMemo(() => projects.map((p) => toVec(p.coord[0], p.coord[1])), []);
  // 每个项目一幅小的线框"立面图"，贴在标记上方的地表：露天矿画矿坑，其余画井架。聚焦到该项目时升起来
  const sites = useMemo(
    () =>
      projects.map((p, i) => {
        const v: number[] = [];
        const seg = (a: number[], b: number[]) => v.push(a[0], a[1], 0, b[0], b[1], 0);
        const oval = (x: number, y: number, rx: number, ry: number, n = 36) => {
          for (let k = 0; k < n; k++) {
            const a = (k / n) * Math.PI * 2;
            const b = ((k + 1) / n) * Math.PI * 2;
            seg([x + rx * Math.cos(a), y + ry * Math.sin(a)], [x + rx * Math.cos(b), y + ry * Math.sin(b)]);
          }
        };
        if (OPEN_PIT.has(p.slug)) {
          // 一圈圈往下收的台阶，加一条下坑的坡道和坑边的料堆
          for (let k = 0; k < 5; k++) oval(0, 0.2 - k * 0.026, 0.16 - k * 0.03, (0.16 - k * 0.03) * 0.36);
          for (let k = 0; k < 4; k++) {
            const s = k % 2 ? -1 : 1;
            seg([s * (0.16 - k * 0.03) * 0.7, 0.2 - k * 0.026 - 0.03], [-s * (0.13 - k * 0.03) * 0.7, 0.174 - k * 0.026 - 0.03]);
          }
          seg([-0.22, 0.2], [-0.16, 0.2]);
          seg([0.16, 0.2], [0.24, 0.2]);
          seg([0.17, 0.2], [0.2, 0.245]);
          seg([0.2, 0.245], [0.235, 0.2]);
        } else {
          // 井架：两条斜腿、交叉拉撑、顶上的天轮、斜撑和卷扬机房
          const B = 0.045;
          seg([-0.055, B], [-0.016, 0.25]);
          seg([0.055, B], [0.016, 0.25]);
          seg([-0.016, 0.25], [0.016, 0.25]);
          for (let k = 0; k < 4; k++) {
            const y0 = B + k * 0.05;
            const y1 = y0 + 0.05;
            const w0 = 0.055 - (k * 0.05 * 0.039) / 0.205;
            const w1 = 0.055 - ((k + 1) * 0.05 * 0.039) / 0.205;
            seg([-w0, y0], [w1, y1]);
            seg([w0, y0], [-w1, y1]);
            seg([-w1, y1], [w1, y1]);
          }
          oval(0, 0.27, 0.03, 0.03, 16);
          oval(0, 0.27, 0.008, 0.008, 6);
          seg([0.016, 0.25], [0.15, B]);
          seg([0.028, 0.278], [0.14, B + 0.05]);
          seg([0.1, B], [0.1, B + 0.05]);
          seg([0.1, B + 0.05], [0.18, B + 0.05]);
          seg([0.18, B + 0.05], [0.18, B]);
          seg([-0.1, B], [0.2, B]);
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
        const line = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: '#f3dcae', transparent: true, opacity: 0, depthWrite: false }));
        // 贴在地表的切平面上：x 朝东、y 朝北、z 朝外
        const n = spots[i].clone().normalize();
        const north = new THREE.Vector3(0, 1, 0).addScaledVector(n, -n.y).normalize();
        const east = new THREE.Vector3().crossVectors(north, n);
        line.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(east, north, n));
        line.position.copy(spots[i]).addScaledVector(n, 0.012);
        line.frustumCulled = false;
        return line;
      }),
    [spots],
  );

  // 从杭州到各个项目的弧线
  const arcs = useMemo(
    () =>
      spots.map((to) => {
        const a = toVec(HOME[0], HOME[1]).normalize();
        const b = to.clone().normalize();
        const ang = a.angleTo(b);
        const pts: THREE.Vector3[] = [];
        for (let i = 0; i <= 80; i++) {
          const t = i / 80;
          const p = a
            .clone()
            .multiplyScalar(Math.sin((1 - t) * ang) / Math.sin(ang))
            .add(b.clone().multiplyScalar(Math.sin(t * ang) / Math.sin(ang)));
          pts.push(p.multiplyScalar(R * (1 + 0.16 * ang * Math.sin(Math.PI * t))));
        }
        return new THREE.Line(
          new THREE.BufferGeometry().setFromPoints(pts),
          new THREE.LineBasicMaterial({ color: '#f3dcae', transparent: true, opacity: 0 }),
        );
      }),
    [spots],
  );

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
    if (view.ready) st.intro = Math.min(1, st.intro + dt / 2.2);
    const e = 1 - Math.pow(1 - st.intro, 3);

    // 没选区域时缓慢自转；选了区域就转到该区域朝前
    // 鼠标停在某张项目卡片上时，优先对准那个项目
    const focus = view.focus ? projects.find((x) => x.slug === view.focus) : undefined;
    const target = focus ? (focus.coord as [number, number]) : REGION_VIEW[view.region];
    let ty: number;
    let tx: number;
    if (target) {
      ty = -target[1] * D2R;
      tx = target[0] * D2R * (focus ? 0.95 : 0.75);
      st.auto = ty;
    } else {
      if (!still) st.auto -= dt * 0.1;
      ty = st.auto;
      tx = 0.25;
    }
    let dy = (ty - st.rotY) % (Math.PI * 2);
    if (dy > Math.PI) dy -= Math.PI * 2;
    if (dy < -Math.PI) dy += Math.PI * 2;
    st.rotY += dy * Math.min(1, dt * 2.2);
    st.rotX += (tx - st.rotX) * Math.min(1, dt * 2.2);

    const g = globe.current;
    if (g) {
      g.rotation.x = st.rotX + st.my * 0.05;
      g.rotation.y = st.rotY + (1 - e) * 1.4 + st.mx * 0.08;
    }

    // 全屏大屏：总览时地球偏右、完整可见；巡览到某个项目时镜头拉近，地球占满画面
    const aspect = size.width / size.height;
    const wide = Math.min(1, Math.max(0, (aspect - 0.75) / 0.3)); // 接近方形的窗口也按宽屏处理
    st.t += ((focus ? 1 : 0) - st.t) * Math.min(1, dt * 2.2); // t：从总览（0）到聚焦某个项目（1）
    const tan = Math.tan(21 * D2R);
    // 宽屏：地球半径相对半屏高的比例，总览约八成，聚焦时放大到超出屏幕
    const fracWide = Math.min(0.8, 0.56 * aspect) + (Math.min(1.06, 0.78 * aspect) - Math.min(0.8, 0.56 * aspect)) * st.t;
    // 竖屏：按屏幕宽度定大小，地球放在上半屏，下半屏留给卡片
    const fracTall = aspect * (0.86 + 0.5 * st.t);
    const cz = R / (tan * (wide * fracWide + (1 - wide) * fracTall)) + (1 - e) * 2.5;
    const ndcX = wide * (0.5 - 0.1 * st.t); // 地球中心的水平位置：0 为正中，1 为右边缘
    const ndcY = (1 - wide) * 0.36; // 竖屏时把地球抬到上半屏
    const cx = -ndcX * cz * tan * aspect;
    const cy = -ndcY * cz * tan;
    camera.position.set(cx, cy, cz);
    camera.lookAt(cx, cy, 0);

    // 标记、弧线和文字标签：当前项目点亮，其余压暗
    const box = labels.current;
    const fade = 1;
    projects.forEach((p, i) => {
      const on = focus ? (p === focus ? 1 : 0) : !target || p.region === view.region ? 1 : 0;
      st.act[i] += (on - st.act[i]) * k;
      const a = st.act[i];
      const m = marks.current?.children[i];
      if (m) {
        const t = (clock.elapsedTime * 0.5 + i * 0.37) % 1;
        const [core, ring] = m.children as THREE.Mesh[];
        (core.material as THREE.MeshBasicMaterial).opacity = 0.35 + 0.65 * a;
        ring.scale.setScalar(1 + t * (2 + 3 * a));
        (ring.material as THREE.MeshBasicMaterial).opacity = (1 - t) * (0.2 + 0.8 * a) * e;
      }
      // 只在聚焦到这个项目时升起它的剪影
      const site = sites[i];
      const sv = a * st.t * (focus === p ? 1 : 0);
      site.visible = sv > 0.01;
      site.scale.set(1.7, Math.max(0.001, 1.7 * sv), 1);
      (site.material as THREE.LineBasicMaterial).opacity = sv * e;
      const arc = arcs[i];
      (arc.material as THREE.LineBasicMaterial).opacity = (0.12 + 0.6 * a) * e;
      arc.geometry.setDrawRange(0, Math.round(81 * Math.min(1, Math.max(0, (st.intro - 0.4) / 0.6))));

      const el = box?.children[i] as HTMLElement | undefined;
      if (el && g) {
        tmp.a.copy(spots[i]).applyMatrix4(g.matrixWorld);
        // 转到背面的标签不显示
        const facing = tmp.b.copy(tmp.a).normalize().dot(tmp.b.clone().copy(camera.position).sub(tmp.a).normalize());
        tmp.a.project(camera);
        const x = (tmp.a.x * 0.5 + 0.5) * size.width;
        const y = (-tmp.a.y * 0.5 + 0.5) * size.height;
        el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(14px, -50%)`;
        el.style.opacity = String(
          Math.max(0, Math.min(1, (facing - 0.12) * 6)) * (0.3 + 0.7 * a) * Math.max(0, (st.intro - 0.7) * 3.4) * fade,
        );
      }
    });
  });

  return (
    <>
      <group ref={globe}>
        <mesh>
          <sphereGeometry args={[R - 0.012, 64, 64]} />
          <meshBasicMaterial color="#0b0d10" />
        </mesh>
        <lineSegments geometry={grid}>
          <lineBasicMaterial color="#8f8a7d" transparent opacity={0.16} />
        </lineSegments>
        <points geometry={land}>
          {/* 竖屏时镜头更远，点要画大一些才看得清大陆 */}
          <pointsMaterial color={GOLD} size={mobile ? 0.038 : 0.02} sizeAttenuation transparent opacity={0.8} />
        </points>
        {arcs.map((a, i) => (
          <primitive key={i} object={a} />
        ))}
        {sites.map((o, i) => (
          <primitive key={`s${i}`} object={o} />
        ))}
        <group ref={marks}>
          {spots.map((pos, i) => (
            <group
              key={i}
              position={pos}
              quaternion={new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), pos.clone().normalize())}
            >
              <mesh>
                <sphereGeometry args={[0.04, 16, 16]} />
                <meshBasicMaterial color="#ff5a52" transparent />
              </mesh>
              <mesh position={[0, 0, 0.006]}>
                <ringGeometry args={[0.05, 0.058, 48]} />
                <meshBasicMaterial color="#f3dcae" transparent side={THREE.DoubleSide} depthWrite={false} />
              </mesh>
            </group>
          ))}
        </group>
        {/* 杭州：连线的起点 */}
        <mesh position={toVec(HOME[0], HOME[1])}>
          <sphereGeometry args={[0.03, 12, 12]} />
          <meshBasicMaterial color="#f3dcae" />
        </mesh>
      </group>
      <mesh scale={1.16}>
        <sphereGeometry args={[R, 48, 48]} />
        <shaderMaterial {...glow} side={THREE.BackSide} blending={THREE.AdditiveBlending} transparent depthWrite={false} />
      </mesh>
    </>
  );
}

export default function ProjectGlobe({ lang }: { lang: Lang }) {
  if (!webglAvailable()) return null;
  const labels = useRef<HTMLDivElement>(null);
  const pl = projLang(lang);
  const mobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const still =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  return (
    <>
      <Canvas
        camera={{ fov: 42, near: 0.1, far: 80, position: [-2, 0, 10.5] }}
        dpr={[1, 1.75]}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      >
        <Scene labels={labels} still={still} mobile={mobile} />
      </Canvas>
      <div className="g-labels pg-labels" ref={labels}>
        {projects.map((p) => (
          <div key={p.slug}>
            <b>{p.t[pl].country}</b>
            <span>{p.symbols.join(' · ')}</span>
          </div>
        ))}
      </div>
    </>
  );
}
