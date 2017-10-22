var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ImageSchema = new mongoose.Schema({
  img: String,
  originalimg: String,
  tomovie: {type:Schema.Types.ObjectId, ref: 'Movie'},
  creator: {type: Schema.Types.ObjectId, ref: 'User'},
  meta: {
		createAt: {
			type: Date,
			default: Date.now()
		},
		updateAt: {
			type: Date,
			default: Date.now()
		}
	}

});

ImageSchema.pre('save', function(next) {
	if (this.isNew) {
		this.meta.createAt = this.meta.updateAt = Date.now();
	}
	else {
		this.meta.updateAt = Date.now();
	}

	next();
});
ImageSchema.index({tomovie: 1, "meta.updateAt": -1});
module.exports = ImageSchema;