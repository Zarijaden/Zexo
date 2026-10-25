# Zexo 项目长期备忘

## 架构关键事实
- 纯 Cloudflare Worker 项目（wrangler 3.x，`main = ./index.js`，KV binding = KVNAME）；Worker 不托管静态资源，全部前端资产（CSS/JS）经 index.js 第 9 行 `const zexo_cdn_base` 拼接外链（2026-10-25 已从 32 处硬编码重构为常量，换 CDN 只改这一处；fork 者历史上因硬编码 Zarijaden/Zexo 导致前端全 404）。
- 主题机制：KV 配置 `zexo_theme_mode` 非 "dark" 即 light，服务端选择 `admin_all_light.css` / `admin_all_dark.css`，body 输出 `dark-edition` class。
- `zexo_theme.css` 是皮肤覆盖层（仿 Hexo Redefine v2.9.0，已用 `--zexo-*` CSS 变量），设计原则"只覆盖不改基座"。
- gulp（`npm run build`）产物 dist/ 对 CSS 是死代码；dist 仅经 `small_white_mouse_update` 用于 Worker 脚本自更新（从 raw.githubusercontent.com/Zarijaden/Zexo/dist/index.js 拉取）。
- 页面级资源注入模式：各路由把 `<link>/<script>` 写入 `zexo_js` 变量，拼入 `zexo_dash_foot`（body 末尾）。

## 用户偏好与路线
- 用户明确倾向直接修改基座 CSS（admin_all/login/install/error），走自己的设计路线，厌恶覆盖层的级联/!important 战争。
- 反感过度工程化；要求方案给完整逻辑链路。
- 痛点：jsDelivr 12h 缓存不可控 + 国内访问不稳定。
- 已建议方向（待实施）：合并 admin_all 双文件为单文件 + CSS 变量（复用 `body.dark-edition` 钩子）；资产迁移候选 Cloudflare Pages / GitHub Pages / Workers Assets 自托管；无论选哪样都应先把仓库 URL 抽成顶部常量。
