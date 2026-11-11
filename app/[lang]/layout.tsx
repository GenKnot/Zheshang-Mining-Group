import type { Metadata, Viewport } from 'next';
import { notFound } from 'next/navigation';
import { content, HTML_LANG, LANGS, type Lang } from '../../lib/content';
import './globals.css';

type Props = { params: Promise<{ lang: string }> };

export function generateStaticParams() {
  return LANGS.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  if (!LANGS.includes(lang as Lang)) return {};
  const t = content[lang as Lang];
  return {
    title: t.meta.title,
    description: t.meta.desc,
    openGraph: { title: t.meta.title, description: t.meta.desc, type: 'website', locale: HTML_LANG[lang as Lang] },
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
    <html lang={HTML_LANG[lang as Lang]}>
      <body>
        {/* 浏览器禁用脚本时，直接显示全部内容 */}
        <noscript>
          <style>{`[data-reveal],.rise,.nav,.readout{opacity:1!important;transform:none!important;animation:none!important}.mask>span{animation:none!important}.loader{display:none!important}`}</style>
        </noscript>
        {children}
      </body>
    </html>
  );
}
