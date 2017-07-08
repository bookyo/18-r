var redis = require("redis");
var xss = require('xss');
var client = redis.createClient();
var Topic = require('../models/topic');
var Movie = require('../models/movie');
var xss = require('xss');
var moment = require('moment');
var _ = require("underscore");
var redis = require("redis");
var client = redis.createClient();

exports.getTopics = function(req, res) {
  var perPage = 9;
  var page = req.query.page > 0 ? req.query.page : 1;
  Topic
    .find()
    .select('topic _id movies creator summary')
    .populate('movies','title _id img')
    .limit(perPage)
    .skip(perPage * (page-1))
    .sort('-meta.updateAt')
    .exec( function(err, topics) {
      if(err) {
        console.log(err);
      }
      Topic.find()
                 .count(function(err, count) {
                   if(err) {
                    console.log(err);
                   }
                   res.render('topics', {
                     user: req.session.user,
                     hottopics: req.topics,
                     error: req.flash('error'),
                     success: req.flash('success').toString(),
                     topics: topics,
                     page: page,
                     pages: Math.ceil(count/perPage)
                   });
                 })
      
    });
}

exports.getNew = function(req, res) {
  res.render( 'topic_new', {
    user: req.session.user,
    error: req.flash('error'),
    success: req.flash('success').toString()
  });
}

exports.postNew = function(req, res) {
  var movies = [].concat(req.body.movies);
  var topic = req.sanitize('topic').trim();
  var summary = req.sanitize('summary').trim();
  req.checkBody({
    'topic': {
      notEmpty: true,
      isLength: {
        options:[{ min:5, max:20}],
        errorMessage: '请输入5到20字之间主题标题'
      },
      errorMessage: '主题标题不能为空'
    },
    'summary': {
      notEmpty: true,
      isLength: {
        options:  [{ min: 10 }],
        errorMessage: '主题简介必须在10字以上'
      },
      errorMessage: '请填写主题简介'
    },
    'movies': {
      notEmpty: true,
      errorMessage: '请添加电影'
    }
    
  });
  var errors = req.validationErrors();
  if (errors) {
    req.flash('error', errors);
    return res.redirect('/topic/new');
  };
  if(movies.length < 3) {
    req.flash('error', { 'msg': '开始至少添加3部电影'});
    return res.redirect('/topic/new');
  };
  topic = xss(topic);
  summary = xss(summary);
  var topicObj = {
    topic: topic,
    summary: summary,
    movies: movies,
    creator: req.session.user
  }
  var newtopic = new Topic(topicObj);
  newtopic.save(function(err, topic) {
    if(err) {
      console.log(err);
    }
    req.flash('success','发布电影主题成功');
    res.redirect('/topic/' + topic._id);
  });
}
exports.editTopic = function(req, res) {
  var id = req.params.id;
  Topic.findOne({_id: id})
             .exec(function(err, topic) {
              if(err) {
                console.log(err);
              }
              if(req.session.user.isadmin || (topic.creator == req.session.user._id)) {
                res.render('topic_edit', {
                  user: req.session.user,
                  error: req.flash('error'),
                  topic:topic,
                  success: req.flash('success').toString()
                });
              }
              else {
                req.flash('error', {'msg': '对不起，你没有权限修改！'});
                return res.redirect('/topic/' + id);
              }
             });
}
exports.updateTopic = function(req, res) {
  var id = req.params.id;
  var topic = req.sanitize('topic').trim();
  var summary = req.sanitize('summary').trim();
  req.checkBody({
    'topic': {
      notEmpty: true,
      isLength: {
        options:[{ min:5, max:20}],
        errorMessage: '请输入5到20字之间主题标题'
      },
      errorMessage: '主题标题不能为空'
    },
    'summary': {
      notEmpty: true,
      isLength: {
        options:  [{ min: 10 }],
        errorMessage: '主题简介必须在10字以上'
      },
      errorMessage: '请填写主题简介'
    }
    
  });
  var errors = req.validationErrors();
  if (errors) {
    req.flash('error', errors);
    return res.redirect('/topic/'+ id + '/update');
  };
  newtopic = xss(topic);
  summary = xss(summary);
  Topic.findOne({_id: id})
             .exec(function(err, topic) {
              if(!req.session.user.isadmin) {
                if(topic.creator != req.session.user._id) {
                  req.flash('error', {'msg': '对不起，您没有权限修改！'});
                  return res.redirect('/topic/' + id);
                }
              }
               topic.topic = newtopic;
               topic.summary = summary;
               topic.save(function(err) {
                if(err) {
                  console.log(err);
                }
                req.flash('success', '更新电影主题成功');
                res.redirect('/topic/' + topic._id);
               });
             });
}
exports.getTopic = function(req, res) {
  var id = req.params.id;
  Topic.findByIdAndUpdate(id,{$inc:{pv: 1}})
             .populate('creator','_id name avatar')
             .exec(function(err, topic) {
                if(err) {
                  console.log(err);
                }
                var pubdate = moment(topic.meta.createAt).format('YYYY-MM-DD HH:mm:ss');
                var perPage = 10;
                var page = req.query.page > 0 ? req.query.page : 1;
                Movie.find({_id: { $in: topic.movies }})
                            .limit(perPage)
                            .populate('types','_id tag')
                            .skip(perPage * (page-1))
                            .sort('-meta.updateAt')
                            .exec(function(err, movies){
                              if(err) {
                                console.log(err);
                              }
                              Movie.find({_id: { $in: topic.movies}})
                                          .count(function(err, count) {
                                            if(err) {
                                              console.log(err);
                                            }
                                            res.render('topic', {
                                              topic:topic,
                                              hottopics: req.topics,
                                              movies: movies,
                                              page: page,
                                              pages: Math.ceil(count/perPage),
                                              user: req.session.user,
                                              pubdate: pubdate,
                                              error: req.flash('error'),
                                              success: req.flash('success').toString()
                                            });
                                          })
                              
                            });
                
             });
}

