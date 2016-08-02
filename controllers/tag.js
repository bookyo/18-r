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
                  client.set('tags', JSON.stringify(tags));
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
      Movie.find({types: typeid })
                  .sort('-meta.updateAt')
                  .populate('types', 'tag _id')
                  .exec(function(err, movies){
                    if(err) {
                      console.log(err);
                    }
                    var tagname;
                    for(var i=0; i<req.tags.length;i++){
                      if(req.tags[i]._id == typeid){
                          tagname= req.tags[i].tag;
                      }
                    }
                    res.render('tag', {
                      title: tagname+'电影大全_迅雷下载,百度云,电驴,磁力链接,种子',
                      tagname: tagname,
                      user: req.session.user,
                      tags: req.tags,
                      error: req.flash('error'),
                      movies: movies,
                      success: req.flash('success').toString()
                    });
                  });
    
   }