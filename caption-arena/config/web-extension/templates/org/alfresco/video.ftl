<#include "include/alfresco-template.ftl" />
<#include "include/documentlibrary.inc.ftl" />
<@templateHeader />

<@templateBody>
   <@markup id="alf-hd">
	   <div id="header">
	      <@region scope="global" id="caption-header"   chromeless="true"/>
	   </div>
   </@>
	<@markup id="bd">
	   <div id="bd">
	      <@region id="video" scope="template" />
	   </div>
	</@>
</@>