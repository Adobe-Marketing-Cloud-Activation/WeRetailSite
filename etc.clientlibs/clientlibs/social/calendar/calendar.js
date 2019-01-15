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
 * location: /libs/social/calendar/widgets/source/TimeZone.js
 * category: [cq.social.calendar]
 */

// ensure social calendar package

(function(CQ, $CQ) {

    "use strict";
    CQ.soco = CQ.soco || {};
    CQ.soco.calendar = CQ.soco.calendar || {};
    var localEvents = {};
    localEvents.CLEAR = "lcl.cq.soco.events.clear";


    CQ.soco.calendar.WEEK_DAYS = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];

    CQ.soco.calendar.FREQUENCIES = {
        "yearly": Date.YEAR,
        "monthly": Date.MONTH,
        "weekly": Date.WEEK,
        "daily": Date.DAY,
        "hourly": Date.HOUR,
        "minutely": Date.MINUTE,
        "secondly": Date.SECOND
    };

    CQ.soco.calendar.increment = function(rule, date /* Date */ ) {
        return date.add(this.FREQUENCIES[rule.frequency], rule.interval || 1);
    };

    // gives a list of possible dates generated from the
    // by* rules, starting with date
    // returns an array of Date objects

    CQ.soco.calendar.calculateCandidates = function(rule, date /* Date */ ) {
        var dates = []; /* array of Date objects */
        dates.push(date);

        // inner helper function to go through dates array

        function adjustDates(dates, arr, func) {
            if (!arr) {
                return dates;
            }
            var result = [];
            for (var i = 0; i < dates.length; i++) {
                var d = dates[i];
                for (var j = 0; j < arr.length; j++) {
                    func(d, arr[j], result, j);
                }
            }
            return result;
        }

        // 1. by month
        dates = adjustDates(dates, rule.byMonth, function(date, byMonth, result) {
            // byMonth is 1-12, javascript Date uses 0-11 for month
            date.setMonth(byMonth - 1);
            result.push(date);
        });

        // 2. by month day
        dates = adjustDates(dates, rule.byMonthDay, function(date, byMonthDay, result) {
            if (byMonthDay > 0) {
                date.setDate(byMonthDay);
            } else {
                date.setDate(date.getLastDayOfMonth() + byMonthDay);
            }
            result.push(date);
        });

        // 3. by week day (day + offset)
        dates = adjustDates(dates, rule.byWeekDay, function(date, byWeekDay, result, index) {
            var weekDayNr = CQ.soco.calendar.WEEK_DAYS.indexOf(byWeekDay);

            if (rule.byMonthDay) {
                // if byMonthDay is given, list must be filtered
                // => keep date only when the weekday matches
                if (date.getDay() == weekDayNr) {
                    result.push(date);
                }
            } else {
                // otherwise generate and add all days with a
                // matching weekday, starting with date
                var days = [];

                if (rule.frequency == 'monthly' || rule.byMonth) {
                    var sameMonth = date.getMonth();
                    // start at first day of the month
                    date.setDate(1);
                    // find the first day with a matching week day
                    while (date.getDay() != weekDayNr) {
                        date = date.add(Date.DAY, 1);
                    }
                    // collect all days in this month with this weekday (every 7 days)
                    while (date.getMonth() == sameMonth) {
                        days.push(date.clone());
                        date = date.add(Date.DAY, 7);
                    }

                } else if (rule.frequency == 'yearly') {
                    var sameYear = date.getYear();
                    // start at first day of the year
                    date = date.add(Date.DAY, -date.getDayOfYear());
                    // find the first day with a matching week day
                    while (date.getDay() != weekDayNr) {
                        date = date.add(Date.DAY, 1);
                    }
                    // collect all days in this year with this weekday (every 7 days)
                    while (date.getYear() == sameYear) {
                        days.push(date.clone());
                        date = date.add(Date.DAY, 7);
                    }
                }

                // now calculate offsets
                var offset = rule.byWeekDayOffset[index];
                if (offset == 0) {
                    // no offset adoption necessary, copy all days into result
                    for (var i = 0; i < days.length; i++) {
                        result.push(days[i]);
                    }
                } else {
                    if (offset >= -days.length && offset < 0) {
                        // negative offset
                        result.push(days[days.length + offset]);
                    } else if (offset > 0 && offset <= days.length) {
                        // positive offset
                        result.push(days[offset - 1]);
                    }
                }
            }
        });

        return dates;
    };

    // calculates recurring dates based on the rule
    // in the period given by from and to (inclusive)
    // returns dates as utc millis

    CQ.soco.calendar.calculateRecurDates = function(rule, from /* utc millis */ , to /* utc millis */ ) {
        var dates = []; /* array of utc millis (number) */
        var runDate = new Date(from);
        var i;

        var candidate = null;
        var counter = 0;
        // (open) loop to collect recurrences
        while (counter < 100) {
            counter++;
            // stop collecting when we reach the end of the period specified
            if (candidate && candidate.getTime() > to) {
                break;
            }

            var candidates = this.calculateCandidates(rule, runDate.clone());
            for (i = 0; i < candidates.length; i++) {
                candidate = candidates[i];
                // only use candidates that lie in the given period
                if (candidate.getTime() >= from && candidate.getTime() <= to) {
                    dates.push(candidate.getTime());
                }
            }

            runDate = this.increment(rule, runDate);
        }
        return dates;
    };

    // calculates the onset in UTC for localdates (start and dates
    // property of an observance, which are given in local time);
    // needs to subtract the offsetFrom which indicates the offset
    // to UTC right before the observance starts

    CQ.soco.calendar.getOnsetAsUTC = function(obs, localdate) {
        //return new Date(localdate.getTime() - obs.offsetFrom);
        return localdate - obs.offsetFrom;
    };

    // finds the latest onset of a given observance for the date
    // returns the onset as utc millis

    CQ.soco.calendar.getLatestOnset = function(obs, date /* utc millis */ ) {
        if (!obs.initialOnset) {
            if (typeof obs.start === "string") {
                // convert date string to utc millis
                obs.start = new Date(obs.start).getTime();
            }
            // when this observance starts for the first time ever, in UTC
            obs.initialOnset = this.getOnsetAsUTC(obs, obs.start);
        }
        // if the date is before anything this observance covers, stop
        if (date < obs.initialOnset) {
            return null;
        }

        var onset = obs.initialOnset;
        var i, j;

        if (obs.dates) {
            // look through the explicit list of dates when this
            // observances starts (or started)
            for (i = 0; i < obs.dates.length; i++) {
                if (typeof obs.dates[i] === "string") {
                    // convert date string to utc millis
                    obs.dates[i] = new Date(obs.dates[i]).getTime();
                }
                var candidate = this.getOnsetAsUTC(obs, obs.dates[i]);
                // latest onset before the actual date (incl.) wins
                if (candidate <= date && candidate > onset) {
                    onset = candidate;
                }
            }
        }

        if (obs.rules) {
            // look through the recurrence rules for the start
            // of this observance
            for (i = 0; i < obs.rules.length; i++) {
                // calculate onset dates from rule
                var recurDates = this.calculateRecurDates(obs.rules[i], onset, date);
                for (j = 0; j < recurDates.length; j++) {
                    var candidate = recurDates[j];
                    // latest onset before the actual date (incl.) wins
                    if (candidate <= date && candidate > onset) {
                        onset = candidate;
                    }
                }
            }
        }

        return onset;
    };
})(CQ, $CQ);

