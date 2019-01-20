function HistoryHandler () {
	const moment = require('moment');
	const async = require('async');
	moment.locale('id');

	this.index = (req, res, next) => {
		const userLogin = req.user;
		const role_group = userLogin.role_group[0];
		req.db.find('users',{role_group : { $in : ['driver sampah']}}, { sort : { name : 1}}, (err, rows) => {	
			req.db.find('bank_sampah', {}, {sort : { nama : 1}}, (err, bank_sampah) => {
				return res.render('panel/history',{
					driver : rows,
					bankSampah : bank_sampah,
					role_group : role_group,
					id_bankSampah : userLogin.bank_sampah,
				});
			});
		})
	}

	function rupiah(n) {
		return "Rp. "+ (n/1000).toFixed(3).replace(/(\d)(?=(\d{3})+\.)/g, "$1.");
	}

	this.DataTable = (req, res, next) => {
		let bankSampah = req.params.bankSampah;
		var request = req.query;
		var sColumn = ['_id','driver','type','alamatBarang','alamatTujuan','jarak.text','biaya','tanggal'];
		var kirim = JSON.stringify({"iTotalDisplayRecords":0,"iTotalRecords":0,"aaData":[]});
		var data = [];
		req.plugin.datatable.olahAttr(sColumn , request , (err , HasilAttr) => {
			if (err) return res.send(kirim);
			if (bankSampah != "all") {
				HasilAttr.where['bank_sampah'] = bankSampah;
			}
			console.log(HasilAttr.where)
			req.db.find('history_order', HasilAttr.where , { sort : HasilAttr.order , limit : HasilAttr.limit , skip : HasilAttr.offset }, function (err , results){
				if (results.length == 0) return res.send(kirim);
				results.forEach(function (i){
					var alamatAwal = "";
					var alamatAkhir = "";
					var jarak = "";
					var type = "";
					var biaya = "";
					if (i.params == "barang") {
						alamatAwal = i.alamatBarang;
						alamatAkhir = i.alamatTujuan;
						jarak = i.jarak.text;
						type = "Sangkut Apa Aja";
						biaya = rupiah(i.biaya);
					} else {
						type = "Sangkut Sampah";
						alamatAwal = i.alamat;
					}
					data.push({
						_id : i._id,
						driver : i.driver,
						type : type,
						alamatBarang : alamatAwal,
						alamatTujuan : alamatAkhir,
						'jarak.text' : jarak,
						biaya : biaya,
						tanggal : req.generate.SetTanggal(i.tanggal , 'DD MMMM YYYY HH:mm:ss')
					});
				});
				req.db.count('history_order' ,HasilAttr.where , function (err , jumlah){
					if (err) return res.send(kirim);
					req.plugin.datatable.parsingObjectData( sColumn , request ,data , jumlah  , function (err , output ){
						if (err) return res.send(kirim);
						return res.send(JSON.stringify(output));
					});
				});
			})
		});
	}

	this.laporanDriver = (req, res, next) => {
		let params = req.query;
		async.parallel([
			function (callback) {
				req.db.findOne('users',{_id : params.driver}, (err, rows) => {
					return callback(err, rows);
				});
			},
			function (callback) {
				let query = {
					id_driver : params.driver,
					status : 'done'
				}
				if (params.start != "" && params.end != "") {
					query['tanggal'] = {
						$gte : params.start,
						$lt : params.end
					}
				}
				req.db.find('history_order',query , {}, (err, rows) => {
					return callback(err, rows);
				});
			}
		], (err, results) => {
			return res.render('laporan',{
				data : results[1],
				driver : results[0],
				moment : moment,
				tanggal : moment().format('DD MM YYYY'),
			});
		});
	}
}

module.exports = HistoryHandler;