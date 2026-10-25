# 快速开始

本章带你从零部署一个 Zexo 实例。全程约 10 分钟，只需要一个 Cloudflare 账户和一个 GitHub 账户。

## 前置条件

- 一个 **Cloudflare 账户**（免费套餐即可）
- 一个 **GitHub 账户**，并准备好两个仓库：
  - 文章仓库：存放 Hexo 等博客的 `source/_posts`，例如 `blog`
  - 图片仓库：专门存放图片，例如 `image`
- 两个 **GitHub Personal Access Token**（文章仓库、图片仓库各一个）

::: tip 关于 GitHub Token
在 GitHub → Settings → Developer settings → Personal access tokens 中生成。classic token 勾选 `repo` 即可；fine-grained token 需要对相应仓库的 Contents 读写权限。文章与图片仓库可以共用一个 Token。
:::

## 方式一：Wrangler CLI（推荐）

适合想本地开发、后续面板内一键更新的用户。

### 1. 克隆仓库并安装依赖

```bash
git clone https://github.com/Zarijaden/Zexo.git
cd Zexo
npm install
```

### 2. 创建 KV 命名空间

```bash
npx wrangler kv namespace create KVNAME
npx wrangler kv namespace create KVNAME --preview
```

把两条命令返回的 `id` 与 `preview_id` 填入 `wrangler.toml` 的 `[[kv_namespaces]]` 中：

```toml
[[kv_namespaces]]
binding = "KVNAME"
id = "你的命名空间 id"
preview_id = "你的 preview id"
```

### 3. 设置环境变量

至少需要设置登录用户名与密码。两种方式任选其一：

- **Cloudflare Dashboard**：Workers → 你的 Worker → Settings → Variables，添加 `zexo_username`、`zexo_password`、`zexo_captcha`
- **wrangler.toml**：在文件末尾追加

```toml
[vars]
zexo_username = "admin"
zexo_password = "your-password"
zexo_captcha = "False"
```

::: warning 安全提示
`wrangler.toml` 会提交到 Git 仓库，敏感密码更建议放在 Dashboard 变量中，或使用 `npx wrangler secret put zexo_password`。多个用户用英文逗号分隔，例如 `user1,user2` 对应 `pass1,pass2`。
:::

### 4. 登录并部署

```bash
npx wrangler login
npm run deploy
```

### 5. 访问面板

部署成功后，访问 `https://<你的 worker 域名>/zexo/admin/login`。由于 KV 中还没有配置，页面会自动跳转到[安装向导](/guide/installation)，按引导填写即可。

## 方式二：Cloudflare Dashboard 粘贴（无本地环境）

适合快速体验，不需要在电脑上装任何东西。

1. 登录 Cloudflare Dashboard，创建一个 Worker，名称随意（如 `zexo`）；
2. 进入 Settings → Variables，添加 `zexo_username`、`zexo_password`、`zexo_captcha`；
3. 创建一个 KV 命名空间，并在 Settings → Bindings 中绑定，变量名必须是 `KVNAME`；
4. 点击 Edit code，把仓库中 `index.js` 的**全部内容**粘贴进去，保存并部署；
5. 访问 `https://<你的域名>/zexo/admin/login`，完成安装向导。

::: warning
Dashboard 粘贴方式无法使用面板内一键更新（该功能依赖 CF Global API Key），升级时需要手动重新粘贴新版 `index.js`。长期使用推荐方式一。
:::

## 部署完成后做什么

1. **完成安装向导**：填写域名、GitHub 仓库信息等，详见 [安装向导](/guide/installation)
2. **检查配置**：进入「设置」页，逐项确认 GitHub 仓库路径、分支等配置
3. **发布第一篇文章**：进入「书写」页，写点内容，点击「发布文件」
4. **配置博客自动构建**：让博客平台监听文章仓库的更新（GitHub Actions / Pages 部署钩子均可，见 [后台功能用法](/guide/dashboard#触发-pages-部署)）

## 本地预览（可选）

```bash
# 本地开发模式，wrangler 自带 KV 模拟，数据持久化到 .wrangler/state
npm run dev
```

详见 [本地开发与构建](/guide/development)。

## 遇到问题？

- 登录后反复跳转登录页、图片上传失败等常见问题，见 [常见问题](/guide/faq)
- 原理解与架构说明，见 [项目介绍](/guide/introduction)
