//const md5=require ('md5')
//记得更新时要更新zexo_ver, package-lock.json, package.json, update.js
//开发者请将上述依赖注释去除

const zexo_CDNver = "d4051c3"
const zexo_ver = "Zexo@1.5"
const dev_mode_branch = "dist"
let zexo_logstatus = 0


function getJsonLength(jsonData) {

  var jsonLength = 0;

  for (var item in jsonData) {

    jsonLength++;

  }

  return jsonLength;
}

// KV 读取：优先读取新键（zexo_*），若不存在则回退旧版 HexoPlusPlus 键（hpp_*），
// 命中旧键时自动写回新键，保证老部署升级后数据（说说、签到时间、评论 token 等）不丢失。
async function zexo_kv_get(key) {
  let zexo_kv_val = await KVNAME.get(key)
  if (zexo_kv_val === null && key.indexOf("zexo_") == 0) {
    const zexo_old_key = "hpp_" + key.substr(5)
    zexo_kv_val = await KVNAME.get(zexo_old_key)
    if (zexo_kv_val !== null) {
      await KVNAME.put(key, zexo_kv_val)
    }
  }
  return zexo_kv_val
}

// 读取配置项：优先新键（zexo_*），回退旧版 HexoPlusPlus 键（hpp_*）；
// 同时兼容历史上 twikoo 环境 ID 的两种拼写（下划线 / 连字符）。
function zexo_config_get(config, key) {
  if (config[key] != undefined) { return config[key] }
  const zexo_key_alias = {
    "zexo_twikoo_envId": ["zexo_twikoo-envId", "hpp_twikoo_envId", "hpp_twikoo-envId"]
  }
  const zexo_aliases = zexo_key_alias[key]
  if (zexo_aliases != undefined) {
    for (const zexo_alias of zexo_aliases) {
      if (config[zexo_alias] != undefined) { return config[zexo_alias] }
    }
  }
  return config["hpp_" + key.substr(5)]
}

