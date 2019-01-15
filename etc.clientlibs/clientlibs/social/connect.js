/*************************************************************************
 *
 * ADOBE CONFIDENTIAL
 * __________________
 *
 *  Copyright 2012 Adobe Systems Incorporated
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
 * 2447US01 - Patent Application - US - 13/648,825
 * 2448US01 - Patent Application - US - 13/648,856
 **************************************************************************/

"use strict";

$CQ.SocialAuth = $CQ.SocialAuth || {};
$CQ.SocialAuth.osgi = $CQ.SocialAuth.osgi || {};
$CQ.SocialAuth.sociallogin = $CQ.SocialAuth.sociallogin || {};
$CQ.SocialAuth.callback = $CQ.SocialAuth.callback || {};
$CQ.SocialAuth.socialconnect = $CQ.SocialAuth.socialconnect || {};

/**
 * Creating or updating an OAuth Provider Config from a Cloud Service config.
 * Create/Updates are done via a POST to the custom POST.jsp.
 * 'this' refers to an instance of a ExtJs Dialog
 * @return Boolean - false to prevent default Dialog submission behavior
 */
$CQ.SocialAuth.osgi.updateOAuthProviderConfig = function() {

    var scopeEls = this.findByType('checkbox');
    var scopeArr = new Array();
    for (var i = 0; i < scopeEls.length; i++) {
        var name = scopeEls[i].name;
        if (name.indexOf("oauth") == -1 && this.getField(name).getValue()) {
            scopeArr.push(name.substring(name.indexOf("/") + 1, name.length));
        }
    }
    var self = this;
    //create or update the OSGI Config with the passed in values
    //calls to a POST.jsp that resides in the current path's resource type component
    //this special POST.jsp uses the config admin API for updates
    var serverResponse = CQ.HTTP.post(CQ.WCM.getPagePath() + "/jcr:content",
        function(opts, success, xhr, response) {
            if (!success) {
                $CQ(".connect-content").prepend("<div style='color:red'>Error in update of OAuth Configuration</div>");

            }
            self.hide();
            CQ.Util.reload();
        }, {
            "_charset_": "utf-8",
            "oauth.client.id": this.getField("./oauth.client.id").getValue(), //the client/app id
            "oauth.client.secret": this.getField("./oauth.client.secret").getValue(), //the client/app secret
            "oauth.create.users": this.getField("./oauth.create.users").getValue(), //create CQ users when done authenticating?
            "oauth.create.users.groups": this.getField("./oauth.create.users.groups").getValue(), //the selected user groups to add new users to (array is a set of strings)
            "oauth.encode.userids": this.getField("./oauth.encode.userids").getValue(), //encode user ids when creating?
            "oauth.config.provider.id": this.getField("./oauth.config.provider.id").getValue(), //the oauth provider setup (facebook-soco,twitter-soco)
            "oauth.scope": scopeArr, //the selected scope (array is a set of strings)
            "oauth.callBackUrl": this.getField("./oauth.callBackUrl").getValue(), //the callback url
            "urlParams": this.getField("./urlParams").getValue() //they are request paramertes explicitly used by url's defined for a plugin. It has nothing to do with osgi config.
        }
    );
    return false;
}

/**
 * Makes a GET request to j_security_check for an Authentication Handler.
 * Currently required is the current page jcr path and an already declared "configid" - an OAuth Provider Configuration created in OSGI.
 * @param currentPagePath - the string value of the current page's path via jcr currentPage.getPath()
 * @param currentConfigId - the string value of a provider configuration
 **/
$CQ.SocialAuth.sociallogin.doOauth = function(dialogId, configResourcePath, currentConfigId, loginSuffix, contextPath) {
    var uid = CQ_Analytics.ProfileDataMgr.getProperty("authorizableId");
    var isLogin = !uid || uid == "anonymous";
    var url;
    if (isLogin) {
        var dialog = $CQ("#" + dialogId);
        if (dialog.length > 0) {
            $CQ("#" + dialogId).dialog('close');
        }
    }
    var url = configResourcePath + '.login.html' + loginSuffix + '?configid=' + currentConfigId;
    if (contextPath) {
        url = contextPath + url;
    }
    window.open(url, "_BLANK", "width=1024,height=630,status=0,menubar=0,toolbar=0,scrollbars=1");
}

$CQ.SocialAuth.sociallogin.showDialog = function(dialogId, dialogOptions) {
    //override defaults
    var options = $.extend({}, {
        height: 200,
        width: 550,
        zIndex: 11000,
        resizable: false,
        modal: true
    }, dialogOptions);
    $CQ("#" + dialogId).dialog(options);
    $CQ(".cqusername").focus();
    //required for modal dialog form inputs pre-jquery ui core 1.8.16 - bug related to logic around disable
    $CQ.ui.dialog.overlay.maxZ = 11000;
}

/**
 * This is called from /libs/social/connect/components/socialconnectpage/callback.html.jsp
 * when the parent window completing the callback has finished its work.
 **/
