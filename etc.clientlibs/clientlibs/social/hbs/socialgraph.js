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
/*
(function(SCF) {
    "use strict";

    var Follows = SCF.Model.extend({
        modelName: "FollowsModel",

    });
    var FollowingsView = SCF.View.extend({
        viewName: "Follows",
        tagName: "div",
        className: "follows",

        showError: function(error) {
            SCF.log.error(error);
        }
    });
    SCF.Follows = Follows;
    SCF.FollowsView = FollowsView;

    SCF.registerComponent("social/socialgraph/components/hbs/follows", SCF.Follows, SCF.FollowsView);

})(SCF);
*/

(function(window, document, Granite, $) {
    "use strict";
    $(document).ready(function() {});
})(window, document, Granite, Granite.$);

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
    /* jshint camelcase:false */
    window.CQ_Analytics = window.CQ_Analytics || {};
    var cqAnalytics = window.CQ_Analytics;
    /* jshint camelcase:true */

    var Follow = SCF.Model.extend({
        modelName: "FollowModel",
        FOLLOW_OPERATION: "social:follow",
        UNFOLLOW_OPERATION: "social:unfollow",
        events: {
            FOLLOWED: "following:followed",
            UNFOLLOWED: "following:unfollowed",
            UPDATE_ERROR: "following:updateError"
        },
        toggle: function() {
            /*jshint maxcomplexity:20 */
            var success = _.bind(function(response) {

                /*
                 * Follow model contains followed object that immediately provides
                 * access to resourceType and id of the ugc being followed
                 */
                var followedType = this.get("followedResourceType");
                var followedId = this.get("followedId");
                var userId = this.attributes.user.authorizableId;
                var sitePath = $(".scf-js-site-title").attr("href");
                sitePath = _.isUndefined(sitePath) ? "" : sitePath.substring(0, sitePath.lastIndexOf(".html"));
                this.sitePath = sitePath;

                // this object allows access to model and view of the component being followed
                var ugcTitle = "";
                var followEventName = "";
                var followedCommunityFunction = followedType;
                if (followedType in SCF.loadedComponents) {
                    var followedComponent = SCF.loadedComponents[followedType][followedId];
                    ugcTitle = followedComponent.model.get("subject") ? followedComponent.model.get("subject") : "";
                    followEventName = followedComponent.view.FOLLOW_EVENT ? followedComponent.view.FOLLOW_EVENT : "";
                    followedCommunityFunction = followedComponent.view.COMMUNITY_FUNCTION ?
                        followedComponent.view.COMMUNITY_FUNCTION : followedType;
                }

                var following = response.response;
                var isFollowed = following.isFollowed;
                this.set("isFollowed", following.isFollowed);
                this.trigger((isFollowed) ? this.events.FOLLOWED : this.events.UNFOLLOWED, {
                    model: this
                });

                /*
                 * Record follow event
                 * When or if all tracked components actually inherit from one source
                 * might be a good idea to move this into a recordFollow function of that
                 * source component and call it from here
                 */

                if (isFollowed && followEventName.length > 0) {

                    if (!_.isUndefined(window._satellite)) {
                        window._satellite.track("communities-scf-follow");
                    } else if (cqAnalytics.Sitecatalyst) {
                        cqAnalytics.record({
                            //Event name retrieved from followed component's view
                            event: followEventName,
                            values: {
                                "functionType": SCF.Context.communityFunction ?
                                    SCF.Context.communityFunction : followedCommunityFunction,
                                "path": SCF.Context.path ? SCF.Context.path : followedId,
                                "type": SCF.Context.type ? SCF.Context.type : followedType,
                                "ugcTitle": SCF.Context.ugcTitle ? SCF.Context.ugcTitle : ugcTitle,
                                "siteTitle": SCF.Context.siteTitle ?
                                    SCF.Context.siteTitle : $(".scf-js-site-title").text(),
                                "sitePath": SCF.Context.sitePath ? SCF.Context.sitePath : this.sitePath,
                                "groupTitle": SCF.Context.groupTitle,
                                "groupPath": SCF.Context.groupPath,
                                "user": SCF.Context.user ? SCF.Context.user : userId
                            },
                            collect: false,
                            componentPath: SCF.constants.ANALYTICS_BASE_RESOURCE_TYPE
                        });
                    }
                }
            }, this);
            var error = _.bind(function(jqxhr, text, error) {
                SCF.log.error("error toggle follow state %o", error);
                this.trigger(this.events.UPDATE_ERROR, {
                    "error": error
                });
            }, this);
            var isFollowed = this.get("isFollowed");
            var id = this.get("id");
            var encodeId = (id.indexOf("@") > -1) ? encodeURIComponent(id) : encodeURI(id);
            if (encodeId.indexOf("/") !== 0) {
                encodeId = "/" + encodeId;
            }
            var url = SCF.config.urlRoot + encodeId + SCF.constants.URL_EXT;
            $CQ.ajax(url, {
                dataType: "json",
                type: "POST",
                xhrFields: {
                    withCredentials: true
                },
                data: {
                    ":operation": (isFollowed) ? this.UNFOLLOW_OPERATION : this.FOLLOW_OPERATION,
                    "followedId": this.get("followedId"),
                    "userId": this.get("user").id
                },
                "success": success,
                "error": error
            });
        }
    });
    var FollowView = SCF.View.extend({
        viewName: "FollowView",
        init: function() {
            this.listenTo(this.model, this.model.events.FOLLOWED, this.follow);
            this.listenTo(this.model, this.model.events.UNFOLLOWED, this.unfollow);
            this.listenTo(this.model, this.model.events.UPDATE_ERROR, this.showError);
        },
        follow: function() {
            this.render();
        },
        unfollow: function() {
            this.render();
        },
        update: function() {
            this.render();
        },
        showError: function(error) {
            SCF.log.error(error);
        },
        toggleFollow: function(e) {
            this.clearErrorMessages();
            this.model.toggle({});
            e.preventDefault();
            return false;
        }
    });
    SCF.Follow = Follow;
    SCF.FollowView = FollowView;

    SCF.registerComponent("social/socialgraph/components/hbs/following", SCF.Follow, SCF.FollowView);

})(SCF);

