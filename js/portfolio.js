$('#myTabs a').click(function (e) {
  e.preventDefault()
  $(this).tab('show')
});

$(document).ready(function($) {
	$(".clickable").click(function() {
		window.document.location = $(this).data("href");
	});
});
