/**
 * Created by Manas on 07-03-2015.
 */

var moment = require('moment');
var bcrypt = require('bcrypt-nodejs');
var util = require("./util");

// models
var User = require('../models/user').User;

module.exports.urls = {
    localhost_base: "http://localhost:3000",
    home: "/",
    nearby_stops: "/nearby-stops",
    stop: "/stop",
    sign_in: "/sign-in",
    sign_up: "/sign-up",
    sign_out: "/sign-out",
    add_stop_to_favourites: "/add-stop-to-favourites",
    remove_stop_from_favourites: "/remove-stop-from-favourites",
    favourites: "/favourites",
    get_service_timetable_for_stop: "/get-service-timetable-for-stop",
    api_stop: '/api/stop/',
    api_vehicle: '/api/vehicle/'
};

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

module.exports.authenticateUser = function (username, password, callback) {
    User
        .findOne({username: username})
        .exec(function (err, user) {
            if (!err) {
                if (user) {
                    bcrypt.compare(password, user.hash, function (err, res) {
                        if (res) {
                            callback(user);
                        } else {
                            callback();
                        }
                    });
                } else {
                    callback();
                }
            } else {
                callback();
            }
        });
};

module.exports.validateSignUpOrSignInForm = function (username, password, callback) {
    if (!username) {
        callback(new Error("Username is required"));
    } else if (!password) {
        callback(new Error("Password is required"));
    } else if (username.length < 6) {
        callback(new Error("Username must be at least 6 characters long"));
    } else if (password.length < 6) {
        callback(new Error("Password must be at least 6 characters long"));
    } else if (username.indexOf(" ") > -1) {
        callback(new Error("Username cannot contain spaces"));
    } else if (password.indexOf(" ") > -1) {
        callback(new Error("Password cannot contain spaces"));
    } else {
        callback();
    }
};

module.exports.restrictUnauthenticatedUser = function (req, res, next) {
    if (req.session.user) {
        next();
    } else {
        res.redirect(util.urls.sign_in);
    }
};
