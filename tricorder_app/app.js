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
https.get("https://tfe-opendata.com/api/v1/stops", function(res){
    var body = '';
    res.on('data', function(chunk){
	body += chunk;

    });

    res.on('end', function() {
	var json = JSON.parse(body);
	var doc = {};
	for(var i in json.stops) {
	    var stopDoc = json.stops[i];

	    var coordinates = [];
	    coordinates.push(stopDoc.longitude);
	    coordinates.push(stopDoc.latitude);
	    stopDoc.coordinates = coordinates;
	    delete stopDoc.latitude;
	    delete stopDoc.longitude;
	    
	    
	    var stop = new Stop(stopDoc);
	    stop.save(function(err, post) {
	    	if(err){return next(err);}
	    });
	}
    });
});


//====== Services ======
https.get("https://tfe-opendata.com/api/v1/services", function(res){
    console.log("Response: ", res.statusCode);
    console.log("Res: " + res);
    var body = '';
    res.on('data', function(chunk){
	body += chunk;
    });

    res.on('end', function() {
	var json = JSON.parse(body);
	for(var i in json.services) {
	    var service = new Service(json.services[i]);
	    service.save(function(err, post) {
		if(err){return next(err);}
		
	    });
	}
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

// ====== Live Bus Locations ======
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
	    });
	}
    });
});

var mtime = moment('8:73', 'HH:mm');

console.log('time ' + mtime);


module.exports = app;
