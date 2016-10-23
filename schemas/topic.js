var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var TopicSchema = new mongoose.Schema({
        topic: String,
        summary: String,
        movies: [{type: Schema.Types.ObjectId, ref: 'Movie'}],
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

TopicSchema.pre('save', function(next) {
  if (this.isNew) {
    this.meta.createAt = this.meta.updateAt = Date.now();
  }
  else {
    this.meta.updateAt = Date.now();
  }

  next();
});

module.exports = TopicSchema;