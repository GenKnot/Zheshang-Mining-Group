'use client';

import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { Lines, lineMaterial, pointMaterial, points } from './AboutRig';
import { heliGeometry, raw, truckGeometry } from './Terrain';

/* 峰会页大屏"里面"的矿场：挖掘机循环作业、卡车沿道路运输、飞机从远山上空飞过。
   整块场景放在舞台大屏的后方（z < -13），镜头穿过屏幕后看到它。 */

const TAU = Math.PI * 2;
const GOLD = new THREE.Color('#d4ab6b');
const PALE = new THREE.Color('#f3dcae');
const GREY = new THREE.Color('#9a9488');
const RED = new THREE.Color('#ff6a55');

type V = number[];
type Dot = { p: V; c: THREE.Color; s: number; a: number };

export const EX: V = [-1, 0, -30]; // 挖掘机的位置
const ROAD = { cx: 16, cz: -30, rx: 10, rz: 8 }; // 运输道路：一圈椭圆，绕开挖掘机和等装车的卡车
// 露天矿坑：飞机航线正下方，镜头跟着飞机从它上空掠过。r 半径、n 台阶数、d 深度，需与着色器常量一致
export const PIT = { x: 40, z: -92, r: 34, n: 6, d: 13 };
const GROUND = -0.06; // 平地比线条物件略低，免得叠在一起闪
/** 盘山道上的位置：q 从 0（坑口）到 1（坑底），lane 是在台阶平面上靠外还是靠里 */
const pitRoad = (q: number, lane: number): V => {
  const u = q * (PIT.n - lane);
  const d = PIT.r * (1 - (0.7 * (lane + u)) / PIT.n);
  const a = TAU * u;
  return [PIT.x + d * Math.cos(a), GROUND - (u * PIT.d) / PIT.n, PIT.z + d * Math.sin(a)];
};
// 飞机的航线：从矿场左后方飞来，越过作业区和矿坑，飞向远山
export const FLIGHT = new THREE.CatmullRomCurve3(
  [
    [-36, 9, -12], [-14, 10, -24], [4, 11, -40], [22, 12.5, -62], [40, 14, -90], [54, 15, -118], [66, 16.5, -148], [76, 18.5, -182],
  ].map((p) => new THREE.Vector3(p[0], p[1], p[2])),
);
const roadAt = (t: number, k = 1): V => [ROAD.cx + ROAD.rx * k * Math.cos(t), 0.02, ROAD.cz + ROAD.rz * k * Math.sin(t)];

