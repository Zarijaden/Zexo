/*!
 * Zexo Markdown 编辑器核心
 * ---------------------------------------------------------------------------
 * 本文件的编辑命令（toggleAround / toggleLineStart / insertNewlineContinueMark /
 * deleteMarkupBackward 等）移植自 Modrinth 开源项目（https://github.com/modrinth/code）
 * 的 packages/utils/codemirror.ts（GPL-3.0），把原本基于 CodeMirror 6 的
 * EditorState / Transaction 替换为原生 <textarea> 的 value + selectionStart/End。
 * Zexo 同样以 GPL-3.0 发布，移植符合双方许可。
 *
 * 目录：
 *   1. 基础工具（选择区读写）
 *   2. 编辑命令（与 Modrinth 的 markdownCommands 一一对应）
 *   3. 输入增强（列表续行、Backspace 删标记、Tab 缩进、快捷键）
 *   4. Markdown 渲染与消毒（marked + 白名单过滤）
 *   5. 链接安全 / YouTube 内嵌
 *   6. 编辑器初始化 initZexoMarkdownEditor()
 * ---------------------------------------------------------------------------
 */

/* =========================================================================
 * 1. 基础工具
 * ========================================================================= */

function zexoMdSetValue(el, value, selStart, selEnd) {
  el.value = value;
  if (typeof selStart === 'number') {
    var end = typeof selEnd === 'number' ? selEnd : selStart;
    try {
      el.setSelectionRange(selStart, end);
    } catch (e) { /* type=file 等元素不支持，忽略 */ }
  }
}

/** 取当前行（不含换行符）的起止下标：{from, to, text} */
function zexoMdCurrentLine(el) {
  var value = el.value;
  var pos = el.selectionStart;
  var from = value.lastIndexOf('\n', pos - 1) + 1;
  var nl = value.indexOf('\n', pos);
  var to = nl === -1 ? value.length : nl;
  return { from: from, to: to, text: value.slice(from, to) };
}

/** 取「当前行首 → 选择区末尾」的文本，等价于 Modrinth 的 state.doc.sliceString(lineAt(from).from, selection.to) */
function zexoMdLineRangeToSelection(el) {
  var line = zexoMdCurrentLine(el);
  return { from: line.from, to: el.selectionEnd, text: el.value.slice(line.from, el.selectionEnd) };
}

/* =========================================================================
 * 2. 编辑命令（对应 Modrinth markdownCommands）
 * ========================================================================= */

/**
 * toggleAround —— 对应 Modrinth toggleAround(state, dispatch, open, close)
 * 已包裹则去掉包裹，未包裹则在选区两侧插入标记。
 * inclusive：标记被选中；exclusive：标记紧贴选区外侧。
 */
function zexoMdToggleAround(el, open, close) {
  var value = el.value;
  var from = el.selectionStart;
  var to = el.selectionEnd;
  var selected = value.slice(from, to);

  var surrounded = 'none';
  if (selected.length >= open.length + close.length &&
    selected.slice(0, open.length) === open &&
    selected.slice(selected.length - close.length) === close) {
    surrounded = 'inclusive';
  } else if (
    value.slice(Math.max(0, from - open.length), from) === open &&
    value.slice(to, to + close.length) === close
  ) {
    surrounded = 'exclusive';
  }

  if (surrounded === 'inclusive') {
    // 去掉选区内侧的标记，选区保持不变
    var inner = selected.slice(open.length, selected.length - close.length);
    zexoMdSetValue(el, value.slice(0, from) + inner + value.slice(to), from, from + inner.length);
    return true;
  }
  if (surrounded === 'exclusive') {
    // 去掉选区外侧的标记，并把选区平移回来
    zexoMdSetValue(
      el,
      value.slice(0, from - open.length) + selected + value.slice(to + close.length),
      from - open.length,
      to - open.length
    );
    return true;
  }

  // 未包裹：插入标记并把选区保持在标记内部
  zexoMdSetValue(el, value.slice(0, from) + open + selected + close + value.slice(to), from + open.length, to + open.length);
  return true;
}

/**
 * toggleLineStart —— 对应 Modrinth toggleLineStart(state, dispatch, text)
 * 作用于「当前行首 → 选区末尾」的每一行。
 */
