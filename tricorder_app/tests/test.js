/**
 * Created by Manas on 25-03-2015.
 */

var assert = require('assert');
var mongoose = require('mongoose');
var async = require('async');
var dbConfig = require("../utilities/db");
var testUtil = require("./util");
var util = require("../utilities/util");
var request = require('supertest')(util.urls.localhost_base);

// import models
var Stop = require("../models/stop").Stop;
var Service = require("../models/service").Service;
var LiveLocation = require("../models/live_location").LiveLocation;
var Timetable = require("../models/timetable").Timetable;
var User = require("../models/user").User;
var FavouriteStop = require("../models/favourite_stops").FavouriteStop;

describe("test suite", function () {
    before(function (done) {
        mongoose.connect(dbConfig.test_db_url);
        mongoose.connection.once('open', function() {
            done();
        });
    });

    describe("test create, read and delete operations on all models", function () {
        describe("stop", function () {
            before(function (done) {
                testUtil.clearDB(mongoose.connection, function () {
                    done();
                });
            });

            it("should add new stop successfully", function (done) {
                var newStop = new Stop(testUtil.sampleStopOne);
                newStop.save(function (err) {
                    if (err) {throw err;}
                    async.series(
                        [
                            function (callback) {
                                // check if collection size is now 1
                                Stop.count({}, function (err, count) {
                                    assert.equal(count, 1);
                                    callback(null);
                                });
                            },
                            function (callback) {
                                // verify saved data
                                Stop.find({}, function (err, stops) {
                                    if (err) {throw err;}
                                    assert.equal(stops[0].stop_id, testUtil.sampleStopOne.stop_id);
                                    assert.equal(stops[0].name, testUtil.sampleStopOne.name);
                                    assert.equal(stops[0].identifier, testUtil.sampleStopOne.identifier);
                                    assert.equal(stops[0].locality, testUtil.sampleStopOne.locality);
                                    assert.equal(stops[0].orientation, testUtil.sampleStopOne.orientation);
                                    assert.equal(stops[0].direction, testUtil.sampleStopOne.direction);
                                    assert.equal(stops[0].coordinates.toString(), testUtil.sampleStopOne.coordinates.toString());
                                    assert.equal(stops[0].destinations.toString(), testUtil.sampleStopOne.destinations.toString());
                                    assert.equal(stops[0].services.toString(), testUtil.sampleStopOne.services.toString());
                                    callback(null);
                                });
                            }
                        ],
                        function (err) {
                            if (err) {throw err;}
                            done();
                        }
                    );
                });
            });

            it("should remove stop successfully", function (done) {
                Stop.find({}, function (err, stops) {
                    stops[0].remove(function (err) {
                        if (err) {throw err;}
                        Stop.count({}, function (err, count) {
                            if (err) {throw err;}
                            assert.equal(count, 0);
                            done();
                        });
                    });
                });
            });
        });

        describe("service", function () {
            before(function (done) {
                testUtil.clearDB(mongoose.connection, function () {
                    done();
                });
            });

            it("should add new service successfully", function (done) {
                var newService = new Service(testUtil.sampleServiceOne);
                newService.save(function (err) {
                    if (err) {throw err;}
                    async.series(
                        [
                            function (callback) {
                                // check if collection size is now 1
                                Service.count({}, function (err, count) {
                                    assert.equal(count, 1);
                                    callback(null);
                                });
                            },
                            function (callback) {
                                // verify saved data
                                Service.find({}, function (err, services) {
                                    if (err) {throw err;}
                                    assert.equal(services[0].name, testUtil.sampleServiceOne.name);
                                    assert.equal(services[0].description, testUtil.sampleServiceOne.description);
                                    assert.equal(services[0].service_type, testUtil.sampleServiceOne.service_type);
                                    assert.equal(services[0].routes.toString(), testUtil.sampleServiceOne.routes.toString());
                                    callback(null);
                                });
                            }
                        ],
                        function (err) {
                            if (err) {throw err;}
                            done();
                        }
                    );
                });
            });

            it("should remove service successfully", function (done) {
                Service.find({}, function (err, services) {
                    if (err) {throw err;}
                    services[0].remove(function (err) {
                        if (err) {throw err;}
                        Service.count({}, function (err, count) {
                            if (err) {throw err;}
                            assert.equal(count, 0);
                            done();
                        });
                    });
                });
            });
        });

        describe("live location", function () {
            before(function (done) {
                testUtil.clearDB(mongoose.connection, function () {
                    done();
                });
            });

            it("should add new live location successfully", function (done) {
                var newLiveLocation = new LiveLocation(testUtil.sampleLiveLocationOne);
                newLiveLocation.save(function (err) {
                    if (err) {throw err;}
                    async.series(
                        [
                            function (callback) {
                                // check if collection size is now 1
                                LiveLocation.count({}, function (err, count) {
                                    assert.equal(count, 1);
                                    callback(null);
                                });
                            },
                            function (callback) {
                                // verify saved data
                                LiveLocation.find({}, function (err, liveLocations) {
                                    if (err) {throw err;}
                                    assert.equal(liveLocations[0].vehicle_id, testUtil.sampleLiveLocationOne.vehicle_id);
                                    assert.equal(liveLocations[0].last_gps_fix.toString(), testUtil.sampleLiveLocationOne.last_gps_fix.toString());
                                    assert.equal(liveLocations[0].coordinates.toString(), testUtil.sampleLiveLocationOne.coordinates.toString());
                                    assert.equal(liveLocations[0].service_name, testUtil.sampleLiveLocationOne.service_name);
                                    assert.equal(liveLocations[0].destination, testUtil.sampleLiveLocationOne.destination);
                                    callback(null);
                                });
                            }
                        ],
                        function (err) {
                            if (err) {throw err;}
                            done();
                        }
                    );
                });
            });

            it("should remove live location successfully", function (done) {
                LiveLocation.find({}, function (err, liveLocations) {
                    if (err) {throw err;}
                    liveLocations[0].remove(function (err) {
                        if (err) {throw err;}
                        LiveLocation.count({}, function (err, count) {
                            if (err) {throw err;}
                            assert.equal(count, 0);
                            done();
                        });
                    });
                });
            });
        });

        describe("timetable", function () {
            before(function (done) {
                testUtil.clearDB(mongoose.connection, function () {
                    done();
                });
            });

            it("should add new timetable successfully", function (done) {
                var newTimetable = new Timetable(testUtil.sampleTimetableOne);
                newTimetable.save(function (err) {
                    if (err) {throw err;}
                    async.series(
                        [
                            function (callback) {
                                // check if collection size is now 1
                                Timetable.count({}, function (err, count) {
                                    assert.equal(count, 1);
                                    callback(null);
                                });
                            },
                            function (callback) {
                                // verify saved data
                                Timetable.find({}, function (err, timetables) {
                                    if (err) {throw err;}
                                    assert.equal(timetables[0].stop_id, testUtil.sampleTimetableOne.stop_id);
                                    assert.equal(timetables[0].stop_name, testUtil.sampleTimetableOne.stop_name);
                                    assert.equal(timetables[0].service_name, testUtil.sampleTimetableOne.service_name);
                                    assert.equal(timetables[0].time, testUtil.sampleTimetableOne.time);
                                    assert.equal(timetables[0].timestamp.toString(), testUtil.sampleTimetableOne.timestamp.toString());
                                    assert.equal(timetables[0].destination, testUtil.sampleTimetableOne.destination);
                                    assert.equal(timetables[0].day, testUtil.sampleTimetableOne.day);
                                    callback(null);
                                });
                            }
                        ],
                        function (err) {
                            if (err) {throw err;}
                            done();
                        }
                    );
                });
            });

            it("should remove timetable successfully", function (done) {
                Timetable.find({}, function (err, timetables) {
                    if (err) {throw err;}
                    timetables[0].remove(function (err) {
                        if (err) {throw err;}
                        Timetable.count({}, function (err, count) {
                            if (err) {throw err;}
                            assert.equal(count, 0);
                            done();
                        });
                    });
                });
            });
        });

        describe("user", function () {
            before(function (done) {
                testUtil.clearDB(mongoose.connection, function () {
                    done();
                });
            });

            it("should add new user successfully", function (done) {
                var newUser = new User(testUtil.sampleUserOne);
                newUser.save(function (err) {
                    if (err) {throw err;}
                    async.series(
                        [
                            function (callback) {
                                // check if collection size is now 1
                                User.count({}, function (err, count) {
                                    assert.equal(count, 1);
                                    callback(null);
                                });
                            },
                            function (callback) {
                                // verify saved data
                                User.find({}, function (err, users) {
                                    if (err) {throw err;}
                                    assert.equal(users[0].username, testUtil.sampleUserOne.username);
                                    assert.equal(users[0].hash, testUtil.sampleUserOne.hash);
                                    callback(null);
                                });
                            }
                        ],
                        function (err) {
                            if (err) {throw err;}
                            done();
                        }
                    );
                });
            });

            it("should remove user successfully", function (done) {
                User.find({}, function (err, users) {
                    if (err) {throw err;}
                    users[0].remove(function (err) {
                        if (err) {throw err;}
                        User.count({}, function (err, count) {
                            if (err) {throw err;}
                            assert.equal(count, 0);
                            done();
                        });
                    });
                });
            });
        });

        describe("favourites stop", function () {
            before(function (done) {
                testUtil.clearDB(mongoose.connection, function () {
                    done();
                });
            });

            it("should add new favourite stop successfully", function (done) {
                async.waterfall(
                    [
                        function (callback) {
                            var newUser = new User(testUtil.sampleUserOne);
                            newUser.save(function (err, user) {
                                if (err) {throw err;}
                                callback(null, user);
                            });
                        },
                        function (user, callback) {
                            testUtil.sampleFavouriteStop.user_object_id = mongoose.Types.ObjectId(user._id);
                            var newFavouriteStop = new FavouriteStop(testUtil.sampleFavouriteStop);
                            newFavouriteStop.save(function (err) {
                                if (err) {throw err;}
                                async.series(
                                    [
                                        function (callback) {
                                            // check if collection size is now 1
                                            FavouriteStop.count({}, function (err, count) {
                                                assert.equal(count, 1);
                                                callback(null);
                                            });
                                        },
                                        function (callback) {
                                            // verify saved data
                                            FavouriteStop.find({}, function (err, favouriteStops) {
                                                if (err) {throw err;}
                                                assert.equal(favouriteStops[0].user_object_id.toString(), testUtil.sampleFavouriteStop.user_object_id.toString());
                                                assert.equal(favouriteStops[0].stop_id, testUtil.sampleFavouriteStop.stop_id);
                                                assert.equal(favouriteStops[0].alt_name, testUtil.sampleFavouriteStop.alt_name);
                                                callback(null);
                                            });
                                        }
                                    ],
                                    function (err) {
                                        if (err) {throw err;}
                                        callback(null);
                                    }
                                );
                            });
                        }
                    ],
                    function (err) {
                        if (err) {throw err;}
                        done();
                    }
                );
            });

            it("should remove favourite stop successfully", function (done) {
                FavouriteStop.find(function (err, favouriteStops) {
                    if (err) {throw err;}
                    favouriteStops[0].remove(function (err) {
                        if (err) {throw err;}
                        FavouriteStop.count({}, function (err, count) {
                            if (err) {throw err;}
                            assert.equal(count, 0);
                            done();
                        });
                    });
                });
            });
        });
    });

    describe("test nearby stops page", function () {
        it("GET " + util.urls.nearby_stops + " should respond with html", function (done) {
            request
                .get(util.urls.nearby_stops)
                .expect('Content-Type', /html/)
                .expect(200, done);
        });
    });

    describe("test stop page", function () {
        it("GET " + util.urls.stop + " should respond with status code 404 if no stop_id is provided", function (done) {
            request
                .get(util.urls.stop)
                .expect('Content-Type', /html/)
                .expect(404, done);
        });

        it("GET " + util.urls.stop + " should respond with status code 404 if incorrect stop_id is provided", function (done) {
            request
                .get(util.urls.stop + "/0")
                .expect('Content-Type', /html/)
                .expect(404, done);
        });

        it("GET " + util.urls.stop + " should respond with status code 200 if correct stop_id is provided", function (done) {
            var newStop = new Stop(testUtil.sampleStopOne);
            newStop.save(function (err, stop) {
                request
                    .get(util.urls.stop + "/" + stop.stop_id)
                    .expect('Content-Type', /html/)
                    .expect(200, done);
            });
        });
    });

    describe("test sign in and sign up pages with unauthenticated user", function () {
        before(function (done) {
            testUtil.clearDB(mongoose.connection, function () {
                done();
            });
        });

        it("GET " + util.urls.sign_in + " should respond with status code 200", function (done) {
            request
                .get(util.urls.sign_in)
                .expect('Content-Type', /html/)
                .expect(200, done);
        });

        it("POST " + util.urls.sign_in + " should respond with status code 200 if incorrect user details are provided", function (done) {
            request
                .post(util.urls.sign_in)
                .send({"username": testUtil.sampleUserOne.username, "password": testUtil.sampleUserOne.password})
                .expect('Content-Type', /html/)
                .expect(200, done);
        });

        it("GET " + util.urls.sign_up + " should respond with status code 200", function (done) {
            request
                .get(util.urls.sign_up)
                .expect('Content-Type', /html/)
                .expect(200, done);
        });

        it("POST " + util.urls.sign_up + " should respond with status code 302 and create a new user if correct user details are provided", function (done) {
            request
                .post(util.urls.sign_up)
                .send({"username": testUtil.sampleUserOne.username, "password": testUtil.sampleUserOne.password})
                .expect(302)
                .end(function (err) {
                    if (err) {throw err;}
                    // check if new user has been created
                    User.find({}, function (err, users) {
                        assert.equal(users.length, 1);
                        assert.equal(users[0].username, testUtil.sampleUserOne.username);
                        done();
                    });
                });
        });
    });

    describe("test sign in and sign up pages with unauthenticated users", function () {
        var cookies;

        before(function (done) {
            testUtil.clearDB(mongoose.connection, function () {
                request
                    .post(util.urls.sign_up)
                    .send({"username": testUtil.sampleUserOne.username, "password": testUtil.sampleUserOne.password})
                    .end(function (err, res) {
                        if (err) {throw err;}
                        cookies = res.headers['set-cookie'].pop().split(';')[0];
                        done();
                    });
            });
        });

        it("GET " + util.urls.sign_up + " should respond with status code 302", function (done) {
            var req = request.get(util.urls.sign_up);
            req.cookies = cookies;
            req.expect(302, done);
        });

        it("GET " + util.urls.sign_in + " should respond with status code 302", function (done) {
            var req = request.get(util.urls.sign_in);
            req.cookies = cookies;
            req.expect(302, done);
        });
    });
});


