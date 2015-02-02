var mongoose = require('mongoose');

var StopSchema = new mongoose.Schema({
    stop_id: {type: Number, index: true},
    name: String,
    identifier: String,
    locality: String,
    orientation: Number,
    direction: String,
    coordinates : {type: [Number], index: '2d'},
    //latitude: Number,//I think this will work for floats
    //longitude: Number,
    destinations: { type: Array, "default": []},//Is this right?
    services: {type: Array, "default": []}//???
});

// PostSchema.methods.upvote = function(cb){
//     console.log('up title ' + this.title);
//     this.upvotes += 1;
//     this.save(cb);
// };

mongoose.model('Stop', StopSchema);
