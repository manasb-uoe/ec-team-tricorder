var mongoose = require('mongoose');

var TimetableSchema = new mongoose.Schema({
    stop_id: String,
    stop_name: String,
    service_name: String,
    time: String,
    timestamp: {type: Date, index: true},
    destination: String,
    day: Number
});

// Compound index
TimetableSchema.index({stop_id: 1, service_name: 1});

module.exports.Timetable = mongoose.model('Timetable', TimetableSchema);