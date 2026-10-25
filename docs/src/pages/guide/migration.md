# 从 HexoPlusPlus 迁移

Zexo 是已归档项目 [HexoPlusPlus](https://github.com/HexoPlusPlus/HexoPlusPlus)（`hpp`）的重构与延续，完成了到 `zexo` 的全量改名：后台路由、KV 键、配置项、环境变量、前端函数名与 CSS 类名均已改为 `zexo_` / `zexot_` 前缀。

**已有部署升级时不需要迁移数据**——Worker 内置了多层自动兼容，首次打开管理面板即完成迁移。

## 自动兼容机制

| 对象 | 兼容方式 |
| --- | --- |
| 环境变量 | 优先读取 `zexo_username` / `zexo_password` / `zexo_captcha`，未设置时自动回退旧的 `hpp_*` |
| KV 键 | 读取 `zexo_*` 未命中时回退读取 `hpp_*`，命中后自动写回新键 |
| 面板配置 | `zexo_config` 中的旧 `hpp_*` 键解析时自动改名并写回 |
| 评论令牌 | Twikoo 的 refresh / access token 同样走 KV 回退，不会丢失 |

也就是说：说说数据、签到时间、评论 token 都会在升级后第一次访问面板时自动迁移到新键，**无需任何手动操作**。

## 需要手动更新的部分

### 博客中的说说嵌入代码

公开接口与前端对象已改名，博客里嵌入的说说组件需要同步更新：

```html
<div id="zexo_talk"></div>
<script src="https://cdn.jsdelivr.net/gh/Zarijaden/Zexo/src/talk_user.js"></script>
<script>
  new zexo_talk({ id: "zexo_talk", domain: "你的域名", limit: 10, start: 0 });
</script>
```

对应关系：

| 旧（HexoPlusPlus） | 新（Zexo） |
| --- | --- |
| `/zexo/api/gethpptalk` | `/zexo/api/getzexotalk` |
| `hpp_talk` | `zexo_talk` |
| CSS 类前缀 `hppt_` | `zexot_` |
| 分页状态键 `hpp_start` | `zexo_start` |
| 容器 id 惯例 `hpp_talk` | `zexo_talk` |

::: warning 旧接口已不存在
升级后 `/zexo/api/gethpptalk` 不再可用，博客前端不更新嵌入代码的话说说将无法加载。
:::

### 浏览器本地草稿

编辑器自动备份的 `localStorage` 键从 `hpp_editor_autobackup` 等改为 `zexo_*` 前缀，**旧草稿不会自动迁移**。如果升级前编辑器里还有未发布的草稿，请先发布或手动备份。

## 建议的升级步骤

1. 用新版 `index.js` 更新你的 Worker（一键更新或重新部署）；
2. 打开一次管理面板，触发配置与 KV 的自动迁移；
3. 在 Cloudflare 面板补上 `zexo_username` / `zexo_password` / `zexo_captcha` 环境变量（旧的 `hpp_*` 可留作兜底，也可删除）；
4. 更新博客里的说说嵌入代码；
5. 到「设置」页抽查一遍配置是否完整。

## 命名对照速查

| 类别 | 前缀 |
| --- | --- |
| 后台路由 | `/zexo/admin/...`（未变） |
| 环境变量 | `zexo_` |
| KV 键 | `zexo_` |
| 配置项 | `zexo_` |
| 前端函数 / 变量 | `zexo_` |
| 说说组件 CSS 类 | `zexot_` |
| 本地存储键 | `zexo_` |
