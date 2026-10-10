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

/** 需要弹窗 / 上传交互的按钮（对应 Modrinth 的 link / image / video 模态） */
var ZEXO_MD_INTERACTIONS = {
  link: function (editor) { zexoMdOpenLinkModal(editor); },
  image: function (editor) { zexoMdOpenImageModal(editor); },
  video: function (editor) { zexoMdOpenVideoModal(editor); },
  emoji: function (editor) {
    // 直接触发 OwO 面板的展开/收起（等价于点 OwO 表情图标）
    var logo = editor.mount ? editor.mount.querySelector('.OwO-logo') : null;
    if (logo) { logo.click(); return; }
    if (typeof sweetAlert === 'function') { sweetAlert('表情面板未加载', 'OwO 表情列表可能被拦截或接口不可用', 'warning'); }
  },
  import: function (editor) { zexoMdImportFile(editor); }
};

/** 工具栏布局，分组与 Modrinth 的 BUTTONS（headings / stylizing / lists / components）一一对应 */
var ZEXO_MD_TOOLBAR = [
  {
    name: '标题',
    buttons: [
      { cmd: 'h1', icon: 'fa-header', label: '一级标题', text: 'H1' },
      { cmd: 'h2', icon: 'fa-header', label: '二级标题', text: 'H2' },
      { cmd: 'h3', icon: 'fa-header', label: '三级标题', text: 'H3' }
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
      { cmd: 'ordered', icon: 'fa-list-ol', label: '有序列表 (Ctrl+Shift+7)' },
      { cmd: 'quote', icon: 'fa-quote-left', label: '引用 (Ctrl+Shift+.)' }
    ]
  },
  {
    name: '组件',
    buttons: [
      { cmd: 'link', icon: 'fa-link', label: '插入链接' },
      { cmd: 'image', icon: 'fa-image', label: '插入图片（上传 / 外链）' },
      { cmd: 'video', icon: 'fa-youtube-play', label: '插入 YouTube 视频' },
      { cmd: 'emoji', icon: 'fa-smile-o', label: '插入表情' }
    ]
  }
];

/** 由分组数据生成工具栏 HTML（Modrinth 风格图标按钮 + 分组分隔） */
function zexoMdToolbarHtml(ele, data_name) {
  var html = '<div class="black2 zexo_md_toolbar">';

  // 第一行：命令按钮组 / 工具按钮组 / 预览开关（对应 Modrinth 的 editor-actions + 预览 Toggle）
  html += '<div class="zexo_md_row zexo_md_row--top">';
  html += '<div class="zexo_md_actions">';
  var firstGroup = true;
  for (var g = 0; g < ZEXO_MD_TOOLBAR.length; g++) {
    var group = ZEXO_MD_TOOLBAR[g];
    if (!firstGroup) { html += '<span class="zexo_md_divider" aria-hidden="true"></span>'; }
    firstGroup = false;
    html += '<div class="zexo_md_group" role="group" aria-label="' + group.name + '" title="' + group.name + '">';
    for (var b = 0; b < group.buttons.length; b++) {
      var btn = group.buttons[b];
      html += '<button type="button" class="zexo_md_btn" title="' + btn.label + '" aria-label="' + btn.label +
        '" data-zexo-md-cmd="' + btn.cmd + '">' +
        (btn.text ? '<span class="zexo_md_btn_text">' + btn.text + '</span>' : '<i class="fa ' + btn.icon + '"></i>') +
        '</button>';
    }
    html += '</div>';
  }
  // 工具组：自动备份 / 导入 Markdown（对应 Modrinth maxLength 旁的辅助动作）
  html += '<span class="zexo_md_divider" aria-hidden="true"></span>';
  html += '<div class="zexo_md_group" role="group" aria-label="工具" title="工具">' +
    '<button type="button" class="zexo_md_btn" title="自动备份开关" aria-label="自动备份开关" onclick="zexo_start_or_stop_backup()"><i class="fa fa-clock-o"></i></button>' +
    '<button type="button" class="zexo_md_btn" title="导入 Markdown 文件" aria-label="导入 Markdown 文件" data-zexo-md-cmd="import"><i class="fa fa-file-text-o"></i></button>' +
    '</div>';
  html += '</div>';

  // 预览开关，与 Modrinth 的 Toggle + label 结构一致
  html += '<div class="zexo_md_preview_toggle">' +
    '<input type="checkbox" class="zexo_md_switch" id="zexo_md_switch_' + ele + '" onchange="zexo_preview(\'' + ele + '\',\'' + data_name + '\')">' +
    '<label for="zexo_md_switch_' + ele + '"><span class="zexo_md_switch_track" aria-hidden="true"></span>预览</label>' +
    '</div>';
  html += '</div>';

  // 第二行：textarea + 预览容器 + OwO 表情面板
  html += '<textarea class="zexo_md_textarea" id="text_' + ele + '"></textarea>' +
    '<div class="zexo_pre_div markdown-body" id="div_' + ele + '" style="display:none"></div>' +
    '<div class="OwO"></div>';

  // 底部：Markdown 语法说明 + 字数统计（对应 Modrinth 的 info-blurb / max-length）
  html += '<div class="zexo_md_info_blurb">' +
    '<div class="zexo_md_info">' +
    '<i class="fa fa-info-circle" aria-hidden="true"></i>' +
    '<span>支持 <a class="zexo_md_resource_link" href="https://support.modrinth.com/en/articles/8801962-advanced-markdown-formatting" target="_blank" rel="noopener">Markdown 语法</a>：加粗、列表、表格、代码块、剧透、YouTube 内嵌等。</span>' +
    '</div>' +
    '<div class="zexo_md_max_length">字数：<span class="zexo_md_length">0</span></div>' +
    '</div>';

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
  // 非浏览器环境（如单元测试）没有 DOMParser，此时只做最基本的转义
  if (typeof DOMParser !== 'function') {
    return String(html == null ? '' : html)
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '');
  }
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

