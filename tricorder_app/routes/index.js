var globals = require('../utilities/globals');
var util = require('../utilities/util');
var async = require('async');
var Stop = require('../models/stop').Stop;
var Service = require('../models/service').Service;

/* GET home page. */
module.exports.home = function(req, res) {
    res.render('home.html', {
            title: "Home",
            current_url: globals.urls.home,
            urls: globals.urls
        }
    );
};




