<#assign el=args.htmlid?html>
<@markup id="html">
   <@uniqueIdDiv>
   			<div class="container" style=' width:520px;margin:auto;'>
			<form id="${el}-htmlupload-form" method="post" enctype="multipart/form-data" accept-charset="utf-8" action="${url.context}/proxy/alfresco/api/caption/upload/videoupload.html">
			<div class="row"> 
				<div class="col-xs-12" >
					<input class="uploadInput" type="text" placeholder="请输入视频标题"/>
				</div>
			</div>
			<div class="row" style="margin-top:20px;">
				<div class="col-sm-6 " >
					<span class="btn btn-default fileinput-button"  >
                    <span>选择文件</span>
                    <input type="file" name="files[]" multiple />
                </span>
				</div>
				<div class="col-sm-6" >  
					<button  id="${el}-upload-button" type="button" class="btn btn-nocolor start">上传</button>
				</div>
			</div>
			</form>
		</div>
   </@>
</@>