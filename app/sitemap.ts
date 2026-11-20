import type { MetadataRoute } from 'next';
import { HTML_LANG, LANGS } from '../lib/content';
import { PATHS, PROJECT_LANGS, SITE_URL } from '../lib/seo';

// 静态导出时也要生成这个文件
export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  return PATHS.flatMap((path) => {
    // 项目详情页只收录有独立正文的语言版本
    const langs = path.startsWith('/projects/') ? PROJECT_LANGS : LANGS;
    return langs.map((l) => ({
      url: `${SITE_URL}/${l}${path}`,
      changeFrequency: path.startsWith('/projects') ? ('weekly' as const) : ('monthly' as const),
      priority: path === '' ? 1 : path.startsWith('/projects/') ? 0.8 : 0.7,
      alternates: { languages: Object.fromEntries(langs.map((x) => [HTML_LANG[x], `${SITE_URL}/${x}${path}`])) },
    }));
  });
}
