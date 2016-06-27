<@markup id="css" >
   <#-- CSS Dependencies -->
    <@link rel="stylesheet" type="text/css" href="${url.context}/res/components/documentlibrary/toolbar.css" group="documentlibrary"/>
   <@link rel="stylesheet" type="text/css" href="${url.context}/res/components/documentlibrary/documentlist_v2.css" group="documentlibrary"/>
</@>

<@markup id="js">
		  <@script type="text/javascript" src="${url.context}/res/components/documentlibrary/toolbar.js" group="documentlibrary"/>
		 <@script type="text/javascript" src="${url.context}/res/${dep}" group="documentlibrary"/>
</@>

<@markup id="widgets">
   <@createWidgets group="documentlibrary"/>
</@>