function build() {
  let seed = 41;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;

  /* ---------- 采场台阶、道路、远山（地面本身是下面的等高线地形） ---------- */
  const land = new Lines();
  // 挖掘机身后的采场台阶
  for (let k = 0; k < 4; k++) {
    const y = k * 1.7;
    const z0 = -37.5 - k * 2.1;
    const wav = (x: number) => 0.35 * Math.sin(x * 0.6 + k * 2);
    for (let x = -24; x < 9; x += 0.6) {
      land.seg([x, y, z0 + wav(x)], [x + 0.6, y, z0 + wav(x + 0.6)], k % 2 ? GOLD : PALE, 0.7);
      land.seg([x, y + 1.7, z0 - 0.5 + wav(x)], [x + 0.6, y + 1.7, z0 - 0.5 + wav(x + 0.6)], GOLD, 0.45);
      if (Math.round(x / 0.6) % 2 === 0) land.seg([x, y, z0 + wav(x)], [x + 0.15, y + 1.7, z0 - 0.5 + wav(x)], GREY, 0.3);
    }
  }
  // 料堆：挖掘机正对着它
  for (const [x, z, r, hh] of [[EX[0] - 5.1, EX[2], 2.1, 1.6], [EX[0] - 6.4, EX[2] + 2.4, 1.5, 1.0]]) {
    land.hoop(x, 0.01, z, r, GOLD, 0.7, 16);
    land.hoop(x, hh * 0.5, z, r * 0.5, GREY, 0.45, 12);
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * TAU;
      land.seg([x + r * Math.cos(a), 0.01, z + r * Math.sin(a)], [x, hh, z], GOLD, 0.55);
    }
  }
  // 运输道路：两条边线加中线虚线
  for (let i = 0; i < 96; i++) {
    const a = (i / 96) * TAU;
    const b = ((i + 1) / 96) * TAU;
    land.seg(roadAt(a, 0.93), roadAt(b, 0.93), GOLD, 0.5);
    land.seg(roadAt(a, 1.07), roadAt(b, 1.07), GOLD, 0.5);
    if (i % 2 === 0) land.seg(roadAt(a), roadAt(b), PALE, 0.4);
  }
  // 破碎站、皮带和成品堆
  land.box(5, 9, 0, 3, -47, -44, GOLD, 0.75);
  land.path([[5.4, 3, -46.6], [8.6, 3, -46.6], [9.6, 4.3, -47.4], [4.4, 4.3, -47.4]], PALE, 0.7, true);
  for (const z of [-45.9, -45.1]) land.seg([5, 2.6, z], [-1.5, 5.6, z], GOLD, 0.7);
  for (let k = 0; k <= 8; k++) land.seg([5 - k * 0.81, 2.6 + k * 0.375, -45.9], [5 - k * 0.81, 2.6 + k * 0.375, -45.1], GREY, 0.45);
  for (const x of [3, 0.5]) land.seg([x, 0, -45.5], [x, 2.6 + ((5 - x) / 6.5) * 3, -45.5], GOLD, 0.5);
  land.hoop(-2, 0.01, -45.5, 2.6, GOLD, 0.7, 18);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * TAU;
    land.seg([-2 + 2.6 * Math.cos(a), 0.01, -45.5 + 2.6 * Math.sin(a)], [-2, 2.4, -45.5], GOLD, 0.5);
  }
  // 远山和一轮落日：在航线的尽头
  const ridge = (x: number, m: number) => (14 + m * 8) * (0.45 + 0.3 * Math.sin(x * 0.04 + m * 2.1) + 0.18 * Math.sin(x * 0.11 + m * 4.3) + 0.07 * Math.sin(x * 0.31));
  for (let m = 0; m < 3; m++) {
    const z = -196 - m * 14;
    for (let x = -90, n = 0; x < 200; x += 1.6, n++) {
      const y0 = Math.max(0, ridge(x, m));
      land.seg([x, y0, z], [x + 1.6, Math.max(0, ridge(x + 1.6, m)), z], m === 1 ? GREY : GOLD, 0.75 - m * 0.15);
      if (n % 3 === 0 && y0 > 1) land.seg([x, y0, z], [x - 1.4, y0 * 0.4, z + 3], GREY, 0.25);
    }
  }
  land.ring(78, 34, -250, 16, PALE, 0.85, 64);
  land.ring(78, 34, -250, 14.2, GOLD, 0.4, 64);

  /* ---------- 挖掘机：下车、上车、动臂、斗杆、铲斗 ---------- */
  const under = new Lines();
  for (const z of [-1.0, 1.0]) {
    under.box(-1.7, 1.7, 0, 0.62, z - 0.32, z + 0.32, GOLD, 0.85);
    for (const x of [-1.4, -0.7, 0, 0.7, 1.4]) under.ring(x, 0.31, z + (z > 0 ? 0.32 : -0.32), 0.24, PALE, 0.7, 10);
  }
  under.box(-1.0, 1.0, 0.3, 0.7, -0.68, 0.68, GOLD, 0.6);
  under.hoop(0, 0.72, 0, 0.9, PALE, 0.8, 20);
  const upper = new Lines();
  upper.box(-2.0, 1.1, 0.78, 1.95, -1.1, 1.1, GOLD, 0.9); // 机身
  upper.box(-2.1, -1.3, 0.78, 1.7, -1.15, 1.15, PALE, 0.6); // 配重
  upper.box(0.1, 1.45, 0.9, 2.75, 0.2, 1.1, PALE, 0.9); // 驾驶室
  upper.path([[1.45, 1.45, 0.28], [1.45, 2.6, 0.28], [1.45, 2.6, 1.02], [1.45, 1.45, 1.02]], PALE, 0.8, true);
  for (let x = -1.8; x < -0.2; x += 0.22) upper.seg([x, 1.2, 1.1], [x, 1.8, 1.1], GREY, 0.5);
  upper.seg([-0.9, 1.95, -0.6], [-0.9, 2.5, -0.6], GREY, 0.8); // 排气管
  // 动臂：中间略微上拱
  const boom = new Lines();
  for (const z of [-0.2, 0.2]) {
    boom.path([[0, -0.22, z], [1.6, 0.5, z], [3.4, -0.16, z], [3.4, 0.16, z], [1.7, 1.0, z], [0, 0.22, z]], PALE, 0.95, true);
  }
  for (const [x, y] of [[0, -0.22], [0, 0.22], [1.6, 0.5], [1.7, 1.0], [3.4, -0.16], [3.4, 0.16]]) boom.seg([x, y, -0.2], [x, y, 0.2], GOLD, 0.7);
  boom.seg([0.5, 0.75, 0], [2.6, 1.05, 0], GOLD, 0.8); // 斗杆油缸
  const stick = new Lines();
  for (const z of [-0.15, 0.15]) stick.path([[-0.5, 0.22, z], [0, -0.2, z], [2.3, -0.1, z], [2.3, 0.1, z], [0, 0.28, z]], PALE, 0.95, true);
  for (const [x, y] of [[-0.5, 0.22], [0, -0.2], [2.3, -0.1], [2.3, 0.1], [0, 0.28]]) stick.seg([x, y, -0.15], [x, y, 0.15], GOLD, 0.7);
  const bucket = new Lines();
  const prof: V[] = [[0, 0.12], [0.1, -0.5], [0.55, -0.85], [1.05, -0.6], [1.15, -0.15], [0.5, 0.12]];
  for (const z of [-0.45, 0.45]) bucket.path(prof.map(([x, y]) => [x, y, z]), PALE, 0.95, true);
  for (const [x, y] of prof) bucket.seg([x, y, -0.45], [x, y, 0.45], GOLD, 0.8);
  for (let z = -0.4; z <= 0.41; z += 0.2) bucket.seg([1.15, -0.15, z], [1.38, -0.02, z], PALE, 0.9); // 斗齿

  /* ---------- 飞机 ---------- */
  const plane = new Lines();
  const sect: [number, number][] = [[-3.2, 0.1], [-2.4, 0.3], [-1.2, 0.4], [0.6, 0.4], [2.0, 0.36], [2.7, 0.22], [3.1, 0.06]];
  const ringAt = (x: number, r: number): V[] => Array.from({ length: 6 }, (_, i) => [x, r * Math.sin((i / 6) * TAU), r * Math.cos((i / 6) * TAU)]);
  let prevRing: V[] | null = null;
  for (const [x, r] of sect) {
    const cur = ringAt(x, r);
    cur.forEach((p, i) => plane.seg(p, cur[(i + 1) % 6], PALE, 0.85));
    if (prevRing) cur.forEach((p, i) => plane.seg(prevRing![i], p, PALE, 0.85));
    prevRing = cur;
  }
  for (const s of [-1, 1]) {
    plane.path([[1.0, -0.12, 0.36 * s], [-0.7, 0.1, 3.6 * s], [-1.2, 0.1, 3.6 * s], [-0.5, -0.12, 0.36 * s]], PALE, 0.9, true); // 机翼
    plane.path([[-2.4, 0.1, 0.24 * s], [-3.1, 0.18, 1.3 * s], [-3.35, 0.18, 1.3 * s], [-3.0, 0.1, 0.2 * s]], PALE, 0.8, true); // 平尾
    for (const x of [0.75, 0.15]) plane.ring(x, -0.32, 1.35 * s, 0.17, GOLD, 0.8, 8); // 发动机
    plane.seg([0.75, -0.32, 1.35 * s + 0.0], [0.15, -0.32, 1.35 * s], GOLD, 0.6);
    // 尾迹：越往后越淡
    for (let k = 0; k < 14; k++) plane.seg([-3.3 - k * 1.4, 0.05, 0.9 * s], [-3.3 - (k + 1) * 1.4, 0.05, 0.9 * s], GREY, 0.5 * (1 - k / 14));
  }
  plane.path([[-2.2, 0.3, 0], [-3.3, 1.35, 0], [-3.55, 1.35, 0], [-3.1, 0.2, 0]], PALE, 0.9, true); // 垂尾

  // 灯光
  const lamps: Dot[] = [
    { p: [78, 34, -250], c: PALE, s: 5200, a: 0.5 }, // 落日的光晕
    { p: [7, 4.6, -45.5], c: PALE, s: 200, a: 0.9 },
  ];
  for (let n = 0; n < 420; n++) lamps.push({ p: [-36 + rnd() * 130, 0.5 + rnd() * 22, -15 - rnd() * 150], c: GOLD, s: 12 + rnd() * 14, a: 0.4 });

  return {
    land: land.geometry(),
    under: under.geometry(),
    upper: upper.geometry(),
    boom: boom.geometry(),
    stick: stick.geometry(),
    bucket: bucket.geometry(),
    plane: plane.geometry(),
    lamps: points(lamps),
    exLamps: points([
      { p: [1.5, 2.8, 0.65], c: PALE, s: 190, a: 1 },
      { p: [0.4, 2.0, -0.9], c: PALE, s: 120, a: 0.8 },
    ]),
    planeLamps: points([
      { p: [-0.9, 0.1, 3.6], c: RED, s: 200, a: 1 },
      { p: [-0.9, 0.1, -3.6], c: PALE, s: 200, a: 1 },
      { p: [-3.4, 1.35, 0], c: PALE, s: 160, a: 1 },
    ]),
    truckLamps: points([
      { p: [0.58, 0.24, -0.18], c: PALE, s: 150, a: 1 },
      { p: [0.58, 0.24, 0.18], c: PALE, s: 150, a: 1 },
      { p: [-0.6, 0.5, 0], c: RED, s: 120, a: 0.9 },
    ]),
  };
}