(function(CQ, $CQ) {

    "use strict";
    CQ.soco = CQ.soco || {};
    CQ.soco.calendar = CQ.soco.calendar || {};
    CQ.soco.calendar.TimeZone = CQ.soco.calendar.TimeZone || {};
    var localEvents = {};
    localEvents.CLEAR = "lcl.cq.soco.events.clear";

    /**
     * @class CQ.soco.calendar.TimeZone
     * Represents a timezone including rules for calculating the different
     * daylight or standard time offsets depending on the date.
     *
     * @constructor
     * Takes an timezone description object based on a simple JSON mapping
     * of the icalendar VTIMEZONE object. Example (please note that it's
     * purely fictional in order to show all possible properties):
<pre>
{
    "tzID":  "Europe/Totally-Made-Up",
    "tzURL": "http://tzurl.org/zoneinfo/Europe/Berlin", // optional

    "observances": [ {
        "daylight":   true,    // if not set or false => standard
        "tzName":     "CEST",  // optional
        "offsetFrom": 3600000, // = 1h, unit are milliseconds
        "offsetTo":   7200000, // = 2h, dito
        "start":      "So Mrz 29 1981 02:00:00 GMT+0000",
        "dates": [
            "So Apr 30 1916 23:00:00 GMT+0000",
            "Mo Apr 16 1917 02:00:00 GMT+0000"
        ],
        "rules": [{
            "frequency":       "yearly",
                // yearly, monthly, weekly, daily, hourly, minutely, secondly
            "interval":        1,         // optional, default is 1
            "byWeekDay":       [ "SU" ],  // SU MO TU WE TH FR SA
            "byWeekDayOffset": [ -1   ],  // corresponds to byWeekDay
            "byMonth":         [ 3 ],     // January = 1, December = 12
            "byMonthDay":      [ 1 ]
        }]
    }]
}
</pre>
     * @param {Object} tzInfo a timezone description as detailed above
     *
     */
    CQ.soco.calendar.TimeZone = function(tzInfo) {

        // fallback default timezone info
        if (!tzInfo) {
            tzInfo = {
                tzID: "Etc/UTC",
                observances: [{
                    tzName: "UTC",
                    offsetFrom: 0,
                    offsetTo: 0,
                    start: "Thu Jan 01 1970 00:00:00 GMT+0000"
                }]
            };
        }

        function findObservanceFor(date) {
            // use utc millis (number) for date
            if (date && typeof date.getTime === "function") {
                date = date.getTime();
            }
            var latestObservance = null;
            var latestOnset = -1;
            // Note: this expects observances to be sorted by their start date
            for (var i = 0; i < tzInfo.observances.length; i++) {
                var obs = tzInfo.observances[i];
                var onset = CQ.soco.calendar.getLatestOnset(obs, date);
                // latest observance wins
                if (onset != null && (latestObservance == null || onset > latestOnset)) {
                    //jstestdriver.console.log("onset: " + onset + " => offset from: " + obs.offsetFrom + " to: " + obs.offsetTo);
                    latestOnset = onset;
                    latestObservance = obs;
                }
            }
            if (!latestObservance && tzInfo.observances.length > 0) {
                // if no observance was found, use the offsetFrom from
                // the first observance (typically for old dates)
                return {
                    offsetTo: tzInfo.observances[0].offsetFrom
                }
            }
            return latestObservance;
        }

        // public functions ---------------------------------

        // returns the timezone ID, eg. "Europe/Berlin"
        this.getID = function() {
            return tzInfo.tzID;
        };

        // returns a timezone source URL such as "http://tzurl.org/zoneinfo/Europe/Berlin"
        this.getTzURL = function() {
            return tzInfo.tzURL;
        }

        // gets the timezone offset from UTC for a given date in milliseconds
        this.getOffset = function(date) {
            var observance = findObservanceFor(date);
            return observance ? observance.offsetTo : 0;
        };

        // gets the timezone offset from UTC for a given date in minutes
        this.getOffsetInMinutes = function(date) {
            return this.getOffset(date) / 60000;
        };

        // returns the tz short name for the given date (eg. CEST or CET)
        this.getShortName = function(date) {
            var observance = findObservanceFor(date);
            return observance ? observance.tzName : null;
        };

        // returns whether the given date is in daylight time
        this.inDaylightTime = function(date) {
            var observance = findObservanceFor(date);
            return observance && observance.daylight;
        };
    };

    CQ.soco.calendar.TimeZone.httpBasePath = "/.timezones.json/";

    /**
     * The timezone ID of the UTC timezone.
     * @static
     */
    CQ.soco.calendar.TimeZone.UTC_ID = "Etc/UTC";
    CQ.soco.calendar.TimeZone.timezones = {};

    /**
     * Set the path from where to load timezone information from
     * the server. Defaults to "/.timezones.json/".
     * @static
     * @param {String} path A server path
     */
    CQ.soco.calendar.TimeZone.setHTTPBasePath = function(path) {
        this.httpBasePath = path;
    };

    /**
     * Force loading of timezone descriptions, using same json
     * structure as if loaded via HTTP. Can be a single object
     * or an array. Each object must provide its timezone ID
     * via obj.tzID. Overwrites any cached tz object for the
     * same ID.
     * @static
     * @param {Array} tzInfos array of time zone definitions as described in {@link #TimeZone}
     */
    CQ.soco.calendar.TimeZone.load = function(tzInfos) {
        if (!$CQ.isArray(tzInfos)) {
            tzInfos = [tzInfos];
        }
        for (var i = 0; i < tzInfos.length; i++) {
            var tzInfo = tzInfos[i];
            this.timezones[tzInfo.tzID] = new CQ.soco.calendar.TimeZone(tzInfo);
        }
    };

    /**
     * Returns a {@link CQ.soco.calendar.TimeZone} by a timezone ID,
     * eg. "Europe/Berlin". Will be null or undefined if none could
     * be found. Will be loaded on demand from an URL given by
     * the base path set in {@link CQ.soco.calendar.TimeZone#TimeZone.setHTTPBasePath setHTTPBasePath} plus the
     * timezone ID.
     * @static
     * @param {String} id timezone ID
     * @return {CQ.soco.calendar.TimeZone} a TimeZone object
     */
    CQ.soco.calendar.TimeZone.get = function(id) {
        var tz = this.timezones[id];
        if (!tz) {
            tz = this.fetchTimeZone(id);
            if (!tz) {
                return null;
            }
            this.timezones[id] = tz;
        }
        return tz;
    };

    CQ.soco.calendar.TimeZone.fetchTimeZone = function(id) {
        var tzInfo = undefined;
        $CQ.ajax({
            url: this.httpBasePath + id,
            success: function(result) {
                tzInfo = result;
            },
            async: false
        });
        if (tzInfo) {
            return new CQ.soco.calendar.TimeZone(tzInfo);
        } else {
            return undefined;
        }
    };
})(CQ, $CQ);

