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
$CQ(document).ready(function() {
    var initQuicksearch = function(el_selector) {
        var $el = $(el_selector);
        $el.autocomplete({
            source: function(request, response) {
                $.get(getUrl("*" + $CQ(el_selector).val() + "*"), function(data) {
                    var results = data.items;
                    response(results);
                });
            },
            minLength: 3,
            appendTo: ".scf-quicksearch-form-group",
            position: {
                my: "right top",
                at: "right bottom"
            },
            focus: function(event, ui) {
                event.preventDefault();
                $(this).val(getTitle(ui.item));
            },
            change: function(event, ui) {},
            select: function(event, ui) {
                var keycode = (event.keyCode ? event.keyCode : event.which);
                if (keycode === 13) {
                    window.location.replace(ui.item.friendlyUrl);
                }
            },
            setvalue: function(value) {}
        }).data("uiAutocomplete")._renderItem = function(ul, item) {
            return $CQ("<li class='scf-quicksearch-item-container'></li>").append("<a href='" + item.friendlyUrl + "'><span class='glyphicon scf-icon-" + getIconClassName(item.resourceType) + "' aria-hidden='true'></span><span class='scf-quicksearch-item'>" + getTitle(item) + "</span><span class='small scf-quicksearch-item-url'>" + item.friendlyUrl + "</span></a>").data("item.autocomplete", item).appendTo(ul);
        };
        $("#scf-js-quicksearch-input-inline").keypress(function(event) {
            var keycode = (event.keyCode ? event.keyCode : event.which);
            if (keycode === 13) {
                event.preventDefault();
                var currentPage = window.location.href;
                // Add current url to backbone history without navigating - to aid proper functioning of browser's back button.
                SCF.Router.navigate(currentPage, {
                    trigger: false
                });
                var form = $("#form-search-input-inline");
                var resultPage = form.find(".scf-js-seach-resultPage").val();
                var filter = getFilter($CQ(this).val(), true);
                var contextPath = CQ.shared.HTTP.getContextPath();
                var url = resultPage + ".html?tzOffset=" + (new Date().getTimezoneOffset()) + "&" + filter;
                window.location.replace(url);
            }
        });
    };
    var getTitle = function(itemObj) {
        /*
         * Most resource types have their title stored in subject property.
         * Folder has it in name property.
         * Replies, comments, answers don't have title - for now display last of resource type.
         */
        var title = (itemObj.subject && itemObj.subject.length > 0) ? itemObj.subject : (itemObj.name && itemObj.name.length > 0) ? itemObj.name : itemObj.resourceType.split("/")[itemObj.resourceType.split("/").length - 1];
        return title;
    };
    var getIconClassName = function(str) {
        return str.replace(/\//g, "-");
    };
    var getUrl = function(value) {
        var url = $CQ(".scf-js-search-endpoint").val() + ".social.json?" + getFilter(value);
        return url;
    };
    var getFilter = function(value, isRegularSearch) {
        var filter = "";
        var paths = $CQ(".scf-js-searchform").data("paths");
        var searchPaths;
        if (typeof(paths) !== 'undefined' && paths !== null && paths.length > 0) {
            paths = paths.substring(1, paths.length - 1); // remove '[' and ']'
            searchPaths = paths.split(',');
        }
        value = value.trim();
        value = value.replace(/,/gi, '\\,');
        if (value && value.length > 0) {
            filter = "filter=jcr:title like '" + encodeURIComponent(value) + "'";
            filter += (filter.length > 0) ? ", " : "filter=";
            filter += "author_display_name like '" + encodeURIComponent(value) + "'";

            // when focusing in search filed and pressing Enter (not quikcsearch mode)
            // need to also search on tag and description
            if (isRegularSearch) {
                filter += ", jcr:description like '" + encodeURIComponent(value) + "'";
                filter += ", tag like '" + encodeURIComponent(value) + "'";
            }
            filter += "&expLanguage=" + "default";
            filter += "&searchText=" + encodeURIComponent(value);
        }
        if (typeof(searchPaths) != 'undefined') {
            for (i = 0; i < searchPaths.length; i++) {
                filter += "&path=" + searchPaths[i].trim();
            }
        }
        var contextPath = CQ.shared.HTTP.getContextPath();
        contextPath = (contextPath !== null && contextPath.length > 0) ? contextPath : CQ.shared.HTTP.getPath();
        filter += "&_charset_=utf-8";
        return filter;
    };
    if ($CQ("#scf-js-quicksearch-input-inline").length !== 0) {
        initQuicksearch($CQ("#scf-js-quicksearch-input-inline"));
    }
});
