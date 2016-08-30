<#include "include/alfresco-template.ftl" />
<#include "include/documentlibrary.inc.ftl" />
<@templateHeader>
   <@markup id="location-hash">
   <@documentLibraryJS />
   </@>
   <@script type="text/javascript" src="${url.context}/res/modules/documentlibrary/doclib-actions.js"></@script>
</@>
<@templateBody>
   <@markup id="bd">
   <div id="bd">	 
   	<div class="mainBody">
      <div class="yui-t1" id="alfresco-workspace">
         <div id="yui-main">
            <div class="yui-b" id="alf-content">       	
                 <@region id="caUpload" scope="template"/>
    			<@region id="html-upload" scope="template" />
                <@region id="flash-upload" scope="template" />
                <@region id="file-upload" scope="template" />
                <@region id="dnd-upload" scope="template"/>
            </div>
         </div>
      </div>
   </div>
  </div>
	</@>
</@>
