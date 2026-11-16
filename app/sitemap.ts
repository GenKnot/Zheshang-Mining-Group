import type { MetadataRoute } from 'next';
import { HTML_LANG, LANGS } from '../lib/content';
import { PATHS, SITE_URL } from '../lib/seo';

export default function sitemap(): MetadataRoute.Sitemap {
  return PATHS.flatMap((path) =>
    LANGS.map((l) => ({
      url: `${SITE_URL}/${l}${path}`,
      changeFrequency: path.startsWith('/projects') ? ('weekly' as const) : ('monthly' as const),
      priority: path === '' ? 1 : path.startsWith('/projects/') ? 0.8 : 0.7,
      alternates: { languages: Object.fromEntries(LANGS.map((x) => [HTML_LANG[x], `${SITE_URL}/${x}${path}`])) },
    })),
  );
}
