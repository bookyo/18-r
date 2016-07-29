var Movie = require('../models/movie');
var User = require('../models/user');
var Tag = require('../models/tag');
var Resource = require('../models/resource');
var xss = require('xss');
var sharp = require('sharp');

exports.post = function(req, res) {

    req.checkBody({
      'title': {
        notEmpty: true,
        errorMessage: '请填写正确的名称'
      },
      'doctor': {
        notEmpty: true,
        errorMessage: '请输入正确的导演信息'
      },
      'players': {
        notEmpty: true,
        errorMessage: '请输入正确的主演信息'
      },
      'country': {
        notEmpty: true,
        errorMessage: '请输入正确的发行国家'
      },
      'year': {
        notEmpty: true,
        isInt: {
          options: [{ min: 1900, max: 2020 }]
        },
        errorMessage: '请输入正确的上映年份'
      },
      'types': {
        notEmpty: true,
        errorMessage: '请选择正确的电影类型'
      },
      'summary': {
        notEmpty: true,
        errorMessage: '请输入正确的剧情简介'
      },
      'resources': {
        notEmpty: true,
        errorMessage: '请务必输入下载资源'
      }

    });
    console.log(req.body);
    var errors = req.validationErrors();
    if (errors) {
      req.flash('error', errors);
      return res.redirect('/post');
    };
    if(req.file === undefined) {
      req.flash('error', {'msg': '请上传正确的海报！'});
      return res.redirect('/post');
    };
    sharp(req.file.path)
      .resize(400,400)
      .quality(70)
      .toFile(req.file.destination + '/400/' + req.file.filename , function(err) {
        if(err) throw err;
      });
    var summary = req.body.summary;
    var htmlsummary = xss(summary, {
      whiteList: [],
      stripIgnoreTag: true,
      stripIgnoreTagBody: ['script']
    });
    var user= req.session.user;
    var movieObj = {
      title: req.body.title,
      doctor: req.body.doctor,
      players: req.body.players,
      country: req.body.country,
      year: req.body.year,
      types: req.body.types,
      summary: htmlsummary,
      img: req.file.filename,
      creator: user._id
    };
    var types = req.body.types;
    var movie = new Movie(movieObj);
    movie.save(function(err, movie) {
      if(err) {
        console.log(err);
      }
      var resources = req.body.resources;
      var movieid = movie._id;
      var resources_id = [];
      if( Array.isArray( resources) ){
        for(var i = 0; i<resources.length;i++) {
            if(resources[i] == "" || typeof(resources[i]) == 'undefined')
            {
              resources.aplice(i,1);
              i= i-1;
            }
        }
        for(var i=0; i<resources.length;i++){
            var resource = resources[i];
            var typeid = checkResTypeId(resource);
            var resourceObj = {
              resource: resource,
              typeid: typeid,
              tomovie: movieid,
              creator: user._id

            }
            var resource = new Resource(resourceObj);
            resource.save(function(err, resource) {
              resources_id.push(resource._id);
            });
        }
         
      }
      else{
        var resource = resources;
        var typeid = checkResTypeId(resources);
        var resourceObj = {
          resource: resource,
          typeid: typeid,
          tomovie: movieid,
          creator: user._id
        }
        var resource = new Resource(resourceObj);
        resource.save( function(err, resource) {
          resources_id.push(resource._id);
        });
      }
      User.findById(user._id, function(err, user) {
        user.movies.push(movie);
        for(var i =0; i< resources_id.length; i++){
        user.resources.push(resources_id[i]);
        }
        user.save(function(err){
          if(err) {
            console.log(err);
          }
        });
      });
      Movie.findById(movie._id, function(err, themovie) {
          for(var i =0; i< resources_id.length; i++){
             themovie.resources.push(resources_id[i]);
          }
          themovie.save(function(err) {
            if(err) {
              console.log(err);
            }
            for(var i=0;i<types.length; i++){
            	Tag.findById(types[i], function(err, tag) {
                   tag.movies.push(themovie);
                   tag.save(function(err) {
                      if(err) {
                      	console.log(err);
                      }
                   });
            	});
            }
          });
      });
      res.redirect('/movie/'+movie._id);
    });
}

function checkResTypeId( resource) {
    if( /pan.baidu.com\/s\/[\s\S]{8}/i.test(resource)){
          return 1;
        }else if(/magnet:\?xt=urn:btih:[\s\S]{40}/.test(resource)){
          return 2;
        }else if(/ed2k:\/\/\|file\|/.test(resource)){
          return 3;
        }else if(/yunpan.cn\/[\s\S]{13}/i.test(resource)){
          return 4;
        }else{
          return false;
        }
  }