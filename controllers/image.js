var Img = require('../models/image');
var Movie = require('../models/movie');
var sharp = require('sharp');

exports.getupload = function(req, res) {
  var id = req.params.id;
  Movie.findOne({_id: id})
        .select('_id title')
        .exec(function(err, movie) {
          if(err) {
            console.log(err);
          }
          if(!movie) {
            return res.status(404).send('此页面不存在');
          }
          res.render('uploadimgs',{
            movie:movie,
            user:req.session.user,
            error: req.flash('error'),
            success: req.flash('success').toString()
          })
        });
  
}

exports.postupload = function(req, res) {
  var id = req.body.movieid;
  var imgs = req.files;
  Movie.findOne({_id: id})
       .select('_id title')
       .exec(function(err, movie) {
          if(err) {
            console.log(err);
          }
          if(!movie) {
            return res.status(404).send('此页面不存在！');
          }
          imgs.forEach(function(file,index){
            var path = file.path;
            var destination = file.destination;
            var fileFormat = file.filename.split("."); 
            var filename = fileFormat[0]+'.jpg';  
            var originalimg = file.filename;    
            sharp(path)
              .resize(250,250)
              .quality(90)
              .toFile(destination + '/250/' + filename , function(err) {
                if(err) throw err;
              });
            var imgObj= {
              img: filename,
              originalimg: originalimg,
              tomovie: id,
              creator: req.session.user._id
            };
            var image = new Img(imgObj);
            image.save(function(err) {
              if(err) {
                console.log(err);
              }
              if(index == (imgs.length-1)) {
                req.flash('success', '恭喜，添加图片成功！');
                res.redirect('/movie/'+id);
              }
            })
          })
        })
}

exports.getimages = function(req, res) {
  var id = req.params.id;
  var perPage = 12;
  var page = req.query.page > 0 ? req.query.page : 1;
  Movie.findOne({_id:id})
       .select('_id title')
       .exec(function(err,movie) {
         if(err) {
           console.log(err);
         }
         if(!movie) {
           return res.status(404).send('此页面已经不存在了！');
         }
         Img.find({tomovie:id})
            .select('_id img originalimg')
            .sort('-meta.updateAt')
            .limit(perPage)
            .skip(perPage * (page-1))
            .exec(function(err, images) {
              Img.count({tomovie:id})
                 .exec(function(err,count){
                   if(err) {
                     console.log(err);
                   }
                   res.render('movieimages',{
                    images: images,
                    movie: movie,
                    user: req.session.user,
                    page: page,
                    pages: Math.ceil(count/perPage),
                    error: req.flash('error'),
                    success: req.flash('success').toString()
                  })
                 })
            })
       })
}

exports.delimage = function(req, res) {
  var id = req.query.id;
  Img.remove({_id: id})
     .exec(function(err) {
       if(err) {
         console.log(err);
       }
       req.flash('success', '删除图片成功！');
       res.json({success: 1});
     })
}