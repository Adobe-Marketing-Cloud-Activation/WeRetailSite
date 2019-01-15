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

    SCF.LOG_LEVEL = 1;

    var LearningPathViewDetail = SCF.View.extend({
        viewName: "LearningPathViewDetail",

        init: function() {
            this.model.set("localeDateFormat", moment.localeData().longDateFormat("L"), {
                silent: true
            });
        },

        showListView: function() {
            $(".scf-js-cardView").addClass("scf-is-hidden");
            $(".scf-js-listView").removeClass("scf-is-hidden");

            $(".scf-js-card-view-btn").removeClass("btn-primary");
            $(".scf-js-card-view-btn").addClass("btn-default");
            $(".scf-js-list-view-btn").addClass("btn-primary");
        },

        showCardView: function() {
            $(".scf-js-listView").addClass("scf-is-hidden");
            $(".scf-js-cardView").removeClass("scf-is-hidden");

            $(".scf-js-list-view-btn").removeClass("btn-primary");
            $(".scf-js-list-view-btn").addClass("btn-default");
            $(".scf-js-card-view-btn").addClass("btn-primary");
        }
    });

    SCF.LearningPathViewDetail = LearningPathViewDetail;

    SCF.registerComponent("social/enablement/components/hbs/view/learningpath/detail",
        SCF.ResourceCardListModel, SCF.LearningPathViewDetail);
})(SCF);
