'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { content, HTML_LANG, LANGS, MAIL, TEL, type Lang } from '../lib/content';
import { contactPage, ELEMENTS, more } from '../lib/content-more';
import { view } from '../lib/store';
import { pageText } from '../lib/legal';
import ContactView from './ContactView';
import LegalView from './LegalView';
import NotFoundView from './NotFoundView';
import Label from './Label';

const Terrain = dynamic(() => import('./Terrain'), { ssr: false });
const Globe = dynamic(() => import('./Globe'), { ssr: false });

const pad = (n: number) => String(n).padStart(2, '0');
const DOTS = 40;
const MAX_DEPTH = 3000;

// 加载开场每次整页加载只播一次；站内跳转回首页时不重播
let introSeen = false;

function Logo() {
  return (
    <svg viewBox="0 0 40 40" width="30" height="30" aria-hidden="true">
      <path d="M20 2 36 11v18L20 38 4 29V11z" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <path d="M9 27 16.5 15l4.5 6.5 3-4L31 27" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}

// 线框图标：四种几何体，纯 SVG 描边
function Wire({ kind }: { kind: number }) {
  const hex = '34,6 60,21 60,51 34,66 8,51 8,21';
  return (
    <svg className={`wire wire-${kind % 4}`} viewBox="0 0 120 72" aria-hidden="true">
      {kind % 4 === 0 &&
        [0, 1, 2, 3].map((i) => <polygon key={i} points={hex} style={{ ['--i' as string]: i }} />)}
      {kind % 4 === 1 && (
        <g>
          <path d="M60 6 96 24v26L60 68 24 50V24z" />
          <path d="M24 24 60 42l36-18M60 42v26" />
          <path d="M42 15 78 33M78 15 42 33" opacity=".5" />
        </g>
      )}
      {kind % 4 === 2 &&
        [0, 1, 2, 3].map((i) => (
          <ellipse key={i} cx="60" cy="36" rx={52 - i * 12} ry={30 - i * 7} style={{ ['--i' as string]: i }} />
        ))}
      {kind % 4 === 3 && (
        <g>
          <circle cx="44" cy="36" r="28" />
          <circle cx="76" cy="36" r="28" />
          <path d="M60 13v46M16 36h88" opacity=".5" />
        </g>
      )}
    </svg>
  );
}

type PageKind = 'home' | 'contact' | 'privacy' | 'legal' | 'notfound';

export default function Site({ initial, page = 'home' }: { initial: Lang; page?: PageKind }) {
  const home = page === 'home';
  // 当前页面在语言代码之后的路径；404 页保留访客输入的原路径
  const subOf = () =>
    page === 'notfound' ? window.location.pathname.replace(/^\/[^/]+/, '') : home ? '' : `/${page}`;
  const sub = home || page === 'notfound' ? '' : `/${page}`;
  const [lang, setLang] = useState<Lang>(initial);
  const [menu, setMenu] = useState(false);
  const [open, setOpen] = useState(false); // 手机端全屏菜单
  const [phase, setPhase] = useState<'loading' | 'ready' | 'out' | 'done'>(() =>
    home && !introSeen ? 'loading' : 'done',
  );
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState(0);
  const [bizP, setBizP] = useState(0);
  const [dots, setDots] = useState(0);
  const bizRef = useRef<HTMLElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const depthRef = useRef<HTMLSpanElement>(null);
  const t = content[lang];
  const m = more[lang];
  const navItems: [string, string][] = [
    [t.nav[0], 'about'],
    [t.nav[1], 'business'],
    [m.nav[0], 'minerals'],
    [m.nav[1], 'responsibility'],
  ];
  const go = phase === 'out' || phase === 'done';

  useEffect(() => {
    document.documentElement.lang = HTML_LANG[lang];
    const brand = content[lang].brand;
    document.title =
      page === 'home'
        ? content[lang].meta.title
        : page === 'contact'
          ? `${contactPage[lang].title} | ${brand}`
          : page === 'notfound'
            ? `404 | ${brand}`
            : `${pageText[lang][page]} | ${brand}`;
  }, [lang, page]);

  // 全屏菜单打开时锁住页面滚动
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  // 切换语言：只换文案并更新网址，不重新加载页面
  const pick = (l: Lang) => {
    setLang(l);
    setMenu(false);
    window.history.replaceState(null, '', `/${l}${subOf()}${window.location.hash}`);
  };

  useEffect(() => {
    if (!menu) return;
    const close = () => setMenu(false);
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, [menu]);

  // 加载开场：LOADING → READY → 四格退场
  useEffect(() => {
    if (phase === 'done' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      introSeen = true;
      view.ready = true;
      setPhase('done');
      return;
    }
    introSeen = true;
    const timers = [
      setTimeout(() => setPhase('ready'), 1100),
      setTimeout(() => {
        view.ready = true;
        setPhase('out');
      }, 1700),
      setTimeout(() => setPhase('done'), 2800),
    ];
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onScroll = () => {
      const vh = window.innerHeight;
      const max = document.documentElement.scrollHeight - vh;
      view.p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      if (barRef.current) barRef.current.style.transform = `scaleX(${view.p})`;
      if (depthRef.current)
        depthRef.current.textContent = String(Math.round(view.p * MAX_DEPTH)).padStart(4, '0');
      setDots(Math.round(view.p * DOTS));
      setScrolled(window.scrollY > 40);

      const el = bizRef.current;
      if (el) {
        const r = el.getBoundingClientRect();
        const local = Math.min(1, Math.max(0, -r.top / (r.height - vh)));
        const inView = r.top < vh * 0.5 && r.bottom > vh * 0.5;
        const idx = Math.min(3, Math.floor(local * 4));
        view.biz = inView ? idx : -1;
        view.bizL = local;
        setActive(idx);
        setBizP(local);
      } else {
        view.biz = -1;
        view.bizL = 0;
      }
    };
    const onMove = (e: PointerEvent) => {
      view.mx = (e.clientX / window.innerWidth) * 2 - 1;
      view.my = (e.clientY / window.innerHeight) * 2 - 1;
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      window.removeEventListener('pointermove', onMove);
    };
  }, []);

  useEffect(() => {
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => e.isIntersecting && e.target.classList.add('in')),
      { threshold: 0.15 },
    );
    document.querySelectorAll('[data-reveal]').forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <div className={go ? 'go' : ''}>
      {phase !== 'done' && (
        <div className={`loader ${phase}`} aria-hidden="true">
          <div className="q q1">
            <strong>// {content['zh-cn'].brand}</strong>
            <span>// ZHESHANG MINING GROUP</span>
            <span>// {phase === 'loading' ? 'PLEASE WAIT' : 'WELCOME'}</span>
          </div>
          <div className="q q2">
            <em>
              <i />
              {phase === 'loading' ? 'LOADING' : 'READY'}
            </em>
          </div>
          <div className="q q3">
            <small>■ N 22°19′ E 114°10′ — HONG KONG</small>
            <Wire kind={0} />
          </div>
          <div className="q q4">
            <small>■ N 30°12′ E 120°12′ — HANGZHOU</small>
            <Wire kind={2} />
          </div>
        </div>
      )}

      <div className="stage" aria-hidden="true">
        {page === 'contact' ? <Globe /> : <Terrain />}
      </div>
      <div className="vignette" aria-hidden="true" />
      <div className="gridlines" aria-hidden="true">
        <i />
        <i />
        <i />
        <i />
        <i />
      </div>
      <div className="progress" ref={barRef} aria-hidden="true" />

      <aside className="readout" aria-hidden="true">
        <div className="tag">
          <span ref={depthRef}>0000</span> M
        </div>
        <div className="dots">
          {Array.from({ length: DOTS }, (_, i) => (
            <i key={i} className={i < dots ? 'on' : ''} />
          ))}
        </div>
        <small>DEPTH</small>
      </aside>

      <header className={`nav${scrolled ? ' solid' : ''}`}>
        <Link className="brand" href={home ? '#top' : `/${lang}`}>
          <Logo />
          <span>
            <b>{t.brand}</b>
            <i>{t.brandSub}</i>
          </span>
        </Link>
        <nav>
          {navItems.map(([n, id]) => (
            <Link key={id} href={home ? `#${id}` : `/${lang}#${id}`}>
              {n}
            </Link>
          ))}
        </nav>
        <div className="lang" onClick={(e) => e.stopPropagation()}>
          <button aria-haspopup="listbox" aria-expanded={menu} onClick={() => setMenu(!menu)}>
            <svg viewBox="0 0 20 20" width="15" height="15" aria-hidden="true">
              <circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" strokeWidth="1.2" />
              <path d="M2 10h16M10 2c3 3 3 13 0 16M10 2c-3 3-3 13 0 16" fill="none" stroke="currentColor" strokeWidth="1.2" />
            </svg>
            {t.short}
          </button>
          {menu && (
            <ul role="listbox">
              {LANGS.map((l) => (
                <li key={l} role="option" aria-selected={l === lang}>
                  <a
                    href={`/${l}${sub}`}
                    lang={HTML_LANG[l]}
                    className={l === lang ? 'on' : ''}
                    onClick={(e) => {
                      e.preventDefault();
                      pick(l);
                    }}
                  >
                    {content[l].name}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
        <Link className="nav-cta" href={`/${lang}/contact`} aria-current={page === 'contact' ? 'page' : undefined}>
          {t.nav[2]}
        </Link>
        <button
          className={`burger${open ? ' on' : ''}`}
          aria-label="Menu"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          <i />
          <i />
        </button>
      </header>

      <div className={`mmenu${open ? ' on' : ''}`} aria-hidden={!open}>
        <nav>
          {navItems.map(([n, id], i) => (
            <Link
              key={id}
              href={home ? `#${id}` : `/${lang}#${id}`}
              tabIndex={open ? 0 : -1}
              style={{ transitionDelay: `${0.08 + i * 0.05}s` }}
              onClick={() => setOpen(false)}
            >
              <small>{pad(i + 1)}</small>
              {n}
            </Link>
          ))}
          <Link
            href={`/${lang}/contact`}
            tabIndex={open ? 0 : -1}
            style={{ transitionDelay: `${0.08 + navItems.length * 0.05}s` }}
            onClick={() => setOpen(false)}
          >
            <small>{pad(navItems.length + 1)}</small>
            {t.nav[2]}
          </Link>
        </nav>
        <p>
          <a href={`tel:${TEL.replace(/-/g, '')}`}>{TEL}</a>
          <a href={`mailto:${MAIL}`}>{MAIL}</a>
        </p>
      </div>

      <main>
        {home ? (
          <>
        <section className="hero" id="top">
          <div className="hero-inner">
            <p className="eyebrow rise" style={{ animationDelay: '.2s' }}>
              <i />
              {t.hero.eyebrow}
            </p>
            <h1 key={lang}>
              {t.hero.title.map((line, i) => (
                <span className="mask" key={line}>
                  <span style={{ animationDelay: `${0.3 + i * 0.16}s` }}>{line}</span>
                </span>
              ))}
            </h1>
            <p className="sub rise" style={{ animationDelay: '.8s' }}>
              {t.hero.sub}
            </p>
            <div className="cta rise" style={{ animationDelay: '1s' }}>
              <a className="btn primary" href="#about">
                <span aria-hidden="true">↳</span>
                {t.hero.cta}
              </a>
              <Link className="btn" href={`/${lang}/contact`}>
                {t.hero.cta2}
              </Link>
            </div>
          </div>
          <div className="hud rise" style={{ animationDelay: '1.4s' }}>
            <span>■ N 22°19′ E 114°10′ — HONG KONG</span>
            <span>■ N 30°12′ E 120°12′ — HANGZHOU</span>
          </div>
          <div className="scroll-hint rise" style={{ animationDelay: '1.4s' }}>
            <i />
            {t.hero.scroll}
          </div>
        </section>

        <section className="about light" id="about">
          <div className="sec-head">
            <div data-reveal>
              <Label n="01">{t.about.label}</Label>
            </div>
            <div>
              <h2 data-reveal>{t.about.title}</h2>
              <p className="body" data-reveal>
                {t.about.body}
              </p>
            </div>
          </div>
          <div className="culture">
            <div className="cell-head" data-reveal>
              <Label>{pageText[lang].culture.label}</Label>
            </div>
            {pageText[lang].culture.items.map(([k, d], i) => (
              <div key={k} data-reveal style={{ transitionDelay: `${i * 0.1}s` }}>
                <small>■ {k}</small>
                <p>{d}</p>
              </div>
            ))}
          </div>
          <div className="cells">
            <div className="cell-head" data-reveal>
              <Label>{t.about.principles}</Label>
            </div>
            {t.about.pillars.map((p, i) => (
              <div key={p.k} data-reveal style={{ transitionDelay: `${i * 0.1}s` }}>
                <Wire kind={i} />
                <small>
                  {pad(i + 1)} / {p.e}
                </small>
                <strong>{p.k}</strong>
                <span>{p.d}</span>
              </div>
            ))}
          </div>
        </section>

        <div className="marquee" aria-hidden="true">
          <div>
            {[0, 1].map((k) => (
              <span key={k}>
                RESOURCES // 资源 // CAPITAL // 资本 // INDUSTRY // 产业 // PARTNERSHIP // 合作 //&nbsp;
              </span>
            ))}
          </div>
        </div>

        <section className="biz" id="business" ref={bizRef}>
          <div className="biz-sticky">
            <div className="biz-left">
              <Label n="02">{t.biz.label}</Label>
              <ol>
                {t.biz.items.map((b, i) => (
                  <li key={b.t} className={i === active ? 'on' : ''}>
                    <span className="num">{pad(i + 1)}</span>
                    <div>
                      <h3>{b.t}</h3>
                      <p>{b.d}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
            <div className="biz-right">
              <div className="biz-wire" key={active}>
                <Wire kind={active} />
              </div>
              <div className="biz-meter">
                <b>{pad(active + 1)}</b>
                <span>/ {pad(t.biz.items.length)}</span>
                <div className="track">
                  <i style={{ transform: `scaleX(${bizP})` }} />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="minerals" id="minerals">
          <div className="sec-head">
            <div data-reveal>
              <Label n="03">{m.minerals.label}</Label>
            </div>
            <div>
              <h2 data-reveal>{m.minerals.title}</h2>
              <p className="body" data-reveal>
                {m.minerals.intro}
              </p>
            </div>
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

        <section className="resp light" id="responsibility">
          <div className="sec-head">
            <div data-reveal>
              <Label n="04">{m.resp.label}</Label>
            </div>
            <div>
              <h2 data-reveal>{m.resp.title}</h2>
            </div>
          </div>
          <div className="quad">
            {m.resp.items.map(([k, d], i) => (
              <div key={k} data-reveal style={{ transitionDelay: `${i * 0.08}s` }}>
                <small>{pad(i + 1)}</small>
                <strong>{k}</strong>
                <span>{d}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="process" id="process">
          <div className="sec-head">
            <div data-reveal>
              <Label n="05">{m.process.label}</Label>
            </div>
            <div>
              <h2 data-reveal>{m.process.title}</h2>
            </div>
          </div>
          <div className="steps">
            {m.process.items.map(([k, d], i) => (
              <div key={k} data-reveal style={{ transitionDelay: `${i * 0.14}s` }}>
                <i />
                <small>STEP {pad(i + 1)}</small>
                <strong>{k}</strong>
                <span>{d}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="band">
          <div data-reveal>
            <h2>{m.band.title}</h2>
            <p>{m.band.body}</p>
          </div>
          <Link className="btn dark" href={`/${lang}/contact`} data-reveal>
            <span aria-hidden="true">↳</span>
            {t.nav[2]}
          </Link>
        </section>

        <section className="contact" id="contact">
          <div className="contact-head">
            <div data-reveal>
              <Label n="06">{t.contact.label}</Label>
            </div>
            <h2 data-reveal>{t.contact.title}</h2>
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
              </article>
            ))}
          </div>
          <div className="lines" data-reveal>
            <a href={`tel:${TEL.replace(/-/g, '')}`}>
              <small>■ {t.contact.tel}</small>
              {TEL}
            </a>
            <a href={`mailto:${MAIL}`}>
              <small>■ {t.contact.mail}</small>
              {MAIL}
            </a>
          </div>
        </section>
          </>
        ) : (
          <>
            {page === 'contact' && <ContactView lang={lang} />}
            {(page === 'privacy' || page === 'legal') && <LegalView lang={lang} kind={page} />}
            {page === 'notfound' && <NotFoundView lang={lang} />}
          </>
        )}
      </main>

      <footer>
        <span className="brand small">
          <Logo />
          <span>
            <b>{t.brand}</b>
          </span>
        </span>
        <nav>
          <Link href={`/${lang}/privacy`}>{pageText[lang].privacy}</Link>
          <Link href={`/${lang}/legal`}>{pageText[lang].legal}</Link>
        </nav>
        <span>
          © {t.footer}
        </span>
      </footer>
    </div>
  );
}
