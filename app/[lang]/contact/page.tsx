import type { Metadata } from 'next';
import Site from '../../../components/Site';
import { content, HTML_LANG, LANGS, type Lang } from '../../../lib/content';
import { contactPage } from '../../../lib/content-more';

type Props = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  const l = lang as Lang;
  return {
    title: `${contactPage[l].title} | ${content[l].brand}`,
    description: contactPage[l].intro,
    alternates: {
      canonical: `/${lang}/contact`,
      languages: Object.fromEntries(LANGS.map((x) => [HTML_LANG[x], `/${x}/contact`])),
    },
  };
}

export default async function Page({ params }: Props) {
  const { lang } = await params;
  return <Site initial={lang as Lang} page="contact" />;
}
