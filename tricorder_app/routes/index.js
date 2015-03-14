var globals = require('../utilities/globals');
var util = require('../utilities/util');
var Stop = require('../models/stop').Stop;
var async = require('async');
var moment = require('moment');

// models
var Service = require('../models/service').Service;
var Timetable = require("../models/timetable").Timetable;

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
                        function (serviceName, callback) {
                            var requestedStopService = {
                                name: serviceName,
                                destination: null,
                                timetables: []
                            };

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
                                        callback();
                                    }
                                });
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

