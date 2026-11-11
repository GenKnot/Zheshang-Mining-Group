'use client';

import Link from 'next/link';
import type { Lang } from '../lib/content';
import { contactPage } from '../lib/content-more';
import { docLang, docs, pageText, type LegalKind } from '../lib/legal';
import Label from './Label';

const pad = (n: number) => String(n).padStart(2, '0');

export default function LegalView({ lang, kind }: { lang: Lang; kind: LegalKind }) {
  const pt = pageText[lang];
  const dl = docLang(lang);
  const doc = docs[dl][kind];
  return (
    <div className="lpage" lang={dl === lang ? undefined : 'en'}>
      <section className="lpage-hero">
        <div className="sec-head">
          <div className="rise" style={{ animationDelay: '.1s' }}>
            <Label>{kind === 'privacy' ? 'Privacy' : 'Legal'}</Label>
          </div>
          <div>
            <h1 key={lang + kind} lang={undefined}>
              <span className="mask">
                <span style={{ animationDelay: '.15s' }}>{pt[kind]}</span>
              </span>
            </h1>
            {pt.enNotice && (
              <p className="notice rise" style={{ animationDelay: '.4s' }}>
                ■ {pt.enNotice}
              </p>
            )}
            <p className="body rise" style={{ animationDelay: '.5s' }}>
              {doc.intro}
            </p>
          </div>
        </div>
      </section>

      <section className="lpage-body">
        {doc.sections.map((s, i) => (
          <article key={s.h} data-reveal>
            <div>
              <small>{pad(i + 1)}</small>
            </div>
            <div>
              <h2>{s.h}</h2>
              {s.p.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </div>
          </article>
        ))}
      </section>

      <section className="cpage-back">
        <Link className="btn" href={`/${lang}`}>
          <span aria-hidden="true">←</span>
          {contactPage[lang].home}
        </Link>
      </section>
    </div>
  );
}
