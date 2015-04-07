var mongoose = require('mongoose');

var LiveLocationSchema = new mongoose.Schema({
    vehicle_id: {type: String, index: {unique: true}},
    last_gps_fix: {type: Date, index: true},
    coordinates: {type: [Number], index: '2d'},
    service_name: {type: String, index: true},
    destination: {type: String, index: true}
});

module.exports.LiveLocation = mongoose.model('LiveLocation', LiveLocationSchema);