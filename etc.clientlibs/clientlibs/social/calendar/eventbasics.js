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
/*
 * location: /libs/clientlibs/social/calendar/eventbasics/eventbasicsinit.js
 * category: [cq.social.calendar.eventbasics]
 */
(function(CQ, $CQ) {
    "use strict";
    CQ.soco = CQ.soco || {};
    CQ.soco.calendar = CQ.soco.calendar || {};
    CQ.soco.calendar.hbs = CQ.soco.calendar.hbs || {};
    CQ.soco.calendar.eventbasics = CQ.soco.calendar.eventbasics || {};
    CQ.soco.calendar.hbs.eventbasics = CQ.soco.calendar.hbs.eventbasics || {};
    var localEvents = {};
    localEvents.CLEAR = "lcl.cq.soco.events.clear";

    CQ.soco.calendar.eventbasics.UGCPath = undefined;
    CQ.soco.calendar.eventbasics.timeZone = undefined;
    CQ.soco.calendar.eventbasics.dates_changed = undefined;
    // date formats incl. timezone that can be handled by the
    // SlingPostServlet (even pre 5.3 versions):
    // iso8601 like with rfc822 style timezone at the end
    CQ.soco.calendar.eventbasics.DATETIME_FORMAT = "YYYY-MM-DD\\THH:mm:ss.SSSZ";
    // same, but ensure time part is zero'd and use fixed UTC = 0 offset
    CQ.soco.calendar.eventbasics.DATE_ONLY_FORMAT = "YYYY-MM-DD\\T00:00:00.000Z";
    CQ.soco.calendar.eventbasics.startValue = undefined;
    CQ.soco.calendar.eventbasics.endValue = undefined;
    CQ.soco.calendar.eventbasics.isDateValue = undefined;

    CQ.soco.calendar.eventbasics.getTimesForAutoComplete = function(increment) {
        var date = new Date();
        var constructedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
        var referenceDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
        var addMinutes = function(date, minutes) {
            return new Date(date.getTime() + minutes * 60000);
        };

        //Pad given value to the left with "0"
        var padZero = function(num) {
            return (num >= 0 && num < 10) ? "0" + num : num + "";
        };

        var getFormattedHours = function(date) {
            if (date.getHours() <= 12) {
                if (date.getHours() == 0) {
                    return "12";
                } else {
                    return padZero(date.getHours());
                }
            } else {
                return padZero(date.getHours() - 12);
            }
        };

        var timeArray = new Array();
        while (constructedDate.getDate() == referenceDate.getDate()) {
            timeArray.push(getFormattedHours(constructedDate) + ":" + padZero(constructedDate.getMinutes()) + " " +
                (constructedDate.getHours() >= 12 ? "PM" : "AM"));
            constructedDate = addMinutes(constructedDate, increment);
        }
        return timeArray;
    };

    CQ.soco.calendar.eventbasics.parseDateString = function(date) {
        try {
            return moment(date, moment.localeData().longDateFormat("L"), moment.locale())
                .format(CQ.soco.calendar.eventbasics.DATETIME_FORMAT);
        } catch (e) {
            return NaN;
        }
    };

    CQ.soco.calendar.eventbasics.parseTimeString = function(time) {
        try {
            time = time.replace(/\s/g, '');
            var hour = parseInt(time.substring(0, 2));
            var minutes = parseInt(time.substring(3, 5));
            var ampm = time.substring(5).toLowerCase();
            if (ampm == "am") {
                if (hour == 12) {
                    return (minutes * 60000);
                } else {
                    return ((hour * 60) + minutes) * 60000;
                }
            } else {
                if (hour == 12) {
                    return ((hour * 60) + minutes) * 60000;
                } else {
                    return (((hour + 12) * 60) + minutes) * 60000;
                }
            }
        } catch (e) {
            return NaN;
        }
    };

    CQ.soco.calendar.eventbasics.getTimeFromDate = function(time) {
        var padZero = function(num) {
            return (num >= 0 && num < 10) ? "0" + num : num + "";
        };

        var hour = time.getHours() < 12 ? padZero(time.getHours()) : padZero(time.getHours() - 12);
        hour = parseInt(hour) == 0 ? 12 : hour;
        var minutes = padZero(time.getMinutes());
        var ampm = time.getHours() < 12 ? "AM" : "PM";

        return hour + ":" + minutes + " " + ampm;
    };

    CQ.soco.calendar.eventbasics.getDateTime = function(date, time, timezone, convertToUTC) {
        var dateObj;
        if (!date || !time) {
            return undefined;
        }
        try {
            if (timezone) {
                dateObj = moment.tz(date, moment.localeData().longDateFormat("L"), moment.locale(), timezone).toDate().getTime() +
                    CQ.soco.calendar.eventbasics.parseTimeString(time);
            } else {
                dateObj = moment(date, moment.localeData().longDateFormat("L"), moment.locale()).toDate().getTime() +
                    CQ.soco.calendar.eventbasics.parseTimeString(time);
            }
            if (convertToUTC) {
                return moment(new Date(dateObj)).tz("UTC").format(CQ.soco.calendar.eventbasics.DATETIME_FORMAT);
            }
            return moment(new Date(dateObj)).format(CQ.soco.calendar.eventbasics.DATETIME_FORMAT);
        } catch (e) {
            return NaN;
        }
    };

    CQ.soco.calendar.eventbasics.getClientDateTime = function(date, time, timezone, convertToUTC) {
        var dateObj;
        if (!date || !time) {
            return undefined;
        }
        try {
                dateObj = moment(date, moment.localeData().longDateFormat("L"), moment.locale()).toDate().getTime() +
                CQ.soco.calendar.eventbasics.parseTimeString(time);
                return new Date(dateObj);
        } catch (e) {
            return NaN;
        }
    };

    CQ.soco.calendar.eventbasics.getRelativeTime = function(date, time, relativeTime) {
        //Return a time that is +1 (default) hour
        if (relativeTime == undefined) {
            relativeTime = 60 * 60000;
        } else {
            relativeTime = relativeTime * 60000;
        }
        if (!date || !time) {
            return undefined;
        }
        try {
            var dateObj = moment(date, moment.localeData().longDateFormat("L"), moment.locale()).toDate().getTime() +
                CQ.soco.calendar.eventbasics.parseTimeString(time);
            dateObj = dateObj + relativeTime;
            return new Date(dateObj);
        } catch (e) {
            return NaN;
        }
    };

    CQ.soco.calendar.eventbasics.getDate = function(date) {
        if (typeof date == "undefined" || date == null) {
            return null;
        }
        if (CQ.soco.calendar.eventbasics.timeZone) {
            return moment(date.shift(CQ.soco.calendar.eventbasics.timeZone))
                .format(CQ.soco.calendar.eventbasics.DATETIME_FORMAT);
        } else {
            return moment(date).format(CQ.soco.calendar.eventbasics.DATETIME_FORMAT);
        }
    };

    CQ.soco.calendar.eventbasics.setTimeZone = function(timeZoneId) {
        //setTimeZone(timeZoneId);
        $CQ("input[name='./timeZone']").val(timeZoneId);
        CQ.soco.calendar.eventbasics.timeZone = timeZoneId;
        var timezone = CQ.soco.calendar.TimeZone.get(timeZoneId);
        if (timezone) {
            if (CQ.soco.calendar.eventbasics.getStartTime()) {
                $CQ("input[name='./start']").val(CQ.soco.calendar.eventbasics
                    .getDate(CQ.soco.calendar.eventbasics.getStartTime()));
                CQ.soco.calendar.eventbasics.adjustEndTime();
                //Set Input and Change Date and Time Values
            }
            if (CQ.soco.calendar.eventbasics.getEndTime()) {
                $CQ("input[name='./end']").val(CQ.soco.calendar.eventbasics
                    .getDate(CQ.soco.calendar.eventbasics.getEndTime()));
                CQ.soco.calendar.eventbasics.adjustEndTime();
                //Set Input and Change Date and Time Values
            }
        }
    };

    CQ.soco.calendar.eventbasics.getStartTime = function() {
        try {
            var starttime = $CQ("#scf-event-basics-start-time").val();
            var startdate = $CQ("#scf-event-basics-start > input").val();
            var tz = $CQ(".scf-event-timepicker-timezone").val();
            if (CQ.soco.calendar.eventbasics.isDate()) {
                starttime = "12:00 AM"
            }
            var startDateTime = CQ.soco.calendar.eventbasics.getDateTime(startdate, starttime, tz);
            return startDateTime;
        } catch (e) {
            return undefined;
        }
    };

    CQ.soco.calendar.eventbasics.getEndTime = function() {
        try {
            var endtime = $CQ("#scf-event-basics-end-time").val();
            var enddate = $CQ("#scf-event-basics-end > input").val();
            var tz = $CQ(".scf-event-timepicker-timezone").val();
            if (CQ.soco.calendar.eventbasics.isDate()) {
                endtime = "12:00 AM"
            }
            var endDateTime = CQ.soco.calendar.eventbasics.getDateTime(enddate, endtime, tz);
            return endDateTime;
        } catch (e) {
            return undefined;
        }
    };

    CQ.soco.calendar.eventbasics.isDate = function() {
        return $CQ('#scf-event-basics-isdate').is(':checked')
    };

    CQ.soco.calendar.eventbasics.adjustEndTime = function() {
        try {
            var starttime = $CQ("#scf-event-basics-start-time").val();
            var endtime = $CQ("#scf-event-basics-end-time").val();
            if (CQ.soco.calendar.eventbasics.isDate()) {
                starttime = "12:00 AM";
                endtime = "12:00 AM";
            }
            var startdate = $CQ("#scf-event-basics-start > input").val();
            var startDateTime = CQ.soco.calendar.eventbasics.getRelativeTime(startdate, starttime, 0);

            var enddate = $CQ("#scf-event-basics-end > input").val();
            var endDateTime = CQ.soco.calendar.eventbasics.getRelativeTime(enddate, endtime, 0);

            if (!enddate) {
                enddate = startdate;
                $CQ("#scf-event-basics-end > input").datepicker("setDate", startDateTime);
                if (!endtime) {
                    endtime = starttime;
                    $CQ("#scf-event-basics-end-time").val(CQ.soco.calendar.eventbasics.getTimeFromDate(startDateTime));
                }
                endDateTime = startDateTime;
            }

            // prevent negative durations
            var duration = endDateTime.getTime() - startDateTime.getTime();
            if (duration < 0) {
                $CQ("#scf-event-basics-end > input").datepicker("setDate", startDateTime);
                $CQ("#scf-event-basics-end-time").val(CQ.soco.calendar.eventbasics.getTimeFromDate(startDateTime));
            }
        } catch (e) {
            return;
        }
    };

    CQ.soco.calendar.eventbasics.setResource = function() {
        var startDateVal = new Date($CQ("#scf-event-basics-start > input").val());
        var padZero = function(num) {
            return (num >= 0 && num < 10) ? "0" + num : num + "";
        };
        if (startDateVal) {
            var year = startDateVal.getFullYear();
            var month = startDateVal.getMonth() + 1;
            var dater = startDateVal.getDate();
            var title = $CQ("input[name='./jcr:title']").val();
            if (title) {
                title = title.replace(':', '');
                title = title.replace(/\s+/g, '');
                //Check for UGC Path
                var resourcePath = CQ.soco.calendar.eventbasics.UGCPath + year + '/' + padZero(month) + '/' +
                    padZero(dater) + '/' + $CQ.trim(title);
                $CQ("input[name=':resource']").val(resourcePath);
            }
        }
    };

    CQ.soco.calendar.eventbasics.setDateandTime = function(input_field, field) {
        if (input_field == "start") {
            $CQ("input[name='./start']").val(CQ.soco.calendar.eventbasics.getStartTime());
        } else {
            var endDateTime = CQ.soco.calendar.eventbasics.getEndTime();
            //TODO Check duration and ensure that end date is not lower that state date and time
            CQ.soco.calendar.eventbasics.adjustEndTime();
            $CQ("input[name='./end']").val(endDateTime);
        }
        //this.setResource();
    };

    CQ.soco.calendar.eventbasics.setPostFields = function(formURL) {
        $CQ("input[name='./start']").val(CQ.soco.calendar.eventbasics.getStartTime());
        CQ.soco.calendar.eventbasics.adjustEndTime();
        var endDateTime = CQ.soco.calendar.eventbasics.getEndTime();
        $CQ("input[name='./end']").val(endDateTime);
        if (formURL && formURL.indexOf("form.create.html") != -1) {
            CQ.soco.calendar.eventbasics.setResource();
        }
    };

    CQ.soco.calendar.eventbasics.toggleIsDate = function() {
        if (CQ.soco.calendar.eventbasics.isDate()) {
            $CQ(".scf-form_datepicker_right").hide();
        } else {
            $CQ(".scf-form_datepicker_right").show();
        }
    };

    CQ.soco.calendar.eventbasics.deleteEvent = function(path, onlyThis) {
        var url = path;
        var http = CQ.HTTP ? CQ.HTTP : CQ.shared.HTTP;
        url = url + ".social.deleteevent" + ".html";
        url = http.addParameter(url,
            CQ.Sling.STATUS, CQ.Sling.STATUS_BROWSER);
        if (onlyThis) {
            url = http.addParameter(url, ":deleteFromRecurrence", "");
        }

        var posting = $CQ.post(url);
        posting.done(function(data) {
            location.reload();
        });
    };

    CQ.soco.calendar.eventbasics.showUGCFormAsDialog = function(formURL, targetDiv) {
        var $CQtargetDivId = $CQ(targetDiv);
        $CQtargetDivId.css('z-index', 90002);
        var targetDivId = $CQtargetDivId.attr('id');
        var divId = 'modalIframeParent' + Math.random().toString(36).substring(2, 4);
        var iFrameName = 'modalIframe' + Math.random().toString(36).substring(2, 4);
        if (!targetDivId) {
            $CQtargetDivId.attr('id', divId);
            targetDivId = divId;
        }
        $CQtargetDivId.dialog({
            modal: true,
            height: 500,
            width: 750,
            zIndex: 90000,
            buttons: {
                Submit: function() {
                    var $dialog = $CQ(this);
                    var modal_form = $CQ('iframe.modalIframeClass', $CQtargetDivId).contents().find("form");
                    var setPostFields = window[iFrameName].CQ.soco.calendar.eventbasics.setPostFields;
                    if (setPostFields && typeof setPostFields === 'function') {
                        setPostFields(formURL);
                    }
                    var fields = new Object();
                    $CQ(modal_form).find(":input").each(function() {
                        fields[$CQ(this).attr('name')] = $CQ(this).val();
                    });
                    var formId = $CQ(modal_form).find("input[name=':formid']").val();
                    if (formId) {
                        var fnName = 'cq5forms_preCheck_' + formId;
                        var fn = window[iFrameName][fnName];
                        if (fn && typeof fn === 'function') {
                            if (!fn('Submit')) {
                                return false;
                            }
                        }
                    }
                    var url = $CQ(modal_form).attr('action');
                    var posting = $CQ.post(url, fields);
                    posting.done(function(data) {
                        $dialog.dialog("close");
                        //location.reload();
                        $CQtargetDivId.trigger(CQ.soco.calendar.events.EVENTSMODIFIED);
                    });
                },
                Cancel: function() {
                    $CQ(this).dialog("close");
                }
            }
        });
        $CQtargetDivId.html("<iframe class='modalIframeClass' name='" + iFrameName + "' width='100%' height='100%' \
                       marginWidth='0' marginHeight='0' frameBorder='0' />").css('overflow', 'hidden').dialog("open");
        $CQ('#' + targetDivId + " .modalIframeClass").attr("src", formURL);
        $CQ('#' + targetDivId + " .modalIframeClass").css('overflow', 'hidden');
        $CQtargetDivId.css('overflow', 'hidden');
        return false;
    };
})(CQ, $CQ);

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
/*
 * location: /libs/clientlibs/social/calendar/eventbasics/eventbasicsutils.js
 * category: [cq.social.calendar.eventbasics]
 */

