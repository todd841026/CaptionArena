<import resource="classpath:alfresco/site-webscripts/org/alfresco/callutils.js">

function main() {
	var nodeRef = getPageUrlParam("nodeRef");
	
	model.nodeRef = nodeRef;

	 var result = remote.call("/api/external/caption/getSrtIdByVideoId?videoId=" + nodeRef);
	 if (result.status == 200)
	 {
		  var response = JSON.parse(result);
		  if(response.retCode == 200){
			  model.srtId = response.srtId;
		  }
		  if(response.retCode == 201){
			  model.srtId = "";
		  };
	  }else{
		  model.srtId = "";
	  }
}
main();