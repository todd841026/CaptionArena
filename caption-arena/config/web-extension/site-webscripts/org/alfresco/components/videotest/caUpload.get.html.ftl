<@markup id="css" >
   <@link href="${url.context}/res/components/caption/css/bootstrap.min.css"/>
   <@link href="${url.context}/res/components/caption/css/index.css"/>
</@>
<@markup id="js">
	<@script src="${url.context}/res/components/caption/js/caupload.js"/>
	<@script src="${url.context}/res/components/caption/js/jquery-1.12.1.min.js"/>
</@>
<@markup id="widgets">
<@createWidgets/>
</@>
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
<div class="container" style="text-align:center;padding:0 17%">
    <div class="title">视频上传</div>
    <form class="navbar-form" role="search">
        <div class="form-group">
            <div class="input-group upload-group">
                <input type="text" id="title" class="form-control input-control" placeholder="请输入主标题"/>
                <input type="text" id="subhead" class="form-control input-control" placeholder="请输入副标题" style="margin-top:20px"/>
            </div>
        </div>
    </form>
    <input id="fileUpload" type="button" class="btn btn-user" value="上传">
    <input id="backHome" type="button" class="btn btn-user" onclick="javascript:window.location.href='caption'" value="返回" >
</div>

