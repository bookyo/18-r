var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var MovieSchema = new mongoose.Schema({
	title: String,
	doctor: String,
	country: String,
	year: { type: Number, min: 1900, max: 2020 },
	players: String,
	types: [{type: Schema.Types.ObjectId, ref: 'Tag'}],
	img: String,
	review: { type:Number, default: 3},
	summary: String,
	resources: [{type: Schema.Types.ObjectId, ref: 'Resource'}],
	pv: { type:Number, default: 0 },
	creator: { type: Schema.Types.ObjectId, ref: 'User'},
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
MovieSchema.pre('save', function(next) {
	if (this.isNew) {
		this.meta.createAt = this.meta.updateAt = Date.now();
	}
	else {
		this.meta.updateAt = Date.now();
	}

	next();
});

MovieSchema.statics = {
	fetch: function(cb) {
		return this
		  .find({})
		  .populate('types', 'tag _id')
		  .sort('-meta.updateAt')
		  .exec(cb)
	},
	findById: function(id, cb) {
		return this
		  .findOne({_id: id})
		  .populate('types','_id tag')
		  .populate('creator', '_id name avatar')
		  .exec(cb)
	}
};
MovieSchema.index({review: 1, "meta.updateAt": -1});
MovieSchema.index({types: 1, review: 1, "meta.updateAt": -1});
module.exports = MovieSchema;