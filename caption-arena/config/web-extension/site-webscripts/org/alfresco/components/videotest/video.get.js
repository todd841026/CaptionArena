function main() {
	var videoUri = "/orange/pubservice/caption/getvideonode";
	var connector = remote.connect("alfresco");
	var result = connector.get(encodeURI(videoUri));
	if (result.status.code == status.STATUS_OK) {
		var resultJson = JSON.parse(result);
		var videoNode = resultJson.videoNode;
		var srtNode = resultJson.srtNode;
		var widget = {
			id : "CaptionVideo",
			name : "Alfresco.CaptionVideo",
			options : {
				videoNodeRef : videoNode,
				srtNodeRef : srtNode
			}
		};
		model.widgets = [ widget ];
	} else {

		model.nodeId = "todddddd";
		model.srtId = "dddd";
	}

}
main();