(function(CQ, $CQ) {

    "use strict";
    CQ.soco = CQ.soco || {};
    CQ.soco.calendar = CQ.soco.calendar || {};
    CQ.soco.calendar.Date = CQ.soco.calendar.Date || {};
    var localEvents = {};
    localEvents.CLEAR = "lcl.cq.soco.events.clear";
    /**
     * @class CQ.soco.calendar.Date
     * @extends Date
     * A fully timezone-enabled extension of the javascript Date class.
     * Uses {@link CQ.soco.calendar.TimeZone} as timezone information.
     *
     * @constructor
     * Takes an existing date, shifts it into the given timezone and returns
     * an timezone-enabled Date object.
     * @param {Number/String/Date/CQ.soco.calendar.Date} date
     *              the base date: can be utc millis, a date string that can be parsed
     *              via Date.parse(), a Date or an existing CQ.soco.calendar.Date object
     * @param {String/CQ.soco.calendar.TimeZone} tz timezone ID or timezone object
     */
    CQ.soco.calendar.Date = function(date, tz) {

        if (typeof date === "number") {
            // utc millis
            date = new Date(date);
        } else if (typeof date === "string") {
            // date string, eg. "Wed Aug 27 2008 23:59:59 GMT+0200"
            date = new Date(Date.parse(date));
        }

        if (typeof tz === "string") {
            tz = CQ.soco.calendar.TimeZone.get(tz);
        }

        var offset = tz.getOffsetInMinutes(date.getTime());

        var result = new Date(date.getBuiltinTime ? date.getBuiltinTime() : date.getTime());

        // shift date by the difference between current local browser
        // timezone and target timezone
        // (see calculateTime() below for the inverse operation)
        result.addOffset(offset + date.getTimezoneOffset());

        result.timezone = tz;
        result.timezoneOffset = offset; // in minutes

        // cache utc millis between setMonth(), etc. calls
        result.lastUTCMillis = result.getTime();

        // add methods (prototype is filled with methods below using CQ.Ext.override)
        var dp = CQ.soco.calendar.Date.prototype;
        for (var m in dp) {
            result[m] = dp[m];
        }

        // automatic way to create all the setUTC*() and getUTC*() methods
        // that need to be overwritten from the standard Date object

        function getterMethod(field) {
            return function() {
                return new Date(this.getTime())["getUTC" + field]();
            }
        }

        function setterMethod(field) {
            return function() {
                // set utc field via temporary date object and using getTime/setTime
                var date = new Date(this.getTime());
                date["setUTC" + field].apply(date, arguments);
                this.setTime(date.getTime());
            }
        }

        var fields = ["Date", "Day", "FullYear", "Hours", "Milliseconds", "Minutes", "Month", "Seconds"];
        for (var i = 0; i < fields.length; i++) {
            var field = fields[i];
            result["getUTC" + field] = getterMethod(field);
            if (field != "Day") { // there is no setUTCDay()...
                result["setUTC" + field] = setterMethod(field);
            }
        }

        return result;
    };

})(CQ, $CQ);

