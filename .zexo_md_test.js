// Zexo Markdown 核心逻辑的行为测试（在 Node 中用最小 DOM 桩执行 md_editor.js）
// 注意：md_editor.js 的 zexoMdSetValue 依赖真实 <textarea> 的 setSelectionRange 语义
// （传 0 也必须生效），所以这里的桩必须如实模型化 selectionStart/End。
const fs = require('fs')
const vm = require('vm')

global.window = global
global.localStorage = { getItem: () => null, setItem: () => {} }
global.document = { getElementById: () => null, querySelector: () => null, addEventListener: () => {} }
// 浏览器里由页面提供 marked；测试里给一个极简替身，只验证渲染管线本身
global.marked = function (src) {
  return String(src == null ? '' : src).replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">')
}

const src = fs.readFileSync('E:/Documents/GitHub/Zexo/src/md_editor.js', 'utf8')
vm.runInThisContext(src, { filename: 'md_editor.js' })

/** 忠实模型化 <textarea> 的选区语义 */
function ta (value, start, end) {
  const el = {
    _v: String(value),
    selectionStart: start === undefined ? 0 : start,
    selectionEnd: end === undefined ? (start === undefined ? 0 : start) : end,
    get value () { return this._v },
    set value (v) { this._v = String(v) },
    setSelectionRange (s, e) {
      this.selectionStart = s
      this.selectionEnd = e === undefined ? s : e
    },
    focus () {},
    dispatchEvent () {},
    addEventListener () {}
  }
  return el
}

let pass = 0
let fail = 0
function eq (label, actual, expected) {
  if (actual === expected) { pass++; console.log('  ok   ' + label) } else { fail++; console.log('  FAIL ' + label + '\n       got: ' + JSON.stringify(actual) + '\n       want: ' + JSON.stringify(expected)) }
}
function sel (el) { return el.selectionStart + ',' + el.selectionEnd }

console.log('-- toggleAround / 加粗 --')
let e = ta('hello', 0, 5)
zexoMdToggleBold(e)
eq('包裹选中文本', e.value, '**hello**')
eq('选区保持在标记内部', sel(e), '2,7')

e = ta('**hello**', 2, 7)
zexoMdToggleBold(e)
eq('去掉选区内侧标记', e.value, 'hello')
eq('选区跟随', sel(e), '0,5')

e = ta('a **b** c', 4, 5)
zexoMdToggleBold(e)
eq('去掉选区外侧标记', e.value, 'a b c')
eq('选区平移', sel(e), '2,3')

e = ta('', 0, 0)
zexoMdToggleItalic(e)
eq('空选区插入斜体标记', e.value, '__')

console.log('-- toggleLineStart / 标题 --')
e = ta('title', 0, 0)
zexoMdToggleHeader(e)
eq('行首加 # ', e.value, '# title')
eq('光标右移', e.selectionStart, 2)

e = ta('# title', 3, 3)
zexoMdToggleHeader(e)
eq('行首去 # ', e.value, 'title')
eq('去标记后光标', e.selectionStart, 1)

e = ta('a\nb', 0, 3)
zexoMdToggleBulletList(e)
eq('多行逐行加列表符', e.value, '- a\n- b')

e = ta('- a\n- b', 0, 7)
zexoMdToggleBulletList(e)
eq('多行逐行去掉列表符', e.value, 'a\nb')

console.log('-- 代码块 / 折叠 --')
e = ta('code', 0, 4)
zexoMdToggleCodeBlock(e)
eq('围栏代码块', e.value, '\n```\ncode\n```\n')

e = ta('secret', 0, 6)
zexoMdToggleSpoiler(e)
eq('剧透折叠', e.value, '\n<details>\n<summary>Spoiler</summary>\n\nsecret\n\n</details>\n\n')

console.log('-- 插入链接 / 图片 / 视频 --')
e = ta('modrinth', 0, 8)
zexoMdInsertLink(e, 'https://modrinth.com', null)
eq('链接使用选中文字', e.value, '[modrinth](https://modrinth.com)')

e = ta('', 0, 0)
zexoMdInsertImage(e, 'https://x/y.png', 'alt')
eq('插入图片', e.value, '![alt](https://x/y.png)')

e = ta('abc', 1, 1)
zexoMdInsertImage(e, 'https://x/y.png', 'alt')
eq('图片插在光标处', e.value, 'a![alt](https://x/y.png)bc')

e = ta('', 0, 0)
zexoMdInsertYoutube(e, 'dQw4w9WgXcQ')
eq('插入 YouTube 内嵌', e.value.includes('youtube-nocookie.com/embed/dQw4w9WgXcQ'), true)

