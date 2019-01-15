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
    var Liking = SCF.Model.extend({
        ANALYTICS_BASE_RESOURCE_TYPE: "social/commons/components/analyticsbase",
        modelName: "LikingModel",
        defaults: {
            totalNumberOfResponses: 0,
            likeCount: 0
        },
        _updateLiking: function(newResponse) {
            var _data = newResponse.response;
            var currentUserLike = _data.currentUserLike;
            var likeCount = _data.likeCount;
            var responseTallies = this.get("responseTallies") || {};
            if (_data.currentUserResponse === "LIKE") {
                currentUserLike = true;
            } else {
                currentUserLike = false;
            }
            responseTallies[1] = likeCount;
            this.set({
                "likeCount": likeCount,
                "currentUserLike": currentUserLike
            });
        },
        createLiking: function(liking) {
            var url = SCF.config.urlRoot + this.get("id") + SCF.constants.URL_EXT;
            var success = _.bind(function(response) {
                this._updateLiking(response);
                this.trigger("liking:added", {
                    model: this
                });

            }, this);
            var error = _.bind(function(jqxhr, text, error) {
                this.trigger("liking:adderror", {
                    "error": error
                });
            }, this);
            var reqData = {};
            reqData.response = liking;
            reqData.tallyType = "Liking";
            reqData[":operation"] = "social:postTallyResponse";
            var properties = this.get("properties");
            if (properties && typeof properties.useReferrer !== "undefined" && properties.useReferrer) {
                reqData.referer = window.location.href;
            }
            $.ajax(url, {
                dataType: "json",
                type: "POST",
                xhrFields: {
                    withCredentials: true
                },
                data: reqData,
                "success": success,
                "error": error
            });
        }
    });
    var LikingView = SCF.View.extend({
        viewName: "Liking",
        tagName: "div",
        className: "liking",
        init: function() {
            this.listenTo(this.model, "liking:added", this.update);
            this.listenTo(this.model, "liking:adderror", this.showError);
            this.updateTooltip();
        },
        update: function() {
            this.render();
            this.updateTooltip();
        },
        updateTooltip: function() {
            $("[data-toggle=\"tooltip\"]").tooltip();
        },
        showError: function(error) {
            console.log(error);
        },
        like: function(e) {
            var el = $CQ(e.target);
            var _currLike = el.attr("data-liking-value");
            var _newLike = _currLike;
            if (_currLike === "-1") {
                _newLike = "1";
            } else {
                _newLike = "-1";
            }

            this.model.createLiking(_newLike);
            e.preventDefault();
            return false;
        }
    });
    SCF.Liking = Liking;
    SCF.LikingView = LikingView;
    SCF.registerComponent("social/tally/components/hbs/liking", SCF.Liking, SCF.LikingView);
})(SCF);
