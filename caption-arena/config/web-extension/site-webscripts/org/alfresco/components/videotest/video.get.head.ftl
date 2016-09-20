<@markup id="css" >
   <#-- CSS Dependencies -->
   <@link href="${url.context}/res/components/video/video-js.css"/>
   <@link href="${url.context}/res/components/video/captionheader.css"/>
   <@link href="${url.context}/res/components/video/bootstrap.css"/>
   <@link href="${url.context}/res/components/video/video.css" />
</@>


<@markup id="js">
   <@script type="text/javascript"  src="${url.context}/res/jquery/jquery-1.6.2.js"/>
   <@script type="text/javascript"  src="${url.context}/res/components/video/video4.js" />
   <@script type="text/javascript" src="${url.context}/res/components/video/captionsrt.js" />
   <@script type="text/javascript"  src="${url.context}/res/components/video/captionvideo.js" />
</@>

<@markup id="widgets">
   <@createWidgets group="video"/>
</@>