var Movie = require('../models/movie');
var User = require('../models/user');
var Tag = require('../models/tag');
var Resource = require('../models/resource');
var adminController = require('./admin');
var xss = require('xss');
var async = require('async');
var moment = require('moment');
var sharp = require('sharp');
var redis = require("redis");
var client = redis.createClient();

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
    var movie = new Movie(movieObj);
    movie.save(function(err, movie) {
      if(err) {
        console.log(err);
      }
      var resources = req.body.resources;
      var movieid = movie._id;
      var resources_id = [];
      if( Array.isArray( resources) ){
        
        for(var i=0; i<resources.length;i++){
            var resource = resources[i];
            var typeid = checkResTypeId(resource);
            if(typeid) {
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
           else {
              req.flash('error', {'msg': '输入的资源类型有误或者有一行为空！'});
              return res.redirect('/post');
           }
        }
         
      }
      else{
        var resource = resources;
        var typeid = checkResTypeId(resources);
        if(typeid) {
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
        }else{
          req.flash('error', {'msg': '输入资源类型有误！'});
          return res.redirect('/post');
        }
      }
      Movie.findById(movie._id, function(err, themovie) {
          for(var i =0; i< resources_id.length; i++){
             themovie.resources.push(resources_id[i]);
          }
          if(req.session.user.role.isexam) {
            themovie.review = 1;
          }
          themovie.save(function(err) {
            if(err) {
              console.log(err);
            }
            if(!req.session.user.role.isexam){
            User.findOne({_id: req.session.user._id})
                    .exec(function(err, user) {
                      user.postcounts = user.postcounts + 1;
                      var role = adminController.checkRole(user.postcounts, req.roles);
                      user.role = role;
                      user.save(function(err, user) {
                        if(err) {
                          console.log(err);
                        }
                      });
                    });
                res.redirect('/movie/'+movie._id);
            }else{
              req.flash('success', '新人！您的帖子进入审核区，审核通过即可成为正式会员，享受特权！');

              res.redirect('/');
            }
          });
      });
      
    });
}

exports.getMovie = function(req, res) {
    var id =  req.params.id;
    async.parallel({
      tags: function(callback) {
           callback(null, req.tags);
      },
      movie: function(callback) {
          Movie.findByIdAndUpdate(id, {$inc: {pv: 1}})
                      .populate('types','_id tag')
                      .populate('creator', '_id name avatar')
                      .populate('resources')
                      .exec(function(err,movie) {
                        if(err) console.log(err);
                         callback(null,movie);
                      });
      }
      },
        function(err, results) {
          var title = results.movie.title + '_迅雷下载,百度云,360云,电驴,磁力链接'
          var pubdate = moment(results.movie.meta.createAt).format('YYYY-MM-DD HH:mm:ss');
          var tags = results.tags;
          var movie = results.movie;
          res.render('article', {
              title: title,
              user: req.session.user,
              pubdate: pubdate,
              tags: tags,
              movie: movie,
              error: req.flash('error'),
              success: req.flash('success').toString()
          });
        }
      );
}

exports.new = function(req, res) {
    res.render('post', {
      title: '发布电影',
      tags: req.tags,
      user: req.session.user,
      success: req.flash('success').toString(),
      error: req.flash('error')
    });
  }

  exports.delete = function(req, res) {
    var id = req.query.id;

    if(id) {
      Movie.remove({_id: id}, function(err, movie){
        if(err){
          console.log(err);
          res.json({success: 0});
        }else {
          req.flash('error', {'msg':'成功删除页面！'});
          res.json({success: 1});
        }
      });
    }
  }

  exports.getupdate = function(req, res) {
    var id = req.params.id;
    Movie.findOne({_id: id})
                .exec( function(err, movie) {
                  res.render('update', {
                    title: '编辑' + movie.title,
                    movie: movie,
                    tags: req.tags,
                    error: req.flash('error'),
                    success: req.flash('success').toString(),
                    user: req.session.user
                  });
                });
  }
  exports.postupdate = function(req, res) {
    var id = req.params.id;
    var title = req.body.title;
    var doctor = req.body.doctor;
    var players = req.body.players;
    var country = req.body.country;
    var year = req.body.year;
    var types =  req.body.types;
    var img;
    console.log(req.body);
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
      }

    });
    var errors = req.validationErrors();
    if (errors) {
      req.flash('error', errors);
      return res.redirect('back');
    };
    if(req.file === undefined) {
      img = req.body.eimg;
    }else{
      sharp(req.file.path)
        .resize(400,400)
        .quality(70)
        .toFile(req.file.destination + '/400/' + req.file.filename , function(err) {
          if(err) throw err;
        });
        img = req.file.filename;
    }
    var summary = req.body.summary;
    var htmlsummary = xss(summary, {
      whiteList: [],
      stripIgnoreTag: true,
      stripIgnoreTagBody: ['script']
    });
    Movie.findOne({_id: id})
                .exec(function(err, movie){
                  movie.title = title;
                  movie.doctor = doctor;
                  movie.players = players;
                  movie.country = country;
                  movie.year = year;
                  movie.types = types;
                  movie.img = img;
                  movie.summary = htmlsummary;
                  movie.save(function(err, movie) {
                    if(err) {
                      console.log(err);
                    }
                    res.redirect('/movie/' + id);
                  });
                });
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