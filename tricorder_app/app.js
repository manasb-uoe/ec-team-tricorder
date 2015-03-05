var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var swig = require('swig');
var mongoose = require('mongoose');
var moment = require('moment');
var async = require('async');

var routes = require('./routes/index');
var users = require('./routes/users');

// express app initialization
var app = express();

// connect to db and attach it to the request object
mongoose.connect('mongodb://localhost/tricorder_app_db');
var db = mongoose.connection;
db.once('open', function() {
    app.use(function(req, res, next) {
        req.db = db;
        next();
    });
});

// view engine setup
app.engine('html', swig.renderFile);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'html');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

//Require all DB Models

var Stops = require('./models/Stops.js');
var Stop = mongoose.model('Stop');

var Services = require('./models/Services.js');
var Service = mongoose.model('Service');

var Timetables = require('./models/Timetables.js');
var Timetable = mongoose.model('Timetable');

var Journeys = require('./models/Journeys.js');
var Journey = mongoose.model('Journey');

var ServiceStatuses = require('./models/ServiceStatuses.js');
var ServiceStatus = mongoose.model('ServiceStatus');

var Locations = require('./models/Locations.js');
var Location = mongoose.model('Location');

var StopStats = require('./models/StopStats.js');
var StopStat = mongoose.model('StopStat');

var VehicleStats = require('./models/VehicleStats.js');
var VehicleStat = mongoose.model('VehicleStat');

var routes = require('./routes/index');
var users = require('./routes/users');

var https = require('https');//Do I need to add this to dependencies?





// routes
app.use('/', routes);
app.use('/users', users);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});



//======= All below have been populated already========

//  ====== Stops ======
https.get("https://tfe-opendata.com/api/v1/stops", function(res){
    var body = '';
    res.on('data', function(chunk){
        body += chunk;

    });

    res.on('end', function() {
        var json = JSON.parse(body);
        var stops = json.stops;
        async.eachSeries(stops,function(stop, callbackA){
            console.log('blah');

            var coordinates = [];
            coordinates.push(stop.longitude);
            coordinates.push(stop.latitude);
            stop.coordinates = coordinates;
            delete stop.latitude;
            delete stop.longitude;


            var stopDoc = new Stop(stop);
            stopDoc.save(function(err, post) {
                if(err){return next(err);}
                callbackA();
            });
        }, function(err){
            console.log('Done with Stops');
        });
    });
});


//====== Services and Journeys ====== //
https.get("https://tfe-opendata.com/api/v1/services", function(res){
    console.log("Response: ", res.statusCode);
    console.log("Res: " + res);
    var body = '';
    res.on('data', function(chunk){
        body += chunk;
    });

    res.on('end', function() {
        var json = JSON.parse(body);

        async.eachSeries(json.services, function(item, callback) {
            var service = new Service(item);
            service.save(function(err, post) {
                if(err){return next(err);}

                https.get("https://tfe-opendata.com/api/v1/journeys/" + item.name, function(res) {

                    var body = '';

                    res.on('data', function(chunk){
                        body += chunk;
                    });

                    res.on('end', function() {
                        var json = JSON.parse(body);

                        //console.log('json ' + JSON.stringify(json));
                        var journey = new Journey(json);
                        //console.log(journey);

                        journey.save(function(err, post) {
                            if(err){return next(err);}

                            callback();
                        });
                    });
                });

            });
        }, function(err){
            console.log('Done with services and journeys');
        });

    });
});


//===== Timetables =====
Stop.find({}, 'stop_id',function(err,doc) {
     var stops = doc;

     for(var i in stops) {
//	console.log('id ' + stops[i].stop_id);
	https.get("https://tfe-opendata.com/api/v1/timetables/" + stops[i].stop_id, function(res){

	  //  console.log('res ' + res.statusCode);

	    var body = '';
	    res.on('data', function(chunk){
	//	console.log('chunk ' + chunk);
		body += chunk;
//		console.log('body2 ' + body);
	    });



	 //   console.log('body ' + body);
	    res.on('end', function() {
	    	var json = JSON.parse(body);
	   	var timetable = new Timetable(json);
	    	timetable.save(function(err, post) {
	    	    if(err){return next(err);}

	    	});
	    });
	});
     }
});


