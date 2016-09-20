/**
 * Created by zhaoziqn on 16/3/18.
 */
var SRT = function (file) {
    var self = this;
    if (file) {
        return self.parse(file);
    }
};

SRT.prototype.parse = function (file) {

    if (/\r/.test(file)) {
        file = file.replace(/\r/g, "").trim();
    }

    var srt = file.split("\n\n");

    for (var i = 0, len = srt.length; i < len; i++) {

        var fragments = srt[i].split("\n");
        srt[i] = {
            "id": parseInt(fragments[0]),
            "time": parseTime(fragments[1]),
            "content": fragments.splice(2)
        };
    }
    for (var j = 0; j < srt.length; j++) {
        if (srt[j] == "" || typeof(srt[j]) == "undefined") {
            srt.splice(j, 1);
            j--;
        }
    }
    return srt;
};

function parseTime(timeString) {
    // regexp
    var regexp = /([0-9]*):([0-9]*):([0-9]*),([0-9]*) --> ([0-9]*):([0-9]*):([0-9]*),([0-9]*)/;
    var time = new RegExp(regexp).exec(timeString);


    // start time
    var startHours = parseInt(time[1]) * 3600;
    var startMinutes = parseInt(time[2]) * 60;
    var startSeconds = parseInt(time[3]);
    var startMillisecs = Math.round(parseInt(time[4])) / 1000;
    //--------------------------------------------------------
    var startTime = startHours + startMinutes + startSeconds + startMillisecs;


    // end time
    var endHours = parseInt(time[5]) * 3600;
    var endMinutes = parseInt(time[6]) * 60;
    var endSeconds = parseInt(time[7]);
    var endMillisecs = Math.round(parseInt(time[8])) / 1000;
    //--------------------------------------------------------
    var endTime = endHours + endMinutes + endSeconds + endMillisecs;


    // duration
    var duration = Math.round((endTime - startTime) * 1000) / 1000;


    // result
    var timeObj = {"start": startTime, "end": endTime, "duration": duration};

    return timeObj;
}


//项SrtJson数组中加入项
SRT.prototype.addSrt = function (srt, srtitem) {
    // 获取要添加项的开始时间
    var currrentStartTime = parseFloat(srtitem["time"]["start"]);
    // 获取要添加项的结束时间
    var currentEndTime = parseFloat(srtitem["time"]["end"]);
    // 获取要添加项的翻译语言
    var currentContent = srtitem["content"].join(",");
    // 获取要添加项的语言字符串的长度
    var currentLength = currentContent.length;
    // 标识位，下面会用到，1：已经添加过或者有重叠时间段，0：表示要添加此项到数组
    var flag = 0;
    for (var i = 0; len = srt.length, i < len; i++) {
        var ob = srt[i];
        var obStartTime = parseFloat(ob["time"]["start"]);
        var obEndTime = parseFloat(ob["time"]["end"]);
        var content = ob["content"].join(",");
        // 要添加项的时间段正好在循环项时间段之间
        if (currrentStartTime >= obStartTime && currentEndTime <= obEndTime) {
            // 获取当前内在重贴内容中的索引
            var index = content.indexOf(currentContent);
            // 生成前面的内容
            var contentB = content.substring(0, index);
            var lengthB = contentB.length;
            // 生成后面的内容
            var contentA = content.substring((currentLength + lengthB));
            var durationB = Math.round((obStartTime - currrentStartTime) * 1000) / 1000;
            var durationA = Math.round((currentEndTime - obEndTime) * 1000) / 1000;
            var timeObjB = {"start": obStartTime, "end": currrentStartTime, "duration": durationB};
            var timeObjA = {"start": currentEndTime, "end": obEndTime, "duration": durationA};
            var itemB = {
                "id": 1,
                "time": timeObjB,
                "content": [contentB]
            };
            var itemA = {
                "id": 1,
                "time": timeObjA,
                "content": [contentA]
            };
            srt.splice(i, 1, itemB, srtitem, itemA);
            flag = 1;
            break;
        } else if ((currrentStartTime > obStartTime && currrentStartTime < obEndTime) && currentEndTime > obEndTime) {
            message = "时间段有冲突" + currrentStartTime + "-->" + currentEndTime + ".请从新定位时间";
            flag = 1;
            break;

        } else if ((currentEndTime > obStartTime && currentEndTime < obEndTime) && currrentStartTime < obStartTime) {
            message = "时间段有冲突" + currrentStartTime + "-->" + currentEndTime + ".请从新定位时间";
            flag = 1;
            break;
        }

    }
    // 如果没有重叠直接添加
    if (flag == 0) {
        srt.push(srtitem);
    }
    // 排序
    srt.sort(numAscSort);
    // 重置id
    for (var j in srt) {
        var ob2 = srt[j];
        ob2["id"] = parseInt(j) + 1;
        srt[j] = ob2;
    }

};

