'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { Lang } from '../lib/content';
import { projectImage, projectVideo, projLang, projText, regions, type Project } from '../lib/site';
import Label from './Label';

const pad = (n: number) => String(n).padStart(2, '0');

export default function ProjectView({ lang, project: p }: { lang: Lang; project: Project }) {
  const pl = projLang(lang);
  const pt = projText[lang];
  const b = p.t[pl];
  const [shot, setShot] = useState(-1); // 当前放大的图片序号
  const imgs = Array.from({ length: p.images }, (_, i) => projectImage(p, i + 1));
  const vids = Array.from({ length: p.videos ?? 0 }, (_, i) => projectVideo(p, i + 1));

  useEffect(() => {
    if (shot < 0) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShot(-1);
      if (e.key === 'ArrowRight') setShot((s) => (s + 1) % imgs.length);
      if (e.key === 'ArrowLeft') setShot((s) => (s - 1 + imgs.length) % imgs.length);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [shot, imgs.length]);

  return (
    <div className="lpage pdetail" lang={pl === lang ? undefined : 'en'}>
      <section className="lpage-hero">
        <div className="sec-head">
          <div className="rise" style={{ animationDelay: '.1s' }}>
            <Link className="back" href={`/${lang}/projects`}>
              <span aria-hidden="true">←</span> {pt.back}
            </Link>
          </div>
          <div>
            <p className="pd-kicker rise" style={{ animationDelay: '.1s' }}>
              ■ {regions[p.region][pl]} / {b.country}
              <span>{p.symbols.join(' · ')}</span>
            </p>
            <h1 key={lang + p.slug}>
              <span className="mask">
                <span style={{ animationDelay: '.15s' }}>{b.name}</span>
              </span>
            </h1>
            {pt.enNotice && (
              <p className="notice rise" style={{ animationDelay: '.4s' }} lang={undefined}>
                ■ {pt.enNotice}
              </p>
            )}
            <p className="body rise" style={{ animationDelay: '.5s' }}>
              {b.summary}
            </p>
          </div>
        </div>
      </section>

      {imgs.length > 0 && (
        <button className="pd-cover" onClick={() => setShot(0)} aria-label={pt.gallery}>
          <img src={imgs[0]} alt={b.name} />
        </button>
      )}

      <section className="pd-block">
        <div data-reveal>
          <Label n="01">{pt.facts}</Label>
        </div>
        <dl className="facts" data-reveal>
          {b.facts.map(([k, v]) => (
            <div key={k}>
              <dt>{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="pd-block">
        <div data-reveal>
          <Label n="02">{pt.highlights}</Label>
        </div>
        <ul className="hl">
          {b.highlights.map((h, i) => (
            <li key={h} data-reveal style={{ transitionDelay: `${i * 0.06}s` }}>
              <small>{pad(i + 1)}</small>
              {h}
            </li>
          ))}
        </ul>
      </section>

      {b.table && (
        <section className="pd-block">
          <div data-reveal>
            <Label n="03">{pt.list}</Label>
          </div>
          <div className="ptable" data-reveal>
            <table>
              <thead>
                <tr>
                  {b.table.head.map((h) => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {b.table.rows.map((r, i) => (
                  <tr key={i}>
                    {r.map((c, j) => (
                      <td key={j} data-th={b.table!.head[j]}>
                        {c}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {b.sections.length > 0 && (
        <section className="lpage-body">
          {b.sections.map((s, i) => (
            <article key={s.h} data-reveal>
              <div>
                <small>{pad(i + 1)}</small>
              </div>
              <div>
                <h2>{s.h}</h2>
                {s.p.map((x) => (
                  <p key={x}>{x}</p>
                ))}
              </div>
            </article>
          ))}
        </section>
      )}

      {imgs.length > 1 && (
        <section className="pd-block">
          <div data-reveal>
            <Label>{pt.gallery}</Label>
          </div>
          <div className="gallery">
            {imgs.map((src, i) => (
              <button key={src} onClick={() => setShot(i)} data-reveal style={{ transitionDelay: `${(i % 3) * 0.06}s` }}>
                <img src={src} alt={`${b.name} ${i + 1}`} loading="lazy" />
              </button>
            ))}
          </div>
        </section>
      )}

      {vids.length > 0 && (
        <section className="pd-block">
          <div data-reveal>
            <Label>{pt.videos}</Label>
          </div>
          <div className="pvideos">
            {vids.map((v, i) => (
              // 不自动播放、不预先下载：访客点了才加载，省流量
              <video key={v} controls playsInline muted preload="none" poster={`${v}.jpg`} data-reveal style={{ transitionDelay: `${(i % 3) * 0.06}s` }}>
                <source src={`${v}.mp4`} type="video/mp4" />
              </video>
            ))}
          </div>
        </section>
      )}

      <section className="inq" lang={undefined}>
        <div data-reveal>
          <h2>{pt.inquire}</h2>
          <p>{pt.inquireBody}</p>
        </div>
        <Link className="btn primary" href={`/${lang}/contact`} data-reveal>
          <span aria-hidden="true">↳</span>
          {pt.inquire}
        </Link>
      </section>


      {shot >= 0 && (
        <div className="lightbox" onClick={() => setShot(-1)} role="dialog" aria-modal="true">
          <img src={imgs[shot]} alt={`${b.name} ${shot + 1}`} />
          <span>
            {pad(shot + 1)} / {pad(imgs.length)}
          </span>
        </div>
      )}
    </div>
  );
}
