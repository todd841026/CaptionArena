<@markup id="css" >
   <#-- CSS Dependencies -->
   <@link href="${url.context}/res/components/video/videoName.css" group="video"/>
   <@link href="${url.context}/res/components/video/videoName.css" group="video"/>
   <@link href="${url.context}/res/yui/fonts-min.css" group="yui"/>
   <@link href="${url.context}/res/yui/assets/skins/default/button.css" group="yui"/>
</@>

<@markup id="js">
		<@script src="${url.context}/res/components/video/captionUpload.js" group="video"/>
		<@script src="${url.context}/res/yui/yahoo-dom-event/yahoo-dom-event.js" group="video"/>
</@>

<@markup id="widgets">
   <@createWidgets group="video"/>
</@>