var mongoose = require('mongoose');

var TimetableSchema = new mongoose.Schema({
    stop_id: String,
    stop_name: String,
    service_name: String,
    time: String,
    timestamp: Number,//Should this be an index?
    destination: String,
    day: Number,
    note_id: String,
    valid_from: Number
});

//Compound index
TimetableSchema.index({stop_id: 1, service_name: 1});

mongoose.model('Timetable', TimetableSchema);
