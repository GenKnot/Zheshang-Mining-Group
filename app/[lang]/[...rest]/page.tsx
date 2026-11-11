import { notFound } from 'next/navigation';

// 兜住所有不存在的子路径，交给同目录层级的 not-found 页面显示
export default function CatchAll() {
  notFound();
}
