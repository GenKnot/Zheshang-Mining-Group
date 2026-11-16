import type { Metadata } from 'next';
import Site from '../../../components/Site';
import { HTML_LANG, LANGS, type Lang } from '../../../lib/content';
import { summit, ui } from '../../../lib/site';

type Props = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  const l = lang as Lang;
  if (!LANGS.includes(l)) return {};
  const title = `${summit[l].title} | ${ui[l].brand}`;
  const description = summit[l].lead;
  return {
    title,
    description,
    openGraph: { title, description, type: 'website', locale: HTML_LANG[l] },
    alternates: {
      canonical: `/${lang}/summit`,
      languages: Object.fromEntries(LANGS.map((x) => [HTML_LANG[x], `/${x}/summit`])),
    },
  };
}

export default async function Page({ params }: Props) {
  const { lang } = await params;
  return <Site initial={lang as Lang} page="summit" />;
}
