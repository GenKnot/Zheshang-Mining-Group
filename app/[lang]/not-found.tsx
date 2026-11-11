'use client';

import { usePathname } from 'next/navigation';
import Site from '../../components/Site';
import { DEFAULT_LANG, LANGS, type Lang } from '../../lib/content';

// 语言从网址第一段读取（not-found 页面拿不到路由参数）
export default function NotFound() {
  const seg = (usePathname() ?? '').split('/')[1] as Lang;
  return <Site initial={LANGS.includes(seg) ? seg : DEFAULT_LANG} page="notfound" />;
}
