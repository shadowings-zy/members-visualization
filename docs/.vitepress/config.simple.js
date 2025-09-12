// 简化的VitePress配置，用于解决构建问题
const base = process.env.NODE_ENV === 'production' ? '/members-visualization/' : '/'

module.exports = {
  title: 'Datawhale 成员可视化',
  description: 'Datawhale 组织成员研究方向可视化展示平台',
  base,
  lang: 'zh-CN',
  cleanUrls: true,

  // 最简化的构建配置
  vite: {
    build: {
      chunkSizeWarningLimit: 2000
    }
  },

  head: [
    ['meta', { name: 'viewport', content: 'width=device-width, initial-scale=1.0' }],
    ['link', { rel: 'icon', type: 'image/png', href: `${base}logo.png` }],
    ['link', { rel: 'apple-touch-icon', href: `${base}logo.png` }]
  ],

  themeConfig: {
    logo: '/logo.png',
    siteTitle: 'Datawhale 成员可视化',

    nav: [
      { text: '🏠 首页', link: '/' },
      { text: '👥 成员页', link: '/members' },
      { text: '📈 统计页', link: '/stats' },
      {
        text: '🔗 相关链接',
        items: [
          { text: 'Datawhale 官网', link: 'https://www.datawhale.cn/' },
          { text: 'GitHub 组织', link: 'https://github.com/datawhalechina' },
          { text: '项目仓库', link: 'https://github.com/datawhalechina/members-visualization' }
        ]
      }
    ],

    sidebar: {
      '/': [
        {
          text: '📋 导航菜单',
          items: [
            { text: '🏠 首页', link: '/' },
            { text: '👥 成员页', link: '/members' },
            { text: '📈 统计页', link: '/stats' }
          ]
        }
      ]
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/datawhalechina/members-visualization' }
    ],

    footer: {
      message: '基于 MIT 协议发布 | 使用 VitePress + ECharts 构建',
      copyright: 'Copyright © 2024 Datawhale 开源社区'
    }
  }
}
