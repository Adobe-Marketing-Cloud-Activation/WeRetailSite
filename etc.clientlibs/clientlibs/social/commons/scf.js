/*
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
 */

var SCFValidator = function(context, flag) {
    var _self = this;
    this.items = [];
    if (context !== null) {
        this.context = context;
    } else {
        this.context = $(document.body);
    }
    this.batch_processing = false;
    var _batchProcessing = $(this.context).attr("data-scf-validator-batch-processing");
    if (typeof(_batchProcessing) !== "undefined" && _batchProcessing === "true") {
        this.batch_processing = true;
    }

    this.elements = $('[data-scf-validator]');
    $.each(this.elements, function(key, value) {
        if ($($(value).closest("form")).is(_self.context)) {
            _self.items.push(new SCFValidatorItem(value, _self.batch_processing));
        }
    });
};
SCFValidator.prototype.validate = function() {
    var _elements = [];
    $.each(this.items, function(key, value) {
        _elements.push(value.validate());
    });
    var _passed = function(el, index, array) {
        return el === true;
    };
    return _elements.every(_passed);
};
SCFValidator.prototype.reset = function() {
    $.each(this.items, function(key, value) {
        value.reset();
    });
};

/*
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
 */
var SCFValidatorItem = function(element, batch_processing) {
    var _self = this;
    this.element = element;
    var _config = $(this.element).data("scf-validator");

    if (baseRules[_config.validation] !== null) {
        this.validation = baseRules[_config.validation].regexp;
        this.message = baseRules[_config.validation].text;
    } else {
        this.validation = baseRules["default"].regexp;
        this.message = baseRules["default"].text;
    }

    this.callbacks = {
        init: null,
        success: null,
        error: null,
        complete: null
    };

    this.evt = "change";
    this.resetevt = "focus";
    this.notification = "highlight";
    this.notification_str = "";
    this.error_element = null;
    this.anchor_element = null; //Anchor Element is used to attach error/info message to. By default AE is the element, message will be attached next to it
    this.error_css = null;

    if (typeof(_config.evt) !== "undefined") {
        this.evt = _config.evt;
    }
    if (typeof(_config.resetevt) !== "undefined") {
        this.resetevt = _config.resetevt;
    }
    if (typeof(_config.notification) !== "undefined") {
        this.notification = _config.notification;
    }
    //new callbacks impl
    if (typeof(_config.callbacks) !== "undefined" && typeof(_config.callbacks) === "object") {
        this.callbacks = _config.callbacks;
    }
    //calback on init
    if (this.callbacks.init !== null) {
        window[this.callbacks.init].call();
    }
    if (typeof(this.notification) === "object") {
        this.anchor_element = $("#" + this.notification.anchor); // TODO check for string/oject, then use obj or add $()
        this.error_css = this.notification.css;
        this.notification_str = "custom";
    } else {
        this.anchor_element = this.element;
        this.notification_str = this.notification;
        this.error_css = "scf-validation-highlight-error";
    }
    $(this.element).on(_self.resetevt, function() {
        _self.reset();
    });
    if (batch_processing === false) {
        $(this.element).on(_self.evt, function() {
            if (_self.validate()) {
                if (_self.callbacks.success !== null) {
                    window[_self.callbacks.success].call();
                }
            } else {
                if (_self.callbacks.error !== null) {
                    window[_self.callbacks.error].call();
                }
            }
            if (_self.callbacks.complete !== null) {
                window[_self.callbacks.complete].call();
            }
        });
    }
    return this;
};
SCFValidatorItem.prototype.validate = function() {
    if ($(this.element).hasClass(this.error_css)) {
        this.reset();
    }
    var _value = $(this.element).val();
    var _patt = new RegExp(this.validation);
    if (_patt.test(_value)) {
        return true;
    }
    $(this.element).addClass(this.error_css);
    this.error_element = $('<div class="alert alert-danger">' + this.message + '</div>');

    switch (this.notification_str) {
        case "highlight":
            $(this.error_element).insertAfter($(this.anchor_element));
            break;
        case "popup":
            alert(this.message);
            break;
        case "custom":
            $(this.error_element).appendTo($(this.anchor_element));
            break;
        default:
            alert("Validation error message");
    }
    return false;
};
SCFValidatorItem.prototype.reset = function() {
    $(this.element).removeClass(this.error_css);
    if (this.error_element !== null) {
        $(this.error_element).remove();
    }
};

/*
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
 */
var baseRules = {
    "default": {
        "text": CQ.I18n.getMessage("Default match. Matches everything."),
        "regexp": "[\s\S]*"
    },
    "integer": {
        "text": CQ.I18n.getMessage("Integer only"),
        "regexp": /^\s*(\+|-)?\d+\s*$/
    },
    "text": {
        "text": CQ.I18n.getMessage("Text only. No digits"),
        "regexp": "^[a-zA-Z ]*$"
    },
    "numbers": {
        "text": CQ.I18n.getMessage("Numbers only. No special chars, or letters"),
        "regexp": "^[0-9]*$"
    },
    "messagesubject": {
        "text": CQ.I18n.getMessage("Please enter min 2, max 10, numbers, letters and/or some characters"),
        "regexp": "^([a-zA-Z0-9 \"~&|'!@#$%*()-_=+;?/{}]{2,10})$"
    },
    "email": {
        "text": CQ.I18n.getMessage("Please enter valid email address"),
        "regexp": /^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i
    },
    "noempty": {
        "text": CQ.I18n.getMessage("Cannot be empty"),
        "regexp": /\S/
    }
};

/*
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
 */
