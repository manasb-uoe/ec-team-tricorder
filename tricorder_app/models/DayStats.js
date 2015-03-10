var mongoose = require('mongoose');

var DayStatsSchema = new mongoose.Schema({
    vehicleStats: [VehicleStatsSchema],


});

mongoose.model('VehicleStat', VehicleStatsSchema);