var mongoose = require('mongoose');

var TimetableSchema = new mongoose.Schema({
    stop_id: String,
    stop_name: String,
    departures: {type: Array, "default": []}
});

module.exports.Timetable = mongoose.model('Timetable', TimetableSchema);