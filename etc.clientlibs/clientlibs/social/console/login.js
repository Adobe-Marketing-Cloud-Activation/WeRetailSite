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

(function(window, document, Granite, $, SCF) {
    "use strict";
    $(document).ready(function() {
        $(".scf-fb-login, .scf-tw-login").on("click", function() {
            var oauth = $(this).data("oauth");
            var cloudConfigPath = $(this).data("oauthpath");
            var pathId = $(this).data("pathid");
            var contextPath = $(this).data("contextpath");
            var loginSuffix = $(this).data("loginsuffix");
            //$CQ.SocialAuth.sociallogin.doOauth(pathId ,cloudConfigPath ,oauth , loginSuffix, contextPath);
            $CQ.SocialAuth.sociallogin.doOauth("shouldntExistDomElementId", cloudConfigPath, oauth, loginSuffix, contextPath);
            return false;
        });

        $CQ(document).bind('oauthCallbackComplete', function(ev, userId) {
            CQ_Analytics.ProfileDataMgr.loadProfile(userId);
            var redirecturl = $CQ(".scf-social-login").data("redirecturl");
            CQ.shared.Util.reload(null, redirecturl);
        });

        if (SCF && SCF.Session) {
            SCF.Session.on("model:loaded", function() {
                if (SCF.Session.get("loggedIn") === true) {
                    var scriptHolder = $CQ(".scf-js-login-container").parent().find("script[type=\"application/json\"]");
                    if (scriptHolder.length) {
                        var modelText = $CQ(scriptHolder[0]).text();
                        var model = JSON.parse(modelText);
                        if (model.redirectUrl) {
                            CQ.shared.Util.reload(null, model.redirectUrl);
                        }
                    }
                }
            });
        }
    });
})(window, document, Granite, Granite.$, SCF);
