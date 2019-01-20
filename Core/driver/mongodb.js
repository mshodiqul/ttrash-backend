function MongoDB () {
	var mode = process.env.NODE_ENV || 'dev';
	var mongoDB = require('mongodb').MongoClient;
	var configDB = require('../../App/config/database.json');
	var config = configDB[mode] || configDB['dev'];
	var assert = require('assert');

	this.connect = function (cb) {
		if (config.mongodb != undefined ) {
			if ( ( config.mongodb.connection.user == '' || config.mongodb.connection.user == undefined ) && ( config.mongodb.connection.pwd == '' || config.mongodb.connection.pwd == undefined) ) {
				var mongouri = process.env.MONGODB_DB_URL || 'mongodb://' + config.mongodb.connection.host + ':' + config.mongodb.connection.port + '/';
				
				mongoDB.connect(mongouri+config.mongodb.connection.db ,{ native_parser: true },  function (err , db){
					assert.equal(null, err)
					// db.collection('session').findOne((err, session) => console.log(session))
					return cb(err, db);
				});
			} else {
				var mongouri = process.env.MONGODB_DB_URL || 'mongodb://'+config.mongodb.connection.user+':'+config.mongodb.connection.pwd+'@'+config.mongodb.connection.host+':'+config.mongodb.connection.port+'/';
				mongoDB.connect(mongouri+config.mongodb.connection.db, function (err , db){
					return cb(err, db);
				});
			}
		} else {
			return cb('connection null', null);
		}
	}

	this.ShowCollection = function (callback) {
		return db.listCollections().toArray(callback);		
	}

	this.collection = function(model) {
		return db.collection(model);
	}

	this.SaveData = function (model , data , callback ) {
		return db.collection(model).insert(data , callback);
	}

	this.find = function(model, where, options, callback) {
		var query = options;
		if (query == null) {
			return db.collection(model).find(where).toArray(callback);
		} else {
			var limit = options.limit || 0;
			var skip = options.skip || 0;
			var sort = options.sort || {_id : 1};
			return db.collection(model).find(where).sort(sort).skip(skip).limit(limit).toArray(callback);
		}
	}

	this.findOne = function(model, where, callback) {
		return db.collection(model).findOne(where, callback);
	}

	this.update = function(model, where, data, callback) {
		return db.collection(model).update(where, data , { multi : true }, callback);
	}

	this.remove = function(model, where, callback) {
		return db.collection(model).remove(where, callback);
	}

	this.drop = function(model, callback) {
		return db.collection(model).drop(callback);
	}

	this.count = function (model , where , callback) {
		return db.collection(model).count(where,callback);
	}

	this.aggregate = function(model, where, group, options, callback) {
		var advanced = options;
		if (advanced != null) {
			advanced.sort = options.sort || {_id : 1};
			advanced.limit = options.limit || 0;
			advanced.skip = options.skip || 0;
		}
		return db.collection(model).aggregate([{$match : where}, {$group : group}, {$sort : advanced.sort}, {$limit : advanced.limit}, {$skip : advanced.skip}], callback);
	}
}

module.exports = MongoDB;