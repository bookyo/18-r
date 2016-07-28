var mongoose = require('mongoose');
var ResourceSchema = require('../schemas/resource');
var Resource = mongoose.model('Resource', ResourceSchema);

module.exports = Resource;