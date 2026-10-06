# Zexo

一个由社区驱动的静态博客后端控制面板，基于已归档的 "HexoPlusPlus" (https://github.com/HexoPlusPlus/HexoPlusPlus) 项目重构与延续。

# ✨ 项目简介

Zexo 是一个基于 CloudFlare Workers 和 CloudFlare KV 构建的静态博客后端管理面板。它延续了 HexoPlusPlus 的核心理念，旨在为 Hexo 等静态博客系统提供强大、易用且免费的后端支持，解决静态博客在内容管理、媒体处理和自动化部署中的痛点。

重要提示：本项目基于已归档的 HexoPlusPlus (GPL-3.0) 开发。感谢原作者的杰出贡献。Zexo 作为一个独立的重构版本，将继续在 GPL-3.0 协议下进行开发与维护。
# 🚀 核心特性

* 🚀 开箱即用：基于 CloudFlare 免费套餐，几分钟即可部署完毕。
* 📱 极致体验：现代化 Material Dashboard 界面，完美支持桌面端与移动端，提供细腻的写作与管理体验。
* 🖊️ 强大编辑器：集成代码高亮、实时预览、草稿箱、多图床支持，支持从本地或 URL 导入文件。
* ⚙️ 深度集成：原生支持 GitHub 图床、说说/朋友圈、Twikoo 评论增强、文件管理、访问统计与 WebHook 自动触发。
* ⚡ 边缘速度：运行在 CloudFlare 全球边缘网络，管理面板访问与数据读写延迟

# 🛠️ 技术栈

组件 说明
后端运行时 CloudFlare Workers
数据存储 CloudFlare KV
前端框架 jQuery+Bootstrap
核心依赖 已全面更新至最新稳定版本

# 🔄 从 HexoPlusPlus 迁移

Zexo 已完成从 HexoPlusPlus（`hpp`）到 Zexo（`zexo`）的全量改名：后台路由、KV 键、配置项、环境变量、前端函数名与 CSS 类名均已改为 `zexo_` / `zexot_` 前缀。

已有部署升级时，Worker 会自动兼容旧数据（首次打开管理面板即完成迁移）：

- **环境变量**：优先读取 `zexo_username` / `zexo_password` / `zexo_captcha`，未设置时自动回退到旧的 `hpp_*`。建议在 CloudFlare 面板中补上新的变量名。
- **KV 键**：读取 `zexo_*` 时若不存在会回退读取旧的 `hpp_*` 并自动写回新键（说说数据、签到时间、Twikoo token 等不会丢失）。
- **面板配置**：`zexo_config` 中的旧 `hpp_*` 配置项会在解析时自动改名并写回。
- **博客中嵌入的说说组件**：公开接口由 `/zexo/api/gethpptalk` 改为 `/zexo/api/getzexotalk`，前端对象 `hpp_talk` 改名为 `zexo_talk`，CSS 类前缀 `hppt_` 改为 `zexot_`，分页状态键 `hpp_start` 改为 `zexo_start`。博客里的嵌入代码需要同步更新：

  ```html
  <div id="zexo_talk"></div>
  <script src="https://cdn.jsdelivr.net/gh/Zarijaden/Zexo/src/talk_user.js"></script>
  <script>
    new zexo_talk({ id: "zexo_talk", domain: "你的域名", limit: 10, start: 0 });
  </script>
  ```

- **浏览器本地草稿**：编辑器自动备份的 localStorage 键（`hpp_editor_autobackup` 等）已改为 `zexo_*`，旧草稿不会自动迁移。

# 🧩 关于外部资源

加载动画、字体、搜索图标、默认头像 / OwO 列表等第三方静态资源，仍然引用上游 HexoPlusPlus CDN 及其他第三方仓库的公开地址：这些链接指向的是对方托管的文件本身，与 Zexo 的品牌命名无关，在 Zexo 自建同款资源之前保持不变，避免界面资源 404。

# 🤝 参与贡献

Zexo 是一个完全由社区驱动的开源项目，我们热烈欢迎任何形式的贡献！

- 报告问题：在使用中遇到任何 Bug 或有功能建议，请在 "Issues" (https://github.com/Zarijaden/Zexo/issues) 中提出。
- 提交代码：欢迎提交 Pull Request。
- 改进文档：文档是项目的重要组成部分，帮助改进文档同样宝贵。
- 分享与宣传：如果你觉得 Zexo 有用，请分享给更多人！

# 📄 开源协议

本项目基于 GNU General Public License v3.0 (GPL-3.0) 协议开源。

这意味着，你可以自由地使用、修改和分发本软件，但基于 Zexo 修改或衍生的软件在发布时也必须以 GPL-3.0 协议开源。这是对开源精神的延续与尊重。
# 🙏 致谢

Zexo 的诞生离不开以下项目的启发与支持：

- "HexoPlusPlus" (https://github.com/HexoPlusPlus/HexoPlusPlus) ：本项目的基石，感谢原作者的卓越工作。
- 所有曾为 HexoPlusPlus 项目贡献代码、提交 Issue 和反馈的用户。

Zexo —— 让静态博客管理，重新变得简单而强大。
