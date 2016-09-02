var mongoose = require('mongoose');
var UserBuyMovieSchema = require('../schemas/userbuymovie');
var UserBuyMovie= mongoose.model('UserBuyMovie', UserBuyMovieSchema);

module.exports = UserBuyMovie;