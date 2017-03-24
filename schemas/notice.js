var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var NoticeSchema = new Schema({
  title: String,
  content: String,
  creator: {type: Schema.Types.ObjectId, ref: 'User'},
  meta: {
    createAt: {
      type:Date,
      default: Date.now()
    },
    updateAt: {
      type: Date,
      default: Date.now()
    }
  }
});
NoticeSchema.pre('save', function(next) {
  if (this.isNew) {
    this.meta.createAt = this.meta.updateAt = Date.now();
  }
  else {
    this.meta.updateAt = Date.now();
  }

  next();
});


module.exports = NoticeSchema;