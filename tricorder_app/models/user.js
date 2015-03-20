/**
 * Created by Manas on 15-03-2015.
 */

var mongoose = require('mongoose');

var UserSchema = new mongoose.Schema({
    username: String,
    hash: String
});

module.exports.User = mongoose.model("User", UserSchema);