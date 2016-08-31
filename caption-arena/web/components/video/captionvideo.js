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
var srtx = null;

var video = new Object();

$(document).ready(function() {
	var nodeRef = Alfresco.util.getQueryStringParameter('nodeRef');
		
    srtx = new SRT();
    player = videojs('#video-js');
    
    $.ajax({
        url : Alfresco.constants.PROXY_URI + "api/external/caption/getSrtIdByVideoId?videoId="+nodeRef,
        cache : false,
        success : function(response) {
        	console.log(response);
        	video.srtId = response.srtId;
        	$("#video-srt").attr("src",linkVideoSrt(video.srtId));
        	$("#video-js").find('source').attr("src",linkVideo(nodeRef));
        	videoSrtContent(video.srtId);
        }
    });
    
  
});

//	根据nodeRef获取srtId
function linkVideo(nodeRef){	
	var link = Alfresco.constants.PROXY_URI + "api/external/node/content/" + nodeRef;
	return link;	
}

//	根据srtId获取srt值
function linkVideoSrt(srtId){
	var srtlink = Alfresco.constants.PROXY_URI + "api/external/node/contentsrt/" + srtId;
	return srtlink;
}

function videoSrtContent(srtId){
	$.ajax({
        url : Alfresco.constants.PROXY_URI + "api/external/node/contentsrt/" + srtId,
        cache : false,
        success : function(response) {
            srt = response;
            myData = srtx.parse(srt);
            player.on('timeupdate',function() {
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
            });
            //开始或恢复播放
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
                    console.log("必须暂停才能编辑")
                } else {
                    console.log('update:'+currentid);
                    editData(Number(currentid) + 1);
                }
            };
        }
    });
}

//	增加数据
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
}

//	时间左移动
function lefttime() {
    player.pause();
    var currentTime = player.currentTime();
    currentTime = Math.round(currentTime);
    var newTime = 0;
    if (currentTime >= 1) {
        newTime = currentTime - 1;
    }
    player.currentTime(newTime);
}

//	时间右移动
function righttime() {
    player.pause();
    var currentTime = player.currentTime();
    currentTime = Math.round(currentTime);
    var newTime = 0;

    newTime = currentTime + 1;
    player.currentTime(newTime);
}

//  编辑字幕数据
function editData(id) {
    var ob = myData[id-1];
    var obStartTime = parseFloat(ob["time"]["start"]);
    var obEndTime = parseFloat(ob["time"]["end"]);
    if (timeupdate >= obStartTime && timeupdate <= obEndTime) {
        srtx.editSrt(myData, id, $("#editInputCa").val());
    }else{
        addData();
    }
}

//	删除数据
function deleteData(id) {
    srtx.delteSrt(myData, id);
}

// 	编辑输入框时，视频暂停
function focusText() {
    player.pause();
}


// 提交修改数据
function onSubmit(){
    console.log("提交");
    
    var updata = {
    	"srtId": video.srtId,
    	"srtContent": srtx.stringify(myData)
    }
    Alfresco.util.Ajax.request(
            {
               method: Alfresco.util.Ajax.POST,
   			   url: Alfresco.constants.PROXY_URI+ "api/external/caption/updateSrt",
   			   requestContentType : "application/json",
   			   dataObj: updata,
   				successCallback:
   				{
   					fn: function(){
   						console.log("提交成功");
   					},
   					scope: this
   				},
   				failureCallback:
   				{
   					fn: this.onArchiveRefresh_success,
   					scope: this
   				}
   			});
}
