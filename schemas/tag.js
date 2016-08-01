var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var TagSchema = new mongoose.Schema({
	tag: String,
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

TagSchema.pre('save', function(next) {
  if (this.isNew) {
    this.meta.createAt = this.meta.updateAt = Date.now();
  }
  else {
    this.meta.updateAt = Date.now();
  }

  next();
});

TagSchema.statics = {
  fetch: function(cb) {
    return this
      .find({})
      .sort('-meta.updateAt')
      .exec(cb)
  },
  findById: function(id, cb) {
    return this
      .findOne({_id: id})
      .populate('movies')
      .exec(cb)
  }
};

module.exports = TagSchema;