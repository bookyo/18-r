var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var UserBuyMovieSchema = new Schema({
  movieid: {type: Schema.Types.ObjectId, index: true},
  userid: Schema.Types.ObjectId,
  createAt: {type: Date, default: Date.now()}
});
UserBuyMovieSchema.index({movieid: 1, userid: 1});
module.exports = UserBuyMovieSchema;