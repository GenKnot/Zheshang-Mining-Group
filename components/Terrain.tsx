'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { CopyShader } from 'three/examples/jsm/shaders/CopyShader.js';
import { view } from '../lib/store';
import { webglAvailable } from '../lib/webgl';

const vertexShader = /* glsl */ `
uniform float uTime;
uniform float uAmp;
uniform vec2 uPit;
uniform float uMode;
attribute vec2 aPolar;
varying float vH;
varying vec2 vPos;
varying float vDist;
varying float vS;
varying float vPd;

const float PR = 4.2;
const float PN = 5.0;
const float PD = 2.4;
const float RIM = 0.45;
const float HOLE = 0.95;

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
  vPos = position.xy;
  vec2 p = position.xy * 0.11 + vec2(uTime * 0.006, uTime * 0.004);
  float ridge = 1.0 - abs(snoise(p * 0.55 + 4.0));
  float h = (fbm(p) * 0.8 + ridge * ridge * 0.75) * uAmp;

  // 露天矿坑：台阶沿螺旋线逐级下降，形成一条连续的盘山道
  vec2 q = position.xy - uPit;
  float d = uMode > 0.5 ? aPolar.x : length(q);
  float th = uMode > 0.5 ? aPolar.y : atan(q.y, q.x);
  if (th < 0.0) th += 6.2831853;
  float th01 = th / 6.2831853;
  float t = max(0.0, 1.0 - d / PR);
  float s = t / 0.7 * PN + th01;
  float stair = floor(s) + smoothstep(0.55, 1.0, fract(s));
  float depth = clamp(stair - th01, 0.0, PN) * PD / PN;
  float m = 1.0 - smoothstep(PR * 0.98, PR * 1.22, d);
  h = mix(h, RIM - depth, m);
  vS = s;
  vPd = d;

  vH = h;
  vec4 mv = modelViewMatrix * vec4(position.xy, h, 1.0);
  vDist = -mv.z;
  gl_Position = projectionMatrix * mv;
}
`;

const fragmentShader = /* glsl */ `
uniform vec3 uBg;
uniform vec3 uLine;
uniform vec3 uGold;
uniform float uTime;
uniform float uIntro;
uniform float uBand;
uniform float uBandOn;
uniform float uMode;
varying float vH;
varying vec2 vPos;
varying float vDist;
varying float vS;
varying float vPd;

const float PR = 4.2;
const float PN = 5.0;
const float PD = 2.4;
const float RIM = 0.45;
const float HOLE = 0.95;

float contour(float f, float w) {
  float d = abs(fract(f - 0.5) - 0.5) / max(fwidth(f), 1e-5);
  return 1.0 - smoothstep(0.0, w, d);
}

void main() {
  // 地形面在矿坑处留空，由更精细的矿坑网格补上；矿坑底部留出斜坡道入口
  if (uMode < 0.5 && vPd < PR * 1.08) discard;
  if (uMode > 0.5 && (vPd >= PR * 1.08 || vPd < HOLE)) discard;

  float f = vH * 6.0;
  float minor = contour(f, 1.3);
  float major = contour(f / 5.0, 1.9);

  float r = length(vPos) / 32.0;
  float edge = 1.0 - smoothstep(0.5, 0.98, r);
  float fog = 1.0 - smoothstep(9.0, 36.0, vDist);
  float reveal = smoothstep(r - 0.2, r, uIntro * 1.4);

  // 高亮某一海拔带（对应当前业务）
  float band = exp(-pow((vH - uBand) / 0.2, 2.0)) * uBandOn;

  // 由中心向外扩散的扫描环
  float sw = fract(uTime * 0.05);
  float ring = exp(-pow((r - sw * 1.1) / 0.025, 2.0)) * (1.0 - sw);

  vec3 col = uBg + vec3(0.018, 0.02, 0.024) * smoothstep(-1.0, 2.2, vH);
  col += uGold * band * 0.09;

  vec3 lc = mix(uLine, uGold, major);
  lc = mix(lc, uGold * 1.35, clamp(band + ring, 0.0, 1.0));
  float a = (minor * 0.26 + major * 0.8) * (1.0 + band * 1.6 + ring * 2.5);

  // 矿坑台阶的坡脚线、坡顶线，以及入口的圈线
  float inPit = uMode * step(0.62, vS) * step(vS, PN + 0.9);
  float toe = contour(vS, 1.5) * inPit;
  float crest = contour(vS - 0.55, 1.1) * inPit;
  float collar = uMode * (1.0 - smoothstep(0.0, 2.2, abs(vPd - HOLE - 0.03) / max(fwidth(vPd), 1e-5)));
  float pit = clamp(toe * 0.95 + crest * 0.4 + collar, 0.0, 1.0);
  lc = mix(lc, uGold * 1.25, pit);
  a = max(a * (1.0 - 0.45 * uMode * (1.0 - smoothstep(PR * 0.88, PR, vPd))), pit);

  col = mix(col, lc, clamp(a, 0.0, 1.0) * reveal);
  col = mix(uBg, col, edge * fog);
  gl_FragColor = vec4(col, 1.0);
}
`;