/** 把预览里的 <img> 补上懒加载 / 空 alt，参考 Modrinth 的图片处理策略 */
function zexoMdUpgradeImages(html) {
  if (typeof DOMParser !== 'function') { return html; }
  try {
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
  } catch (e) {
    return html;
  }
}

/** 渲染 Markdown → 消毒后的 HTML */
function zexoRenderMarkdown(markdown) {
  var raw = '';
  var text = markdown == null ? '' : String(markdown);
  if (typeof marked === 'function') {
    try {
      raw = marked(text);
    } catch (e) {
      raw = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/\n/g, '<br>');
    }
  } else {
    // 极端兜底：marked 没加载时至少保证换行
    raw = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/\n/g, '<br>');
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
 * 5.5 按钮弹窗交互（对应 Modrinth 的 link / image / video 模态）
 * ========================================================================= */

/** 预览注入：用与预览同一套渲染管线显示即将插入的片段 */
function zexoMdModalPreview(markdown) {
  var html = zexoRenderMarkdown(markdown || '');
  return '<div class="zexo_md_modal_preview markdown-body">' +
    (html || '<span class="zexo_md_modal_empty">（暂无预览）</span>') + '</div>';
}

/** 转义后放进 swal 的 html，避免用户输入被当成标签解析 */
function zexoMdEscapeHtml(str) {
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/** 统一的输入对话框：返回 Promise<值|null> */
function zexoMdPrompt(opts) {
  if (typeof swal !== 'function') {
    var v = window.prompt(opts.title);
    return Promise.resolve(v === null ? null : String(v).trim());
  }
  var html = '';
  for (var i = 0; i < (opts.fields || []).length; i++) {
    var f = opts.fields[i];
    html += '<div class="zexo_md_modal_field">' +
      '<label for="' + f.id + '">' + f.label + (f.required ? '<span class="zexo_md_modal_req">*</span>' : '') + '</label>' +
      '<input id="' + f.id + '" class="zexo_md_modal_input" type="text" value="' + zexoMdEscapeHtml(f.value || '') + '"' +
      (f.placeholder ? ' placeholder="' + zexoMdEscapeHtml(f.placeholder) + '"' : '') + '>' +
      '</div>';
  }
  html += '<div class="zexo_md_modal_hint">' + (opts.hint || '') + '</div>';
  if (opts.preview) { html += zexoMdModalPreview(opts.preview); }
  if (opts.extra) { html += opts.extra; }

  return swal({
    title: opts.title,
    text: opts.text,
    html: html,
    icon: opts.icon || 'info',
    buttons: ['取消', opts.confirmText || '插入']
  }).then(function (ok) {
    if (!ok) { return null; }
    var out = {};
    for (var j = 0; j < (opts.fields || []).length; j++) {
      var el = document.getElementById(opts.fields[j].id);
      out[opts.fields[j].id] = el ? el.value.trim() : '';
    }
    return out;
  });
}

/**
 * 插入链接 —— 对应 Modrinth 的 link 模态：
 * 预填当前选中文字作为文案，URL 经 cleanUrl() 校验，失败时提示原因。
 */
function zexoMdOpenLinkModal(editor) {
  var el = editor.textarea;
  var selected = el.value.slice(el.selectionStart, el.selectionEnd);
  zexoMdPrompt({
    title: '插入链接',
    text: '链接文案留空时自动使用 URL 作为文案。',
    confirmText: '插入',
    fields: [
      { id: 'zexo_md_link_label', label: '链接文案', value: selected, placeholder: '例如：我的博客' },
      { id: 'zexo_md_link_url', label: '链接地址 (URL)', required: true, placeholder: 'https://...' }
    ],
    hint: '仅支持 http / https；http 会自动升级为 https。'
  }).then(function (res) {
    if (!res) { return; }
    var url = res.zexo_md_link_url;
    if (!url) { sweetAlert('糟糕', '链接地址不能为空', 'error'); return; }
    try {
      url = zexoMdCleanUrl(url);
    } catch (e) {
      sweetAlert('链接不可用', e.message, 'error');
      return;
    }
    zexoMdInsertLink(el, url, res.zexo_md_link_label);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.focus();
  });
}

/** 上传图片（走 Zexo 后端图床）—— 成功后把 URL 回填到弹窗里 */
function zexoMdPickImage(editor, onDone) {
  var input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/png,image/jpeg,image/gif,image/webp,image/svg+xml';
  input.style.display = 'none';
  document.body.appendChild(input);
  input.onchange = function () {
    var file = input.files && input.files[0];
    document.body.removeChild(input);
    if (!file || typeof editor.options.onFilePaste !== 'function') {
      if (file) { sweetAlert('糟糕', '当前页面没有配置图片上传处理器', 'error'); }
      return;
    }
    // 借道已有的上传流程：成功后 onFilePaste 会插入 Markdown，
    // 这里通过临时拦截把 URL 交给弹窗回调。
    var prev = editor.options.onFilePaste;
    editor.options.onFilePaste = function () { /* 弹窗模式下不直接插入 */ };
    zexoMdPickImageUpload(editor, file, prev, onDone);
  };
  input.click();
}

/** 复用 zexo_uploadimage 的上传接口，但把结果交给回调而不是直接插入 */
function zexoMdPickImageUpload(editor, file, restoreUpload, onDone) {
  var f_name = file.name.substring(file.name.lastIndexOf('.') + 1);
  var reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = function () {
    var base64 = this.result.substring(this.result.indexOf(',') + 1);
    if (typeof ajaxObject !== 'function') {
      // 没有后端上传接口时退回本地预览地址
      if (typeof sweetAlert === 'function') { sweetAlert('糟糕', '当前页面没有可用的上传接口', 'error'); }
      editor.options.onFilePaste = restoreUpload;
      return;
    }
    if (typeof swal === 'function') {
      swal({ title: '\n上传中...', icon: 'https://cdn.jsdelivr.net/gh/HexoPlusPlus/CDN@db63c79/loading.gif', text: '\n', button: false, closeModal: false });
    }
    var ajax = ajaxObject();
    ajax.open('post', '/zexo/admin/api/addimage/' + f_name, true);
    ajax.setRequestHeader('Content-Type', 'text/plain');
    ajax.onreadystatechange = function () {
      if (ajax.readyState !== 4) { return; }
      if (typeof swal === 'function') { swal.close(); }
      editor.options.onFilePaste = restoreUpload;
      if (ajax.status === 200 || ajax.status === 201) { onDone(ajax.responseText); }
      else if (typeof sweetAlert === 'function') { sweetAlert('糟糕', '上传图片失败!', 'error'); }
    };
    ajax.send(base64);
  };
}

/**
 * 插入图片 —— 对应 Modrinth 的 image 模态：
 * 描述（alt）为必填，支持「上传」与「外链」两种来源。
 */
function zexoMdOpenImageModal(editor) {
  var el = editor.textarea;
  var selected = el.value.slice(el.selectionStart, el.selectionEnd);
  var canUpload = typeof editor.options.onFilePaste === 'function';

  var uploadRow = canUpload
    ? '<div class="zexo_md_modal_field"><label>图片文件</label>' +
      '<button type="button" class="zexo_md_modal_upload" id="zexo_md_image_pick"><i class="fa fa-upload"></i> 选择本地图片上传到图床</button>' +
      '<div class="zexo_md_modal_picked" id="zexo_md_image_picked"></div></div>'
    : '';

  zexoMdPrompt({
    title: '插入图片',
    text: '描述（alt）会作为图片的替代文本，请尽量写清楚。',
    confirmText: '插入',
    extra: uploadRow,
    fields: [
      { id: 'zexo_md_image_alt', label: '描述 (alt)', required: true, value: selected, placeholder: '描述这张图片...' },
      { id: 'zexo_md_image_url', label: '图片地址 (URL)', required: true, placeholder: 'https://...' }
    ],
    hint: '可以直接填外链，也可以点上面的按钮上传到 Zexo 图床后自动填入。'
  }).then(function (res) {
    if (!res) { return; }
    var url = res.zexo_md_image_url;
    var alt = res.zexo_md_image_alt;
    if (!url) { sweetAlert('糟糕', '图片地址不能为空，可先上传再插入', 'error'); return; }
    if (!alt) { sweetAlert('糟糕', '描述 (alt) 不能为空', 'error'); return; }
    try {
      url = zexoMdCleanUrl(url);
    } catch (e) {
      sweetAlert('图片地址不可用', e.message, 'error');
      return;
    }
    zexoMdInsertImage(el, url, alt);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.focus();
  });

  // 弹窗内部的上传按钮（swal 渲染完成后再绑定）
  if (canUpload) {
    var bindTimer = setInterval(function () {
      var pick = document.getElementById('zexo_md_image_pick');
      if (!pick) { return; }
      clearInterval(bindTimer);
      pick.onclick = function () {
        zexoMdPickImage(editor, function (url) {
          var urlInput = document.getElementById('zexo_md_image_url');
          var picked = document.getElementById('zexo_md_image_picked');
          if (urlInput) { urlInput.value = url; }
          if (picked) { picked.innerHTML = '已上传：<a href="' + url + '" target="_blank" rel="noopener">' + url + '</a>'; }
        });
      };
    }, 120);
    setTimeout(function () { clearInterval(bindTimer); }, 15000);
  }
}

/**
 * 插入 YouTube 视频 —— 对应 Modrinth 的 video 模态：
 * URL 必须匹配 youtubeRegex，否则提示格式错误。
 */
function zexoMdOpenVideoModal(editor) {
  var el = editor.textarea;
  zexoMdPrompt({
    title: '插入 YouTube 视频',
    text: '粘贴 YouTube 视频链接，将以内嵌播放器插入。',
    confirmText: '插入',
    fields: [
      { id: 'zexo_md_video_url', label: 'YouTube 视频链接', required: true, placeholder: 'https://www.youtube.com/watch?v=...' }
    ],
    hint: '支持 youtu.be / youtube.com/watch / youtube.com/embed 三种链接形式。'
  }).then(function (res) {
    if (!res) { return; }
    var url = res.zexo_md_video_url;
    var id = zexoMdParseYoutube(url);
    if (!id) { sweetAlert('链接格式不对', '请填写有效的 YouTube 视频链接', 'error'); return; }
    zexoMdInsertYoutube(el, id);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.focus();
  });
}

/**
 * 导入本地 Markdown 文件 —— 编辑器自带的通用实现
 * （index.js 生成的隐藏 #upload_md 只在书写页存在，说说页靠这里兜底）
 */
function zexoMdImportFile(editor) {
  var input = document.createElement('input');
  input.type = 'file';
  input.accept = '.md,.markdown,.txt,text/markdown,text/plain';
  input.style.display = 'none';
  document.body.appendChild(input);
  input.onchange = function () {
    var file = input.files && input.files[0];
    document.body.removeChild(input);
    if (!file) { return; }
    var reader = new FileReader();
    reader.onload = function () {
      editor.textarea.value = String(this.result);
      editor.textarea.dispatchEvent(new Event('input', { bubbles: true }));
      editor.textarea.focus();
      if (typeof notyf !== 'undefined' || typeof Notyf === 'function') {
        try { new Notyf().success('已导入 ' + file.name); } catch (e) { /* 忽略提示失败 */ }
      }
    };
    reader.readAsText(file, 'UTF-8');
  };
  input.click();
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

  // 工具栏 / 文本域 / 预览区 / 字数统计全部由 zexoMdToolbarHtml 生成
  mount.innerHTML = zexoMdToolbarHtml(ele, data_name);

  var textarea = document.getElementById('text_' + ele);
  var preview = document.getElementById('div_' + ele);
  var toolbar = mount.querySelector('.zexo_md_toolbar');
  var lengthLabel = mount.querySelector('.zexo_md_length');

  // 恢复本地备份（没有备份时保持空字符串，避免出现字面量 "null"）
  var backup = localStorage.getItem('zexo_' + data_name + '_backup');
  textarea.value = backup === null ? '' : backup;

  /* ---- 3.0 字数统计（对应 Modrinth 的 max-length 信息条） ---- */
  function refreshLength() {
    if (!lengthLabel) { return; }
    lengthLabel.textContent = String(textarea.value.length);
  }
  refreshLength();
  textarea.addEventListener('input', refreshLength);
  textarea.addEventListener('change', refreshLength);

  /* ---- 3.1 工具栏点击：命令按钮 + 弹窗按钮 ---- */
  if (toolbar) {
    toolbar.addEventListener('click', function (evt) {
      var target = evt.target;
      while (target && target !== toolbar && !target.getAttribute('data-zexo-md-cmd')) {
        target = target.parentNode;
      }
      if (!target || target === toolbar) { return; }
      var cmd = target.getAttribute('data-zexo-md-cmd');
      evt.preventDefault();

      var interaction = ZEXO_MD_INTERACTIONS[cmd];
      if (typeof interaction === 'function') {
        interaction(instance);
        return;
      }
      var fn = ZEXO_MD_COMMANDS[cmd];
      if (typeof fn === 'function') {
        fn(textarea);
        refreshLength();
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
    mount: mount,
    options: options,
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
      var toggleBox = mount.querySelector('.zexo_md_switch');
      if (toggleBox) { toggleBox.checked = showing; }
      var infoBlurb = mount.querySelector('.zexo_md_info_blurb');
      if (infoBlurb) { infoBlurb.style.display = showing ? 'none' : 'flex'; }
      if (showing) { instance.render(); }
      return showing;
    },
    /** 追加内容到末尾，供 OwO 等外部调用 */
    append: function (text) {
      textarea.value += text;
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
      refreshLength();
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
window.zexoMdOpenLinkModal = zexoMdOpenLinkModal;
window.zexoMdOpenImageModal = zexoMdOpenImageModal;
window.zexoMdOpenVideoModal = zexoMdOpenVideoModal;
window.zexoMdPickImage = zexoMdPickImage;
window.ZEXO_MD_COMMANDS = ZEXO_MD_COMMANDS;
window.ZEXO_MD_INTERACTIONS = ZEXO_MD_INTERACTIONS;

/** 从 URL 渲染预览的通用包装（给 index.js 的独立渲染场景留口子） */
function zexoRenderMarkdownWithVideo(html) {
  return zexoMdUpgradeYoutubeEmbeds(html);
}
window.zexoRenderMarkdownWithVideo = zexoRenderMarkdownWithVideo;