/* ---------- 地面：流动的等高线地形 + 一圈圈台阶的露天矿坑 ---------- */
const groundVert = /* glsl */ `
uniform float uTime;
uniform vec2 uPit;
uniform float uMode;
attribute vec2 aPolar;
varying float vH;
varying vec2 vW;
varying float vDist;
varying float vS;
varying float vPd;

const float PR = 34.0;
const float PN = 6.0;
const float PD = 13.0;

vec3 permute(vec3 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }
float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
  m = m * m; m = m * m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}
float fbm(vec2 p) {
  float a = 0.5, s = 0.0;
  for (int i = 0; i < 5; i++) {
    s += a * snoise(p);
    p = p * 2.02 + vec2(13.1, 7.7);
    a *= 0.5;
  }
  return s;
}

void main() {
  vec2 w = position.xz;
  vW = w;
  vec2 p = w * 0.017 + vec2(uTime * 0.006, uTime * 0.004);
  float ridge = 1.0 - abs(snoise(p * 0.55 + 4.0));
  float h = (fbm(p) * 0.8 + ridge * ridge * 0.75) * 4.5;
  // 作业区是平的，越远起伏越大
  float dw = length(w - vec2(8.0, -31.0));
  h *= smoothstep(18.0, 36.0, dw) * (1.0 + 0.6 * smoothstep(60.0, 160.0, dw));
  h += ${GROUND.toFixed(2)};

  // 露天矿坑：台阶沿螺旋线逐级下降，形成一条连续的盘山道
  vec2 q = w - uPit;
  float d = uMode > 0.5 ? aPolar.x : length(q);
  float th = uMode > 0.5 ? aPolar.y : atan(-q.y, q.x);
  if (th < 0.0) th += 6.2831853;
  float th01 = th / 6.2831853;
  float t = max(0.0, 1.0 - d / PR);
  float s = t / 0.7 * PN + th01;
  float stair = floor(s) + smoothstep(0.72, 1.0, fract(s));
  float depth = clamp(stair - th01, 0.0, PN) * PD / PN;
  float m = 1.0 - smoothstep(PR * 0.98, PR * 1.25, d);
  h = mix(h, ${GROUND.toFixed(2)} - depth, m);
  vS = s;
  vPd = d;

  vH = h;
  vec4 mv = modelViewMatrix * vec4(w.x, h, w.y, 1.0);
  vDist = -mv.z;
  gl_Position = projectionMatrix * mv;
}
`;
const groundFrag = /* glsl */ `
uniform vec3 uBg;
uniform vec3 uLine;
uniform vec3 uGold;
uniform vec2 uPit;
uniform float uTime;
uniform float uMode;
uniform float uOp;
varying float vH;
varying vec2 vW;
varying float vDist;
varying float vS;
varying float vPd;

const float PR = 34.0;
const float PN = 6.0;

float contour(float f, float w) {
  float d = abs(fract(f - 0.5) - 0.5) / max(fwidth(f), 1e-5);
  return 1.0 - smoothstep(0.0, w, d);
}

void main() {
  // 地形面在矿坑处留空，由更精细的矿坑网格补上
  if (uMode < 0.5 && vPd < PR * 1.08) discard;
  if (uMode > 0.5 && vPd >= PR * 1.08) discard;

  float f = vH * 1.7;
  float minor = contour(f, 1.3);
  float major = contour(f / 5.0, 1.9);

  float fog = 1.0 - smoothstep(70.0, 235.0, vDist);
  float edge = (1.0 - smoothstep(120.0, 165.0, abs(vW.x - 40.0))) * (1.0 - smoothstep(180.0, 228.0, -vW.y));

  // 从矿坑向外扩散的扫描环，加上沿线条流动的明暗：远看像水面的波光
  float r = length(vW - uPit) / 170.0;
  float sw = fract(uTime * 0.05);
  float ring = exp(-pow((r - sw * 1.1) / 0.02, 2.0)) * (1.0 - sw);
  float tw = 0.78 + 0.42 * sin(vW.x * 0.21 + uTime * 0.9) * sin(vW.y * 0.17 - uTime * 0.7);

  vec3 col = uBg + vec3(0.018, 0.02, 0.024) * smoothstep(-3.0, 8.0, vH);
  vec3 lc = mix(uLine, uGold, major);
  lc = mix(lc, uGold * 1.35, clamp(ring, 0.0, 1.0));
  float a = (minor * 0.26 + major * 0.85) * tw * (1.0 + ring * 2.5);

  // 矿坑台阶的坡脚线和坡顶线
  float inPit = uMode * step(0.62, vS) * step(vS, PN + 0.9);
  float toe = contour(vS, 1.5) * inPit;
  float crest = contour(vS - 0.72, 1.1) * inPit;
  float pit = clamp(toe * 0.95 + crest * 0.45, 0.0, 1.0);
  lc = mix(lc, uGold * 1.25, pit);
  a = max(a * (1.0 - 0.45 * uMode * (1.0 - smoothstep(PR * 0.88, PR, vPd))), pit);

  col = mix(col, lc, clamp(a, 0.0, 1.0));
  col = mix(uBg, col, edge * fog);
  gl_FragColor = vec4(col, uOp);
}
`;

