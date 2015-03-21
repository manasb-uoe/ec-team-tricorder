var util = require('../utilities/util');
var Stop = require('../models/stop').Stop;
var async = require('async');
var moment = require('moment');
var bcrypt = require('bcrypt-nodejs');
var mongoose = require('mongoose');

// models
var Service = require('../models/service').Service;
var Timetable = require("../models/timetable").Timetable;
var LiveLocation = require("../models/live_location").LiveLocation;
var User = require("../models/user").User;
var FavouriteStop = require("../models/favourite_stops").FavouriteStop;

/* GET home page. */
module.exports.home = function(req, res) {
    res.render('home.html', {
            title: "Home",
            current_url: util.urls.home,
            urls: util.urls,
            user: req.session.user
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
                                    current_url: util.urls.nearby_stops,
                                    urls: util.urls,
                                    stops: requestedStops,
                                    count_choices: [10, 50, 100, "All"],
                                    count_selected: count == stops.length ? "All" : count,
                                    service_choices: allServices,
                                    service_selected: requestedServices.length == allServices.length ? ["All"] : requestedServices,
                                    user: req.session.user
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
                            if (!err) {
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

                                async.waterfall(
                                    [
                                        function (callback) {
                                            // if user is authenticated, check if requested stop is their favourite or not
                                            if (req.session.user) {
                                                FavouriteStop
                                                    .findOne({user_object_id: mongoose.Types.ObjectId(req.session.user._id), stop_id: requestedStop.stop_id})
                                                    .exec(function (err, favouriteStop) {
                                                        if (!err) {
                                                            if (favouriteStop) {
                                                                callback(null, true);
                                                            } else {
                                                                callback(null, false);
                                                            }
                                                        }
                                                    });
                                            } else {
                                                callback(null, false);
                                            }
                                        }
                                    ],
                                    function (err, isStopFavourite) {
                                        if (!err) {
                                            res.render("stop.html", {
                                                title: requestedStop.name,
                                                stop: requestedStop,
                                                services: requestedStopServices,
                                                current_url: util.urls.stop,
                                                urls: util.urls,
                                                user: req.session.user,
                                                isStopFavourite: isStopFavourite
                                            });
                                        }
                                    }
                                );
                            }
                        }
                    );
                } else {
                    util.raise404(next);
                }
            }
        });
};

/* GET sign in page */
module.exports.sign_in = function (req, res) {
    if (!req.session.user) {
        res.render('sign_in.html', {
                title: "Sign in",
                current_url: util.urls.sign_in,
                urls: util.urls,
                user: req.session.user
            }
        );
    } else {
        res.redirect(util.urls.home);
    }
};

/* POST sign in page */
module.exports.sign_in_post = function (req, res) {
    var username = req.body["username"];
    var password = req.body["password"];

    var renderTemplateWithError = function (err) {
        res.render('sign_in.html', {
                title: "Sign In",
                current_url: util.urls.sign_in,
                urls: util.urls,
                username: username,
                error: err,
                user: req.session.user
            }
        );
    };

    util.validateSignUpOrSignInForm(username, password, function (err) {
        if (!err) {
            util.authenticateUser(username, password, function (authenticatedUser) {
                if (authenticatedUser) {
                    req.session.user = authenticatedUser;
                    res.redirect(util.urls.home);
                } else {
                    renderTemplateWithError("Invalid username or password");
                }
            });
        } else {
            renderTemplateWithError(err.message);
        }
    })
};

/* GET sign up page */
module.exports.sign_up = function (req, res) {
    if (!req.session.user) {
        res.render('sign_up.html', {
                title: "Sign Up",
                current_url: util.urls.sign_up,
                urls: util.urls,
                user: req.session.user
            }
        );
    } else {
        res.redirect(util.urls.home);
    }
};

/* POST sign up page */
module.exports.sign_up_post = function (req, res) {
    var username = req.body["username"];
    var password = req.body["password"];

    var renderTemplateWithError = function (err) {
        res.render('sign_up.html', {
                title: "Sign up",
                current_url: util.urls.sign_up,
                urls: util.urls,
                username: username,
                error: err,
                user: req.session.user
            }
        );
    };

    util.validateSignUpOrSignInForm(username, password, function (err) {
        if (!err) {
            // check if user with requested username already exists
            User
                .findOne({username: username})
                .exec(function (err, user) {
                    if (!user) {
                        // generate salt and use it to hash the password
                        var salt = bcrypt.genSaltSync(10);
                        var hash = bcrypt.hashSync(password, salt);

                        // create new user with the requested username and password (hash)
                        var newUser = new User({username: username, hash: hash});
                        newUser.save(function (err) {
                            if (!err) {
                                util.authenticateUser(username, password, function (authenticatedUser) {
                                    req.session.regenerate(function () {
                                        req.session.user = authenticatedUser;
                                        res.redirect(util.urls.home);
                                    });
                                });
                            }
                        });
                    } else {
                        renderTemplateWithError("That username seems to be taken");
                    }
                });
        } else {
            renderTemplateWithError(err.message);
        }
    });
};

/* GET sign out current user  */
module.exports.sign_out = function (req, res) {
    if (req.session.user) {
        req.session.destroy(function (err) {
            if (!err) {
                res.redirect(util.urls.home);
            }
        })
    } else {
        res.redirect(util.urls.home);
    }
};

/* POST add favourite stop */
module.exports.add_stop_to_favourites = function (req, res) {
    res.contentType('json');

    if (req.session.user) {
        var stop_id = req.body["stop_id"];
        var alt_name = req.body["alt_name"];

        // create new favourite stop if one does not already exist
        FavouriteStop
            .findOne({user_object_id: mongoose.Types.ObjectId(req.session.user._id), stop_id: stop_id})
            .exec(function (err, favouriteStop) {
                console.log(req.session.user);
                if (!favouriteStop) {
                    var newFavouriteStop = new FavouriteStop({user_object_id: mongoose.Types.ObjectId(req.session.user._id), stop_id: stop_id, alt_name: alt_name});
                    newFavouriteStop.save(function (err) {
                        if (!err) {
                            res.send(JSON.stringify({error: undefined}));
                        } else {
                            res.send(JSON.stringify({error: err.message}));
                        }
                    });
                } else {
                    res.send(JSON.stringify({error: "This stop is already in your favourites."}));
                }
            });
    } else {
        res.send(JSON.stringify({error: "Need to be authenticated to perform this action"}));
    }
};