// 相机随滚动进度移动的关键帧
const KEYS: { p: number; pos: [number, number, number]; look: [number, number, number] }[] = [
  { p: 0.0, pos: [0, 4.4, 12], look: [0, 0.6, 0] },
  { p: 0.2, pos: [0, 9, 9], look: [0, 0, 0] },
  { p: 0.4, pos: [-7, 7, 7], look: [0, 0, 0] },
  { p: 0.75, pos: [7, 7, 7], look: [0, 0, 0] },
  { p: 1.0, pos: [0, 18, 0.6], look: [0, 0, 0] },
];
const BANDS = [-0.3, 0.35, 1.0, 1.65];

// 矿坑参数，需与着色器里的常量保持一致
const PR = 4.2;
const PN = 5;
const PD = 2.4;
const RIM = 0.45;
const HOLE = 0.95;
const TAU = Math.PI * 2;
const GOLD = new THREE.Color('#d4ab6b');
const PALE = new THREE.Color('#f3dcae');
const GREY = new THREE.Color('#b3ac9c');

/** 矿坑的极坐标网格：比地形面更密，台阶才够清晰 */
function pitGeometry(cx: number, cy: number, nr: number, na: number) {
  const pos: number[] = [];
  const polar: number[] = [];
  const idx: number[] = [];
  const r0 = HOLE * 0.9;
  const r1 = PR * 1.1;
  for (let i = 0; i <= nr; i++) {
    const d = r0 + ((r1 - r0) * i) / nr;
    for (let j = 0; j <= na; j++) {
      const th = (j / na) * TAU;
      pos.push(cx + d * Math.cos(th), cy + d * Math.sin(th), 0);
      polar.push(d, th);
    }
  }
  const w = na + 1;
  for (let i = 0; i < nr; i++)
    for (let j = 0; j < na; j++) {
      const a = i * w + j;
      const b = a + w;
      idx.push(a, b, b + 1, a, b + 1, a + 1);
    }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('aPolar', new THREE.Float32BufferAttribute(polar, 2));
  g.setIndex(idx);
  return g;
}

