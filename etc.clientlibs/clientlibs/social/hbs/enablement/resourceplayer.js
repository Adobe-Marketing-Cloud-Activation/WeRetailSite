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

    /*
     * We need to use a jshint directive here in order to assign the non-camelcase CQ variable to a variable with a
     * jshint compliant name. This should otherwise never be done.
     */

    /* jscs:disable requireCamelCaseOrUpperCaseIdentifiers */
    window.CQ_Analytics = window.CQ_Analytics || {};
    var cqAnalytics = CQ_Analytics;

    /*
     * Make sure jscs catches any non-camelcase variables for the remainder of the code in this file.
     */

    /* jscs:enable requireCamelCaseOrUpperCaseIdentifiers */

    var ResourcePlayer = SCF.Model.extend({
        modelName: "ResourcePlayerModel",
        initialize: function() {
            SCF.Model.prototype.initialize.apply(this);
            SCF.Util.listenTo(SCF.CommentSystem.prototype.events.ADD, $.proxy(this.incrementResourceCommentCount,
                this));
        },
        incrementResourceCommentCount: function() {
            $.post(SCF.config.urlRoot + this.get("id"), {
                "commentCount_tl": 1,
                ":operation": "social:reportEnablementResourceModel"
            });
        },
        setResourceCompleted: function() {
            $.post(SCF.config.urlRoot + this.get("id"), {
                "completionStatus_s": "Completed",
                ":operation": "social:reportEnablementResourceModel"
            });
        },
        setResourceInProgress: function() {
            $.post(SCF.config.urlRoot + this.get("id"), {
                "completionStatus_s": "In Progress",
                ":operation": "social:reportEnablementResourceModel"
            });
        },
        setResourceNotAttempted: function() {
            $.post(SCF.config.urlRoot + this.get("id"), {
                "completionStatus_s": "Not Attempted",
                ":operation": "social:reportEnablementResourceModel"
            });
        }
    });
    var ResourcePlayerView = SCF.View.extend({
        viewName: "ResourcePlayer",
        className: "enablement-resource-player",
        COMMUNITY_FUNCTION: "Enablement Resource",
        init: function() {
            this.initDisplay();
            this.model.setResourceNotAttempted();

            var imageAsset = this.$el.find(".scf-image-asset").val();
            if (imageAsset === undefined || this.isFullScreenNotPossible()) {
                this.$el.find(".scf-enablement-fullscreen-button").hide();
            } else {
                this.$el.find(".scf-enablement-fullscreen-button").show();
            }

            this.updateCrumbs();
        },
        initAnalytics: function() {
            this.trackAnalyticsResourceView();
        },
        trackAnalyticsResourceEvent: function(obj, evt) {
            if (cqAnalytics.Sitecatalyst) {
                cqAnalytics.record({
                    event: evt,
                    values: {
                        "path": obj.resourcePath,
                        "resourcetype": obj.resourceType,
                        "functionType": SCF.Context.communityFunction ?
                            SCF.Context.communityFunction : this.COMMUNITY_FUNCTION,
                        "type": SCF.Context.type ? SCF.Context.type : this.model.get(
                            "resourceType"),
                        "ugcTitle": SCF.Context.ugcTitle,
                        "siteTitle": SCF.Context.siteTitle ?
                            SCF.Context.siteTitle : $(".scf-js-site-title").text(),
                        "sitePath": SCF.Context.sitePath ? SCF.Context.sitePath : this.sitePath,
                        "groupTitle": SCF.Context.groupTitle,
                        "groupPath": SCF.Context.groupPath,
                        "user": SCF.Context.user ? SCF.Context.user : SCF.Session.get(
                            "authorizableId")
                    },
                    collect: false,
                    componentPath: SCF.constants.ANALYTICS_BASE_RESOURCE_TYPE
                });
            }
        },
        trackAnalyticsResourceView: function() {
            var obj = {};
            obj.resourcePath = this.model.get("id");
            obj.resourceType = this.model.get("enablementResourceType");

            if (cqAnalytics.Sitecatalyst) {
                SCF.Context.communityFunction = this.COMMUNITY_FUNCTION;
                SCF.Context.path = this.model.get("id");
                SCF.Context.type = this.model.get("resourceType");
                SCF.Context.ugcTitle = this.model.get("title");
                /*
                 * Suppress the next Analytics tracking call so that the default page call and this call
                 * don't result in a double call.
                 */
                window.s.abort = true;
            }
            this.trackAnalyticsResourceEvent(obj, "SCFView");
        },
        trackAnalyticsResourcePlay: function(onPageLoad) {
            var obj = {};
            obj.resourcePath = this.model.get("id");
            obj.resourceType = this.model.get("enablementResourceType");

            if (onPageLoad) {
                if (cqAnalytics.Sitecatalyst) {
                    /*
                     * Suppress the next Analytics tracking call so that the default page call and this call
                     * don't result in a double call.
                     */
                    window.s.abort = true;
                }
                this.trackAnalyticsResourceEvent(obj, "playresource");
            } else {
                this.trackAnalyticsResourceEvent(obj, "playresource");
            }
        },
        initDisplay: function() {
            /*
             * Most assets by default will initialize to the cover image with a clickable play button.
             */
            this.showAssetCover();
        },
        showAssetCover: function() {

            this.$el.find(".scf-js-asset-cover").show();
            this.$el.find(".scf-js-asset-container").hide();
        },
        showAsset: function() {
            this.model.setResourceInProgress();
            this.$el.find(".scf-js-asset-cover").hide();
            this.$el.find(".scf-js-asset-container").show();
        },
        showFullscreen: function() {
            var elem = this.$el.find("#scf-asset-element")[0];
            if (elem !== null) {
                var req = elem.requestFullScreen || elem.webkitRequestFullScreen ||
                    elem.mozRequestFullScreen || elem.msRequestFullscreen;
                if (req) {
                    req.call(elem);
                }
            }
        },
        showLaunchText: function() {
            this.$el.find(".scf-cover-image").hide();
            this.$el.find(".scf-play-button").hide();
            this.$el.find(".scf-asset-displaytext").show();
        },
        isFullScreenNotPossible: function() {
            var status = false;
            var elem = this.$el.find("#scf-asset-element")[0];
            if (elem !== null) {
                var req = elem.requestFullScreen || elem.webkitRequestFullScreen ||
                    elem.mozRequestFullScreen || elem.msRequestFullscreen;
                if (req) {
                    status = false;
                } else {
                    status = true;
                }
            }
            return status;
        },
        showAndPlayAsset: function() {
            this.showAsset();
            if (this.playAsset) {
                this.playAsset();
            }
        },
        showFullScreenButton: function() {
            this.$el.find(".scf-enablement-fullscreen-button").show();
        },
        isScormAsset: function() {
            var isScorm = false;
            var scormAsset = this.$el.find(".scf-scorm-asset").val();
            if (scormAsset !== undefined) {
                isScorm = true;
            }
            return isScorm;
        },
        clickPlay: function() {
            if (this.isFullScreenNotPossible()) {
                this.showLaunchText();
                if (this.isScormAsset()) {
                    if (this.playAssetInWindow) {
                        this.playAssetInWindow();
                    }
                } else {
                    this.showAndPlayAsset();
                }
            } else {
                this.showAndPlayAsset();
                this.showFullScreenButton();
            }
            this.model.setResourceCompleted();
            this.trackAnalyticsResourcePlay(false);
        },
        updateCrumbs: function() {
            var crumbs = [];
            var URL = this.model.attributes.friendlyUrl;
            var pageExtension = CQ.shared.HTTP.getExtension();
            var urlSplit = URL.split(pageExtension);
            if (urlSplit && urlSplit !== undefined) {
                var parent = urlSplit[0];
                var splitSelectors = parent.split(".");
                if (splitSelectors && splitSelectors !== undefined) {
                    parent = splitSelectors[0] + "." + pageExtension;
                    crumbs.push({
                        "title": "",
                        "url": parent
                    });
                }
            }

            if (this.model.get("parentLearningPathInfo")) {
                crumbs.push({
                    "title": CQ.I18n.get(this.model.get("parentLearningPathInfo").title),
                    "url": this.model.get("parentLearningPathInfo").url
                });
            }
            crumbs.push({
                "title": CQ.I18n.get(this.model.get("title")),
                "url": "",
                "active": true
            });
            SCF.Util.announce("crumbs", {
                "crumbs": crumbs
            });
        }
    });

    SCF.ResourcePlayer = ResourcePlayer;
    SCF.ResourcePlayerView = ResourcePlayerView;

})(SCF);