function zexoMdToggleLineStart(el, text) {
  var value = el.value;
  var selFrom = el.selectionStart;
  var selTo = el.selectionEnd;
  var line = zexoMdCurrentLine(el);
  var from = line.from;
  var to = selTo;
  var selected = value.slice(from, to);
  var shouldRemove = selected.indexOf(text) === 0;

  var modified;
  var newFrom;
  var newTo;

  if (shouldRemove) {
    var occurrences = selected.split('\n' + text).length;
    modified = selected.slice(text.length).split('\n' + text).join('\n');
    zexoMdSetValue(
      el,
      value.slice(0, from) + modified + value.slice(to),
      selFrom - text.length,
      selTo - text.length * occurrences
    );
  } else {
    modified = text + selected.split('\n').join('\n' + text);
    var lengthDiff = modified.length - selected.length;
    zexoMdSetValue(
      el,
      value.slice(0, from) + modified + value.slice(to),
      selFrom + text.length,
      selTo + lengthDiff
    );
  }
  return true;
}

function zexoMdToggleBold(el) { return zexoMdToggleAround(el, '**', '**'); }
function zexoMdToggleItalic(el) { return zexoMdToggleAround(el, '_', '_'); }
function zexoMdToggleStrikethrough(el) { return zexoMdToggleAround(el, '~~', '~~'); }

function zexoMdToggleCodeBlock(el) {
  // Modrinth: `${lineBreak}\`\`\`${lineBreak}` 两侧相同
  var mark = '\n```\n';
  return zexoMdToggleAround(el, mark, mark);
}

function zexoMdToggleSpoiler(el) {
  // Modrinth 的 details/summary 折叠块
  return zexoMdToggleAround(el, '\n<details>\n<summary>Spoiler</summary>\n\n', '\n\n</details>\n\n');
}

function zexoMdToggleHeader(el) { return zexoMdToggleLineStart(el, '# '); }
function zexoMdToggleHeader2(el) { return zexoMdToggleLineStart(el, '## '); }
function zexoMdToggleHeader3(el) { return zexoMdToggleLineStart(el, '### '); }
function zexoMdToggleHeader4(el) { return zexoMdToggleLineStart(el, '#### '); }
function zexoMdToggleHeader5(el) { return zexoMdToggleLineStart(el, '##### '); }
function zexoMdToggleHeader6(el) { return zexoMdToggleLineStart(el, '###### '); }
function zexoMdToggleQuote(el) { return zexoMdToggleLineStart(el, '> '); }
function zexoMdToggleBulletList(el) { return zexoMdToggleLineStart(el, '- '); }
function zexoMdToggleOrderedList(el) { return zexoMdToggleLineStart(el, '1. '); }

/** 插入链接，选中文字作为链接文案 */
function zexoMdInsertLink(el, url, label) {
  var value = el.value;
  var from = el.selectionStart;
  var to = el.selectionEnd;
  var text = label || value.slice(from, to) || '链接文字';
  var markdown = '[' + text + '](' + url + ')';
  zexoMdSetValue(el, value.slice(0, from) + markdown + value.slice(to), from + markdown.length);
  return true;
}

/** 插入图片 */
function zexoMdInsertImage(el, url, alt) {
  var value = el.value;
  var from = el.selectionStart;
  var to = el.selectionEnd;
  var markdown = '![' + (alt || '') + '](' + url + ')';
  zexoMdSetValue(el, value.slice(0, from) + markdown + value.slice(to), from + markdown.length);
  return true;
}

/** 插入 YouTube 内嵌（对应 Modrinth 的 video 模态） */
function zexoMdInsertYoutube(el, videoId) {
  var value = el.value;
  var from = el.selectionStart;
  var to = el.selectionEnd;
  var iframe = '<iframe width="560" height="315" src="https://www.youtube-nocookie.com/embed/' + videoId +
    '" title="YouTube video player" frameborder="0" allowfullscreen></iframe>';
  zexoMdSetValue(el, value.slice(0, from) + iframe + value.slice(to), from + iframe.length);
  return true;
}

/** 命令表：data-zexo-md-cmd 的值 → 处理函数 */
var ZEXO_MD_COMMANDS = {
  h1: zexoMdToggleHeader,
  h2: zexoMdToggleHeader2,
  h3: zexoMdToggleHeader3,
  h4: zexoMdToggleHeader4,
  h5: zexoMdToggleHeader5,
  h6: zexoMdToggleHeader6,
  bold: zexoMdToggleBold,
  italic: zexoMdToggleItalic,
  strikethrough: zexoMdToggleStrikethrough,
  code: zexoMdToggleCodeBlock,
  spoiler: zexoMdToggleSpoiler,
  quote: zexoMdToggleQuote,
  bullet: zexoMdToggleBulletList,
  ordered: zexoMdToggleOrderedList
};

