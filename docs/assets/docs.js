/* ============================================================
   Zexo 文档站脚本（VitePress 风格）
   ============================================================ */
(function () {
  "use strict";

  var PREFIX = window.ZEXO_PREFIX || "";

  /* ---------- 主题切换 ---------- */
  function currentTheme() {
    return document.documentElement.getAttribute("data-theme") || "light";
  }
  function setTheme(t) {
    document.documentElement.setAttribute("data-theme", t);
    try { localStorage.setItem("zexo-docs-theme", t); } catch (e) {}
  }
  document.querySelectorAll("[data-theme-toggle]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      setTheme(currentTheme() === "dark" ? "light" : "dark");
    });
  });

  /* ---------- 移动端侧边栏 ---------- */
  var sidebar = document.getElementById("sidebar");
  var mask = document.getElementById("sidebar-mask");
  function closeSidebar() {
    sidebar && sidebar.classList.remove("open");
    mask && mask.classList.remove("open");
  }
  var burger = document.getElementById("sidebar-toggle");
  if (burger) burger.addEventListener("click", function () {
    sidebar.classList.toggle("open");
    mask.classList.toggle("open");
  });
  if (mask) mask.addEventListener("click", closeSidebar);
  sidebar && sidebar.querySelectorAll("a").forEach(function (a) {
    a.addEventListener("click", closeSidebar);
  });

  /* ---------- 侧边栏分组折叠 ---------- */
  document.querySelectorAll(".sidebar-group-title").forEach(function (title) {
    title.addEventListener("click", function () {
      title.parentElement.classList.toggle("collapsed");
    });
  });

  /* ---------- 代码块：复制 + 语法高亮 ---------- */
  function esc(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  var GRAMMARS = {
    javascript: [
      [/(?:\/\/[^\n]*|\/\*[\s\S]*?\*\/)/y, "com"],
      [/"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'|`(?:[^`\\]|\\.)*`/y, "str"],
      [/\b(?:const|let|var|function|return|if|else|for|while|do|new|class|extends|await|async|import|export|from|require|try|catch|finally|throw|typeof|instanceof|switch|case|break|continue|default|null|undefined|true|false|this)\b/y, "kw"],
      [/\b\d+(?:\.\d+)?(?:e[+-]?\d+)?\b/yi, "num"],
      [/[A-Za-z_$][\w$]*(?=\s*\()/y, "fn"]
    ],
    bash: [
      [/#[^\n]*/y, "com"],
      [/"(?:[^"\\]|\\.)*"|'[^']*'/y, "str"],
      [/\$\{[^}]*\}|\$\w+/y, "var"],
      [/(?:npm|npx|node|git|cd|wrangler|gulp|python3?|sudo|curl|export|echo|mkdir|cp|ls|rm)\b/y, "fn"],
      [/-{1,2}[A-Za-z][\w-]*/y, "attr"]
    ],
    json: [
      [/"(?:\\.|[^"\\])*"(?=\s*:)/y, "key"],
      [/"(?:\\.|[^"\\])*"/y, "str"],
      [/\b(?:true|false|null)\b/y, "kw"],
      [/-?\b\d+(?:\.\d+)?(?:e[+-]?\d+)?\b/yi, "num"]
    ],
    html: [
      [/(?:&lt;!--[\s\S]*?--&gt;)/y, "com"],
      [/<\/?[A-Za-z][\w-]*/y, "tag"],
      [/[A-Za-z-]+(?==)/y, "attr"],
      [/"(?:[^"]*)"|'(?:[^']*)'/y, "str"],
      [/\/?>/y, "tag"]
    ],
    toml: [
      [/#[^\n]*/y, "com"],
      [/\[\[?[^\]]+\]\]?/y, "sec"],
      [/[A-Za-z_][\w-]*(?=\s*=)/y, "key"],
      [/"(?:\\.|[^"\\])*"/y, "str"],
      [/\b(?:true|false)\b/y, "kw"],
      [/-?\b\d+(?:\.\d+)?\b/y, "num"]
    ],
    text: []
  };

  function tokenize(code, rules) {
    var out = "", pos = 0;
    while (pos < code.length) {
      var matched = false;
      for (var i = 0; i < rules.length; i++) {
        var re = rules[i][0], cls = rules[i][1];
        re.lastIndex = pos;
        var m = re.exec(code);
        if (m && m.index === pos) {
          out += '<span class="tk-' + cls + '">' + esc(m[0]) + "</span>";
          pos += m[0].length;
          matched = true;
          break;
        }
      }
      if (!matched) { out += esc(code[pos]); pos++; }
    }
    return out;
  }

  document.querySelectorAll(".vp-code-block pre code").forEach(function (el) {
    var m = el.className.match(/language-([\w-]+)/);
    var lang = m ? m[1] : "text";
    var rules = GRAMMARS[lang];
    if (!rules || !rules.length) return;
    el.innerHTML = tokenize(el.textContent, rules);
  });

  document.querySelectorAll(".vp-code-copy").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var block = btn.closest(".vp-code-block");
      var code = block.querySelector("pre code");
      var text = code.textContent;
      function done() {
        btn.classList.add("copied");
        btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
        setTimeout(function () {
          btn.classList.remove("copied");
          btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>';
        }, 1800);
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, function () { fallbackCopy(text); done(); });
      } else { fallbackCopy(text); done(); }
    });
  });
  function fallbackCopy(text) {
    var ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand("copy"); } catch (e) {}
    document.body.removeChild(ta);
  }

  /* ---------- 目录滚动监听 ---------- */
  var tocLinks = Array.prototype.slice.call(document.querySelectorAll(".toc-list a"));
  if (tocLinks.length) {
    var heads = tocLinks.map(function (a) {
      return document.getElementById(decodeURIComponent(a.getAttribute("href").slice(1)));
    });
    var ticking = false;
    function spy() {
      var idx = 0;
      for (var i = 0; i < heads.length; i++) {
        if (heads[i] && heads[i].getBoundingClientRect().top <= 100) idx = i;
      }
      tocLinks.forEach(function (a, i) { a.classList.toggle("active", i === idx); });
      ticking = false;
    }
    window.addEventListener("scroll", function () {
      if (!ticking) { ticking = true; requestAnimationFrame(spy); }
    }, { passive: true });
    spy();
  }

  /* ---------- 搜索 ---------- */
  var mask = document.getElementById("search-mask");
  var input = document.getElementById("search-input");
  var list = document.getElementById("search-results");
  var index = window.ZEXO_SEARCH || [];
  var selected = 0;
  var results = [];

  function openSearch() {
    if (!mask) return;
    mask.classList.add("open");
    input.value = "";
    render("");
    setTimeout(function () { input.focus(); }, 30);
  }
  function closeSearch() { mask && mask.classList.remove("open"); }

  document.querySelectorAll("[data-search-open]").forEach(function (el) {
    el.addEventListener("click", function (e) { e.preventDefault(); openSearch(); });
  });
  mask && mask.addEventListener("click", function (e) { if (e.target === mask) closeSearch(); });

  function escRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
  function hl(text, q) {
    return esc(text).replace(new RegExp("(" + escRe(q) + ")", "gi"), "<mark>$1</mark>");
  }

  function render(q) {
    q = q.trim();
    results = [];
    if (!q) {
      // 无关键词时展示全部页面
      index.forEach(function (p) {
        results.push({ page: p.t, link: p.l, heading: null, query: "" });
      });
    } else {
      var lower = q.toLowerCase();
      index.forEach(function (p) {
        if (p.t.toLowerCase().indexOf(lower) !== -1) {
          results.push({ page: p.t, link: p.l, heading: null, query: q });
        }
        p.h.forEach(function (h) {
          if (h.t.toLowerCase().indexOf(lower) !== -1) {
            results.push({ page: p.t, link: p.l + "#" + h.i, heading: h.t, query: q });
          }
        });
      });
    }
    results = results.slice(0, 14);
    selected = 0;
    drawResults();
  }

  function drawResults() {
    if (!results.length) {
      list.innerHTML = '<li class="search-empty">没有找到相关内容，换个关键词试试。</li>';
      return;
    }
    list.innerHTML = results.map(function (r, i) {
      var q = r.query;
      var title = q ? hl(r.heading || r.page, q) : esc(r.heading || r.page);
      var page = '<div class="res-page">' + (q ? hl(r.page, q) : esc(r.page)) + "</div>";
      return '<li><a class="' + (i === selected ? "selected" : "") + '" href="' +
        (PREFIX + r.link) + '"><div class="res-title">' + title + "</div>" + page + "</a></li>";
    }).join("");
    var sel = list.querySelector("a.selected");
    if (sel) sel.scrollIntoView({ block: "nearest" });
  }

  input && input.addEventListener("input", function () { render(input.value); });

  document.addEventListener("keydown", function (e) {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      if (mask && mask.classList.contains("open")) { closeSearch(); } else { openSearch(); }
      return;
    }
    if (!mask || !mask.classList.contains("open")) return;
    if (e.key === "Escape") { closeSearch(); }
    else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (results.length) { selected = (selected + 1) % results.length; drawResults(); }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (results.length) { selected = (selected - 1 + results.length) % results.length; drawResults(); }
    } else if (e.key === "Enter") {
      var r = results[selected];
      if (r) { window.location.href = PREFIX + r.link; }
    }
  });
})();