/** 线框矿用卡车：车头朝 +x，长度约为 1，轮子落在 z = 0 */
function truckGeometry() {
  const v: number[] = [];
  type P = number[];
  const seg = (a: P, b: P) => v.push(a[0], a[1], a[2], b[0], b[1], b[2]);
  const loop = (pts: P[]) => pts.forEach((p, i) => seg(p, pts[(i + 1) % pts.length]));
  const box = (x0: number, x1: number, y0: number, y1: number, z0: number, z1: number) => {
    const c = [
      [x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0],
      [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1],
    ];
    for (let i = 0; i < 4; i++) {
      seg(c[i], c[(i + 1) % 4]);
      seg(c[i + 4], c[((i + 1) % 4) + 4]);
      seg(c[i], c[i + 4]);
    }
  };
  const ring = (x: number, y: number, z: number, r: number, n = 14) =>
    Array.from({ length: n }, (_, i) => [x + r * Math.cos((i / n) * TAU), y, z + r * Math.sin((i / n) * TAU)]);

  // 车架与前保险杠
  box(-0.5, 0.5, -0.13, 0.13, 0.2, 0.27);
  box(0.5, 0.56, -0.25, 0.25, 0.15, 0.3);

  // 车轮：内外两圈轮胎、轮毂与胎面
  const WR = 0.15;
  for (const x of [-0.28, 0.3])
    for (const k of [-0.2, 0.2]) {
      const a = ring(x, k - 0.06, WR, WR);
      const b = ring(x, k + 0.06, WR, WR);
      loop(a);
      loop(b);
      for (let i = 0; i < a.length; i += 2) seg(a[i], b[i]);
      const out = k > 0 ? k + 0.06 : k - 0.06;
      loop(ring(x, out, WR, 0.085, 10));
      loop(ring(x, out, WR, 0.035, 6));
    }

  // 驾驶室（偏左），带前窗与侧窗
  box(0.22, 0.5, -0.23, 0.05, 0.27, 0.53);
  loop([[0.5, -0.2, 0.39], [0.5, 0.02, 0.39], [0.5, 0.02, 0.5], [0.5, -0.2, 0.5]]);
  loop([[0.27, -0.23, 0.39], [0.46, -0.23, 0.39], [0.46, -0.23, 0.5], [0.27, -0.23, 0.5]]);
  // 右侧平台、护栏与爬梯
  box(0.22, 0.5, 0.05, 0.23, 0.27, 0.33);
  for (const x of [0.24, 0.36, 0.48]) seg([x, 0.23, 0.33], [x, 0.23, 0.45]);
  seg([0.24, 0.23, 0.45], [0.48, 0.23, 0.45]);
  seg([0.56, 0.1, 0.15], [0.56, 0.1, 0.33]);
  seg([0.56, 0.18, 0.15], [0.56, 0.18, 0.33]);
  for (const z of [0.19, 0.24, 0.29]) seg([0.56, 0.1, z], [0.56, 0.18, z]);
  // 排气管
  seg([0.2, 0.25, 0.33], [0.2, 0.25, 0.62]);

  // 车斗：尾部上翘，前端护板伸出盖住驾驶室
  const side = (k: number): P[] => [
    [-0.36, k, 0.27], [0.18, k, 0.27], [0.18, k, 0.58], [0.52, k * 0.86, 0.62],
    [0.52, k * 0.86, 0.66], [0.18, k, 0.66], [-0.6, k, 0.66], [-0.6, k, 0.56],
  ];
  const L = side(-0.27);
  const R = side(0.27);
  loop(L);
  loop(R);
  L.forEach((p, i) => seg(p, R[i]));
  for (const k of [-0.27, 0.27]) {
    for (const x of [-0.2, -0.02]) seg([x, k, 0.27], [x, k, 0.66]); // 加强筋
    seg([-0.44, k, 0.37], [-0.44, k, 0.66]);
    seg([-0.6, k, 0.61], [0.18, k, 0.61]);
  }
  // 斗口内沿与矿石堆
  const rim: P[] = [[-0.56, -0.23, 0.66], [0.14, -0.23, 0.66], [0.14, 0.23, 0.66], [-0.56, 0.23, 0.66]];
  loop(rim);
  const heap: P[] = [[-0.3, -0.06, 0.8], [-0.1, 0.07, 0.83], [-0.42, 0.08, 0.76]];
  loop(heap);
  rim.forEach((p, i) => seg(p, heap[i === 1 || i === 2 ? 1 : i === 0 ? 0 : 2]));
  seg(rim[0], heap[2]);
  seg(rim[1], heap[0]);
  seg(rim[2], heap[2]);

  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
  return g;
}

/** 一组发光点（车灯、顶灯、浮尘）的几何体 */
function glowGeometry(pts: number[][], color: THREE.Color, size: number, alpha = 1) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pts.flat(), 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(pts.flatMap(() => [color.r, color.g, color.b]), 3));
  g.setAttribute('aA', new THREE.Float32BufferAttribute(pts.map(() => alpha), 1));
  g.setAttribute('aS', new THREE.Float32BufferAttribute(pts.map(() => size), 1));
  return g;
}

/** 盘山道上的位置（地形面的本地坐标：x、y 为平面，z 为高度） */
function roadAt(q: number, lane: number, cx: number, cy: number, out: THREE.Vector3) {
  const uMax = PN - lane;
  const k = Math.min(1, q / 0.92);
  const u = k * uMax;
  let d = PR * (1 - (0.7 * (lane + u)) / PN);
  let z = RIM - (u * PD) / PN;
  if (q > 0.92) {
    // 到达坑底后驶向斜坡道入口
    const e = (q - 0.92) / 0.08;
    d += (HOLE * 0.5 - d) * e;
    z += (RIM - PD - 0.25 - z) * e;
  }
  const th = -TAU * u;
  return out.set(cx + d * Math.cos(th), cy + d * Math.sin(th), z);
}

