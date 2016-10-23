var redis = require("redis");
var xss = require('xss');
var client = redis.createClient();
var Topic = require('../models/topic');
var Movie = require('../models/movie');

exports.getTopics = function(req, res) {
  var perPage = 8;
  var page = req.query.page > 0 ? req.query.page : 1;
  Topic
    .find()
    .select('topic _id movies creator')
    .populate('movies','title _id')
    .limit(perPage)
    .skip(perPage * (page-1))
    .sort('-meta.updateAt')
    .exec( function(err, topics) {
      if(err) {
        console.log(err);
      }
      Topic.count(function(err, count) {
        res.render('topics', {
          title: 'movies topics',
          user: req.session.user,
          error: req.flash('error'),
          success: req.flash('success').toString(),
          topics: topics,
          page: page,
          pages: Math.ceil(count/perPage),
        });
      });
    });
}

exports.getNew = function(req, res) {
  res.render( 'topic_new', {
    title: '创建电影专题',
    user: req.session.user,
    error: req.flash('error'),
    success: req.flash('success').toString()
  });
}