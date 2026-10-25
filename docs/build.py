#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Zexo 文档站生成器（VitePress 风格静态文档站）

用法：
    python docs/build.py

输入：
    docs/src/pages/*.md      文档内容（Markdown 子集）
    docs/src/assets/         静态资源（docs.css / docs.js）

输出（纯静态，可直接托管到任意静态服务器 / GitHub Pages / Cloudflare Pages）：
    docs/index.html              介绍页（首页）
    docs/guide/*.html            指南页面
    docs/reference/*.html        参考页面
    docs/assets/docs.css
    docs/assets/docs.js
    docs/assets/search-data.js   本地搜索索引
"""

import os
import re
import json
import shutil
import html as H
import urllib.parse

BASE = os.path.dirname(os.path.abspath(__file__))
SRC_DIR = os.path.join(BASE, "src")
PAGES_DIR = os.path.join(SRC_DIR, "pages")
ASSETS_DIR = os.path.join(SRC_DIR, "assets")

# ---------------------------------------------------------------
# 站点配置
# ---------------------------------------------------------------

SITE = {
    "name": "Zexo",
    "title": "Zexo",
    "desc": "基于 Cloudflare Workers 的静态博客后端管理面板",
    "version": "v1.5",
    "repo": "https://github.com/Zarijaden/Zexo",
}

TOP_NAV = [
    {"text": "指南", "link": "guide/introduction"},
    {"text": "后台功能", "link": "guide/dashboard"},
    {"text": "博客集成", "link": "guide/blog-integration"},
    {"text": "迁移指南", "link": "guide/migration"},
    {"text": "API 参考", "link": "reference/api"},
]

SIDEBAR = [
    {
        "text": "开始",
        "items": [
            {"text": "项目介绍", "link": "guide/introduction"},
            {"text": "快速开始", "link": "guide/getting-started"},
            {"text": "安装向导", "link": "guide/installation"},
        ],
    },
    {
        "text": "使用指南",
        "items": [
            {"text": "配置详解", "link": "guide/configuration"},
            {"text": "后台功能用法", "link": "guide/dashboard"},
            {"text": "博客集成", "link": "guide/blog-integration"},
        ],
    },
    {
        "text": "进阶",
        "items": [
            {"text": "从 HexoPlusPlus 迁移", "link": "guide/migration"},
            {"text": "本地开发与构建", "link": "guide/development"},
            {"text": "常见问题", "link": "guide/faq"},
        ],
    },
    {
        "text": "参考",
        "items": [
            {"text": "API 参考", "link": "reference/api"},
        ],
    },
]

HOME = {
    "badge": "Cloudflare Workers · 静态博客后端",
    "name": "Zexo",
    "tagline": "让静态博客管理，重新变得简单而强大。",
    "desc": ("Zexo 是基于 Cloudflare Workers 与 Cloudflare KV 构建的静态博客后端管理面板。"
             "写作、图床、说说、自动部署触发，全部收进一个网页后台——零服务器运维，"
             "跑在 Cloudflare 免费额度上。"),
    "features": [
        {"icon": "🚀", "title": "开箱即用",
         "desc": "基于 Cloudflare 免费套餐，几分钟即可部署完毕。没有服务器要维护，没有数据库要运维。"},
        {"icon": "📱", "title": "极致体验",
         "desc": "Material Dashboard 风格面板，完美适配桌面端与移动端，浅色 / 深色主题一键切换。"},
        {"icon": "🖊️", "title": "强大编辑器",
         "desc": "Modrinth 同款 Markdown 编辑命令、代码高亮、实时预览、草稿箱、OwO 表情与多图床上传。"},
        {"icon": "⚙️", "title": "深度集成",
         "desc": "GitHub 图床、说说 / 朋友圈、Twikoo 评论增强、文件管理、访问统计与 Pages 部署触发。"},
        {"icon": "⚡", "title": "边缘速度",
         "desc": "运行在 Cloudflare 全球边缘网络，管理面板访问与数据读写低延迟。"},
        {"icon": "🧩", "title": "平滑迁移",
         "desc": "从 HexoPlusPlus 升级自动兼容旧数据：环境变量、KV 键、面板配置全量回退读取。"},
    ],
    "flow": [
        {"icon": "🧑‍💻", "title": "浏览器面板", "desc": "写作 · 传图 · 发说说"},
        {"icon": "☁️", "title": "Cloudflare Worker", "desc": "路由 · 鉴权 · 代理"},
        {"icon": "🐙", "title": "GitHub 仓库", "desc": "文章 _posts · 图片仓库"},
        {"icon": "🗄️", "title": "Cloudflare KV", "desc": "配置 · 说说 · 索引缓存"},
        {"icon": "📰", "title": "静态博客", "desc": "Hexo 构建 · jsDelivr CDN"},
    ],
    "steps": [
        "克隆仓库并安装依赖：<code>git clone https://github.com/Zarijaden/Zexo.git &amp;&amp; cd Zexo &amp;&amp; npm install</code>",
        "创建 KV 命名空间，把返回的 id / preview_id 填进 <code>wrangler.toml</code>",
        "设置环境变量 <code>zexo_username</code> / <code>zexo_password</code>，执行 <code>npm run deploy</code>",
        "访问 <code>https://&lt;你的域名&gt;/zexo/admin/login</code>，按引导完成安装向导",
    ],
    "quickstart_code": (
        "# 本地开发（wrangler 自带 KV 模拟）\n"
        "npm run dev\n\n"
        "# 部署到 Cloudflare\n"
        "npm run deploy"
    ),
}

FAVICON = "data:image/svg+xml," + urllib.parse.quote(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">'
    '<rect width="64" height="64" rx="14" fill="#3451b2"/>'
    '<text x="32" y="45" font-family="Arial,sans-serif" font-size="38" '
    'font-weight="800" fill="#fff" text-anchor="middle">Z</text></svg>'
)

# ---------------------------------------------------------------
# 图标
# ---------------------------------------------------------------

ICONS = {
    "sun": '<svg class="icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
    "moon": '<svg class="icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>',
    "search": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>',
    "menu": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 6h18M3 12h18M3 18h18"/></svg>',
    "github": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg>',
    "chevron": '<svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>',
    "copy": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>',
    "tip": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.4 1 2.3h6c0-.9.4-1.8 1-2.3A7 7 0 0 0 12 2z"/></svg>',
    "warning": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
    "danger": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="7.9 2 17 2 22 7 22 17 17 22 7 22 2 17 2 7"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>',
    "info": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
}

CONTAINERS = {
    "tip": ("提示", "tip"),
    "info": ("信息", "info"),
    "warning": ("注意", "warning"),
    "danger": ("警告", "danger"),
}

LANG_LABELS = {
    "sh": "bash", "shell": "bash", "zsh": "bash",
    "js": "javascript", "node": "javascript",
    "ts": "typescript", "yml": "yaml", "md": "markdown",
}

# ---------------------------------------------------------------
# Markdown 解析器（子集：标题 / 段落 / 列表 / 表格 / 代码块 /
# 引用 / 自定义容器 / 行内代码 / 加粗 / 斜体 / 链接 / 图片）
# ---------------------------------------------------------------

def is_cjk(ch):
    return "\u4e00" <= ch <= "\u9fff" or "\u3000" <= ch <= "\u303f" or "\uff00" <= ch <= "\uffef"


def smart_join(lines):
    """拼接段落行：中文之间不加空格，西文之间加空格。"""
    out = lines[0].strip()
    for ln in lines[1:]:
        ln = ln.strip()
        if not ln:
            continue
        if is_cjk(out[-1]) and is_cjk(ln[0]):
            out += ln
        else:
            out += " " + ln
    return out


def plain_text(s):
    s = re.sub(r"!\[([^\]]*)\]\([^)]*\)", r"\1", s)
    s = re.sub(r"\[([^\]]+)\]\([^)]*\)", r"\1", s)
    s = re.sub(r"[`*~]", "", s)
    return s.strip()


def slugify(text):
    s = text.strip().lower()
    s = re.sub(r"[^\w\s\-]", "", s)
    s = re.sub(r"[\s_]+", "-", s)
    s = s.strip("-")
    return s or "section"


def inline(text):
    """行内元素转换（输入为原始文本，内部先整体转义）。"""
    text = H.escape(text, quote=False)
    codes = []

    def stash(m):
        codes.append(m.group(1))
        return "\x00%d\x00" % (len(codes) - 1)

    text = re.sub(r"`([^`]+)`", stash, text)
    text = re.sub(
        r"!\[([^\]]*)\]\(([^)\s]+)(?:\s+(?:&quot;|\x22)[^\x22]*(?:&quot;|\x22))?\)",
        lambda m: '<img src="%s" alt="%s">' % (m.group(2), m.group(1)), text)
    text = re.sub(
        r"\[([^\]]+)\]\(([^)\s]+)(?:\s+(?:&quot;|\x22)[^\x22]*(?:&quot;|\x22))?\)",
        lambda m: link_html(m.group(2), m.group(1)), text)
    text = re.sub(r"\*\*([^*]+)\*\*", r"<strong>\1</strong>", text)
    text = re.sub(r"(?<!\*)\*([^*\n]+)\*(?!\*)", r"<em>\1</em>", text)
    text = re.sub(r"~~([^~]+)~~", r"<del>\1</del>", text)
    text = re.sub(r"\x00(\d+)\x00", lambda m: "<code>%s</code>" % codes[int(m.group(1))], text)
    return text


def link_html(url, label):
    attrs = ' target="_blank" rel="noopener"' if url.startswith("http") else ""
    return '<a href="%s"%s>%s</a>' % (url, attrs, label)


def is_block_start(line):
    s = line.strip()
    if not s:
        return True
    if s.startswith("```") or s.startswith(":::"):
        return True
    if s.startswith("#"):
        return True
    if s.startswith(">"):
        return True
    if s in ("---", "***"):
        return True
    if re.match(r"^([-*+]|\d+\.)\s+", s):
        return True
    if s.startswith("|"):
        return True
    return False


class Parser(object):
    def __init__(self, text):
        self.lines = text.replace("\r\n", "\n").split("\n")
        self.i = 0
        self.toc = []
        self.title = ""
        self._ids = set()

    # ---- 入口 ----
    def parse(self):
        out = []
        while self.i < len(self.lines):
            before = self.i
            html = self.parse_block()
            if self.i == before:  # 安全阀：保证进度
                self.i += 1
                html = "<p>%s</p>" % inline(self.lines[before].strip())
            if html:
                out.append(html)
        return "".join(out)

    def parse_block(self):
        line = self.lines[self.i]
        s = line.strip()
        if not s:
            self.i += 1
            return ""
        m = re.match(r"^```([\w-]*)\s*$", s)
        if m:
            return self.parse_code(m.group(1))
        m = re.match(r"^:::\s*(\w+)(?:\s+(.*))?$", s)
        if m:
            return self.parse_container(m.group(1), (m.group(2) or "").strip())
        m = re.match(r"^(#{1,6})\s+(.*)$", s)
        if m:
            return self.parse_heading(m)
        if (s.startswith("|") and self.i + 1 < len(self.lines)
                and re.match(r"^\s*\|?[\s:|-]+\|?\s*$", self.lines[self.i + 1])
                and "-" in self.lines[self.i + 1]):
            return self.parse_table()
        if re.match(r"^(\s*)([-*+]|\d+\.)\s+", line):
            return self.parse_list()
        if s.startswith(">"):
            return self.parse_quote()
        if s in ("---", "***"):
            self.i += 1
            return "<hr>"
        return self.parse_paragraph()

    # ---- 各块 ----
    def unique_id(self, hid):
        base, n = hid, 1
        while hid in self._ids:
            n += 1
            hid = "%s-%d" % (base, n)
        self._ids.add(hid)
        return hid

    def parse_heading(self, m):
        level = len(m.group(1))
        raw = m.group(2).strip()
        self.i += 1
        plain = plain_text(raw)
        if level == 1:
            if not self.title:
                self.title = plain
            return ""
        hid = self.unique_id(slugify(plain))
        self.toc.append({"level": level, "id": hid, "text": plain})
        anchor = '<a class="header-anchor" href="#%s" aria-hidden="true"></a>' % urllib.parse.quote(hid)
        return '<h%d id="%s">%s%s</h%d>' % (level, hid, anchor, inline(raw), level)

    def parse_code(self, lang):
        self.i += 1
        buf = []
        while self.i < len(self.lines) and not self.lines[self.i].strip().startswith("```"):
            buf.append(self.lines[self.i])
            self.i += 1
        self.i += 1  # 跳过结束围栏
        code = H.escape("\n".join(buf), quote=False)
        lang = (lang or "text").lower()
        label = LANG_LABELS.get(lang, lang) or "text"
        return (
            '<div class="vp-code-block">'
            '<div class="vp-code-header"><span class="vp-code-lang">%s</span>'
            '<button class="vp-code-copy" type="button" title="复制代码">%s</button></div>'
            '<pre><code class="language-%s">%s</code></pre></div>'
        ) % (label, ICONS["copy"], label, code)

    def parse_container(self, ctype, ctitle):
        self.i += 1
        buf = []
        while self.i < len(self.lines) and self.lines[self.i].strip() != ":::":
            buf.append(self.lines[self.i])
            self.i += 1
        self.i += 1
        meta = CONTAINERS.get(ctype)
        inner = Parser("\n".join(buf)).parse()
        if not meta:
            return inner
        name = ctitle or meta[0]
        return ('<div class="vp-container %s"><p class="vp-container-title">%s%s</p>%s</div>'
                % (meta[1], ICONS[meta[1]], H.escape(name, quote=False), inner))

    def split_row(self, line):
        s = line.strip()
        if s.startswith("|"):
            s = s[1:]
        if s.endswith("|"):
            s = s[:-1]
        return [c.strip() for c in s.split("|")]

    def parse_table(self):
        header = self.split_row(self.lines[self.i])
        self.i += 1
        aligns = []
        for cell in self.split_row(self.lines[self.i]):
            c = cell.strip()
            if c.startswith(":") and c.endswith(":"):
                aligns.append("center")
            elif c.endswith(":"):
                aligns.append("right")
            else:
                aligns.append("left")
        self.i += 1
        body = []
        while self.i < len(self.lines) and self.lines[self.i].strip().startswith("|"):
            body.append(self.split_row(self.lines[self.i]))
            self.i += 1

        def style(idx):
            if idx < len(aligns) and aligns[idx] != "left":
                return ' style="text-align:%s"' % aligns[idx]
            return ""

        head_html = "".join("<th%s>%s</th>" % (style(i), inline(c)) for i, c in enumerate(header))
        rows_html = ""
        for row in body:
            cells = "".join("<td%s>%s</td>" % (style(i), inline(c)) for i, c in enumerate(row))
            rows_html += "<tr>%s</tr>" % cells
        return ('<div class="vp-table-wrap"><table><thead><tr>%s</tr></thead>'
                "<tbody>%s</tbody></table></div>") % (head_html, rows_html)

    def parse_list(self):
        first = re.match(r"^(\s*)([-*+]|\d+\.)\s+", self.lines[self.i])
        base = len(first.group(1))
        ordered = bool(re.match(r"\d+\.", first.group(2)))
        items = []
        while self.i < len(self.lines):
            line = self.lines[self.i]
            if not line.strip():
                break
            m = re.match(r"^(\s*)([-*+]|\d+\.)\s+(.*)$", line)
            if m and len(m.group(1)) == base:
                textparts = [m.group(3)]
                nested = []
                self.i += 1
                while self.i < len(self.lines):
                    cont = self.lines[self.i]
                    if not cont.strip():
                        break
                    cm = re.match(r"^(\s*)([-*+]|\d+\.)\s+", cont)
                    if cm and len(cm.group(1)) <= base:
                        break
                    if cm and len(cm.group(1)) > base:
                        nested.append(self.parse_list())
                    else:
                        textparts.append(cont.strip())
                        self.i += 1
                item_html = inline(smart_join(textparts))
                if nested:
                    item_html += "".join(nested)
                items.append("<li>%s</li>" % item_html)
            elif m and len(m.group(1)) > base:
                items[-1] = items[-1][:-5] + self.parse_list() + "</li>"
            else:
                break
        tag = "ol" if ordered else "ul"
        return "<%s>%s</%s>" % (tag, "".join(items), tag)

    def parse_quote(self):
        buf = []
        while self.i < len(self.lines) and self.lines[self.i].strip().startswith(">"):
            buf.append(re.sub(r"^\s*>\s?", "", self.lines[self.i]))
            self.i += 1
        return "<blockquote>%s</blockquote>" % Parser("\n".join(buf)).parse()

    def parse_paragraph(self):
        buf = []
        while self.i < len(self.lines):
            line = self.lines[self.i]
            if not line.strip():
                break
            if buf and is_block_start(line):
                break
            if is_block_start(line) and not buf:
                buf.append(line.strip())
                self.i += 1
                continue
            buf.append(line.strip())
            self.i += 1
        if not buf:
            return ""
        return "<p>%s</p>" % inline(smart_join(buf))


# ---------------------------------------------------------------
# 页面模板
# ---------------------------------------------------------------

def rel(prefix, link):
    return prefix + link + ".html"


def render_nav(prefix, current_link):
    links = "".join(
        '<a href="%s"%s>%s</a>' % (
            rel(prefix, it["link"]),
            ' class="active"' if it["link"] == current_link else "",
            it["text"])
        for it in TOP_NAV)
    return (
        '<header class="nav">'
        '<a class="nav-brand" href="%sindex.html">'
        '<span class="logo">Z</span>Zexo<span class="version">%s</span></a>'
        '<nav class="nav-links">%s</nav>'
        '<div class="nav-spacer"></div>'
        '<button class="nav-search" type="button" data-search-open>%s'
        "<span>搜索文档</span><kbd>&#8984;K</kbd></button>"
        '<button class="nav-icon-btn" type="button" data-theme-toggle title="切换主题">%s%s</button>'
        '<a class="nav-icon-btn" href="%s" target="_blank" rel="noopener" title="GitHub">%s</a>'
        '<button class="nav-icon-btn nav-hamburger" id="sidebar-toggle" type="button" title="菜单">%s</button>'
        "</header>"
    ) % (prefix, SITE["version"], links, ICONS["search"], ICONS["sun"], ICONS["moon"],
         SITE["repo"], ICONS["github"], ICONS["menu"])


def render_sidebar(prefix, current_link):
    groups = []
    for g in SIDEBAR:
        items = "".join(
            '<li><a href="%s"%s>%s</a></li>' % (
                rel(prefix, it["link"]),
                ' class="active"' if it["link"] == current_link else "",
                it["text"])
            for it in g["items"])
        groups.append(
            '<div class="sidebar-group">'
            '<button class="sidebar-group-title" type="button">%s%s</button>'
            '<ul class="sidebar-group-items">%s</ul></div>'
            % (g["text"], ICONS["chevron"], items))
    return '<aside class="sidebar" id="sidebar">%s</aside>' % "".join(groups)


def render_toc(toc):
    if not toc:
        return ""
    items = "".join(
        '<li class="level-%d"><a href="#%s">%s</a></li>' % (
            h["level"], urllib.parse.quote(h["id"]), H.escape(h["text"], quote=False))
        for h in toc if h["level"] in (2, 3))
    if not items:
        return ""
    return ('<aside class="toc"><p class="toc-title">本页目录</p>'
            '<ul class="toc-list">%s</ul></aside>') % items


def render_pager(prefix, flat, idx):
    parts = ['<div class="pager">']
    if idx > 0:
        p = flat[idx - 1]
        parts.append('<a class="prev" href="%s"><span class="pager-label">上一页</span>'
                     '<span class="pager-title">%s</span></a>'
                     % (rel(prefix, p["link"]), p["text"]))
    else:
        parts.append("<span></span>")
    if idx < len(flat) - 1:
        n = flat[idx + 1]
        parts.append('<a class="next" href="%s"><span class="pager-label">下一页</span>'
                     '<span class="pager-title">%s</span></a>'
                     % (rel(prefix, n["link"]), n["text"]))
    parts.append("</div>")
    return "".join(parts)


def render_footer():
    return (
        '<footer class="footer">'
        '<span>基于 <a href="%s/blob/main/LICENSE" target="_blank" rel="noopener">GPL-3.0</a> 协议开源</span>'
        '<span>Copyright &copy; 2024-2026 <a href="%s" target="_blank" rel="noopener">Zarijaden</a> 与贡献者</span>'
        "</footer>"
    ) % (SITE["repo"], SITE["repo"])


def render_search_modal():
    return (
        '<div class="search-mask" id="search-mask">'
        '<div class="search-dialog">'
        '<div class="search-input-row">%s'
        '<input id="search-input" type="text" placeholder="搜索文档..." autocomplete="off"></div>'
        '<ul class="search-results" id="search-results"></ul>'
        '<div class="search-footer"><span><kbd>&uarr;</kbd><kbd>&darr;</kbd> 导航</span>'
        "<span><kbd>Enter</kbd> 打开</span><span><kbd>Esc</kbd> 关闭</span></div>"
        "</div></div>"
    ) % ICONS["search"]


def shell(title, prefix, current_link, body_html, sidebar_html="", toc_html="", pager_html=""):
    theme_init = (
        "(function(){try{var t=localStorage.getItem('zexo-docs-theme');"
        "if(t){document.documentElement.setAttribute('data-theme',t);}}catch(e){}})();"
    )
    return (
        "<!DOCTYPE html>\n"
        '<html lang="zh-CN">\n<head>\n'
        '<meta charset="UTF-8">\n'
        '<meta name="viewport" content="width=device-width, initial-scale=1.0">\n'
        "<title>%s</title>\n"
        '<meta name="description" content="%s">\n'
        '<link rel="icon" href="%s">\n'
        '<link rel="stylesheet" href="%sassets/docs.css">\n'
        "<script>%s</script>\n"
        "</head>\n<body>\n"
        "%s\n"
        '<div class="layout">\n'
        "%s\n"
        '<div class="sidebar-mask" id="sidebar-mask"></div>\n'
        '<main class="main">\n'
        '<div class="content">\n%s\n%s\n%s\n</div>\n'
        "%s\n"
        "</main>\n</div>\n"
        "%s\n"
        '<script>window.ZEXO_PREFIX="%s";</script>\n'
        '<script src="%sassets/docs.js"></script>\n'
        "</body>\n</html>\n"
    ) % (
        title, SITE["desc"], FAVICON, prefix, theme_init,
        render_nav(prefix, current_link),
        sidebar_html,
        body_html, pager_html, render_footer(),
        toc_html,
        render_search_modal(),
        prefix, prefix,
    )


# ---------------------------------------------------------------
# 首页
# ---------------------------------------------------------------

def render_home():
    features = "".join(
        '<div class="feature-card"><div class="feature-icon">%s</div>'
        "<h3>%s</h3><p>%s</p></div>" % (f["icon"], f["title"], f["desc"])
        for f in HOME["features"])
    flow_nodes = []
    for i, n in enumerate(HOME["flow"]):
        if i:
            flow_nodes.append('<div class="flow-arrow">&rarr;</div>')
        flow_nodes.append(
            '<div class="flow-node"><div class="flow-ico">%s</div>'
            "<h4>%s</h4><p>%s</p></div>" % (n["icon"], n["title"], n["desc"]))
    steps = "".join("<li>%s</li>" % s for s in HOME["steps"])
    quickstart_code = (
        '<div class="vp-code-block">'
        '<div class="vp-code-header"><span class="vp-code-lang">bash</span>'
        '<button class="vp-code-copy" type="button" title="复制代码">%s</button></div>'
        '<pre><code class="language-bash">%s</code></pre></div>'
    ) % (ICONS["copy"], H.escape(HOME["quickstart_code"], quote=False))

    body = (
        '<main class="home">'
        '<section class="home-hero">'
        '<div class="hero-badge">%s</div>'
        '<h1 class="hero-name">%s</h1>'
        '<p class="hero-tagline">%s</p>'
        '<p class="hero-desc">%s</p>'
        '<div class="hero-actions">'
        '<a class="btn brand" href="guide/getting-started.html">快速开始</a>'
        '<a class="btn ghost" href="%s" target="_blank" rel="noopener">GitHub</a>'
        "</div>"
        '<div class="hero-meta"><span>GPL-3.0</span>&middot;<span>jQuery + Bootstrap</span>'
        "&middot;<span>免费额度部署</span></div>"
        "</section>"
        '<section class="home-section">'
        '<h2 class="home-section-title" id="home-features">核心特性</h2>'
        '<p class="home-section-sub">把静态博客的后端活儿，一次收齐</p>'
        '<div class="features">%s</div>'
        "</section>"
        '<section class="home-section">'
        '<h2 class="home-section-title" id="home-flow">工作原理</h2>'
        '<p class="home-section-sub">浏览器 &rarr; 边缘 Worker &rarr; 你的 GitHub 与 KV</p>'
        '<div class="flow">%s</div>'
        "</section>"
        '<section class="home-section home-quickstart">'
        '<h2 class="home-section-title" id="home-quickstart">三分钟上手</h2>'
        '<p class="home-section-sub">克隆、部署、登录——没有服务器要维护</p>'
        '<ol class="quick-steps">%s</ol>'
        "%s"
        '<div style="text-align:center;margin-top:24px">'
        '<a class="btn brand" href="guide/getting-started.html">查看完整部署指南</a></div>'
        "</section>"
        '<section class="home-cta">'
        '<h2 class="home-section-title">准备好开始了吗？</h2>'
        '<p class="home-section-sub">按指南完成部署，十分钟内拥有你的博客后台</p>'
        '<div class="hero-actions">'
        '<a class="btn brand" href="guide/installation.html">安装向导说明</a>'
        '<a class="btn ghost" href="reference/api.html">API 参考</a>'
        "</div>"
        "</section>"
        "</main>"
    ) % (
        HOME["badge"], HOME["name"], HOME["tagline"], HOME["desc"], SITE["repo"],
        features, "".join(flow_nodes), steps, quickstart_code,
    )
    return shell(
        "Zexo · 基于 Cloudflare Workers 的静态博客后端管理面板",
        "", "", body)


# ---------------------------------------------------------------
# 主流程
# ---------------------------------------------------------------

def main():
    flat = [it for g in SIDEBAR for it in g["items"]]

    # 读取并解析所有页面
    parsed = {}
    for it in flat:
        path = os.path.join(PAGES_DIR, it["link"] + ".md")
        if not os.path.exists(path):
            raise SystemExit("缺少文档源文件: %s" % path)
        with open(path, encoding="utf-8") as f:
            p = Parser(f.read())
        content = p.parse()
        parsed[it["link"]] = {
            "title": p.title or it["text"],
            "content": '<h1>%s</h1>%s' % (H.escape(p.title or it["text"], quote=False), content),
            "toc": p.toc,
        }

    # 检查未收录的 md 文件
    known = set(it["link"] + ".md" for it in flat)
    for fn in sorted(os.listdir(PAGES_DIR)):
        if fn.endswith(".md") and fn not in known:
            print("警告: %s 未出现在侧边栏中，已忽略" % fn)

    # 复制静态资源
    os.makedirs(os.path.join(BASE, "assets"), exist_ok=True)
    for name in ("docs.css", "docs.js"):
        shutil.copyfile(os.path.join(ASSETS_DIR, name), os.path.join(BASE, "assets", name))

    # 首页
    with open(os.path.join(BASE, "index.html"), "w", encoding="utf-8") as f:
        f.write(render_home())

    # 内容页
    for idx, it in enumerate(flat):
        page = parsed[it["link"]]
        html = shell(
            "%s · %s" % (page["title"], SITE["title"]),
            "../", it["link"],
            page["content"],
            sidebar_html=render_sidebar("../", it["link"]),
            toc_html=render_toc(page["toc"]),
            pager_html=render_pager("../", flat, idx),
        )
        out_dir = os.path.join(BASE, os.path.dirname(it["link"]))
        os.makedirs(out_dir, exist_ok=True)
        with open(os.path.join(BASE, it["link"] + ".html"), "w", encoding="utf-8") as f:
            f.write(html)

    # 搜索索引
    entries = [{"t": "Zexo 首页", "l": "index.html", "h": [
        {"i": "home-features", "t": "核心特性"},
        {"i": "home-flow", "t": "工作原理"},
        {"i": "home-quickstart", "t": "三分钟上手"},
    ]}]
    for it in flat:
        page = parsed[it["link"]]
        entries.append({
            "t": page["title"],
            "l": it["link"] + ".html",
            "h": [{"i": h["id"], "t": h["text"]} for h in page["toc"] if h["level"] in (2, 3)],
        })
    with open(os.path.join(BASE, "assets", "search-data.js"), "w", encoding="utf-8") as f:
        f.write("window.ZEXO_SEARCH = ")
        f.write(json.dumps(entries, ensure_ascii=False))
        f.write(";\n")

    print("文档站生成完毕：")
    print("  - docs/index.html (介绍页)")
    for it in flat:
        print("  - docs/%s.html (%s)" % (it["link"], it["text"]))
    print("  - docs/assets/{docs.css,docs.js,search-data.js}")


if __name__ == "__main__":
    main()
