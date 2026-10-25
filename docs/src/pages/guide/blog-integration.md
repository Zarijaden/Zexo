# 博客集成

Zexo 的若干能力设计为在你的博客前端直接使用。本章介绍三类集成：说说组件、博主活跃状态、Twikoo 评论增强。

## 嵌入说说组件

把说说（朋友圈）嵌入博客侧栏或独立页面，只需三段代码：

```html
<div id="zexo_talk"></div>
<script src="https://cdn.jsdelivr.net/gh/Zarijaden/Zexo/src/talk_user.js"></script>
<script>
  new zexo_talk({
    id: "zexo_talk",
    domain: "你的域名",
    limit: 10,
    start: 0
  });
</script>
```

### 参数说明

| 参数 | 说明 |
| --- | --- |
| `id` | 容器元素的 id |
| `domain` | 你的 Zexo 域名，**不含协议头**（组件会请求 `https://<domain>/zexo/api/getzexotalk`） |
| `limit` | 每次加载的条数 |
| `start` | 起始偏移，一般填 `0` |
| `themecss` | 可选，自定义样式地址 |

### 分页

组件底部自带「下一页」按钮，分页状态保存在浏览器 `localStorage` 的 `zexo_start` 键中，刷新后位置不丢失。已隐藏的说说不会出现在公开接口里。

## 博主活跃状态

在博客页脚放一个"博主刚刚还在这儿呢"的小挂件，很受欢迎。Zexo 提供了一个 JSONP 风格的接口：

```html
<span id="bloggeractivetime">博主动态加载中...</span>
<script src="https://你的域名/zexo/api/getblogeractive"></script>
```

接口返回一段 JS，直接设置 `#bloggeractivetime` 的文本，按活跃时间分档显示：

| 距上次活跃 | 显示 |
| --- | --- |
| 30 秒内 | 博主刚刚还在这儿呢 |
| 1 分钟内 | 博主在 N 秒前离开这儿 |
| 1 小时内 | 博主在 N 分钟前偷偷瞄了一眼博客 |
| 更久 | 博主在 N 小时前活跃了一次 |

活跃时间戳在两种情况下刷新：安装向导中把「是否自动签到」设为 `True`（每次打开面板自动刷新），或手动请求 `/zexo/admin/api/kick`。

## Twikoo 评论增强

如果你使用 [Twikoo](https://twikoo.js.org/) 评论系统，Zexo 提供了一个服务端代理，解决前端直连腾讯云 API 的跨域与 token 管理问题：

```javascript
fetch("https://你的域名/zexo/api/twikoo", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ path: "/posts/hello-world/", before: 0 })
})
  .then(r => r.json())
  .then(data => console.log(data));
```

### 请求参数

| 参数 | 说明 |
| --- | --- |
| `path` | 评论所属页面路径 |
| `before` | 分页游标，首页传 `0` |

### 工作原理

Worker 使用匿名身份登录腾讯云开发环境，调用 Twikoo 云函数的 `COMMENT_GET` 事件。`refresh_token` 与 `access_token` 缓存在 KV 中，遇到 `CHECK_LOGIN_FAILED` / `INVALID_PARAM` 时自动重新获取并重试——你无需在前端管理任何密钥。

::: tip
该功能需要在配置中填写 `zexo_twikoo_envId`（腾讯云开发环境 ID）。未填写时接口返回错误。
:::

## 独立预览页

访问 `https://你的域名/zexo/talk` 可以看到一个不带任何博客样式的说说预览页，方便调试嵌入效果。
