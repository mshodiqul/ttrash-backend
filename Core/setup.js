function Setup() {
	var mongodb = require('mongodb');
	var fs = require('fs');
	var path = require('path');
	var jsonfile = require('jsonfile');
	var bcrypt = require('bcrypt-nodejs');
	var shortid = require('shortid');
	var salt = bcrypt.genSaltSync();
	var restore = require('mongodb-restore');	

	this.index = function(req,res,next) {
		res.render('startup/form-wizard');
	}

	this.setup = function(req,res,next) {
		var params = req.params.step;
		var body = req.body;
		if (params == "website") {
			var tagline = body.tagline.split(",");
			req.session.dataSetup = {};
			req.session.dataSetup.website = {
				site_name : body.website,
				description : body.desc,
				tagline : tagline,
				id : 1
			}
			res.json({status : 200, pesan : 'Berhasil'})
		} else if (params == "database") {
			if (body.driver == "mongodb") {
				var user = "";
				if (body.user != "") {
					user = body.user + ":" + body.password + "@";
				}
				var url = "mongodb://" + user + body.host + ":" + body.port + "/" + body.db;
				mongodb.connect(url, function (err, db) {
					if (err) {
						console.error("Connection Failed", err);
						return res.json({status : 403, pesan : "Connection Failed"})
					}
					else {
						req.session.dataSetup.database = body;
						db.close();
						return res.json({status : 200})
					}
				});
			}
		} else if (params == "start") {
			if (req.session.dataSetup) {
				var database = req.session.dataSetup.database;
				var user = "";
				var userPassImport = "";
				if (database.user != "") {
					user = database.user + ":" + database.password + "@";
					userPassImport = "-u " + database.user + " -p " + database.password;
				}

				var now = new Date(); 
				var now_utc = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(),  now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds());
				var password = bcrypt.hashSync(req.body.upassword,salt);

				req.body.password = password;
				req.body.status = 1;
				req.body.id = shortid.generate();
				req.body.role_group = ["root"];
				req.body.created_at = now_utc;
				delete req.body.upassword;

				var uri = process.env.OPENSHIFT_MONGODB_DB_URL || "mongodb://" + user + database.host + ":" + database.port + "/";
				database.db = process.env.OPENSHIFT_APP_NAME || database.db;
				var url = uri + database.db
				mongodb.connect(url, function(err, db) {
					if (err) {
						console.error("Connection Failed", err);
						return res.json({status : 403, pesan : "Connection Failed"})
					}
					else {
						req.session.dataSetup.website.owner = [req.body._id];
						req.session.dataSetup.website.admin = [];
						// DROPDATABAS;
						// db.dropDatabase();

						db.collection('site').insert(req.session.dataSetup.website, function(err, hasil) {
							if (err) console.error(err);
							console.log("Inserted site detail");
						})
						db.collection('users').insert(req.body, function(err, hasil) {
							if (err) console.error(err);
							console.log("Inserted User in setup");
						})
						restore({
							uri : url,
							root : __dirname + '/defaultDB/dukujs',
							callback : berhasilImport
						});
						function berhasilImport() {
							var dataToWrite = {};
							var mode = process.env.NODE_ENV || 'dev';
							dataToWrite['dev'] = {
								'driver' : database.driver,
								'mongodb' : {
									'connection' : {
										'host' : database.host,
										'port' : database.port,
										'user' : database.user,
										'pwd' : database.password,
										'db' : database.db
									},
								}
							};
							dataToWrite['production'] = dataToWrite['dev'];

							jsonfile.writeFile('./App/config/database.json', dataToWrite, function(err) {
								console.log("Write file configuration database");
								db.close();
								delete req.session.dataSetup;
								return res.json({status : 200})
							})
						}
					}
				})
			}
		}
	}
}
module.exports = Setup;
