'use client';

import Link from 'next/link';
import { useState } from 'react';
import { content, MAIL, TEL, type Lang } from '../lib/content';
import { contactPage } from '../lib/content-more';
import Label from './Label';

// 地图搜索用的地址（中文原文，定位最准确）
const MAP_QUERY = ['香港旺角亞皆老街2C號啟如商業大廈', '杭州市滨江区世茂智慧之门B塔'];

function mapUrl(lang: Lang, i: number) {
  const q = encodeURIComponent(MAP_QUERY[i]);
  // 简体版用高德地图（内地可访问），其余语言用 Google 地图
  return lang === 'zh-cn'
    ? `https://uri.amap.com/search?keyword=${q}`
    : `https://www.google.com/maps/search/?api=1&query=${q}`;
}

export default function ContactView({ lang }: { lang: Lang }) {
  const t = content[lang];
  const c = contactPage[lang];
  const [f, setF] = useState({ name: '', company: '', email: '', message: '' });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setF({ ...f, [k]: e.target.value });

  // 没有后台：把表单内容拼成邮件，由访客在自己的邮件客户端里发送
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const body = [
      `${c.name}: ${f.name}`,
      `${c.company}: ${f.company}`,
      `${c.email}: ${f.email}`,
      '',
      f.message,
    ].join('\n');
    window.location.href = `mailto:${MAIL}?subject=${encodeURIComponent(c.subject)}&body=${encodeURIComponent(body)}`;
  };

  return (
    <div className="cpage">
      <section className="hero cpage-hero">
        <div className="hero-inner">
          <p className="eyebrow rise" style={{ animationDelay: '.1s' }}>
            <i />
            HONG KONG — HANGZHOU
          </p>
          <h1 key={lang}>
            <span className="mask">
              <span style={{ animationDelay: '.2s' }}>{c.title}</span>
            </span>
          </h1>
          <p className="sub rise" style={{ animationDelay: '.6s' }}>
            {c.intro}
          </p>
          <div className="cta rise" style={{ animationDelay: '.8s' }}>
            <a className="btn primary" href={`mailto:${MAIL}`}>
              <span aria-hidden="true">↳</span>
              {MAIL}
            </a>
            <a className="btn" href={`tel:${TEL.replace(/-/g, '')}`}>
              {TEL}
            </a>
          </div>
        </div>
        <div className="scroll-hint rise" style={{ animationDelay: '1.2s' }}>
          <i />
          {t.hero.scroll}
        </div>
      </section>

      <section className="cpage-block">
        <div className="block-label" data-reveal>
          <Label n="01">{c.offices}</Label>
        </div>
        <div className="offices">
          {t.contact.offices.map((o, i) => (
            <article key={o.city} data-reveal style={{ transitionDelay: `${i * 0.1}s` }}>
              <small>■ {o.coord}</small>
              <h3>
                {o.city}
                <i>{o.en}</i>
              </h3>
              <p>{o.addr}</p>
              <a className="maplink" href={mapUrl(lang, i)} target="_blank" rel="noopener noreferrer">
                <span aria-hidden="true">↗</span>
                {c.map}
              </a>
            </article>
          ))}
        </div>
      </section>

      <section className="cpage-block cpage-split">
        <div>
          <div className="block-label" data-reveal>
            <Label n="02">{c.general}</Label>
          </div>
          <div className="lines stacked" data-reveal>
            <a href={`tel:${TEL.replace(/-/g, '')}`}>
              <small>■ {t.contact.tel}</small>
              {TEL}
            </a>
            <a href={`mailto:${MAIL}`}>
              <small>■ {t.contact.mail}</small>
              {MAIL}
            </a>
          </div>
        </div>
        <div>
          <div className="block-label" data-reveal>
            <Label n="03">{c.form}</Label>
          </div>
          <form className="cform" onSubmit={submit} data-reveal>
            <label>
              <span>{c.name}</span>
              <input value={f.name} onChange={set('name')} autoComplete="name" required />
            </label>
            <label>
              <span>{c.company}</span>
              <input value={f.company} onChange={set('company')} autoComplete="organization" />
            </label>
            <label className="wide">
              <span>{c.email}</span>
              <input type="email" value={f.email} onChange={set('email')} autoComplete="email" required />
            </label>
            <label className="wide">
              <span>{c.message}</span>
              <textarea rows={5} value={f.message} onChange={set('message')} required />
            </label>
            <div className="wide cform-foot">
              <button className="btn primary" type="submit">
                <span aria-hidden="true">↳</span>
                {c.send}
              </button>
              <small>{c.note}</small>
            </div>
          </form>
        </div>
      </section>

      <section className="cpage-back">
        <Link className="btn" href={`/${lang}`}>
          <span aria-hidden="true">←</span>
          {c.home}
        </Link>
      </section>
    </div>
  );
}
