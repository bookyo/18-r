var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var RoleSchema = new mongoose.Schema({
        role: String,
        limitpost: Number,
        limitview: Number,
        isexam: {
          type: Boolean,
          default: true
        },
        canaddres: Boolean,
        postcounts: Number,
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

RoleSchema.pre('save', function(next) {
  if (this.isNew) {
    this.meta.createAt = this.meta.updateAt = Date.now();
  }
  else {
    this.meta.updateAt = Date.now();
  }

  next();
});

RoleSchema.statics = {
  fetch: function(cb) {
    return this
      .find({})
      .sort('-meta.updateAt')
      .exec(cb)
  },
  findById: function(id, cb) {
    return this
      .findOne({_id: id})
      .exec(cb)
  }
};

module.exports = RoleSchema;