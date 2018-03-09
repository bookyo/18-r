var Movie = require('../models/movie');
var Tag = require('../models/tag');
var Topic = require('../models/topic');
exports.index =  function(req, res, next) {
      var page = req.query.page > 0 ? req.query.page : 1;
      Movie.getMoviesByRedis(page, function(err, indexObj) {
        if(err) {
          console.log(err);
        }
        var perPage = 4;
        Topic
          .find()
          .select('topic _id movies creator summary')
          .populate('movies','title _id img')
          .limit(perPage)
          .skip(perPage * (page-1))
          .sort('-meta.updateAt')
          .exec(function(err, topics) {
            if(err) {
              console.log(err);
            }
            res.render('index', { 
              page: page,
              pages: indexObj.pages,
              user: req.session.user,
              tags: req.tags,
              hots: req.hots,
              topics: topics,
              movies: indexObj.movies,
              error: req.flash('error'),
              success: req.flash('success').toString()
            })

          })
        
      })
    
  }