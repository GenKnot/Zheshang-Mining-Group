'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { view } from '../lib/store';
import { webglAvailable } from '../lib/webgl';
import { Bloom } from './Terrain';

/* 关于页的首屏场景：一台线框钻机立在地层剖面上循环打钻。
   坐标：地面 y = 0，钻孔在原点，剖面在 z = 0 的竖直面上。 */

const TAU = Math.PI * 2;
const D2R = Math.PI / 180;
const GOLD = new THREE.Color('#d4ab6b');
const PALE = new THREE.Color('#f3dcae');
const GREY = new THREE.Color('#9a9488');
const RED = new THREE.Color('#ff5a4a');
const COPPER = new THREE.Color('#e58a4a');

const STROKE = 1.5; // 每接一根钻杆，动力头下行的距离，也是钻进的深度
const HEAD_TOP = 4.4;
const CYCLES = 5;
const MAX_DEPTH = STROKE * CYCLES;
const T_DRILL = 3.6;
const T_UP = 1.0;
const T_HOLD = 2.6;
const T_PULL = 2.6;
const LOOP = CYCLES * (T_DRILL + T_UP) + T_HOLD + T_PULL;

const lineVert = /* glsl */ `
attribute vec3 color;
attribute float aA;
varying vec3 vC;
varying float vA;
void main() {
  vC = color;
  vA = aA;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;
const lineFrag = /* glsl */ `
uniform float uOp;
varying vec3 vC;
varying float vA;
void main() {
  gl_FragColor = vec4(vC, vA * uOp);
}
`;
const pointVert = /* glsl */ `
attribute vec3 color;
attribute float aA;
attribute float aS;
varying vec3 vC;
varying float vA;
void main() {
  vC = color;
  vA = aA;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = clamp(aS / max(-mv.z, 0.4), 1.5, 90.0);
}
`;
const pointFrag = /* glsl */ `
uniform float uOp;
varying vec3 vC;
varying float vA;
void main() {
  float d = length(gl_PointCoord - 0.5) * 2.0;
  float shape = pow(max(0.0, 1.0 - d), 2.4) * 0.75 + (1.0 - smoothstep(0.06, 0.22, d));
  gl_FragColor = vec4(vC, clamp(vA * shape * uOp, 0.0, 1.0));
}
`;
export const lineMaterial = () =>
  new THREE.ShaderMaterial({ vertexShader: lineVert, fragmentShader: lineFrag, uniforms: { uOp: { value: 1 } }, transparent: true, depthWrite: false });
export const pointMaterial = () =>
  new THREE.ShaderMaterial({
    vertexShader: pointVert,
    fragmentShader: pointFrag,
    uniforms: { uOp: { value: 1 } },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

type V = number[];

/** 收集线段，最后生成一个几何体 */
export class Lines {
  pos: number[] = [];
  col: number[] = [];
  alp: number[] = [];
  seg(a: V, b: V, c: THREE.Color = GOLD, al = 0.8) {
    this.pos.push(a[0], a[1], a[2], b[0], b[1], b[2]);
    this.col.push(c.r, c.g, c.b, c.r, c.g, c.b);
    this.alp.push(al, al);
  }
  path(pts: V[], c: THREE.Color = GOLD, al = 0.8, closed = false) {
    for (let i = 0; i < pts.length - 1; i++) this.seg(pts[i], pts[i + 1], c, al);
    if (closed) this.seg(pts[pts.length - 1], pts[0], c, al);
  }
  box(x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, c: THREE.Color = GOLD, al = 0.8) {
    const p = [
      [x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1],
      [x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1],
    ];
    for (let i = 0; i < 4; i++) {
      this.seg(p[i], p[(i + 1) % 4], c, al);
      this.seg(p[i + 4], p[((i + 1) % 4) + 4], c, al);
      this.seg(p[i], p[i + 4], c, al);
    }
  }
  /** 竖直面（x-y）里的圆，z 固定 */
  ring(x: number, y: number, z: number, r: number, c: THREE.Color = GOLD, al = 0.8, n = 16) {
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU;
      const b = ((i + 1) / n) * TAU;
      this.seg([x + r * Math.cos(a), y + r * Math.sin(a), z], [x + r * Math.cos(b), y + r * Math.sin(b), z], c, al);
    }
  }
  /** 水平面（x-z）里的圆 */
  hoop(x: number, y: number, z: number, r: number, c: THREE.Color = GOLD, al = 0.8, n = 12) {
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU;
      const b = ((i + 1) / n) * TAU;
      this.seg([x + r * Math.cos(a), y, z + r * Math.sin(a)], [x + r * Math.cos(b), y, z + r * Math.sin(b)], c, al);
    }
  }
  geometry() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.col, 3));
    g.setAttribute('aA', new THREE.Float32BufferAttribute(this.alp, 1));
    return g;
  }
}

export function points(list: { p: V; c: THREE.Color; s: number; a: number }[]) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(list.flatMap((x) => x.p), 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(list.flatMap((x) => [x.c.r, x.c.g, x.c.b]), 3));
  g.setAttribute('aA', new THREE.Float32BufferAttribute(list.map((x) => x.a), 1));
  g.setAttribute('aS', new THREE.Float32BufferAttribute(list.map((x) => x.s), 1));
  return g;
}

/** 第 i 层地层在 (x, z) 处的高度；z = 0 是正对镜头的剖面 */
const strata = (i: number, x: number, z = 0) =>
  -(0.55 + i * 0.62) +
  0.2 * Math.sin(x * 0.33 + i * 1.3) +
  0.09 * Math.sin(x * 0.9 + i * 2.1) +
  0.022 * x * ((i % 3) - 1) +
  0.16 * Math.sin(z * 0.45 + i * 0.9 + x * 0.12);
const LAYERS = 27; // 地层层数：前十几层是跟钻经过的，再往下留给正文后面的下潜
const Z_BACK = -9; // 地层网格向纵深铺到这里
const DESC_DEPTH = 5.9; // 滚动跟钻那一段结束时的深度：正好在矿层里
const SINK = 10; // 正文阶段钻头继续往下钻的深度
const DEEP_MAX = DESC_DEPTH + SINK; // 钻头能到的最深处
const ORE_TOP = 7; // 矿层夹在第 7、8 两条地层线之间
const X0 = -18;
const X1 = 14;

function build() {
  let seed = 11;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;

  /* ---------- 地表与地层剖面 ---------- */
  const land = new Lines();
  // 远处的地表：几道起伏的横线加纵线，给出纵深
  const hill = (x: number, z: number) => 0.35 * Math.sin(x * 0.28 + z * 0.6) * Math.min(1, -z / 3) + 0.12 * Math.sin(x * 0.8 - z);
  for (const z of [-1.2, -2.6, -4.3, -6.4, -9, -12]) {
    const al = 0.34 * (1 - -z / 14);
    for (let x = X0; x < X1; x += 0.5) land.seg([x, hill(x, z), z], [x + 0.5, hill(x + 0.5, z), z], GREY, al);
  }
  for (let x = X0; x <= X1; x += 2) {
    for (let z = 0; z > -12; z -= 0.6) land.seg([x, hill(x, z), z], [x, hill(x, z - 0.6), z - 0.6], GREY, 0.2 * (1 + z / 14));
  }
  // 剖面上沿（地面线）与各层地层线；离钻机远的左侧压淡，给文字让位
  const fade = (x: number) => (x < -5 ? Math.max(0.35, 1 + (x + 5) / 14) : 1);
  for (let x = X0; x < X1; x += 0.4) land.seg([x, 0, 0], [x + 0.4, 0, 0], PALE, 0.85 * fade(x));
  for (let i = 0; i < LAYERS; i++) {
    const strong = i % 3 === 0;
    for (let x = X0; x < X1; x += 0.4)
      land.seg([x, strata(i, x), 0], [x + 0.4, strata(i, x + 0.4), 0], strong ? GOLD : GREY, (strong ? 0.6 : 0.4) * fade(x));
  }
  // 每层地层向纵深铺开成一张网格，跟钻时镜头从这些网格之间穿过
  for (let i = 0; i < LAYERS; i++) {
    const c = i % 3 === 0 ? GOLD : GREY;
    for (let z = -1.5; z >= Z_BACK; z -= 1.5) {
      const al = 0.3 * (1 - (z / Z_BACK) * 0.75);
      for (let x = -12; x < 12; x += 0.5) land.seg([x, strata(i, x, z), z], [x + 0.5, strata(i, x + 0.5, z), z], c, al * fade(x));
    }
    for (let x = -12; x <= 12; x += 1.5)
      for (let z = 0; z > Z_BACK; z -= 0.75)
        land.seg([x, strata(i, x, z), z], [x, strata(i, x, z - 0.75), z - 0.75], c, 0.2 * (1 - (z / Z_BACK) * 0.75) * fade(x));
  }
  // 岩性花纹：相邻地层之间散布的小短线
  const dots: { p: V; c: THREE.Color; s: number; a: number }[] = [];
  for (let n = 0; n < 1700; n++) {
    const i = Math.floor(rnd() * (LAYERS - 1));
    const x = X0 + rnd() * (X1 - X0);
    const y = strata(i, x) + (strata(i + 1, x) - strata(i, x)) * (0.15 + rnd() * 0.7);
    if (i % 4 === 1) land.seg([x, y, 0], [x + 0.16, y + 0.05, 0], GREY, 0.22 * fade(x));
    else if (i % 4 === 3) land.seg([x, y, 0], [x + 0.06, y + 0.14, 0], GREY, 0.2 * fade(x));
    else dots.push({ p: [x, y, 0], c: GREY, s: 16, a: 0.28 * fade(x) });
  }
  // 钻孔旁的深度刻度
  for (let n = 1; n * 0.5 <= DEEP_MAX + 0.01; n++) land.seg([0.3, -n * 0.5, 0], [n % 3 === 0 ? 0.62 : 0.45, -n * 0.5, 0], PALE, n % 3 === 0 ? 0.7 : 0.4);

  /* ---------- 矿层 ---------- */
  const ore = new Lines();
  const oreDots: { p: V; c: THREE.Color; s: number; a: number }[] = [];
  const OX0 = -6.5;
  const OX1 = 7.5;
  const top = (x: number) => strata(ORE_TOP, x);
  const bot = (x: number) => strata(ORE_TOP + 1, x);
  for (let x = OX0; x < OX1; x += 0.3) {
    ore.seg([x, top(x), 0], [x + 0.3, top(x + 0.3), 0], PALE, 1);
    ore.seg([x, bot(x), 0], [x + 0.3, bot(x + 0.3), 0], PALE, 1);
  }
  for (let x = OX0; x < OX1; x += 0.22) ore.seg([x, bot(x), 0], [x + 0.2, top(x + 0.2), 0], GOLD, 0.75);
  for (let n = 0; n < 900; n++) {
    const x = OX0 + rnd() * (OX1 - OX0);
    const z = n < 260 ? 0 : -rnd() * 8;
    const y0 = strata(ORE_TOP + 1, x, z);
    oreDots.push({ p: [x, y0 + (strata(ORE_TOP, x, z) - y0) * rnd(), z], c: n % 4 ? PALE : GOLD, s: 26 + rnd() * 34, a: 0.9 * (1 + z / 14) });
  }
  // 矿层的上下两个面在纵深方向也描出来
  for (let z = -1.5; z >= Z_BACK; z -= 1.5)
    for (let x = OX0; x < OX1; x += 0.5) {
      ore.seg([x, strata(ORE_TOP, x, z), z], [x + 0.5, strata(ORE_TOP, x + 0.5, z), z], PALE, 0.55);
      ore.seg([x, strata(ORE_TOP + 1, x, z), z], [x + 0.5, strata(ORE_TOP + 1, x + 0.5, z), z], PALE, 0.55);
    }

  /* ---------- 远山 ---------- */
  const ridge = (x: number, m: number) =>
    (3.6 + m * 2.3) * (0.42 + 0.3 * Math.sin(x * 0.11 + m * 2.3) + 0.2 * Math.sin(x * 0.27 + m * 5.1) + 0.08 * Math.sin(x * 0.71 + m));
  for (let m = 0; m < 4; m++) {
    const z = -15 - m * 6;
    const al = 0.8 - m * 0.13;
    for (let x = -46, n = 0; x < 46; x += 0.7, n++) {
      const y0 = Math.max(0, ridge(x, m));
      const y1 = Math.max(0, ridge(x + 0.7, m));
      land.seg([x, y0, z], [x + 0.7, y1, z], m % 2 ? GREY : GOLD, al);
      // 山体上的斜向排线，给山一点体积感
      if (n % 3 === 0 && y0 > 0.4) land.seg([x, y0, z], [x - 0.5, y0 * 0.45, z + 1.2], GREY, al * 0.4);
    }
  }

  /* ---------- 营地：钻机周围的设施 ---------- */
  const site = new Lines();
  const siteLamps: { p: V; c: THREE.Color; s: number; a: number }[] = [];
  // 两个集装箱营房
  for (const [x0, z0] of [[-7.4, -3.4], [-7.1, -5.0]]) {
    site.box(x0, x0 + 2.6, 0, 1.15, z0, z0 + 1.1, GOLD, 0.75);
    for (let x = x0 + 0.26; x < x0 + 2.55; x += 0.26) site.seg([x, 0, z0 + 1.1], [x, 1.15, z0 + 1.1], GREY, 0.4);
    site.path([[x0 + 0.3, 0, z0 + 1.1], [x0 + 0.3, 0.85, z0 + 1.1], [x0 + 0.75, 0.85, z0 + 1.1], [x0 + 0.75, 0, z0 + 1.1]], PALE, 0.7);
    siteLamps.push({ p: [x0 + 1.6, 0.75, z0 + 1.15], c: PALE, s: 90, a: 0.8 });
  }
  // 三座照明灯塔
  for (const [x, z] of [[-4.4, 2.6], [4.6, -3.2], [-8.6, -1.4]]) {
    site.seg([x, 0, z], [x, 3.4, z], GOLD, 0.85);
    site.seg([x - 0.35, 0, z], [x, 0.9, z], GOLD, 0.5);
    site.seg([x + 0.35, 0, z], [x, 0.9, z], GOLD, 0.5);
    site.box(x - 0.28, x + 0.28, 3.4, 3.58, z - 0.1, z + 0.1, PALE, 0.9);
    siteLamps.push({ p: [x, 3.36, z], c: PALE, s: 230, a: 1 });
  }
  // 矿石堆
  for (const [x, z, r, h] of [[5.4, -0.6, 1.2, 0.95], [6.9, 0.7, 0.85, 0.65], [5.9, 1.6, 0.6, 0.45]]) {
    site.hoop(x, 0.01, z, r, GOLD, 0.7, 14);
    site.hoop(x, h * 0.5, z, r * 0.52, GREY, 0.45, 12);
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * TAU;
      site.seg([x + r * Math.cos(a), 0.01, z + r * Math.sin(a)], [x, h, z], GOLD, 0.55);
    }
  }
  // 皮卡
  site.box(-6.3, -4.5, 0.28, 0.62, 2.3, 3.1, GOLD, 0.8);
  site.box(-5.6, -4.9, 0.62, 1.02, 2.34, 3.06, GOLD, 0.8);
  for (const x of [-5.95, -4.85]) for (const z of [2.3, 3.1]) site.ring(x, 0.22, z, 0.2, PALE, 0.8, 10);
  // 场地边界：一排测量桩、小旗和拉线
  for (let x = -10; x <= 9; x += 1.9) {
    site.seg([x, 0, 4.2], [x, 0.55, 4.2], GOLD, 0.7);
    site.seg([x, 0.55, 4.2], [x + 0.22, 0.47, 4.2], RED, 0.9);
  }
  site.seg([-10, 0.42, 4.2], [9, 0.42, 4.2], GREY, 0.35);
  // 储水罐
  for (const y of [0.02, 0.5, 1.0]) site.hoop(3.4, y, -4.6, 0.7, GOLD, 0.7, 14);
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * TAU;
    site.seg([3.4 + 0.7 * Math.cos(a), 0.02, -4.6 + 0.7 * Math.sin(a)], [3.4 + 0.7 * Math.cos(a), 1.0, -4.6 + 0.7 * Math.sin(a)], GOLD, 0.5);
  }
  // 空气里的浮尘
  for (let n = 0; n < 150; n++)
    siteLamps.push({ p: [-9 + rnd() * 18, 0.3 + rnd() * 7, -7 + rnd() * 11], c: GOLD, s: 12 + rnd() * 10, a: 0.4 });

  /* ---------- 地下的矿脉与晶簇 ---------- */
  const deep = new Lines();
  const deepDots: { p: V; c: THREE.Color; s: number; a: number }[] = [];
  // 一根六棱柱晶体：c 为底面中心，dir 为生长方向
  const crystal = (c: V, dir: V, r: number, len: number, col: THREE.Color) => {
    const d = new THREE.Vector3(dir[0], dir[1], dir[2]).normalize();
    const u = new THREE.Vector3(0.3, 0.1, 1).cross(d).normalize();
    const v = d.clone().cross(u);
    const at = (t: number, rr: number, a: number): V => [
      c[0] + d.x * t + (u.x * Math.cos(a) + v.x * Math.sin(a)) * rr,
      c[1] + d.y * t + (u.y * Math.cos(a) + v.y * Math.sin(a)) * rr,
      c[2] + d.z * t + (u.z * Math.cos(a) + v.z * Math.sin(a)) * rr,
    ];
    const tip: V = [c[0] + d.x * (len + r * 1.7), c[1] + d.y * (len + r * 1.7), c[2] + d.z * (len + r * 1.7)];
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * TAU;
      const b = ((i + 1) / 6) * TAU;
      deep.seg(at(0, r, a), at(0, r, b), col, 0.9);
      deep.seg(at(len, r * 0.85, a), at(len, r * 0.85, b), col, 0.9);
      deep.seg(at(0, r, a), at(len, r * 0.85, a), col, 0.8);
      deep.seg(at(len, r * 0.85, a), tip, col, 0.9);
    }
  };
  // 一簇晶体，周围带一团矿物光点
  const cluster = (cx: number, cy: number, cz: number, col: THREE.Color, n: number) => {
    for (let k = 0; k < n; k++)
      crystal(
        [cx + (rnd() - 0.5) * 0.5, cy + (rnd() - 0.5) * 0.3, cz + (rnd() - 0.5) * 0.5],
        [(rnd() - 0.5) * 1.4, 0.4 + rnd(), (rnd() - 0.5) * 1.4],
        0.07 + rnd() * 0.08,
        0.3 + rnd() * 0.6,
        col,
      );
    for (let k = 0; k < 60; k++)
      deepDots.push({ p: [cx + (rnd() - 0.5) * 1.6, cy + (rnd() - 0.5) * 1.1, cz + (rnd() - 0.5) * 1.6], c: col, s: 18 + rnd() * 30, a: 0.8 });
  };
  // 浅部三处，首屏就能看到；深部十几处，留给正文后面的下潜
  cluster(4.6, -2.6, -0.4, PALE, 5);
  cluster(-3.4, -3.6, -1.2, COPPER, 5);
  cluster(7.5, -4.4, -2, GOLD, 4);
  for (let n = 0; n < 18; n++) cluster(-7 + rnd() * 14, -7.2 - rnd() * 9.5, -0.5 - rnd() * 6, [GOLD, PALE, COPPER][n % 3], 4 + Math.floor(rnd() * 4));
  // 矿脉：在岩层里分叉延伸的亮线
  const vein = (p: V, dir: V, steps: number, al: number) => {
    let cur = p;
    let d = dir;
    for (let k = 0; k < steps; k++) {
      d = [d[0] + (rnd() - 0.5) * 0.7, d[1] + (rnd() - 0.5) * 0.5, d[2] + (rnd() - 0.5) * 0.7];
      const len = Math.hypot(d[0], d[1], d[2]) || 1;
      const nx: V = [cur[0] + (d[0] / len) * 0.42, cur[1] + (d[1] / len) * 0.42, cur[2] + (d[2] / len) * 0.42];
      deep.seg(cur, nx, PALE, al);
      if (k % 3 === 2) deepDots.push({ p: nx, c: PALE, s: 40, a: 0.9 });
      if (rnd() < 0.18 && steps > 5) vein(nx, [d[1], d[0], -d[2]], Math.floor(steps / 2), al * 0.8);
      cur = nx;
    }
  };
  for (let n = 0; n < 14; n++) vein([-8 + rnd() * 16, -6.8 - rnd() * 10, -rnd() * 6], [rnd() - 0.5, (rnd() - 0.5) * 0.6, rnd() - 0.5], 16, 0.85);

  /* ---------- 钻机（静止部分） ---------- */
  const rig = new Lines();
  for (const z of [-0.75, 0.75]) {
    // 履带
    rig.box(-3.0, -0.4, 0.05, 0.52, z - 0.17, z + 0.17, GOLD, 0.85);
    for (const x of [-2.75, -2.1, -1.35, -0.65]) rig.ring(x, 0.28, z + (z > 0 ? 0.17 : -0.17), 0.2, PALE, 0.8, 12);
  }
  rig.box(-3.1, -0.3, 0.52, 0.66, -0.95, 0.95, GOLD, 0.8); // 底盘
  rig.box(-3.0, -1.75, 0.66, 1.5, -0.8, 0.8, GOLD, 0.85); // 发动机舱
  for (let y = 0.85; y < 1.4; y += 0.14) rig.seg([-2.9, y, 0.8], [-1.85, y, 0.8], GREY, 0.6); // 散热格栅
  rig.box(-1.55, -0.7, 0.66, 1.62, 0.05, 0.9, GOLD, 0.85); // 操作室
  rig.path([[-1.45, 1.05, 0.9], [-0.8, 1.05, 0.9], [-0.8, 1.52, 0.9], [-1.45, 1.52, 0.9]], PALE, 0.8, true);
  rig.box(-1.55, -0.7, 0.66, 1.15, -0.9, -0.1, GOLD, 0.7); // 液压油箱
  rig.seg([-2.6, 1.5, -0.5], [-2.6, 2.05, -0.5], GREY, 0.8); // 排气管
  rig.box(-0.55, 0.55, 0, 0.3, -0.55, 0.55, PALE, 0.8); // 孔口平台
  rig.hoop(0, 0.3, 0, 0.16, PALE, 0.9);
  // 桅杆：四根立柱加斜撑
  const M = 0.24;
  const MAST_H = 5.1;
  for (const [x, z] of [[-M, -M], [M, -M], [M, M], [-M, M]]) rig.seg([x, 0.3, z], [x, MAST_H, z], PALE, 0.95);
  for (let y = 0.3, k = 0; y < MAST_H - 0.01; y += 0.48, k++) {
    const y1 = Math.min(MAST_H, y + 0.48);
    const s = k % 2 ? 1 : -1;
    rig.seg([-M * s, y, M], [M * s, y1, M], GOLD, 0.6);
    rig.seg([-M * s, y, -M], [M * s, y1, -M], GOLD, 0.45);
    rig.seg([-M, y, -M * s], [-M, y1, M * s], GOLD, 0.45);
    rig.seg([M, y, -M * s], [M, y1, M * s], GOLD, 0.6);
    rig.path([[-M, y1, -M], [M, y1, -M], [M, y1, M], [-M, y1, M]], GOLD, 0.5, true);
  }
  rig.box(-0.34, 0.34, MAST_H, MAST_H + 0.2, -0.34, 0.34, PALE, 0.9); // 天车
  rig.ring(0, MAST_H + 0.36, 0, 0.18, PALE, 0.9, 14);
  for (const z of [-0.5, 0.5]) {
    // 桅杆斜撑
    rig.seg([-1.7, 0.66, z], [-M, 3.3, z * 0.48], GOLD, 0.85);
    rig.seg([-1.0, 0.66, z], [-M, 1.9, z * 0.48], GOLD, 0.6);
  }
  // 钻杆架
  for (const x of [1.3, 3.7]) {
    rig.seg([x, 0, 1.0], [x, 0.55, 1.0], GOLD, 0.8);
    rig.seg([x, 0, 1.7], [x, 0.55, 1.7], GOLD, 0.8);
    rig.seg([x, 0.18, 1.0], [x, 0.18, 1.7], GOLD, 0.8);
  }
  for (let k = 0; k < 5; k++) {
    const z = 1.08 + k * 0.135;
    rig.seg([1.15, 0.24, z], [3.85, 0.24, z], GOLD, 0.5);
    if (k < 4) rig.seg([1.15, 0.35, z + 0.07], [3.85, 0.35, z + 0.07], GOLD, 0.4);
  }
  // 岩芯箱：三格托盘，里面是一段段岩芯
  for (let t = 0; t < 2; t++) {
    const x0 = -2.9 + t * 1.25;
    rig.path([[x0, 0.04, 1.5], [x0 + 1.1, 0.04, 1.5], [x0 + 1.1, 0.04, 2.25], [x0, 0.04, 2.25]], GOLD, 0.8, true);
    for (let k = 0; k < 4; k++) {
      const z = 1.6 + k * 0.18;
      for (let x = x0 + 0.06; x < x0 + 1.0; x += 0.21) rig.seg([x, 0.08, z], [x + 0.15, 0.08, z], k % 2 ? PALE : GREY, 0.85);
    }
  }
  // 泥浆池与回水管
  rig.path([[1.0, 0.02, -1.0], [2.5, 0.02, -1.0], [2.5, 0.02, -2.1], [1.0, 0.02, -2.1]], GOLD, 0.7, true);
  for (let k = 0; k < 3; k++)
    for (let x = 1.1; x < 2.4; x += 0.2)
      rig.seg([x, 0.03, -1.25 - k * 0.3 + 0.04 * Math.sin(x * 9)], [x + 0.2, 0.03, -1.25 - k * 0.3 + 0.04 * Math.sin((x + 0.2) * 9)], GREY, 0.5);
  rig.path([[0.4, 0.2, -0.3], [0.7, 0.5, -0.6], [1.0, 0.3, -1.0], [1.2, 0.05, -1.2]], GREY, 0.7);

  /* ---------- 会动的部分 ---------- */
  // 动力头：沿桅杆上下，卡盘旋转
  const head = new Lines();
  head.box(-0.3, 0.3, 0, 0.42, -0.3, 0.3, PALE, 1);
  head.box(-0.16, 0.16, 0.42, 0.62, -0.16, 0.16, GOLD, 0.9);
  const chuck = new Lines();
  chuck.hoop(0, -0.06, 0, 0.15, PALE, 1, 8);
  chuck.hoop(0, -0.16, 0, 0.11, PALE, 0.9, 8);
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * TAU;
    chuck.seg([0.15 * Math.cos(a), -0.06, 0.15 * Math.sin(a)], [0.11 * Math.cos(a), -0.16, 0.11 * Math.sin(a)], PALE, 0.9);
  }
  // 钻具：以钻头为原点向上排的一串接箍，随钻杆一起转
  const string = new Lines();
  const N_COLLAR = Math.ceil((HEAD_TOP + DEEP_MAX) / 0.5) + 1;
  for (let k = 1; k <= N_COLLAR; k++) {
    const y = k * 0.5;
    string.seg([0.035, y, 0], [0.11, y, 0], PALE, 0.9);
    string.seg([-0.035, y, 0], [-0.11, y, 0], PALE, 0.9);
    string.seg([0, y, 0.035], [0, y, 0.11], PALE, 0.9);
    string.seg([0, y, -0.035], [0, y, -0.11], PALE, 0.9);
  }
  // 钻头
  const bit = new Lines();
  bit.hoop(0, 0.2, 0, 0.1, PALE, 1, 8);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * TAU;
    bit.seg([0.1 * Math.cos(a), 0.2, 0.1 * Math.sin(a)], [0, 0, 0], PALE, 1);
  }
  // 单位长度的竖线：缩放后分别当作钻杆、孔壁和钢丝绳
  const unit = new Lines();
  unit.seg([0, 0, 0], [0, 1, 0], PALE, 1);
  const wall = new Lines();
  wall.seg([-0.1, 0, 0], [-0.1, 1, 0], GREY, 0.7);
  wall.seg([0.1, 0, 0], [0.1, 1, 0], GREY, 0.7);

  return {
    land: land.geometry(),
    dots: points(dots),
    ore: ore.geometry(),
    oreDots: points(oreDots),
    rig: rig.geometry(),
    site: site.geometry(),
    siteLamps: points(siteLamps),
    deep: deep.geometry(),
    deepDots: points(deepDots),
    head: head.geometry(),
    chuck: chuck.geometry(),
    string: string.geometry(),
    bit: bit.geometry(),
    unit: unit.geometry(),
    wall: wall.geometry(),
    // 灯：桅杆顶的红色警示灯、操作室的灯、钻头的亮点
    beacon: points([{ p: [0, MAST_H + 0.6, 0], c: RED, s: 190, a: 1 }]),
    lamps: points([
      { p: [-1.1, 1.7, 0.9], c: PALE, s: 150, a: 0.9 },
      { p: [0.3, 2.2, 0.3], c: PALE, s: 110, a: 0.8 },
    ]),
    spark: points([{ p: [0, 0, 0], c: PALE, s: 220, a: 1 }]),
  };
}

const N_CUT = 34; // 沿钻孔上返的岩屑颗粒数
export const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

function Scene({ labels, still }: { labels: React.RefObject<HTMLDivElement | null>; still: boolean }) {
  const g = useMemo(build, []);
  const mats = useMemo(
    () => ({
      line: lineMaterial(),
      ore: lineMaterial(),
      deep: lineMaterial(),
      point: pointMaterial(),
      orePoint: pointMaterial(),
      deepPoint: pointMaterial(),
      beacon: pointMaterial(),
      spark: pointMaterial(),
      cut: pointMaterial(),
    }),
    [],
  );
  const cuttings = useMemo(
    () => points(Array.from({ length: N_CUT }, (_, i) => ({ p: [0, 0, 0], c: i % 3 ? GOLD : PALE, s: 26, a: 0.9 }))),
    [],
  );
  const head = useRef<THREE.Group>(null);
  const chuck = useRef<THREE.LineSegments>(null);
  const rod = useRef<THREE.LineSegments>(null);
  const cable = useRef<THREE.LineSegments>(null);
  const hole = useRef<THREE.LineSegments>(null);
  const string = useRef<THREE.LineSegments>(null);
  const bit = useRef<THREE.Group>(null);
  const world = useRef<THREE.Group>(null);
  const s = useRef({ time: still ? 21.5 : 0, spin: 0, t: 0, mx: 0, my: 0, intro: still ? 1 : 0, w: 0, l: 0, d: 0 });
  const tmp = useMemo(() => new THREE.Vector3(), []);
  const look = useMemo(() => new THREE.Vector3(), []);

  useFrame(({ camera, size }, dt) => {
    const st = s.current;
    const k = Math.min(1, dt * 3);
    if (!still) st.time = (st.time + dt) % LOOP;
    if (view.ready) st.intro = Math.min(1, st.intro + dt / 1.8);
    st.mx += (view.mx - st.mx) * k * 0.5;
    st.my += (view.my - st.my) * k * 0.5;
    const e = 1 - Math.pow(1 - st.intro, 3);

    /* ---- 打钻循环：钻进 → 提起动力头接杆 → … → 到底停留 → 起钻 ---- */
    const T = st.time;
    const per = T_DRILL + T_UP;
    let depth = 0;
    let headY = HEAD_TOP;
    let spin = 0;
    if (T < CYCLES * per) {
      const c = Math.floor(T / per);
      const u = T - c * per;
      if (u < T_DRILL) {
        const p = u / T_DRILL;
        depth = (c + p) * STROKE;
        headY = HEAD_TOP - p * STROKE;
        spin = 1;
      } else {
        const r = smooth(0, 1, (u - T_DRILL) / T_UP);
        depth = (c + 1) * STROKE;
        headY = HEAD_TOP - STROKE + r * STROKE;
        spin = 0;
      }
    } else if (T < CYCLES * per + T_HOLD) {
      depth = MAX_DEPTH;
      headY = HEAD_TOP - STROKE;
      spin = 0.25;
    } else {
      const r = smooth(0, 1, (T - CYCLES * per - T_HOLD) / T_PULL);
      depth = MAX_DEPTH * (1 - r);
      headY = HEAD_TOP - STROKE + r * STROKE;
      spin = 0;
    }
    // 滚动到"跟钻"那一段时，钻进深度改由滚动进度决定，镜头贴着钻头往下走
    // w 完全由滚动位置决定：那一段滚进屏幕的过程中，镜头同步从首屏移到钻头旁，不会突然跳过去
    st.w += (smooth(0.15, 1, view.rigIn) - st.w) * Math.min(1, dt * 4);
    st.l += (view.rigL - st.l) * k;
    st.d += (view.rigDeep - st.d) * k;
    if (st.w > 0.001) {
      // 跟钻那一段钻到矿层；之后的正文阶段钻头不停，继续往深处钻
      const dd = 0.4 + st.l * (DESC_DEPTH - 0.4) + st.d * SINK;
      depth += (dd - depth) * st.w;
      headY += (HEAD_TOP - STROKE * (0.2 + 0.6 * ((dd / STROKE) % 1)) - headY) * st.w;
      spin += (1 - spin) * st.w;
    }
    if (!still) st.spin += dt * spin * 7;

    if (head.current) head.current.position.y = headY;
    if (chuck.current) chuck.current.rotation.y = st.spin;
    // 钻杆：从钻头一直到动力头
    if (rod.current) {
      rod.current.position.y = -depth;
      rod.current.scale.y = headY + depth;
    }
    if (cable.current) {
      cable.current.position.y = headY + 0.62;
      cable.current.scale.y = Math.max(0.01, 5.3 - headY - 0.62);
    }
    if (hole.current) {
      hole.current.position.y = -depth;
      hole.current.scale.y = Math.max(0.001, depth);
    }
    if (string.current) {
      string.current.position.y = -depth;
      string.current.rotation.y = st.spin;
      string.current.geometry.setDrawRange(0, Math.floor((headY + depth - 0.1) / 0.5) * 8);
    }
    if (bit.current) {
      bit.current.position.y = -depth;
      bit.current.rotation.y = st.spin * 1.6;
    }
    // 岩屑：沿孔壁从钻头往上返
    const cp = cuttings.getAttribute('position') as THREE.BufferAttribute;
    for (let i = 0; i < N_CUT; i++) {
      const ph = (T * 0.32 + i / N_CUT) % 1;
      cp.setXYZ(i, (i % 2 ? 0.075 : -0.075) + 0.02 * Math.sin(i * 7.1 + T * 3), -depth * (1 - ph), 0.02 * Math.cos(i * 3.3));
    }
    cp.needsUpdate = true;
    mats.cut.uniforms.uOp.value = spin * Math.min(1, depth) * e;

    // 钻头进入矿层后，矿层亮起来
    const oreY = -strata(ORE_TOP, 0);
    const lit = smooth(oreY - 0.15, oreY + 0.55, depth);
    mats.ore.uniforms.uOp.value = (0.16 + 0.84 * lit) * e;
    mats.orePoint.uniforms.uOp.value = (0.08 + 0.92 * lit) * (0.8 + 0.2 * Math.sin(T * 4)) * e;
    // 地下的矿脉和晶簇：在地面时只是隐约可见，镜头下到地下后亮起来并轻微闪烁
    mats.deep.uniforms.uOp.value = (0.42 + 0.58 * st.w) * e;
    mats.deepPoint.uniforms.uOp.value = (0.4 + 0.6 * st.w) * (0.82 + 0.18 * Math.sin(T * 2.3)) * e;
    mats.line.uniforms.uOp.value = e;
    mats.point.uniforms.uOp.value = e;
    mats.beacon.uniforms.uOp.value = (0.25 + 0.75 * Math.max(0, Math.sin(T * 2.6))) * e;
    mats.spark.uniforms.uOp.value = (0.35 + 0.65 * spin) * (0.75 + 0.25 * Math.sin(T * 31)) * e;

    // 整个场景绕钻孔缓慢摆动，再跟一点鼠标，不然纯侧视太平
    const sway = still ? 0 : 0.12 * Math.sin(T * (TAU / LOOP) * 2);
    if (world.current)
      world.current.rotation.y = -0.46 + sway * (1 - st.w) + st.mx * 0.07 + st.w * (-0.04 + st.l * 1.0 + st.d * 1.1);

    /* ---- 镜头：宽屏时钻机偏右，竖屏时居中靠下；向下滚动时沿钻孔下行 ---- */
    const aspect = size.width / size.height;
    const wide = Math.min(1, Math.max(0, (aspect - 0.75) / 0.3));
    const tan = Math.tan(21 * D2R);
    const t = Math.min(1.4, window.scrollY / Math.max(1, size.height));
    st.t += (t - st.t) * k;
    // 首屏：钻机占到屏幕高度的八成左右，镜头略低、微微仰视；窗口偏窄时按宽度拉远
    const czWide = Math.max(9.6, 3.0 / (tan * aspect * 0.62));
    const cz = wide * czWide + (1 - wide) * (4.3 / (tan * aspect)) + (1 - e) * 3;
    const ndc = wide * 0.5;
    const cx = -ndc * cz * tan * aspect + st.mx * 0.35;
    const lookY = wide * 2.25 + (1 - wide) * (0.56 * cz * tan) - st.t * 3.2;
    camera.position.set(cx, lookY - 1.1 - st.my * 0.25, cz);
    look.set(cx, lookY, 0);
    if (st.w > 0.001) {
      // 跟钻：镜头贴在钻头斜上方，离钻孔很近，宽屏时把钻孔放在画面右半边
      const dz = 3.1 + (1 - wide) * 1.9;
      const dx = -wide * 0.34 * dz * Math.tan(31 * D2R) * aspect;
      // 正文阶段镜头仍然跟着钻头，只是略微左右游移，让两侧的矿脉和晶簇有视差
      const drift = Math.sin(st.d * 3.1) * 0.5;
      tmp.set(dx + drift + st.mx * 0.25, -depth + 0.95 - st.my * 0.2, dz + st.d * 0.5);
      camera.position.lerp(tmp, st.w);
      tmp.set(dx + drift * 0.3, -depth - 0.45, 0);
      look.lerp(tmp, st.w);
    }
    camera.lookAt(look);
    const cam = camera as THREE.PerspectiveCamera;
    const fov = 42 + 20 * st.w;
    if (Math.abs(cam.fov - fov) > 0.01) {
      cam.fov = fov;
      cam.updateProjectionMatrix();
    }

    // 屏幕上的两个文字标签：钻头深度、矿层
    const box = labels.current;
    if (box) {
      const place = (el: HTMLElement, x: number, y: number, op: number) => {
        tmp.set(x, y, 0);
        if (world.current) tmp.applyMatrix4(world.current.matrixWorld);
        tmp.project(camera);
        el.style.transform = `translate(${((tmp.x * 0.5 + 0.5) * size.width).toFixed(1)}px, ${((-tmp.y * 0.5 + 0.5) * size.height).toFixed(1)}px) translate(16px, -50%)`;
        el.style.opacity = String(op);
      };
      const d = box.children[0] as HTMLElement;
      const near = Math.max(0, 1 - st.d * 6); // 钻过矿层往深处去之后，矿层的标签淡出
      place(d, 0.62, -depth, depth > 0.2 ? e : 0);
      (d.firstChild as HTMLElement).textContent = `${String(Math.round(depth * 40)).padStart(4, '0')} M`;
      place(box.children[1] as HTMLElement, 2.6, -oreY - 0.3, lit * e * near);
    }
  });

  return (
    <group ref={world}>
      <lineSegments geometry={g.land} material={mats.line} frustumCulled={false} />
      <points geometry={g.dots} material={mats.point} frustumCulled={false} />
      <lineSegments geometry={g.ore} material={mats.ore} frustumCulled={false} />
      <points geometry={g.oreDots} material={mats.orePoint} frustumCulled={false} />
      <lineSegments geometry={g.deep} material={mats.deep} frustumCulled={false} />
      <points geometry={g.deepDots} material={mats.deepPoint} frustumCulled={false} />
      <lineSegments geometry={g.rig} material={mats.line} frustumCulled={false} />
      <lineSegments geometry={g.site} material={mats.line} frustumCulled={false} />
      <points geometry={g.siteLamps} material={mats.point} frustumCulled={false} />
      {/* 远处的第二台钻机：同一个模型，缩小后放到后面 */}
      <lineSegments geometry={g.rig} material={mats.line} position={[-11.5, 0, -8.5]} rotation={[0, 0.7, 0]} scale={0.8} frustumCulled={false} />
      <points geometry={g.lamps} material={mats.point} frustumCulled={false} />
      <points geometry={g.beacon} material={mats.beacon} frustumCulled={false} />
      <group ref={head}>
        <lineSegments geometry={g.head} material={mats.line} frustumCulled={false} />
        <lineSegments ref={chuck} geometry={g.chuck} material={mats.line} frustumCulled={false} />
      </group>
      <lineSegments ref={cable} geometry={g.unit} material={mats.line} frustumCulled={false} />
      <lineSegments ref={rod} geometry={g.unit} material={mats.line} frustumCulled={false} />
      <lineSegments ref={hole} geometry={g.wall} material={mats.line} frustumCulled={false} />
      <lineSegments ref={string} geometry={g.string} material={mats.line} frustumCulled={false} />
      <group ref={bit}>
        <lineSegments geometry={g.bit} material={mats.line} frustumCulled={false} />
        <points geometry={g.spark} material={mats.spark} frustumCulled={false} />
      </group>
      <points geometry={cuttings} material={mats.cut} frustumCulled={false} />
    </group>
  );
}

export default function AboutRig() {
  if (!webglAvailable()) return null;
  const labels = useRef<HTMLDivElement>(null);
  const mobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const still =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  return (
    <>
      <Canvas
        camera={{ fov: 42, near: 0.1, far: 120, position: [-4, 1, 16] }}
        dpr={[1, mobile ? 1.5 : 1.75]}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      >
        <Scene labels={labels} still={still} />
        <Bloom mobile={mobile} />
      </Canvas>
      <div className="g-labels pg-labels rig-labels" ref={labels}>
        <div>
          <b>0000 M</b>
          <span>DEPTH</span>
        </div>
        <div>
          <b>ORE BODY</b>
          <span>Au · Cu</span>
        </div>
      </div>
    </>
  );
}
