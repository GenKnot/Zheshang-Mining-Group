import type { Metadata } from 'next';
import { pageMeta } from '../../../lib/seo';
import Site from '../../../components/Site';
import { HTML_LANG, LANGS, type Lang } from '../../../lib/content';
import { summit, ui } from '../../../lib/site';

type Props = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  const l = lang as Lang;
  if (!LANGS.includes(l)) return {};
  return pageMeta(l, '/summit', `${summit[l].title} | ${ui[l].brand}`, summit[l].lead);
}

export default async function Page({ params }: Props) {
  const { lang } = await params;
  return <Site initial={lang as Lang} page="summit" />;
}
