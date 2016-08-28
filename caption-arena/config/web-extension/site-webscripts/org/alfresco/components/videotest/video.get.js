<import resource="classpath:alfresco/site-webscripts/org/alfresco/callutils.js">

function main() {
	var nodeRef = getPageUrlParam("nodeRef");
	
		model.nodeRef = nodeRef;
	
	var videoUri = "/orange/pubservice/caption/getvideonode"+ nodeRef;
	var connector = remote.connect("alfresco");
	var result = connector.get(encodeURI(videoUri));
	if (result.status.code == status.STATUS_OK) {
		var resultJson = JSON.parse(result);
		var videoNode = resultJson.videoNode;
		var srtNode = resultJson.srtNode;
//		model.nodeId = "50347914-7ef0-4385-966a-41ff5d745a8c";
//		model.srtId = "b8c224d9-0aaa-4673-9c05-4de6640049be";
		model.nodeId = videoNode;
		model.srtId = srtNode;
	} else {

		model.nodeId = "affdd573-a8a6-4bff-be58-8d8b54bf9833";
		model.srtId = "b8c224d9-0aaa-4673-9c05-4de6640049be";
	}

}
main();