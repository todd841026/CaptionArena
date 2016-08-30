
<@markup id="html">
<nav class="navbar user-navbar">
    <div class="container-fluid">
        <div class="navbar-header user-header">
            <a class="navbar-brand user-brand" href="caption">
                <img alt="Caption Arena" src="${url.context}/res/components/caption/imgs/logo.png">
            </a>
        </div>
        <div class="collapse navbar-collapse">
            <ul class="nav navbar-nav">
                <li><a href="#" class="active">最新</a></li>
                <li><a href="#">科普</a></li>
                <li><a href="#">娱乐</a></li>
            </ul>
            <form class="navbar-form navbar-right" role="search">
                <button type="button" class="btn btn-caption" onclick="javascript:window.location.href='arenaUpload'">
                    求字幕
                </button>
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
    <input type="hidden" value="${srtId}" id="in3"/>
    <div id="video-player">
        <div class="video-background">
            <video id="video-js" class="video-js vjs-default-skin" controls preload="auto" width="1024" height="420"
                   poster="${url.context}/res/components/video/images/pic.png" data-setup={"example_option":true}>
                <source src="http://localhost:8080/caption/proxy/alfresco/api/external/node/content/${nodeRef}"
                        type="video/mp4"/>
                <track id="video-srt" kind="captions"
                       src="http://localhost:8080/caption/proxy/alfresco/api/external/node/content/${srtId}"
                       srclang="it" label="Italian" default/>
                <p class="vjs-no-js">To view this video please enable JavaScript, and consider upgrading to a web
                    browser that <a href="http://videojs.com/html5-video-support/" target="_blank">supports HTML5
                        video</a></p>
            </video>
        </div>
        <div class="">
            <div class="adjust">
                <button class="lbtn" id="lbtn" onclick="lefttime()"></button>
                <span class="time"></span>
                <button class="rbtn" onclick="righttime()"></button>
            </div>
            <div class="editarena">
                <input class="editInput" type="text" id="editInputCa" placeholder="请点击此处编辑字幕" onfocus="focusText()"
                       id="time2"/>
                <button class="btn btn-default" id="btn_madeCa" onclick="upjson()">确定</button>
            </div>
            <div class="center">
                <button class="btn btn-default submit">提交</button>
                <p>注: 点击“提交”按钮后，您之前所有“确定”过的字幕都将一并提交。</p>
            </div>
        </div>
    </div>
</div>
</@>


