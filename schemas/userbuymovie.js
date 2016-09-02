var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var UserBuyMovieSchema = new Schema({
  movieid: {type: Schema.Types.ObjectId, index: true},
  userid: Schema.Types.ObjectId,
  createAt: {type: Date, default: Date.now()}
});
module.exports = UserBuyMovieSchema;