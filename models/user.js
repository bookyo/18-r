var mongoose = require('mongoose');
var UserSchema = require('../schemas/user');
var User = mongoose.model('User', UserSchema);
var redis = require('redis');
var client = redis.createClient();

User.getRanksByRedis = function(cb) {
    getRanksFromRedis(function(err, ranks) {
      if(err) {
        console.log(err);
      }
      if(!ranks) {
        getRanksFromMongo(function(err, ranks) {
          if(err) {
            console.log(err)
          }
          if(!ranks) {
            return false;
          }
          return cb(null, ranks);
        })
      } else {
        return cb(null, ranks);
      }
    })
}
function getRanksFromMongo(cb) {
  User.where('postcounts').gt(13)
             .limit(100)
             .sort('-postcounts')
             .populate('role', 'role')
             .select('_id name signature postcounts avatar role')
             .exec(function(err, ranks) {
                if(err) {
                  console.log(err)
                }
                if(ranks) {
                  client.setex('ranks', 7200, JSON.stringify(ranks))
                }
                return cb(err, ranks)
               })
}

function getRanksFromRedis(cb) {
  client.get('ranks', function(err, ranks) {
    if(err) {
      console.log(err);
    }
    try {
      ranks = JSON.parse(ranks);
    } catch(e) {
      return cb(e, null)
    }
    return cb(err, ranks);
  })
}
module.exports = User;