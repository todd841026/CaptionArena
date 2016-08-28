<import resource="classpath:alfresco/site-webscripts/org/alfresco/callutils.js">

function main() {
	var nodeRef = getPageUrlParam("nodeRef","");
	var videoUri = "/orange/pubservice/caption/getvideonode"+ nodeRef;
	var connector = remote.connect("alfresco");
	var result = connector.get(encodeURI(videoUri));
	if (result.status.code == status.STATUS_OK) {
		var resultJson = JSON.parse(result);
		var videoNode = resultJson.videoNode;
		var srtNode = resultJson.srtNode;
//		model.nodeId = "50347914-7ef0-4385-966a-41ff5d745a8c";
//		model.srtId = "b8c224d9-0aaa-4673-9c05-4de6640049be";
		if(videoNode == "" ){
			model.nodeId = "50347914-7ef0-4385-966a-41ff5d745a8c";
			model.srtId = "e76000dc-ca13-46e7-9eaa-bc9eaed0fddd";
		}else{
			model.nodeId = videoNode;
			model.srtId = srtNode;
		}
		
	} else {

		model.nodeId = "50347914-7ef0-4385-966a-41ff5d745a8c";
		model.srtId = "b8c224d9-0aaa-4673-9c05-4de6640049be";
	}

}
main();