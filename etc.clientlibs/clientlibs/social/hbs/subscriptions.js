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

