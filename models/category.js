var mongoose = require('mongoose');
var CategorySchema = require('../schemas/category');
var Category = mongoose.model('Category', CategorySchema);
var redis = require('redis');
var client = redis.createClient();

Category.getCategoriesByRedis = function(cb) {
    getCategoriesFromRedis(function(err, categories) {
      if(err) {
        console.log(err);
      }
      if(!categories) {
        getCategoriesFromMongo(function(err, categories) {
          if(err) {
            console.log(err)
          }
          if(!categories) {
            return false;
          }
          return cb(null, categories);
        })
      } else {
        return cb(null, categories);
      }
    })
}
function getCategoriesFromMongo(cb) {
  Category.find()
                 .sort('class')
                 .exec(function(err, categories) {
                  if(err) {
                    return cb(err, null);
                  }
                  if(categories) {
                    client.setex('categories', 7200, JSON.stringify(categories));
                  }
                  return cb(null, categories);
                 })
}

function getCategoriesFromRedis(cb) {
  client.get('categories', function(err, categories) {
    if(err) {
      console.log(err);
    }
    try {
      categories = JSON.parse(categories);
    } catch(e) {
      return cb(e, null)
    }
    return cb(err, categories);
  })
}
module.exports = Category;