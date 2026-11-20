import type { MetadataRoute } from 'next';
import { SITE_URL } from '../lib/seo';

// 静态导出时也要生成这个文件
export const dynamic = 'force-static';

export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: '*', allow: '/' }, sitemap: `${SITE_URL}/sitemap.xml` };
}
