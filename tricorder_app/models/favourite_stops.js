/**
 * Created by Manas on 21-03-2015.
 */

var mongoose = require('mongoose');

var FavouriteStopSchema = new mongoose.Schema({
    user_object_id: {type: mongoose.Schema.Types.ObjectId, index: true},
    stop_id: {type: Number, index: true},
    alt_name: String
});

module.exports.FavouriteStop = mongoose.model("FavouriteStop", FavouriteStopSchema);