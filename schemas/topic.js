var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var TopicSchema = new mongoose.Schema({
        topic: String,
        summary: String,
        movies: [{type: Schema.Types.ObjectId, ref: 'Movie'}],
        creator: {type: Schema.Types.ObjectId, ref: 'User'},
        pv: { type:Number, default: 0 },
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

TopicSchema.pre('save', function(next) {
  if (this.isNew) {
    this.meta.createAt = this.meta.updateAt = Date.now();
  }
  else {
    this.meta.updateAt = Date.now();
  }

  next();
});
TopicSchema.index({movies: 1});
TopicSchema.index({creator: 1});
TopicSchema.index({"meta.updateAt": -1});
module.exports = TopicSchema;