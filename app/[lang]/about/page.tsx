import type { Metadata } from 'next';
import Site from '../../../components/Site';
import { HTML_LANG, LANGS, type Lang } from '../../../lib/content';
import { about, ui } from '../../../lib/site';

type Props = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  const l = lang as Lang;
  if (!LANGS.includes(l)) return {};
  const title = `${about[l].title} | ${ui[l].brand}`;
  const description = about[l].lead;
  return {
    title,
    description,
    openGraph: { title, description, type: 'website', locale: HTML_LANG[l] },
    alternates: {
      canonical: `/${lang}/about`,
      languages: Object.fromEntries(LANGS.map((x) => [HTML_LANG[x], `/${x}/about`])),
    },
  };
}

export default async function Page({ params }: Props) {
  const { lang } = await params;
  return <Site initial={lang as Lang} page="about" />;
}
