function btnSubmit() {
	var tabnya = $(".tab-pane.active");
	tabnya.find("form").submit();
}
function websiteSubmit() {
	var website = $("#website").val();
	var description = $("#description").val();
	var tagline = $("#tagline").val();
	if (website == "") {
		$("#prosesWebsite").html("<p class=\"alert alert-danger\">Name Website Can't Be Empty</p>");
		return false;
	}
	else {
		$.ajax({
			url : '/setup/website/',
			type : 'POST',
			data : {website : website, desc : description, tagline : tagline},
			beforeSend : function() {
				console.log("Loading");
			},
			success : function(msg) {
				if (msg.status == 200) {
					next("#tab2");
				}
			}
		})
	}
}

function databaseSubmit() {
	var driver = $("#driver").val();
	var host = $("#hostdb").val();
	var port = $("#port").val();
	var db = $("#dbname").val();
	var user = $("#userdb").val();
	var password = $("#passdb").val();
	if (driver == "" || host == "" || port == "" || db == "") {
		$("#prosesDatabase").html("<p class=\"alert alert-danger\">Data can't be empty</p>");
		return false;
	}
	else {
		$.ajax({
			url : '/setup/database/',
			type : 'POST',
			data : {driver : driver, host : host, port : port, db : db, user : user, password : password},
			beforeSend : function() {
				console.log("Loading");
			},
			success : function(msg) {
				if (msg.status == 200) {
					next("#tab3");
				}
				else {
					$("#prosesDatabase").html("<p class=\"alert alert-danger\">Connection Failed</p>");
				}
			}
		})
	}
}

function next(next) {
	var linknya = $(".bootstrapWizard li.active").next();
	$(".bootstrapWizard li").removeClass("active");
	linknya.find("a").attr({href : next, "data-toggle" : "tab"})
	linknya.addClass("active");

	var tabnya = $(".tab-pane.active").next();
	$(".tab-pane").removeClass("active");
	tabnya.addClass("active");
}

function setUpNow() {
	var name = $("#name").val();
	var username = $("#username").val();
	var password = $("#password").val();
	var email = $("#email").val();

	if (name == '' || username == '' || password == '' || email == '') {
		$("#prosesStart").html("<p class=\"alert alert-danger\">Theres an empty data</p>");
	}
	else {
		if ($("#agree").is(":checked") == true) {
			$.ajax({
				url : '/setup/start',
				type : 'POST',
				data : {_id : username, name : name, email : email, upassword : password},
				beforeSend : function() {
					$("#btnSetup").text("Loading...");
					$("#btnSetup").attr("disabled","disabled");
				},
				success : function(msg) {
					$("#btnSetup").text("SETUP NOW");
					$("#btnSetup").removeAttr("disabled");
					if (msg.status == 200) {
						next("#tab4");
						$(".form-actions").remove();
						$(".bootstrapWizard li").removeClass("active");
						$(".bootstrapWizard li").find("a").removeAttr("href");
						$("#usernamenya").text(username);
						$("#passwordnya").text(password);
					}
					else {
						$("#prosesSetup").html("<p class=\"alert alert-danger\">Server Error</p>");
					}
				}
			})
		}
		else {
			$("#prosesStart").html("<p class=\"alert alert-danger\">You must be agree to continue</p>");			
		}
	}
}
$(function() {
	pageSetUp();
	var pageFunction = function() {

	}
	pageFunction();
	$("#websiteForm").submit(function() {
		websiteSubmit();
		return false;
	})
	$("#databaseForm").submit(function() {
		databaseSubmit();
		return false;
	})
	$("#startSetup").submit(function() {
		setUpNow();
		return false;
	})
})