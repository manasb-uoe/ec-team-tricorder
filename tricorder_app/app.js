var express = require('express');
var session = require('express-session');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var swig = require('swig');
var mongoose = require('mongoose');
var MongoStore = require('connect-mongo')(session);

var util = require('./utilities/util');
var dbConfig = require("./utilities/db");
var routesIndex = require('./routes/index');

var app = express();

// database setup
mongoose.connect(dbConfig.url);

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
app.use(session({
    secret: 'such_secret_key',
    saveUninitialized: true,
    resave: true,
    store: new MongoStore({mongooseConnection: mongoose.connection})
}));
app.use(express.static(path.join(__dirname, 'public')));

// routes go here
app.get(util.urls.home, routesIndex.home);
app.get(util.urls.nearby_stops, routesIndex.nearbyStops);
app.get(util.urls.stop + "/:id", routesIndex.stop);
app.get(util.urls.sign_in, routesIndex.sign_in);
app.post(util.urls.sign_in, routesIndex.sign_in_post);
app.get(util.urls.sign_up, routesIndex.sign_up);
app.post(util.urls.sign_up, routesIndex.sign_up_post);
app.get(util.urls.sign_out, routesIndex.sign_out);
app.post(util.urls.add_stop_to_favourites, routesIndex.add_stop_to_favourites);
app.post(util.urls.remove_stop_from_favourites, routesIndex.remove_stop_from_favourites);
app.get(util.urls.favourites, util.restrictUnauthenticatedUser, routesIndex.favourites);

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
        res.render('error.html', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error.html', {
        message: err.message,
        error: {}
    });
});


module.exports = app;
