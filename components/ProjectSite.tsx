'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { view } from '../lib/store';
import { webglAvailable } from '../lib/webgl';
import MineWorld, { EX, PIT, type Chase } from './MineWorld';
import { Bloom } from './Terrain';

/* 项目详情页的背景：和峰会页大屏里的是同一座矿场。
   首屏镜头绕着作业中的挖掘机缓慢环绕；往下滚时拉高，转向旁边的露天矿坑。 */

function Scene({ still }: { still: boolean }) {
  const level = useRef(0);
  const fly = useRef(0);
  const chase = useRef<Chase>({ pos: new THREE.Vector3(), fwd: new THREE.Vector3(0, 0, -1) });
  const s = useRef({ time: 0, t: 0, mx: 0, my: 0, intro: still ? 1 : 0, key: '' });
  const v = useMemo(() => ({ pos: new THREE.Vector3(), look: new THREE.Vector3(), a: new THREE.Vector3(), b: new THREE.Vector3() }), []);

  useFrame(({ camera, size }, dt) => {
    const st = s.current;
    if (!still) st.time += dt;
    if (view.ready) st.intro = Math.min(1, st.intro + dt / 1.8);
    st.mx += (view.mx - st.mx) * Math.min(1, dt * 1.5);
    st.my += (view.my - st.my) * Math.min(1, dt * 1.5);
    level.current = 1 - Math.pow(1 - st.intro, 3);

    // t：滚过了多少屏，直接决定镜头位置
    const t = Math.min(1.6, window.scrollY / Math.max(1, size.height));
    st.t += (t - st.t) * Math.min(1, dt * 4);
    const aspect = size.width / size.height;
    const wide = Math.min(1, Math.max(0, (aspect - 0.75) / 0.3));
    const far = 1 + (1 - wide) * 0.7; // 竖屏视野窄，整体退远

    // 首屏：绕挖掘机环绕
    const a = 1.15 + (still ? 0 : 0.22 * Math.sin(st.time * 0.13)) + st.mx * 0.12;
    v.pos.set(EX[0] + 18 * far * Math.cos(a), 6.2 - st.my * 0.6, EX[2] + 18 * far * Math.sin(a));
    // 宽屏时把视线对准挖掘机左侧，让挖掘机落在画面右半边，不压标题
    v.look.set(EX[0] - 5.5 * wide + 1, 2.3, EX[2]);
    // 往下滚：拉高后退，转向露天矿坑
    // 到了矿坑上空之后，随整页的滚动继续绕着矿坑慢慢转
    const o = 2.29 + view.p * 1.3 + (still ? 0 : 0.05 * Math.sin(st.time * 0.1));
    v.a.set(PIT.x + 66 * far * Math.cos(o), 30, PIT.z + 66 * far * Math.sin(o));
    v.b.set(PIT.x, -7, PIT.z);
    const w = Math.min(1, st.t / 1.2);
    const e = w * w * (3 - 2 * w);
    v.pos.lerp(v.a, e);
    v.look.lerp(v.b, e);
    camera.position.copy(v.pos);
    camera.lookAt(v.look);

    // 宽屏把画面重心移到右侧，竖屏移到下方，给标题让位
    const cam = camera as THREE.PerspectiveCamera;
    const key = `${size.width}x${size.height}`;
    if (st.key !== key) {
      st.key = key;
      cam.setViewOffset(size.width, size.height, -0.17 * wide * size.width, -0.14 * (1 - wide) * size.height, size.width, size.height);
    }
  });

  return <MineWorld level={level} fly={fly} chase={chase} still={still} heli />;
}

export default function ProjectSite() {
  if (!webglAvailable()) return null;
  const mobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const still =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  return (
    <Canvas
      camera={{ fov: 46, near: 0.1, far: 400, position: [6, 5, -18] }}
      dpr={[1, mobile ? 1.5 : 1.75]}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
    >
      <Scene still={still} />
      <Bloom mobile={mobile} />
    </Canvas>
  );
}
