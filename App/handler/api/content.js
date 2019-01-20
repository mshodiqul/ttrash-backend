function Content() {
	const _ = require('underscore');
	const async = require('async');

	this.getRekening = (req, res, next) => {
		req.db.find('contentItem',{type : 'rekening'},{ sort : { title : 1}}, (err, rows) => {
			if (err) return res.json({status : 500});
			if (rows.length != 0 ) {
				let obj = {};
				_.each(rows , (i) => {
					let label = i.bank+" - "+i.rekening;
					obj[label] = label;
				});
				return res.json({status : 200, data : obj});
			} else {
				return res.json({status :200 , data : null, pesan : 'data rekening belum tersedia'});
			}
		});
	}

	this.find = function(req,res,next) {
		var contentType = req.params['name'];
		// console.log(req.query);
		var label = req.query['label'];
		var kategori = req.query['kategori'];
		var tag = req.query['tag'];
		var where = {
			type : contentType,
			author : {
				$ne : 'root'
			}
		}
		if (kategori != "all") {
			where['kategori'] = {
				$in : [new RegExp(kategori, "gi")]
			}
		}
		if (label) {
			var dataLabel = [];
			if (label.match("-")) {
				where['$or'] = [];
				dataLabel = label.split("-");
			} else if (label.match("_")) {
				where['$and'] = [];
				dataLabel = label.split("_");
			} else {
				dataLabel.push(label);
			}
			dataLabel.forEach(function(d) {
				var object = {};
				object['tag.' + d] = {
					$exists : true
				}
				if (label.match("_")) {
					where['$and'].push(object);
					where['$and'].push(searchTag);
				} else if (label.match("-")) {
					where['$or'].push(object);
					where['$or'].push(searchTag);
				} else {
					where['tag.' + d] = {
						$exists : true
					}
				}
			})
			if (label && tag) {
				var tagLabel = [];
				tag.split("-").forEach(function(l) {
					tagLabel.push(l);
				})
				dataLabel.forEach(function(d) {
					where['tag.' + d] = {
						$in : [new RegExp(["^",tagLabel, "$"].join(""), "gi")]
					}
				});
			}
		}
		var limit = parseInt(req.query.limit) || 100;
		var skip = parseInt(req.query.skip) || 0;
		var sort = req.query.sort || 'time_added';
		var methodSort = isNaN(req.query.by) ? -1 : parseInt(req.query.by);
		let pageSize = limit;
		let currentPage = skip;
		let offset = pageSize * (currentPage - 1);

		async.parallel([
			function (callback) {
				req.db.find('contentItem', where, {'sort' : { time_added : -1 }, limit : limit, skip : offset }, function (err, data) {
					if (err) return callback(err,null);
					// console.log("panjang data ===> "+ data.length);
					req.db.count('contentItem',where, (err, Jumlah) => {
						let pageCount = Math.ceil(Jumlah/pageSize);
						// return res.json({status : 200 , data : data, pageCount : pageCount});
						return callback(null,{data : data, pageCount : pageCount});// res.json({status : 200 , data : data, pageCount : pageCount});
					});
				});
			},
			function (callback) {
				req.db.find('tag',{},{sort : { _id : 1}} , (err, rows) => {
					if (err) return callback(err,null);
					let arr = [{
						key : 'all',
						label : "All"
					}];
					_.each(rows, (i) => {
						arr.push({
							key: i._id.toLowerCase(),
							label: i._id,
						});
					});
					return callback(null, arr);
				});
			}
		], (err, results) => {
			console.log(err);
			if (err) res.json({status : 500 , pesan : 'sedang terjadi kesalahan'});
			// console.log(results[0]);
			// return res.json({status : 200 , data : [], pageCount : results[0].pageCount, kategori : results[1]});
			return res.json({status : 200 , data : results[0].data, pageCount : results[0].pageCount, kategori : results[1]});
		});
		// req.db.find('contentItem', where, {'sort' : {sort : methodSort}, limit : limit, skip : offset }, function (err, data) {
		// 	if (err) return res.json({status : 500 , pesan : 'sedang terjadi kesalahan'});
		// 	req.db.count('contentItem',where, (err, Jumlah) => {
		// 		let pageCount = Math.ceil(Jumlah/pageSize);
		// 		return res.json({status : 200 , data : data, pageCount : pageCount});
		// 	});
		// });
	}

	this.insert = function(req,res,next) {
		var body = req.body;
		req.db.findOne('contentType', {nama : req.params['name']}, function (err, data) {
			if (err) throw err;
			if (data) {
				data.itemObject.push({
					label : "title",
					type : "string"
				});
				var column = data.itemObject;
				if (Array.isArray(body)) {
					var dataToInsert = [];
					body.forEach(function(doc) {
						var object = {
							id : req.generate.GetId(),
							id_type : data.id,
							type : data.nama,
							status : 'aktif',
							author : req.dataUser&&req.dataUser._id
						};
						object['tag'] = {};
						column.forEach(function(d) {
							if (doc[d.label]) {
								if (d.type == "label_tag") {
									doc[d.label] = [].concat(doc[d.label]);
									object['tag'][d.label] = doc[d.label];
								} else if (d.type == "images") {
									var objectImage = doc[d.label];
									var arrayImg = [];
									if (Array.isArray(doc[d.label])) {
										objectImage.forEach(function(img) {
											var imgObj = {
												imageUrl : img.url,
												poster : img.poster?img.poster:false
											};
											arrayImg.push(imgObj);
										})
									} else if (typeof(objectImage) === "object") {
										var imgObj = {
											imageUrl : objectImage.url,
											poster : objectImage.poster?objectImage.poster:false
										};
										arrayImg.push(imgObj);
									}
									object['images'] = arrayImg;
								} else {
									object[d.label] = doc[d.label];
								}
							} else {
								if (d.type == "label_tag") {
									doc[d.label] = [];
									object['tag'][d.label] = doc[d.label];
								} else {
									object[d.label] = "";
								}								
							}
						})
						dataToInsert.push(object);
					});
					if (dataToInsert.length != 0) {
						req.db.SaveData('contentItem', dataToInsert, function(err, result) {
							res.json({
								status : 200,
								msg : "Successfull insert item with id " + dataToInsert.id
							});
						})						
					} else {
						res.status(400).json({
							status : 200,
							msg : "Nothing Data To Insert"
						})
					}
				} else {
					res.status(403).send("Body must be an array");
				}
			} else {
				res.status(404).send("Content Type Not Found");
			}
		});
	}

	this.search = function(req,res,next) {
		var query = req.query.q.split(" ");
		// console.log(query);
		var queryMurni = [];
		query.forEach(function(d) {
			d = new RegExp(d, "gi");
			queryMurni.push(d)
		})
		var where = {
			_id : {
				$in : queryMurni
			}
		}
		
		req.db.find('tag', where, {}, function(err, tag) {
			if (err) throw err;
			var array_label = [];
			var queryTag = [];
			tag.forEach(function(i) {
				if (array_label.indexOf(i.label) == -1) {
					var tag = {};
					tag['tag.' + i['label']] = i._id;
					queryTag.push(tag);
					array_label.push(i.label);
				}
			})
			// console.log(queryTag);
			// queryTag = queryTag.concat({
			// 	title : req.query.q
			// })
			var queryItem = {
				$or : [{
					title : {
						$in : queryMurni.concat(new RegExp(req.query.q, "gi"))
					},
					// 'tag.Keyword' : {
					// 	$in : queryMurni.concat(new RegExp(req.query.q, "gi"))
					// }
				}]
			};
			if (queryTag.length != 0) {
				queryItem['$or'] = [];
				queryItem['$or'].push({
					$and : queryTag
				})
			}

			req.db.find('contentItem', queryItem, {}, function(err, item) {
				// console.log(err);
				res.json({error : err, data : item});
			})
		})
	}
}
module.exports = Content;