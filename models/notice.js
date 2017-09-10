var mongoose = require('mongoose');
var NoticeSchema = require('../schemas/notice');
var Notice = mongoose.model('Notice', NoticeSchema);
var redis = require('redis');
var client = redis.createClient();

Notice.getNoticesByRedis = function(cb) {
    getNoticesFromRedis(function(err, notices) {
      if(err) {
        console.log(err);
      }
      if(!notices) {
        getNoticesFromMongo(function(err, notices) {
          if(err) {
            console.log(err)
          }
          if(!notices) {
            return false;
          }
          return cb(null, notices);
        })
      } else {
        return cb(null, notices);
      }
    })
}
function getNoticesFromMongo(cb) {
  Notice.find()
               .limit(3)
               .sort('-meta.updateAt')
               .exec(function(err, notices) {
                if(err) {
                  console.log(err)
                }
                if(notices) {
                  client.setex('notices', 7200, JSON.stringify(notices))
                }
                return cb(err, notices)
               })
}

function getNoticesFromRedis(cb) {
  client.get('notices', function(err, notices) {
    if(err) {
      console.log(err);
    }
    try {
      notices = JSON.parse(notices);
    } catch(e) {
      return cb(e, null)
    }
    return cb(err, notices);
  })
}
module.exports = Notice;