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
(function($CQ, SCF) {
    "use strict";
    var beenUpdated = false;
    var numCrumbs = 0;
    var origTitle = "";
    var updateCrumbs = function(data) {
        var crumbs = data.crumbs;
        var crumbsContainerEl = $CQ(".scf-js-site-breadcrumbs");
        var activeCrumb = $CQ(crumbsContainerEl).find("li:last");
        $CQ(activeCrumb).remove();
        if (!beenUpdated) {
            origTitle = $CQ(activeCrumb).text();
            beenUpdated = true;
            numCrumbs = $CQ(crumbsContainerEl).find("li").length - 1;
        } else {
            var staleCrumbs = numCrumbs == -1 ? $CQ(crumbsContainerEl).find("li") : $CQ(crumbsContainerEl).find(
                "li:gt(" + numCrumbs + ")");
            staleCrumbs.remove();
        }
        for (var i = 0; i < crumbs.length; i++) {
            var crumb = crumbs[i];
            var crumbEl = $CQ("<li></li>");
            var title = i === 0 ? origTitle : crumb.title;
            if (crumb.active) {
                crumbEl.text(title).addClass("active");
            } else {
                var anchor = $CQ("<a></a>").text(title).attr("href", crumb.url);
                crumbEl.append(anchor);
            }
            $CQ(crumbsContainerEl).append(crumbEl);
        }
    };
    SCF.Util.listenTo("crumbs", updateCrumbs);
})($CQ, SCF);