const tunnelVert = /* glsl */ `
attribute vec3 color;
attribute float aA;
attribute float aS;
varying vec3 vC;
varying float vA;
varying float vDist;
void main() {
  vC = color;
  vA = aA;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vDist = -mv.z;
  gl_Position = projectionMatrix * mv;
  gl_PointSize = clamp(aS / max(vDist, 0.4), 1.5, 110.0);
}
`;
const tunnelFrag = /* glsl */ `
uniform float uPoint;
uniform float uOp;
varying vec3 vC;
varying float vA;
varying float vDist;
void main() {
  float fog = (1.0 - smoothstep(5.0, 34.0, vDist)) * smoothstep(0.15, 1.1, vDist);
  float shape = 1.0;
  if (uPoint > 0.5) {
    // 柔和的光晕加一个亮芯
    float d = length(gl_PointCoord - 0.5) * 2.0;
    shape = pow(max(0.0, 1.0 - d), 2.4) * 0.75 + (1.0 - smoothstep(0.06, 0.2, d));
  }
  gl_FragColor = vec4(vC, clamp(vA * fog * shape * uOp, 0.0, 1.0));
}
`;
const tunnelMaterial = (point: boolean) =>
  new THREE.ShaderMaterial({
    vertexShader: tunnelVert,
    fragmentShader: tunnelFrag,
    uniforms: { uPoint: { value: point ? 1 : 0 }, uOp: { value: 1 } },
    transparent: true,
    depthWrite: false,
    blending: point ? THREE.AdditiveBlending : THREE.NormalBlending,
  });

