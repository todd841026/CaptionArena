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
					$('div.video-background').html(
							videoHTML("pic", _nodeId, _srtId));
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
function submitData() {
	var srtString = srtx.stringify(myData);
	Alfresco.util.Ajax.jsonRequest({
		method : Alfresco.util.Ajax.POST,
		url : Alfresco.constants.URL_SERVICECONTEXT
				+ "components/site/customise-pages",
		dataObj : {
			siteId : this.options.siteId,
			pages : pages,
			themeId : themeId
		},
		successCallback : {
			fn : function() {
				// Send the user to the newly configured dashboard
				document.location.href = Alfresco.constants.URL_PAGECONTEXT
						+ "site/" + this.options.siteId + "/dashboard";
			},
			scope : this
		},
		failureMessage : Alfresco.util.message("message.saveFailure",
				this.name),
		failureCallback : {
			fn : function() {
				// Hide spinner
				this.widgets.feedbackMessage.destroy();

				// Enable the buttons again
				this.widgets.saveButton.set("disabled", false);
				this.widgets.cancelButton.set("disabled", false);
			},
			scope : this
		}
	});

}

(function() {
	/**
	 * YUI Library aliases
	 */
	var Dom = YAHOO.util.Dom;

	/**
	 * Alfresco Slingshot aliases
	 */
	var $html = Alfresco.util.encodeHTML;
	
	/**
	 * TagComponent constructor.
	 * 
	 * @param {String}
	 *            htmlId The HTML id of the parent element
	 * @return {Alfresco.TagComponent} The new TagComponent instance
	 * @constructor
	 */
	Alfresco.CatpionComponent = function(htmlId) {
		Alfresco.CatpionComponent.superclass.constructor.call(this,
				"Alfresco.CatpionComponent", htmlId);

		// Decoupled event listeners
//		YAHOO.Bubbling.on("tagSelected", this.onTagSelected, this);

		return this;
	};

	YAHOO.extend(Alfresco.CatpionComponent, Alfresco.component.Base, {
		/**
		 * Object container for initialization options
		 * 
		 * @property options
		 * @type object
		 */
		options : {
			/**
			 * Current siteId.
			 * 
			 * @property siteId
			 * @type string
			 */
			srtId : "",

			/**
			 * ContainerId representing root container
			 * 
			 * @property containerId
			 * @type string
			 */
			videoId : ""
		},

		/**
		 * Fired by YUI when parent element is available for scripting.
		 * Registers event handler on "tagRefresh" event. If a component wants
		 * to refresh the tags component, they need to fire this event.
		 * 
		 * @method onReady
		 */
		onReady : function CatpionComponent_onReady() {
			this._registerDefaultActionHandler();

			// Create twister from our H2 tag
			Alfresco.util.createTwister(this.id + "-h2", "TagComponent");

			YAHOO.Bubbling.on("tagRefresh", this.onTagRefresh, this);
		},

		/**
		 * Registers a default action listener on <em>all</em> of the tag
		 * links in the component. Fires "tagSelected" event with the name of
		 * the tag that was selected.
		 * 
		 * To register for the event, interested components should do something
		 * like this: YAHOO.Bubbling.on("tagSelected", this.onTagSelected,
		 * this);
		 * 
		 * @method _registerDefaultActionHandler
		 */
		_registerDefaultActionHandler : function TagComponent_registerDefaultActionHandler() {
			YAHOO.Bubbling.addDefaultAction('tag-link', function(layer, args) {
						var link = args[1].target;
						if (link) {
							var tagName = link.firstChild.nodeValue;
							YAHOO.Bubbling.fire("tagSelected", {
										"tagname" : tagName
									});
						}
						return true;
					});
		},

		/**
		 * Handler for the "tagRefresh" event Issues a request to the repo to
		 * retrieve the latest tag data.
		 * 
		 * @method onTagRefresh
		 * @param e
		 *            {object} DomEvent
		 */
		onTagRefresh : function TagComponent_onRefresh(e) {
			var uri = YAHOO.lang
					.substitute(
							Alfresco.constants.PROXY_URI
									+ "api/tagscopes/site/{site}/{container}/tags?d={d}",
							{
								site : this.options.siteId,
								container : this.options.containerId,
								d : new Date().getTime()
							});

			Alfresco.util.Ajax.request({
						method : Alfresco.util.Ajax.GET,
						url : uri,
						successCallback : {
							fn : this.onTagsLoaded,
							scope : this
						},
						failureMessage : "Couldn't refresh tag data"
					});
		},

		/**
		 * Event handler for tagSelected event
		 * 
		 * @method onTagSelected
		 */
		onTagSelected : function TagComponent_onTagSelected(layer, args) {
			var tagname = args[1].tagname, candidates = YAHOO.util.Selector
					.query("a[rel='" + tagname.replace("'", "\\'") + "']",
							this.id), liTags = YAHOO.util.Selector.query("li",
					this.id);

			Dom.removeClass(liTags, "selected");
			if (candidates.length == 1) {
				Dom.addClass(candidates[0].parentNode.parentNode, "selected");
			}
		},

		/**
		 * Event handler that gets called when the tag data loads successfully.
		 * 
		 * @method onTagsLoaded
		 * @param e
		 *            {object} DomEvent
		 */
		onTagsLoaded : function TagComponent_onTagsLoaded(e) {
			var resp = YAHOO.lang.JSON.parse(e.serverResponse.responseText);
			if (resp && !YAHOO.lang.isUndefined(resp.tags)) {
				var html = '<li><span class="tag"><a href="#" class="tag-link" rel="-all-">'
						+ this.msg("label.all-tags") + '</a></span></li>', tags = resp.tags, tag, i, ii;

				for (i = 0, ii = tags.length; i < ii; i++) {
					tag = tags[i];
					html += this._generateTagMarkup(tag);
				}

				Dom.get(this.id + '-ul').innerHTML = html;
			}
		},

		/**
		 * Generates the HTML for a tag.
		 * 
		 * @method _generateTagMarkup
		 * @param tag
		 *            {Object} the tag to render
		 */
		_generateTagMarkup : function TagComponent__generateTagMarkup(tag) {
			var html = '<li><span class="tag">';
			html += '<a href="#" class="tag-link" rel="' + $html(tag.name)
					+ '">' + $html(tag.name) + '</a>&nbsp;(' + tag.count + ')';
			html += '</span></li>';
			return html;
		}
	});
})();