function buildGround(mobile: boolean) {
  // 地形面：直接按世界坐标排在 xz 平面上，高度由着色器给
  const X0 = -125, X1 = 205, Z0 = -13, Z1 = -230;
  const nx = mobile ? 170 : 330;
  const nz = mobile ? 110 : 217;
  const pos: number[] = [];
  const idx: number[] = [];
  for (let j = 0; j <= nz; j++)
    for (let i = 0; i <= nx; i++) pos.push(X0 + ((X1 - X0) * i) / nx, 0, Z0 + ((Z1 - Z0) * j) / nz);
  for (let j = 0; j < nz; j++)
    for (let i = 0; i < nx; i++) {
      const a = j * (nx + 1) + i;
      const b = a + nx + 1;
      idx.push(a, b, b + 1, a, b + 1, a + 1);
    }
  const planeGeo = new THREE.BufferGeometry();
  planeGeo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  planeGeo.setAttribute('aPolar', new THREE.Float32BufferAttribute(new Float32Array((pos.length / 3) * 2), 2));
  planeGeo.setIndex(idx);

  // 矿坑：极坐标网格，比地形面密，台阶才清晰
  const nr = mobile ? 100 : 170;
  const na = mobile ? 180 : 300;
  const pp: number[] = [];
  const polar: number[] = [];
  const pi: number[] = [];
  const r1 = PIT.r * 1.1;
  for (let i = 0; i <= nr; i++) {
    const d = (r1 * i) / nr;
    for (let j = 0; j <= na; j++) {
      const th = (j / na) * TAU;
      pp.push(PIT.x + d * Math.cos(th), 0, PIT.z - d * Math.sin(th));
      polar.push(d, th);
    }
  }
  for (let i = 0; i < nr; i++)
    for (let j = 0; j < na; j++) {
      const a = i * (na + 1) + j;
      const b = a + na + 1;
      pi.push(a, b, b + 1, a, b + 1, a + 1);
    }
  const pitGeo = new THREE.BufferGeometry();
  pitGeo.setAttribute('position', new THREE.Float32BufferAttribute(pp, 3));
  pitGeo.setAttribute('aPolar', new THREE.Float32BufferAttribute(polar, 2));
  pitGeo.setIndex(pi);

  const mat = (mode: number) =>
    new THREE.ShaderMaterial({
      vertexShader: groundVert,
      fragmentShader: groundFrag,
      uniforms: {
        uTime: { value: 0 },
        uOp: { value: 0 },
        uMode: { value: mode },
        uPit: { value: new THREE.Vector2(PIT.x, PIT.z) },
        // 直接写入 sRGB 数值，与页面背景色 #0a0c0f 保持一致
        uBg: { value: new THREE.Vector3(10 / 255, 12 / 255, 15 / 255) },
        uLine: { value: new THREE.Vector3(0.62, 0.64, 0.66) },
        uGold: { value: new THREE.Vector3(0.83, 0.67, 0.42) },
      },
      transparent: true,
      side: THREE.DoubleSide,
    });
  return { planeGeo, pitGeo, plane: mat(0), pit: mat(1) };
}

