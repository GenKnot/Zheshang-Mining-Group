import type { NextConfig } from 'next';

const config: NextConfig = {
  async redirects() {
    return [{ source: '/', destination: '/zh-cn', permanent: false }];
  },
};

export default config;
