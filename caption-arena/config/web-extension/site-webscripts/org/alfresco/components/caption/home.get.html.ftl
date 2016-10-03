<@markup id="css" >
   <@link href="${url.context}/res/components/caption/css/bootstrap.min.css"/>
   <@link href="${url.context}/res/components/caption/css/index.css"/>
   <@link href="${url.context}/res/components/caption/js/jCarrousel/carrousel.css"/>
</@>

<@markup id="js">
   <@script src="${url.context}/res/components/caption/js/jquery-1.12.1.min.js"/>
   <@script src="${url.context}/res/components/caption/js/bootstrap.min.js"/>
   <@script src="${url.context}/res/components/caption/js/jCarrousel/carrousel.js"/>
   <@script src="${url.context}/res/components/caption/js/caption.js"/>
</@>

<nav class="navbar user-navbar">
    <div class="container-fluid">
        <div class="navbar-header user-header">
            <a class="navbar-brand user-brand" href="caption">
                <img alt="Caption Arena" src="${url.context}/res/components/caption/imgs/logo.png">
            </a>
        </div>
        <div class="collapse navbar-collapse">
            <ul class="nav navbar-nav">
                <li><a href="#up-to-date" class="active">最新</a></li>
                <li><a href="#Coptic">科普</a></li>
                <li><a href="#amusement">娱乐</a></li>
            </ul>
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
<div id="wrap">
	<div class="container-fluid" style="padding:0px">
	    <div class="banner">
	        <section id="dg-container" class="dg-container">
	            <div class="dg-wrapper">
	                <a href="#" link="">
	                    <img src="">
	                </a>
	                <a href="#" link="">
	                    <img src="">
	                </a>
	                <a href="#" link="">
	                    <img src="">
	                </a>
	
	                <a href="#" link="">
	                    <img src="">
	                </a>
	                <a href="#" link="">
	                    <img src="">
	                </a>
	            </div>
	            <ol class="button" id="lightButton">
	                <li index="0">
	                <li index="1">
	                <li index="2">
	                <li index="3">
	                <li index="4">
	            </ol>
	            <nav>
	                <span class="dg-prev"></span>
	                <span class="dg-next"></span>
	            </nav>
	        </section>
	    </div>
	</div>
	<div class="container">
	    <div class="alert alert-user" role="alert">
	        <strong>Klinge:发布了第一个视频!</strong>冰风之吻:Lorem ipsum dolor sot amet, consectetur adipisicong elit, sed do eiusmod
	        tempor incididunt ut labore etdolore magna qliqua.
	    </div>
	    <div id="up-to-date" class="panel panel-default">
	        <div class="panel-heading news"><span class="rmark">最新发布</span></div>
	        <div class="panel-body">
	            <div class="container-fluid">
	                <div class="row" id="newVideo">
	                </div>
	            </div>
	        </div>
	    </div>
	
	    <div id="Coptic" class="panel panel-default">
	        <div class="panel-heading tech">
	            <span class="rmark" style="width:70px">科普</span>
	        </div>
	        <div class="panel-body">
	            <div class="container-fluid">
	                <div class="row" id="kepu">
	                    <div class="col-xs-6 col-md-6">
	                        <div class="row" id="kepuFisrtRow">
	                        </div>
	                        <div class="row" id="kepuSecondRow">
	                        </div>
	                    </div>
	                </div>
	            </div>
	        </div>
	    </div>
	
	    <div id="amusement" class="panel panel-default">
	        <div class="panel-heading enter">
	            <span class="rmark" style="width:70px">娱乐</span>
	        </div>
	        <div class="panel-body">
	            <div class="container-fluid">
	                <div class="row" id="yele">
	                    <div class="col-xs-6 col-md-6">
	                        <div class="row" id="yeleFisrtRow">
	                        </div>
	                        <div class="row" id="yeleSecondRow">
	                        </div>
	                    </div>
	                </div>
	            </div>
	        </div>
	    </div>
	</div>
</div>


