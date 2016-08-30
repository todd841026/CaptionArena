<import resource="classpath:alfresco/site-webscripts/org/alfresco/callutils.js">

function main() {
	var nodeRef = getPageUrlParam("nodeRef");
	
	model.nodeRef = nodeRef;

	 var result = remote.call("/api/external/caption/getSrtIdByVideoId?videoId="+nodeRef);
	   if (result.status == 200 && result != "{}")
	   {
	      var response = JSON.parse(result);
	      model.srtId = response.srtId;
	      if(model.srtId === undefined){
	    	  model.srtId = [];
	      };
	   }else{
		   model.srtId = [];
	   }	   
}
main();