/** 斜坡道与井下巷道：支护拱架、护网、风筒、管线、硐室、顶灯与浮尘 */
function buildTunnel(X: number, Z: number) {
  const pts: [number, number, number][] = [
    [X, 7.5, Z + 7],
    [X, 3.2, Z + 3.6],
    [X, 0.2, Z + 1.5],
    [X, -1.95, Z],
    [X, -4.2, Z - 2.2],
    [X - 0.8, -6.3, Z - 5.5],
    [X - 3.5, -8, Z - 10.5],
    [X - 8, -9, Z - 13.5],
    [X - 13, -10, Z - 11.5],
    [X - 16, -11, Z - 6.5],
    [X - 15, -12, Z - 0.5],
    [X - 11, -13, Z + 3.5],
    [X - 6, -14, Z + 3.5],
    [X - 2, -15, Z + 0.5],
    [X + 1, -16, Z - 4.5],
    [X + 1, -17, Z - 10.5],
  ];
  const curve = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p)), false, 'centripetal');
  curve.arcLengthDivisions = 600;
  const len = curve.getLength();

  const pos: number[] = [];
  const col: number[] = [];
  const alp: number[] = [];
  const lamps: number[][] = [];
  const dust: number[][] = [];
  const P = new THREE.Vector3();
  const T = new THREE.Vector3();
  const S = new THREE.Vector3();
  const U = new THREE.Vector3();
  const Y = new THREE.Vector3(0, 1, 0);
  const frame = (u: number) => {
    curve.getPointAt(u, P);
    curve.getTangentAt(u, T);
    S.crossVectors(T, Y).normalize();
    U.crossVectors(S, T).normalize();
  };
  const at = (a: number, b: number) => [P.x + S.x * a + U.x * b, P.y + S.y * a + U.y * b, P.z + S.z * a + U.z * b];
  const seg = (a: number[], b: number[], c: THREE.Color, al: number) => {
    pos.push(a[0], a[1], a[2], b[0], b[1], b[2]);
    col.push(c.r, c.g, c.b, c.r, c.g, c.b);
    alp.push(al, al);
  };
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;

  // 马蹄形断面
  const W = 0.78;
  const FL = -0.55;
  const SP = 0.12;
  const prof: [number, number][] = [[-W, FL], [-W, SP]];
  for (let i = 1; i < 12; i++) prof.push([-W * Math.cos((i / 12) * Math.PI), SP + W * Math.sin((i / 12) * Math.PI)]);
  prof.push([W, SP], [W, FL]);
  // 纵向线条：底角、起拱线、拱顶，以及右壁上的三根管线
  const strings: [number, number][] = [
    [-W, FL], [W, FL], [-W, SP], [W, SP], [0, SP + W],
    [W - 0.035, SP - 0.06], [W - 0.035, SP - 0.14], [W - 0.035, SP - 0.22],
  ];
  // 左上方的风筒
  const DX = -0.36;
  const DY = SP + 0.38;
  const DR = 0.17;
  const duct = (k: number): [number, number] => [DX + DR * Math.cos((k / 10) * TAU), DY + DR * Math.sin((k / 10) * TAU)];

  let u0 = 0;
  while (u0 < 1 && curve.getPointAt(u0, P).y > -2.35) u0 += 0.002;
  const step = 0.8 / len;
  let prev: number[][] | null = null;
  let prevRing: number[][] | null = null;
  let prevDuct: number[][] | null = null;
  let prevMid: number[] | null = null;
  let niche: number[][] | null = null;
  let n = 0;
  for (let u = u0; u <= 1; u += step, n++) {
    frame(u);
    const heavy = n % 5 === 0;
    const ring = prof.map(([a, b]) => at(a, b));
    for (let i = 0; i < ring.length; i++)
      seg(ring[i], ring[(i + 1) % ring.length], heavy ? PALE : GREY, heavy ? 1 : 0.7);
    if (heavy) {
      // 主拱架画成内外两道
      const inner = prof.map(([a, b]) => at(a * 0.93, b > FL ? b * 0.93 : b));
      for (let i = 0; i < inner.length - 1; i++) seg(inner[i], inner[i + 1], GOLD, 0.9);
    }
    // 拱部的菱形护网
    if (prevRing)
      for (let i = 1; i < ring.length - 2; i++) {
        seg(prevRing[i], ring[i + 1], GREY, 0.17);
        seg(prevRing[i + 1], ring[i], GREY, 0.17);
      }
    const cur = strings.map(([a, b]) => at(a, b));
    if (prev) cur.forEach((c, i) => seg(prev![i], c, i >= 5 ? PALE : GOLD, i >= 5 ? 0.5 : 0.65));
    if (heavy) for (let i = 5; i < 8; i++) seg(cur[i], at(W, strings[i][1]), PALE, 0.6); // 管线托架

    // 风筒：每个断面一个圈，圈与圈之间拉线，主拱架处加吊挂
    const dr = Array.from({ length: 10 }, (_, k) => at(...duct(k)));
    dr.forEach((p, k) => seg(p, dr[(k + 1) % 10], GOLD, n % 2 ? 0.3 : 0.6));
    if (prevDuct) for (let k = 0; k < 10; k += 2) seg(prevDuct[k], dr[k], GOLD, 0.4);
    if (heavy) seg(at(DX, DY + DR), at(DX * 1.25, DY + DR + 0.14), PALE, 0.6);

    // 底板：横向格线与中线虚线
    seg(at(-W, FL), at(W, FL), GREY, 0.22);
    const mid = at(0, FL);
    if (prevMid && n % 2) seg(prevMid, mid, PALE, 0.55);

    // 左壁每隔一段开一个硐室
    const nb = [at(-W, FL), at(-W, SP - 0.1), at(-W - 0.55, SP - 0.1), at(-W - 0.55, FL)];
    if (n % 13 === 6) niche = nb;
    else if (niche && n % 13 === 8) {
      for (const q of [niche, nb]) for (let i = 0; i < 3; i++) seg(q[i], q[i + 1], PALE, 0.75);
      for (let i = 0; i < 4; i++) seg(niche[i], nb[i], i > 1 ? GOLD : PALE, 0.7);
      seg(niche[2], nb[3], GREY, 0.3);
      seg(niche[3], nb[2], GREY, 0.3);
      niche = null;
    }

    if (heavy) {
      seg(at(0, SP + W), at(0, SP + W - 0.09), PALE, 0.9);
      lamps.push(at(0, SP + W - 0.1));
    }
    for (let i = 0; i < 4; i++) dust.push(at((rnd() - 0.5) * 1.4, FL + 0.08 + rnd() * 1.2));
    prev = cur;
    prevRing = ring;
    prevDuct = dr;
    prevMid = mid;
  }

  const lines = new THREE.BufferGeometry();
  lines.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  lines.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  lines.setAttribute('aA', new THREE.Float32BufferAttribute(alp, 1));
  return {
    curve,
    lines,
    lampGeo: glowGeometry(lamps, PALE, 300, 0.95),
    dustGeo: glowGeometry(dust, GOLD, 13, 0.55),
    u0,
    floor: FL,
  };
}

// 后期处理按原始数值直通输出，所以颜色都以"不做色彩空间转换"的方式写入
const raw = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return new THREE.Color().setRGB(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255, THREE.LinearSRGBColorSpace);
};

