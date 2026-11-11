'use client';

import Link from 'next/link';
import type { Lang } from '../lib/content';
import { contactPage } from '../lib/content-more';
import { pageText } from '../lib/legal';

export default function NotFoundView({ lang }: { lang: Lang }) {
  const nf = pageText[lang].nf;
  return (
    <section className="hero nfpage">
      <div className="hero-inner">
        <p className="eyebrow rise" style={{ animationDelay: '.1s' }}>
          <i />
          ERROR 404
        </p>
        <b className="nf-num rise" aria-hidden="true" style={{ animationDelay: '.15s' }}>
          404
        </b>
        <h1 key={lang}>
          <span className="mask">
            <span style={{ animationDelay: '.3s' }}>{nf.title}</span>
          </span>
        </h1>
        <p className="sub rise" style={{ animationDelay: '.6s' }}>
          {nf.body}
        </p>
        <div className="cta rise" style={{ animationDelay: '.8s' }}>
          <Link className="btn primary" href={`/${lang}`}>
            <span aria-hidden="true">←</span>
            {contactPage[lang].home}
          </Link>
        </div>
      </div>
    </section>
  );
}