$CQ.SocialAuth.oauthCallbackComplete = function(userId) {
    $CQ.event.trigger('oauthCallbackComplete', userId);
}

/**
 * Makes a GET request to fetch current user groups from usergroupoptions.json.
 **/
$CQ.SocialAuth.userGroupOptions = function() {
    var response = CQ.HTTP.get(CQ.WCM.getPagePath() + "/jcr:content.usergroupoptions.json");
    if (CQ.utils.HTTP.isOk(response)) {
        var responseBody = response.body;
        var jsonData = JSON.parse(responseBody);
        return jsonData;
    }
    console.log("request for user group options was not ok: " + response.status + " - " + response.body);
    return [];
};

// FUNCTIONS RELATED TO CONNECT

/**
 *    Global variable to keep track of instance of slider button used to connect.
 **/
var socialConnectCurrentSlider = null;

/**
 *    Initiating all slider buttons and attaching toggle function and relevant actions.
 **/
$CQ.SocialAuth.socialconnect.initSliders = function() {
    $CQ('.slider-button').click(function() {
        if ($CQ(this).hasClass('on')) {
            $CQ.SocialAuth.socialconnect.initiateDisconnect(this);
        } else {
            $CQ.SocialAuth.socialconnect.initiateConnect(this);
        }
    });
}

/**
 *    Actions to be taken when user clicks connect. i.e User slides button from "OFF" to "ON";
 *    1) Set the global variable to current slider object.
 *    2) Initiate OAuth.
 **/
$CQ.SocialAuth.socialconnect.initiateConnect = function(sliderObj) {
    if (sliderObj) {
        socialConnectCurrentSlider = $CQ(sliderObj);
        $CQ.SocialAuth.sociallogin.doOauth(null, socialConnectCurrentSlider.attr("data-configpagepath"), socialConnectCurrentSlider.attr("data-configid"),
            socialConnectCurrentSlider.attr("data-loginSuffix"));
    }
}

/**
 *    Called on Successful Auth.
 *    1) Change state of slider from "OFF" to "ON"
 *    2) Show links for name and change.
 **/
$CQ.SocialAuth.socialconnect.completeConnect = function() {
    var sliderObj = socialConnectCurrentSlider;
    if (sliderObj) {
        sliderObj.addClass('on').html(CQ.I18n.getMessage("ON"));
        sliderObj.parents('.channeldetails').find('.connectnamelink').show();
        sliderObj.parents('.channeldetails').find('.connectchangelink').show();
        socialConnectCurrentSlider = null;
    }
}

/**
 *    Actions to be taken when user clicks disconnect. i.e User slides button from "ON" to "OFF"
 **/
$CQ.SocialAuth.socialconnect.initiateDisconnect = function(sliderObj) {
    if (sliderObj) {
        var slider = $CQ(sliderObj);
        if ($CQ.SocialAuth.socialconnect.disconnect(slider.attr("data-socialprofilepath"), slider.attr("data-clientid"))) {
            slider.removeClass('on').html(CQ.I18n.getMessage("OFF"));
            slider.parents("#channeldetails");
            slider.parents('.channeldetails').find('.connectnamelink').hide();
            slider.parents('.channeldetails').find('.connectchangelink').hide();
        }
    }
}

/**
 *    Function to delete node on disconnect.
 *    Deleting token and oauth properties stored under oauth node.
 **/
$CQ.SocialAuth.socialconnect.disconnect = function(socialProfilePath, currentClientId) {

    if (socialProfilePath != null && currentClientId != null) {
        // Deleting <channel> node under profile.
        // .social. selector activates safe POST servlet
        // dispatcher must reject requests without selector .social-force-intercept-drop-selectors-1.
        $CQ.post(socialProfilePath + ".social-force-intercept-drop-selectors-1.", {
            "_charset_": "utf-8",
            ":operation": "delete",
            ":applyTo": socialProfilePath
        }, null);

        var oauthPath = socialProfilePath.replace(/\/profile\/[^\/]*$/, "/oauth");

        var params = {};

        //Deleting relevant oauth and token properties in oauth node.
        var tokenKey = "token-" + currentClientId + "@Delete";
        params[tokenKey] = "deleting token";
        var oauthKey = "oauthid-" + currentClientId + "@Delete";
        params[oauthKey] = "deleting oauth";
        params["_charset_"] = "utf-8";

        $CQ.post(oauthPath + ".social-force-intercept-drop-selectors-1.", params, null);

        return true;
    }
    return false;
};

/**
 *   1) Delets the currently connected account with the channel.
 *   2) Provides dialog for Oauth
 **/
$CQ.SocialAuth.socialconnect.doChange = function(socialProfilePath, configResourcePath, currentConfigId, loginSuffix, currentClientId) {
    $CQ.SocialAuth.socialconnect.disconnect(socialProfilePath, currentClientId);
    $CQ.SocialAuth.sociallogin.doOauth(null, configResourcePath, currentConfigId, loginSuffix);
}
