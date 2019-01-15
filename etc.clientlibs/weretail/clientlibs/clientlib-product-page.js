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
(function($) {
    window.SCFCards = function(container, options) {
        this.container = $(container);
        var opts = options || {};
        this.cardMargin = opts.cardMargin || 10;
        this.containerPadding = opts.containerPadding || 0;
        this.cardWidth = opts.cardWidth || 154;
        var that = this;
        $(window).resize(function() {
            that.redraw(true);
        });
        this.redraw(false);
    };
    SCFCards.prototype.redraw = function(animate) {
        this.containerWidth = this.container.outerWidth(true);
        this.cards = this.container.find(".scf-card");
        this.columns = Math.floor((this.containerWidth - (2 * this.containerPadding)) / (this.cardWidth +
            (this.cardMargin * 2)));
        this.occupiedWidth = Math.ceil(this.columns * (this.cardWidth + (this.cardMargin * 2)));
        this.newSidePadding = Math.floor((this.containerWidth - this.occupiedWidth) / 2);
        this.container.css({
            "padding-left": this.newSidePadding,
            "padding-right": this.newSidePadding,
            "position": "relative"
        });
        var that = this;
        var columnHeights = [];
        for (var i = 0; i < this.columns; i++) {
            columnHeights[i] = that.newSidePadding;
        }
        var greatestHeight = 0;
        var minHeight = that.newSidePadding;
        this.cards.each(function(cardCount, card) {
            var $card = $(card);
            var top = that.newSidePadding;
            var columnToStack = 0;
            for (var i = 0; i < that.columns; i++) {
                if (columnHeights[i] <= minHeight) {
                    minHeight = columnHeights[i];
                    columnToStack = i;
                    if (cardCount <= that.columns && i >= cardCount) {
                        break;
                    }
                }
            }

            top = columnHeights[columnToStack];
            var left = (columnToStack) * (that.cardWidth + (that.cardMargin * 2)) + that.newSidePadding;

            if (animate) {
                $card.animate({
                    "position": "absolute",
                    "left": left,
                    "top": top
                }, 500);
            } else {
                $card.css({
                    "position": "absolute",
                    "left": left,
                    "top": top
                });
            }

            columnHeights[columnToStack] += $card.outerHeight(true);
            if (columnHeights[columnToStack] > greatestHeight) {
                greatestHeight = columnHeights[columnToStack];
            }
            minHeight = columnHeights[columnToStack];
        });
        this.container.css({
            "display": "block",
            "height": greatestHeight + this.newSidePadding
        });
    };
})($CQ);

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
(function(SCF) {
    "use strict";

    // analytics code
    // jscs:disable requireCamelCaseOrUpperCaseIdentifiers
    window.CQ_Analytics = window.CQ_Analytics || {};
    var cqAnalytics = CQ_Analytics;
    // jscs:enable requireCamelCaseOrUpperCaseIdentifiers

    var Rating = SCF.Model.extend({
        modelName: "RatingModel",
        createRating: function(rating) {
            var success = _.bind(function(response) {
                var isNew = _.isUndefined(this.get("currentUserResponse"));
                this.set(response.response);
                var totalResponses = this.get("totalNumberOfResponses");
                var avg = this.get("formattedAverageRating");
                this.set("formattedAverageRating", avg);
                this.trigger("rating:added", {
                    model: this
                });

            }, this);
            var error = _.bind(function(jqxhr, text, error) {
                SCF.log.error("error creating rating %o", error);
                this.trigger("rating:adderror", {
                    "error": error
                });
            }, this);
            var reqData = {
                "response": rating,
                "tallyType": "Rating",
                ":operation": "social:postTallyResponse"
            };
            var properties = this.get("properties");
            if (properties && typeof properties.useReferrer != "undefined" && properties.useReferrer) {
                reqData.referer = window.location.href;
            }
            $.ajax(SCF.config.urlRoot + this.get("id") + SCF.constants.URL_EXT, {
                dataType: "json",
                type: "POST",
                xhrFields: {
                    withCredentials: true
                },
                data: reqData,
                "success": success,
                "error": error
            });
        }
    });
    var RatingView = SCF.View.extend({
        viewName: "Rating",
        tagName: "div",
        className: "ratings",
        RATE_EVENT: "SCFRate",
        tempRatingBarWidth: null,
        messageContainer: null,
        init: function() {
            this.listenTo(this.model, "rating:added", this.update);
            this.listenTo(this.model, "rating:adderror", this.showError);
        },
        update: function() {
            this.analyticsTrack();
            this.model.reload();
        },
        analyticsTrack: function() {
            if (!_.isUndefined(window._satellite)) {
                window._satellite.track("communities-scf-rate");
            } else if (cqAnalytics.Sitecatalyst) {
                cqAnalytics.record({
                    event: this.RATE_EVENT,
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
        showError: function(error) {
            SCF.log.error(error);
        },
        rate: function(e) {
            e.preventDefault();
            this.tempRatingBarWidth = null;
            var el = e.target;
            var ratingResponseData = $(el).data("rating-value");
            this.model.createRating(ratingResponseData);
            var _parent = $(el).closest("div.scf-ratings");
            if (_parent !== null) {
                if (this.messageContainer !== null) {
                    $(this.messageContainer).remove();
                }

                this.messageContainer = $("<div class='scf-rating-onrate-text'>" + CQ.I18n.getMessage("Thank you!") +
                    "</div>");
                $(_parent).before(this.messageContainer);
            }
            return false;
        },
        highlight: function(e) {
            var el = e.target;
            var doneHighlight = false;
            if (this.tempRatingBarWidth === null) {
                this.tempRatingBarWidth = this.$el.find(".scf-js-ratings-bar").width();
            }
            this.$el.find(".scf-js-ratings-bar").width("0px");
            this.$el.find(".scf-rating-trigger-bar [data-rating-value]").each(function() {
                if (!doneHighlight) {
                    $(this).addClass("scf-is-rating-star-select");
                    $(this).removeClass("scf-is-rating-star-deselect");
                } else {
                    $(this).removeClass("scf-is-rating-star-select");
                    $(this).addClass("scf-is-rating-star-deselect");
                }
                if (this === el) {
                    doneHighlight = true;
                }
            });
        },
        resetHighlights: function() {
            if (this.tempRatingBarWidth !== null) {
                this.$el.find(".scf-js-ratings-bar").width(this.tempRatingBarWidth);
                this.tempRatingBarWidth = null;
            }
            this.$el.find(".scf-rating-trigger-bar [data-rating-value]").each(function() {
                $(this).removeClass("scf-is-rating-star-deselect");
                $(this).removeClass("scf-is-rating-star-select");
            });
        },
        toggleHistogram: function() {
            this.$el.find(".scf-rating-histogram").slideToggle("fast");
        }
    });
    SCF.Rating = Rating;
    SCF.RatingView = RatingView;

    SCF.registerComponent("social/tally/components/hbs/rating", SCF.Rating, SCF.RatingView);

})(SCF);

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
(function(SCF) {
    "use strict";

    // jscs:disable requireCamelCaseOrUpperCaseIdentifiers
    window.CQ_Analytics = window.CQ_Analytics || {};
    var cqAnalytics = window.CQ_Analytics;
    // jscs:ensable requireCamelCaseOrUpperCaseIdentifiers

    var Voting = SCF.Model.extend({
        ANALYTICS_BASE_RESOURCE_TYPE: "social/commons/components/analyticsbase",
        modelName: "VotingModel",
        defaults: {
            totalNumberOfResponses: 0,
            netCount: 0,
            positiveCount: 0,
            negativeCount: 0
        },
        _updateVoting: function(newResponse) {
            var previousResponse = this.get("currentUserResponse");
            var netCount = this.get("netCount");
            var positiveCount = this.get("positiveCount");
            var negativeCount = this.get("negativeCount");
            var totalResponses = this.get("totalNumberOfResponses");
            var responseTallies = this.get("responseTallies") || {};
            var currentUserLike;
            var currentUserResponse;
            if (newResponse === "unset") {
                if (previousResponse === "DISLIKE") {
                    netCount = netCount + 1;
                    negativeCount--;
                } else if (previousResponse === "LIKE") {
                    netCount = netCount - 1;
                    positiveCount--;
                }
                totalResponses--;
                currentUserLike = false;
                currentUserResponse = undefined;
            } else if (newResponse == -1) {
                if (previousResponse === "LIKE") {
                    netCount = netCount - 2;
                    negativeCount++;
                    positiveCount--;

                } else {
                    netCount = netCount - 1;
                    negativeCount++;
                    totalResponses++;
                }
                currentUserResponse = "DISLIKE";
                currentUserLike = false;
            } else if (newResponse == 1) {
                if (previousResponse === "DISLIKE") {
                    netCount = netCount + 2;
                    positiveCount++;
                    negativeCount--;
                } else {
                    netCount = netCount + 1;
                    positiveCount++;
                    totalResponses++;
                }
                currentUserResponse = "LIKE";
                currentUserLike = true;
            }
            responseTallies[1] = positiveCount;
            responseTallies[-1] = negativeCount;
            this.set({
                "currentUserResponse": currentUserResponse,
                "currentUserLike": currentUserLike,
                "netCount": netCount,
                "positiveCount": positiveCount,
                "negativeCount": negativeCount,
                "totalNumberOfResponses": totalResponses,
                "responseTallies": responseTallies
            }, {
                silent: true
            });
            if (currentUserResponse === undefined) {
                this.unset("currentUserResponse", {
                    silent: true
                });
            }
        },
        createVoting: function(voting) {
            var url = SCF.config.urlRoot + this.get("id") + SCF.constants.URL_EXT;
            var success = _.bind(function(response) {
                this._updateVoting(voting);
                this.trigger("voting:added", {
                    model: this
                });

                // get sitePath for analytics
                var sitePath = $(".scf-js-site-title").attr("href");
                sitePath = _.isUndefined(sitePath) ? "" : sitePath.substring(0, sitePath.lastIndexOf(".html"));
                this.sitePath = sitePath;

                // id and model of the reply or post that is being voted on
                var votedId = (this.attributes.properties && this.attributes.properties["social:parentid"]) ?
                    this.attributes.properties["social:parentid"] : this.id.split("\/voting")[0];
                var votedModel = SCF.Model.findLocal(votedId);

                // only record the event if there was a currentUserResponse ("LIKE" or "DISLIKE")
                // absence of currentUserResponse indicates that vote was canceled
                if (response.response.currentUserResponse) {
                    var userResponse = response.response.currentUserResponse;
                    var event;

                    if (!_.isUndefined(window._satellite)) {
                        event = userResponse === "LIKE" ? "communities-scf-vote-up" : "communities-scf-vote-down";
                        window._satellite.track(event);
                    } else if (cqAnalytics.Sitecatalyst) {
                        event = userResponse === "LIKE" ? "SCFVoteUp" : "SCFVoteDown";
                        cqAnalytics.record({
                            event: event,
                            values: {
                                "functionType": SCF.Context.communityFunction ?
                                    SCF.Context.communityFunction : votedModel.view.COMMUNITY_FUNCTION,
                                "path": SCF.Context.path ? SCF.Context.path : votedId,
                                "type": SCF.Context.type ? SCF.Context.type : votedModel.get("resourceType"),
                                "ugcTitle": SCF.Context.ugcTitle ? SCF.Context.ugcTitle : "",
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

            }, this);
            var error = _.bind(function(jqxhr, text, error) {
                console.log("error creating vote " + error);
                this.trigger("voting:adderror", {
                    "error": error
                });
            }, this);
            var reqData = {
                "response": voting,
                "tallyType": "Voting",
                ":operation": "social:postTallyResponse"
            };
            var properties = this.get("properties");
            if (properties && typeof properties.useReferrer != "undefined" && properties.useReferrer) {
                reqData.referer = window.location.href;
            }
            $.ajax(url, {
                dataType: "json",
                type: "POST",
                xhrFields: {
                    withCredentials: true
                },
                data: reqData,
                "success": success,
                "error": error
            });
        }
    });
    var VotingView = SCF.View.extend({
        viewName: "Voting",
        tagName: "div",
        className: "voting",
        init: function() {
            this.listenTo(this.model, "voting:added", this.update);
            this.listenTo(this.model, "voting:adderror", this.showError);
        },
        update: function() {
            this.isVoteInProgress = false;
            this.render();
        },
        showError: function(error) {
            console.log(error);
        },
        vote: function(e) {
            if (this.isVoteInProgress) {
                return;
            }
            var el = $CQ(e.target);
            el.addClass("scf-is-disabled");
            var voting = el.attr("data-voting-value");
            this.isVoteInProgress = true;
            this.model.createVoting(voting);
            e.preventDefault();
            return false;
        }
    });
    SCF.Voting = Voting;
    SCF.VotingView = VotingView;
    SCF.registerComponent("social/tally/components/hbs/voting", SCF.Voting, SCF.VotingView);

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
(function($CQ, _, Backbone, SCF) {
    "use strict";
    var scf_review_response_data = {};
    var scf_review_response_delta = {};
    var ReviewSystem = SCF.CommentSystem.extend({
        modelName: "ReviewSystemModel",
        relationships: {
            "items": {
                collection: "ReviewList",
                model: "ReviewModel"
            }
        },
        createOperation: "social:createReview",
        events: {
            ADD: "review:added",
            ADD_ERROR: "review:adderror",
            UPDATED: "review:updated",
            DELETE: "review:deleted"
        },
        addReview: function(data, scb, fcb) {
            var success = _.bind(function(response) {
                var review = response.response;
                var ReviewKlass = SCF.Models[this.constructor.prototype.relationships.items.model];
                var newReview = new ReviewKlass(review);
                newReview.set("_isNew", true);
                newReview._isReady = true;
                var reviews = this.get('items');
                var isCollectionNew = false;
                if (!reviews) {
                    var CollectionKlass = SCF.Collections[this.constructor.prototype.relationships.items.collection] || Backbone.Collection;
                    reviews = new CollectionKlass();
                    reviews.model = ReviewKlass;
                    reviews.parent = this;
                    isCollectionNew = true;
                }
                reviews.unshift(newReview);
                if (isCollectionNew) {
                    this.set('items', reviews);
                }
                var totalReviews = this.get('totalSize');
                this.set('totalSize', totalReviews + 1);
                var averages = this.get('ratingAverages');
                var ratings = this.get('ratings');
                var overall = this.get('overallRating');
                if (!averages) {
                    averages = {};
                    this.set('ratingAverages', averages);
                }
                if (!overall) {
                    overall = {};
                    this.set('overallRating', overall);
                }
                var allowed_ratings = this.get('allowedRatings');
                for (var i = 0; i < allowed_ratings.length; i++) {
                    var name = allowed_ratings[i].name;
                    var avg = averages[name];
                    var ratingValue = $(scf_review_response_data[name]).data("rating-value");
                    if (ratingValue > 0) {
                        var totalResponses = 0;
                        if (_.isUndefined(ratings)) {
                            ratings = {};
                            this.set('ratings', ratings);
                            ratings[name] = {};
                        } else if (!ratings[name]) {
                            ratings[name] = {};
                        } else {
                            totalResponses = ratings[name].totalNumberOfResponses;
                        }
                        avg = (avg * totalResponses + ratingValue) / (totalResponses + 1);
                        averages[name] = avg.toFixed(2);
                        if (ratings) {
                            ratings[name].totalNumberOfResponses = totalResponses + 1;
                            ratings[name].averageRating = avg.toFixed(2);
                        }
                        if (i == 0) {
                            overall.averageRating = averages[name];
                        }
                    }
                }
                newReview.constructor.prototype._cachedModels[review.id] = newReview;
                this.trigger(this.events.ADD, {
                    model: this
                });
                scf_review_response_data = {};
            }, this);
            var error = _.bind(function(jqxhr, text, error) {
                this.trigger(this.events.ADD_ERROR, this.parseServerError(jqxhr, text, error));
            }, this);
            var postData;
            var hasAttachment = (typeof data.files != 'undefined');

            if (hasAttachment) {
                var reader, file;

                // Create a formdata object and add the files
                if (window.FormData) {
                    postData = new FormData();
                }

                if (postData) {
                    $.each(data.files, function(key, value) {
                        postData.append("file", value);
                    });
                    postData.append('id', 'nobot');
                    postData.append(':operation', this.createOperation);
                    delete data.files;
                    $.each(data, function(key, value) {
                        postData.append(key, value);
                    });
                }
            } else {
                postData = {
                    'id': 'nobot',
                    ':operation': this.createOperation
                };
                _.extend(postData, data);
                postData = this.getCustomProperties(postData, data);
            }
            this.addIncludeHint(postData);

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
        updateReview: function() {
            var averages = this.get('ratingAverages');
            var ratings = this.get('ratings');
            var overall = this.get('overallRating');
            var allowed_ratings = this.get('allowedRatings');
            for (var i = 0; i < allowed_ratings.length; i++) {
                var name = allowed_ratings[i].name;
                var avg = averages[name];
                if (!_.isUndefined(scf_review_response_delta[name]) && scf_review_response_delta[name] !== 0) {
                    var totalResponses = 0;
                    if (_.isUndefined(ratings[name])) {
                        ratings[name] = {};
                    } else {
                        totalResponses = ratings[name].totalNumberOfResponses;
                    }
                    if (("" + scf_review_response_delta[name]).indexOf("*") > 0) {
                        //new response
                        scf_review_response_delta[name] = parseInt(scf_review_response_delta[name]);
                        avg = (avg * totalResponses + scf_review_response_delta[name]) / (totalResponses + 1);
                        ratings[name].totalNumberOfResponses = totalResponses + 1;
                    } else {
                        avg = (avg * totalResponses + scf_review_response_delta[name]) / totalResponses;
                    }
                    averages[name] = parseFloat(avg).toFixed(2);
                    if (i == 0) {
                        overall.averageRating = averages[name];
                    }
                }
            }

            this.trigger(this.events.UPDATED, {
                model: this
            });

        },
        deleteReview: function(context) {
            var totalReviews = this.get('totalSize');
            this.set('totalSize', totalReviews - 1);

            var deleted = context.get("ratingResponses");
            var averages = this.get('ratingAverages');
            var ratings = this.get('ratings');
            var overall = this.get('overallRating');
            var allowed_ratings = this.get('allowedRatings');
            for (var i = 0; i < allowed_ratings.length; i++) {
                var name = allowed_ratings[i].name;
                var avg = averages[name];
                var totalResponses = ratings[name].totalNumberOfResponses;
                if (deleted[name] !== null && deleted[name] !== 0) {
                    if (totalResponses > 1) {
                        avg = (avg * totalResponses - deleted[name]) / (totalResponses - 1);
                        averages[name] = avg.toFixed(2);
                    } else {
                        averages[name] = 0;
                    }
                    if (i == 0) {
                        overall.averageRating = averages[name];
                    }
                }
            }

            this.trigger(this.events.DELETE, {
                model: this
            });

        }
    });

    var ReviewSystemView = SCF.CommentSystemView.extend({
        viewName: "ReviewSystem",
        className: "comment-system",
        init: function() {
            this.listenTo(this.model, this.model.events.ADD, this.add);
            this.listenTo(this.model, this.model.events.ADD_ERROR, this.showErrorOnAdd);
            this.listenTo(this.model, this.model.events.DELETE, this.remove);
            this.listenTo(this.model.get('items'), 'remove', function(context) {
                this.model.deleteReview(context);
            });
            this.listenTo(this.model.get('items'), 'review:updated', function(context) {
                this.model.updateReview();
            });
            this.listenTo(SCF.Router, 'route:' + this.PAGE_EVENT, this.paginate);
        },
        add: function() {
            this.render();
            this.$el.find('.scf-create-review-button')[0].disabled = true;
        },
        remove: function() {
            this.$el.find('.scf-create-review-button')[0].disabled = false;
        },
        showErrorOnAdd: function(error) {
            this.addErrorMessage(this.$el.find(".scf-review-form-label-bold").first(), error);
            console.log(error);
        },
        addReview: function(e) {
            var msg = this.getField('message');
            var tags = this.getField('tags');
            var data = _.extend(this.getOtherProperties(), {
                'message': msg,
                'tags': tags
            });
            if (!SCF.Session.get("loggedIn")) {
                data.userIdentifier = this.getField("anon-name");
                data.email = this.getField("anon-email");
                data.url = this.getField("anon-web");
            }
            if (typeof this.files != 'undefined') {
                data.files = this.files;
            }
            var ratings = "";
            for (var key in scf_review_response_data) {
                if (scf_review_response_data.hasOwnProperty(key)) {
                    ratings = ratings + key + ";";
                    ratings = ratings + $(scf_review_response_data[key]).data("rating-value") + ";";
                }
            }
            data.ratings = ratings;
            this.clearErrorMessages();
            this.model.addReview(data);
            e.preventDefault();
            return false;
        },
        rate: function(e) {
            var star = e.target;
            $(star).parent().parent().attr("data-rating-shown", "0-0");
            scf_review_response_data[$(star).data("type")] = star;
            e.preventDefault();
            return false;
        },
        highlight: function(e) {
            var el = e.target;
            var doneHighlight = false;
            $(el).parent().find('.scf-ratings-star[data-rating-value]').each(function(index) {
                if (!doneHighlight) {
                    $(this).addClass('scf-is-rating-star-select');
                    $(this).removeClass('scf-is-rating-star-deselect');
                } else {
                    $(this).removeClass('scf-is-rating-star-select');
                    $(this).addClass('scf-is-rating-star-deselect');
                }
                if (this === el) {
                    doneHighlight = true;
                }
            });
        },
        resetHighlights: function(e) {
            var doResetHighlight = false;
            var el = e.target;
            $(el).parent().find('.scf-ratings-star[data-rating-value]').each(function(index) {
                var selectedStar = scf_review_response_data[$(this).data("type")];
                if (_.isUndefined(selectedStar)) {
                    $(this).removeClass('scf-is-rating-star-deselect');
                    $(this).removeClass('scf-is-rating-star-select');
                    return;
                }

                if (doResetHighlight) {
                    $(this).removeClass('scf-is-rating-star-deselect');
                    $(this).removeClass('scf-is-rating-star-select');
                } else {
                    $(this).addClass('scf-is-rating-star-select');
                    $(this).removeClass('scf-is-rating-star-deselect');
                }

                if (this === selectedStar) {
                    doResetHighlight = true;
                }
            });
        },
        toggleCreateReviewForm: function(e) {
            this.$el.find('.scf-review-form').show('fast');
            this.$el.find('.scf-create-review-button').hide('fast');
            this.$el.find(".scf-js-composer-block:last").removeClass("scf-is-collapsed");
        },
        cancelComposer: function() {
            this.$el.find('.scf-review-form').hide('fast');
            this.$el.find('.scf-create-review-button').show('fast');
            this.$el.find(".scf-js-composer-block:last").addClass("scf-is-collapsed");
            this.files = undefined;
            $CQ(".scf-js-composer-att").empty();
        }
    });

    var Review = SCF.Comment.extend({
        modelName: "ReviewModel",
        DELETE_OPERATION: "social:deleteReview",
        UPDATE_OPERATION: "social:updateReview",
        CREATE_OPERATION: "social:createComment",
        events: {
            ADDED: "review:added",
            UPDATED: "review:updated",
            DELETED: "review:deleted",
            ADD_ERROR: "review:addError",
            UPDATE_ERROR: "review:updateError",
            DELETE_ERROR: "review:deleteError",
            TRANSLATED: "comment:translated",
            TRANSLATE_ERROR: "comment:translateError"
        },
        saveEdits: function() {
            var error = _.bind(function(jqxhr, text, error) {
                this.trigger(this.events.UPDATE_ERROR, {
                    'error': error
                });
            }, this);
            var success = _.bind(function(response) {
                this.set(response.response);
                this.trigger(this.events.UPDATED, {
                    model: this
                });
            }, this);

            var postData = {
                'message': this.get('message'),
                'ratings': this.get('ratings'),
                'id': 'nobot',
                ':operation': this.UPDATE_OPERATION
            };
            postData = _.extend(this.getCustomProperties(), postData);
            this.addIncludeHint(postData);

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
                collection: "ReviewList",
                model: "ReviewModel"
            },
            "votes": {
                model: "VotingModel"
            }
        }
    });

    var ReviewView = SCF.CommentView.extend({
        viewName: "Review",
        highlight: ReviewSystemView.prototype.highlight,
        resetHighlights: ReviewSystemView.prototype.resetHighlights,
        rate: ReviewSystemView.prototype.rate,
        edit: function(e) {
            e.stopPropagation();
            var editBox = this.$el.find(".scf-js-comment-edit-box:first");
            editBox.toggle();
            var ratingbars = editBox.find('.scf-ratings-bar-selected');
            for (var i = 0; i < ratingbars.length; i++) {
                var value = $(ratingbars[i]).data("rating-shown");
                var ratingtype = $($(ratingbars[i]).find('.scf-ratings-star')[0]).data("type");
                scf_review_response_data[ratingtype] = $(ratingbars[i]).find('.scf-ratings-star')[value - 1];
            }
            this.$el.find(".scf-js-comment-msg:first").hide();
            this.$el.find(".scf-ratings-block:first").hide();
            var text = this.model.get('message');
            this.setField("editMessage", text);
            this.focus("editMessage");
        },
        save: function(e) {
            e.stopPropagation();
            var bEditTranslationInProgress = this.model.get('editTranslationInProgress');
            var msg = this.getField("editMessage");
            var ratings = "";
            scf_review_response_delta = {};
            for (var key in scf_review_response_data) {
                if (scf_review_response_data.hasOwnProperty(key)) {
                    ratings = ratings + key + ";";
                    ratings = ratings + $(scf_review_response_data[key]).data("rating-value") + ";";
                    scf_review_response_delta[key] = $(scf_review_response_data[key]).data("rating-value") - this.model.attributes.ratingResponses[key];
                    if (this.model.attributes.ratingResponses[key] === null && scf_review_response_delta[key] !== 0) {
                        scf_review_response_delta[key] += "*";
                    }
                }
            }
            var data = _.extend(this.getOtherProperties(), {
                message: msg,
                ratings: ratings
            });
            this.clearErrorMessages();
            this.model.set(data);
            if (bEditTranslationInProgress) {
                this.model.saveEditTranslation();
            } else {
                this.model.saveEdits();
            }
            scf_review_response_data = {};
            return false;
        },
        cancel: function(e) {
            e.stopPropagation();
            this.clearErrorMessages();
            var editBox = this.$el.find(".scf-js-comment-edit-box:first");
            editBox.hide();
            this.$el.find(".scf-js-comment-msg:first").show();
            this.$el.find(".scf-ratings-block:first").show();
        }
    });

    var ReviewList = Backbone.Collection.extend({
        collectionName: "ReviewList"
    });


    SCF.Review = Review;
    SCF.ReviewSystem = ReviewSystem;
    SCF.ReviewView = ReviewView;
    SCF.ReviewSystemView = ReviewSystemView;
    SCF.ReviewList = ReviewList;

    SCF.registerComponent('social/reviews/components/hbs/reviews/review', SCF.Review, SCF.ReviewView);
    SCF.registerComponent('social/reviews/components/hbs/reviews', SCF.ReviewSystem, SCF.ReviewSystemView);

})($CQ, _, Backbone, SCF);

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
(function($CQ, _, Backbone, SCF) {
    "use strict";
    var ReviewSummaryView = SCF.View.extend({
        viewName: "ReviewSummary",
        tagName: "div",
        className: "social ratings",
        init: function() {
            this.listenTo(this.model, this.model.events.ADD, this.update);
            this.listenTo(this.model, this.model.events.ADD_ERROR, this.showError);
            this.listenTo(this.model, this.model.events.UPDATED, this.update);
            this.listenTo(this.model, this.model.events.DELETE, this.update);
            this.listenTo(SCF.Router, 'route:pageReviews', this.paginate);
        },
        update: function() {
            this.render();
        }
    });

    SCF.ReviewSummaryView = ReviewSummaryView;

    SCF.registerComponent('social/reviews/components/hbs/summary', SCF.ReviewSystem, SCF.ReviewSummaryView);

})($CQ, _, Backbone, SCF);

/*
 *  Copyright 2016 Adobe Systems Incorporated
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */
(function(SCF) {
    "use strict";

    SCF.registerComponent("weretail/components/hbs/voting", SCF.Voting, SCF.VotingView);

})(SCF);
/*
 *  Copyright 2016 Adobe Systems Incorporated
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */
(function(SCF) {
    "use strict";

    SCF.registerComponent("weretail/components/hbs/rating", SCF.Rating, SCF.RatingView);

})(SCF);
