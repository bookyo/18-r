$(function() {
  $('.del').click(function(e) {
    var target = $(e.target);
    var id = target.data('id');
    $.ajax({
      type: 'DELETE',
      url: '/18r/movie/delete?id=' + id
    })
    .done(function(results) {
      window.location = '/18r/movies';
    });
  });
  $('.tagdel').click(function(e) {
    var target = $(e.target);
    var id = target.data('id');
    $.ajax({
      type: 'DELETE',
      url: '/18r/tag/delete?id=' + id
    })
    .done(function(results) {
      window.location= '/18r/tags';
    });
  });
  $('.resdel').click(function(e) {
    var target = $(e.target);
    var id = target.data('id');
    var movieid = target.data('movieid');
    $.ajax({
      type: 'DELETE',
      url: '/18r/res/delete?id=' + id + '&movieid=' + movieid
    })
    .done(function(results) {
      window.location= '/18r/res';
    });
  });
  $('.delzerouser').click(function(e) {
   console.log('click delete');
   $.ajax({
     type: 'DELETE',
     url: '/18r/users/deletezerousers'
   })
   .done(function(results) {
     window.location = '/18r/users';
   })
  })
});