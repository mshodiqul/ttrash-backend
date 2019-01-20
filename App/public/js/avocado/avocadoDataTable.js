
function dataTable(selector , url, widthArray , options) {
	var responsiveHelper_table_item = undefined;
	var breakpointDefinition = {
		tablet : 1024,
		phone : 480
	};
	$(selector).DataTable().destroy();
	var orderBy = [[0,'desc']];
	if (options != undefined ) {
		if (options.orderBy != undefined )
			orderBy = options.orderBy;
	}

	tableitem = $(selector).dataTable({
		"columnDefs": widthArray,
		"order" : orderBy,
		"bProcessing" : true,
		"scrollY":370,
		"bServerSide" : true,
		"sAjaxSource" : url,
		"fnRowCallback": function( nRow, aData, iDisplayIndex, iDisplayIndexFull ) {
			var element = aData.toString().split(',');
			var aidi = element[0];
			if (options != undefined) {
				if (options.selectable != undefined) {
					options.selectable.forEach(function (i){
						$('td:eq('+i+')', nRow).addClass('selectable');
						$('td', nRow).eq(i).attr('data-id',aidi);
					});
				}

				if (options.statusPublish != undefined ) {
					var status = $('td:eq('+options.statusPublish+')', nRow).text();
					var alert = $('td:eq('+options.statusPublish+')', nRow).find("span").attr("data-alert");
					if (status != 'aktif' && status != '') {
						$(nRow).css('color', 'red');
					}
					// console.log("alertnya", alert);
					if (alert == "true") {
						$(nRow).css('color', 'red');
					}
				}

				if (options.checkbox == undefined ) {
					$('td', nRow).eq(0).html('<div class="checkbox"><label><input type="checkbox" name="checkbox" id="centang" onClick="Pilih(this,\''+selector+'\')" data-id="'+element[0]+'" ></label> </div>');
					$('td' , nRow).eq(0).css('text-align' , 'center');
					var index = $.inArray(aidi, selected);
				}
			}
			$(nRow).attr('data-id',aidi);
			if (index >= 0) {
				$(nRow).addClass('selected');
	        }
		},
		"sDom": "<'dt-toolbar'<'col-xs-12 col-sm-12'f>r>"+
			"t"+
			"<'dt-toolbar-footer'<'col-sm-5 col-xs-12 hidden-xs'i><'col-sm-2 col-xs-2 hidden-xs'l><'col-xs-5 col-sm-5'p>>",
		"autoWidth" : true,
		"preDrawCallback" : function() {
			// Initialize the responsive datatables helper once.
			if (!responsiveHelper_table_item) {
				responsiveHelper_table_item = new ResponsiveDatatablesHelper($(selector), breakpointDefinition);
			}
		},
		"rowCallback": function( row, data ) {
			if ( $.inArray(data.DT_RowId, selected) !== -1 ) {
				$(row).addClass('selected');
			}
			responsiveHelper_table_item.createExpandIcon(row);
		},
		"drawCallback" : function(oSettings) {
			responsiveHelper_table_item.respond();
		}
	});
	return tableitem;
}

function Pilih(selector , table) {
	var id = $(selector).attr('data-id');
	var index = $.inArray(id , selected);
	var data_cheked = $('table'+table+' tbody tr.single');
	var id_cheked = data_cheked.eq(0).find('#centang').attr('data-id');
	var index_cheked = $.inArray(id_cheked , selected);
	data_cheked.removeClass('selected');
	var cek = $('table'+table+' tbody tr').hasClass('single');
	//- console.log(cek);
	if (cek == true && id != id_cheked) {
		selected.splice(index_cheked, 1);
	}

	if (index === -1 ){
		selected.push(id);
	} else if (id != id_cheked) {
		selected.splice(index , 1);
	}
	$('table'+table+' tr[data-id="'+id+'"]').toggleClass('selected');
	if (id_cheked != undefined && id == id_cheked)
		$('table'+table+' tr[data-id="'+id+'"]').addClass('selected');
	$('table'+table+' tr').removeClass('single');
}

