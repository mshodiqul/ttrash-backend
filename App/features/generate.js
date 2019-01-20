var bcrypt = require('bcrypt-nodejs');
var path = require('path');
var fs = require('fs');
var moment = require('moment');
moment.locale('id');
var request = require('request');
var shortid = require('shortid');

function Generate() {

	function request_data( link , cb ){
		request(link,function (err , response , body ){
			if(err) {
				cb(false);
			} else {
				if (body.length > 100) {
					cb(JSON.parse(body));
				} else {
					cb(false);
				}
			}
		});
	}

	function download(link ,namafile, cb){
		var tempat_file = path.normalize(__dirname+'/..');
		request(link).pipe(fs.createWriteStream(tempat_file+'/public/media/image/'+namafile+'.jpg'));
		cb('/media/image/'+namafile+'.jpg');
	}

	this.GetId = function (string) {
		var character = string || '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ$@';
		shortid.characters(character);
		var num = moment().format('ss');
		return shortid.generate().toLowerCase().replace(/[^\w\s]/gi,num);
	}

	this.SetTanggal = function (tanggal , format) {
		if (tanggal == null) {
			return ''
		} else {
			var now = moment(tanggal).add(7, 'hours').format(format);
			return now;
		}
	}

	this.Tanggal = function () {
		var now = new Date(); 
		var now_utc = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(),  now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds());
		return  now_utc;
	}

	this.password = function (password) {
		var salt = bcrypt.genSaltSync();
		var password = bcrypt.hashSync(password,salt);
		return password;
	}

	this.elementOption = function (arr , options) {
		var listoptions = '';
		function initlistOption() {
			// listoptions += '<select class = "form-control">';
			listoptions += '<option value = "" > -- Pilih --</option>';
			if (Array.isArray(arr) == true ) {
				for (var i = 0; i < arr.length; i++) {
					listoptions += '<option value = "'+arr[i][options.name]+'">'+arr[i][options.name]+'</option>';
				}
			} 
			// listoptions += '</select>'
		}

		initlistOption();
		if (options.tombol == true ) {
			listoptions += '<span id = "add-list" style="cursor:pointer;" class = "input-group-addon" ><i id = '+options.id_arg+' class = "fa fa-plus"></i></span>'
		}
		return listoptions;
	}

	this.elementList = function (arr , options) {
		var listdata = '';
		function initlist() {
			listdata += '<ul class = "list-group '+ options.kelas+'">';
			if (Array.isArray(arr) == true ) {
				for (var i = 0; i < arr.length; i++) {
					listdata += '<li id = '+arr[i][options.name]+' class = "list-group-item">'+ arr[i][options.name]+'<a style = "cursor : pointer;" class = "pull-right remove_list"><i class = "fa fa-trash-o"></i></a></li>'
				}
			}
			listdata += '</ul>'
		}
		initlist()
		return listdata;
	}

	this.GetVisible = function (obj , callback) {
		var type_visible = [];
		if (Array.isArray(obj.itemObject) == true ) {
			obj.itemObject.forEach(function (i){
				if (i.visible == true) {
					type_visible.push({
						label : i.label,
						type : i.type
					});
				}
			});
			return callback(null , type_visible);
		} else {
			return callback('not found' , null);
		}
	}
}
module.exports = Generate;