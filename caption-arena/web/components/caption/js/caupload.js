(function()
{
   var Dom = YAHOO.util.Dom,
       Event = YAHOO.util.Event,
       Element = YAHOO.util.Element,
       KeyListener = YAHOO.util.KeyListener;
      
   var $html = Alfresco.util.encodeHTML,
   	   $date = function $date(date, format) { return Alfresco.util.formatDate(Alfresco.util.fromISO8601(date), format) };
   	   
   var myThis;
   Alfresco.caUpload = function(htmlId)
   {
	  var instance = Alfresco.util.ComponentManager.get(htmlId);
      if (instance !== null)
      {
         return instance;
      }
      myThis = this;
      this.id = htmlId;
      this.selectedItems = {};
      Alfresco.caUpload.superclass.constructor.call(this, "Alfresco.caUpload", htmlId, ["button", "container", "connection", "selector", "json"]);
     
      return this;

   };
   
   YAHOO.extend(Alfresco.caUpload, Alfresco.component.Base,
   {
	    options:{},
	   	currentPage : 1,
	   	selectedItems : null,
	   	fileUpload : null,
	   	onReady: function AccountManagement_onReady()
	    { 
	   		var fileUploadButton = Dom.get("fileUpload");
	    	YAHOO.util.Event.addListener(fileUploadButton, "click", function(e)
	    	        {
	    		    this.onUpload();
	    	        }, null, this);	
	    },
	    onUpload : function UP_onUpload(e, p_obj) {
			console.log("上传");
			if (this.fileUpload === null) {
				this.fileUpload = Alfresco.getFileUploadInstance();
			}
			var title = $("#title").val();
			var subhead = $("#subhead").val();
			var uploadConfig = {
					flashUploadURL : "api/external/caption/uploadVideo",
					htmlUploadURL : "api/external/caption/uploadVideo.html",
					destination :  title,
					username : 		subhead,	
					mode : this.fileUpload.MODE_SINGLE_UPLOAD,
					onFileUploadComplete : {
						fn : this.onUploadStudentComplete,
						scope : this
					}
			};
			this.fileUpload.show(uploadConfig);
			// 防止事件的默认行为
			Event.preventDefault(e);
		}, 
		onUploadStudentComplete : function UP_onUploadTeachPlanComplete(complete) {
			console.log("上传成功");
		},
   });
})();
