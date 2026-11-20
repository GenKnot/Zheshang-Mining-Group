import type { Metadata } from 'next';
import { pageMeta, PROJECT_LANGS } from '../../../../lib/seo';
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
  return pageMeta(l, `/projects/${slug}`, `${b.name} | ${ui[l].brand}`, b.summary, {
    type: 'article',
    image: p.images > 0 ? projectImage(p, 1) : undefined,
    langs: PROJECT_LANGS,
  });
}

export default async function Page({ params }: Props) {
  const { lang, slug } = await params;
  if (!projectBySlug(slug)) notFound();
  return <Site initial={lang as Lang} page="project" slug={slug} />;
}
