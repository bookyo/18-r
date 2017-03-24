var Movie = require('../models/movie');
var Tag = require('../models/tag');
var redis = require("redis");
var client = redis.createClient();

exports.tagsByRedis = function(req, res, next) {
  getTagsFromRedis(function(err, tags) {
    if(err) return next(err);

    if(!tags) {
      getTagsFromMongo( function(err, tags) {
        if(err) return next(err);
        if(!tags) {
          return next(new Error('Tags not found'));
        }
        req.tags = tags;
        return next();
      });
    } else {
      req.tags = tags;
      return next();
    }
  });
}

function getTagsFromMongo(cb) {
	Tag
	  .find({})
	  .sort('-meta.updateAt')
	  .exec(function(err, tags) {
                if(tags) {
                  client.setex('tags', 3600,  JSON.stringify(tags));
                }
	  	return cb(err, tags);
	  });
}

function getTagsFromRedis(cb) {
  client.get('tags', function(err, tags) {
    if(err) return cb(err, null);
    try {
      tags = JSON.parse(tags);
    } catch(e) {
      return cb(e, null);
    }
    return cb(err, tags);
  });
}

exports.gettags= function(req,res) {
      res.render('tags', { 
        title: "电影分类页",
        user: req.session.user,
        tags: req.tags,
        error: req.flash('error'),
        success: req.flash('success').toString()
      });
  }

 exports.gettag = function(req, res) {
    var typeid = req.params.id;
    var perPage = 16;
    var page = req.query.page > 0 ? req.query.page : 1;
    Movie
      .find({types: typeid })
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
         var tagname;
         for(var i=0; i<req.tags.length;i++){
           if(req.tags[i]._id == typeid){
               tagname= req.tags[i].tag;
           }
         }
         Movie.find({types:typeid }).where({'review': 3}).count(function(err, count) {
           res.render('tag', { 
              title: tagname+'电影大全_下载,百度云网盘,bt磁力链接,电驴ED2K',
              tagname: tagname,
              page: page,
              pages: Math.ceil(count/perPage),
              user: req.session.user,
              tags: req.tags,
              hots: req.hots,
              error: req.flash('error'),
              movies: movies,
              success: req.flash('success').toString()
           });
         });
      });
   }