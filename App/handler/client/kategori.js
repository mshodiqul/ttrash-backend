function Kategori () {
	const async = require('async');

	this.index = (req, res, next) => {
		var tag = req.params.kategori;
		var pageSize = 30;
		var currentPage = 1;
		var skip = pageSize * (currentPage - 1);
		var query = {
			type : 'Product' 
			, 
			'kategori' : { 
				$in : [new RegExp(tag, "gi")]
			}
		};
		async.parallel([
			function (callback) {
				req.db.find('contentItem',query , {sort : { time_added : -1}, limit : 30 , skip : skip }, (err, rows) => {
					req.db.count('contentItem',query, (err, Jumlah) => {
						const pageCount = Math.ceil(Jumlah/pageSize);
						console.log(pageCount);
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
			return res.render('client/kategori',{
				products : rows[0].dataList,
				pageSize : rows[0].pageSize,
				pageCount : rows[0].pageCount,
				currentPage : currentPage,
				kategori : rows[1],
				tag : tag,
				last_order : rows[2],
			});
		});
	}

	this.pagingKategori = (req, res, next) => {
		try {
			var tag = req.params.kategori;
			var currentPage = req.params.id.replace(/[^\w\s]/gi, '');
			if (Number.isInteger(parseInt(currentPage)) == true ) {
				currentPage = parseInt(currentPage);
				const pageSize = 30;
				var skip = pageSize * (currentPage -1 );
				var query = {
					type : 'Product' 
					, 
					'kategori' : { 
						$in : [new RegExp(tag, "gi")]
					}
				};
				async.parallel([
					function (callback) {
						req.db.find('contentItem',query , {sort : { time_added : -1}, limit : 30 , skip : skip }, (err, rows) => {
							req.db.count('contentItem',query, (err, Jumlah) => {
								const pageCount = Math.ceil(Jumlah/pageSize);
								console.log(pageCount);
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
					return res.render('client/kategori',{
						products : rows[0].dataList,
						pageSize : rows[0].pageSize,
						pageCount : rows[0].pageCount,
						currentPage : currentPage,
						kategori : rows[1],
						tag : tag,
						last_order : rows[2],
					});
				});
			} else {
				return next(e);
			}
		} catch (e) {
			return next(e);
		}
	}
}

module.exports = Kategori;