console.log('-- incrementMark --')
eq('1. -> 2.', zexoMdIncrementMark('1.'), '2.')
eq('9. -> 10.', zexoMdIncrementMark('9.'), '10.')
eq('- 原样', zexoMdIncrementMark('-'), '-')

console.log('-- Enter 续行 --')
e = ta('- item', 6, 6)
zexoMdInsertNewlineContinueMark(e)
eq('无序列表续行', e.value, '- item\n- ')

e = ta('1. item', 7, 7)
zexoMdInsertNewlineContinueMark(e)
eq('有序列表递增', e.value, '1. item\n2. ')

e = ta('> quote', 7, 7)
zexoMdInsertNewlineContinueMark(e)
eq('引用续行', e.value, '> quote\n> ')

e = ta('- item\n- ', 9, 9)
zexoMdInsertNewlineContinueMark(e)
eq('空列表项回车退出列表', e.value, '- item\n\n')

e = ta('  - nested', 11, 11)
zexoMdInsertNewlineContinueMark(e)
eq('嵌套列表保留缩进', e.value, '  - nested\n  - ')

e = ta('plain', 5, 5)
eq('普通行不拦截', zexoMdInsertNewlineContinueMark(e), false)

e = ta('```\ncode', 8, 8)
eq('代码块内不拦截', zexoMdInsertNewlineContinueMark(e), false)

console.log('-- Backspace 删标记 --')
e = ta('- item', 2, 2)
eq('删除列表符', zexoMdDeleteMarkupBackward(e), true)
eq('结果', e.value, 'item')

e = ta('> quote', 2, 2)
zexoMdDeleteMarkupBackward(e)
eq('删除引用符', e.value, 'quote')

e = ta('## title', 3, 3)
zexoMdDeleteMarkupBackward(e)
eq('删除标题符', e.value, 'title')

// 光标在左标记之后（**|bold**）：一次退格删掉整对标记
e = ta('**bold**', 2, 2)
zexoMdDeleteMarkupBackward(e)
eq('删掉整对加粗标记', e.value, 'bold')
eq('光标落到文本开头', e.selectionStart, 0)

e = ta('~~gone~~', 2, 2)
zexoMdDeleteMarkupBackward(e)
eq('删掉整对删除线标记', e.value, 'gone')

e = ta('_x_', 1, 1)
zexoMdDeleteMarkupBackward(e)
eq('删掉整对斜体标记', e.value, 'x')

// 该行没有配对的右标记时不能吞字符
e = ta('**bold', 2, 2)
eq('没有配对右标记时不吞', zexoMdDeleteMarkupBackward(e), false)

// 正文中间退格只删一个字符，交还浏览器
e = ta('a**b**c', 3, 3)
eq('正文中间退格不吞标记', zexoMdDeleteMarkupBackward(e), false)

// 光标位于正文中间时退格只删一个字符，交还浏览器
e = ta('**bold**', 6, 6)
eq('正文中间退格不吞标记', zexoMdDeleteMarkupBackward(e), false)

e = ta('hello', 3, 3)
eq('普通退格交还浏览器', zexoMdDeleteMarkupBackward(e), false)

console.log('-- Tab 缩进 --')
e = ta('a', 1, 1)
zexoMdIndent(e, false)
eq('缩进', e.value, '  a')
zexoMdIndent(e, true)
eq('反缩进', e.value, 'a')

console.log('-- cleanUrl --')
eq('http 升级为 https', zexoMdCleanUrl('http://a.com/x'), 'https://a.com/x')
eq('https 原样', zexoMdCleanUrl('https://a.com'), 'https://a.com/')
let threw = false
try { zexoMdCleanUrl('javascript:alert(1)') } catch (err) { threw = true }
eq('拒绝 javascript:', threw, true)
threw = false
try { zexoMdCleanUrl('https://cdn.discordapp.com/a.png') } catch (err) { threw = true }
eq('拒绝 discord cdn', threw, true)
threw = false
try { zexoMdCleanUrl('not a url') } catch (err) { threw = true }
eq('拒绝非法 URL', threw, true)

console.log('-- YouTube 解析 --')
eq('youtu.be', zexoMdParseYoutube('https://youtu.be/dQw4w9WgXcQ'), 'dQw4w9WgXcQ')
eq('watch?v=', zexoMdParseYoutube('https://www.youtube.com/watch?v=dQw4w9WgXcQ'), 'dQw4w9WgXcQ')
eq('非视频返回 null', zexoMdParseYoutube('https://example.com/x'), null)

