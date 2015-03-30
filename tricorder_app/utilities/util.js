/**
 * Created by Manas on 07-03-2015.
 */

var moment = require('moment');
var VehicleStat = require('../models/vehicle_stats').VehicleStat;
var StopStat = require("../models/stop_stats").StopStat;
var async = require('async');





module.exports.raise404 = function(next) {
    var err = new Error();
    err.status = 404;
    err.message = "Not Found";
    next(err);
};

module.exports.getDistanceBetweenPoints = function(pt1, pt2) {
    var rad = function (x) {
        return x * Math.PI / 180;
    };

    var R = 6378137; // Earth’s mean radius in meter
    var dLat = rad(pt2["lat"] - pt1["lat"]);
    var dLong = rad(pt2["lng"] - pt1["lng"]);
    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(rad(pt1["lat"])) * Math.cos(rad(pt2["lat"])) *
        Math.sin(dLong / 2) * Math.sin(dLong / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c;

    return d; // returns the distance in meter
};

module.exports.humanizeDistance = function(d) {
    var humanized = "";
    if (d < 1000) {
        humanized = d.toFixed(0) + " metres";
    } else {
        humanized = (d/1000).toFixed(1) + " kilometres";
    }

    return humanized;
};

module.exports.getDay = function () {
    var day = moment().format("dddd");
    var weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
    if (weekdays.indexOf(day) > -1) {
        return 0;
    } else if (day == "Saturday") {
        return 5;
    } else {
        return 6;
    }
};


module.exports.aggStops = function(id, period) {

    //midnight of current day
    var d = new Date().setHours(0,0,0,0);


    var sinceWhen;

    switch(period) {
        case 'day':
            sinceWhen = d;
            break;
        case 'week':
            sinceWhen = d-week;
            break;
        case 'month':
            sinceWhen = d-month;
            break;
        case 'year':
            sinceWhen = d-year;
            break;
        default:
            sinceWhen = d.setYear(1970);
            break;
    }

    //Aggregate all stats from sinceWhen, onwards
    StopStat.find({timestamp: {$gte: sinceWhen}, stop_id: id}, function (err, stops) {
        if (!err) {

            var resultStat = {
                stop_id: stop[0].stop_id,
                early_10_plus: 0,
                early_10: 0,
                early_9: 0,
                early_8: 0,
                early_7: 0,
                early_6: 0,
                early_4: 0,
                early_3: 0,
                early_2: 0,
                on_time: 0,
                late_2: 0,
                late_3: 0,
                late_4: 0,
                late_5: 0,
                late_6: 0,
                late_7: 0,
                late_8: 0,
                late_9: 0,
                late_10: 0,
                late_10_plus: 0,
                total_count: 0
            };

            async.eachSeries(
                stops,
                function (stop, callback) {
                    for (var field in stop) {
                        resultStat[field] += stop[field];
                    }
                    callback();
                },
                function (err, resultStat) {
                    if(!err) {
                        return resultStat;
                    }
                });

        }

    });
};


