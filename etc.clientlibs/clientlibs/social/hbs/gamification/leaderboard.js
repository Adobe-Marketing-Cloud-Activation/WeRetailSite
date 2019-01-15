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

    var DataTableView = SCF.View.extend({
        viewName: "DataTableView",
        setSortIcon: function() {

        },
        initializePagination: function() {

        },
        refreshView: function(totalSize, startIndex, pagingCallback) {
            this.render();

            var that = this;

            /*
             * Every time the table gets drawn, a server side paging call ("ajax" funtion
             * below) is triggered.  After initializing the column sorting below, we manually
             * redraw the table but we don't want that to trigger a paging call.  So
             * this variable is instantiated so that we can only allow the paging call
             * to be triggered AFTER that draw request has been made.
             */
            var numDraws = 0;

            // apply data tables
            var table = $(this.el).find("table").DataTable({
                dom: "rAtiJ",
                ordering: false,
                serverSide: true,
                deferLoading: totalSize,
                displayStart: startIndex,
                /*jshint unused: vars */
                ajax: function(data, callback, settings) {
                    if (numDraws === 1) {
                        pagingCallback(that, data.start);
                        /*
                         * TODO: When we add sorting support, will need to
                         * trigger callback for table redraw here
                         */
                    }
                    numDraws++;
                },
                /*jshint unused: true */
                language: {
                    search: "_INPUT_",
                    searchPlaceholder: CQ.I18n.get("Filter"),
                    emptyTable: CQ.I18n.get("No data available in table"),
                    infoEmpty: CQ.I18n.get("No entries to show"),
                    info: CQ.I18n.get("Showing") +  " _START_ " + CQ.I18n.get("to") + " _END_ " +
                    CQ.I18n.get("of") + " _TOTAL_ " + CQ.I18n.get("entries")
                }
            });

            var colvis = new $.fn.dataTable.ColVis(table, {
                fnStateChange: function() {
                    var evt = $.Event(
                        "dataTablesColumnUpdate"
                    );
                    $(this.dom.wrapper).trigger(evt);

                    that.columnVisibility = [];
                    table.columns().eq(0).each(function(index) {
                        var column = table.column(index);
                        that.columnVisibility.push(column.visible());
                    });
                }
            });

            this.initializeSort();

            var i = 0;
            var sortIndex = 0;
            _.each($(this.el).find(
                    ".dataTable thead th"),
                function(data) {

                    var isVisible = true;
                    if (!_.isUndefined(this.columnVisibility)) {
                        isVisible = this.columnVisibility[i];
                    }
                    if ($(data).hasClass("dt-hide") || !isVisible) {
                        $($(this.el).find("table")[0]).dataTable()
                            .fnSetColumnVis(i, false, false);
                        if (sortIndex === i) {
                            sortIndex++;
                        }
                    }
                    i++;
                }, this);

            $.fn.dataTable.ColVis.fnRebuild($($(this.el).find("table")[0]).dataTable());

            table.order([
                [sortIndex, "asc"]
            ]).draw(false);

            colvis.button().children[0].innerText = CQ.I18n.get("Show / hide columns");
            $(this.el).find(".dataTables_wrapper").prepend(
                colvis.button());

            var toolBar = $(
                "<div class='dataTables_toolbar'></div>");

            $(toolBar).append($(this.el).find(".ColVis"));
            $(toolBar).append($(this.el).find(
                ".dataTables_filter"));

            $(this.el).find(".dataTables_wrapper").prepend(
                toolBar);

            var settings = table.settings()[0];

            $(settings.nTable).trigger("init.dt", [settings]);
        }
    });

    SCF.DataTableView = DataTableView;

})(SCF);

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

    SCF.LOG_LEVEL = 1;

    var ReportPaginatedTableModel = SCF.Model.extend({
        reportGenerated: false,
        fetchNewReport: function(url) {
            this.paginationUrl = url;

            this.reportGenerated = false;

            this.clear();

            this.firstPage();
        },
        changePage: function(updatedOffset) {
            this.currentOffset = updatedOffset;
            this.url = this.paginationUrl.replace("${startIndex}", updatedOffset);

            var that = this;

            /*
             * In most cases we should calls "this.reload()" here but that will trigger
             * a re-render of the entire report.  Since we only want to re-render the table,
             * we manually run the fetch ourselves so that we don't re-render the entire
             * report.
             */
            this.fetch({
                success: function(collection, response) {
                    if (response.items !== undefined && response.items.length > 0) {
                        that.set("model", response);
                    }
                }
            });
        },
        firstPage: function() {
            var newOffset = 0;
            this.changePage(newOffset);
        },
        nextPage: function() {
            var newOffset = this.currentOffset += (this.pageSize);
            this.changePage(newOffset);
        },
        previousPage: function() {
            var newOffset = this.currentOffset -= (this.pageSize);
            this.changePage(newOffset);
        },
        lastPage: function() {
            var newOffset = this.lastPageOffset;
            this.changePage(newOffset);
        }
    });

    SCF.ReportPaginatedTableModel = ReportPaginatedTableModel;

    var ReportPaginationControlView = SCF.View.extend({
        init: function() {
            SCF.Util.listenTo("reportValidatePaginationButtons", $.proxy(this.validate, this));
        },
        firstPage: function() {
            this.model.firstPage();
        },
        nextPage: function() {
            this.model.nextPage();
        },
        previousPage: function() {
            this.model.previousPage();
        },
        lastPage: function() {
            this.model.lastPage();
        },
        validate: function(data) {
            if (data.model === this.model) {
                var firstDisabled = false;
                var lastDisabled = false;

                if (this.model.currentOffset === 0) {
                    firstDisabled = true;
                }
                if (this.model.currentOffset === this.model.lastPageOffset) {
                    lastDisabled = true;
                }

                this.$el.find(".scf-pagination-first-btn").prop("disabled", firstDisabled);
                this.$el.find(".scf-pagination-previous-btn").prop("disabled", firstDisabled);
                this.$el.find(".scf-pagination-next-btn").prop("disabled", lastDisabled);
                this.$el.find(".scf-pagination-last-btn").prop("disabled", lastDisabled);
            }
        }
    });

    SCF.ReportPaginationControlView = ReportPaginationControlView;

})(SCF);

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

    SCF.LOG_LEVEL = 1;

    var BootstrapReportPaginatedTableView = SCF.DataTableView.extend({
        top: -1,
        viewName: "BootstrapReportPaginatedTableView",
        init: function() {
            this.listenTo(this.model, "sync", this.onSync);
            SCF.Util.listenTo("reportRefreshTable", $.proxy(this.refreshTable, this));
        },
        refreshTable: function() {
            var totalRows = this.collection.size();
            if (totalRows > 0) {
                this.refreshView(totalRows, this.model.currentOffset,
                    this.pagingCallback);

                this.model.currentOffset = this.model.get("pageInfo").currentIndex;
                this.model.pageSize = this.model.get("pageInfo").pageSize;
                this.model.lastPageOffset = this.model.pageSize * (this.model.get("pageInfo").totalPages - 1);

                this.model.reportGenerated = true;
                this.renderDueStatusLabels();
                this.validatePaginationButtons();
            } else {
                this.render();
            }
        },
        pagingCallback: function(view) {
            view.model.firstPage();
        },
        renderDueStatusLabels: function() {},
        validatePaginationButtons: function() {
            SCF.Util.announce("reportValidatePaginationButtons", {
                model: this.model,
                currentOffset: this.model.currentOffset,
                lastPageOffset: this.model.lastPageOffset
            });
        },
        initializeSort: function() {

        }
    });

    SCF.BootstrapReportPaginatedTableView = BootstrapReportPaginatedTableView;

    SCF.registerComponent("social/reporting/components/hbs/reporting/datatable/bootstrap/pagination",
        SCF.Model, SCF.ReportPaginationControlView);
})(SCF);

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

