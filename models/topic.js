var mongoose = require('mongoose');
var TopicSchema = require('../schemas/topic');
var Topic = mongoose.model('Topic', TopicSchema);

module.exports = Topic;