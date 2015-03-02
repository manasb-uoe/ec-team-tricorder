var mongoose = require('mongoose');

//var TimetableSchema = new mongoose.Schema({
//    stop_id: String,
//    stop_name: String,
//    departures: {type: Array, "default": []}
//});

var TimetableSchema = new mongoose.Schema({
    stop_id: {type: String, index: true},
    stop_name: String,
    service_name: {type: String, index: true},
    time: String,
    timestamp: Number,//Should this be an index?
    destination: String,
    day: Number,
    note_id: String,
    valid_from: Number
});

mongoose.model('Timetable', TimetableSchema);