//====== New and Improved Timetables! ====== //
//Flatten the data so that each departure is indexable by stop_id and servicename to improve lookup times
//====== WARNING THIS TAKES ~20 minutes TO RUN USE WITH CAUTION ======= //
Stop.find({}, 'stop_id',function(err,doc) {
    console.log('start ' + new Date().toUTCString());
    var stops = doc;

    async.eachSeries(stops, function(stop, callbackA) {
        https.get("https://tfe-opendata.com/api/v1/timetables/" + stop.stop_id, function(res){
            console.log('request');

            var body = '';
            res.on('data', function(chunk){

                body += chunk;

            });

            res.on('end', function() {
                var json = JSON.parse(body);
                var departures = json.departures;
                async.eachSeries(departures, function(curDeparture, callbackB){

                    var timeToUnix = moment(curDeparture.time, 'HH:mm').unix();

                    var result = {
                        stop_id: json.stop_id,
                        stop_name: json.stop_name,
                        service_name: curDeparture.service_name,
                        time: curDeparture.time,
                        timestamp: timeToUnix,
                        destination: curDeparture.destination,
                        day: curDeparture.day,
                        note_id: curDeparture.note_id,
                        valid_from: curDeparture.valid_from
                    };


                    var timetable = new Timetable(result);

                    timetable.save(function(err, post) {

                        if(err){return next(err);}

                        callbackB();
                    });

                }, function(err){
                    callbackA();
                });

            });
        });
    }, function(err) {
        console.log('timetables done ' + new Date().toUTCString());
    });
});

//====== Service Status ======
https.get("https://tfe-opendata.com/api/v1/status", function(res){
    var body = '';
    res.on('data', function(chunk){
        body += chunk;
    });

    res.on('end', function() {

        var json = JSON.parse(body);
        for(var i in json.disruptions) {

            var status = new ServiceStatus(json.disruptions[i]);
            status.save(function(err, post) {
                if(err){return next(err);}
            });

        }

    });
});


     //====== Initialize Stats Docs ======//

Location.find({}, 'vehicle_id', function(err, doc){
    if(err){return next(err);}

    async.eachSeries(doc, function(loc, callbackA) {

        var vehicleStat = {
            vehicle_id: loc.vehicle_id,
            early_5_plus: 0,
            early_4: 0,
            early_3: 0,
            early_2: 0,
            on_time: 0,
            late_2: 0,
            late_3: 0,
            late_4: 0,
            late_5_plus: 0,
            total_count: 0,
            modified: false
        };

        var vStat = new VehicleStat(vehicleStat);

        vStat.save(function(err, post){

            console.log('saving');
            if(err){return next(err);}
            callbackA();

        });

    }, function(){

        console.log('done');

    });

});

Stop.find({}, 'stop_id', function(err, doc){
    if(err){return next(err);}

    doc.forEach(function(j,k){
        var stopStat = {
            stop_id: j.stop_id,
            early_5_plus: 0,
            early_4: 0,
            early_3: 0,
            early_2: 0,
            on_time: 0,
            late_2: 0,
            late_3: 0,
            late_4: 0,
            late_5_plus: 0,
            total_count: 0,
            modified: false
        };

        //var sStat = new StopStat(stopStat);
        //sStat.save(function(err, post){
        //    if(err){return next(err);}
        //});
    });
});


//======== Build locations one time, then use them to build vehicle stats ======== //

