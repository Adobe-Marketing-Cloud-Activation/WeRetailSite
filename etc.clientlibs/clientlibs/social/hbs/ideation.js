/*
 *
 * ADOBE CONFIDENTIAL
 * __________________
 *
 *  Copyright 2012 Adobe Systems Incorporated
 *  All Rights Reserved.
 *
 * NOTICE:  All information contained herein is, and remains
 * the property of Adobe Systems Incorporated and its suppliers,
 * if any.  The intellectual and technical concepts contained
 * herein are proprietary to Adobe Systems Incorporated and its
 * suppliers and are protected by trade secret or copyright law.
 * Dissemination of this information or reproduction of this material
 * is strictly forbidden unless prior written permission is obtained
 * from Adobe Systems Incorporated.
 */
/*
 * location: libs/social/commons/components/ugcparbase/clientlibs/commons.js
 * category: [cq.collab.comments,cq.social.commons]
 */
(function(CQ, $CQ) {
    "use strict";
    CQ.soco = CQ.soco || {};
    CQ.soco.commons = CQ.soco.commons || {};
    CQ.soco.TEMPLATE_PARAMNAME = ":templatename";
    CQ.soco.filterHTMLFragment = CQ.soco.filterHTMLFragment || function(fragment, targetFunction) {
        try {
            targetFunction.call(null, $CQ(fragment));
        } catch (e) {
            throw e;
        }
    };
    var localEvents = {};
    localEvents.CLEAR = "lcl.cq.soco.events.clear";
    CQ.soco.commons.handleOnBlur = function(el, message) {
        //Apparently the RTE reports a <br/> as it's empty text
        if (($CQ(el).val() === "") || ($CQ(el).val() === "<br/>")) {
            $CQ(el).val(message);
        }
    };
    CQ.soco.commons.handleOnFocus = function(el, message) {
        if ($CQ(el).val() === message) {
            $CQ(el).val("");
        }
    };

    CQ.soco.commons.getMessage = function(targetTextArea) {
        var message = $CQ(targetTextArea).first().val();
        if (typeof CKEDITOR !== 'undefined') {
            var editor = CKEDITOR.instances[$CQ(targetTextArea).attr('id')];
            if (editor) {
                message = editor.getData();
            }
        }
        return message;
    };
    CQ.soco.commons.validateFieldNotEmptyOrDefaultMessage = function(field, defaultMessage) {
        //ensure the RTE and textarea are in sync prior to validating
        CQ.soco.commons.syncRTE(field);

        var textValue = $CQ(field).val();
        if (!defaultMessage) {
            defaultMessage = '';
        }
        var tempDivID = 'tempRTEValidate_' + Math.floor(Math.random() * 1001);
        $CQ(field).after("<div id='" + tempDivID + "' height='0px' style='visibility:hidden;' width='0px'></div>");
        textValue = CQ.soco.commons.stripNonText(textValue);
        defaultMessage = CQ.soco.commons.stripNonText(defaultMessage);
        //Hack to Remove empty DIV tags
        //Removing empty div's using Browser/JQuery DOM processing was easier and cleaner than using Regex
        $CQ('#' + tempDivID).append(textValue);
        $CQ('#' + tempDivID + ' div:empty').filter(function() {
            //console.log($CQ(this));
            return $CQ(this);
        }).remove();

        $CQ('#' + tempDivID + ' p:empty').filter(function() {
            //console.log($CQ(this));
            return $CQ(this);
        }).remove();

        textValue = $CQ('#' + tempDivID).html();
        $CQ('#' + tempDivID).remove();
        if ($CQ.trim(textValue).length === 0 || $CQ.trim(textValue) === defaultMessage) {
            alert(CQ.I18n.getMessage("Comment field cannot be empty or default message."));
            return false;
        } else {
            return true;
        }
    };

    CQ.soco.commons.stripNonText = function(textValue) {
        //Remove spaces
        textValue = textValue.replace(/\s|&nbsp;/g, '');
        //Remove new lines
        textValue = textValue.replace(/\r?\n|\r/g, '');
        //Remove <br>
        textValue = textValue.replace(/(<|&lt;)br\s*\/*(>|&gt;)/g, '');
        return textValue;
    };

    CQ.soco.commons.syncRTE = function(targetTextArea) {
        // Validate that CKEditor was loaded
        if (typeof CKEDITOR !== 'undefined') {
            var editor = CKEDITOR.instances[$CQ(targetTextArea).attr('name')];
            if (!editor) {
                editor = CKEDITOR.instances[$CQ(targetTextArea).attr('id')];
            }
            if (editor && editor.checkDirty()) {
                editor.updateElement();
                editor.resetDirty();
            }
        }
    };

    CQ.soco.commons.clientSideComposer = function(targetForm, templateName, success, failure, addedData, action, verb) {
        var formAction = action || targetForm.attr('action'),
            formVerb = verb || targetForm.attr('method') || "POST";
        targetForm.find(":submit").click(function(event) {
            // If the frm has a file upload field then we can't do client side rendering, without using a jquery ui
            //  plugin or HTML5 to handle the upload.

            var hasFileAttachments = $.map(targetForm.find(":input[type='file']"), function(item) {
                var jqItem = $(item);
                if (jqItem.val() === "" || jqItem.val() === undefined) {
                    return null;
                }
                return true;
            }).length > 0;

            if (hasFileAttachments) {
                return;
            }

            event.preventDefault();
            // A submit button should only submit it's closest parent form and there is only one of those.
            var form = $CQ(event.target).closest("form")[0],
                formData;
            // Check if the form has an onsubmit function, which is used for validation
            if ($CQ.isFunction(form.onsubmit)) {
                // If it returns false, then do not make the request because that signifies
                // validation failed.
                if (!form.onsubmit.call(form, event)) {
                    // Need to figure out a way to communicate this failure back to the caller,
                    // invoking "failure" breaks some of the symmetry.
                    return;

                }
            }

            //This was added because the listener on 'key' attached to the RTE is key down, not up.  So the final
            //character typed doesn't get synced prior to a submit.  Hence doing it here to make sure the data
            //being submitted is up to date.
            var targetTextArea = targetForm.find("textarea");
            CQ.soco.commons.syncRTE(targetTextArea);
            //CKEditor is supposed to update the value for the textarea as well
            //$CQ(targetTextArea).first().val(CQ.soco.commons.getMessage(targetTextArea));
            formData = $CQ(form).serialize();
            //formData[$CQ(targetTextArea).attr("name")] = CQ.soco.commons.getMessage(targetTextArea);
            if (templateName) {
                formData += "&" + encodeURIComponent(CQ.soco.TEMPLATE_PARAMNAME) + "=" + encodeURIComponent(templateName);
            }
            for (var key in addedData) {
                formData += "&" + encodeURIComponent(key) + "=" + encodeURIComponent(addedData[key]);
            }

            $CQ(form).find(":input:visible").each(function() {
                $CQ(this).attr('disabled', 'disabled');
            });

            var localSuccess = function(data, status, jqxhr) {
                if ((jqxhr.status === 201) || (jqxhr.status === 200)) {
                    $CQ(form).find(":input:visible").each(function() {
                        switch (this.type) {
                            case "password":
                            case "select-multiple":
                            case "select-one":
                            case "text":
                            case "textarea":
                                $CQ(this).val("");
                                break;
                            case "checkbox":
                            case "radio":
                                this.checked = false;
                        }
                        $CQ(this).removeAttr('disabled');
                    });
                    // This like the RTE hide form elements that are still
                    // used so notify them to clear.
                    $CQ(form).find(":input:hidden").each(function() {
                        $CQ(this).trigger(localEvents.CLEAR);
                    });
                    success.call(null, data, status, jqxhr);
                } else {
                    $CQ(form).find(":input:visible").each(function() {
                        $CQ(this).removeAttr('disabled');
                    });
                    failure.call(null, jqxhr, status);
                }
            };
            var localFail = function(jqxhr, status) {
                $CQ(form).find(":input:visible").each(function() {
                    $CQ(this).removeAttr('disabled');
                });
                failure.call(null, jqxhr, status);
            };
            $CQ.ajax(formAction, {
                data: formData,
                success: localSuccess,
                fail: localFail,
                type: formVerb
            });
        });
    };
    CQ.soco.commons.fillInputFromClientContext = function(jqFields, clientcontextProperty) {
        if (window.CQ_Analytics && CQ_Analytics.CCM) {
            $CQ(function() {
                var store = CQ_Analytics.CCM.getRegisteredStore(CQ_Analytics.ProfileDataMgr.STORENAME);
                if (store) {
                    var name = store.getProperty(clientcontextProperty, true) || '';
                    jqFields.val(name);
                }

                CQ_Analytics.CCM.addListener('storesloaded', function() {
                    var store = CQ_Analytics.CCM.getRegisteredStore(CQ_Analytics.ProfileDataMgr.STORENAME);
                    if (store && store.addListener) {
                        var name = store.getProperty(clientcontextProperty, true) || '';
                        jqFields.val(name);
                        store.addListener('update', function() {
                            var name = store.getProperty(clientcontextProperty, true) || '';
                            jqFields.val(name);
                        });
                    }
                });
            });
        }
    };

    CQ.soco.commons.activateRTE = function(targetForm, handlers) {
        var targetTextArea = targetForm.find("textarea");
        CQ.soco.commons.convertTextAreaToRTE(targetTextArea, handlers, true);
    };

    CQ.soco.commons.convertTextAreaToRTE = function(targetTextArea, handlers, offset) {
        var width = targetTextArea.width(),
            height = targetTextArea.height(),
            controls = [{
                name: 'basicstyles',
                items: ['Bold', 'Italic', 'Underline']
            }],
            listeners = {},
            targetElement = targetTextArea[0],
            key, i;
        var _handlers = handlers || ["onfocus", "onblur"];
        // For some reason the RTE jquery plugin doesn't remap
        // handlers that are attached to the editor, so map the
        // handlers we are using.
        if (targetElement !== null && typeof targetElement !== 'undefined') {
            for (i = 0; i < _handlers.length; i++) {
                key = _handlers[i];
                if (null !== targetElement[key]) {
                    listeners[key.substring(2)] = targetElement[key];
                }
            }
        }

        key = null;
        $CQ(targetTextArea).height(targetTextArea.height() + 60);
        var config = {
            width: width,
            height: height,
            toolbar: controls
        };
        if (!offset) {
            config.width = targetTextArea.width() === 0 ? '100%' : width;
            config.height = targetTextArea.height() === 0 ? '100%' : height;
            config.toolbarLocation = 'bottom';
            config.resize_enabled = false;
            config.removePlugins = 'elementspath';
        } else {
            config.width = width + 4;
            config.height = height + 60;
        }
        var editor = CKEDITOR.replace($CQ(targetTextArea).attr("name"), config);

        editor.on('key', function(evt) {
            CQ.soco.commons.syncRTE(targetTextArea);
        });

        targetTextArea.on(localEvents.CLEAR, function(event) {
            $CQ(targetElement).val("");
            editor.setData("", function() {
                $CQ(editor).blur();
                editor.resetDirty();
            });
        });
        return editor;
    };

    CQ.soco.commons.openModeration = function() {
        var pagePath = "";
        if (CQ.WCM !== undefined && CQ.WCM.getPagePath !== undefined) {
            //classic UI
            pagePath = CQ.WCM.getPagePath();
        } else if (Granite.author !== undefined && Granite.author.page !== undefined &&
            Granite.author.page.path !== undefined) {
            //touch UI
            pagePath = Granite.author.page.path;
        }

        CQ.shared.Util.open(CQ.shared.HTTP.externalize('/communities/moderation.html'));
    };

    CQ.soco.commons.showUGCFormAsDialog = function(formURL, targetDiv) {
        var $CQtargetDivId = $CQ(targetDiv);
        var targetDivId = $CQtargetDivId.attr('id');
        var divId = 'modalIframeParent' + Math.random().toString(36).substring(2, 4);
        if (!targetDivId) {
            $CQtargetDivId.attr('id', divId);
            targetDivId = divId;
        }
        $CQtargetDivId.dialog({
            modal: true,
            height: 500,
            width: 750,
            buttons: {
                Submit: function() {
                    var modal_form = $CQ('iframe.modalIframeClass', $CQtargetDivId).contents().find("form");
                    modal_form.submit();
                    $CQ(this).dialog("close");
                },
                Cancel: function() {
                    $CQ(this).dialog("close");
                }
            }
        });

        $CQtargetDivId.html("<iframe class='modalIframeClass' width='100%' height='100%' " +
            "marginWidth='0' marginHeight='0' frameBorder='0' />").dialog("open");
        $CQ('#' + targetDivId + " .modalIframeClass").attr("src", formURL);
        return false;
    };

})(CQ, $CQ);

/*
 *
 * ADOBE CONFIDENTIAL
 * __________________
 *
 *  Copyright 2012 Adobe Systems Incorporated
 *  All Rights Reserved.
 *
 * NOTICE:  All information contained herein is, and remains
 * the property of Adobe Systems Incorporated and its suppliers,
 * if any.  The intellectual and technical concepts contained
 * herein are proprietary to Adobe Systems Incorporated and its
 * suppliers and are protected by trade secret or copyright law.
 * Dissemination of this information or reproduction of this material
 * is strictly forbidden unless prior written permission is obtained
 * from Adobe Systems Incorporated.
 */

/**
 * Utility functions for comments components.
 */

var CQ_collab_comments_loadedForms = {};
var CQ_collab_comments_defaultMessage = ""; // overlay in page
var CQ_collab_comments_requireLogin = false;
var CQ_collab_comments_enterComment = "Please enter a comment"; // will be overlaid


function CQ_collab_comments_toggleForm(buttonId, formId, url) {
    var form = document.getElementById(formId);
    var button = document.getElementById(buttonId);
    try {
        url = CQ.shared.HTTP.noCaching(url);
        CQ.shared.HTTP.get(url, function(o, ok, response) {
            var result = response.responseText;
            $CQ(form).html(result);
            //evaluate the first form element's id and remove the '-form' ending to use it as the idPrefix for updating the form
            var formElementId = $CQ(form).children("form").attr("id");
            if (formElementId) {
                var tokens = formElementId.split("-");
                tokens.length = tokens.length - 1;
                var idPrefix = tokens.join("-");
                if (CQ_Analytics && CQ_Analytics.CCM) {
                    var store = CQ_Analytics.CCM.getRegisteredStore(CQ_Analytics.ProfileDataMgr.STORENAME);
                    if (store) {
                        CQ_collab_comments_formStateChanged(idPrefix, store);
                    }
                }
            }
        });
    } catch (e) {
        alert("Error loading form: " + url);
    }
    var hidden = form.style.display != "block";
    form.style.display = hidden ? "block" : "none";
    button.innerHTML = hidden ? "Cancel" : "Reply";
}

function CQ_collab_comments_handleOnFocus(el, id) {
    if (el.value == CQ_collab_comments_getDefaultMessage(id)) {
        el.value = "";
    }
    el.style.color = "#333";
}

function CQ_collab_comments_handleOnBlur(el, id) {
    if (el.value === "") {
        el.value = CQ_collab_comments_getDefaultMessage(id);
        el.style.color = "#888";
    } else {
        el.style.color = "#333";
    }
}

function CQ_collab_comments_validateFields(id) {
    // Validate text
    var message = document.getElementById(id + "-text");
    if (message.value === "" || message.value === CQ_collab_comments_getDefaultMessage(id)) {
        CQ_collab_comments_showError(CQ_collab_comments_enterComment, id);
        return false;
    }
    return true;
}

function CQ_collab_comments_validateSubmit(id) {
    if (!CQ_collab_comments_validateFields(id)) {
        return false;
    }
    try {
        var check = document.getElementById(id + "-id");
        if (!check) {
            var form = document.getElementById(id + "-form");
            check = document.createElement("input");
            check.id = id + "-id";
            check.type = "hidden";
            check.name = "id";
            check.value = "nobot";
            form.appendChild(check);
        }
    } catch (e) {
        return false;
    }
    return true;
}

function CQ_collab_comments_showError(msg, id) {
    var errorElem = document.getElementById(id + "-error");
    if (!errorElem) {
        alert(msg);
    } else {
        errorElem.innerHTML = msg;
    }
}

function CQ_collab_comments_getDefaultMessage(id) {
    if (id && document.getElementById(id + "-rating")) {
        return CQ_collab_ratings_defaultMessage;
    }
    return CQ_collab_comments_defaultMessage;
}

function CQ_collab_comments_openCollabAdmin() {
    CQ.shared.Util.open(CQ.shared.HTTP.externalize('/socoadmin.html#/content/usergenerated' + CQ.WCM.getPagePath()));
}

function CQ_collab_comments_activate(cmd, callback) {
    if (!cmd) cmd = "Activate";
    CQ.HTTP.post(
        "/bin/replicate.json",
        function(options, success, response) {
            if (cmd === "Delete") {
                CQ.Notification.notify(null, success ? CQ.I18n.getMessage("Comment deleted") : CQ.I18n.getMessage("Unable to delete comment"));
            } else {
                CQ.Notification.notify(null, success ? CQ.I18n.getMessage("Comment activated") : CQ.I18n.getMessage("Unable to activate comment"));
            }
            if (callback) {
                callback.call(this, options, success, response);
            }
        }, {
            "_charset_": "utf-8",
            "path": this.path,
            "cmd": cmd
        }
    );
}

function CQ_collab_comments_refresh() {
    if (this.refreshCommentSystem) {
        this.refreshCommentSystem();
    } else {
        CQ.wcm.EditBase.refreshPage();
    }
}

function CQ_collab_comments_afterEdit(editRollover) {
    CQ_collab_comments_activate.call(editRollover, "Activate", CQ_collab_comments_refresh);
}

function CQ_collab_comments_afterDelete(editRollover) {
    CQ_collab_comments_activate.call(editRollover, "Delete", CQ_collab_comments_refresh);
}

function CQ_collab_comments_initFormState(idPrefix) {
    if (CQ_Analytics && CQ_Analytics.CCM) {
        $CQ(function() {
            //store might not be registered yet
            CQ_Analytics.ClientContextUtils.onStoreRegistered(CQ_Analytics.ProfileDataMgr.STORENAME, function(store) {
                CQ_collab_comments_formStateChanged(idPrefix, store);
                store.addListener('update', function() {
                    CQ_collab_comments_formStateChanged(idPrefix, store);
                });
            });
        });
    }
}

function CQ_collab_comments_formStateChanged(idPrefix, store) {
    var p = store.getData();
    if (p) {
        var formId = idPrefix + "-form";
        var textId = idPrefix + "-text";
        var nameId = idPrefix + "-userIdentifier";
        var mailId = idPrefix + "-email";
        var webId = idPrefix + "-url";
        var userId = p.authorizableId;
        var formattedName = p.formattedName;
        if (!formattedName) {
            formattedName = userId;
        }

        if (userId && userId == 'anonymous') {
            if (CQ_collab_comments_requireLogin) {
                $CQ("#" + formId).hide();
                $CQ("[id$=-reply-button]").hide();
                $CQ("[id$=-reply-arrow]").hide();
            } else {
                $CQ("#" + formId).show();
                $CQ("[id$=-reply-button]").show();
                $CQ("[id$=-reply-arrow]").show();
                $CQ("#" + nameId).attr('value', '');
                $CQ("#" + nameId + "-comment-block").show();
                $CQ("#" + mailId).attr('value', '');
                $CQ("#" + mailId + "-comment-block").show();
                $CQ("#" + webId).attr('value', '');
                $CQ("#" + webId + "-comment-block").show();

                $CQ("[id$=-signed-in-text]").hide();
                $CQ("[id$=-signed-in-user]").text("");
            }
        } else {
            $CQ("[id$=-reply-button]").show();
            $CQ("[id$=-reply-arrow]").show();

            $CQ("#" + nameId + "-comment-block").hide();
            $CQ("#" + nameId).attr('value', userId);
            $CQ("#" + mailId + "-comment-block").hide();
            $CQ("#" + webId + "-comment-block").hide();

            $CQ("[id$=-signed-in-user]").text(formattedName);
            $CQ("[id$=-signed-in-text]").show();
        }
    }
}

/*
 *
 * ADOBE CONFIDENTIAL
 * __________________
 *
 *  Copyright 2015 Adobe Systems Incorporated
 *  All Rights Reserved.
 *
 * NOTICE:  All information contained herein is, and remains
 * the property of Adobe Systems Incorporated and its suppliers,
 * if any.  The intellectual and technical concepts contained
 * herein are proprietary to Adobe Systems Incorporated and its
 * suppliers and are protected by trade secret or copyright law.
 * Dissemination of this information or reproduction of this material
 * is strictly forbidden unless prior written permission is obtained
 * from Adobe Systems Incorporated.
 */
(function(SCF) {
    "use strict";
    window.CQ_Analytics = window.CQ_Analytics || {};
    var cqAnalytics = window.CQ_Analytics;

    var Subscription = SCF.Model.extend({
        modelName: "SubscriptionModel",

        events: {
            UPDATED: "subscribe:update",
            UPDATE_ERROR: "subscribe:updateError"
        },

        doToggle: function(selection) {
            var success = _.bind(function(response) {
                var _response = response.response;
                if (typeof(_response) != "object") {
                    _response = JSON.parse(_response);
                }
                this.set("states", _response.states);
                this.set("subscribed", _response.subscribed);
                this.trigger(this.events.UPDATED, {
                    model: this
                });

                /*
                 * Following Activities is what used to be follow.
                 * This logic is to pick the "follow activities" event
                 * from multitude of potential success responses
                 */
                var states = this.get("states");
                var isSubscribed = this.get("subscribed");
                if (selection === "following" && isSubscribed && states.following.selected) {
                    if (!_.isUndefined(window._satellite)) {
                        window._satellite.track("communities-scf-follow");
                    } else if (cqAnalytics.Sitecatalyst) {
                        cqAnalytics.record({
                            event: "SCFFollow",
                            values: {
                                "functionType": SCF.Context.communityFunction,
                                "path": SCF.Context.path,
                                "type": SCF.Context.type,
                                "ugcTitle": SCF.Context.ugcTitle,
                                "siteTitle": SCF.Context.siteTitle,
                                "sitePath": SCF.Context.sitePath,
                                "groupTitle": SCF.Context.groupTitle,
                                "groupPath": SCF.Context.groupPath,
                                "user": SCF.Context.user
                            },
                            collect: false,
                            componentPath: SCF.constants.ANALYTICS_BASE_RESOURCE_TYPE
                        });
                    }
                }
            }, this);

            var error = _.bind(function(jqxhr, text, error) {
                SCF.log.error("error toggle follow state %o", error);
            }, this);

            var url = this.get("url");
            var _types = [];
            var _states = [];

            $CQ.each(this.get("states"), function(key, value) {
                var currentState = value.selected;
                if (selection == "unfollow-all") {
                    currentState = false;
                } else {
                    if (key == selection) {
                        currentState = !currentState;
                    }
                }
                _types.push(key);
                _states.push(currentState.toString());

            });

            $CQ.ajax(url, {
                dataType: "json",
                type: "POST",
                xhrFields: {
                    withCredentials: true
                },
                data: {
                    ":operation": "social:updatesubscriptions",
                    "types": _types,
                    "states": _states,
                    "subscribedId": this.get("subscribedId")
                },
                "success": success,
                "error": error
            });
        }
    });
    var SubscriptionView = SCF.View.extend({
        viewName: "SubscriptionView",
        init: function() {
            this.listenTo(this.model, this.model.events.UPDATED, this.update);
            this.listenTo(this.model, this.model.events.UPDATE_ERROR, this.showError);
        },
        handleClick: function(el) {
            var _target = el.currentTarget;
            var _key = _target.getAttribute('data_type');
            this.model.doToggle(_key);
        },
        update: function() {
            this.render();
        }

    });
    SCF.Subscription = Subscription;
    SCF.SubscriptionView = SubscriptionView;

    SCF.registerComponent("social/subscriptions/components/hbs/subscriptions", SCF.Subscription, SCF.SubscriptionView);

})(SCF);

/*
 *
 * ADOBE CONFIDENTIAL
 * __________________
 *
 *  Copyright 2013 Adobe Systems Incorporated
 *  All Rights Reserved.
 *
 * NOTICE:  All information contained herein is, and remains
 * the property of Adobe Systems Incorporated and its suppliers,
 * if any.  The intellectual and technical concepts contained
 * herein are proprietary to Adobe Systems Incorporated and its
 * suppliers and are protected by trade secret or copyright law.
 * Dissemination of this information or reproduction of this material
 * is strictly forbidden unless prior written permission is obtained
 * from Adobe Systems Incorporated.
 */
(function($CQ, _, Backbone, SCF, Granite) {
    "use strict";

    // analytics code
    window.CQ_Analytics = window.CQ_Analytics || {};
    var cqAnalytics = CQ_Analytics;

    var CommentSystem = SCF.Model.extend({
        modelName: "CommentSystemModel",
        relationships: {
            "items": {
                collection: "CommentList",
                model: "CommentModel"
            }
        },
        createOperation: "social:createComment",
        MOVE_OPERATION: "social:moveComment",
        getCustomProperties: function(postData, data) {
            return _.extend(postData, data);
        },
        events: {
            MOVED: "comment:moved",
            MOVE_ERROR: "comment:moveError",
            ADD: "comment:added",
            ADD_ERROR: "comment:adderror"
        },
        _fixCachedProperties: function() {
            if (SCF.hasOwnProperty("Session") && (SCF.Session !== null)) {
                var mayPost = SCF.Session.checkIfUserCanPost(this.attributes.id);
                this.attributes.mayPost = mayPost;
                this.fixCachedProperties();
                this.cacheFixed = true;
                this.trigger("model:cacheFixed", this);
            }
        },
        fixCachedProperties: function() {

        },
        constructor: function(attributes, options) {
            SCF.Model.prototype.constructor.apply(this, [attributes, options]);
            if (SCF.Session.isReady()) {
                this._fixCachedProperties();
            } else {
                SCF.Session.on("model:loaded", _.bind(this._fixCachedProperties, this));
            }
        },
        shouldCommentBeAddedToList: function(comment) {
            return true;
        },
        addCommentSuccess: function(response) {
            var comment = response.response;
            var CommentKlass = SCF.Models[this.constructor.prototype.relationships.items.model];
            var newComment = new CommentKlass(comment);

            if (!newComment.get("isVisible") && !newComment.get("draft")) {
                this.view.showUGCLimitDialog(null, true);
            }

            if (this.shouldCommentBeAddedToList(newComment)) {
                newComment.set("_isNew", true);
                newComment._isReady = true;
                var comments = this.get("items");
                var isCollectionNew = false;
                if (!comments) {
                    var CollectionKlass = SCF.Collections[this.constructor.prototype.relationships
                        .items.collection] || Backbone.Collection;
                    comments = new CollectionKlass();
                    comments.model = CommentKlass;
                    comments.parent = this;
                    isCollectionNew = true;
                }
                comments.unshift(newComment);
                var totalComments = this.get("totalSize");
                if (isCollectionNew) {
                    this.set("items", comments);
                }
                this.set("totalSize", totalComments + 1);
                newComment.constructor.prototype._cachedModels[comment.id] = newComment;
                this.trigger(this.events.ADD, {
                    model: this,
                    newItem: newComment
                });
                SCF.Util.announce(this.events.ADD, newComment.attributes);
            }
        },
        addComment: function(data, scb, fcb) {
            $CQ('.scf-attachment-error').remove(); //remove previous error messages (if any)

            var success = _.bind(this.addCommentSuccess, this);
            var error = _.bind(function(jqxhr, text, error) {
                //Handles Server errror in case of bad attachments, etc.
                if (jqxhr.status == 401) {
                    var siteLink = $($(".scf-js-site-title")[0]).attr("href");
                    window.location.href = "http://" + location.host + siteLink.replace(".html", "/signin.html");
                } else {
                    if (500 == jqxhr.status) { //vs bugfix
                        var _parentEl = $CQ('.scf-composer-block')[0];
                        if (null === _parentEl) {
                            _parentEl = $CQ(document.body);
                        }
                        $CQ(
                            '<div class="scf-attachment-error"><h3 class="scf-js-error-message">Server error. Please try again.</h3><div>'
                        ).appendTo(_parentEl);

                        return false;
                    }
                    this.trigger(this.events.ADD_ERROR, this.parseServerError(jqxhr, text, error));
                }

            }, this);


            var postData;
            var hasAttachment = (typeof data.files !== "undefined");
            var hasTags = (typeof data.tags !== "undefined");
            if (hasAttachment) {
                // Create a formdata object and add the files
                if (window.FormData) {
                    postData = new FormData();
                }

                if (postData) {
                    $CQ.each(data.files, function(key, value) {
                        postData.append("file", value);
                    });
                    postData.append("id", "nobot");
                    postData.append(":operation", this.createOperation);
                    delete data.files;
                    if (hasTags) {
                        $CQ.each(data.tags, function(key, value) {
                            postData.append("tags", value);
                        });
                    }
                    delete data.tags;
                    $CQ.each(data, function(key, value) {
                        postData.append(key, value);
                    });
                }
            } else {
                postData = {
                    "id": "nobot",
                    ":operation": this.createOperation
                };
                _.extend(postData, data);
                postData = this.getCustomProperties(postData, data);
            }

            $CQ.ajax(SCF.config.urlRoot + this.get("id") + SCF.constants.URL_EXT, {
                dataType: "json",
                type: "POST",
                processData: !hasAttachment,
                contentType: (hasAttachment) ? false : "application/x-www-form-urlencoded; charset=UTF-8",
                xhrFields: {
                    withCredentials: true
                },
                data: this.addEncoding(postData),
                "success": success,
                "error": error
            });

        },
        addIncludeHint: function(data) {
            _.extend(data, {
                "scf:included": this.get("pageInfo").includedPath,
                "scf:resourceType": this.get("resourceType")
            });
        },
        move: function(data) {
            var error = _.bind(function(jqxhr, text, error) {
                this.trigger(this.events.MOVE_ERROR, {
                    'error': error
                });
            }, this);
            var success = _.bind(this.addCommentSuccess, this);
            $CQ.ajax(SCF.config.urlRoot + this.get('id') + SCF.constants.URL_EXT, {
                dataType: 'json',
                type: 'POST',
                xhrFields: {
                    withCredentials: true
                },
                data: {
                    ':operation': this.MOVE_OPERATION,
                    'resourcePath': data.resourcePath,
                    'parentPath': data.parentPath
                },
                'success': success,
                'error': error
            });
        },
        translateAll: function(e) {
            SCF.CommentSystem.thisRef = this;
            if (this.get('showingTranslationAll') === undefined) {
                this.set('showingTranslationAll', false);
            }
            var items = this.get('items');
            var commentModels = [];
            commentModels.push(this);

            var i;
            for (i in items.models)
                commentModels.push(items.models[i]);

            var noOfCommentToTrans = 0;
            var commentsTotrans = [];
            var commentTranslatedSuccess = function() {
                noOfCommentToTrans--;
                if (noOfCommentToTrans <= 0) {
                    SCF.CommentSystem.thisRef.set('translateAllInProgress', false);
                    if (SCF.CommentSystem.thisRef.get('showingTranslationAll') === true)
                        SCF.CommentSystem.thisRef.set('showingTranslationAll', false);
                    else
                        SCF.CommentSystem.thisRef.set('showingTranslationAll', true);

                    if (SCF.CommentSystem.thisRef.view)
                        SCF.CommentSystem.thisRef.view.render();
                }
            };
            if (this.get('showingTranslationAll') === false) {
                for (i in commentModels) {
                    if (commentModels[i].get('canTranslate') && !commentModels[i].get('showingTranslation')) {
                        noOfCommentToTrans++;
                        commentsTotrans.push(commentModels[i]);
                    }
                }
                if (noOfCommentToTrans > 0) {
                    this.set('translateAllInProgress', true);
                    if (this.view)
                        this.view.render();
                }
                if (noOfCommentToTrans === 0) {
                    this.set('showingTranslationAll', true);
                    if (this.view)
                        this.view.render();
                    return;
                }
            } else {
                for (i in commentModels) {
                    if (commentModels[i].get('canTranslate') && commentModels[i].get('showingTranslation')) {
                        noOfCommentToTrans++;
                        commentsTotrans.push(commentModels[i]);
                    }
                }
                if (noOfCommentToTrans === 0) {
                    this.set('showingTranslationAll', false);
                    if (this.view)
                        this.view.render();
                    return;
                }
            }

            for (i in commentsTotrans)
                commentsTotrans[i].translate(commentTranslatedSuccess);
        },
        refetchUsingSort: function(sortField, sortOrder) {
            var sortUrl,
                pageInfo = this.get("pageInfo"),
                allProperties = this.get('properties'),
                analyticsProp = ['views', 'posts', 'follows', 'likes'],
                matchesAnalyticsProp = _.intersection(allProperties.sortBy, analyticsProp);

            if (!sortOrder) {
                sortOrder = "DESC";
            }
            sortField = (sortField === "newest") ? "added" : sortField;

            if (matchesAnalyticsProp.length > 0 && _.contains(matchesAnalyticsProp, sortField)) {
                sortUrl = this.get("id") + SCF.constants.SOCIAL_SELECTOR + "." + sortField + "_" + allProperties.timeSelector + ".";
            } else {
                sortUrl = this.get("id") + SCF.constants.SOCIAL_SELECTOR + "." + sortField + ".";
            }

            sortUrl = sortUrl + 0 + ".";
            if (sortOrder == "DESC") {
                sortUrl = sortUrl + Math.abs(pageInfo.pageSize);
            } else {
                sortUrl = sortUrl + "-" + Math.abs(pageInfo.pageSize);
            }
            sortUrl = sortUrl + SCF.constants.JSON_EXT;
            this.url = sortUrl;
            this.reload();
        },
        getSortOrder: function() {
            var sortOrderList = [];

            sortOrderList.push({
                "text": CQ.I18n.get("Newest"),
                "value": "newest"
            });

            sortOrderList.push({
                "text": CQ.I18n.get("Oldest"),
                "value": "added"
            });

            sortOrderList.push({
                "text": CQ.I18n.get("Last Updated"),
                "value": "latestActivityDate_dt"
            });

            sortOrderList.push({
                "text": CQ.I18n.get("Most Viewed"),
                "value": "views"
            });

            sortOrderList.push({
                "text": CQ.I18n.get("Most Active"),
                "value": "posts"
            });

            sortOrderList.push({
                "text": CQ.I18n.get("Most Followed"),
                "value": "follows"
            });

            sortOrderList.push({
                "text": CQ.I18n.get("Most Liked"),
                "value": "likes"
            });
            return sortOrderList;
        }
    });

    var CommentSystemView = SCF.View.extend({
        viewName: "CommentSystem",
        className: "comment-system",
        CREATE_EVENT: "SCFCreate",
        COMMUNITY_FUNCTION: "Comment System",
        getOtherProperties: function() {
            return {};
        },
        PAGE_EVENT: "pageComments",
        PAGE_URL_PREFIX: "comments",
        init: function() {

            this.listenTo(this.model, this.model.events.ADD, this.update);
            this.listenTo(this.model, this.model.events.ADD_ERROR, this.showErrorOnAdd);
            this.listenTo(this.model.get("items"), "comment:deleted", function(removedModel) {
                this.model.set({
                    "totalSize": this.model.get("totalSize") - 1
                });
                if (SCF.Util.mayCall(this.model.get("items"), "remove")) {
                    this.model.get("items").remove(removedModel.model);
                }
                this.render();
            });

            // record create event
            this.listenTo(this.model, this.model.events.ADD, this.recordCreate);

            this.listenTo(SCF.Router, "route:" + this.PAGE_EVENT, this.paginate);
            SCF.Router.route(/^(.*?)\.([0-9]*)\.(-?[0-9]*)\.htm.*?$/, this.PAGE_EVENT);
            this.model.view = this;
        },
        afterRender: function() {
            window.scrollTo(0, 0);
            var pageInfo = this.model.get("pageInfo"),
                properties = this.model.get("properties"),
                pageConfig = this.model.get("configuration"),
                pageSize = 0,
                sortField,
                sortIndex,
                sortOrder,
                analyticsProps,
                analyticsPropWithoutTl,
                isOrderReversed,
                btnText,
                sortOrderProp;

            if (pageInfo && pageInfo.sortIndex) {
                sortIndex = sortField = pageInfo.sortIndex;
                pageSize = pageInfo.pageSize;
            } else if (pageConfig.sortFields[0]) {
                sortField = Object.getOwnPropertyNames(pageConfig.sortFields[0]).toString();
                pageSize = pageConfig.pageSize;
            } else {
                pageSize = pageConfig.pageSize;
            }
            if (!sortField) {
                sortField = "";
            }
            sortOrderProp = properties && properties.sortFieldOrder ? properties.sortFieldOrder : 'desc';
            sortOrder = typeof(Storage) !== "undefined" && localStorage.getItem("sortOrderLs") ?
                localStorage.getItem("sortOrderLs") : sortOrderProp;
            sortOrder = sortOrder.toLowerCase();
            isOrderReversed = pageInfo.orderReversed;

            if (!isOrderReversed && sortOrder === "asc" && sortField === "added") {
                isOrderReversed = true;
            }
            analyticsProps = ['views', 'posts', 'likes', 'follows'];
            analyticsPropWithoutTl = sortField.split('_')[0];

            if (_.contains(analyticsProps, analyticsPropWithoutTl)) {
                this.model.get("pageInfo").sortIndex = analyticsPropWithoutTl;
                sortField = analyticsPropWithoutTl;
            }

            if (sortField) {
                switch (true) {
                    case (sortField === "newest" ||
                        (sortIndex === "added" && !isOrderReversed) ||
                        (sortField === "added" && !isOrderReversed)):
                        btnText = CQ.I18n.get("Newest");
                        break;
                    case (sortField === "latestActivityDate_dt"):
                        btnText = CQ.I18n.get("Last Updated");
                        break;
                    case (sortField === "added"):
                        btnText = CQ.I18n.get("Oldest");
                        break;
                    case (sortField === "views"):
                        btnText = CQ.I18n.get("Most Viewed");
                        break;
                    case (sortField === "posts"):
                        btnText = CQ.I18n.get("Most Active");
                        break;
                    case (sortField === "follows"):
                        btnText = CQ.I18n.get("Most Followed");
                        break;
                    case (sortField === "likes"):
                        btnText = CQ.I18n.get("Most Liked");
                        break;
                    default:
                        btnText = CQ.I18n.get("Sort By");
                }
                this.$el.find(".scf-sort-btngrp-btnlabel").text(btnText);
            }
        },
        recordCreate: function() {
            if (!_.isUndefined(window._satellite)) {
                window._satellite.track("communities-scf-create");
            } else if (cqAnalytics.Sitecatalyst) {
                cqAnalytics.record({
                    event: this.CREATE_EVENT,
                    values: {
                        "functionType": SCF.Context.communityFunction ?
                            SCF.Context.communityFunction : this.COMMUNITY_FUNCTION,
                        "path": SCF.Context.path ? SCF.Context.path : this.model.get("id"),
                        "type": SCF.Context.type ? SCF.Context.type : this.model.get("resourceType"),
                        "ugcTitle": SCF.Context.ugcTitle,
                        "siteTitle": SCF.Context.siteTitle ?
                            SCF.Context.siteTitle : $(".scf-js-site-title").text(),
                        "sitePath": SCF.Context.sitePath ? SCF.Context.sitePath : this.sitePath,
                        "groupTitle": SCF.Context.groupTitle,
                        "groupPath": SCF.Context.groupPath,
                        "user": SCF.Context.user ? SCF.Context.user : SCF.Session.get("authorizableId")
                    },
                    collect: false,
                    componentPath: SCF.constants.ANALYTICS_BASE_RESOURCE_TYPE
                });
            }
        },

        paginate: function() {
            var baseURL = SCF.config.urlRoot + this.model.get("id") + SCF.constants.SOCIAL_SELECTOR + ".",
                pageInfo = this.model.get("pageInfo"),
                config = this.model.get("configuration"),
                sortIndex = (pageInfo && !_.isEmpty(pageInfo.sortIndex)) ? pageInfo.sortIndex : "",
                analyticsTimeSelector = config && config.analyticsTimeSelector ? config.analyticsTimeSelector : "total_tl",
                parsedBasePath = arguments[0],
                parsedOffset = arguments[1],
                parsedSize = arguments[2],
                parsedIndexName = (arguments.length <= 3) ? null : arguments[3],
                url = null,
                analyticsProps = ['views', 'posts', 'likes', 'follows'];

            if (_.contains(analyticsProps, sortIndex)) {
                sortIndex = sortIndex + "_" + analyticsTimeSelector;
            }
            if (arguments.length <= 3) {
                if (!_.isEmpty(sortIndex)) {
                    url = baseURL + sortIndex + "." + parsedOffset + "." + parsedSize + SCF.constants.JSON_EXT;
                } else {
                    url = baseURL + parsedOffset + "." + parsedSize + SCF.constants.JSON_EXT;
                }
            } else {
                // Must be an index:
                url = baseURL + "index." + parsedOffset + "." + parsedSize + "." + parsedIndexName + SCF.constants
                    .JSON_EXT;
            }
            this.model.url = url + window.location.search;
            this.model.reload();
        },

        update: function() {
            this.files = void 0;
            this.render();
        },
        requiresSession: true,
        showErrorOnAdd: function(error) {
            if (error.details.status.code == "401") {
                var siteLink = $($(".scf-js-site-title")[0]).attr("href");
                window.location.href = "http://" + location.host + siteLink.replace(".html", "/signin.html");
            } else {
                error.details.status.message = CQ.I18n.get("Comment text is empty");
                if (error.details.status.code == "400") {
                    error.details.status.message = CQ.I18n.get("Required fields are missing");
                } else if (this.isExceptionOnUGCLimit(error)) {
                    //isExceptionOnUGCLimit checks if error.details.error is present
                    error.details.status.message = CQ.I18n.get("Exceeded contribution limit");
                    this.showUGCLimitDialog(error.details.error.message);
                } else {
                    error.details.status.message = CQ.I18n.get(
                        "Server error occurred. Please try again later.");
                }
                this.addErrorMessage(this.$el.find(".scf-js-composer-block input[type='text'], textarea").first(),
                    error);
            }
            this.log.error(error);

        },
        isExceptionOnUGCLimit: function(error) {
            if (error.details && error.details.error) {
                var responseError = error.details.error;
                if (responseError && responseError["class"] ===
                    "com.adobe.cq.social.scf.OperationException" &&
                    responseError.message.indexOf("Exceeded contribution limit") >= 0) {
                    return true;
                } else {
                    return false;
                }
            }
            return false;
        },
        showUGCLimitDialog: function(message, isModerationMessage) {
            if (!$CQ(".scf-comment-ugclimitdialog").length) {
                var modalDialogMarkup = SCF.CommentSystemView.templates.ugcLimitDialog;
                var modalDialogTemplate = this.compileTemplate(modalDialogMarkup);
                modalDialogMarkup = $CQ(modalDialogTemplate(this.getContextForTemplate()));
                $CQ(modalDialogMarkup).appendTo(this.$el);
            }
            var modalMessage = CQ.I18n.get(
                "We are sorry, but as new member you are limited to the number of user generated content that you can create. If you like, you may contact a Community Manager or Community Moderator on the following email(s) : "
            );
            if (isModerationMessage) {
                $CQ(".scf-comment-ugclimitdialog-title").text(CQ.I18n.get("Content Notice"));
                $CQ(".scf-comment-ugclimitdialog-text").text(
                    CQ.I18n.get("Your contribution has been submitted. It will appear on the site once approved by a moderator")
                );
            } else {
                $CQ(".scf-comment-ugclimitdialog-text").text(modalMessage + message.split(":")[1]);
            }
            $CQ(".scf-comment-ugclimitdialog").modal("show");
            //Dont remove i18n commented code. Its needed by translation team to translate these strings
            //These strings are used by markup defined in templates.js
            //CQ.I18n.get("Content Notice");
            //CQ.I18n.get("Close");
        },
        hideError: function() {

        },
        expandComposer: function() {
            this.$el.find(".scf-js-composer-block:first").removeClass("scf-is-collapsed");
            var composer = this.$el.find(".scf-js-composer-block");
            var _msg = this.getField("message");
            var _phtext = CQ.I18n.get("Write a comment");
            var _txt = _msg.substring(0, _phtext.length);
            if (_phtext == _txt) {
                this.setField("message", "");
            }
            if (composer.is(":visible")) {
                // In IE10 the RTE doesn't get cleared out when the composer opens it retains the
                // placeholder text.
                if ("" === _msg) {
                    this.setField("message", "");
                }
            } else {
                this.files = void 0;
                this.$el.find(".scf-attachment-list").first().empty();
            }
            this.focus("message");
        },
        cancelComposer: function() {
            this.$el.find(".scf-js-composer-block:first").addClass("scf-is-collapsed");
            this.files = undefined;
            $CQ(".scf-js-composer-att").empty();
            this.setField("message", "");
            this.clearErrorMessages();
        },
        toggleComposer: function(e) {
            $CQ('.scf-attachment-error').remove();
        },
        addCommentDraft: function(e) {
            var data = this.extractCommentData(e);
            data.isDraft = true;
            return this.addToCommentModel(data, e);
        },
        addToCommentModel: function(data, e) {
            this.model.addComment(data);
            if (e.target) {
                e.preventDefault();
            }
            return false;
        },
        addComment: function(e) {
            var data = this.extractCommentData(e);
            if (data === false) return false;
            return this.addToCommentModel(data, e);
        },
        extractCommentData: function(e) {
            var form = this.getForm("new-comment");
            if (form === null || form.validate()) {
                var msg = this.getField("message");
                var tags = this.getField("tags");
                var data = _.extend(this.getOtherProperties(), {
                    "message": msg,
                    "tags": tags
                });
                if (!SCF.Session.get("loggedIn")) {
                    data.userIdentifier = this.getField("anon-name");
                    data.email = this.getField("anon-email");
                    data.url = this.getField("anon-web");
                }
                if (typeof this.files !== "undefined") {
                    data.files = this.files;
                }
                return data;
            } else {
                return false;
            }
        },
        navigate: function(e) {
            var windowHost = window.location.protocol + "//" + window.location.host;
            var suffix = $CQ(e.currentTarget).data("page-suffix");
            var pageInfo = this.model.get("pageInfo");
            var hostInfo = SCF.config.urlRoot;
            var basePageURL = pageInfo.basePageURL;
            var queryString = window.location.search;
            var pathFromURL = window.location.pathname;
            var suffixPath = pathFromURL.substr(pathFromURL.lastIndexOf(".html") + 5);
            var urlPattWithSelectorAndPages = /(.*)\.(\w*)?\.(\d*)?\.(\d*)?\.html(\/.*)?/;
            var urlPattWithSelector = /(.*)\.(\w*)?\.html(\/.*)?/;
            var urlPattNoSelector = /(.*)\.html(\/.*)?/;
            if (_.isUndefined(basePageURL) || basePageURL === null) {
                var path = pathFromURL;
                var urlMatch = urlPattWithSelectorAndPages.exec(path);
                if (urlMatch) {
                    path = urlMatch[1] + "." + urlMatch[2];
                } else {
                    urlMatch = urlPattWithSelector.exec(path);
                    if (urlMatch) {
                        path = urlMatch[1] + "." + urlMatch[2];
                    } else {
                        urlMatch = urlPattNoSelector.exec(path);
                        path = urlMatch[1];
                    }
                }
                basePageURL = path;
            }
            if ((windowHost + Granite.HTTP.getContextPath()).indexOf(SCF.config.urlRoot) != -1) {
                var pageToGoTo = basePageURL + "." + suffix + ".html" + suffixPath;
                pageToGoTo = _.isEmpty(queryString) ? pageToGoTo : pageToGoTo + queryString;
                SCF.Router.navigate(pageToGoTo, {
                    trigger: true
                });
            } else {
                suffix = $(e.currentTarget).data("pageSuffix");
                var suffixInfo = suffix.split(".");
                if (pageInfo.sortIndex !== null) {
                    this.paginate(basePageURL, suffixInfo[0], suffixInfo[1], pageInfo.sortIndex);
                } else {
                    this.paginate(basePageURL, suffixInfo[0], suffixInfo[1]);
                }
            }

        },
        renderAttachmentList: function(e) {
            e.preventDefault();
            if (typeof this.files == 'undefined') {
                this.files = [];
            }
            this.files.push.apply(this.files, e.target.files);
            var attachments = $CQ(".scf-js-composer-att");
            attachments.empty();
            // files is a FileList of File objects. List some properties.
            for (var i = 0; i < this.files.length; i++) {
                var f = this.files[i];
                var attachment = $CQ("<li class=\"scf-is-attached\">" + _.escape(f.name) + " - " + f.size + " bytes</li>");
                attachments.append(attachment);
            }
        },
        openAttachmentDialog: function(e) {
            if (SCF.Util.mayCall(e, "preventDefault")) {
                e.preventDefault();
            }
            this.$el.find("input[type='file']").first().click();
        },
        translateAll: function() {
            this.model.translateAll();
        },
        refetchBasedOnSort: function(e) {
            var sortItemEl = $CQ(e.target).find(".scf-sort-type").addBack(".scf-sort-type");
            var sortField = sortItemEl.data("sort-field");
            var sortOrder = sortItemEl.data("sort-order");

            if (typeof(Storage) !== "undefined") {
                // Store
                localStorage.setItem("sortOrderLs", sortOrder);
            } else {
                throw new Error("Sorry, your browser does not support Web Storage...");
            }
            this.$el.find(".scf-sort-btngrp-btnlabel").text(sortItemEl.text());
            this.model.refetchUsingSort(sortField, sortOrder);
        }
    });

    var Comment = SCF.Model.extend({
        modelName: "CommentModel",
        DELETE_OPERATION: "social:deleteComment",
        UPDATE_OPERATION: "social:updateComment",
        CREATE_OPERATION: "social:createComment",
        EDIT_TRANSLATION_OPERATION: "social:editTranslation",
        CHANGESTATE_OPERATION: "social:changeState",
        events: {
            ADDED: "comment:added",
            UPDATED: "comment:updated",
            DELETED: "comment:deleted",
            ADD_ERROR: "comment:addError",
            UPDATE_ERROR: "comment:updateError",
            DELETE_ERROR: "comment:deleteError",
            TRANSLATED: "comment:translated",
            TRANSLATE_ERROR: "comment:translateError"
        },
        initialize: function() {
            if (this.isTranslationPresent()) {
                this.set('showingTranslation', true);
                SCF.Comment.isSmartRenderingOn = true;
            }
            this.on('change', function() {
                if (SCF.Comment.isSmartRenderingOn === true) {
                    if (this.get('showingTranslation') === undefined && this.isTranslationPresent())
                        this.set('showingTranslation', true);
                }
            });
        },
        _fixCachedProperties: function() {
            if (!this._isReady) {
                this.on("model:loaded", _.bind(this._fixCachedProperties, this));
                return;
            }
            this.off("model:loaded", _.bind(this._fixCachedProperties, this));
            if (SCF.hasOwnProperty("Session") && (SCF.Session !== null)) {
                var canEdit = this.attributes.canEdit;
                var canDelete = this.attributes.canDelete;
                var currentUserFlagged = this.attributes.isFlaggedByUser;
                var commentApproved = this.attributes.approved;
                var moderatorActions = this.attributes.moderatorActions || {};
                var userIsLoggedIn = SCF.Session.attributes.loggedIn;
                var loggedInUserId = _.isUndefined(SCF.Session.attributes.id) ? "" : SCF.Session.attributes.id.substr(SCF.Session.attributes.id.lastIndexOf("/") + 1);
                var userIsOwner = (this.attributes.author || false) && SCF.Session.attributes.loggedIn && ((this.attributes.author.id === SCF.Session.attributes.id) || ((this.attributes.properties || false) && this.attributes.properties.composedBy === loggedInUserId));
                var isFlaggedHidden = (this.attributes.moderatorStatus || false) && this.attributes.moderatorStatus.hasOwnProperty("isFlagged") ? this.attributes.moderatorStatus.isFlagged : false;
                var isSpam = (this.attributes.moderatorStatus || false) && this.attributes.moderatorStatus.hasOwnProperty("isSpam") ? this.attributes.moderatorStatus.isSpam : false;
                var userIsModerator = SCF.Session.checkIfModeratorFor(this.attributes.sourceComponentId);

                moderatorActions.canAllow = userIsModerator && !this.attributes.isClosed && (isSpam || isFlaggedHidden ||
                    !this.attributes.approved);

                moderatorActions.canDeny = (this.attributes.configuration || false) && userIsModerator && !isSpam &&
                    this.attributes.configuration.isDenyAllowed;

                moderatorActions.canClose = (this.attributes.configuration || false) && userIsModerator && this.attributes.topLevel &&
                    this.attributes.configuration.isCloseAllowed;

                moderatorActions.canFlag = !this.attributes.isClosed && !currentUserFlagged && userIsLoggedIn && commentApproved &&
                    !userIsOwner && !isSpam && !isFlaggedHidden && this.attributes.configuration.isFlaggingAllowed;

                // TODO: need some inputs on how to integrate with the state machine

                this.attributes.canEdit = userIsModerator || ((this.attributes.configuration || false) && userIsOwner && this.attributes.configuration.isEditAllowed && !this.attributes.isClosed);
                this.attributes.canDelete = userIsModerator || ((this.attributes.configuration || false) && userIsOwner && this.attributes.configuration.isDeleteAllowed && !this.attributes.isClosed);
                this.attributes.canReply = SCF.Session.attributes.mayReply && ((this.attributes.configuration || false) && this.attributes.configuration.isReplyAllowed && !this.attributes.isClosed);
                this.attributes.moderatorActions = moderatorActions;
                this.fixCachedProperties(userIsModerator);
                this.cacheFixed = true;
                this.trigger("model:cacheFixed", this);
            }
        },
        fixCachedProperties: function(userIsModerator) {

        },
        constructor: function(attributes, options) {
            SCF.Model.prototype.constructor.apply(this, [attributes, options]);
            if (SCF.Session.isReady()) {
                this._fixCachedProperties();
            } else {
                SCF.Session.on("model:loaded", _.bind(this._fixCachedProperties, this));
            }
        },
        remove: function() {
            var error = _.bind(function(jqxhr, text, error) {
                this.trigger(this.events.DELETE_ERROR, this.parseServerError(jqxhr, text, error));
            }, this);
            var success = _.bind(function(response) {
                // If it's topic, these should be 1
                var totalComments = 1;
                var commentsInPage = 1;

                if (!(this.attributes.topic || this.attributes.topLevel)) {
                    totalComments = this.collection.parent.attributes.totalSize;
                    commentsInPage = this.collection.parent.attributes.items.length;
                    this.collection.parent.set('totalSize', totalComments - 1);
                }
                totalComments = totalComments - 1;

                this.trigger('destroy', this);
                if ((commentsInPage == 1) && ($('a[class="scf-page scf-currentPage"]').length !== 0)) {     //this page had just one comment and we have deleted it
                    var pageSuffix = $('a[class="scf-page scf-currentPage"]').data("page-suffix");
                    var pageSuffixSplit = pageSuffix.toString().split(".");
                    if(pageSuffixSplit[0] !== 0) {
                        var newPageSuffix = ((parseInt(pageSuffixSplit[0], 10) - parseInt(pageSuffixSplit[1], 10)) + "." + pageSuffixSplit[1]);
                        window.location.href = window.location.href.replace(pageSuffix, newPageSuffix);
                    }
                } else if (!this.attributes.topic && (totalComments % this.attributes.configuration.pageSize == 0)) {                   //we have deleted last comment on some page, let's retrigger pagination
                    location.reload();
                }
                this.trigger(this.events.DELETED, {
                    model: this
                });
            }, this);
            $CQ.ajax(SCF.config.urlRoot + this.get('id') + SCF.constants.URL_EXT, {
                dataType: 'json',
                type: 'POST',
                xhrFields: {
                    withCredentials: true
                },
                data: {
                    ':operation': this.DELETE_OPERATION
                },
                'success': success,
                'error': error
            });
        },
        saveEditTranslation: function() {
            var error = _.bind(function(jqxhr, text, error) {
                this.trigger(this.events.UPDATE_ERROR, this.parseServerError(jqxhr, text, error));
            }, this);
            var success = _.bind(function(response) {
                this.reset(response.response, {
                    silent: true
                });
                this.set("showingTranslation", true, {
                    silent: true
                });
                this.set("editTranslationInProgress", false, {
                    silent: true
                });
                if (this.get('translationDisplay') === 'side')
                    this.set("displaySideBySide", true, {
                        silent: true
                    });

                if (this.get('isVisible')) {
                    this.trigger(this.events.UPDATED, {
                        model: this
                    });
                } else {
                    this.trigger(this.events.DELETED, {
                        model: this
                    });
                    this.trigger('destroy', this);
                }
            }, this);
            var postData = {
                'translatedText': this.get('message'),
                'id': 'nobot',
                ':operation': this.EDIT_TRANSLATION_OPERATION
            };
            $CQ.ajax(SCF.config.urlRoot + this.get('id') + SCF.constants.TRANSLATE_URL_EXT, {
                dataType: 'json',
                type: 'POST',
                xhrFields: {
                    withCredentials: true
                },
                data: this.addEncoding(postData),
                'success': success,
                'error': error
            });
        },
        saveEdits: function() {
            var error = _.bind(function(jqxhr, text, error) {
                this.trigger(this.events.UPDATE_ERROR, this.parseServerError(jqxhr, text, error));
            }, this);
            var success = _.bind(function(response) {
                this.reset(response.response, {
                    silent: true
                });
                if (this.get('isVisible')) {
                    this.trigger(this.events.UPDATED, {
                        model: this
                    });
                } else if (this.get("draft")) {
                    this.trigger(this.events.UPDATED, {
                        model: this
                    });
                } else if (!this.get('approved')) {
                    this.view.showUGCLimitDialog(null, true);
                    var that = this;
                    var observer = new MutationObserver(function(mutations) {
                        if ($('.scf-comment-ugclimitdialog').is(':hidden')) {
                            if (that.get("topLevel")) {
                                location.href = that.get("pageInfo").basePageURL + ".html";
                            } else {
                                window.location.reload();
                            }
                            this.disconnect();
                        }
                    });
                    var target = document.querySelector(".scf-comment-ugclimitdialog");
                    observer.observe(target, {
                        attributes: true
                    });
                } else {
                    this.trigger(this.events.DELETED, {
                        model: this
                    });
                    this.trigger('destroy', this);
                }
            }, this);
            var postData = null;
            var files = this.get('files');
            var hasAttachment = (typeof files !== "undefined");
            var tags = this.get('tags');

            if (hasAttachment) {
                // Create a formdata object and add the files
                if (window.FormData) {
                    postData = new FormData();
                }
                if (postData) {
                    $CQ.each(files, function(key, value) {
                        postData.append("file", value);
                    });
                    postData.append('id', 'nobot');
                    postData.append(':operation', this.UPDATE_OPERATION);
                    postData.append("message", this.get("message"));
                    $CQ.each(this.getCustomProperties(), function(key, value) {
                        postData.append(key, value);
                    });
                    if (tags) {
                        $CQ.each(tags, function(key, value) {
                            postData.append("tags", value);
                        });
                    }
                }
            }
            if (postData === null) {
                postData = {
                    'message': this.get('message'),
                    'id': 'nobot',
                    ':operation': this.UPDATE_OPERATION
                };
                if (tags) {
                    postData.tags = tags;
                }

                postData = _.extend(this.getCustomProperties(), postData);
            }

            $CQ.ajax(SCF.config.urlRoot + this.get('id') + SCF.constants.URL_EXT, {
                dataType: 'json',
                processData: !hasAttachment,
                contentType: (hasAttachment) ? false : 'application/x-www-form-urlencoded; charset=UTF-8',
                type: 'POST',
                xhrFields: {
                    withCredentials: true
                },
                data: this.addEncoding(postData),
                'success': success,
                'error': error
            });
        },
        loadMore: function() {
            var url = this.get("pageInfo").nextPageURL;
            if (url.indexOf(".html", this.length - 5) !== -1) {
                url = url.substr(0, url.lastIndexOf(".html")) + ".json";
            } else if (url.indexOf(".null", this.length - 5) !== -1) {
                url = url.substr(0, url.lastIndexOf(".null")) + ".json";
            }
            var that = this;
            var moreComments = this.constructor.find(url, function(model) {
                var items = model.get("items");
                var pageInfo = model.get("pageInfo");
                that.set("pageInfo", pageInfo);
                var oldItems = that.get("items");
                oldItems.add(items.models, {
                    silent: true,
                    merge: true
                });
                that.trigger(that.events.UPDATED, {
                    model: that
                });
            }, true);
        },
        getCustomProperties: function() {
            return {};
        },
        isTranslationPresent: function() {
            var translatedText = this.get('translationDescription');
            return (!_.isEmpty(translatedText));
        },
        translate: function(callBackFun) {
            if (this.get('translationAjaxInProgress') !== true) {
                if (this.isTranslationPresent()) {
                    var bShowTranslation = true;
                    if (this.get('showingTranslation') === true) {
                        bShowTranslation = false;
                    }
                    this.set({
                        showingTranslation: bShowTranslation
                    });
                    this.trigger(this.events.UPDATED, {
                        model: this
                    });
                    if (callBackFun)
                        callBackFun();
                    return;
                }
                this.set('translationAjaxInProgress', true);
                var error = _.bind(function(jqxhr, text, error) {
                    this.set('translationAjaxInProgress', false);
                    this.trigger(this.events.TRANSLATE_ERROR, this.parseServerError(jqxhr, text, error));
                }, this);
                var success = _.bind(function(response) {
                    this.set('translationAjaxInProgress', false);
                    this.set({
                        showingTranslation: true
                    });
                    this.set({
                        translationDescription: response.translationDescription
                    });
                    this.set({
                        translationAttribution: response.translationAttribution
                    });
                    this.set({
                        translationTitle: response.translationTitle
                    });
                    if (this.get('translationDisplay') === 'side')
                        this.set("displaySideBySide", true, {
                            silent: true
                        });
                    this.trigger(this.events.UPDATED, {
                        model: this
                    });
                    if (callBackFun)
                        callBackFun();
                }, this);
                var translateUrl = SCF.config.urlRoot + this.get('id') + SCF.constants.TRANSLATE_URL_EXT;
                $CQ.ajax({
                    type: "GET",
                    url: translateUrl,
                    dataType: "json",
                    success: success,
                    error: error
                });
                this.trigger(this.events.UPDATED, {
                    model: this
                });
            }
        },
        addReply: function(data, scb, fcb) {
            var success = _.bind(function(response) {
                var comment = response.response;
                var replyModelName = this.constructor.prototype.relationships.items.model;
                var ReplyKlass = SCF.Models[replyModelName];
                if (_.isUndefined(ReplyKlass)) {
                    this.log.error("reply model not found: " + replyModelName);
                    return;
                }
                var newComment = new ReplyKlass(comment);

                var totalComments;
                if (!newComment.get("isVisible") && !newComment.get("draft")) {
                    this.view.showUGCLimitDialog(null, true);
                } else {
                    if (this.attributes.items.length <= this.attributes.configuration.pageSize + 1) { //If no of replies in current page are less than page size
                        newComment._isReady = true;
                        newComment.set("_isNew", true);
                        var comments = this.get('items');
                        var isCollectionNew = false;
                        if (!comments) {
                            var CollectionKlass = SCF.Collections[this.constructor.prototype.relationships.items.collection] || Backbone.Collection;
                            comments = new CollectionKlass();
                            comments.model = this.constructor;
                            comments.parent = this;
                            isCollectionNew = true;
                        }
                        comments.push(newComment);
                        totalComments = this.get('totalSize');
                        if (isCollectionNew) {
                            this.set('items', comments);
                        }
                        this.set('totalSize', totalComments + 1);
                        newComment.constructor.prototype._cachedModels[comment.id] = newComment;
                    } else {
                        totalComments = this.get('totalSize');
                        this.set('totalSize', totalComments + 1);
                    }
                    if ((this.attributes.items.length > 2) && (this.attributes.totalSize % this.attributes.configuration.pageSize == 2)) {
                        //if pagination has been triggered and if this will be the comment in new page and if it's not just the second comment on the current page, let's reload
                        location.reload();
                    }
                    window.scrollTo(0, 0); //let's scroll, so that publish message is visible
                    $('.scf-social-console-textbox-tooltip').show().delay(5000).hide(0);
                }

                this.trigger(this.events.ADDED, {
                    model: this
                });
                SCF.Util.announce(this.events.ADDED, newComment.attributes);
            }, this);
            var error = _.bind(function(jqxhr, text, error) {
                this.trigger(this.events.ADD_ERROR, this.parseServerError(jqxhr, text, error));
            }, this);
            var postData;
            var hasAttachment = (typeof data.files != 'undefined');

            if (hasAttachment) {
                // Create a formdata object and add the files
                if (window.FormData) {
                    postData = new FormData();
                }

                if (postData) {
                    $CQ.each(data.files, function(key, value) {
                        postData.append("file", value);
                    });
                    postData.append('id', 'nobot');
                    postData.append(':operation', this.CREATE_OPERATION);
                    delete data.files;
                    $CQ.each(data, function(key, value) {
                        postData.append(key, value);
                    });
                }
            } else {
                postData = {
                    'id': 'nobot',
                    ':operation': this.CREATE_OPERATION
                };
                _.extend(postData, data);
            }

            $CQ.ajax(SCF.config.urlRoot + this.get('id') + SCF.constants.URL_EXT, {
                dataType: 'json',
                type: 'POST',
                processData: !hasAttachment,
                contentType: (hasAttachment) ? false : 'application/x-www-form-urlencoded; charset=UTF-8',
                xhrFields: {
                    withCredentials: true
                },
                data: this.addEncoding(postData),
                'success': success,
                'error': error
            });
        },
        changeCommentState: function(data, scb, fcb) {
            var success = _.bind(function(response) {
                this.set("state", data.toState);
                var comment = response.response;
                var replyModelName = this.constructor.prototype.relationships.items.model;
                var ReplyKlass = SCF.Models[replyModelName];
                if (_.isUndefined(ReplyKlass)) {
                    this.log.error("reply model not found: " + replyModelName);
                    return;
                }
                // add review comment
                var newComment = new ReplyKlass(comment);
                newComment._isReady = true;
                newComment.set("_isNew", true);
                var comments = this.get('items');
                var isCollectionNew = false;
                if (!comments) {
                    var CollectionKlass = SCF.Collections[this.constructor.prototype.relationships.items.collection] || Backbone.Collection;
                    comments = new CollectionKlass();
                    comments.model = this.constructor;
                    comments.parent = this;
                    isCollectionNew = true;
                }
                comments.push(newComment);
                var totalComments = this.get('totalSize');
                if (isCollectionNew) {
                    this.set('items', comments);
                }
                this.set('totalSize', totalComments + 1);
                newComment.constructor.prototype._cachedModels[comment.id] = newComment;
                this.trigger(this.events.ADDED, {
                    model: this
                });
            }, this);
            var error = _.bind(function(jqxhr, text, error) {
                this.trigger(this.events.ADD_ERROR, this.parseServerError(jqxhr, text, error));
            }, this);
            var hasAttachment = false;
            var postData = {
                'id': 'nobot',
                ':operation': this.CHANGESTATE_OPERATION
            };
            _.extend(postData, data);

            $CQ.ajax(SCF.config.urlRoot + this.get('id') + SCF.constants.URL_EXT, {
                dataType: 'json',
                type: 'POST',
                processData: !hasAttachment,
                contentType: (hasAttachment) ? false : 'application/x-www-form-urlencoded; charset=UTF-8',
                xhrFields: {
                    withCredentials: true
                },
                data: this.addEncoding(postData),
                'success': success,
                'error': error
            });
        },
        flag: function(flagText, doFlag) {
            var error = _.bind(function(jqxhr, text, error) {
                this.log.error("error flagging comment " + error);
                this.trigger('comment:flagerror', {
                    'error': error
                });
            }, this);
            var success = _.bind(function(response) {
                this.reset(response.response, {
                    silent: true
                });
                if (this.get('isVisible')) {
                    this.trigger('comment:flagged', {
                        model: this
                    });
                    this.trigger(this.events.UPDATED, {
                        model: this
                    });
                } else {
                    this.trigger(this.events.DELETED, {
                        model: this
                    });
                    this.trigger('destroy', this);
                }
            }, this);
            var postData = {
                'id': 'nobot',
                ':operation': 'social:flag',
                'social:flagformtext': flagText,
                'social:doFlag': doFlag
            };
            $CQ.ajax(SCF.config.urlRoot + this.get('id') + SCF.constants.URL_EXT, {
                dataType: 'json',
                type: 'POST',
                xhrFields: {
                    withCredentials: true
                },
                data: this.addEncoding(postData),
                'success': success,
                'error': error
            });
        },
        allow: function() {
            var error = _.bind(function(jqxhr, text, error) {
                this.log.error("error allowing comment " + error);
                this.trigger('comment:allowerror', {
                    'error': error
                });
            }, this);
            var success = _.bind(function(response) {
                this.reset(response.response);
                this.trigger('comment:allowed', {
                    model: this
                });
                this.trigger(this.events.UPDATED, {
                    model: this
                });
            }, this);
            var postData = {
                'id': 'nobot',
                ':operation': 'social:allow'
            };
            $CQ.ajax(SCF.config.urlRoot + this.get('id') + SCF.constants.URL_EXT, {
                dataType: 'json',
                type: 'POST',
                xhrFields: {
                    withCredentials: true
                },
                data: this.addEncoding(postData),
                'success': success,
                'error': error
            });
        },
        resetChildren: function() {
            var children = this.get("items");
            children.each(function(child) {
                child.destroy();
            });
        },
        close: function(doClose) {
            var error = _.bind(function(jqxhr, text, error) {
                this.log.error("error closing/opening comment " + error);
                this.trigger('comment:closeopenerror', {
                    'error': error
                });
            }, this);
            var success = _.bind(function(response) {
                this.resetChildren();
                this.reset(response.response);
                this.trigger('comment:closedOpened', {
                    model: this
                });
                this.trigger(this.events.UPDATED, {
                    model: this
                });
            }, this);
            var close = doClose ? "true" : "false";
            var postData = {
                'id': 'nobot',
                ':operation': 'social:close',
                'social:doClose': close
            };
            $CQ.ajax(SCF.config.urlRoot + this.get('id') + SCF.constants.URL_EXT, {
                dataType: 'json',
                type: 'POST',
                xhrFields: {
                    withCredentials: true
                },
                data: this.addEncoding(postData),
                'success': success,
                'error': error
            });
        },
        deny: function() {
            var error = _.bind(function(jqxhr, text, error) {
                this.log.error("error denying comment " + error);
                this.trigger('comment:denyerror', {
                    'error': error
                });
            }, this);
            var success = _.bind(function(response) {
                this.reset(response.response);
                this.trigger('comment:denied', {
                    model: this
                });
                this.trigger(this.events.UPDATED, {
                    model: this
                });
            }, this);
            var postData = {
                'id': 'nobot',
                ':operation': 'social:deny'
            };
            $CQ.ajax(SCF.config.urlRoot + this.get('id') + SCF.constants.URL_EXT, {
                dataType: 'json',
                type: 'POST',
                xhrFields: {
                    withCredentials: true
                },
                data: this.addEncoding(postData),
                'success': success,
                'error': error
            });
        },
        pin: function() {
            this.doPin(true);
        },
        unpin: function() {
            this.doPin(false);
        },
        doPin: function(flag) {
            var _triggerSuccess = "comment:pin";
            var _triggerError = "comment:pinerror";
            if (!flag) {
                _triggerSuccess = "comment:unpin";
                _triggerError = "comment:unpinerror";
            }
            var error = _.bind(function(jqxhr, text, error) {
                this.log.error("error pinunpin comment " + error);
                this.trigger(_triggerError, {
                    'error': error
                });
            }, this);
            var success = _.bind(function(response) {
                this.reset(response.response);
                this.trigger(_triggerError, {
                    model: this
                });
                this.trigger(this.events.UPDATED, {
                    model: this
                });
            }, this);

            var postData = {
                ':operation': 'social:pin',
                'social:doPin': flag
            };
            $CQ.ajax(SCF.config.urlRoot + this.get('id') + SCF.constants.URL_EXT, {
                dataType: 'json',
                type: 'POST',
                xhrFields: {
                    withCredentials: true
                },
                data: this.addEncoding(postData),
                'success': success,
                'error': error
            });
        },
        markFeatured: function() {
            this.makeFeatured(true);
        },
        unmarkFeatured: function() {
            this.makeFeatured(false);
        },
        makeFeatured: function(flag) {
            var _triggerSuccess = "Successfully marked as featured!!";
            var _triggerError = "Failed to mark as featured";
            if (!flag) {
                _triggerSuccess = "Successfully unmarked as featured";
                _triggerError = "Failed to unmarked as featured";
            }
            var error = _.bind(function(jqxhr, text, error) {
                this.log.error("error toggle topic as featured " + error);
                this.trigger(_triggerError, {
                    'error': error
                });
            }, this);
            var success = _.bind(function(response) {
                this.reset(response.response);
                this.trigger(_triggerError, {
                    model: this
                });
                this.trigger(this.events.UPDATED, {
                    model: this
                });
            }, this);

            var postData = {
                ':operation': 'social:featured',
                'social:markFeatured': flag
            };
            $CQ.ajax(SCF.config.urlRoot + this.get('id') + SCF.constants.URL_EXT, {
                dataType: 'json',
                type: 'POST',
                xhrFields: {
                    withCredentials: true
                },
                data: this.addEncoding(postData),
                'success': success,
                'error': error
            });
        },
        addIncludeHint: function(data) {
            var rootCollection = this;
            var type = null;
            while (rootCollection !== null) {
                if (rootCollection.hasOwnProperty("collection")) {
                    rootCollection = rootCollection.collection;
                } else {
                    type = rootCollection.parent.get("resourceType");
                    rootCollection = null;
                }
            }
            _.extend(data, {
                "scf:included": this.get("pageInfo").includedPath,
                "scf:resourceType": type
            });
        },
        deleteAttachment: function(attachmentPath) {
            var error = _.bind(function(jqxhr, text, error) {
                this.log.error("error deleting attachment " + error);
                this.trigger('comment:deleteAttError', {
                    'error': error
                });
            }, this);
            var success = _.bind(function(response) {
                this.trigger('comment:attDeleted', {
                    model: this,
                    attachment: attachmentPath
                });
                var atts = this.get("attachments");
                var newAtts = _.omit(atts, attachmentPath);
                this.set({
                    "attachments": newAtts
                });
            }, this);
            var attPath = attachmentPath.substr(attachmentPath.lastIndexOf("/") + 1);
            var postData = {
                'attToRemove': attPath,
                ':operation': 'social:deleteCommentAttachment'
            };
            $CQ.ajax(SCF.config.urlRoot + this.get('id') + SCF.constants.URL_EXT, {
                dataType: 'json',
                type: 'POST',
                xhrFields: {
                    withCredentials: true
                },
                data: this.addEncoding(postData),
                'success': success,
                'error': error
            });
        },
        relationships: {
            "items": {
                collection: "CommentList",
                model: "CommentModel"
            },
            "votes": {
                model: "VotingModel"
            }
        }
    });

    var CommentView = SCF.View.extend({
        viewName: "Comment",
        CREATE_EVENT: "SCFCreate",
        COMMUNITY_FUNCTION: "Comment System", // overwritten in the forum, blog, etc
        isExceptionOnUGCLimit: CommentSystemView.prototype.isExceptionOnUGCLimit,
        showUGCLimitDialog: CommentSystemView.prototype.showUGCLimitDialog,
        init: function() {

            this.listenTo(this.model, this.model.events.ADDED, this.update);
            this.listenTo(this.model, this.model.events.ADD_ERROR, this.showError);
            this.listenTo(this.model, this.model.events.UPDATED, this.commentViewUpdate);
            this.listenTo(this.model, this.model.events.UPDATE_ERROR, this.showError);
            this.listenTo(this.model, this.model.events.DELETED, this.removeView);
            this.listenTo(this.model, this.model.events.DELETE_ERROR, this.showError);
            this.listenTo(this.model, "comment:attDeleted", this.updateEditableAttachments);

            // record create event
            this.listenTo(this.model, this.model.events.ADDED, this.recordCreate);

            this.model.view = this;
            if (this.model.isTranslationPresent()) {
                if (this.model.get('translationDisplay') === 'side')
                    this.model.set('displaySideBySide', true);
            }
        },

        loadMore: function(e) {
            e.preventDefault();
            this.model.loadMore();
        },
        removeView: function() {
            Backbone.View.prototype.remove.apply(this, arguments);
            if (this.model.get("topLevel") && this.model.get("topLevel") === true) {
                location.href = this.model.get("pageInfo").basePageURL + ".html";
            }
        },
        commentViewUpdate: function() {
            this.render();
        },
        update: function() {
            this.files = undefined;
            this.render();
        },

        recordCreate: function() {
            if (!_.isUndefined(window._satellite)) {
                window._satellite.track("communities-scf-create");
            } else if (cqAnalytics.Sitecatalyst) {
                cqAnalytics.record({
                    event: this.CREATE_EVENT,
                    values: {
                        "functionType": SCF.Context.communityFunction ?
                            SCF.Context.communityFunction : this.COMMUNITY_FUNCTION,
                        "path": SCF.Context.path ? SCF.Context.path : this.model.get("id"),
                        "type": SCF.Context.type ? SCF.Context.type : this.model.get("resourceType"),
                        "ugcTitle": SCF.Context.ugcTitle,
                        "siteTitle": SCF.Context.siteTitle ?
                            SCF.Context.siteTitle : $(".scf-js-site-title").text(),
                        "sitePath": SCF.Context.sitePath ? SCF.Context.sitePath : this.sitePath,
                        "groupTitle": SCF.Context.groupTitle,
                        "groupPath": SCF.Context.groupPath,
                        "user": SCF.Context.user ? SCF.Context.user : SCF.Session.get("authorizableId")
                    },
                    collect: false,
                    componentPath: SCF.constants.ANALYTICS_BASE_RESOURCE_TYPE
                });
            }
        },

        afterRender: function() {
            this.model.unset("_isNew");
            var translateAllBtn = $('.generic-translation-all-button');
            if (translateAllBtn) {
                if (this.model.get('canTranslate') === true && !translateAllBtn.show())
                    translateAllBtn.show();
            }
            var attachments = this.$el.find(".scf-js-attachments").not(this.$("[data-scf-component] .scf-js-attachments"));
            var that = this;
            if ($CQ().imagesLoaded) {
                attachments.imagesLoaded(function() {
                    that.attachments = new SCFCards(attachments);
                });
            }
        },
        showError: function(error) {
            var targetTextArea = this.$el.find(".scf-js-comment-reply-box:first textarea");
            this.log.error(error);
            if (this.isExceptionOnUGCLimit(error)) {
                this.showUGCLimitDialog(error.details.error.message);
                error.details.status.message = CQ.I18n.get("Exceeded contribution limit");
            } else if (error.details.status.code.toString() === "401") {
                var siteLink = $($(".scf-js-site-title")[0]).attr("href");
                window.location.href = "http://" + location.host + siteLink.replace(".html", "/signin.html");
            } else if (error.details.status.code === "403") {
                error = error || {};
                if (!error.details.status.message) {
                    error.details.status.message = CQ.I18n.get("Unknown Error.");
                }
            } else {
                error.details.status.message = CQ.I18n.get(
                    "Server error occurred. Please try again later.");
            }
            this.addErrorMessage(targetTextArea, error);
        },
        hideError: function() {

        },
        edittranslation: function(e) {
            this.model.set('editTranslationInProgress', true);
            e.stopPropagation();
            var editBox = this.$el.find(".scf-js-comment-edit-box:first");
            editBox.toggle();
            this.$el.find(".scf-js-comment-msg:first").toggle();
            var text = this.model.get('translationDescription');
            this.setField("editMessage", text);
            this.focus("editMessage");
        },
        translate: function() {
            this.model.translate();
        },
        addReply: function(e) {
            var msg = this.getField('replyMessage');
            var isReply = true;
            var data = _.extend(this.getOtherProperties(isReply), {
                'message': msg
            });
            if (!SCF.Session.get("loggedIn")) {
                data.userIdentifier = this.getField("anon-name");
                data.email = this.getField("anon-email");
                data.url = this.getField("anon-web");
            }
            if (typeof this.files != 'undefined') {
                data.files = this.files;
            }
            this.clearErrorMessages();
            this.model.addReply(data);
            e.preventDefault();
            return false;
        },
        addReplyFromData: function(e, data) {
            if (!SCF.Session.get("loggedIn")) {
                data.userIdentifier = this.getField("anon-name");
                data.email = this.getField("anon-email");
                data.url = this.getField("anon-web");
            }
            if (typeof this.files != 'undefined') {
                data.files = this.files;
            }
            this.clearErrorMessages();
            this.model.addReply(data);
            e.preventDefault();
            return false;
        },
        reply: function(e) {
            e.stopPropagation();
            var replyBox = this.$el.find(".scf-js-comment-reply-box:first");
            replyBox.toggle();
            this.focus("replyMessage");
            // In IE10 the RTE doesn't get cleared out when the composer opens it retains the
            // placeholder text.
            this.setField("replyMessage", "");
        },
        remove: function(e) {
            e.stopPropagation();
            var deleteBox = this.$el.find(".comment-delete-box:first");
            this._closeModal = this.launchModal(deleteBox, CQ.I18n.get("Delete"));
        },
        noDelete: function(e) {
            e.stopPropagation();
            this._closeModal();
            this._closeModal = undefined;
        },
        reallyDelete: function(e) {
            e.stopPropagation();
            this.model.remove();
            this._closeModal();
            this._closeModal = undefined;
        },
        edit: function(e) {
            e.stopPropagation();
            this.model.set('editTranslationInProgress', false);
            var editBox = this.$el.find(".scf-js-comment-edit-box:first");
            editBox.toggle();
            this.$el.find(".scf-js-comment-msg:first").toggle();
            this.$el.find(".scf-comment-action").hide();
            var text = this.model.get("message");
            if (!this.model.getConfigValue("isRTEEnabled")) {
                //Assume text is not encoded
                text = $CQ("<div/>").html(text).text();
            }
            var attachments = this.$el.find(".scf-js-edit-attachments").not(this.$("[data-scf-component] .scf-js-edit-attachments"));
            var that = this;
            if ($CQ().imagesLoaded) {
                attachments.imagesLoaded(function() {
                    that.editableAttachments = new SCFCards(attachments);
                });
            }
            if(text.indexOf("<a id=\"renditionAnchor\"") != -1)
              text = text.replace(new RegExp("/renditions/", 'g'), "/images/");
            this.setField("editMessage", text);
            this.focus("editMessage");
        },
        save: function(e) {
            var data = this.getData();
            this.saveOperation(e, data);
        },
        saveDraft: function(e) {
            var data = this.getData();
            data.isDraft = true;
            this.saveOperation(e, data);
        },
        publishDraft: function(e) {
            var data = this.getData();
            this.saveOperation(e, data);
        },
        changeCommentState: function(e) {
            var msg = this.getField("message");
            var data = _.extend(this.getOtherProperties(), {
                "message": msg
            });
            this.clearErrorMessages();
            if (_.isEmpty(msg) === false) {
                this.model.changeCommentState(data);
            }
            e.preventDefault();
            return false;
        },
        saveOperation: function(e, data) {
            e.stopPropagation();
            e.preventDefault();
            var bEditTranslationInProgress = this.model.get('editTranslationInProgress');
            this.clearErrorMessages();
            this.model.set(data);
            if (bEditTranslationInProgress) {
                this.model.saveEditTranslation();
            } else {
                this.model.saveEdits();
            }
            this.files = undefined;
            $CQ(".scf-js-composer-att").empty();
            return false;
        },
        getData: function() {
            var textareaVal = this.getField("editMessage");
            var tags = this.getField("editTags");
            var data = _.extend(this.getOtherProperties(), {
                message: textareaVal,
                "tags": tags
            });

            if (typeof this.files != 'undefined') {
                data.files = this.files;
            }
            return data;
        },
        cancelComposer: function(e) {
            e.stopPropagation();
            this.clearErrorMessages();
            var replyBox = this.$el.find(".scf-js-comment-reply-box:first");
            replyBox.toggle();
            this.files = undefined;
        },
        cancel: function(e) {
            e.stopPropagation();
            this.clearErrorMessages();
            var editBox = this.$el.find(".scf-js-comment-edit-box:first");
            editBox.hide();
            var data = this.model.changedAttributes();
            if (data) {
                var keys = _.keys(data);
                var resetData = _.pick(this.model.previousAttributes(), keys);
                this.model.set(resetData);
            }
            this.$el.find(".scf-js-comment-msg:first").show();
            this.$el.find(".scf-comment-action").show();
        },
        getOtherProperties: function() {
            return {};
        },
        editFlagReason: function(e) {
            e.preventDefault();
            var editReasonBox = this.$el.find(".scf-js-flagreason-box:first");
            this._closeDialog = this.launchModal(editReasonBox, CQ.I18n.get("Flag"));
        },
        cancelFlagging: function(e) {
            e.preventDefault();
            this._closeDialog();
            this._closeDialog = undefined;
        },
        addFlagReason: function(e) {
            e.preventDefault();
            var selection = this.getField("flagReason");
            if (selection.length === 0 || selection === "custom") {
                selection = this.getField("customFlagReason");
            }
            if (selection.length !== 0) {
                this.model.flag(selection, true);
            } else {
                this.model.flag("", true);
            }
            this._closeDialog();
            this._closeDialog = undefined;
        },
        toggleFlag: function(e) {
            e.preventDefault();
            var toggleFlagBox = this.$el.find(".scf-js-toggleFlag-box:first");
            toggleFlagBox.toggle();
        },
        removeFlag: function(e) {
            e.preventDefault();
            this.model.flag(null, false);
        },
        close: function(e) {
            e.preventDefault();
            this.model.close(true);
        },
        open: function(e) {
            e.preventDefault();
            this.model.close(false);
        },
        allow: function(e) {
            e.preventDefault();
            this.model.allow();
        },
        deny: function(e) {
            e.preventDefault();
            this.model.deny();
        },
        pin: function(e) {
            e.preventDefault();
            this.model.pin();
        },
        unpin: function(e) {
            e.preventDefault();
            this.model.unpin();
        },
        markFeatured: function(e) {
            e.preventDefault();
            this.model.markFeatured();
        },
        unmarkFeatured: function(e) {
            e.preventDefault();
            this.model.unmarkFeatured();
        },
        getLastPath: function() {
            var idPath = this.model.get('id');
            var lastPath = idPath.lastIndexOf("/");
            lastPath = idPath.slice(lastPath + 1);
            return lastPath;
        },
        renderAttachmentList: function(e) {
            e.preventDefault();
            if (typeof this.files == 'undefined') {
                this.files = [];
            }
            this.files.push.apply(this.files, e.target.files);
            var attachments = $CQ(".scf-js-composer-att");
            attachments.empty();
            for (var i = 0; i < this.files.length; i++) {
                var f = this.files[i];
                var attachment = $CQ("<li class=\"scf-is-attached\">" + _.escape(f.name) + " - " + f.size + " bytes</li>");
                attachments.append(attachment);
            }
        },
        openAttachmentDialog: function(e) {
            if (SCF.Util.mayCall(e, "preventDefault")) {
                e.preventDefault();
            }
            this.$el.find("input[type='file']").first().click();
        },
        toggleAttachmentOverlay: function(e) {
            var item = $(e.target).closest(".scf-js-comment-att");
            if (item.hasClass("scf-is-card-overlay-on")) {
                item.removeClass("scf-is-card-overlay-on");
            } else {
                item.addClass("scf-is-card-overlay-on");
            }
        },
        deleteAttachment: function(e) {
            var item = $(e.target).closest(".scf-js-comment-att");
            var attPath = item.data("attachment-path");
            this.model.deleteAttachment(attPath);
        },
        updateEditableAttachments: function(args) {
            var attachment = args.attachment;
            var item = this.$el.find("[data-attachment-path=\"" + attachment + "\"]");
            item.remove();
            this.editableAttachments.redraw(true);
        },
        confirmDeleteAttachment: function(e) {
            var item = $(e.target).closest(".scf-js-comment-att");
            item.addClass("scf-is-att-confirm-overlay-on");
        },
        cancelDeleteAttachment: function(e) {
            var item = $(e.target).closest(".scf-js-comment-att");
            item.removeClass("scf-is-att-confirm-overlay-on");
        }
    });

    var CommentList = Backbone.Collection.extend({
        collectionName: "CommentList"
    });

    var Author = SCF.Model.extend({
        modelName: "AuthorModel"
    });

    var AuthorView = SCF.View.extend({
        viewName: "Author",
        tagName: "div",
        className: "author"
    });

    SCF.Comment = Comment;
    SCF.CommentSystem = CommentSystem;
    SCF.CommentView = CommentView;
    SCF.CommentSystemView = CommentSystemView;
    SCF.CommentList = CommentList;
    SCF.Author = Author;
    SCF.AuthorView = AuthorView;

    SCF.registerComponent('social/commons/components/hbs/comments/comment', SCF.Comment, SCF.CommentView);
    SCF.registerComponent('social/commons/components/hbs/comments', SCF.CommentSystem, SCF.CommentSystemView);

})($CQ, _, Backbone, SCF, Granite);

/*
 *
 * ADOBE CONFIDENTIAL
 * __________________
 *
 *  Copyright 2012 Adobe Systems Incorporated
 *  All Rights Reserved.
 *
 * NOTICE:  All information contained herein is, and remains
 * the property of Adobe Systems Incorporated and its suppliers,
 * if any.  The intellectual and technical concepts contained
 * herein are proprietary to Adobe Systems Incorporated and its
 * suppliers and are protected by trade secret or copyright law.
 * Dissemination of this information or reproduction of this material
 * is strictly forbidden unless prior written permission is obtained
 * from Adobe Systems Incorporated.
 */
// jscs:disable
(function($CQ, _, Backbone, SCF) {
    SCF.CommentSystemView.templates = SCF.CommentSystemView.templates || {};

    SCF.CommentSystemView.templates.ugcLimitDialog =
        '<div class="modal fade scf-comment-ugclimitdialog" tabindex="-1" role="dialog">' +
        '<div class="modal-dialog" role="document">' +
        '<div class="modal-content">' +
        '<div class="modal-header">' +
        '<button type="button" onclick="$CQ(\'.scf-comment-ugclimitdialog\').hide();$CQ(\'body\').removeClass(\'modal-open\');$CQ(\'.modal-backdrop.fade.in\').remove();" class="close scf-modal-close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>' +
        '<h2 class="modal-title scf-comment-ugclimitdialog-title">{{i18n "Content Notice"}}</h2>' +
        '</div>' +
        '<div class="modal-body">' +
        '<div class="clearfix"></div>' +
        '<p class="text-center scf-comment-ugclimitdialog-text">' +
        '</p>' +
        '</div>' +
        '<div class="modal-footer">' +
        '<button type="button" onclick="$CQ(\'.scf-comment-ugclimitdialog\').hide();$CQ(\'body\').removeClass(\'modal-open\');$CQ(\'.modal-backdrop.fade.in\').remove();" class="btn btn-primary" data-dismiss="modal">{{i18n "Close"}}</button>' +
        '</div>' +
        '</div><!-- /.modal-content -->' +
        '</div><!-- /.modal-dialog -->' +
        '</div><!-- /.modal -->';
})($CQ, _, Backbone, SCF);

/*
 *
 * ADOBE CONFIDENTIAL
 * __________________
 *
 *  Copyright 2016 Adobe Systems Incorporated
 *  All Rights Reserved.
 *
 * NOTICE:  All information contained herein is, and remains
 * the property of Adobe Systems Incorporated and its suppliers,
 * if any.  The intellectual and technical concepts contained
 * herein are proprietary to Adobe Systems Incorporated and its
 * suppliers and are protected by trade secret or copyright law.
 * Dissemination of this information or reproduction of this material
 * is strictly forbidden unless prior written permission is obtained
 * from Adobe Systems Incorporated.
 */
(function($CQ, _, Backbone, SCF) {
    "use strict";
    var windowHost = window.location.protocol + "//" + window.location.host;
    var ShareView = SCF.View.extend({
        afterRender: function() {
            var sub = this.model.get("subject");
            var messageBody = this.model.get("message");
            var removeHTMLTag = document.createElement("div");
            removeHTMLTag.innerHTML = messageBody;
            var bodyText = removeHTMLTag.innerText || "";
            var windowUrl = windowHost + this.model.get("friendlyUrl");
            var emailUrl = "mailto:?Subject=" + sub + "&Body=" + bodyText + " " + windowUrl + "";
            this.$el.find(".scf-js-email-share").attr("href", emailUrl);
        },
        share: function(evt) {
            var shareURL = $(evt.target).data("href");
            var locationUrl = shareURL + windowHost + this.model.get("friendlyUrl");
            window.open(locationUrl, '_BLANK');
        }
    });
    SCF.ShareView = ShareView;
    SCF.registerComponent('social/commons/components/hbs/socialshare', SCF.Model, SCF.ShareView);
})($CQ, _, Backbone, SCF);

/*
 *
 * ADOBE CONFIDENTIAL
 * __________________
 *
 *  Copyright 2012 Adobe Systems Incorporated
 *  All Rights Reserved.
 *
 * NOTICE:  All information contained herein is, and remains
 * the property of Adobe Systems Incorporated and its suppliers,
 * if any.  The intellectual and technical concepts contained
 * herein are proprietary to Adobe Systems Incorporated and its
 * suppliers and are protected by trade secret or copyright law.
 * Dissemination of this information or reproduction of this material
 * is strictly forbidden unless prior written permission is obtained
 * from Adobe Systems Incorporated.
 */
(function($CQ, _, Backbone, SCF) {
    "use strict";

    // analytics code
    window.CQ_Analytics = window.CQ_Analytics || {};
    var cqAnalytics = CQ_Analytics;

    var Forum = SCF.CommentSystem.extend({
        modelName: "ForumModel",
        relationships: {
            "items": {
                collection: "TopicList",
                model: "TopicModel"
            }
        },
        fixCachedProperties: function() {
            var userIsModerator = SCF.Session.checkIfModeratorFor(this.get("id"));
            this.loadClipboard(userIsModerator);
        },
        loadClipboard: function(userIsModerator) {
            var clipboard = localStorage.getItem(Topic.prototype.FORUM_CLIPBOARD);
            if (clipboard == null || _.isUndefined(clipboard)) {
                this.attributes.canPaste = false;
                return;
            }
            clipboard = JSON.parse(clipboard);
            this.attributes.canPaste = userIsModerator && clipboard.count > 0;
            this.attributes.pasteCount = clipboard.count;
        },
        clearClipboard: function() {
            localStorage.removeItem(Topic.prototype.FORUM_CLIPBOARD);
            this.attributes.canPaste = false;
            this.attributes.pasteCount = 0;
            this.trigger(this.events.UPDATED, {
                model: this
            });
        },
        createOperation: "social:createForumPost",
        events: {
            ADD: "topic:added",
            ADD_ERROR: "topic:adderror",
            UPDATED: "topic:updated"
        }
    });
    var ForumView = SCF.CommentSystemView.extend({
        viewName: "Forum",
        tagName: "div",
        className: "forum",
        FOLLOW_EVENT: "SCFFollow",
        VIEW_EVENT: "SCFView",
        COMMUNITY_FUNCTION: "Forum",
        init: function() {
            SCF.CommentSystemView.prototype.init.apply(this);
            this.listenTo(this.model, this.model.events.UPDATED, this.update);
            SCF.Router.route(/^(.*?)\.index\.(.*)\.(-?[0-9]*)\.([0-9])*\.htm.*?$/, "pageTopics");
        },
        render: function() {
            SCF.CommentSystemView.prototype.render.apply(this);

            if (cqAnalytics.Sitecatalyst) {
                if (_.contains(cqAnalytics.Sitecatalyst.frameworkComponents,
                        SCF.constants.ANALYTICS_BASE_RESOURCE_TYPE)) {
                    this.$el.find(".scf-js-analytics-view-metrics").show();
                }
            }
        },
        getOtherProperties: function() {
            var subject = this.getField("subject");
            return {
                "subject": subject
            };
        },
        PAGE_EVENT: "pageTopics",
        PAGE_URL_PREFIX: "topics",
        toggleComposer: function(e) {
            var composer = this.$el.find(".scf-js-composer-block");
            composer.toggleClass("scf-is-collapsed");
            this.$el.find(".scf-js-newtopic").toggleClass("scf-is-collapsed");
            if (composer.is(":visible")) {
                this.focus("subject");
                // In IE10 the RTE doesn't get cleared out when the composer opens it retains the
                // placeholder text.
                this.setField("message", "");
            } else {
                this.files = void 0;
                this.$el.find(".scf-attachment-list").first().empty();
            }
            // call proto:
            SCF.CommentSystemView.prototype.toggleComposer.apply(this, [e]);
        },
        paste: function() {
            SCF.log.debug("pasting");
            var clipBoard = localStorage.getItem("scf:forum:clipboard");
            if (_.isUndefined(clipBoard) || clipBoard == null || clipBoard.count <= 0) {
                // emit an error message
                SCF.log.error("There are no clipboard items to paste");
            } else {
                var parentPath = this.model.get("id");
                clipBoard = JSON.parse(clipBoard);
                _.each(clipBoard.itemsToMove, function(item) {
                    this.model.move({
                        "resourcePath": item.id,
                        "parentPath": parentPath
                    });
                }, this);
                this.model.clearClipboard();
            }
        },
        clearClipboard: function() {
            SCF.log.debug("clear board");
            this.model.clearClipboard();
        },
        initAnalytics: function() {
            SCF.Context.communityFunction = this.COMMUNITY_FUNCTION;
            SCF.Context.path = this.model.id;
            SCF.Context.type = this.model.get("resourceType");
            // checking if title (subject) exists - usually it does not at forum level
            SCF.Context.ugcTitle = this.model.get("subject") ? this.model.get("subject") : "";
            if (!_.isUndefined(window._satellite)) {
                window._satellite.track("communities-scf-view");
            } else if (cqAnalytics.Sitecatalyst) {
                /*
                 * Suppress the next Analytics tracking call so that the default page call and this call
                 * don't result in a double call.
                 */
                window.s.abort = true;

                cqAnalytics.record({
                    event: this.VIEW_EVENT,
                    values: {
                        "functionType": SCF.Context.communityFunction ?
                            SCF.Context.communityFunction : this.COMMUNITY_FUNCTION,
                        "path": SCF.Context.path ? SCF.Context.path : this.model.get("id"),
                        "type": SCF.Context.type ? SCF.Context.type : this.model.get("resourceType"),
                        "ugcTitle": SCF.Context.ugcTitle,
                        "siteTitle": SCF.Context.siteTitle ?
                            SCF.Context.siteTitle : $(".scf-js-site-title").text(),
                        "sitePath": SCF.Context.sitePath ? SCF.Context.sitePath : this.sitePath,
                        "groupTitle": SCF.Context.groupTitle,
                        "groupPath": SCF.Context.groupPath,
                        "user": SCF.Context.user ? SCF.Context.user : SCF.Session.get("authorizableId")
                    },
                    collect: false,
                    componentPath: SCF.constants.ANALYTICS_BASE_RESOURCE_TYPE
                });
            }
        }
    });

    var Post = SCF.Comment.extend({
        modelName: "PostModel",
        DELETE_OPERATION: "social:deleteForumPost",
        UPDATE_OPERATION: "social:updateForumPost",
        CREATE_OPERATION: "social:createForumPost",
        events: {
            ADDED: "post:added",
            UPDATED: "post:updated",
            DELETED: "post:deleted",
            ADD_ERROR: "post:addError",
            UPDATE_ERROR: "post:updateError",
            DELETE_ERROR: "post:deleteError",
            TRANSLATED: "post:translated",
            TRANSLATE_ERROR: "post:translateError"
        },
        relationships: {
            "items": {
                collection: "PostList",
                model: "PostModel"
            },
            "votes": {
                model: "VotingModel"
            }
        },
        fixCachedProperties: function() {
            if (!SCF.Session.attributes.loggedIn) {
                this.attributes.canReply = false;
            }
        }
    });
    var PostView = SCF.CommentView.extend({
        viewName: "Post",
        tagName: "li",
        className: "post",
        requiresSession: true
    });

    var Topic = SCF.Comment.extend({
        modelName: "TopicModel",
        DELETE_OPERATION: "social:deleteForumPost",
        UPDATE_OPERATION: "social:updateForumPost",
        CREATE_OPERATION: "social:createForumPost",
        FORUM_CLIPBOARD: "scf:forum:clipboard",
        events: {
            ADDED: "post:added",
            UPDATED: "topic:updated",
            DELETED: "topic:deleted",
            ADD_ERROR: "post:addError",
            UPDATE_ERROR: "topic:updateError",
            DELETE_ERROR: "topic:deleteError",
            TRANSLATED: "topic:translated",
            TRANSLATE_ERROR: "topic:translateError"
        },
        relationships: {
            "items": {
                collection: "TopicList",
                model: "TopicModel"
            },
            "votes": {
                model: "VotingModel"
            }
        },
        addToClipBoard: function() {
            if (typeof Storage == "undefined") {
                SCF.log.error("Unable to move topic, please use a supported browser");
            }
            var clipBoard = localStorage.getItem(this.FORUM_CLIPBOARD);
            if (_.isUndefined(clipBoard) || clipBoard == null) {
                clipBoard = {
                    count: 0,
                    itemsToMove: {}
                };
            } else {
                clipBoard = JSON.parse(clipBoard);
            }
            var item = {
                id: this.id,
                title: this.get("title"),
                url: this.get("friendlyURL")
            };
            clipBoard.itemsToMove[this.id] = item;
            clipBoard.count++;
            this.attributes.hasBeenCut = true;
            localStorage.setItem(this.FORUM_CLIPBOARD, JSON.stringify(clipBoard));
            this.trigger(this.events.UPDATED, {
                model: this
            });
        },
        removeFromClipboard: function() {
            if (typeof Storage == "undefined") {
                SCF.log.error("Unable to move topic, please use a supported browser");
            }
            var clipBoard = localStorage.getItem(this.FORUM_CLIPBOARD);
            clipBoard = JSON.parse(clipBoard);
            clipBoard.count--;
            clipBoard.itemsToMove[this.id] = undefined;
            this.attributes.hasBeenCut = false;
            localStorage.setItem(this.FORUM_CLIPBOARD, JSON.stringify(clipBoard));
            this.trigger(this.events.UPDATED, {
                model: this
            });
        },
        getCustomProperties: function() {
            if (this.get("subject") !== undefined) {
                return {
                    subject: this.get("subject")
                };
            } else {
                return {};
            }
        },
        fixCachedProperties: function(userIsModerator) {
            this.attributes.canReply = SCF.Session.attributes.loggedIn && SCF.Session.attributes.mayReply &&
                !this.attributes.isClosed;
            this.attributes.moderatorActions.canMove = userIsModerator && !this.attributes.isClosed &&
                this.attributes.topLevel && this.attributes.configuration.moveAllowed;
            var hasBeenCut = this.hasBeenCut();
            this.attributes.hasBeenCut = hasBeenCut;
        },
        hasBeenCut: function() {
            var clipboard = localStorage.getItem(this.FORUM_CLIPBOARD);
            if (clipboard == null || _.isUndefined(clipboard)) {
                return false;
            }
            clipboard = JSON.parse(clipboard);
            var item = clipboard.itemsToMove[this.id];
            if (_.isUndefined(item)) {
                return false;
            } else {
                return true;
            }
        },
        translateAll: function(e) {
            SCF.CommentSystem.prototype.translateAll.call(this, e);
        }
    });

    var TopicView = SCF.CommentView.extend({
        viewName: "Topic",
        tagName: "li",
        className: "topic",
        requiresSession: true,
        FOLLOW_EVENT: "SCFFollow",
        VIEW_EVENT: "SCFView",
        COMMUNITY_FUNCTION: "Forum",

        init: function() {
            SCF.CommentView.prototype.init.apply(this);
            SCF.Router.route(/^(.*?)topic\.([0-9]*)\.(-?[0-9]*)\.htm.*?$/, "pagePosts");
            SCF.Router.route(/^(.*?)topic\.index\.(.*)\.(-?[0-9]*)\.([0-9])*\.htm.*?$/, "pagePosts");
            this.listenTo(SCF.Router, "route:pagePosts", this.paginate);
        },

        initAnalytics: function() {
            SCF.Context.communityFunction = this.COMMUNITY_FUNCTION;
            SCF.Context.path = this.model.id;
            SCF.Context.type = this.model.get("resourceType");
            // checking if title (subject) exists - unlike forum it often does at topic level
            SCF.Context.ugcTitle = this.model.get("subject") ? this.model.get("subject") : "";
            if (!_.isUndefined(window._satellite)) {
                window._satellite.track("communities-scf-view");
            } else if (cqAnalytics.Sitecatalyst) {
                /*
                 * Suppress the next Analytics tracking call so that the default page call and this call
                 * don't result in a double call.
                 */
                window.s.abort = true;

                cqAnalytics.record({
                    event: this.VIEW_EVENT,
                    values: {
                        "functionType": SCF.Context.communityFunction ?
                            SCF.Context.communityFunction : this.COMMUNITY_FUNCTION,
                        "path": SCF.Context.path ? SCF.Context.path : this.model.get("id"),
                        "type": SCF.Context.type ? SCF.Context.type : this.model.get("resourceType"),
                        "ugcTitle": SCF.Context.ugcTitle,
                        "siteTitle": SCF.Context.siteTitle ?
                            SCF.Context.siteTitle : $(".scf-js-site-title").text(),
                        "sitePath": SCF.Context.sitePath ? SCF.Context.sitePath : this.sitePath,
                        "groupTitle": SCF.Context.groupTitle,
                        "groupPath": SCF.Context.groupPath,
                        "user": SCF.Context.user ? SCF.Context.user : SCF.Session.get("authorizableId")
                    },
                    collect: false,
                    componentPath: SCF.constants.ANALYTICS_BASE_RESOURCE_TYPE
                });
            }
        },

        afterRender: function() {
            SCF.CommentView.prototype.afterRender.apply(this);
            this.updateCrumbs();
            if (window.location.href.indexOf("filter=page") > 0) {
                var ugcId = window.location.href.split("filter=page+has+")[1];
                if (ugcId == null) {
                    ugcId = window.location.href.split("filter=page%20has%20")[1];
                }
                var komment = null;
                var yCord = null;
                if (ugcId.indexOf("/") > 0) {
                    ugcId = ugcId.substring(0, ugcId.indexOf("/"));
                    komment = ($("li[data-component-id$=" + ugcId + "]"))
                        .find(".scf-comment-data")[0];
                    yCord = ($(komment)).offset().top - 50;
                    var loadMore = $(komment).find(".scf-load-more");
                    $("html, body").animate({scrollTop: yCord}, 1000, "linear").promise()
                        .then(function() {
                            $(loadMore).effect("highlight", {}, 5000);
                        });

                } else {
                    komment = ($("li[data-component-id$=" + ugcId + "]"))
                        .find(".scf-comment-data")[0];
                    yCord = ($(komment)).offset().top - 50;
                    $("html, body").animate({scrollTop: yCord}, 1000, "linear").promise()
                        .then(function() {
                            $(komment).effect("highlight", {}, 5000);
                        });
                }
            }
        },

        updateCrumbs: function() {
            if (this.$el.attr("data-scf-template")) {
                return;
            }
            var crumbs = [];
            crumbs.push({
                "title": CQ.I18n.get("Forum"),
                "url": this.model.get("pageInfo").basePageURL + ".html"
            });
            crumbs.push({
                "title": this.model.get("subject"),
                "url": "",
                "active": true
            });
            SCF.Util.announce("crumbs", {
                "crumbs": crumbs
            });
        },
        paginate: function() {
            var baseURL = SCF.config.urlRoot + this.model.get("id") + SCF.constants.SOCIAL_SELECTOR + ".";
            var parsedOffset = arguments[1];
            var parsedSize = arguments[2];
            var parsedIndexName = (arguments.length <= 3) ? null : arguments[3];
            var url;
            if (arguments.length <= 3) {
                // There must not be an index requested.
                url = baseURL + parsedOffset + "." + parsedSize + SCF.constants.JSON_EXT;
            } else {
                // Must be an index:
                url = baseURL + "index." + parsedOffset + "." + parsedSize + "." + parsedIndexName +
                    SCF.constants.JSON_EXT;
            }
            this.model.url = url;
            this.model.reload();
        },
        navigate: function(e) {
            var windowHost = window.location.protocol + "//" + window.location.host;
            var suffix = $CQ(e.currentTarget).data("page-suffix");
            var pageInfo = this.model.get("pageInfo");
            var pathFromURL = window.location.pathname;
            if ((windowHost + Granite.HTTP.getContextPath()).indexOf(SCF.config.urlRoot) != -1) {
                var truncatedId = this.model.get("id");
                truncatedId = truncatedId.substring(truncatedId.lastIndexOf("/"));
                var baseCommentPage = pageInfo.basePageURL + ".topic.html" + truncatedId + ".html" ;
                if ((baseCommentPage == pathFromURL) && (window.location.href.indexOf("filter=page") < 0)) {
                    var currentPage = pageInfo.basePageURL + ".topic." + pageInfo.previousSuffix +
                    ".html" + truncatedId;
                    SCF.Router.navigate(currentPage, {
                        trigger: false
                    });
                }
                var pageToGoTo = pageInfo.basePageURL + ".topic." + suffix + ".html" + truncatedId;
                SCF.Router.navigate(pageToGoTo, {
                    trigger: true
                });
            } else {
                suffix = $(e.currentTarget).data("pageSuffix");
                var suffixInfo = suffix.split(".");
                if (pageInfo.sortIndex !== null) {
                    this.paginate(pageInfo.basePageURL, suffixInfo[0], suffixInfo[1], pageInfo.sortIndex);
                } else {
                    this.paginate(pageInfo.basePageURL, suffixInfo[0], suffixInfo[1]);
                }
            }
        },
        edittranslation: function(e) {
            SCF.CommentView.prototype.edittranslation.call(this, e);
            this.$el.find(".scf-js-topic-details").hide();
            var subject = this.model.get("translationTitle");
            this.setField("editSubject", subject);
            this.focus("editSubject");
        },
        edit: function(e) {
            SCF.CommentView.prototype.edit.call(this, e);
            this.$el.find(".scf-js-topic-details").hide();
            var subject = this.model.get("subject");
            this.setField("editSubject", subject);
            this.focus("editSubject");
        },
        cancel: function(e) {
            SCF.CommentView.prototype.cancel.call(this, e);
            this.$el.find(".scf-js-topic-details").show();
        },
        cut: function(e) {
            SCF.log.debug("cutting " + this.model.get("id"));
            this.model.addToClipBoard();
        },
        putBack: function(e) {
            SCF.log.debug("putting back " + this.model.get("id"));
            this.model.removeFromClipboard();
        },
        getOtherProperties: function() {
            var subject = this.getField("editSubject");
            return {
                "subject": subject
            };
        },
        toggleComposerCollapse: function(e) {
            $(e.currentTarget).closest(".scf-js-composer-block").toggleClass("scf-is-collapsed");
            this.focus("replyMessage");
            // In IE10 the RTE doesn't get cleared out when the composer opens it retains the
            // placeholder text.
            this.setField("replyMessage", "");
        },
        translateAll: function() {
            this.model.translateAll();
        }
    });

    var TopicList = Backbone.Collection.extend({
        collectionName: "TopicList"
    });
    var PostList = Backbone.Collection.extend({
        collectionName: "PostList"
    });

    SCF.Post = Post;
    SCF.Topic = Topic;
    SCF.Forum = Forum;
    SCF.TopicView = TopicView;
    SCF.PostView = PostView;
    SCF.ForumView = ForumView;
    SCF.TopicList = TopicList;
    SCF.PostList = PostList;
    SCF.registerComponent("social/forum/components/hbs/post", SCF.Post, SCF.PostView);
    SCF.registerComponent("social/forum/components/hbs/topic", SCF.Topic, SCF.TopicView);
    SCF.registerComponent("social/forum/components/hbs/forum", SCF.Forum, SCF.ForumView);
})($CQ, _, Backbone, SCF);

/*
 *
 * ADOBE CONFIDENTIAL
 * __________________
 *
 *  Copyright 2012 Adobe Systems Incorporated
 *  All Rights Reserved.
 *
 * NOTICE:  All information contained herein is, and remains
 * the property of Adobe Systems Incorporated and its suppliers,
 * if any.  The intellectual and technical concepts contained
 * herein are proprietary to Adobe Systems Incorporated and its
 * suppliers and are protected by trade secret or copyright law.
 * Dissemination of this information or reproduction of this material
 * is strictly forbidden unless prior written permission is obtained
 * from Adobe Systems Incorporated.
 */
(function($CQ, _, Backbone, SCF) {
    "use strict";
    var Journal = SCF.Forum.extend({
        modelName: "JournalModel",
        relationships: {
            "items": {
                collection: "BlogTopicList",
                model: "BlogTopicModel"
            }
        },
        createOperation: "social:createJournalComment",
        events: {
            ADD: "blogtopic:added",
            UPDATED: "topic:updated",
            ADD_ERROR: "blogtopic:adderror"
        },
        shouldCommentBeAddedToList: function(topic) {
            var listType = this.view.listTypes.PUBLISHED;
            var topicType = this.view.listTypes.PUBLISHED;
            var topicDraft = false;
            if (topic) {
                if (topic.get("draft")) {
                    topicDraft = topic.get("draft");
                    if (topicDraft) {
                        var topicPublishDate = topic.get("publishDate");
                        if (topicPublishDate) {
                            var publishDate = new Date(topicPublishDate);
                            if (publishDate > new Date()) {
                                topicType = this.view.listTypes.SCHEDULED_LATER;
                            } else {
                                topicType = this.view.listTypes.DRAFTS;
                            }
                        } else {
                            topicType = this.view.listTypes.DRAFTS;
                        }
                    }
                }
            }
            var nextPageUrl = this.get("pageInfo").nextPageURL;
            if (typeof nextPageUrl == "string" && nextPageUrl.indexOf("filter") > -1) {
                if (nextPageUrl.indexOf(this.view.filterURLParam.SCHEDULED_LATER_URL_FILTER) > 0
                       || nextPageUrl.indexOf(this.view.filterURLParam.SCHEDULED_LATER_URL_FILTER_CHECK) > 0) {
                    listType = this.view.listTypes.SCHEDULED_LATER;
                } else {
                    listType = this.view.listTypes.DRAFTS;
                }
            }
            if (topicType == listType) {
                return true;
            } else {
//                if (!topicDraft) {
                    this.trigger(this.events.ADD, {
                        model: this,
                        newItem: topic
                    });
//                }
                return false;

            }
        }
    });
    var JournalView = SCF.ForumView.extend({
        viewName: "Journal",
        COMMUNITY_FUNCTION: "Blog",
        eventBinded: false,
        filterURLParam: {
            DRAFT_URL_FILTER: "?filter=isDraft%20eq%20%27true%27&filter=publishDate%20eq%20null",
            SCHEDULED_LATER_URL_FILTER: "?filter=isDraft%20eq%20%27true%27&filter=publishDate%20ne%20null",
            SCHEDULED_LATER_URL_FILTER_CHECK: "?filter=isDraft+eq+%27true%27&filter=publishDate+ne+null"
        },
        listTypes: {
            PUBLISHED: "published",
            SCHEDULED_LATER: "scheduledLater",
            DRAFTS: "drafts"
        },
        PAGE_EVENT: "pageBlogArticles",
        afterRender: function() {
            SCF.ForumView.prototype.afterRender.apply(this);
            if (this.pageUrlSortHasFilterParams()) {
                this.renderWithTemplate(true);
            }
        },
        init: function() {
            SCF.ForumView.prototype.init.apply(this);
            var resourceType = this.model.get("resourceType");
            var templateName = "journallists";
            this.listenTo(this.model, 'change:composedForValid', this.composedForChanged);
            this.listTemplateC = SCF.findTemplate(this.model.id, templateName, resourceType);
            SCF.Router.route(/^(.*?)\.([0-9]*)\.(-?[0-9]*)\.htm.*?$/, this.PAGE_EVENT);
        },
        getUrl: function() {
            var modelUrl = this.model.url;
            if (typeof modelUrl == "string") {
                return modelUrl;
            } else if(window.location.search) {
                var retUrl = this.model.url() || this.model.get("url");
                return retUrl + window.location.search;
            } else {
                var retUrl = this.model.url();
                return retUrl ? retUrl : this.model.get("url");
            }

        },
        composedForChanged: function() {
            // Flag in model changed to indicate that a chosen username to "Compose om behalf of a user is invalid.
            if (this.model.get("composedForValid")) {
                this.$el.find(".scf-js-userfilter").removeClass("scf-error");
                this.$el.find(".scf-js-invalid-user").addClass("scf-is-hidden").removeClass("scf-js-error-message");
                this.$el.find(".scf-js-publish-btn").prop("disabled", false);
            } else {
                this.$el.find(".scf-js-userfilter").addClass("scf-error");
                this.$el.find(".scf-js-invalid-user").addClass("scf-js-error-message").removeClass("scf-is-hidden");
                this.$el.find(".scf-js-publish-btn").prop("disabled", true);
            }
        },
        update: function(eventListenerData) {
            if (eventListenerData && eventListenerData.newItem) {
                var newItem = eventListenerData.newItem;
//                if (!newItem.get("draft")) {
                    SCF.ForumView.prototype.update.apply(this);
//                }
            }
        },
        activateTabs: function(activeTabSelector, tabId) {
            this.$el.find(activeTabSelector).parent().addClass("active");
            this.$el.find(tabId).addClass("active");
        },
        pageUrlSortHasFilterParams: function() {
            //This function is used to highlight draft tabs when a user visits
            // the drafts link directly
            var windowURL = this.model.get("pageInfo");
            windowURL = windowURL ? windowURL["nextPageURL"] : "";
            var windowURL_FilterParams = CQ.shared.HTTP.getParameters(windowURL, "filter");
            var that = this;
            var hasSortParam = function() {
                return _.contains(windowURL_FilterParams, "filter=isDraft%20ne%20true") ||
                    _.contains(windowURL_FilterParams, "isDraft+ne+true");
            }
            if (windowURL_FilterParams && windowURL_FilterParams.length > 0 && !hasSortParam()) {
                return true;
            }
            return false;
        },
        renderWithTemplate: function(ignoreAfterRender) {
            //this.template = this.listTemplateC;
            var modelUrl = this.getUrl();
            this.$el.find(".tab-pane").empty();
            var element = $CQ(this.listTemplateC(this.getContextForTemplate(), {
                data: {
                    parentView: this
                }
            }));
            var isDraft = false;
            if (!_.isNull(this.model.url) && modelUrl.indexOf(this.filterURLParam.SCHEDULED_LATER_URL_FILTER) >
                0) {
                this.$el.find("#scf-js-laterPosts").empty().append(element);
            } else {
                this.$el.find("#scf-js-draftPosts").empty().append(element);
                isDraft = true;
            }
            var that = this;
            _.each(this._childViews, function(child) {
                that.renderChildView(child);
            });

            var finishRendering = _.bind(function() {
                this.bindView();
                this._rendered = true;
                if (this.afterRender && !ignoreAfterRender) {
                    this.afterRender();
                }
                this.trigger("view:rendered", {
                    view: this
                });

            }, this);
            //wait for children to finish rendering and then complete binding the view
            $CQ.when(this._renderedChildren).done(finishRendering);
            this.$el.find("li.scf-journal-tab").removeClass("active");
            this.$el.find(".tab-pane").removeClass("active");
            if (isDraft) {
                this.activateTabs(".scf-js-draftPosts", "#scf-js-draftPosts");
            } else {
                this.activateTabs(".scf-js-laterPosts", "#scf-js-laterPosts");
            }
            return this;
        },
        toggleComposer: function(e) {
            //Toggle Pagination Block
            //Toggle Items
            this.$el.find(".scf-js-journal-tab").toggleClass("scf-is-hidden");
            this.$el.find(".scf-topic-list").toggleClass("scf-is-hidden");
            this.$el.find(".scf-pages").toggleClass("scf-is-hidden");
            var composer = this.$el.find(".scf-js-composer-block");
            if (composer.hasClass("scf-is-collapsed")) {
                this.eventBinded = false;
            }
            //Bind datepicker and time autocomplete
            if (!this.eventBinded) {
                this.bindDatePicker(e);
                this.eventBinded = true;
            }
            //Resize CKEditor
            SCF.ForumView.prototype.toggleComposer.apply(this, [e]);
        },
        bindDatePicker: function(e) {
            var addOptions = function(element, minOptionValue, maxOptionValue) {
                if (element.has('option').length <= 0) {
                    var that = this;
                    $CQ.each(_.range(minOptionValue, maxOptionValue), function(key, value) {
                        value = value < 10 ? ("0" + value) : value;
                        value = CQ.I18n.get(value);
                        element.append($("<option/>", {
                            value: value,
                            text: value
                        }));
                    });
                }
            };


            // bind drop down button group
            this.$el.find(".scf-js-pubish-type .dropdown-menu li a").click(function() {
                $(".scf-js-pubish-type .btn:first-child").html(
                    '<span id="button_label">' + $(this).text() +
                    '</span> <span class="caret"></span>');
                $(".scf-js-pubish-type .btn:first-child").val($(this).text());
            });

            // bind date picker
            this.$el.find(".scf-js-event-basics-start-input").datepicker({
                changeMonth: true,
                numberOfMonths: 2,
                setDate: "0",
                beforeShow: function(input, inst) {
                    $('#ui-datepicker-div').wrap(
                        "<div class='scf-datepicker'></div>");
                },
                onClose: function(selectedDate) {
                    $CQ(".scf-event-basics-start-input").datepicker("option", "minDate",
                        selectedDate);
                }
            }).datepicker("setDate", new Date());

            //add options to hour and minute time picker to keep markup simple
            addOptions(this.$el.find(".scf-js-event-basics-start-hour"), 1, 13);
            addOptions(this.$el.find(".scf-js-event-basics-start-min"), 0, 60);

            //set default date
            convertDateTo12HoursDisplay(new Date(), this);
        },
        showDraftOption: function(e) {
            this.$el.find(".scf-js-publish-time-input").addClass("scf-is-hidden");
            this.$el.find(".scf-js-save-draft-btn").show();
            this.$el.find(".scf-js-publish-btn").hide();
        },
        showPublishOption: function(e) {
            this.$el.find(".scf-js-publish-time-input").removeClass("scf-is-hidden");
            this.$el.find(".scf-js-save-draft-btn").hide();
            this.$el.find(".scf-js-publish-btn").show();
        },
        showImmediatelyOption: function(e) {
            this.$el.find(".scf-js-publish-time-input").addClass("scf-is-hidden");
            this.$el.find(".scf-js-save-draft-btn").hide();
            this.$el.find(".scf-js-publish-btn").show();
        },
        getOtherProperties: function() {
            var subject = this.getField('subject').trim();
            var publishMode = $(this.$el.find(".scf-js-pubish-type > button > span")).text();
            var draftMode = false;
            var publishDate = null;
            var isScheduled = false;
            if (!_.isEmpty(publishMode) && publishMode == $(this.$el.find(
                    ".scf-js-pubish-type > ul > li > a")[1])
                .text()) {
                draftMode = true;
            } else if (!_.isEmpty(publishMode) && publishMode == $(this.$el.find(
                    ".scf-js-pubish-type > ul > li > a")[2]).text()) {
                draftMode = true;
                isScheduled = true;
                publishDate = getDateTime(this.$el.find(".scf-js-event-basics-start-input").val(),
                    this.$el.find(".scf-js-event-basics-start-hour").val(), this.$el.find(
                        ".scf-js-event-basics-start-min").val(), this.$el.find(".scf-js-event-basics-start-time-ampm").val());
            }
            var props = {
                'subject': subject,
                'isDraft': draftMode
            };
            if (isScheduled) {
                props["isScheduled"] = true;
                props["publishDate"] = publishDate;
            }
            if (this.model.getConfigValue("usingPrivilegedUsers")) {
                var composedFor = this.getField("composedFor");
                if (!_.isEmpty(composedFor)) {
                    props.composedFor = composedFor;
                }
            }
            this.eventBinded = false;
            return props;
        },
        fetchDrafts: function() {
            $(".scf-js-draftPosts").off("click");
            this.switchView(this.filterURLParam.DRAFT_URL_FILTER, ".scf-js-draftPosts",
                "#scf-js-draftPosts");
        },
        fetchLaterPosts: function() {
            $(".scf-js-laterPosts").off("click");
            this.switchView(this.filterURLParam.SCHEDULED_LATER_URL_FILTER,
                ".scf-js-laterPosts",
                "#scf-js-laterPosts");
        },
        fetchAllPosts: function() {
            $(".scf-js-allPosts").off("click");
            this.switchView("", ".scf-js-allPosts", "#scf-js-allPosts");
        },
        switchView: function(filter, activeTabSelector, tabId) {
            this.model.url = this.model.id + SCF.constants.URL_EXT + filter;
            var that = this;
            SCF.log.debug("switchView:" + this.model.url);
            var pageInfo = this.model.get("pageInfo");
            var basePageURL = pageInfo.basePageURL;
            var pageToGoTo = basePageURL + ".html" + filter;
            this.model.reload({
                success: function() {
                    that.activateTabs(activeTabSelector, tabId);
                    SCF.Router.navigate(pageToGoTo, {
                        trigger: true,
                        replace: true
                    });
                },
                error: function() {
                    SCF.log.error("Error reloading model");
                }
            });
        }
    });

    var getDateTime = function(date, hours, minutes, ampm) {
        if (!date || !hours || !minutes) {
            return undefined;
        }
        try {
            if (ampm === "PM" && hours !== "12") {
                hours = parseInt(hours);
                hours = hours + 12;
            }
            // 12:00 ~ 12:59 AM
            else if (ampm === "AM" && hours === "12") {
                hours = 0;
            }
            var time = ((parseInt(hours) * 60) + parseInt(minutes)) * 60000;
            var dateObj = Date.parse(date) + time;
            return (new Date(dateObj).toISOString());
        } catch (e) {
            return NaN;
        }
    };

    var convertDateTo12HoursDisplay = function(date, that) {
        var hours = date.getHours();
        var minutes = date.getMinutes();
        that.$el.find(".scf-js-event-basics-start-input").datepicker("setDate", date);
        var ampm = hours >= 12 ? "PM" : "AM";
        hours = hours > 12 ? hours - 12 : hours;
        hours = hours < 10 ? ("0" + hours) : hours;
        minutes = minutes < 10 ? ("0" + minutes) : minutes;
        hours = hours.toString();
        if (hours === "00") hours = "12"; // 12:00 ~ 12:59 AM
        minutes = minutes.toString();
        that.$el.find(".scf-js-event-basics-start-hour").val(hours);
        that.$el.find(".scf-js-event-basics-start-min").val(minutes);
        that.$el.find(".scf-js-event-basics-start-time-ampm").val(ampm);
    }

    var BlogPost = SCF.Post.extend({
        modelName: "BlogPostModel",
        DELETE_OPERATION: "social:deleteJournalComment",
        UPDATE_OPERATION: "social:updateJournalComment",
        CREATE_OPERATION: "social:createJournalComment",
        relationships: {
            "items": {
                collection: "BlogPostList",
                model: "BlogPostModel"
            },
            "votes": {
                model: "VotingModel"
            }
        }
    });

    var BlogPostView = SCF.PostView.extend({
        viewName: "BlogPost"
    });

    var BlogTopic = SCF.Topic.extend({
        modelName: "BlogTopicModel",
        DELETE_OPERATION: "social:deleteJournalComment",
        UPDATE_OPERATION: "social:updateJournalComment",
        CREATE_OPERATION: "social:createJournalComment",
        relationships: {
            "items": {
                collection: "BlogTopicList",
                model: "BlogTopicModel"
            },
            "votes": {
                model: "VotingModel"
            }
        },
        getCustomProperties: function() {
            var customData = {
                subject: this.get("subject")
            };
            if (this.has("isDraft")) {
                customData.isDraft = this.get("isDraft");
                var publishDate = this.get("publishDate");
                if (!_.isEmpty(publishDate)) {
                    customData.publishDate = publishDate;
                    customData.isScheduled = true;
                }
            }
            if (this.getConfigValue("usingPrivilegedUsers")) {
                var composedFor = this.get("composedFor");
                if (!_.isEmpty(composedFor)) {
                    customData.composedFor = composedFor;
                }
            }

            return customData;
        }
    });

    var BlogTopicView = SCF.TopicView.extend({
        viewName: "BlogTopic",
        COMMUNITY_FUNCTION: "Blog",
        eventBinded: false,
        bindDatePicker: JournalView.prototype.bindDatePicker,
        showImmediatelyOption: JournalView.prototype.showImmediatelyOption,
        showPublishOption: JournalView.prototype.showPublishOption,
        showDraftOption: JournalView.prototype.showDraftOption,
        draftUrl: JournalView.prototype.filterURLParam.DRAFT_URL_FILTER,
        init: function() {
            SCF.TopicView.prototype.init.call(this);
            this.listenTo(this.model, this.model.events.DELETED, this.navigateCancel);
            this.listenTo(this.model, this.model.events.UPDATED, this.saveDraftHandler);
        },
        edit: function(e) {
            this.$el.find(".scf-js-journal-comment-section").toggleClass("scf-is-hidden");
            SCF.TopicView.prototype.edit.call(this, e);
            this.$el.find(".scf-js-topic-details").hide();
            this.$el.find(".scf-js-topic-details-tags-editable").show();
            this.$el.find(".scf-comment-toolbar .scf-comment-edit").hide();

            var subject = this.model.get('subject');
            this.setField("editSubject", subject);
            this.focus("editSubject");
            if (!this.eventBinded) {
                this.bindDatePicker(e);
                this.eventBinded = true;
            }
        },
        afterRender: function() {
            SCF.TopicView.prototype.afterRender.call(this);
            if (!this.eventBinded) {
                this.bindDatePicker();
                this.eventBinded = true;
            }

            // set publish options
            var dropDownButton = this.$el.find(".scf-js-pubish-type > button > span")[0];
            // return if dropdown is not visible
            if (dropDownButton === undefined) return;

            var isDraft = false;
            if (this.model.get("properties") && this.model.get("properties").isDraft) {
                isDraft = this.model.get("properties").isDraft;
            }
            var publishDate;
            if (this.model.get("publishDate")) {
                publishDate = this.model.get("publishDate");
            }
            if (isDraft && publishDate != null) {
                $(dropDownButton).text(CQ.I18n.getMessage("At scheduled date and time"));
                var date = new Date(publishDate);
                convertDateTo12HoursDisplay(date, this);
                this.showPublishOption();
            } else if (isDraft) {
                $(dropDownButton).text(CQ.I18n.getMessage("Draft"));
                this.showDraftOption();
            }
        },
        saveDraftHandler: function(e) {
            if (e.model.get("draft")) {
                window.location.href = this.model.get("pageInfo").basePageURL +
                ".html" + this.draftUrl;
            }
        },
        navigateCancel: function(e) {
            window.location.href = this.model.get("pageInfo").basePageURL + ".html";
        },
        cancel: function(e) {
            this.$el.find(".scf-js-journal-comment-section").toggleClass("scf-is-hidden");
            SCF.TopicView.prototype.cancel.call(this, e);
            this.$el.find(".scf-js-topic-details").show();
            this.$el.find(".scf-js-topic-details-tags-editable").hide();
            this.$el.find(".scf-comment-toolbar .scf-comment-edit").show();
        },
        getOtherProperties: function(isReply) {
            var subject = this.getField("editSubject").trim();
            var tags = this.getField("editTags");
            var props = {
                'tags': tags
            };
            if (!isReply) {
                props["subject"] = subject;
            }
            var publishMode = $(this.$el.find(".scf-js-pubish-type > button > span")).text();
            var publishDate = null;
            if (!_.isEmpty(publishMode) && publishMode == $(this.$el.find(
                    ".scf-js-pubish-type > ul > li > a")[1])
                .text()) {
                props.isDraft = true;
            } else if (!_.isEmpty(publishMode) && publishMode == $(this.$el.find(
                    ".scf-js-pubish-type > ul > li > a")[2]).text()) {
                props.isDraft = true;
                props.isScheduled = true;
                props.publishDate = getDateTime(this.$el.find(
                        ".scf-js-event-basics-start-input").val(),
                    this.$el.find(".scf-js-event-basics-start-hour").val(), this.$el.find(
                        ".scf-js-event-basics-start-min").val(), this.$el.find(".scf-js-event-basics-start-time-ampm").val());
            } else {
                props.isDraft = false;
            }
            if (this.model.getConfigValue("usingPrivilegedUsers")) {
                var composedFor = this.getField("composedFor");
                if (!_.isEmpty(composedFor)) {
                    props.composedFor = composedFor;
                }
            }
            this.eventBinded = false;
            return props;
        },
        deleteArticle: function(e) {
            e.stopPropagation();
            this.unbindDataFields();
            this.model.remove();
            //window.location.href = this.model.get("pageInfo").basePageURL  + ".html";
        },
        toggleComposerCollapse: function(e) {
            $(e.target.closest(".scf-js-composer-block")).toggleClass("scf-is-collapsed");
            this.focus("replyMessage");
        }
    });

    var BlogTopicList = Backbone.Collection.extend({
        collectionName: "BlogTopicList"
    });
    var BlogPostList = Backbone.Collection.extend({
        collectionName: "BlogPostList"
    });

    SCF.BlogPost = BlogPost;
    SCF.BlogTopic = BlogTopic;
    SCF.Journal = Journal;
    SCF.BlogTopicView = BlogTopicView;
    SCF.BlogPostView = BlogPostView;
    SCF.JournalView = JournalView;
    SCF.BlogTopicList = BlogTopicList;
    SCF.BlogPostList = BlogPostList;
    SCF.registerComponent('social/journal/components/hbs/comment', SCF.BlogPost, SCF.BlogPostView);
    SCF.registerComponent('social/journal/components/hbs/entry_topic', SCF.BlogTopic, SCF.BlogTopicView);
    SCF.registerComponent('social/journal/components/hbs/journal', SCF.Journal, SCF.JournalView);
})($CQ, _, Backbone, SCF);

/*
 *
 * ADOBE CONFIDENTIAL
 * __________________
 *
 *  Copyright 2012 Adobe Systems Incorporated
 *  All Rights Reserved.
 *
 * NOTICE:  All information contained herein is, and remains
 * the property of Adobe Systems Incorporated and its suppliers,
 * if any.  The intellectual and technical concepts contained
 * herein are proprietary to Adobe Systems Incorporated and its
 * suppliers and are protected by trade secret or copyright law.
 * Dissemination of this information or reproduction of this material
 * is strictly forbidden unless prior written permission is obtained
 * from Adobe Systems Incorporated.
 */
(function($CQ, _, Backbone, SCF) {
    "use strict";
    var Ideation = SCF.Journal.extend({
        modelName: "IdeationModel",
        relationships: {
            "items": {
                collection: "IdeaList",
                model: "IdeationTopicModel"
            }
        },
        createOperation: "social:createIdeationComment",
        shouldCommentBeAddedToList: function() {
            return true;
        }
    });
    var IdeationView = SCF.JournalView.extend({
        viewName: "Ideation",
        COMMUNITY_FUNCTION: "Ideation",
        eventBinded: false,
        filterURLParam: {
            DRAFT_URL_FILTER: "?filter=isDraft%20eq%20%27true%27&filter=publishDate%20eq%20null"
        },
        listTypes: {
            DRAFTS: "drafts"
        },
        update: function(data) {
            SCF.ForumView.prototype.update.apply(this);
            if (data.newItem.get("draft")) {
                this.fetchDrafts();
            } else {
                this.fetchAllPosts();
            }
        },
        init: function() {
            SCF.ForumView.prototype.init.apply(this);
            var resourceType = this.model.get("resourceType");
            var templateName = "ideationlists";
            this.listenTo(this.model, "change:composedForValid", this.composedForChanged);
            this.listTemplateC = SCF.findTemplate(this.model.id, templateName, resourceType);
            SCF.Router.route(/^(.*?)\.([0-9]*)\.(-?[0-9]*)\.htm.*?$/, this.PAGE_EVENT);

            /* i18n strings
            CQ.I18n.get("Draft");
            CQ.I18n.get("Submitted");
            CQ.I18n.get("Under Review");
            CQ.I18n.get("Accepted");
            CQ.I18n.get("Under Construction");
            CQ.I18n.get("Completed");
            CQ.I18n.get("Duplicate");
            CQ.I18n.get("Rejected");
            */
        },
        toggleComposer: function(e) {
            this.$el.find(".scf-js-error-message").remove();
            this.$el.find(".scf-js-ideation-tab").toggleClass("scf-is-hidden");
            this.$el.find(".scf-topic-list").toggleClass("scf-is-hidden");
            this.$el.find(".scf-pages").toggleClass("scf-is-hidden");
            var composer = this.$el.find(".scf-js-composer-block");
            if (composer.hasClass("scf-is-collapsed")) {
                this.eventBinded = false;
                this.$el.find(".scf-sort-btngrp").hide();
                this.$el.find(".scf-component-pages-container").hide();
            } else {
                this.$el.find(".scf-sort-btngrp").show();
                this.$el.find(".scf-component-pages-container").show();
            }

            if (!this.eventBinded) {
                this.bindDatePicker(e);
                this.eventBinded = true;
            }

            SCF.ForumView.prototype.toggleComposer.apply(this, [e]);
        },
        addComment: function(e) {
            SCF.CommentSystemView.prototype.addComment.apply(this, e.currentTarget.form);
        },
        addCommentDraft: function(e) {
            SCF.CommentSystemView.prototype.addCommentDraft.apply(this, e.currentTarget.form);
        },
        renderWithTemplate: function(ignoreAfterRender) {
            this.$el.find(".tab-pane").empty();
            var element = $CQ(this.listTemplateC(this.getContextForTemplate(), {
                data: {
                    parentView: this
                }
            }));
            this.$el.find("#scf-js-draftPosts").empty().append(element);
            var that = this;
            _.each(this._childViews, function(child) {
                that.renderChildView(child);
            });

            var finishRendering = _.bind(function() {
                this.bindView();
                this._rendered = true;
                if (this.afterRender && !ignoreAfterRender) {
                    this.afterRender();
                }
                this.trigger("view:rendered", {
                    view: this
                });

            }, this);
            $CQ.when(this._renderedChildren).done(finishRendering);
            this.$el.find("li.scf-ideation-tab").removeClass("active");
            this.$el.find(".tab-pane").removeClass("active");
            this.activateTabs(".scf-js-draftPosts", "#scf-js-draftPosts");
            return this;
        },
        afterRender: function() {
            SCF.JournalView.prototype.afterRender.apply(this);
            if (this.isDraftView === true) {
                this.$el.find(".scf-sort-btngrp").hide();
            } else {
                this.$el.find(".scf-sort-btngrp").show();
            }

        },
        fetchDrafts: function() {
            this.isDraftView = true;
            this.switchView(this.filterURLParam.DRAFT_URL_FILTER, ".scf-js-draftPosts",
                "#scf-js-draftPosts");
        },
        fetchAllPosts: function() {
            this.isDraftView = false;
            this.switchView("", ".scf-js-allPosts", "#scf-js-allPosts");
        }
    });

    var IdeaComment = SCF.Comment.extend({
        modelName: "IdeaComment",
        DELETE_OPERATION: "social:deleteIdeationComment",
        UPDATE_OPERATION: "social:updateIdeationComment",
        CREATE_OPERATION: "social:createIdeationComment",
        events: {
            ADDED: "post:added",
            UPDATED: "post:updated",
            DELETED: "post:deleted",
            ADD_ERROR: "post:addError",
            UPDATE_ERROR: "post:updateError",
            DELETE_ERROR: "post:deleteError",
            TRANSLATED: "post:translated",
            TRANSLATE_ERROR: "post:translateError"
        },
        relationships: {
            "items": {
                collection: "IdeationPostList",
                model: "IdeaComment"
            },
            "votes": {
                model: "VotingModel"
            }
        },
        fixCachedProperties: function() {
            if (!SCF.Session.attributes.loggedIn) {
                this.attributes.canReply = false;
            }
        }
    });

    var IdeaCommentView = SCF.PostView.extend({
        viewName: "IdeaCommentView"
    });

    var Idea = SCF.Topic.extend({
        modelName: "IdeationTopicModel",
        DELETE_OPERATION: "social:deleteIdeationComment",
        UPDATE_OPERATION: "social:updateIdeationComment",
        CREATE_OPERATION: "social:createIdeationComment",
        CHANGESTATE_OPERATION: "social:changeStateIdeation",
        relationships: {
            "items": {
                collection: "IdeationPostList",
                model: "IdeaComment"
            },
            "votes": {
                model: "LikingModel"
            }
        },
        getCustomProperties: function() {
            var customData = {
                subject: this.get("subject")
            };
            if (this.has("isDraft")) {
                customData.isDraft = this.get("isDraft");
            }
            if (this.getConfigValue("usingPrivilegedUsers")) {
                var composedFor = this.get("composedFor");
                if (!_.isEmpty(composedFor)) {
                    customData.composedFor = composedFor;
                }
            }
            return customData;
        },
        getStatus: function() {
            var _state = this.get("state");
            if (_.isUndefined(_state) || _.isNull(_state)) {
                _state = "Submitted";
            }
            return _state;
        },
        fixCachedProperties: function(userIsModerator) {
            SCF.Topic.prototype.fixCachedProperties.call(this, userIsModerator);
            if (userIsModerator) {
                return;
            }
            var loggedInUserId = _.isUndefined(SCF.Session.attributes.id) ? "" :
                SCF.Session.attributes.id.substr(SCF.Session.attributes.id.lastIndexOf("/") +
                    1);
            var userIsOwner = (this.attributes.author || false) &&
                SCF.Session.attributes.loggedIn && ((this.attributes.author.id === SCF.Session
                        .attributes.id) ||
                    ((this.attributes.properties || false) && this.attributes.properties.composedBy ===
                        loggedInUserId));
            if (userIsOwner && !(_.isEmpty(this.get("state")) || this.get("state") ===
                    "Submitted" || this.get("state") === "Draft")) {
                this.attributes.canEdit = false;
                this.attributes.canDelete = false;
            }
        }
    });

    var IdeaView = SCF.BlogTopicView.extend({
        viewName: "Idea",
        COMMUNITY_FUNCTION: "Ideation",

        afterRender: function() {
            SCF.TopicView.prototype.afterRender.call(this);
            this.reviewStatus = this.model.getStatus();

            this.renderDropdown(this.reviewStatus);

            var _self = this;
            this.$el.find(".scf-js-review-status .dropdown-menu li a").click(function() {
                _self.reviewStatus = $(this).attr("data-review-state");
                _self.renderDropdown($(this).text());
            });
        },
        renderDropdown: function(status) {
            $(".scf-js-review-status .btn:first-child").html(
                "<span id=\"button_label\">" + CQ.I18n.get(status) +
                "</span> <span class=\"caret\"></span>");
            $(".scf-js-review-status .btn:first-child").val(status);
        },
        saveDraft: function(e) {
            this.draftFlag = "true";
            SCF.BlogTopicView.prototype.saveDraft.call(this, e);
        },
        publishDraft: function(e) {
            this.draftFlag = "false";
            SCF.BlogTopicView.prototype.publishDraft.call(this, e);
        },
        getOtherProperties: function(isReply) {
            var subject = this.getField("editSubject").trim();
            var tags = this.getField("editTags");
            var props = {
                "tags": tags
            };
            if (!isReply) {
                props.subject = subject;
            }
            props.isDraft = this.draftFlag;
            if (this.model.getConfigValue("usingPrivilegedUsers")) {
                var composedFor = this.getField("composedFor");
                if (!_.isEmpty(composedFor)) {
                    props.composedFor = composedFor;
                }
            }
            var state = this.reviewStatus;
            if (state) {
                props.toState = state;
                props.stateOperation = "Review Idea";
                props.addReply = true;
            }
            this.eventBinded = false;
            return props;
        },
        toggleReviewComposer: function() {
            var composer = this.$el.find(".scf-js-review-composer");
            composer.toggle();
            if (composer.is(":visible")) {
                this.focus("message");
                // In IE10 the RTE doesn't get cleared out when the composer opens it retains the
                // placeholder text.
                this.setField("message", "");
            }
        },
        navigateCancel: function() {
            window.location.href = this.model.get("pageInfo").basePageURL + ".html";
        }

    });

    var IdeaList = Backbone.Collection.extend({
        collectionName: "IdeaList"
    });
    var IdeationPostList = Backbone.Collection.extend({
        collectionName: "IdeationPostList"
    });

    SCF.IdeaComment = IdeaComment;
    SCF.Idea = Idea;
    SCF.Ideation = Ideation;
    SCF.IdeaView = IdeaView;
    SCF.IdeaCommentView = IdeaCommentView;
    SCF.IdeationView = IdeationView;
    SCF.IdeaList = IdeaList;
    SCF.IdeationPostList = IdeationPostList;
    SCF.registerComponent("social/ideation/components/hbs/comment", SCF.IdeaComment, SCF.IdeaCommentView);
    SCF.registerComponent("social/ideation/components/hbs/idea", SCF.Idea, SCF.IdeaView);
    SCF.registerComponent("social/ideation/components/hbs/ideation", SCF.Ideation, SCF.IdeationView);
})($CQ, _, Backbone, SCF);

