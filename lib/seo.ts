import type { Metadata } from 'next';
import { HTML_LANG, LANGS, MAIL, TEL, type Lang } from './content';
import { projects, ui } from './site';

/** 正式域名：站点地图、规范链接和分享卡片都以它为准 */
export const SITE_URL = 'https://www.zsktgroup.com';

/** 所有需要被搜索引擎收录的路径（不含语言前缀） */
export const PATHS = ['', '/about', '/projects', '/summit', '/contact', ...projects.map((p) => `/projects/${p.slug}`)];

export function orgJsonLd(lang: Lang) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: ui[lang].brand,
    legalName: ui[lang].legalName,
    alternateName: ['ZSMI', 'ZS Mining Investment', '浙商矿业'],
    url: `${SITE_URL}/${lang}`,
    logo: `${SITE_URL}/logo-zsmi.webp`,
    email: MAIL,
    telephone: TEL,
    address: [
      { '@type': 'PostalAddress', addressLocality: 'Hangzhou', addressRegion: 'Zhejiang', addressCountry: 'CN' },
      { '@type': 'PostalAddress', addressLocality: 'Hong Kong', addressCountry: 'HK' },
    ],
  };
}

export const ALL_LANGS = LANGS;

/** 项目详情只有这三种语言的正文；其余语言的详情页显示英文，搜索引擎应以英文页为准 */
export const PROJECT_LANGS: Lang[] = ['zh-cn', 'zh-hk', 'en'];

/** 默认的分享封面 */
export const SHARE_IMAGE = '/og.jpg';

/**
 * 一个页面的全套搜索与分享信息：标题、描述、规范链接、各语言版本的对应关系（含默认语言）、分享卡片。
 * langs：这个页面有独立内容的语言；当前语言不在其中时，规范链接指向英文版，避免被当成重复内容。
 */
export function pageMeta(
  l: Lang,
  path: string,
  title: string,
  description: string,
  opts: { image?: string; type?: 'website' | 'article'; langs?: Lang[] } = {},
): Metadata {
  const langs = opts.langs ?? LANGS;
  const canon = langs.includes(l) ? l : 'en';
  const image = opts.image ?? SHARE_IMAGE;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: opts.type ?? 'website',
      locale: HTML_LANG[l],
      siteName: ui[l].brand,
      url: `/${canon}${path}`,
      images: [image],
    },
    twitter: { card: 'summary_large_image', title, description, images: [image] },
    alternates: {
      canonical: `/${canon}${path}`,
      languages: { ...Object.fromEntries(langs.map((x) => [HTML_LANG[x], `/${x}${path}`])), 'x-default': `/en${path}` },
    },
  };
}
