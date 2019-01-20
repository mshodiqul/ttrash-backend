function TransaksiSampah () {
	const async = require('async');
	const _ = require('underscore');

	this.index = (req, res, next) => {
		const userLogin = req.user;
		return res.render('panel/transaksi_sampah',{
			role_group : userLogin.role_group[0],
		});
	}

	this.dataTable = (req, res, next) => {
		const userLogin = req.user;
		const role_group = userLogin.role_group[0];
		var request = req.query;
		var status = req.params.status;
		var sColumn = ['id_order','id_order','customer_name','customer_hp','id_driver','driver','flag','point','tanggal'];
		var kirim = JSON.stringify({"iTotalDisplayRecords":0,"iTotalRecords":0,"aaData":[]});
		var data = [];
		req.plugin.datatable.olahAttr(sColumn , request , (err , HasilAttr) => {
			if (err) return res.send(kirim);
			if (status != "all") {
				HasilAttr.where['flag'] = status;
			}
			HasilAttr.where['status'] = 'done';
			HasilAttr.where['params'] = "sampah";
			req.db.find('order', HasilAttr.where , { sort : HasilAttr.order , limit : HasilAttr.limit , skip : HasilAttr.offset }, function (err , results){
				results.forEach(function (i){
					let flag = "";
					let btn = "";
					if (i.flag == "N") {
						flag = "BELUM DI HITUNG";
						btn = "<center><a href = '#/transaksi/sampah/hitung/"+i.id_order+"' class='btn btn-primary'>Hitung</a></center>";
					} else {
						flag = "SUDAH DI HITUNG";
					}
					let obj = {
						id_order : i.id_order,
						id_order : i.id_order,
						customer_name : i.customer_name,
						customer_hp : i.customer_hp,
						id_driver : i.id_driver,
						driver : i.driver,
						flag : flag,
						point : i.point,
						// tanggal : btn
					}
					if (role_group != "dinas") {
						obj['tanggal'] = btn;
					} else {
						obj['tanggal'] = "-";
					}
					data.push(obj);
				});
				req.db.count('order' ,HasilAttr.where , function (err , jumlah){
					if (err) return res.send(kirim);
					req.plugin.datatable.parsingObjectData( sColumn , request ,data , jumlah  , function (err , output ){
						if (err) return res.send(kirim);
						return res.send(JSON.stringify(output));
					});
				});
			})
		});
	}

	this.hitungPoint = (req, res, next) => {
		const userLogin = req.user;
		let bank_sampah = userLogin.bank_sampah;
		let id_order = req.params.id_order;
		req.db.findOne('order',{id_order : id_order}, (err, rows) => {
			if (err || rows == null) return next("ERROR");
			req.db.find('harga',{ bank_sampah : bank_sampah},{sort : { nama : 1}}, (err, Harga) => {
				return res.render('panel/form/hitungPoint',{
					data : rows,
					harga : Harga,
					customer_id : rows.customer_id,
					id_order : id_order,
					id_driver : rows.id_driver
				});
			});
		});
	}

	this.prosesHitung = (req, res, next) => {
		const b = req.body;
		const data = JSON.parse(b.data);
		async.waterfall([
			function (callback) {
				let point = 0;
				_.each(data.kategori , (doc) => {
					let subtotal = parseInt(doc.harga)*parseInt(doc.total);
					point += subtotal;
				});
				return callback(null,point);
			},
			function (arg, callback) {
				req.db.update('users',{_id : data.customer_id}, { $inc : { point : arg}}, (err, rows) => {
					return callback(null,arg);
				});
			},
			function (arg, callback) {
				req.db.update('order',{id_order : data.id_order}, { $set : { point : arg , flag : 'Y', totalPoint : arg }}, (err, rows) => {
					return callback(null,arg);
				});
			},
			function (arg, callback) {
				req.db.update('history_order',{id_order : data.id_order}, { $set : { flag : 'Y', totalPoint : arg }}, (err, rows) => {
					return callback(null,arg);
				});
			},
		], (err, results) => {
			if (err) return res.json({status : 503, pesan : "data gagal di proses "});
			return res.json({status : 200});
		})
	}

	this.deleteData = (req, res, next) => {
		var b = req.body;
		var data = JSON.parse(b.data);	
		req.db.remove('order', {_id : { $in : data.id }}, function (err , rows){
			return res.json({status : 'sukses'})
		})
	}
}

module.exports = TransaksiSampah;