'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { content, HTML_LANG, LANGS, MAIL, TEL, type Lang } from '../lib/content';
import { contactPage, ELEMENTS, more } from '../lib/content-more';
import { view } from '../lib/store';
import { pageText } from '../lib/legal';
import { about, home as homeText, projectBySlug, projects, projLang, projText, summit, ui } from '../lib/site';
import AboutView from './AboutView';
import ContactView from './ContactView';
import ProjectsView, { ProjectCard } from './ProjectsView';
import ProjectView from './ProjectView';
import SummitView from './SummitView';
import LegalView from './LegalView';
import NotFoundView from './NotFoundView';
import Label from './Label';

const Terrain = dynamic(() => import('./Terrain'), { ssr: false });
const Globe = dynamic(() => import('./Globe'), { ssr: false });
const ProjectGlobe = dynamic(() => import('./ProjectGlobe'), { ssr: false });
const AboutRig = dynamic(() => import('./AboutRig'), { ssr: false });
const SummitHall = dynamic(() => import('./SummitHall'), { ssr: false });
const ProjectSite = dynamic(() => import('./ProjectSite'), { ssr: false });

const pad = (n: number) => String(n).padStart(2, '0');
const DOTS = 40;
const MAX_DEPTH = 3000;

// 加载开场每次整页加载只播一次；站内跳转回首页时不重播
let introSeen = false;

