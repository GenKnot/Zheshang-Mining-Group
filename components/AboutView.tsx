'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import type { Lang } from '../lib/content';
import { ELEMENTS, more } from '../lib/content-more';
import { about, ui } from '../lib/site';
import { view } from '../lib/store';
import Label from './Label';
import PageHero from './PageHero';

const pad = (n: number) => String(n).padStart(2, '0');
const STEPS = 4; // 跟钻那一段里依次出现的小节数

export default function AboutView({ lang }: { lang: Lang }) {
  const a = about[lang];
  const m = more[lang];
  const steps = a.sections.slice(0, STEPS);
  // 前几节的第一段已经放进跟钻那一段，正文里只接着写余下的内容
  const rest = a.sections
    .map((s, i) => (i < STEPS ? { h: s.h, p: s.p.slice(1) } : s))
    .filter((s) => s.p.length > 0);
  const ref = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);
  const [prog, setProg] = useState(0);

  // 把这一段的滚动进度告诉背景里的钻机：镜头跟着钻头往下走
  useEffect(() => {
    const onScroll = () => {
      const el = ref.current;
      if (!el) return;
      const vh = window.innerHeight;
      const r = el.getBoundingClientRect();
      const local = Math.min(1, Math.max(0, -r.top / (r.height - vh)));
      view.rigL = local;
      view.rigOn = r.top < vh * 0.5 && r.bottom > vh * 0.5;
      // 这一段滚过去之后，余下的页面对应"继续下潜"的进度
      const past = -(r.bottom - vh * 0.5);
      const room = document.documentElement.scrollHeight - (window.scrollY + r.bottom) - vh * 0.5;
      view.rigDeep = past > 0 ? Math.min(1, past / Math.max(1, room)) : 0;
      setActive(Math.min(steps.length - 1, Math.floor(local * steps.length)));
      setProg(local);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      view.rigL = 0;
      view.rigOn = false;
      view.rigDeep = 0;
    };
  }, [steps.length]);

  return (
    <div className="lpage apage">
      <PageHero tag="About" title={a.title} lead={a.lead} k={lang} />

      <section className="biz adesc" ref={ref}>
        <div className="biz-sticky">
          <div className="biz-left">
            <ol>
              {steps.map((s, i) => (
                <li key={s.h} className={i === active ? 'on' : ''}>
                  <span className="num">{pad(i + 1)}</span>
                  <div>
                    <h3>{s.h}</h3>
                    <p>{s.p[0]}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
          <div className="biz-right">
            <div className="biz-meter">
              <b>{pad(active + 1)}</b>
              <span>/ {pad(steps.length)}</span>
              <div className="track">
                <i style={{ transform: `scaleX(${prog})` }} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 跟钻之后：镜头继续在地下的矿脉和晶簇之间下潜，正文做成悬浮的卡片，左右交错 */}
      {rest.length > 0 && (
        <section className="afloat">
          {rest.map((s, i) => (
            <article key={s.h} data-reveal>
              <small>
                {pad(i + 1)} / {pad(rest.length)}
              </small>
              <h2>{s.h}</h2>
              {s.p.map((x) => (
                <p key={x}>{x}</p>
              ))}
            </article>
          ))}
        </section>
      )}

      <section className="aminerals">
        <div className="aminerals-head" data-reveal>
          <Label>{m.minerals.label}</Label>
          <h2>{m.minerals.title}</h2>
        </div>
        <div className="tiles">
          {m.minerals.items.map(([name, use], i) => (
            <div key={name} data-reveal style={{ transitionDelay: `${(i % 3) * 0.08}s` }}>
              <small>{pad(ELEMENTS[i].n)}</small>
              <b>{ELEMENTS[i].s}</b>
              <strong>{name}</strong>
              <span>{use}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="pd-block">
        <div data-reveal>
          <Label>{a.deptLabel}</Label>
        </div>
        <div className="depts">
          {a.depts.map(([k, d], i) => (
            <div key={k} data-reveal style={{ transitionDelay: `${i * 0.08}s` }}>
              <small>{pad(i + 1)}</small>
              <strong>{k}</strong>
              <span>{d}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="pd-block">
        <div data-reveal>
          <Label>{a.ceoLabel}</Label>
        </div>
        <div className="ceo" data-reveal>
          <h2>{a.ceoName}</h2>
          <p className="ceo-title">{a.ceoTitle}</p>
          {a.ceoBio.map((x) => (
            <p key={x}>{x}</p>
          ))}
        </div>
      </section>

      <section className="cpage-back">
        <Link className="btn primary" href={`/${lang}/projects`}>
          <span aria-hidden="true">↳</span>
          {ui[lang].nav.projects}
        </Link>
        <Link className="btn" href={`/${lang}/contact`}>
          {ui[lang].nav.contact}
        </Link>
      </section>
    </div>
  );
}
