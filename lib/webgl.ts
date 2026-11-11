// 检查浏览器是否支持 WebGL；不支持时不渲染 3D 场景，页面其余部分照常显示
let cached: boolean | null = null;
export function webglAvailable() {
  if (cached !== null) return cached;
  try {
    const c = document.createElement('canvas');
    cached = !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    cached = false;
  }
  return cached;
}