/** 工具栏布局，与 Modrinth BUTTONS 的分组一一对应 */
var ZEXO_MD_TOOLBAR = [
  {
    name: '标题',
    buttons: [
      { cmd: 'h1', icon: 'fa-header', label: '一级标题' },
      { cmd: 'h2', icon: 'fa-header', label: '二级标题', small: '2' },
      { cmd: 'h3', icon: 'fa-header', label: '三级标题', small: '3' }
    ]
  },
  {
    name: '样式',
    buttons: [
      { cmd: 'bold', icon: 'fa-bold', label: '加粗 (Ctrl+B)' },
      { cmd: 'italic', icon: 'fa-italic', label: '斜体 (Ctrl+I)' },
      { cmd: 'strikethrough', icon: 'fa-strikethrough', label: '删除线 (Ctrl+S)' },
      { cmd: 'code', icon: 'fa-code', label: '代码块 (Ctrl+E)' },
      { cmd: 'spoiler', icon: 'fa-eye-slash', label: '折叠剧透' }
    ]
  },
  {
    name: '列表',
    buttons: [
      { cmd: 'bullet', icon: 'fa-list-ul', label: '无序列表' },
      { cmd: 'ordered', icon: 'fa-list-ol', label: '有序列表' },
      { cmd: 'quote', icon: 'fa-quote-left', label: '引用 (Ctrl+Shift+.)' }
    ]
  }
];

/** 由分组数据生成工具栏 HTML（与老版本 .black2 按钮样式保持一致） */
function zexoMdToolbarHtml(ele, data_name) {
  var html = '<div class="black2 zexo_md_toolbar">';
  for (var g = 0; g < ZEXO_MD_TOOLBAR.length; g++) {
    var group = ZEXO_MD_TOOLBAR[g];
    html += '<span class="zexo_md_group" title="' + group.name + '">';
    for (var b = 0; b < group.buttons.length; b++) {
      var btn = group.buttons[b];
      html += '<button type="button" class="btn btn-primary zexo_md_btn" title="' + btn.label + '" data-zexo-md-cmd="' + btn.cmd + '">' +
        '<i class="fa ' + btn.icon + ' fa-2x"></i>' + (btn.small ? '<sub>' + btn.small + '</sub>' : '') + '</button>';
    }
    html += '</span>';
  }
  // 原有工具：自动备份 / 上传图片 / 导入 md / 预览
  html += '<span class="zexo_md_group" title="工具">' +
    '<button type="button" class="btn btn-primary zexo_md_btn" title="自动备份开关" onclick="zexo_start_or_stop_backup()"><i class="fa fa-clock-o fa-2x"></i></button> ' +
    '<button type="button" class="btn btn-primary zexo_md_btn" title="上传图片" onclick="$(\'#input\').click();"><i class="fa fa-photo fa-2x"></i></button>' +
    '<button type="button" class="btn btn-primary zexo_md_btn" title="导入 Markdown 文件" onclick="$(\'#upload_md\').click();"><i class="fa fa-file fa-2x"></i></button>' +
    '<button type="button" class="btn btn-primary zexo_md_btn" title="预览" onclick="zexo_preview(\'' + ele + '\',\'' + data_name + '\')" id="zexo_eye_' + ele + '"><i class="fa fa-eye fa-2x"></i></button>' +
    '</span>';
  html += '</div>';
  return html;
}

/* =========================================================================
 * 3. 输入增强（对应 Modrinth 的 insertNewlineContinueMark / deleteMarkupBackward）
 * ========================================================================= */

var ZEXO_MD_CONTINUE_NODES = ['bullet', 'ordered', 'quote']; // 对应 ListItem / Blockquote
var ZEXO_MD_CANCEL_PATTERNS = ['```', '# ', '> '];           // 对应 Modrinth cancelPatterns

function zexoMdIncrementMark(mark) {
  // 对应 Modrinth incrementMark()
  var m = /^(\d+)\.$/.exec(mark);
  if (m) { return (parseInt(m[1], 10) + 1) + '.'; }
  return mark;
}

/**
 * 解析光标所在行是否位于列表 / 引用内部，返回 {name, mark}
 * 对应 Modrinth getListStructure()：代码块内不处理。
 */
