/*************************************************************************
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
 *
 *************************************************************************/
(function($CQ, _, Backbone, SCF) {
    "use strict";

    SCF.LOG_LEVEL = 1;

    var CatalogModel = SCF.Model.extend({
        modelName: "CatalogModel",
        relationships: {
            "items": {
                collection: "CardList",
                model: "CardModel"
            }
        }
    });

    var CatalogView = SCF.View.extend({
        viewName: "CatalogView"
    });

    SCF.CatalogModel = CatalogModel;
    SCF.CatalogView = CatalogView;

    SCF.registerComponent("social/enablement/components/hbs/view/catalog", SCF.CatalogModel, SCF.CatalogView);
})($CQ, _, Backbone, SCF);
