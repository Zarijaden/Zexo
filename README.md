Zexo

一个由社区驱动的静态博客后端控制面板，基于已归档的 "HexoPlusPlus" (https://github.com/HexoPlusPlus/HexoPlusPlus) 项目重构与延续。

✨ 项目简介

Zexo 是一个基于 CloudFlare Workers 和 CloudFlare KV 构建的静态博客后端管理面板。它延续了 HexoPlusPlus 的核心理念，旨在为 Hexo 等静态博客系统提供强大、易用且免费的后端支持，解决静态博客在内容管理、媒体处理和自动化部署中的痛点。

重要提示：本项目基于已归档的 HexoPlusPlus (GPL-3.0) 开发。感谢原作者的杰出贡献。Zexo 作为一个独立的重构版本，将继续在 GPL-3.0 协议下进行开发与维护。
🚀 核心特性

* 🚀 开箱即用：基于 CloudFlare 免费套餐，提供图形化向导安装，几分钟即可部署完毕。
* 📱 极致体验：完全重写的现代化 Material Dashboard 界面，完美支持桌面端与移动端，提供细腻的写作与管理体验。
* 🖊️ 强大编辑器：集成代码高亮、实时预览、草稿箱、多图床支持，支持从本地或 URL 导入文件。
* ⚙️ 深度集成：原生支持 GitHub 图床、说说/朋友圈、Twikoo 评论增强、文件管理、访问统计与 WebHook 自动触发。
* ⚡ 边缘速度：运行在 CloudFlare 全球边缘网络，管理面板访问与数据读写延迟

🛠️ 技术栈

组件 说明
后端运行时 CloudFlare Workers
数据存储 CloudFlare KV
前端框架 Vue 3 + Vite (计划)
UI 组件库 Vuetify / Element Plus (计划)
构建工具 Wrangler, npm
核心依赖 已全面更新至最新稳定版本

⚡ 快速开始

前置条件

1. 一个 CloudFlare 账户。
2. 一个已完成自动化部署（如通过 GitHub Actions）的 Hexo 博客。
3. Node.js 环境。

一键部署

# 1. 克隆仓库
git clone https://github.com/yourname/zexo.git
cd zexo

# 2. 安装依赖
npm install

# 3. 登录 CloudFlare
npx wrangler login

# 4. 初始化配置
npm run setup

# 5. 部署
npm run deploy

部署完成后，访问生成的 
"*.workers.dev" 域名即可开始使用。详细的图文教程，请参阅 "完整部署文档" (https://zexo.yourdomain.com/docs)。

📖 文档

- "🚀 快速上手" (https://zexo.yourdomain.com/docs/getting-started)
- "⚙️ 详细配置" (https://zexo.yourdomain.com/docs/configuration)
- "🖼️ 图床配置" (https://zexo.yourdomain.com/docs/image-hosting)
- "🚨 故障排除" (https://zexo.yourdomain.com/docs/troubleshooting)
- "🧩 插件开发" (https://zexo.yourdomain.com/docs/plugin) (开发中)

🧩 功能对比 (vs 原 HPP)

功能模块 Zexo (当前) 原 HPP (归档时) 状态
基础文章管理 ✅ 已实现 ✅ 已实现 完全兼容
现代化编辑器 ✅ 重写优化 ⚠️ 基础版 体验大幅提升
GitHub 图床 ✅ 已实现 ✅ 已实现 功能延续
文件管理器 ✅ 已实现 ✅ 已实现 功能延续
说说/朋友圈 ✅ 已实现 ✅ 已实现 功能延续
Twikoo 增强 ✅ 已实现 ✅ 已实现 功能延续
多图床支持 🚧 开发中 (Imgur, 7bu) ❌ 未实现 新增
国际化 (i18n) 🚧 开发中 ❌ 未实现 新增
插件系统 📅 计划中 ❌ 无 新增
多博客管理 📅 计划中 ❌ 无 新增

🤝 参与贡献

Zexo 是一个完全由社区驱动的开源项目，我们热烈欢迎任何形式的贡献！

- 报告问题：在使用中遇到任何 Bug 或有功能建议，请在 "Issues" (https://github.com/yourname/zexo/issues) 中提出。
- 提交代码：欢迎提交 Pull Request。请先阅读 "贡献指南" (CONTRIBUTING.md)。
- 改进文档：文档是项目的重要组成部分，帮助改进文档同样宝贵。
- 分享与宣传：如果你觉得 Zexo 有用，请分享给更多人！

📄 开源协议

本项目基于 GNU General Public License v3.0 (GPL-3.0) 协议开源。

这意味着，你可以自由地使用、修改和分发本软件，但基于 Zexo 修改或衍生的软件在发布时也必须以 GPL-3.0 协议开源。这是对开源精神的延续与尊重。
🙏 致谢

Zexo 的诞生离不开以下项目的启发与支持：

- "HexoPlusPlus" (https://github.com/HexoPlusPlus/HexoPlusPlus)：本项目的基石，感谢原作者的卓越工作。
- "Cloudflare Workers" (https://workers.cloudflare.com/)：提供了强大、免费的边缘计算平台。
- 所有曾为 HexoPlusPlus 项目贡献代码、提交 Issue 和反馈的用户。

Zexo —— 让静态博客管理，重新变得简单而强大。
