/**
 * Copyright (C) 2005-2012 Alfresco Software Limited.
 *
 * This file is part of Alfresco
 *
 * Alfresco is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Alfresco is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with Alfresco. If not, see <http://www.gnu.org/licenses/>.
 */

/**
 * Document Library Actions module
 *
 * @namespace Alfresco.doclib
 * @class Alfresco.doclib.Actions
 */
(function()
{
   /**
    * YUI Library aliases
    */
   var Dom = YAHOO.util.Dom,
      Event = YAHOO.util.Event;

   /**
    * Alfresco Slingshot aliases
    */
   var $html = Alfresco.util.encodeHTML,
      $combine = Alfresco.util.combinePaths,
      $siteURL = Alfresco.util.siteURL,
      $isValueSet = Alfresco.util.isValueSet;

   /**
    * Cloud folder picker dialog.
    * This will be defined globally, because the sync actions are available in the actions panel as well as in the
    * sync panel. And clicking those actions from different panels creates different panels in different contexts.
    */
   var cloudFolderPicker;

   /**
    * Alfresco.doclib.Actions implementation
    */
   Alfresco.doclib.Actions = {};
   Alfresco.doclib.Actions.prototype =
   {
      /**
       * Current actions view type: set by owning class to "browse" or "details".
       *
       * @property actionsView
       * @type string
       */
      actionsView: null,

      /**
       * Register a Document Library action via Bubbling event
       *
       * @method onRegisterAction
       * @param layer {object} Event fired (unused)
       * @param args {array} Event parameters (actionName, fn)
       */
      onRegisterAction: function dlA_onRegisterAction(layer, args)
      {
         var obj = args[1];
         if (obj && $isValueSet(obj.actionName) && $isValueSet(obj.fn))
         {
            this.registerAction(obj.actionName, obj.fn);
         }
         else
         {
            Alfresco.logger.error("DL_onRegisterAction: Custom action registion invalid: " + obj);
         }
      },

      /**
       * Register a Document Library action
       *
       * @method registerAction
       * @param actionName {string} Action name
       * @param fn {function} Handler function
       * @return {boolean} Success status of registration
       */
      registerAction: function DL_registerAction(actionName, fn)
      {
         if ($isValueSet(actionName) && $isValueSet(fn))
         {
            this.constructor.prototype[actionName] = fn;
            return true;
         }
         return false;
      },

      /**
       * Renders a single action for a given record.
       * Callers should then use
       * <pre>
       *    YAHOO.lang.substitute(actionHTML, this.getActionUrls(record))
       * </pre>
       * on the final concatenated HTML for multiple actions to populate placeholder URLs.
       *
       * @method renderAction
       * @param p_action {object} Object literal representing the node
       * @param p_record {string} Optional siteId override for site-based locations
       * @return {string} HTML containing action markup
       */
      renderAction: function dlA_renderAction(p_action, p_record)
      {
         var urlContext = Alfresco.constants.URL_RESCONTEXT + "components/documentlibrary/actions/",
           iconStyle = 'style="background-image:url(' + urlContext + '{icon}-16.png)" ',
           actionTypeMarkup =
           {
              "link": '<div class="{id}{additionalCssClasses}"><a title="{label}" class="simple-link" href="{href}" ' + iconStyle + '{target}><span>{label}</span></a></div>',
              "pagelink": '<div class="{id}{additionalCssClasses}"><a title="{label}" class="simple-link" href="{pageUrl}" ' + iconStyle + '><span>{label}</span></a></div>',
              "javascript": '<div class="{id}{additionalCssClasses}" id="{jsfunction}"><a title="{label}" class="action-link" href="#"' + iconStyle + '><span>{label}</span></a></div>'
           };

         // Store quick look-up for client-side actions
         p_record.actionParams[p_action.id] = p_action.params;

         var markupParams =
         {
            "id": p_action.id,
            "icon": p_action.icon,
            "label": $html(Alfresco.util.substituteDotNotation(this.msg(p_action.label), p_record)),
            "additionalCssClasses" : p_action.additionalCssClasses ? " " + p_action.additionalCssClasses : ""
         };
         
         if (p_action.lastActionInSubgroup)
         {
            markupParams.additionalCssClasses = " alf-action-group-end";
         }

         // Parameter substitution for each action type
         if (p_action.type === "link")
         {
            if (p_action.params.href)
            {
               markupParams.href = Alfresco.util.substituteDotNotation(p_action.params.href, p_record);
               markupParams.target = p_action.params.target ? "target=\"" + p_action.params.target + "\"" : "";
            }
            else
            {
               Alfresco.logger.warn("Action configuration error: Missing 'href' parameter for actionId: ", p_action.id);
            }
         }
         else if (p_action.type === "pagelink")
         {
            if (p_action.params.page)
            {
               markupParams.pageUrl = Alfresco.util.substituteDotNotation(p_action.params.page, p_record);

               /**
                * If the page starts with a "{" character we're going to assume it's a placeholder variable
                * that will be resolved by the getActionsUrls() function. In which case, we do not want to
                * use the $siteURL() function here as that will result in a double-prefix.
                */
               if (p_action.params.page.charAt(0) !== "{")
               {
                  var recordSiteName = $isValueSet(p_record.location.site) ? p_record.location.site.name : null;
                  markupParams.pageUrl = $siteURL(markupParams.pageUrl,
                  {
                     site: recordSiteName
                  });
               }
            }
            else
            {
               Alfresco.logger.warn("Action configuration error: Missing 'page' parameter for actionId: ", p_action.id);
            }
         }
         else if (p_action.type === "javascript")
         {
            if (p_action.params["function"])
            {
               markupParams.jsfunction = p_action.params["function"];
            }
            else
            {
               Alfresco.logger.warn("Action configuration error: Missing 'function' parameter for actionId: ", p_action.id);
            }
         }

         return YAHOO.lang.substitute(actionTypeMarkup[p_action.type], markupParams);
      },

      /**
       * The urls to be used when creating links in the action cell
       *
       * @method getActionUrls
       * @param recordData {object} Object literal representing the node
       * @param siteId {string} Optional siteId override for site-based locations
       * @return {object} Object literal containing URLs to be substituted in action placeholders
       */
      getActionUrls: function dlA_getActionUrls(record, siteId)
      {
         var jsNode = record.jsNode,
            nodeRef = jsNode.isLink ? jsNode.linkedNode.nodeRef : jsNode.nodeRef,
            nodeRef = jsNode.isLink && !$isValueSet(nodeRef) ? "invalidlink" : nodeRef,
            strNodeRef = nodeRef.toString(),
            nodeRefUri = nodeRef.uri,
            contentUrl = jsNode.contentURL,
            workingCopy = record.workingCopy || {},
            recordSiteId = $isValueSet(record.location.site) ? record.location.site.name : null,
            fnPageURL = Alfresco.util.bind(function(page)
            {
               return Alfresco.util.siteURL(page,
               {
                  site: YAHOO.lang.isString(siteId) ? siteId : recordSiteId
               });
            }, this),
            actionUrls =
            {
               downloadUrl: $combine(Alfresco.constants.PROXY_URI, contentUrl) + "?a=true",
               viewUrl:  $combine(Alfresco.constants.PROXY_URI, contentUrl) + "\" target=\"_blank",
               documentDetailsUrl: fnPageURL("document-details?nodeRef=" + strNodeRef),
               folderDetailsUrl: fnPageURL("folder-details?nodeRef=" + strNodeRef),
               editMetadataUrl: fnPageURL("edit-metadata?nodeRef=" + strNodeRef),
               inlineEditUrl: fnPageURL("inline-edit?nodeRef=" + strNodeRef),
               managePermissionsUrl: fnPageURL("manage-permissions?nodeRef=" + strNodeRef),
               manageTranslationsUrl: fnPageURL("manage-translations?nodeRef=" + strNodeRef),
               workingCopyUrl: fnPageURL("document-details?nodeRef=" + (workingCopy.workingCopyNodeRef || strNodeRef)),
               workingCopySourceUrl: fnPageURL("document-details?nodeRef=" + (workingCopy.sourceNodeRef || strNodeRef)),
               cloudViewUrl: $combine(Alfresco.constants.URL_SERVICECONTEXT, "cloud/cloudUrl?nodeRef=" +strNodeRef)
            };

         actionUrls.sourceRepositoryUrl = this.viewInSourceRepositoryURL(record, actionUrls) + "\" target=\"_blank";

         return actionUrls;
      },


      /**
       * Helper for actions of type "javascript" to get the node's action descriptor with params resolved (unless resolve is set to false).
       *
       * @method getAction
       * @param record {object} Object literal representing one file or folder to be actioned
       * @param owner {HTMLElement} The action html element
       * @param resolve {Boolean} (Optional) Set to false if the action param's {} shouldn't get resolved
       */
      getAction: function dlA_getAction(record, owner, resolve)
      {
         // Sets the actionId to the first class name rather than the full class name which can include additional classes
         var actionId = owner.className.match(/([^\s])*/)[0];
         var action = Alfresco.util.findInArray(record.actions, actionId, "id") || {};

         if (resolve === false)
         {
            // Return action without resolved parameters
            return action;
         }
         else
         {
            // Resolve action's parameters before returning them
            action = Alfresco.util.deepCopy(action);
            var params = action.params || {};
            for (var key in params)
            {
               params[key] = YAHOO.lang.substitute(params[key], record, function getActionParams_substitute(p_key, p_value, p_meta)
               {
                  return Alfresco.util.findValueByDotNotation(record, p_key);
               });
            }
            return action;
         }
      },

      /**
       * Tries to get a common parent nodeRef for an action that requires one.
       *
       * @method getParentNodeRef
       * @param record {object} Object literal representing one file or folder to be actioned
       * @return {string|null} Parent nodeRef or null
       */
      getParentNodeRef: function dlA_getParentNodeRef(record)
      {
         var nodeRef = null;

         if (YAHOO.lang.isArray(record))
         {
            try
            {
               nodeRef = this.doclistMetadata.parent.nodeRef;
            }
            catch (e)
            {
               nodeRef = null;
            }

            if (nodeRef === null)
            {
               for (var i = 1, j = record.length, sameParent = true; i < j && sameParent; i++)
               {
                  sameParent = (record[i].parent.nodeRef == record[i - 1].parent.nodeRef)
               }

               nodeRef = sameParent ? record[0].parent.nodeRef : this.doclistMetadata.container;
            }
         }
         else
         {
            nodeRef = record.parent.nodeRef;
         }

         return nodeRef;
      },

      /**
       * Record metadata.
       *
       * @override
       * @method onActionDetails
       * @param record {object} Object literal representing one file or folder to be actioned
       */
      onActionDetails: function dlA_onActionDetails(record)
      {
         var scope = this,
            nodeRef = record.nodeRef,
            jsNode = record.jsNode;

         // Intercept before dialog show
         var doBeforeDialogShow = function dlA_onActionDetails_doBeforeDialogShow(p_form, p_dialog)
         {
            // Dialog title
            var fileSpan = '<span class="light">' + $html(record.displayName) + '</span>';

            Alfresco.util.populateHTML(
               [ p_dialog.id + "-dialogTitle", scope.msg("edit-details.title", fileSpan) ]
            );

            // Edit metadata link button
            this.widgets.editMetadata = Alfresco.util.createYUIButton(p_dialog, "editMetadata", null,
            {
               type: "link",
               label: scope.msg("edit-details.label.edit-metadata"),
               href: $siteURL("edit-metadata?nodeRef=" + nodeRef)
            });
         };

         var templateUrl = YAHOO.lang.substitute(Alfresco.constants.URL_SERVICECONTEXT + "components/form?itemKind={itemKind}&itemId={itemId}&destination={destination}&mode={mode}&submitType={submitType}&formId={formId}&showCancelButton=true",
         {
            itemKind: "node",
            itemId: nodeRef,
            mode: "edit",
            submitType: "json",
            formId: "doclib-simple-metadata"
         });

         // Using Forms Service, so always create new instance
         var editDetails = new Alfresco.module.SimpleDialog(this.id + "-editDetails-" + Alfresco.util.generateDomId());

         editDetails.setOptions(
         {
            width: "auto",
            zIndex: 1001, // This needs to be high so it works in full screen mode
            templateUrl: templateUrl,
            actionUrl: null,
            destroyOnHide: true,
            doBeforeDialogShow:
            {
               fn: doBeforeDialogShow,
               scope: this
            },
            onSuccess:
            {
               fn: function dlA_onActionDetails_success(response)
               {
                  // Reload the node's metadata
                  var webscriptPath = "components/documentlibrary/data";
                  if ($isValueSet(this.options.siteId))
                  {
                     webscriptPath += "/site/" + encodeURIComponent(this.options.siteId)
                  }
                  Alfresco.util.Ajax.request(
                  {
                     url: $combine(Alfresco.constants.URL_SERVICECONTEXT, webscriptPath, "/node/", jsNode.nodeRef.uri) + "?view=" + this.actionsView,
                     successCallback:
                     {
                        fn: function dlA_onActionDetails_refreshSuccess(response)
                        {
                           var record = response.json.item
                           record.jsNode = new Alfresco.util.Node(response.json.item.node);

                           // Fire "renamed" event
                           YAHOO.Bubbling.fire(record.node.isContainer ? "folderRenamed" : "fileRenamed",
                           {
                              file: record
                           });

                           // Fire "tagRefresh" event
                           YAHOO.Bubbling.fire("tagRefresh");

                           // Display success message
                           Alfresco.util.PopupManager.displayMessage(
                           {
                              text: this.msg("message.details.success")
                           });

                           // Refresh the document list...
                           this._updateDocList.call(this);
                        },
                        scope: this
                     },
                     failureCallback:
                     {
                        fn: function dlA_onActionDetails_refreshFailure(response)
                        {
                           Alfresco.util.PopupManager.displayMessage(
                           {
                              text: this.msg("message.details.failure")
                           });
                        },
                        scope: this
                     }
                  });
               },
               scope: this
            },
            onFailure:
            {
               fn: function dLA_onActionDetails_failure(response)
               {
                  var failureMsg = this.msg("message.details.failure");
                  if (response.json && response.json.message.indexOf("Failed to persist field 'prop_cm_name'") !== -1)
                  {
                     failureMsg = this.msg("message.details.failure.name");
                  }
                  Alfresco.util.PopupManager.displayMessage(
                  {
                     text: failureMsg
                  });
               },
               scope: this
            }
         }).show();
      },

      /**
       * Locate record.
       *
       * @method onActionLocate
       * @param record {object} Object literal representing one file or folder to be actioned
       */
      onActionLocate: function dlA_onActionLocate(record)
      {
         var jsNode = record.jsNode,
            path = record.location.path,
            file,
            recordSiteName = $isValueSet(record.location.site) ? record.location.site.name : null;
         if (jsNode.isLink)
         {
             file = $isValueSet(jsNode.linkedNode.properties) ? jsNode.linkedNode.properties.name : null;
             if(file === null) {
                Alfresco.util.PopupManager.displayMessage(
                {
                   text: this.msg("message.actions.failure.locate")
                });
             }
         }
         else
         {
             file = record.displayName;
         }

         if ($isValueSet(this.options.siteId) && recordSiteName !== this.options.siteId)
         {
            window.location = $siteURL((recordSiteName === null ? "repository" : "documentlibrary") + "?file=" + encodeURIComponent(file) + "&path=" + encodeURIComponent(path),
            {
               site: recordSiteName
            });
         }
         else
         {
            this.options.highlightFile = file;

            // Change active filter to path
            YAHOO.Bubbling.fire("changeFilter",
            {
               filterId: "path",
               filterData: path
            });
         }
      },

      /**
       * Delete record.
       *
       * @method onActionDelete
       * @param record {object} Object literal representing the file or folder to be actioned
       */
      onActionDelete: function dlA_onActionDelete(record)
      {
         var me = this,
            jsNode = record.jsNode,
            content = jsNode.isContainer ? "folder" : "document",
            displayName = record.displayName,
            isCloud = (this.options.syncMode === "CLOUD"),
            zIndex = 0;

         var displayPromptText = this.msg("message.confirm.delete", displayName);
         if (jsNode.hasAspect("sync:syncSetMemberNode"))
         {
            if (isCloud)
            {
        	   if (jsNode.hasAspect("sync:deleteOnPrem"))
               {
          	      displayPromptText += this.msg("actions.synced.cloud." + content + ".delete.on.prem", displayName);
               }
               else
               {
          	      displayPromptText += this.msg("actions.synced.cloud." + content + ".delete", displayName);
               }
            }
            else
            {
                displayPromptText += this.msg("actions.synced." + content + ".delete", displayName);
            }
         }

         if (this.fullscreen !== undefined && ( this.fullscreen.isWindowOnly || Dom.hasClass(this.id, 'alf-fullscreen')))
         {
            zIndex = 1000;
         }

         //MNT-11084 : Full screen/window view: Actions works incorrectly;
         var parent = undefined;
         if (Dom.hasClass(this.id, 'alf-true-fullscreen'))
         {
            parent = Dom.get(this.id);
         }

         var buttons =
         [
            {
               text: this.msg("button.delete"),
               handler: function dlA_onActionDelete_delete()
               {
                  this.destroy();
                  me._onActionDeleteConfirm.call(me, record);
               }
            },
            {
               text: this.msg("button.cancel"),
               handler: function dlA_onActionDelete_cancel()
               {
                  this.destroy();
               },
               isDefault: true
            }
         ];
			
         if (jsNode.hasAspect("sync:syncSetMemberNode"))
         {
            displayPromptText += this.msg("actions.synced.remove-sync");
            // The code further on down assumes that the unsync button is first
            buttons.unshift({
               text: this.msg("button.unsync"),
               handler: function dlA_onActionCloudUnsync_unsync()
               {
                  var requestDeleteRemote = isCloud ? false : Dom.getAttribute("requestDeleteRemote", "checked");
                    
                  try
                  {
                     Alfresco.util.Ajax.request(
                     {
                        url: Alfresco.constants.PROXY_URI + "enterprise/sync/syncsetmembers/" + record.jsNode.nodeRef.uri + "?requestDeleteRemote=" + requestDeleteRemote,
                        method: Alfresco.util.Ajax.DELETE,
                        successCallback:{
                           fn: function cloudSync_onCloudUnsync_success()
                           {
                           
                              // MNT-15233: Delete Document pop-up isn't closed after Remove sync action is performed
                              var displayPrompt = Dom.get('prompt');
                              var buttonUnsync = displayPrompt.getElementsByTagName('button')[0];
                              buttonUnsync.style.display = 'none';
                              
                              YAHOO.Bubbling.fire("metadataRefresh");
                              Alfresco.util.PopupManager.displayMessage(
                              {
                                 text: me.msg("message.unsync.success")
                              })
                           },
                           scope: me
                        },
                        failureMessage: me.msg("message.unsync.failure")
                     });
                  }
                  catch (e) {}
               }
            });
         }
         
         Alfresco.util.PopupManager.displayPrompt(
         {
            title: this.msg("actions." + content + ".delete"),
            text: displayPromptText,
            noEscape: true,
            buttons: buttons,
            zIndex: zIndex
         }, parent);
      },

      /**
       * Delete record confirmed.
       *
       * @method _onActionDeleteConfirm
       * @param record {object} Object literal representing the file or folder to be actioned
       * @private
       */
      _onActionDeleteConfirm: function dlA__onActionDeleteConfirm(record)
      {
         var jsNode = record.jsNode,
            path = record.location.path,
            fileName = record.location.file,
            filePath = $combine(path, fileName),
            displayName = record.displayName,
            nodeRef = jsNode.nodeRef,
            parentNodeRef = this.getParentNodeRef(record);
            var display =
            {
               zIndex: this.fullscreen !== undefined && ( Dom.hasClass(this.id, 'alf-true-fullscreen') || Dom.hasClass(this.id, 'alf-fullscreen')) ? 1000 : 0,
               parentElement: Dom.hasClass(this.id, 'alf-true-fullscreen') ? Dom.get(this.id) : undefined
            }

         this.modules.actions.genericAction(
         {
            success:
            {
               activity:
               {
                  siteId: this.options.siteId,
                  activityType: jsNode.isContainer ? "folder-deleted" : "file-deleted",
                  page: "documentlibrary",
                  activityData:
                  {
                     fileName: fileName,
                     path: path,
                     nodeRef: nodeRef.toString(),
                     parentNodeRef: parentNodeRef.toString()
                  }
               },
               event:
               {
                  name: jsNode.isContainer ? "folderDeleted" : "fileDeleted",
                  obj:
                  {
                     path: filePath
                  }
               },
               display : display,
               message: this.msg("message.delete.success", displayName),
               callback:
               {
                  fn: function successDeleteCallback(response, obj)
                  {
                      if (this.totalRecords)
                      {
                          this.totalRecords -= response.json.successCount;
                      }
                  },
                  scope: this
               }
            },
            failure:
            {
               display : display,
               message: this.msg("message.delete.failure", displayName)
            },
            webscript:
            {
               method: Alfresco.util.Ajax.DELETE,
               name: "file/node/{nodeRef}",
               params:
               {
                  nodeRef: nodeRef.uri
               }
            },
            wait:
            {
               message: this.msg("message.multiple-delete.please-wait")
            }
         });
      },

      /**
       * Edit Offline.
       * NOTE: Placeholder only, clients MUST implement their own editOffline action
       *
       * @method onActionEditOffline
       * @param record {object} Object literal representing the file or folder to be actioned
       */
      onActionEditOffline: function dlA_onActionEditOffline(record)
      {
         Alfresco.logger.error("onActionEditOffline", "Abstract implementation not overridden");
      },

      /**
       * Valid online edit mimetypes, mapped to application ProgID.
       * Currently allowed are Microsoft Office 2003 and 2007 mimetypes for Excel, PowerPoint and Word only
       *
       * @property onlineEditMimetypes
       * @type object
       */
      onlineEditMimetypes:
      {
         "application/msword": "Word.Document",
         "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "Word.Document",
         "application/vnd.ms-word.document.macroenabled.12": "Word.Document",
         "application/vnd.openxmlformats-officedocument.wordprocessingml.template": "Word.Document",
         "application/vnd.ms-word.template.macroenabled.12": "Word.Document",

         "application/vnd.ms-powerpoint": "PowerPoint.Slide",
         "application/vnd.openxmlformats-officedocument.presentationml.presentation": "PowerPoint.Slide",
         "application/vnd.ms-powerpoint.presentation.macroenabled.12": "PowerPoint.Slide",
         "application/vnd.openxmlformats-officedocument.presentationml.slideshow": "PowerPoint.Slide",
         "application/vnd.ms-powerpoint.slideshow.macroenabled.12": "PowerPoint.Slide",
         "application/vnd.openxmlformats-officedocument.presentationml.template": "PowerPoint.Slide",
         "application/vnd.ms-powerpoint.template.macroenabled.12": "PowerPoint.Slide",
         "application/vnd.ms-powerpoint.addin.macroenabled.12": "PowerPoint.Slide",
         "application/vnd.openxmlformats-officedocument.presentationml.slide": "PowerPoint.Slide",
         "application/vnd.ms-powerpoint.slide.macroEnabled.12": "PowerPoint.Slide",

         "application/vnd.ms-excel": "Excel.Sheet",
         "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "Excel.Sheet",
         "application/vnd.openxmlformats-officedocument.spreadsheetml.template": "Excel.Sheet",
         "application/vnd.ms-excel.sheet.macroenabled.12": "Excel.Sheet",
         "application/vnd.ms-excel.template.macroenabled.12": "Excel.Sheet",
         "application/vnd.ms-excel.addin.macroenabled.12": "Excel.Sheet",
         "application/vnd.ms-excel.sheet.binary.macroenabled.12": "Excel.Sheet",
         "application/vnd.visio": "Visio.Drawing"
      },

      /**
       * Edit Online.
       *
       * @method onActionEditOnline
       * @param record {object} Object literal representing file or folder to be actioned
       */
      onActionEditOnline: function dlA_onActionEditOnline(record)
      {
         //MNT-8609 Edit online fails for files which URL is too long
         if (!$isValueSet(record.onlineEditUrl))
         {
            record.onlineEditUrl = Alfresco.util.onlineEditUrl(this.doclistMetadata.custom.vtiServer, record.location);
         }


         // Check if either the URL's length or the encoded URL's length is greater than 256 (see MNT-13279):
         if (record.onlineEditUrl.length > 256 || (encodeURI(record.onlineEditUrl)).length > 256)
         {
            //Try to use alternate edit online URL: http://{host}:{port}/{context}/_IDX_SITE_{site_uuid}/_IDX_NODE_{document_uuid}/{document_name}
            Alfresco.util.Ajax.request(
            {
               method: Alfresco.util.Ajax.GET,
               url: Alfresco.constants.PROXY_URI+"/api/sites/" + record.location.site.name,
               successCallback:
               {
                  fn: function(response)
                  {
                     var siteUUID = response.json.node.split("/").pop();
                     var docUUID = record.nodeRef.split("/").pop();
                     record.onlineEditUrl = record.onlineEditUrl.split(record.location.site.name)[0] + "_IDX_SITE_" + siteUUID + "/_IDX_NODE_" + docUUID + "/" + record.displayName;
                     if (record.onlineEditUrl.length > 256)
                     {
                        var ext = record.displayName.split(".").pop();
                        var recordName = record.displayName.split(".")[0];
                        var exceed = record.onlineEditUrl.length - 256;
                        record.onlineEditUrl = record.onlineEditUrl.replace(record.displayName, recordName.substring(0, recordName.length - exceed - 1) + "." + ext);
                     }
                     if (encodeURI(record.onlineEditUrl).length > 256)
                     {
                        // If we get here it might be that the filename contains a lot of space characters that (when converted to %20) 
                        // would lead to a total encoded URL length that's greater than 256 characters.
                        // Since it's a very rare case we'll just reduce the record's display name (from the URL) 
                        // to a (presumably) safe size of 5 characters plus extension.
                        var ext = record.displayName.split(".").pop();
                        var recordName = record.onlineEditUrl.split("/").pop();
                        var recordNameReduced = recordName.split(".")[0].substring(0, 5) + "." + ext;
                        record.onlineEditUrl = record.onlineEditUrl.replace(recordName, recordNameReduced);
                     }
                     this.actionEditOnlineInternal(record);
                  },
                  scope: this
               },
               failureCallback:
               {
                  fn: function(response)
                  {
                     this.actionEditOnlineInternal(record);
                  },
                  scope: this
               }
            });
         }
         else
         {
            this.actionEditOnlineInternal(record);
         }
      },

      actionEditOnlineInternal: function dlA_onActionEditOnline(record)
      {
         if (record.onlineEditUrl.length > 256 || encodeURI(record.onlineEditUrl).length > 256)
         {
            Alfresco.util.PopupManager.displayMessage(
            {
               text: this.msg("message.edit-online.office.path.failure")
            });
         }
         else if (this._launchOnlineEditor(record))
         {
            YAHOO.Bubbling.fire("metadataRefresh");
         }
         else
         {
            Alfresco.util.PopupManager.displayMessage(
            {
               text: this.msg("message.edit-online.office.failure")
            });
         }
      },

      /**
       * Opens the appropriate Microsoft Office application for online editing.
       * Supports: Microsoft Office 2003, 2007 & 2010.
       *
       * @method Alfresco.util.sharePointOpenDocument
       * @param record {object} Object literal representing file or folder to be actioned
       * @return {boolean} True if the action was completed successfully, false otherwise.
       */
      _launchOnlineEditor: function dlA__launchOnlineEditor(record)
      {
         var controlProgID = "SharePoint.OpenDocuments",
            jsNode = record.jsNode,
            loc = record.location,
            mimetype = jsNode.mimetype,
            appProgID = null,
            activeXControl = null,
            extensionMap =
            {
               doc: "application/msword",
               docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
               docm: "application/vnd.ms-word.document.macroenabled.12",
               dotx: "application/vnd.openxmlformats-officedocument.wordprocessingml.template",
               dotm: "application/vnd.ms-word.template.macroenabled.12",

               ppt: "application/vnd.ms-powerpoint",
               pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
               pptm: "application/vnd.ms-powerpoint.presentation.macroenabled.12",
               ppsx: "application/vnd.openxmlformats-officedocument.presentationml.slideshow",
               ppsm: "application/vnd.ms-powerpoint.slideshow.macroenabled.12",
               potx: "application/vnd.openxmlformats-officedocument.presentationml.template",
               potm: "application/vnd.ms-powerpoint.template.macroenabled.12",
               ppam: "application/vnd.ms-powerpoint.addin.macroenabled.12",
               sldx: "application/vnd.openxmlformats-officedocument.presentationml.slide",
               sldm: "application/vnd.ms-powerpoint.slide.macroEnabled.12",

               xls: "application/vnd.ms-excel",
               xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
               xltx: "application/vnd.openxmlformats-officedocument.spreadsheetml.template",
               xlsm: "application/vnd.ms-excel.sheet.macroenabled.12",
               xltm: "application/vnd.ms-excel.template.macroenabled.12",
               xlam: "application/vnd.ms-excel.addin.macroenabled.12",
               xlsb: "application/vnd.ms-excel.sheet.binary.macroenabled.12"
            };

         if (!Alfresco.util.validLocationForOnlineEdit(loc))
         {
            Alfresco.util.PopupManager.displayPrompt(
            {
               text: this.msg("actions.editOnline.invalid", loc.file)
            });
            return true;
         }

         // Try to resolve the record to an application ProgID; by mimetype first, then file extension.
         if (this.onlineEditMimetypes.hasOwnProperty(mimetype))
         {
            appProgID = this.onlineEditMimetypes[mimetype];
         }
         else
         {
            var extn = Alfresco.util.getFileExtension(record.location.file);
            if (extn !== null)
            {
               extn = extn.toLowerCase();
               if (extensionMap.hasOwnProperty(extn))
               {
                  mimetype = extensionMap[extn];
                  if (this.onlineEditMimetypes.hasOwnProperty(mimetype))
                  {
                     appProgID = this.onlineEditMimetypes[mimetype];
                  }
               }
            }
         }

         if (appProgID !== null)
         {
            // Ensure we have the record's onlineEditUrl populated
            if (!$isValueSet(record.onlineEditUrl))
            {
               record.onlineEditUrl = Alfresco.util.onlineEditUrl(this.doclistMetadata.custom.vtiServer, loc);
            }

            if (YAHOO.env.ua.ie > 0)
            {
               return this._launchOnlineEditorIE(controlProgID, record, appProgID);
            }

            if ((YAHOO.env.ua.chrome > 0) && !Alfresco.util.isSharePointPluginInstalled())
            {
               var extn = Alfresco.util.getFileExtension(loc.file);
               if (null !== extn)
               {
                  var protocolHandler = this.getProtocolForFileExtension(extn.toLowerCase());
                  return this._launchOnlineEditorChrome(protocolHandler, record.onlineEditUrl);
               }
            }

            if (Alfresco.util.isSharePointPluginInstalled())
            {
               return this._launchOnlineEditorPlugin(record, appProgID);
            }
            else
            {
               Alfresco.util.PopupManager.displayPrompt(
               {
                  text: this.msg("actions.editOnline.failure", loc.file)
               });
               return false;
            }
         }

         // No success in launching application via ActiveX control; launch the WebDAV URL anyway
         return window.open(record.onlineEditUrl, "_blank");
      },

      _launchOnlineEditorChrome: function dlA__launchOnlineEditorChrome(protocolHandler, url)
      {
          var protocolUrl = protocolHandler + ':ofe%7Cu%7C' + url;
          var protocolHandlerPresent = false;

          var input = document.createElement('input');
          var inputTop = document.body.scrollTop + 10;
          input.setAttribute('style', 'z-index: 1000; background-color: rgba(0, 0, 0, 0); border: none; outline: none; position: absolute; left: 10px; top: '+inputTop+'px;');
          document.getElementsByTagName("body")[0].appendChild(input);
          input.focus();
          input.onblur = function() {
              protocolHandlerPresent = true;
          };
          location.href = protocolUrl;
          setTimeout(function()
          {
              input.onblur = null;
              input.remove();
              if(!protocolHandlerPresent)
              {
                  Alfresco.util.PopupManager.displayMessage(
                  {
                      text: this.msg('message.edit-online.supported_office_version_required')
                  });
              }
          }, 500);
      },

      getProtocolForFileExtension: function(fileExtension)
      {
         var msProtocolNames =
         {
            'doc'  : 'ms-word',
            'docx' : 'ms-word',
            'docm' : 'ms-word',
            'dot'  : 'ms-word',
            'dotx' : 'ms-word',
            'dotm' : 'ms-word',
            'xls'  : 'ms-excel',
            'xlsx' : 'ms-excel',
            'xlsb' : 'ms-excel',
            'xlsm' : 'ms-excel',
            'xlt'  : 'ms-excel',
            'xltx' : 'ms-excel',
            'xltm' : 'ms-excel',
            'xlsm' : 'ms-excel',
            'ppt'  : 'ms-powerpoint',
            'pptx' : 'ms-powerpoint',
            'pot'  : 'ms-powerpoint',
            'potx' : 'ms-powerpoint',
            'potm' : 'ms-powerpoint',
            'pptm' : 'ms-powerpoint',
            'potm' : 'ms-powerpoint',
            'pps'  : 'ms-powerpoint',
            'ppsx' : 'ms-powerpoint',
            'ppam' : 'ms-powerpoint',
            'ppsm' : 'ms-powerpoint',
            'sldx' : 'ms-powerpoint',
            'sldm' : 'ms-powerpoint',
         };
         return msProtocolNames[fileExtension];
      },

      /**
       * Opens the appropriate Microsoft Office application for online editing.
       * Supports: Microsoft Office 2003, 2007 & 2010.
       *
       * @method Alfresco.util.sharePointOpenDocument
       * @param record {object} Object literal representing file or folder to be actioned
       * @return {boolean} True if the action was completed successfully, false otherwise.
       */
      _launchOnlineEditorIE: function dlA__launchOnlineEditorIE(controlProgID, record, appProgID)
      {
         // Try each version of the SharePoint control in turn, newest first
         try
         {
            if (appProgID === "Visio.Drawing")
               throw ("Visio should be invoked using activeXControl.EditDocument2.");
            activeXControl = new ActiveXObject(controlProgID + ".3");
            return activeXControl.EditDocument3(window, record.onlineEditUrl, true, appProgID);
         }
         catch(e)
         {
            try
            {
               activeXControl = new ActiveXObject(controlProgID + ".2");
               return activeXControl.EditDocument2(window, record.onlineEditUrl, appProgID);
            }
            catch(e1)
            {
               try
               {
                  activeXControl = new ActiveXObject(controlProgID + ".1");
                  return activeXControl.EditDocument(record.onlineEditUrl, appProgID);
               }
               catch(e2)
               {
                  // Do nothing
               }
            }
         }
         return false;
      },

      /**
       * Opens the appropriate Microsoft Office application for online editing.
       * Supports: Microsoft Office 2010 & 2011 for Mac.
       *
       * @method Alfresco.util.sharePointOpenDocument
       * @param record {object} Object literal representing file or folder to be actioned
       * @return {boolean} True if the action was completed successfully, false otherwise.
       */
      _launchOnlineEditorPlugin: function dlA__launchOnlineEditorPlugin(record, appProgID)
      {
         var plugin = document.getElementById("SharePointPlugin");
         if (plugin == null && Alfresco.util.isSharePointPluginInstalled())
         {
            var pluginMimeType = null;
            if (YAHOO.env.ua.webkit && Alfresco.util.isBrowserPluginInstalled("application/x-sharepoint-webkit"))
               pluginMimeType = "application/x-sharepoint-webkit";
            else
               pluginMimeType = "application/x-sharepoint";
            var pluginNode = document.createElement("object");
            pluginNode.id = "SharePointPlugin";
            pluginNode.type = pluginMimeType;
            pluginNode.width = 0;
            pluginNode.height = 0;
            pluginNode.style.setProperty("visibility", "hidden", "");
            document.body.appendChild(pluginNode);
            plugin = document.getElementById("SharePointPlugin");

            if (!plugin)
            {
               return false;
            }
         }

         try
         {
            if (appProgID === "Visio.Drawing")
               throw ("Visio should be invoked using activeXControl.EditDocument2.");
            return plugin.EditDocument3(window, record.onlineEditUrl, true, appProgID);
         }
         catch(e)
         {
            try
            {
               return plugin.EditDocument2(window, record.onlineEditUrl, appProgID);
            }
            catch(e1)
            {
               try
               {
                  return plugin.EditDocument(record.onlineEditUrl, appProgID);
               }
               catch(e2)
               {
                  return false;
               }
            }
         }
      },

      /**
       * Edit Online with AOS.
       *
       * @method onActionEditOnlineAos
       * @param record {object} Object literal representing file or folder to be actioned
       */
      onActionEditOnlineAos: function dlA_onActionEditOnlineAos(record)
      {
          var internalEditOnlineAos = function dlA_internalEditOnlineAos(response)
          {
              var jsonNode = JSON.parse(response.serverResponse.responseText);
              if (jsonNode)
              {
                  var node = jsonNode.item.node;
                  if (node.isLocked)
                  {
                      var checkedOut = Alfresco.util.arrayContains(node.aspects,"cm:checkedOut");
                      var lockOwner = node.properties["cm:lockOwner"]; 
                      var differentLockOwner = lockOwner.userName !== Alfresco.constants.USERNAME;

                      // If locked for offline editing, ask for user's confirmation to continue with online editing
                      if (checkedOut && differentLockOwner)
                      { 
                          this._onAlreadyLockedConfirmation(record, lockOwner);
                      }
                      else
                      {
                          this._triggerEditOnlineAos(record);
                      }
                  }
                  else
                  {
                      this._triggerEditOnlineAos(record);
                  }
              }
          };
          
          // Populate the node details before triggering the action, in case the isLocked state changed
          Alfresco.util.Ajax.request(
          {
              url: Alfresco.constants.PROXY_URI + "slingshot/doclib2/node/"  + record.nodeRef.replace('://', '/'),
              successCallback:
              {
                  fn: internalEditOnlineAos,
                  scope: this
              }
          });
      },
      
      _onAlreadyLockedConfirmation: function dlA_onAlreadyLockedConfirmation(record, lockOwner)
      {
          var me = this;
          Alfresco.util.PopupManager.displayPrompt(
          {
              title: this.msg('message.edit-online-aos.edit_offline_locked.title', lockOwner.displayName.length > 0 ? lockOwner.displayName : lockOwner.userName ),
              text: this.msg('message.edit-online-aos.edit_offline_locked.message'),
              buttons: [
                  {
                      text: this.msg('message.edit-online-aos.edit_offline_locked.confirm'),
                      handler: function dlA_onAlreadyLockedConfirmation_confirm()
                      {
                          this.destroy();
                          me._triggerEditOnlineAos(record);
                      }
                  },
                  {
                      text: this.msg('message.edit-online-aos.edit_offline_locked.cancel'),
                      handler: function dlA_onAlreadyLockedConfirmation_cancel()
                      {
                          this.destroy();
                      },
                      isDefault: true
                  }
              ]
          });
      },
      
      _triggerEditOnlineAos: function dlA_triggerEditOnlineAos(record)
      {
         if (!$isValueSet(record.onlineEditUrlAos))
         {
            record.onlineEditUrlAos = Alfresco.util.onlineEditUrlAos(this.doclistMetadata.custom.aos, record);
         }

         var fileExtension = Alfresco.util.getFileExtension(record.location.file);
         var protocolHandler = this.getProtocolForFileExtension(fileExtension);

         if(protocolHandler === undefined)
         {
            Alfresco.logger.error("onActionEditOnlineAos", "No protocol handler available for file extension.");
            return;
         }

         var officeLauncher = new EmbeddedOfficeLauncher();

         if(officeLauncher.isIOS())
         {
            this._aos_launchOfficeOnIos(officeLauncher, protocolHandler, record.onlineEditUrlAos);
            return;
         }

         // detect if we are on a supported operating system
         if(!officeLauncher.isWin() && !officeLauncher.isMac())
         {
             Alfresco.util.PopupManager.displayMessage(
             {
                text: this.msg('message.edit-online-aos.no_supported_environment')
             });
             return;
         }

         // if we have a working PlugIn (ActiveX or NPAPI), use it. Otherwise we use the protocol handler (e.g. Chrome w/o PlugIn)
         if(officeLauncher.isAvailable())
         {
             this._aos_launchOfficeByPlugin(officeLauncher, record.onlineEditUrlAos);
         }
         else
         {
             this._aos_tryToLaunchOfficeByMsProtocolHandler(officeLauncher, protocolHandler, record.onlineEditUrlAos);
         }

         return;
      },

      _aos_launchOfficeByPlugin: function dlA__aos_launchOfficeByPlugin(officeLauncher, url)
      {
         var checker, dlg;
         var isNotIE = (officeLauncher.isFirefox() || officeLauncher.isChrome() || officeLauncher.isSafari());
         if (!officeLauncher.EditDocument(url))
         {
            // check if the Plug-In has been blocked
            if (officeLauncher.isControlNotActivated() && isNotIE)
            {
               checker = window.setInterval(function()
               {
                  if (officeLauncher.isControlActivated())
                  {
                     window.clearInterval(checker);
                     dlg.destroy();
                     window.setTimeout(function()
                     {
                        if (!officeLauncher.EditDocument(url))
                        {
                           if (officeLauncher.getLastControlResult() !== -2)
                           {
                              var errorDetails = officeLauncher.getLastControlResult() !== false ? ' (Error code: ' + officeLauncher.getLastControlResult() + ')' : '';
                              Alfresco.util.PopupManager.displayMessage(
                              {
                                          text: this.msg('message.edit-online-aos.starting_office_failed') + errorDetails
                              });
                           }
                        }
                        else
                        {
                           YAHOO.Bubbling.fire("metadataRefresh");
                        }
                     }, 50);
                  }
               }, 250);
               var dlg = new YAHOO.widget.SimpleDialog('prompt',
               {
                        close: false,
                        constraintoviewport: true,
                        draggable: false,
                        effect: null,
                        modal: true,
                        visible: true,
                        zIndex: 9999
               });
               var dlgMessageKey = 'message.edit-online-aos.plugin_blocked.body.firefox';
               if(officeLauncher.isFirefox())
               {
                   dlgMessageKey = 'message.edit-online-aos.plugin_blocked.body.firefox';
               }
               else if(officeLauncher.isChrome())
               {
                   dlgMessageKey = 'message.edit-online-aos.plugin_blocked.body.chrome';
               }
               else if(officeLauncher.isSafari())
               {
                   dlgMessageKey = 'message.edit-online-aos.plugin_blocked.body.safari';
               }
               dlg.setHeader(this.msg('message.edit-online-aos.plugin_blocked.caption'));
               dlg.setBody(this.msg(dlgMessageKey));
               dlg.cfg.queueProperty('buttons', [ {
                     text: this.msg('message.edit-online-aos.plugin_blocked.button_dismiss'),
                     handler: function() {
                        window.clearInterval(checker);
                        this.destroy();
                     },
                     isDefault: true
               }]);
               dlg.render(document.body);
               dlg.center();
               dlg.show();
            }
            else
            {
               if (officeLauncher.getLastControlResult() !== -2)
               {
                  // error message only required if user did not cancel (result === -2)
                  var errorDetails = officeLauncher.getLastControlResult() !== false ? ' (Error code: ' + officeLauncher.getLastControlResult() + ')' : '';
                  Alfresco.util.PopupManager.displayMessage(
                  {
                     text: this.msg('message.edit-online-aos.starting_office_failed') + errorDetails
                  });
               }
            }
         }
         else
         {
            YAHOO.Bubbling.fire("metadataRefresh");
         }
      },

      _aos_tryToLaunchOfficeByMsProtocolHandler: function dlA__aos_tryToLaunchOfficeByMsProtocolHandler(officeLauncher, protocolHandler, url)
      {
          var protocolUrl = protocolHandler + ':ofe%7Cu%7C' + url;
          var protocolHandlerPresent = false;

          var input = document.createElement('input');
          var inputTop = document.body.scrollTop + 10;
          input.setAttribute('style', 'z-index: 1000; background-color: rgba(0, 0, 0, 0); border: none; outline: none; position: absolute; left: 10px; top: '+inputTop+'px;');
          document.getElementsByTagName("body")[0].appendChild(input);
          input.focus();
          input.onblur = function() {
              protocolHandlerPresent = true;
          };
          input.context = this;
          location.href = protocolUrl;
          setTimeout(function()
          {
              input.onblur = null;
              input.remove();
              if(!protocolHandlerPresent)
              {
                  Alfresco.util.PopupManager.displayMessage(
                  {
                      text: input.context.msg('message.edit-online-aos.supported_office_version_required')
                  });
              }
          }, 500);
      },

      _aos_launchOfficeOnIos: function dlA__aos_launchOfficeOnIos(officeLauncher, protocolHandler, url)
      {
         var protocolUrl = protocolHandler + ':ofe%7Cu%7C' + officeLauncher.encodeUrl(url);
         var iframe = document.createElement('iframe');
         iframe.setAttribute('style', 'display: none; height: 0; width: 0;');
         document.getElementsByTagName('body')[0].appendChild(iframe);
         iframe.src = protocolUrl;
      },

      getProtocolForFileExtension: function(fileExtension)
      {
         var msProtocolNames =
         {
            'doc'  : 'ms-word',
            'docx' : 'ms-word',
            'docm' : 'ms-word',
            'dot'  : 'ms-word',
            'dotx' : 'ms-word',
            'dotm' : 'ms-word',
            'xls'  : 'ms-excel',
            'xlsx' : 'ms-excel',
            'xlsb' : 'ms-excel',
            'xlsm' : 'ms-excel',
            'xlt'  : 'ms-excel',
            'xltx' : 'ms-excel',
            'xltm' : 'ms-excel',
            'xlsm' : 'ms-excel',
            'ppt'  : 'ms-powerpoint',
            'pptx' : 'ms-powerpoint',
            'pot'  : 'ms-powerpoint',
            'potx' : 'ms-powerpoint',
            'potm' : 'ms-powerpoint',
            'pptm' : 'ms-powerpoint',
            'potm' : 'ms-powerpoint',
            'pps'  : 'ms-powerpoint',
            'ppsx' : 'ms-powerpoint',
            'ppam' : 'ms-powerpoint',
            'ppsm' : 'ms-powerpoint',
            'sldx' : 'ms-powerpoint',
            'sldm' : 'ms-powerpoint',
         };
         return msProtocolNames[fileExtension];
      },

      /**
       * Simple Repo Action.
       *
       * Accepts the following <param> declarations from the <action> config:
       *
       * action - The name of  the repo action (i.e. extract-metadata)
       * success - The name of the callback function
       * successMessage - The msg key to use when the repo action succeded (i.e. message.extract-metadata.success)
       * failure - The name of the callback function
       * failureMessage - The msg key to use when the repo action failed (i.e. message.extract-metadata.failure)
       * * - All remaining parameters will be treated as repo action parameters
       *
       * Example:
       * <action id="addAspectExample" type="javascript">
       *    <param name="function">onActionSimpleRepoAction</param>
       *    <param name="action">add-features</param>
       *    <param name="aspect-name">rd:status</param>
       *    <param name="successMessage">addAspectExample.success</param>
       *    <param name="failureMessage">addAspectExample.failure</param>
       * </action>
       *
       * @method onActionSimpleRepoAction
       * @param record {object} Object literal representing the file or folder to be actioned
       */
      onActionSimpleRepoAction: function dlA_onActionSimpleRepoAction(record, owner)
      {
         //ACE-2470 : Clone: Clicking multiple times the simple Workflow approval menu item gives unexpected results.
         if (owner.title.indexOf("_deactivated") == -1)
         {
         // Get action params
         var params = this.getAction(record, owner).params,
            displayName = record.displayName,
            namedParams = ["function", "action", "success", "successMessage", "failure", "failureMessage", "async"],
            repoActionParams = {};

         for (var name in params)
         {
            if (params.hasOwnProperty(name) && !Alfresco.util.arrayContains(namedParams, name))
            {
               repoActionParams[name] = params[name];
            }
         }

         //Deactivate action
         var ownerTitle = owner.title;
         owner.title = owner.title + "_deactivated";

         var async = params.async ? "async=" + params.async : null;

         // Prepare genericAction config
         var config =
         {
            success:
            {
               event:
               {
                  name: "metadataRefresh",
                  obj: record
               }
            },
            failure:
            {
               message: this.msg(params.failureMessage, displayName),
               fn: function showAction()
               {
                  owner.title = ownerTitle;
               },
               scope: this
            },
            webscript:
            {
               method: Alfresco.util.Ajax.POST,
               stem: Alfresco.constants.PROXY_URI + "api/",
               name: "actionQueue",
               queryString: async
            },
            config:
            {
               requestContentType: Alfresco.util.Ajax.JSON,
               dataObj:
               {
                  actionedUponNode: record.nodeRef,
                  actionDefinitionName: params.action,
                  parameterValues: repoActionParams
               }
            }
         };

         // Add configured success callbacks and messages if provided
         if (YAHOO.lang.isFunction(this[params.success]))
         {
            config.success.callback =
            {
               fn: this[params.success],
               obj: record,
               scope: this
            };
         }
         if (params.successMessage)
         {
            config.success.message = this.msg(params.successMessage, displayName);
         }

         // Acd configured failure callback and message if provided
         if (YAHOO.lang.isFunction(this[params.failure]))
         {
            config.failure.callback =
            {
               fn: this[params.failure],
               obj: record,
               scope: this
            };
         }
         if (params.failureMessage)
         {
            config.failure.message = this.msg(params.failureMessage, displayName);
         }

         // Execute the repo action
         this.modules.actions.genericAction(config);
         }
      },

      /**
       * Form Dialog Action.
       *
       * Accepts <param name=""></param> declarations in share config xml for the following names:
       * success - The name of the callback function
       * successMessage - The msg key to use when the repo action succeded (i.e. message.extract-metadata.success)
       * failure - The name of the callback function
       * failureMessage - The msg key to use when the repo action failed (i.e. message.extract-metadata.failure)
       * ...and any other parameter mathing the properties for GET /service/components/form webscript
       * i.e itemid, itemkind, mode etc...
       *
       * @method onActionFormDialog
       * @param record {object} Object literal representing the file or folder to be actioned
       */
      onActionFormDialog: function dlA_onActionFormDialog(record, owner)
      {
         var config = this.generateConfigForFormDialogAction(record, owner);

         // Finally display form as dialog
         Alfresco.util.PopupManager.displayForm(config);
      },
      
      /**
       * Form Dialog Action with disabling submit buttons.
       *
       * Accepts <param name=""></param> declarations in share config xml for the following names:
       * success - The name of the callback function
       * successMessage - The msg key to use when the repo action succeded (i.e. message.extract-metadata.success)
       * failure - The name of the callback function
       * failureMessage - The msg key to use when the repo action failed (i.e. message.extract-metadata.failure)
       * ...and any other parameter mathing the properties for GET /service/components/form webscript
       * i.e itemid, itemkind, mode etc...
       *
       * @method onActionFormDialog
       * @param record {object} Object literal representing the file or folder to be actioned
       */
      onActionFormDialogWithSubmitDisable: function dlA_onActionFormDialogWithSubmitDisable(record, owner)
      {
         var config = this.generateConfigForFormDialogAction(record, owner);
         
         config.properties.disableSubmitButton = true;

         // Finally display form as dialog
         Alfresco.util.PopupManager.displayForm(config);
      },

      generateConfigForFormDialogAction: function dlA_generateConfigForFormDialogAction(record, owner)
      {
         // Get action & params and start create the config for displayForm
         var action = this.getAction(record, owner),
            params = action.params,
            config =
            {
               title: this.msg(action.label)
            },
            displayName = record.displayName;

         // Make sure we don't pass the function as a form parameter
         delete params["function"];

         // Add configured success callback
         var success = params["success"];
         delete params["success"];
         config.success =
         {
            fn: function(response, obj)
            {
               // Invoke callback if configured and available
               if (YAHOO.lang.isFunction(this[success]))
               {
                  this[success].call(this, response, obj);
               }

               // Fire metadataRefresh so other components may update themselves
               YAHOO.Bubbling.fire("metadataRefresh", obj);
            },
            obj: record,
            scope: this
         };

         // Add configure success message
         if (params.successMessage)
         {
            config.successMessage = this.msg(params.successMessage, displayName);
            delete params["successMessage"];
         }

         // Add configured failure callback
         if (YAHOO.lang.isFunction(this[params.failure]))
         {
            config.failure =
            {
               fn: this[params.failure],
               obj: record,
               scope: this
            };
            delete params["failure"];
         }
         // Add configure success message
         if (params.failureMessage)
         {
            config.failureMessage = this.msg(params.failureMessage, displayName);
            delete params["failureMessage"];
         }

         // Use the remaining properties as form properties
         config.properties = params;

         return config;
      },

      /**
       * Upload new version.
       *
       * @method onActionUploadNewVersion
       * @param record {object} Object literal representing the file or folder to be actioned
       */
      onActionUploadNewVersion: function dlA_onActionUploadNewVersion(record)
      {
         var jsNode = record.jsNode,
            displayName = record.displayName,
            nodeRef = jsNode.nodeRef,
            version = record.version;

         if (!this.fileUpload)
         {
            this.fileUpload = Alfresco.getFileUploadInstance();
         }

         // Show uploader for multiple files
         var description = this.msg("label.filter-description", displayName),
            extensions = "*";

         if (displayName && new RegExp(/[^\.]+\.[^\.]+/).exec(displayName))
         {
            // Only add a filtering extension if filename contains a name and a suffix
            extensions = "*" + displayName.substring(displayName.lastIndexOf("."));
         }

         if (record.workingCopy && record.workingCopy.workingCopyVersion)
         {
            version = record.workingCopy.workingCopyVersion;
         }

         var zIndex = 0;
         if (this.fullscreen !== undefined && ( this.fullscreen.isWindowOnly || Dom.hasClass(this.id, 'alf-fullscreen')))
         {
            zIndex = 1000;
         }

         var singleUpdateConfig =
         {
            updateNodeRef: nodeRef.toString(),
            updateFilename: displayName,
            updateVersion: version,
            overwrite: true,
            filter: [
            {
               description: description,
               extensions: extensions
            }],
            mode: this.fileUpload.MODE_SINGLE_UPDATE,
            onFileUploadComplete:
            {
               fn: this.onNewVersionUploadComplete,
               scope: this
            }
         };

         this.fileUpload.options.zIndex = zIndex;

         if ($isValueSet(this.options.siteId))
         {
            singleUpdateConfig.siteId = this.options.siteId;
            singleUpdateConfig.containerId = this.options.containerId;
         }
         this.fileUpload.show(singleUpdateConfig);
      },

      /**
       * Handles creating activity events after file upload completion
       *
       * @method _uploadComplete
       * @protected
       * @param complete {object} Object literal containing details of successful and failed uploads
       * @param uploadType {String} Either "added" or "updated" depending on the file action
       */
      _uploadComplete: function dlA__uploadComplete(complete, uploadType)
      {
         var success = complete.successful.length, activityData, file;
         if (success > 0)
         {
            if (success < (this.options.groupActivitiesAt || 5))
            {
               // Below cutoff for grouping Activities into one
               for (var i = 0; i < success; i++)
               {
                  file = complete.successful[i];
                  activityData =
                  {
                     fileName: file.fileName,
                     nodeRef: file.nodeRef
                  };
                  this.modules.actions.postActivity(this.options.siteId, "file-" + uploadType, "document-details", activityData);
               }
            }
            else
            {
               // grouped into one message
               activityData =
               {
                  fileCount: success,
                  path: this.currentPath,
                  parentNodeRef: this.doclistMetadata.parent.nodeRef
               };
               this.modules.actions.postActivity(this.options.siteId, "files-" + uploadType, "documentlibrary", activityData);
            }
         }
      },

      /**
       * Called from the uploader component after one or more files have been uploaded.
       *
       * @method onFileUploadComplete
       * @param complete {object} Object literal containing details of successful and failed uploads
       */
      onFileUploadComplete: function dlA_onFileUploadComplete(complete)
      {
         this._uploadComplete(complete, "added");
      },

      /**
       * Called from the uploader component after one or more files have been updated.
       *
       * @method onNewVersionUploadComplete
       * @param complete {object} Object literal containing details of successful and failed uploads
       */
      onNewVersionUploadComplete: function dlA_onNewVersionUploadComplete(complete)
      {
         this._uploadComplete(complete, "updated");
      },

      /**
       * Cancel editing.
       *
       * @method onActionCancelEditing
       * @param record {object} Object literal representing the file or folder to be actioned
       */
      onActionCancelEditing: function dlA_onActionCancelEditing(record)
      {
         var displayName = record.displayName;

         this.modules.actions.genericAction(
         {
            success:
            {
               event:
               {
                  name: "metadataRefresh"
               },
               message: this.msg("message.edit-cancel.success", displayName)
            },
            failure:
            {
               message: this.msg("message.edit-cancel.failure", displayName)
            },
            webscript:
            {
               method: Alfresco.util.Ajax.POST,
               name: "cancel-checkout/node/{nodeRef}",
               params:
               {
                  nodeRef: record.jsNode.nodeRef.uri
               }
            }
         });

         YAHOO.Bubbling.fire("editingCanceled",
         {
            record: record
         });
      },
	  
     /**
       * Unlock document
       *
       * @method onActionUnlockDocument
       * @param record {object} 
       */
      onActionUnlockDocument: function dlA_onActionUnlockDocument(record)
      {
         var displayName = record.displayName;

         this.modules.actions.genericAction(
         {
            success:
            {
               event:
               {
                  name: "metadataRefresh"
               },
               message: this.msg("message.unlock-document.success", displayName)
            },
            failure:
            {
               message: this.msg("message.unlock-document.failure", displayName)
            },
            webscript:
            {
               method: Alfresco.util.Ajax.POST,
               name: "unlock-document/node/{nodeRef}",
               params:
               {
                  nodeRef: record.jsNode.nodeRef.uri
               }
            }
         });
      },

      /**
       * Copy single document or folder.
       *
       * @method onActionCopyTo
       * @param record {object} Object literal representing the file or folder to be actioned
       */
      onActionCopyTo: function dlA_onActionCopyTo(record)
      {
         this._copyMoveTo("copy", record);
      },

      /**
       * Move single document or folder.
       *
       * @method onActionMoveTo
       * @param record {object} Object literal representing the file or folder to be actioned
       */
      onActionMoveTo: function dlA_onActionMoveTo(record)
      {
         this._copyMoveTo("move", record);
      },
      
      /**
       * Unzip a single archive.
       *
       * @method onActionUnzipTo
       * @param record {object} Object literal representing the archive to be actioned
       */
      onActionUnzipTo: function dlA_onActionUnzipTo(record)
      {
         this._copyMoveTo("unzip", record);
      },

      /**
       * Copy/Move To implementation.
       *
       * @method _copyMoveTo
       * @param mode {String} Operation mode: copy|move
       * @param record {object} Object literal representing the file or folder to be actioned
       * @private
       */
      _copyMoveTo: function dlA__copyMoveTo(mode, record)
      {
         // Check mode is an allowed one
         if (!mode in
            {
               copy: true,
               move: true,
               unzip: true
            })
         {
            throw new Error("'" + mode + "' is not a valid Copy/Move to mode.");
         }

         if (!this.modules.copyMoveTo)
         {
            this.modules.copyMoveTo = new Alfresco.module.DoclibCopyMoveTo(this.id + "-copyMoveTo");
         }

         var DLGF = Alfresco.module.DoclibGlobalFolder;

         var allowedViewModes =
         [
            DLGF.VIEW_MODE_RECENT_SITES,
            DLGF.VIEW_MODE_FAVOURITE_SITES,
            DLGF.VIEW_MODE_SITE,
            DLGF.VIEW_MODE_SHARED
         ];

         if (this.options.repositoryBrowsing === true)
         {
            allowedViewModes.push(DLGF.VIEW_MODE_REPOSITORY);
         }

         allowedViewModes.push(DLGF.VIEW_MODE_USERHOME);

         var zIndex = 0;
         if (this.fullscreen !== undefined && ( this.fullscreen.isWindowOnly || Dom.hasClass(this.id, 'alf-fullscreen')))
         {
            zIndex = 1000;
         }

         var parentElement = undefined;
         if (Dom.hasClass(this.id, 'alf-true-fullscreen'))
         {
            parentElement = Dom.get(this.id);
         }

         var repoPath = record[0] ? record[0].location.repoPath : record.location.repoPath;
         this.modules.copyMoveTo.setOptions(
         {
            allowedViewModes: allowedViewModes,
            mode: mode,
            siteId: this.options.siteId,
            containerId: this.options.containerId,
            path: this.options.repositoryBrowsing ? repoPath : this.currentPath,
            files: record,
            /* Fix for MNT-12432. Do not overwrite this.modules.copyMoveTo.options.rootNode option if repoBrowsing is enabled. Could cause Repository tab view inconsistency */
            rootNode: this.options.repositoryBrowsing ? this.modules.copyMoveTo.options.rootNode : this.options.rootNode,
            parentId: this.getParentNodeRef(record),
            zIndex: zIndex,
            parentElement : parentElement ? parentElement : undefined
         }).showDialog();
      },

      /**
       * Assign workflow.
       *
       * @method onActionAssignWorkflow
       * @param record {object} Object literal representing the file or folder to be actioned
       */
      onActionAssignWorkflow: function dlA_onActionAssignWorkflow(record)
      {
         var nodeRefs = "",
            destination = this.getParentNodeRef(record);

         if (YAHOO.lang.isArray(record))
         {
            for (var i = 0, il = record.length; i < il; i++)
            {
               nodeRefs += (i === 0 ? "" : ",") + record[i].nodeRef;
            }
         }
         else
         {
            nodeRefs = record.nodeRef;
         }
         var postBody =
         {
            selectedItems: nodeRefs
         };
         if (destination)
         {
            postBody.destination = destination;
         }
         Alfresco.util.navigateTo($siteURL("start-workflow"), "POST", postBody);
      },

      /**
       * Set permissions on a single document or folder.
       *
       * @method onActionManagePermissions
       * @param record {object} Object literal representing the file or folder to be actioned
       */
      onActionManagePermissions: function dlA_onActionManagePermissions(record)
      {
         if (!this.modules.permissions)
         {
            this.modules.permissions = new Alfresco.module.DoclibPermissions(this.id + "-permissions");
         }

         this.modules.permissions.setOptions(
         {
            siteId: this.options.siteId,
            containerId: this.options.containerId,
            path: this.currentPath,
            files: record
         }).showDialog();
      },
      
      /**
       * Take Ownership.
       *
       * @method onActionTakeOwnership
       * @param record {object} Object literal representing the file or folder to be actioned
       */
      onActionTakeOwnership: function dlA_onActionTakeOwnership(record, owner)
      {
         var me = this,
            jsNode = record.jsNode,
            content = jsNode.isContainer ? "folder" : "document",
            displayName = record.displayName,
            zIndex = 0;

         var displayPromptText = this.msg("message.confirm.take-ownership", displayName);

         if (this.fullscreen !== undefined && ( this.fullscreen.isWindowOnly || Dom.hasClass(this.id, 'alf-fullscreen')))
         {
            zIndex = 1000;
         }

         //MNT-11084 : Full screen/window view: Actions works incorrectly;
         var parent = undefined;
         var container = Dom.get(this.id);
         var ua = navigator.userAgent.toLowerCase();
         if ((ua.indexOf('gecko') != -1 || ua.indexOf('safari')!=-1) && ua.indexOf('chrome')==-1)
         {
            parent = container;
         }
       
         var buttons =
         [
            {
               text: this.msg("button.take-ownership"),
               handler: function dlA_onActionTakeOwnership_confirm()
               {
                  this.destroy();
                  me.onActionSimpleRepoAction.call(me, record, owner);
               }
            },
            {
               text: this.msg("button.cancel"),
               handler: function dlA_onActionTakeOwnership_cancel()
               {
                  this.destroy();
               },
               isDefault: true
            }
         ];
         
         Alfresco.util.PopupManager.displayPrompt(
         {
            title: this.msg("message.confirm.take-ownership.title"),
            text: displayPromptText,
            noEscape: true,
            buttons: buttons
         });
      },

      /**
       * Manage aspects.
       *
       * @method onActionManageAspects
       * @param record {object} Object literal representing the file or folder to be actioned
       */
      onActionManageAspects: function dlA_onActionManageAspects(record)
      {
         if (!this.modules.aspects)
         {
            this.modules.aspects = new Alfresco.module.DoclibAspects(this.id + "-aspects");
         }

         this.modules.aspects.setOptions(
         {
            file: record
         }).show();
      },

      /**
       * Change Type
       *
       * @method onActionChangeType
       * @param record {object} Object literal representing the file or folder to be actioned
       */
      onActionChangeType: function dlA_onActionChangeType(record)
      {
         var jsNode = record.jsNode,
            currentType = jsNode.type,
            displayName = record.displayName,
            actionUrl = Alfresco.constants.PROXY_URI + $combine("slingshot/doclib/type/node", jsNode.nodeRef.uri);

         var doSetupFormsValidation = function dlA_oACT_doSetupFormsValidation(p_form)
         {
            // Validation
            p_form.addValidation(this.id + "-changeType-type", function fnValidateType(field, args, event, form, silent, message)
            {
               return field.options[field.selectedIndex].value !== "-";
            }, null, "change", null, { validationType: "mandatory" });
         };

         // Always create a new instance
         this.modules.changeType = new Alfresco.module.SimpleDialog(this.id + "-changeType").setOptions(
         {
            width: "30em",
            templateUrl: Alfresco.constants.URL_SERVICECONTEXT + "modules/documentlibrary/change-type?currentType=" + encodeURIComponent(currentType),
            actionUrl: actionUrl,
            doSetupFormsValidation:
            {
               fn: doSetupFormsValidation,
               scope: this
            },
            firstFocus: this.id + "-changeType-type",
            onSuccess:
            {
               fn: function dlA_onActionChangeType_success(response)
               {
                  YAHOO.Bubbling.fire("metadataRefresh",
                  {
                     highlightFile: displayName
                  });
                  Alfresco.util.PopupManager.displayMessage(
                  {
                     text: this.msg("message.change-type.success", displayName)
                  });
               },
               scope: this
            },
            onFailure:
            {
               fn: function dlA_onActionChangeType_failure(response)
               {
                  Alfresco.util.PopupManager.displayMessage(
                  {
                     text: this.msg("message.change-type.failure", displayName)
                  });
               },
               scope: this
            }
         });
         this.modules.changeType.show();
      },

      /**
       * View in source Repository URL helper
       *
       * @method viewInSourceRepositoryURL
       * @param record {object} Object literal representing the file or folder to be actioned
       * @param actionUrls {object} Action urls for this record
       */
      viewInSourceRepositoryURL: function dlA_viewInSourceRepositoryURL(record, actionUrls)
      {
         var node = record.node,
            repoId = record.location.repositoryId,
            urlMapping = this.options.replicationUrlMapping,
            siteUrl;

         if (!repoId || !urlMapping || !urlMapping[repoId])
         {
            return "#";
         }

         // Generate a URL to the relevant details page
         siteUrl = node.isContainer ? actionUrls.folderDetailsUrl : actionUrls.documentDetailsUrl;
         // Strip off this webapp's context as the mapped one might be different
         siteUrl = siteUrl.substring(Alfresco.constants.URL_CONTEXT.length);

         return $combine(urlMapping[repoId], "/", siteUrl);
      },

      /**
       * CLOUD SYNC
       */

      /**
       * Create Sync
       * loads folder picker populated with networks, sites and folders from The Cloud.
       *
       * @method onActionCloudSync
       * @param record {object} Object literal representing the file or folder to be actioned
       */
      onActionCloudSync: function dlA_onActionCloudSync(record)
      {
         // MNT-15212 : If the Cloud Folder Picker was initialized before delete it 
         if(cloudFolderPicker)
         {
               cloudFolderPicker.destroy();
         }

         // Instantiate Cloud Folder Picker & Cloud Auth Dialogue
         cloudFolderPicker = new Alfresco.module.DoclibCloudFolder(this.id + "-cloud-folder");

         var me = this;

         // Set up handler for when the sync location has been chosen:
         YAHOO.Bubbling.on("folderSelected", function cloudSync_onCloudFolderSelected(event, args)
         {
            this.updateSyncOptions();

            Alfresco.util.Ajax.jsonPost(
            {
               url: Alfresco.constants.PROXY_URI + "enterprise/sync/syncsetdefinitions",
               dataObj: YAHOO.lang.merge(this.options.syncOptions,
               {
                  memberNodeRefs: me.getMemberNodeRefs(this.options.files),
                  remoteTenantId: this.options.targetNetwork,
                  targetFolderNodeRef: args[1].selectedFolder.nodeRef
               }),
               successCallback: {
                  fn: function cloudSync_onCloudFolderSelectedSuccess()
                  {
                     YAHOO.Bubbling.fire("metadataRefresh");
                     Alfresco.util.PopupManager.displayMessage(
                     {
                        text: this.msg("message.sync.success")
                     });
                  },
                  scope: this
               },
               failureMessage: this.msg("message.sync.failure")
            })
         }, cloudFolderPicker);

         if(!this.modules.cloudAuth)
         {
            this.modules.cloudAuth = new Alfresco.module.CloudAuth(this.id + "cloudAuth");
         }

         cloudFolderPicker.setOptions(
         {
            files: record
         });

         this.modules.cloudAuth.setOptions(
         {
            authCallback: cloudFolderPicker.showDialog,
            authCallbackContext: cloudFolderPicker
         }).checkAuth();
      },

      /**
       * Remove Sync
       * loads folder picker populated with networks, sites and folders from The Cloud.
       *
       * @method onActionCloudUnsync
       * @param record {object} Object literal representing the file or folder to be actioned
       */
      onActionCloudUnsync: function dlA_onActionCloudUnsync(record)
      {
         var me = this,
            content = record.jsNode.isContainer ? "folder" : "document",
            displayName = record.displayName,
            isCloud = (this.options.syncMode === "CLOUD"),
            deleteRemoteFile = isCloud ? "" : '<div><input type="checkbox" id="requestDeleteRemote" class="requestDeleteRemote-checkBox"><span class="requestDeleteRemote-text">' + this.msg("sync.remove." + content + ".from.cloud", displayName) + '</span></div>';

         Alfresco.util.PopupManager.displayPrompt(
         {
            title: this.msg("actions." + content + ".cloud-unsync"),
            noEscape: true,
            text: this.msg("message.unsync.confirm", displayName) + deleteRemoteFile,
            buttons: [
            {
               text: this.msg("button.unsync"),
               handler: function dlA_onActionCloudUnsync_unsync()
               {
                  var requestDeleteRemote = isCloud ? false : Dom.getAttribute("requestDeleteRemote", "checked");
                  this.destroy();
                  Alfresco.util.Ajax.request(
                  {
                     url: Alfresco.constants.PROXY_URI + "enterprise/sync/syncsetmembers/" + record.jsNode.nodeRef.uri + "?requestDeleteRemote=" + requestDeleteRemote,
                     method: Alfresco.util.Ajax.DELETE,
                     successCallback: {
                        fn: function cloudSync_onCloudUnsync_success()
                        {
                           YAHOO.Bubbling.fire("metadataRefresh");
                           Alfresco.util.PopupManager.displayMessage(
                           {
                              text: me.msg("message.unsync.success")
                           })
                        },
                        scope: me
                     },
                     failureMessage: me.msg("message.unsync.failure")
                  });
               }
            },
            {
               text: this.msg("button.cancel"),
               handler: function dlA_onActionCloudUnsync_cancel()
               {
                  this.destroy();
               },
               isDefault: true
            }]
         });
      },

      /**
       * Triggered when the Cloud Sync Icon is clicked
       * Shows the status and location in cloud.
       *
       * @method onCloudSyncIndicatorAction
       * @param record {object} Object literal representing the file or folder to be actioned
       * @param target {HTML DOM Element} HTML Element that was the target of the initial action.
       */
      onCloudSyncIndicatorAction: function dlA_onCloudSyncIndicatorAction(record, target)
      {
         var balloon = new Alfresco.util.createInfoBalloon(this.widgets.dataTable.getTrEl(target),
         {
            text: this.msg("label.loading"),
            width: "455px"
         });

         // Show Balloon with initial message:
         balloon.show();

         Alfresco.util.Ajax.request(
         {
            url: Alfresco.constants.PROXY_URI + "slingshot/doclib2/node/"  + record.nodeRef.replace('://', '/'),
            successCallback:
            {
               fn: function onCloudSyncGettingNodeDetailsAction_success(response)
               {
                  var me = this,
                     configOptions =
                  {
                     showTitle: true,
                     showRequestSyncButton: true,
                     showUnsyncButton: true,
                     showMoreInfoLink: true
                  };

                  Alfresco.util.getSyncStatus(this, record, response.json, configOptions, function(callbackResult)
                  {
                     if (callbackResult != null)
                     {
                        // Render Error Banner
                        balloon.html(callbackResult.html);

                        balloon.requestsync = Alfresco.util.createYUIButton(me, "button-requestsyn", function()
                        {
                           me.onActionCloudSyncRequest(record);
                           balloon.hide();
                        },
                        {
                           id: me.id
                        });
                        if (!callbackResult.showRequestSyncButton && balloon.requestsync != null)
                        {
                           balloon.requestsync.setStyle('display', 'none');
                        }

                        balloon.unsync = Alfresco.util.createYUIButton(me, "button-unsync", function()
                        {
                           me.onActionCloudUnsync(record);
                           balloon.hide();
                        },
                        {
                           id: me.id
                        });
                        if (!callbackResult.showUnsyncButton && balloon.unsync != null)
                        {
                           balloon.unsync.setStyle('display', 'none');
                        }

                        var root = balloon.content;
                        Alfresco.util.syncClickOnShowDetailsLinkEvent(me, root);
                        Alfresco.util.syncClickOnHideLinkEvent(me, root);
                        Alfresco.util.syncClickOnTransientErrorShowDetailsLinkEvent(me, root);
                        Alfresco.util.syncClickOnTransientErrorHideLinkEvent(me, root);
                     }
                     else
                     {
                        balloon.hide();
                     }
                  });
               },
               scope: this
            },
            failureCallback:
            {
               fn: function onCloudSyncGettingNodeDetailsAction_failure(response)
               {
                  Alfresco.util.PopupManager.displayMessage(
                  {
                     text: this.msg("sync.unable.get.details")
                  });
               },
               scope: this
            }
         });
      },

      /**
       * Request Sync
       *
       * @method onActionCloudSyncRequest
       * @param record {object} Object literal representing the file or folder to be actioned
       * @param target {HTML DOM Element} HTML Element that was the target of the initial action.
       */
      onActionCloudSyncRequest: function dlA_onActionCloudSyncRequest(record, target)
      {
         Alfresco.util.Ajax.jsonPost(
         {
            url: Alfresco.constants.PROXY_URI + "enterprise/sync/syncrequest",
            dataObj:
            {
               memberNodeRefs: this.getMemberNodeRefs(record)
            },
            successCallback: {
               fn: function cloudSync_onActionCloudSyncRequest_success()
               {
                  YAHOO.Bubbling.fire("metadataRefresh");
                  Alfresco.util.PopupManager.displayMessage(
                  {
                     text: this.msg("message.request.sync.success")
                  })
               },
               scope: this
            },
            failureMessage: this.msg("message.request.sync.failure")
         })
      },

      /**
       * Helper method for getting the MemberNodeRefs from an object
       *
       * @method getMemberNodeRefs
       * @param record {object} Object literal representing one file or folder to be actioned
       * @return {object} An array of MemberNodeRefs
       */
      getMemberNodeRefs: function dlA_onGetMemberNodeRefs(record)
      {
         var memberNodeRefs = new Array();
         if (YAHOO.lang.isArray(record))
         {
            for (var i in record)
            {
               memberNodeRefs.push(record[i].nodeRef);
            }
         }
         else
         {
            memberNodeRefs.push(record.nodeRef);
         }
         return memberNodeRefs;
      },

      /**
       * Triggered when the Cloud Sync Failed Icon is clicked
       * Shows the status and location in cloud.
       *
       * @method onCloudSyncFailedIndicatorAction
       * @param record {object} Object literal representing the file or folder to be actioned
       * @param target {HTML DOM Element} HTML Element that was the target of the initial action.
       */
      onCloudSyncFailedIndicatorAction: function dlA_onCloudSyncFailedIndicatorAction(record, target)
      {
         this.onCloudSyncIndicatorAction(record, target);
      },

      /**
       * Triggered when the Cloud Indirect Sync Icon is clicked
       * Shows the status and location in cloud.
       *
       * @method onCloudIndirectSyncIndicatorAction
       * @param record {object} Object literal representing the file or folder to be actioned
       * @param target {HTML DOM Element} HTML Element that was the target of the initial action.
       */
      onCloudIndirectSyncIndicatorAction: function dlA_onCloudIndirectSyncIndicatorAction(record, target)
      {
         this.onCloudSyncIndicatorAction(record, target);
      },
      onCloudIndirectSyncFailedIndicatorAction: function dlA_onCloudIndirectSyncFailedIndicatorAction(record, target)
      {
         this.onCloudSyncIndicatorAction(record, target);
      },

      /**
       * Triggers the archiving and download of a single folders contents
       *
       * @method onActionFolderDownload
       * @param record {object} Object literal representing the folder to be actioned
       */
      onActionFolderDownload: function dlA_onActionFolderDownload(record) {

         var downloadDialog = Alfresco.getArchiveAndDownloadInstance(),
             config = { nodesToArchive: [{"nodeRef": record.nodeRef}],
                        archiveName: record.fileName };
         downloadDialog.show(config);
      },

      /**
       * Triggers the archiving and download of the currently selected documents/folders.
       *
       * @method onActionDownload
       * @param record {array} The list of selected records.
       */
      onActionDownload: function dla_onActionDownload(record) {
         var downloadDialog = Alfresco.getArchiveAndDownloadInstance(),
             config = { nodesToArchive: [] };

         if (record.length == 1)
         {
            config.nodesToArchive.push({"nodeRef": record[0].nodeRef});
            config.archiveName = record[0].fileName;
         }
         else
         {
            for (var i=0; i<record.length; i++)
            {
               config.nodesToArchive.push({"nodeRef": record[i].nodeRef})
            }
         }
         downloadDialog.show(config);
      }
   };
})();/**
 * Copyright (C) 2005-2010 Alfresco Software Limited.
 *
 * This file is part of Alfresco
 *
 * Alfresco is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Alfresco is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with Alfresco. If not, see <http://www.gnu.org/licenses/>.
 */
 
