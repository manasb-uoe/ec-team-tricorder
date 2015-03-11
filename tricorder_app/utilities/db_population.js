/**
 * Created by Manas on 23-02-2015.
 */

var https = require('https');
var mongoose = require('mongoose');
var async = require('async');
var moment = require('moment');

// models
var Stop = require('../models/stop').Stop;
var Service = require("../models/service").Service;
var Timetable = require("../models/timetable").Timetable;
var ServiceStatus = require("../models/service_status").ServiceStatus;
var LiveLocation = require("../models/live_location").LiveLocation;

var API_BASE_URL = "https://tfe-opendata.com/api/v1";

function populateStops(callback) {
    console.log("Populating Stops...");

    Stop.remove(function (err) {
        if (!err) {
            https.get(API_BASE_URL + "/stops", function(res) {
                var body = "";

                res.on('data', function (chunk) {
                    body += chunk;
                });

                res.on('end', function() {
                    var json = JSON.parse(body);
                    async.each(
                        json.stops,
                        function (stopJson, callback) {
                            var coordinates = [];
                            coordinates.push(stopJson.longitude);
                            coordinates.push(stopJson.latitude);
                            stopJson.coordinates = coordinates;
                            delete stopJson.latitude;
                            delete stopJson.longitude;

                            var stop = new Stop(stopJson);
                            stop.save(function(err) {
                                if (err) {
                                    console.log(e.message);
                                }
                                callback();
                            });
                        },
                        function (err) {
                            if (!err) {
                                console.log("DONE\n");
                            }
                            callback(err, null);
                        }
                    );
                });
            });
        }
    });

}

function populateServices(callback) {
    console.log("Populating Services...");

    Service.remove(function (err) {
        if (!err) {
            https.get(API_BASE_URL + "/services", function(res) {
                var body = "";
                res.on('data', function(chunk){
                    body += chunk;
                });

                res.on('end', function() {
                    var json = JSON.parse(body);
                    async.each(
                        json.services,
                        function (serviceJson, callback) {
                            var service = new Service(serviceJson);
                            service.save(function(err) {
                                if(err){
                                    console.log(e.message);
                                }
                                callback();
                            });
                        },
                        function (err) {
                            if (!err) {
                                console.log("DONE\n");
                            }
                            callback(err, null);
                        }
                    );
                });
            });
        }
    });
}

function populateTimetables(callback) {
    console.log("Populating Timetables...");

    Timetable.remove(function (err) {
        if (!err) {
            Stop.find({}, 'stop_id', function(err, stops) {
                async.each(
                    stops,
                    function (stop, callback) {
                        https.get(API_BASE_URL + "/timetables/" + stop.stop_id, function(res) {
                            var body = '';
                            res.on('data', function(chunk){
                                body += chunk;
                            });

                            res.on('end', function() {
                                var json = JSON.parse(body);

                                async.each(
                                    json["departures"],
                                    function (departure, callback) {
                                        var timetableDoc = {
                                            stop_id: json["stop_id"],
                                            stop_name: json["stop_name"],
                                            service_name: departure["service_name"],
                                            time: departure["time"],
                                            timestamp: moment(departure["time"], "HH:mm").unix(),
                                            destination: departure["destination"],
                                            day: departure["day"]
                                        };

                                        var timetable = new Timetable(timetableDoc);
                                        timetable.save(function(err) {
                                            if(err) {
                                                console.log(err.message);
                                            }
                                            callback();
                                        });
                                    },
                                    function (err) {
                                        callback(err, null);
                                    }
                                );
                            });
                        });
                    },
                    function (err) {
                        if (!err) {
                            console.log("DONE\n");
                        }
                        callback(err, null);
                    }
                );
            });
        }
    });
}

function populateServiceStatuses(callback) {
    console.log("Populating Service Statuses...");

    ServiceStatus.remove(function (err) {
        if (!err) {
            https.get(API_BASE_URL + "/status", function(res){
                var body = '';
                res.on('data', function(chunk){
                    body += chunk;
                });

                res.on('end', function() {
                    var json = JSON.parse(body);
                    async.each(
                        json.disruptions,
                        function (disruptionJson, callback) {
                            var status = new ServiceStatus(disruptionJson);
                            status.save(function(err, post) {
                                if(err){
                                    console.log(err.message);
                                }
                                callback();
                            });
                        },
                        function (err) {
                            if (!err) {
                                console.log("DONE\n");
                            }
                            callback(err, null);
                        }
                    )
                });
            });
        }
    });
}

function populateLiveLocations(callback) {
    console.log("Populating Live Locations...");

    LiveLocation.remove(function (err) {
        if (!err) {
            https.get(API_BASE_URL + "/vehicle_locations", function(res){
                var body = '';
                res.on('data', function(chunk) {
                    body += chunk;
                });

                res.on('end', function() {

                    var json = JSON.parse(body);

                    async.each(
                        json.vehicles,
                        function (vehicleJson, callback) {
                            var coordinates = [];
                            coordinates.push(vehicleJson.longitude);
                            coordinates.push(vehicleJson.latitude);
                            vehicleJson.coordinates = coordinates;
                            delete vehicleJson.latitude;
                            delete vehicleJson.longitude;

                            //Convert unix timestamp to "HH:MM" so that it can be compared with departure times in Journeys or Timetables
                            //12 Hour format
                            var date = new Date(vehicleJson.last_gps_fix * 1000);
                            var hour = date.getHours();
                            if(hour > 12)
                                hour = hour % 12;
                            var hourString = String(hour);
                            var minutes = date.getMinutes();
                            var minutesString = String(minutes);
                            if(minutes < 10)
                                minutesString = "0" + minutesString;
                            var time = hourString + ":" + minutesString;
                            vehicleJson.time = time;

                            var liveLocation = new LiveLocation(vehicleJson);
                            liveLocation.save(function(err) {
                                if(err) {
                                    console.log(err.message);
                                }
                                callback();
                            });
                        },
                        function (err) {
                            if (!err) {
                                console.log("DONE\n");
                            }
                            callback(err, null);
                        }
                    )
                });
            });
        }
    });
}


// function calls go here
mongoose.connect('mongodb://localhost/tricorder_app_db');
mongoose.connection.once('open', function() {
    var arg = process.argv[2];
    var finalCallback = function (err) {
        if (err) {
            console.log(err.message);
        }

        console.timeEnd("total execution time");
        console.log("END OF DB POPULATION SCRIPT");
        process.exit(0);
    };

    if (arg == "all") {
        console.time("total execution time");
        async.series(
            [
                populateStops,
                populateServices,
                populateTimetables,
                populateServiceStatuses,
                populateLiveLocations
            ],
            finalCallback
        );
    }
    else if (arg == "live") {
        console.time("total execution time");
        populateLiveLocations(finalCallback);
    }
    else {
        console.log("Invalid arguments. Only 'all' and 'live' are allowed.");
        process.exit(1);
    }
});

