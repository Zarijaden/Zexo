# 本地开发与构建

本章面向想改源码、参与贡献的开发者。

## 环境要求

- Node.js 18 或更高版本
- npm（随 Node 附带）

```bash
node -v
npm -v
```

## 命令一览

| 命令 | 作用 |
| --- | --- |
| `npm run dev` | 本地开发：`wrangler dev`，KV 数据持久化到 `.wrangler/state` |
| `npm run dev:remote` | 本地调试但连接远程 Cloudflare 资源 |
| `npm run deploy` | 部署到 Cloudflare（需先 `npx wrangler login`） |
| `npm run build` | gulp 压缩 `src/` 下的 CSS / JS 与 `index.js` 到 `dist/` |

## 目录结构

```text
Zexo/
├── index.js            # Cloudflare Worker 单文件应用（全部后端逻辑）
├── update.js           # 面板内更新检测脚本（从 GitHub 拉取执行）
├── wrangler.toml       # Workers 配置（KV 绑定、账户 ID 等）
├── gulpfile.js         # 构建脚本（压缩 CSS / JS 至 dist/）
├── package.json
└── src/                # 面板前端资源（经 jsDelivr CDN 加载）
    ├── admin_all.js        # 面板核心脚本（ajaxObject 等）
    ├── admin_all_light.css # 浅色主题样式
    ├── admin_all_dark.css  # 深色主题样式
    ├── zexo_theme.css      # 主题变量
    ├── home.js             # 主页统计与更新检测
    ├── edit.js             # 书写页逻辑
    ├── md_editor.js        # Markdown 编辑器（移植 Modrinth）
    ├── talk.js             # 说说管理
    ├── talk_user.js        # 博客前端说说组件
    ├── doc_man.js          # 文档管理
    ├── img_man.js          # 图片管理
    ├── config.js           # 设置页
    ├── tool.js             # 工具页
    ├── install.js          # 安装向导
    ├── login.css           # 登录页样式
    ├── error.js / error.css# 错误页
    └── ...
```

## 前端资源与 CDN

面板的前端资源不是打包进 Worker 的，而是通过 jsDelivr 从 GitHub 仓库加载：

```text
https://cdn.jsdelivr.net/gh/Zarijaden/Zexo/src/<文件名>
```

这意味着改 `src/` 下的文件并 push 后，等 CDN 刷新即可生效，不需要重新部署 Worker。第三方资源（OwO 列表、字体、RVerify 验证码等）仍引用上游仓库的公开地址，在 Zexo 自建同款资源之前保持不变。

## 版本号管理

发布新版本时需要同步四处：

| 位置 | 内容 |
| --- | --- |
| `index.js` 的 `zexo_ver` | 当前版本，如 `Zexo@1.5` |
| `update.js` 的 `zexo_lver` | 最新版本号（`dev` 后缀表示开发版通道） |
| `package.json` / `package-lock.json` | npm 包版本 |
| `update.js` | 更新提示与更新逻辑 |

`index.js` 顶部的注释提醒就是这件事，改版本时别忘。

## 构建 dist

```bash
npm run build
```

gulp 会把 `src/*.css`、`src/**/*.js` 与 `index.js` 压缩后输出到 `dist/`。`dist` 分支同时是面板内「小白鼠更新」的源，用于先行验证实验版本。

## 调试技巧

- `wrangler dev` 的日志会打印到终端，可在 `index.js` 中取消 `console.log` 注释观察请求；
- KV 数据在 `.wrangler/state` 中，删除该目录即可重置本地环境；
- 面板接口都可以用 curl 直接调试，记得带上登录 Cookie：

```bash
curl -b "username=<md5>; password=<md5>" \
  https://你的域名/zexo/admin/api/getlist
```

## 参与贡献

Zexo 是一个完全由社区驱动的开源项目：

- 报告问题：[GitHub Issues](https://github.com/Zarijaden/Zexo/issues)
- 提交代码：欢迎 Pull Request
- 改进文档：文档与代码同样重要
- 分享宣传：觉得有用就分享给更多人