// 拓展了直接插入方式
SRT.prototype.inSertSrt = function (srt, srtitem) {
    var srtLength;
    srt.push(srtitem);
    // 排序
    srt.sort(timeAscSort);
    // 重置id
    for (var j in srt) {
        var ob2 = srt[j];
        ob2["id"] = parseInt(j) + 1;
        srt[j] = ob2;
    }
    // 重置结束时间
    for(var i = 0; srtLength = srt.length, i < srtLength-1; i++){
        var ob4 =  srt[i];
        var ob5 = srt[i+1];
        ob4["time"]["end"] = ob5["time"]["start"];
    }
};
// 编辑Srt
SRT.prototype.editSrt = function (srt, editId, con) {

    for (var i in srt) {
        var ob = srt[i];
        var id = ob["id"];
        if (editId == id) {
            ob["content"] = [con];
            break;
        }
    }
};
// 删除某一项
SRT.prototype.delteSrt = function (srt, deleteId) {
    for (var k in srt) {
        var ob3 = srt[k];
        var id = ob3["id"];
        if (deleteId == id) {
            srt.splice(k, 1);
            break;
        }
    }
};

// 将修改后的内容转化为srt格式
SRT.prototype.stringify = function (srt) {

    if (!srt) srt = this;

    var string = '';

    for (var i = 0, len = srt.length; i < len; i++) {
        string += srt[i].id + '\n' +
            stringifyTime(srt[i].time) + '\n' +
            srt[i].content.join("\n") +
            '\n\n';
    }

    return string;

    function stringifyTime(timeObj) {

        // 常量定义
        var startHours;
        var startMinutes;
        var startSeconds;
        var startMillisecs;
        var startTime;
        var endHours;
        var endMinutes;
        var endSeconds;
        var endMillisecs;
        var endTime;

        var start = timeObj.start;
        var end = timeObj.end;


        startHours = parseInt(start / 3600) % 24;
        startMinutes = parseInt(start / 60) % 60;
        startSeconds = parseInt(start) % 60;
        startMillisecs = parseInt(( start - (start | 0)) * 1000 + 0.5);
        startTime = (startHours < 10 ? "0" + startHours : startHours) + ":" +
            (startMinutes < 10 ? "0" + startMinutes : startMinutes) + ":" +
            (startSeconds < 10 ? "0" + startSeconds : startSeconds) + "," +
            (startMillisecs < 10 ? "00" + startMillisecs : (startMillisecs < 100 ? "0" + startMillisecs : startMillisecs ) );

        endHours = parseInt(end / 3600) % 24;
        endMinutes = parseInt(end / 60) % 60;
        endSeconds = parseInt(end) % 60;
        endMillisecs = parseInt(( end - (end | 0)) * 1000 + 0.5);
        endTime = (endHours < 10 ? "0" + endHours : endHours) + ":" +
            (endMinutes < 10 ? "0" + endMinutes : endMinutes) + ":" +
            (endSeconds < 10 ? "0" + endSeconds : endSeconds) + "," +
            (endMillisecs < 10 ? "00" + endMillisecs : (endMillisecs < 100 ? "0" + endMillisecs : endMillisecs ) );

        return startTime + ' --> ' + endTime;
    }
};

// 时间升序排序
function timeAscSort(itemBefore, itemAfter) {
    var itemBeforeStartTime = parseFloat(itemBefore["time"]["start"]);
    var itemAfterStartTime = parseFloat(itemAfter["time"]["start"]);
    var beforeNum = itemBeforeStartTime;
    var afterNum = itemAfterStartTime;
    return beforeNum - afterNum;
}
// 升序排序
function numAscSort(itemBefore, itemAfter) {
    var itemBeforeStartTime = parseFloat(itemBefore["time"]["start"]);
    var itemBeforeEndTime = parseFloat(itemBefore["time"]["end"]);
    var itemAfterStartTime = parseFloat(itemAfter["time"]["start"]);
    var itemAfterEndTime = parseFloat(itemAfter["time"]["end"]);
    var beforeNum = itemBeforeStartTime + itemBeforeEndTime;
    var afterNum = itemAfterStartTime + itemAfterEndTime;
    return beforeNum - afterNum;
}



