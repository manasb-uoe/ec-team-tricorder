/**
 * Created by Manas on 07-03-2015.
 */

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