//var oDateConst = Date.prototype.constructor;

/*Object.prototype.begetObject = function () {
    function F() {}
    F.prototype = this;
    return new F();
};*/

CQ.soco.calendar.Date.prototype = new Date;
/**
 * Returns the Date object's original & internal utc millis
 * (needed because we overwrite getTime()).
 * @private
 * @return {Number} UTC millis as stored by the internal javascript Date object
 */
CQ.soco.calendar.Date.getBuiltinTime = function() {
    return Date.prototype.getTime.apply(this);
    //return new oDateConst(this).getTime();
};

/**
 * Returns the numeric value of the specified date as the number of milliseconds
 * since January 1, 1970, 00:00:00 UTC (negative for prior times).
 * Overwrites standard Date.getTime() to provide proper utc millis.
 * @return {Number} utc milliseconds
 */
CQ.soco.calendar.Date.getTime = function() {
    // need to call getTimezoneOffset() in order to use the up-to-date offset
    return this.calculateTime(-this.getTimezoneOffset());
};

/**
 * Internal method to calculate the real UTC millis based on the timezone offset.
 * @private
 * @param {Number} tzOffset time zone offset positive to UTC in minutes (eg. "GMT+0200" = +720)
 * @return {Number} real UTC millis
 */
CQ.soco.calendar.Date.calculateTime = function(tzOffset /* positive to UTC */ ) {
    // shift date back by difference between target timezone and local browser timezone

    var time = this.getBuiltinTime();

    // 1. get the current local offset for this time
    var localOffset = -new Date(time).getTimezoneOffset();

    // 2. shift back with that local offset and get the local offset at the target time
    //    (this is needed when the tzOffset will cross a daylight border for the local offset)
    localOffset = -new Date(time).addOffset(localOffset - tzOffset).getTimezoneOffset();

    // 3. now shift back with the real local offset at the target time
    return new Date(time).addOffset(localOffset - tzOffset).getTime();
};

/**
 * Sets the Date object's original & internal utc millis
 * (needed because we overwrite setTime()).
 * @private
 * @param {Number} time (builtin) utc milliseconds
 */
CQ.soco.calendar.Date.setBuiltinTime = function(time) {
    Date.prototype.setTime.call(this, time);
};

/**
 * Sets the Date object to the time represented by a number of milliseconds since
 * January 1, 1970, 00:00:00 UTC, allowing for negative numbers for times prior.
 * @param {Number} time utc milliseconds
 */
CQ.soco.calendar.Date.setTime = function(time) {
    // use a temp proxy to do the calculation for us
    var tzDate = new Date(time).shift(this.timezone);
    this.setBuiltinTime(tzDate.getBuiltinTime());
};

/**
 * Returns the offset relative to UTC in minutes. Note that this will be
 * negative for offsets that are ahead of UTC. For example, an offset
 * typically named "GMT+0200" (+2h) will be returned as -720.
 * Overwrites standard Date.getTimezoneOffset().
 * @return {Number} negative offset relative to UTC in minutes
 */
CQ.soco.calendar.Date.getTimezoneOffset = function() {
    // checks if the timezone offset has changed through a setMonth(), setDate()
    // etc. method call in the meantime by using the cached this.lastUTCMillis

    var time = this.getBuiltinTime();

    // if the time has changed (eg. through setMonth()), we need to check
    // whether our timezoneoffset is still correct
    if (this.lastUTCMillis && time != this.lastUTCMillis) {
        this.lastUTCMillis = time;

        // first get the time using the "old" offset
        var timeWithOldOffset = this.calculateTime(this.timezoneOffset);
        // calculate the offset for that time and update it
        this.timezoneOffset = this.timezone.getOffsetInMinutes(timeWithOldOffset);
    }

    // Note: standard Date.getTimezoneOffset() returns
    // negative values for UTC +N:M values, positive for UTC -N:M offsets
    return -this.timezoneOffset;
};

/**
 * Returns the abbreviated timezone name, for example "CET" or "CEST". This
 * often depends on whether this date is in daylight savings time or not.
 * Overwrites ExtJS Date.getTimezone().
 * @return {String} an abbreviated timezone name
 */
CQ.soco.calendar.Date.getTimezone = function() {
    return this.timezone.getShortName(this);
};

/**
 * Returns the {@link CQ.soco.calendar.TimeZone}.
 * @return {CQ.soco.calendar.TimeZone} timezone object
 */
