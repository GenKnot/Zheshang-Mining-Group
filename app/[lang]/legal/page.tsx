import type { Metadata } from 'next';
import Site from '../../../components/Site';
import { content, HTML_LANG, LANGS, type Lang } from '../../../lib/content';
import { docLang, docs, pageText } from '../../../lib/legal';

type Props = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  const l = lang as Lang;
  return {
    title: `${pageText[l].legal} | ${content[l].brand}`,
    description: docs[docLang(l)].legal.intro,
    alternates: {
      canonical: `/${lang}/legal`,
      languages: Object.fromEntries(LANGS.map((x) => [HTML_LANG[x], `/${x}/legal`])),
    },
  };
}

export default async function Page({ params }: Props) {
  const { lang } = await params;
  return <Site initial={lang as Lang} page="legal" />;
}
