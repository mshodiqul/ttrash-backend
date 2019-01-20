function User() {
	const bcrypt = require('bcrypt-nodejs');
	const moment = require('moment');
	const async = require('async');
	moment.locale('id');

	this.Payout = (req, res, next) => {
		const b = req.body;
		console.log(b);
		let data = {
			_id : req.generate.GetId(),
			rekening : b.rekening,
			bank : b.bank,
			cabang : b.cabang,
			nama : b.nama,
			total : b.total,
			time_added : req.generate.Tanggal(),
			author : b.userid,
			status : 'pendding',
			bank_sampah : b.bank_sampah,
		}
		async.parallel([
			function (callback) {
				let point = parseInt(b.point - b.total);
				req.db.update('users',{_id : b.userid},{$set : { point : point}}, (err, rows) => {
					return callback(err, rows);
				})
			},
			function (callback) {
				req.db.SaveData('payout',data, (err, rows) => {
					return callback(err, rows);
				});
			}
		], (err, results) => {
			if (err) return res.json({status : 503, pesan : 'terjadi kesalahan pada server'});
			return res.json({status : 200, data : data});
		})
	}

	this.checkBank = (req, res, next) => {
		const b = req.body;
		req.db.findOne('rekening',{ userid : b.userid }, (err, rows) => {
			return res.json({status : 200 , data : rows});
		});
	}

	this.addBank = (req, res, next) => {
		const b = req.body;
		let data = {
			_id : req.generate.GetId(),
			userid : b.userid,
			rekening : b.rekening,
			bank : b.bank,
			cabang : b.cabang,
			atas_nama : b.atas_nama,
			bank_sampah : b.bank_sampah,
			created_at : req.generate.Tanggal()
		}
		req.db.findOne('rekening', {userid : b.userid}, (err, rows) => {
			if (rows == null) {
				req.db.SaveData('rekening',data , (err, rows) => {
					if (err) return res.json({status : 503, pesan : 'terjadi kesalahan pada server'});
					return res.json({status : 200, data : data});
				});
			} else {
				req.db.update('rekening',{userid : b.userid },{
					$set : {
						rekening : b.rekening,
						bank : b.bank,
						cabang : b.cabang,
						atas_nama : b.atas_nama,
						bank_sampah : b.bank_sampah,
					}
				}, (err ,doc) => {
					return res.json({status : 200, data : data});
				});
			}
		})
	}

	this.getHistory = (req, res, next ) => {
		var limit = parseInt(req.query.limit) || 10;
		var skip = parseInt(req.query.skip) || 1;
		var sort = req.query.sort || 'tanggal';
		let pageSize = limit;
		let currentPage = skip;
		let offset = pageSize * (currentPage - 1);
		console.log(req.query);
		// console.log("offset ===> "+ offset);
		const b = req.body;
		req.db.find('history_user',{ userid : b.userid}, { sort : { tanggal : -1 }, limit : limit, skip : offset }, (err, results) => {
			// console.log("ERROR history_user 1 ", err);
			if (err) return res.json({status : 503, pesan : 'terjadi kesalahan pada server'});
			req.db.count('history_user', {userid : b.userid} , (err, Jumlah) => {
				// console.log("ERROR history_user 2 ", err);
				let pageCount = Math.ceil(Jumlah/pageSize);
				console.log('Jumlah ===> '+ Jumlah);
				return res.json({status : 200, data : results, pageCount : pageCount});
			});
		});
	}

	this.detailHistory = (req, res, next) => {
		const id_order = req.body.id_order;
		req.db.findOne('order',{id_order : id_order }, (err, rows) => {
			if (err) return res.json({status : 503});
			return res.json({status : 200 , data : rows});
		})
	}

	this.updateStatus = (req, res, next) => {
		const b = req.body;
		let status = "";
		switch(b.status) {
			case 0 : 
				status = "offline";
			break;
			case 1 :
				status = "online";
			break;
		}
		req.db.update('users',{_id : b.userid }, { $set : { status : status }}, (err, rows) => {
			return res.json({status : 200});
		});
	}

	this.checkToken = function(req,res,next) {
		var tokenMentah = req.query.token || req.headers.token || req.body.token;
		if (tokenMentah) {
			req.token.decrypt(req, tokenMentah, function (token) {
				if (token) {
					req.dataUser = token;
					next();
				} else {
					return res.json({status : 403 , pesan : 'Access Token Not Valid'});
				}
			});
		} else {
			return res.json({status : 401 , pesan : 'You need access token'});
		}
	}

	this.forgot = (req, res, next) => {
		const b = req.body;
		req.db.findOne('mailler',{}, (err, mailler) => {
			req.db.findOne('users',{email : b.email}, (err, rows) => {
				if (rows) {
					let token = new Buffer(rows.created_at).toString("base64");
					res.render('email_forgot',{
						nama : rows.name,
						email : b.email,
						token : token
					}, (err, html) => {
						let mail = {
							from : 'support@sangkuts.com',
							to : b.email,
							subject : 'Please click link',
							html : html,
						}
						let auth = {
							username : mailler.username,
							password : mailler.password,
							service : mailler.service
						}
						req.mailer.send(auth, mail, (err, hasil) => {
							if (err) console.log("ERR "+ err);
							req.db.update('users',{_id : rows._id },{ $set : { token_forgot : token}}, (err, doc) => {
								if (err) return res.json({status : 503 , pesan : 'terjadi kesalahan pada server'});
								return res.json({status : 200});
							});
						});
					});
				} else {
					return res.json({status : 404, pesan : 'email tidak di temukan '});
				}
			})
		});
	}

	this.daftar = (req, res, next) => {
		const b = req.body;
		let hp = b.hp;
		let profesi = b.profesi;
		let email = b.email;
		let name = b.nama;
		let password = req.generate.password(b.password);
		let created_at = moment().format("YYYY-MM-DD HH:mm:ss");
		let data = {
			id : req.generate.GetId(),
			name : name,
			_id : hp,
			email : email,
			verified : false,
			hp : hp,
			profesi : profesi,
			point : 0,
			password : password,
			status : 'offline',
			role_group : ['user'],
			bank_sampah : b.bank_sampah,
			created_at : created_at,
			lokasi : {}
		}
		console.log(data);
		req.db.findOne('users',{ _id : hp }, (err, cek) => {
			if (cek == null) {
				let token = new Buffer(data.created_at).toString("base64");
				data['token_register'] = token;
				req.db.findOne('mailler',{}, (err, mailler) => {
					res.render('email_body',{
						nama : name,
						email : email,
						token : token
					}, (err, html) => {
						let mail = {
							from : 'support@sangkuts.com',
							to : email,
							subject : 'Please verify your email address',
							html : html
						}
						let auth = {
							username : mailler.username,
							password : mailler.password,
							service : mailler.service
						}
						req.mailer.send(auth, mail, (err, hasil) => {
							if (err) console.log("ERROR "+err);
							req.db.SaveData('users',data, (err, rows) => {
								if (err) return res.json({status : 503 , pesan : 'terjadi kesalahan pada server'});
								return res.json({status : 200});
							});
						});
					});
				});
			} else {
				return res.json({status : 403 , pesan : 'nomor sudah di gunakan, silahkan gunakan nomor lain'});
			}
		})
	}

	this.placeForgot = (req, res, next) => {
		const data = req.query;
		if (!data.token) return next();
		const base64regex = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;
		
		if (base64regex.test(data.token) == false) {
			return next()
		}

		var created_at = new Buffer(data.token, 'base64').toString('ascii');
		var emailnya = data.email;// || 'steamhdmovies@gmail.com';
		var token = moment(moment(created_at).add(24,'hours')._d).format("YYYY-MM-DD HH:mm:ss");

		req.db.findOne('users',{$and : [{email : data.email, created_at : created_at}, {email : data.email, created_at : {$lte : token}}]}, (err , doc) => {
			if (err) return res.json(null);
			if (doc != null ) {
				return res.render('forgot',{
					email : emailnya,
					title : 'Ganti Password'
				});
			} else {
				return res.send('Not Found');
			}
		});
	}

	this.prosesForgot = (req, res, next) => {
		const b = req.body;
		var password = req.generate.password(b.password);
		req.db.update('users',{email : b.email}, { $set : { password : password }}, (err, rows) => {
			if (err) return res.json({status : 'gagal' , pesan : 'data gagal di proses'});
			return res.json({status : 'sukses'});
		})
	}

	this.verify = (req, res, next) => {
		const data = req.query;
		if (!data.token) return next();
		const base64regex = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;
		
		if (base64regex.test(data.token) == false) {
			return next()
		}
		
		var created_at = new Buffer(data.token, 'base64').toString('ascii');
		var emailnya = data.email;// || 'steamhdmovies@gmail.com';
		var token = moment(moment(created_at).add(24,'hours')._d).format("YYYY-MM-DD HH:mm:ss");
		req.db.findOne('users',{$and : [{email : data.email, created_at : created_at}, {email : data.email, created_at : {$lte : token}}], verified : false}, (err , doc) => {
			if (err) return res.json(null);
			if (doc != null ) {
				req.db.findOne('mailler',{}, (err, mailler) => {
					res.render('mailing', {
						nama : '',
						pesan : "Your e-mail successfully verified",
						desc : "Your e-mail <b> " + emailnya + " </b> Has been verified by bang sampah",
					}, (err, hasilHtml) => {
						let mail = {
							from : 'support@sangkuts.com',
							to : emailnya,
							subject : 'Your e-mail successfully verified',
							html : hasilHtml,
							text : "Your e-mail successfully verified"
						}
						let auth = {
							username : mailler.username,
							password : mailler.password,
							service : mailler.service
						}
						req.mailer.send(auth, mail, function (error, response) {
							if(error) {
								console.log(error);
							} else {
								console.log("Pesan terkirim : " + response.response);
							}
						});
						req.db.update('users',{email : emailnya, verified : false}, { $set : { verified : true}}, (err, rows) => {
							return res.render('verified',{
								verified : true,
							});
						});
					});
				});
			} else {
				return res.render('verified',{
					verified : true,
				});
				// return res.send('akun sudah verifikasi');
			}
		})
	}

	this.logout = (req, res, next) => {
		let username = req.body.username;
		req.db.update('users',{_id : username }, { $set : { status : 'offline'}}, (err, rows) => {
			return res.json('sukses');
		});
	}

	this.login = function(req,res,next) {
		const b = req.body;
		const username = b.username;
		const password = b.password;
		let query = {};
		if (b.type == "driver") {
			query = {
				_id : username,
				role_group : {
					$in : ['driver sampah']
				}
			}
		} else {
			query = {
				_id : username,
				role_group : {
					$in : ['user']
				}
			}
		}
		req.db.findOne('users', query , function (err, data) {
			if (err) return res.json({status : 404, pesan : "user tidak di temukan"});
			if (data) {
				if (data.verified) {
					if (bcrypt.compareSync( password , data.password ) ) {
						const token = req.generate.GetId() + "#" + moment().format("YYYY-MM-DD HH:mm:ss") + "#" + username + "#" + moment().unix();
						req.token.encrypt(req, token, username, function (dataToken) {
							const dataUser = {
								username : data._id,
								nama : data.name,
								email : data.email,
								profesi : data.profesi,
								role_group : data.role_group,
								hp : data.hp,
								type : b.type,
								status : data.status,
								token : dataToken,
								bank_sampah : data.bank_sampah,
								expired : 3600,
								status : 200
							}
							req.db.update('users',{_id : data._id}, { $set : { status : 'online'}}, (err, doc) => {
								return res.json(dataUser);
							});
						});
					} else {
						return res.json({status : 401, pesan : "password tidak cocok"});
					}
				} else {
						return res.json({status : 401, pesan : "akun anda belum diverifikasi"});
				}
			} else {
				return res.json({status : 404, pesan : "user tidak di temukan"});
			}
		})
	}

	this.info = function(req,res,next) {
		const b = req.body;
		req.db.findOne('users',{_id : b.userid}, (err, rows) => {
			if (err) return res.json({status : 402, pesan : 'terjadi kesalahan pada server'});
			if (rows == null) {
				return res.json({status : 404, pesan : 'data tidak di temukan '});
			} else {
				return res.json({status : 200, data : rows});
			}
		});
	}
}
module.exports = User;