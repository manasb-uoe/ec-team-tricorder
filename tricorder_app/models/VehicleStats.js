var mongoose = require('mongoose');

var VehicleStatsSchema = new mongoose.Schema({
    vehicle_id : {type: Number, index: true},
    times_late: {type: Number, index: true},
    times_early: {type: Number, index: true},
    total_count: Number

});

mongoose.model('VehicleStats', JourneySchema);
