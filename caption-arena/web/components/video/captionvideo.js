var player = null;
var myData = [];
var message = "";
var content = "";
var timeupdate = null;
var currentid = null;
var contentsrtitem = null;
var isPlay = true;
var isInsert = false;
var isInsertSuccess = false;
var srtx = null;
var video = {};


$(document).ready(function () {
	video.nodeId = Alfresco.util.getQueryStringParameter('nodeRef');

    $("#video-js").find('source').attr("src", linkVideo(video.nodeId));

    srtx = new SRT();
    player = videojs('#video-js');

    $.ajax({
        url: Alfresco.constants.NOAUTH_URI + "api/external/caption/getSrtIdByVideoId?videoId=" + video.nodeId,
        cache: false,
        success: function (response) {
            if (response.retCode == 200) {
            	video.isRelated = true;
                video.srtId = response.srtId;
                console.log("---有字幕关联---");
                videoSrtContent();
            } else if (response.retCode == 201) {
            	video.isRelated = false;
                console.log("---无字幕关联---");
                video.srtId = "";
                newVideoSrt();
            }
        }
    });
    $("#insert").click(function () {
        isPlay = false;
        isInsert = true;
        isInsertSuccess = false;
        $("#editInputCa").val("");
        console.log("---进入插入字幕模式---");
    });

    $("#btn_madeCa").click(function () {
        console.log("确认按钮被点击");
        if (!isPlay && isInsert && !isInsertSuccess) {
            timeupdate = player.currentTime();
            video.newContent = [];
            video.newContent.push($("#editInputCa").val());
            addData(timeupdate, video.newContent);
            isInsert = false;
            isInsertSuccess = true;
            console.log("---确认插入字幕---");

        } else if (!isPlay && isInsert && isInsertSuccess) {
            console.log("---同一处增加不可反复确认---");
        } else if (!isPlay && !isInsert) {
            console.log('update:' + (video.currentid+1));
            editData(Number(video.currentid) + 1);
        }
    });
});

//	根据nodeRef获取srtId
function linkVideo(nodeRef) {
    var link = Alfresco.constants.NOAUTH_URI + "api/external/node/content/" + nodeRef;
    return link;
}

//	根据srtId获取srt值
function linkVideoSrt(srtId) {
    var srtlink = Alfresco.constants.NOAUTH_URI + "api/external/node/contentsrt/" + srtId;
    return srtlink;
}

//字幕文件还未做关联，创建新的字幕文件
function newVideoSrt() {
    player.on('timeupdate', function () {
        timeupdate = player.currentTime();
        var dataLength = myData.length;
        console.log("dataLength=" + dataLength);
        console.log("---暂无插入字幕---");
        if (dataLength) {
            for (var i = 0; i < dataLength; i++) {
                var ob = myData[i];
                var obStartTime = parseFloat(ob["time"]["start"]);
                var obEndTime = parseFloat(ob["time"]["end"]);
                // 要添加项的时间段正好在循环项时间段之间
                $("#editInputCa").val("");
                if (timeupdate >= obStartTime && timeupdate <= obEndTime) {
                    video.currentid = i;
                    var content = ob["content"].join(",");
                    contentsrtitem = content;
                    $("#editInputCa").val(contentsrtitem);
                    return;
                }
            }
        } else {
            console.log("---暂无字幕---");
        }
    });
    //开始或恢复播放
    player.on('play', function () {
        console.log('开始/恢复播放');
        isPlay = true;
        isInsertSuccess = false;
    });
    // 暂停播放
    player.on('pause', function () {
        console.log('暂停播放');
        isPlay = false;
        isInsertSuccess = false;
    });
}

