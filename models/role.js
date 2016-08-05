var mongoose = require('mongoose');
var RoleSchema = require('../schemas/role');
var Role = mongoose.model('Role', RoleSchema );

module.exports = Role;