async.waterfall([
    function(callback) {
        https.get("https://tfe-opendata.com/api/v1/vehicle_locations", function (res) {
            //Clear the old data
            Location.remove({}, function (err) {

                if (err) {return next(err);}

                var body = '';
                res.on('data', function (chunk) {

                    body += chunk;

                });

                res.on('end', function () {

                    console.log('end data');

                    callback(null, body);
                });
            });



        });

    },

    function (body, callback) {
        var json = JSON.parse(body);
        var doc = {};

        //async.eachSeries(json.vehicles, function(vehicleDoc, callbackA) {
        //
        //});
        for (var i in json.vehicles) {
            var vehicleDoc = json.vehicles[i];

            var coordinates = [];
            coordinates.push(vehicleDoc.longitude);
            coordinates.push(vehicleDoc.latitude);
            vehicleDoc.coordinates = coordinates;
            delete vehicleDoc.latitude;
            delete vehicleDoc.longitude;

            //Convert unix timestamp to "HH:MM" so that it can be compared with departure times in Journeys or Timetables
            //12 Hour format
            var date = new Date(vehicleDoc.last_gps_fix * 1000);
            var hour = date.getHours();
            if (hour > 12)
                hour = hour % 12;
            var hourString = String(hour);
            var minutes = date.getMinutes();
            var minutesString = String(minutes);
            if (minutes < 10)
                minutesString = "0" + minutesString;
            var time = hourString + ":" + minutesString;
            vehicleDoc.time = time;

            var loc = new Location(vehicleDoc);
            //console.log('new loc');

            loc.save(function (err, post) {
                if (err) {
                    return next(err);
                }


            });
        }

        callback();

    },


    function(callback) {

        VehicleStat.remove({}, function(err){
            if (err) {
                return next(err);
            }

            Location.find({}, 'vehicle_id', function(err, doc) {

                if(err){return next(err);}

                async.eachSeries(doc, function(loc, callbackA) {

                    var vehicleStat = {
                        vehicle_id: loc.vehicle_id,
                        early_5_plus: 0,
                        early_4: 0,
                        early_3: 0,
                        early_2: 0,
                        on_time: 0,
                        late_2: 0,
                        late_3: 0,
                        late_4: 0,
                        late_5_plus: 0,
                        total_count: 0,
                        modified: false
                    };

                    var vStat = new VehicleStat(vehicleStat);

                    vStat.save(function(err, post){

                        if(err){return next(err);}

                        callbackA();

                    });

                }, function(){

                    console.log('done building vehicle stats');

                    callback();

                });

            });

        });

    }
], function(err) {
    console.log('Locations and vehicle stats built');
});





