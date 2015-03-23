var mongoose = require('mongoose');

var StopStatsSchema = new mongoose.Schema({
    date: String,
    stop_id: Number,
    early_5_plus: Number,
    early_4: Number,
    early_3: Number,
    early_2: Number,
    on_time: Number,
    late_2: Number,
    late_3: Number,
    late_4: Number,
    late_5_plus: Number,
    total_count: Number,
    modified: {type: Boolean, index: true}

});

//It is necessary to define the index at schema level for a compound index
StopStatsSchema.index({date: 1, vehicle_id: 1}, {unique: true});

module.exports.StopStat = mongoose.model('StopStat', StopStatsSchema);
