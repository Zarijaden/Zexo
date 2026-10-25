import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  lang: 'zh-CN',
  title: 'Zexo',
  titleTemplate: ':title | Zexo',
  description:
    'Zexo 是基于 Cloudflare Workers 与 Cloudflare KV 构建的静态博客后端管理面板：写作、图床、说说、自动部署触发，全部收进一个网页后台。',
  cleanUrls: true,

  head: [['link', { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }]],

  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    siteTitle: 'Zexo',

    nav: [
      { text: '指南', link: '/guide/introduction', activeMatch: '^/guide/' },
      { text: '后台功能', link: '/guide/dashboard' },
      { text: '博客集成', link: '/guide/blog-integration' },
      { text: '迁移指南', link: '/guide/migration' },
      { text: 'API 参考', link: '/reference/api', activeMatch: '^/reference/' }
    ],

    sidebar: {
      '/guide/': [
        {
          text: '开始',
          collapsed: false,
          items: [
            { text: '项目介绍', link: '/guide/introduction' },
            { text: '快速开始', link: '/guide/getting-started' },
            { text: '安装向导', link: '/guide/installation' }
          ]
        },
        {
          text: '使用指南',
          collapsed: false,
          items: [
            { text: '配置详解', link: '/guide/configuration' },
            { text: '后台功能用法', link: '/guide/dashboard' },
            { text: '博客集成', link: '/guide/blog-integration' }
          ]
        },
        {
          text: '进阶',
          collapsed: false,
          items: [
            { text: '从 HexoPlusPlus 迁移', link: '/guide/migration' },
            { text: '本地开发与构建', link: '/guide/development' },
            { text: '常见问题', link: '/guide/faq' }
          ]
        },
        {
          text: '参考',
          collapsed: false,
          items: [{ text: 'API 参考', link: '/reference/api' }]
        }
      ],
      '/reference/': [
        {
          text: '参考',
          items: [{ text: 'API 参考', link: '/reference/api' }]
        }
      ]
    },

    outline: {
      label: '本页目录',
      level: [2, 3]
    },

    docFooter: {
      prev: '上一页',
      next: '下一页'
    },

    lastUpdated: {
      text: '最后更新于'
    },

    editLink: {
      pattern: 'https://github.com/Zarijaden/Zexo/edit/main/docs/:path',
      text: '在 GitHub 上编辑此页'
    },

    returnToTopLabel: '回到顶部',
    sidebarMenuLabel: '菜单',
    darkModeSwitchLabel: '主题',
    lightModeSwitchTitle: '切换到浅色模式',
    darkModeSwitchTitle: '切换到深色主题',
    externalLinkIcon: true,

    search: {
      provider: 'local'
    },

    socialLinks: [{ icon: 'github', link: 'https://github.com/Zarijaden/Zexo' }],

    footer: {
      message:
        '基于 <a href="https://github.com/Zarijaden/Zexo/blob/main/LICENSE" target="_blank">GPL-3.0</a> 协议开源',
      copyright:
        'Copyright © 2024-2026 <a href="https://github.com/Zarijaden/Zexo" target="_blank">Zarijaden</a> 与贡献者'
    }
  }
})
