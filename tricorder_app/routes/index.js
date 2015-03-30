var globals = require('../utilities/globals');
var util = require('../utilities/util');
var Stop = require('../models/stop').Stop;
var async = require('async');
var moment = require('moment');

// models
var Service = require('../models/service').Service;
var Timetable = require("../models/timetable").Timetable;
var LiveLocation = require("../models/live_location").LiveLocation;
var VehicleStat = require("../models/vehicle_stats").VehicleStat;
var StopStat = require("../models/stop_stats").StopStat;

// conversions
var week = 7*24*60*60*100;
var month = week * 4;
var year = month * 12;

/* GET home page. */
module.exports.home = function(req, res) {
    res.render('home.html', {
            title: "Home",
            current_url: globals.urls.home,
            urls: globals.urls
        }
    );
};

/* GET nearby stops page */
module.exports.nearbyStops = function (req, res) {
    var allServices = ["All"];
    var requestedServices = req.query["service"] || [];

    async.series(
        [
            function (callback) {
                Service
                    .find()
                    .select("name")
                    .exec(function (err, services) {
                        if (!err) {
                            for (var i=0; i<services.length; i++) {
                                allServices.push(services[i]["name"]);
                            }
                            if (requestedServices.length == 0 || requestedServices.indexOf("All") > -1) {
                                requestedServices = allServices;
                            }
                        }
                        callback(null);
                    });
            },
            function (callback) {
                Stop
                    .find()
                    .where("services")
                    .in(requestedServices)
                    .exec(function (err, stops) {
                        if (!err) {
                            var currentUserLocation = {lat: req.query["lat"], lng: req.query["lng"]};

                            // find distance from user for each stop
                            for (var i=0; i<stops.length; i++) {
                                var stop = stops[i];
                                stop.distanceFromUser = util.getDistanceBetweenPoints(
                                    {lat: stop.coordinates[1], lng: stop.coordinates[0]},
                                    currentUserLocation
                                );
                            }

                            // sort all stops by distance from user
                            stops.sort(function (a, b) {
                                return a.distanceFromUser - b.distanceFromUser;
                            });

                            // humanize sorted results
                            var count = req.query["count"] || 10;
                            if (count == "All") {
                                count = stops.length;
                            }
                            var requestedStops = stops.slice(0, count);
                            for (var i=0; i<requestedStops.length; i++) {
                                requestedStops[i].distanceFromUser = util.humanizeDistance(requestedStops[i].distanceFromUser);
                            }

                            // render page using sorted results
                            res.render('nearby_stops.html', {
                                    title: "Nearby Stops",
                                    current_url: globals.urls.nearby_stops,
                                    urls: globals.urls,
                                    stops: requestedStops,
                                    count_choices: [10, 50, 100, "All"],
                                    count_selected: count == stops.length ? "All" : count,
                                    service_choices: allServices,
                                    service_selected: requestedServices.length == allServices.length ? ["All"] : requestedServices
                                }
                            );
                        }
                        callback(null);
                    });
            }
        ]
    );
};

