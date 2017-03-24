var Movie = require('../models/movie');
var Tag = require('../models/tag');
exports.index =  function(req, res, next) {
      var page = req.query.page > 0 ? req.query.page : 1;
      Movie.getMoviesByRedis(page, function(err, indexObj) {
        if(err) {
          console.log(err);
        }
        res.render('index', { 
          title: "BT老司机_老司机们的电影分享社群",
          page: page,
          pages: indexObj.pages,
          user: req.session.user,
          tags: req.tags,
          hots: req.hots,
          movies: indexObj.movies,
          error: req.flash('error'),
          success: req.flash('success').toString()
        })
      })
    
  }