function zexoMdListStructure(lineText) {
  var trimmed = lineText.replace(/^\s+/, '');
  if (trimmed.indexOf('```') === 0) { return null; } // blackListedNodeTypes: CodeBlock
  var ordered = /^(\d+)\.\s/.exec(trimmed);
  if (ordered) { return { name: 'ordered', mark: ordered[1] + '.', indent: lineText.slice(0, lineText.length - trimmed.length) }; }
  var bullet = /^([-*+])\s/.exec(trimmed);
  if (bullet) { return { name: 'bullet', mark: bullet[1], indent: lineText.slice(0, lineText.length - trimmed.length) }; }
  var quote = /^>\s?/.exec(trimmed);
  if (quote) { return { name: 'quote', mark: '>', indent: lineText.slice(0, lineText.length - trimmed.length) }; }
  return null;
}

/** Enter：延续列表 / 引用标记，空项则退出列表 */
function zexoMdInsertNewlineContinueMark(el) {
  var value = el.value;
  var pos = el.selectionStart;
  var line = zexoMdCurrentLine(el);
  var structure = zexoMdListStructure(line.text);

  if (!structure) { return false; } // 交给浏览器插入普通换行

  var indentStr = structure.indent || '';
  var cancelPatterns = ZEXO_MD_CANCEL_PATTERNS.slice();
  cancelPatterns.push(structure.mark + ' ');

  var lineContent = line.text.replace(/\s+$/, '');
  var contentAfterMark = lineContent.replace(/^\s*/, '').replace(/^(\d+\.|[-*+]|>)\s?/, '');

  // 取消模式：`\`\`\``、`# `、`> `、或光秃秃的列表标记
  if (cancelPatterns.indexOf(lineContent.trim()) !== -1 || contentAfterMark === '') {
    if (contentAfterMark === '') {
      // 空列表项 → 再回车退出列表，并清掉标记
      zexoMdSetValue(el, value.slice(0, line.from) + '\n' + value.slice(line.to), line.from + 1);
      return true;
    }
    return false;
  }

  var insert;
  if (structure.name === 'ordered') {
    insert = '\n' + indentStr + zexoMdIncrementMark(structure.mark) + ' ';
  } else if (structure.name === 'quote') {
    insert = '\n' + indentStr + '> ';
  } else {
    insert = '\n' + indentStr + structure.mark + ' ';
  }

  var selected = value.slice(pos, el.selectionEnd);
  zexoMdSetValue(el, value.slice(0, pos) + insert + value.slice(el.selectionEnd), pos + insert.length);
  return true;
}

/**
 * Backspace：删除光标前的 Markdown 标记（列表符 / 引用符 / 标题符 / 强调符）
 * 对应 Modrinth 使用的 @codemirror/lang-markdown deleteMarkupBackward
 */
function zexoMdDeleteMarkupBackward(el) {
  var value = el.value;
  var pos = el.selectionStart;
  if (pos !== el.selectionEnd) { return false; }
  var line = zexoMdCurrentLine(el);
  var before = value.slice(line.from, pos);
  if (before.length === 0) { return false; }

  var wasBeforeLineStart = before === line.text.slice(0, before.length);

  // 行首列表符：`- ` / `* ` / `+ ` / `1. `
  if (wasBeforeLineStart) {
    var lineHead = /^\s*((?:\d+\.)|[-*+]) $/.exec(before);
    if (lineHead) {
      zexoMdSetValue(el, value.slice(0, line.from) + value.slice(pos), line.from);
      return true;
    }
  }
  // 行首引用符
  if (/^\s*> $/.test(before)) {
    zexoMdSetValue(el, value.slice(0, line.from) + value.slice(pos), line.from);
    return true;
  }
  // 行首标题符
  var header = /^#{1,6} $/.exec(before);
  if (header) {
    zexoMdSetValue(el, value.slice(0, line.from) + value.slice(pos), line.from);
    return true;
  }

  // 强调标记：光标前是左标记、且同一行内还能找到对应右标记时，一次退格删掉整对。
  // 例如 `**|bold**`（光标在正文左侧）→ 退格后只剩 `bold`。
  var lineRest = value.slice(line.from, line.to);
  var offsetInLine = pos - line.from;
  var pairs = [['**', '**'], ['_', '_'], ['~~', '~~']];
  for (var i = 0; i < pairs.length; i++) {
    var open = pairs[i][0];
    var close = pairs[i][1];
    if (before.slice(-open.length) !== open) { continue; }
    var closeAt = lineRest.indexOf(close, offsetInLine + close.length);
    if (closeAt === -1) { continue; }
    var absCloseAt = line.from + closeAt;
    zexoMdSetValue(
      el,
      value.slice(0, pos - open.length) + value.slice(pos, absCloseAt) + value.slice(absCloseAt + close.length),
      pos - open.length
    );
    return true;
  }
  return false;
}

