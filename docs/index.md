---
layout: home

hero:
  name: Zexo
  text: Cloudflare Workers 驱动的静态博客后端
  tagline: 写作、图床、说说、自动部署触发，全部收进一个网页后台。零服务器运维，跑在 Cloudflare 免费额度上。
  actions:
    - theme: brand
      text: 快速开始
      link: /guide/getting-started
    - theme: alt
      text: 项目介绍
      link: /guide/introduction
    - theme: alt
      text: GitHub
      link: https://github.com/Zarijaden/Zexo

features:
  - icon: 🚀
    title: 开箱即用
    details: 基于 Cloudflare 免费套餐，几分钟即可部署完毕。没有服务器要维护，没有数据库要运维。
  - icon: 📱
    title: 极致体验
    details: Material Dashboard 风格面板，完美适配桌面端与移动端，浅色 / 深色主题一键切换。
  - icon: 🖊️
    title: 强大编辑器
    details: Modrinth 同款 Markdown 编辑命令、代码高亮、实时预览、草稿箱、OwO 表情与多图床上传。
  - icon: ⚙️
    title: 深度集成
    details: GitHub 图床、说说 / 朋友圈、Twikoo 评论增强、文件管理、访问统计与 Pages 部署触发。
  - icon: ⚡
    title: 边缘速度
    details: 运行在 Cloudflare 全球边缘网络，管理面板访问与数据读写低延迟。
  - icon: 🧩
    title: 平滑迁移
    details: 从 HexoPlusPlus 升级自动兼容旧数据：环境变量、KV 键、面板配置全量回退读取。
---

## 工作原理

浏览器 → 边缘 Worker → 你的 GitHub 与 KV，五步闭环：

<div class="home-flow">
  <div class="flow-node">
    <div class="flow-ico">🧑‍💻</div>
    <h4>浏览器面板</h4>
    <p>写作 · 传图 · 发说说</p>
  </div>
  <div class="flow-arrow">→</div>
  <div class="flow-node">
    <div class="flow-ico">☁️</div>
    <h4>Cloudflare Worker</h4>
    <p>路由 · 鉴权 · 代理</p>
  </div>
  <div class="flow-arrow">→</div>
  <div class="flow-node">
    <div class="flow-ico">🐙</div>
    <h4>GitHub 仓库</h4>
    <p>文章 _posts · 图片仓库</p>
  </div>
  <div class="flow-arrow">→</div>
  <div class="flow-node">
    <div class="flow-ico">🗄️</div>
    <h4>Cloudflare KV</h4>
    <p>配置 · 说说 · 索引缓存</p>
  </div>
  <div class="flow-arrow">→</div>
  <div class="flow-node">
    <div class="flow-ico">📰</div>
    <h4>静态博客</h4>
    <p>Hexo 构建 · jsDelivr CDN</p>
  </div>
</div>

## 三分钟上手

1. 克隆仓库并安装依赖：`git clone https://github.com/Zarijaden/Zexo.git && cd Zexo && npm install`
2. 创建 KV 命名空间，把返回的 `id` / `preview_id` 填进 `wrangler.toml`
3. 设置环境变量 `zexo_username` / `zexo_password`，执行 `npm run deploy`
4. 访问 `https://<你的域名>/zexo/admin/login`，按引导完成安装向导

```bash
# 本地开发（wrangler 自带 KV 模拟）
npm run dev

# 部署到 Cloudflare
npm run deploy
```

<div class="home-cta">
  <h2>准备好开始了吗？</h2>
  <p>按指南完成部署，十分钟内拥有你的博客后台</p>
  <div class="home-cta-actions">
    <a class="home-cta-btn brand" href="/guide/installation">安装向导说明</a>
    <a class="home-cta-btn ghost" href="/reference/api">API 参考</a>
  </div>
</div>
