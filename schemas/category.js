var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var CategorySchema = new Schema({
  class: String,
  name: String,
  operator: String,
  condition: String
});
module.exports = CategorySchema;