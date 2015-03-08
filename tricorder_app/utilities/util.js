/**
 * Created by Manas on 07-03-2015.
 */

module.exports.raise404 = function(next) {
    var err = new Error();
    err.status = 404;
    err.message = "Not Found";
    next(err);
};