CQ.soco.calendar.Date.getTimezoneInfo = function() {
    return this.timezone;
};

/**
 * Returns the timezone ID, eg. "Europe/Berlin".
 * @return {String} timezone ID
 */
CQ.soco.calendar.Date.getTimezoneID = function() {
    return this.timezone.getID();
};

/**
 * Returns whether this date is in daylight savings time.
 * @return {Boolean} true for daylight savings time
 */
CQ.soco.calendar.Date.inDaylightTime = function() {
    return this.timezone.inDaylightTime(this);
};

/**
 * Returns a string representation of this date, including the real
 * timezone. For example: "Mon Nov 30 2009 00:00:00 GMT+0100 (CET)"
 * Overwrites standard Date.toString().
 * @return {String} a string representation of this date
 */
CQ.soco.calendar.Date.toString = function() {
    // for example: "Mon Nov 30 2009 00:00:00 GMT+0100 (CET)"
    return this.format("D M d Y H:i:s \\G\\M\\TO (T)");
};

/**
 * Converts a date to a string, using the universal time convention.
 * Overwrites standard Date.toString().
 * @return {String} a UTC string representation of this date
 */
CQ.soco.calendar.Date.toUTCString = function() {
    /*
        // IS0-8601 format
        function pad(s, count) {
            return String.leftPad(s, count || 2, '0');
        }
        return this.getUTCFullYear() + "-" + pad(this.getUTCMonth()+1) + "-" + pad(this.getUTCDate()) + "T" +
            pad(this.getUTCHours()) + ":" + pad(this.getUTCMinutes()) + ":" + pad(this.getUTCSeconds()) + "." +
            pad(this.getUTCMilliseconds(), 4) + "Z";
        */

    // for example: "Mon Nov 30 2009 14:30:25 GMT"
    return new Date(
        this.getUTCFullYear(), this.getUTCMonth(), this.getUTCDate(),
        this.getUTCHours(), this.getUTCMinutes(), this.getUTCSeconds(),
        this.getUTCMilliseconds()).format("D M d Y H:i:s \\G\\M\\T");
};

// deprecated
CQ.soco.calendar.Date.toGMTString = function() {
    return this.toUTCString();
};

/**
 * Returns the time portion of a Date object in human readable form
 * in American English. For example: "14:30:25 GMT+0100 (CET)".
 * @return {String} a string representation of the time part of this date
 */
CQ.soco.calendar.Date.toTimeString = function() {
    // for example: "14:30:25 GMT+0100 (CET)"
    return this.format("H:i:s \\G\\M\\TO (T)");
};

/**
 * Returns the primitive value of a Date object. Same as getTime().
 * Overwrites the standard Date.valueOf().
 * @return {Number} utc milliseconds
 */
CQ.soco.calendar.Date.valueOf = function() {
    return this.getTime();
};

/**
 * Returns a copy of this timezone-enabled date object.
 * Overwrites standard ExtJS Date.clone().
 * @return {CQ.soco.calendar.Date} clone
 */
CQ.soco.calendar.Date.clone = function() {
    return new CQ.soco.calendar.Date(this, this.timezone);
};


/**
 * Returns a new {@link CQ.soco.calendar.Date} object with the current date moved
 * into the given timezone.
 * <br><br>
 * The resulting date object will also have the new methods getTimezoneInfo()
 * (returns the {@link CQ.soco.calendar.TimeZone} instance), getTimezoneID()
 * and inDaylightTime() (returns true for DST). The standard javascript
 * Date method getTimezoneOffset() will be overridden as well as ExtJS
 * Date.getTimezone() to use the new, more accurate timezone info.
 *
 * @param {String/CQ.soco.calendar.TimeZone} tz timezone ID (eg. "Europe/Berlin") or TimeZone object
 * @return {CQ.soco.calendar.Date} a timezone-enabled date representation of this date in the given timezone
 * @clientlib cq.social.calendar
 * @member Date
 */
Date.prototype.shift = function(tz) {
    if (!tz) {
        return this;
    }
    return CQ.soco.calendar.Date(this, tz);
};

/**
 * Returns a new {@link CQ.soco.calendar.Date} object with the exact current date but in the
 * given timezone.
 *
 * <br><br>
 * This is different from {@link #shift}() in that it won't move the
 * time to what time it is in the other timezone. It will keep all the
 * fields (hours, minutes, etc.) the same, but being represented as
 * a {@link CQ.soco.calendar.Date} object with timezone info.
 *
 * @param {String/CQ.soco.calendar.TimeZone} tz timezone ID (eg. "Europe/Berlin") or TimeZone object
 * @return {CQ.soco.calendar.Date} a timezone-enabled date with the same date fields in the given timezone
 * @clientlib cq.social.calendar
 * @member Date
 */
Date.prototype.replaceTimezone = function(tz) {
    if (!tz) {
        return this;
    }
    var d = CQ.soco.calendar.Date(this, tz);

    // set all fields
    d.setDate(1); // because of leap years

    d.setFullYear(this.getFullYear());
    d.setMonth(this.getMonth());
    d.setDate(this.getDate());

    d.setHours(this.getHours());
    d.setMinutes(this.getMinutes());
    d.setSeconds(this.getSeconds());
    d.setMilliseconds(this.getMilliseconds());

    return d;
};

