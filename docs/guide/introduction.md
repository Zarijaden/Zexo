# 项目介绍

## 什么是 Zexo

Zexo 是一个由社区驱动的静态博客后端控制面板，基于 **Cloudflare Workers** 与 **Cloudflare KV** 构建。它延续了已归档项目 [HexoPlusPlus](https://github.com/HexoPlusPlus/HexoPlusPlus) 的核心理念，旨在为 Hexo 等静态博客系统提供强大、易用且免费的后端支持，解决静态博客在内容管理、媒体处理和自动化部署中的痛点。

简单来说：你像使用 WordPress 一样打开一个网页后台，就能写文章、传图片、发说说、触发部署——而你的博客本身仍然是纯静态的，跑在 GitHub Pages、Cloudflare Pages 或任何静态托管上。

## 为什么需要 Zexo

纯静态博客很轻快，但"纯静态"也意味着 publishing workflow 格外原始：

- 每篇文章都要在本地编辑器里写好，再手动 `git push`
- 图片得先传到图床，复制链接，再粘贴回文章
- 想发一条"说说 / 朋友圈"，却没有地方存
- 评论、访客统计需要再搭一套服务

Zexo 把这些事情收进一个网页后台。文章通过 GitHub Contents API 写进你的仓库，图片上传后返回 jsDelivr CDN 链接，说说与配置存放在 Cloudflare KV——全部由边缘网络上的一个 Worker 代理完成。

## 工作原理

```text
浏览器 ──▶ Cloudflare Worker（Zexo 单文件应用）
                │
                ├─▶ GitHub API ──▶ 文章仓库 source/_posts、source/_drafts
                │                  图片仓库 img/ ──▶ jsDelivr CDN
                │
                └─▶ Cloudflare KV ──▶ zexo_config、zexo_talk_data、列表索引缓存
```

一次典型的"发布文章"流程：

1. 你在面板的编辑器里写作，点击「发布文件」；
2. 浏览器把 Base64 编码的文章内容 POST 到 `/zexo/admin/api/adddoc/<文件名>`；
3. Worker 校验登录态后，调用 GitHub Contents API 把文件写入你的仓库（并提交一条 `Upload from Zexo@x.x` 的 commit）；
4. 你的博客构建流程（GitHub Actions / Vercel / Cloudflare Pages）检测到仓库变更，自动重新生成静态页面；
5. 图片上传走同样的链路，但返回的是 jsDelivr CDN 地址，可直接粘贴进正文。

## 功能一览

| 模块 | 能力 |
| --- | --- |
| 仪表盘 | 文章 / 图片统计、版本检测与一键更新 |
| 书写 | Markdown 编辑器、代码高亮、实时预览、草稿箱、OwO 表情、图床上传 |
| 说说 | 发布 / 删除 / 隐藏说说，支持从 Artitalk 导入 |
| 文档管理 | 文章与草稿列表、搜索、分页、删除、CDN 链接 |
| 图片管理 | 图片列表、灯箱预览、删除、CDN 链接 |
| 工具 | Artitalk 导入、触发 Pages 部署、销毁配置 |
| 设置 | 全部配置项的可视化增删改 |
| 博客集成 | 说说组件嵌入、博主活跃状态、Twikoo 评论增强 |

各模块的详细用法见 [后台功能用法](/guide/dashboard)。

## 技术栈

| 组件 | 说明 |
| --- | --- |
| 后端运行时 | Cloudflare Workers（单文件 `index.js`） |
| 数据存储 | Cloudflare KV（绑定名 `KVNAME`） |
| 前端框架 | jQuery + Bootstrap（Material Dashboard 主题） |
| Markdown 编辑器 | 移植 Modrinth 编辑命令的自研编辑器（`src/md_editor.js`） |
| 构建工具 | gulp（压缩产物至 `dist/`）+ wrangler（部署） |
| 协议 | GPL-3.0 |

## 与 HexoPlusPlus 的关系

Zexo 基于已归档的 HexoPlusPlus（GPL-3.0）重构与延续，感谢原作者的杰出贡献。Zexo 已完成从 `hpp` 到 `zexo` 的全量改名，并对旧部署做了自动兼容。如果你此前部署过 HexoPlusPlus，请阅读 [从 HexoPlusPlus 迁移](/guide/migration)。

::: tip 关于品牌命名
后台路由、KV 键、配置项、环境变量、前端函数名与 CSS 类名均已使用 `zexo_` / `zexot_` 前缀；部分第三方静态资源（OwO 列表、字体等）仍引用上游 CDN 地址，这与 Zexo 的品牌命名无关。
:::

## 开源协议

本项目基于 **GNU General Public License v3.0** 开源。你可以自由地使用、修改和分发本软件，但基于 Zexo 修改或衍生的软件在发布时也必须以 GPL-3.0 协议开源。
