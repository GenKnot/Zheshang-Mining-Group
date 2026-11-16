'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { view } from '../lib/store';
import { webglAvailable } from '../lib/webgl';
import { Lines, lineMaterial, pointMaterial, points, smooth } from './AboutRig';
import MineWorld, { type Chase } from './MineWorld';
import { Bloom } from './Terrain';

/* 峰会页的场景：一座线框会场。中央是圆桌，北侧是舞台和大屏，南侧是阶梯观众席，外圈是立柱和穹顶。
   两股光点从东西两侧汇入会场落座：一边是矿权方，一边是投资方。
   坐标：地面 y = 0，圆桌在原点，舞台在 -z 方向。 */

const TAU = Math.PI * 2;
const GOLD = new THREE.Color('#d4ab6b');
const PALE = new THREE.Color('#f3dcae');
const GREY = new THREE.Color('#9a9488');
const RED = new THREE.Color('#ff6a55');

type V = number[];
type Dot = { p: V; c: THREE.Color; s: number; a: number };
const SEATS = 12; // 圆桌席位数
const N_STREAM = 46; // 每一侧汇入的光点数

function build() {
  let seed = 23;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;

  /* ---------- 地面：同心圆加放射线 ---------- */
  const hall = new Lines();
  for (const r of [3.7, 5.2, 6.5, 7.8, 9.1, 10.4, 12, 13.6, 16]) hall.hoop(0, 0, 0, r, GREY, r === 16 ? 0.5 : 0.22, 72);
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * TAU;
    hall.seg([3.7 * Math.cos(a), 0, 3.7 * Math.sin(a)], [16 * Math.cos(a), 0, 16 * Math.sin(a)], GREY, 0.13);
  }

  /* ---------- 圆桌 ---------- */
  hall.hoop(0, 0.78, 0, 2.2, PALE, 0.95, 48);
  hall.hoop(0, 0.7, 0, 2.2, GOLD, 0.6, 48);
  hall.hoop(0, 0.78, 0, 2.02, GOLD, 0.5, 48);
  hall.hoop(0, 0.78, 0, 1.25, GOLD, 0.5, 36);
  hall.hoop(0, 0, 0, 0.95, GOLD, 0.6, 24);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * TAU;
    hall.seg([0.95 * Math.cos(a), 0, 0.95 * Math.sin(a)], [0.5 * Math.cos(a), 0.7, 0.5 * Math.sin(a)], GOLD, 0.55);
  }
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * TAU;
    hall.seg([1.25 * Math.cos(a), 0.78, 1.25 * Math.sin(a)], [2.02 * Math.cos(a), 0.78, 2.02 * Math.sin(a)], GOLD, 0.2);
  }
  // 桌子中央的一小块矿石
  const gem: V[] = [[0, 1.5, 0], [0.26, 1.12, 0.1], [-0.12, 1.1, 0.24], [-0.2, 1.14, -0.2], [0.14, 1.08, -0.24], [0, 0.82, 0]];
  for (const [a, b] of [[0, 1], [0, 2], [0, 3], [0, 4], [1, 2], [2, 3], [3, 4], [4, 1], [5, 1], [5, 2], [5, 3], [5, 4]]) hall.seg(gem[a], gem[b], PALE, 0.9);

  // 席位：椅子、桌上的一块平板，以及坐在那里的一个光点
  const lamps: Dot[] = [{ p: [0, 1.16, 0], c: PALE, s: 230, a: 1 }];
  const people: Dot[] = [];
  const seatAt: V[] = []; // 每个席位"人"的位置，光点最终落到这里
  const tableAt: V[] = []; // 每个席位在桌沿上的点，连线从这里拉出
  for (let i = 0; i < SEATS; i++) {
    const a = ((i + 0.5) / SEATS) * TAU;
    const cx = Math.cos(a);
    const cz = Math.sin(a);
    const at = (r: number, y: number, t = 0): V => [r * cx - t * cz, y, r * cz + t * cx]; // r 沿半径，t 沿切线
    hall.path([at(2.8, 0.45, -0.25), at(2.8, 0.45, 0.25), at(3.3, 0.45, 0.25), at(3.3, 0.45, -0.25)], GOLD, 0.7, true);
    hall.path([at(3.3, 0.45, -0.25), at(3.36, 1.15, -0.25), at(3.36, 1.15, 0.25), at(3.3, 0.45, 0.25)], GOLD, 0.7);
    for (const t of [-0.25, 0.25]) {
      hall.seg(at(2.8, 0.45, t), at(2.8, 0, t), GOLD, 0.4);
      hall.seg(at(3.3, 0.45, t), at(3.3, 0, t), GOLD, 0.4);
    }
    hall.path([at(1.62, 0.79, -0.16), at(1.62, 0.79, 0.16), at(1.9, 0.79, 0.16), at(1.9, 0.79, -0.16)], PALE, 0.6, true);
    // 东侧（x > 0）是投资方，西侧是矿权方，用两种颜色区分
    people.push({ p: at(3.05, 1.18), c: cx > 0 ? RED : PALE, s: 150, a: 1 });
    seatAt.push(at(3.05, 1.18));
    tableAt.push(at(2.02, 0.82));
  }

  /* ---------- 圆桌上方的连线网：席位两两接通 ---------- */
  const web = new Lines();
  for (let i = 0; i < SEATS; i++)
    for (const d of [3, 4, 5, 6]) {
      const j = (i + d) % SEATS;
      if (d === 6 && i >= SEATS / 2) continue;
      web.seg(tableAt[i], tableAt[j], d === 6 ? PALE : GOLD, d === 6 ? 0.9 : 0.55);
    }

  /* ---------- 舞台与大屏 ---------- */
  hall.box(-5.6, 5.6, 0, 0.4, -12.6, -9.4, GOLD, 0.8);
  hall.box(-5.9, 5.9, 0, 0.2, -9.4, -9.0, GOLD, 0.5);
  const SZ = -12.4;
  hall.path([[-4.7, 1.0, SZ], [4.7, 1.0, SZ], [4.7, 6.1, SZ], [-4.7, 6.1, SZ]], PALE, 0.95, true);
  hall.path([[-4.9, 0.85, SZ], [4.9, 0.85, SZ], [4.9, 6.25, SZ], [-4.9, 6.25, SZ]], GOLD, 0.6, true);
  hall.seg([-4.9, 0.85, SZ], [-4.9, 0.4, SZ], GOLD, 0.6);
  hall.seg([4.9, 0.85, SZ], [4.9, 0.4, SZ], GOLD, 0.6);
  hall.box(-3.7, -3.0, 0.4, 1.5, -10.3, -9.9, PALE, 0.8); // 讲台
  // 灯架与射灯
  for (const y of [7.4, 7.8]) hall.seg([-6.4, y, -9], [6.4, y, -9], GOLD, 0.7);
  for (let x = -6.4, k = 0; x < 6.39; x += 0.8, k++) hall.seg([x, k % 2 ? 7.4 : 7.8, -9], [x + 0.8, k % 2 ? 7.8 : 7.4, -9], GOLD, 0.45);
  for (const x of [-6.4, 6.4]) hall.seg([x, 0, -9], [x, 7.8, -9], GOLD, 0.55);
  const beams = new Lines();
  const spots: [number, V][] = [[-5, [-3.3, 0.4, -10.1]], [-3, [-1.2, 0.4, -10.8]], [-1, [0, 0.78, 0]], [1, [0, 0.78, 0]], [3, [1.4, 0.4, -10.8]], [5, [3.4, 0.4, -10.6]]];
  for (const [x, to] of spots) {
    hall.box(x - 0.16, x + 0.16, 7.05, 7.4, -9.16, -8.84, PALE, 0.8);
    lamps.push({ p: [x, 7.0, -9], c: PALE, s: 170, a: 0.95 });
    const r = to[1] > 0.5 ? 2.3 : 1.2;
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * TAU;
      beams.seg([x, 7.05, -9], [to[0] + r * Math.cos(a), to[1], to[2] + r * Math.sin(a)], PALE, 0.5);
    }
    beams.hoop(to[0], to[1] + 0.01, to[2], r, PALE, 0.6, 28);
  }

  /* ---------- 大屏上的内容：等高线、柱状图和一条上扬的曲线（按顺序画出来） ---------- */
  const screen = new Lines();
  const Z = SZ + 0.03;
  for (let k = 0; k < 6; k++) {
    const r = 0.35 + k * 0.3;
    for (let i = 0; i < 40; i++) {
      const p = (n: number): V => {
        const a = (n / 40) * TAU;
        const w = 1 + 0.2 * Math.sin(a * 3 + k) + 0.1 * Math.sin(a * 5 - k * 2);
        return [-2.5 + r * w * Math.cos(a) * 1.05, 3.6 + r * w * Math.sin(a) * 0.9, Z];
      };
      screen.seg(p(i), p(i + 1), k % 2 ? GOLD : PALE, 0.85);
    }
  }
  screen.path([[0.3, 5.5, Z], [0.3, 1.7, Z], [4.2, 1.7, Z]], GOLD, 0.8);
  const bars = [0.5, 0.8, 0.7, 1.2, 1.5, 1.4, 2.1, 2.6];
  bars.forEach((h, i) => {
    const x = 0.55 + i * 0.44;
    screen.path([[x, 1.7, Z], [x, 1.7 + h, Z], [x + 0.26, 1.7 + h, Z], [x + 0.26, 1.7, Z]], GOLD, 0.75);
  });
  const curve: V[] = bars.map((h, i) => [0.68 + i * 0.44, 2.3 + h + 0.25 * Math.sin(i * 1.7), Z]);
  screen.path(curve, PALE, 1);
  for (const c of curve) screen.hoop(c[0], c[1], Z, 0.001, PALE, 1, 3);

  /* ---------- 阶梯观众席：在圆桌南侧围成半圈 ---------- */
  const audience: Dot[] = [];
  const audAt: V[] = [];
  [5.2, 6.5, 7.8, 9.1, 10.4].forEach((r, row) => {
    const y = 0.06 + row * 0.2;
    const n = Math.floor(r * 2.3);
    const pts: V[] = [];
    for (let i = 0; i <= n; i++) {
      const a = (18 + (144 * i) / n) * (Math.PI / 180);
      const p: V = [r * Math.cos(a), y, r * Math.sin(a)];
      pts.push(p);
      hall.seg(p, [p[0] * 1.03, y + 0.42, p[2] * 1.03], GOLD, 0.45);
      audience.push({ p: [p[0], y + 0.72, p[2]], c: i % 5 === 0 ? PALE : GOLD, s: 84, a: 0.85 });
      audAt.push([p[0], y + 0.72, p[2]]);
    }
    hall.path(pts, GREY, 0.4);
  });

  /* ---------- 首屏的"人气"：圆桌上方的吊灯、四周的小圆桌 ---------- */
  for (const [r, y] of [[3.2, 6.2], [2.2, 6.9], [1.2, 7.5]]) {
    hall.hoop(0, y, 0, r, PALE, 0.8, 40);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * TAU + y;
      hall.seg([r * Math.cos(a), y, r * Math.sin(a)], [r * 0.3 * Math.cos(a), 9.6, r * 0.3 * Math.sin(a)], GOLD, 0.3);
      lamps.push({ p: [r * Math.cos(a), y - 0.12, r * Math.sin(a)], c: PALE, s: 120, a: 0.9 });
    }
  }
  hall.seg([0, 9.6, 0], [0, 13, 0], GOLD, 0.5);
  for (let n = 0; n < 8; n++) {
    // 北半场（舞台两侧和前方）的八张小圆桌，每桌六个人
    const a = Math.PI + (n < 4 ? -1 : 1) * (0.32 + (n % 4) * 0.3);
    const R = n % 2 ? 12.3 : 8.6;
    const tx = R * Math.cos(a);
    const tz = R * Math.sin(a) * 0.9 - 1;
    if (Math.abs(tx) < 6.4 && tz < -8.4) continue; // 不压在舞台上
    hall.hoop(tx, 0.74, tz, 0.95, PALE, 0.8, 24);
    hall.hoop(tx, 0.74, tz, 0.55, GOLD, 0.4, 16);
    hall.seg([tx, 0, tz], [tx, 0.74, tz], GOLD, 0.5);
    for (let i = 0; i < 6; i++) {
      const b = (i / 6) * TAU + n;
      const px = tx + 1.45 * Math.cos(b);
      const pz = tz + 1.45 * Math.sin(b);
      hall.seg([px, 0, pz], [px, 0.5, pz], GOLD, 0.4);
      hall.hoop(px, 0.5, pz, 0.2, GOLD, 0.5, 8);
      people.push({ p: [px, 1.05, pz], c: i % 3 === 0 ? RED : PALE, s: 90, a: 0.85 });
    }
  }

  /* ---------- 外圈：立柱、檐口和穹顶 ---------- */
  for (let i = 0; i < 20; i++) {
    const a = ((i + 0.5) / 20) * TAU;
    const x = 16 * Math.cos(a);
    const z = 16 * Math.sin(a);
    hall.seg([x, 0, z], [x, 7.6, z], GOLD, 0.5);
    hall.seg([x * 1.012, 0, z * 1.012], [x * 1.012, 7.6, z * 1.012], GOLD, 0.25);
    lamps.push({ p: [x * 0.99, 7.3, z * 0.99], c: PALE, s: 150, a: 0.8 }); // 柱顶的灯
    let prev: V = [x, 7.6, z];
    for (let k = 1; k <= 8; k++) {
      const t = k / 8;
      const r = 16 - 13.3 * t;
      const p: V = [r * Math.cos(a), 7.6 + 5.4 * Math.sin((t * Math.PI) / 2), r * Math.sin(a)];
      hall.seg(prev, p, GREY, 0.3);
      prev = p;
    }
  }
  hall.hoop(0, 7.6, 0, 16, GOLD, 0.6, 80);
  hall.hoop(0, 7.9, 0, 16, GOLD, 0.3, 80);
  for (const [r, y] of [[11.5, 10.4], [6.6, 12.3], [2.7, 13]]) hall.hoop(0, y, 0, r, GREY, 0.35, 56);
  // 会场里的浮尘
  for (let n = 0; n < 220; n++) {
    const a = rnd() * TAU;
    const r = rnd() * 15;
    lamps.push({ p: [r * Math.cos(a), 0.4 + rnd() * 10, r * Math.sin(a)], c: GOLD, s: 11 + rnd() * 10, a: 0.4 });
  }

  /* ---------- 两侧汇入的人流：每个光点沿一条弧线走到自己的席位 ---------- */
  const paths = new Lines();
  const routes: { a: V; m: V; b: V; ph: number; sp: number }[] = [];
  for (let side = 0; side < 2; side++) {
    const sign = side ? 1 : -1; // 0 西侧（矿权方），1 东侧（投资方）
    const mine = seatAt.filter((p) => Math.sign(p[0]) === sign);
    for (let n = 0; n < N_STREAM; n++) {
      // 一部分落到圆桌，其余落到同一侧的观众席
      const pool = audAt.filter((p) => Math.sign(p[0]) === sign);
      const b = n < 16 ? mine[n % mine.length] : pool[Math.floor(rnd() * pool.length)];
      const a: V = [sign * (22 + rnd() * 8), 0.9 + rnd() * 0.6, -5 + rnd() * 12];
      const m: V = [sign * (9 + rnd() * 4), 1.4 + rnd() * 2.6, (a[2] + b[2]) / 2 + (rnd() - 0.5) * 4];
      routes.push({ a, m, b, ph: rnd(), sp: 0.05 + rnd() * 0.05 });
      if (n % 4 === 0) {
        let prev = a;
        for (let k = 1; k <= 14; k++) {
          const t = k / 14;
          const u = 1 - t;
          const p: V = [u * u * a[0] + 2 * u * t * m[0] + t * t * b[0], u * u * a[1] + 2 * u * t * m[1] + t * t * b[1], u * u * a[2] + 2 * u * t * m[2] + t * t * b[2]];
          paths.seg(prev, p, sign > 0 ? RED : GOLD, 0.38 * Math.sin(Math.PI * t) + 0.06);
          prev = p;
        }
      }
    }
  }
  const stream = points(routes.map((_, i) => ({ p: [0, 0, 0], c: i < N_STREAM ? PALE : RED, s: 120, a: 1 })));

  return {
    hall: hall.geometry(),
    web: web.geometry(),
    beams: beams.geometry(),
    screen: screen.geometry(),
    screenCount: screen.pos.length / 3,
    paths: paths.geometry(),
    lamps: points(lamps),
    people: points(people),
    audience: points(audience),
    stream,
    routes,
  };
}

