var mongoose = require('mongoose');

var VehicleStatsSchema = new mongoose.Schema({
    date: String,
    timestamp: {type: Number, index: true},
    vehicle_id : {type: String, index: true},
    early_10_plus: Number,
    early_10: Number,
    early_9: Number,
    early_8: Number,
    early_7: Number,
    early_6: Number,
    early_5: Number,
    early_4: Number,
    early_3: Number,
    early_2: Number,
    on_time: Number,
    late_2: Number,
    late_3: Number,
    late_4: Number,
    late_5: Number,
    late_6: Number,
    late_7: Number,
    late_8: Number,
    late_9: Number,
    late_10: Number,
    late_10_plus: Number,
    total_count: Number

});

//It is necessary to define the index at schema level for a compound index
VehicleStatsSchema.index({date: 1, vehicle_id: 1}, {unique: true});
VehicleStatsSchema.index({timestamp: 1, vehicle_id: 1}, {unique: true});


module.exports.VehicleStat = mongoose.model('VehicleStat', VehicleStatsSchema);