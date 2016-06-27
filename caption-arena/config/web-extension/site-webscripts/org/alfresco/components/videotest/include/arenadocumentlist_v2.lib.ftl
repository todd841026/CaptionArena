<#macro viewRenderererJsDeps>
   <#list viewJsDeps as dep>
      <@script type="text/javascript" src="${url.context}/res/${dep}" group="documentlibrary"/>
   </#list>
</#macro>

<#macro viewRenderererCssDeps>
   <#list viewCssDeps as dep>
	   <@link rel="stylesheet" type="text/css" href="${url.context}/res/components/video/bootstrap.css" group="video"/>
	   <@link rel="stylesheet" type="text/css" href="${url.context}/res/components/video/video-js.css" group="video"/>
	   <@link rel="stylesheet" type="text/css" href="${url.context}/res/components/video/commom.css" group="video"/>
	   <@link rel="stylesheet" type="text/css" href="${url.context}/res/components/video/video.css" group="video"/>
   </#list>
</#macro>

<#macro documentlistTemplate>
   <#nested>
   <#assign id=args.htmlid?html>
	   <div class="video-header ">
			<div class="logo"></div>
		</div>
		<div>
	      <#if uploadable>
	        <div class="captionBtn">
			     <span id="${id}-fileUpload-button" class="uploadBtn " >
	          		  <button name="fileUpload" calss="">上传按钮</button>
	     		</span>
	   		</div>
		</#if>
	  </div>

   <!--[if IE]>
      <iframe id="yui-history-iframe" src="${url.context}/res/yui/history/assets/blank.html"></iframe>
   <![endif]-->
</#macro>