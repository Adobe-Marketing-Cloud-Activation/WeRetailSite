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
(function(SCF) {
    "use strict";

    SCF.LOG_LEVEL = 1;

    var ToolbarView = SCF.View.extend({

        viewName: "ToolbarView",

        startSearching: function() {
            var searchText = $(".scf-myassigned-search-inp").val();

            var parameters = {
                "filter": true,
                "searchText": searchText,
                "searchProps": ["se_resource-name", "se_description", "se_contacts/*/se_userEmail",
                    "se_contacts/*/se_userId", "se_contacts/*/se_userName", "se_experts/*/se_userEmail",
                    "se_experts/*/se_userId", "se_experts/*/se_userName", "se_authors/*/se_userEmail",
                    "se_authors/*/se_userId", "se_authors/*/se_userName"
                ]
            };

            SCF.Util.announce("searchEnrollments", {
                params: parameters
            });
        },

        toggleView: function() {
            $(".scf-view-toggle-button .btn").toggleClass("active");

            if ($(".btn-primary").size() > 0) {
                $(".scf-view-toggle-button .btn").toggleClass("btn-primary");
            }

            $(".scf-view-toggle-button .btn").toggleClass("btn-default");

            if ($("#grid-view-button").hasClass("active")) {
                $(".scf-grid-view").show();
                $(".scf-list-view").hide();
            } else {
                $(".scf-grid-view").hide();
                $(".scf-list-view").show();
                SCF.Util.announce("reportRefreshTable");
            }
        }
    });

    SCF.ToolbarView = ToolbarView;
    SCF.registerComponent("social/enablement/components/hbs/view/myassigned/toolbar", SCF.Model, SCF.ToolbarView);
})(SCF);