(function(Backbone, $CQ, _, Handlebars) {
    "use strict";
    var SCF = {
        VERSION: "0.0.1",
        Views: {},
        Models: {},
        Collections: {},
        config: {
            urlRoot: ""
        },
        constants: {
            SOCIAL_SELECTOR: ".social",
            JSON_EXT: ".json",
            URL_EXT: ".social.json",
            TRANSLATE_URL_EXT: ".social.translate.json",
            ANALYTICS_BASE_RESOURCE_TYPE: "social/commons/components/analyticsbase"
        },
        Components: {},
        loadedComponents: {},
        templates: {},
        fieldManagers: {},
        DEBUG: 1,
        INFO: 2,
        WARN: 3,
        ERROR: 4
    };
    SCF.LOG_LEVEL = SCF.INFO;
    var _logger = {
        debug: function() {
            if (SCF.LOG_LEVEL <= SCF.DEBUG) {
                window.console.debug.apply(window.console, arguments);
            }
        },
        info: function() {
            if (SCF.LOG_LEVEL <= SCF.INFO) {
                window.console.info.apply(window.console, arguments);
            }
        },
        warn: function() {
            if (SCF.LOG_LEVEL <= SCF.WARN) {
                window.console.warn.apply(window.console, arguments);
            }
        },
        error: function() {
            if (SCF.LOG_LEVEL <= SCF.ERROR) {
                window.console.error.apply(window.console, arguments);
            }
        }
    };
    var deepCommentSearch = function(node, regex) {
        var child = node.firstChild;
        var foundNode = null;
        while (child) {
            switch (child.nodeType) {
                case 1:
                    foundNode = deepCommentSearch(child, regex);
                    break;
                case 8:
                    if (child.nodeValue.match(regex)) {
                        return child;
                    }
                    break;
            }
            if (foundNode !== null) {
                break;
            }
            child = child.nextSibling;
        }
        return foundNode;
    };
    SCF.Router = new Backbone.Router();
    if (!Backbone.History.started) {
        Backbone.history.start({
            pushState: true,
            hashChange: false
        });
    }
    SCF.View = Backbone.View.extend({
        initialize: function() {
            this._rendered = false;
            this._childViews = {};
            this._parentView = undefined;
            this._modelReady = false;
            this._sessionReady = false;
            this._renderedChildren = [];
            this._replacementTarget = null;
            this._destroyed = false;
            if (this.$el.html() !== "") {
                this.bindView();
                this._rendered = true;
            }
            this.listenTo(this.model, "model:loaded", function() {
                this._modelReady = true;
                this.render();
            });
            this.listenTo(this.model, "model:cacheFixed", function() {
                this.render();
            });
            if (this.requiresSession && !SCF.Session.isReady()) {
                //SCF.log.debug("%s waiting for session to be ready.", this.cid);
                this.listenTo(SCF.Session, "model:loaded", function(data) {
                    if (!this._sessionReady) {
                        //SCF.log.debug("View: %s got Session ready.", this.cid);
                        this._sessionReady = true;
                        this.render();
                    }
                });
            }
            this._sessionReady = SCF.Session.isReady();
            if (_.isFunction(this.init)) {
                this.init.apply(this, arguments);
            }
            if (SCF.Session.isReady()) {
                this.initContext();
            } else {
                SCF.Session.on("model:loaded", _.bind(this.initContext, this));
            }
        },
        initContext: function() {
            if (_.isUndefined(SCF.Context)) {
                SCF.Context = {};
                var groupNavbarSel = ".scf-js-group-navbar";

                // get site path to be written into SCF.Context and recorded for analytics
                var sitePath = $(".scf-js-site-title").attr("href");
                sitePath = _.isUndefined(sitePath) ? "" : sitePath.substring(0, sitePath.lastIndexOf(".html"));
                this.sitePath = sitePath;
                /*
                 * Populate page level component information into SCF.Context
                 * to be sent with analytics calls. It is particularly important
                 * for events such as post (SCFCreate) or votes (SCFVote) originated
                 * in nested coments or replies (not top level) that do not have
                 * direct access to this information
                 */
                SCF.Context.siteTitle = $(".scf-js-site-title").length !== 0 ? $(".scf-js-site-title").text() : "";
                SCF.Context.sitePath = this.sitePath;
                SCF.Context.groupTitle = $(groupNavbarSel).length !== 0 && !_.isUndefined($(groupNavbarSel).attr("data-group-title")) ? $(groupNavbarSel).data("group-title") : "";
                SCF.Context.groupPath = $(groupNavbarSel).length !== 0 && !_.isUndefined($(groupNavbarSel).attr("data-group-path")) ? $(groupNavbarSel).data("group-path") : "";
                SCF.Context.user = SCF.Session.get("authorizableId");
            }
            if (_.isFunction(this.initAnalytics)) {
                this.initAnalytics.apply(this, arguments);
            }
        },
        getContextForTemplate: function() {
            var context = (this.model !== undefined) ? this.model.toJSON() : this.context;
            return this.getMergedContexts(context);
        },
        getMergedContexts: function(context) {
            if (!_.isObject(context)) {
                context = {};
            }
            context.loggedInUser = SCF.Session.toJSON();
            context.environment = {};
            context.environment.client = true;
            return context;
        },
        appendTo: function(parentElement) {
            if (!this._rendered) {
                this.render();
            }
            $CQ(parentElement).append(this.el);
            this.trigger("view:ready", {
                view: this
            });
        },
        replaceElement: function(replacedElement) {
            if (!this._rendered) {
                this.render();
            }
            if (this._rendered) {
                $CQ(replacedElement).replaceWith(this.$el);
                this._replacementTarget = null;
                this.trigger("view:ready", {
                    view: this
                });
            } else {
                //SCF.log.debug("Attaching replacementTarget: %s", this.cid);
                this._replacementTarget = replacedElement;
            }
        },
        render: function() {
            if (this._destroyed) {
                return;
            }
            var that = this;
            if (!(this._modelReady || this.model._isReady) || (this.requiresSession && !this._sessionReady)) {
                /*
                if (!(this._modelReady || this.model._isReady)) {
                    SCF.log.debug("Skipping render due to Model not ready %s : %s", this.cid, this.model.attributes.resourceType);
                }
                if (this.requiresSession && !this._sessionReady) {
                    SCF.log.debug("Skipping render due to Session not ready %s : %s", this.cid, this.model.attributes.resourceType);
                }
                */
                return this;
            }
            //SCF.log.debug("Rendering %s : %s", this.cid, this.model.attributes.resourceType);
            this.unbindDataFields();
            for (var viewName in this._childViews) {
                this._childViews[viewName].destroy();
                delete this._childViews[viewName];
            }
            this._renderedChildren = [];
            var element = $CQ(this.template(this.getContextForTemplate(), {
                data: {
                    parentView: this
                }
            }));
            //Check if its attached to DOM or rendered
            if (this._rendered || this.$el.parent().length > 0) {
                this.$el.html(element.html());
            } else {
                this.setElement(element);
            }
            //render children
            _.each(this._childViews, function(child) {
                that.renderChildView(child);
            });

            var finishRendering = _.bind(function() {
                this.bindView();
                this._rendered = true;
                if (this.afterRender) {
                    this.afterRender();
                }
                this.trigger("view:rendered", {
                    view: this
                });

            }, this);
            //wait for children to finish rendering and then complete binding the view
            $CQ.when(this._renderedChildren).done(finishRendering);
            if (this._replacementTarget !== null) {
                this.replaceElement(this._replacementTarget);
            }
            return this;
        },
        bindView: function() {
            var that = this;
            this.unbindDataFields();
            this.$("[evt]").not(this.$("[data-scf-component] [evt]")).each(function(idx, trigger) {
                SCF.View.bindEvents(that, $CQ(trigger));
            });
            this.$("[data-attrib]").not(this.$("[data-scf-component] [data-attrib]")).each(function(idx, element) {
                SCF.View.bindDataFields(that, $CQ(element));
            });
            this.$("[data-form]").not(this.$("[data-scf-component] [data-form]")).each(function(idx, element) {
                SCF.View.bindDataForms(that, $CQ(element));
            });
        },
        addChildView: function(childView) {
            //SCF.log.debug("Adding Child View: %s", childView.cid);
            this._childViews[childView.cid] = childView;
            var deferred = $CQ.Deferred();
            this._renderedChildren[childView.cid] = deferred.promise();
            this.listenTo(childView, "view:rendered", function() {
                deferred.resolve();
            });
            this.listenTo(childView, "view:destroyed", function(event) {
                //SCF.log.debug("Parent getting destory command for child view: %s", event.view.cid);
                this.removeChildView(event.view.cid);
            });
            return this;
        },
        getChildView: function(childViewID) {
            return this._childViews[childViewID];
        },
        removeChildView: function(childViewID) {
            if (this._renderedChildren.hasOwnProperty(childViewID)) {
                this._renderedChildren[childViewID].fail();
            }
            if (this._childViews.hasOwnProperty(childViewID)) {
                var childView = this._childViews[childViewID];
                childView.stopListening();
                this.stopListening(childView, "view:rendered");
                this._childViews[childViewID] = undefined;
                delete this._childViews[childViewID];
            }
            return this;
        },
        getChildViews: function() {
            return this._childViews;
        },
        setParent: function(parentView) {
            this._parentView = parentView;
            parentView.addChildView(this);
            return this;
        },
        renderChildView: function(view) {
            //SCF.log.debug("Rendering child view: %s", view.cid);
            view.render();
            var parent = this;
            if (parent.el === null) {
                return;
            }
            var el = null;
            var currentNode = null;
            var targetView = new RegExp("\s*?data-view='" + view.cid + "'");
            if (document.createNodeIterator && NodeFilter && NodeFilter.SHOW_COMMENT) {
                var iter = document.createNodeIterator(parent.el, NodeFilter.SHOW_COMMENT,
                    function(node) {
                        if (node.data.match(targetView)) {
                            return NodeFilter.FILTER_ACCEPT;
                        }
                    },
                    false
                );
                currentNode = iter.nextNode();
                while (currentNode !== null) {
                    el = currentNode;
                    currentNode = iter.nextNode();
                    break;
                }
                view.replaceElement(el);
            } else {
                el = deepCommentSearch(parent.el, targetView);
                view.replaceElement(el);
            }
        },
        getField: function(field) {
            var element = this._fields[field];
            if (element) {
                return element.val();
            }
            return "";
        },
        setField: function(field, data) {
            var element = this._fields[field];
            if (!element) {
                return;
            }
            element.val(data);
        },
        focus: function(field) {
            var element = this._fields[field];
            if (!element) {
                return;
            }
            element.focus();
        },
        getForm: function(form) {
            if (typeof this._forms === 'undefined') {
                return null;
            } else {
                return this._forms[form];
            }
        },
        destroy: function() {
            this.undelegateEvents();
            this.unbindDataFields();
            this.stopListening();
            this.trigger("view:destroyed", {
                view: this
            });
            this._destroyed = true;
            //SCF.log.debug("DESTORYING %s : %s", this.cid, this.model.attributes.resourceType);
        },
        unbindDataFields: function() {
            for (var prop in this._fields) {
                if (this._fields.hasOwnProperty(prop)) {
                    if (_.isFunction(this._fields[prop].destroy)) {
                        this._fields[prop].destroy();
                    }
                }
            }
            this._fields = {};
        },
        log: _logger
    });
    SCF.View.extend = function() {
        var child = Backbone.View.extend.apply(this, arguments);
        var viewName = arguments[0].viewName;
        SCF.Views[viewName] = child;
        return child;
    };

    SCF.Model = Backbone.Model.extend({
        _cachedModels: {},
        _hasLoadedChildren: false,
        parse: function(response) {
            this._parseRelations(response);
            return response;
        },
        addEncoding: function(data) {
            if ((window.FormData) && (data instanceof window.FormData)) {
                data.append("_charset_", "UTF-8");
            }
            if (!data.hasOwnProperty("_charset_")) {
                data._charset_ = "UTF-8";
            }
            return data;
        },
        reload: function(callback) {
            this._isReady = false;
            var url = "";
            var urlFn;
            if (_.isFunction(this.url)) {
                //Need to do this since model.clear will clear the id that is used to construct the url
                url = this.url();
                urlFn = this.url;
            } else {
                //seen code that sets the param as a hardcoded string
                url = this.url;
            }
            this.clear();
            //This.clear clears the id resulting in bad URL so setting the URL for fetch to happen
            if (!_.isEmpty(url)) {
                this.url = url;
            }
            var that = this;
            this.fetch({
                dataType: "json",
                cache: false,
                xhrFields: {
                    withCredentials: true
                },
                error: function(model, response) {
                    SCF.log.error("Error fetching model");
                    SCF.log.error(response);
                    model.clear();
                    model._isReady = true;
                    model.trigger("model:loaded", model);
                    if (callback && typeof(callback.error) === "function") {
                        callback.error();
                    }
                },
                success: function(model) {
                    if (urlFn !== undefined) {
                        //resetting the url back to function
                        model.url = urlFn;
                    }
                    model._isReady = true;
                    model.trigger("model:loaded", model);
                    if (callback && typeof(callback.success) === "function") {
                        callback.success();
                    }
                }
            });
        },
        reset: function(attributes, options) {
            this.clear().set(_.clone(this.defaults));
            var attr = this._parseRelations(attributes);
            this.set(attr, options);
            return this;
        },
        initialize: function(attributes) {
            this.listenTo(SCF.Session, "logout:success", function() {
                this.reload();
            });
            this.listenTo(SCF.Session, "login:success", function() {
                this.reload();
            });
        },
        constructor: function(attributes, options) {
            if(typeof(attributes) !== "object") {
                attributes = JSON.parse(attributes);
            }
            var attr = this._parseRelations(attributes);
            Backbone.Model.apply(this, [attr, options]);
        },
        url: function() {
            var u;
            if (this.urlRoot) {
                u = this.urlRoot + this.id + SCF.constants.URL_EXT;
            } else if (SCF.config.urlRoot) {
                u = SCF.config.urlRoot + this.id + SCF.constants.URL_EXT;
            } else {
                u = this.id + SCF.constants.URL_EXT;
            }
            return u;
        },
        _parseRelations: function(attributes) {
            if(typeof(attributes) !== "object") {
                attributes = JSON.parse(attributes);
            }
            var makeRelation = _.bind(function(data, key) {
                if (!attributes[key] && !data.path) {
                    attributes[key] = [];
                }
                if (attributes[key] || data.path) {
                    var relative = attributes[key];
                    var ModelKlass, model;
                    if (_.isArray(relative)) {
                        var modelArray = [],
                            idArray = [];
                        _.each(relative, function(rel) {
                            if (_.isObject(rel)) {
                                ModelKlass = !_.isUndefined(SCF.Models[data.model]) ? SCF.Models[data.model] : SCF.Components[rel.resourceType].Model;
                                model = ModelKlass.findLocal(rel.id);
                                if (!model) {
                                    model = ModelKlass.createLocally(rel);
                                } else {
                                    model.reset(rel);
                                }
                                modelArray.push(model);
                            } else if (!_.isEmpty(rel)) {
                                var idFromUrl = rel.substr(SCF.config.urlRoot.length);
                                idFromUrl = idFromUrl.substr(0, idFromUrl.lastIndexOf(SCF.constants.URL_EXT));
                                ModelKlass = SCF.Models[data.model];
                                model = ModelKlass.findLocal("idFromUrl");
                                if (!model) {
                                    model = data.autofetch ? ModelKlass.find(idFromUrl) : new ModelKlass({
                                        url: rel
                                    });
                                }
                                ModelKlass.prototype._cachedModels[idFromUrl] = model;
                                modelArray.push(model);
                            }
                        });
                        var CollectionKlass = SCF.Collections[data.collection] || Backbone.Collection;
                        var collection = new CollectionKlass();
                        collection.model = ModelKlass;
                        collection.parent = this;
                        collection.set(modelArray, {
                            silent: true
                        });
                        attributes[key] = collection;
                    } else if (_.isObject(relative)) {
                        if (_.isUndefined(SCF.Models[data.model]) && _.isUndefined(SCF.Components[relative.resourceType])) {
                            this.log.error("A relation key %s requested model %s but it is not available nor is the component type: %s", key, data.model, relative.resourceType);
                            return;
                        }
                        ModelKlass = SCF.Models[data.model] || SCF.Components[relative.resourceType].Model;
                        model = ModelKlass.findLocal(relative.id) || ModelKlass.createLocally(relative);
                        attributes[key] = model;
                    } else {
                        var url = relative;
                        if (!url) {
                            if (data.path) {
                                if (data.path.substr(0, 1) === "/") {
                                    url = data.path;
                                } else {
                                    url = SCF.config.urlRoot + attributes.id + "/" + data.path + SCF.constants.URL_EXT;
                                }
                            } else {
                                return;
                            }
                        }
                        ModelKlass = SCF.Models[data.model];
                        if (data.autofetch) {
                            model = ModelKlass.find(url, undefined, true);
                        } else {
                            model = ModelKlass.findLocal(url, true) || new ModelKlass({
                                "url": url
                            });
                        }
                        attributes[key] = model;
                    }
                }
            }, this);
            _.each(this.relationships, makeRelation);
            return attributes;
        },
        toJSON: function() {
            var json = Backbone.Model.prototype.toJSON.apply(this);
            _.each(this.relationships, function(config, relation) {

                var relative = json[relation];
                if (relative.length <= 0) {
                    delete json[relation];
                    return;
                }
                if (_.isArray(relative)) {
                    var jsonArray = [];
                    _.each(relative, function(rel) {
                        if (rel instanceof Backbone.Model)
                            jsonArray.push(rel.toJSON());
                        else
                            jsonArray.push(rel);
                    });
                    json[relation] = jsonArray;
                } else if (relative instanceof Backbone.Collection) {
                    json[relation] = relative.toJSON();
                } else if (relative instanceof Backbone.Model) {
                    json[relation] = relative.toJSON();
                }

            });
            return json;
        },
        log: _logger
    });
    SCF.Model.extend = function() {
        var child = Backbone.Model.extend.apply(this, arguments);
        var modelName = arguments[0].modelName;
        SCF.Models[modelName] = child;
        return child;
    };
    SCF.View.bindEvents = function(view, eventTrigger) {
        var eventString = eventTrigger.attr("evt");
        _.each(eventString.split(","), function(value) {
            var parts = value.split("=");
            var evt = $CQ.trim(parts[0]);
            var func = $CQ.trim(parts[1]);
            if (view[func]) {
                var eventHandler = _.bind(view[func], view);
                eventTrigger.off(evt);
                eventTrigger.on(evt, eventHandler);
            }
        });
    };
    SCF.View.bindDataFields = function(view, element) {
        var field = element.attr("data-attrib");
        if (!view._fields) {
            view._fields = {};
        }
        if (!_.isUndefined(view._fields[field])) {
            return;
        }
        var fieldType = element.attr("data-field-type");
        var ManagerKlass = (_.isUndefined(SCF.fieldManagers[fieldType])) ? DefaultFieldType : SCF.fieldManagers[fieldType];
        var manager = new ManagerKlass(element, {}, view.model);
        view._fields[field] = (function() {
            return {
                val: function() {
                    if (arguments.length === 0)
                        return manager.getValue();
                    else
                        return manager.setValue(arguments[0]);
                },
                focus: function() {
                    return manager.focus();
                },
                destroy: function() {
                    if (_.isFunction(manager.destroy)) {
                        manager.destroy();
                    }
                }
            };
        })();
    };
    SCF.View.bindDataForms = function(view, element) {
        var form = element.attr("data-form");
        if (!view._forms) {
            view._forms = {};
        }
        view._forms[form] = new SCFValidator($(element), false);
    };
    SCF.Model.findLocal = function(mid, isUrl) {
        var id = isUrl ? mid.substr(SCF.config.urlRoot.length) : mid;
        if (this.prototype._cachedModels && this.prototype._cachedModels[id]) {
            return this.prototype._cachedModels[id];
        }
    };
    SCF.Model.createLocally = function(attributes) {
        var modelObj = new this.prototype.constructor(attributes);
        modelObj._isReady = true;
        this.prototype._cachedModels[modelObj.get("id")] = modelObj;
        return modelObj;
    };
    SCF.Model.prototype.load = function(mid) {
        if (mid) {
            this.set({
                "id": mid
            }, {
                silent: true
            });
        }
        this.fetch({
            success: function(model) {
                model._isReady = true;
                model.trigger("model:loaded", model);
            },
            xhrFields: {
                withCredentials: true
            }
        });
    };
    SCF.Model.prototype.getConfigValue = function(key) {
        var config = this.get("configuration");
        if (!_.isEmpty(config)) {
            return config[key];
        }
        return null;
    };
    SCF.Model.prototype.destroy = function(options) {
        var model = this;
        this.constructor.prototype._cachedModels[model.get("id")] = undefined;
        model.trigger("destroy", model, model.collection, options);
    };

    SCF.Model.prototype.parseServerError = function(jqxhr, text, error) {
        var errorDetails = $CQ.parseJSON(jqxhr.responseText);
        if (errorDetails.hasOwnProperty("status.code")) {
            errorDetails.status = errorDetails.status || {};
            errorDetails.status.code = errorDetails["status.code"];
            delete errorDetails["status.code"];
        }
        if (errorDetails.hasOwnProperty("status.message")) {
            errorDetails.status = errorDetails.status || {};
            errorDetails.status.message = errorDetails["status.message"];
            delete errorDetails["status.message"];
        }
        return {
            "error": error,
            "details": errorDetails
        };
    };

    SCF.Model.find = function(mid, callback, isUrl) {
        var that = this;
        if (this.prototype._cachedModels && this.prototype._cachedModels[mid]) {
            var model = this.prototype._cachedModels[mid];
            if (_.isFunction(callback)) {
                callback(model);
            }
            return model;
        } else {
            var newModel = new this.prototype.constructor({
                id: mid
            });
            if (isUrl) {
                newModel.url = mid;
            }
            //TODO figure out caching mechanism
            this.prototype._cachedModels[mid] = newModel;
            newModel.fetch({
                dataType: "json",
                xhrFields: {
                    withCredentials: true
                },
                error: function(model, response) {
                    if (response.status === 204 || response.status === 404) {
                        SCF.log.debug("non existing resource");
                        model._isReady = true;
                        model.trigger("model:loaded", model);
                        if (_.isFunction(callback)) {
                            callback(model);
                        }
                    } else {
                        SCF.log.error("Error fetching model");
                        SCF.log.error(response);
                        that.prototype._cachedModels[mid] = undefined;
                    }

                },
                success: function(model) {
                    model._isReady = true;
                    model.trigger("model:loaded", model);
                    if (_.isFunction(callback)) {
                        callback(model);
                    }
                }
            });
            return newModel;
        }
    };
    SCF.Collection = Backbone.Collection.extend({});
    SCF.Collection.extend = function() {
        var child = Backbone.Collection.extend.apply(this, arguments);
        var collectioName = arguments[0].collectioName;
        SCF.Collections[collectioName] = child;
        return child;
    };

    SCF.registerComponent = function(componentName, modelKlass, viewKlass) {
        SCF.Components[componentName] = {
            Model: modelKlass,
            View: viewKlass,
            name: componentName
        };
    };

    SCF.addLoadedComponent = function(resourceType, model, view) {
        if (!SCF.Components[resourceType]) {
            return;
        }
        if (!SCF.loadedComponents[resourceType]) {
            SCF.loadedComponents[resourceType] = {};
        }
        SCF.loadedComponents[resourceType][model.id] = {
            "model": model,
            "view": view
        };
        return SCF.loadedComponents[resourceType][model.id];
    };
    SCF.findTemplate = function(resourceId, templateName, resourceType) {
        if (arguments.length == 2) {
            resourceType = templateName;
            templateName = "";
        }
        var templateKey = resourceType + "/" + templateName;
        if (SCF.templates[templateKey]) {
            return SCF.templates[templateKey];
        }
        var template;
        $CQ.ajax({
            async: false,
            // xhrFields: {
            //  withCredentials: true
            // },
            url: SCF.config.urlRoot + "/services/social/templates" + "?resourceType=" + resourceType + "&ext=hbs&selector=" + templateName
        }).done(function(data, status) {
            if (status == "success") {
                template = Handlebars.compile(data);
                SCF.templates[templateKey] = template;
            }
        });
        return template;
    };

    SCF.log = _logger;

    SCF.registerFieldType = function(fieldType, fieldTypeManager) {
        if (!(_.isFunction(fieldTypeManager.prototype.setValue))) {
            this.log.error("%s does not implement required method, \"setValue\"", fieldType);
            return;
        }
        if (!(_.isFunction(fieldTypeManager.prototype.getValue))) {
            this.log.error("%s does not implement required method, \"getValue\"", fieldType);
            return;
        }
        if (!(_.isFunction(fieldTypeManager.prototype.focus))) {
            this.log.error("%s does not implement required method, \"focus\"", fieldType);
            return;
        }
        if (!(_.isFunction(fieldTypeManager.prototype.destroy))) {
            this.log.error("%s does not implement required method, \"destroy\"", fieldType);
            return;
        }
        this.fieldManagers[fieldType] = fieldTypeManager;
    };

    var DefaultFieldType = function(element, config, model) {
        this.$el = element;
    };

    DefaultFieldType.prototype.setValue = function(val) {
        return this.$el.val(val);
    };
    DefaultFieldType.prototype.getValue = function() {
        return this.$el.val();
    };
    DefaultFieldType.prototype.focus = function() {
        this.$el.focus();
    };
    DefaultFieldType.prototype.destroy = function() {};

    SCF.View.prototype.launchModal = function(element, header, closeCallBack) {
        var modalScreen = $CQ("<div class=\"scf scf-modal-screen\"></div>");
        var modalDialog = $CQ("<div class=\"scf scf-modal-dialog\" style=\"display:none;\">" +
            "<h2 class=\"scf-modal-header\">" + header +
            "</h2><div class=\"scf-modal-close\">X</div></div>");
        var el = element;
        var parent = el.parent();
        modalDialog.append(el);
        el.show();
        var close = function(e) {
            if (SCF.Util.mayCall(e, "preventDefault")) {
                e.preventDefault();
            }
            el.hide();
            parent.append(el);
            modalScreen.remove();
            modalDialog.remove();
            if (_.isFunction(closeCallBack)) {
                closeCallBack();
            }
        };
        modalDialog.find(".scf-modal-close").click(close);
        modalDialog.find(".scf-js-modal-close").click(close);

        $CQ("body").append(modalScreen);
        $CQ("body").append(modalDialog);
        var width = (window.innerWidth - modalDialog.innerWidth()) / 2;
        var height = (window.innerHeight - modalDialog.innerHeight()) / 2;
        modalDialog.css({
            "top": height,
            "left": width
        });
        modalDialog.show();

        return close;
    };
    SCF.View.prototype.overlayTemplate = "<div class=\"scf-overlay\">" +
        "<div class=\"scf-overlay-header btn-toolbar\">" +
        "<button class=\"btn btn-primary scf-ovelay-back-button\" title=\"{{i18n \"Back\"}}\">" +
        "<span class=\"scf-icon-left\"></span>" +
        "</button>" +
        "<h3>{{header}}</h3>" +
        "</div>" +
        "</div>";
    SCF.View.prototype.loadOverlay = function(element, parent, header, closeCallback) {
        var template = Handlebars.compile(this.overlayTemplate);
        var overlay = $CQ(template({
            'header': header
        }));
        var close = function() {
            overlay.remove();
            parent.find(".scf-is-overlay-hidden").each(function() {
                $CQ(this).removeClass("scf-is-overlay-hidden");
            });
            if (closeCallback && _.isFunction(closeCallBack)) {
                closeCallBack();
            }
        };
        parent.children().each(function() {
            $CQ(this).addClass("scf-is-overlay-hidden");
        });
        overlay.append(element);
        parent.append(overlay);
        overlay.find(".scf-ovelay-back-button").click(close);
        return close;
    };
    SCF.View.prototype.errorTemplate = "<h3>{{details.status.message}}</h3>";
    SCF.View.prototype.addErrorMessage = function(element, error) {
        var template = Handlebars.compile(this.errorTemplate);
        var $el = $CQ(element);
        var $errorElement = $CQ(template(error));
        $errorElement.addClass("scf-js-error-message");
        $el.before($errorElement);
    };
    SCF.View.prototype.compileTemplate = function(hbsMarkup) {
        return Handlebars.compile(hbsMarkup);
    };
    SCF.View.prototype.clearErrorMessages = function(element, error) {
        this.$el.find(".scf-js-error-message").remove();
        this.$el.find(".scf-error").removeClass("scf-error");
    };

    SCF.ChildView = SCF.View.extend({
        bindView: function() {},
        bindDataForms: function() {},
        bindDataFields: function() {},
        bindEvents: function() {},
        viewName: "ChildView"
    });

    SCF.Util = {
        // Allows you to pass in an object and see if the funcName is avaiable ot be called,
        // this only does a shallow check for now.
        "mayCall": function(obj, funcName) {
            if (_.isUndefined(obj) || _.isNull(obj)) {
                return false;
            }
            return (obj.hasOwnProperty(funcName) || obj[funcName] !== null) && _.isFunction(obj[funcName]);
        },
        "announce": function(channel, data) {
            $CQ(document).trigger(channel, data);
        },
        "listenTo": function(channel, listener) {
            $CQ(document).on(channel, function(e, data) {
                listener(data);
            });
        },
        "startsWith": function(sourceString, searchString) {
            return sourceString.substr(0, searchString.length) === searchString;
        },
        "getContextPath": function() {
            var URL = CQ.shared.HTTP.getPath();
            var pageExtension = CQ.shared.HTTP.getExtension();
            var urlSplit = URL.split(pageExtension);
            if (urlSplit && urlSplit !== undefined) {
                if (urlSplit.length > 1) {
                    return urlSplit[1];
                } else {
                    return urlSplit[0];
                }
            }
            return "";
        }
    };
    window.SCF = SCF;

})(Backbone, $CQ, _, Handlebars);

