/**
 * Created by Manas on 26-03-2015.
 */

// import models
var Stop = require("../models/stop").Stop;

module.exports.clearDB = function (mongooseConnection, callback) {
    mongooseConnection.db.dropDatabase(function (err) {
        if (err) {throw err;}
        callback();
    });
};

module.exports.sampleStopOne = {
    stop_id: 0,
    name: "name_1",
    identifier: "id_1",
    locality: "locality_!",
    orientation: 0,
    direction: "direction_1",
    coordinates : [0, 0],
    destinations: [],
    services: []
};

module.exports.sampleServiceOne = {
    name: "name_1",
    description: "destination_1",
    service_type: "type_1",
    routes: []
};

module.exports.sampleLiveLocationOne = {
    vehicle_id: "id_1",
    last_gps_fix: new Date(0),
    coordinates: [0, 0],
    service_name: "service_1",
    destination: "destination_!"
};

module.exports.sampleTimetableOne = {
    stop_id: "id_1",
    stop_name: "name_1",
    service_name: "service_name_1",
    time: "0:00",
    timestamp: new Date(0),
    destination: "destination_1",
    day: 0
};

module.exports.sampleUserOne = {
    username: "username_1",
    password: "password_1",
    hash: "hash_!"
};

module.exports.sampleFavouriteStop = {
    user_object_id: undefined,
    stop_id: 0,
    alt_name: "alt_name_1"
};