function DataTableEdit(url , title  , width) {
	if (selected.length == 1) {
		url += '/'+selected[0];
		var lebar = width || '';
		$('.modal-admin').css('width', lebar);
		$('.modal-dialog').css('width', lebar);
		$('div#modal_All').modal('show');
		$('#modal_All .modal-title p').text(title);
		$('div#modal_All div#kosong').html('');
		$('div#AllModal').load(url);
	} else {
		$.smallBox({
			title : "Peringatan",
			content : "<i class='fa fa-clock-o'></i> <i> Minimal Satu Data !!!</i>",
			color : "#C46A69",
			iconSmall : "fa fa-times fa-1x fadeInRight animated",
			timeout : 1000
		});
	}
}

function DataTableHref(url) {
	if (selected.length == 1) {
		window.location.href= url + '/' + selected[0];
	}
	else {
		window.location.href = url;
	}
}

function DataTableAction(url, type) {
	if (selected.length == 1) {
		$.ajax({
			url : url,
			type : type || 'GET',
			data : {id : selected[0]},
			beforeSend : function() {
				console.log("Loading");
			},
			success : function(msg) {
				$.smallBox({
					content : "<i class='fa fa-clock-o'></i> <i> " + msg.pesan + " !!!</i>",
					color : "#659265",
					iconSmall : "fa fa-check fa-1x fadeInRight animated",
					timeout : 1000
				});
				$('#clear').click();
			}
		})
	} else {
		$.smallBox({
			title : "Peringatan",
			content : "<i class='fa fa-clock-o'></i> <i> Minimal Satu Data !!!</i>",
			color : "#C46A69",
			iconSmall : "fa fa-times fa-1x fadeInRight animated",
			timeout : 1000
		});
	}
}

$('#modal_All').on('shown.bs.modal', function() {
	$('#modal_All input:first').focus();
});

function DataTableDelete (url) {
	if (selected.length != 0 ) {
		$.SmartMessageBox({
			title : "Warning !!!",
			content : "Are You Sure ? You Want to Delete This Item",
			buttons : '[No][Yes]'
		}, function (ButtonPressed) {
			if (ButtonPressed === "Yes") {
				var kirim = {
					id : selected
				}
				$.ajax({
					url : url,
					dataType : 'json',
					data : { data : JSON.stringify(kirim)},
					type : 'POST',
					success : function (msg) {
						$.smallBox({
							content : "<i class='fa fa-clock-o'></i> <i> Deleted Success !!!</i>",
							color : "#659265",
							iconSmall : "fa fa-check fa-1x fadeInRight animated",
							timeout : 1000
						});
						if (msg.reload == true ){
							location.reload();
						}
						$('#clear').click();
					}
				});
			} else {
				$('#clear').click();
			}
		});
	} else {
		$.smallBox({
			title : "Peringatan",
			content : "<i class='fa fa-clock-o'></i> <i> Data Masih Kosong !!!</i>",
			color : "#C46A69",
			iconSmall : "fa fa-times  fa-1x fadeInRight animated",
			timeout : 1000
		});
	}
}

function SelectedRow (selector) {
	$('table'+selector+' tbody').on('click','tr td.selectable', function (){
		selected = [];
		var id = $(this).attr('data-id');
		$('input[type="checkbox"]').prop('checked',false);
		$('table'+selector+' tr').removeClass('single');
		$('table'+selector+' tr').removeClass('selected');
		var index = $.inArray(id, selected);
		if ( index === -1 ) {
			selected.push(id);
		} else {
			selected.splice( index, 1 );
		}
		$(this).parent().addClass('single');
		$(this).parent().addClass('selected');
	});
}

function DataTableAdd(url , title , width ) {
	var lebar = width || '';
	$('.modal-admin').css('width', lebar);
	$('.modal-dialog').css('width', lebar);
	$('div#modal_All').modal('show');
	$('#modal_All .modal-title p').text(title);
	$('div#modal_All div#kosong').html('');
	$('div#AllModal').load(url);
}