/** 品牌字标：红色 ZSMI。拿到正式的标志文件后可以换成图片 */
// 公司标志：红色 ZSMI，字母 I 里嵌着一块矿石。透明底，直接压在深色导航上
function Logo() {
  // eslint-disable-next-line @next/next/no-img-element
  return <img className="zsmi" src="/logo-zsmi.webp" alt="ZSMI" width={359} height={144} />;
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

type PageKind = 'home' | 'about' | 'projects' | 'project' | 'summit' | 'contact' | 'privacy' | 'legal' | 'notfound';
const BIZ_COUNT = 3; // 首页"平台三大板块"的条数

export default function Site({ initial, page = 'home', slug }: { initial: Lang; page?: PageKind; slug?: string }) {
  const home = page === 'home';
  const project = page === 'project' && slug ? projectBySlug(slug) : undefined;
  // 当前页面在语言代码之后的路径；404 页保留访客输入的原路径
  const sub = home || page === 'notfound' ? '' : page === 'project' ? `/projects/${slug}` : `/${page}`;
  const subOf = () => (page === 'notfound' ? window.location.pathname.replace(/^\/[^/]+/, '') : sub);
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
  const u = ui[lang];
  const h = homeText[lang];
  // 导航：[文字, 链接, 对应的页面]
  const navItems: [string, string, string][] = [
    [u.nav.about, `/${lang}/about`, 'about'],
    [u.nav.business, home ? '#business' : `/${lang}#business`, ''],
    [u.nav.projects, `/${lang}/projects`, 'projects'],
    [u.nav.summit, `/${lang}/summit`, 'summit'],
  ];
  const here = page === 'project' ? 'projects' : page;
  const go = phase === 'out' || phase === 'done';

  useEffect(() => {
    document.documentElement.lang = HTML_LANG[lang];
    const brand = ui[lang].brand;
    const name =
      page === 'contact'
        ? contactPage[lang].title
        : page === 'about'
          ? about[lang].title
          : page === 'summit'
            ? summit[lang].title
            : page === 'projects'
              ? projText[lang].title
              : page === 'project'
                ? (project?.t[projLang(lang)].name ?? '')
                : page === 'notfound'
                  ? '404'
                  : page === 'home'
                    ? ''
                    : pageText[lang][page];
    document.title = page === 'home' ? ui[lang].metaTitle : `${name} | ${brand}`;
  }, [lang, page, project]);

  // 进入任何页面都从顶部开始；带锚点的链接（如 #business）除外
  useEffect(() => {
    if (!window.location.hash) window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [page, slug]);

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
        const idx = Math.min(BIZ_COUNT - 1, Math.floor(local * BIZ_COUNT));
        view.biz = inView ? idx : -1;
        view.bizL = local;
        setActive(idx);
        setBizP(local);
      } else {
        view.biz = -1;
        view.bizL = 0;
      }
      // 矿种、合作流程两段经过屏幕的进度（0 刚从下方进来，1 完全滚出上方），首页地形的镜头跟着走
      const through = (id: string) => {
        const s = document.getElementById(id);
        if (!s) return 0;
        const r = s.getBoundingClientRect();
        return Math.min(1, Math.max(0, (vh - r.top) / (r.height + vh)));
      };
      view.hMin = through('minerals');
      view.hProc = through('process');
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
            <strong>// ZSMI {ui['zh-cn'].brand}</strong>
            <span>// ZS MINING INVESTMENT</span>
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
        {page === 'contact' ? (
          <Globe lang={lang} />
        ) : page === 'projects' ? (
          <ProjectGlobe lang={lang} />
        ) : page === 'about' ? (
          <AboutRig />
        ) : page === 'summit' ? (
          <SummitHall />
        ) : page === 'project' ? (
          <ProjectSite />
        ) : (
          <Terrain />
        )}
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
            <b>{u.brand}</b>
            <i>{u.brandSub}</i>
          </span>
        </Link>
        <nav>
          {navItems.map(([n, href, key]) => (
            <Link key={href} href={href} aria-current={key && key === here ? 'page' : undefined}>
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
          {u.nav.contact}
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
          {navItems.map(([n, href], i) => (
            <Link
              key={href}
              href={href}
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
            {u.nav.contact}
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
              {h.heroEyebrow}
            </p>
            <h1 key={lang}>
              {h.heroTitle.map((line, i) => (
                <span className="mask" key={line}>
                  <span style={{ animationDelay: `${0.3 + i * 0.16}s` }}>{line}</span>
                </span>
              ))}
            </h1>
            <p className="sub rise" style={{ animationDelay: '.8s' }}>
              {h.heroSub}
            </p>
            <div className="cta rise" style={{ animationDelay: '1s' }}>
              <Link className="btn primary" href={`/${lang}/projects`}>
                <span aria-hidden="true">↳</span>
                {h.cta1}
              </Link>
              <Link className="btn" href={`/${lang}/contact`}>
                {h.cta2}
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
              <h2 data-reveal>{h.aboutTitle}</h2>
              <p className="body" data-reveal>
                {h.aboutBody}
              </p>
              <Link className="btn ink" href={`/${lang}/about`} data-reveal>
                <span aria-hidden="true">↳</span>
                {h.aboutMore}
              </Link>
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
              <Label n="02">{h.bizLabel}</Label>
              <ol>
                {h.biz.map((b, i) => (
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
                <span>/ {pad(h.biz.length)}</span>
                <div className="track">
                  <i style={{ transform: `scaleX(${bizP})` }} />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="hproj" id="projects">
          <div className="sec-head">
            <div data-reveal>
              <Label n="03">{h.projLabel}</Label>
            </div>
            <div>
              <h2 data-reveal>{h.projTitle}</h2>
              <p className="body" data-reveal>
                {h.projIntro}
              </p>
            </div>
          </div>
          <div className="pgrid" lang={projLang(lang) === lang ? undefined : 'en'}>
            {projects.map((p, i) => (
              <ProjectCard key={p.slug} p={p} lang={lang} delay={(i % 3) * 0.08} />
            ))}
          </div>
          <div className="hproj-more" data-reveal>
            <Link className="btn primary" href={`/${lang}/projects`}>
              <span aria-hidden="true">↳</span>
              {h.projAll}
            </Link>
          </div>
          <div className="regs">
            <div className="cell-head" data-reveal>
              <Label>{h.regLabel}</Label>
              <strong>{h.regTitle}</strong>
            </div>
            {h.regions.map(([k, d], i) => (
              <div key={k} data-reveal style={{ transitionDelay: `${i * 0.06}s` }}>
                <small>{pad(i + 1)}</small>
                <strong>{k}</strong>
                <span>{d}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="minerals" id="minerals">
          <div className="sec-head">
            <div data-reveal>
              <Label n="04">{m.minerals.label}</Label>
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
              <Label n="05">{m.resp.label}</Label>
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
              <Label n="06">{m.process.label}</Label>
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

        <section className="band" id="summit">
          <div className="band-in">
            <div data-reveal>
              <small>■ {h.sumLabel}</small>
              <h2>{h.sumTitle}</h2>
              <p>{h.sumBody}</p>
              <Link className="btn primary" href={`/${lang}/summit`}>
                <span aria-hidden="true">↳</span>
                {h.sumMore}
              </Link>
            </div>
            <ol data-reveal>
              {summit[lang].formats.map(([k], i) => (
                <li key={k}>
                  <small>{pad(i + 1)}</small>
                  <strong>{k}</strong>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="contact" id="contact">
          <div className="contact-head">
            <div data-reveal>
              <Label n="07">{t.contact.label}</Label>
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
            {page === 'about' && <AboutView lang={lang} />}
            {page === 'projects' && <ProjectsView lang={lang} />}
            {page === 'project' && project && <ProjectView lang={lang} project={project} />}
            {page === 'summit' && <SummitView lang={lang} />}
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
            <b>{u.brand}</b>
          </span>
        </span>
        <nav>
          <Link href={`/${lang}/about`}>{u.nav.about}</Link>
          <Link href={`/${lang}/projects`}>{u.nav.projects}</Link>
          <Link href={`/${lang}/summit`}>{u.nav.summit}</Link>
          <Link href={`/${lang}/contact`}>{u.nav.contact}</Link>
          <Link href={`/${lang}/privacy`}>{pageText[lang].privacy}</Link>
          <Link href={`/${lang}/legal`}>{pageText[lang].legal}</Link>
        </nav>
        <span>
          © {u.legalName}
        </span>
      </footer>
    </div>
  );
}
