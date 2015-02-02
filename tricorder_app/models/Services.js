var mongoose = require('mongoose');

var ServiceSchema = new mongoose.Schema({
    name: {type: String, index: true},
    description: String,
    service_type: String,
    routes: {type: Array, "default": []}//good enough?
});

mongoose.model('Service', ServiceSchema);
