/**
 * Created by zhaoziqn on 16/3/18.
 */
var SRT = function( file ){
    var self = this;
    if(file) {
        return self.parse(file);
    }
};

SRT.prototype.parse = function( file )
{

    if( /\r/.test(file) ) {
        file = file.replace(/\r/g, "").trim();
    }

    var srt = file.split("\n\n");

    for (var i = 0, len = srt.length; i < len-1; i++) {

        var fragments = srt[i].split("\n");
        srt[i] = {
            "id" : parseInt(fragments[0]),
            "time" : parseTime(fragments[1]),
            "content" : fragments.splice(2)
        };
    }
    return srt;
};

function parseTime( timeString ) {

    // regexp
    var regexp = /([0-9]*):([0-9]*):([0-9]*),([0-9]*) --> ([0-9]*):([0-9]*):([0-9]*),([0-9]*)/;
    var time = new RegExp( regexp ).exec(timeString);
    
    

    // start time
    var startHours = parseInt(time[1]) * 3600;
    var startMinutes = parseInt(time[2]) * 60;
    var startSeconds = parseInt(time[3]);
    var startMillisecs = Math.round(parseInt(time[4]))/1000;
    //--------------------------------------------------------
    var startTime = startHours + startMinutes + startSeconds + startMillisecs;


    // end time
    var endHours = parseInt(time[5]) * 3600;
    var endMinutes = parseInt(time[6]) * 60;
    var endSeconds = parseInt(time[7]);
    var endMillisecs = Math.round(parseInt(time[8]))/1000;
    //--------------------------------------------------------
    var endTime = endHours + endMinutes + endSeconds + endMillisecs;


    // duration
    var duration = Math.round( (endTime - startTime) * 1000)/1000;


    // result
    var timeObj = { "start" : startTime, "end" : endTime, "duration" : duration };

    return timeObj;
};


//项SrtJson数组中加入项
SRT.prototype.addSrt = function(srt,srtitem)
{
    var currrentStartTime=parseFloat(srtitem["time"]["start"]);//获取要添加项的开始时间
    var  currentEndTime=parseFloat(srtitem["time"]["end"]);//获取要添加项的结束时间
    var  currentContent=srtitem["content"].join(",");//获取要添加项的翻译语言
    var currentLength=currentContent.length;//获取要添加项的语言字符串的长度
    var flag=0;//标识位，下面会用到，1：已经添加过或者有重叠时间段，0：表示要添加此项到数组
    for(var i in srt){
        var ob=srt[i];
        var obStartTime=parseFloat(ob["time"]["start"]);
        var  obEndTime=parseFloat(ob["time"]["end"]);
        var content=ob["content"].join(",");
        //要添加项的时间段正好在循环项时间段之间
        if(currrentStartTime>=obStartTime&&currentEndTime<=obEndTime){
            var index=content.indexOf(currentContent);//获取当前内在重贴内容中的索引
            var contentB=content.substring(0,index);//生成前面的内容
            var lengthB=contentB.length;
            var contentA=content.substring((currentLength+lengthB));//生成后面的内容
            var durationB= Math.round( (obStartTime - currrentStartTime) * 1000)/1000;
            var durationA= Math.round( (currentEndTime - obEndTime) * 1000)/1000;
            var timeObjB= { "start" : obStartTime, "end" : currrentStartTime, "duration" : durationB };
            var timeObjA= { "start" : currentEndTime, "end" : obEndTime, "duration" : durationA };
            var itemB={
                "id": 1,
                "time":timeObjB ,
                "content":[contentB]
            };
            var itemA={
                "id": 1,
                "time":timeObjA ,
                "content":[contentA]
            };
            srt.splice(i,1,itemB,srtitem,itemA);
            flag=1;
            break;
        }else if((currrentStartTime>obStartTime&&currrentStartTime<obEndTime)&&currentEndTime>obEndTime){
            message="时间段有冲突"+currrentStartTime+"-->"+currentEndTime+".请从新定位时间";
            flag=1;
            break;

        }else if((currentEndTime>obStartTime&&currentEndTime<obEndTime)&&currrentStartTime<obStartTime){
            message="时间段有冲突"+currrentStartTime+"-->"+currentEndTime+".请从新定位时间";
            flag=1;
            break;
        }

    }
    //如果没有重叠直接添加
    if(flag==0){
        srt.push(srtitem);
    }
    srt.sort(numAscSort);//排序
        //重置id
        for(var i in srt){
            var ob=srt[i];
            ob["id"]=parseInt(i)+1;
            srt[i]=ob;
        }

};
//编辑Srt
SRT.prototype.editSrt = function(srt,editId,con)
{

    for(var i in srt){
        var ob=srt[i];
        var id=ob["id"];
        if(editId==id){
            ob["content"]=[con];
            break;
        }
    }
};
//删除某一项
SRT.prototype.delteSrt = function(srt,deleteId)
{
    for(var i in srt){
        var ob=srt[i];
        var id=ob["id"];
        if(deleteId==id){
            srt.splice(i,1);
            break;
        }
    }
};

SRT.prototype.stringify = function( srt ) {

    if( !srt ) srt = this;

    var string = '';

    for(var i = 0, len = srt.length; i < len-1; i++) {
        string += srt[i].id+'\n'+
            stringifyTime(srt[i].time)+'\n'+
            srt[i].content.join("\n")+
            '\n\n';
    }

    return string;

    function stringifyTime( timeObj ) {

        var start = timeObj.start;
        var end = timeObj.end;

        startHours = parseInt( start / 3600 ) % 24;
        startMinutes = parseInt( start / 60 ) % 60;
        startSeconds = parseInt( start ) % 60;
        startMillisecs = parseInt(( start - (start|0))*1000+0.5 );
        startTime = (startHours < 10 ? "0"+startHours : startHours) + ":" +
            (startMinutes < 10 ? "0"+startMinutes : startMinutes) + ":" +
            (startSeconds < 10 ? "0"+startSeconds : startSeconds) + "," +
            (startMillisecs < 10 ? "00"+startMillisecs : (startMillisecs < 100 ? "0"+startMillisecs : startMillisecs ) );

        endHours = parseInt( end / 3600 ) % 24;
        endMinutes = parseInt( end / 60 ) % 60;
        endSeconds = parseInt( end ) % 60;
        endMillisecs = parseInt(( end - (end|0))*1000+0.5);
        endTime = (endHours < 10 ? "0"+endHours : endHours) + ":" +
            (endMinutes < 10 ? "0"+endMinutes : endMinutes) + ":" +
            (endSeconds < 10 ? "0"+endSeconds : endSeconds) + "," +
            (endMillisecs < 10 ? "00"+endMillisecs : (endMillisecs < 100 ? "0"+endMillisecs : endMillisecs ) );

        return startTime+' --> '+endTime;
    }




};

//升序排序
function numAscSort(itemBefore,itemAfter)
{
    var itemBeforeStartTime=parseFloat(itemBefore["time"]["start"]);
    var  itemBeforeEndTime=parseFloat(itemBefore["time"]["end"]);
    var itemAfterStartTime=parseFloat(itemAfter["time"]["start"]);
    var  itemAfterEndTime=parseFloat(itemAfter["time"]["end"]);
    var beforeNum=itemBeforeStartTime+itemBeforeEndTime;
    var afterNum=itemAfterStartTime+itemAfterEndTime;
    return beforeNum-afterNum;
}



