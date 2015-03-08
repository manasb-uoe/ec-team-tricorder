var globals = require('../utilities/globals');
var util = require('../utilities/util');
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

/* GET stops near me page */
module.exports.nearbyStops = function (req, res) {
    Stop.find(function (err, stops) {
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
                    current_url: globals.urls.nearby_stops,
                    urls: globals.urls,
                    stops: requestedStops,
                    count_choices: [10, 50, 100, "All"],
                    count_selected: count == stops.length ? "All" : count
                }
            );
        }
    });
};


