/*************************************************************************
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
 *
 *************************************************************************/
(function($CQ, _, Backbone, SCF) {
    "use strict";

    SCF.LOG_LEVEL = 1;

    var MyAssignedModel = SCF.Model.extend({
        modelName: "MyAssignedModel",
        relationships: {
            "items": {
                collection: "CardList",
                model: "CardModel"
            }
        }
    });

    var MyAssignedView = SCF.View.extend({
        viewName: "MyAssignedView",
        init: function() {
            SCF.Util.listenTo("showPreReqMessage", $.proxy(this.generatePreReqMessage,
                this));
            SCF.Util.listenTo("searchEnrollments", $.proxy(this.applySearch, this));
        },
        applySearch: function(params) {
            var collection = this.model.get("items");

            if (collection !== undefined) {
                var url = this.model.get("pageInfo").urlpattern.replace("${startIndex}", "0")
                    .replace(".html", ".json");

                var separator = url.indexOf("?") !== -1 ? "&" : "?";
                url = url + separator + $.param(params.params);
                collection.url = url;

                var that = this;
                collection.fetch({
                    success: function(collection, response) {
                        if (response.items !== undefined && response.items.length >
                            0) {
                            // Need to update the model with the new page info
                            that.model.set("pageInfo", response.pageInfo);
                        }
                    },
                    reset: true
                });
            } else {
                SCF.log.error("No collection found for my assigned component");
            }
        },
        generatePreReqMessage: function(data) {
            var links = $("<span></span>");
            for (var i = 0; i < data.list.length; i++) {
                var preReq = data.list[i];
                var link = $("<a/>");
                link.attr("href", SCF.Util.getContextPath() + ".learningpath.html" + preReq.id);
                link.text(preReq.title);
                links.append(link);
                if (i !== data.list.length - 1) {
                    links.append(", ");
                }
            }
            $(".scf-prerequisites-list").html(links);
            $(".scf-js-prerequisites-needed").show().delay(7500).fadeOut();
        }
    });

    SCF.MyAssignedModel = MyAssignedModel;
    SCF.MyAssignedView = MyAssignedView;

    SCF.registerComponent("social/enablement/components/hbs/view/myassigned", SCF.MyAssignedModel,
        SCF.MyAssignedView);
})($CQ, _, Backbone, SCF);
