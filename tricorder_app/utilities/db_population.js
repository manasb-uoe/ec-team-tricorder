/**
 * Created by Manas on 23-02-2015.
 */

var https = require('https');
var mongoose = require('mongoose');
var async = require('async');
var moment = require('moment');
var dbConfig = require("./db");
var schedule = require('node-schedule');

// models
var Stop = require('../models/stop').Stop;
var Service = require("../models/service").Service;
var Timetable = require("../models/timetable").Timetable;
var ServiceStatus = require("../models/service_status").ServiceStatus;
var LiveLocation = require("../models/live_location").LiveLocation;
var VehicleStat = require("../models/vehicle_stats").VehicleStat;
var StopStat = require("../models/stop_stats").StopStat;

var API_BASE_URL = "https://tfe-opendata.com/api/v1";

function populateStops(callbackA) {
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
                        function (stopJson, callbackB) {
                            // use mongodb coordinates so that 'near' queries can be made
                            var coordinates = [];
                            coordinates.push(stopJson.longitude);
                            coordinates.push(stopJson.latitude);
                            stopJson.coordinates = coordinates;
                            delete stopJson.latitude;
                            delete stopJson.longitude;

                            var stop = new Stop(stopJson);
                            stop.save(function(err) {
                                if (err) {
                                    console.log('err 1' + JSON.stringify(err));
                                }
                                callbackB();
                            });
                        },
                        function (err) {
                            if (!err) {
                                console.log("DONE\n");
                                callbackA(err, null);
                            }
                            else {
                                console.log('err 2' + JSON.stringify(err));
                                callbackA(err, null);
                            }
                        }
                    );
                });
            });
        }
    });

}

function populateServices(callbackA) {
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
                        function (serviceJson, callbackB) {
                            var service = new Service(serviceJson);
                            service.save(function(err) {
                                if(!err){
                                    callbackB();
                                }
                            });
                        },
                        function (err) {
                            if (!err) {
                                console.log("DONE\n");
                                callbackA(err, null);
                            }
                        }
                    );
                });
            });
        }
    });
}

function populateTimetables(callbackA) {
    console.log("Populating Timetables...");

    Timetable.remove(function (err) {
        if (!err) {
            Stop.find({}, 'stop_id', function(err, stops) {

                var n = 30;

                var len = stops.length,stopsArrays = [], i = 0;
                while (i < len) {
                    var size = Math.ceil((len - i) / n--);
                    stopsArrays.push(stops.slice(i, i += size));
                }
                var i = 0;
                var j = 0;
                async.eachSeries(stopsArrays, function(stops, callbackC) {
                    console.log('series ' + i++);
                    async.eachSeries(
                        stops,
                        function (stop, callbackB) {
                            https.get(API_BASE_URL + "/timetables/" + stop.stop_id, function(res) {
                                var body = '';
                                res.on('data', function(chunk){
                                    body += chunk;
                                });

                                res.on('end', function() {
                                    var json = JSON.parse(body);

                                    async.each(
                                        json["departures"],
                                        function (departure, callbackC) {
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
                                                if(!err) {
                                                    callbackC();
                                                }
                                                else {
                                                    console.log('err 3' + JSON.stringify(err));
                                                }
                                            });
                                        },
                                        function (err) {
                                            if(!err) {
                                                callbackB(err, null);
                                            }
                                            else {
                                                console.log('err 4' + JSON.stringify(err));
                                            }
                                        }
                                    );
                                });
                            });
                        },
                        function (err) {
                            if (!err) {
                                callbackC(err, null);
                            }
                            else {
                                console.log('err 5' + JSON.stringify(err));
                            }
                        }
                    );
                }, function(err) {
                    if (!err) {
                        console.log("DONE\n");
                        callbackA(err, null);
                    }
                    else {
                        console.log('err 6' + JSON.stringify(err));
                    }
                });

            });
        }
    });
}


function populateServiceStatuses(callbackA) {
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
                        function (disruptionJson, callbackB) {
                            var status = new ServiceStatus(disruptionJson);
                            status.save(function(err) {
                                if(!err){
                                    callbackB();
                                }
                            });
                        },
                        function (err) {
                            if (!err) {
                                console.log("DONE\n");
                                callbackA(err, null);
                            }
                        }
                    )
                });
            });
        }
    });
}