addEventListener("fetch", event => {
  event.respondWith(handleRequest(event.request))
})
function getCookie(request, name) {
  let result = ""
  const cookieString = request.headers.get("Cookie")
  if (cookieString) {
    const cookies = cookieString.split(";")
    cookies.forEach(cookie => {
      const cookiePair = cookie.split("=", 2)
      const cookieName = cookiePair[0].trim()
      if (cookieName === name) {
        const cookieVal = cookiePair[1]
        result = cookieVal
      }
    })
  }
  return result
}
!function (n) { "use strict"; function d(n, t) { var r = (65535 & n) + (65535 & t); return (n >> 16) + (t >> 16) + (r >> 16) << 16 | 65535 & r } function f(n, t, r, e, o, u) { return d((c = d(d(t, n), d(e, u))) << (f = o) | c >>> 32 - f, r); var c, f } function l(n, t, r, e, o, u, c) { return f(t & r | ~t & e, n, t, o, u, c) } function v(n, t, r, e, o, u, c) { return f(t & e | r & ~e, n, t, o, u, c) } function g(n, t, r, e, o, u, c) { return f(t ^ r ^ e, n, t, o, u, c) } function m(n, t, r, e, o, u, c) { return f(r ^ (t | ~e), n, t, o, u, c) } function i(n, t) { var r, e, o, u; n[t >> 5] |= 128 << t % 32, n[14 + (t + 64 >>> 9 << 4)] = t; for (var c = 1732584193, f = -271733879, i = -1732584194, a = 271733878, h = 0; h < n.length; h += 16)c = l(r = c, e = f, o = i, u = a, n[h], 7, -680876936), a = l(a, c, f, i, n[h + 1], 12, -389564586), i = l(i, a, c, f, n[h + 2], 17, 606105819), f = l(f, i, a, c, n[h + 3], 22, -1044525330), c = l(c, f, i, a, n[h + 4], 7, -176418897), a = l(a, c, f, i, n[h + 5], 12, 1200080426), i = l(i, a, c, f, n[h + 6], 17, -1473231341), f = l(f, i, a, c, n[h + 7], 22, -45705983), c = l(c, f, i, a, n[h + 8], 7, 1770035416), a = l(a, c, f, i, n[h + 9], 12, -1958414417), i = l(i, a, c, f, n[h + 10], 17, -42063), f = l(f, i, a, c, n[h + 11], 22, -1990404162), c = l(c, f, i, a, n[h + 12], 7, 1804603682), a = l(a, c, f, i, n[h + 13], 12, -40341101), i = l(i, a, c, f, n[h + 14], 17, -1502002290), c = v(c, f = l(f, i, a, c, n[h + 15], 22, 1236535329), i, a, n[h + 1], 5, -165796510), a = v(a, c, f, i, n[h + 6], 9, -1069501632), i = v(i, a, c, f, n[h + 11], 14, 643717713), f = v(f, i, a, c, n[h], 20, -373897302), c = v(c, f, i, a, n[h + 5], 5, -701558691), a = v(a, c, f, i, n[h + 10], 9, 38016083), i = v(i, a, c, f, n[h + 15], 14, -660478335), f = v(f, i, a, c, n[h + 4], 20, -405537848), c = v(c, f, i, a, n[h + 9], 5, 568446438), a = v(a, c, f, i, n[h + 14], 9, -1019803690), i = v(i, a, c, f, n[h + 3], 14, -187363961), f = v(f, i, a, c, n[h + 8], 20, 1163531501), c = v(c, f, i, a, n[h + 13], 5, -1444681467), a = v(a, c, f, i, n[h + 2], 9, -51403784), i = v(i, a, c, f, n[h + 7], 14, 1735328473), c = g(c, f = v(f, i, a, c, n[h + 12], 20, -1926607734), i, a, n[h + 5], 4, -378558), a = g(a, c, f, i, n[h + 8], 11, -2022574463), i = g(i, a, c, f, n[h + 11], 16, 1839030562), f = g(f, i, a, c, n[h + 14], 23, -35309556), c = g(c, f, i, a, n[h + 1], 4, -1530992060), a = g(a, c, f, i, n[h + 4], 11, 1272893353), i = g(i, a, c, f, n[h + 7], 16, -155497632), f = g(f, i, a, c, n[h + 10], 23, -1094730640), c = g(c, f, i, a, n[h + 13], 4, 681279174), a = g(a, c, f, i, n[h], 11, -358537222), i = g(i, a, c, f, n[h + 3], 16, -722521979), f = g(f, i, a, c, n[h + 6], 23, 76029189), c = g(c, f, i, a, n[h + 9], 4, -640364487), a = g(a, c, f, i, n[h + 12], 11, -421815835), i = g(i, a, c, f, n[h + 15], 16, 530742520), c = m(c, f = g(f, i, a, c, n[h + 2], 23, -995338651), i, a, n[h], 6, -198630844), a = m(a, c, f, i, n[h + 7], 10, 1126891415), i = m(i, a, c, f, n[h + 14], 15, -1416354905), f = m(f, i, a, c, n[h + 5], 21, -57434055), c = m(c, f, i, a, n[h + 12], 6, 1700485571), a = m(a, c, f, i, n[h + 3], 10, -1894986606), i = m(i, a, c, f, n[h + 10], 15, -1051523), f = m(f, i, a, c, n[h + 1], 21, -2054922799), c = m(c, f, i, a, n[h + 8], 6, 1873313359), a = m(a, c, f, i, n[h + 15], 10, -30611744), i = m(i, a, c, f, n[h + 6], 15, -1560198380), f = m(f, i, a, c, n[h + 13], 21, 1309151649), c = m(c, f, i, a, n[h + 4], 6, -145523070), a = m(a, c, f, i, n[h + 11], 10, -1120210379), i = m(i, a, c, f, n[h + 2], 15, 718787259), f = m(f, i, a, c, n[h + 9], 21, -343485551), c = d(c, r), f = d(f, e), i = d(i, o), a = d(a, u); return [c, f, i, a] } function a(n) { for (var t = "", r = 32 * n.length, e = 0; e < r; e += 8)t += String.fromCharCode(n[e >> 5] >>> e % 32 & 255); return t } function h(n) { var t = []; for (t[(n.length >> 2) - 1] = void 0, e = 0; e < t.length; e += 1)t[e] = 0; for (var r = 8 * n.length, e = 0; e < r; e += 8)t[e >> 5] |= (255 & n.charCodeAt(e / 8)) << e % 32; return t } function e(n) { for (var t, r = "0123456789abcdef", e = "", o = 0; o < n.length; o += 1)t = n.charCodeAt(o), e += r.charAt(t >>> 4 & 15) + r.charAt(15 & t); return e } function r(n) { return unescape(encodeURIComponent(n)) } function o(n) { return a(i(h(t = r(n)), 8 * t.length)); var t } function u(n, t) { return function (n, t) { var r, e, o = h(n), u = [], c = []; for (u[15] = c[15] = void 0, 16 < o.length && (o = i(o, 8 * n.length)), r = 0; r < 16; r += 1)u[r] = 909522486 ^ o[r], c[r] = 1549556828 ^ o[r]; return e = i(u.concat(h(t)), 512 + 8 * t.length), a(i(c.concat(e), 640)) }(r(n), r(t)) } function t(n, t, r) { return t ? r ? u(t, n) : e(u(t, n)) : r ? o(n) : e(o(n)) } "function" == typeof define && define.amd ? define(function () { return t }) : "object" == typeof module && module.exports ? module.exports = t : n.md5 = t }(this);
async function handleRequest(request) {
  try {
    const req = request
    const urlStr = req.url
    const urlObj = new URL(urlStr)
    const path = urlObj.href.substr(urlObj.origin.length)
    const domain = (urlStr.split('/'))[2]
    // 环境变量读取：优先新版 zexo_*，回退旧版 hpp_*（避免老部署升级后无法登录）
    const username = (typeof zexo_username != "undefined" ? zexo_username : (typeof hpp_username != "undefined" ? hpp_username : "")).split(",");
    const password = (typeof zexo_password != "undefined" ? zexo_password : (typeof hpp_password != "undefined" ? hpp_password : "")).split(",");
    //console.log(zexo_logstatus)
    for (var i = 0; i < getJsonLength(username); i++) {
      if (getCookie(request, "password") == md5(password[i]) && getCookie(request, "username") == md5(username[i])) {
        zexo_logstatus = 1
      }
    }

    if (path.startsWith('/zexo/admin')) {
      if (zexo_logstatus == 1) {
        const zexo_config = await zexo_kv_get("zexo_config");
        if (zexo_config === null) {
          if (path == '/zexo/admin/api/upconfig') {
            const config_r = JSON.stringify(await request.text())
            await KVNAME.put("zexo_config", config_r)
            return new Response("OK")
          } else {

            let zexo_installhtml = `<!doctype html>
<html lang="zh">
<head>
	<meta charset="UTF-8">
	<meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1"> 
	<meta content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0" name="viewport" />
	<title>${zexo_ver}安装</title>
	<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/Zarijaden/Zexo/src/install.css">
	<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/Zarijaden/Zexo/src/zexo_theme.css">
</head>
<body>
		<div class="cont_principal">
			
		  <div class="cont_join  ">
		    <div class="cont_letras">
		      <p>Zexo</p>
		      <p>Zexo</p>
		      <p>Zexo</p>
		    </div>

		    <div class="cont_form_join" style="overflow-x: auto;">
		      <h2>安装信息</h2>
			  <h3 style="color:#fff">基本信息</h3>
		      <p>域名:</p>    
		      <input type="text" class="input_text" id="zexo_domain" placeholder="xxx.xxx.com"/>
		      <p>头像地址:</p>    
		      <input type="text" class="input_text" id="zexo_userimage" placeholder="https://cdn.jsdelivr.net/gh/ChenYFan/CDN/img/avatar.png"/>
		      <p>标题:</p>    
		      <input type="text" class="input_text" id="zexo_title" placeholder="XXX的后台"/>
		      <p>icon地址:</p>    
		      <input type="text" class="input_text" id="zexo_usericon" placeholder="https://cdn.jsdelivr.net/gh/ChenYFan/chenyfan.github.io/favicon.ico"/>
		      <p>跨域请求:</p>    
			  <input type="text" class="input_text" id="zexo_cors" placeholder="*"/>
			  <h3 style="color:#fff">面板配置</h3>
			  <p>OwOJSON地址:</p>    
              <input type="text" class="input_text" id="zexo_OwO" placeholder="https://cdn.jsdelivr.net/gh/ChenYFan/CDN@ca3ea6c/assets/list.json" />
			  <p>面板背景图片:</p>    
              <input type="text" class="input_text" id="zexo_back" placeholder="不填则使用纯色背景（不加载外部图片）" />
			  <p>懒加载图片:</p>    
              <input type="text" class="input_text" id="zexo_lazy_img" placeholder="https://cdn.jsdelivr.net/gh/ChenYFan/blog@master/themes/fluid/source/img/loading.gif" />
			  <p>高亮样式:</p>    
              <input type="text" class="input_text" id="zexo_highlight_style" placeholder="github" />
			  
			  <p>面板选项卡颜色:</p>    
              <input type="text" class="input_text" id="zexo_color" placeholder="azure" />
			  <p>面板选项框颜色:</p>    
              <input type="text" class="input_text" id="zexo_bg_color" placeholder="black" />
			  <p>面板主题色:</p>    
              <input type="text" class="input_text" id="zexo_theme_mode" placeholder="light" />
			  
			  <p>列表限制数量:</p>    
              <input type="text" class="input_text" id="zexo_page_limit" placeholder="10" />
			  
			  <h3 style="color:#fff">Github信息</h3>
		      <p>Github文档仓库Token:</p>    
		      <input type="text" class="input_text" id="zexo_githubdoctoken" placeholder="*********"/>
			  <p>Github图片仓库Token:</p>    
		      <input type="text" class="input_text" id="zexo_githubimagetoken" placeholder="*********"/>
			  <p>Github文档仓库用户名:</p>    
		      <input type="text" class="input_text" id="zexo_githubdocusername" placeholder="XXX" />
			  <p>Github图片仓库用户名:</p>    
		      <input type="text" class="input_text" id="zexo_githubimageusername" placeholder="XXX" />
			  <p>Github文档仓库名:</p>    
		      <input type="text" class="input_text" id="zexo_githubdocrepo" placeholder="blog" />
			  <p>Github图片仓库名:</p>    
		      <input type="text" class="input_text" id="zexo_githubimagerepo" placeholder="image" />
			  <p>Github文档仓库根目录:</p>    
		      <input type="text" class="input_text" id="zexo_githubdocroot" placeholder="/" />
			  <p>Github图片仓库路径:</p>    
		      <input type="text" class="input_text" id="zexo_githubimagepath" placeholder="/" />
			  <p>Github文档仓库分支:</p>    
		      <input type="text" class="input_text" id="zexo_githubdocbranch" placeholder="master" />
			  <p>Github图片仓库分支:</p>    
		      <input type="text" class="input_text" id="zexo_githubimagebranch" placeholder="main" />
			  <h3 style="color:#fff">附加功能</h3>
			  <p>是否自动签到【是为True，否为False】:</p>    
		      <input type="text" class="input_text" id="zexo_autodate" placeholder="False" />
              <h3 style="color:#fff">CloudFlare访问功能</h3>
			  <p>Global API Key:</p>    
		      <input type="text" class="input_text" id="zexo_CF_Auth_Key" placeholder="***" />
              <p>目标Workers名称:</p>    
		      <input type="text" class="input_text" id="zexo_script_name" placeholder="Zexo" />
              <p>Workers账户ID:</p>    
		      <input type="text" class="input_text" id="zexo_account_identifier" placeholder="***" />
              <p>账户登录邮箱:</p>    
		      <input type="text" class="input_text" id="zexo_Auth_Email" placeholder="ABC@DEF.com" />
              <p>Pages 部署钩子 (Deploy Hook) URL:</p> 
        <input type="text" class="input_text" id="zexo_deploy_hook_url" placeholder="https://api.cloudflare.com/.../deploy_hooks/..."/>
              
              <h3 style="color:#fff">Twikoo加强</h3>
              <p>Twikoo环境ID:</p>    
              <input type="text" class="input_text" id="zexo_twikoo_envId" placeholder="xxx" />
			  
		    </div>
		  
		    <div class="cont_join_form_finish" style="display:none">
		      <h2>完成</h2>  
		    </div>

		    <div class="cont_btn_join">
		      <a href="#" onclick='start()' id="butttt">开始配置</a>
		    </div>
		  </div>
		</div>
	</div>
	
	<script src="https://cdn.jsdelivr.net/gh/Zarijaden/Zexo/src/install.js"></script>
</body>
</html>`
            return new Response(zexo_installhtml, {
              headers: { "content-type": "text/html;charset=UTF-8" }
            })
          }
        } else {

          let config = JSON.parse(JSON.parse(zexo_config))
          // 兼容旧版 HexoPlusPlus 配置：hpp_* 键自动迁移为 zexo_* 并写回 KV
          if (config["zexo_domain"] == undefined) {
            let zexo_config_migrated = false
            let zexo_config_new = {}
            for (const zexo_config_key in config) {
              const zexo_config_newkey = zexo_config_key.indexOf("hpp_") == 0 ? "zexo_" + zexo_config_key.substr(4) : zexo_config_key
              if (zexo_config_newkey != zexo_config_key) { zexo_config_migrated = true }
              zexo_config_new[zexo_config_newkey] = config[zexo_config_key]
            }
            if (zexo_config_migrated) {
              config = zexo_config_new
              await KVNAME.put("zexo_config", JSON.stringify(JSON.stringify(config)))
            }
          }
          const zexo_domain = config["zexo_domain"]
          const zexo_userimage = config["zexo_userimage"]
          const zexo_title = config["zexo_title"]
          const zexo_usericon = config["zexo_usericon"]
          const zexo_cors = config["zexo_cors"]
          const zexo_githubdoctoken = config["zexo_githubdoctoken"]
          const zexo_githubimagetoken = config["zexo_githubimagetoken"]
          const zexo_githubdocusername = config["zexo_githubdocusername"]
          const zexo_githubdocrepo = config["zexo_githubdocrepo"]
          const zexo_githubdocroot = config["zexo_githubdocroot"]
          const zexo_githubdocbranch = config["zexo_githubdocbranch"]
          const zexo_githubimageusername = config["zexo_githubimageusername"]
          const zexo_githubimagerepo = config["zexo_githubimagerepo"]
          const zexo_githubimagepath = config["zexo_githubimagepath"]
          const zexo_githubimagebranch = config["zexo_githubimagebranch"]
          const zexo_autodate = config["zexo_autodate"]
          const zexo_account_identifier = config["zexo_account_identifier"]
          const zexo_script_name = config["zexo_script_name"]
          const zexo_CF_Auth_Key = config["zexo_CF_Auth_Key"]
          const zexo_Auth_Email = config["zexo_Auth_Email"]
          const zexo_deploy_hook_url = config["zexo_deploy_hook_url"]
          const zexo_twikoo_envId = config["zexo_twikoo_envId"] != undefined ? config["zexo_twikoo_envId"] : config["zexo_twikoo-envId"]
          const zexo_OwO = config["zexo_OwO"]
          const zexo_back = config["zexo_back"]
          const zexo_lazy_img = config["zexo_lazy_img"]
          const zexo_highlight_style = config["zexo_highlight_style"]
          const zexo_plugin_js = config["zexo_plugin_js"]
          const zexo_plugin_css = config["zexo_plugin_css"]
          const zexo_githubdocpath = zexo_githubdocroot + "source/_posts/"
          const zexo_githubdocdraftpath = zexo_githubdocroot + "source/_drafts/"
          const githubdocdraftpath = encodeURI(zexo_githubdocdraftpath)
          const githubdocpath = encodeURI(zexo_githubdocpath)
          const githubimagepath = encodeURI(zexo_githubimagepath)
		  const zexo_color=config["zexo_color"]==undefined?"rose":config["zexo_color"]
		  const zexo_bg_color=config["zexo_bg_color"]==undefined?"white":config["zexo_bg_color"]
		  const zexo_theme_mode=config["zexo_theme_mode"]=="dark"?"dark":"light"
		  const zexo_page_limit=config["zexo_page_limit"]==undefined?"10":config["zexo_page_limit"]
          if (zexo_autodate == "True") {
            const now = Date.now(new Date())
            await KVNAME.put("zexo_activetime", now)
            const zexo_kvwait = Date.now(new Date()) - now
          }
          const zexo_githubgetimageinit = {
            method: "GET",
            headers: {
              "content-type": "application/json;charset=UTF-8",
              "user-agent": zexo_ver,
              "Authorization": "token " + zexo_githubimagetoken
            },
          }
          const zexo_githubgetdocinit = {
            method: "GET",
            headers: {
              "content-type": "application/json;charset=UTF-8",
              "user-agent": zexo_ver,
              "Authorization": "token " + zexo_githubdoctoken
            },
          }
          /*主面板*/
          if (path.startsWith("/zexo/admin/dash")) {
            let zexo_home_act = ""
            let zexo_edit_act = ""
            let zexo_talk_act = ""
            let zexo_docs_man_act = ""
            let zexo_img_man_act = ""
			let zexo_tool_act = ""
            let zexo_set_act = ""
            let zexo_js = ""
            let zexo_init = `<div class="content"><div class="container-fluid"><div class="row"><div class="col-md-12"><div class="card"><div class="card-header card-header-primary"><h4 class="card-title">404</h4><p class="card-category">我们不知道您的需求</p></div></br><div class="card-body"><a href="/zexo/admin/dash/home">回到主页</a></div></div></div></div></div></div>`
            if (path == "/zexo/admin/dash/home") {
              zexo_home_act = " active"
              zexo_init = `<div class="content">
        <div class="container-fluid">
          <div class="row">
            <div class="col-lg-6 col-md-6 col-sm-6">
              <div class="card card-stats">
                <div class="card-header card-header-warning card-header-icon">
                  <div class="card-icon">
                    <i class="fa fa-file"></i>
                  </div>
                  <p class="card-category">总文档数</p>
                  <h3 class="card-title" id="document_all">NaN
                    <small>个</small>
                  </h3>
                </div>
                <div class="card-footer">
				<div class="stats">
                    <a href="/zexo/admin/dash/edit" style="color: #cf6ae0 !important"><i class="fa fa-pencil"></i>前往管理</a>
                  </div>
                </div>
              </div>
            </div>
            <div class="col-lg-6 col-md-6 col-sm-6">
              <div class="card card-stats">
                <div class="card-header card-header-success card-header-icon">
                  <div class="card-icon">
                    <i class="fa fa-image"></i>
                  </div>
                  <p class="card-category">总图片数</p>
                  <h3 class="card-title" id="img_all">NaN
                    <small>张</small>
                  </h3>
                </div>
                <div class="card-footer">
				<div class="stats">
                    <a href="/zexo/admin/dash/img_man" style="color: #cf6ae0 !important"><i class="fa fa-upload"></i>前往管理</a>
                  </div>
                </div>
              </div>
            </div>
            <div class="col-lg-6 col-md- col-sm-6">
              <a href="javascript:checkUpdate()">
              <div class="card card-stats">
                <div class="card-header card-header-info card-header-icon">
                  <div class="card-icon">
                    <i class="fa fa-upload"></i>
                  </div>
                  <p class="card-category">当前版本</p>
                  <h3 class="card-title">${zexo_ver}</h3>
                </div>
                <div class="card-footer">
                  <div class="stats">
                    <i class="material-icons">update</i>点击更新
                  </div>
                </div>
              </div>
            </a>
            </div>
            
            
			<div class="col-lg-6 col-md-6 col-sm-6">
              <a href="https://github.com/${zexo_githubdocusername}/${zexo_githubdocrepo}" target="_blank">
              <div class="card card-stats">
                <div class="card-header card-header-primary card-header-icon">
                  <div class="card-icon">
                    <i class="fa fa-github"></i>
                  </div>
                  <h3 class="card-title">Github</h3>
                </div>
                <div class="card-footer">
				博客仓库
                </div>
              </div>
            </a>
            </div>

          </div>
        </div>
      </div>`
              zexo_js = `<script src='https://cdn.jsdelivr.net/gh/Zarijaden/Zexo/src/home.js'></script>`
            }
            if (path == "/zexo/admin/dash/edit") {
              zexo_edit_act = " active"
              zexo_init = `<div class="content">
        <div class="container-fluid">
          <div class="row">
            <div class="col-md-12">
              <div class="card">
                <div class="card-header card-header-primary">
                  <h4 class="card-title">书写</h4>
                  <p class="card-category">Wrtie</p>
                </div>
              </br>
                <div class="card-body">
                          <div class="col-md-8">
                              <label class="bmd-label-floating">文件选择</label>
                              <select id="choo" class="form-control form-control-chosen" style="display: inline;"></select>
							  <button type="submit" class="btn btn-success" onclick="javascript:zexo_get_md()">获取文章</button>
							  <button type="submit" class="btn btn-normal" onclick="javascript:zexo_get_draft()">获取艹稿</button>
							  <button type="submit" class="btn btn-danger" onclick="javascript:zexo_del_index()">徒手清索引</button>
                          </div>

                        <div class="row">
                          <div class="col-md-12">
                            <div class="form-group">
                              <label>内容</label>
                              <div class="form-group" id="zexo_doc_editor">

                              </div>
                            </div>
                          </div>
                        </div>
						<button type="submit" class="btn btn-normal pull-right" onclick="javascript:zexo_upload_draft()">发布艹稿</button>
                        <button type="submit" class="btn btn-primary pull-right" onclick="javascript:zexo_upload_md()">发布文件</button>
                        <div class="clearfix"></div>
						<input type="file" name="upload" id="upload_md" style="display:none"/>
						<form id="upform" enctype='multipart/form-data' style="display:none;">
    <div class="form-group">
        <label for="upteainput">上传文件</label>
        <input type="file" id="input">
    </div>
</form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>`
              zexo_js = `<link rel='stylesheet' type='text/css' href='https://cdn.jsdelivr.net/npm/notyf/notyf.min.css' />
<script src="https://cdn.jsdelivr.net/npm/notyf/notyf.min.js"></script><script src="https://cdn.jsdelivr.net/gh/indrimuska/jquery-editable-select/dist/jquery-editable-select.min.js"></script><script src='https://cdn.jsdelivr.net/gh/Zarijaden/Zexo/src/edit.js'></script><script type="text/javascript" src="https://cdn.jsdelivr.net/npm/jquery-lazy@1.7.11/jquery.lazy.min.js"></script><script type="text/javascript" src="https://cdn.jsdelivr.net/npm/jquery-lazy@1.7.11/jquery.lazy.plugins.min.js"></script><link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/Zarijaden/Zexo/src/OwO.min.css">
<script src="https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@10.5.0/build/highlight.min.js"></script>
<link rel='stylesheet' type='text/css' href='https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@10.5.0/build/styles/${zexo_highlight_style}.min.css' />

`
            }
            if (path == "/zexo/admin/dash/talk") {
              zexo_talk_act = " active"
              zexo_init = `<div class="content">
        <div class="container-fluid">
          <div class="row">
            <div class="col-md-12">
              <div class="card">
                <div class="card-header card-header-primary">
                  <h4 class="card-title">说说</h4>
                  <p class="card-category">Talk</p>
                </div>
              </br>
                <div class="card-body">


                        <div class="row">
                          <div class="col-md-12">
                            <div class="form-group">
                              <label>书写</label>
                              <div class="form-group" id="zexo_talk_editor"></div>
                            </div>
                          </div>
                        </div>
                        <button type="submit" class="btn btn-primary pull-right" onclick="javascript:zexo_upload_md()">Upload</button>
                        <div class="clearfix"></div>
						<input type="file" name="upload" id="upload_md" style="display:none"/>
						<form id="upform" enctype='multipart/form-data' style="display:none;">
    <div class="form-group">
        <label for="upteainput">上传文件</label>
        <input type="file" id="input">
    </div>
</form><div id="zexo_talk"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>`
              zexo_js = `<link rel='stylesheet' type='text/css' href='https://cdn.jsdelivr.net/npm/notyf/notyf.min.css' /> <script src="https://cdn.jsdelivr.net/npm/notyf/notyf.min.js"></script><link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/Zarijaden/Zexo/src/talk.css" /><script src='https://cdn.jsdelivr.net/gh/Zarijaden/Zexo/src/talk.js'></script><script type="text/javascript" src="https://cdn.jsdelivr.net/npm/jquery-lazy@1.7.11/jquery.lazy.min.js"></script><script type="text/javascript" src="https://cdn.jsdelivr.net/npm/jquery-lazy@1.7.11/jquery.lazy.plugins.min.js"></script><link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/Zarijaden/Zexo/src/OwO.min.css">`
            }
            if (path == "/zexo/admin/dash/docs_man") {
              zexo_docs_man_act = " active"
              zexo_init = `
<div class="content">
        <div class="container-fluid">
          <div class="row">
            <div class="col-md-12">
              <div class="card">
                <div class="card-header card-header-primary">
                  <h4 class="card-title ">文章列表</h4>
                  <p class="card-category">这里列出了你所有文章</p>
                </div>
                <div class="card-body">
                  <div class="table-responsive">
				  <input type="text" id="search_Input" onkeyup="zexo_search()" placeholder="搜索文章...">
                    <table class="table" id="zexo_table">
                      <thead class="text-primary">
                        <th>
                          名称
                        </th>
                        <th>
                          大小
                        </th>
                        <th>发布状态</th><th></th>
                        <th></th><th></th><th></th>
                      </thead>
                      <tbody id="tbody_doc">

                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>`
              zexo_js = `<script src='https://cdn.jsdelivr.net/gh/Zarijaden/Zexo/src/doc_man.js'></script>`

            }
            if (path == "/zexo/admin/dash/img_man") {
              zexo_img_man_act = " active"
              zexo_init = `<div class="content">
        <div class="container-fluid">
          <div class="row">
            <div class="col-md-12">
              <div class="card">
                <div class="card-header card-header-primary">
                  <h4 class="card-title ">图片列表</h4>
                  <p class="card-category">这里列出了你所有图片</p>
                </div>
                <div class="card-body">
                  <div class="table-responsive">
				  <input type="text" id="search_Input" onkeyup="zexo_search()" placeholder="搜索图片...">
                    <table class="table" id="zexo_table">
                      <thead class=" text-primary">
                        <th>
                          名称
                        </th>
                        <th>
                          大小
                        </th><th>预览</th>
                        <th></th>
                        <th></th><th></th><th></th><th></th>
                      </thead>
                      <tbody id="tbody_img">

                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>`
              zexo_js = `<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/brutaldesign/swipebox/src/css/swipebox.css"><script src='https://cdn.jsdelivr.net/gh/Zarijaden/Zexo/src/img_man.js'></script><script type="text/javascript" src="https://cdn.jsdelivr.net/npm/jquery-lazy@1.7.11/jquery.lazy.min.js"></script>
<script type="text/javascript" src="https://cdn.jsdelivr.net/npm/jquery-lazy@1.7.11/jquery.lazy.plugins.min.js"></script><script src="https://cdn.jsdelivr.net/gh/brutaldesign/swipebox/src/js/jquery.swipebox.min.js"></script>`

            }
			if (path == "/zexo/admin/dash/tool") {
              zexo_tool_act = " active"
              zexo_init = `<div class="content">
              
        <div class="container-fluid">
          <div class="row">

			<div class="col-lg-6 col-md-6 col-sm-6">
              <a href="javascript:zexo_artitalk_into_zexotalk()">
              <div class="card card-stats">
                <div class="card-header card-header-primary card-header-icon">
                  <div class="card-icon">
                    <i class="fa fa-download"></i>
                  </div>
                  <h3 class="card-title">从Artitalk中导入</h3>
                </div>
                <div class="card-footer">这不是抢生意啊喂
                </div>
              </div>
            </a>
            </div>

			<div class="col-lg-6 col-md-6 col-sm-6">
              <a href="javascript:zexo_del_all()">
              <div class="card card-stats">
                <div class="card-header card-header-danger card-header-icon">
                  <div class="card-icon">
                    <i class="fa fa-close"></i>
                  </div>
                  <h3 class="card-title">销毁配置</h3>
                </div>
                <div class="card-footer">
                  <div class="stats">
                    <i class="material-icons text-danger">warning</i>高危操作，你知道会发生什么的
                  </div>
                </div>
              </div>
            </a>
            </div>

<div class="col-lg-6 col-md-6 col-sm-6">
    <a href="javascript:zexo_trigger_deploy()" id="triggerDeployBtn">
        <div class="card card-stats">
            <div class="card-header card-header-warning card-header-icon">
                <div class="card-icon">
                    <i class="fa fa-cloud-upload"></i>
                </div>
                <p class="card-category">站点部署</p>
                <!-- 主标题 -->
                <h3 class="card-title">立即触发</h3>
            </div>
            <div class="card-footer">
                <div class="stats">
                    <i class="material-icons">autorenew</i>触发 Pages 构建
                </div>
            </div>
        </div>
    </a>
</div>

          </div>
        </div>
      </div>`
              zexo_js = `<script src='https://cdn.jsdelivr.net/gh/Zarijaden/Zexo/src/tool.js'></script>`
            }
            if (path == "/zexo/admin/dash/set") {
              zexo_set_act = " active"
              zexo_init = `<div class="content">
        <div class="container-fluid">
          <div class="row">
            <div class="col-md-12">
              <div class="card">
                <div class="card-header card-header-primary">
                  <h4 class="card-title ">配置</h4>
                  <p class="card-category">请根据需要修改配置</p>
                </div>
                <div class="card-body">
                  <div class="table-responsive">
				  <input type="text" id="search_Input" onkeyup="zexo_search()" placeholder="搜索配置...">
                    <table class="table" id="zexo_table">
                      <thead class=" text-primary">
                        <th>
                          键值
                        </th>
                        <th>
                          内容
                        </th><th>操作</th>
                      </thead>
                      <tbody id="tbody_config">

                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>`
              zexo_js = `<script src='https://cdn.jsdelivr.net/gh/Zarijaden/Zexo/src/config.js'></script>`
            }
            let zexo_plugin = ""
            if (zexo_plugin_css != undefined) { zexo_plugin += `<link rel="stylesheet" type="text/css" href="${zexo_plugin_css}" />` }
            if (zexo_plugin_js != undefined) { zexo_js += `<script src="${zexo_plugin_js}"></script>` }
            let zexo_dash_head = `<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="utf-8" />
  <link rel="apple-touch-icon" sizes="76x76" href="${zexo_usericon}">
  <link rel="icon" type="image/png" href="${zexo_usericon}">
  <title>${zexo_title}</title>
  <meta content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0" name="viewport" />
  ${zexo_plugin}
  <link rel="stylesheet" type="text/css" href="https://cdn.jsdelivr.net/gh/Zarijaden/Zexo/src/font.css" />
  <link href="https://cdn.jsdelivr.net/gh/Zarijaden/Zexo/src/admin_all_${zexo_theme_mode}.css" rel="stylesheet" />
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/Zarijaden/Zexo/src/zexo_theme.css" />
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/indrimuska/jquery-editable-select/dist/jquery-editable-select.min.css">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/font-awesome@4.7.0/css/font-awesome.min.css">
  <script>
  //这个脚本的用途是前端变量传递
  const zexo_ver="${zexo_ver}";
  const zexo_OwO="${zexo_OwO}";
  const avatar="${zexo_userimage}";
  const username="${username[0]}";
  const zexo_githubdocusername = "${zexo_githubdocusername}"
  const zexo_githubdocrepo ="${zexo_githubdocrepo}"
  const zexo_githubdocbranch ="${zexo_githubdocbranch}"
  const zexo_githubdocpath ="${zexo_githubdocpath}"
  const zexo_githubimageusername = "${zexo_githubimageusername}"
  const zexo_githubimagerepo ="${zexo_githubimagerepo}"
  const zexo_githubimagebranch ="${zexo_githubimagebranch}"
  const zexo_githubimagepath ="${zexo_githubimagepath}"
  const zexo_githubdocdraftpath ="${zexo_githubdocdraftpath}"
  const zexo_lazy_img = "${zexo_lazy_img}"
  const zexo_highlight_style = "${zexo_highlight_style}"
  const zexo_page_limit = ${zexo_page_limit}
  </script>
</head>
<body class="${zexo_theme_mode=='dark'?'dark-edition':''}">
  <div class="wrapper ">
    <div class="sidebar" data-color="${zexo_color}" data-background-color="${zexo_theme_mode=='dark'?'default':zexo_bg_color}" data-image="${zexo_back}">
      <div class="logo"><a class="simple-text logo-normal">${zexo_title}</a></div>
      <div class="sidebar-wrapper">
        <ul class="nav">
          <li class="nav-item${zexo_home_act}">
            <a class="nav-link" href="/zexo/admin/dash/home">
              <i class="material-icons">dashboard</i>
              <p>主页</p>
            </a>
          </li>
          <li class="nav-item${zexo_edit_act}">
            <a class="nav-link" href="/zexo/admin/dash/edit">
              <i class="material-icons">create</i>
              <p>书写</p>
            </a>
          </li>
          <li class="nav-item${zexo_talk_act}">
            <a class="nav-link" href="/zexo/admin/dash/talk">
              <i class="material-icons">chat</i>
              <p>说说</p>
            </a>
          </li>
          <li class="nav-item${zexo_docs_man_act}">
            <a class="nav-link" href="/zexo/admin/dash/docs_man">
              <i class="material-icons">descriptionoutlined</i>
              <p>文档管理</p>
            </a>
          </li>
		  <li class="nav-item${zexo_img_man_act}">
            <a class="nav-link" href="/zexo/admin/dash/img_man">
              <i class="material-icons">imagerounded</i>
              <p>图片管理</p>
            </a>
          </li>


		  <li class="nav-item${zexo_tool_act}">
            <a class="nav-link" href="/zexo/admin/dash/tool">
              <i class="material-icons">widgets</i>
              <p>工具</p>
            </a>
          </li>
		  <li class="nav-item${zexo_set_act}">
            <a class="nav-link" href="/zexo/admin/dash/set">
              <i class="material-icons">settings</i>
              <p>设置</p>
            </a>
          </li>

      <li class="nav-item">
        <a class="nav-link" href="/">
          <i class="material-icons">logout</i>
            <p>退出</p>
            </a>
          </li>

        </ul>
      </div>
    </div>
    <div class="main-panel">
      <!-- Navbar -->
      <nav class="navbar navbar-expand-lg navbar-transparent navbar-absolute fixed-top ">
        <div class="container-fluid">
          <div class="navbar-wrapper">
            <a class="navbar-brand" href="javascript:;">Zexo后台</a>
          </div>
          <button class="navbar-toggler" type="button" data-toggle="collapse" aria-controls="navigation-index" aria-expanded="false" aria-label="Toggle navigation">
            <span class="sr-only">Toggle navigation</span>
            <span class="navbar-toggler-icon icon-bar"></span>
            <span class="navbar-toggler-icon icon-bar"></span>
            <span class="navbar-toggler-icon icon-bar"></span>
          </button>
          <div class="collapse navbar-collapse justify-content-end">
            <ul class="navbar-nav">
              <li class="nav-item dropdown">
                <a class="nav-link" href="javascript:;" id="navbarDropdownProfile" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                  <img src="${zexo_userimage}" style="width: 30px;border-radius: 50%;border: 0;">
                  <p class="d-lg-none d-md-block">
                    Account
                  </p>
                </a>
                <div class="dropdown-menu dropdown-menu-right" aria-labelledby="navbarDropdownProfile">
                  <a class="dropdown-item" href="javascript:zexo_logout()">退出</a>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </nav>
      <!-- End Navbar -->

<!--innerHTMLSTART-->`
            let zexo_dash_foot = `
					<!--innerHTMLEND-->
</div>
</div>
<script src="https://cdn.jsdelivr.net/npm/jquery@2.2.4"></script>
<script src="https://cdn.jsdelivr.net/npm/sweetalert/dist/sweetalert.min.js"></script>
<script src="https://cdn.jsdelivr.net/gh/Zarijaden/Zexo/src/admin_all.js"></script>
${zexo_js}

</body>

</html>`
            let zexo_dash = `${zexo_dash_head}${zexo_init}${zexo_dash_foot}`
            return new Response(zexo_dash, {
              headers: { "content-type": "text/html;charset=UTF-8" }
            })

          }
          if (path.startsWith("/zexo/admin/api/adddoc/")) {

            const file = await request.text()
            const filename = path.substr(("/zexo/admin/api/adddoc/").length)
            const url = `https://api.github.com/repos/${zexo_githubdocusername}/${zexo_githubdocrepo}/contents${githubdocpath}${filename}?ref=${zexo_githubdocbranch}`
            const zexo_sha = (JSON.parse(await (await fetch(url, zexo_githubgetdocinit)).text())).sha
            const zexo_body = {
              branch: zexo_githubdocbranch, message: `Upload from ${zexo_ver} By ${zexo_githubdocusername}`, content: file, sha: zexo_sha
            }
            const zexo_docputinit = {
              body: JSON.stringify(zexo_body),
              method: "PUT",
              headers: {
                "content-type": "application/json;charset=UTF-8",
                "user-agent": zexo_ver,
                "Authorization": "token " + zexo_githubdoctoken
              }
            }
            const zexo_r = await fetch(url, zexo_docputinit)
            const zexo_r_s = await zexo_r.status
            if (zexo_r_s == 200 || zexo_r_s == 201) {
              if (zexo_r_s == 201) { await KVNAME.delete("zexo_doc_list_index") }
              return new Response('Update Success', { status: zexo_r_s })
            } else {
              return new Response('Fail To Update', { status: zexo_r_s })
            }

          }
          if (path.startsWith("/zexo/admin/api/adddraft/")) {

            const file = await request.text()
            const filename = path.substr(("/zexo/admin/api/adddraft/").length)
            const url = `https://api.github.com/repos/${zexo_githubdocusername}/${zexo_githubdocrepo}/contents${githubdocdraftpath}${filename}?ref=${zexo_githubdocbranch}`
            const zexo_sha = (JSON.parse(await (await fetch(url, zexo_githubgetdocinit)).text())).sha
            const zexo_body = {
              branch: zexo_githubdocbranch, message: `Upload draft from ${zexo_ver} By ${zexo_githubdocusername}`, content: file, sha: zexo_sha
            }
            const zexo_docputinit = {
              body: JSON.stringify(zexo_body),
              method: "PUT",
              headers: {
                "content-type": "application/json;charset=UTF-8",
                "user-agent": zexo_ver,
                "Authorization": "token " + zexo_githubdoctoken
              }
            }
            const zexo_r = await fetch(url, zexo_docputinit)
            const zexo_r_s = await zexo_r.status
            if (zexo_r_s == 200 || zexo_r_s == 201) {
              if (zexo_r_s == 201) { await KVNAME.delete("zexo_doc_draft_list_index") }
              return new Response('Update Success', { status: zexo_r_s })
            } else {
              return new Response('Fail To Update', { status: zexo_r_s })
            }

          }
          if (path.startsWith("/zexo/admin/api/addimage")) {
            const file = await request.text()
            const zexo_time = Date.parse(new Date())
            const filename = path.substr(("/zexo/admin/api/addimage/").length)

            const url = `https://api.github.com/repos/${zexo_githubimageusername}/${zexo_githubimagerepo}/contents${githubimagepath}${zexo_time}.${filename}`
            const zexo_body = {
              branch: zexo_githubimagebranch, message: `Upload from ${zexo_ver} By ${zexo_githubimageusername}`, content: file
            }
            const zexo_imageputinit = {
              body: JSON.stringify(zexo_body),
              method: "PUT",
              headers: {
                "content-type": "application/json;charset=UTF-8",
                "user-agent": zexo_ver,
                "Authorization": "token " + zexo_githubimagetoken
              }
            }
            const zexo_r = await fetch(url, zexo_imageputinit)
            const zexo_r_s = await zexo_r.status
            if (zexo_r_s == 200 || zexo_r_s == 201) {
              return new Response(`https://cdn.jsdelivr.net/gh/${zexo_githubimageusername}/${zexo_githubimagerepo}@${zexo_githubimagebranch}${zexo_githubimagepath}${zexo_time}.${filename}`, { status: zexo_r_s })
            } else {
              return new Response(`Fail To Upload Image`, { status: zexo_r_s })
            }
          }
          if (path.startsWith("/zexo/admin/api/deldoc")) {

            const filename = path.substr(("/zexo/admin/api/deldoc/").length)
            const url = `https://api.github.com/repos/${zexo_githubdocusername}/${zexo_githubdocrepo}/contents${githubdocpath}${filename}?ref=${zexo_githubdocbranch}`
            const zexo_sha = (JSON.parse(await (await fetch(url, zexo_githubgetdocinit)).text())).sha
            const zexo_body = {
              branch: zexo_githubdocbranch, message: `Delete from ${zexo_ver} By ${zexo_githubdocusername}`, sha: zexo_sha
            }
            const zexo_docputinit = {
              body: JSON.stringify(zexo_body),
              method: "DELETE",
              headers: {
                "content-type": "application/json;charset=UTF-8",
                "user-agent": zexo_ver,
                "Authorization": "token " + zexo_githubdoctoken
              }
            }
            const zexo_r = await fetch(url, zexo_docputinit)
            const zexo_r_s = await zexo_r.status
            if (zexo_r_s == 200) {
              await KVNAME.delete("zexo_doc_list_index")
              return new Response('Delete Success', { status: zexo_r_s })
            } else {
              return new Response('Fail To Delete doc', { status: zexo_r_s })
            }
          }

          if (path.startsWith("/zexo/admin/api/deldraft")) {

            const filename = path.substr(("/zexo/admin/api/deldraft/").length)
            const url = `https://api.github.com/repos/${zexo_githubdocusername}/${zexo_githubdocrepo}/contents${githubdocdraftpath}${filename}?ref=${zexo_githubdocbranch}`
            const zexo_sha = (JSON.parse(await (await fetch(url, zexo_githubgetdocinit)).text())).sha
            const zexo_body = {
              branch: zexo_githubdocbranch, message: `Delete draft from ${zexo_ver} By ${zexo_githubdocusername}`, sha: zexo_sha
            }
            const zexo_docputinit = {
              body: JSON.stringify(zexo_body),
              method: "DELETE",
              headers: {
                "content-type": "application/json;charset=UTF-8",
                "user-agent": zexo_ver,
                "Authorization": "token " + zexo_githubdoctoken
              }
            }
            const zexo_r = await fetch(url, zexo_docputinit)
            const zexo_r_s = await zexo_r.status
            if (zexo_r_s == 200) {
              await KVNAME.delete("zexo_doc_draft_list_index")
              return new Response('Delete Success', { status: zexo_r_s })
            } else {
              return new Response('Fail To Delete doc', { status: zexo_r_s })
            }
          }

          if (path.startsWith("/zexo/admin/api/delimage")) {
            const filepath = githubimagepath.substr(0, (githubimagepath).length - 1)
            const listurl = `https://api.github.com/repos/${zexo_githubimageusername}/${zexo_githubimagerepo}/contents${filepath}?ref=${zexo_githubimagebranch}`
            const filename = path.substr(("/zexo/admin/api/delimage/").length)
            const url = `https://api.github.com/repos/${zexo_githubimageusername}/${zexo_githubimagerepo}/contents${githubimagepath}${filename}?ref=${zexo_githubimagebranch}`
            const zexo_re = (JSON.parse(await (await fetch(listurl, zexo_githubgetimageinit)).text()))
            //console.log(zexo_re)
            let zexo_sha = ""
            for (var i = 0; i < getJsonLength(zexo_re); i++) {
              if (zexo_re[i]["name"] == filename) {
                zexo_sha = zexo_re[i]["sha"]
                break
              }
            }
            //console.log(zexo_sha)
            const zexo_body = {
              branch: zexo_githubimagebranch, message: `Delete from ${zexo_ver} By ${zexo_githubdocusername}`, sha: zexo_sha
            }
            const zexo_imageputinit = {
              body: JSON.stringify(zexo_body),
              method: "DELETE",
              headers: {
                "content-type": "application/json;charset=UTF-8",
                "user-agent": zexo_ver,
                "Authorization": "token " + zexo_githubimagetoken
              }
            }
            const zexo_r = await fetch(url, zexo_imageputinit)
            const zexo_r_s = await zexo_r.status
            if (zexo_r_s == 200) {
              return new Response('Delete Success', { status: zexo_r_s })
            } else {
              return new Response('Fail To Delete Image', { status: zexo_r_s })
            }
          }
          if (path.startsWith("/zexo/admin/api/getdoc")) {
            const filename = path.substr(("/zexo/admin/api/getdoc/").length)
            return (fetch(`https://raw.githubusercontent.com/${zexo_githubdocusername}/${zexo_githubdocrepo}/${zexo_githubdocbranch}${githubdocpath}${filename}?ref=${zexo_githubdocbranch}`, zexo_githubgetdocinit))
          }
		  if (path == ("/zexo/admin/api/getscaffolds")) {
            return (fetch(`https://raw.githubusercontent.com/${zexo_githubdocusername}/${zexo_githubdocrepo}/${zexo_githubdocbranch}${zexo_githubdocroot}scaffolds/post.md?ref=${zexo_githubdocbranch}`, zexo_githubgetdocinit))
          }
          //他名字叫bfs，他就叫bfs/doge
          async function fetch_bfs(arr, url, getinit) {
            try {
              const zexo_getlist = await JSON.parse(await (await fetch(url, zexo_githubgetdocinit)).text())
              for (var i = 0; i < getJsonLength(zexo_getlist); i++) {
                if (zexo_getlist[i]["type"] != "dir") {
                  arr.push(zexo_getlist[i])
                } else {
                  await fetch_bfs(arr, zexo_getlist[i]["_links"]["self"], getinit)
                }
              }
              return arr;
            } catch (e) { return {} }
          }
          if (path == "/zexo/admin/api/getlist") {
            let zexo_doc_list_index = await zexo_kv_get("zexo_doc_list_index")
            if (zexo_doc_list_index === null) {
              const filepath = githubdocpath.substr(0, (githubdocpath).length - 1)
              const url = `https://api.github.com/repos/${zexo_githubdocusername}/${zexo_githubdocrepo}/contents${filepath}?ref=${zexo_githubdocbranch}`
              zexo_doc_list_index = await JSON.stringify(await fetch_bfs([], url, zexo_githubgetdocinit))
              await KVNAME.put("zexo_doc_list_index", zexo_doc_list_index)
            }
            return new Response(zexo_doc_list_index, {
              headers: {
                "content-type": "application/json;charset=UTF-8",
                "Access-Control-Allow-Origin": zexo_cors
              }
            })
          }
if (path == "/zexo/admin/api/trigger-deploy") {
    if (zexo_logstatus != 1) {
        return new Response('Unauthorized', { status: 401 });
    }
  
    const hookUrl = zexo_deploy_hook_url;

    const deployRes = await fetch(hookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    });
    
    const deployStatus = await deployRes.status;
    
    if (deployStatus == 200 || deployStatus == 201) {
        return new Response('Deploy Triggered', { status: deployStatus });
    } else {
        return new Response('Fail To Trigger Deploy', { status: deployStatus });
    }
}
          if (path.startsWith("/zexo/admin/api/getdraft")) {
            const filename = path.substr(("/zexo/admin/api/getdraft/").length)
            return (fetch(`https://raw.githubusercontent.com/${zexo_githubdocusername}/${zexo_githubdocrepo}/${zexo_githubdocbranch}${githubdocdraftpath}${filename}?ref=${zexo_githubdocbranch}`, zexo_githubgetdocinit))
          }
          if (path == "/zexo/admin/api/get_draftlist") {
            let zexo_doc_draft_list_index = await zexo_kv_get("zexo_doc_draft_list_index")
            if (zexo_doc_draft_list_index === null) {
              const filepath = githubdocdraftpath.substr(0, (githubdocdraftpath).length - 1)
              const url = `https://api.github.com/repos/${zexo_githubdocusername}/${zexo_githubdocrepo}/contents${filepath}?ref=${zexo_githubdocbranch}`
              zexo_doc_draft_list_index = await JSON.stringify(await fetch_bfs([], url, zexo_githubgetdocinit))
              await KVNAME.put("zexo_doc_draft_list_index", zexo_doc_draft_list_index)
            }
            return new Response(zexo_doc_draft_list_index, {
              headers: {
                "content-type": "application/json;charset=UTF-8",
                "Access-Control-Allow-Origin": zexo_cors
              }
            })
          }
          if (path == "/zexo/admin/api/getimglist") {
            const filepath = githubimagepath.substr(0, (githubimagepath).length - 1)
            const url = `https://api.github.com/repos/${zexo_githubimageusername}/${zexo_githubimagerepo}/contents${filepath}?ref=${zexo_githubimagebranch}`
            return new Response(await JSON.stringify(await fetch_bfs([], url, zexo_githubgetimageinit)), {
              headers: {
                "content-type": "application/json;charset=UTF-8",
                "Access-Control-Allow-Origin": zexo_cors
              }
            })
          }

          if (path == "/zexo/admin/api/index_del") {
            await KVNAME.delete("zexo_doc_draft_list_index")
            await KVNAME.delete("zexo_doc_list_index")
            return new Response("OK")
          }

          if (path == "/zexo/admin/api/addtalk") {
            let zexo_talk_re = await zexo_kv_get("zexo_talk_data")
            if (zexo_talk_re === null) { zexo_talk_re = "[]" }
            let zexo_talk = await JSON.parse(zexo_talk_re);
            let zexo_talk_id_re = await zexo_kv_get("zexo_talk_id")
            if (zexo_talk_id_re === null) { zexo_talk_id_re = 0 }
            let zexo_talk_id = zexo_talk_id_re;
            zexo_talk_id++;
            const now = await request.json()
            const add = {
              id: zexo_talk_id,
              time: now["time"],
              name: now["name"],
              avatar: now["avatar"],
              content: now["content"],
              visible: "True"
            }
            zexo_talk.push(add);
            await KVNAME.put("zexo_talk_data", JSON.stringify(zexo_talk))
            await KVNAME.put("zexo_talk_id", zexo_talk_id)
            return new Response('OK')
          }
          if (path == "/zexo/admin/api/deltalk") {
            const zexo_talk = JSON.parse(await zexo_kv_get("zexo_talk_data"));
            const now = Number(await request.text())
            for (var i = 0; i < getJsonLength(zexo_talk); i++) {
              if (Number(zexo_talk[i]["id"]) == now) {
                zexo_talk.splice(i, 1)
              }
            }
            await KVNAME.put("zexo_talk_data", JSON.stringify(zexo_talk))
            return new Response('OK')
          }
          if (path == "/zexo/admin/api/visibletalk") {
            const zexo_talk = JSON.parse(await zexo_kv_get("zexo_talk_data"));
            const now = await request.text()
            for (var i = 0; i < getJsonLength(zexo_talk); i++) {
              if (zexo_talk[i]["id"] == now) {
                zexo_talk[i]["visible"] = zexo_talk[i]["visible"] == "False" ? "True" : "False"
              }
            }
            await KVNAME.put("zexo_talk_data", JSON.stringify(zexo_talk))
            return new Response('OK')
          }
          if (path == "/zexo/admin/api/update") {
            const update_script = await (await fetch(`https://raw.githubusercontent.com/Zarijaden/Zexo/main/index.js`)).text()
            const up_init = {
              body: update_script,
              method: "PUT",
              headers: {
                "content-type": "application/javascript",
                "X-Auth-Key": zexo_CF_Auth_Key,
                "X-Auth-Email": zexo_Auth_Email
              }
            }
            const update_resul = await (await fetch(`https://api.cloudflare.com/client/v4/accounts/${zexo_account_identifier}/workers/scripts/${zexo_script_name}`, up_init)).text()
            return new Response(JSON.parse(update_resul)["success"])
          }
          if (path == "/zexo/admin/api/small_white_mouse_update") {
            const update_script = await (await fetch(`https://raw.githubusercontent.com/Zarijaden/Zexo/dist/index.js`)).text()
            const up_init = {
              body: update_script,
              method: "PUT",
              headers: {
                "content-type": "application/javascript",
                "X-Auth-Key": zexo_CF_Auth_Key,
                "X-Auth-Email": zexo_Auth_Email
              }
            }
            const update_resul = await (await fetch(`https://api.cloudflare.com/client/v4/accounts/${zexo_account_identifier}/workers/scripts/${zexo_script_name}`, up_init)).text()
            return new Response(JSON.parse(update_resul)["success"])
          }
          if (path == "/zexo/admin/api/inputtalk") {
            let zexo_talk_re = await zexo_kv_get("zexo_talk_data")
            if (zexo_talk_re === null) { zexo_talk_re = "[]" }
            let zexo_talk = await JSON.parse(zexo_talk_re);
            let zexo_talk_id_re = await zexo_kv_get("zexo_talk_id")
            if (zexo_talk_id_re === null) { zexo_talk_id_re = 0 }
            let zexo_talk_id = zexo_talk_id_re;
            let now = await JSON.parse(await request.text())
            let talk_init = {}
            for (var i = 0; i < now.length; i++) {
              zexo_talk_id++;
              ftime = now[i]["updatedAt"]
              ftime = ftime.split('T')
              talk_init = {
                id: zexo_talk_id,
                time: ftime[0],
                name: username[0],
                avatar: now[i]["avatar"],
                content: now[i]["atContentHtml"],
                visible: "True"
              }
              zexo_talk.push(talk_init)
            }
            await KVNAME.put("zexo_talk_data", JSON.stringify(zexo_talk))
            await KVNAME.put("zexo_talk_id", zexo_talk_id)
            return new Response(JSON.stringify(zexo_talk))
          }
          if (path.startsWith("/zexo/admin/api/checkupdate")) {
            const update_check_script = await (await fetch(`https://raw.githubusercontent.com/Zarijaden/Zexo/main/update.js`)).text()
            return new Response(update_check_script, { headers: { headers: "content-type: application/javascript; charset=utf-8" } })
          }
          if (path == "/zexo/admin/api/del_all") {
            await KVNAME.delete("zexo_config")
            return new Response('OK')
          }
          if (path == "/zexo/admin/api/kick") {
            // 手动签到：更新活跃时间（原 HexoPlusPlus 同功能接口）
            await KVNAME.put("zexo_activetime", Date.now(new Date()))
            return new Response('OK')
          }
          if (path == "/zexo/admin/api/get_config") { return new Response(await JSON.parse(zexo_config)) }
          if (path == "/zexo/admin/api/edit_config") {
            let req_con = await JSON.parse(await request.text())
            let _index = req_con["index"]
            let _value = req_con["value"]
            let k = await JSON.parse(await JSON.parse(zexo_config))
            k[_index] = _value
            k = await JSON.stringify(k)
            await KVNAME.put("zexo_config", await JSON.stringify(k))
            return new Response('OK')
          }
          if (path == "/zexo/admin/api/del_config") {
            let _index = await request.text()
            let k = await JSON.parse(await JSON.parse(zexo_config))
            delete k[_index]
            await KVNAME.put("zexo_config", await JSON.stringify(await JSON.stringify(k)))
            return new Response('OK')
          }
          if (path == "/zexo/admin/api/getzexotalk") {
            const req_r = await request.text()
            if (req_r != "") {
              const limit = (await JSON.parse(req_r))["limit"]
              const start = (await JSON.parse(req_r))["start"]
              const zexo_talk = await JSON.parse(await zexo_kv_get("zexo_talk_data"));
              let zexo_talk_res = []
              for (var i = getJsonLength(zexo_talk) - start - 1; i > getJsonLength(zexo_talk) - start - limit; i--) {
                zexo_talk_res.push(await JSON.stringify(zexo_talk[i]))
              }
              return new Response(JSON.stringify(zexo_talk_res), {
                headers: {
                  "content-type": "application/json;charset=UTF-8",
                  "Access-Control-Allow-Origin": "*"
                }
              })
            } else {
              return new Response("ERROR", {
                headers: {
                  "Access-Control-Allow-Origin": "*"
                }
              })
            }
          }
        }
      }
      else {
        if (path == '/zexo/admin/login') {
          let zexo_captcha_html = ""
          let zexo_captcha_no_1 = ""
          let zexo_captcha_no_2 = ""
          // 环境变量读取：优先 zexo_captcha，回退旧版 hpp_captcha
          try { captcha = zexo_captcha } catch (e) { try { captcha = hpp_captcha } catch (e) { captcha = "Flase" } }
          if (captcha != "True") { zexo_captcha_html = "//"; zexo_captcha_no_1 = "<!--"; zexo_captcha_no_2 = "-->" }
          let zexo_loginhtml = `
<!DOCTYPE html>
<html lang="zh-cmn-Hans">
 <head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=1, user-scalable=no" />
  <script src="https://cdn.jsdelivr.net/npm/jquery@3.4.1"></script>
  <title>后台</title>
  <style>
  .rv-root{
      z-index:999;
  }
  a:link { text-decoration: none;color: white}
　　 a:active { text-decoration:blink}
　　 a:hover { text-decoration:underline;color: white}
　　 a:visited { text-decoration: none;color: white}
  </style>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/Zarijaden/Zexo/src/login.css" />
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/Zarijaden/Zexo/src/zexo_theme.css" />
 </head>
 <body>
  <div id="all">
   <div class="wrapper">
    <div class="bg-container">
     <div class="container">
      <h1 style="margin: 0;" id="bar">Welcome</h1>
      <form class="form" id="fm">
       <input id="username" type="text" placeholder="用户名" value="" name="username" />
       <input id="password" type="password" placeholder="密码" value="" name="password" />
       <button type="button" id="login-button">登录</button>
       <br />
       <br />
       <a href="https://github.com/Zarijaden/Zexo" id="tips" style="color: #fff;">@Zexo</a>
      </form>
     </div>
    </div>
    <ul class="bg-bubbles">
     <li></li>
     <li></li>
     <li></li>
     <li></li>
     <li></li>
     <li></li>
     <li></li>
     <li></li>
     <li></li>
     <li></li>
    </ul>
   </div>
  </div>
  <script src="https://cdn.jsdelivr.net/gh/Zarijaden/Zexo/src/md5.js"></script>
  ${zexo_captcha_no_1}<script src="https://cdn.jsdelivr.net/gh/zpfz/RVerify.js/dist/RVerify.min.js"></script>${zexo_captcha_no_2}
	  ${zexo_captcha_no_1}<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/zpfz/RVerify.js/dist/RVerify.min.css"/>${zexo_captcha_no_2}
  <script>
document.onkeydown=keyListener;
${zexo_captcha_html}  RVerify.configure({
${zexo_captcha_html}   mask: 0.5,
${zexo_captcha_html}   maskClosable: true,
${zexo_captcha_html}   title: '人机验证',
${zexo_captcha_html}   album: ['/zexo/api/captchaimg']
${zexo_captcha_html} })
function login(){
${zexo_captcha_html} RVerify.action(function(res){
${zexo_captcha_html} if(res==1){
document.cookie = "username=" + md5(document.getElementById("username").value);
document.cookie = "password=" + md5(document.getElementById("password").value);
window.location.href = '/zexo/admin/dash/home';
${zexo_captcha_html} }
${zexo_captcha_html}});
}
function keyListener(e){
    if(e.keyCode == 13){
        login();
    }
}
$("#login-button").click(function(event) {
login();
});
  </script>
  </body>
</html>
`
          return new Response(zexo_loginhtml, {
            headers: { "content-type": "text/html;charset=UTF-8" }
          })
        }

        return Response.redirect('https://' + domain + '/zexo/admin/login', 302)
      }
      return Response.redirect('https://' + domain + '/zexo/admin/dash', 302)
    }
    if (path.startsWith('/zexo/api')) {
      if (path == "/zexo/api/getblogeractive") {
        const zexo_activetime = await zexo_kv_get("zexo_activetime")
        var k = (Date.parse(new Date()) - zexo_activetime) / 1000
        const zexo_re_active_init = {
          headers: {
            "content-type": "application/javascript; charset=utf-8",
            "Access-Control-Allow-Origin": "*"
          }
        }
        if (k < 30) {
          return new Response('document.getElementById("bloggeractivetime").innerHTML=\'博主刚刚还在这儿呢\'', zexo_re_active_init)
        }
        else if (k < 60) {
          return new Response('document.getElementById("bloggeractivetime").innerHTML=\'博主在' + k + '秒前离开这儿\'', zexo_re_active_init)
        }
        else if (k < 3600) {
          return new Response('document.getElementById("bloggeractivetime").innerHTML=\'博主在' + Math.round(k / 60) + '分钟前偷偷瞄了一眼博客\'', zexo_re_active_init)
        }
        else {
          return new Response('document.getElementById("bloggeractivetime").innerHTML=\'博主在' + Math.round(k / 3600) + '小时前活跃了一次\'', zexo_re_active_init)
        }
      }
      if (path == "/zexo/api/captchaimg") {
        let url = "https://thispersondoesnotexist.com/image"
        let request = new Request(url);
        return (
          fetch(request)
        );

      }
      if (path == "/zexo/api/twikoo") {
        const zexo_config = await JSON.parse(await JSON.parse(await zexo_kv_get("zexo_config")));
        const env_id = zexo_config_get(zexo_config, "zexo_twikoo_envId")
        const zexo_cors = zexo_config_get(zexo_config, "zexo_cors")
        const url = "https://tcb-api.tencentcloudapi.com/web?env=" + env_id
        async function get_refresh_token() {
          /*第一步获得refresh_token*/
          const step_1_body = {
            action: "auth.signInAnonymously",
            anonymous_uuid: "",
            dataVersion: "1970-1-1",
            env: env_id,
            refresh_token: "",
            seqId: ""
          }
          const step_1 = {
            body: JSON.stringify(step_1_body),
            method: "POST",
            headers: {
              "content-type": "application/json;charset=UTF-8"
            }
          }
          /*refresh_token到手*/
          //console.log(step_1_body)
          return JSON.parse(await (await fetch(url, step_1)).text())["refresh_token"]
        }
        async function get_access_token(refresh_token) {
          const step_2_body = {
            action: "auth.fetchAccessTokenWithRefreshToken",
            anonymous_uuid: "",
            dataVersion: "1970-1-1",
            env: env_id,
            refresh_token: refresh_token,
            seqId: ""
          }
          const step_2 = {
            body: JSON.stringify(step_2_body),
            method: "POST",
            headers: {
              "content-type": "application/json;charset=UTF-8"
            }
          }
          /*access_token到手*/
          return JSON.parse(await (await fetch(url, step_2)).text())["access_token"];
        }
        async function get_comment(access_token, path, before) {

          const re_data = { "event": "COMMENT_GET", "url": path, "before": before }
          const step_3_body = {
            access_token: access_token,
            action: "functions.invokeFunction",
            dataVersion: "1970-1-1",
            env: env_id,
            function_name: "twikoo",
            request_data: JSON.stringify(re_data),
            seqId: ""
          }
          const step_3 = {
            body: JSON.stringify(step_3_body),
            method: "POST",
            headers: {
              "content-type": "application/json;charset=UTF-8"
            }
          }
          return (await (await fetch(url, step_3)).text())

        }
        const req = await JSON.parse(await request.text())
        const path = req["path"]
        const before = req["before"]
        let refresh_token = await zexo_kv_get("zexo_comment_refresh_token")
        let access_token = await zexo_kv_get("zexo_comment_access_token")
        let val = await get_comment(access_token, path, before)
        let twikoo_code = await JSON.parse(val)['code']
        if (twikoo_code == 'CHECK_LOGIN_FAILED' | twikoo_code == 'INVALID_PARAM') {
          refresh_token = await get_refresh_token()
          await KVNAME.put("zexo_comment_refresh_token", refresh_token)
          access_token = await get_access_token(refresh_token)
          await KVNAME.put("zexo_comment_access_token", access_token)
          val = await get_comment(access_token, path, before)
        }
        return new Response(val, {
          headers: {
            "Access-Control-Allow-Origin": "*"
          }
        }
        )
      }
      if (path == "/zexo/api/getzexotalk") {
        const req_r = await request.text()
        if (req_r != "") {
          const limit = (await JSON.parse(req_r))["limit"]
          const start = (await JSON.parse(req_r))["start"]
          const zexo_talk = await JSON.parse(await zexo_kv_get("zexo_talk_data"));
          let zexo_talk_res = []
          let zexo_vi = ""
          for (var i = getJsonLength(zexo_talk) - start - 1; i > getJsonLength(zexo_talk) - start - limit; i--) {
            try { zexo_vi = zexo_talk[i]["visible"] } catch (e) { zexo_vi = null }
            if (zexo_vi != "False") {
              zexo_talk_res.push(await JSON.stringify(zexo_talk[i]))
            }
          }
          return new Response(JSON.stringify(zexo_talk_res), {
            headers: {
              "content-type": "application/json;charset=UTF-8",
              "Access-Control-Allow-Origin": "*"
            }
          })
        } else {
          return new Response("ERROR", {
            headers: {
              "Access-Control-Allow-Origin": "*"
            }
          })
        }
      }

    }
    if (path == "/zexo/talk") {
      const talk_user_html = `<!DOCTYPE html>
<html lang="zh">
<head>
<meta charset="UTF-8">
<meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>ZexoTalk预览页面</title>
</head>
<body>
	<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/Zarijaden/Zexo/src/talk.css" />
	<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/Zarijaden/Zexo/src/zexo_theme.css" />
<script src="https://cdn.jsdelivr.net/gh/Zarijaden/Zexo/src/talk_user.js"></script>
<div id="zexo_talk"></div>
<script>
new zexo_talk({
id:"zexo_talk",
domain: window.location.host,
limit: 10,
start: 0
});
</script>
</body>
</html>`
      return new Response(talk_user_html, {
        headers: { "content-type": "text/html;charset=UTF-8" }
      })
    }
    let zexo_errorhtml = `
<!DOCTYPE html>
<html lang="en" class="no-js">
	<head>
        <meta charset="UTF-8" />
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0;" name="viewport" />
        <title>ZexoError</title>
        <link rel="stylesheet" type="text/css" href="https://cdn.jsdelivr.net/gh/Zarijaden/Zexo/src/error.css" />
        <link rel="stylesheet" type="text/css" href="https://cdn.jsdelivr.net/gh/Zarijaden/Zexo/src/zexo_theme.css" />
	</head>
	<body>
		<div class="container demo-2">
			<div class="content">
                <div id="large-header" class="large-header">
                    <canvas id="demo-canvas"></canvas>
                    <h1 class="main-title"><span>Error</span></h1>
                </div>
                <div class="codrops-header">
                    <h1>Zexo 错误<span>不知道你的目的是什么</span></h1>
                    <nav class="codrops-demos">
                        <a class="current-demo" href="/zexo/admin/dash/home">仪表盘</a>
                        <a class="current-demo" href="https://github.com/Zarijaden/Zexo">Github</a>
                    </nav>
                </div>
            </div>
		</div>
        <script src="https://cdn.jsdelivr.net/gh/Zarijaden/Zexo/src/error.js"></script>
	</body>
</html>
`
    return new Response(zexo_errorhtml, {
      headers: { "content-type": "text/html;charset=UTF-8" }
    })

  } catch (e) {
    let zexo_errorhtml = `
<!DOCTYPE html>
<html lang="en" class="no-js">
	<head>
        <meta charset="UTF-8" />
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0;" name="viewport" />
        <title>ZexoError</title>
        <link rel="stylesheet" type="text/css" href="https://cdn.jsdelivr.net/gh/Zarijaden/Zexo/src/error.css" />
        <link rel="stylesheet" type="text/css" href="https://cdn.jsdelivr.net/gh/Zarijaden/Zexo/src/zexo_theme.css" />
	</head>
	<body>
		<div class="container demo-2">
			<div class="content">
                <div id="large-header" class="large-header">
                    <canvas id="demo-canvas"></canvas>
                    <h1 class="main-title"><span>Error</span></h1>
                </div>
                <div class="codrops-header">
                    <h1>Zexo 异常<span>${e}</span></h1>
                    <nav class="codrops-demos">
                        <a class="current-demo" href="https://github.com/Zarijaden/Zexo#readme">文档</a>
                        <a class="current-demo" href="https://github.com/Zarijaden/Zexo">Github</a>
						<a class="current-demo" href="https://github.com/Zarijaden/Zexo/issues">Issues 反馈</a>
                    </nav>
                </div>
            </div>
		</div>
        <script src="https://cdn.jsdelivr.net/gh/Zarijaden/Zexo/src/error.js"></script>
	</body>
</html>
`
    return new Response(zexo_errorhtml, {
      headers: { "content-type": "text/html;charset=UTF-8" }
    })

  }
}
