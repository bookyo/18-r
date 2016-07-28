var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ResourceSchema = new mongoose.Schema({
  resource: [String],
  typeid: Number,
  //1:baiduyun  2:360yun 3:dianlv 4:cili
  creator: {type: Schema.Types.ObjectId, ref: 'user'},
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

ResourceSchema.pre('save', function(next) {
	if (this.isNew) {
		this.meta.createAt = this.meta.updateAt = Date.now();
	}
	else {
		this.meta.updateAt = Date.now();
	}

	next();
});

ResourceSchema.statics = {
	fetch: function(cb) {
		return this
		  .find({})
		  .populate('creator', 'name _id')
		  .sort('-meta.updateAt')
		  .exec(cb)
	},
	findById: function(id, cb) {
		return this
		  .findOne({_id: id})
		  .populate('creator','_id name')
		  .exec(cb)
	}
};

module.exports = ResourceSchema;