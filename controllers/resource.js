var Movie = require('../models/movie');
var UserBuyMovie = require('../models/userbuymovie');
var Resource = require('../models/resource');
var adminController = require('./admin');
var async = require('async');
exports.getadd =  function(req,res) {
    var movieid = req.params.id;
    Movie.findOne({_id: movieid})
                .select('_id title')
                .exec(function(err, movie) {
                  res.render('add_resource', {
                    user: req.session.user,
                    success: req.flash('success').toString(),
                    error: req.flash('error'),
                    movie: movie 
                  }); 
                });
  }

 exports.postadd = function(req, res) {
 	var movieid= req.params.id;
        var postres = req.body.resources;
        var resources = [];
        var resourcesid = [];
        if( Array.isArray(postres)) {
          for(var i=0; i<postres.length; i++) {
            resources.push(postres[i]);
          }
        } else{
          resources.push(postres);
        }
        for(var i=0; i<resources.length;i++) {
          var typeid = checkResTypeId(resources[i]);
          var resourceObj = {
            resource: resources[i],
            tomovie: movieid,
            creator: req.session.user,
            typeid: typeid
          }
          if (typeid) {
            var resource = new Resource(resourceObj);
            resource.save(function(err, resource) {
              Movie.findOne({_id: movieid})
                          .exec(function(err, movie) {
                           movie.resources.push(resource);
                            movie.save(function(err, movie) {
                              if(err) {
                                console.log(err);
                              }
                              adminController.addCounts(movie.creator, 1, req.roles);
                            });
                          });
            });
          } else {
            req.flash('error', {'msg': '输入的资源类型有误,本站只支持百度云，360云，磁力和电驴'});
            return res.redirect('back');
          }

        }
        res.redirect('/movie/'+movieid);

 }

 exports.buymovie = function(req, res) {
  var id = req.body.id;
  if(id) {
     var usermovieobj = {
        movieid: id,
        userid: req.session.user._id
     }
     var userbuymovie = new UserBuyMovie(usermovieobj);
     userbuymovie.save(function(err, obj) {
      if(err) {
        console.log(err);
       }
        res.redirect('/movie/'+id);
     });
  }
 }

 function checkResTypeId( resource) {
    if( /pan.baidu.com\/s\/[\s\S]{8}/i.test(resource)){
          return 1;
        }else if(/magnet:\?xt=urn:btih:[\s\S]{40}/.test(resource)){
          return 2;
        }else if(/^ed2k:\/\/\|file\|(.*)\|\/$/.test(resource)){
          return 3;
        }else if(/yunpan.cn\/[\s\S]{13}/i.test(resource)){
          return 4;
        }else{
          return false;
        }
  }