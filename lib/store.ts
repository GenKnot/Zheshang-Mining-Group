// 页面滚动状态，供 3D 场景逐帧读取（不触发 React 重渲染）
export const view = {
  p: 0, // 全页滚动进度 0..1
  biz: -1, bizL: 0, // 当前高亮的业务序号，-1 为无
  mx: 0, // 鼠标位置 -1..1
  my: 0,
  ready: false, // 加载开场结束后置为 true，地形开始展开
};
