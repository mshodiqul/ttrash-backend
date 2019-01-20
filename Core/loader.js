const express = require('express'),
	app = express(),
	http = require('http').Server(app),
	io = require('socket.io')(http,{pingTimeout: 30000}),
	mode = process.env.NODE_ENV || 'dev',
	bodyParser = require('body-parser'),
	async = require('async'),
	path = require('path'),
	cookieParser = require('cookie-parser'),
	routes = require('../App/routes');

var autoload = require('../App/config/autoload.json');
autoload = autoload[mode] || autoload['dev'];
const fs = require('fs');
var config_database;
var setup = false;
var status_db = false;
var err_db = '';

const session = require('express-session');
var config_session = require('../App/config/session.json');
config_session = config_session[mode] || config_session['dev'];
var configApp = require('../App/config/app.json')[mode] || require('../App/config/app.json')['dev'];

function Duku() {	
	this.app = app;
	this.db = null;

	this.run = function () {
		configApp.app.host = process.env.OPENSHIFT_NODEJS_IP || configApp.app.host;
		configApp.app.port = process.env.OPENSHIFT_NODEJS_PORT || process.env.PORT || configApp.app.port;
		// app.listen(configApp.app.port, configApp.app.host,  function() {
		// 	console.log("Application Running On " + configApp.app.host + ":" + configApp.app.port);
		// });
		http.listen(configApp.app.port, configApp.app.host, function(){
			console.log("Application Running On " + configApp.app.host + ":" + configApp.app.port);
		});
	}

	this.webSocket = function (db) {
		const ModelUser = db.collection('users');
		const ModelHistoryOrder = db.collection('history_order');
		const ModelHistoryUser = db.collection('history_user');
		const ModelOrder = db.collection('order');
		const ModelSite = db.collection('site');

		const shortid = require('shortid');

		function getTanggal () {
			var now = new Date(); 
			var now_utc = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(),  now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds());
			return  now_utc;
		}
		io.sockets.on('connection', (socket) => {

			socket.on('requestSampah', (info) => {
				io.emit('requestSampah', info);
			});

			// request driver
			socket.on('requestDriver', (info) => {
				console.log('server menerima kiriman dari client');
				// console.log(info);
				ModelUser.update({_id : info.id_driver }, { $set : { status : 'aktif' }}, (err, rows) => {
					io.emit('requestDriver',info);
				});
			});

			socket.on('confirm', (data) => {
				// ModelUser.update({_id : data.id_driver }, { $set : { status : 'aktif' }}, (err, rows) => {
				ModelOrder.update({id_order : data.id_order},{ $set : { status : 'confirm'}}, (err, doc) => {
					io.emit('confirm', data);
				});
				// });
			});

			socket.on('cancelOrder', (data) => {
				async.parallel([
					function (callback) {
						ModelOrder.update({id_order : data.id_order},{ $set : { status : 'cancel'}}, (err, doc) => {
							return callback(err, doc);
						});
					},
					function (callback) {
						ModelUser.update({_id : data.id_driver}, { $set : { status : 'online'}}, (err, row) => {
							return callback(err,row);
						});
					},
					function (callback) {
						ModelSite.findOne({id : 1 }, (err, site) => {
							if (err) return callback(err, site);
							let point = parseInt(site.point);
							let obj = {
								id : shortid.generate(),
								userid : data.customer_id,
								name : data.customer_name,
								id_driver : data.id_driver,
								driver : data.driver,
								type : data.type,
								tanggal : getTanggal(),
								point : point,
								status : 'cancel'
							}
							if (data.params == "sampah") {
								obj['lokasi_awal'] = data.alamat;
								obj['lokasi_akhir'] = "-";
							} else {
								obj['lokasi_awal'] = data.alamatBarang;
								obj['lokasi_akhir'] = data.alamatTujuan;
							}
							ModelHistoryUser.insert(obj, (err, row) => {
								return callback(err,row);
							});
						});
					}
				], (err, results) => {
					io.emit('cancelOrder', data);
				});
			});

			socket.on('selesaiJemput', (data) => {
				io.emit('selesaiJemput', data);
			})

			socket.on('selesai', (data) => {
				// console.log(data);
				ModelUser.update({_id : data.id_driver}, { $set : { status : 'online'}}, (err, rows) => {
					ModelOrder.update({id_order : data.id_order},{ $set : { status : 'done'}}, (err, doc) => {
						delete data.status;
						async.parallel([
							function (callback) {
								ModelSite.findOne({id : 1 }, (err, site) => {
									if (site) {
										return callback(null, site.point);
									}
								});
							},
							function (callback) {
								ModelUser.findOne({_id : data.customer_id}, (err, dataUser) => {
									if (dataUser) return callback(null, dataUser);
								});
							},
							function (callback) {
								ModelUser.findOne({_id : data.id_driver}, (err, dataUser) => {
									if (dataUser) return callback(null, dataUser);
								});
							},
						], (err, hasil) => {
							let point = parseInt(hasil[0]);
							let totalPoint = point+hasil[1].point;
							// console.log('total point user sekarang '+ totalPoint);
							async.parallel([
								function (callback) {
									// if (data.params == "sampah") {
									// 	ModelUser.update({_id : data.customer_id }, { $inc : { point : point }}, (err, docs) => {
									// 		return callback(err, docs);
									// 	});
									// } else {
										return callback(null,"OK");
									// }
								},
								function (callback) {
									data['tanggal'] = getTanggal();
									ModelHistoryOrder.insert(data, (err, result) => {
										io.emit('selesai', data);
									});
								},
								function (callback) {
									if (data.params == "barang") {
										let totalPoint2 = parseInt((point+hasil[2].point) - data.biaya);
										// console.log('total point driver sekarang '+ totalPoint2);
										ModelUser.update({_id : data.id_driver }, { $set : { point : totalPoint2 }}, (err, docs) => {
											return callback(err, docs);
										});
									}
								},
								function (callback) {
									let obj = {
										id : shortid.generate(),
										userid : data.customer_id,
										name : data.customer_name,
										id_driver : data.id_driver,
										driver : data.driver,
										type : data.type,
										tanggal : getTanggal(),
										point : point,
										status : 'sukses'
									}
									if (data.params == "sampah") {
										obj['lokasi_awal'] = data.alamat;
										obj['lokasi_akhir'] = "-";
									} else {
										obj['lokasi_awal'] = data.alamatBarang;
										obj['lokasi_akhir'] = data.alamatTujuan;
									}
									ModelHistoryUser.insert(obj, (err, row) => {
										return callback(err,row);
									})
								}
							], (err, hasil) => {
								// console.log(data);
								io.emit('selesai',data);
							});
						});
					});
				});
			});

			socket.on('cekOrder', (info) => {
				ModelOrder.findOne({id_driver : info.id_driver, params : 'barang' , $or : [{status : 'pendding'},{status : 'confirm'}]}, (err, rows) => {
					if (rows != null ) {
						// console.log(rows);
						io.emit('cekOrder',{
							id_driver : info.id_driver,
							data : rows,
						});
					}
				});
			});

			socket.on('logout', (info) => {
				ModelUser.update({_id : info.userid},{ $set : { status : 'offline'}}, (err, rows) => {
					
				});
			});

			socket.on('batalOrder', (info) => {
				// console.log(info);
				ModelOrder.remove({id_order : info.id_order}, (err, row) => {
					// console.log('batal')
				});
			});
		});
	}

	this.connect = function (cb) {
		if (fs.existsSync('./App/config/database.json')) {
			config_database = require('../App/config/database.json');
			config_database = config_database[mode];
			// console.log('iki status setup.e')
			// console.log(setup);
			if (config_database) {
				var database = require('./database');
				database(function (err , db){
					this.db = db;
					setup = true;
					if (err) {
						status_db = false;
						err_db = err;
					} else {
						status_db = true;
					}
					return cb(err , db);
				});
			} else {
				setup = false;
				status_db = false;
				return cb('Database Config Not Found', null)
			}
		} else {
			status_db = false;
			return cb('Database Config Not Found', null)
		}
	}

	this.initDatabase = function() {
		if (setup == true) {
			app.use(this.database);
		}
	}

	this.database = function(req, res, next) {
		var driver = require('./driver/' + config_database.driver);
		req['db'] = new driver(this.db);
		next();
	}

	// config session , passport , redis 
	this.initSession = function () {
		if (config_session.redis != undefined ) {
			var	redisStore = require('connect-redis')(session);
			var redis = require('redis').createClient();
			app.use(session({
				secret : config_session.session.secret,
				store : new redisStore({
					host : config_session.redis.host.toString(),
					port : config_session.redis.port,
					saveUninitialized : config_session.session.saveUninitialized,
					resave : config_session.session.resave,
					client : redis,
					db : config_session.redis.db
				}),
				resave : config_session.session.resave
			}));
		} else if (config_session.mongodb != undefined) {
			var MongoStore = require('connect-mongo/es5')(session);
			config_database = require('../App/config/database.json');
			config_database = config_database[mode];
			var url = "";
			var db_session = config_session.mongodb.db;
			if ( (config_session.mongodb.user == '' || config_session.mongodb.user == undefined ) && (config_session.mongodb.password == '' || config_session.mongodb.password == undefined )) {
				url = process.env.OPENSHIFT_MONGODB_DB_URL || 'mongodb://'+config_session.mongodb.host+':' + config_session.mongodb.port + '/'+db_session;
			} else {
				url = process.env.OPENSHIFT_MONGODB_DB_URL || 'mongodb://'+config_session.mongodb.user+':'+config_session.mongodb.password+'@'+config_session.mongodb.host+':' + config_session.mongodb.port + '/'+db_session;
			}
			app.use(session({
				secret: config_session.session.secret,
				// cookie: { maxAge: 24 * 60 * 60  },
				store: new MongoStore({
					url: url
				}),
				saveUninitialized: config_session.session.saveUninitialized,
				resave : config_session.session.resave
			}));
		} else {
			app.use(session({
				secret : config_session.session.secret,
				saveUninitialized : config_session.session.saveUninitialized,
				resave : config_session.session.resave
			}));
		}

		// if (setup == true) {
			if (config_session.passport != undefined ) {
				if (config_session.passport.auth == true ) {
					var authPassport = require('../App/plugins/passport');
					var initPassport = new authPassport();
					var passport = initPassport.getPassport();
					app.use(passport.initialize());
					app.use(passport.session());
					initPassport.passportInit();
				}
			}
		// }
	}

	this.initAutoLoad = function() {
		// if (setup == true) {
			app.use(this.autoload);
		// }
	}

	this.initDuku = function () {
		const favicon = require('serve-favicon');

		app.use(bodyParser.json());
		app.use(bodyParser.urlencoded({ extended: false }));
		// ## SETTING VIEW ENGINE & CSS PRECOMPILER
		var target = path.normalize(__dirname+'/..');
		app.use(favicon(target + '/App/public/favicon.ico'));
		var SetupHandler = require('./setup'), Setup = new SetupHandler();
		app.set('views', path.join(target, './App/views'));
		app.set('view engine', 'jade');
		app.use(require('stylus').middleware(path.join(target, './App/public')));
		app.use("/bower", express.static(path.join(__dirname, '../bower_components')));

		app.use(express.static(path.join(target, './App/public')));
		app.use(cookieParser('sessionavocadotetttt'));
		app.use(function (req , res , next ) {
			res.header("Access-Control-Allow-Origin", "*");
			res.header("Access-Control-Allow-Headers", "X-Requested-With");
			// res.header("Access-Control-Allow-Credentials", "true");
			next();
		});
		if (status_db) {
			routes(app, io);
		} else {
			app.all('*', function (req , res , next) {
				return res.render('mongodError');
			});
		}
	}

	this.autoload = function(req , res , next ) {
		var plugins = autoload.plugins || null;
		var features = autoload.features || null;
		req['plugin'] = {};
		if (plugins != null) {
			plugins.forEach(function (plugin) {
				var module = require('../App/plugins/' + plugin);
				req['plugin'][plugin] = new module;
			});
		}

		if (features != null) {
			features.forEach(function (feature) {
				var module = require('../App/features/' + feature);
				req[feature] = new module;
			});
		}
		next();
	}
}

module.exports = Duku;
