import type { NextConfig } from 'next';

// STATIC_EXPORT=1 时导出成纯静态文件（放到自己的服务器上用）；不设置时保持原样，供 Netlify 和本地开发使用
const staticExport = process.env.STATIC_EXPORT === '1';

const config: NextConfig = staticExport
  ? {
      output: 'export',
      // 静态文件没有图片处理服务；项目里也没有用到 next/image
      images: { unoptimized: true },
    }
  : {
      async redirects() {
        return [
          { source: '/', destination: '/zh-cn', permanent: false },
          // 项目改过网址，旧地址跳到新地址
          { source: '/:lang/projects/kyrgyzstan-ashutor-gold', destination: '/:lang/projects/kyrgyzstan-gold', permanent: true },
        ];
      },
    };

export default config;
