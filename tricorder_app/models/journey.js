var mongoose = require('mongoose');

var JourneySchema = new mongoose.Schema({
    service_name: {type: String, index: true},
    journeys: {type: Array, "default": []}
});

module.exports.Journey = mongoose.model('Journey', JourneySchema);
