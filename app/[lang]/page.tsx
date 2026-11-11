import Site from '../../components/Site';
import type { Lang } from '../../lib/content';

export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  return <Site initial={lang as Lang} />;
}
