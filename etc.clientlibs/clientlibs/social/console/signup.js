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
(function(SCF, $CQ) {
    "use strict";
    var SignUp = SCF.Model.extend({
        modelName: "SignUpModel",
        createUser: function(params) { // jshint ignore:line
            var success = _.bind(function() {
                this.trigger("signup:success", {
                    model: this
                });
            }, this);
            var error = _.bind(function(jqxhr) {
                this.trigger("signup:error", jqxhr.responseJSON.error);
            }, this);
            if (this.get("allowCaptcha")) {
                // use jquery grep to look up captcha and captchaKey objects references
                // in the params array
                var captchaObject = $CQ.grep(params, function(obj, index) {
                    return obj.name === ":cq:captcha";
                });
                var captchaKeyObject = $CQ.grep(params, function(obj, index) {
                    return obj.name === ":cq:captchakey";
                });
                if (captchaObject.length && captchaKeyObject.length) {
                    // captchaObject and captchaKeyObject are technincally arrays
                    // containing a single object
                    if (_.isEmpty(captchaObject[0].value) || _.isEmpty(captchaKeyObject[0].value)) {
                        var captchaError = {
                            message: "Missing Captcha"
                        };
                        this.trigger("signup:error", captchaError);
                        return;
                    }
                    // both captcha parameter names need to be changed
                    captchaObject[0].name = "captcha";
                    captchaKeyObject[0].name = "captchakey";
                }
            }
            var postData = params;
            postData.push({
                name: ":operation",
                value: "social:createTenantUser"
            });
            postData.push({
                name: "_charset_",
                value: "UTF-8"
            });
            $.ajax(SCF.config.urlRoot + this.get("id") + SCF.constants.URL_EXT, {
                dataType: "json",
                type: "POST",
                xhrFields: {
                    withCredentials: true
                },
                data: postData,
                "success": success,
                "error": error
            });
        },
        resendEmail: function(params) { // jshint ignore:line
            var success = _.bind(function() {
                this.trigger("resend:success", {
                    model: this
                });
            }, this);
            var error = _.bind(function(jqxhr) {
                this.trigger("resend:error", jqxhr.responseJSON.error);
            }, this);
            var postData = params;
            postData.push({
                name: ":operation",
                value: "social:resendEmailValidation"
            });
            $.ajax(SCF.config.urlRoot + this.get("id") + SCF.constants.URL_EXT, {
                dataType: "json",
                type: "POST",
                xhrFields: {
                    withCredentials: true
                },
                data: postData,
                "success": success,
                "error": error
            });
        }
    });
    var SignUpView = SCF.View.extend({
        viewName: "SignUp",
        tagName: "div",
        className: "scf-signup-container",
        tempRatingBarWidth: null,
        userNameContainerSel: ".scf-username-container",
        init: function() {
            this.listenTo(this.model, "signup:success", this.update);
            this.listenTo(this.model, "signup:error", this.showError);
            this.$el.find(".form_captcha_refresh input").val(CQ.I18n.get("Refresh"));
            this.listenTo(this.model, "resend:success", this.resendSuccess);
            this.listenTo(this.model, "resend:error", this.resendError);
        },
        showError: function(error) {
            this.log.error(error);
            $CQ(".scf-js-signup-error").text(CQ.I18n.get(error.message)).show();
        },
        update: function() {
            this.log.info("registration successful");
            $CQ(".scf-js-signup-form").hide();
            $CQ(".scf-js-signup-success").show();
        },
        register: function(e) {
            e.preventDefault();
            if (this.comparePasswordFileds()) {
                $CQ(".scf-js-signup-error").text("").hide();
                var params = $CQ(".scf-js-signup-form").serializeArray();
                this.model.createUser(params);
            } else {
                $CQ(".scf-js-signup-error").text(CQ.I18n.get("Password fields do not match")).show();
            }

            return false;
        },
        cancel: function(e) {
            e.preventDefault();
            window.location.href = this.model.attributes.homePageUrl;
            return false;
        },
        confirmPassword: function(e) {
            e.preventDefault();
            var parentFormGroup = $CQ(e.target).parents(".form-group")[0];
            if (this.comparePasswordFileds()) {
                $CQ(parentFormGroup).removeClass("has-error");
            } else {
                $CQ(parentFormGroup).addClass("has-error");
            }
        },
        comparePasswordFileds: function() {
            return $CQ(".scf-js-password").val() === $CQ(".scf-js-confirm-password").val();
        },
        toggleUserName: function(e) {
            // if checked display user name, otherwise cleaar and hide user name
            var toggleEl = e.target;
            if ($CQ(toggleEl).is(":checked")) {
                $CQ(this.userNameContainerSel).find("input[type=\"text\"]").val("");
                $CQ(this.userNameContainerSel).removeClass("required").hide();
            } else {
                $CQ(this.userNameContainerSel).addClass("required").show();
            }
        },
        resend: function(e) {
            e.preventDefault();
            $CQ(".scf-js-resend-error").text("").hide();

            var params = $CQ(".scf-js-resend-form").serializeArray();
            this.model.resendEmail(params);

            return false;
        },
        resendError: function(error) {
            this.log.error(error);
            $CQ(".scf-js-resend-error").text(error.message).show();
        },
        resendSuccess: function() {
            this.log.info("resend email successful");
            $CQ(".scf-js-resend-form").hide();
            $CQ(".scf-js-resend-success").show();
        }
    });
    SCF.SignUp = SignUp;
    SCF.SignUpView = SignUpView;

    SCF.registerComponent("social/console/components/hbs/signup", SCF.SignUp, SCF.SignUpView);

})(SCF, $CQ);
