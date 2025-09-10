import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Datawhale 成员可视化',
  description: 'Datawhale 组织成员研究方向展示',
  // 根据环境动态设置 base 路径
  base: process.env.NODE_ENV === 'production' ? '/members-visualization/' : '/',

  // 网站头部配置
  head: [
    ['meta', { name: 'viewport', content: 'width=device-width, initial-scale=1.0' }],
    ['meta', { name: 'keywords', content: 'Datawhale, 数据可视化, 成员展示, ECharts' }],
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/logo.svg' }]
  ],

  themeConfig: {
    nav: [
      { text: '首页', link: '/' },
      { text: '成员可视化', link: '/members' }
    ],

    sidebar: [
      {
        text: '导航',
        items: [
          { text: '首页', link: '/' },
          { text: '成员可视化', link: '/members' }
        ]
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/datawhalechina' }
    ],

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2024 Datawhale'
    },

    // 搜索配置
    search: {
      provider: 'local'
    }
  },

  // 确保静态资源能正确访问
  assetsDir: 'assets',

  // 开发服务器配置
  server: {
    port: 5173,
    host: true
  },

  // 构建优化
  build: {
    minify: 'terser',
    chunkSizeWarningLimit: 1000
  }
})
