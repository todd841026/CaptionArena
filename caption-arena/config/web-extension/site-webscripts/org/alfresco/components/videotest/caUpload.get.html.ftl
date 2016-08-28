<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
  <title>Document</title>
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
</head>
<body>
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
          <button type="button" class="btn btn-caption">求字幕</button>
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
<div class="container" style="text-align:center;padding:0 17%">

   <div class="title">视频上传</div>
   <form class="navbar-form" role="search">
    <div class="form-group">
      <div class="input-group upload-group">
        <input type="text" class="form-control input-control" placeholder="请输入主标题" />
        <input type="text" class="form-control input-control" placeholder="请输入副标题" style="margin-top:20px"/>
      </div>
    </div>
      <div style="margin-left:22%">
       <div class="name">人与自然.mp4</div>
       <div style="width:400px">
         <div class="progress">
          <div class="progress-bar" role="progressbar" aria-valuenow="70" aria-valuemin="0" aria-valuemax="70" style="width: 70%;">
            <span class="sr-only">60% Complete</span>
          </div>

        </div>
        <div class="progress-percent" style="margin-left:67%">70%</div>
      </div>
    </div>
  </form>
  <button type="button"  class="btn btn-user">选择</button><button type="button"  class="btn btn-user">提交</button>
</div>
</body>
</html>