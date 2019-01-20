function RequestSampah (io) {
	const async = require('async');
	const _ = require('underscore');

	this.index = (req, res, next) => {
		const userLogin = req.user;
		req.db.find('bank_sampah', {} ,{ sort : { nama : 1 }}, (err, rows) => {
			return res.render('panel/requestSampah',{
				role_group : userLogin.role_group[0],
				BankSampah : rows,
				id_bankSampah : userLogin.bank_sampah,
			});
		});
	}

	this.dataTable = (req, res, next) => {
		let request = req.query;
		let status = req.params.status;
		let bankSampah = req.params.bankSampah;
		let sColumn = ['id_order','customer_name','customer_hp','alamat','status','tanggal'];
		let kirim = JSON.stringify({"iTotalDisplayRecords":0,"iTotalRecords":0,"aaData":[]});
		var data = [];
		req.plugin.datatable.olahAttr(sColumn , request , (err , HasilAttr) => {
			if (err) return res.send(kirim);
			if (status != "all") {
				HasilAttr.where['status'] = status;
			}
			
			if (bankSampah != "all") {
				HasilAttr.where['bank_sampah'] = bankSampah;
			}
			HasilAttr.where['params'] = "sampah";
			req.db.find('order', HasilAttr.where , { sort : HasilAttr.order , limit : HasilAttr.limit , skip : HasilAttr.offset }, function (err , results){
				results.forEach(function (i){
					data.push({
						id_order : i.id_order,
						customer_name : i.customer_name,
						customer_hp : i.customer_hp,
						alamat : i.alamat,
						status : i.status,
						tanggal : req.generate.SetTanggal(i.tanggal , 'DD MMMM YYYY HH:mm:ss'),
					});
				});
				req.db.count('order' ,HasilAttr.where , function (err , jumlah){
					if (err) return res.send(kirim);
					req.plugin.datatable.parsingObjectData( sColumn , request ,data , jumlah  , function (err , output ){
						if (err) return res.send(kirim);
						return res.send(JSON.stringify(output));
					});
				});
			});
		});
	}

	this.searchDriver = (req, res, next) => {
		const b = req.body;
		var data = JSON.parse(b.data);
		const userLogin = req.user;
		req.db.find('users',{
			role_group : { $in : ['driver sampah']}, 
			status : 'online',
			bank_sampah : {
				$in : [userLogin.bank_sampah]
			},
		}, {sort : { name : 1}}, (err, rows) => {
			return res.render('panel/form/jemput',{
				sampah : data,
				driver : rows
			});
		})
	}

	this.jemputSampah = (req, res, next) => {
		const b = req.body;
		const userLogin = req.user;
		var id_order = JSON.parse(b.arr);
		async.parallel([
			function (callback) {
				req.db.update('order',{status : 'pendding', id_order : {
					$in : id_order,
				}},{
					$set : {
						status : 'confirm',
						id_driver : b.id_driver,
						driver : b.nama_driver
					}
				}, (err, rows) => {
					return callback(err, rows);
				});
			},
			function (callback) {
				req.db.update('history_user',{id_order : { $in : id_order }}, { $set : { status : 'confirm'}}, (err, row) => {
					return callback(err, row);
				});
			},
			function (callback) {
				req.db.find('order',{id_order : { $in : id_order}}, {}, (err, doc) => {
					if (err) callback(err, null);
					let arr = [];
					_.each(doc, (num) => {
						arr.push({
							id_order : num.id_order,
							customer_name : num.customer_name,
							customer_id : num.customer_id,
							customer_hp : num.customer_hp,
							hp : "",
							lokasi : num.lokasi,
							alamat : num.alamat,
							driver : b.nama_driver,
							ket : num.ket,
							id_driver : b.id_driver,
							params : 'sampah',
							status : 'confirm',
							type : 'Angkut Sampah',
							flag : 'N',
							totalPoint : 0,
							tanggal : num.tanggal,
							bank_sampah : userLogin.bank_sampah,
						});
					});
					req.db.SaveData('history_order',arr, (err, n) => {
						return callback(err, n);
					})
				});
			}
		], (err, results) => {
			if (err) return res.json({status : 500, pesan : 'data gagal di proses'});
			req.db.find('order',{status : 'confirm', params : 'sampah', id_driver : b.id_driver}, { sort : { customer_name : 1}}, (err, rows) => {
				io.emit('cekSampah',{id_driver : b.id_driver , data : rows});
				return res.json({status : 200});
			});
		});
	}
}

module.exports = RequestSampah;