function BackupRestore() {
	var backup = require('mongodb-backup');
	var restore = require('mongodb-restore');
	var moment = require('moment');
	moment.locale("id");
	var fs = require('fs');
	var rmdir = require('rimraf');
	var mode = process.env.NODE_ENV || 'dev';

	this.index = function(req,res,next) {
		const userLogin = req.user;
		return res.render("panel/backupRestore",{
			role_group : userLogin.role_group[0],
		});
	}

	function getUri() {
		var configDB = require('../../config/database.json');
		configDB = configDB[mode] || configDB['dev'];
		var url = "mongodb://";
		if (configDB.mongodb != undefined ) {
			if ( ( configDB.mongodb.connection.user == '' || configDB.mongodb.connection.user == undefined ) && ( configDB.mongodb.connection.pwd == '' || configDB.mongodb.connection.pwd == undefined) ) {
				url += configDB.mongodb.connection.host+':'+configDB.mongodb.connection.port+'/'+configDB.mongodb.connection.db;
			} else {
				url += configDB.mongodb.connection.user+':'+configDB.mongodb.connection.pwd+'@'+configDB.mongodb.connection.host+':'+configDB.mongodb.connection.port+'/'+configDB.mongodb.connection.db;
			}
			return url;
		} else {
			return null
		}
	}

	this.tambah = function(req,res,next) {
		var obj = [{
			id : 'name',
			label : 'Name',
			type : 'text'
		}];
		var tombol = {
			'tambah' : {
				kelas : 'simpan',
				label : 'Simpan',
				url : '/manage/backup-restore/backup'
			}
		}
		return res.render('panel/form/dynamic_form',{
			type : 'tambah',
			obj : obj,
			tombol : tombol
		});
	}
	this.Delete = function(req,res,next) {
		var data = JSON.parse(req.body.data);		
		req.userLog.insert(req, "Menghapus Data Backup Dengan Nama " + data.id.join(", "));
		data.id.forEach(function (doc) {
			var folder = new Buffer(doc, "base64").toString("ascii");
			rmdir("./database/" + folder, function (err) {
				console.error(err);
			});
		})
		res.json({status : 'sukses', pesan : 'Successfull'})
	}

	this.backup = function(req,res,next) {
		var url = getUri();
		var tanggal = moment().format("YYYYMMDD");
		if (!fs.existsSync('./database')) {
			fs.mkdir('./database');
		};

		function selesaiBackup() {
			req.userLog.insert(req, "Backup Database Dengan Nama " + req.body.name);
			return res.json({status : "sukses", pesan : "Successfull"});
		}
		backup({
			uri : url,
			root : __dirname + "/../../../database/" + tanggal + "_" + req.body.name,
			callback : selesaiBackup
		});
	}

	function dynamicSort(property) {
		var sortOrder = 1;
		if(property[0] === "-") {
			sortOrder = -1;
			property = property.substr(1);
		}
		return function (a,b) {
			var result = (a[property] < b[property]) ? -1 : (a[property] > b[property]) ? 1 : 0;
			return result * sortOrder;
		}
	}

	this.dataTable = function(req,res,next) {
		var data = [];
		fs.readdir("./database", function(err, files) {
			if (files) {
				files.forEach(function(doc) {
					if (! /^\..*/.test(doc)) { // tidak menampilkan hidden system files.
						var name = doc.split("_");
						data.push({
							_id : new Buffer(doc).toString("base64"),
							name : name[1],
							date : "<span data-tanggal=" + name[0] + ">" + moment(name[0]).format("DD MMMM YYYY") || "Invalid Date" + "</span>"
						});
					}
				});
			}
			var request = req.query;
			var sColumn = ['_id','name','date'];

			// init order sort
			var sOrder_name = '' ;
			var sOrder_method = '';

			if( request['iSortCol_0'] ) {
				for(var i = 0 ; i < request['iSortingCols']; i++) {
					if (request['bSortable_'+parseInt(request['iSortCol_'+i])] == "true") {
						sOrder_name = sColumn[parseInt(request["iSortCol_"+i])].toString();
						if (request["sSortDir_"+i].toString() == 'asc'){
							sOrder_method = '';
						} else {
							sOrder_method = '-';
						}
					}
				}
			}

			var order = '';
			order = sOrder_method + sOrder_name;

			data.sort(dynamicSort(order));
			req.plugin.datatable.parsingObjectData(sColumn, request, data, data.length, function(err, output) {
				if (err) return res.send(kirim);
				return res.send(JSON.stringify(output));
			})
				
		})
	}

	this.restore = function(req,res,next) {
		var data = req.body;
		var folder = new Buffer(data.id, "base64").toString("ascii");
		var url = getUri();

		var rootFolder = __dirname + '/../../../database/' + folder + "/";
		fs.readdir("./database/" + folder, function(err, files) {
			if (files.length != 0) {
				rootFolder += files[0];
			}

			restore({
				uri : url,
				// drop : true,
				root : rootFolder,
				callback : function(done) {
					req.userLog.insert(req, "Restore Database Dengan Nama " + folder);
					return res.json({status : 'sukses', pesan : 'Successfull'})
				}
			})
		})
	}

	this.TestBackUp = function (req , res , next ) {
		var list_collection = req.db.ShowCollection(function (err , collections){
			if (err) return next(err);
			return res.render('panel/form/backup_list',{
				data : collections
			});
		});
	}

	this.BackupData = function (req , res , next ) {
		var url = getUri();
		console.log(url);
	}
}
module.exports = BackupRestore;