"use strict";
(function () {
    $.ajax({
        url: Alfresco.constants.NOAUTH_URI + "api/external/caption/getNewlyVideo",    //请求的url地址
        dataType: "json",   //返回格式为json
        type: "GET",   //请求方式
        success: function (response) {
            var wrapper = jQuery(".dg-wrapper");
            if (response.items) {
                var newestData = response.items;
                for (var j = 0, length = newestData.length; j < length; j++) {
                    newestData[j].videoNode = newestData[j].nodeId.substr(11);
                }
                for (var item in newestData) {
                    var nodeId = response.items[item].nodeId;
                    wrapper.find("a").eq(item).attr("link", "/caption/page/video?nodeRef=" + nodeId);
                    wrapper.find("img").eq(item).attr("src", imgLinkSite(newestData[item]));
                }
                var videoOneNodeId = wrapper.find("a").eq(0).attr("link");
                wrapper.find("a").eq(0).attr("href", videoOneNodeId);
            }
        }
    });
    getNewVideo();
    getKePu();
    getYuLe();
})();

(function () {
	jQuery(function () {
	      $('#dg-container').carrousel({
	          current: 0,
	          autoplay: false,
	          interval: 5000
	      });
	});
})();

function getNewVideo() {
    $.ajax({
        url: Alfresco.constants.NOAUTH_URI + "api/external/caption/wxGetVideoByNewlyOrType",    //请求的url地址
        dataType: "json",   //返回格式为json
        type: "GET",   //请求方式
        success: function (response) {
            var $newVideo = jQuery("#newVideo");
            var htmlLink = "";
            if (response.items) {
                var newestData = response.items;
                for (var j = 0, length = newestData.length; j < length; j++) {
                    newestData[j].videoNode = newestData[j].nodeId.substr(11);
                }
                for (var item in newestData) {
                    htmlLink += firstDisplay(newestData[item]);
                }
                $newVideo.html(htmlLink);
            }
        }
    });
}

function getKePu() {
    $.ajax({
        url: Alfresco.constants.NOAUTH_URI + "api/external/caption/wxGetVideoByNewlyOrType?type=0",    //请求的url地址
        dataType: "json",   //返回格式为json
        type: "GET",   //请求方式
        success: function (response) {
            var $kepu = jQuery("#kepu");
            var $kepuFisrtRow = jQuery("#kepuFisrtRow");
            var $kepuSecondRow = jQuery("#kepuSecondRow");
            var htmlLinkOne = "";
            var htmlLinkTwo = "";
            if (response.items) {
                var kePuData = response.items;
                for (var j = 0, length = kePuData.length; j < length; j++) {
                    kePuData[j].videoNode = kePuData[j].nodeId.substr(11);
                }
                for (var item in kePuData) {
                    if(item == 0){
                        $kepu.prepend(secondDisplay(kePuData[item]));
                    }
                    if(item == 1 || item == 2){
                        htmlLinkOne += secondDisplay(kePuData[item]);
                    }
                    if(item == 3 || item == 4){
                        htmlLinkTwo += secondDisplay(kePuData[item]);
                    }

                }
                $kepuFisrtRow.html(htmlLinkOne);
                $kepuSecondRow.html(htmlLinkTwo);
            }
        }
    });
}

function getYuLe() {
    $.ajax({
        url: Alfresco.constants.NOAUTH_URI + "api/external/caption/wxGetVideoByNewlyOrType?type=1",    //请求的url地址
        dataType: "json",   //返回格式为json
        type: "GET",   //请求方式
        success: function (response) {
            var $yele = jQuery("#yele");
            var $yeleFisrtRow = jQuery("#yeleFisrtRow");
            var $yeleSecondRow = jQuery("#yeleSecondRow");
            var htmlLinkOne = "";
            var htmlLinkTwo = "";
            if (response.items) {
                var yeLeData = response.items;
                for (var j = 0, length = yeLeData.length; j < length; j++) {
                    yeLeData[j].videoNode = yeLeData[j].nodeId.substr(11);
                }
                for (var item in yeLeData) {
                    if(item == 0){
                        $yele.prepend(secondDisplay(yeLeData[item]));
                    }
                    if(item == 1 || item == 2){
                        htmlLinkOne += secondDisplay(yeLeData[item]);
                    }
                    if(item == 3 || item == 4){
                        htmlLinkTwo += secondDisplay(yeLeData[item]);
                    }

                }
                $yeleFisrtRow.html(htmlLinkOne);
                $yeleSecondRow.html(htmlLinkTwo);
            }
        }
    });
}


function imgLinkSite(imgSite) {
    return "/caption/proxy/alfresco-noauth/api/node/workspace"+imgSite.videoNode+ "/content/thumbnails/imgpreview?c=queue&ph=true&lastModified="+imgSite.lastThumbnailModification[0];
}

function firstDisplay(items) {
    var html;
    html = "<div class='col-xs-3 col-md-3'>"
            + "<a href='/caption/page/video?nodeRef="+items.nodeId+"'>"
            + "<img src=" +imgLinkSite(items)+ "/>"
            + "<p class='desc text-center' >"+items.name+"</p>"
            + "</a></div>";
    return html
}

function secondDisplay(items) {
    var html;
    html = "<div class='col-xs-6 col-md-6'>"
        + "<a href='/caption/page/video?nodeRef="+items.nodeId+"'>"
        + "<img src=" +imgLinkSite(items)+ "/>"
        + "<p class='desc text-center' >"+items.name+"</p>"
        + "</a></div>";
    return html;
}