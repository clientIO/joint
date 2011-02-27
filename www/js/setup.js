$(document).ready(function() {
//  prettyPrint();
  hljs.tabReplace = '    ';
  hljs.initHighlighting();

  $('#menu > li > a').removeClass('current');
  var page = document.location.toString().split('/').pop();
  var current = $('#menu > li > a[href="' + page + '"]').addClass('current');
  if (!current.length) {
    $('#menu > li:first-child > a').addClass('current');
  }
});