var async = require('async');

function ContentType () {

	this.index = function (req , res , next) {
		const userLogin = req.user;
		return res.render('panel/content-type',{
			role_group : userLogin.role_group[0],
		});
	}

	this.DataTable = function (req , res , next ) {
		var request = req.query;
		var sColumn = ['id','nama','created_at'];
		var kirim = JSON.stringify({"iTotalDisplayRecords":0,"iTotalRecords":0,"aaData":[]});
		var data = [];
		req.plugin.datatable.olahAttr(sColumn , request , function (err , HasilAttr){
			if (err) return res.send(kirim);
			req.db.find('contentType', HasilAttr.where , { sort : HasilAttr.order , limit : HasilAttr.limit , skip : HasilAttr.offset }, function (err , results){
				results.forEach(function (i){
					data.push({
						id : i.id,
						nama : i.nama,
						created_at : req.generate.SetTanggal(i.created_at , 'DD MMMM YYYY HH:mm:ss')
					});
				});
				req.db.count('contentType' ,HasilAttr.where , function (err , jumlah){
					if (err) return res.send(kirim);
					req.plugin.datatable.parsingObjectData( sColumn , request ,data , jumlah  , function (err , output ){
						if (err) return res.send(kirim);
						return res.send(JSON.stringify(output));
					});
				});
			});
		});
	}

	this.TambahContentType = function (req , res , next ) {
		req.db.find('contentType', { $or : [{ parent : null },{ parent : ''}]} , { sort : { nama : 1 }}, function (err , listType){
			return res.render('panel/form/dynamic_contentType',{
				type : 'tambah',
				listType : listType
			});
		});
	}

	this.SimpanContentType = function (req , res , next ) {
		var b = req.body;
		var obj = JSON.parse(b.data);
		var nama = obj.nama;
		var parent = obj.parent;
		var refs = obj.refs;
		var itemObject = [];
		obj.item.forEach(function (i){
			itemObject.push({
				label : i.label,
				multi : i.multi,
				visible : i.visible,
				type : i.type,
				option : i.option
			});
		});
		var data = {
			id : req.generate.GetId(),
			nama : nama,
			// parent : parent,
			// refs : refs,
			icon : obj.icon,
			created_at : req.generate.Tanggal(),
			author : req.user._id,
			itemObject : itemObject,
			type : obj.type,
			public : obj.public,
			notif : obj.notif
		}

		var dataUri = {
			uri_name : nama,
			uri : "/" + nama.replace(/[^a-zA-Z0-9]/gi, '-').toLowerCase(),
			layout : "",
			segment : [],
			box : [],
			id :req.generate.GetId(),
			created_at : new Date(),
			deleteable : false
		}
		req.db.SaveData('uri', dataUri, function(err, result) {
			console.log("uri created", dataUri.uri);
		});
		if (parent != '') {
			data.parent = parent;
			data.refs = refs;
		}
		req.userLog.insert(req, "Membuat Content Type Dengan Judul " + nama);		
		req.db.SaveData('contentType', data , function (err , rows){
			if (err) return res.json({status : 'gagal' });
			return res.json({status : 'sukses'});
		});
	}

	this.GetContentType = function (req , res , next ) {
		var id = req.params.id;
		req.db.find('contentType', { id : { $ne : id } , $or : [{ parent : null },{ parent : ''}] } , { sort : { nama : 1 }}, function (err , listType){
			req.db.find('contentType' , { id : id } , {} , function (err , result){
				return res.render('panel/form/dynamic_contentType',{
					data : result[0],
					type : 'edit',
					listType : listType
				});
			});
		});
	}

	this.EditContentType = function (req , res , next ) {
		var b = req.body;
		var obj = JSON.parse(b.data);
		var itemObject = [];
		var parent = obj.parent;
		var refs = obj.refs;
		obj.item.forEach(function (i){
			itemObject.push({
				label : i.label,
				multi : i.multi,
				visible : i.visible,
				type : i.type,
				option : i.option
			});
		});
		var data = {
			nama : obj.nama,
			icon : obj.icon,
			// parent : parent,
			// refs : refs,
			itemObject : itemObject,
			public : obj.public,
			notif : obj.notif,
			type : obj.type
		}
		if (parent != '') {
			data.parent = parent;
			data.refs = refs;
		}
		// console.log(data);
		req.userLog.insert(req, "Mengedit Content Type Dengan Judul " + obj.nama);
		req.db.update('s_menu',{ id_type : obj.id }, { $set : { menu_title : obj.nama , menu_uri : '/content/'+obj.nama }}, function (err , rows){
			req.db.update('contentType', { id : obj.id }, { $set : data }, function (err , result){
				if (err) return res.json({status : 'gagal' });
				return res.json({status : 'sukses' , reload : true });
			});
		});
	}

	this.DeleteContentType = function (req , res , next ) {
		var b = req.body;
		var data = JSON.parse(b.data);
		req.userLog.insert(req, "Menghapus Content Type Dengan ID " + data.id.join(", "));
		req.db.find('s_menu',{ id_type : { $in : data.id } }, {} , function (err , Menu){
			async.parallel([
				function (callback) {
					if (Menu.length != 0 ) {
						req.db.remove('a_access',{ accessObj : Menu[0].id }, function (err , doc){
							return callback(err , doc);
						});
					} else {
						return callback(null , null);
					} 
				},
				function (callback) {
					if (Menu.length != 0 ) {
						req.db.remove('contentItem', { type : Menu[0].menu_title}, function (err , doc){
							return callback(err , doc);
						});
					} else {
						return callback(null , null);
					}
				},
				function (callback){
					req.db.remove('s_menu',{ id_type : { $in : data.id } }, function (err , doc){
						return callback(err , doc);
					});
				},
				function (callback) {
					req.db.remove('contentType', { id : { $in : data.id }}, function (err , doc){
						return callback(err , doc);
					});
				}
			], function (err , results){
				return res.json({status : 'sukses' , reload : true });
			});
		});
	}

	this.GetFieldParent = function (req , res , next ) {
		var b = req.body;
		var id = b.value;
		req.db.findOne('contentType',{id : id } , function (err , rows){
			if (err || rows == null) return res.json({status : 'gagal'});
			return res.json({status : 'sukses', data : rows.itemObject});
		});
	}
}


module.exports = ContentType;