<import resource="classpath:/alfresco/site-webscripts/org/alfresco/components/documentlibrary/include/toolbar.lib.js">
<import resource="classpath:/alfresco/site-webscripts/org/alfresco/components/documentlibrary/include/documentlist.lib.js">
<import resource="classpath:/alfresco/templates/org/alfresco/import/alfresco-util.js">
<import resource="classpath:/alfresco/site-webscripts/org/alfresco/components/upload/uploadable.lib.js">
doclibCommon();

function widgets()
{
   var useTitle = "true";
   var caUpload = {
      id: "caUpload", 
      name: "Alfresco.caUpload",
      assignTo: "caUpload",
      options: {
         siteId: (page.url.templateArgs.site != null) ? page.url.templateArgs.site : "",
         rootNode: toolbar.rootNode != null ? toolbar.rootNode : "",
         hideNavBar: Boolean(toolbar.preferences.hideNavBar),
         repositoryBrowsing: toolbar.rootNode != null,
         useTitle: (useTitle == "true"),
         syncMode: toolbar.syncMode != null ? toolbar.syncMode : "",
         createContentByTemplateEnabled: model.createContentByTemplateEnabled,
         createContentActions: model.createContent
      }
   };
   
  
   
   model.widgets = [caUpload];

}


widgets();


