// 根据环境动态设置 base 路径
const base = process.env.NODE_ENV === 'production' ? '/members-visualization/' : '/'

module.exports = {
  title: 'Datawhale 成员可视化',
  description: 'Datawhale 组织成员研究方向可视化展示平台',
  base,

  // 语言设置
  lang: 'zh-CN',

  // 路由配置
  cleanUrls: true,

  // 构建配置
  vite: {
    base,
    server: {
      port: 5173,
      host: true
    },
    build: {
      assetsDir: 'assets',
      rollupOptions: {
        output: {
          assetFileNames: 'assets/[name].[hash].[ext]',
          chunkFileNames: 'assets/chunks/[name].[hash].js',
          entryFileNames: 'assets/[name].[hash].js'
        }
      }
    }
  },

  // 网站头部配置
  head: [
    ['meta', { name: 'viewport', content: 'width=device-width, initial-scale=1.0' }],
    ['meta', { name: 'keywords', content: 'Datawhale, 数据可视化, 成员展示, ECharts, GitHub, 研究方向' }],
    ['meta', { name: 'author', content: 'Datawhale' }],
    ['meta', { property: 'og:title', content: 'Datawhale 成员可视化' }],
    ['meta', { property: 'og:description', content: 'Datawhale 组织成员研究方向可视化展示平台' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['link', { rel: 'icon', type: 'image/svg+xml', href: `${base}logo.svg` }],
    ['link', { rel: 'apple-touch-icon', href: `${base}logo.svg` }],
    // GitHub Pages SPA 路由处理
    ['script', {}, `
      (function(l) {
        if (l.search[1] === '/' ) {
          var decoded = l.search.slice(1).split('&').map(function(s) {
            return s.replace(/~and~/g, '&')
          }).join('?');
          window.history.replaceState(null, null,
              l.pathname.slice(0, -1) + decoded + l.hash
          );
        }
      }(window.location))
    `]
  ],

  themeConfig: {
    // 网站标题和 Logo
    logo: `${base}logo.png`,
    siteTitle: 'Datawhale 成员可视化',

    // 导航栏
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

    // 侧边栏
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

    // 社交链接
    socialLinks: [
      { icon: 'github', link: 'https://github.com/datawhalechina/members-visualization' }
    ],

    // 页脚
    footer: {
      message: '基于 MIT 协议发布 | 使用 VitePress + ECharts 构建',
      copyright: 'Copyright © 2024 Datawhale 开源社区'
    },

    // 搜索配置
    search: {
      provider: 'local',
      options: {
        translations: {
          button: {
            buttonText: '搜索文档',
            buttonAriaLabel: '搜索文档'
          },
          modal: {
            noResultsText: '无法找到相关结果',
            resetButtonTitle: '清除查询条件',
            footer: {
              selectText: '选择',
              navigateText: '切换'
            }
          }
        }
      }
    },

    // 编辑链接
    editLink: {
      pattern: 'https://github.com/datawhalechina/members-visualization/edit/main/docs/:path',
      text: '在 GitHub 上编辑此页面'
    },

    // 最后更新时间
    lastUpdated: {
      text: '最后更新于',
      formatOptions: {
        dateStyle: 'short',
        timeStyle: 'medium'
      }
    },

    // 文档页脚导航
    docFooter: {
      prev: '上一页',
      next: '下一页'
    },

    // 大纲配置
    outline: {
      label: '页面导航'
    },

    // 返回顶部
    returnToTopLabel: '回到顶部'
  }
}
