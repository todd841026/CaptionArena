(function (){
	jQuery(function () {
	      $('#dg-container').carrousel({
	          current: 0,
	          autoplay: false,
	          interval: 5000
	      });
	});

    $.ajax({
        url: "/share/proxy/alfresco/" + "api/external/caption/getNewlyVideo",    //请求的url地址
        dataType: "json",   //返回格式为json
        async: true, //请求是否异步，默认为异步，这也是ajax重要特性
        type: "GET",   //请求方式
        beforeSend: function() {
            //请求前的处理
        },
        success: function(response) {
        	console.log(response);
        	if(response.items){
        		for(var item in response.items){
        			nodeId = response.items[item].nodeId;
        			jQuery(".dg-wrapper").find("a").eq(item).attr("href","/caption/page/video?nodeRef="+nodeId);
        		}
        	}
            //请求成功时处理
        },
        complete: function() {
            //请求完成的处理
        },
        error: function() {
            //请求出错处理
        }
    });

	jQuery(function () {
	      $('#dg-container').carrousel({
	          current: 0,
	          autoplay: false,
	          interval: 5000
	      });
	});
})();