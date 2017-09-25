$(document).ready(function(){
  var summary = $(".summary").html();
  var maxwidth = 100;
  $("img.lazy").lazyload({
    effect : "fadeIn"
  });
  if( summary && summary.length > maxwidth) {
     $(".summary").html($(".summary").text().substring(0,maxwidth)
     	+ "...<a class='more' href='javascript:;'>展开全部</a>");
  }
  $("a.more").on('click', function(){
    $(".summary").hide();
    $(".summary-hidden").show();
  });
  var row = "<div class='form-resource input-group'><input type='text' name='resources' placeholder='请输入百度云,360云,电驴或者磁力链接!' class='form-control'><span class='input-group-btn'><button type='button' class='btn btn-default removerow'>删除此行</button></div>";
  var addrow = $(".addrow");
    addrow.click( function(){
       $(".resources").append(row);
    });
    $(".resources").on('click', '.removerow', function() {
        $(this).parent().parent().remove();
    });
 $('.buyres').click(function(e) {
   var target = $(e.target);
   var id = target.data('id');
   $.ajax({
     type: 'POST',
     url: '/movie/buy?id=' + id
   })
   .done(function(results) {
    if( results.success ==1){
     window.location.reload();
    }
   });
 });
 var movielists = [];
 var movies_arr = $("#topic_movies").data("ids");
 if(movies_arr) {
  var movielists = movies_arr.split(',');
  console.log(movielists);
 }
 $('.search-movie').click(function(e) {
    var title = $("#movie-title").val();
    var table = $(".table-search");
    var tablehead = "<tr><th>电影名</th><th>年份</th><th>操作</th></tr>"
    $.ajax({
      type: 'POST',
      url: '/movie/search?title=' + title
    })
    .done(function(results) {
      if( results.success == 0) {
        console.log('search err!');
      }
      if(results.length) {
        table.find("tr").remove();
        table.append(tablehead);
        for (var i = 0; i < results.length ; i++) {
          table.append("<tr><td>" + results[i].title + "</td><td>" + 
            results[i].year + "</td><td><span class='btn btn-primary movie-add' data-id='" + 
            results[i]._id + "' data-movie='"+ results[i].title +"'>添加</td></tr>");
        }
      }
      $(".movie-add").on('click', function(e){
       var target = $(e.target);
       var id = target.data('id');
       var listbox = $(".movie-lists");
       var movie = target.data('movie');
       target.parent().parent().remove();
       $("span.tip").remove();
       if ($.inArray(id, movielists) == -1) {
          var movielist = "<span class='label label-primary movies-list'>" + movie + "<span class='p5 delete' data-id='" + id + "'>×</span></span>";
          var movieinput = "<input type='hidden' name='movies' value='" + id +"'>";
          var moviebox = "<span>" + movielist + movieinput + "</span>";
          listbox.append(moviebox);
          movielists.push(id);
          if(movies_arr) {
            $("#topic_movies").val(movielists);
          }
          console.log(movielists);
       }
        $('span.delete').on('click', function(e) {
          var target = $(e.target);
          var id = target.data('id');
          target.parent().parent().remove();
          if($.inArray(id, movielists) != -1) {
            movielists.splice($.inArray(id, movielists), 1);
          }
        });
      });

    });
  });

 $('.delmovie').click(function(e) {
  var target = $(e.target);
  var movieid = target.data('movieid');
  var topicid = target.data('topicid');
  $.ajax({
    type: 'DELETE',
    url: '/topic/delmovie?topicid='+ topicid + '&movieid=' + movieid
  }).done(function(results) {
    if(results) {
      window.location.reload();
    }
  });

});
$('.topiclist').click(function(e) {
  $('.topiclist').removeClass('select-top');
  $(this).addClass('select-top');
});
$('#subaddto').click(function(e) {
  var topicid = $(".select-top").find(':radio').val();
  var movieid = $('.topiclist').data('movieid');
  if(topicid && movieid) {
    $.ajax({
      url:'/topic/addmovie',
      type:'POST',
      data: {
        topicid: topicid, movieid: movieid
      },
      success:function(data){
        if(data.success) {
          window.location = '/topic/'+topicid;
        }
        else {
          window.location = '/movie/'+ movieid;
        }
      }
    });
  }

});
$("input#title").change(function(){
  var title = $(this).val();
  $.ajax({
          url: '/movie/search?title='+title,
          type: 'POST',
          success: function(movies) {
            if(movies.length>0) {
              $('#title').popover({
                content: "<div id='pop'>已有用户发布名为<b>"+movies[0].title+"</b>的电影！点击查看：<a href='/search?q="+movies[0].title+"' target='_blank'>"+movies[0].title+"</a>，如不是同一部电影，请无视！</div>",
                placement: 'top',
                html: true,
                trigger: 'focus'
              }).focus();
            }
          }
        })
});
$(".btn-get").click(function(e) {
  var url = $('#douban').val();
  var idreg = /subject\/(\d+)\//;
  var id = url.match(idreg);
  $.ajax({
    url: 'https://api.douban.com/v2/movie/subject/'+id[1],
    type: 'GET',
    dataType: 'jsonp',
    crossDomain: true,
    success: function(data) {
      if(data) {
        // console.log(data);
        var title = data.title;
        var year = data.year;
        var directors=[];
        for(var i = 0; i< data.directors.length; i++) {
          directors.push(data.directors[i].name);
        }
        directors = directors.join("/");
        var players = [];
        for(var j = 0; j<data.casts.length; j++) {
          players.push(data.casts[j].name);
        }
        players = players.join("/");
        var country = [];
        for(var k = 0; k<data.countries.length; k++) {
          country.push(data.countries[k])
        }
        country = country.join("/");
        var summary = data.summary;
        var img = data.images.large;
        var types = data.genres;
        var aka = data.aka;
        var original_title = data.original_title;
        if(original_title || aka) {
          summary = '电影名：'+ original_title +'  '+ aka.join('  ') + '\n' + summary;
        }
        summary = summary.replace(/©豆瓣/, "");
        $(".checkbox-inline").each(function(e) {
          var tag = $(this).text().trim();
          var checkbox = $(this).find("input:checkbox");
          if($.inArray(tag, types) > -1) {
            checkbox.attr('checked', 'true');
          }
        });
        $('#title').val(title);
        $('#doctor').val(directors);
        $('#players').val(players);
        $('#country').val(country);
        $('#year').val(year);
        $('#summary').val(summary);
        $(".doubanimg").attr('src', img);
        $("input[name='eimg']").val(img);
        $.ajax({
          url: '/movie/search?title='+title,
          type: 'POST',
          success: function(movies) {
            if(movies.length>0) {
              $('#title').popover({
                content: "<div id='pop'>已有用户发布名为<b>"+movies[0].title+"</b>的电影！点击查看：<a href='/search?q="+movies[0].title+"' target='_blank'>"+movies[0].title+"</a>，如不是同一部电影，请无视！</div>",
                placement: 'top',
                html: true,
                trigger: 'focus'
              }).focus();
            }
          }
        })
      }
    }
  })
})


});
