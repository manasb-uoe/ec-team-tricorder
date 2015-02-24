var mongoose = require('mongoose');

var LiveLocationSchema = new mongoose.Schema({
    vehicle_id: {type: String, index: true},
    last_gps_fix: {type: Number, index: true},
    time: {type: String, index: true},
    coordinates: {type: [Number], index: '2d'},
    speed: Number,
    heading: Number,
    service_name: {type: String, index: true},
    destination: {type: String, index: true}
});

module.exports.LiveLocation = mongoose.model('LiveLocation', LiveLocationSchema);