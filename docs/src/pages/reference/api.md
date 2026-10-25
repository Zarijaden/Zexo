# API 参考

Zexo 的全部能力都通过 HTTP 接口暴露，前端面板只是这些接口的消费者。你可以在自己的脚本中直接调用它们。

## 认证方式

管理类接口通过 Cookie 认证：

| Cookie | 值 |
| --- | --- |
| `username` | 用户名的 MD5 |
| `password` | 密码的 MD5 |

登录页会自动设置这两个 Cookie。未登录访问 `/zexo/admin/*` 会被 302 重定向到 `/zexo/admin/login`。多个用户时，任意一组匹配即通过。

```bash
# 手动带 Cookie 调用示例
curl -b "username=$(echo -n admin | md5sum | cut -d' ' -f1); password=$(echo -n your-password | md5sum | cut -d' ' -f1)" \
  https://你的域名/zexo/admin/api/getlist
```

## 管理 API

以下接口都需要登录态。路径中的 `<文件名>` 均不带 `.md` 后缀。

### 文章与草稿

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET / POST | `/zexo/admin/api/getlist` | 文章列表（带 KV 索引缓存，递归遍历子目录） |
| GET / POST | `/zexo/admin/api/get_draftlist` | 草稿列表 |
| GET / POST | `/zexo/admin/api/getdoc/<文件名>` | 读取文章内容（代理 raw.githubusercontent.com） |
| GET / POST | `/zexo/admin/api/getdraft/<文件名>` | 读取草稿内容 |
| GET / POST | `/zexo/admin/api/getscaffolds` | 读取仓库 `scaffolds/post.md` 作为新文章模板 |
| POST | `/zexo/admin/api/adddoc/<文件名>` | 发布文章，body 为 Base64 编码的文件内容 |
| POST | `/zexo/admin/api/adddraft/<文件名>` | 发布草稿，body 为 Base64 编码的文件内容 |
| GET | `/zexo/admin/api/deldoc/<文件名>` | 删除文章，成功后清除列表索引 |
| GET | `/zexo/admin/api/deldraft/<文件名>` | 删除草稿，成功后清除草稿索引 |
| GET | `/zexo/admin/api/index_del` | 清除文章与草稿列表索引缓存 |

::: tip 关于 Base64
发布接口的 body 是**纯 Base64 字符串**（不是 multipart，也不是 JSON）。GitHub Contents API 的 `content` 字段要求 Base64，Worker 原样转发。
:::

### 图片

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/zexo/admin/api/getimglist` | 图片列表（每次实时遍历，不走缓存） |
| POST | `/zexo/admin/api/addimage/<扩展名>` | 上传图片，body 为 Base64；返回 jsDelivr CDN 链接 |
| GET | `/zexo/admin/api/delimage/<文件名>` | 删除图片 |

上传成功时文件以 `<时间戳>.<扩展名>` 命名，避免重名覆盖。

### 说说

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| POST | `/zexo/admin/api/addtalk` | 新增说说，JSON body：`{ "time", "name", "avatar", "content" }` |
| POST | `/zexo/admin/api/deltalk` | 删除说说，body 为说说 id |
| POST | `/zexo/admin/api/visibletalk` | 切换说说可见性，body 为说说 id |
| POST | `/zexo/admin/api/inputtalk` | 批量导入说说（Artitalk 数据格式） |

### 配置

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/zexo/admin/api/get_config` | 读取全部面板配置 |
| POST | `/zexo/admin/api/edit_config` | 修改 / 新增配置，JSON body：`{ "index": "键名", "value": "值" }` |
| POST | `/zexo/admin/api/del_config` | 删除配置，body 为键名 |
| POST | `/zexo/admin/api/upconfig` | 安装向导提交配置（仅在无配置时可用） |
| GET | `/zexo/admin/api/del_all` | 销毁全部配置，回到未安装状态 |

### 系统

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/zexo/admin/api/kick` | 手动签到，刷新博主活跃时间 |
| POST | `/zexo/admin/api/checkupdate` | 检查更新，返回 `update.js` 脚本由前端执行 |
| GET | `/zexo/admin/api/update` | 用 `main` 分支脚本热更新 Worker |
| GET | `/zexo/admin/api/small_white_mouse_update` | 用 `dist` 分支脚本热更新（实验通道） |
| POST | `/zexo/admin/api/trigger-deploy` | 触发配置中的 Pages 部署钩子 |

::: warning
`update` / `small_white_mouse_update` 会覆盖你正在运行的 Worker 脚本，执行前请确认当前版本可用。
:::

## 公开 API

以下接口无需登录，可被博客前端直接调用，均带 `Access-Control-Allow-Origin` 响应头。

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| POST | `/zexo/api/getzexotalk` | 分页读取说说，JSON body：`{ "limit": 10, "start": 0 }`，已隐藏的不返回 |
| GET | `/zexo/api/getblogeractive` | 返回一段设置 `#bloggeractivetime` 文本的 JS |
| POST | `/zexo/api/twikoo` | Twikoo 评论代理，JSON body：`{ "path", "before" }` |
| GET | `/zexo/api/captchaimg` | 登录验证码图片 |

调用示例：

```bash
curl -X POST https://你的域名/zexo/api/getzexotalk \
  -H "Content-Type: application/json" \
  -d '{"limit": 10, "start": 0}'
```

## 页面路由

| 路径 | 说明 |
| --- | --- |
| `/zexo/admin/login` | 登录页 |
| `/zexo/admin/dash/home` | 仪表盘主页 |
| `/zexo/admin/dash/edit` | 书写 |
| `/zexo/admin/dash/talk` | 说说 |
| `/zexo/admin/dash/docs_man` | 文档管理 |
| `/zexo/admin/dash/img_man` | 图片管理 |
| `/zexo/admin/dash/tool` | 工具 |
| `/zexo/admin/dash/set` | 设置 |
| `/zexo/talk` | 说说独立预览页 |

未匹配的路径返回 ZexoError 错误页；未登录访问管理路由会被重定向到登录页。

## 响应约定

- 文章 / 图片 / 草稿的新增与删除返回纯文本（`Update Success` / `Delete Success` / `Fail To ...`），HTTP 状态码透传 GitHub 或 Cloudflare 的结果；
- 列表类接口返回 `application/json`；
- 配置类接口成功返回 `OK`；
- 前端面板统一用 sweetalert / notyf 展示结果，脚本调用时请同时检查状态码与响应体。