$CQ(function() {
    CQ.soco.calendar.eventbasics.init();
});

CQ.soco.calendar.eventbasics.initDatePickerLocale = function() {
    if ($CQ.datepicker) {
        var defaultLocale = CQ.I18n.getLocale();
        var res = /[\?&]locale=([^&#]*)/.exec(window.location.href);
        var locale = res && res[1] ? window.decodeURIComponent(res[1]) : defaultLocale;
        if (moment.locale() !== locale) {
            moment.locale(locale);
        }
        locale = moment.locale();
        var l = $CQ.datepicker.regional[locale] || $CQ.datepicker.regional[""];
        l.dateFormat = CQ.soco.calendar.hbs.eventbasics.convertMomentToDatePickerFormat(
            moment.localeData().longDateFormat("L"));
        l.firstDay = moment.localeData().firstDayOfWeek();
        l.dayNames = moment.weekdays();
        l.dayNamesShort = moment.weekdaysShort();
        l.dayNamesMin = moment.weekdaysMin();
        l.monthNames = moment.months();
        l.monthNamesShort = moment.monthsShort();
        l.prevText = CQ.I18n.get("Prev");
        l.nextText = CQ.I18n.get("Next");
        $CQ.datepicker.regional[locale] = l;
        $CQ.datepicker.setDefaults(l);
        return l;
    }
    return {};
};

CQ.soco.calendar.eventbasics.init = function() {
    CQ.soco.calendar.eventbasics.initTimezone();
    $CQ("#scf-event-basics-start-input").datepicker({
        changeMonth: true,
        numberOfMonths: 2,
        onClose: function(selectedDate) {
            $CQ("#scf-event-basics-end > input").datepicker("option", "minDate", selectedDate);
        }
    });
    $CQ("#scf-event-basics-start-input").datepicker(CQ.soco.calendar.eventbasics.initDatePickerLocale());
    $CQ("#scf-event-basics-end-input").datepicker({
        changeMonth: true,
        numberOfMonths: 2,
        onClose: function(selectedDate) {
            $CQ("#scf-event-basics-start > input").datepicker("option", "maxDate", selectedDate);
        }
    });
    $CQ("#scf-event-basics-end-input").datepicker(CQ.soco.calendar.eventbasics.initDatePickerLocale());

    $CQ('#scf-event-basics-isdate').change(function() {
        CQ.soco.calendar.eventbasics.toggleIsDate();
    });
    CQ.soco.calendar.eventbasics.toggleIsDate();

    if (CQ.soco.calendar.eventbasics.startValue && CQ.soco.calendar.eventbasics.startValue instanceof Date) {
        $CQ("#scf-event-basics-start > input").datepicker("setDate", CQ.soco.calendar.eventbasics.startValue);
        $CQ("#scf-event-basics-start-time")
            .val(CQ.soco.calendar.eventbasics.getTimeFromDate(CQ.soco.calendar.eventbasics.startValue));
    }

    if (CQ.soco.calendar.eventbasics.endValue && CQ.soco.calendar.eventbasics.endValue instanceof Date) {
        $CQ("#scf-event-basics-end-input").datepicker("setDate", CQ.soco.calendar.eventbasics.endValue);
        $CQ("#scf-event-basics-end-time")
            .val(CQ.soco.calendar.eventbasics.getTimeFromDate(CQ.soco.calendar.eventbasics.endValue));
    }
    $CQ("#scf-event-basics-start-input").change(function(event) {
        //$CQ("input[name='./start']").val(parseDateString($CQ(event.currentTarget).val()));
        CQ.soco.calendar.eventbasics.setDateandTime("start", $CQ(this));
    });
    $CQ("#scf-event-basics-end-input").change(function(event) {
        CQ.soco.calendar.eventbasics.setDateandTime("end", $CQ(this));
    });

    var autocompleteResponseHandler = function(event, data) {
        if (data && data.content && data.content.length === 0) {
            event.stopPropagation();
            event.preventDefault();
            var self = this;
            setTimeout(function() {
                $CQ(self).autocomplete("search", "");
            }, 100);
        }
    };

    var fixAutocompleteStyles = function(selector) {
        if ($CQ(selector).length) {
            $CQ(selector).data("ui-autocomplete")._renderMenu = function(ul, items) {
                $CQ.ui.autocomplete.prototype._renderMenu(ul, items);
                $CQ(ul).addClass("scf-calendar-autocomplete-menu");
            }
        }
    };

    $CQ("#scf-event-basics-start-time").autocomplete({
        source: CQ.soco.calendar.eventbasics.getTimesForAutoComplete(30),
        minLength: 0,
        response: autocompleteResponseHandler
    }).bind('focus', function() {
        $CQ(this).autocomplete("search");
    });
    fixAutocompleteStyles("#scf-event-basics-start-time");
    $CQ("#scf-event-basics-end-time").autocomplete({
        source: CQ.soco.calendar.eventbasics.getTimesForAutoComplete(30),
        minLength: 0,
        response: autocompleteResponseHandler
    }).bind('focus', function() {
        $CQ(this).autocomplete("search");
    });
    fixAutocompleteStyles("#scf-event-basics-end-time");
    $CQ("#scf-event-basics-start-time").on('autocompletechange', function() {
        CQ.soco.calendar.eventbasics.setDateandTime("start", $CQ(this));
        if (CQ.soco.calendar.eventbasics.getStartTime() && CQ.soco.calendar.eventbasics.getEndTime()) {
            CQ.soco.calendar.eventbasics.adjustEndTime();
        }
    });
    $CQ("#scf-event-basics-end-time").on('autocompletechange', function() {
        CQ.soco.calendar.eventbasics.setDateandTime("end", $CQ(this));
        if (CQ.soco.calendar.eventbasics.getStartTime() && CQ.soco.calendar.eventbasics.getEndTime()) {
            CQ.soco.calendar.eventbasics.adjustEndTime();
        }
    });
};

CQ.soco.calendar.hbs.eventbasics.convertMomentToDatePickerFormat = function(momentFormat) {
    // Hint:
    //        D->d - day of month (no leading zero)
    //        DD->dd - day of month (two digit)
    //        DDD->o - day of the year (no leading zeros)
    //        DDDD->oo - day of the year (three digit)
    //        dd,ddd->D - day name short
    //        dddd->DD - day name long
    //        M->m - month of year (no leading zero)
    //        MM->mm - month of year (two digit)
    //        MMM->M - month name short
    //        MMMM->MM - month name long
    //        YY->y - year (two digit)
    //        YYYY->yy - year (four digit)
    var convArr = [
        ["DDDD", "oo"],
        ["DDD", "o"],
        ["DD", "dd"],
        ["D", "d"],
        ["dddd", "DD"],
        ["ddd", "D"],
        ["dd", "D"],
        ["MMMM", "MM"],
        ["MMM", "M"],
        ["MM", "mm"],
        ["M", "m"],
        ["YYYY", "yy"],
        ["YY", "y"]
    ];
    var datePickerFormat = String(momentFormat);
    for (var i = 0; i < convArr.length; i++) {
        if (datePickerFormat.indexOf(convArr[i][0]) !== -1) {
            datePickerFormat = datePickerFormat.replace(convArr[i][0], "{" + i + "}");
        }
    }
    for (var i = 0; i < convArr.length; i++) {
        datePickerFormat = datePickerFormat.replace("{" + i + "}", convArr[i][1]);
    }
    return datePickerFormat;
};

CQ.soco.calendar.eventbasics.initTimezone = function(domElement, model) {
    if (!CQ.soco.calendar.eventbasics.timeZones) {
        $CQ.ajax({
            url: SCF.config.urlRoot + "/.timezones.json",
            dataType: "json",
            success: function(data) {
                CQ.soco.calendar.eventbasics.timeZones = data;
                if (domElement && model) {
                    CQ.soco.calendar.hbs.eventbasics.init(domElement, model);
                }
            }
        });
        return false;
    }
    return true;
};

CQ.soco.calendar.hbs.eventbasics.init = function(domElement, model) {
    CQ.soco.calendar.eventbasics.initDatePickerLocale(model);
    if (!CQ.soco.calendar.eventbasics.initTimezone(domElement, model)) {
        return;
    }
    $el = $CQ(domElement);
    $el.find(".scf-js-event-basics-start-input").datepicker({
        dateFormat: model && model.get("localeDateFormat") ?
            CQ.soco.calendar.hbs.eventbasics.convertMomentToDatePickerFormat(model.get("localeDateFormat")) : undefined,
        changeMonth: true,
        numberOfMonths: 2,
        beforeShow: function(input, inst) {
            $CQ('#ui-datepicker-div').wrap("<div class='scf-datepicker'></div>");
        },
        onClose: function(selectedDate) {
            $el.find(".scf-js-event-basics-end-input").datepicker("option", "minDate", selectedDate);
        }
    });
    $el.find(".scf-js-event-basics-start-input").datepicker(CQ.soco.calendar.eventbasics.initDatePickerLocale());
    $el.find(".scf-js-event-basics-end-input").datepicker({
        dateFormat: model && model.get("localeDateFormat") ?
            CQ.soco.calendar.hbs.eventbasics.convertMomentToDatePickerFormat(model.get("localeDateFormat")) : undefined,
        changeMonth: true,
        numberOfMonths: 2,
        beforeShow: function(input, inst) {
            $CQ('#ui-datepicker-div').wrap("<div class='scf-datepicker'></div>");
        },
        onClose: function(selectedDate) {
            $el.find(".scf-js-event-basics-start-input").datepicker("option", "maxDate", selectedDate);
        }
    });
    $el.find(".scf-js-event-basics-end-input").datepicker(CQ.soco.calendar.eventbasics.initDatePickerLocale());

    $el.find('.scf-js-event-basics-isdate').change(function() {
        CQ.soco.calendar.eventbasics.toggleIsDate();
    });
    CQ.soco.calendar.eventbasics.toggleIsDate();

    if (CQ.soco.calendar.eventbasics.startValue && CQ.soco.calendar.eventbasics.startValue instanceof Date) {
        $el.find(".scf-js-event-basics-start-input").datepicker("setDate", CQ.soco.calendar.eventbasics.startValue);
        $el.find(".scf-js-event-basics-start-time")
            .val(CQ.soco.calendar.eventbasics.getTimeFromDate(CQ.soco.calendar.eventbasics.startValue));
    }

    if (CQ.soco.calendar.eventbasics.endValue && CQ.soco.calendar.eventbasics.endValue instanceof Date) {
        $el.find(".scf-js-event-basics-end-input").datepicker("setDate", CQ.soco.calendar.eventbasics.endValue);
        $el.find(".scf-js-event-basics-end-time")
            .val(CQ.soco.calendar.eventbasics.getTimeFromDate(CQ.soco.calendar.eventbasics.endValue));
    }
    $el.find(".scf-js-event-basics-start-input").change(function(event) {
        //$CQ("input[name='./start']").val(parseDateString($CQ(event.currentTarget).val()));
        CQ.soco.calendar.eventbasics.setDateandTime("start", $CQ(this));
    });
    $el.find(".scf-js-event-basics-end-input").change(function(event) {
        CQ.soco.calendar.eventbasics.setDateandTime("end", $CQ(this));
    });

    var autocompleteResponseHandler = function(event, data) {
        if (data && data.content && data.content.length === 0) {
            event.stopPropagation();
            event.preventDefault();
            var self = this;
            setTimeout(function() {
                $CQ(self).autocomplete("search", "");
            }, 100);
        }
    };

    var fixAutocompleteStyles = function(selector) {
        if ($el.find(selector).length) {
            $el.find(selector).data("ui-autocomplete")._renderMenu = function(ul, items) {
                $CQ.ui.autocomplete.prototype._renderMenu(ul, items);
                $CQ(ul).addClass("scf-calendar-autocomplete-menu");
            }
        }
    };

    $el.find(".scf-js-event-basics-start-time").autocomplete({
        source: CQ.soco.calendar.eventbasics.getTimesForAutoComplete(30),
        minLength: 0,
        response: autocompleteResponseHandler
    }).bind('focus', function() {
        $CQ(this).autocomplete("search");
    });
    fixAutocompleteStyles(".scf-js-event-basics-start-time");
    $el.find(".scf-js-event-basics-end-time").autocomplete({
        source: CQ.soco.calendar.eventbasics.getTimesForAutoComplete(30),
        minLength: 0,
        response: autocompleteResponseHandler
    }).bind('focus', function() {
        $CQ(this).autocomplete("search");
    });
    fixAutocompleteStyles(".scf-js-event-basics-end-time");

    $el.find(".scf-js-event-basics-start-time").on('autocompletechange', function() {
        CQ.soco.calendar.eventbasics.setDateandTime("start", $CQ(this));
        if (CQ.soco.calendar.eventbasics.getStartTime() && CQ.soco.calendar.eventbasics.getEndTime()) {
            CQ.soco.calendar.eventbasics.adjustEndTime();
        }
    });
    $el.find(".scf-js-event-basics-end-time").on('autocompletechange', function() {
        CQ.soco.calendar.eventbasics.setDateandTime("end", $CQ(this));
        if (CQ.soco.calendar.eventbasics.getStartTime() && CQ.soco.calendar.eventbasics.getEndTime()) {
            CQ.soco.calendar.eventbasics.adjustEndTime();
        }
    });

    $el.find("select.scf-event-timepicker").remove();
    $el.find("input[data-timepicker-type='select']").each(function(i, elem) {
        var timeZone;
        var onTimeZoneChange = function(e) {
            var timeInput = $CQ(e.target).attr("data-for");
            var isStart = timeInput == "scf-js-event-basics-start-time";
            var dateInput = isStart ? "scf-js-event-basics-start-input" : "scf-js-event-basics-end-input";
            var val = $el.find("." + timeInput + "-timezone").val();
            model.set("timezone", val);
        };
        $CQ(this).hide();
        var isStart = $CQ(this).hasClass("scf-js-event-basics-start-time");
        var dateInputClass = isStart ? "scf-js-event-basics-start-input" : "scf-js-event-basics-end-input";
        var timeInputClass = isStart ? "scf-js-event-basics-start-time" : "scf-js-event-basics-end-time";
        var datetime = new Date(Date.parse(CQ.soco.calendar.eventbasics.getDateTime(
            $el.find("." + dateInputClass).val(),
            $el.find("." + timeInputClass).val())));
        var hours = datetime.getHours() > 12 ? (datetime.getHours() - 12) : (datetime.getHours() == 0 ? 12 :
            datetime.getHours());
        var minutes = datetime.getMinutes();

        var onTimepickerChange = function(e) {
            var timeInput = $CQ(e.target).attr("data-for");
            var isStart = timeInput == "scf-js-event-basics-start-time";
            var dateInput = isStart ? "scf-js-event-basics-start-input" : "scf-js-event-basics-end-input";
            var val = $el.find("." + timeInput + "-hours").val() + ":" +
                $el.find("." + timeInput + "-minutes").val() + " " + $el.find("." + timeInput + "-ampm").val();
            $el.find("." + timeInput).val(val);
            CQ.soco.calendar.eventbasics.setDateandTime(isStart ? "start" : "end", $el.find("." + timeInput));
            if (CQ.soco.calendar.eventbasics.getStartTime() && CQ.soco.calendar.eventbasics.getEndTime()) {
                CQ.soco.calendar.eventbasics.adjustEndTime();
                var edt = new Date(Date.parse(CQ.soco.calendar.eventbasics.getClientDateTime(
                    $el.find(".scf-js-event-basics-end-input").val(),
                    $el.find(".scf-js-event-basics-end-time").val(),
                    $el.find(".scf-event-timepicker-timezone").val())));
                var h = edt.getHours() > 12 ? (edt.getHours() - 12) : (edt.getHours() == 0 ? 12 : edt.getHours());
                var m = edt.getMinutes();
                $el.find(".scf-js-event-basics-end-time-hours option").prop("selected", false).attr("selected", false);
                $el.find(".scf-js-event-basics-end-time-hours option[value='" + (h < 10 ? ("0" + h) : h) + "']")
                    .prop("selected", true).attr("selected", true);
                $el.find(".scf-js-event-basics-end-time-minutes option").prop("selected", false)
                    .attr("selected", false);
                $el.find(".scf-js-event-basics-end-time-minutes option[value='" + (m < 10 ? ("0" + m) : m) + "']")
                    .prop("selected", true).attr("selected", true);
                var am = String($el.find(".scf-js-event-basics-end-time").val()).toUpperCase().indexOf("AM") != -1;
                $el.find(".scf-js-event-basics-end-time-ampm option[value='AM']").prop("selected", am)
                    .attr("selected", am);
                $el.find(".scf-js-event-basics-end-time-ampm option[value='PM']").prop("selected", !am)
                    .attr("selected", !am);
            }
        };

        var hh = $CQ("<select></select>");
        hh.addClass(timeInputClass + "-hours form-control scf-event-timepicker");
        hh.attr("data-for", timeInputClass);
        for (var i = 1; i < 13; i++) {
            var opt = $CQ("<option></option>");
            var val = i < 10 ? ("0" + i) : i;
            opt.attr("value", val);
            opt.text(val);
            if (hours == i) {
                opt.prop("selected", true).attr("selected", true);
            }
            hh.append(opt);
        }
        hh.change(onTimepickerChange);
        var mm = $CQ("<select></select>");
        mm.addClass(timeInputClass + "-minutes form-control scf-event-timepicker");
        mm.attr("data-for", timeInputClass);
        for (var i = 0; i < 60; i++) {
            var opt = $CQ("<option></option>");
            var val = i < 10 ? ("0" + i) : i;
            opt.attr("value", val);
            opt.text(val);
            if (minutes == i) {
                opt.prop("selected", true).attr("selected", true);
            }
            mm.append(opt);
        }
        mm.change(onTimepickerChange);
        var ampm = $CQ("<select><option value='AM'>AM</option><option value='PM'>PM</option></select>");
        ampm.addClass(timeInputClass + "-ampm form-control scf-event-timepicker scf-event-timepicker-ampm");
        ampm.attr("data-for", timeInputClass);
        if (String($CQ(this).val()).toUpperCase().indexOf("AM") != -1) {
            ampm.find("option[value='AM']").prop("selected", true).attr("selected", true);
        } else {
            ampm.find("option[value='PM']").prop("selected", true).attr("selected", true);
        }
        ampm.change(onTimepickerChange);
        var currentZoneName =  moment.tz.guess();
        var currentZoneOffset = moment.tz(currentZoneName).format('Z');
        var currentZoneNamePresent = false;
        if ($CQ(this).attr("data-timepicker-timezone") === "true") {
            timeZone = $CQ("<select></select>");
            timeZone.addClass(timeInputClass +
                "-timezone form-control scf-event-timepicker scf-event-timepicker-timezone");
            timeZone.attr("data-for", timeInputClass);
            timeZone.attr("data-attrib", "timezone");
            timeZone.attr("name", "timezone");
            for (i = 0; i < CQ.soco.calendar.eventbasics.timeZones.length; i++) {
                opt = $CQ("<option></option>");
                val = String(CQ.soco.calendar.eventbasics.timeZones[i].value);
                var splitTimeZone = val.split("/");
                opt.attr("value", CQ.I18n.get(splitTimeZone[0]) + "/" + CQ.I18n.get(splitTimeZone[1]));
                opt.text(val);
                var zoneOffset = moment.tz(val).format('Z');
                if (val === currentZoneName) {
                    currentZoneNamePresent = true;
                    opt.prop("selected", true).attr("selected", true);
                }
                else if (zoneOffset === currentZoneOffset && !currentZoneNamePresent) {
                   opt.prop("selected", true).attr("selected", true);
                }
                timeZone.append(opt);
            }
            timeZone.change(onTimeZoneChange);
        }

        $CQ(this).after(hh);
        hh.after(mm);
        mm.after(ampm);
        if (timeZone) {
            ampm.after(timeZone);
        }
    });

};