/** 辉光：亮的线条和灯向外晕开一圈柔光 */
function Bloom({ mobile }: { mobile: boolean }) {
  const { gl, scene, camera, size } = useThree();
  const composer = useMemo(() => {
    // 自带多重采样的渲染目标，否则细线会出现锯齿
    const rt = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: 4 });
    const c = new EffectComposer(gl, rt);
    c.addPass(new RenderPass(scene, camera));
    c.addPass(new UnrealBloomPass(new THREE.Vector2(256, 256), mobile ? 0.36 : 0.42, 0.5, 0.34));
    c.addPass(new ShaderPass(CopyShader));
    return c;
  }, [gl, scene, camera, mobile]);

  useEffect(() => {
    scene.background = new THREE.Color().setRGB(10 / 255, 12 / 255, 15 / 255, THREE.LinearSRGBColorSpace);
    return () => {
      scene.background = null;
    };
  }, [scene]);
  useEffect(() => {
    composer.setPixelRatio(gl.getPixelRatio());
    composer.setSize(size.width, size.height);
  }, [composer, gl, size]);
  useEffect(() => () => composer.dispose(), [composer]);
  // 优先级大于 0：由这里接管每一帧的绘制
  useFrame(() => composer.render(), 1);
  return null;
}

const DOWN = 4; // 下行车辆数
const UPHILL = 3; // 上行车辆数
const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