/**
 * Returns a copy this date as {@link CQ.soco.calendar.Date} in the UTC timezone.
 *
 * @return {CQ.soco.calendar.Date} a timezone-enabled date in the UTC timezone
 * @clientlib cq.social.calendar
 * @member Date
 */
Date.prototype.toUTC = function() {
    return this.shift(CQ.soco.calendar.TimeZone.UTC_ID);
};

/**
 * Returns a copy of of this date with the time cleared. Same as clearTime(true).
 *
 * @return {Date} a date-only copy of this date
 * @clientlib cq.social.calendar
 * @member Date
 */
Date.prototype.dateOnly = function() {
    return new Date(this.toDateString());
};

/**
 * Returns the current date (year, month, date) as a UTC date with the
 * time cleared, as {@link CQ.soco.calendar.Date} object. For example,
 * "2009-07-13 14:00:00 +02:00 CEST" would become "2009-07-13 00:00:00 +00:00 UTC".
 *
 * @return {CQ.soco.calendar.Date} a timezone-enabled date in the UTC timezone
 * @clientlib cq.social.calendar
 * @member Date
 */
Date.prototype.utcDateOnly = function() {
    return new CQ.soco.calendar.Date(
        Date.UTC(this.getFullYear(), this.getMonth(), this.getDate()),
        CQ.soco.calendar.TimeZone.UTC_ID);
};

/**
 * Adds the given positive or negative offset in minutes to this date.
 * @param {Number} offset offset in minutes
 * @return {Date} this date object
 * @clientlib CQ.soco.calendarendar
 * @member Date
 */
Date.prototype.addOffset = function(offset /* in minutes */ ) {
    if (offset < 0) {
        this.setHours(this.getHours() - Math.floor(Math.abs(offset / 60)));
        this.setMinutes(this.getMinutes() - Math.abs(offset % 60));
    } else {
        this.setHours(this.getHours() + Math.floor(offset / 60));
        this.setMinutes(this.getMinutes() + offset % 60);
    }
    return this;
};

/**
 * Returns whether both dates are on the same day, ie.
 * if their year, month and date are equal.
 * @param {Date} other Date object
 * @return {Boolean} true if both are on the same date
 * @clientlib cq.social.calendar
 * @member Date
 */
Date.prototype.isSameDateAs = function(other) {
    return this.getFullYear() == other.getFullYear() && this.getMonth() == other.getMonth() && this.getDate() == other.getDate();
};



/**
 * Parses the given date string in a given timezone into a {@link CQ.soco.calendar.Date} object.
 * Can optionally handle date-only dates (isDate=true) and also handle
 * a separate display timezone.
 * @param {String} dateString date string in ECMA date format (can be parsed
 *                 by Date.parse()), eg. "Wed Aug 27 2008 23:59:59 GMT+0200"
 * @param {String/CQ.soco.calendar.TimeZone} timeZone timezone (ID or object) of the dateString
 * @param {Boolean} isDate whether this is just a date with no time (optional)
 * @param {String/CQ.soco.calendar.TimeZone} timeZone timezone (ID or object) for display;
 *              the returned date will be in this timezone (optional)
 * @return {CQ.soco.calendar.Date} a timezone-aware date object
 * @clientlib cq.social.calendar
 * @member Date
 */
