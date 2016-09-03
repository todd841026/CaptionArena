"use strict";

(function () {
	jQuery(function () {
	      $('#dg-container').carrousel({
	          current: 0,
	          autoplay: false,
	          interval: 5000
	      });
	});

	$.ajax({
	    url: Alfresco.constants.NOAUTH_URI + "api/external/caption/getNewlyVideo",    //请求的url地址
	    dataType: "json",   //返回格式为json
	    async: true, //请求是否异步，默认为异步，这也是ajax重要特性
	    type: "GET",   //请求方式
	    success: function (response) {
	        if (response.items) {
	            for (var item in response.items) {
	                var nodeId = response.items[item].nodeId;
	                jQuery(".dg-wrapper").find("a").eq(item).attr("link", "/caption/page/video?nodeRef=" + nodeId);	          
	            }
	            var videoOneNodeId = jQuery(".dg-wrapper").find("a").eq(0).attr("link");
	            jQuery(".dg-wrapper").find("a").eq(0).attr("href", videoOneNodeId);
	        }
	    },
	});
})();