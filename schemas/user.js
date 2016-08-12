var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var UserSchema  = new mongoose.Schema({
  email: String,
  password: String,
  name: String,
  signature: String,
  avatar: String,
  isadmin: { type: Boolean, default: false},
  postcounts: {
    type: Number,
    default: 0
  },
  role: { 
    type: Schema.Types.ObjectId, ref: 'Role'
  },
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
UserSchema.pre('save', function(next) {
  if (this.isNew) {
    this.meta.createAt = this.meta.updateAt = Date.now();
  }
  else {
    this.meta.updateAt = Date.now();
  }

  next();
});
UserSchema.statics = {
  fetch: function(cb) {
    return this
      .find({})
      .sort('-meta.updateAt')
      .exec(cb)
  },
  findById: function(id, cb) {
    return this
      .findOne({_id: id})
      .populate('role')
      .exec(cb)
  }
};

module.exports = UserSchema;
