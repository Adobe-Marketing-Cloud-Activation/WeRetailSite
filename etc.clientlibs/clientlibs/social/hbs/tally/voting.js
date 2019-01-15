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

    // jscs:disable requireCamelCaseOrUpperCaseIdentifiers
    window.CQ_Analytics = window.CQ_Analytics || {};
    var cqAnalytics = window.CQ_Analytics;
    // jscs:ensable requireCamelCaseOrUpperCaseIdentifiers

    var Voting = SCF.Model.extend({
        ANALYTICS_BASE_RESOURCE_TYPE: "social/commons/components/analyticsbase",
        modelName: "VotingModel",
        defaults: {
            totalNumberOfResponses: 0,
            netCount: 0,
            positiveCount: 0,
            negativeCount: 0
        },
        _updateVoting: function(newResponse) {
            var previousResponse = this.get("currentUserResponse");
            var netCount = this.get("netCount");
            var positiveCount = this.get("positiveCount");
            var negativeCount = this.get("negativeCount");
            var totalResponses = this.get("totalNumberOfResponses");
            var responseTallies = this.get("responseTallies") || {};
            var currentUserLike;
            var currentUserResponse;
            if (newResponse === "unset") {
                if (previousResponse === "DISLIKE") {
                    netCount = netCount + 1;
                    negativeCount--;
                } else if (previousResponse === "LIKE") {
                    netCount = netCount - 1;
                    positiveCount--;
                }
                totalResponses--;
                currentUserLike = false;
                currentUserResponse = undefined;
            } else if (newResponse == -1) {
                if (previousResponse === "LIKE") {
                    netCount = netCount - 2;
                    negativeCount++;
                    positiveCount--;

                } else {
                    netCount = netCount - 1;
                    negativeCount++;
                    totalResponses++;
                }
                currentUserResponse = "DISLIKE";
                currentUserLike = false;
            } else if (newResponse == 1) {
                if (previousResponse === "DISLIKE") {
                    netCount = netCount + 2;
                    positiveCount++;
                    negativeCount--;
                } else {
                    netCount = netCount + 1;
                    positiveCount++;
                    totalResponses++;
                }
                currentUserResponse = "LIKE";
                currentUserLike = true;
            }
            responseTallies[1] = positiveCount;
            responseTallies[-1] = negativeCount;
            this.set({
                "currentUserResponse": currentUserResponse,
                "currentUserLike": currentUserLike,
                "netCount": netCount,
                "positiveCount": positiveCount,
                "negativeCount": negativeCount,
                "totalNumberOfResponses": totalResponses,
                "responseTallies": responseTallies
            }, {
                silent: true
            });
            if (currentUserResponse === undefined) {
                this.unset("currentUserResponse", {
                    silent: true
                });
            }
        },
        createVoting: function(voting) {
            var url = SCF.config.urlRoot + this.get("id") + SCF.constants.URL_EXT;
            var success = _.bind(function(response) {
                this._updateVoting(voting);
                this.trigger("voting:added", {
                    model: this
                });

                // get sitePath for analytics
                var sitePath = $(".scf-js-site-title").attr("href");
                sitePath = _.isUndefined(sitePath) ? "" : sitePath.substring(0, sitePath.lastIndexOf(".html"));
                this.sitePath = sitePath;

                // id and model of the reply or post that is being voted on
                var votedId = (this.attributes.properties && this.attributes.properties["social:parentid"]) ?
                    this.attributes.properties["social:parentid"] : this.id.split("\/voting")[0];
                var votedModel = SCF.Model.findLocal(votedId);

                // only record the event if there was a currentUserResponse ("LIKE" or "DISLIKE")
                // absence of currentUserResponse indicates that vote was canceled
                if (response.response.currentUserResponse) {
                    var userResponse = response.response.currentUserResponse;
                    var event;

                    if (!_.isUndefined(window._satellite)) {
                        event = userResponse === "LIKE" ? "communities-scf-vote-up" : "communities-scf-vote-down";
                        window._satellite.track(event);
                    } else if (cqAnalytics.Sitecatalyst) {
                        event = userResponse === "LIKE" ? "SCFVoteUp" : "SCFVoteDown";
                        cqAnalytics.record({
                            event: event,
                            values: {
                                "functionType": SCF.Context.communityFunction ?
                                    SCF.Context.communityFunction : votedModel.view.COMMUNITY_FUNCTION,
                                "path": SCF.Context.path ? SCF.Context.path : votedId,
                                "type": SCF.Context.type ? SCF.Context.type : votedModel.get("resourceType"),
                                "ugcTitle": SCF.Context.ugcTitle ? SCF.Context.ugcTitle : "",
                                "siteTitle": SCF.Context.siteTitle ?
                                    SCF.Context.siteTitle : $(".scf-js-site-title").text(),
                                "sitePath": SCF.Context.sitePath ? SCF.Context.sitePath : this.sitePath,
                                "groupTitle": SCF.Context.groupTitle,
                                "groupPath": SCF.Context.groupPath,
                                "user": SCF.Context.user ? SCF.Context.user : SCF.Session.get("authorizableId")
                            },
                            collect: false,
                            componentPath: SCF.constants.ANALYTICS_BASE_RESOURCE_TYPE
                        });
                    }
                }

            }, this);
            var error = _.bind(function(jqxhr, text, error) {
                console.log("error creating vote " + error);
                this.trigger("voting:adderror", {
                    "error": error
                });
            }, this);
            var reqData = {
                "response": voting,
                "tallyType": "Voting",
                ":operation": "social:postTallyResponse"
            };
            var properties = this.get("properties");
            if (properties && typeof properties.useReferrer != "undefined" && properties.useReferrer) {
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
    var VotingView = SCF.View.extend({
        viewName: "Voting",
        tagName: "div",
        className: "voting",
        init: function() {
            this.listenTo(this.model, "voting:added", this.update);
            this.listenTo(this.model, "voting:adderror", this.showError);
        },
        update: function() {
            this.isVoteInProgress = false;
            this.render();
        },
        showError: function(error) {
            console.log(error);
        },
        vote: function(e) {
            if (this.isVoteInProgress) {
                return;
            }
            var el = $CQ(e.target);
            el.addClass("scf-is-disabled");
            var voting = el.attr("data-voting-value");
            this.isVoteInProgress = true;
            this.model.createVoting(voting);
            e.preventDefault();
            return false;
        }
    });
    SCF.Voting = Voting;
    SCF.VotingView = VotingView;
    SCF.registerComponent("social/tally/components/hbs/voting", SCF.Voting, SCF.VotingView);

})(SCF);