function populateLiveLocations(callbackA) {
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

                    async.eachSeries(
                        json.vehicles,
                        function (vehicleJson, callbackB) {
                            // use mongodb coordinates so that 'near' queries can be made
                            var coordinates = [];
                            coordinates.push(vehicleJson.longitude);
                            coordinates.push(vehicleJson.latitude);
                            vehicleJson.coordinates = coordinates;
                            delete vehicleJson.latitude;
                            delete vehicleJson.longitude;

                            // only save if vehicle_id doesn't already exist in collection
                            LiveLocation
                                .find({vehicle_id: vehicleJson.vehicle_id})
                                .exec(function (err, liveLocations) {
                                    if (!err) {
                                        if (liveLocations.length == 0) {
                                            var liveLocation = new LiveLocation(vehicleJson);
                                            liveLocation.save(function(err) {
                                                if (!err) {
                                                    callbackB();
                                                }
                                            });
                                        } else {
                                            callbackB();
                                        }
                                    }
                                });
                        },
                        function (err) {
                            if (!err) {
                                console.log("DONE\n");
                                callbackA(err, null);
                            }
                        }
                    )
                });
            });
        }
    });
}

function populateStats(callbackA) {
    async.series([
        function(callback) {

            LiveLocation.find({}, 'vehicle_id last_gps_fix', function(err, doc) {

                if(!err) {

                    async.eachSeries(doc, function (loc, callbackA) {

                        var vehicleStat = {
                            date: moment().format('YYYY MM DD'),
                            timestamp: new Date().getTime(),
                            vehicle_id: loc.vehicle_id,
                            early_10_plus: 0,
                            early_10: 0,
                            early_9: 0,
                            early_8: 0,
                            early_7: 0,
                            early_6: 0,
                            early_5: 0,
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

                        var vStat = new VehicleStat(vehicleStat);

                        vStat.save(function (err, post) {

                            if (!err || err.code === 11000) {
                                callbackA();
                            }
                            else {
                                console.log('err 8' + JSON.stringify(err));
                            }


                        });

                    }, function () {

                        console.log('done building vehicle stats');

                        callback();

                    });

                }
                else {
                    console.log('err 9' + JSON.stringify(err));
                }

            });


        },
        function(callback) {

            Stop.find({}, 'stop_id', function(err, stops){

                if(!err) {
                    var timestamp = new Date().getTime();
                    async.eachSeries(stops, function (stop, callbackA) {

                        var stopStat = {
                            date: moment().format('YYYY MM DD'),
                            timestamp: new Date().getTime(),
                            stop_id: stop.stop_id,
                            early_10_plus: 0,
                            early_10: 0,
                            early_9: 0,
                            early_8: 0,
                            early_7: 0,
                            early_6: 0,
                            early_5: 0,
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

                        var sStat = new StopStat(stopStat);

                        sStat.save(function (err, post) {

                            if (!err || err.code === 11000) {
                                callbackA();
                            }
                            else {
                                console.log('err 10' + JSON.stringify(err));
                            }

                        });

                    }, function (err) {

                        if (!err) {
                            console.log('done building stop stats');
                            callback();
                        }
                        else {
                            console.log('err 11' + JSON.stringify(err));
                        }

                    });
                }
                else {
                    console.log('err 12' + JSON.stringify(err));
                }
            });

        }

    ], function(err) {
        callbackA();
        console.log('Stats populated');
    });
}

function updateStats() {

    //Prevent double logging stats for buses found
    var last_gps = {};
    setInterval(function() {

        async.waterfall(
            [
                function (callback) {
                    //Clear the old data
                    LiveLocation.remove({}, function (err) {

                        if (!err) {
                            https.get(API_BASE_URL + "/vehicle_locations", function (res) {

                                var body = '';

                                res.on('data', function (chunk) {

                                    body += chunk;

                                });

                                res.on('end', function () {

                                    console.log('end data');

                                    callback(null, body);

                                });
                            });
                        }
                    });

                },

                function (body, callback) {
                    var json = JSON.parse(body);
                    var doc = {};

                    async.eachSeries(json.vehicles, function(vehicleDoc, callbackA) {

                        var coordinates = [];
                        coordinates.push(vehicleDoc.longitude);
                        coordinates.push(vehicleDoc.latitude);
                        vehicleDoc.coordinates = coordinates;
                        delete vehicleDoc.latitude;
                        delete vehicleDoc.longitude;

                        var loc = new LiveLocation(vehicleDoc);

                        loc.save(function (err, post) {
                            if (!err || err.code === 11000) {
                                callbackA();
                            }
                            else {
                                console.log('err 13' + JSON.stringify(err));
                            }
                        });
                    }, function(err) {

                        if(!err){
                            callback();
                        }
                        else {
                            console.log('err 14' + JSON.stringify(err));
                        }



                    });

                }
                ,

                function (callback) {
                    // return these fields of each location document in the database
                    LiveLocation.find({}, 'service_name coordinates vehicle_id last_gps_fix', function (err, doc) {

                        if (!err) {
                            callback(err, doc);
                        }
                        else {
                            console.log('err 15' + JSON.stringify(err));
                        }



                    });
                },

                function (doc, callback) {
                    console.log('buses near');

                    var buses_near_stops = [];

                    //Iterate through every bus location, store any that are near a stop.
                    async.eachSeries(doc, function (bus, callbackA) {

                        //Ignore the bus if it looks like it is at the same stop as last time
                        var old_coords = last_gps[bus.vehicle_id];
                        var far_enough = true;
                        if (old_coords !== undefined) {
                            //console.log('old coords ' + bus.vehicle_id + ' ' + old_coords);
                            var last_lat = old_coords[0];
                            var last_long = old_coords[1];

                            var cur_lat = bus.coordinates[0];
                            var cur_long = old_coords[1];

                            far_enough = Math.sqrt(Math.pow(last_lat - cur_lat, 2) + Math.pow(last_long - cur_long, 2)) > .0001;
                            if (!far_enough) {
                                //  console.log('not far enough id: ' + bus.vehicle_id);
                            }
                        }

                        last_gps[bus.vehicle_id] = bus.coordinates;

                        if (far_enough) {

                            Stop.findOne({
                                coordinates: {$near: bus.coordinates, $maxDistance: .0001}
                            }, function (err, stop) {
                                if (!err) {

                                    if (stop !== null && bus.service_name !== null) {

                                        var service_name_of_bus = bus.service_name;

                                        var services_of_stop = stop.services;

                                        async.eachSeries(services_of_stop, function (service_id, callbackC) {


                                            if (service_name_of_bus === service_id) {
                                                buses_near_stops.push(
                                                    {
                                                        time: bus.last_gps_fix,
                                                        bus_coords: bus.coordinates,
                                                        stop_coords: stop.coordinates,
                                                        vehicle_id: bus.vehicle_id,
                                                        stop_id: stop.stop_id,
                                                        service_name: service_name_of_bus
                                                    });

                                            }

                                            callbackC();

                                        });
                                        callbackA();
                                    }
                                    else {
                                        callbackA();
                                    }
                                }
                                else {
                                    console.log('err 16' + JSON.stringify(err));
                                }

                            });
                        }
                        else {
                            callbackA();
                        }


                    }, function (err) {
                        if(!err) {
                            callback(null, buses_near_stops);
                        }
                        else {
                            console.log('err 17' + JSON.stringify(err));
                        }

                    });


                },

                function (buses_near_stops, callback) {

                    //Iterate through each bus that is near any stop
                    async.eachSeries(buses_near_stops, function (bus, callbackA) {


                        //Find all timetables that match the stop_id and the service of the bus that is at that stop
                        //If this list is nonempty, it means that the bus is at a stop on its current service
                        Timetable.find({

                            service_name: bus.service_name,
                            stop_id: bus.stop_id

                        }, 'timestamp time', function (err, timestamps) {

                            if (!err) {


                                if (timestamps.length > 0) {


                                    //Out of all the timetables for this stop and service, find the one that is closest in time
                                    //to the time of the last gps_fix of this bus

                                    var minDif = null;

                                    for (var t in timestamps) {
                                        var timestamp = timestamps[t].timestamp;

                                        //Negative if early, positive if late
                                        var negDif = bus.time - timestamp;
                                        var absDif = Math.abs(negDif);

                                        if (minDif === null || absDif < Math.abs(minDif)) {

                                            minDif = negDif;

                                        }
                                    }

                                    //Determine how late/early the bus is, update the vehicle stat corresponding to this bus
                                    VehicleStat.findOne({
                                        vehicle_id: bus.vehicle_id,
                                        date: moment().format('YYYY MM DD')
                                    }, function (err, vehicleStat) {

                                        if (!err) {

                                            //Not sure why vehicleStat goes out of scope
                                            var vehicleStatNew = vehicleStat;

                                            StopStat.findOne({
                                                stop_id: bus.stop_id,
                                                date: moment().format('YYYY MM DD')
                                            }, function (err, stopStat) {
                                                if (!err) {
                                                    // If a new vehicle comes online after stats are first built
                                                    if (vehicleStatNew === null) {

                                                        vehicleStatNew = new VehicleStat({
                                                            date: moment().format('YYYY MM DD'),
                                                            timestamp: new Date().getTime(),
                                                            vehicle_id: bus.vehicle_id,
                                                            early_10_plus: 0,
                                                            early_10: 0,
                                                            early_9: 0,
                                                            early_8: 0,
                                                            early_7: 0,
                                                            early_6: 0,
                                                            early_5: 0,
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
                                                        });


                                                    }
                                                    //In case one was missed by the daily construction
                                                    if (stopStat === null) {

                                                        var timestamp = new Date().getTime();

                                                        stopStat = new StopStat({
                                                            date: moment().format('YYYY MM DD'),
                                                            timestamp: new Date().getTime(),
                                                            vehicle_id: bus.vehicle_id,
                                                            early_10_plus: 0,
                                                            early_10: 0,
                                                            early_9: 0,
                                                            early_8: 0,
                                                            early_7: 0,
                                                            early_6: 0,
                                                            early_5: 0,
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
                                                        });

                                                    }

                                                    var minutesDif = minDif / 60;
                                                    //console.log('minDif ' + minDif);
                                                    //console.log('minutesDif: ' + minutesDif);

                                                    if (minutesDif > 10) {
                                                        stopStat.early_10_plus++;
                                                        vehicleStatNew.early_10_plus++;
                                                        console.log('1');
                                                    }

                                                    else if (minutesDif >= -10 && minutesDif < -9) {
                                                        stopStat.early_9++;
                                                        vehicleStatNew.early_9++;
                                                        console.log('2');
                                                    }

                                                    else if (minutesDif >= -9 && minutesDif < -8) {
                                                        stopStat.early_8++;
                                                        vehicleStatNew.early_8++;
                                                        console.log('3');
                                                    }

                                                    else if (minutesDif >= -8 && minutesDif < -7) {
                                                        stopStat.early_7++;
                                                        vehicleStatNew.early_7++;
                                                        console.log('4');
                                                    }

                                                    else if (minutesDif >= -7 && minutesDif < -6) {
                                                        stopStat.early_6++;
                                                        vehicleStatNew.early_6++;
                                                        console.log('5');
                                                    }

                                                    else if (minutesDif >= -6 && minutesDif < -5) {
                                                        stopStat.early_5++;
                                                        vehicleStatNew.early_5++;
                                                        console.log('6');
                                                    }

                                                    else if (minutesDif >= -4 && minutesDif < -3) {
                                                        stopStat.early_4++;
                                                        vehicleStatNew.early_4++;
                                                        console.log('7');
                                                    }

                                                    else if (minutesDif >= -3 && minutesDif < -2) {
                                                        stopStat.early_3++;
                                                        vehicleStatNew.early_3++;
                                                        console.log('8');
                                                    }

                                                    else if (minutesDif >= -2 && minutesDif < -1) {
                                                        stopStat.early_2++;
                                                        vehicleStatNew.early_2++;
                                                        console.log('9');
                                                    }

                                                    else if (minutesDif <= 2 && minutesDif > 1) {
                                                        stopStat.late_2++;
                                                        vehicleStatNew.late_2++;
                                                        console.log('10');
                                                    }

                                                    else if (minutesDif <= 3 && minutesDif > 2) {
                                                        stopStat.late_3++;
                                                        vehicleStatNew.late_3++;
                                                        console.log('11');
                                                    }

                                                    else if (minutesDif <= 4 && minutesDif > 3) {
                                                        stopStat.late_4++;
                                                        vehicleStatNew.late_4++;
                                                        console.log('12');
                                                    }
                                                    else if (minutesDif <= 5 && minutesDif > 4) {
                                                        stopStat.late_5++;
                                                        vehicleStatNew.late_5++;
                                                        console.log('13');
                                                    }
                                                    else if (minutesDif <= 6 && minutesDif > 5) {
                                                        stopStat.late_6++;
                                                        vehicleStatNew.late_6++;
                                                        console.log('14');
                                                    }

                                                    else if (minutesDif <= 7 && minutesDif > 6) {
                                                        stopStat.late_7++;
                                                        vehicleStatNew.late_7++;
                                                        console.log('15');
                                                    }

                                                    else if (minutesDif <= 8 && minutesDif > 7) {
                                                        stopStat.late_8++;
                                                        vehicleStatNew.late_8++;
                                                        console.log('16');
                                                    }

                                                    else if (minutesDif <= 9 && minutesDif > 8) {
                                                        stopStat.late_9++;
                                                        vehicleStatNew.late_9++;
                                                        console.log('17');
                                                    }

                                                    else if (minutesDif <= 10 && minutesDif > 9) {
                                                        stopStat.late_10++;
                                                        vehicleStatNew.late_10++;
                                                        console.log('18');
                                                    }

                                                    else if (minutesDif > 10) {
                                                        stopStat.late_10_plus++;
                                                        vehicleStatNew.late_10_plus++;
                                                        console.log('19');
                                                    }

                                                    else {
                                                        console.log('20');
                                                        stopStat.on_time++;
                                                        vehicleStatNew.on_time++;

                                                    }

                                                    vehicleStatNew.modified = true;
                                                    stopStat.modified = true;

                                                    vehicleStatNew.save(function (err, product, numberAffected) {
                                                        if (!err) {
                                                            stopStat.save(function (err, product, numberAffected) {
                                                                if (err) {
                                                                    console.log('err 18' + JSON.stringify(err));
                                                                }
                                                                callbackA();
                                                            });
                                                        }
                                                        else {
                                                            console.log('err 19' + JSON.stringify(err));
                                                            console.log('product ' + product);
                                                            console.log('stat ' + vehicleStatNew);
                                                        }
                                                    });
                                                }
                                                else {
                                                    console.log('err 20' + JSON.stringify(err));
                                                }
                                            });
                                        }
                                        else {
                                            console.log('err 21' + JSON.stringify(err));
                                        }
                                    });


                                }
                                else {
                                    callbackA();
                                    console.log('no timestamps');
                                }

                            }
                            else {
                                console.log('err 22' + JSON.stringify(err));
                            }
                        });


                    }, function (err) {
                        console.log('callback');
                        callback();
                    });

                }
            ],

            function (err, results) {
                if(err) {
                    console.log('err 23' + JSON.stringify(err));
                }


                console.log('end');
            });
    }, 15000);
}


// function calls go here
mongoose.connect(dbConfig.dev_db_url);
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

    if (arg === "all") {
        console.time("total execution time");
        async.series(
            [
                populateStops,
                populateServices,
                populateTimetables,
                populateServiceStatuses,
                populateLiveLocations,
                populateStats
            ],
            finalCallback
        );
    } else if (arg === "live") {
        console.time("total execution time");
        populateLiveLocations(finalCallback);
    }
    else if (arg === "update_stats") {
        console.time("total execution time");
        updateStats();
    }

    else if (arg === "repeat") {
        //begin at 04:00 every day and shutdown at 23:00 every day
        var a = schedule.scheduleJob('12 11 * * *', function(){
            console.log('beginning update at' + new Date());
            var r = setInterval(
                updateStats
            );

            //19 hours later
            setTimeout(function(){
                console.log('ending update at ' + new Date());
                clearInterval(r);
            },68400000, r);
        });
        //update documents every dat at 02:00
        var b = schedule.scheduleJob('10 11 * * *', function(){
            async.series(
                [
                    populateStops,
                    populateServices,
                    populateTimetables,
                    populateServiceStatuses,
                    populateLiveLocations,
                    populateStats
                ],
                finalCallback
            );
        });
    }

    else {
        console.log("Invalid arguments. Only 'all', 'live' and 'update_stats' are allowed.");
        process.exit(1);
    }
});

