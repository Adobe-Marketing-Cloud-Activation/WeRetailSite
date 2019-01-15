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
    var ForgotPassword = SCF.Model.extend({
        modelName: "ForgotPasswordModel",
        events: {
            SUCCESS: "forgotPassword:success",
            ERROR: "forgotPassword:error"
        },
        requestPasswordURL: function(params) {
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
    var ForgotPasswordView = SCF.View.extend({
        viewName: "ForgotPassword",
        tagName: "div",
        className: "scf-forgotpassword-container",
        init: function() {
            this.listenTo(this.model, this.model.events.SUCCESS, this.hideForm);
        },
        hideForm: function() {
            $CQ(".scf-js-forgotpassword-form").toggleClass("scf-is-hidden");
            $CQ(".scf-js-forgotpassword-text").toggleClass("scf-is-hidden");
        },
        requestPasswordURL: function(e) {
            e.preventDefault();
            var params = $CQ(".scf-js-forgotpassword-form form").serializeArray();
            this.model.requestPasswordURL(params);
        }
    });
    SCF.ForgotPassword = ForgotPassword;
    SCF.ForgotPasswordView = ForgotPasswordView;
    SCF.registerComponent("social/console/components/hbs/forgotpassword", SCF.ForgotPassword, SCF.ForgotPasswordView);
    console.log("test");
})($CQ, _, Backbone, SCF);
