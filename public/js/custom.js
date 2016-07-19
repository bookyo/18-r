$(document).ready(function(){
  var summary = $(".summary").html();
  var maxwidth = 100;
  if( summary.length > maxwidth) {
     $(".summary").html($(".summary").text().substring(0,maxwidth)
     	+ "...<a class='more' href='javascript:;'>展开全部</a>");
  }
  $("a.more").on('click', function(){
    $(".summary").hide();
    $(".summary-hidden").show();
  });
});