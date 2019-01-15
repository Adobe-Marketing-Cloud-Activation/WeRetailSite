/*************************************************************************
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
 *
 *************************************************************************/
(function($CQ, _, Backbone, SCF) {
    "use strict";

    SCF.LOG_LEVEL = 1;

    var ItemsListModel = SCF.Model.extend({
        modelName: "ItemsListModel",
        relationships: {
            "items": {
                collection: "CardList"
            }
        }
    });

    var ItemsListView = SCF.View.extend({

        initInfiniScroll: function() {
            var that = this;
            this.infiniScroll = new Backbone.InfiniScroll(this.collection, {
                pageSize: this.model.get("pageInfo").pageSize,
                scrollOffset: 400,
                onFetch: function() {
                    /* If collection url exists - use it because
                       if prior to scrolling user searched or filtered
                       this url will contain the appropriate parameters */
                    var url;
                    if (that.collection.url) {
                        url = that.collection.url;
                        /* pageInfo nextSuffix and pageInfo nextPageUrl in this case do not provide correct values.
                           Looks like it stops working if last page has less items than pageSize.
                           So constructing the values using currentIndex and pageSize */
                        var pageSize = that.model.get("pageInfo").pageSize;
                        var nextSuffix = that.model.get("pageInfo").currentIndex +
                            pageSize + "." + pageSize;
                        var previousSuffix = that.model.get("pageInfo").currentIndex +
                            "." + pageSize;
                        url = url.replace(previousSuffix, nextSuffix);
                    } else {
                        url = that.model.get("pageInfo").nextPageURL.replace(
                            ".html", ".json");
                    }
                    that.collection.url = decodeURIComponent(url);
                }
            });

        },

        checkCurrentUser: function() {
            var userId = "";
            var CURRENT_USER_URL = CQ.shared.HTTP.externalize("/libs/granite/security/currentuser.json");
            $CQ.ajax({
                url: CURRENT_USER_URL,
                type: "GET",
                success: function(result) {
                    userId = result.authorizableId;
                },
                async: false
            });
        },

        renderDueStatusLabels: function() {
            if (this.collection.length > 0) {
                var dueStatusList = _.map(this.collection.models, function(obj) {
                    return obj.get("dueStatus");
                });
                var assignmentDueStatusLabels = this.$el.find(".scf-due-status");
                _.each(assignmentDueStatusLabels,
                    function(obj, index) {
                        var status = this[index];
                        var dueStatusText;
                        var dueStatusClass;

                        switch (status) {
                            case "DueInMoreThan3Days":
                                dueStatusText = CQ.I18n.get("DUE ON ");
                                dueStatusClass = "due-status-safe";
                                break;
                            case "DueWithin3Days":
                                dueStatusText = CQ.I18n.get("DUE ON ");
                                dueStatusClass = "due-status-warning";
                                break;
                            case "PastDue":
                                dueStatusText = CQ.I18n.get("PAST DUE ");
                                dueStatusClass = "due-status-expired";
                                break;
                            default:
                                $(obj).replaceWith("<div class=\"scf-due-status\"><br></div>");
                                dueStatusText = "";
                                dueStatusClass = "";
                        }
                        if (dueStatusClass !== "") {
                            $(obj).addClass(dueStatusClass);
                            $(obj).prepend(dueStatusText);
                            $(obj).show();
                        }
                    },
                    dueStatusList);
            }
        },

        updateLinks: function() {
            if (this.collection.length > 0) {
                var linkDisableStatusList = this.model.get("enforcedOrderedResourceRule");
                if (!_.isUndefined(linkDisableStatusList)) {
                    var learningPathItemTitles = this.$el.find(".scf-linked-resource-title");
                    _.each(learningPathItemTitles,
                        function(obj, index) {
                            var status = this[index];
                            if (!status) {
                                $(obj).removeAttr("href");
                                $(obj).children(".card-image").addClass("disabled-link-card");
                            }
                        },
                        linkDisableStatusList);
                }
            }
        }
    });

    SCF.ItemsListView = ItemsListView;
    SCF.ItemsListModel = ItemsListModel;

})($CQ, _, Backbone, SCF);
