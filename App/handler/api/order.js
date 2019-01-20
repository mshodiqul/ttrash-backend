function Order () {
	const request = require('request');
	const async = require('async');
	const _ = require('underscore');
	const moment = require('moment');
	moment.locale('id');

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

	this.selesaiOrderSampah = (req, res, next) => {
		const b = req.body;
		async.parallel([
			function (callback) {
				req.db.update('order',{ id_order : b.id_order },{$set : { status : 'done'}}, (err , rows) => {
					return callback(err, rows);
				});
			},
			function (callback) {
				req.db.update('history_user',{ id_order : b.id_order}, { $set : { status : 'done'}}, (err, row) => {
					return callback(err, row);
				})
			},
			function (callback) {
				req.db.update('history_order',{ id_order : b.id_order}, { $set : { status : 'done'}}, (err, row) => {
					return callback(err, row);
				})
			},
		], (err, results) => {
			if (err) return res.json({status : 500});
			req.db.find('order',{status : 'confirm', params : 'sampah', id_driver : b.username }, { sort : { customer_name :1 }}, (err, rows) => {
				if (err) return res.json({status : 500});
				return res.json({status : 200 , data : rows});
			})
		})
	}

	this.hitungBarang = (req, res, next) => {
		const b = req.body;
		const kilo = parseInt(b.kilo);
		async.parallel([
			function (callback) {
				req.db.findOne('site',{}, (err, Site) => {
					return callback(err, Site);
				});
			},
			function (callback) {
				req.db.findOne('order',{ id_order : b.id_order}, (err, Order) => {
					if (err) return callback(err, null);
					return callback(null, Order);
				});
			},
		], (err, results) => {
			if (err) return res.json({status : 500, pesan : 'data tidak bisa di proses'});
			let harga = results[0].harga;
			let fee = results[0].fee * results[1].biaya/100;
			let biayaJarak = parseInt(results[1].biaya+fee);
			let biayaKilo = parseInt(harga*b.kilo);
			let totalPoint = parseInt(biayaJarak+biayaKilo);
			let sampai = b.berapa+" "+b.etimasi;
			req.db.update('order',{id_order : b.id_order}, { $set : { totalPoint : totalPoint , sampai : sampai, kilo : kilo+" Kg" }}, (err, doc) => {
				req.db.find('order',{status : 'confirm', id_driver : b.username , params : 'barang'}, {sort : {customer_name : 1}}, (err, rows) => {
					req.db.update('history_user',{id_order : b.id_order }, { $set : { totalPoint: totalPoint, sampai : sampai, kilo : kilo+" Kg"}}, (err, h) => {
						return res.json({status : 200, data : rows});
					});
				});
			});
		});
	}

	this.cancelOrder = (req, res, next) => {
		const b = req.body;
		req.db.update('order',{id_order : b.id_order},{
			$set : {
				id_driver : '',
				driver : '',
				hp : '',
				status : 'cancel',
				sampai : '-'
			},
		}, (err, rows) => {
			if (err) return res.json({status : 500});
			async.parallel([
				function (callback) {
					req.db.findOne('order',{ id_order : b.id_order}, (err, rows) => {
						return callback(err, rows);
					});
				},
				function (callback) {
					req.db.find('order',{status : 'confirm', id_driver : b.username , params : 'barang'}, {sort : {customer_name : 1}}, (err, rows2) => {
						return callback(err, rows2);
					});
				}
			], (err, results) => {
				req.db.update('history_user',{id_order : b.id_order}, { $set : { status : 'cancel'}}, (err, doc) => {
					let history_order = results[0];
					history_order['status'] = "cancel";
					history_order['_id'] = req.generate.GetId();
					history_order['totalPoint'] = 0;
					req.db.SaveData('history_order',history_order, (err2, d) => {
						if (err) return res.json({status : 500});
						return res.json({status : 200, data : results[1]});
					});
				});
			});
		});
	}

	this.selesaiOrder = (req, res, next) => {
		const b = req.body;
		async.parallel([
			function (callback) {
				req.db.findOne('order',{ id_order : b.id_order}, (err, Order) => {
					if (err) return callback(err, null);
					return callback(null, Order);
				});
			},
			function (callback) {
				req.db.update('order',{id_order : b.id_order },{ $set : { status : 'done'}}, (err, row) => {
					return callback(err,"SUKSES");
				});
			}
		], (err, results) => {
			if (err) return res.json({status : 503});
			// let fee = site.fee * results[1].biaya/100;
			// let pointUser = results[2].point;
			// let pointAkhir = parseInt(pointUser - totalPoint);
			// let totalPoint = results[0].totalPoint;
			req.db.update('history_user',{ id_order : b.id_order},{ $set : {status : 'done' }}, (err, hasil) => {
				let history = results[0];
				history['status'] = "done";
				req.db.SaveData('history_order',history, (err, hasil) => {
					req.db.find('order',{status : 'confirm', id_driver : b.username, params : 'barang'}, {sort : {customer_name : 1}}, (err, rows) => {
						if (err) return res.json({status : 500});
						return res.json({status : 200, data : rows});
					});
				});
			});
		});
	}

	this.ListHarga = (req, res, next) => {
		const b = req.body;
		req.db.find('harga',{ bank_sampah : b.bank_sampah }, {sort : { nama : 1}}, (err, rows) => {
			if (err) return res.json({status : 503});
			return res.json({status : 200 , data : rows});
		});
	}

	this.getOrderSampah = (req, res, next) => {
		const b = req.body;
		req.db.find('order',{
			status : 'confirm', 
			params : 'sampah', 
			id_driver : b.username
		},{ 
			sort : { 
				customer_name : 1 
			}
		}, (err, rows) => {
			if (err) return res.json({status : 500});
			return res.json({status : 200, data : rows});
		})
	}

	this.getOrderBarang = (req, res, next) => {
		const b = req.body;
		async.parallel([
			function (callback) {
				req.db.find('order',{status : 'confirm', id_driver : b.username, params : 'barang'}, {sort : {customer_name : 1}}, (err, rows) => {
					return callback(err, rows);
				});
			},
			function (callback) {
				req.db.findOne('site',{} ,(err, doc) => {
					return callback(err, doc);
				})
			}
		], (err, results) => {
			if (err) return res.json({status : 500});
			return res.json({status : 200, data : results[0], site : results[1]});
		})
	}

	this.getRequest = (req, res, next) => {
		const b = req.body;
		req.db.find('order',{params : 'barang', status : 'pendding'}, {sort : { tanggal : -1 }} , (err, results) => {
			if (err) return res.json({status : 503, pesan : 'terjadi kesalahan pada server'});
			return res.json({status : 200, data : results});
		});
	}

	this.angkutBarang = (req, res, next) => {
		const b = req.body;
		let from = b.from.latitude+","+b.from.longitude;
		let dest = b.dest.latitude+","+b.dest.longitude;
		req.db.findOne('site',{id : 1 }, (err, site) => {
			var harga = site.harga;
			async.parallel([
				function (callback) {
					let url = b.googleapis_url+'directions/json?origin='+from+'&destination='+from+'&mode=driving&key='+b.google_key;
					request_data(url, (hasil) => {
						if (hasil) {
							let alamat1 = hasil.routes[0].legs[0].start_address;
							return callback(null, alamat1);
						} else {
							return callback("ERROR",null);
						}
					});
				},
				function (callback) {
					request_data(b.googleapis_url+'directions/json?origin='+dest+'&destination='+dest+'&mode=driving&key='+b.google_key, (hasil) => {
						if (hasil) {
							let alamat2 = hasil.routes[0].legs[0].start_address;
							return callback(null, alamat2);
						} else {
							return callback("ERROR",null);
						}
					});
				},
				function (callback) {
					let url = b.googleapis_url+'directions/json?origin='+from+'&destination='+dest+'&mode=driving&key='+b.google_key;
					request_data(url, (hasil) => {
						if (hasil) {
							let jarakText = hasil.routes[0].legs[0].distance.text;
							let jarak = hasil.routes[0].legs[0].distance.value;
							let biaya = (jarak/1000) * harga;
							biaya = biaya.toString();
							biaya = biaya.replace(/\./g,'');
							biaya = parseInt(biaya);
							let obj = {
								jarak : {
									text : jarakText,
									value : jarak
								},
								biaya : biaya
							}
							return callback(null,obj);
						} else {
							return callback("ERROR",null);
						}
					});
				}
			], (err , results) => {
				if (err) return res.json({status : 401, pesan : 'terjadi kesalahan pada server'});
				let id_order = req.generate.GetId();
				let order = {
					id_order : id_order,
					customer_name : b.nama,
					customer_id : b.username,
					customer_hp : b.hp,
					hp : "",//rows[0].hp,
					from : b.from,
					dest : b.dest,
					alamatBarang : results[0],
					alamatTujuan : results[1],
					biaya : results[2].biaya,
					jarak : results[2].jarak,
					totalPoint : 0,
					driver : "",//rows[0].name,
					ket : b.ket,
					sampai : "",
					id_driver : "",//rows[0]._id,
					status : 'pendding',
					params : 'barang',
					type : 'Angkut Apa Aja',
					tanggal : moment().format('YYYY-MM-DD HH:mm:ss')
				}
				req.db.SaveData('order',order, (err, docs) => {
					let history_user = {
						id : req.generate.GetId(),
						id_order : order.id_order,
						userid : order.customer_id,
						name : order.customer_name,
						id_driver : "",
						totalPoint : 0,
						driver : "",
						sampai : "",
						kilo : "",
						lokasi_awal : order.alamatBarang,
						lokasi_akhir : order.alamatTujuan,
						type : order.type,
						tanggal : order.tanggal,
						status : 'pendding'
					}
					req.db.SaveData('history_user',history_user, (err, doc) => {
						if (err) return res.json({status : 401, pesan : 'sedang terjadi masalah pada server ~'});
						return res.json({status : 200 , data : order});
					});
				});
			});
		});
	}

	this.angkutSampah = (req, res, next) => {
		const b = req.body;
		let tujuan = b.lokasi.latitude+","+b.lokasi.longitude;
		request_data(b.googleapis_url+'directions/json?origin='+tujuan+'&destination='+tujuan+'&mode=driving&key='+b.google_key, (hasil) => {
			if (hasil) {
				var alamat = hasil.routes[0].legs[0].start_address;
				let id_order = req.generate.GetId();
				let order = {
					id_order : id_order,
					customer_name : b.nama,
					customer_id : b.username,
					customer_hp : b.hp,
					hp : "",
					lokasi : b.lokasi,
					gambar : b.gambar,
					alamat : alamat,
					totalPoint : 0,
					driver : "",
					ket : b.ket,
					id_driver : "",
					params : 'sampah',
					status : 'pendding',
					type : 'Angkut Sampah',
					flag : 'N',
					estSampah : b.estSampah,
					bank_sampah : b.bank_sampah,
					tanggal : moment().format('YYYY-MM-DD HH:mm:ss')
				}
				req.db.SaveData('order',order, (err, docs) => {
					if (err) return res.json({status : 401, pesan : 'sedang terjadi masalah pada server ~'});
					let history_user = {
						id : req.generate.GetId(),
						id_order : order.id_order,
						userid : order.customer_id,
						name : order.customer_name,
						gambar : b.gambar,
						id_driver : "",
						totalPoint : 0,
						driver : "",
						lokasi_awal : order.alamat,
						lokasi_akhir : "-",
						type : order.type,
						tanggal : order.tanggal,
						status : 'pendding',
						bank_sampah : b.bank_sampah,
					}
					req.db.SaveData('history_user',history_user , (err, h) => {
						return res.json({status : 200 , data : order});
					});
				});
			}
		});
	}

	this.listHistory = (req, res, next) => {
		var limit = parseInt(req.query.limit) || 6;
		var skip = parseInt(req.query.skip) || 0;
		var sort = req.query.sort || 'tanggal';
		let pageSize = limit;
		let currentPage = skip;
		let offset = pageSize * (currentPage - 1);
		const b = req.body;
		req.db.find('history_order',{id_driver : b.user},{ sort : {tanggal : -1 }, limit : limit, skip : offset }, (err, rows) => {
			if (err) return res.json({status : 503, pesan : 'sedang terjadi masalah '});
			req.db.count('history_order', {id_driver : b.user} , (err, Jumlah) => {
				let pageCount = Math.ceil(Jumlah/pageSize);
				return res.json({status : 200, data : rows,  pageCount : pageCount });
			});
		});
	}

	this.estSampah = (req,res,next) => {
		let body = req.body
		if (body.user_id) {
			let sampah = req.body.sampah.map((v, i) => {
				return {
					_id : req.generate.GetId(),
					category_id : v.category_id,
					value : v.value
				}
			})

			let dataToInsert = {
				_id : req.generate.GetId(),
				user_id : body.user_id,
				sampah : sampah,
				created_at : new Date()
			}

			// SAVE TO COLLECTION EST SAMPAH
			req.db.SaveData('estOrderSampah', dataToInsert, (err, result) => {
				res.json({
					status : 200,
					data : dataToInsert
				})
			})
		} else {
			res.status(404).json({
				status : 404,
				message : 'Not Found'
			})
		}
	}
}

module.exports = Order;