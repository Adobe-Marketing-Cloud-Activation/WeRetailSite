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

    var ResourceCardListModel = SCF.Model.extend({
        modelName: "ResourceCardListModel",
        relationships: {
            "items": {
                collection: "CardList"
            }
        }
    });

    var ResourceCardListView = SCF.ItemsListView.extend({
        viewName: "ResourceCardListView",
        className: "resource-card-list",

        init: function() {
            this.collection = this.model.get("items");
            this.initInfiniScroll();
            this.listenTo(this.collection, "sync", this.onSync);
            this.listenTo(this.model, "change:pageInfo", this.onPageInfoChange);
            SCF.Util.listenTo("searchEnrollments", $.proxy(this.applySearch, this));

            this.checkCurrentUser();
            this.renderDueStatusLabels();
            this.updateLinks();
        },

        afterRender: function() {
            this.updateLinks();
        },

        onSync: function(collection, response) {
            this.model.set("pageInfo", response.pageInfo);
            this.render();
            this.checkCurrentUser();
            this.renderDueStatusLabels();
        },

        onPageInfoChange: function(model, pageInfo) {
            if (pageInfo.currentIndex === 0) {
                this.infiniScroll.enableFetch();
            }
        }
    });

    var CardList = SCF.Collection.extend({
        collectioName: "CardList",
        parse: function(response) {
            return response.items;
        }
    });

    var ResourceCardView = SCF.View.extend({
        viewName: "ResourceCardView"
    });

    var LearningPathCardView = SCF.View.extend({
        viewName: "LearningPathCardView"
    });

    SCF.ResourceCardListModel = ResourceCardListModel;
    SCF.ResourceCardListView = ResourceCardListView;
    SCF.CardList = CardList;
    SCF.ResourceCardView = ResourceCardView;
    SCF.LearningPathCardView = LearningPathCardView;

    SCF.registerComponent("social/enablement/components/hbs/view/resource",
        SCF.Model, SCF.View);
    SCF.registerComponent("social/enablement/components/hbs/view/learningpath",
        SCF.Model, SCF.View);
    SCF.registerComponent("social/enablement/components/hbs/view/learningpath/card-list",
        SCF.ResourceCardListModel, SCF.ResourceCardListView);

    SCF.registerComponent("social/enablement/components/hbs/view/resource/card",
        SCF.Model, SCF.ResourceCardView);
    SCF.registerComponent("social/enablement/components/hbs/view/learningpath/card",
        SCF.Model, SCF.LearningPathCardView);

})($CQ, _, Backbone, SCF);

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

    var ResourceCardListModel = SCF.Model.extend({
        modelName: "ResourceCardListModel",
        relationships: {
            "items": {
                collection: "CardList"
            }
        }
    });

    var ResourceCardListView = SCF.ItemsListView.extend({
        viewName: "ResourceCardListView",
        className: "resource-card-list",

        init: function() {
            this.collection = this.model.get("items");
            this.initInfiniScroll();
            this.listenTo(this.collection, "sync", this.onSync);
            this.listenTo(this.model, "change:pageInfo", this.onPageInfoChange);

            this.checkCurrentUser();
            this.renderDueStatusLabels();
            this.updateLinks();
        },

        afterRender: function() {
            this.updateLinks();
        },

        onSync: function(collection, response) {
            this.model.set("pageInfo", response.pageInfo);
            this.render();
            this.checkCurrentUser();
            this.renderDueStatusLabels();
        },

        onPageInfoChange: function(model, pageInfo) {
            if (pageInfo.currentIndex === 0) {
                this.infiniScroll.enableFetch();
            }
        }
    });

    var CardList = SCF.Collection.extend({
        collectioName: "CardList",
        parse: function(response) {
            return response.items;
        }
    });

    var ResourceCardView = SCF.View.extend({
        viewName: "ResourceCardView"
    });

    var LearningPathCardView = SCF.View.extend({
        viewName: "LearningPathCardView",
        sendPreReqMessage: function() {
            if (!this.model.get("allPrerequisitesCompleted")) {
                var prerequisites = [];
                _.each(this.model.get("unfinishedPrerequisites"), function(prerequisite) {
                    prerequisites.push(prerequisite);
                });
                SCF.Util.announce("showPreReqMessage", {
                    list: prerequisites
                });
            }
        }
    });

    SCF.ResourceCardListModel = ResourceCardListModel;
    SCF.ResourceCardListView = ResourceCardListView;
    SCF.CardList = CardList;
    SCF.ResourceCardView = ResourceCardView;
    SCF.LearningPathCardView = LearningPathCardView;

    SCF.registerComponent("social/enablement/components/hbs/view/resource",
        SCF.Model, SCF.View);
    SCF.registerComponent("social/enablement/components/hbs/view/card-list",
        SCF.ResourceCardListModel, SCF.ResourceCardListView);

    SCF.registerComponent("social/enablement/components/hbs/view/resource/card",
        SCF.Model, SCF.ResourceCardView);
    SCF.registerComponent("social/enablement/components/hbs/view/learningpath/card",
        SCF.Model, SCF.LearningPathCardView);

})($CQ, _, Backbone, SCF);

