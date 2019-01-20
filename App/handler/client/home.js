function HomeHandler () {
	const moment = require('moment');
	const async = require('async');
	moment.locale('id');

	function rupiah(n) {
		var hg = "Rp. "+ (n/1000).toFixed(3).replace(/(\d)(?=(\d{3})+\.)/g, "$1.");
		return hg;
	}

	function uniqNumber() {
		let random = Math.ceil(Math.random() * 1000);
		let awal = parseInt(parseInt(moment().format("DDMMYYHHmmss") * random).toString().substr(0,12));
		return awal;
	}

	this.index = (req, res, next) => {
		let pageSize = 30;
		var currentPage = 1;
		let skip = pageSize * (currentPage - 1);
		let query = {type : 'Product'};
		async.parallel([
			function (callback) {
				req.db.find('contentItem',query, {sort : { time_added : -1}, limit : 30 , skip : skip }, (err, rows) => {
					req.db.count('contentItem',query, (err, Jumlah) => {
						const pageCount = Math.ceil(Jumlah/pageSize);
						const dataList = rows;
						return callback(null, {dataList : dataList, pageCount : pageCount, pageSize : pageSize });
					});
				});
			},
			function (callback) {
				req.db.find('tag', {}, { limit : 5 }, (err , rows) => {
					return callback(err, rows);
				});
			},
			function (callback) {
				req.db.find('transaksi', {}, {sort : { created_at : -1 }, limit : 5} , (err, rows) => {
					return callback(err, rows);
				});
			}
		], (err, rows) => {
			return res.render('client/home',{
				products : rows[0].dataList,
				pageSize : rows[0].pageSize,
				pageCount : rows[0].pageCount,
				currentPage : currentPage,
				kategori : rows[1],
				last_order : rows[2],
			});
		})
	}

	this.Paging = (req, res, next) => {
		try {
			var currentPage = req.params.id.replace(/[^\w\s]/gi, '');
			if (Number.isInteger(parseInt(currentPage)) == true ) {
				currentPage = parseInt(currentPage);
				const pageSize = 30;
				var skip = pageSize * (currentPage -1 );
				var query = {type : 'Product'};
				async.parallel([
					function (callback) {
						req.db.find('contentItem',query, {sort : { time_added : -1}, limit : 30 , skip : skip }, (err, rows) => {
							if (err) return next(err);
							req.db.count('contentItem',query, (err, Jumlah) => {
								const pageCount = Math.ceil(Jumlah/pageSize);
								const dataList = rows;
								return callback(null, {dataList : dataList, pageCount : pageCount, pageSize : pageSize })
							});
						});
					},
					function (callback) {
						req.db.find('tag', {}, { limit : 5 }, (err , rows) => {
							return callback(err, rows);
						});
					},
					function (callback) {
						req.db.find('transaksi', {}, {sort : { created_at : -1 }, limit : 5} , (err, rows) => {
							return callback(err, rows);
						});
					}
				], (err, rows) => {
					return res.render('client/home',{
						products : rows[0].dataList,
						pageSize : rows[0].pageSize,
						pageCount : rows[0].pageCount,
						currentPage : currentPage,
						kategori : rows[1],
						last_order : rows[2],
					});
				})
			} else {
				return next();
			}
		} catch (e) {
			return next(e);
		}
	}

	this.previewProduct = (req, res, next) => {
		let b = req.params;
		let id = b.id;
		req.db.findOne('contentItem',{id : id}, (err, rows) => {
			if (err) return next(err);
			return res.render('client/detailItem',{
				item : rows
			});
		});
	}

	this.Card = (req, res, next) => {
		return res.render('client/cart');
	}

	this.Checkout = (req, res, next) => {
		return res.render('client/checkout');
	}

	this.prosesCheckout = (req, res, next) => {
		const data = req.body;
		let code = 'TRX' + uniqNumber();
		data['_id'] = code;//req.generate.GetId();
		data['status'] = "pendding";
		data['created_at'] = req.generate.Tanggal();
		req.db.SaveData('transaksi',data, (err, rows) => {
			if (err) return res.json({status : 503});
			return res.json({status : 200, code : code});
		});
	}

	this.checkKonfirmasi = (req, res, next) => {
		return res.render('client/checkKonfirmasi');
	}

	this.getListOrder = (req, res, next) => {
		let nomor = req.body.nomor;
		req.db.find('transaksi',{telp : nomor , status : 'pendding'},{}, (err, rows) => {
			var arr = [];
			rows.forEach(function (i) {
				arr.push({
					_id : i._id,
					tanggal : moment(i.created_at).format("DD MMMM YYYY HH:mm:ss"),
					total : rupiah(i.totalHarga)
				});
			});
			return res.json({status : 200, data : arr});
		});
	}

	this.Konfirmasi = (req, res, next) => {
		let id = req.params.id;
		async.parallel([
			function (callback) {
				req.db.findOne('transaksi',{_id : id }, (err, rows) => {
					return callback(err, rows);
				});
			},
			function (callback) {
				req.db.find('contentItem',{type : 'rekening' }, {sort : { title : -1 }}, (err, doc) => {
					return callback(err, doc);
				})
			},
			function (callback) {
				req.db.find('tag', {}, { limit : 5 }, (err , rows) => {
					return callback(err, rows);
				});
			},
			function (callback) {
				req.db.find('transaksi', {}, {sort : { created_at : -1 }, limit : 5} , (err, rows) => {
					return callback(err, rows);
				});
			}
		], (err, rows) => {
			if (err) return next(err);
			var confirm = false;
			if (rows[0].status == 'pendding' ) {
				confirm = false;
			} else {
				confirm = true;
			}
			return res.render('client/konfirmasi',{
				item : rows[0],
				rekening : rows[1],
				confirm : confirm,
				kategori : rows[2],
				last_order : rows[3],
			})
		});
	}

	this.confirmPembayaran = (req, res, next) => {
		const b = req.body;
		let data = {
			status : 'confirm',
			bukti : '/media/image/'+req.bukti,
		}
		req.db.findOne('transaksi', {_id : b.order , status : 'pendding'} , (err, rows) => {
			if (rows) {
				req.db.update('transaksi',{_id : b.order }, {$set : data }, (err, rows) => {
					if (err) return res.json({status : 503, pesan : 'data gagal di proses'});
					return res.json({status : 200});
				});
			} else {
				return res.json({status : 404 , pesan : "orderan sudah di konfirmasi"});
			}
		});
	}
}

module.exports = HomeHandler;