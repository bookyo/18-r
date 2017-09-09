var Notice = require('../models/notice');
var xss = require('xss');
var moment = require('moment');

exports.getadd = function(req, res) {
  res.render('noticeadd', {
    user: req.session.user,
    success: req.flash('success').toString(),
    error: req.flash('error')
  });
}

exports.postadd = function(req, res) {
  req.checkBody({
    'title': {
      notEmpty: true,
      errorMessage: '请填写标题'
    },
    'editorValue': {
      notEmpty: true,
      errorMessage: '请输入公告内容'
    }
  });
  var errors = req.validationErrors();
  if (errors) {
    req.flash('error', errors);
    return res.redirect('/notice/add');
  };
  var title = req.sanitize('title').trim();
  var content = req.sanitize('editorValue').trim();
  title = xss(title);
  content = xss(content);
  var noticeObj = {
    title: title,
    content: content,
    creator: req.session.user
  }
  var notice = new Notice(noticeObj);
  notice.save(function(err, notice) {
    if(err) {
      console.log(err);
    }
    res.redirect('/notice/'+ notice._id);
  });
}

exports.getnotice = function(req, res) {
  var id = req.params.id;
  Notice.findOne({_id: id})
               .exec(function(err, notice) {
                if(err) {
                  console.log(err);
                }
                var pubdate = moment(notice.meta.createAt).format('YYYY-MM-DD HH:mm:ss');
                res.render('notice', {
                  notice: notice,
                  tags: req.tags,
                  hots: req.hots,
                  pubdate: pubdate,
                  user: req.session.user,
                  success: req.flash('success').toString(),
                  error: req.flash('error')
                })
               })
}

exports.getupdate = function(req, res) {
  var id = req.params.id;
  Notice.findOne({_id: id})
               .exec(function(err, notice) {
                if(err) {
                  console.log(err);
                }
                res.render('noticeupdate', {
                  notice: notice,
                  user: req.session.user,
                  success: req.flash('success').toString(),
                  error: req.flash('error')
                })
               })
}

exports.delete = function(req, res) {
  var id = req.query.id;
  if(id) {
    Notice.remove({_id: id}, function(err) {
      if(err) {
        console.log(err)
      }
      req.flash('success', '删除公告成功');
      res.json({success: 1});
    })
  }
}

exports.postupdate = function(req, res) {
  var id = req.params.id;
  req.checkBody({
    'title': {
      notEmpty: true,
      errorMessage: '请填写标题'
    },
    'editorValue': {
      notEmpty: true,
      errorMessage: '请输入公告内容'
    }
  });
  var errors = req.validationErrors();
  if (errors) {
    req.flash('error', errors);
    return res.redirect('/notice/'+id+'/update');
  };
  var title = req.sanitize('title').trim();
  var content = req.sanitize('editorValue').trim();
  var title = xss(title);
  var content = xss(content);
  Notice.findOne({_id: id})
               .exec(function(err, notice) {
                if(err) {
                  console.log(err);
                }
                notice.title= title;
                notice.content = content;
                notice.save(function(err, notice) {
                  if(err) {
                    console.log(err);
                  }
                  res.redirect('/notice/'+id);
                })
               })
}