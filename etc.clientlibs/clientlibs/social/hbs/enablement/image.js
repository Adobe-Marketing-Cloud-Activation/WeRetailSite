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
(function(SCF) {
    "use strict";
    var ImageResource = SCF.ResourcePlayer.extend({
        modelName: "ImageResourceModel",
        setResourceInProgress: function() {
            /*
             * Since images are immediately "completed" as soon as we view them, there's no reason to send a call
             * to the server to set the image status as "in progress".
             */
        },
        setResourceNotAttempted: function() {
            /*
             * Since images are immediately "completed" as soon as we view them, there's no reason to send a call
             * to the server to set the image status as "not attempted".
             */
        }
    });
    var ImageResourceView = SCF.ResourcePlayerView.extend({
        viewName: "ImageResource",
        className: "image-asset",
        initDisplay: function() {
            /*
             * Override the parent 'initDisplay' method so that we render the image asset immediately instead of the
             * cover image with play button.
             */
            this.showAsset();
            this.model.setResourceCompleted();

            this.trackAnalyticsResourcePlay(true);
        }
    });

    SCF.ImageResource = ImageResource;
    SCF.ImageResourceView = ImageResourceView;
    SCF.registerComponent("social/enablement/components/hbs/view/resource/detail/resourceplayer", SCF.ImageResource,
        SCF.ImageResourceView);

})(SCF);
