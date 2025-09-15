/** @type {import('next').NextConfig} */
const nextConfig = {
  // 禁用 React 严格模式以避免开发环境下的双重渲染
  reactStrictMode: false,
  
  // 生产环境优化
  output: 'standalone',
  
  // 压缩配置
  compress: true,
  
  // 配置静态文件服务
  async rewrites() {
    return [
      // 静态图片访问：/images/:category/:imageName
      {
        source: '/images/:category/:imageName',
        destination: '/api/images/static/:category/:imageName'
      },
      // 支持直接访问图片：/:category/:imageName (必须放在最后，避免与其他路由冲突)
      {
        source: '/:category/:imageName',
        destination: '/api/images/direct/:category/:imageName'
      }
    ];
  },

  // 配置 CORS
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ];
  },

  // 配置图片优化
  images: {
    domains: ['localhost'],
    formats: ['image/webp', 'image/avif'],
  },

  // 实验性功能
  experimental: {
    serverComponentsExternalPackages: ['fs-extra']
  }
};

module.exports = nextConfig;