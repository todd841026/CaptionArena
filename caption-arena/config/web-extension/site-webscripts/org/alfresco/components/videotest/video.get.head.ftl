<@markup id="css" >
   <#-- CSS Dependencies -->
   <@link href="${url.context}/res/components/video/video-js.css" group="video"/>
   <@link href="${url.context}/res/components/video/captionheader.css" group="video"/>
   <@link href="${url.context}/res/components/video/bootstrap.css" group="video"/>
   <@link href="${url.context}/res/components/video/video.css" group="video"/>
</@>


<@markup id="js">
   <@script type="text/javascript"  src="${url.context}/res/jquery/jquery-1.6.2.js" group="jquery"/>
   <@script type="text/javascript"  src="${url.context}/res/components/video/captionvideo.js" group="video"/>
   <@script type="text/javascript"  src="${url.context}/res/components/video/video4.js" group="video"/>
   <@script type="text/javascript" src="${url.context}/res/components/video/captionsrt.js" group="video"/>
</@>

<@markup id="widgets">
   <@createWidgets group="video"/>
</@>