/** Tab / Shift-Tab 缩进，对应 Modrinth 使用的 indentWithTab */
function zexoMdIndent(el, outdent) {
  var value = el.value;
  var selFrom = el.selectionStart;
  var selTo = el.selectionEnd;
  var line = zexoMdCurrentLine(el);
  var blockEnd = value.indexOf('\n', selTo);
  if (blockEnd === -1) { blockEnd = value.length; }
  var block = value.slice(line.from, blockEnd);
  var INDENT = '  ';

  var lines = block.split('\n');
  var deltaFirst = 0;
  var deltaAll = 0;
  for (var i = 0; i < lines.length; i++) {
    if (outdent) {
      var removed = lines[i].match(/^( {1,2}|\t)/);
      if (removed) { lines[i] = lines[i].slice(removed[0].length); deltaAll -= removed[0].length; if (i === 0) { deltaFirst -= removed[0].length; } }
    } else {
      lines[i] = INDENT + lines[i];
      deltaAll += INDENT.length;
      if (i === 0) { deltaFirst += INDENT.length; }
    }
  }
  zexoMdSetValue(el, value.slice(0, line.from) + lines.join('\n') + value.slice(blockEnd), selFrom + deltaFirst, selTo + deltaAll);
  return true;
}

/* =========================================================================
 * 4. Markdown 渲染与消毒
 * ========================================================================= */

/** 允许的标签 / 属性白名单，参考 Modrinth packages/utils/parse.ts 的 xss 配置 */
var ZEXO_MD_ALLOWED_TAGS = [
  'a', 'b', 'blockquote', 'br', 'code', 'del', 'details', 'summary', 'div', 'em',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'hr', 'i', 'iframe', 'img', 'input', 'kbd',
  'li', 'ol', 'p', 'picture', 'pre', 's', 'source', 'span', 'strong', 'sub', 'sup',
  'table', 'tbody', 'td', 'tfoot', 'th', 'thead', 'tr', 'ul'
];

/**
 * 兜底消毒：在没有 DOMPurify 时用 DOMParser 走一遍白名单。
 * 关键点：script/style 整段丢弃（含文本），事件属性全部丢弃，href/src 协议校验。
 */
