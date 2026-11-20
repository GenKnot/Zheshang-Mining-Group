import { notFound } from 'next/navigation';

// 静态导出要求动态路由声明要生成的路径；这里只生成一个占位路径，其余不存在的地址由服务器返回 404 页面
export function generateStaticParams() {
  return [{ rest: ['404'] }];
}

// 兜住所有不存在的子路径，交给同目录层级的 not-found 页面显示
export default function CatchAll() {
  notFound();
}
