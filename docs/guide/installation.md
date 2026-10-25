# 安装向导

当 KV 中还不存在 `zexo_config` 时，访问任意 `/zexo/admin` 页面都会自动跳转到安装页。安装页收集全部面板配置，一次性写入 KV，之后即可进入后台正常使用。

## 表单分组说明

安装页的表单按功能分为六组。所有字段最终以 `zexo_` 为前缀存入 KV，可随时在「设置」页修改。

### 基本信息

| 字段 | 说明 | 示例 |
| --- | --- | --- |
| 域名 | 你的 Worker 域名，不含协议头 | `zexo.example.workers.dev` |
| 头像地址 | 面板右上角显示的博主头像 | `https://.../avatar.png` |
| 标题 | 面板左上角与浏览器标题 | `我的后台` |
| icon 地址 | 面板 favicon | `https://.../favicon.ico` |
| 跨域请求 | 列表类 API 返回的 `Access-Control-Allow-Origin` 值 | `*` |

### 面板配置

| 字段 | 说明 | 默认参考 |
| --- | --- | --- |
| OwOJSON 地址 | OwO 表情选择器的数据文件 | 见面板占位符 |
| 面板背景图片 | 侧边栏背景图，留空则使用纯色背景 | 留空 |
| 懒加载图片 | 图片加载中的占位图 | 见面板占位符 |
| 高亮样式 | highlight.js 主题名 | `github` |
| 面板选项卡颜色 | 侧边栏配色：`azure` / `rose` / `purple` 等 | `azure` |
| 面板选项框颜色 | `white` / `black` | `white` |
| 面板主题色 | `light` / `dark` | `light` |
| 列表限制数量 | 文章 / 图片列表每页条数 | `10` |

### GitHub 信息

| 字段 | 说明 |
| --- | --- |
| Github 文档仓库 Token | 对文章仓库有读写权限的 Token |
| Github 图片仓库 Token | 对图片仓库有读写权限的 Token |
| Github 文档仓库用户名 | 文章仓库归属用户 / 组织 |
| Github 图片仓库用户名 | 图片仓库归属用户 / 组织 |
| Github 文档仓库名 | 文章仓库名，如 `blog` |
| Github 图片仓库名 | 图片仓库名，如 `image` |
| Github 文档仓库根目录 | Hexo 站点在仓库中的根目录，文章发布到 `<根目录>source/_posts/`，草稿到 `source/_drafts/` |
| Github 图片仓库路径 | 图片上传目录，如 `/img/` |
| Github 文档仓库分支 | 文章仓库分支，如 `master` |
| Github 图片仓库分支 | 图片仓库分支，如 `main` |

::: tip 路径格式
根目录与图片路径都**以斜杠开头**、以斜杠结尾，例如 `/` 和 `/img/`。文章会发布到 `<根目录>source/_posts/<文件名>.md`。
:::

### 附加功能

| 字段 | 说明 |
| --- | --- |
| 是否自动签到 | `True` 时每次打开面板自动刷新「博主活跃状态」时间戳 |

### CloudFlare 访问功能

| 字段 | 说明 |
| --- | --- |
| Global API Key | Cloudflare 账户的 Global API Key，用于面板内一键更新 Worker |
| 目标 Workers 名称 | 要更新的 Worker 名称 |
| Workers 账户 ID | Cloudflare 账户 ID |
| 账户登录邮箱 | Cloudflare 账户邮箱 |
| Pages 部署钩子 URL | Cloudflare Pages 的 Deploy Hook，用于一键触发博客重新构建 |

### Twikoo 加强

| 字段 | 说明 |
| --- | --- |
| Twikoo 环境 ID | 腾讯云开发环境 ID，启用评论增强代理，见 [博客集成](/guide/blog-integration) |

## 提交之后

- 所有配置以双重 JSON 编码的形式写入 KV 键 `zexo_config`
- 跳转到登录页，使用环境变量中的用户名密码登录
- 之后随时可以在「设置」页增删改任意配置项
- 想推倒重来：进入「工具」页 → 销毁配置，会重新进入安装向导

::: danger 销毁配置是高危操作
销毁后所有面板配置（不含说说数据与 GitHub 仓库内容）都会被清空，需要重新走一遍安装向导。操作有三次确认，请谨慎。
:::