console.log('-- 工具栏 / 命令表接线 --')
eq('命令表含全部命令', Object.keys(ZEXO_MD_COMMANDS).sort().join(','), 'bold,bullet,code,h1,h2,h3,h4,h5,h6,italic,ordered,quote,spoiler,strikethrough')
eq('交互表含 5 个弹窗/工具按钮', Object.keys(ZEXO_MD_INTERACTIONS).sort().join(','), 'emoji,image,import,link,video')
eq('交互表 5 项都是函数', Object.keys(ZEXO_MD_INTERACTIONS).every(k => typeof ZEXO_MD_INTERACTIONS[k] === 'function'), true)

const html = zexoMdToolbarHtml('zexo_doc_editor', 'zexo_docs')
// 与 Modrinth 一致：工具栏只露出 H1–H3，H4–H6 仍保留命令供后续扩展
eq('工具栏露出 H1–H3', ['h1', 'h2', 'h3'].every(k => html.indexOf('data-zexo-md-cmd="' + k + '"') !== -1), true)
eq('工具栏不再露出 H4–H6', ['h4', 'h5', 'h6'].every(k => html.indexOf('data-zexo-md-cmd="' + k + '"') === -1), true)
eq('工具栏露出样式按钮', ['bold', 'italic', 'strikethrough', 'code', 'spoiler'].every(k => html.indexOf('data-zexo-md-cmd="' + k + '"') !== -1), true)
eq('工具栏露出列表按钮', ['bullet', 'ordered', 'quote'].every(k => html.indexOf('data-zexo-md-cmd="' + k + '"') !== -1), true)
eq('工具栏露出组件按钮（链接/图片/视频/表情）', ['link', 'image', 'video', 'emoji'].every(k => html.indexOf('data-zexo-md-cmd="' + k + '"') !== -1), true)
eq('工具栏露出导入按钮', html.indexOf('data-zexo-md-cmd="import"') !== -1, true)
eq('工具栏有分组容器', (html.match(/class="zexo_md_group"/g) || []).length, 5)
eq('工具栏有分隔条', html.indexOf('zexo_md_divider') !== -1, true)
eq('工具栏保留自动备份按钮', html.indexOf('zexo_start_or_stop_backup()') !== -1, true)
eq('不再依赖页面 #input（图片按钮改为自带上传）', html.indexOf("$('#input')") === -1, true)
eq('预览改为开关（含 checkbox）', html.indexOf('zexo_md_switch_zexo_doc_editor') !== -1 && html.indexOf('onchange="zexo_preview(\'zexo_doc_editor\',\'zexo_docs\')"') !== -1, true)
eq('预览开关有 label', html.indexOf('<label for="zexo_md_switch_zexo_doc_editor">') !== -1, true)
eq('渲染 textarea', html.indexOf('id="text_zexo_doc_editor"') !== -1, true)
eq('渲染预览容器', html.indexOf('id="div_zexo_doc_editor"') !== -1, true)
eq('渲染 OwO 容器', html.indexOf('class="OwO"') !== -1, true)
eq('渲染字数统计', html.indexOf('zexo_md_length') !== -1, true)
eq('渲染语法说明', html.indexOf('zexo_md_info_blurb') !== -1, true)
eq('说明链接指向 Modrinth 文档', html.indexOf('8801962-advanced-markdown-formatting') !== -1, true)
// 旧的 2 倍大按钮样式已不再使用，改为紧凑图标按钮
eq('不再使用旧的大号按钮类', html.indexOf('btn-2x') === -1 && html.indexOf('fa-2x') === -1, true)

console.log('-- 弹窗/交互函数已导出到 window --')
eq('导出 openLinkModal', typeof window.zexoMdOpenLinkModal, 'function')
eq('导出 openImageModal', typeof window.zexoMdOpenImageModal, 'function')
eq('导出 openVideoModal', typeof window.zexoMdOpenVideoModal, 'function')
eq('导出 pickImage', typeof window.zexoMdPickImage, 'function')
eq('导出 interactions', typeof window.ZEXO_MD_INTERACTIONS, 'object')
eq('导出 initZexoMarkdownEditor', typeof window.initZexoMarkdownEditor, 'function')

console.log('-- HTML 转义（弹窗输入不得注入标签） --')
eq('转义尖括号', zexoMdEscapeHtml('<img src=x onerror=alert(1)>'), '&lt;img src=x onerror=alert(1)&gt;')
eq('转义引号', zexoMdEscapeHtml('"\'&'), '&quot;&#39;&amp;')
eq('弹窗预览被消毒（去掉 onerror）', zexoMdModalPreview('<img src=x onerror=alert(1)>').indexOf('onerror') === -1, true)
eq('弹窗预览含图片标签', zexoMdModalPreview('![](https://a.com/b.png)').indexOf('<img') !== -1, true)
eq('空内容有占位', zexoMdModalPreview('').indexOf('zexo_md_modal_empty') !== -1, true)

console.log('\n通过 ' + pass + ' / 失败 ' + fail)
process.exit(fail ? 1 : 0)
