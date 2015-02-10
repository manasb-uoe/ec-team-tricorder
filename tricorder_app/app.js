var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var swig = require('swig');
var mongoose = require('mongoose');
var moment = require('moment');

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
var Journey = mongoose.model('Timetable');

var ServiceStatuses = require('./models/ServiceStatuses.js');
var ServiceStatus = mongoose.model('ServiceStatus');

var Locations = require('./models/Locations.js');
var Location = mongoose.model('Location');

var StopStats = require('./models/StopStats.js');
var StopStat = mongoose.model('StopStats');

var VehicleStats = require('./models/VehicleStats.js');
var VehicleStat = mongoose.model('VehicleStats');

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


//Populating the database just for experiments
// var options = {
//     host: 'tfe-opendata.com',
//     path: '/api/v1/stops',
//     method: 'GET'
// }

// var httpreq = https.request(options, function(response) {
//     response.on('data', function(chunk) {
// 	console.log("data " + chunk);
//     });
// });

// httpreq.on('error', function(e) {
//     console.log('error: ' + e);
// });

// httpreq.end();

//======= All below have been populated already========

//  ====== Stops ======
// https.get("https://tfe-opendata.com/api/v1/stops", function(res){
//     var body = '';
//     res.on('data', function(chunk){
// 	body += chunk;

//     });

//     res.on('end', function() {
// 	var json = JSON.parse(body);
// 	var doc = {};
// 	for(var i in json.stops) {
// 	    var stopDoc = json.stops[i];

// 	    var coordinates = [];
// 	    coordinates.push(stopDoc.longitude);
// 	    coordinates.push(stopDoc.latitude);
// 	    stopDoc.coordinates = coordinates;
// 	    delete stopDoc.latitude;
// 	    delete stopDoc.longitude;
	    
	    
// 	    var stop = new Stop(stopDoc);
// 	    stop.save(function(err, post) {
// 	    	if(err){return next(err);}
// 	    });
// 	}
//     });
// });


// // ====== Services ====== //
// https.get("https://tfe-opendata.com/api/v1/services", function(res){
//     console.log("Response: ", res.statusCode);
//     console.log("Res: " + res);
//     var body = '';
//     res.on('data', function(chunk){
// 	body += chunk;
//     });

//     res.on('end', function() {
// 	var json = JSON.parse(body);
// 	for(var i in json.services) {
// 	    var service = new Service(json.services[i]);
// 	    service.save(function(err, post) {
// 		if(err){return next(err);}
		
// 	    });
// 	}
//     });
// });

// //===== Timetables =====
// Stop.find({}, 'stop_id',function(err,doc) {
//     var stops = doc;

//     for(var i in stops) {
// //	console.log('id ' + stops[i].stop_id);
// 	https.get("https://tfe-opendata.com/api/v1/timetables/" + stops[i].stop_id, function(res){

// 	  //  console.log('res ' + res.statusCode);

// 	    var body = '';
// 	    res.on('data', function(chunk){
// 	//	console.log('chunk ' + chunk);
// 		body += chunk;
// //		console.log('body2 ' + body);
// 	    });

	   

// 	 //   console.log('body ' + body);
// 	    res.on('end', function() {
// 	    	var json = JSON.parse(body);
// 	   	var timetable = new Timetable(json);
// 	    	timetable.save(function(err, post) {
// 	    	    if(err){return next(err);}
		    
// 	    	});
// 	    });
// 	});
//     }
// });

// //====== Service Status ======	
// https.get("https://tfe-opendata.com/api/v1/status", function(res){
//     var body = '';
//     res.on('data', function(chunk){
// 	body += chunk;
//     });

//     res.on('end', function() {
// 	var json = JSON.parse(body);
// 	for(var i in json.disruptions) {
// 	    var status = new ServiceStatus(json.disruptions[i]);
// 	    status.save(function(err, post) {
// 		if(err){return next(err);}
// 	    });
// 	}
//     });
// });


//     //====== Initialize Stats Docs ======//

//     Location.find({}, 'vehicle_id', function(err, doc){
// 	if(err){return next(err);}

// 	doc.forEach(function(j,k){
// 	    var vehicleStat = {
// 		vehicle_id: j.vehicle_id,
// 		early_5_plus: 0,
// 		early_4: 0,
// 		early_3: 0,
// 		early_2: 0,
// 		on_time: 0,
// 		late_2: 0,
// 		late_3: 0,
// 		late_4: 0,
// 		late_5_plus: 0,
// 		total_count: 0,
// 		modified: false
// 	    };

// 	    var vStat = new VehicleStat(vehicleStat);
// 	    vStat.save(function(err, post){
// 		if(err){return next(err);}
// 	    });
// 	});
//     });

//     Stop.find({}, 'stop_id', function(err, doc){
// 	if(err){return next(err);}

// 	doc.forEach(function(j,k){
// 	    var stopStat = {
// 		stop_id: j.stop_id,
// 		early_5_plus: 0,
// 		early_4: 0,
// 		early_3: 0,
// 		early_2: 0,
// 		on_time: 0,
// 		late_2: 0,
// 		late_3: 0,
// 		late_4: 0,
// 		late_5_plus: 0,
// 		total_count: 0,
// 		modified: false
// 	    };

// 	    var sStat = new StopStat(stopStat);
// 	    sStat.save(function(err, post){
// 		if(err){return next(err);}
// 	    });
// 	});
//     });

// ====== Updating Bus locations and stats every 15 seconds ====== //