/**
 * SimpleDialog module.
 * 
 * @namespace Alfresco.module
 * @class Alfresco.module.SimpleDialog
 */
(function()
{
   var Dom = YAHOO.util.Dom,
      Selector = YAHOO.util.Selector,
      KeyListener = YAHOO.util.KeyListener;
   
   Alfresco.module.SimpleDialog = function(htmlId, components)
   {
      components = YAHOO.lang.isArray(components) ? components : [];
      
      this.isFormOwner = false;

      if (htmlId !== "null")
      {
         /* Defer showing dialog when in Forms Service mode */
         this.formsServiceDeferred = new Alfresco.util.Deferred(["onTemplateLoaded", "onBeforeFormRuntimeInit"],
         {
            fn: this._showDialog,
            scope: this
         });

         YAHOO.Bubbling.on("beforeFormRuntimeInit", this.onBeforeFormRuntimeInit, this);
      }
      
      return Alfresco.module.SimpleDialog.superclass.constructor.call(
         this,
         "Alfresco.module.SimpleDialog",
         htmlId,
         ["button", "container", "connection", "json", "selector"].concat(components));
   };

   YAHOO.extend(Alfresco.module.SimpleDialog, Alfresco.component.Base,
   {
      /**
       * Dialog instance.
       * 
       * @property dialog
       * @type YAHOO.widget.Dialog
       */
      dialog: null,

      /**
       * Form instance.
       * 
       * @property form
       * @type Alfresco.forms.Form
       */
      form: null,
      
      /**
       * Whether form instance is our own, or created from FormUI component
       *
       * @property isFormOwner
       * @type Boolean
       */
      isFormOwner: null,

       /**
        * Object container for initialization options
        */
       options:
       {
          /**
           * URL which will return template body HTML
           *
           * @property templateUrl
           * @type string
           * @default null
           */
          templateUrl: null,

          /**
           * URL of the form action
           *
           * @property actionUrl
           * @type string
           * @default null
           */
          actionUrl: null,

          /**
           * ID of form element to receive focus on show
           *
           * @property firstFocus
           * @type string
           * @default null
           */
          firstFocus: null,

          /**
           * Object literal representing callback upon successful operation.
           *   fn: function, // The handler to call when the event fires.
           *   obj: object, // An object to pass back to the handler.
           *   scope: object // The object to use for the scope of the handler.
           *
           * @property onSuccess
           * @type object
           * @default null
           */
          onSuccess:
          {
             fn: null,
             obj: null,
             scope: window
          },

          /**
           * Message to display on successful operation
           *
           * @property onSuccessMessage
           * @type string
           * @default ""
           */
          onSuccessMessage: "",
          
          /**
           * Object literal representing callback upon failed operation.
           *   fn: function, // The handler to call when the event fires.
           *   obj: object, // An object to pass back to the handler.
           *   scope: object // The object to use for the scope of the handler.
           *
           * @property onFailure
           * @type object
           * @default null
           */
          onFailure:
          {
             fn: null,
             obj: null,
             scope: window
          },

          /**
           * Message to display on failed operation
           *
           * @property onFailureMessage
           * @type string
           * @default ""
           */
          onFailureMessage: "",
          
          /**
           * Object literal representing function to intercept dialog just before shown.
           *   fn: function(formsRuntime, Alfresco.module.SimpleDialog), // The handler to call when the event fires.
           *   obj: object, // An object to pass back to the handler.
           *   scope: object // The object to use for the scope of the handler. SimpleDialog instance if unset.
           *
           * @property doBeforeDialogShow
           * @type object
           * @default null
           */
          doBeforeDialogShow:
          {
             fn: null,
             obj: null,
             scope: null
          },
          
          /**
           * Object literal representing function to set forms validation.
           *   fn: function, // The handler to call when the event fires.
           *   obj: object, // An object to pass back to the handler.
           *   scope: object // The object to use for the scope of the handler. SimpleDialog instance if unset.
           *
           * @property doSetupFormsValidation
           * @type object
           * @default null
           */
          doSetupFormsValidation:
          {
             fn: null,
             obj: null,
             scope: null
          },
          
          /**
           * Object literal representing function to intercept form before submit.
           *   fn: function, // The override function.
           *   obj: object, // An object to pass back to the function.
           *   scope: object // The object to use for the scope of the function.
           *
           * @property doBeforeFormSubmit
           * @type object
           * @default null
           */
          doBeforeFormSubmit:
          {
             fn: null,
             obj: null,
             scope: window
          },
          
          /**
           * Object literal containing the abstract function for intercepting AJAX form submission.
           *   fn: function, // The override function.
           *   obj: object, // An object to pass back to the function.
           *   scope: object // The object to use for the scope of the function.
           * 
           * @property doBeforeAjaxRequest
           * @type object
           * @default null
           */
          doBeforeAjaxRequest:
          {
             fn: null,
             obj: null,
             scope: window
          },
          
          /**
           * Width for the dialog
           *
           * @property width
           * @type integer
           * @default 30em
           */
          width: "30em",
          
          /**
           * Allow zIndex to be set.
           * @property zIndex
           * @type integer
           * @default null
           */
          zIndex: null,

          /**
           * Clear the form before showing it?
           *
           * @property: clearForm
           * @type: boolean
           * @default: false
           */
          clearForm: false,
          
          /**
           * Destroy the dialog instead of hiding it?
           *
           * @property destroyOnHide
           * @type boolean
           * @default false
           */
          destroyOnHide: false
       },

      /**
       * Main entrypoint to show the dialog
       *
       * @method show
       */
      show: function AmSD_show()
      {
         if (this.dialog)
         {
            this._showDialog();
         }
         else
         {
            var data =
            {
               htmlid: this.id
            };
            if (this.options.templateRequestParams)
            {
                data = YAHOO.lang.merge(this.options.templateRequestParams, data);
            }
            Alfresco.util.Ajax.request(
            {
               url: this.options.templateUrl,
               dataObj:data,
               successCallback:
               {
                  fn: this.onTemplateLoaded,
                  scope: this
               },
               failureMessage: "Could not load dialog template from '" + this.options.templateUrl + "'.",
               scope: this,
               execScripts: true
            });
         }
         return this;
      },
      
      /**
       * Show the dialog and set focus to the first text field
       *
       * @method _showDialog
       * @private
       */
      _showDialog: function AmSD__showDialog()
      {
         var form = Dom.get(this.id + "-form");
         
         // Make sure forms without Share-specific templates render roughly ok
         Dom.addClass(form, "bd");

         // Custom forms validation setup interest registered?
         var doSetupFormsValidation = this.options.doSetupFormsValidation;
         if (typeof doSetupFormsValidation.fn == "function")
         {
            doSetupFormsValidation.fn.call(doSetupFormsValidation.scope || this, this.form, doSetupFormsValidation.obj);
         }
         
         // Custom forms before-submit interest registered?
         var doBeforeFormSubmit = this.options.doBeforeFormSubmit;
         if (typeof doBeforeFormSubmit.fn == "function")
         {
            this.form.doBeforeFormSubmit = doBeforeFormSubmit;
         }
         else
         {
            // If no specific handler disable buttons before submit to avoid double submits
            this.form.doBeforeFormSubmit =
            {
               fn: function AmSD__defaultDoBeforeSubmit()
               {
                  this.widgets.cancelButton.set("disabled", true);
               },
               scope: this
            };
         }

         // Custom ajax before-request interest registered?
         var doBeforeAjaxRequest = this.options.doBeforeAjaxRequest;
         if (typeof doBeforeAjaxRequest.fn == "function")
         {
            this.form.doBeforeAjaxRequest = doBeforeAjaxRequest;
         }

         if (this.options.actionUrl !== null)
         {
            form.attributes.action.nodeValue = this.options.actionUrl;
         }
         
         if (this.options.clearForm)
         {
            var inputs = Selector.query("input", form),
                  input;
            inputs = inputs.concat(Selector.query("textarea", form));
            for (var i = 0, j = inputs.length; i < j; i++)
            {
               input = inputs[i];
               if(input.getAttribute("type") != "radio" && input.getAttribute("type") != "checkbox" && input.getAttribute("type") != "hidden")
               {
                  input.value = "";                  
               }
            }
         }
         // Custom before show event interest registered?
         var doBeforeDialogShow = this.options.doBeforeDialogShow;
         if (doBeforeDialogShow && typeof doBeforeDialogShow.fn == "function")
         {
             doBeforeDialogShow.fn.call(doBeforeDialogShow.scope || this, this.form, this, doBeforeDialogShow.obj);
         }
         
         // Make sure ok button is in the correct state if dialog is reused  
         this.widgets.cancelButton.set("disabled", false);
         this.form.validate();

         this.dialog.show();

         // Fix Firefox caret issue
         Alfresco.util.caretFix(form);
         
         // We're in a popup, so need the tabbing fix
         this.form.applyTabFix();
         
         // Register the ESC key to close the dialog
         this.widgets.escapeListener = new KeyListener(document,
         {
            keys: KeyListener.KEY.ESCAPE
         },
         {
            fn: function(id, keyEvent)
            {
               this.hide();
            },
            scope: this,
            correctScope: true
         });
         this.widgets.escapeListener.enable();

         // Set focus if required
         if (this.options.firstFocus !== null)
         {
            Dom.get(this.options.firstFocus).focus();
         }
      },

      /**
       * Hide the dialog
       *
       * @method hide
       */
      hide: function AmSD_hide()
      {
         if (this.dialog)
         {
            this.dialog.hide();
         }
         var doAfterDialogHide = this.options.doAfterDialogHide;
         if (doAfterDialogHide && typeof doAfterDialogHide.fn == "function")
         {
            doAfterDialogHide.fn.call(doAfterDialogHide.scope || this, this.form, this, doAfterDialogHide.obj);
         }

      },

      /**
       * Hide the dialog, removing the caret-fix patch
       *
       * @method _hideDialog
       * @private
       */
      _hideDialog: function AmSD__hideDialog()
      {
         // Unhook close button
         this.dialog.hideEvent.unsubscribe(this.onHideEvent, null, this);

         if (this.widgets.escapeListener)
         {
            this.widgets.escapeListener.disable();
         }
         var form = Dom.get(this.id + "-form");

         // Undo Firefox caret issue
         Alfresco.util.undoCaretFix(form);

         if (this.options.destroyOnHide)
         {
            YAHOO.Bubbling.fire("formContainerDestroyed");
            YAHOO.Bubbling.unsubscribe("beforeFormRuntimeInit", this.onBeforeFormRuntimeInit, this);
            this.dialog.destroy();
            delete this.dialog;
            delete this.widgets;
            if (this.isFormOwner)
            {
               delete this.form;
            }
         }
      },
      
      /**
       * Event handler for container "hide" event.
       * Defer until the dialog itself has processed the hide event so we can safely destroy it later.
       *
       * @method onHideEvent
       * @param e {object} Event type
       * @param obj {object} Object passed back from subscribe method
       */
      onHideEvent: function AmSD_onHideEvent(e, obj)
      {
         YAHOO.lang.later(0, this, this._hideDialog);
      },
      
      /**
       * Event callback when dialog template has been loaded
       *
       * @method onTemplateLoaded
       * @param response {object} Server response from load template XHR request
       */
      onTemplateLoaded: function AmSD_onTemplateLoaded(response)
      {
         // Inject the template from the XHR request into a new DIV element
         var containerDiv = document.createElement("div");
         containerDiv.innerHTML = response.serverResponse.responseText;

         // The panel is created from the HTML returned in the XHR request, not the container
         var dialogDiv = Dom.getFirstChild(containerDiv);
         while (dialogDiv && dialogDiv.tagName.toLowerCase() != "div")
         {
            dialogDiv = Dom.getNextSibling(dialogDiv);
         }

         // Create and render the YUI dialog
         var dialogOptions = {
            width: this.options.width
         };

         if (this.options.zIndex)
         {
            dialogOptions.zIndex = this.options.zIndex;
         }

         this.dialog = Alfresco.util.createYUIPanel(dialogDiv, dialogOptions);

         // Hook close button
         this.dialog.hideEvent.subscribe(this.onHideEvent, null, this);

         // Are we controlling a Forms Service-supplied form?
         if (Dom.get(this.id + "-form-submit"))
         {
            this.isFormOwner = false;
            // FormUI component will initialise form, so we'll continue processing later
            this.formsServiceDeferred.fulfil("onTemplateLoaded");
         }
         else
         {
            // OK button needs to be "submit" type
            this.widgets.okButton = Alfresco.util.createYUIButton(this, "ok", null,
            {
               type: "submit"
            });

            // Cancel button
            this.widgets.cancelButton = Alfresco.util.createYUIButton(this, "cancel", this.onCancel);

            // Form definition
            this.isFormOwner = true;
            this.form = new Alfresco.forms.Form(this.id + "-form");
            this.form.setSubmitElements(this.widgets.okButton);
            this.form.setAJAXSubmit(true,
            {
               successCallback:
               {
                  fn: this.onSuccess,
                  scope: this
               },
               failureCallback:
               {
                  fn: this.onFailure,
                  scope: this
               }
            });
            this.form.setSubmitAsJSON(true);

            // Initialise the form
            this.form.init();

            this._showDialog();
         }
      },

      /**
       * Event handler called when the "beforeFormRuntimeInit" event is received.
       *
       * @method onBeforeFormRuntimeInit
       * @param layer {String} Event type
       * @param args {Object} Event arguments
       * <pre>
       *    args.[1].component: Alfresco.FormUI component instance,
       *    args.[1].runtime: Alfresco.forms.Form instance
       * </pre>
       */
      onBeforeFormRuntimeInit: function AmSD_onBeforeFormRuntimeInit(layer, args)
      {
         var formUI = args[1].component,
            formsRuntime = args[1].runtime;

         this.widgets.okButton = formUI.buttons.submit;
         this.widgets.okButton.set("label", this.msg("button.save"));
         this.widgets.cancelButton = formUI.buttons.cancel;
         this.widgets.cancelButton.set("onclick",
         {
            fn: this.onCancel,
            scope: this
         });
         
         this.form = formsRuntime;
         this.form.setAJAXSubmit(true,
         {
            successCallback:
            {
               fn: this.onSuccess,
               scope: this
            },
            failureCallback:
            {
               fn: this.onFailure,
               scope: this
            }
         });
         
         this.formsServiceDeferred.fulfil("onBeforeFormRuntimeInit");
      },

      /**
       * Cancel button event handler
       *
       * @method onCancel
       * @param e {object} DomEvent
       * @param p_obj {object} Object passed back from addListener method
       */
      onCancel: function AmSD_onCancel(e, p_obj)
      {
         this.hide();
      },

      /**
       * Successful data webscript call event handler
       *
       * @method onSuccess
       * @param response {object} Server response object
       */
      onSuccess: function AmSD_onSuccess(response)
      {
         this.hide();

         if (!response)
         {
            // Invoke the callback if one was supplied
            if (this.options.onFailure && typeof this.options.onFailure.fn == "function")
            {
               this.options.onFailure.fn.call(this.options.onFailure.scope, null, this.options.onFailure.obj);
            }
            else
            {
               Alfresco.util.PopupManager.displayMessage(
               {
                  text: this.options.failureMessage || "Operation failed."
               });
            }
         }
         else
         {
            // Invoke the callback if one was supplied
            if (this.options.onSuccess && typeof this.options.onSuccess.fn == "function")
            {
               this.options.onSuccess.fn.call(this.options.onSuccess.scope, response, this.options.onSuccess.obj);
            }
            else
            {
               Alfresco.util.PopupManager.displayMessage(
               {
                  text: this.options.successMessage || "Operation succeeded."
               });
            }
         }
      },

      /**
       * Failed data webscript call event handler
       *
       * @method onFailure
       * @param response {object} Server response object
       */
      onFailure: function AmSD_onFailure(response)
      {
         // Make sure ok button is in the correct state if dialog is reused
         this.widgets.cancelButton.set("disabled", false);
         this.form.validate();

         // Invoke the callback if one was supplied
         if (typeof this.options.onFailure.fn == "function")
         {
            this.options.onFailure.fn.call(this.options.onFailure.scope, response, this.options.onFailure.obj);
         }
         else
         {
            if (response.json && response.json.message && response.json.status.name)
            {
               Alfresco.util.PopupManager.displayPrompt(
               {
                  title: response.json.status.name,
                  text: response.json.message
               });
            }
            else
            {
               Alfresco.util.PopupManager.displayPrompt(
               {
                  title: this.msg("message.failure"),
                  text: response.serverResponse
               });
            }
         }
      }
   });

   /**
    * Dummy instance to load optional YUI components early.
    * Use fake "null" id, which is tested later in onComponentsLoaded()
   */
   var dummyInstance = new Alfresco.module.SimpleDialog("null");
})();/**
 * Copyright (C) 2005-2013 Alfresco Software Limited.
 *
 * This file is part of Alfresco
 *
 * Alfresco is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Alfresco is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with Alfresco. If not, see <http://www.gnu.org/licenses/>.
 */

