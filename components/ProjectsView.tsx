'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import type { Lang } from '../lib/content';
import { projectImage, projects, projLang, projText, regions, type Project } from '../lib/site';
import { view } from '../lib/store';
import Label from './Label';

const pad = (n: number) => String(n).padStart(2, '0');

/** 项目卡片：首页和项目库底部的网格共用 */
export function ProjectCard({ p, lang, delay = 0, reveal = true }: { p: Project; lang: Lang; delay?: number; reveal?: boolean }) {
  const pl = projLang(lang);
  const pt = projText[lang];
  const b = p.t[pl];
  return (
    <Link
      className="pcard"
      href={`/${lang}/projects/${p.slug}`}
      data-reveal={reveal ? '' : undefined}
      style={{ transitionDelay: `${delay}s` }}
    >
      <div className="pcard-img">
        {p.images > 0 ? (
          <img src={projectImage(p, 1)} alt={b.name} loading="lazy" />
        ) : (
          <div className="pcard-ph" aria-hidden="true">
            {p.symbols.slice(0, 3).map((s) => (
              <b key={s}>{s}</b>
            ))}
          </div>
        )}
        <span className="pcard-sym">{p.symbols.join(' · ')}</span>
      </div>
      <div className="pcard-body">
        <small>
          ■ {regions[p.region][pl]} / {b.country}
        </small>
        <h3>{b.name}</h3>
        <dl>
          <div>
            <dt>{pt.mineral}</dt>
            <dd>{b.mineral}</dd>
          </div>
          <div>
            <dt>{pt.area}</dt>
            <dd>{b.area}</dd>
          </div>
          <div>
            <dt>{pt.stage}</dt>
            <dd>{b.stage}</dd>
          </div>
        </dl>
        <span className="pcard-more">
          {pt.view} <i aria-hidden="true">→</i>
        </span>
      </div>
    </Link>
  );
}

export default function ProjectsView({ lang }: { lang: Lang }) {
  const pl = projLang(lang);
  const pt = projText[lang];
  const keys = Object.keys(regions).filter((k) => projects.some((p) => p.region === k));
  const ref = useRef<HTMLElement>(null);
  // 巡览的步数：第 0 步是总览，之后每一步对应一个项目
  const n = projects.length + 1;
  const [step, setStep] = useState(0);
  const [prog, setProg] = useState(0);
  const cur = step > 0 ? projects[step - 1] : null;

  useEffect(() => {
    const onScroll = () => {
      const el = ref.current;
      if (!el) return;
      const vh = window.innerHeight;
      const r = el.getBoundingClientRect();
      const local = Math.min(1, Math.max(0, -r.top / (r.height - vh)));
      setStep(Math.min(n - 1, Math.floor(local * n)));
      setProg(local);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [n]);

  // 把当前项目告诉背景里的地球：它会转过去并拉近
  useEffect(() => {
    view.focus = cur ? cur.slug : '';
    view.region = 'all';
    return () => {
      view.focus = '';
    };
  }, [cur]);

  // 跳到巡览的第 k 步
  const jump = (k: number) => {
    const el = ref.current;
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: top + (el.offsetHeight - window.innerHeight) * ((k + 0.5) / n) });
  };

  // 从别的页面带着地区进来（例如联系页的"项目覆盖地区"）：直接跳到该地区的第一个项目
  useEffect(() => {
    const k = decodeURIComponent(window.location.hash.slice(1));
    const i = projects.findIndex((p) => p.region === k);
    if (i < 0) return;
    const id = window.setTimeout(() => jump(i + 1), 80);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const b = cur?.t[pl];

  return (
    <div className="lpage ppage">
      <section className="ptour" ref={ref}>
        <div className="ptour-sticky">
          <div className="ptour-panel" key={step}>
            {cur && b ? (
              <article className="tcard" lang={pl === lang ? undefined : 'en'}>
                <div className="tcard-img">
                  {cur.images > 0 ? (
                    <img src={projectImage(cur, 1)} alt={b.name} />
                  ) : (
                    <div className="pcard-ph" aria-hidden="true">
                      {cur.symbols.slice(0, 3).map((s) => (
                        <b key={s}>{s}</b>
                      ))}
                    </div>
                  )}
                  <span className="pcard-sym">{cur.symbols.join(' · ')}</span>
                </div>
                <div className="tcard-body">
                  <small>
                    ■ {pad(step)} / {pad(projects.length)} — {regions[cur.region][pl]} / {b.country}
                  </small>
                  <h2>{b.name}</h2>
                  <dl>
                    <div>
                      <dt>{pt.mineral}</dt>
                      <dd>{b.mineral}</dd>
                    </div>
                    <div>
                      <dt>{pt.area}</dt>
                      <dd>{b.area}</dd>
                    </div>
                    <div>
                      <dt>{pt.stage}</dt>
                      <dd>{b.stage}</dd>
                    </div>
                    <div>
                      <dt>{pt.coop}</dt>
                      <dd>{b.coop}</dd>
                    </div>
                  </dl>
                  <Link className="btn primary" href={`/${lang}/projects/${cur.slug}`}>
                    <span aria-hidden="true">↳</span>
                    {pt.view}
                  </Link>
                </div>
              </article>
            ) : (
              <div className="ptour-intro">
                <Label>Projects</Label>
                <h1>{pt.title}</h1>
                {pt.enNotice && <p className="notice">■ {pt.enNotice}</p>}
                <p className="body">{pt.intro}</p>
                <div className="chips">
                  {keys.map((k) => (
                    <button key={k} onClick={() => jump(projects.findIndex((p) => p.region === k) + 1)}>
                      {regions[k][pl]}
                      <i>{projects.filter((p) => p.region === k).length}</i>
                    </button>
                  ))}
                </div>
                <button className="ptour-next" onClick={() => jump(1)} aria-label={pt.view}>
                  <i />
                  01 — {pad(projects.length)}
                </button>
              </div>
            )}
          </div>

          <ol className="ptour-index">
            {projects.map((p, i) => (
              <li key={p.slug}>
                <button className={step === i + 1 ? 'on' : ''} onClick={() => jump(i + 1)}>
                  <small>{pad(i + 1)}</small>
                  {p.t[pl].country}
                  <i>{p.symbols.join(' · ')}</i>
                </button>
              </li>
            ))}
          </ol>
          <div className="ptour-bar" aria-hidden="true">
            <i style={{ transform: `scaleX(${prog})` }} />
          </div>
        </div>
      </section>

      <section className="plist">
        <div className="plist-head" data-reveal>
          <Label>{pt.all}</Label>
        </div>
        <div className="pgrid" lang={pl === lang ? undefined : 'en'}>
          {projects.map((p) => (
            <ProjectCard key={p.slug} p={p} lang={lang} reveal={false} />
          ))}
        </div>
      </section>
    </div>
  );
}
