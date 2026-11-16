import type { Metadata, Viewport } from 'next';
import { notFound } from 'next/navigation';
import { HTML_LANG, LANGS, type Lang } from '../../lib/content';
import { orgJsonLd, SITE_URL } from '../../lib/seo';
import { ui } from '../../lib/site';
import './globals.css';

type Props = { params: Promise<{ lang: string }> };

export function generateStaticParams() {
  return LANGS.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  if (!LANGS.includes(lang as Lang)) return {};
  const t = ui[lang as Lang];
  return {
    metadataBase: new URL(SITE_URL),
    title: t.metaTitle,
    description: t.metaDesc,
    openGraph: {
      title: t.metaTitle,
      description: t.metaDesc,
      type: 'website',
      locale: HTML_LANG[lang as Lang],
      siteName: t.brand,
    },
    alternates: {
      canonical: `/${lang}`,
      languages: Object.fromEntries(LANGS.map((l) => [HTML_LANG[l], `/${l}`])),
    },
  };
}

export const viewport: Viewport = {
  themeColor: '#0a0c0f',
  width: 'device-width',
  initialScale: 1,
};

export default async function RootLayout({ children, params }: Props & { children: React.ReactNode }) {
  const { lang } = await params;
  // 不认识的语言代码（包括 /favicon.ico 这类根路径请求）直接返回 404
  if (!LANGS.includes(lang as Lang)) notFound();
  return (
    <html lang={HTML_LANG[lang as Lang]} data-scroll-behavior="smooth">
      <body>
        {/* 浏览器禁用脚本时，直接显示全部内容 */}
        <noscript>
          <style>{`[data-reveal],.rise,.nav,.readout{opacity:1!important;transform:none!important;animation:none!important}.mask>span{animation:none!important}.loader{display:none!important}`}</style>
        </noscript>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd(lang as Lang)) }} />
        {children}
      </body>
    </html>
  );
}