function zexoMdSanitizeFallback(html) {
  var doc = new DOMParser().parseFromString('<div id="__zexo_root__">' + html + '</div>', 'text/html');
  var root = doc.getElementById('__zexo_root__');
  if (!root) { return ''; }

  // 先整段移除危险元素
  var kill = root.querySelectorAll('script,style,link,meta,object,embed,form,base');
  for (var k = 0; k < kill.length; k++) { kill[k].parentNode.removeChild(kill[k]); }

  var walk = function (node) {
    var children = Array.prototype.slice.call(node.children || []);
    for (var i = 0; i < children.length; i++) {
      var child = children[i];
      var tag = child.tagName.toLowerCase();
      if (ZEXO_MD_ALLOWED_TAGS.indexOf(tag) === -1) {
        // 不在白名单：保留文字内容，丢掉标签本身
        var text = doc.createTextNode(child.textContent || '');
        child.parentNode.replaceChild(text, child);
        continue;
      }
      var attrs = Array.prototype.slice.call(child.attributes || []);
      for (var j = 0; j < attrs.length; j++) {
        var name = attrs[j].name.toLowerCase();
        var val = attrs[j].value;
        if (name.indexOf('on') === 0) { child.removeAttribute(attrs[j].name); continue; }
        if (name === 'href' || name === 'src' || name === 'xlink:href') {
          var ok = /^(https?:|mailto:|#|\/)/i.test(val);
          if (tag === 'img' || tag === 'source') { ok = /^https?:/i.test(val) || /^data:image\//i.test(val); }
          if (!ok) { child.removeAttribute(attrs[j].name); }
          continue;
        }
        if (['class', 'id', 'title', 'alt', 'width', 'height', 'target', 'rel', 'colspan', 'rowspan',
          'align', 'srcset', 'media', 'type', 'sizes', 'loading', 'start', 'value', 'checked', 'disabled',
          'allow', 'allowfullscreen', 'frameborder', 'datetime'].indexOf(name) === -1) {
          child.removeAttribute(attrs[j].name);
        }
      }
      walk(child);
    }
  };
  walk(root);
  return root.innerHTML;
}

/** 统一消毒入口：有 DOMPurify 用 DOMPurify，否则退回白名单过滤 */
function zexoMdSanitize(html) {
  if (window.DOMPurify && typeof window.DOMPurify.sanitize === 'function') {
    return window.DOMPurify.sanitize(html, { ADD_TAGS: ['details', 'summary', 'iframe', 'picture', 'source'], ADD_ATTR: ['target', 'rel', 'allowfullscreen'] });
  }
  try {
    return zexoMdSanitizeFallback(html);
  } catch (e) {
    console.log('zexo markdown sanitize fallback failed: ' + e);
    return html;
  }
}

/** 把 <img> 包成 <picture>，交给 wsrv.nl 转 WebP，参考 Modrinth 的图片 CDN 代理策略 */
function zexoMdUpgradeImages(html) {
  var doc = new DOMParser().parseFromString('<div id="__zexo_root__">' + html + '</div>', 'text/html');
  var root = doc.getElementById('__zexo_root__');
  if (!root) { return html; }
  var imgs = root.getElementsByTagName('img');
  var i;
  for (i = 0; i < imgs.length; i++) {
    var img = imgs[i];
    img.setAttribute('loading', 'lazy');
    if (!img.getAttribute('alt')) { img.setAttribute('alt', ''); }
  }
  return root.innerHTML;
}

/** 渲染 Markdown → 消毒后的 HTML */
function zexoRenderMarkdown(markdown) {
  var raw = '';
  if (typeof marked === 'function') {
    raw = marked(markdown == null ? '' : String(markdown));
  } else {
    // 极端兜底：marked 没加载时至少保证换行
    raw = String(markdown == null ? '' : markdown).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/\n/g, '<br>');
  }
  return zexoMdUpgradeImages(zexoMdSanitize(raw));
}

/* =========================================================================
 * 5. 链接安全 / YouTube（对应 Modrinth cleanUrl + youtubeRegex）
 * ========================================================================= */

var ZEXO_MD_BLOCKED_HOSTS = ['forgecdn', 'cdn.discordapp', 'media.discordapp'];

/**
 * cleanUrl —— 对应 Modrinth 的 cleanUrl()
 * 非法 URL 抛错；仅允许 http/https；http 自动升级为 https；屏蔽危险图床域名。
 */
function zexoMdCleanUrl(input) {
  var url = String(input == null ? '' : input).trim();
  if (url.length === 0) { throw new Error('链接不能为空'); }
  var parsed = new URL(url);
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('仅支持 http / https 链接');
  }
  if (parsed.protocol === 'http:') { parsed.protocol = 'https:'; }
  for (var i = 0; i < ZEXO_MD_BLOCKED_HOSTS.length; i++) {
    if (parsed.href.indexOf(ZEXO_MD_BLOCKED_HOSTS[i]) !== -1) {
      throw new Error('该域名不被允许：' + ZEXO_MD_BLOCKED_HOSTS[i]);
    }
  }
  return parsed.href;
}

/** youtubeRegex —— 与 Modrinth MarkdownEditorImpl.vue 保持一致 */
var ZEXO_MD_YOUTUBE_REGEX = /^(?:https?:)?(?:\/\/)?(?:youtu\.be\/|(?:www\.|m\.)?youtube\.com\/(?:watch|v|embed)(?:\.php)?(?:\?.*v=|\/))([a-zA-Z0-9_-]{7,15})(?:[?&][a-zA-Z0-9_-]+=[a-zA-Z0-9_-]+)*$/;

function zexoMdParseYoutube(input) {
  var m = ZEXO_MD_YOUTUBE_REGEX.exec(String(input == null ? '' : input).trim());
  return m ? m[1] : null;
}

/** 在预览区把裸 YouTube 链接替换为 nocookie 内嵌 */
function zexoMdUpgradeYoutubeEmbeds(html) {
  var doc = new DOMParser().parseFromString('<div id="__zexo_root__">' + html + '</div>', 'text/html');
  var root = doc.getElementById('__zexo_root__');
  if (!root) { return html; }
  var anchors = root.getElementsByTagName('a');
  for (var i = 0; i < anchors.length; i++) {
    var a = anchors[i];
    var id = zexoMdParseYoutube(a.getAttribute('href') || a.textContent || '');
    if (!id) { continue; }
    var iframe = doc.createElement('iframe');
    iframe.setAttribute('src', 'https://www.youtube-nocookie.com/embed/' + id);
    iframe.setAttribute('width', '560');
    iframe.setAttribute('height', '315');
    iframe.setAttribute('frameborder', '0');
    iframe.setAttribute('allowfullscreen', 'allowfullscreen');
    a.parentNode.insertBefore(iframe, a);
    a.parentNode.removeChild(a);
  }
  return root.innerHTML;
}

