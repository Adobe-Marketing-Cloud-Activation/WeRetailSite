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

    var ResourceCardView = SCF.View.extend({
        viewName: "ResourceCardView",

        showBanner: function(evt) {
            if (!$(evt.target).closest("a").attr("href")) {
                $(".scf-js-prerequisites-needed").show().delay(3000).fadeOut();
                $(".scf-js-enforce-order-message").show().delay(3000).fadeOut();
            }
        }
    });

    SCF.ResourceCardView = ResourceCardView;

    SCF.registerComponent("social/enablement/components/hbs/view/resource/card",
        SCF.Model, SCF.ResourceCardView);
})(SCF);
