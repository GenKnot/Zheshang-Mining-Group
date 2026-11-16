import { LANGS, MAIL, TEL, type Lang } from './content';
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
    alternateName: ['ZSMI', 'ZS Mining Investment', '浙商矿投'],
    url: `${SITE_URL}/${lang}`,
    email: MAIL,
    telephone: TEL,
    address: [
      { '@type': 'PostalAddress', addressLocality: 'Hangzhou', addressRegion: 'Zhejiang', addressCountry: 'CN' },
      { '@type': 'PostalAddress', addressLocality: 'Hong Kong', addressCountry: 'HK' },
    ],
  };
}

export const ALL_LANGS = LANGS;