/**
 * Document Library "Global Folder" picker module for Document Library.
 *
 * @namespace Alfresco.module
 * @class Alfresco.module.DoclibGlobalFolder
 */
(function()
{
   /**
   * YUI Library aliases
   */
   var Dom = YAHOO.util.Dom,
      Event = YAHOO.util.Event,
      KeyListener = YAHOO.util.KeyListener,
      Selector = YAHOO.util.Selector;

   /**
    * Alfresco Slingshot aliases
    */
    var $html = Alfresco.util.encodeHTML,
       $combine = Alfresco.util.combinePaths,
       $hasEventInterest = Alfresco.util.hasEventInterest;

   Alfresco.module.DoclibGlobalFolder = function(htmlId)
   {
      Alfresco.module.DoclibGlobalFolder.superclass.constructor.call(this, "Alfresco.module.DoclibGlobalFolder", htmlId, ["button", "container", "connection", "json", "treeview"]);

      // Initialise prototype properties
      this.containers = {};

      // Decoupled event listeners
      if (htmlId != "null")
      {
         this.eventGroup = htmlId;
         try
         {
            YAHOO.Bubbling.unsubscribe("siteChanged", null, this);
            YAHOO.Bubbling.unsubscribe("containerChanged", null, this);
         }
         catch(err){/*ignore, because error is thrown when event isn't registred*/};
         YAHOO.Bubbling.on("siteChanged", this.onSiteChanged, this);
         YAHOO.Bubbling.on("containerChanged", this.onContainerChanged, this);
      }

      return this;
   };

   /**
   * Alias to self
   */
   var DLGF = Alfresco.module.DoclibGlobalFolder;

   /**
   * View Mode Constants
   */
   YAHOO.lang.augmentObject(DLGF,
   {
      /**
       * "Site" view mode constant.
       *
       * @property VIEW_MODE_SITE
       * @type integer
       * @final
       * @default 0
       */
      VIEW_MODE_SITE: 0,

      /**
       * "Repository" view mode constant.
       *
       * @property VIEW_MODE_REPOSITORY
       * @type integer
       * @final
       * @default 1
       */
      VIEW_MODE_REPOSITORY: 1,

      /**
       * "My Files" view mode constant.
       *
       * @property VIEW_MODE_USERHOME
       * @type integer
       * @final
       * @default 2
       */
      VIEW_MODE_USERHOME: 2,

      /**
       * "Recent Sites" view mode constant.
       *
       * @property VIEW_MODE_RECENT_SITES
       * @type integer
       * @final
       * @default 3
       */
      VIEW_MODE_RECENT_SITES: 3,

      /**
       * "Favourite Sites" view mode constant.
       *
       * @property VIEW_MODE_FAVOURITE_SITES
       * @type integer
       * @final
       * @default 4
       */
      VIEW_MODE_FAVOURITE_SITES: 4,

      /**
       * "Shared" view mode constant.
       *
       * @property VIEW_MODE_SHARED
       * @type integer
       * @final
       * @default 5
       */
      VIEW_MODE_SHARED: 5
   });

   YAHOO.extend(Alfresco.module.DoclibGlobalFolder, Alfresco.component.Base,
   {
      /**
       * Object container for initialization options
       */
      options:
      {
         /**
          * Current siteId for site view mode.
          *
          * @property siteId
          * @type string
          */
         siteId: "",

         /**
          * Current site's title for site view mode.
          *
          * @property siteTitle
          * @type string
          */
         siteTitle: "",

         /**
          * ContainerId representing root container in site view mode
          *
          * @property containerId
          * @type string
          * @default "documentLibrary"
          */
         containerId: "documentLibrary",

         /**
          * ContainerType representing root container in site view mode
          *
          * @property containerType
          * @type string
          * @default "cm:folder"
          */
         containerType: "cm:folder",

         /**
          * Root node representing root container in repository view mode
          *
          * @property rootNode
          * @type string
          * @default "alfresco://company/home"
          */
         rootNode: "alfresco://company/home",

         /**
          * Root node representing root container in repository view mode
          *
          * @property sharedRoot
          * @type string
          * @default "alfresco://company/shared"
          */
         sharedRoot: "alfresco://company/shared",

         /**
          * NodeRef representing root container in user home view mode
          *
          * @property userHome
          * @type string
          * @default "alfresco://user/home"
          */
         userHome: "alfresco://user/home",

         /**
          * Initial path to expand on module load
          *
          * @property path
          * @type string
          * @default ""
          */
         path: "",

         /**
          * Initial node to expand on module load.
          *
          * If given this module will make a call to repo and find the path for the node and figure
          * out if its inside a site or not. If inside a site the site view mode  will be used, otherwise
          * it will switch to repo mode.
          *
          * @property pathNodeRef
          * @type string
          * @default ""
          */
         pathNodeRef: null,

         /**
          * Width for the dialog
          *
          * @property width
          * @type integer
          * @default 40em
          */
         width: "60em",

         /**
          * Files to action
          *
          * @property files
          * @type object
          * @default null
          */
         files: null,

         /**
          * Template URL
          *
          * @property templateUrl
          * @type string
          * @default Alfresco.constants.URL_SERVICECONTEXT + "modules/documentlibrary/global-folder"
          */
         templateUrl: Alfresco.constants.URL_SERVICECONTEXT + "modules/documentlibrary/global-folder",

         /**
          * Dialog view mode: site or repository
          *
          * @property viewMode
          * @type integer
          * @default Alfresco.modules.DoclibGlobalFolder.VIEW_MODE_SITE
          */
         viewMode: DLGF.VIEW_MODE_RECENT_SITES,

         /**
          * Default view mode
          *
          */
         defaultView: DLGF.VIEW_MODE_RECENT_SITES,

         /**
          * Allowed dialog view modes
          *
          * @property allowedViewModes
          * @type array
          * @default [VIEW_MODE_SITE, VIEW_MODE_REPOSITORY]
          */
         allowedViewModes:
         [
            DLGF.VIEW_MODE_SITE,
            DLGF.VIEW_MODE_RECENT_SITES,
            DLGF.VIEW_MODE_FAVOURITE_SITES,
            DLGF.VIEW_MODE_SHARED,
            DLGF.VIEW_MODE_REPOSITORY, // For Admins only
            DLGF.VIEW_MODE_USERHOME // My Files
         ],

         /**
          * Evaluate child folders flag (Site mode)
          *
          * @property evaluateChildFoldersSite
          * @type boolean
          * @default true
          */
         evaluateChildFoldersSite: true,

         /**
          * Maximum folder count configuration setting (Site mode)
          *
          * @property maximumFolderCountSite
          * @type int
          * @default -1
          */
         maximumFolderCountSite: -1,

         /**
          * Timeout for retrieving results from Repository
          *
          * @property webscriptTimeout
          * @type int
          * @default 7000
          */
         webscriptTimeout: 7000,

         /**
          * Evaluate child folders flag (Repo mode)
          *
          * @property evaluateChildFoldersRepo
          * @type boolean
          * @default true
          */
         evaluateChildFoldersRepo: true,

         /**
          * Maximum folder count configuration setting (Repo mode)
          *
          * @property maximumFolderCountRepo
          * @type int
          * @default -1
          */
         maximumFolderCountRepo: -1,


         /**
          * Config for sites with specific container types
          *
          * @property siteTreeContainerTypes
          * @type Object
          */
         siteTreeContainerTypes: {},

         /**
          * Sites API
          *
          * The URL to the API that returns site information
          *
          * @property sitesAPI
          * @type {String} Absolute URL
          */
         sitesAPI: Alfresco.constants.PROXY_URI + "api/people/" + encodeURIComponent(Alfresco.constants.USERNAME) + "/sites",

         /**
          * Sites API
          *
          * The URL to the API that returns site information
          *
          * @property recentSitesAPI
          * @type {String} Absolute URL
          */
         recentSitesAPI: Alfresco.constants.PROXY_URI + "api/people/" + encodeURIComponent(Alfresco.constants.USERNAME) + "/sites/recent",

         /**
          * Sites API
          *
          * The URL to the API that returns site information
          *
          * @property favouriteSitesAPI
          * @type {String} Absolute URL
          */
         favouriteSitesAPI: Alfresco.constants.PROXY_URI + "api/people/" + encodeURIComponent(Alfresco.constants.USERNAME) + "/sites/favourites",

         /**
          * Containers API
          *
          * The URL to the API that returns the container listing.
          *
          * @property containersAPI
          * @type {String} Absolute URL
          */
         containersAPI: Alfresco.constants.PROXY_URI + "slingshot/doclib/containers/",

         /**
          * The message that gets displayed if the template cannot be loaded.
          *
          *
          * @property templateFailMessage
          * @type {string} text of message to be displayed to the user in a dialogue
          */
         templateFailMessage: "Could not load 'global-folder' template",
         customFolderStyleConfig: null
      },


      /**
       * Container element for template in DOM.
       *
       * @property containerDiv
       * @type DOMElement
       */
      containerDiv: null,

      /**
       * Paths we have to expand as a result of a deep navigation event.
       *
       * @property pathsToExpand
       * @type array
       */
      pathsToExpand: null,

      /**
       * Selected tree node.
       *
       * @property selectedNode
       * @type {YAHOO.widget.Node}
       */
      selectedNode: null,

      /**
       * Current list of containers.
       *
       * @property containers
       * @type {object}
       */
      containers: null,

      /**
       * Main entry point
       * @method showDialog
       */
      showDialog: function DLGF_showDialog()
      {
         if (!this.containerDiv)
         {
            // Load the UI template from the server
            Alfresco.util.Ajax.request(
            {
               url: this.options.templateUrl,
               dataObj:
               {
                  htmlid: this.id
               },
               successCallback:
               {
                  fn: this.onTemplateLoaded,
                  scope: this
               },
               failureMessage: this.options.templateFailMessage,
               execScripts: true
            });
         }
         else
         {
            // Show the dialog
            this._beforeShowDialog();
         }
      },

      /**
       * Event callback when dialog template has been loaded
       *
       * @method onTemplateLoaded
       * @param response {object} Server response from load template XHR request
       */
      onTemplateLoaded: function DLGF_onTemplateLoaded(response)
      {
         // Reference to self - used in inline functions
         var me = this;

         // Inject the template from the XHR request into a new DIV element
         this.containerDiv = document.createElement("div");
         this.containerDiv.setAttribute("style", "display:none");
         this.containerDiv.innerHTML = response.serverResponse.responseText;

         // The panel is created from the HTML returned in the XHR request, not the container
         var dialogDiv = Dom.getFirstChild(this.containerDiv);

         // Create and render the YUI dialog
         this.widgets.dialog = Alfresco.util.createYUIPanel(dialogDiv,
         {
            width: this.options.width
         });

         // OK button
         this.widgets.okButton = Alfresco.util.createYUIButton(this, "ok", this.onOK, {additionalClass: "alf-primary-button"});

         // Cancel button
         this.widgets.cancelButton = Alfresco.util.createYUIButton(this, "cancel", this.onCancel);

         // Mode buttons
         var modeButtons = new YAHOO.widget.ButtonGroup(this.id + "-modeGroup");
         modeButtons.on("checkedButtonChange", this.onViewModeChange, this.widgets.modeButtons, this);
         this.widgets.modeButtons = modeButtons;

         // Make user enter-key-strokes also trigger a change
         var buttons = this.widgets.modeButtons.getButtons(),
            fnEnterListener = function(e)
            {
               if (KeyListener.KEY.ENTER == e.keyCode)
               {
                  this.set("checked", true);
               }
            };

         for (var i = 0; i < buttons.length; i++)
         {
            buttons[i].addListener("keydown", fnEnterListener);
         }

         /**
          * Dynamically loads TreeView nodes.
          * This MUST be inline in order to have access to the parent class.
          * @method fnLoadNodeData
          * @param node {object} Parent node
          * @param fnLoadComplete {function} Expanding node's callback function
          */
         this.fnLoadNodeData = function DLGF_oR_fnLoadNodeData(node, fnLoadComplete)
         {
            // Get the path this node refers to
            var nodePath = node.data.path;

            // Prepare URI for XHR data request
            var uri = me._buildTreeNodeUrl.call(me, nodePath);

            // Prepare the XHR callback object
            var callback =
            {
               success: function DLGF_lND_success(oResponse)
               {
                  var results = Alfresco.util.parseJSON(oResponse.responseText);

                  if (results.parent)
                  {
                     if (node.data.nodeRef.indexOf("alfresco://") === 0)
                     {
                        node.data.nodeRef = results.parent.nodeRef;
                     }

                     if (typeof node.data.userAccess == "undefined")
                     {
                        node.data.userAccess = results.parent.userAccess;
                        node.setUpLabel(
                        {
                           label: node.label,
                           style: results.parent.userAccess.create ? "" : "no-permission"
                        });
                        if (results.parent.userAccess.create == false)
                        {
                           node.parent.refresh();
                           if (this.selectedNode == node)
                           {
                              this.widgets.okButton.set("disabled", true);
                           }
                        }
                     }
                  }

                  if (results.items)
                  {
                     var item, tempNode;
                     for (var i = 0, j = results.items.length; i < j; i++)
                     {
                        item = results.items[i];
                        var isSyncSetMemberNode = this.options.mode == 'sync' && Alfresco.util.arrayContains(item.aspects, "sync:syncSetMemberNode");
                        tempNode = new YAHOO.widget.TextNode(
                        {
                           label: item.name,
                           path: $combine(nodePath, item.name),
                           nodeRef: item.nodeRef,
                           description: item.description,
                           userAccess: isSyncSetMemberNode ? false : item.userAccess,
                           style: isSyncSetMemberNode ? "no-permission" : (item.userAccess.create ? "" : "no-permission")
                        }, node, false);
                        var customStyleClass = this._buildCustomStyleClass(item);
                        tempNode.customCls = customStyleClass;

                        if (!item.hasChildren)
                        {
                           tempNode.isLeaf = true;
                        }
                     }

                     if (results.resultsTrimmed)
                     {
                        tempNode = new YAHOO.widget.TextNode(
                        {
                           label: "<" + this.msg("message.folders-trimmed", results.items.length) + ">",
                           hasIcon: false,
                           style: "folders-trimmed"
                        }, node, false);
                     }
                  }

                  /**
                  * Execute the node's loadComplete callback method which comes in via the argument
                  * in the response object
                  */
                  oResponse.argument.fnLoadComplete();
               },

               // If the XHR call is not successful, fire the TreeView callback anyway
               failure: function DLGF_lND_failure(oResponse)
               {
                  try
                  {
                     var response = YAHOO.lang.JSON.parse(oResponse.responseText);

                     // Show the error in place of the root node
                     var rootNode = this.widgets.treeview.getRoot();
                     var docNode = rootNode.children[0];
                     docNode.isLoading = false;
                     docNode.isLeaf = true;
                     docNode.label = response.message;
                     docNode.labelStyle = "ygtverror";
                     rootNode.refresh();
                  }
                  catch(e)
                  {
                  }
               },

               // Callback function scope
               scope: me,

               // XHR response argument information
               argument:
               {
                  "node": node,
                  "fnLoadComplete": fnLoadComplete
               },

               // Timeout -- abort the transaction after configurable period (default is 7 sec)
               timeout: me.options.webscriptTimeout
            };

            // Add a noCache parameter to the URL to ensure that XHR requests are always made to the
            // server when using IE. Otherwise IE7/8 will cache the response.
            if (YAHOO.env.ua.ie > 0)
            {
               uri += (uri.indexOf("?") == -1 ? "?" : "&") + "noCache=" + new Date().getTime();
            }

            // Make the XHR call using Connection Manager's asyncRequest method
            YAHOO.util.Connect.asyncRequest("GET", uri, callback);
         };

         // Show the dialog
         this._beforeShowDialog();
      },

      /**
       * Internal function called before show dialog function so additional information may be loaded
       * before _showDialog (which might be overriden) is called.
       *
       * @method _beforeShowDialog
       */
      _beforeShowDialog: function DLGF__beforeShowDialog()
      {
         if (this.options.pathNodeRef)
         {
            // If pathNodeRef is given the user of this component doesn't know what viewmode to display
            var url = Alfresco.constants.PROXY_URI + "slingshot/doclib/node/" + this.options.pathNodeRef.uri + "/location";
            if (this.options.rootNode)
            {
               // Repository mode
               url += "?libraryRoot=" + encodeURIComponent(this.options.rootNode.toString());
            }
            Alfresco.util.Ajax.jsonGet(
            {
               url: url,
               successCallback:
               {
                  fn: function(response)
                  {
                     if (response.json !== undefined)
                     {
                        var locations = response.json;
                        if (locations.site)
                        {
                           this.options.viewMode = DLGF.prototype.options.defaultView;
                           this.options.path = $combine(locations.site.path, locations.site.file);
                           this.options.siteId = locations.site.site;
                           this.options.siteTitle = locations.site.siteTitle;
                        }
                        else
                        {
                           this.options.viewMode = DLGF.VIEW_MODE_REPOSITORY;
                           this.options.path = $combine(locations.repo.path, locations.repo.file);
                           this.options.siteId = null;
                           this.options.siteTitle = null;
                        }
                        this._showDialog();
                     }
                  },
                  scope: this
               },
               failureMessage: this.msg("message.failure")
            });
         }
         else
         {
            this._showDialog();
         }
      },

      /**
       * Internal show dialog function
       * @method _showDialog
       */
      _showDialog: function DLGF__showDialog()
      {
         // Enable buttons
         this.widgets.okButton.set("disabled", false);
         this.widgets.cancelButton.set("disabled", false);

         // Dialog title
         var titleDiv = Dom.get(this.id + "-title");
         if (this.options.title)
         {
             titleDiv.innerHTML = this.options.title;
         }
         else
         {
            if (YAHOO.lang.isArray(this.options.files))
            {
               titleDiv.innerHTML = this.msg("title.multi", this.options.files.length);
            }
            else
            {
               titleDiv.innerHTML = this.msg("title.single", '<span class="light">' + $html(this.options.files.displayName) + '</span>');
            }
         }

         // Dialog view mode
         var allowedViewModes = Alfresco.util.arrayToObject(this.options.allowedViewModes);
         
         // Remove any views that should be hidden...
         for (var i = 0; i < Alfresco.constants.HIDDEN_PICKER_VIEW_MODES.length; i++)
         {
            delete allowedViewModes[DLGF[Alfresco.constants.HIDDEN_PICKER_VIEW_MODES[i]]];
         }
         
         var modeButtons = this.widgets.modeButtons.getButtons(),
             modeButton, viewMode;

         if (!(this.options.viewMode in allowedViewModes))
         {
            this.options.viewMode = this.options.allowedViewModes[0];
         }
         for (var i = 0, ii = modeButtons.length; i < ii; i++)
         {
            modeButton = modeButtons[i];
            viewMode = parseInt(modeButton.get("name"), 10);
            modeButton.set("disabled", !(viewMode in allowedViewModes));
            modeButton.setStyle("display", viewMode in allowedViewModes ? "block" : "none");
            if (viewMode == this.options.viewMode)
            {
               if (modeButton.get("checked"))
               {
                  // Will trigger the path expansion
                  this.setViewMode(viewMode);
               }
               else
               {
                  modeButton.set("checked", true);
               }
            }
         }

         // Register the ESC key to close the dialog
         if (!this.widgets.escapeListener)
         {
            this.widgets.escapeListener = new KeyListener(document,
            {
               keys: KeyListener.KEY.ESCAPE
            },
            {
               fn: function(id, keyEvent)
               {
                  this.onCancel();
               },
               scope: this,
               correctScope: true
            });
         }

         // Add the dialog to the dom
         this.widgets.dialog.render(this.options.parentElement || document.body);

         // MNT-11084 Full screen/window view: Actions works incorrectly;
         if (this.options.zIndex !== undefined && this.options.zIndex > 0)
         {
            var index = this.options.zIndex + 2;
            var dialog = this.widgets.dialog;
            var onBeforeShow = function () 
            {
               elements = Dom.getElementsByClassName("mask");
               //there can be more "mask"s on a page; make sure all of them have lower zIndexes
               for (i = 0, j = elements.length; i < j; i++)
               {
                  Dom.setStyle(elements[i], "zIndex", index - 1);
               }

               Dom.setStyle(dialog.element, "zIndex", index);
               dialog.cfg.setProperty("zIndex", index, true);
            }
            this.widgets.dialog.beforeShowEvent.subscribe(onBeforeShow, this.widgets.dialog, true);
         }

         // Show the dialog
         this.widgets.escapeListener.enable();
         this.widgets.dialog.show();
      },

      /**
       * Public function to set current dialog view mode
       *
       * @method setViewMode
       * @param viewMode {integer} New dialog view mode constant
       */
      setViewMode: function DLGF_setViewMode(viewMode)
      {
         this.options.viewMode = viewMode;

         if (this._isSiteViewMode(viewMode))
         {
            Dom.get(this.id + "-treeview").innerHTML = "";
            Dom.removeClass(this.id + "-wrapper", "repository-mode");
            this._populateSitePicker(viewMode);
         }
         else
         {
            Dom.addClass(this.id + "-wrapper", "repository-mode");
            // Build the TreeView widget
            var treeLocation = this.options.rootNode;

            if (viewMode == DLGF.VIEW_MODE_USERHOME)
            {
               treeLocation = this.options.userHome
            } else if (viewMode == DLGF.VIEW_MODE_SHARED)
            {
               treeLocation = this.options.sharedRoot;
            }

            this._buildTree(treeLocation);
            this.onPathChanged(this.options.path ? this.options.path : "/");
         }
      },


      /**
       * BUBBLING LIBRARY EVENT HANDLERS
       * Disconnected event handlers for event notification
       */

      /**
       * Site Changed event handler
       *
       * @method onSiteChanged
       * @param layer {object} Event fired
       * @param args {array} Event parameters (depends on event type)
       */
      onSiteChanged: function DLGF_onSiteChanged(layer, args)
      {
         // Check the event is directed towards this instance
         if ($hasEventInterest(this, args))
         {
            var obj = args[1];
            if (obj !== null)
            {
               // Should be a site in the arguments
               if (obj.site !== null)
               {
                  this.options.siteId = obj.site;
                  this.options.siteTitle = obj.siteTitle;
                  this._populateContainerPicker();
                  var sites = Selector.query("a", this.id + "-sitePicker"), site, i, j,
                     picker = Dom.get(this.id + "-sitePicker");

                  for (i = 0, j = sites.length; i < j; i++)
                  {
                     site = sites[i];
                     if (site.getAttribute("rel") == obj.site)
                     {
                        Dom.addClass(site, "selected");
                        if (obj.scrollTo)
                        {
                           picker.scrollTop = Dom.getY(site) - Dom.getY(picker);
                        }
                     }
                     else
                     {
                        Dom.removeClass(site, "selected");
                     }
                  }
               }
            }
         }
      },

      /**
       * Container Changed event handler
       *
       * @method onContainerChanged
       * @param layer {object} Event fired
       * @param args {array} Event parameters (depends on event type)
       */
      onContainerChanged: function DLGF_onContainerChanged(layer, args)
      {
         // Check the event is directed towards this instance
         if ($hasEventInterest(this, args))
         {
            var obj = args[1];
            if (obj !== null)
            {
               // Should be a container in the arguments
               if (obj.container !== null)
               {
                  this.options.containerId = obj.container;
                  this.options.containerType = this.containers[obj.container].type;
                  this._buildTree(this.containers[obj.container].nodeRef);
                  // Kick-off navigation to current path
                  this.onPathChanged(this.options.path);
                  var containers = Selector.query("a", this.id + "-containerPicker"), container, i, j,
                     picker = Dom.get(this.id + "-containerPicker");

                  for (i = 0, j = containers.length; i < j; i++)
                  {
                     container = containers[i];
                     if (container.getAttribute("rel") == obj.container)
                     {
                        Dom.addClass(container, "selected");
                        if (obj.scrollTo)
                        {
                           picker.scrollTop = Dom.getY(container) - Dom.getY(picker);
                        }
                     }
                     else
                     {
                        Dom.removeClass(container, "selected");
                     }
                  }
               }
            }
         }
      },


      /**
       * YUI WIDGET EVENT HANDLERS
       * Handlers for standard events fired from YUI widgets, e.g. "click"
       */

      /**
       * Dialog OK button event handler
       *
       * @method onOK
       * @param e {object} DomEvent
       * @param p_obj {object} Object passed back from addListener method
       */
      onOK: function DLGF_onOK(e, p_obj)
      {
         // Close dialog and fire event so other components may use the selected folder
         this.widgets.escapeListener.disable();
         this.widgets.dialog.hide();

         var selectedFolder = this.selectedNode ? this.selectedNode.data : null;
         if (selectedFolder && this._isSiteViewMode(this.options.viewMode))
         {
            selectedFolder.siteId = this.options.siteId;
            selectedFolder.siteTitle = this.options.siteTitle;
            selectedFolder.containerId = this.options.containerId;
         }

         YAHOO.Bubbling.fire("folderSelected",
         {
            selectedFolder: selectedFolder,
            eventGroup: this
         });
      },

      /**
       * Dialog Cancel button event handler
       *
       * @method onCancel
       * @param e {object} DomEvent
       * @param p_obj {object} Object passed back from addListener method
       */
      onCancel: function DLGF_onCancel(e, p_obj)
      {
         this.widgets.escapeListener.disable();
         this.widgets.dialog.hide();
      },

      /**
       * Mode change buttongroup event handler
       *
       * @method onViewModeChange
       * @param e {object} DomEvent
       * @param p_obj {object} Object passed back from addListener method
       */
      onViewModeChange: function DLGF_onViewModeChange(e, p_obj)
      {
         var viewMode = this.options.viewMode;
         try
         {
            viewMode = parseInt(e.newValue.get("name"), 10);
            this.setViewMode(viewMode);
         }
         catch(ex)
         {
            // Remain in current view mode
         }
      },

      /**
       * Fired by YUI TreeView when a node has finished expanding
       * @method onExpandComplete
       * @param oNode {YAHOO.widget.Node} the node recently expanded
       */
      onExpandComplete: function DLGF_onExpandComplete(oNode)
      {
         Alfresco.logger.debug("DLGF_onExpandComplete");

         // Make sure the tree's DOM has been updated
         this.widgets.treeview.render();
         // Redrawing the tree will clear the highlight
         this._showHighlight(true);

         if (this.pathsToExpand && this.pathsToExpand.length > 0)
         {
            var node = this.widgets.treeview.getNodeByProperty("path", this.pathsToExpand.shift());
            if (node !== null)
            {
               var el = node.getContentEl(),
                  container = Dom.get(this.id + "-treeview");

               container.scrollTop = Dom.getY(el) - (container.scrollHeight / 3);

               if (node.data.path == this.currentPath)
               {
                  this._updateSelectedNode(node);
               }
               node.expand();
            }
         }
      },

      /**
       * Fired by YUI TreeView when a node label is clicked
       * @method onNodeClicked
       * @param args.event {HTML Event} the event object
       * @param args.node {YAHOO.widget.Node} the node clicked
       * @return allowExpand {boolean} allow or disallow node expansion
       */
      onNodeClicked: function DLGF_onNodeClicked(args)
      {
         Alfresco.logger.debug("DLGF_onNodeClicked");

         var e = args.event,
            node = args.node,
            userAccess = node.data.userAccess;

         if ((userAccess && userAccess.create) || (node.data.nodeRef == "") || (node.data.nodeRef.indexOf("alfresco://") === 0))
         {
            this.onPathChanged(node.data.path);
            this._updateSelectedNode(node);
         }

         Event.preventDefault(e);
         return false;
      },


      /**
       * Update tree when the path has changed
       * @method onPathChanged
       * @param path {string} new path
       */
      onPathChanged: function DLGF_onPathChanged(path)
      {
         this._showHighlight(false);
         this.selectedNode = null;
		 
         Alfresco.logger.debug("DLGF_onPathChanged:" + path);

         // ensure path starts with leading slash if not the root node
         if (path.charAt(0) != "/")
         {
            path = "/" + path;
         }
         this.currentPath = path;

         // Search the tree to see if this path's node is expanded
         var node = this.widgets.treeview.getNodeByProperty("path", path);
         if (node !== null)
         {
            // Node found
            this._updateSelectedNode(node);
            node.expand();
            while (node.parent !== null)
            {
               node = node.parent;
               node.expand();
            }
            return;
         }

         /**
          * The path's node hasn't been loaded into the tree. Create a stack
          * of parent paths that we need to expand one-by-one in order to
          * eventually display the current path's node
          */
         var paths = path.split("/"),
            expandPath = "/";
         // Check for root path special case
         if (path === "/")
         {
            paths = [""];
         }
         this.pathsToExpand = [];

         for (var i = 0, j = paths.length; i < j; i++)
         {
            // Push the path onto the list of paths to be expanded
            expandPath = $combine("/", expandPath, paths[i]);
            this.pathsToExpand.push(expandPath);
         }
         Alfresco.logger.debug("DLGF_onPathChanged paths to expand:" + this.pathsToExpand.join(","));
         // Kick off the expansion process by expanding the first unexpanded path
         do
         {
            node = this.widgets.treeview.getNodeByProperty("path", this.pathsToExpand.shift());
            if (this.selectedNode == null)
            {
               this._updateSelectedNode(node);
            }
         } while (this.pathsToExpand.length > 0 && node.expanded);

         if (node !== null)
         {
            node.expand();
         }
      },


      /**
       * PRIVATE FUNCTIONS
       */

      /**
       * Creates the Site Picker control.
       * @method _populateSitePicker
       * @param viewMode {integer}
       * @private
       */
      _populateSitePicker: function DLGF__populateSitePicker(viewMode)
      {
         var sitePicker = Dom.get(this.id + "-sitePicker"),
            me = this;

         sitePicker.innerHTML = "";

         var fnSuccess = function DLGF__pSP_fnSuccess(response, sitePicker)
         {
            var sites = response.json, element, site, i, j, firstSite = null;

            var fnClick = function DLGF_pSP_onclick(site)
            {
               return function()
               {
                  YAHOO.Bubbling.fire("siteChanged",
                     {
                        site: site.shortName,
                        siteTitle: site.title,
                        eventGroup: me
                     });
                  return false;
               };
            };

            if (sites.length > 0)
            {
               firstSite = sites[0];
            }

            for (i = 0, j = sites.length; i < j; i++)
            {
               site = sites[i];

               if (Alfresco.util.arrayToObject(site.shortName))
               {
                  if (firstSite == null)
                  {
                     firstSite = site;
                  }

                  element = document.createElement("div");
                  if (i == j - 1)
                  {
                     Dom.addClass(element, "last");
                  }

                  element.innerHTML = '<a rel="' + site.shortName + '" href="#""><h4>' + $html(site.title) + '</h4>' + '<span>' + $html(site.description) + '</span></a>';
                  element.onclick = fnClick(site);
                  sitePicker.appendChild(element);
               }
            }

            // Select current site, or first site retrieved
            if (firstSite != null)
            {
               YAHOO.Bubbling.fire("siteChanged",
                  {
                     site: (this.options.siteId && this.options.siteId.length > 0) ? this.options.siteId : firstSite.shortName,
                     siteTitle: (this.options.siteId && this.options.siteId.length > 0) ? this.options.siteTitle : firstSite.title,
                     eventGroup: this,
                     scrollTo: true
                  });
            }
         }

         var sitesAPI = this.options.sitesAPI;

         // Filter sites list by favourites or recent, as applicable.
         if (viewMode === DLGF.VIEW_MODE_RECENT_SITES)
         {
            sitesAPI = this.options.recentSitesAPI;
         }
         else if (viewMode === DLGF.VIEW_MODE_FAVOURITE_SITES)
         {
            sitesAPI = this.options.favouriteSitesAPI;
         }

         var config =
         {
            url: sitesAPI,
            responseContentType: Alfresco.util.Ajax.JSON,
            successCallback:
            {
               fn: fnSuccess,
               scope: this,
               obj: sitePicker
            },
            failureCallback: null
         };

         Alfresco.util.Ajax.request(config);
      },

      /**
       * Creates the Container Picker control.
       * @method _populateContainerPicker
       * @private
       */
      _populateContainerPicker: function DLGF__populateContainerPicker()
      {
         var containerPicker = Dom.get(this.id + "-containerPicker"),
            me = this;

         containerPicker.innerHTML = "";

         var fnSuccess = function DLGF__pCP_fnSuccess(response, containerPicker)
         {
            var containers = response.json.containers, element, container, i, j;
            this.containers = {};

            var fnClick = function DLGF_pCP_onclick(containerName)
            {
               return function()
               {
                  YAHOO.Bubbling.fire("containerChanged",
                  {
                     container: containerName,
                     eventGroup: me
                  });
                  return false;
               };
            };

            for (i = 0, j = containers.length; i < j; i++)
            {
               container = containers[i];
               this.containers[container.name] = container;
               element = document.createElement("div");
               if (i == j - 1)
               {
                  Dom.addClass(element, "last");
               }

               element.innerHTML = '<a rel="' + container.name + '" href="#"><h4>' + container.name + '</h4>' + '<span>' + container.description + '</span></a>';
               element.onclick = fnClick(container.name);
               containerPicker.appendChild(element);
            }

            // Select current container
            YAHOO.Bubbling.fire("containerChanged",
            {
               container: this.options.containerId,
               eventGroup: this,
               scrollTo: true
            });
         };

         var fnFailure = function DLGF_pCP_fnFailure(response)
         {
            try
            {
               // Show a message in place of the root node
               var rootNode = this.widgets.treeview.getRoot(),
                  docNode = rootNode.children[0];

               docNode.isLoading = false;
               docNode.isLeaf = true;
               docNode.label = this.msg("message.error");
               docNode.labelStyle = "ygtverror";
               rootNode.refresh();
            }
            catch(e)
            {
            }
            containerPicker.innerHTML = '';
         };

         var containerURL = Alfresco.util.parseURL(this.options.containersAPI);
         containerURL.pathname += this.options.siteId;

         var config =
         {
            url: containerURL.getUrl(),
            responseContentType: Alfresco.util.Ajax.JSON,
            successCallback:
            {
               fn: fnSuccess,
               scope: this,
               obj: containerPicker
            },
            failureCallback:
            {
               fn: fnFailure,
               scope: this
            }
         };

         Alfresco.util.Ajax.request(config);
      },

      /**
       * Creates the TreeView control and renders it to the parent element.
       * @method _buildTree
       * @param p_rootNodeRef {string} NodeRef of root node for this tree
       * @private
       */
      _buildTree: function DLGF__buildTree(p_rootNodeRef)
      {
         Alfresco.logger.debug("DLGF__buildTree");

         // Create a new tree
         var tree = new YAHOO.widget.TreeView(this.id + "-treeview");
         this.widgets.treeview = tree;

         // Having both focus and highlight are just confusing (YUI 2.7.0 addition)
         YAHOO.widget.TreeView.FOCUS_CLASS_NAME = "";

         // Turn dynamic loading on for entire tree
         tree.setDynamicLoad(this.fnLoadNodeData);

         var rootLabel = "location.path.repository";
         if (this._isSiteViewMode(this.options.viewMode))
         {
            var treeConfig = this.options.siteTreeContainerTypes[this.options.containerType] || {};
            rootLabel = treeConfig.rootLabel || "location.path.documents";
         }
         else if (this.options.viewMode == DLGF.VIEW_MODE_USERHOME)
         {
            rootLabel = "location.path.myfiles";
         }
         else if (this.options.viewMode == DLGF.VIEW_MODE_SHARED)
         {
            rootLabel = "location.path.shared";
         }

         // Add default top-level node
         var tempNode = new YAHOO.widget.TextNode(
         {
            label: this.msg(rootLabel),
            path: "/",
            nodeRef: p_rootNodeRef
         }, tree.getRoot(), false);

         // Register tree-level listeners
         tree.subscribe("clickEvent", this.onNodeClicked, this, true);
         tree.subscribe("expandComplete", this.onExpandComplete, this, true);

         // Render tree with this one top-level node
         tree.render();
      },

      /**
       * Highlights the currently selected node.
       * @method _showHighlight
       * @param isVisible {boolean} Whether the highlight is visible or not
       * @private
       */
      _showHighlight: function DLGF__showHighlight(isVisible)
      {
         Alfresco.logger.debug("DLGF__showHighlight");

         if (this.selectedNode !== null)
         {
            if (isVisible)
            {
               Dom.addClass(this.selectedNode.getEl(), "selected");
            }
            else
            {
               Dom.removeClass(this.selectedNode.getEl(), "selected");
            }
         }
      },

      /**
       * Updates the currently selected node.
       * @method _updateSelectedNode
       * @param node {object} New node to set as currently selected one
       * @private
       */
      _updateSelectedNode: function DLGF__updateSelectedNode(node)
      {
         Alfresco.logger.debug("DLGF__updateSelectedNode");

         this._showHighlight(false);
         this.selectedNode = node;
         this._showHighlight(true);

         // ALF-20094 fix, don't allow user to press ok button if he has no create access in selected target
         if (node.data.userAccess && !node.data.userAccess.create)
         {
            this.widgets.okButton.set("disabled", true);
         }
         else
         {
            this.widgets.okButton.set("disabled", false);
         }
      },

      /**
       * Build URI parameter string for treenode JSON data webscript
       *
       * @method _buildTreeNodeUrl
       * @param path {string} Path to query
       */
      _buildTreeNodeUrl: function DLGF__buildTreeNodeUrl(path)
      {
         var uriTemplate = Alfresco.constants.PROXY_URI;
         if (this._isSiteViewMode(this.options.viewMode))
         {
            var treeConfig = this.options.siteTreeContainerTypes[this.options.containerType] || {};
            if (treeConfig.uri)
            {
               uriTemplate += treeConfig.uri;
            }
            else
            {
               uriTemplate += "slingshot/doclib/treenode/site/{site}/{container}{path}";
               uriTemplate += "?children={evaluateChildFoldersSite}";
               uriTemplate += "&max={maximumFolderCountSite}";
            }
         }
         else
         {
            if (this.options.viewMode == DLGF.VIEW_MODE_USERHOME)
            {
               uriTemplate += "slingshot/doclib/treenode/node/{userHome}{path}";
               uriTemplate += "?children={evaluateChildFoldersRepo}";
            }
            else if (this.options.viewMode == DLGF.VIEW_MODE_SHARED)
            {
               uriTemplate += "slingshot/doclib/treenode/node/{sharedRootPath}{path}";
               uriTemplate += "?children={evaluateChildFoldersRepo}";
               uriTemplate += "&libraryRoot={sharedRoot}";
            }
            else
            {
               uriTemplate += "slingshot/doclib/treenode/node/alfresco/company/home{path}";
               uriTemplate += "?children={evaluateChildFoldersRepo}";
               uriTemplate += "&libraryRoot={rootNode}";
            }
            uriTemplate += "&max={maximumFolderCountRepo}";
         }

         var url = YAHOO.lang.substitute(uriTemplate,
         {
            site: encodeURIComponent(this.options.siteId),
            container: encodeURIComponent(this.options.containerId),
            rootNode: this.options.rootNode,
            userHome: (this.options.userHome || "").replace(":/", ""),
            sharedRoot: this.options.sharedRoot,
            sharedRootPath: this.options.sharedRoot.replace(":/", ""),
            path: Alfresco.util.encodeURIPath(path),
            evaluateChildFoldersSite: this.options.evaluateChildFoldersSite + '',
            maximumFolderCountSite: this.options.maximumFolderCountSite,
            evaluateChildFoldersRepo: this.options.evaluateChildFoldersRepo + '',
            maximumFolderCountRepo: this.options.maximumFolderCountRepo
         });

         return url;
      },
      
      /**
       * Gets resource style specified in the {style} configuration that corresponds with matching filter 
       * from share-documentlibrary-config.xml [CommonComponentStyle][component-style], {browse.folder} component, or null if the filter does not match.
       * 
       * The returned value is used to be set to the treeNode as customCls attribute, used for rendering custom icons in treeView. 
       * @param p_oData
       */
      _buildCustomStyleClass : function DLGF__buildCustomStyleClass(p_oData)
      {
         var customStyleClass = null;
         if (this.options.customFolderStyleConfig)
         {
            var filterChain = new Alfresco.CommonComponentStyleFilterChain(p_oData,
                  this.options.customFolderStyleConfig.browse.folder);
            customStyleClass = filterChain.createCustomStyle();
         }
         return customStyleClass;
      },

      /**
       *
       * Is the view mode a view on sites?
       *
       * @method _isSiteViewMode
       * @param viewMode
       * @return {boolean}
       */
      _isSiteViewMode: function DLGF__isSiteViewMode(viewMode)
      {
         var siteModes = [DLGF.VIEW_MODE_SITE, DLGF.VIEW_MODE_FAVOURITE_SITES, DLGF.VIEW_MODE_RECENT_SITES];
         return (Alfresco.util.arrayContains(siteModes, viewMode))
      }
   });

   /* Dummy instance to load optional YUI components early */
   var dummyInstance = new Alfresco.module.DoclibGlobalFolder("null");
})();
/**
 * Copyright (C) 2005-2010 Alfresco Software Limited.
 *
 * This file is part of Alfresco
 *
 * Alfresco is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Alfresco is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with Alfresco. If not, see <http://www.gnu.org/licenses/>.
 */

