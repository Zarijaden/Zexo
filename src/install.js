
(function() {
  setTimeout(function(arg1) {
    if (arg1 === 'test') {
      // feature test is passed, no need for polyfill
      return;
    }
    var __nativeST__ = window.setTimeout;
    window.setTimeout = function(vCallback, nDelay /*, argumentToPass1, argumentToPass2, etc. */ ) {
      var aArgs = Array.prototype.slice.call(arguments, 2);
      return __nativeST__(vCallback instanceof Function ? function() {
        vCallback.apply(null, aArgs);
      } : vCallback, nDelay);
    };
  }, 0, 'test');
  var interval = setInterval(function(arg1) {
    clearInterval(interval);
    if (arg1 === 'test') {
      // feature test is passed, no need for polyfill
      return;
    }
    var __nativeSI__ = window.setInterval;
    window.setInterval = function(vCallback, nDelay /*, argumentToPass1, argumentToPass2, etc. */ ) {
      var aArgs = Array.prototype.slice.call(arguments, 2);
      return __nativeSI__(vCallback instanceof Function ? function() {
        vCallback.apply(null, aArgs);
      } : vCallback, nDelay);
    };
  }, 0, 'test');
}())
function ajaxObject() {
    var xmlHttp;
    try {
        // Firefox, Opera 8.0+, Safari
        xmlHttp = new XMLHttpRequest();
    } catch(e) {
        // Internet Explorer
        try {
            xmlHttp = new ActiveXObject("Msxml2.XMLHTTP");
        } catch(e) {
            try {
                xmlHttp = new ActiveXObject("Microsoft.XMLHTTP");
            } catch(e) {
                sweetAlert("糟糕", "你的浏览器不能上传文件", "error");
                return false;
            }
        }
    }
    return xmlHttp;
}
var t = 0;

function start() {
    if (t == 0) {
        document.querySelectorAll('.cont_letras > p')[0].style.left = '200px';
        document.querySelectorAll('.cont_letras > p')[1].style.left = '-320px';
        document.querySelectorAll('.cont_letras > p')[2].style.left = '200px';
        setTimeout(function() {
            document.querySelector('.cont_join').className = 'cont_join cont_join_form_act';
        },
        1000);
        t++;
        document.getElementById("butttt").innerHTML = "提交配置"
    } else {
        document.getElementById("butttt").innerHTML = "配置上传中"
		let zexo_domain=document.getElementById("zexo_domain").value==""?window.location.host:document.getElementById("zexo_domain").value;
		let zexo_username=document.getElementById("zexo_userimage").value==""?"https://cdn.jsdelivr.net/gh/ChenYFan/CDN@master/img/hpp_upload/1612610340000.jpg":document.getElementById("zexo_userimage").value;
		let zexo_title=document.getElementById("zexo_title").value==""?"Zexo小飞机":document.getElementById("zexo_title").value;
		let zexo_usericon=document.getElementById("zexo_usericon").value==""?"https://cdn.jsdelivr.net/gh/HexoPlusPlus/CDN@master/doc_img/icon.png":document.getElementById("zexo_usericon").value;
		let zexo_cors=document.getElementById("zexo_cors").value==""?"*":document.getElementById("zexo_cors").value
		let zexo_autodate=document.getElementById("zexo_autodate").value==""?"False":document.getElementById("zexo_autodate").value
		let zexo_OwO=document.getElementById("zexo_OwO").value==""?"https://cdn.jsdelivr.net/gh/2X-ercha/Twikoo-Magic@master/hppowo.json":document.getElementById("zexo_OwO").value
		let zexo_back=document.getElementById("zexo_back").value==""?"":document.getElementById("zexo_back").value
		let zexo_lazy_img=document.getElementById("zexo_lazy_img").value==""?"https://cdn.jsdelivr.net/gh/ChenYFan/blog@master/themes/fluid/source/img/loading.gif":document.getElementById("zexo_lazy_img").value
		let zexo_highlight_style=document.getElementById("zexo_highlight_style").value==""?"github":document.getElementById("zexo_highlight_style").value
		let zexo_color=document.getElementById("zexo_color").value==""?"azure":document.getElementById("zexo_color").value
		let zexo_bg_color=document.getElementById("zexo_bg_color").value=="black"?"black":document.getElementById("zexo_bg_color").value
		let zexo_theme_mode=document.getElementById("zexo_theme_mode").value=="dark"?"dark":"light"
		let zexo_page_limit=document.getElementById("zexo_page_limit").value==""?"10":document.getElementById("zexo_page_limit").value
		const config={
			"zexo_domain":zexo_domain,
			"zexo_userimage":zexo_username,
			"zexo_title":zexo_title,
			"zexo_usericon":zexo_usericon,
			"zexo_cors":zexo_cors,
			"zexo_githubdoctoken":document.getElementById("zexo_githubdoctoken").value,
			"zexo_githubimagetoken":document.getElementById("zexo_githubimagetoken").value,
			"zexo_githubdocusername":document.getElementById("zexo_githubdocusername").value,
			"zexo_githubdocrepo":document.getElementById("zexo_githubdocrepo").value,
			"zexo_githubdocroot":document.getElementById("zexo_githubdocroot").value,			
			"zexo_githubdocbranch":document.getElementById("zexo_githubdocbranch").value,
			"zexo_githubimageusername":document.getElementById("zexo_githubimageusername").value,
			"zexo_githubimagerepo":document.getElementById("zexo_githubimagerepo").value,
			"zexo_githubimagepath":document.getElementById("zexo_githubimagepath").value,			
			"zexo_githubimagebranch":document.getElementById("zexo_githubimagebranch").value,
			"zexo_autodate":zexo_autodate,
			"zexo_account_identifier":document.getElementById("zexo_account_identifier").value,
			"zexo_script_name":document.getElementById("zexo_script_name").value,			
			"zexo_CF_Auth_Key":document.getElementById("zexo_CF_Auth_Key").value,
			"zexo_Auth_Email":document.getElementById("zexo_Auth_Email").value,
			"zexo_twikoo_envId":document.getElementById("zexo_twikoo_envId").value,
			"zexo_OwO":zexo_OwO,
			"zexo_back":zexo_back,
			"zexo_lazy_img":zexo_lazy_img,
			"zexo_highlight_style":zexo_highlight_style,
			"zexo_color":zexo_color,
			"zexo_bg_color":zexo_bg_color,
			"zexo_theme_mode":zexo_theme_mode,
			"zexo_page_limit":zexo_page_limit
			};
        var ajax = ajaxObject();
        ajax.open("post", '/zexo/admin/api/upconfig', true);
        ajax.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
        ajax.onreadystatechange = function() {
            if (ajax.readyState == 4) {
                if (ajax.status == 200) {
                    setTimeout(function() {
                        document.querySelector('.cont_join').className = 'cont_join cont_join_form_act cont_join_finish';
                    },
                    500);
					t++;
					document.querySelector('.cont_form_join').style.bottom = '-420px';
					setTimeout(window.location.reload(),5000)
                } else {
document.getElementById("butttt").innerHTML = "配置上传失败，请重试"
}
            }
        }
        ajax.send(JSON.stringify(config));

    }

}
