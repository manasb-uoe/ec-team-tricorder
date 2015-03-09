var globals = require('../utilities/globals');
var util = require('../utilities/util');
var Stop = require('../models/stop').Stop;
var Service = require('../models/service').Service;
var async = require('async');

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
                console.log(requestedServices);
                Stop
                    .find()
                    .where("services")
                    .in(requestedServices)
                    .exec(function (err, stops) {
                        console.log(stops.length + "------");
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
    console.log(req.params["id"]);
    Stop.find({stop_id: req.params["id"]}, function (err, stop) {
        if (!err) {
            if (stop.length != 0) {
                res.send("EXISTS");
            } else {
                util.raise404(next);
            }
        }
    });
};

