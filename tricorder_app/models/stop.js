var mongoose = require('mongoose');

var StopSchema = new mongoose.Schema({
    stop_id: {type: Number, index: true},
    name: String,
    identifier: String,
    locality: String,
    orientation: Number,
    direction: String,
    coordinates : {type: [Number], index: '2d'},
    destinations: { type: Array, "default": []},
    services: {type: Array, "default": []}
});

module.exports.Stop = mongoose.model('Stop', StopSchema);

