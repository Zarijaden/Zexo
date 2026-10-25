# 常见问题

## 登录后立刻被跳转回登录页？

按出现频率排序：

1. **环境变量没配对**：`zexo_username` 与 `zexo_password` 用逗号分隔时必须一一对应，例如 `alice,bob` 对应 `pass1,pass2`。数量不匹配时只有前面的组合生效。
2. **变量没保存**：在 Dashboard 修改变量后需要重新部署 Worker 才会生效。
3. **大小写与空格**：变量名区分大小写，值不要带首尾空格。
4. **Cookie 被拦**：确认浏览器没有禁用第三方 Cookie；本地调试时 `local_protocol = "https"` 需要能通过证书校验。

## 页面提示"我们不知道您的需求"？

这说明你访问的地址没有对应的路由。常用入口：

- 登录页：`/zexo/admin/login`
- 仪表盘：`/zexo/admin/dash/home`
- 书写：`/zexo/admin/dash/edit`
- 文档管理：`/zexo/admin/dash/docs_man`

直接访问 `/zexo/admin` 会被重定向到登录页或仪表盘。

## 图片上传失败？

- **Token 权限不足**：图片仓库 Token 需要对图片仓库有读写权限；
- **路径配置错误**：`zexo_githubimagepath` 必须以斜杠开头和结尾，如 `/img/`；
- **分支不存在**：`zexo_githubimagebranch` 要填图片仓库的真实分支名（常见 `main`）；
- **jsDelivr 未刷新**：上传成功但链接 404，一般是 CDN 缓存，稍等几分钟或换一个 `@<commit>` 形式的链接。

## 文章发布成功但博客没有更新？

Zexo 只负责把文件写进 GitHub 仓库，重新构建是博客平台的事：

- GitHub Actions：检查仓库的 workflow 是否触发、是否失败；
- Cloudflare Pages：到「工具」页手动「触发 Pages 部署」，或去 Dashboard 查看构建日志；
- Vercel / Netlify：确认仓库已连接并开启自动部署。

## 面板显示的数据是旧的（幽灵文件）？

文章列表带 KV 索引缓存。新增 / 删除文章时会自动清理，异常情况下可到「书写」页点击「徒手清索引」强制重建。

## 如何修改面板配置？

「设置」页可以直接增删改所有配置项，改完即时生效，不需要重新部署。安装向导只在首次安装时出现，之后所有配置都在「设置」页维护。

## 一键更新失败？

面板内更新依赖四项 Cloudflare 配置：Global API Key、账户邮箱、账户 ID、目标 Workers 名称。任何一项缺失或错误都会失败。Dashboard 粘贴部署的用户没有这些配置，请手动重新粘贴新版 `index.js`。

## 免费额度够用吗？

对个人博客绰绰有余：Workers 免费套餐每天 10 万次请求，KV 免费套餐每天 10 万次读 + 1000 次写。面板的所有请求都会经过 Worker，但正常写作频率远低于限额。唯一需要注意的是 KV 写操作（发布文章、写配置），1000 次 / 天对单人使用非常宽裕。

## 我的数据存在哪里，安全吗？

- **文章与图片**：在你自己的 GitHub 仓库，Zexo 只是一个有 Token 的代理；
- **配置与说说**：在你的 Cloudflare KV，只有你的 Worker 能读写；
- **登录凭证**：环境变量里的用户名密码，Worker 每次请求比对 MD5。

因此安全性取决于你的 GitHub Token 与 Cloudflare 账户。建议 Token 只给必要仓库的最小权限，并定期轮换。

## 支持多个用户吗？

支持。环境变量中用逗号分隔，用户名与密码按顺序对应，例如：

```toml
zexo_username = "alice,bob"
zexo_password = "pass1,pass2"
```

## 可以用自定义域名吗？

可以。在 Cloudflare 中给 Worker 添加路由（Routes）绑定你的域名或子域名即可，面板与 API 都通过该域名访问。别忘了同步修改安装向导里填写的 `zexo_domain`。
