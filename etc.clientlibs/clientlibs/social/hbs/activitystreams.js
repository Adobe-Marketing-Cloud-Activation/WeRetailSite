/*
 *
 * ADOBE CONFIDENTIAL
 * __________________
 *
 *  Copyright 2014 Adobe Systems Incorporated
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

    var ActivityStream = SCF.Model.extend({
        modelName: "ActivityStreamModel",
        relationships: {
            "items": {
                collection: "ActivityList",
                model: "ActivityModel"
            }
        }
    });

    var ActivityStreamView = SCF.View.extend({
        viewName: "ActivityStreamView",
        init: function() {
            this.initInfiniScroll();

        },
        initInfiniScroll: function() {
            SCF.log.debug("initInfinitScroll");

            var that = this;
            var baseURI = that.el.baseURI;
            /* I tried to bind to the table but it doesn't look like the table support scolling.
            There is no event callback when the user scroll the body.
            var table = this.$('.social-scrollTableInner');
            $(table).scroll(function(){
                console.log("table scroll");
            });
            $(window).scroll(function(){
                console.log("window scroll");
            });
            */
            /* This happens when we switch view, we need to destroy existing infiniScroll and create a new one */
            if (typeof this.infiniScroll !== "undefined") {
                this.infiniScroll.destroy();
                delete this.infiniScroll;
            }
            this.infiniScroll = new Backbone.InfiniScroll(this.model.get("items"), {
                strict: false,
                pageSize: this.model.get("pageInfo").pageSize,
                // target : table,
                scrollOffset: 400,
                onFetch: function() {
                    // set the url here for infiniScroll to use.
                    var collection = that.model.get("items");

                    var url = that.model.get("pageInfo").nextPageURL;
                    if (url.endsWith(".html")) {
                        url = url.replace(".html", ".json");
                    }
                    /* Check if this is the profile page , if yes , add profile path as suffix
                    This is to make sure that profile's path is added as suffix in the call to
                    make sure current user session;s
                    activites don;t get included in case viewing someone else's profile.*/
                    if (baseURI.endsWith("/profile")) {
                        var profileSuffix = baseURI.split("/profile.html")[1];
                        if (profileSuffix) {
                            url = url + profileSuffix;
                        }
                    }
                    collection.url = url;
                    SCF.log.debug("infiniScroll collection url:" + url);
                },

                success: function(collection, response) {
                    if (typeof response.items !== "undefined") {
                        if (response.items !== null && response.items.length > 0) {
                            // Need to update the model with the new page info
                            that.model.set("pageInfo", response.pageInfo);
                            that.render();
                        }
                    }
                }
            });

        },
        afterRender: function() {
            _.each(this._childViews, function(e) {
                if ((e.createExpander !== void 0)) {
                    e.createExpander();
                }
            });
            // Select the first tab that we display, if none has been select
            var selector = this.model.get("selector");
            if (selector === "ALL") {
                this.$el.find("li.scf-activities-tab:first").addClass("active");
            } else if (selector === "USER") {
                this.$el.find("li.scf-activities-tab:nth(1)").addClass("active");
            } else if (selector === "FOLLOWER") {
                this.$el.find("li.scf-activities-tab:nth(2)").addClass("active");
            }
        },
        update: function() {
            this.render();
        },
        userActivity: function() {
            this.switchView("?filter=selection=USER", ".scf-useractivities");
        },
        allActivity: function() {
            this.switchView("?filter=selection=ALL", ".scf-allactivities");
        },
        followingActivity: function() {
            this.switchView("?filter=selection=FOLLOWER", ".scf-followingactivities");
        },
        switchView: function(filter, activeTabSelector) {
            this.model.url = this.model.id + SCF.constants.URL_EXT + filter;

            var that = this;
            SCF.log.debug("switchView:" + this.model.url);
            this.model.reload({
                success: function() {
                    that.$el.find("li.scf-activities-tab").removeClass("active");
                    that.$el.find(activeTabSelector).parent().addClass("active");
                    // Need to reset inifiniScroll instance to bind to the new collection.
                    that.initInfiniScroll();
                },
                error: function() {
                    SCF.log.error("Error reloading model");
                }
            });
        }
    });

    var Activity = SCF.Model.extend({
        modelName: "ActivityModel"
    });

    var ExpandingViewMixin = {
        "MESSAGES": {
            "EXPAND": CQ.I18n.get("Show more"),
            "COLLAPSE": CQ.I18n.get("Show less")
        },
        createExpander: function() {
            var self = this;
            this.$el.find(".scf-is-expand").each(function(i, o) {
                var $o = $(o);
                if (Math.abs(o.scrollHeight - $o.innerHeight()) > 20) {
                    $o.addClass("scf-hasOverflow");
                    $o.parent().find(".scf-is-expandText").css("display", "block");
                    $o.parent().find(".scf-is-expandText").click(function(e) {
                        e.preventDefault();
                        var $target = $(e.currentTarget);
                        var $overFlowCheck = $target.parent().find(".scf-hasOverflow");
                        if ($overFlowCheck.hasClass("scf-is-expand")) {
                            $target.text(self.MESSAGES.COLLAPSE);
                        } else {
                            $target.text(self.MESSAGES.EXPAND);
                        }
                        $overFlowCheck.toggleClass("scf-is-expand");
                    }).show();
                }
            });
        }

    };

    var ActivityView = SCF.View.extend({
        viewName: "ActivityView",

        init: function() {
            this.listenTo(this.model, "model:loaded", function() {
                this._modelReady = true;
                this.update();
            });
            this.createExpander();
        },
        update: function() {
            this.render();
        }
    }).extend(ExpandingViewMixin);

    var ActivityList = SCF.Collection.extend({
        collectioName: "ActivityList",
        parse: function(response) {
            SCF.log.debug("collection parse");
            return response.items;
        }
    });

    SCF.ActivityStream = ActivityStream;
    SCF.ActivityStreamView = ActivityStreamView;
    SCF.Activity = Activity;
    SCF.ActivityView = ActivityView;
    SCF.ActivityList = ActivityList;
    SCF.registerComponent("social/activitystreams/components/hbs/activitystreams/activity",
        SCF.Activity, SCF.ActivityView);
    SCF.registerComponent("social/activitystreams/components/hbs/activitystreams", SCF.ActivityStream,
        SCF.ActivityStreamView);
    if (typeof String.prototype.endsWith !== "function") {
        String.prototype.endsWith = function(suffix) {
            return this.indexOf(suffix, this.length - suffix.length) !== -1;
        };
    }
})($CQ, _, Backbone, SCF);