function findBusesNearStops() {
    
//    console.log('finding buses'); 
    var buses_near_stops = [];
    
    // return these fields of each location document in the database
    Location.find({}, 'service_name coordinates vehicle_id last_gps_fix', function(err, doc){
	if(err){return next(err);}

	doc.forEach(function(j,k) {
	    //Find a stop that is near enough to each given bus that we can say the bus is 'at' that stop
	    //Making sure it returns 1 stop now because I don't know proper distance
	    Stop.findOne({
		coordinates: { $near : j.coordinates, $maxDistance: .00001}
	    }, function(err, stop){
		if(err){return next(err);}

		// service_name is null if bus is out of service (I believe)
		if(stop !== null && j.service_name !== null) {
		    var service_name_of_bus = j.service_name;

		    // Find the service document associated with service_name_of_bus
		    var service_of_name = Service.findOne({name: service_name_of_bus}, function(err, service_of_name){
			if(err){return next(err);}
			
			// If the service has 'stop' on its route
			if(service_of_name.routes[0].stops.indexOf(stop.stop_id) > -1) {

			    // We have now found a bus that is stopped at a stop on its route
			    buses_near_stops.push(
				{
				    time: j.last_gps_fix,
				    bus_coords: j.coordinates,
				    stop_coords: stop.coordinates,
				    vehicle_id: j.vehicle_id,
				    stop_id: stop.stop_id,
				    service_name: service_name_of_bus
				});
			}
		    });
		    
		}
	    });

	});
    });

    return buses_near_stops;
}

function updateStats(buses_near_stops) {
//    console.log('updating stats');
    buses_near_stops.forEach(function(j,k) {
	console.log('near stops ');
	console.log('count of buses near stops ' + k);

	// Comparing the current time with the time that the bus is supposed to be at this stop
	var journey = Journey.find({service_name: j.service_name});
	var departures = journey.departures;

	// Journey gives a timetable of a particular service
	// Iterate over all docs in that Journey to find the time that the bus is supposed to be at this stop
	//THIS PROBABLY ISN'T RIGHT---BUS SHOULD BE AT EACH STOP ON JOURNEY MULTIPLE TIMES PER DAY
	for(var i = 0; i < departures.length; i++) {
	    console.log('departures');
	    var curDeparture = departures[i];
	    if(curDeparture.stop_id === j.stop_id) {
		var vehicleStat = VehicleStat.find({vehicle_id : j.vehicle_id}, function(err, doc){

		    console.log('stat found ' + doc);
		    if(err){return next(err);}

		    var stopStat = StopStat.find({stop_id : j.stop_id}, function(err, doc) {
			if(err){return next(err);}
			var journeyTime = moment(curDeparture.time, 'HH:mm');
			
			var timeDif = j.time - journeyTime;
			
			var minutesDif = timeDif / 60000;

			if(minutesDif < 5) {
			    stopStat.early_5_plus++;
			    vehicleStat.early_5_plus++;
			}

			else if(minutesDif > 4 && minutesDif < 3) {
			    stopStat.early_4++;
			    vehicleStat.early_4++;
			}

			else if(minutesDif > 3 && minutesDif < 2) {
			    stopStat.early_3++;
			    vehicleStat.early_3++;
			}
			
			else if(minutesDif > 2 && minutesDif < 1) {
			    stopStat.early_2++;
			    vehicleStat.early_2++;
			}

			else if(minutesDif < 2 && minutesDif > 1) {
			    stopStat.late_2++;
			    vehicleStat.late_2++;
			}

			else if(minutesDif < 3 && minutesDif > 2) {
			    stopStat.late_3++;
			    vehicleStat.late_3++;
			}
			
			else if(minutesDif < 4 && minutesDif > 3) {
			    stopStat.late_4++;
			    vehicleStat.late_4++;
			}

			else if(minutesDif > 5) {
			    stopStat.late_5_plus++;
			    vehicleStat.late_5_plus++;
			}

			else {
			    console.log('minutesDif: ' + minutesDif);
			}
			console.log('before find');
			//Print any stats documents that have been modified, so that I know if anything is working
			VehicleStat.find({modified: {$ne: false}}, function(err, doc) {
			    console.log('after find');
			    if(err){return next(err);}

			    console.log(JSON.stringify(doc));

			    StopStat.find({modified: {$ne: false}}, function(err, doc) {
				if(err){return next(err);}
				console.log(JSON.stringify(doc));
			    });
			});

		    });
		});
		
	    }
	}
	
    });
}



setInterval(function() {

    // ====== Live Bus Locations ====== //
    https.get("https://tfe-opendata.com/api/v1/vehicle_locations", function(res){
	//Clear the old data
	Location.remove({}, function(err) {
	    if(err){return next(err);}
	});


	var body = '';
	res.on('data', function(chunk){
	    body += chunk;

	});

	res.on('end', function() {
	    console.log('end data');
	    var json = JSON.parse(body);
	    var doc = {};
	    for(var i in json.vehicles) {
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
		if(hour > 12)
		    hour = hour % 12;
		var hourString = String(hour);
		var minutes = date.getMinutes();
		var minutesString = String(minutes);
		if(minutes < 10)
		    minutesString = "0" + minutesString;
		var time = hourString + ":" + minutesString;
		vehicleDoc.time = time;

		var loc = new Location(vehicleDoc);
		loc.save(function(err, post) {
	    	    if(err){return next(err);}

		    var buses_near_stops = findBusesNearStops();
		    
		    updateStats(buses_near_stops);
		});
	    }
	});
   });



    // Iterating over all buses currently stopped at stops on their respective routes
    

}, 15000);



module.exports = app;