// 镜头的几个机位：[位置, 注视点]。3 之后镜头改为跟在飞机后上方
const POSES: [number[], number[]][] = [
  [[0, 5.4, 12.6], [0, 2.9, -3.5]], // 0 首屏：斜俯视会场
  [[3.6, 2.5, 5.6], [0, 0.95, 0]], // 1 闭门交流会：圆桌边
  [[0.7, 2.6, 3.4], [0, 3.5, -12]], // 2 项目推介会：走到大屏前
  [[-3, 4.1, -13.4], [-3.3, 2.2, -30]], // 3 穿过大屏，进到屏幕里的矿场
];
const bump = (g: number, c: number, w = 0.9) => Math.max(0, 1 - Math.abs(g - c) / w);

function Scene({ still }: { still: boolean }) {
  const g = useMemo(build, []);
  const mats = useMemo(
    () => ({
      line: lineMaterial(),
      web: lineMaterial(),
      beams: lineMaterial(),
      screen: lineMaterial(),
      paths: lineMaterial(),
      point: pointMaterial(),
      people: pointMaterial(),
      audience: pointMaterial(),
      stream: pointMaterial(),
    }),
    [],
  );
  const world = useRef<THREE.Group>(null);
  const level = useRef(0); // 屏幕里的矿场的可见程度
  const fly = useRef(0); // 镜头跟飞的进度
  const chase = useRef<Chase>({ pos: new THREE.Vector3(), fwd: new THREE.Vector3(0, 0, -1) });
  const s = useRef({ time: 0, g: 0, mx: 0, my: 0, intro: still ? 1 : 0, key: '' });
  const v = useMemo(() => ({ pos: new THREE.Vector3(), look: new THREE.Vector3(), a: new THREE.Vector3(), b: new THREE.Vector3() }), []);

  useFrame(({ camera, size }, dt) => {
    const st = s.current;
    const k = Math.min(1, dt * 2.6);
    if (!still) st.time += dt;
    if (view.ready) st.intro = Math.min(1, st.intro + dt / 1.8);
    st.mx += (view.mx - st.mx) * k * 0.5;
    st.my += (view.my - st.my) * k * 0.5;
    const e = 1 - Math.pow(1 - st.intro, 3);
    const T = st.time;

    // g：镜头走到哪了，完全由滚动位置决定，所以每一段都是连续滑过去的。
    // 0 首屏 → 1 圆桌 → 2 大屏前 → 3 屏幕里的矿场 → 4 跟着飞机越过矿坑 → 5 继续飞向远山
    const l = view.sumL;
    const target =
      smooth(0, 1, view.sumIn) + smooth(0.14, 0.32, l) + smooth(0.34, 0.5, l) + smooth(0.6, 0.86, l) + Math.min(1, view.sumDeep * 1.4);
    st.g += (target - st.g) * Math.min(1, dt * 2.2);
    const gc = Math.min(3, st.g);
    const gi = Math.min(POSES.length - 2, Math.floor(gc));
    const gt = smooth(0, 1, gc - gi);
    const A = POSES[gi];
    const B = POSES[gi + 1];

    const aspect = size.width / size.height;
    const wide = Math.min(1, Math.max(0, (aspect - 0.75) / 0.3));
    v.look.set(A[1][0] + (B[1][0] - A[1][0]) * gt, A[1][1] + (B[1][1] - A[1][1]) * gt, A[1][2] + (B[1][2] - A[1][2]) * gt);
    v.pos.set(A[0][0] + (B[0][0] - A[0][0]) * gt, A[0][1] + (B[0][1] - A[0][1]) * gt, A[0][2] + (B[0][2] - A[0][2]) * gt);
    // 竖屏视野窄，机位整体退远一些
    v.pos.sub(v.look).multiplyScalar(1 + (1 - wide) * 0.55).add(v.look);

    // 3 之后：镜头转过去，跟在飞机后上方一起飞
    const f = Math.max(0, st.g - 3);
    fly.current = f;
    if (f > 0.001 && chase.current) {
      const c = chase.current;
      // 拉远拉高：飞机只占画面一小块，前下方的矿坑和地面露出来
      const back = 19 + 4 * Math.max(0, f - 1) + (1 - wide) * 8;
      v.a.copy(c.pos).addScaledVector(c.fwd, -back);
      v.a.y += 8 + 2.5 * Math.max(0, f - 1);
      v.b.copy(c.pos).addScaledVector(c.fwd, 14);
      v.b.y -= 7;
      const w = smooth(0, 0.85, f);
      v.pos.lerp(v.a, w);
      v.look.lerp(v.b, w);
    }
    v.pos.x += st.mx * 0.6;
    v.pos.y -= st.my * 0.4;
    camera.position.copy(v.pos);
    camera.lookAt(v.look);

    // 会场缓慢转动；到圆桌边时转得明显一些，像绕桌走
    // 进到屏幕里之后不再转，免得矿场跟着晃
    if (world.current)
      world.current.rotation.y = ((still ? 0 : 0.1 * Math.sin(T * 0.16) + bump(st.g, 1, 0.8) * 0.5 * Math.sin(T * 0.22)) + st.mx * 0.04) * (1 - smooth(2.1, 2.9, st.g));

    // 宽屏把画面重心移到右侧，竖屏移到上方，给文字让位
    const cam = camera as THREE.PerspectiveCamera;
    const key = `${size.width}x${size.height}`;
    if (st.key !== key) {
      st.key = key;
      cam.setViewOffset(size.width, size.height, -0.17 * wide * size.width, 0.17 * (1 - wide) * size.height, size.width, size.height);
    }

    /* ---- 各部分的亮度 ---- */
    mats.line.uniforms.uOp.value = e;
    mats.point.uniforms.uOp.value = e;
    mats.paths.uniforms.uOp.value = e * (1 - smooth(0.4, 1.2, st.g) * 0.6);
    // 圆桌连线：在圆桌边时接通
    mats.web.uniforms.uOp.value = e * (0.14 + 0.86 * bump(st.g, 1, 1));
    g.web.setDrawRange(0, 2 * Math.round((g.web.getAttribute('position').count / 2) * (st.g < 0.5 ? 1 : smooth(0.55, 1.15, st.g))));
    // 射灯和大屏：面向舞台时亮起，屏上的图按顺序画出来
    mats.beams.uniforms.uOp.value = e * (0.3 + 0.35 * bump(st.g, 2, 1)) * (0.92 + 0.08 * Math.sin(T * 9));
    // 走到屏前后图表淡出，屏幕变成一扇窗，露出后面的矿场
    mats.screen.uniforms.uOp.value = e * (0.3 + 0.7 * smooth(1.2, 1.9, st.g)) * (1 - smooth(1.95, 2.45, st.g));
    level.current = e * smooth(1.75, 2.5, st.g);
    g.screen.setDrawRange(0, st.g < 1.1 ? g.screenCount : 2 * Math.round((g.screenCount / 2) * smooth(1.3, 2.05, st.g)));
    mats.people.uniforms.uOp.value = e * (0.7 + 0.3 * Math.sin(T * 2.4));
    mats.audience.uniforms.uOp.value = e * 0.85;

    // 汇入的光点：沿各自的弧线走向席位，到了就淡掉，再从场外重新出发
    const sp = g.stream.getAttribute('position') as THREE.BufferAttribute;
    const sa = g.stream.getAttribute('aA') as THREE.BufferAttribute;
    g.routes.forEach((r, i) => {
      const t = still ? r.ph : (T * r.sp + r.ph) % 1;
      const u = 1 - t;
      sp.setXYZ(i, u * u * r.a[0] + 2 * u * t * r.m[0] + t * t * r.b[0], u * u * r.a[1] + 2 * u * t * r.m[1] + t * t * r.b[1], u * u * r.a[2] + 2 * u * t * r.m[2] + t * t * r.b[2]);
      sa.setX(i, Math.min(1, t * 8) * Math.min(1, (1 - t) * 5));
    });
    sp.needsUpdate = true;
    sa.needsUpdate = true;
    mats.stream.uniforms.uOp.value = e * (1 - smooth(1.5, 2.2, st.g) * 0.5);
  });

  return (
    <group ref={world}>
      <lineSegments geometry={g.hall} material={mats.line} frustumCulled={false} />
      <lineSegments geometry={g.paths} material={mats.paths} frustumCulled={false} />
      <lineSegments geometry={g.web} material={mats.web} frustumCulled={false} />
      <lineSegments geometry={g.beams} material={mats.beams} frustumCulled={false} />
      <lineSegments geometry={g.screen} material={mats.screen} frustumCulled={false} />
      <points geometry={g.lamps} material={mats.point} frustumCulled={false} />
      <points geometry={g.people} material={mats.people} frustumCulled={false} />
      <points geometry={g.audience} material={mats.audience} frustumCulled={false} />
      <points geometry={g.stream} material={mats.stream} frustumCulled={false} />
      <MineWorld level={level} fly={fly} chase={chase} still={still} />
    </group>
  );
}

export default function SummitHall() {
  if (!webglAvailable()) return null;
  const mobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const still =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  return (
    <Canvas
      camera={{ fov: 46, near: 0.1, far: 160, position: [0, 9, 20] }}
      dpr={[1, mobile ? 1.5 : 1.75]}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
    >
      <Scene still={still} />
      <Bloom mobile={mobile} />
    </Canvas>
  );
}
