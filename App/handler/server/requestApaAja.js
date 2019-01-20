function ApaAja (io) {
	const async = require('async');
	const _ = require('underscore');

	this.index = (req, res, next) => {
		return res.render('panel/requestApaAja');
	}

	this.dataTable = (req, res, next) => {
		let request = req.query;
		let status = req.params.status;
		let sColumn = ['id_order','customer_name','customer_hp','alamatBarang','alamatTujuan','status',];
		let kirim = JSON.stringify({"iTotalDisplayRecords":0,"iTotalRecords":0,"aaData":[]});
		var data = [];
		req.plugin.datatable.olahAttr(sColumn , request , (err , HasilAttr) => {
			if (err) return res.send(kirim);
			if (status != "all") {
				HasilAttr.where['status'] = status;
			}
			HasilAttr.where['params'] = "barang";
			req.db.find('order', HasilAttr.where , { sort : HasilAttr.order , limit : HasilAttr.limit , skip : HasilAttr.offset }, function (err , results){
				results.forEach(function (i){
					data.push({
						id_order : i.id_order,
						customer_name : i.customer_name,
						customer_hp : i.customer_hp,
						alamatBarang : i.alamatBarang,
						alamatTujuan : i.alamatTujuan,
						status : i.status,
						// tanggal : req.generate.SetTanggal(i.tanggal , 'DD MMMM YYYY HH:mm:ss'),
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
		req.db.find('users',{role_group : { $in : ['driver apa aja']}, status : 'online' }, {sort : { name : 1}}, (err, rows) => {
			return res.render('panel/form/jemputBarang',{
				sampah : data,
				driver : rows
			});
		})
	}

	this.jemputBarang = (req, res, next) => {
		const b = req.body;
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
		], (err, results) => {
			if (err) return res.json({status : 500});
			req.db.find('order',{status : 'confirm', params : 'barang', id_driver : b.id_driver }, {sort : {customer_name : 1}}, (err, rows) => {
				if (err) return res.json({status : 500});
				io.emit('cekBarang',{id_driver : b.id_driver , data : rows});
				return res.json({status : 200});
			});
		});
	}
}

module.exports = ApaAja;