function videoHTML(videoNumber, nodeId, srtId) {
	return '<video id="video-js" class="video-js vjs-default-skin" '
			+ 'controls preload="auto" width="1024" height="420" '
			+ 'poster="/res/components/video/images/pic.png"'
			+ 'data-setup=\'{"example_option":true}\'>'
			+ '\t<source src="http://localhost:8080/alfresco/s/api/external/node/content/workspace/SpaceStore/'
			+ nodeId
			+ '" type="video/mp4" /> \n'
			+ '\t\t<track id="video-srt" kind="captions" src="http://localhost:8080/alfresco/s/api/external/node/contentsrt/workspace/SpaceStore/'
			+ srtId
			+ '" srclang="it" label="Italian" default/>\n '
			+ '\t\t<p class="vjs-no-js">To view this video please enable JavaScript, and consider upgrading to a web browser that <a href="http://videojs.com/html5-video-support/" target="_blank">supports HTML5 video</a></p>\n'
			+ '</video>';
}
var player = null;
var _nodeId = null;
var _srtId = null;
var myData = [];
var message = "";
var content = "";
var timeupdate = null;
var currentid = null;
var contentsrtitem = null;
var isPlay = true;
var upjson = null;
var srtx = null;

$(document)
		.ready(
				function() {
					srtx = new SRT();
					_nodeId = $("#in2").val();
					_srtId = $("#in3").val();
					player = videojs('#video-js');

					$.ajax({
								url : "http://localhost:8080/alfresco/s/api/external/node/contentsrt/workspace/SpaceStore/"
										+ _srtId,
								cache : false,
								success : function(response) {
									srt = response;
									myData = srtx.parse(srt);
									player.on('timeupdate',function() {
														// $scope.$apply(function()
														// {
														timeupdate = player.currentTime();
														for ( var i in myData) {
															var ob = myData[i];
															var obStartTime = parseFloat(ob["time"]["start"]);
															var obEndTime = parseFloat(ob["time"]["end"]);
															// 要添加项的时间段正好在循环项时间段之间
															$("#editInputCa").val("");
															if (timeupdate >= obStartTime && timeupdate <= obEndTime) {
																currentid = i;
																var content = ob["content"].join(",");
																contentsrtitem = content;
																$("#editInputCa").val(contentsrtitem);
																return;
															}
														}
														// });
													});

									// 开始或恢复播放
									player.on('play', function() {
										console.log('开始/恢复播放');
										isPlay = true;
									});
									// 暂停播放
									player.on('pause', function() {
										console.log('暂停播放');
										isPlay = false;
									});
									upjson = function() {

										if (isPlay) {
											alert("必须暂停才可以编辑！");
										} else {
											console.log('update:'+currentid);
											editData(Number(currentid) + 1);
										}
									}
								}
							});
				});

function addData() {
	var c = myData.length;
	id = ++c;
	var endTime = parseFloat(1);
	var startTime = endTime - parseFloat(1);
	var duration = Math.round((endTime - startTime) * 1000) / 1000;
	var timeObject = {
		"start" : startTime,
		"end" : endTime,
		"duration" : duration
	};
	var item = {
		"id" : id,
		"time" : timeObject,
		"content" : [ content ]
	};
	srtx.addSrt(myData, item);
};
function lefttime() {
	player.pause();
	var currentTime = player.currentTime();
	currentTime = Math.round(currentTime);
	var newTime = 0;
	if (currentTime >= 1) {
		newTime = currentTime - 1;
	}
	player.currentTime(newTime);
};
function righttime() {
	player.pause();
	var currentTime = player.currentTime();
	currentTime = Math.round(currentTime);
	var newTime = 0;

	newTime = currentTime + 1;

	player.currentTime(newTime);
};
function editData(id) {
	var ob = myData[id-1];
	var obStartTime = parseFloat(ob["time"]["start"]);
	var obEndTime = parseFloat(ob["time"]["end"]);
	if (timeupdate >= obStartTime && timeupdate <= obEndTime) {
		srtx.editSrt(myData, id, $("#editInputCa").val());
	}else{
		addData();
	}
};

function deleteData(id) {
	srtx.delteSrt(myData, id);
};
function focusText() {
	player.pause();
	// $scope.contentsrtitem = $scope.content;

}