exports.delete = function(req, res) {
  var id = req.query.id;

  if(id) {
    Topic.remove({_id: id}, function(err) {
      if(err) {
        console.log(err);
      }
      req.flash('error', {'msg': '删除主题成功！'});
      res.json({success : 1});
    });
  }
}

exports.delmovie = function(req, res) {
  var movieid = req.query.movieid;
  var topicid = req.query.topicid;
  
  if(movieid && topicid) {
    Topic.findOne({_id: topicid})
               .exec(function(err, topic) {
                if(err) {
                  console.log(err);
                }
                if(topic.creator != req.session.user._id) {
                  req.flash('error', {'msg': '对不起，您没有权限修改！'});
                  return res.json({'success': 0});
                }
                var index = topic.movies.indexOf(movieid);
                if(index>-1) {
                  topic.movies.splice(index, 1);
                  topic.save(function(err) {
                    if(err){
                      console.log(err);
                    }
                    req.flash('error', {'msg': '删除电影完成！'});
                    res.json({'success': 1});
                  })
                }
               });
  }
}

exports.addmovie = function(req, res) {
  var movieid = req.body.movieid;
  var topicid = req.body.topicid;
  if(movieid && topicid) {
    Topic.findOne({_id: topicid})
               .exec(function(err, topic) {
                if(err) {
                  console.log(err);
                }
                if(topic.creator != req.session.user._id) {
                  req.flash('error', {'msg': '对不起，您没有权限修改！'});
                  return res.json({'success': 0});
                }
                var index = topic.movies.indexOf(movieid);
                if(index>-1) {
                  req.flash('error', {'msg': '此电影已经存在！'});
                  return res.json({'success': 0});
                }
                topic.movies.push(movieid);
                topic.save(function(err,topic) {
                  if(err) {
                    console.log(err);
                  }
                  req.flash('success', '添加电影到专题成功！');
                  res.json({'success': 1});
                })
               })
  }
}

exports.addmoviebyid = function(req, res) {
  var id = req.params.id;
  Topic.findOne({_id: id})
           .exec(function(err, topic) {
            if(err) {
              console.log(err);
            }
            if(req.session.user.isadmin || (topic.creator == req.session.user._id)) {
                res.render('topic_add', {
                  user: req.session.user,
                  error: req.flash('error'),
                  topic:topic,
                  success: req.flash('success').toString()
                });
              }
              else {
                req.flash('error', {'msg': '对不起，你没有权限添加！'});
                return res.redirect('/topic/' + id);
              }
           })
}

exports.postaddmovie = function(req, res) {
  var id = req.params.id;
  var newmovies = req.body.newmovies;
  newmovies = newmovies.split(",");
  Topic.findOne({_id: id})
           .exec(function(err, topic) {
              if(err) {
                console.log(err);
              }
              movies = topic.movies.join(',');
              movies = movies.split(',');
              newmovies = _.difference(newmovies, movies);
              if(newmovies.length == 0) {
                req.flash('error', {'msg': '对不起，你没有添加电影！'});
                return res.redirect('/topic/' + id + '/addmovie');
              }
              newmovies = movies.concat(newmovies);
              topic.movies = newmovies;
              topic.save(function(err,topic) {
                  if(err) {
                    console.log(err);
                  }
                  req.flash('success', '添加电影成功');
                  return res.redirect('/topic/'+ id);
               })
           })
}

exports.topicsByRedis = function(req, res, next) {
  getTopicsFromRedis(function(err, topics) {
    if(err) return next(err);

    if(!topics) {
      getTopicsFromMongo( function(err, topics) {
        if(err) return next(err);
        if(!topics) {
          return next(new Error('Topics not found'));
        }
        req.topics = topics;
        return next();
      });
    } else {
      req.topics = topics;
      return next();
    }
  });
}

function getTopicsFromMongo(cb) {
  Topic
    .find({})
    .select('topic _id')
    .sort('-pv')
    .limit(5)
    .exec(function(err, topics) {
                if(topics) {
                  client.setex('topics', 3600, JSON.stringify(topics));
                }
      return cb(err, topics);
    });
}

function getTopicsFromRedis(cb) {
  client.get('topics', function(err, topics) {
    if(err) return cb(err, null);
    try {
      topics = JSON.parse(topics);
    } catch(e) {
      return cb(e, null);
    }
    return cb(err, topics);
  });
}