/* GET stop page */
module.exports.stop = function (req, res, next) {
    Stop
        .find({stop_id: req.params["id"]})
        .exec(function (err, stop) {
            if (!err) {
                if (stop.length != 0) {
                    var currentUserLocation = {lat: req.query["lat"], lng: req.query["lng"]};
                    var requestedStop = stop[0];
                    requestedStop.distanceFromUser = util.humanizeDistance(util.getDistanceBetweenPoints(
                        {lat: requestedStop.coordinates[1], lng: requestedStop.coordinates[0]},
                        currentUserLocation
                    ));

                    // get timetables for each of the services for the requested stop
                    var requestedStopServices = [];
                    async.each(
                        requestedStop.services,
                        function (serviceName, callbackA) {
                            var requestedStopService = {
                                name: serviceName,
                                destination: null,
                                timetables: [],
                                buses: []
                            };

                            async.series(
                                [
                                    function (callbackB) {
                                        Timetable
                                            .find({stop_id: requestedStop.stop_id, service_name: serviceName, day: util.getDay()})
                                            .sort({timestamp: "ascending"})
                                            .exec(function (err, timetables) {
                                                if (!err) {
                                                    for (var i=0; i<timetables.length; i++) {
                                                        var timetable = timetables[i];
                                                        requestedStopService.destination = timetable.destination;

                                                        // only get upcoming timetables within next 60 minutes
                                                        var due = moment(timetable.time, "HH:mm");
                                                        var now = moment();
                                                        if (due >= now && due <= (now.add(60, "minutes"))) {
                                                            timetable.humanizedTime = due.fromNow();
                                                            requestedStopService.timetables.push(timetable);
                                                        }
                                                    }

                                                    requestedStopServices.push(requestedStopService);
                                                    callbackB(err, null);
                                                }
                                            });
                                    },
                                    function (callbackB) {
                                        LiveLocation
                                            .find({service_name: serviceName})
                                            .exec(function (err, buses) {
                                                // find distance from each bus to user
                                                for (var i=0; i<buses.length; i++) {
                                                    buses[i].distanceFromUser = util.getDistanceBetweenPoints(currentUserLocation, {lat: buses[i].coordinates[1], lng: buses[i].coordinates[0]});
                                                }

                                                // sort buses in ascending order of distance from user
                                                buses.sort(function (a, b) {
                                                    return a.distanceFromUser - b.distanceFromUser;
                                                });

                                                // humanize all distances
                                                for (var i=0; i<buses.length; i++) {
                                                    buses[i].distanceFromUser = util.humanizeDistance(buses[i].distanceFromUser);
                                                    requestedStopService.buses.push(buses[i]);
                                                }

                                                callbackB(err, null);
                                            });
                                    },
                                    function(err) {
                                        if (err) {
                                            console.log(err.message);
                                        }
                                        callbackA();
                                    }
                                ]
                            );
                        },
                        function (err) {
                            // sort the requested stop services in ascending order of expected time of arrival
                            requestedStopServices.sort(function (a, b) {
                                if (a.timetables.length > 0 && b.timetables.length > 0) {
                                    return a.timetables[0].timestamp - b.timetables[0].timestamp;
                                } else if (a.timetables.length > 0) {
                                    return -1;
                                } else if (b.timetables.length > 0) {
                                    return 1
                                } else {
                                    return 0;
                                }
                            });

                            if (!err) {
                                res.render("stop.html", {
                                    title: requestedStop.name,
                                    stop: requestedStop,
                                    services: requestedStopServices,
                                    current_url: globals.urls.stop,
                                    urls: globals.urls
                                });
                            }
                        }
                    );
                } else {
                    util.raise404(next);
                }
            }
        });
};


/* GET stats for a particular stop during a particular time period */
module.exports.apiStop = function(req, res, next) {
    var period = req.query["period"],
        id = req.query["id"];

    //midnight of current day
    var d = new Date();
    d.setHours(0,0,0,0);

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
    StopStat.find({timestamp: {$gte: sinceWhen}, vehicle_id: id}, function (err, items) {

        if (!err) {

            var resultStat = {
                id_num: id,
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
                items,
                function (item, callback) {
                    for (var field in resultStat) {
                        if(field !== 'id_num') {
                            resultStat[field] += item[field];
                        }
                    }
                    callback();
                },
                function (err) {
                    if(!err) {
                        console.log('result ' + resultStat);
                        res.render('stopStats.html', {
                            data: resultStat
                        });
                    }
                    else {
                        console.log('err ' + JSON.stringify(err));
                    }
                });

        }
        else {
            console.log('err ' + JSON.stringify(err));
        }

    });

};

/* GET stats for a particular vehicle during a particular time period */
module.exports.apiVehicle = function(req, res, next) {

    var period = req.query["period"],
        id = req.query["id"];

    //midnight of current day
    var d = new Date();

    d.setHours(0,0,0,0);

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

    console.log('id ' + id);

    //Aggregate all stats from sinceWhen, onwards
    VehicleStat.find({timestamp: {$gte: sinceWhen}, vehicle_id: id}, function (err, items) {
        if (items.length > 0) {

            if (!err) {
                var resultStat = {
                    id_num: id,
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
                    items,
                    function (item, callback) {
                        console.log(item);
                        for (var field in resultStat) {
                            if(field !== 'id_num') {
                                resultStat[field] += item[field];
                            }
                        }
                        callback();
                    },
                    function (err) {
                        if (!err) {
                            console.log('result ' + resultStat);
                            res.render('vehicleStats.html', {
                                data: resultStat
                            });
                        }
                        else {
                            console.log('err ' + JSON.stringify(err));
                        }
                    });

            }
            else {
                console.log('err ' + JSON.stringify(err));
            }
        }
    });

};

module.exports.test = function(req, res, next) {
  console.log('module test ' + req.query['id']);
    res.render('vehicleStats.html', {
        id: req.query['id']
    });
};