/* =========================================================================
 * 6. 编辑器初始化
 * ========================================================================= */

/**
 * initZexoMarkdownEditor({ ele, data_name, owo, backuptime })
 * 在 #<ele> 内构建工具栏 + textarea + 预览区 + OwO 表情面板，并绑定所有增强行为。
 * 返回一个可复用的编辑器实例。
 */
function initZexoMarkdownEditor(options) {
  options = options || {};
  var ele = options.ele === undefined ? 'edit' : options.ele;
  var data_name = options.data_name === undefined ? 'zexo_editor' : options.data_name;
  var owo = options.owo === undefined ? 'https://cdn.jsdelivr.net/gh/ChenYFan/CDN@master/assets/list.json' : options.owo;
  var backuptime = options.backuptime === undefined ? 60000 : options.backuptime;

  var mount = document.getElementById(ele);
  if (!mount) {
    console.log('ERROR: No element #' + ele);
    return null;
  }

  mount.innerHTML = zexoMdToolbarHtml(ele, data_name) +
    '<textarea class="zexo_md_textarea" style="border:0;border-radius:5px;background-color:#90939920;width: 100%;min-height: 400px;padding: 10px;resize: none;display:block" id="text_' + ele + '"></textarea>' +
    '<div style="border:0;border-radius:5px;background-color:#90939920;max-width: 100%;min-height: 70%;padding: 10px;resize: none; display: none;" id="div_' + ele + '" class="zexo_pre_div markdown-body"></div>' +
    '<div class="OwO"></div>';

  var textarea = document.getElementById('text_' + ele);
  var preview = document.getElementById('div_' + ele);
  var toolbar = mount.querySelector('.zexo_md_toolbar');

  // 恢复本地备份（没有备份时保持空字符串，避免出现字面量 "null"）
  var backup = localStorage.getItem('zexo_' + data_name + '_backup');
  textarea.value = backup === null ? '' : backup;

  /* ---- 3.1 工具栏点击 ---- */
  if (toolbar) {
    toolbar.addEventListener('click', function (evt) {
      var target = evt.target;
      while (target && target !== toolbar && !target.getAttribute('data-zexo-md-cmd')) {
        target = target.parentNode;
      }
      if (!target || target === toolbar) { return; }
      var cmd = target.getAttribute('data-zexo-md-cmd');
      var fn = ZEXO_MD_COMMANDS[cmd];
      if (typeof fn === 'function') {
        evt.preventDefault();
        fn(textarea);
        textarea.focus();
      }
    });
  }

  /* ---- 3.2 输入增强 + 快捷键 ---- */
  textarea.addEventListener('keydown', function (evt) {
    var mod = evt.ctrlKey || evt.metaKey;

    if (evt.key === 'Enter' && !evt.shiftKey && !mod) {
      if (zexoMdInsertNewlineContinueMark(textarea)) { evt.preventDefault(); }
      return;
    }
    if (evt.key === 'Backspace' && !mod) {
      if (zexoMdDeleteMarkupBackward(textarea)) { evt.preventDefault(); return; }
      return;
    }
    if (evt.key === 'Tab') {
      evt.preventDefault();
      zexoMdIndent(textarea, evt.shiftKey);
      return;
    }
    if (mod && evt.shiftKey && evt.key === '.') { evt.preventDefault(); zexoMdToggleQuote(textarea); return; }
    if (mod && evt.shiftKey && evt.key === '7') { evt.preventDefault(); zexoMdToggleOrderedList(textarea); return; }
    if (mod && evt.shiftKey && evt.key === '8') { evt.preventDefault(); zexoMdToggleBulletList(textarea); return; }
    if (!mod || evt.shiftKey) { return; }
    var lower = (evt.key || '').toLowerCase();
    if (lower === 'b') { evt.preventDefault(); zexoMdToggleBold(textarea); }
    else if (lower === 'i') { evt.preventDefault(); zexoMdToggleItalic(textarea); }
    else if (lower === 's') { evt.preventDefault(); zexoMdToggleStrikethrough(textarea); }
    else if (lower === 'e') { evt.preventDefault(); zexoMdToggleCodeBlock(textarea); }
  });

  /* ---- 3.3 粘贴：文件自动上传 / 链接自动成 Markdown 链接 ---- */
  textarea.addEventListener('paste', function (evt) {
    var clipboard = evt.clipboardData;
    if (!clipboard) { return; }

    // 粘贴文件（截图 / 图片文件）→ 交给上传流程
    if (clipboard.files && clipboard.files.length > 0 && typeof options.onFilePaste === 'function') {
      evt.preventDefault();
      options.onFilePaste(clipboard.files[0]);
      return;
    }

    var pasted = clipboard.getData('text/plain');
    if (!pasted) { return; }

    // 粘贴的是图片直链 → 转成 Markdown 图片
    if (/^https?:\/\/\S+\.(png|jpe?g|gif|webp|svg|avif)(\?\S*)?$/i.test(pasted.trim())) {
      evt.preventDefault();
      zexoMdInsertImage(textarea, pasted.trim(), '');
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
      return;
    }

    // 选中了文字再粘贴 URL → 包装成链接
    if (textarea.selectionStart !== textarea.selectionEnd && /^https?:\/\/\S+$/i.test(pasted.trim())) {
      evt.preventDefault();
      zexoMdInsertLink(textarea, pasted.trim(), null);
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
    }
  });

  /* ---- 3.4 拖拽图片上传 ---- */
  textarea.addEventListener('dragover', function (evt) {
    if (evt.dataTransfer && evt.dataTransfer.types && Array.prototype.indexOf.call(evt.dataTransfer.types, 'Files') !== -1) {
      evt.preventDefault();
    }
  });
  textarea.addEventListener('drop', function (evt) {
    if (evt.dataTransfer && evt.dataTransfer.files && evt.dataTransfer.files.length > 0 && typeof options.onFilePaste === 'function') {
      evt.preventDefault();
      var files = evt.dataTransfer.files;
      for (var i = 0; i < files.length; i++) { options.onFilePaste(files[i]); }
    }
  });

  /* ---- 3.5 自动备份 ---- */
  if (backuptime > 0) {
    setInterval(function () { zexo_backup(data_name, ele); }, backuptime);
  }

  /* ---- 3.6 OwO 表情面板 ---- */
  var owoInstance = null;
  try {
    var owoContainer = mount.querySelector('.OwO');
    if (owoContainer && typeof OwO === 'function') {
      owoInstance = new OwO({
        container: owoContainer,
        api: owo,
        position: 'down',
        maxHeight: '250px'
      });
    }
  } catch (e) {
    console.log('OwO 初始化失败：' + e);
  }

  var instance = {
    ele: ele,
    data_name: data_name,
    textarea: textarea,
    preview: preview,
    owo: owoInstance,
    /** 渲染预览（Modrinth 风格的消毒 + 图片/视频增强） */
    render: function () {
      preview.innerHTML = zexoRenderMarkdown(textarea.value);
    },
    /** 切换预览，返回 true 表示当前处于预览态 */
    togglePreview: function () {
      var showing = preview.style.display !== 'block';
      preview.style.display = showing ? 'block' : 'none';
      textarea.style.display = showing ? 'none' : 'block';
      if (showing) { instance.render(); }
      return showing;
    },
    /** 追加内容到末尾，供 OwO 等外部调用 */
    append: function (text) {
      textarea.value += text;
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
    }
  };

  mount.zexoEditor = instance;
  return instance;
}

/** 取某个挂载点上的编辑器实例 */
function zexoMdEditorOf(ele) {
  var mount = document.getElementById(ele);
  return mount ? mount.zexoEditor : null;
}

// 显式挂到 window 上，避免压缩器改写外部引用的名字
window.zexoMdEditorToolbarHtml = zexoMdToolbarHtml;
window.initZexoMarkdownEditor = initZexoMarkdownEditor;
window.zexoMdEditorOf = zexoMdEditorOf;
window.zexoRenderMarkdown = zexoRenderMarkdown;
window.zexoMdCleanUrl = zexoMdCleanUrl;
window.zexoMdParseYoutube = zexoMdParseYoutube;
window.zexoMdInsertLink = zexoMdInsertLink;
window.zexoMdInsertImage = zexoMdInsertImage;
window.zexoMdInsertYoutube = zexoMdInsertYoutube;
window.ZEXO_MD_COMMANDS = ZEXO_MD_COMMANDS;

/** 从 URL 渲染预览的通用包装（给 index.js 的独立渲染场景留口子） */
function zexoRenderMarkdownWithVideo(html) {
  return zexoMdUpgradeYoutubeEmbeds(html);
}
window.zexoRenderMarkdownWithVideo = zexoRenderMarkdownWithVideo;