setInterval(function() {

    async.waterfall(
        [
            function (callback) {
                https.get("https://tfe-opendata.com/api/v1/vehicle_locations", function (res) {
                    //Clear the old data
                    Location.remove({}, function (err) {
                        if (err) {
                            return next(err);
                        }
                        var body = '';
                        res.on('data', function (chunk) {
                            body += chunk;

                        });

                        res.on('end', function () {
                            console.log('end data');

                            callback(null, body);
                        });
                    });



                });

            },

            function (body, callback) {
                var json = JSON.parse(body);
                var doc = {};
                for (var i in json.vehicles) {
                    var vehicleDoc = json.vehicles[i];

                    var coordinates = [];
                    coordinates.push(vehicleDoc.longitude);
                    coordinates.push(vehicleDoc.latitude);
                    vehicleDoc.coordinates = coordinates;
                    delete vehicleDoc.latitude;
                    delete vehicleDoc.longitude;

                    //Convert unix timestamp to "HH:MM" so that it can be compared with departure times in Journeys or Timetables
                    //12 Hour format
                    var date = new Date(vehicleDoc.last_gps_fix * 1000);
                    var hour = date.getHours();
                    if (hour > 12)
                        hour = hour % 12;
                    var hourString = String(hour);
                    var minutes = date.getMinutes();
                    var minutesString = String(minutes);
                    if (minutes < 10)
                        minutesString = "0" + minutesString;
                    var time = hourString + ":" + minutesString;
                    vehicleDoc.time = time;

                    var loc = new Location(vehicleDoc);

                    loc.save(function (err, post) {
                        if (err) {
                            return next(err);
                        }


                    });
                }

                callback();

            }
            ,

            function (callback) {
                // return these fields of each location document in the database
                Location.find({}, 'service_name coordinates vehicle_id last_gps_fix', function (err, doc) {

                    if (err) {
                        return next(err);
                    }

                    callback(err, doc);
                });
            },

            function (doc, callback) {
                console.log('buses near');

                var buses_near_stops = [];

                //Iterate through every bus location, store any that are near a stop.
                async.eachSeries(doc, function (bus, callbackA) {

                    Stop.findOne({
                        coordinates: {$near: bus.coordinates, $maxDistance: .0001}
                    }, function (err, stop) {
                        if (err) {
                            return next(err);
                        }

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

                    });

                }, function (err) {
                    callback(null, buses_near_stops);
                });


            },

            function (buses_near_stops, callback) {

                console.log('number of buses near stops ' + buses_near_stops.length);

                async.eachSeries(buses_near_stops, function (bus, callbackA) {

                    Timetable.find({
                        service_name: bus.service_name,
                        stop_id: bus.stop_id
                    }, 'timestamp time', function (err, timestamps) {

                        if (err) {
                            return next(err);
                        }

                        if(timestamps.length > 0) {

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



                            VehicleStat.findOne({vehicle_id: bus.vehicle_id}, function (err, vehicleStat) {

                                if (err) {

                                    console.log('vehicle error');
                                    return next(err);

                                }
                                if(vehicleStat === null) {

                                    console.log('null stat ' + bus.vehicle_id);
                                    console.log('There is a mismatch between locations and vehiclestats');
                                    callbackA();

                                }
                                else {

                                    var minutesDif = minDif / 60;
                                    console.log('minDif ' + minDif);
                                    console.log('minutesDif: ' + minutesDif);


                                    if (minutesDif < -5) {
                                        //stopStat.early_5_plus++;
                                        vehicleStat.early_5_plus++;
                                        console.log('1');
                                    }

                                    else if (minutesDif >= -4 && minutesDif < -3) {
                                        // stopStat.early_4++;
                                        vehicleStat.early_4++;
                                        console.log('2');
                                    }

                                    else if (minutesDif >= -3 && minutesDif < -2) {
                                        //stopStat.early_3++;
                                        vehicleStat.early_3++;
                                        console.log('3');
                                    }

                                    else if (minutesDif >= -2 && minutesDif < -1) {
                                        //stopStat.early_2++;
                                        vehicleStat.early_2++;
                                        console.log('4');
                                    }

                                    else if (minutesDif < 2 && minutesDif > 1) {
                                        //stopStat.late_2++;
                                        vehicleStat.late_2++;
                                        console.log('5');
                                    }

                                    else if (minutesDif < 3 && minutesDif > 2) {
                                        //stopStat.late_3++;
                                        vehicleStat.late_3++;
                                        console.log('6');
                                    }

                                    else if (minutesDif < 4 && minutesDif > 3) {
                                        //stopStat.late_4++;
                                        vehicleStat.late_4++;
                                        console.log('7');
                                    }

                                    else if (minutesDif > 5) {
                                        //stopStat.late_5_plus++;
                                        vehicleStat.late_5_plus++;
                                        console.log('8');
                                    }

                                    else {

                                        vehicleStat.on_time++;

                                    }

                                    vehicleStat.modified = true;
                                    vehicleStat.save(function (err, product, numberAffected) {

                                        callbackA();

                                    });

                                }

                            });

                        }
                        else {

                            callbackA();
                            console.log('no timestamps');

                        }
                    });


                    }, function (err) {

                        console.log('callback');

                        callback(err);

                    });

            }
        ],

        function (err, results) {

            console.log('end');

        });
}, 15000);



module.exports = app;