/**
 * Document Library "Copy- and Move-To" module for Document Library.
 *
 * @namespace Alfresco.module
 * @class Alfresco.module.DoclibCopyMoveTo
 */
(function()
{
   Alfresco.module.DoclibCopyMoveTo = function(htmlId)
   {
      Alfresco.module.DoclibCopyMoveTo.superclass.constructor.call(this, htmlId);

      // Re-register with our own name
      this.name = "Alfresco.module.DoclibCopyMoveTo";
      var DLGF = Alfresco.module.DoclibGlobalFolder;

      Alfresco.util.ComponentManager.reregister(this);

      this.options = YAHOO.lang.merge(this.options,
      {
         allowedViewModes:
         [
            DLGF.VIEW_MODE_SITE,
            DLGF.VIEW_MODE_RECENT_SITES,
            DLGF.VIEW_MODE_FAVOURITE_SITES,
            DLGF.VIEW_MODE_SHARED,
            DLGF.VIEW_MODE_REPOSITORY,
            DLGF.VIEW_MODE_USERHOME
         ],
         extendedTemplateUrl: Alfresco.constants.URL_SERVICECONTEXT + "modules/documentlibrary/copy-move-to"
      });

      return this;
   };

   YAHOO.extend(Alfresco.module.DoclibCopyMoveTo, Alfresco.module.DoclibGlobalFolder,
   {
      /**
       * Set multiple initialization options at once.
       *
       * @method setOptions
       * @override
       * @param obj {object} Object literal specifying a set of options
       * @return {Alfresco.module.DoclibMoveTo} returns 'this' for method chaining
       */
      setOptions: function DLCMT_setOptions(obj)
      {
         var myOptions = {};

         if (typeof obj.mode !== "undefined")
         {
            var dataWebScripts =
            {
               copy: "copy-to",
               move: "move-to",
               unzip: "unzip-to"
            };
            if (typeof dataWebScripts[obj.mode] == "undefined")
            {
               throw new Error("Alfresco.module.CopyMoveTo: Invalid mode '" + obj.mode + "'");
            }
            myOptions.dataWebScript = dataWebScripts[obj.mode];
         }

         myOptions.viewMode = Alfresco.module.DoclibGlobalFolder.VIEW_MODE_RECENT_SITES; // Always default to recent sites view.
         // Actions module
         this.modules.actions = new Alfresco.module.DoclibActions();

         return Alfresco.module.DoclibCopyMoveTo.superclass.setOptions.call(this, YAHOO.lang.merge(myOptions, obj));
      },

      /**
       * Event callback when superclass' dialog template has been loaded
       *
       * @method onTemplateLoaded
       * @override
       * @param response {object} Server response from load template XHR request
       */
      onTemplateLoaded: function DLCMT_onTemplateLoaded(response)
      {
         // Load the UI template, which only will bring in new i18n-messages, from the server
         Alfresco.util.Ajax.request(
         {
            url: this.options.extendedTemplateUrl,
            dataObj:
            {
               htmlid: this.id
            },
            successCallback:
            {
               fn: this.onExtendedTemplateLoaded,
               obj: response,
               scope: this
            },
            failureMessage: "Could not load 'copy-move-to' template:" + this.options.extendedTemplateUrl,
            execScripts: true
         });
      },

      /**
       * Event callback when this class' template has been loaded
       *
       * @method onExtendedTemplateLoaded
       * @override
       * @param response {object} Server response from load template XHR request
       */
      onExtendedTemplateLoaded: function DLCMT_onExtendedTemplateLoaded(response, superClassResponse)
      {
         // Now that we have loaded this components i18n messages let the original template get rendered.
         Alfresco.module.DoclibCopyMoveTo.superclass.onTemplateLoaded.call(this, superClassResponse);
      },

      /**
       * YUI WIDGET EVENT HANDLERS
       * Handlers for standard events fired from YUI widgets, e.g. "click"
       */

      /**
       * Dialog OK button event handler
       *
       * @method onOK
       * @param e {object} DomEvent
       * @param p_obj {object} Object passed back from addListener method
       */
      onOK: function DLCMT_onOK(e, p_obj)
      {
         var files, multipleFiles = [], params, i, j,
            eventSuffix =
            {
               copy: "Copied",
               move: "Moved",
               unzip: "Unzipped"
            };

         // Single/multi files into array of nodeRefs
         if (YAHOO.lang.isArray(this.options.files))
         {
            files = this.options.files;
         }
         else
         {
            files = [this.options.files];
         }
         for (i = 0, j = files.length; i < j; i++)
         {
            multipleFiles.push(files[i].node.nodeRef);
         }

         // Success callback function
         var fnSuccess = function DLCMT__onOK_success(p_data)
         {
            var result,
               successCount = p_data.json.successCount,
               failureCount = p_data.json.failureCount;

            this.widgets.dialog.hide();

            // Did the operation succeed?
            if (!p_data.json.overallSuccess)
            {
               //MNT-7514 Uninformational error message on move when file name conflicts
               var message = "message.failure";
               for (var i = 0, j = p_data.json.totalResults; i < j; i++)
               {
                  result = p_data.json.results[i];

                  if (!result.success && result.fileExist)
                  {
                     if ("folder" == result.type)
                     {
                        message = "message.exists.failure.folder";
                     }
                     else
                     {
                        message = "message.exists.failure.file";
                     }
                  }
               }

               Alfresco.util.PopupManager.displayMessage(
               {
                  text: this.msg(message),
                  zIndex: this.options.zIndex
               }, this.options.parentElement);

               return;
            }

            YAHOO.Bubbling.fire("files" + eventSuffix[this.options.mode],
            {
               destination: this.currentPath,
               successCount: successCount,
               failureCount: failureCount
            });

            for (var i = 0, j = p_data.json.totalResults; i < j; i++)
            {
               result = p_data.json.results[i];

               if (result.success)
               {
                  YAHOO.Bubbling.fire((result.type == "folder" ? "folder" : "file") + eventSuffix[this.options.mode],
                  {
                     multiple: true,
                     nodeRef: result.nodeRef,
                     destination: this.currentPath
                  });
               }
            }
            // ALF-18501 - Redirect on successful moves of documents within the details view.
            if (this.options.mode == "move" &&
                window.location.pathname.lastIndexOf("document-details") === (window.location.pathname.length - "document-details".length))
            {
               // By reloading the page, the node-header will detect that the node is located in a different
               // site and cause a redirect. The down-side to this is that it causes two page loads but this
               // is most likely quite an edge case and it does ensure that we're re-using a consistent code path
               window.location.reload();
            }
            else
            {
               Alfresco.util.PopupManager.displayMessage(
               {
                  text: this.msg("message.success", successCount),
                  zIndex: this.options.zIndex
               }, this.options.parentElement);
               YAHOO.Bubbling.fire("metadataRefresh");
            }
         };

         // Failure callback function
         var fnFailure = function DLCMT__onOK_failure(p_data)
         {
            this.widgets.dialog.hide();

            var msgFailure = "message.failure";

            if (p_data && p_data.serverResponse && p_data.serverResponse.status == 408)
            {
               msgFailure  = "message.timeout";
            }

            Alfresco.util.PopupManager.displayMessage(
            {
               text: this.msg(msgFailure),
               zIndex: this.options.zIndex
            }, this.options.parentElement);
         };

         // Construct webscript URI based on current viewMode
         var webscriptName = this.options.dataWebScript + "/node/{nodeRef}",
            nodeRef = new Alfresco.util.NodeRef(this.selectedNode.data.nodeRef);

         // Construct the data object for the genericAction call
         this.modules.actions.genericAction(
         {
            success:
            {
               callback:
               {
                  fn: fnSuccess,
                  scope: this
               }
            },
            failure:
            {
               callback:
               {
                  fn: fnFailure,
                  scope: this
               }
            },
            webscript:
            {
               method: Alfresco.util.Ajax.POST,
               name: webscriptName,
               params:
               {
                  nodeRef: nodeRef.uri
               }
            },
            wait:
            {
               message: this.msg("message.please-wait")
            },
            config:
            {
               requestContentType: Alfresco.util.Ajax.JSON,
               dataObj:
               {
                  nodeRefs: multipleFiles,
		  parentId: this.options.parentId
               }
            }
         });

         this.widgets.okButton.set("disabled", true);
         this.widgets.cancelButton.set("disabled", true);
      },

      /**
       * Gets a custom message depending on current view mode
       * and use superclasses
       *
       * @method msg
       * @param messageId {string} The messageId to retrieve
       * @return {string} The custom message
       * @override
       */
      msg: function DLCMT_msg(messageId)
      {
         var result = Alfresco.util.message.call(this, this.options.mode + "." + messageId, this.name, Array.prototype.slice.call(arguments).slice(1));
         if (result ==  (this.options.mode + "." + messageId))
         {
            result = Alfresco.util.message.call(this, messageId, this.name, Array.prototype.slice.call(arguments).slice(1))
         }
         if (result == messageId)
         {
            result = Alfresco.util.message(messageId, "Alfresco.module.DoclibGlobalFolder", Array.prototype.slice.call(arguments).slice(1));
         }
         return result;
      },


      /**
       * PRIVATE FUNCTIONS
       */

      /**
       * Internal show dialog function
       * @method _showDialog
       * @override
       */
      _showDialog: function DLCMT__showDialog()
      {
         this.widgets.okButton.set("label", this.msg("button"));
         return Alfresco.module.DoclibCopyMoveTo.superclass._showDialog.apply(this, arguments);
      }
   });

   /* Dummy instance to load optional YUI components early */
   var dummyInstance = new Alfresco.module.DoclibCopyMoveTo("null");
})();/**
 * Copyright (C) 2005-2012 Alfresco Software Limited.
 *
 * This file is part of Alfresco
 *
 * Alfresco is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Alfresco is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with Alfresco. If not, see <http://www.gnu.org/licenses/>.
 */

