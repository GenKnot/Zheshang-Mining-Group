import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Site from '../../../../components/Site';
import { HTML_LANG, LANGS, type Lang } from '../../../../lib/content';
import { projectBySlug, projectImage, projects, projLang, ui } from '../../../../lib/site';

type Props = { params: Promise<{ lang: string; slug: string }> };

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, slug } = await params;
  const l = lang as Lang;
  const p = projectBySlug(slug);
  if (!p || !LANGS.includes(l)) return {};
  const b = p.t[projLang(l)];
  const title = `${b.name} | ${ui[l].brand}`;
  return {
    title,
    description: b.summary,
    openGraph: {
      title,
      description: b.summary,
      type: 'article',
      locale: HTML_LANG[l],
      images: p.images > 0 ? [projectImage(p, 1)] : undefined,
    },
    alternates: {
      canonical: `/${lang}/projects/${slug}`,
      languages: Object.fromEntries(LANGS.map((x) => [HTML_LANG[x], `/${x}/projects/${slug}`])),
    },
  };
}

export default async function Page({ params }: Props) {
  const { lang, slug } = await params;
  if (!projectBySlug(slug)) notFound();
  return <Site initial={lang as Lang} page="project" slug={slug} />;
}
