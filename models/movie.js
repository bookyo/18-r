var mongoose = require('mongoose');
var MovieSchema = require('../schemas/movie');
var Movie = mongoose.model('Movie', MovieSchema);
var redis = require('redis')
var client = redis.createClient();
Movie.getMoviesByRedis = function(page, cb) {
    getMoviesFromRedis(page, function(err, movies) {
      if(err) {
        console.log(err);
      }
      if(!movies) {
        getMoviesFromMongo(page, function(err, movies) {
          if(err) {
            console.log(err)
          }
          if(!movies) {
            return false;
          }
          return cb(null, movies);
        })
      } else {
        return cb(null, movies);
      }
    })
}
function getMoviesFromMongo(page, cb) {
  var perPage = 16;
  var page = page;
  Movie
    .find()
    .where({'review': 3})
    .select('title _id doctor players types img')
    .populate('types', '_id tag')
    .limit(perPage)
    .skip(perPage * (page-1))
    .sort('-meta.updateAt')
    .exec( function(err, movies) {
       if(err) {
         console.log(err);
       }
       Movie.find()
                   .where({'review': 3})
                   .count(function(err, count) {
                     if(err) {
                       console.log(err);
                     }
                     var pages = Math.ceil(count/perPage);
                     var indexObj = {};
                     indexObj.movies = movies;
                     indexObj.pages = pages;
                     if(movies && page < 21) {
                       client.setex('index:'+page, 600, JSON.stringify(indexObj))
                     }
                     return cb(err, indexObj)
                    })
                 })
  }



function getMoviesFromRedis(page, cb) {
  var page = page;
  client.get('index:'+page, function(err, indexObj) {
    if(err) {
      console.log(err);
    }
    try {
      indexObj = JSON.parse(indexObj);
    } catch(e) {
      return cb(e, null)
    }
    return cb(err, indexObj);
  })
}
module.exports = Movie;