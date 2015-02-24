var mongoose = require('mongoose');

var ServiceStatusSchema = new mongoose.Schema({
    id: Number,
    type: String,
    category: String,
    summary: String,
    update: Number,
    services_affected: {type: Array, "default": []},
    web_link: String
});

module.exports.ServiceStatus = mongoose.model('ServiceStatus', ServiceStatusSchema);