function Scene({ segments, still, mobile }: { segments: number; still: boolean; mobile: boolean }) {
  const s = useRef({ p: 0, band: 0, on: 0, mx: 0, my: 0, intro: 0, w: 0, tau: 0, time: 0, shift: 0 });
  const look = useMemo(() => new THREE.Vector3(), []);
  const tmp = useMemo(() => ({ a: new THREE.Vector3(), b: new THREE.Vector3(), f: new THREE.Vector3(), l: new THREE.Vector3(), u: new THREE.Vector3(), m: new THREE.Matrix4() }), []);
  const mat = useRef<THREE.ShaderMaterial>(null);
  const pitMat = useRef<THREE.ShaderMaterial>(null);
  const trucks = useRef<THREE.Group>(null);
  const lead = useRef<THREE.Group>(null);
  // 所有卡车共用同一份材质，颜色与矿坑台阶线一致
  const truckMat = useMemo(() => new THREE.LineBasicMaterial({ color: raw('#e2b873'), transparent: true }), []);
  const leadMat = useMemo(() => new THREE.LineBasicMaterial({ color: raw('#e2b873') }), []);
  const lineMat = useMemo(() => tunnelMaterial(false), []);
  const glowMat = useMemo(() => tunnelMaterial(true), []);
  const truckGlow = useMemo(() => tunnelMaterial(true), []);
  // 车灯：前灯偏白，尾灯偏橙
  const headGeo = useMemo(() => glowGeometry([[0.58, -0.18, 0.24], [0.58, 0.18, 0.24]], new THREE.Color('#fff1cf'), 130), []);
  const tailGeo = useMemo(() => glowGeometry([[-0.61, -0.2, 0.5], [-0.61, 0.2, 0.5]], new THREE.Color('#ff9a4d'), 150), []);

  // 矿坑中心（地形面本地坐标）：宽屏放在右侧，竖屏放在远处、标题上方
  const [cx, cy] = mobile ? [0, 6] : [4.6, -0.6];

  const { uniforms, pitUniforms } = useMemo(() => {
    const shared = {
      uTime: { value: 0 },
      uAmp: { value: 1.7 },
      uIntro: { value: 0 },
      uBand: { value: 0 },
      uBandOn: { value: 0 },
      uPit: { value: new THREE.Vector2(cx, cy) },
      // 直接写入 sRGB 数值，与页面背景色 #0a0c0f 保持一致
      uBg: { value: new THREE.Vector3(10 / 255, 12 / 255, 15 / 255) },
      uLine: { value: new THREE.Vector3(0.62, 0.64, 0.66) },
      uGold: { value: new THREE.Vector3(0.83, 0.67, 0.42) },
    };
    return { uniforms: { ...shared, uMode: { value: 0 } }, pitUniforms: { ...shared, uMode: { value: 1 } } };
  }, [cx, cy]);

  const pitGeo = useMemo(() => pitGeometry(cx, cy, mobile ? 90 : 150, mobile ? 150 : 240), [cx, cy, mobile]);
  const truckGeo = useMemo(truckGeometry, []);
  const tunnel = useMemo(() => buildTunnel(cx, -cy), [cx, cy]);

  useFrame(({ camera, size }, dt) => {
    const st = s.current;
    const k = Math.min(1, dt * 3);
    st.p += (view.p - st.p) * k;
    st.mx += (view.mx - st.mx) * k * 0.6;
    st.my += (view.my - st.my) * k * 0.6;
    if (view.ready) st.intro = Math.min(1, st.intro + dt / 2.6);
    st.on += ((view.biz >= 0 ? 1 : 0) - st.on) * k;
    if (view.biz >= 0) st.band += (BANDS[view.biz] - st.band) * k;
    if (!still) st.time += dt;

    // 业务版块里：镜头先飞向矿坑，再沿斜坡道进入井下
    const inBiz = view.biz >= 0;
    st.w += ((inBiz ? smooth(0.04, 0.2, view.bizL) : 0) - st.w) * k;
    st.tau += (Math.min(1, Math.max(0, (view.bizL - 0.04) / 0.96)) - st.tau) * k;

    let i = 0;
    while (i < KEYS.length - 2 && st.p > KEYS[i + 1].p) i++;
    const a = KEYS[i];
    const b = KEYS[i + 1];
    let t = Math.min(1, Math.max(0, (st.p - a.p) / (b.p - a.p)));
    t = t * t * (3 - 2 * t);

    camera.position.set(
      a.pos[0] + (b.pos[0] - a.pos[0]) * t + st.mx * 0.7,
      a.pos[1] + (b.pos[1] - a.pos[1]) * t - st.my * 0.35,
      a.pos[2] + (b.pos[2] - a.pos[2]) * t,
    );
    look.set(
      a.look[0] + (b.look[0] - a.look[0]) * t,
      a.look[1] + (b.look[1] - a.look[1]) * t,
      a.look[2] + (b.look[2] - a.look[2]) * t,
    );
    // 竖屏首屏：镜头多俯一些，让远处的矿坑落在标题上方
    if (mobile && i === 0) look.y -= 2.1 * (1 - t);

    const camU = st.tau * 0.84;
    if (st.w > 0.001) {
      tunnel.curve.getPointAt(camU, tmp.a);
      tunnel.curve.getPointAt(Math.min(1, camU + 0.03), tmp.b);
      tmp.a.y += 0.08;
      tmp.b.x += st.mx * 0.5;
      tmp.b.y -= st.my * 0.3;
      camera.position.lerp(tmp.a, st.w);
      look.lerp(tmp.b, st.w);
    }
    camera.lookAt(look);
    const cam = camera as THREE.PerspectiveCamera;
    // 井下：视角放宽；宽屏时把巷道的消失点移到右侧，给左边的文字让位
    const deep = st.w * smooth(0.1, 0.3, st.tau);
    const fov = 42 + 24 * deep;
    const wide = Math.min(1, Math.max(0, (size.width / size.height - 0.9) / 0.6));
    const shift = deep * (0.17 * wide + 0.31 * (1 - wide));
    if (Math.abs(cam.fov - fov) > 0.01 || Math.abs(st.shift - shift) > 0.0005) {
      cam.fov = fov;
      st.shift = shift;
      // 竖屏时改为把消失点下移到业务列表的下方
      // setViewOffset 会把宽高比改成"全尺寸"的比例，所以必须传真实的画布尺寸
      const { width: w, height: h } = size;
      if (shift > 0.0005) cam.setViewOffset(w, h, -0.17 * deep * wide * w, -0.31 * deep * (1 - wide) * h, w, h);
      else {
        cam.clearViewOffset();
        cam.aspect = w / h;
        cam.updateProjectionMatrix();
      }
    }

    // R3F 会复制 uniforms 对象，所以要写到材质自己的那一份上
    for (const m of [mat.current, pitMat.current]) {
      const u = m?.uniforms;
      if (!u) continue;
      u.uTime.value = st.time;
      u.uIntro.value = still ? 1 : st.intro;
      u.uBand.value = st.band;
      u.uBandOn.value = st.on * (1 - st.w);
    }

    // 盘山道上的卡车
    const g = trucks.current;
    if (g) {
      const show = (still ? 1 : smooth(0.55, 1, st.intro)) * (1 - smooth(0.5, 0.9, st.w));
      g.visible = show > 0.01;
      // 远处的小车线条很密，压暗一些，免得被辉光冲成一团白
      truckMat.opacity = show * 0.5;
      truckGlow.uniforms.uOp.value = show * 0.55;
      g.children.forEach((o, n) => {
        const down = n < DOWN;
        const count = down ? DOWN : UPHILL;
        const base = ((down ? n : n - DOWN) + 0.35) / count + st.time / 150;
        const q0 = base - Math.floor(base);
        const q = down ? q0 : 1 - q0;
        const lane = down ? 0.36 : 0.15;
        const dq = down ? 0.002 : -0.002;
        roadAt(q, lane, cx, cy, tmp.a);
        roadAt(Math.min(1, Math.max(0, q + dq)), lane, cx, cy, tmp.b);
        tmp.f.subVectors(tmp.b, tmp.a);
        if (tmp.f.lengthSq() < 1e-10) tmp.f.set(1, 0, 0);
        tmp.f.normalize();
        tmp.l.set(0, 0, 1).cross(tmp.f).normalize();
        tmp.u.crossVectors(tmp.f, tmp.l);
        const sc = 0.36 * smooth(0, 0.03, q) * (1 - smooth(0.965, 1, q));
        tmp.m.makeBasis(tmp.f, tmp.l, tmp.u).scale(tmp.u.set(sc, sc, sc)).setPosition(tmp.a);
        o.matrix.copy(tmp.m);
        o.matrixWorldNeedsUpdate = true;
      });
    }

    // 巷道里行驶在前方的卡车
    const ld = lead.current;
    if (ld) {
      const u = Math.min(0.995, camU + 0.062 + 0.012 * Math.sin(st.time * 0.35));
      ld.visible = st.w > 0.5 && u > tunnel.u0 + 0.02;
      if (ld.visible) {
        tunnel.curve.getPointAt(u, tmp.a);
        tunnel.curve.getTangentAt(u, tmp.f);
        tmp.l.set(0, 1, 0).cross(tmp.f).normalize();
        tmp.u.crossVectors(tmp.f, tmp.l);
        tmp.a.addScaledVector(tmp.u, tunnel.floor);
        tmp.m.makeBasis(tmp.f, tmp.l, tmp.u).scale(tmp.b.set(1.15, 1.15, 1.15)).setPosition(tmp.a);
        ld.matrix.copy(tmp.m);
        ld.matrixWorldNeedsUpdate = true;
      }
    }
  });

  return (
    <>
      <group rotation={[-Math.PI / 2, 0, 0]}>
        <mesh frustumCulled={false}>
          <planeGeometry args={[64, 64, segments, segments]} />
          <shaderMaterial ref={mat} vertexShader={vertexShader} fragmentShader={fragmentShader} uniforms={uniforms} />
        </mesh>
        <mesh geometry={pitGeo} frustumCulled={false}>
          <shaderMaterial ref={pitMat} vertexShader={vertexShader} fragmentShader={fragmentShader} uniforms={pitUniforms} />
        </mesh>
        <group ref={trucks}>
          {Array.from({ length: DOWN + UPHILL }, (_, n) => (
            <group key={n} matrixAutoUpdate={false}>
              <lineSegments geometry={truckGeo} material={truckMat} />
              <points geometry={headGeo} material={truckGlow} frustumCulled={false} />
            </group>
          ))}
        </group>
      </group>
      <lineSegments geometry={tunnel.lines} material={lineMat} frustumCulled={false} />
      <points geometry={tunnel.dustGeo} material={glowMat} frustumCulled={false} />
      <points geometry={tunnel.lampGeo} material={glowMat} frustumCulled={false} />
      <group ref={lead} matrixAutoUpdate={false}>
        <lineSegments geometry={truckGeo} material={leadMat} frustumCulled={false} />
        <points geometry={headGeo} material={glowMat} frustumCulled={false} />
        <points geometry={tailGeo} material={glowMat} frustumCulled={false} />
      </group>
    </>
  );
}

export default function Terrain() {
  if (!webglAvailable()) return null;
  const mobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const still =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  return (
    <Canvas
      camera={{ fov: 42, near: 0.1, far: 120, position: [0, 4.4, 12] }}
      dpr={[1, mobile ? 1.5 : 1.75]}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
    >
      <Scene segments={mobile ? 180 : 320} still={still} mobile={mobile} />
      <Bloom mobile={mobile} />
    </Canvas>
  );
}
