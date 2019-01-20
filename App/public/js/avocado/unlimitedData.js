function loadItem(pageNumber,limit) {
	var selector = $(".box-teaser-thumbnail-unlimited").eq(0);
	var segment = window.location.pathname;
	$.ajax({
		url : '/page/' + selector.attr("data-id-type"),
		type : 'GET',
		data : 'page=' + pageNumber + '&widget=' + selector.attr("data-id-widget") + '&limit=' + limit + '&segment=' + segment,
		beforeSend : function() {
			$(element).parent().prepend("<div id=\"loading-more\"><center><img src=\"/img/ajax-loader.gif\"/></center></div>");
		},
		success : function(msg) {
			$("#loading-more").remove();
			msg.forEach(function(doc) {
				var element = $(".box-teaser-thumbnail-unlimited").eq(0).clone();
				//- CHANGE BACKGROUND
				if (doc.params[0]) {
					element.find(".box-view-thumbnail").removeClass("hidden");
					element.find(".box-view-thumbnail").find("div").css({"background-image" : "url('" + doc.params[0].imageUrl + "'"});
				}
				else {
					element.find(".box-view-thumbnail").addClass("hidden");
				}
				//- TITLE
				element.find(".title").find("a").attr("href", "/" + doc.params[1].replace(/[^a-zA-Z0-9]/g,'-') + "_" + doc.params[4].id).text(doc.params[1]);
				//- TIME
				element.find(".time").text(doc.params[2]);
				//- description
				element.find(".desc").text(doc.params[3].substr(0,400) + "...")
				$(element).insertBefore('.box-more');
				// $(".box-teaser-thumbnail-unlimited").eq(0).insertBefore(".box-more").append(element);
			})
		}
	})
	return false;
}

function loadBig(pageNumber, limit, element) {
	var selector = $(".box-list-thumbnail-big-unlimited").eq(0).clone();
	var segment = window.location.pathname;
	$.ajax({
		url : '/page/' + selector.attr("data-id-type"),
		type : 'GET',
		data : 'page=' + pageNumber + '&widget=' + selector.attr("data-id-widget") + '&limit=' + limit + '&segment=' + segment,
		beforeSend : function() {
			$(element).parent().prepend("<div id=\"loading-more\"><center><img src=\"/img/ajax-loader.gif\"/></center></div>");
			console.log("Loading");
		},
		success : function(msg) {
			$("#loading-more").remove();
			msg.forEach(function(doc) {
				$.post("/callMixin", {data : JSON.stringify(doc)}, function(data) {
					$(data).insertBefore('.box-more');
					// $(".box-list-thumbnail-big-unlimited").eq(0).parent().append(data);
				})
			})
		}
	})
}

//- DETECT SCROLL
var counter = 2;
var limit = $(".box-teaser-thumbnail-unlimited").length;
var limitThumbnail = $(".box-list-thumbnail-big-unlimited").length;
// $(window).scroll(function() {
// 	if ($(window).scrollTop() == $(document).height() - $(window).height()) {
// 		if (limit != 0) {
// 			loadItem(counter, limit);
// 		}
// 		if (limitThumbnail != 0) {
// 			loadBig(counter, limitThumbnail);
// 		}
// 		counter++;
// 	}
// })

function loadMore(element) {
	if (limit != 0) {
		loadItem(counter, limit);
	}
	if (limitThumbnail != 0) {
		loadBig(counter, limitThumbnail, element);
	}
	counter++;
}