/**
 * Document Library "Permissions" module for Document Library.
 * 
 * @namespace Alfresco.module
 * @class Alfresco.module.DoclibPermissions
 */
(function()
{
   /**
    * YUI Library aliases
    */
   var Dom = YAHOO.util.Dom;

   /**
    * Alfresco Slingshot aliases
    */
   var $html = Alfresco.util.encodeHTML;

   Alfresco.module.DoclibPermissions = function(htmlId)
   {
      Alfresco.module.DoclibPermissions.superclass.constructor.call(this, "Alfresco.module.DoclibPermissions", htmlId, ["button", "container", "connection", "json"]);
      
      // Initialise prototype properties
      this.rolePickers = {};
      this.hiddenRoles = {};
      
      return this;
   };
   
   YAHOO.extend(Alfresco.module.DoclibPermissions, Alfresco.component.Base,
   {
      /**
       * Object container for initialization options
       */
      options:
      {
         /**
          * Current siteId.
          * 
          * @property siteId
          * @type string
          */
         siteId: "",

         /**
          * Available roles
          *
          * @property: roles
          * @type: array
          * @default: null
          */
         roles: null,

         /**
          * File(s) to apply permissions against
          *
          * @property: files
          * @type: array
          * @default: null
          */
         files: null,

         /**
          * Width for the dialog
          *
          * @property: width
          * @type: integer
          * @default: 44em
          */
         width: "44em"
      },
      
      /**
       * Object container for storing role picker UI elements.
       * 
       * @property rolePickers
       * @type object
       */
      rolePickers: null,

      /**
       * Object container for storing roles that picker doesn't show
       * 
       * @property hiddenRoles
       * @type objects
       */
      hiddenRoles: null,

      /**
       * Container element for template in DOM.
       * 
       * @property containerDiv
       * @type DOMElement
       */
      containerDiv: null,

      /**
       * Main entry point
       * @method showDialog
       */
      showDialog: function DLP_showDialog()
      {
         // Clear cached values
         this.hiddenRoles = {};
         
         // DocLib Actions module
         if (!this.modules.actions)
         {
            this.modules.actions = new Alfresco.module.DoclibActions();
         }
         
         if (!this.containerDiv)
         {
            // Load the UI template from the server
            Alfresco.util.Ajax.request(
            {
               url: Alfresco.constants.URL_SERVICECONTEXT + "modules/documentlibrary/permissions",
               dataObj:
               {
                  htmlid: this.id,
                  site: this.options.siteId
               },
               successCallback:
               {
                  fn: this.onTemplateLoaded,
                  scope: this
               },
               failureMessage: "Could not load Document Library Permissions template",
               execScripts: true
            });
         }
         else
         {
            // MNT-11006 fix - there can be multiple files in this.options.files
            this.nodeRefToRefresh = YAHOO.lang.isArray(this.options.files) ? this.options.files[0].node.nodeRef : this.options.files.node.nodeRef;
            
            // Load the latest permissions for the document
            Alfresco.util.Ajax.jsonRequest(
            {
               url: Alfresco.constants.URL_SERVICECONTEXT + "components/document-details/document-permissions",
               dataObj:
               {
                  nodeRef: this.nodeRefToRefresh,
                  site: this.options.siteId,
                  format: "json"
               },
               successCallback:
               {
                  fn: this.onDataRefresh,
                  scope: this
               },
               failureMessage: "Could not refresh permissions",
               execScripts: true
            });
         }
      },
      
      /**
       * Event callback when permissions are refreshed
       *
       * @method onDataRefresh
       * @param response {object} Server response from refresh permissions XHR request
       */
      onDataRefresh: function DLP_onDataRefresh(response)
      {
         this.setOptions(
         {
            siteId: response.json.siteId,
            files:
            {
               displayName: this.options.files.displayName,
               node:
               {
                  nodeRef: response.json.nodeRef,
                  permissions:
                  {
                     roles: response.json.roles
                  }
               }
            }
         });
         this._showDialog();
      },
      
      /**
       * Event callback when dialog template has been loaded
       *
       * @method onTemplateLoaded
       * @param response {object} Server response from load template XHR request
       */
      onTemplateLoaded: function DLP_onTemplateLoaded(response)
      {
         // Inject the template from the XHR request into a new DIV element
         this.containerDiv = document.createElement("div");
         this.containerDiv.setAttribute("style", "display:none");
         this.containerDiv.innerHTML = response.serverResponse.responseText;

         // The panel is created from the HTML returned in the XHR request, not the container
         var dialogDiv = Dom.getFirstChild(this.containerDiv);
         while (dialogDiv && dialogDiv.tagName.toLowerCase() != "div")
         {
            dialogDiv = Dom.getNextSibling(dialogDiv);
         }
         
         // Create and render the YUI dialog
         this.widgets.dialog = Alfresco.util.createYUIPanel(dialogDiv,
         {
            width: this.options.width
         });
         
         // OK and cancel buttons
         this.widgets.okButton = Alfresco.util.createYUIButton(this, "ok", this.onOK);
         this.widgets.cancelButton = Alfresco.util.createYUIButton(this, "cancel", this.onCancel);
         
         // Mark-up the group/role drop-downs
         var roles = YAHOO.util.Selector.query('button.site-group', this.widgets.dialog.element),
            roleElementId, roleValue;
         
         for (var i = 0, j = roles.length; i < j; i++)
         {
            roleElementId = roles[i].id;
            roleValue = roles[i].value;
            this.rolePickers[roleValue] = new YAHOO.widget.Button(roleElementId,
            {
               type: "menu", 
               menu: roleElementId + "-select"
            });
            this.rolePickers[roleValue].getMenu().subscribe("click", this.onRoleSelected, this.rolePickers[roleValue]);
         }
         
         // Reset Permissions button
         this.widgets.resetAll = Alfresco.util.createYUIButton(this, "reset-all", this.onResetAll);
         
         // Show the dialog
         this._showDialog();
      },


      /**
       * YUI WIDGET EVENT HANDLERS
       * Handlers for standard events fired from YUI widgets, e.g. "click"
       */

      /**
       * Role menu item selected event handler
       *
       * @method onRoleSelected
       * @param e {object} DomEvent
       */
      onRoleSelected: function DLP_onRoleSelected(p_sType, p_aArgs, p_oButton)
      {
         var target = p_aArgs[1];
         p_oButton.set("label", target.cfg.getProperty("text"));
         p_oButton.set("name", target.value);
      },
      
      /**
       * Reset All button event handler
       *
       * @method onResetAll
       * @param e {object} DomEvent
       * @param p_obj {object} Object passed back from addListener method
       */
      onResetAll: function DLP_onResetAll(e, p_obj)
      {
         this._applyPermissions("reset-all");
      },
      
      /**
       * Dialog OK button event handler
       *
       * @method onOK
       * @param e {object} DomEvent
       * @param p_obj {object} Object passed back from addListener method
       */
      onOK: function DLP_onOK(e, p_obj)
      {
         // Generate data webscript parameters from UI elements
         var permissions = this._parseUI();
         this._applyPermissions("set", permissions);
      },
      
      /**
       * Apply permissions by calling data webscript with given operation
       *
       * @method _applyPermission
       * @param operation {string} set|reset-all|allow-members-collaborate|deny-all
       * @param params {object} Permission parameters
       */
      _applyPermissions: function DLP__applyPermissions(operation, permissions)
      {
         var files, multipleFiles = [];

         // Single/multi files into array of nodeRefs
         files = this.options.files;
         for (var i = 0, j = files.length; i < j; i++)
         {
            multipleFiles.push(files[i].node.nodeRef);
         }
         
         // Success callback function
         var fnSuccess = function DLP__onOK_success(p_data)
         {
            var result,
              successCount = p_data.json.successCount,
              failureCount = p_data.json.failureCount;
            
            this._hideDialog();

            // Did the operation succeed?
            if (!p_data.json.overallSuccess)
            {
               Alfresco.util.PopupManager.displayMessage(
               {
                  text: this.msg("message.permissions.failure")
               });
               return;
            }
            
            YAHOO.Bubbling.fire("filesPermissionsUpdated",
            {
               successCount: successCount,
               failureCount: failureCount
            });
            
            for (var i = 0, j = p_data.json.totalResults; i < j; i++)
            {
               result = p_data.json.results[i];
               
               if (result.success)
               {
                  YAHOO.Bubbling.fire(result.type == "folder" ? "folderPermissionsUpdated" : "filePermissionsUpdated",
                  {
                     multiple: true,
                     nodeRef: result.nodeRef
                  });
               }
            }
            
            Alfresco.util.PopupManager.displayMessage(
            {
               text: this.msg("message.permissions.success", successCount)
            });
         };
         
         // Failure callback function
         var fnFailure = function DLP__onOK_failure(p_data)
         {
            this._hideDialog();

            Alfresco.util.PopupManager.displayMessage(
            {
               text: this.msg("message.permissions.failure")
            });
         };

         // Construct the data object for the genericAction call
         this.modules.actions.genericAction(
         {
            success:
            {
               callback:
               {
                  fn: fnSuccess,
                  scope: this
               }
            },
            failure:
            {
               callback:
               {
                  fn: fnFailure,
                  scope: this
               }
            },
            webscript:
            {
               method: Alfresco.util.Ajax.POST,
               name: "permissions/{operation}/site/{site}",
               params:
               {
                  site: this.options.siteId,
                  operation: operation
               }
            },
            config:
            {
               requestContentType: Alfresco.util.Ajax.JSON,
               dataObj:
               {
                  nodeRefs: multipleFiles,
                  permissions: permissions
               }
            }
         });

         this.widgets.okButton.set("disabled", true);
         this.widgets.cancelButton.set("disabled", true);
      },

      /**
       * Dialog Cancel button event handler
       *
       * @method onCancel
       * @param e {object} DomEvent
       * @param p_obj {object} Object passed back from addListener method
       */
      onCancel: function DLP_onCancel(e, p_obj)
      {
         this._hideDialog();
      },

      /**
       * PRIVATE FUNCTIONS
       */

      /**
       * Internal show dialog function
       * @method _showDialog
       */
      _showDialog: function DLP__showDialog()
      {
         var i, j;
         
         // Enable buttons
         this.widgets.okButton.set("disabled", false);
         this.widgets.cancelButton.set("disabled", false);

         // Dialog title
         var titleDiv = Dom.get(this.id + "-title");
         if (YAHOO.lang.isArray(this.options.files))
         {
            titleDiv.innerHTML = this.msg("title.multi", this.options.files.length);
         }
         else
         {
            var fileSpan = '<span class="light">' + $html(this.options.files.displayName) + '</span>';
            titleDiv.innerHTML = this.msg("title.single", fileSpan);
            // Convert to array
            this.options.files = [this.options.files];
         }
         
         // Default values - "None" initially
         for (var rolePicker in this.rolePickers)
         {
            if (this.rolePickers.hasOwnProperty(rolePicker))
            {
               this.rolePickers[rolePicker].set("name", "");
               this.rolePickers[rolePicker].set("label", this.msg("role.None"));
            }
         }
         
         var defaultRoles = this.options.files[0].node.permissions.roles,
            permissions;

         // Process role permissions by splitting into [0=Allowed, 1=Group, 2=Role]
         //                                       e.g. ALLOWED;GROUP_site_test_SiteManager;SiteManager
         for (i = 0, j = defaultRoles.length; i < j; i++)
         {
            permissions = defaultRoles[i].split(";");
            // test to see if there is a picker in the UI for the given group
            if (permissions[1] in this.rolePickers)
            {
               // test to ensure a relevant Site role is displayed,
               // else store as hidden role so we don't lose the ACL when setting new permissions
               if (permissions[2].indexOf("Site") === 0)
               {
                  this.rolePickers[permissions[1]].set("name", permissions[2]);
                  // it's possible that an odd collection of permissions have been set - one that is not defined
                  // as a well known Share role combination - so all for that possibility i.e. no msg available
                  var msg = this.msg("role." + permissions[2]);
                  if (msg === "role." + permissions[2])
                  {
                     msg = permissions[2];
                  }
   
                  this.rolePickers[permissions[1]].set("label", msg);
               }
               else
               {
                  this.hiddenRoles[permissions[1]] =
                  {
                     user: permissions[1],
                     role: permissions[2]
                  };
               }
            }
            // only manage special GROUP_EVERYONE for a site if it is public
            else if (permissions[1] !== "GROUP_EVERYONE" || this.options.isSitePublic)
            {
               this.hiddenRoles[permissions[1]] =
               {
                  user: permissions[1],
                  role: permissions[2]
               };
            }
         }

         // Register the ESC key to close the dialog
         var escapeListener = new YAHOO.util.KeyListener(document,
         {
            keys: YAHOO.util.KeyListener.KEY.ESCAPE
         },
         {
            fn: function(id, keyEvent)
            {
               this.onCancel();
            },
            scope: this,
            correctScope: true
         });
         escapeListener.enable();

         // Show the dialog
         this.widgets.dialog.show();
      },

      /**
       * Hide the dialog, removing the caret-fix patch
       *
       * @method _hideDialog
       * @private
       */
      _hideDialog: function DLP__hideDialog()
      {
         // Grab the form element
         var formElement = Dom.get(this.id + "-form");

         // Undo Firefox caret issue
         Alfresco.util.undoCaretFix(formElement);
         this.widgets.dialog.hide();
      },

      /**
       * Parse the UI elements into a parameters object
       *
       * @method _parseUI
       * @return {object} Parameters ready for webscript execution
       * @private
       */
      _parseUI: function DLP__parseUI()
      {
         var params = [],
            role;
         
         // Set any hidden roles to avoid removing them from node
         for (var user in this.hiddenRoles)
         {
            params.push(
            {
               group: this.hiddenRoles[user].user,
               role: this.hiddenRoles[user].role
            });
         }
         
         // Set roles from the permission selectors
         for (var picker in this.rolePickers)
         {
            if (this.rolePickers.hasOwnProperty(picker))
            {
               role = this.rolePickers[picker].get("name");
               if (role && role !== "None")
               {
                  params.push(
                  {
                     group: this.rolePickers[picker].get("value"),
                     role: role
                  });
               }
            }
         }

         return params;
      }
   });

   /* Dummy instance to load optional YUI components early */
   var dummyInstance = new Alfresco.module.DoclibPermissions("null");
})();
/**
 * Copyright (C) 2005-2010 Alfresco Software Limited.
 *
 * This file is part of Alfresco
 *
 * Alfresco is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Alfresco is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with Alfresco. If not, see <http://www.gnu.org/licenses/>.
 */
 