Date.prototype.parseWithTimezone = function(dateString, timeZone, isDate, displayTimeZone) {
    var date = Date.parse(dateString);
    if (date) {
        date = new Date(date);
        if (isDate) {
            return date.toUTC().dateOnly();
        } else {
            date = date.shift(timeZone);
            if (displayTimeZone) {
                return date.shift(displayTimeZone);
            } else {
                return date;
            }
        }
    } else {
        return null;
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
/*
 * location: /libs/clientlibs/social/calendar/calendar/source
 * category: [cq.social.calendar]
 */
/* JS for the Calendar pages */
$CQ(function($) {
    /* 
        Accordions on Calendar detail page
    */

    $.fn.simpleAccordion = function() {

        this.each(function() {
            var accordion = $(this),
                content = accordion.find('.content');

            /* 
                Grab the text of the first paragraph, check the length, 
                and only display the first 150 characters; then append
                the "read more" CTA.
            */

            var readMore = $CQ("<span class='accordion-toggle read-more'>" + CQ.I18n.getMessage("read more") + "</span>").click(function() {
                    accordion.find('.accordion-toggle').toggleClass('expanded');

                    content.toggleClass('expanded');

                    /*
                        On each click, check to see whether the content
                        has the "expanded" class; and animate accordingly. 
                    */
                    if (content.hasClass('expanded')) {
                        content.find('.short').hide();
                        content.children().not('.short').slideDown();
                    } else {
                        content.children().not('.short').slideUp('fast', function() {
                            //Wait until the animation is done before showing the shortened text.
                            content.find('.short').show();
                        });
                    }
                }),
                shortenTarget = content.find("p:first-child"),
                fullText = shortenTarget.text();

            var accordionToggles = accordion.find('.accordion-toggle');
            var readMoreToggles = accordion.find('.accordion-toggle .read-more');

            var isLongText = (fullText.length > 150);

            var shortened = $("<p>").addClass("short");

            content.children().hide();

            if (isLongText) {
                shortened.text(fullText.substring(0, 150)).append(" ...");
                shortened.append(readMore);
            } else {
                // Do not shorten at all
                shortened.text(fullText);
            }

            shortenTarget.before(shortened);


            /*
                Find each "toggle" button and bind it to the 
                click event.  On click, add/remove the "expanded" class
                to the toggle button and the content via the jQuery 
                toggleClass method.
            */
            accordionToggles.each(function() {
                var accordionToggle = $(this);

                accordionToggle.click(function() {
                    accordion.find('.accordion-toggle').toggleClass('expanded');

                    content.toggleClass('expanded');

                    /*
                        On each click, check to see whether the content
                        has the "expanded" class; and animate accordingly. 
                    */
                    if (content.hasClass('expanded')) {
                        content.find('.short').hide();
                        content.children().not('.short').slideDown();
                    } else {
                        content.children().not('.short').slideUp('fast', function() {
                            //Wait until the animation is done before showing the shortened text.
                            content.find('.short').show();
                        });
                    }
                });
            });



        });
    };

    //$('.event-accordion-block').simpleAccordion();

});

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
 * location: /libs/clientlibs/social/calendar/calendar/source
 * category: [cq.soco.calendar]
 */

(function(CQ, $CQ) {
    "use strict";
    CQ.soco = CQ.soco || {};
    CQ.soco.calendar = CQ.soco.calendar || {};
    CQ.soco.calendar.utils = CQ.soco.calendar.utils || {};
    CQ.soco.calendar.events = CQ.soco.calendar.events || {};
    var localEvents = {};
    localEvents.CLEAR = "lcl.cq.soco.events.clear";
    CQ.soco.calendar.events.NEWEVENTSFETCHED = "newEventFetch";
    CQ.soco.calendar.events.DAYCLICK = "dayClicked";
    CQ.soco.calendar.events.EVENTSDELETED = "eventsDeleted";
    CQ.soco.calendar.events.EVENTSMODIFIED = "eventsModified";
    // IE8 doesn't support .toISOString()
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toISOString
    if (!Date.prototype.toISOString) {
        (function() {
            function pad(number) {
                var r = String(number);
                if (r.length === 1) {
                    r = '0' + r;
                }
                return r;
            }
            Date.prototype.toISOString = function() {
                return this.getUTCFullYear() + '-' + pad(this.getUTCMonth() + 1) + '-' + pad(this.getUTCDate()) + 'T' + pad(this.getUTCHours()) + ':' + pad(this.getUTCMinutes()) + ':' + pad(this.getUTCSeconds()) + '.' + String((this.getUTCMilliseconds() / 1000).toFixed(3)).slice(2, 5) + 'Z';
            };
        }());
    }

    CQ.soco.calendar.utils.padZero = function(num) {
        return (num >= 0 && num < 10) ? "0" + num : num + "";
    };

    CQ.soco.calendar.utils.eventMap = function(obj) {
        var events = new Array();

        var eventIter = function(eveObject) {
            $CQ.each(eveObject, function(index, val) {
                if (typeof val === 'object') {
                    if (val && val['jcr:primaryType'] && val['jcr:primaryType'] == 'cq:CalendarEvent') {
                        var eventObject = new Object();
                        $CQ.each(val, function(key, value) {
                            if (key == "jcr:title") {
                                eventObject["title"] = value;
                            } else if (key == "isDate") {
                                eventObject["allDay"] = value;
                            } else {
                                eventObject[key] = value;
                            }
                        });
                        events.push(eventObject);
                    } else {
                        eventIter(val);
                    }
                }
            });
        };
        eventIter(obj);
        return events;
    };


    //Construct eventSource Array for the full calendar
    CQ.soco.calendar.utils.eventSources = function(url, selector) {
        var eventSource = new Array();
        var fn = CQ.soco.calendar.utils.getEventsFunction(url, selector);
        var obj = new Object();
        obj["events"] = fn;
        eventSource.push(obj);
        return eventSource;
    }

    CQ.soco.calendar.utils.deleteEvent = function(path, onlyThis, selector) {
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
            $CQ('#' + selector).parent().trigger(CQ.soco.calendar.events.EVENTSDELETED);
            $CQ('#' + selector).remove();
        });
    };


    CQ.soco.calendar.utils.getEventsFunction = function(url, selector) {
        return function(start, end, callback) {

            var postOptions = {
                "1_orderby": "@start",
                "2_orderby": "path",
                "1_orderby.sort": "desc",
                "_charset_": "utf-8",
                "event.from": start.toISOString().substring(0, 10),
                "event.to": end.toISOString().substring(0, 10),
                "group.p.or": "true",
                "p.acls": "true",
                "p.hits": "full",
                "p.limit": "0",
                "p.nodedepth": "1",
                "p.offset": "0",
                "type": "cq:CalendarEvent"
            };

            if (typeof url === 'string') {
                postOptions["group.1_path"] = url;
            } else {
                // If its not string, then it must be an array
                $CQ.each(url, function(key, value) {
                    var indexKey = "group." + (key + 1) + "_path";
                    postOptions[indexKey] = value;
                });
            }

            $CQ.post('/bin/querybuilder.json', postOptions,

                function(data) {
                    $CQ('.fc-widget-content').removeClass('pressed');
                    if (data && data.success && data.hits && data.hits.length >= 1) {
                        var events = [];
                        events = CQ.soco.calendar.utils.eventMap(data);
                        callback(events);
                        selector.trigger(CQ.soco.calendar.events.NEWEVENTSFETCHED, [data.hits]);
                        return;
                    } else {
                        callback();
                        $CQ('.fc-day').removeClass('highlight');
                    }
                    selector.trigger(CQ.soco.calendar.events.NEWEVENTSFETCHED, []);
                }, "json");
        }
    };

    CQ.soco.calendar.utils.invokeFullCalendar = function(divTarget, url) {
        var _cal = $CQ(divTarget).fullCalendar({
            header: {
                left: 'prev',
                center: 'title',
                right: 'next'
            },

            buttonText: {
                prev: '<img src="/etc.clientlibs/settings/wcm/designs/default/resources/social/mini-calendar-nav-left.png">',
                next: '<img src="/etc.clientlibs/settings/wcm/designs/default/resources/social/mini-calendar-nav-right.png">'
            },

            eventSources: CQ.soco.calendar.utils.eventSources(url, $CQ(divTarget)),

            dayNamesShort: [
                'Su',
                'Mo',
                'Tu',
                'We',
                'Th',
                'Fr',
                'Sa'
            ],

            dayClick: function(date, view) {
                //$CQ('.fc-widget-content').removeClass('pressed');
                if ($CQ(this).hasClass('pressed')) {
                    $CQ(this).removeClass('pressed');
                    //Sending the date and a bool value to indicate whether to filter events or not
                    $CQ(divTarget).trigger(CQ.soco.calendar.events.DAYCLICK, [date, false]);
                } else {
                    $CQ(this).addClass('pressed');
                    //Sending the date and a bool value to indicate whether to filter events or not
                    $CQ(divTarget).trigger(CQ.soco.calendar.events.DAYCLICK, [date, true]);
                }
            },

            eventRender: function(event, element) {
                //$CQ('.fc-day').removeClass('highlight');
                $CQ(element).empty();
                var date = event.start;
                var endDate = event.end;
                //Multi-day event highlight
                var diff = endDate ? moment(endDate).diff(moment(date), 'day', false) : 0;
                if ($CQ(".fc-day" + date.getDate()).length > 0) {
                    date = date.getDate();
                    for (var i = 0; i <= diff; i++) {
                        $CQ(".fc-day" + (date + i)).addClass('highlight');
                    }
                } else {
                    for (var i = 0; i <= diff; i++) {
                        var tempDate = new Date(date);
                        tempDate.setDate(tempDate.getDate() + i);
                        var tempDate = tempDate.getFullYear() + '-' + CQ.soco.calendar.utils.padZero(tempDate.getMonth() + 1) + "-" + CQ.soco.calendar.utils.padZero(tempDate.getDate());
                        $CQ(".fc-day[data-date = " + tempDate + "]").addClass('highlight');
                    }
                }
            }

        });
        return _cal;
    };

    CQ.soco.calendar.utils.addEventHTML = function(selector, path) {
        var response = CQ.shared.HTTP.get(path + ".html");
        selector.append(response.body);
    };

    CQ.soco.calendar.utils.createEventList = function(selector, events, empty) {
        if (empty) {
            $CQ(selector).empty();
        }
        if (events && events.length > 0) {
            $CQ.each(events, function(key, event) {
                CQ.soco.calendar.utils.addEventHTML(selector, event["jcr:path"]);
            });
        }
    };

    CQ.soco.calendar.utils.createFullEventList = function(selector, url) {
        var start = new Date(); //Some date in the past
        start = new Date(start.setFullYear(start.getFullYear() - 10));
        var end = new Date();
        var handlerFn = function(data) {
            if (data && data.hits) {
                CQ.soco.calendar.utils.createEventList($CQ(selector), data.hits, true);
            }
        }
        CQ.soco.calendar.utils.getEventDetails(start, end, url, handlerFn);
    }

    CQ.soco.calendar.utils.filterEventList = function(selector, data, filter) {
        var date = moment(data);
        if (filter) {
            $CQ.each($CQ(selector).children(), function(key, value) {
                var data_startDate = moment($CQ(value).attr("data-startdate"));
                var data_endDate = moment($CQ(value).attr("data-enddate"));
                var diff = ((date.diff(data_startDate, 'day', false) >= 0) && (date.diff(data_endDate, 'day', false) <= 0));
                if (!diff) {
                    $CQ(value).hide();
                } else {
                    $CQ(value).show();
                }
            });
        } else {
            $CQ.each($CQ(selector).children(), function(key, value) {
                $CQ(value).show();
            });
        }
    }

    CQ.soco.calendar.utils.getEventDetails = function(start, end, url, hanlder) {
        var postOptions = {
            "1_orderby": "@start",
            "2_orderby": "path",
            "_charset_": "utf-8",
            "1_orderby.sort": "desc",
            "event.from": start.toISOString().substring(0, 10),
            "event.to": end.toISOString().substring(0, 10),
            "group.p.or": "true",
            "p.acls": "true",
            "p.hits": "full",
            "p.limit": "0",
            "p.nodedepth": "1",
            "p.offset": "0",
            "type": "cq:CalendarEvent"
        };

        if (typeof url === 'string') {
            postOptions["group.1_path"] = url;
        } else {
            // If its not string, then it must be an array
            $CQ.each(url, function(key, value) {
                var indexKey = "group." + (key + 1) + "_path";
                postOptions[indexKey] = value;
            });
        }

        $CQ.post('/bin/querybuilder.json', postOptions,

            function(data) {
                if (data && data.success && data.hits && data.hits.length >= 1) {
                    if (hanlder && typeof hanlder === 'function') {
                        hanlder(data);
                    }
                    //$CQ(CQ.soco.calendar.utils).trigger(CQ.soco.calendar.events.NEWEVENTSFETCHED, [data.hits]);
                }
            }, "json");
    };
})(CQ, $CQ);