(function(document, $) {
    "use strict";
    $(document).ready(function() {
        var progressionContainer = $(".scf-js-leaderboarditem-progression");
        var thresholds = progressionContainer.data("thresholds");
        if (thresholds) {
            // Assuming the thresholds are in ascending order.
            // So pickin the last value
            var maxThreshold = thresholds[thresholds.length - 1];
            $(".scf-js-progress").attr("aria-valuemax", maxThreshold);
        }
    });
})(document, $);

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

    var LeaderboardModel = SCF.Model.extend({
        modelName: "LeaderboardModel",
        loadDataAsync: function() {
            this.url = this.get("pageInfo").urlpattern.replace(".html", ".json").replace(
                    ".10", "." + this.get("displayLimit"))
                .replace("${startIndex}", "0");

            this.url = this.url + SCF.Util.getContextPath();

            var that = this;

            this.fetch({
                success: function(collection, response) {
                    if (!_.isUndefined(response.items) && response.items.length > 0) {
                        that.set("model", response);
                    }
                }
            });
        }
    });
    var LeaderboardView = SCF.BootstrapReportPaginatedTableView.extend({
        viewName: "LeaderboardView",
        className: "scf-leaderboard",

        init: function() {
            this.collection = this.model.get("items");
            SCF.BootstrapReportPaginatedTableView.prototype.init.apply(this);
            this.listenTo(this.model, "change:pageInfo", this.onPageInfoChange);
            this.model.loadDataAsync();
        },
        paginate: function() {
            var baseURL = SCF.config.urlRoot + this.model.get("id") + SCF.constants.SOCIAL_SELECTOR + ".";
            var parsedOffset = arguments[1];
            var parsedSize = arguments[2];
            var parsedIndexName = (arguments.length <= 3) ? null : arguments[3];
            var url = null;
            if (arguments.length <= 3) {
                url = baseURL + parsedOffset + "." + parsedSize + SCF.constants.JSON_EXT;
            } else {
                url = baseURL + "index." + parsedOffset + "." +
                    parsedSize + "." +
                    (parsedIndexName !== undefined ? parsedIndexName + "." : "") +
                    SCF.constants.JSON_EXT;
            }
            this.model.url = url;
            this.model.reload();
        },
        navigate: function(e) {
            var pageInfo = this.model.get("pageInfo");

            var suffixObj = $(e.currentTarget).data("pageSuffix");
            var suffix = suffixObj.toString();
            var suffixInfo = suffix.split(".");

            if (pageInfo.selectedIndex !== null) {
                this.paginate(pageInfo.basePageURL, suffixInfo[0], suffixInfo[1], pageInfo.selectedIndex);
            } else {
                this.paginate(pageInfo.basePageURL, suffixInfo[0], suffixInfo[1]);
            }
        }
    });

    SCF.LeaderboardModel = LeaderboardModel;
    SCF.LeaderboardView = LeaderboardView;

    SCF.registerComponent("social/gamification/components/hbs/leaderboard",
        SCF.LeaderboardModel, SCF.LeaderboardView);
})(SCF);

