	$('.add-image').click(function (e){
		e.preventDefault();
		$("#plusImage").trigger("click");
	});

	function HapusItem (selector , target) {
		$(selector).closest(target).remove();
	}

	function CopyElement(sumber , tujuan, file) {
		var files = file || false
		var html = $(sumber).html();
		$(tujuan).append(html);
	}

	function RemoveKategori(selector) {
		$(selector).parent().remove();
		return false;
	}


	$(function (){
		var type = $('div#tempat-upload').attr('data-type');
		var id_type = $('div#tempat-upload').attr('data-idtype');
		var type = $('div#tempat-upload').attr('data-type');

		function SendData (data , url , selector) {
			var dataToSend = { data : JSON.stringify(data) };
			$.ajax({
				url : url,
				type : 'POST',
				dataType : 'json',
				data : dataToSend,
				success : function (msg) {
					if (msg.status == 'sukses') {
						window.location.reload();
					} else {
						$('#proses-form').html('<p class = "alert alert-danger">' + msg.pesan + '</p>')
					}
					$(selector).attr('disabled', false);
				}
			});
		}

		function FormValidasi () {
			var status_list = [];
			if ($('#list_data .tempat_labeltag').find('#box-labelTag').length != 0 ) {
				$('#list_data .tempat_labeltag').find('div#box-labelTag.row').each(function (x){
					var label = $(this).find('label.control-label').text();
					var value = $('#list_data .tempat_labeltag').find('select.tambahan[data-label="'+label+'"]').val();
					if ( label != '' || value != null) {
						status_list.push(true);
					}  else {
						status_list.push(false);
					}
				});
			}

			if ($('#list_data .tempat_text').find('textarea#text').length != 0 ) {
				$('#list_data .tempat_text div.row').each(function (i){
					var text = $(this).find('textarea#text').val();
					var label =  $(this).find('label.control-label').text();
					if (text == '') {
						status_list.push(false);
					} else {
						status_list.push(true);
					}
				});
			}

			if ($('#list_data .tempat_string').find('input#string').length != 0 ) {
				$('#list_data .tempat_string div.row').each(function (i){
					var string = $(this).find('input#string').val();
					var label =  $(this).find('label.control-label').text();
					if (string == '') {
						status_list.push(false);
					} else {
						status_list.push(true);
					}
				});
			}

			var status = $.inArray(false , status_list);
			return status;
		}

		$('#simpanItems').click(function (e){
			e.preventDefault();
			$(this).attr('disabled',true);
			$('div#tempat-pesan').html('');
			var status = 'kirim';
			var arr_string = [];
			var arr_text = [];
			var arr_tag = {};
			var arr_image = [];
			var kategories = [];
			var id_type = $(this).closest("form").attr("data-id-type");
			var type = $(this).closest("form").attr("data-type-name");
			var typeForm = $(this).closest("form").attr("data-form");
			var title = $("#title").length != 0 ? $('#title').val().replace(/[^\w\s]/gi, ' ') : "Embed In Client";
			if (typeForm == "public") {
				if($("#g-recaptcha-response").val() == '') {
					status = 'tidak';
					$('#simpanItems').attr('disabled',false);					
					return $("#proses-form").html("<p class=\"alert alert-danger\">Captcha Not Valid</p>");
				}
			}
			var kirim = {
				title :title,
				id_type : id_type,
				type : type
			};

			if ($('#list_data .tempat_labeltag').find('#box-labelTag').length != 0 ) {
				$('#list_data .tempat_labeltag').find('div#box-labelTag.row').each(function (x){
					var label = $(this).find('label.control-label').text();
					var value = $('#list_data .tempat_labeltag').find('select.tambahan[data-label="'+label+'"]').val();
					if ( label != '' || value != null ) {
						arr_tag[label] = value;
					}  else {
						status = 'tidak';
					}
				});
				kirim.tag = arr_tag;
			}

			if ($('#list_data .tempat_text').find('textarea#text').length != 0 ) {
				$('#list_data .tempat_text div.row').each(function (i){
					var text = $(this).find('textarea#text').val();
					var label =  $(this).find('label.control-label').text();
					if (text == '') {
						$('div#tempat-pesan').html("<p class='alert alert-danger'><i class='fa fa-minus-circle'></i> Data Masih Kosong !!! </p>");
						$('#loading').hide();
						status = 'tidak';
						$('#simpanItems').attr('disabled',false);
					} else {
						status = 'kirim';
						arr_text.push({
							label : label.replace(/[^a-zA-Z0-9]/g, ""),
							value : text
						});
					}
				});

				var groups = _.groupBy(arr_text, function (item) {
					return [item.label].sort();
				});

				var duplicates = [],singles = [];
				_.each(groups, function(group) {
					if (group.length > 1) {
						kirim[group[0].label] = group
					} else {
						kirim[group[0].label] = group[0].value
					}
				});

			}

			if ($('#list_data .tempat_string').find('input#string').length != 0 ) {
				$('#list_data .tempat_string div.row').each(function (i){
					var string = $(this).find('input#string').val();
					var label =  $(this).find('label.control-label').text();
					if (string == '') {
						$('div#tempat-pesan').html("<p class='alert alert-danger'><i class='fa fa-minus-circle'></i> Data Masih Kosong !!! </p>");
						$('#loading').hide();
						status = 'tidak';
						$('#simpanItems').attr('disabled',false);
					} else {
						status = 'kirim';
						arr_string.push({
							label : label.replace(/[^a-zA-Z0-9]/g, ""),
							value : string
						});
					}
				});
				var groups = _.groupBy(arr_string, function (item) {
					return [item.label].sort();
				});

				var duplicates = [],singles = [];
				_.each(groups, function(group) {
					if (group.length > 1) {
						kirim[group[0].label] = group
					} else {
						kirim[group[0].label] = group[0].value
					}
				});
			}

			if ($('#list_data .tempat_image').find('div#box-img').length != 0) {
				$('#list_data .tempat_image div#box-img').each(function (i){
					var imageUrl = $(this).find('input.image').attr('data-file');
					//- console.log(imageUrl);
					if (imageUrl == undefined) {
						$('#tempat-pesan').html("<p class='alert alert-warning'><i class='fa fa-minus-circle'></i> Data image Masih Kosong !!! </p>");
						//- $('#loading').hide();
						$('#simpanItems').attr('disabled',false);
					} else {
						status = 'kirim';
						arr_image.push({
							imageUrl : imageUrl,
							poster : eval($(this).find('.img').attr("data-poster")) || false,
						});
					}
				});
				kirim.images = arr_image
			}

			if ($("#list_data .editor").find("textarea#entry-markdown").length != 0) {
				var editor = {};

				editor = {
					value : window.editor.getValue(),
					content : $(".rendered-markdown").html()
				}
				status = 'kirim';
				kirim.editor = editor;
			}

			var cek = FormValidasi();
			if (status == 'tidak' || cek != -1 ) {
				$('div#proses-form').html("<p class='alert alert-danger'><i class='fa fa-minus-circle'></i> Data Masih Kosong !!! </p>");
				$('#simpanItems').attr('disabled', false);
				status = 'tidak';
			} else {
				// console.log(kirim);
				SendData(kirim , '/content/simpanItem', '#simpanItems');
			}
		});
	})