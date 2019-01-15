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

    var CatalogToolbarView = SCF.View.extend({
        viewName: "CatalogToolbarView",

        events: {
            "change .scf-selectable-filter": "filterChanged",
            "change .scf-selectable-sortby": "sortbyChanged",
            "keyup .scf-catalog-search": "searchChanged",
            "click .scf-query-clear": "clearQuery"
        },

        query: {},

        initialize: function() {

            var insertStr = "<li><a href='#'>";
            insertStr += "<input type='checkbox' class='scf-selectable-filter' data-value='XVALUEX'>";
            insertStr += "&nbsp&nbsp XLABELX</input></a></li>";

            var allTags = this.model.get("allCatalogTags");
            if (allTags) {
                $.each(allTags, function(key, value) {

                    var tmpStr = insertStr.replace("XLABELX", value).replace("XVALUEX", key);
                    $(".scf-catalog-tag").append(tmpStr);
                });
            }
        },

        clearQuery: function() {

            $("input.scf-catalog-search").val("");

            $("input:checked").each(function() {
                $(this).prop("checked", false);
            });

            this.query = {};
            this.applyQuery();
        },

        filterChanged: function(evt) {

            var target = $(evt.currentTarget);
            var queryProperty = target.parents(".scf-query-selector").data("property");
            // var queryType = target.parents(".scf-query-selector").data("type");
            var queryOperation = target.parents(".scf-query-selector").data("operation");
            if (typeof queryOperation === "undefined") {
                queryOperation = "or";
            }

            if (typeof this.query.filter === "undefined") {
                this.query.filter = {};
            }

            if (typeof this.query.filter[queryProperty] === "undefined") {
                this.query.filter[queryProperty] = [];
            }

            if (target.is(":checked")) {
                this.query.filter[queryProperty].push(target.data("value"));
            } else {
                var indx = this.query.filter[queryProperty].indexOf(target.data("value"));
                this.query.filter[queryProperty].splice(indx, 1);
                if (this.query.filter[queryProperty].length < 1) {
                    delete this.query.filter[queryProperty];
                }
            }

            this.applyQuery();
        },

        searchChanged: function() {
            var searchText = $(".scf-catalog-search").val();

            if (typeof this.query.search === "undefined") {

                this.query.search = {};
                this.query.search.filter = "true";
                this.query.search.searchProps = ["se_resource-name", "se_description", "se_contacts/*/se_userEmail",
                    "se_contacts/*/se_userId", "se_contacts/*/se_userName", "se_experts/*/se_userEmail",
                    "se_experts/*/se_userId", "se_experts/*/se_userName", "se_authors/*/se_userEmail",
                    "se_authors/*/se_userId", "se_authors/*/se_userName"
                ];
            }

            this.query.search.searchText = searchText;
            this.applyQuery();
        },

        sortbyChanged: function(evt) {

            var target = $(evt.currentTarget);
            var sortValue = target.data("value");

            $("input.scf-selectable-sortby:checked").each(function() {
                if (this !== evt.currentTarget) {
                    $(this).prop("checked", false);
                }
            });

            if (typeof this.query.sortby === "undefined") {
                this.query.sortby = {};
                this.query.sortby.sortby = true;
            }

            if (target.is(":checked")) {
                this.query.sortby.value = sortValue;
            } else {
                this.query.sortby.value = "";
            }

            this.applyQuery();
        },

        applyQuery: function() {

            // console.log(JSON.stringify(this.query, null, "\t"));

            var collection = this.model.get("items");

            if (collection !== undefined) {
                var url = this.model.get("pageInfo").urlpattern.replace("${startIndex}", "0")
                    .replace(".html", ".json");

                var separator = url.indexOf("?") !== -1 ? "&" : "?";
                var queryString = "";
                queryString = this.parameterizeSearch(queryString);
                queryString = this.parameterizeFilter(queryString);
                queryString = this.parameterizeSortBy(queryString);

                // console.log(queryString);

                url = url + separator + queryString;
                collection.url = url;

                var that = this;
                collection.fetch({
                    success: function(collection, response) {
                        if (response.items !== undefined && response.items.length > 0) {
                            // Need to update the model with the new page info
                            that.model.set("pageInfo", response.pageInfo);
                        }
                    },
                    reset: true
                });
            } else {
                SCF.log.error("No collection found for itemlist component");
            }
        },

        parameterizeSearch: function(queryString) {

            if (typeof this.query.search === "undefined") {
                return queryString;
            }

            if (this.query.search.searchText.length < 1) {
                return queryString;
            }

            if (queryString.length > 0) {
                queryString += "&";
            }

            queryString += $.param(this.query.search);

            return queryString;
        },

        parameterizeFilter: function(queryString) {

            if (typeof this.query.filter === "undefined") {
                return queryString;
            }

            if (queryString.length > 0) {
                queryString += "&";
            }

            queryString += "filter=true&";
            queryString += $.param(this.query.filter);

            return queryString;
        },

        parameterizeSortBy: function(queryString) {

            if (typeof this.query.sortby === "undefined") {
                return queryString;
            }

            if (this.query.sortby.value === "") {
                return queryString;
            }

            if (queryString.length > 0) {
                queryString += "&";
            }

            queryString += "sortby=";
            queryString += this.query.sortby.value;

            return queryString;
        }
    });

    SCF.CatalogToolbarView = CatalogToolbarView;
    SCF.registerComponent("social/enablement/components/hbs/view/catalog/toolbar", SCF.Model, SCF.CatalogToolbarView);
})($CQ, _, Backbone, SCF);