/**
 * Document Library "Details" module for Document Library.
 * 
 * @namespace Alfresco.module
 * @class Alfresco.module.DoclibAspects
 */
(function()
{
   /**
   * YUI Library aliases
   */
   var Dom = YAHOO.util.Dom,
      Event = YAHOO.util.Event;

   /**
    * Alfresco Slingshot aliases
    */
   var $html = Alfresco.util.encodeHTML;


   Alfresco.module.DoclibAspects = function(htmlId)
   {
      Alfresco.module.DoclibAspects.superclass.constructor.call(this, htmlId, ["button", "container", "datasource", "datatable"]);

      this.eventGroup = htmlId;
      this.currentValues = [];
      this.selectedValues = {};

      return this;
   };
   
   YAHOO.extend(Alfresco.module.DoclibAspects, Alfresco.module.SimpleDialog,
   {
      /**
       * Those that are currently applied to the object in the repository.
       * 
       * @property currentValues
       * @type object
       */
      currentValues: null,

      /**
       * Keeps a list of selected values for evaluating added and removed values.
       * 
       * @property selectedValues
       * @type object
       */
      selectedValues: null,

      /**
       * Set multiple initialization options at once.
       *
       * @method setOptions
       * @override
       * @param obj {object} Object literal specifying a set of options
       * @return {Alfresco.DocListToolbar} returns 'this' for method chaining
       */
      setOptions: function DA_setOptions(obj)
      {
         Alfresco.module.DoclibAspects.superclass.setOptions.call(this,
         {
            width: "56em",
            templateUrl: Alfresco.constants.URL_SERVICECONTEXT + "modules/documentlibrary/aspects",
            doBeforeDialogShow:
            {
               fn: this.doBeforeDialogShow,
               obj: null,
               scope: this
            },
            doBeforeAjaxRequest:
            {
               fn: this.doBeforeAjaxRequest,
               obj: null,
               scope: this
            }
         });

         this.options = YAHOO.lang.merge(this.options, obj);
         
         return this;
      },

      /**
       * Render item using a passed-in template
       *
       * @method renderItem
       * @param item {object} Item object literal
       * @param template {string} String with "{parameter}" style placeholders
       */
      renderItem: function DA_renderItem(item, template)
      {
         var renderHelper = function(p_key, p_value, p_metadata)
         {
            var html = "";
            
            if (p_key.toLowerCase() == "icon")
            {
               // Look for extra metadata to specify width x height, e.g. "{icon 16 16}"
               var width = "", height = "", arrDims;
               if (p_metadata && p_metadata.length > 0)
               {
                  arrDims = p_metadata.split(" ");
                  width = ' width="' + arrDims[0] + '"';
                  if (arrDims.length > 1)
                  {
                     height = ' height="' + arrDims[1] + '"';
                  }
               }
               html = '<img src="' + p_value + '"' + width + height + ' alt="' + $html(item.name) + '" title="' + $html(item.name) + '" />'; 
            }
            else
            {
               html = $html(p_value);
            }
            
            return html;
         };
         
         return YAHOO.lang.substitute(template, item, renderHelper);
      },
      
      /**
       * Return i18n string for given aspect
       *
       * @method i18n
       * @param aspect {string} The aspect qName
       * @param scope {object} Optional - Scope if 'this' is not the component instance
       * @return {string} The custom message
       */
      i18n: function DA_i18n(aspect, scope)
      {
         var key = "aspect." + aspect.replace(":", "_"),
             msg = this.msg(key);
         return (msg !== key ? msg : this.options.labels[aspect]) + " (" + aspect + ")";
      },
      
      /**
       * Interceptor just before dialog is shown
       *
       * @method doBeforeDialogShow
       * @param p_form {object} The forms runtime instance
       * @param p_this {object} Caller scope
       * @param p_obj {object} Optional - arbitrary object passed through
       */
      doBeforeDialogShow: function DA_doBeforeDialogShow(p_form, p_this, p_obj)
      {
         // Dialog title
         var fileSpan = '<span class="light">' + $html(this.options.file.displayName) + '</span>';
         Dom.get(this.id + "-title").innerHTML = this.msg("title", fileSpan);

         // DocLib Actions module
         if (!this.modules.actions)
         {
            // This module does not rely on Site scope, so can use the DoclibActions module in Repository mode all the time.
            this.modules.actions = new Alfresco.module.DoclibActions(Alfresco.doclib.MODE_REPOSITORY);
         }
         
         this._createAspectsControls();
         this._requestAspectData();

         // Enable buttons
         this.widgets.okButton.set("disabled", false);
         this.widgets.okButton.addClass("alf-primary-button");
         this.widgets.cancelButton.set("disabled", false);
      },
      
      /**
       * Interceptor just before Ajax request is sent
       *
       * @method doBeforeAjaxRequest
       * @param p_config {object} Object literal containing request config
       * @return {boolean} True to continue sending form, False to prevent it
       */
      doBeforeAjaxRequest: function DA_doBeforeAjaxRequest(p_config)
      {
         // Success callback function
         var fnSuccess = function DA_dBAR_success(p_data)
         {
            this.hide();

            // Did the operation succeed?
            Alfresco.util.PopupManager.displayMessage(
            {
               text: this.msg(p_data.json.overallSuccess ? "message.aspects.success" : "message.aspects.failure")
            });
            
            if (p_data.json.results[0].tagScope)
            {
               // TODO: Call a (non-existent) REST API to refresh the tag scope, then fire tagRefresh upon it's return
               // YAHOO.Bubbling.fire("tagRefresh");
            }
         };

         // Failure callback function
         var fnFailure = function DA_dBAR_failure(p_data)
         {
            this.hide();

            Alfresco.util.PopupManager.displayMessage(
            {
               text: this.msg("message.aspects.failure")
            });
         };

         // Construct generic action call
         this.modules.actions.genericAction(
         {
            success:
            {
               event:
               {
                  name: "metadataRefresh",
                  obj:
                  {
                     highlightFile: this.options.file.name
                  }
               },
               callback:
               {
                  fn: fnSuccess,
                  scope: this
               }
            },
            failure:
            {
               callback:
               {
                  fn: fnFailure,
                  scope: this
               }
            },
            webscript:
            {
               method: Alfresco.util.Ajax.POST,
               name: "aspects/node/{nodeRef}",
               params:
               {
                  nodeRef: this.options.file.jsNode.nodeRef.uri
               }
            },
            config:
            {
               requestContentType: Alfresco.util.Ajax.JSON,
               dataObj:
               {
                  added: this.getAddedValues(),
                  removed: this.getRemovedValues()
               }
            }
         });

         // Return false - we'll be using our own Ajax request
         return false;
      },

      /**
       * Returns an array of values that have been added to the current values
       *
       * @method getAddedValues
       * @return {array}
       */
      getAddedValues: function DA_getAddedValues()
      {
         var addedValues = [],
            currentValues = Alfresco.util.arrayToObject(this.currentValues);
         
         for (var value in this.selectedValues)
         {
            if (this.selectedValues.hasOwnProperty(value))
            {
               if (!(value in currentValues))
               {
                  addedValues.push(value);
               }
            }
         }
         return addedValues;
      },

      /**
       * Returns an array of values that have been removed from the current values
       *
       * @method getRemovedValues
       * @return {array}
       */
      getRemovedValues: function DA_getRemovedValues()
      {
         var removedValues = [],
            currentValues = Alfresco.util.arrayToObject(this.currentValues);
         
         for (var value in currentValues)
         {
            if (currentValues.hasOwnProperty(value))
            {
               if (!(value in this.selectedValues))
               {
                  removedValues.push(value);
               }
            }
         }
         return removedValues;
      },


      /**
       * PRIVATE FUNCTIONS
       */
      
      /**
       * Creates UI controls to support Aspect picker.
       *
       * NOTE: This function has "refactor" written all over it. It's on the TODO list...
       *
       * @method _createAspectsControls
       * @private
       */
      _createAspectsControls: function DA__createAspectsControls()
      {
         var me = this;

         /**
          * Icon datacell formatter
          */
         var renderCellIcon = function renderCellIcon(elCell, oRecord, oColumn, oData)
         {
            Dom.setStyle(elCell.parentNode, "width", oColumn.width + "px");
            elCell.innerHTML = me.renderItem(oRecord.getData(), '<div>{icon 16 16}</div>');
         };

         /**
          * Name datacell formatter
          */
         var renderCellName = function renderCellName(elCell, oRecord, oColumn, oData)
         {
            elCell.innerHTML = me.renderItem(oRecord.getData(), '<h4 class="name">{name}</h4>');
         };

         /**
          * Add button datacell formatter
          */
         var renderCellAdd = function renderCellAdd(elCell, oRecord, oColumn, oData)
         {
            Dom.setStyle(elCell.parentNode, "width", oColumn.width + "px");
            if (oRecord.getData("canAdd"))
            {
               elCell.innerHTML = '<a href="#" class="add-item add-' + me.eventGroup + '" title="' + me.msg("button.add") + '"><span class="addIcon">&nbsp;</span></a>';
            }
         };

         /**
          * Remove item datacell formatter
          */
         var renderCellRemove = function renderCellRemove(elCell, oRecord, oColumn, oData)
         {  
            Dom.setStyle(elCell.parentNode, "width", oColumn.width + "px");
            if (oRecord.getData("canRemove"))
            {
               elCell.innerHTML = '<a href="#" class="remove-item remove-' + me.eventGroup + '" title="' + me.msg("button.remove") + '"><span class="removeIcon">&nbsp;</span></a>';
            }
         };

         /**
          * Addable values list (left-hand side)
          */
         // DataSource
         this.widgets.dataSourceLeft = new YAHOO.util.DataSource([],
         {
            responseType: YAHOO.util.DataSource.TYPE_JSARRAY
         }); 

         // DataTable
         var columnDefinitionsLeft =
         [
            { key: "icon", label: "icon", sortable: false, formatter: renderCellIcon, width: 10 },
            { key: "name", label: "name", sortable: false, formatter: renderCellName },
            { key: "id", label: "add", sortable: false, formatter: renderCellAdd, width: 16 }
         ];
         this.widgets.dataTableLeft = new YAHOO.widget.DataTable(this.id + "-left", columnDefinitionsLeft, this.widgets.dataSourceLeft,
         {
            MSG_EMPTY: this.msg("label.loading")
         });

         // Hook action click events
         var fnAddHandler = function fnAddItemHandler(layer, args)
         {
            var owner = YAHOO.Bubbling.getOwnerByTagName(args[1].anchor, "div");
            if (owner !== null)
            {
               var target = args[1].target,
                  rowId = target.offsetParent,
                  record = me.widgets.dataTableLeft.getRecord(rowId);

               if (record)
               {
                  me.widgets.dataTableRight.addRow(record.getData());
                  me.selectedValues[record.getData("id")] = record;
                  me.widgets.dataTableLeft.deleteRow(rowId);
               }
            }
            return true;
         };
         // Force the new action as "me" object may have changed.
         // See MNT-10286
         YAHOO.Bubbling.addDefaultAction("add-" + this.eventGroup, fnAddHandler, true);

         /**
          * Selected values list (right-hand side)
          */
         this.widgets.dataSourceRight = new YAHOO.util.DataSource([],
         {
            responseType: YAHOO.util.DataSource.TYPE_JSARRAY
         }); 
         var columnDefinitionsRight =
         [
            { key: "icon", label: "icon", sortable: false, formatter: renderCellIcon, width: 10 },
            { key: "name", label: "name", sortable: false, formatter: renderCellName },
            { key: "id", label: "remove", sortable: false, formatter: renderCellRemove, width: 16 }
         ];
         this.widgets.dataTableRight = new YAHOO.widget.DataTable(this.id + "-right", columnDefinitionsRight, this.widgets.dataSourceRight,
         {
            MSG_EMPTY: this.msg("label.loading")
         });

         // Hook action click events
         var fnRemoveHandler = function fnRemoveHandler(layer, args)
         {
            var owner = YAHOO.Bubbling.getOwnerByTagName(args[1].anchor, "div");
            if (owner !== null)
            {
               var target = args[1].target,
                  rowId = target.offsetParent,
                  record = me.widgets.dataTableRight.getRecord(rowId);

               if (record)
               {
                  me.widgets.dataTableLeft.addRow(record.getData());
                  delete me.selectedValues[record.getData("id")];
                  me.widgets.dataTableRight.deleteRow(rowId);
               }
            }
            return true;
         };
         // Force the new action as "me" object may have changed.
         // See MNT-10286
         YAHOO.Bubbling.addDefaultAction("remove-" + this.eventGroup, fnRemoveHandler, true);
      },
      
      /**
       * Gets current aspect values from the Repository
       *
       * @method _requestAspectData
       * @private
       */
      _requestAspectData: function DA__requestAspectData()
      {
         this.selectedValues = {};
         
         Alfresco.util.Ajax.request(
         {
            method: "GET",
            url: Alfresco.constants.PROXY_URI + 'slingshot/doclib/aspects/node/' + this.options.file.jsNode.nodeRef.uri,
            successCallback: 
            { 
               fn: this._requestAspectDataSuccess, 
               scope: this 
            },
            failureCallback: 
            { 
               fn: this._requestAspectDataFailure, 
               scope: this 
            }
         });
      },

      /**
       * Failure handler for aspect data request
       *
       * @method _requestAspectDataFailure
       * @private
       */
      _requestAspectDataFailure: function DA__requestAspectDataFailure()
      {
         this.widgets.dataTableLeft.set("MSG_EMPTY", this.msg("label.load-failure"));
         this.widgets.dataTableRight.set("MSG_EMPTY", this.msg("label.load-failure"));
      },
      
      /**
       * Success handler for aspect data request
       *
       * @method _requestAspectDataSuccess
       * @param response {object} Object literal containing response data
       * @private
       */
      _requestAspectDataSuccess: function DA__requestAspectDataSuccess(response)
      {
         this.currentValues = {};
         
         if (typeof response.json != "undefined")
         {
            var currentArr = response.json.current,
               currentObj = Alfresco.util.arrayToObject(currentArr),
               visibleArr = this.options.visible,
               visibleObj = Alfresco.util.arrayToObject(visibleArr),
               addableArr = this.options.addable,
               removeableArr = this.options.removeable,
               i, ii;

            this.currentValues = currentArr;

            if (addableArr.length === 0)
            {
               addableArr = visibleArr.slice(0);
            }
            
            if (removeableArr.length === 0)
            {
               removeableArr = visibleArr.slice(0);
            }
            var addableObj = Alfresco.util.arrayToObject(addableArr),
               removeableObj = Alfresco.util.arrayToObject(removeableArr);

            var current, addable, record;
            // Current Values into right-hand table
            for (i = 0, ii = currentArr.length; i < ii; i++)
            {
               current = currentArr[i];
               record =
               {
                  id: current,
                  icon: Alfresco.constants.URL_RESCONTEXT + "components/images/aspect-16.png",
                  name: this.i18n(current),
                  canAdd: current in addableObj,
                  canRemove: current in removeableObj
               };
               if (current in visibleObj)
               {
                  this.widgets.dataTableRight.addRow(record);
               }
               this.selectedValues[current] = record;
            }
            
            // Addable values into left-hand table
            for (i = 0, ii = addableArr.length; i < ii; i++)
            {
               addable = addableArr[i];
               if ((addable in visibleObj) && !(addable in currentObj))
               {
                  this.widgets.dataTableLeft.addRow(
                  {
                     id: addable,
                     icon: Alfresco.constants.URL_RESCONTEXT + "components/images/aspect-16.png",
                     name: this.i18n(addable),
                     canAdd: true,
                     canRemove: true
                  });
               }
            }

            this.widgets.dataTableLeft.set("MSG_EMPTY", this.msg("label.no-addable"));
            this.widgets.dataTableRight.set("MSG_EMPTY", this.msg("label.no-current"));
            this.widgets.dataTableLeft.render();
            this.widgets.dataTableRight.render();
         }
      }
   });
})();
/**
 * Dummy instance to load optional YUI components early.
 * Use fake "null" id, which is tested later in onComponentsLoaded()
*/
var doclibAspects = new Alfresco.module.DoclibAspects("null");