/*
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
 */
(function(Handlebars, moment, SCF, $CQ, _, CQ) {
    "use strict";

    var slingInclude = function(path, templateName, resourceType) {
        var html = "";
        var params = {
            resourcePath: path
        };
        if (resourceType) {
            SCF.log.warn("Forcing resource type is not supported when sling including on the client side");
        }
        if (templateName) {
            params.selector = templateName;
        }
        var urlToFetch = SCF.config.urlRoot + path;
        urlToFetch += templateName ? "." + templateName + ".html" : ".html";
        $CQ.ajax({
            async: false,
            // xhrFields: {
            //  withCredentials: true
            // },
            url: urlToFetch
        }).done(function(data, status) {
            if (status == "success") {
                html = data;
            }
        });
        return new Handlebars.SafeString(html);
    };
    Handlebars.registerHelper("include", function(context, options) {


        if (arguments.length === 1) {
            options = context;
            context = undefined;
        }
        var parentView = options.data.parentView;
        var getModelName = function(viewName) {
            if (!viewName) {
                return undefined;
            }
            var idx = viewName.lastIndexOf("View");
            if (idx !== -1) {
                return viewName.substr(0, idx) + "Model";
            } else {
                return viewName + "Model";
            }
        };
        var bindModelView = _.isUndefined(options.hash.bind) ? true : options.hash.bind;
        var viewName = options.hash.view;
        var templateName = options.hash.template;
        var resourceType = options.hash.resourceType;
        var path = options.hash.path;
        var modelName = options.hash.model || getModelName(viewName);
        var viewObj, modelObj, ViewKlass, ModelKlass, id, component;


        if (_.isObject(context)) {
            resourceType = resourceType || context.resourceType;
            component = SCF.Components[resourceType];
            if ((_.isUndefined(component)) && (resourceType.match(/^(\/apps)|(\/libs)/))) {
                var baseType = resourceType.substring(6);
                component = SCF.Components[baseType];
            }
            var cTemplate;

            id = context.id;
            if (!id) {
                var url = context.url;
                if (!url) {
                    SCF.log.warn("No resource id found for context: ");
                    SCF.log.warn(context);
                }
                var idFromUrl = url.substr(SCF.config.urlRoot.length);
                idFromUrl = idFromUrl.substr(0, idFromUrl.lastIndexOf(SCF.constants.URL_EXT));
                id = idFromUrl;
            }

            if (templateName) {
                cTemplate = SCF.findTemplate(id, templateName, resourceType);
            } else {
                cTemplate = SCF.findTemplate(id, resourceType);
            }

            var getViewKlass = function() {
                //use an SCF.ChildView if the template being included belongs to the same component and rendering the same resource
                if (parentView.model.get("resourceType") === resourceType && parentView.model.id === id) {
                    return SCF.ChildView;
                }
                return component ? component.View : undefined;
            };

            ViewKlass = viewName ? SCF.Views[viewName] : getViewKlass();
            ViewKlass = bindModelView ? ViewKlass : undefined;
            ModelKlass = modelName ? SCF.Models[modelName] : component ? component.Model : undefined;
            ModelKlass = bindModelView ? ModelKlass : undefined;

            if (!ViewKlass && !cTemplate) {
                if (id) {
                    return slingInclude(id, templateName, resourceType);
                }
                SCF.log.error("No view or template found for " + resourceType + " and template " + templateName);
                return "";
            }


            if (!ViewKlass && cTemplate) {
                return new Handlebars.SafeString(cTemplate(SCF.View.prototype.getMergedContexts(context)));
            }


            if (ViewKlass && !cTemplate) {
                SCF.log.error("No template found for " + resourceType + " and template " + templateName);
                return "";
            }

            if (!ModelKlass || !id) {
                viewObj = new ViewKlass({
                    "context": context
                });
            } else {
                modelObj = ModelKlass.findLocal(id);
                if (!modelObj) {
                    modelObj = ModelKlass.createLocally(context);
                }
                if (modelObj.isNew()) {
                    modelObj.load(id);
                }
                viewObj = new ViewKlass({
                    model: modelObj
                });

            }
            if (templateName && cTemplate) {
                viewObj.template = cTemplate;
            } else if (cTemplate) {
                ViewKlass.prototype.template = cTemplate;
            }

        } else {

            var isPathAbsolute = path ? path.slice(0, 1) === "/" : false;
            if (!context && !isPathAbsolute) {
                SCF.log.error("Must provide context path when including " + resourceType);
                return "";
            }

            id = isPathAbsolute ? path : context + "/" + path;

            if (resourceType) {
                component = SCF.Components[resourceType];
            }
            if (bindModelView && (component || (viewName && modelName))) {
                ViewKlass = !component ? SCF.Views[viewName] : component.View;
                ModelKlass = !component ? SCF.Models[modelName] : component.Model;
            }

            if (ViewKlass && ModelKlass) {
                var isUrl = id.indexOf("http://") === 0;
                modelObj = ModelKlass.find(id, undefined, isUrl);
                viewObj = new ViewKlass({
                    "model": modelObj
                });
                if (templateName) {
                    viewObj.template = SCF.findTemplate(id, templateName, resourceType);
                } else if (typeof viewObj.template === "undefined") {
                    SCF.log.info("Getting default template for " + resourceType);
                    viewObj.template = SCF.findTemplate(id, resourceType, resourceType);
                }
            } else {
                return slingInclude(id, templateName, resourceType);
            }
        }
        viewObj.setParent(parentView);
        if (!ViewKlass.prototype.template && viewObj.template && ViewKlass != SCF.ChildView) {
            ViewKlass.prototype.template = SCF.findTemplate(modelObj.get("id"), resourceType);

        }
        viewObj.templateName = templateName || "default";
        viewObj.resource = id;
        return new Handlebars.SafeString("<!-- data-view='" + viewObj.cid + "'-->");
    });

    Handlebars.registerHelper("equals", function(lvalue, rvalue, options) {
        if (arguments.length < 3)
            throw new Error("Handlebars Helper equal needs 2 parameters");
        if (lvalue != rvalue) {
            return options.inverse(this);
        } else {
            return options.fn(this);
        }
    });

    Handlebars.registerHelper("lastPath", function(context, options) {
        var idx = context.lastIndexOf("/");
        return context.slice(idx + 1);
    });

    Handlebars.registerHelper("pretty-time", function(context, options) {
        if (!context) {
            return "";
        }
        var time = new Date(context);
        var now = new Date();
        var diff = now.getTime() - time.getTime();
        var second = 1000;
        var minute = second * 60;
        var hour = minute * 60;
        var day = hour * 24;
        moment.locale(CQ.shared.I18n.getLocale());
        // max days ago before switching to actual date. If not passed in then hardcoding as 60.
        var days_cutoff = options.hash.daysCutoff ? options.hash.daysCutoff : 60;
        if (diff < minute) {
            time = Math.round(diff / second) + "";
            if (time == 1) {
                return new Handlebars.SafeString(CQ.I18n.get("{0} second ago", time));
            }
            return new Handlebars.SafeString(CQ.I18n.get("{0} seconds ago", time));
        } else if (diff < hour) {
            time = Math.round(diff / minute);
            if (time == 1) {
                return new Handlebars.SafeString(CQ.I18n.get("{0} minute ago", time));
            }
            return new Handlebars.SafeString(CQ.I18n.get("{0} minutes ago", time));
        } else if (diff < day) {
            time = Math.round(diff / hour);
            if (time == 1) {
                return new Handlebars.SafeString(CQ.I18n.get("{0} hour ago", time));
            }
            return new Handlebars.SafeString(CQ.I18n.get("{0} hours ago", time));
        } else if (diff < day * days_cutoff) {
            time = Math.round(diff / day);
            if (time == 1) {
                return new Handlebars.SafeString(CQ.I18n.get("{0} day ago", time));
            }
            return new Handlebars.SafeString(CQ.I18n.get("{0} days ago", time));
        } else {
            return new Handlebars.SafeString(moment(time).format(CQ.I18n.get("MMM DD YYYY, h:mm A", null, "moment.js, communities moderation")));
        }
    });

    Handlebars.registerHelper("pages", function(context, options) {
        var pageInfo = context;

        if (pageInfo.hasOwnProperty("selectedPage") && pageInfo.hasOwnProperty("totalPages") && pageInfo.hasOwnProperty("pageSize") && pageInfo.hasOwnProperty("basePageURL")) {
            var output = "";
            if (pageInfo.totalPages <= 1) {
                return output;
            }
            var pageSize = Math.abs(pageInfo.pageSize);
            var pageSign = (pageInfo.orderReversed) ? "-" : "";
            var currentPage = pageInfo.selectedPage;

            var leftLimit = currentPage;
            if ((leftLimit - 2) > 0 && pageInfo.totalPages > 5) {
                leftLimit = leftLimit - 2;
            }

            if (pageInfo.totalPages <= 5) {
                leftLimit = 1;
            } else {
                if (pageInfo.totalPages - currentPage < 2) {
                    leftLimit = pageInfo.totalPages - 4;
                }
            }
            var rightLimit = leftLimit + 5;
            if (rightLimit > pageInfo.totalPages) {
                rightLimit = pageInfo.totalPages + 1;
            }

            for (var i = leftLimit; i < rightLimit; i++) {
                pageInfo.pageNumber = i;
                pageInfo.currentPageUrl = pageInfo.basePageURL + "." + ((i - 1) * pageSize) + "." + pageSign + pageSize + ".html";
                pageInfo.currentPage = i == pageInfo.selectedPage;
                pageInfo.suffix = ((i - 1) * pageSize) + "." + pageSign + pageSize;
                output += options.fn(pageInfo);
            }
            return output;
        } else {
            return "";
        }
    });

    Handlebars.registerHelper("loadmore", function(context, options) {
        var pageInfo = context.pageInfo;
        var items = context.items;
        if (!context.totalSize || !pageInfo) {
            return "";
        }
        if (!(!_.isUndefined(pageInfo.selectedPage) && context.totalSize && pageInfo.pageSize)) {
            return "";
        }
        if (context.totalSize <= 0) {
            return "";
        }
        var info = {};
        info.suffix = pageInfo.nextSuffix;
        var remaining = this.totalSize;
        if (!_.isUndefined(items)) {
            remaining = remaining - items.length;
        }
        if (remaining === 0) {
            return "";
        }
        var url = pageInfo.nextPageURL;
        if (!_.isUndefined(url) && url.indexOf(".json", url.length - 5) !== -1) {
            url = url.substr(0, url.length - 5);
            url += ".html";
        }
        info.remaining = remaining;
        info.moreURL = url;
        return options.fn(info);
    });

    Handlebars.registerHelper("dateUtil", function(context, options) {
        var date = context;
        var format = options.hash.format;
        var timezone = options.hash.timezone;
        if (!date || typeof date != "number") {
            date = new Date().getTime();
        } else {
            date = new Date(date);
        }
        format = format.replace(/y/g, "Y"); // replace java "yyyy" with moment "YYYY"
        format = format.replace(/\bdd\b/gi, "DD"); // replace java "dd" with moment "DD"
        format = format.replace(/\bd\b/gi, "D"); // replace java "d" with moment "D"
        format = format.replace(/\bEEEE\b/gi, "dddd");
        moment.locale(CQ.shared.I18n.getLocale());

        if (timezone && moment.tz) {
            return new Handlebars.SafeString(moment.tz(date, timezone).format(format));
        }

        return new Handlebars.SafeString(moment(date).format(format));
    });

    Handlebars.registerHelper("i18n", function(context, options) {
        if (arguments.length > 1) {
            var i18nArgs = _.rest(arguments);
            return CQ.I18n.get(context, i18nArgs);
        } else {
            return CQ.I18n.get(context);
        }
    });

    Handlebars.registerHelper("xss-htmlAttr", function(context, options) {
        //encodeForHTMLAttr
        var $div = $CQ("div");
        $div.attr("data-xss", context);
        var cleaned = $div.attr("data-xss");
        return CQ.shared.XSS.getXSSValue(cleaned);
        // if (!context) {
        //     return "";
        // }
        // return new Handlebars.SafeString(context.toString().replace(/\./g, '-'));
    });
    Handlebars.registerHelper("xss-jsString", function(context, options) {
        //encodeForJSString
        return CQ.shared.XSS.getXSSValue(context);
    });
    Handlebars.registerHelper("xss-html", function(context, options) {
        //encodeForHTML
        return $CQ("<div/>").text(context).html();
    });
    Handlebars.registerHelper("xss-validHref", function(context, options) {
        //getValidHref
        return encodeURI(context);
    });
    Handlebars.registerHelper("dom-id", function(context, options) {
        if (!context) {
            return "";
        }
        var domId = $CQ.trim(context);
        domId = domId.replace(/\./g, "-");
        domId = domId.replace(/\//g, "-");
        domId = domId.replace(/:/g, "-");
        return domId;
    });
    Handlebars.registerHelper("abbreviate", function(context, options) {

        if (!context) {
            return "";
        }
        var maxWords = options.hash.maxWords;
        var maxLength = options.hash.maxLength;
        var safeString = options.hash.safeString;
        var ctx = $CQ.trim(context);
        var initialLength = ctx.length;

        var words = ctx.substring(0, maxLength).split(" ");
        var abb = words.slice(0, words.length > maxWords ? maxWords : words.length).join(" ");
        var abbContent = initialLength != abb.length && options.fn ? options.fn(this) : "";
        if (safeString) {
            return new Handlebars.SafeString(abb) + abbContent;
        }
        return abb + abbContent;
    });

    Handlebars.registerHelper("includeClientLib", function(context, options) {
        // This helper only works on the server side.
        return "";
    });

    Handlebars.registerHelper("if-wcm-mode", function(context, options) {
        // This helper only works on the server side.
        return "";
    });

    Handlebars.registerHelper("getContextPath", function(context, options) {
        var contextPath = "";
        if (Granite && Granite.HTTP.getContextPath()) {
            contextPath = Granite.HTTP.getContextPath();
        }
        return contextPath;
    });

})(Handlebars, moment, SCF, $CQ, _, CQ);

/*
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
 */
(function($CQ, SCF, _, CQ, Granite) {
    "use strict";
    var LoginView = SCF.View.extend({
        viewName: "Login",
        tagName: "div",
        className: "scf-login",
        init: function() {
            this._isReady = false;
            this.listenTo(this.model, this.model.events.LOGGED_IN_SUCCESS, this.render);
            this.listenTo(this.model, this.model.events.LOGGED_OUT, this.render);
        },
        loginAction: function() {
            if (this.model.get("loggedIn")) {
                this.$el.children(".login-dialog").hide();
                this.logout();
            } else {
                var loginDialog = this.$el.children(".login-dialog").toggle();
                loginDialog.find("input:first").focus();
            }
        },
        logout: function() {
            this.model.logout();
        },
        login: function() {
            var username = this.getField("username");
            var password = this.getField("password");
            if (username === "" || password === "") {
                return;
            }
            this.model.login(username, password);
        }
    });
    var LoginModel = SCF.Model.extend({
        moderatorCheckAttribute: "moderatorCheck",
        events: {
            LOGGED_IN_SUCCESS: "login:success",
            LOGGED_IN_FAIL: "login:failed",
            LOGGED_OUT: "logout:success"
        },
        initialize: function(attributes, options) {
            this._isReady = false;
            if (CQ.shared.User.data === undefined || CQ.shared.User.data === null) {
                //Dont call the currentuser.json if data is available
                this.initUser(options);
            } else {
                this.getLoggedInUser(options);
            }
        },
        defaults: {
            "loggedIn": false
        },
        isReady: function() {
            return this._isReady;
        },
        checkIfModeratorFor: function(resource) {
            var componentList = this.attributes.hasOwnProperty(this.moderatorCheckAttribute) ?
                this.attributes[this.moderatorCheckAttribute] : [];
            return this.attributes.loggedIn && _.contains(componentList, resource);
        },
        checkIfUserCanPost: function(resource) {
            var componentList = this.attributes.hasOwnProperty("mayPost") ?
                this.attributes.mayPost : [];
            return this.attributes.loggedIn && _.contains(componentList, resource);
        },
        setLanguage: function(data) {
            var langFromPreferences = data.preferences &&
                data.preferences.language ?
                data.preferences.language :
                "en";
            var language = document.documentElement.lang || langFromPreferences;
            CQ.shared.I18n.setLocale(language);
        },
        initUser: function(options) {
            var CURRENT_USER_URL = CQ.shared.HTTP.externalize("/libs/granite/security/currentuser" + CQ.shared.HTTP.EXTENSION_JSON + "?props=preferences/language");
            CURRENT_USER_URL = CQ.shared.HTTP.noCaching(CURRENT_USER_URL);
            var that = this;
            $CQ.ajax({
                url: CURRENT_USER_URL,
                type: "GET",
                success: function(result) {
                    that.getLoggedInUser(options, result.home);
                    that.setLanguage(result);
                },
                async: false
            });
        },
        getLoggedInUser: function(options, userPath) {
            var that = this;
            var moderationCheckParameter;
            if (options.hasOwnProperty(LoginModel.moderatorCheckAttribute)) {
                moderationCheckParameter = "?" + LoginModel.moderatorCheckAttribute + "=";
                _.each(options[LoginModel.moderatorCheckAttribute], function(item) {
                    moderationCheckParameter += item + ",";
                });
                moderationCheckParameter = moderationCheckParameter.substring(0, moderationCheckParameter.length - 1);
            }
            var userHomePath = "";
            if (userPath !== undefined) {
                userHomePath = userPath;
            } else if (CQ.shared.User.initialized) {
                userHomePath = CQ.shared.User.data.home;
            } else {
                // AEM user not initialized force it:
                var f = CQ.shared.User.init();
                userHomePath = CQ.shared.User.data.home;
            }

            $CQ.ajax({
                url: SCF.config.urlRoot + "/services/social/getLoggedInUser" + moderationCheckParameter + "&h=" + userHomePath,
                xhrFields: {
                    withCredentials: true
                },
                type: "GET"
            }).done(function(user) {
                if (user.name) {
                    that.set({
                        "loggedIn": true
                    });
                    that.set(user);
                }
                that._isReady = true;
                if (typeof options !== "undefined" && options.silent) {
                    that.trigger("model:loaded", {
                        model: that,
                        silent: true
                    });
                } else {
                    that.trigger("model:loaded", {
                        model: that,
                        silent: false
                    });
                }
            });
        },
        logout: function() {
            var that = this;
            $CQ.ajax({
                url: SCF.config.urlRoot + "/services/social/logout",
                xhrFields: {
                    withCredentials: true
                },
                type: "GET"
            }).always(function() {
                that.clear();
                that.trigger(that.events.LOGGED_OUT);
            });
        },
        login: function(username, password) {
            var that = this;
            $CQ.ajax({
                url: SCF.config.urlRoot + "/libs/login.html/j_security_check",
                xhrFields: {
                    withCredentials: true
                },
                data: {
                    j_username: username,
                    j_password: password,
                    j_validate: "true"
                },
                type: "POST"
            }).success(function(loginResult, textStatus, jqXHR, id) {
                var amIAuthenticated = jqXHR.getResponseHeader("Set-Cookie") === null || jqXHR.getResponseHeader("Set-Cookie") !== "";
                if (!amIAuthenticated) {
                    this.trigger(this.events.LOGGED_IN_FAIL, {
                        "user": username
                    });
                } else {
                    that.getLoggedInUser();
                    that.trigger(that.events.LOGGED_IN_SUCCESS, {
                        "user": username
                    });
                }
            });
        }
    });
    LoginModel.moderatorCheckAttribute = "moderatorCheck";
    SCF.LoginView = LoginView;
    SCF.LoginModel = LoginModel;

    SCF.registerComponent("login", SCF.LoginModel, SCF.LoginView);

})($CQ, SCF, _, CQ, Granite);

/*
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
 */
//file: bootstrap.js
(function(_, $CQ, Backbone, Handlebars, SCF) {
    "use strict";
    var contextPath = CQ.shared.HTTP.getContextPath();
    SCF.events = SCF.events || {};
    SCF.events.BOOTSTRAP_REQUEST = "scf-bootstrap-request";

    SCF.config.urlRoot = window.location.protocol + "//" + window.location.host;
    if (contextPath !== null && contextPath.length > 0) {
        SCF.config.urlRoot += contextPath;
    }
    var addView = function(component) {
        var model = component.model;
        //If the component type isn't registered do nothing
        if (SCF.Components[component.type]) {
            var templateUsed = component.template ?
                SCF.findTemplate(component.id, component.template, component.type) :
                SCF.findTemplate(component.id, component.type);
            var view = new SCF.Components[component.type].View({
                "model": model,
                el: component.el
            });
            if (component.template) {
                view.template = templateUsed;
            } else {
                SCF.Components[component.type].View.prototype.template = templateUsed;
            }
            view.templateName = component.template || "default";
            view.resource = component.id;
            // Bootstrap was not determining parent views at all which broke updates
            _.each(SCF.loadedComponents, function(typeObject) {
                _.each(typeObject, function(type, id) {
                    if (model.attributes.hasOwnProperty("parentId")) {
                        if (id === model.attributes.parentId) {
                            view.setParent(type.view);
                        }
                    } else if (view._parentView === undefined || view._parentView === null) {
                        // If there isn't a parent ID in the data wire it up via the dom
                        // Search for a parent to this el that is an SCF component, meaning it has
                        // both and ID and a resource type.
                        var $parentEl = view.$el.parents("[data-component-id][data-scf-component]");
                        if ($parentEl && $parentEl.length === 1) {
                            var domParentId = $parentEl.attr("data-component-id");
                            var resourceType = $parentEl.attr("data-scf-component");
                            var parentSCFComponentByResource = SCF.loadedComponents[resourceType];
                            // Check to make sure a component is registered for this type.
                            if (parentSCFComponentByResource !== undefined) {
                                var parentSCFComponent = parentSCFComponentByResource[domParentId];
                                // Make sure the id is registered and it really does have a view.
                                if (parentSCFComponent !== undefined && parentSCFComponent.hasOwnProperty("view")) {
                                    view.setParent(parentSCFComponent.view);
                                }
                            }
                        }
                    }
                });
            });
            if (model.cacheFixed) {
                view.render();
            }
            component.view = view;
        }
    };

    var addModel = function(component) {
        //If the component type isn't registered do nothing
        if (SCF.Components[component.type]) {
            var model;
            var modelHolder = component.modelHolder;
            var ModelKlass = SCF.Components[component.type].Model;
            if (modelHolder.length > 0) {
                var modelText = $CQ(modelHolder[0]).text();
                if (modelText === "") {
                    modelText = modelHolder[0].text;
                }
                var modelJSON = $CQ.parseJSON(modelText);
                component.id = modelJSON.id;
                model = ModelKlass.findLocal(component.id);
                if (!model) {
                    model = SCF.Components[component.type].Model.createLocally(modelJSON);
                }
            } else {
                model = ModelKlass.findLocal(component.id);
                if (!model) {
                    // if we didn't find the model load it based on the ID which is the path to the component.
                    model = SCF.Components[component.type].Model.find(component.id);
                }
            }
            component.model = model;
        }
    };

    // Creates a component based on the scf ID the resource type and an optional template.
    var createComponent = function(id, type, template, $el) {
        // Find the json model on the page.
        var modelHolder = $CQ("script[type='application/json'][id='" + id + "']");
        var component = {
            id: id,
            type: type,
            template: template,
            modelHolder: modelHolder,
            el: $el
        };
        var model = addModel(component);
        var view = addView(component);
        return SCF.addLoadedComponent(type, model, view);
    };
    // A helper method for inspecting a scf component piece of markup and extract some data from it.
    var extractComponentFromElement = function($el) {
        var component = {
            id: $el.attr("data-component-id"),
            type: $el.data("scf-component"),
            template: $el.data("scf-template"),
            modelHolder: $CQ("script[type='application/json'][id='" + $el.attr("data-component-id") + "']"),
            el: $el
        };

        return component;
    };

    var fullBootstrap = function() {
        var $CQcomponents = $CQ("[data-scf-component]");
        var allComponents = [],
            componentsToBoostrap = [];
        // for each component on the page get the meta data.
        $CQcomponents.each(function(idx, el) {
            var component = extractComponentFromElement($(el));
            if (!SCF.loadedComponents[component.type] || !SCF.loadedComponents[component.type][component.id]) {
                componentsToBoostrap.push(component);
            }
            allComponents.push(component);
        });

        // If there were components startup the user model. This gives the user model a bit of head start and reduces flicker on the screen.
        // Allow newly added components to reinvoke the Session model for all the components to ensure
        // The session has alll the component's moderator attributes set correctly. (even thought they
        // live at a page level.)
        if (componentsToBoostrap.length > 0) {
            var options = {};
            options.silent = true;
            options[SCF.LoginModel.moderatorCheckAttribute] = _.map(allComponents, function(item) {
                var dataObj;
                if (item.id.indexOf("/content/usergenerated") === -1) {
                    // If the component itself isn't in usergenerated then we should check it for moderators
                    return item.id;
                }
                try {
                    dataObj = JSON.parse(item.modelHolder.text());
                } catch (e) {
                    // If the component's data can't be turned in JSON just skip it, something
                    // is probably wrong if this is happening.
                    return false;
                }
                if (!(dataObj.hasOwnProperty("sourceComponentId"))) {
                    // If the component doesn't have a sourceComponentId then it's not moderatable,
                    // any tallies for example.
                    return false;
                }
                if (dataObj.sourceComponentId.indexOf("/content/usergenerated") !== -1) {
                    // If the source component is also in user generated then we shouldn't need to check it as the
                    // content parent is where configuration for moderation lives.
                    return false;
                }
                return dataObj.sourceComponentId;

            });
            options[SCF.LoginModel.moderatorCheckAttribute] = _.compact(options[SCF.LoginModel.moderatorCheckAttribute]);
            if (SCF.Session) {
                SCF.Session.getLoggedInUser(options, undefined);
            } else {
                var log = new SCF.LoginModel({}, options);
                SCF.Session = log;
            }
        }


        _.each(componentsToBoostrap, function(component) {
            addModel(component);
        });
        _.each(componentsToBoostrap, function(component) {
            addView(component);
            SCF.addLoadedComponent(component.type, component.model, component.view);
        });
    };

    $CQ(document).ready(fullBootstrap);
    //Sometimes this script could be loaded multiple times
    if (!Backbone.History.started) {
        Backbone.history.start({
            pushState: true,
            hasChange: false
        });
    }
    $(document).on(SCF.events.BOOTSTRAP_REQUEST, fullBootstrap);
    SCF.addComponent = function(el) {
        var $el = $(el);
        if ($el.length === 0) {
            throw "Could not find requested element on page.";
        }
        var component = extractComponentFromElement($el);
        if (component === null) {
            throw "Component is already loaded.";
        }
        if (!component.id) {
            throw "Component does not have a data-component-id attribute, which is required";
        }
        if (!component.type) {
            throw "Component does not have a data-scf-component attribute, which is required.";
        }
        return createComponent(component.id, component.type, component.template, component.el);
    };

    SCF.unloadComponent = function(id, type) {
        var typeList = SCF.loadedComponents[type];
        if (typeList === null) {
            throw "Type " + type + " is not registered with SCF.";
        }
        var component = SCF.loadedComponents[type][id];
        if (component === null || component === undefined) {
            throw "Could not find component with ID: " + id;
        }
        component.view.destroy();
        component.model = null;
        delete SCF.loadedComponents[type][id];
    };
})(_, $CQ, Backbone, Handlebars, SCF);

/*
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
 */
(function(Backbone, $CQ, _, Handlebars) {
    "use strict";

    var CKRte = function(element, config, model, view) {
        var rteConfig = {};
        rteConfig = _.extend(config, rteConfig);
        rteConfig = _.extend(this.config, rteConfig);
        var el = element.get()[0];
        if (_.isUndefined(window.CKEDITOR)) {
            SCF.log.error("Rich text editor requested but unable to find CKEDITOR please include client library category: \"%s\" or disable RTE", "ckeditor");
            return;
        }
        this.$el = element;
        var height = this.$el.data("editorheight");
        var uploadUrl = SCF.config.urlRoot + model.get("id") + SCF.constants.URL_EXT;
        var modelConfigAttachmentAllowed = model.get("configuration");
        modelConfigAttachmentAllowed = modelConfigAttachmentAllowed && modelConfigAttachmentAllowed.isAttachmentAllowed;


        if (rteConfig.extraPlugins === undefined) {
            rteConfig.extraPlugins = (window.CKEDITOR.config.extraPlugins) ? window.CKEDITOR.config.extraPlugins +
                "," : undefined;
        }

        var toolbarArr = rteConfig.toolbar[0].items;
        var index;
        // Add oEmbed plugin by default for Blogs Articles and Calendar Events
        if (model.get("resourceType") === "social/journal/components/hbs/journal" ||
            model.get("resourceType") === "social/calendar/components/hbs/calendar" ||
            model.get("resourceType") === "social/ideation/components/hbs/ideation" ||
            model.get("resourceType") === "social/ideation/components/hbs/idea" ||
            (model.get("resourceType") === "social/calendar/components/hbs/event" ||
                model.get("resourceType") === "social/journal/components/hbs/entry_topic") &&
            element[0].dataset.rteType !== 'comment') {

            // Add the oembed Icon to toolbar
            index = toolbarArr.indexOf("oembed");
            if (index === -1) {
                rteConfig.toolbar[0].items.push("oembed");
            }

            if (rteConfig.extraPlugins === undefined) {
                rteConfig.extraPlugins = "oembed";
            } else if (rteConfig.extraPlugins.length > 0 && rteConfig.extraPlugins.indexOf("oembed") === -1) {
                rteConfig.extraPlugins = rteConfig.extraPlugins.concat(",oembed");
            }
        } else { // Need to remove the oembed plugin for the Blog Comment
            index = toolbarArr.indexOf("oembed");
            if (index > 0) {
                toolbarArr.splice(index, 1);
            }
        }

        if (modelConfigAttachmentAllowed) {
            rteConfig.filebrowserUploadUrl = uploadUrl;
            rteConfig.uploadUrl = uploadUrl;

            // Add the Image Icon to toolbar
            index = toolbarArr.indexOf("Image");
            if (index === -1) {
                rteConfig.toolbar[0].items.push("Image");
            }

            if (rteConfig.extraPlugins === undefined) {
                rteConfig.extraPlugins = "image2,uploadimage";
            } else if (rteConfig.extraPlugins.length > 0 && rteConfig.extraPlugins.indexOf("image2,uploadimage") === -1) {
                rteConfig.extraPlugins = rteConfig.extraPlugins.concat(",image2,uploadimage");
            }
        } else {
            // Add the Image Icon to toolbar
            index = toolbarArr.indexOf("Image");
            if (index === -1) {
                rteConfig.toolbar[0].items.push("Image");
            }

            if (rteConfig.extraPlugins === undefined) {
                rteConfig.extraPlugins = "image2";
            } else if (rteConfig.extraPlugins.length > 0 && rteConfig.extraPlugins.indexOf("image2") === -1) {
                rteConfig.extraPlugins = rteConfig.extraPlugins.concat(",image2");
            }
        }

        var domElementName = $CQ(el).attr("name");
        if (_.isEmpty(domElementName)) {
            var modelId = model.get("id");
            var idx = modelId.lastIndexOf("/");
            modelId = modelId.slice(idx + 1);
            var attribName = $CQ(el).data("attrib");
            modelId = attribName + "-" + modelId;
            $CQ(el).attr("name", modelId);
            domElementName = modelId;
        }
        var resizeEnabled = this.$el.data("editorresize");
        if (resizeEnabled) {
            rteConfig.resize_enabled = true;
        }

        if (_.isNumber(height)) {
            rteConfig.height = height;
        }

        if (!window.CKEDITOR.instances[domElementName]) {
            this.editor = window.CKEDITOR.replace(el, rteConfig);
        } else {
            if (this.editor === undefined) {
                this.editor = window.CKEDITOR.instances[domElementName];
            }
        }
        /*if (_.isNumber(height)) {
            delete this.config.height;
        }
        if (resizeEnabled) {
            delete this.config.resize_enabled;
        }*/
        this.model = model;
        if (modelConfigAttachmentAllowed) {
            this.editor.on("fileUploadRequest", this.attachFileFromDragAndDrop);
            this.editor.on("fileUploadResponse", this.handleFileUploadResponse);
            this.changeImagePluginDialog();
        }
    };

    CKRte.prototype.destroy = function() {
        if (this.editor) {
            try {
                if (this.editor.filter && this.editor.window && this.editor.window.getFrame()) {
                    this.editor.destroy(true);
                    this.editor.removeAllListeners();
                } else {
                    this.editor.removeAllListeners();
                    window.CKEDITOR.remove(this.editor);
                    window.CKEDITOR.fire("instanceDestroyed", null, this.editor);
                }
            } catch (e) {
                SCF.log.error("Couldn't destroy editor: %o", e);
            }
        }
        delete this.editor;
        return;
    };


    CKRte.prototype.getFileIFrameFromDialog = function(definition) {
        var dialogDefinition = definition;
        var contents = dialogDefinition.contents;
        for (var i = 0; i < contents.length; i++) {
            var contentObject = contents[i];
            var contentObjectId = contentObject.id;
            // Code specific to image plugin. They have give the ID as Upload
            if (contentObjectId == "Upload") {
                var elements = contentObject.elements;
                for (var j = 0; j < elements.length; j++) {
                    var element = elements[j];
                    var elementId = element.id;
                    if (elementId == "uploadButton") {
                        // set the custom Function
                        element.onClick = this.setCustomFileButtonClick;
                        element["for"] = ["Upload", "file"];
                    }
                    if (elementId == "upload") {
                        element.id = "file";
                    }
                }
            }
        }
    };

    CKRte.prototype.setCustomFileButtonClick = function(evt) {
        var target = evt.sender["for"];
        var dialog = evt.data.dialog;
        var fileElement = dialog.getContentElement(target[0], target[1]);
        var fileIframe = $CQ("#" + fileElement.domId + " iframe");
        //set additional parameters for the upload to happen
        var fileIframeForm = fileIframe.contents().find("form");
        var success = _.bind(function(response) {
            var responseObj;
            if(typeof(response.response) !== "object") {
                responseObj = JSON.parse(response.response);
            } else {
                responseObj = response.response;
            }
            var location = responseObj.url;
            location = CQ.shared.HTTP.encodePath(location);
            dialog.getContentElement("info", "src").setValue(location);
            dialog.selectPage("info");
            if ($CQ(".cke_dialog_ui_input_text").length !== 0) {
                $CQ(".cke_dialog_ui_input_text").focus();
            }
        }, this);
        var error = _.bind(function(response) {
            SCF.log.error("Failed to upload file" + response);
        }, this);
        var postData;
        var formFiles = fileIframeForm.find("input:file");
        var files = formFiles[0].files;
        var hasAttachment = (typeof files != "undefined");
        if (hasAttachment) {
            // Create a formdata object and add the files
            var url = fileIframeForm.attr("action");
            CKRte.prototype.attachFile.call(this, files, url, success, error);
        }
        evt.stop();
        return false;
    };

    CKRte.prototype.handleFileUploadResponse = function(evt) {
        evt.stop();
        var data = evt.data;
        var xhr = data.fileLoader.xhr;
        var response = xhr.responseText;
        response = JSON.parse(response);
        if(typeof(response.response) !== "object") {
            response.response = JSON.parse(response.response);
        }
        if (xhr.status == 200) {
            data.uploaded = 1;
            data.url = CQ.shared.HTTP.encodePath(response.response.url);
            data.name = response.response.properties.name;
        }
    };

    CKRte.prototype.attachFileFromDragAndDrop = function(evt) {
        var fileLoader = evt.data.fileLoader;
        var xhr = fileLoader.xhr;
        var postData;
        if (window.FormData) {
            postData = new FormData();
        }
        if (postData) {
            postData.append("file", fileLoader.file);
            postData.append("id", "nobot");
            postData.append(":operation", "social:uploadImage");
            postData.append("_charset_", "UTF-8");
            xhr.open("POST", fileLoader.uploadUrl, true);
            xhr.setRequestHeader("Accept", "application/json");
            xhr.withCredentials = true;
            xhr.send(postData);
        }
        evt.stop();
    };

    CKRte.prototype.attachFile = function(files, url, success, error) {
        var postData;
        if (window.FormData) {
            postData = new FormData();
        }
        if (postData) {
            $CQ.each(files, function(key, value) {
                postData.append("file", value);
            });
            postData.append("id", "nobot");
            postData.append(":operation", "social:uploadImage");
            postData.append("_charset_", "UTF-8");
            $CQ.ajax(url, {
                dataType: "json",
                type: "POST",
                processData: false,
                contentType: false,
                xhrFields: {
                    withCredentials: true
                },
                data: postData,
                "success": success,
                "error": error
            });
        }
    };
    CKRte.prototype.changeImagePluginDialog = function() {
        // List of things being done
        // Get the dialog defintion of the image2 plugin
        // Setting a custom onClick function to the file input button in the dialog
        // Getting the iframe that loads the server response after an image is uploaded
        // Set addition params specific to upload operation
        // Add an onload event listener to the iframe
        // The iframe onload event listener updates the field that has image URL
        if (!CKRte.isImageDialogDefinitionChanged) {
            CKRte.isImageDialogDefinitionChanged = true;
            var that = this;
            window.CKEDITOR.on("dialogDefinition", function(ev) {
                var dialogName = ev.data.name;
                if (dialogName == "image2") {
                    that.getFileIFrameFromDialog(ev.data.definition);
                }
            });
        }
    };

    CKRte.prototype.config = {
        toolbar: [{
            name: "basicstyles",
            items: ["Bold", "Italic", "Underline", "NumberedList", "BulletedList", "Outdent", "Indent", "JustifyLeft", "JustifyCenter", "JustifyRight", "JustifyBlock", "TextColor"]
        }],
        autoParagraph: false,
        autoUpdateElement: false,
        removePlugins: "elementspath",
        resize_enabled: false
    };
    CKRte.prototype.setValue = function(val) {
        this.editor.setData(val);
    };
    CKRte.prototype.getValue = function() {
        return this.editor.getData();
    };
    CKRte.prototype.focus = function() {
        return this.editor.focus();
    };

    CKRte.isImageDialogDefinitionChanged = false;

    SCF.registerFieldType("ckeditor", CKRte);
    SCF.registerFieldType("rte", CKRte);
})(Backbone, $CQ, _, Handlebars);

/*
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
 */
(function(_, $CQ, Backbone, Handlebars, SCF) {
    "use strict";

    var SmartTagManager = function(tagField, config, model) {
        this.containerEl = tagField;
        var filterVal = $CQ(tagField).data("tag-filter");
        var filterLimit = $CQ(tagField).data("tag-limit");
        $CQ(tagField).tagit({
            fieldName: name,
            allowSpaces: false,
            placeholderText: CQ.I18n.getMessage("Add a tag"),
            animate: false,
            minLength: 2,
            removeConfirmation: true,
            showAutocompleteOnFocus: false,
            tagSource: function(request, response) {
                $CQ.ajax({
                    url: SCF.config.urlRoot + "/services/tagfilter",
                    data: {
                        term: request.term,
                        tagfilter: filterVal,
                        tagFilterLimit: filterLimit,
                        pagePath: CQ.shared.HTTP.getPath(),
                        _charset_: "UTF-8"
                    },
                    dataType: "json",
                    success: function(data) {
                        response($CQ.map(data, function(item) {
                            return {
                                label: item.label,
                                value: item.value,
                                id: item.tagid
                            };
                        }));
                    }
                });
            }
        });

        if (!_.isEmpty(model.get("tags"))) {
            $CQ.each(model.get("tags"), function(index, item) {
                $CQ(tagField).tagit("createTag", item.title, item.tagId, item.value);

            });
        }
    };
    SmartTagManager.prototype.getValue = function() {
        var tags = [];

        $CQ(this.containerEl).find('li').each(function() {
            var _liObj = $(this);
            var _value = _liObj.find("input").attr("value");
            if (!_.isEmpty(_value)) {
                tags.push(_value);
            }
        });

        return tags;
    };
    SmartTagManager.prototype.setValue = function() {};
    SmartTagManager.prototype.focus = function() {
        $CQ(this.el).focus();
    };
    SmartTagManager.prototype.destroy = function() {};



    var TagManager = function(tagField, config, model) {
        var compileTemplates = function(sourceMap) {
            var compiledTemplates = {};
            for (var key in sourceMap) {
                compiledTemplates[key] = Handlebars.compile(sourceMap[key]);
            }
            return compiledTemplates;
        };
        this.modelTags = model.get("tags");
        this.templatesSource = this.defaultTemplates;
        if (config && config.hasOwnProperty("templates")) {
            this.templatesSource = _.extend(this.defaultTemplates, config.templates);
        }
        this.compiledTemplates = compileTemplates(this.templatesSource);
        var el = tagField.get()[0];
        var filterVal = $CQ(el).data("tag-filter");
        var filterLimit = $CQ(el).data("tag-limit");
        var tags = TagManager.tagsByFilterVal[filterVal];
        if (!tags) {
            var that = this;
            $CQ.ajax({
                url: SCF.config.urlRoot + "/services/tagfilter",
                data: {
                    tagfilter: filterVal,
                    tagFilterLimit: filterLimit
                },
                // xhrFields: {
                //     withCredentials: true
                // },
                dataType: "json",
                async: false,
                success: function(data) {
                    tags = data;
                    TagManager.tagsByFilterVal[filterVal] = tags;
                    that.initTagFields(tags, el);
                }
            });
        } else {
            this.initTagFields(tags, el);
        }
    };

    TagManager.prototype.initTagFields = function(tags, field) {
        var tagSelector = $CQ(this.compiledTemplates.inputField(tags));
        this.selectedTags = {};
        var that = this;
        var $field = $CQ(field);
        $field.after(tagSelector);
        var attributes = $field.prop("attributes");
        $CQ.each(attributes, function() {
            tagSelector.attr(this.name, this.value);
        });
        tagSelector.removeAttr("data-attrib");
        var selectedTags = $CQ(this.compiledTemplates.tagsContainer(this.modelTags));

        if (!_.isUndefined(this.modelTags) && this.modelTags !== null && this.modelTags.hasOwnProperty("length")) {
            for (var i = 0; i < this.modelTags.length; i++) {
                this.selectedTags[this.modelTags[i].tagId] = this.modelTags[i];
            }
        }
        tagSelector.after(selectedTags);
        selectedTags.find(".scf-js-remove-tag").click(function(e) {
            var targetTag = $CQ(e.target).closest("[data-attrib]");
            delete that.selectedTags[targetTag.attr("data-attrib")];
            targetTag.remove();
        });
        $field.remove();
        tagSelector.change(function() {
            $CQ(tagSelector).find("option:selected").each(function() {
                var tag = $CQ(this).text();
                var tagId = $CQ(this).val();
                $CQ(this).removeAttr("selected");
                if (tagId in that.selectedTags) {
                    return;
                }
                var selectedTag = $CQ(that.compiledTemplates.tag({
                    "tagid": tagId,
                    "label": tag
                }));
                selectedTags.append(selectedTag);
                that.selectedTags[tagId] = tag;
                selectedTag.find(".scf-js-remove-tag").click(function() {
                    selectedTag.remove();
                    delete that.selectedTags[tagId];
                });
            });
            $CQ($CQ(this).find("option[disabled]")[0]).removeAttr("disabled").attr("selected", "selected").attr("disabled", "disabled");
        });
    };

    TagManager.prototype.getValue = function() {
        var tags = [];
        for (var tagId in this.selectedTags) {
            tags.push(tagId);
        }
        return tags;
    };
    TagManager.prototype.setValue = function() {
        if (tags instanceof Array) {
            for (var i; i < tags.length; i++) {
                var tag = tags[i];
                this.selectedTags[tag.tagId] = tag.title;
            }
        }
    };
    TagManager.prototype.focus = function() {
        $CQ(this.el).focus();
    };
    TagManager.prototype.destroy = function() {};

    TagManager.prototype.defaultTemplates = {
        "inputField": "<select size=\"1\"><option disabled selected>add a tag</option>{{#each this}}<option value=\"{{tagid}}\">{{label}}</option>{{/each}}</select>",
        "tagsContainer": "<ul class=\"scf-horizontal-tag-list\">{{#each this}}<li class=\"scf-selected-tag \" data-attrib=\"{{tagId}}\"><span class=\"scf-js-remove-tag scf-remove-tag\"></span> {{title}}</li>{{/each}}</div>",
        "tag": "<li class=\"scf-selected-tag \"><span class=\"scf-js-remove-tag scf-remove-tag\"></span> {{label}}</li>"
    };

    TagManager.tagsByFilterVal = {};

    SCF.registerFieldType("tags", TagManager);
    SCF.registerFieldType("smarttags", SmartTagManager);
    // Maybe this export can be removed when we transition over totally to SCF
    SCF.TagManager = TagManager;
    SCF.SmartTagManager = SmartTagManager;

})(_, $CQ, Backbone, Handlebars, SCF);

/*
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
 */
(function(_, $CQ, Backbone, Handlebars, SCF) {
    "use strict";

    // select user
    var initUserSelector = function(el_selector, path, dropDown) {
        var $el = $CQ(el_selector);
        // userlist node needs to be next to ugc node
        var base_url = path;
        $el.autocomplete({
            source: function(request, response) {
                var searchString = $CQ(el_selector).val();
                var filterObject = {
                    "operation": "CONTAINS",
                    "./@rep:principalName": searchString
                };
                filterObject = [filterObject];
                var filterGivenName = {
                    "operation": "like",
                    "profile/@givenName": searchString
                };
                filterObject.push(filterGivenName);
                var filterFamilyName = {
                    "operation": "like",
                    "profile/@familyName": searchString
                };
                filterObject.push(filterFamilyName);
                filterObject = JSON.stringify(filterObject);

                var sitePath = SCF.Context.sitePath + "/configuration.social.0.20.json";
                $CQ.ajax({
                    url: sitePath,
                    type: "GET",
                    success: function(siteJson) {
                        var url = base_url + ".social.0.20.json";
                        url = CQ.shared.HTTP.addParameter(url, "filter", filterObject);
                        url = CQ.shared.HTTP.addParameter(url, "type", "users");
                        url = CQ.shared.HTTP.addParameter(url, "fromPublisher", "true");
                        url = CQ.shared.HTTP.addParameter(url, "_charset_", "utf-8");
                        url = CQ.shared.HTTP.addParameter(url, "groupId", "community-" + siteJson.siteId + "-members");
                        $.get(url, function(data) {
                            var users = data.items;
                            $el.data("lastQueryResult", users);
                            response(users);
                        });
                    }
                });
            },
            minLength: 3,
            change: function(event, ui) {
                dropDown.model.set("composedForValid", dropDown.validateUser($el.val()));
            },
            select: function(event, ui) {
                dropDown.model.set("composedForValid", true);
                $CQ(this).val(ui.item.authorizableId);
                return false;
            },
            setvalue: function(value) {
                this.element.val(value);
                this.input.val(value);
                $CQ(this).val(value);
            }
        }).data("uiAutocomplete")._renderItem = function(ul, item) {
            if (item.avatarUrl) {
                return $CQ("<li></li>").append(
                        "<a><img src='" + item.avatarUrl + "' width='30' height='30'/>&nbsp;" + item.name + "</a>")
                    .data("item.autocomplete", item).appendTo(ul);
            } else {
                return $CQ("<li></li>").append("<a>" + item.name + "</a>").data("item.autocomplete", item).appendTo(ul);
            }
        };
    };

    var UserDropDown = function(inputEl, config, model) {
        this.$el = $CQ(inputEl);
        this.model = model;
        this.config = config;
        this.modelId = this.model.get("forumId");
        if (_.isEmpty(this.modelId)) {
            this.modelId = this.model.get("id");
        }
        initUserSelector($CQ(inputEl), this.modelId + "/userlist", this);
    };

    var isUserInList = function(userList, userName) {
        for (var user in userList) {
            if (userList[user].authorizableId === userName) {
                return true;
            }
        }
        return false;
    };

    UserDropDown.prototype.validateUser = function(userName) {
        var isValid = false;

        // Check to see if the user is blank
        if (userName.trim().length === 0)
            return true;

        // First, check last (cached) search, if it exists
        if (this.$el.data("lastQueryResult")) {
            if (isUserInList(this.$el.data("lastQueryResult"), userName)) {
                isValid = true;
            }
        }
        // Next, perform a query and check to see if we find a match
        if (!isValid) {
            var users = this.searchUsers(userName);
            isValid = isUserInList(users, userName);
        }
        return isValid;
    };

    UserDropDown.prototype.searchUsers = function(userName) {
        var base_url = this.modelId + "/userlist";
        var url = base_url + ".social.0.20.json?search=" + userName + "&showUsers=true";
        var users;
        $.get(url, function(data) {
            users = data.items;
        });
        users = users || [];
        return users;
    };

    UserDropDown.prototype.getValue = function() {
        return this.$el.val();
    };

    UserDropDown.prototype.setValue = function() {
        // Some model prop
        this.$el.autocomplete().setValue(this.model.get("author").id);
    };

    UserDropDown.prototype.focus = function() {
        $CQ(this.el).focus();
    };

    UserDropDown.prototype.destroy = function() {
        if (this.$el.data('autocomplete') || this.$el.data('lastQueryResult')) {
            this.$el.autocomplete("destroy");
        }
    };

    SCF.registerFieldType("userdropdown", UserDropDown);
    SCF.UserDropDown = UserDropDown;
})(_, $CQ, Backbone, Handlebars, SCF);

