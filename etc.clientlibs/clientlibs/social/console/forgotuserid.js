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

(function($CQ, _, Backbone, SCF) {
    "use strict";
    var ForgotUserID = SCF.Model.extend({
        modelName: "ForgotUserIDModel",
        events: {
            SUCCESS: "forgotUserID:success",
            ERROR: "forgotUserID:error"
        },
        requestUserId: function(params) {
            var success = _.bind(function() {
                this.trigger(this.events.SUCCESS, {
                    model: this
                });
            }, this);
            var error = _.bind(function() {
                this.trigger(this.events.ERROR, {
                    model: this
                });
            }, this);
            $.ajax(SCF.config.urlRoot + this.get("id") + SCF.constants.URL_EXT, {
                dataType: "json",
                type: "POST",
                xhrFields: {
                    withCredentials: true
                },
                data: params,
                "success": success,
                "error": error
            });
        }
    });
    var ForgotUserIDView = SCF.View.extend({
        viewName: "ForgotUserID",
        tagName: "div",
        className: "scf-forgotuserid-container",
        init: function() {
            this.listenTo(this.model, this.model.events.SUCCESS, this.hideForm);
        },
        hideForm: function() {
            $CQ(".scf-js-forgotuserid-form").toggleClass("scf-is-hidden");
            $CQ(".scf-js-forgotuserid-text").toggleClass("scf-is-hidden");
        },
        requestUserId: function(e) {
            e.preventDefault();
            var params = $CQ(".scf-js-forgotuserid-form form").serializeArray();
            this.model.requestUserId(params);
        }
    });
    SCF.ForgotUserID = ForgotUserID;
    SCF.ForgotUserIDView = ForgotUserIDView;
    SCF.registerComponent("social/console/components/hbs/forgotuserid", SCF.ForgotUserID, SCF.ForgotUserIDView);
    console.log("test");
})($CQ, _, Backbone, SCF);
