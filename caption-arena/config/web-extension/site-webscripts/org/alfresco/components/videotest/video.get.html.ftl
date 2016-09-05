<nav class="navbar user-navbar">
    <div class="container-fluid">
        <div class="navbar-header user-header">
            <a class="navbar-brand user-brand" href="caption">
                <img alt="Caption Arena" src="${url.context}/res/components/caption/imgs/logo.png">
            </a>
        </div>
        <div class="collapse navbar-collapse">
            <form class="navbar-form navbar-right" role="search">
                <button type="button" class="btn btn-caption" onclick="javascript:window.location.href='arenaUpload'">求字幕</button>
                <span class="login">登录</span><span class="register">注册</span>
                <div class="form-group">
                    <div class="input-group">
                        <input type="text" class="form-control search" placeholder="在这里搜索"/>
                    </div>
                </div>
            </form>
        </div>
    </div>
</nav>

<div class="container">
    <ol class="breadcrumb">
        <li><a href="#">返回</a></li>
        <li class="active">Mad Max</li>
    </ol>
    <div id="video-player">
        <div class="video-background">
            <video id="video-js" class="video-js vjs-default-skin" controls preload="auto" width="1024" height="420"
                   poster="${url.context}/res/components/video/images/pic.png" data-setup={"example_option":true}>
                <source src="" type="video/mp4"/>
                <track id="video-srt" kind="captions" src="http://localhost:8080/caption/proxy/alfresco-noauth/api/external/node/contentsrt/${srtId}" srclang="it" label="Italian" default></track>
                <p class="vjs-no-js">To view this video please enable JavaScript, and consider upgrading to a web
                    browser that <a href="http://videojs.com/html5-video-support/" target="_blank">supports HTML5
                        video</a></p>
            </video>
        </div>
        <div>
	        <div class="adjust">
	            <button class="lbtn" id="lbtn" onclick="lefttime()"></button>
	            <span class="time"></span>
	            <button class="rbtn" onclick="righttime()"></button>
	        </div>
	        <div class="editarena">
	            <input class="editInput" type="text" id="editInputCa" placeholder="请点击此处编辑字幕" onfocus="focusText()"/>
	            <input class="btn btn-default" id="btn_madeCa" type="button" onclick="upjson()" value="确定">
	        </div>
	        <div class="center">
	            <input class="btn btn-default submit" onclick="onSubmit()" id="submit" value="提交">
	            <p>注: 点击“提交”按钮后，您之前所有“确定”过的字幕都将一并提交。</p>
	        </div>
	    </div>
    </div>
</div>