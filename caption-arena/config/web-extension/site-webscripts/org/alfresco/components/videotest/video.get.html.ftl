
<@markup id="html">
<@uniqueIdDiv>
	<!-- <nav class="navbar navbar-default">
		  <div class="container">
		     Brand and toggle get grouped for better mobile display 
		    <div class="navbar-header">
		      <button type="button" class="navbar-toggle collapsed" data-toggle="collapse" data-target="#bs-example-navbar-collapse-1" aria-expanded="false">
		        <span class="sr-only">Toggle navigation</span>
		        <span class="icon-bar"></span>
		        <span class="icon-bar"></span>
		        <span class="icon-bar"></span>
		      </button>
		      <a class="navbar-brand" href="#"></a>
		    </div>
		
		     Collect the nav links, forms, and other content for toggling 
		    <div class="collapse navbar-collapse" id="bs-example-navbar-collapse-1">
		      <ul class="nav navbar-nav">
		        <li class="active"><a href="#">最新 <span class="sr-only">(current)</span></a></li>
		        <li><a href="#">科普</a></li>
		        <li><a href="#">娱乐</a></li>
		        <li><a href="#">求字幕</a></li>
		      </ul>
		      <form class="navbar-form navbar-left" role="search">
		        <div class="form-group">
		          <input type="text" class="form-control" placeholder="">
		        </div>
		      </form>
		      <ul class="nav navbar-nav navbar-right">
		       
		        <li class="dropdown">
		          <a href="#" class="dropdown-toggle" data-toggle="dropdown" role="button" aria-haspopup="true" aria-expanded="false" style="padding:10px 20px;"><span class="caret"></span></a>
		          <ul class="dropdown-menu">
		            <li><a href="#">Action</a></li>
		            <li><a href="#">Another action</a></li>
		            <li><a href="#">Something else here</a></li>
		            <li role="separator" class="divider"></li>
		            <li><a href="#">Separated link</a></li>
		          </ul>
		        </li>
		      </ul>
		    </div> /.navbar-collapse
		  </div> /.container-fluid 
	</nav>   -->
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
          <button type="button" class="btn btn-caption"  onclick="javascript:window.location.href='arenaUpload'">求字幕</button>
          <span class="login">登录</span><span class="register">注册</span>
          <div class="form-group">
            <div class="input-group">
              <input type="text" class="form-control search" placeholder="在这里搜索" />
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
				<input type="hidden" value=${nodeId} id = "in2"/>
				<input type="hidden" value=${srtId} id = "in3"/>
			<div id="video-player">
					<div class="video-background"></div>
					<div class="text-background"></div>
			</div>
			<div class="">
					<div class="adjust">
						<button class="lbtn" id="lbtn" onclick="lefttime()"></button>
						<span class="time"></span>
						<button class="rbtn" onclick="righttime()"></button>
			</div>
			<div class="editarena">
					<input class="editInput"  type="text" id="editInputCa" placeholder="请点击此处编辑字幕" onfocus="focusText()"  id="time2" />
					<button class="btn btn-default" id="btn_madeCa" onclick="upjson()">确定</button>
			</div>
			<div class="center" >
				<button class="btn btn-default submit">提交</button>
				<p>注: 点击“提交”按钮后，您之前所有“确定”过的字幕都将一并提交。</p>
			</div>
		</div>
   </@>
</@>

