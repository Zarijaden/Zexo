# 配置详解

## 配置存在哪里

Zexo 的面板配置以 JSON 形式存储在 Cloudflare KV 的 `zexo_config` 键中（内部为双重 JSON 编码，这是历史实现，API 读取时会自动处理）。

你通常不需要直接操作 KV——「设置」页提供了全部配置项的可视化增删改，安装向导负责初次写入。

## 环境变量

在 Cloudflare Dashboard（Workers → Settings → Variables）或 `wrangler.toml` 的 `[vars]` 中设置：

| 变量 | 说明 |
| --- | --- |
| `zexo_username` | 登录用户名。多个用户用英文逗号分隔，如 `alice,bob` |
| `zexo_password` | 登录密码，与用户名按顺序一一对应，如 `pass1,pass2` |
| `zexo_captcha` | 设为 `True` 开启登录滑块验证码，其他任意值关闭 |

::: tip 旧版回退
未设置 `zexo_*` 时，Worker 会自动回退读取旧的 `hpp_username` / `hpp_password` / `hpp_captcha`。从 HexoPlusPlus 升级的用户不会因此被锁在门外，但建议尽早补上新的变量名。
:::

## 面板配置项

以下配置项均可在「设置」页修改。带默认值的项在未配置时按默认值生效。

### 站点与外观

| 键 | 默认值 | 说明 |
| --- | --- | --- |
| `zexo_domain` | 无 | Worker 域名，不含协议头 |
| `zexo_userimage` | 无 | 博主头像地址 |
| `zexo_title` | 无 | 面板标题 |
| `zexo_usericon` | 无 | 面板 favicon |
| `zexo_cors` | `*` | 列表 API 的跨域响应头 |
| `zexo_back` | 无 | 侧边栏背景图，留空使用纯色背景 |
| `zexo_theme_mode` | `light` | 面板主题：`light` / `dark` |
| `zexo_color` | `rose` | 侧边栏选项卡配色 |
| `zexo_bg_color` | `white` | 侧边栏背景色（`white` / `black`） |
| `zexo_page_limit` | `10` | 列表每页条数 |

### 编辑器与媒体

| 键 | 默认值 | 说明 |
| --- | --- | --- |
| `zexo_OwO` | 无 | OwO 表情数据 JSON 地址 |
| `zexo_lazy_img` | 无 | 图片懒加载占位图 |
| `zexo_highlight_style` | `github` | highlight.js 代码高亮主题 |

### GitHub 仓库

| 键 | 说明 |
| --- | --- |
| `zexo_githubdoctoken` | 文章仓库 Token |
| `zexo_githubimagetoken` | 图片仓库 Token |
| `zexo_githubdocusername` | 文章仓库用户名 |
| `zexo_githubimageusername` | 图片仓库用户名 |
| `zexo_githubdocrepo` | 文章仓库名 |
| `zexo_githubimagerepo` | 图片仓库名 |
| `zexo_githubdocroot` | 文章仓库根目录（如 `/`） |
| `zexo_githubimagepath` | 图片仓库路径（如 `/img/`） |
| `zexo_githubdocbranch` | 文章仓库分支 |
| `zexo_githubimagebranch` | 图片仓库分支 |

### 附加功能

| 键 | 说明 |
| --- | --- |
| `zexo_autodate` | `True` 时每次打开面板自动签到 |
| `zexo_CF_Auth_Key` | Cloudflare Global API Key（面板内更新用） |
| `zexo_Auth_Email` | Cloudflare 账户邮箱 |
| `zexo_account_identifier` | Cloudflare 账户 ID |
| `zexo_script_name` | 要更新的 Worker 名称 |
| `zexo_deploy_hook_url` | Cloudflare Pages 部署钩子 URL |
| `zexo_twikoo_envId` | Twikoo 环境 ID（评论增强） |
| `zexo_plugin_css` | 自定义注入面板的 CSS 地址 |
| `zexo_plugin_js` | 自定义注入面板的 JS 地址 |

## KV 键一览

| 键 | 内容 |
| --- | --- |
| `zexo_config` | 面板配置 |
| `zexo_doc_list_index` | 文章列表索引缓存 |
| `zexo_doc_draft_list_index` | 草稿列表索引缓存 |
| `zexo_talk_data` | 说说数据（JSON 数组） |
| `zexo_talk_id` | 说说自增 ID |
| `zexo_activetime` | 博主活跃时间戳 |
| `zexo_comment_refresh_token` | Twikoo 评论 refresh token 缓存 |
| `zexo_comment_access_token` | Twikoo 评论 access token 缓存 |

## 索引缓存机制

「文档管理」页的文章列表不是每次请求都去遍历 GitHub 目录的：

- 首次访问 `/zexo/admin/api/getlist` 时，Worker 会递归遍历 `source/_posts` 目录，把结果缓存到 `zexo_doc_list_index`；
- 新增文章（HTTP 201）或删除文章后，相关索引会自动清除，下次访问时重建；
- 如果列表出现了"幽灵文件"，可到「书写」页点击「徒手清索引」手动清除缓存（同时清除草稿索引）。

## 自定义插件注入

`zexo_plugin_css` 与 `zexo_plugin_js` 允许你在不改源码的情况下给面板注入额外的 CSS 与 JS，例如更换字体、挂载统计脚本。两个配置项留空则不注入。