function videoSrtContent() {
    $.ajax({
        url: Alfresco.constants.NOAUTH_URI + "api/external/caption/getSrtContent?srtId=" + video.srtId,
        cache: false,
        success: function (response) {
            var srt = response;
            console.log(srt);
            myData = srtx.parse(srt);
            player.on('timeupdate', function () {
                timeupdate = player.currentTime();
                for (var i = 0; dataLength = myData.length, i < dataLength; i++) {
                    var ob = myData[i];
                    var obStartTime = parseFloat(ob["time"]["start"]);
                    var obEndTime = parseFloat(ob["time"]["end"]);
                    // 要添加项的时间段正好在循环项时间段之间
                    $("#editInputCa").val("");
                    if (timeupdate >= obStartTime && timeupdate <= obEndTime) {
                        video.currentid = i;
                        var content = ob["content"].join(",");
                        contentsrtitem = content;
                        $("#editInputCa").val(contentsrtitem);
                        return;
                    }
                }
            });
            //开始或恢复播放
            player.on('play', function () {
                console.log('开始/恢复播放');
                isPlay = true;
            });
            // 暂停播放
            player.on('pause', function () {
                console.log('暂停播放');
                isPlay = false;
            });
        }
    });
}

//增加数据
function addData(timeupdate, contents) {
    var c = myData.length;
    var id, endTime, startTime, timeObject = {}, item = {};
    if (c > 0) {
        id = c;
        endTime = player.duration();
        startTime = timeupdate;
        duration = Math.round((endTime - startTime) * 1000) / 1000;
        timeObject = {
            "start": parseFloat(startTime),
            "end": parseFloat(endTime),
            "duration": parseFloat(duration)
        };
        item = {
            "id": id,
            "time": timeObject,
            "content": contents
        };
        srtx.inSertSrt(myData, item);
        console.log(myData);
    } else if (c === 0) {
        id = 1;
        endTime = player.duration();
        startTime = timeupdate;
        duration = Math.round((endTime - startTime) * 1000) / 1000;
        timeObject = {
            "start": parseFloat(startTime),
            "end": parseFloat(endTime),
            "duration": parseFloat(duration)
        };
        item = {
            "id": id,
            "time": timeObject,
            "content": contents
        };
        myData.push(item);
        console.log(myData);
    }
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
    var ob = myData[id - 1];
    var obStartTime = parseFloat(ob["time"]["start"]);
    var obEndTime = parseFloat(ob["time"]["end"]);
    var contents = $("#editInputCa").val().split(",");
    if (timeupdate >= obStartTime && timeupdate <= obEndTime) {
        srtx.editSrt(myData, id, $("#editInputCa").val());
    } else {
        addData(timeupdate, contents);
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
function onSubmit() {
    console.log("提交");

    var updateSrt = {
        "srtId": video.srtId,
        "srtContent": srtx.stringify(myData)
    };
    
    var newSrt = {
            "videoId": video.nodeId,
            "srtContent": srtx.stringify(myData)
        };

    console.log(srtx.stringify(myData));
    if(video.isRelated){
	    Alfresco.util.Ajax.request(
	        {
	            method: Alfresco.util.Ajax.POST,
	            url: Alfresco.constants.NOAUTH_URI + "api/external/caption/updateSrt",
	            requestContentType: "application/json",
	            dataObj: updateSrt,
	            successCallback: {
	                fn: function () {
	                    console.log("提交成功");
	                },
	                scope: this
	            },
	            failureCallback: {
	                fn: this.onArchiveRefresh_success,
	                scope: this
	            }
	        });
    }else{
    	Alfresco.util.Ajax.request(
    	        {
    	            method: Alfresco.util.Ajax.POST,
    	            url: Alfresco.constants.NOAUTH_URI + "api/external/caption/saveSrt",
    	            requestContentType: "application/json",
    	            dataObj: newSrt,
    	            successCallback: {
    	                fn: function () {
    	                    console.log("提交成功");
    	                },
    	                scope: this
    	            },
    	            failureCallback: {
    	                fn: this.onArchiveRefresh_success,
    	                scope: this
    	            }
    	        });
    }
}
