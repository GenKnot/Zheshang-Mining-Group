'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import type { Lang } from '../lib/content';
import { summit } from '../lib/site';
import { view } from '../lib/store';
import Label from './Label';
import PageHero from './PageHero';

const pad = (n: number) => String(n).padStart(2, '0');

export default function SummitView({ lang }: { lang: Lang }) {
  const s = summit[lang];
  const ref = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);
  const [prog, setProg] = useState(0);
  const n = s.formats.length;

  // 把这一段的滚动进度告诉背景里的会场：镜头依次走到圆桌、舞台、全场俯瞰
  useEffect(() => {
    const onScroll = () => {
      const el = ref.current;
      if (!el) return;
      const vh = window.innerHeight;
      const r = el.getBoundingClientRect();
      const local = Math.min(1, Math.max(0, -r.top / (r.height - vh)));
      view.sumL = local;
      // 这一段从屏幕下方滚进来的进度：镜头在这期间从首屏机位平滑推到圆桌
      view.sumIn = Math.min(1, Math.max(0, 1 - r.top / vh));
      view.sumOn = r.top < vh * 0.5 && r.bottom > vh * 0.5;
      // 这一段滚过去之后，余下的页面对应镜头继续升高的进度
      const past = -(r.bottom - vh * 0.5);
      const room = document.documentElement.scrollHeight - (window.scrollY + r.bottom) - vh * 0.5;
      view.sumDeep = past > 0 ? Math.min(1, past / Math.max(1, room)) : 0;
      setActive(Math.min(n - 1, Math.floor(local * n)));
      setProg(local);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      view.sumL = 0;
      view.sumIn = 0;
      view.sumOn = false;
      view.sumDeep = 0;
    };
  }, [n]);

  return (
    <div className="lpage apage spage">
      <PageHero tag="Summit" title={s.title} lead={s.lead} notice={s.status} k={lang} />

      <section className="biz adesc" ref={ref}>
        <div className="biz-sticky">
          <div className="biz-left">
            <Label n="01">{s.formatsLabel}</Label>
            <ol>
              {s.formats.map(([k, d], i) => (
                <li key={k} className={i === active ? 'on' : ''}>
                  <span className="num">{pad(i + 1)}</span>
                  <div>
                    <h3>{k}</h3>
                    <p>{d}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
          <div className="biz-right">
            <div className="biz-meter">
              <b>{pad(active + 1)}</b>
              <span>/ {pad(n)}</span>
              <div className="track">
                <i style={{ transform: `scaleX(${prog})` }} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 之后镜头升到会场上空，这两块做成悬浮卡片 */}
      <section className="afloat">
        {[
          { label: s.goalsLabel, title: s.goalsTitle, items: s.goals },
          { label: s.fieldsLabel, title: s.fieldsTitle, items: s.fields },
        ].map((b) => (
          <article key={b.label} data-reveal>
            <small>{b.label}</small>
            <h2>{b.title}</h2>
            <ul>
              {b.items.map((x, i) => (
                <li key={x}>
                  <i>{pad(i + 1)}</i>
                  {x}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </section>

      <section className="pd-block">
        <div data-reveal>
          <Label n="02">{s.whoLabel}</Label>
        </div>
        <ul className="hl">
          {s.who.map((w, i) => (
            <li key={w} data-reveal style={{ transitionDelay: `${i * 0.06}s` }}>
              <small>{pad(i + 1)}</small>
              {w}
            </li>
          ))}
        </ul>
      </section>

      <section className="cpage-back">
        <Link className="btn primary" href={`/${lang}/contact`}>
          <span aria-hidden="true">↳</span>
          {s.cta}
        </Link>
      </section>
    </div>
  );
}