/** 关键帧插值：keys 为 [时刻, 数值]，时刻在 0–1 之间递增 */
function key(u: number, keys: [number, number][]) {
  for (let i = 0; i < keys.length - 1; i++) {
    const [t0, v0] = keys[i];
    const [t1, v1] = keys[i + 1];
    if (u <= t1) {
      const t = Math.min(1, Math.max(0, (u - t0) / (t1 - t0)));
      return v0 + (v1 - v0) * t * t * (3 - 2 * t);
    }
  }
  return keys[keys.length - 1][1];
}

const TRUCKS = 3;
const PIT_TRUCKS = 9;
const TRUCK_SCALE = 2.2;

export type Chase = { pos: THREE.Vector3; fwd: THREE.Vector3 };

/**
 * level：整块场景的可见程度。
 * fly：镜头跟飞的进度，0 表示飞机自己按时间循环飞过，0–2 表示由滚动带着沿航线往前飞。
 * chase：每帧把飞机的位置和朝向写进去，供外面的镜头跟随。
 */
export default function MineWorld({
  level,
  fly,
  chase,
  still,
  heli = false,
}: {
  level: React.RefObject<number>;
  fly: React.RefObject<number>;
  chase: React.RefObject<Chase>;
  still: boolean;
  /** 是否让一架直升机绕着矿场巡航（项目详情页用，和首页那架是同一架） */
  heli?: boolean;
}) {
  const g = useMemo(build, []);
  const truckGeo = useMemo(truckGeometry, []);
  const mats = useMemo(
    () => ({
      line: lineMaterial(),
      point: pointMaterial(),
      truck: new THREE.LineBasicMaterial({ color: raw('#e2b873'), transparent: true }),
    }),
    [],
  );
  const ground = useMemo(() => buildGround(typeof window !== 'undefined' && window.innerWidth < 768), []);
  const root = useRef<THREE.Group>(null);
  const upper = useRef<THREE.Group>(null);
  const boom = useRef<THREE.Group>(null);
  const stick = useRef<THREE.Group>(null);
  const bucket = useRef<THREE.Group>(null);
  const trucks = useRef<THREE.Group>(null);
  const pitTrucks = useRef<THREE.Group>(null);
  const heliGeo = useMemo(heliGeometry, []);
  const heliLamps = useMemo(
    () =>
      points([
        { p: [0.5, -0.04, 0], c: PALE, s: 260, a: 1 },
        { p: [-0.95, 0.4, 0], c: RED, s: 220, a: 1 },
      ]),
    [],
  );
  const heliRef = useRef<THREE.Group>(null);
  const heliRotor = useRef<THREE.LineSegments>(null);
  const plane = useRef<THREE.Group>(null);
  const planeBody = useRef<THREE.Group>(null);
  const tmp = useMemo(() => ({ a: new THREE.Vector3(), b: new THREE.Vector3() }), []);
  const time = useRef(still ? 3 : 0);

  useFrame((_, dt) => {
    const lv = level.current ?? 0;
    if (root.current) root.current.visible = lv > 0.01;
    if (lv <= 0.01) return;
    mats.line.uniforms.uOp.value = lv;
    mats.point.uniforms.uOp.value = lv;
    ground.plane.uniforms.uOp.value = lv;
    ground.pit.uniforms.uOp.value = lv;
    mats.truck.opacity = lv * 0.5; // 车身线条密，压暗一些免得被辉光冲白
    if (!still) time.current += dt;
    const T = time.current;
    ground.plane.uniforms.uTime.value = T;
    ground.pit.uniforms.uTime.value = T;

    // 挖掘机的作业循环：挖 → 提臂 → 回转到卡车上方 → 卸料 → 转回 → 落臂
    const u = (T / 9) % 1;
    if (upper.current) upper.current.rotation.y = key(u, [[0, 0], [0.38, 0], [0.55, 2.1], [0.68, 2.1], [0.86, 0], [1, 0]]);
    if (boom.current) boom.current.rotation.z = key(u, [[0, 0.25], [0.24, 0.2], [0.4, 0.78], [0.68, 0.72], [0.86, 0.75], [1, 0.25]]);
    if (stick.current) stick.current.rotation.z = key(u, [[0, -1.25], [0.24, -1.8], [0.4, -1.55], [0.55, -1.5], [0.68, -1.15], [0.86, -1.3], [1, -1.25]]);
    if (bucket.current) bucket.current.rotation.z = key(u, [[0, -0.5], [0.24, -1.9], [0.56, -1.9], [0.66, -0.2], [0.86, -0.5], [1, -0.5]]);

    // 卡车沿椭圆道路行驶
    trucks.current?.children.forEach((o, i) => {
      const a = T * 0.11 + (i / TRUCKS) * TAU;
      const p = roadAt(a);
      o.position.set(p[0], 0, p[2]);
      // 车头朝行驶方向
      const dx = -ROAD.rx * Math.sin(a);
      const dz = ROAD.rz * Math.cos(a);
      o.rotation.y = Math.atan2(-dz, dx);
    });

    // 矿坑里的卡车：下行靠外、上行靠里，各走各的道，会车时不重叠
    pitTrucks.current?.children.forEach((o, i) => {
      const down = i % 2 === 0;
      const ph = (T * 0.0045 + i / PIT_TRUCKS) % 1;
      const q = down ? ph : 1 - ph;
      const lane = down ? 0.16 : 0.54;
      const p = pitRoad(q, lane);
      const n = pitRoad(Math.min(1, Math.max(0, q + (down ? 0.0015 : -0.0015))), lane);
      o.position.set(p[0], p[1], p[2]);
      o.rotation.y = Math.atan2(-(n[2] - p[2]), n[0] - p[0]);
      // 在坑口和坑底淡入淡出
      const e0 = Math.min(1, q / 0.02);
      const e1 = Math.min(1, (1 - q) / 0.03);
      o.scale.setScalar(Math.max(0.001, Math.min(e0, e1)));
    });

    // 直升机：绕着作业区和矿坑兜大圈，忽高忽低
    if (heliRef.current) {
      const a = T * 0.15 + 2.2;
      const at = (b: number, out: THREE.Vector3) => out.set(18 + 42 * Math.cos(b), 11 + 2.5 * Math.sin(b * 2 + 1), -58 + 36 * Math.sin(b));
      at(a, tmp.a);
      at(a + 0.02, tmp.b);
      heliRef.current.position.copy(tmp.a);
      heliRef.current.lookAt(tmp.b);
      if (heliRotor.current) heliRotor.current.rotation.y = T * 21;
    }

    // 飞机：平时按时间从左后方飞过矿场；镜头跟飞时改由滚动进度带着沿航线往前
    if (plane.current) {
      const f = fly.current ?? 0;
      const w = Math.min(1, f * 4);
      const uTime = ((T / 15) % 1) * 0.55;
      const uScroll = 0.13 + 0.3 * Math.min(2, f) + 0.006 * Math.sin(T * 0.6); // f = 1 时正飞向矿坑，之后从它上空掠过
      const u = Math.min(0.985, uTime + (uScroll - uTime) * w);
      FLIGHT.getPointAt(u, tmp.a);
      FLIGHT.getTangentAt(u, tmp.b);
      plane.current.position.copy(tmp.a);
      plane.current.lookAt(tmp.a.x + tmp.b.x, tmp.a.y + tmp.b.y, tmp.a.z + tmp.b.z);
      if (planeBody.current) planeBody.current.rotation.x = 0.14 * Math.sin(T * 0.5); // 轻微侧倾
      const c = chase.current;
      if (c) {
        c.pos.copy(tmp.a);
        c.fwd.copy(tmp.b);
      }
    }
  });

  // 一辆卡车：模型是车头朝 +x、高度沿 z，这里转成高度沿 y
  const Truck = () => (
    <group scale={TRUCK_SCALE}>
      <lineSegments geometry={truckGeo} material={mats.truck} rotation={[-Math.PI / 2, 0, 0]} frustumCulled={false} />
      <points geometry={g.truckLamps} material={mats.point} frustumCulled={false} />
    </group>
  );

  return (
    <group ref={root} visible={false}>
      {/* 地面：和首页同一种画法的等高线地形，先画，后面的线条物件叠在上面 */}
      <mesh geometry={ground.planeGeo} material={ground.plane} frustumCulled={false} renderOrder={-5} />
      <mesh geometry={ground.pitGeo} material={ground.pit} frustumCulled={false} renderOrder={-5} />
      <lineSegments geometry={g.land} material={mats.line} frustumCulled={false} />
      <points geometry={g.lamps} material={mats.point} frustumCulled={false} />

      {/* 挖掘机：整体转半圈，让"正前方"朝向料堆（-x） */}
      <group position={[EX[0], EX[1], EX[2]]} rotation={[0, Math.PI, 0]} scale={1.15}>
        <lineSegments geometry={g.under} material={mats.line} frustumCulled={false} />
        <group ref={upper}>
          <lineSegments geometry={g.upper} material={mats.line} frustumCulled={false} />
          <points geometry={g.exLamps} material={mats.point} frustumCulled={false} />
          <group ref={boom} position={[0.9, 1.5, 0]}>
            <lineSegments geometry={g.boom} material={mats.line} frustumCulled={false} />
            <group ref={stick} position={[3.4, 0, 0]}>
              <lineSegments geometry={g.stick} material={mats.line} frustumCulled={false} />
              <group ref={bucket} position={[2.3, 0, 0]}>
                <lineSegments geometry={g.bucket} material={mats.line} frustumCulled={false} />
              </group>
            </group>
          </group>
        </group>
      </group>

      {/* 停在挖掘机右前方等装车的卡车：挖掘机回转约 120° 后正好在它上方卸料 */}
      <group position={[EX[0] + 3.4, 0, EX[2] + 5.4]} rotation={[0, 0.5, 0]}>
        <Truck />
      </group>
      <group ref={trucks}>
        {Array.from({ length: TRUCKS }, (_, i) => (
          <group key={i}>
            <Truck />
          </group>
        ))}
      </group>

      <group ref={pitTrucks}>
        {Array.from({ length: PIT_TRUCKS }, (_, i) => (
          <group key={i}>
            <Truck />
          </group>
        ))}
      </group>

      {heli && (
        <group ref={heliRef}>
          <group rotation={[0.12, -Math.PI / 2, -0.12]} scale={3.4}>
            <lineSegments geometry={heliGeo.body} material={mats.truck} frustumCulled={false} />
            <lineSegments ref={heliRotor} geometry={heliGeo.rotor} material={mats.truck} position={[0.02, 0.36, 0]} frustumCulled={false} />
            <points geometry={heliLamps} material={mats.point} frustumCulled={false} />
          </group>
        </group>
      )}

      {/* 飞机：外层组负责位置和航向（lookAt 让 +z 朝前），内层把机头从 +x 转到 +z 并做侧倾 */}
      <group ref={plane}>
        <group ref={planeBody} rotation={[0, -Math.PI / 2, 0]} scale={1.35}>
          <lineSegments geometry={g.plane} material={mats.line} frustumCulled={false} />
          <points geometry={g.planeLamps} material={mats.point} frustumCulled={false} />
        </group>
      </group>
    </group>
  );
}
