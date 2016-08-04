$(function() {
  $('.del').click(function(e) {
    var target = $(e.target);
    var id = target.data('id');
    $.ajax({
      type: 'DELETE',
      url: '/movie/delete?id=' + id
    })
    .done(function(results) {
      window.location = '/';
    });
  });
});