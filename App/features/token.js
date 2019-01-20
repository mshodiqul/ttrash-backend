function Token() {
	var moment = require('moment');
	var crypto = require('crypto'),
		algorithm = 'sha256',
		password = 'mt4czpcdsjdjprrec';

	this.encrypt = function(req, text, user, callback){
		var hash = crypto.createHmac(algorithm, password).update(text).digest("hex");
		var time = moment().unix();
		req.db.SaveData('api_token', {hash : hash, time : time, user : user}, function (err, result) {
			if (err) throw err;
			callback(hash);
		})
	}
	 
	this.decrypt = function(req, text, callback){
		req.db.findOne('api_token', {hash : text}, function (err, result) {
			// console.log(result);
			if (err) return res.json({status : 503 , pesan : 'Not Proses'});
			if (result) {
				var timeSaiki = moment().unix();
				var hasil = parseInt(timeSaiki-result.time, 10);
				// if ((3600 - hasil) > 0) {
				// console.log('jupuk data user')
				req.db.findOne('users', {_id : result.user }, function (err, hasilUser) {
					if (err) return res.json({status : 503 , pesan : 'Not Proses'});
					// if (err) throw err;
					if (hasilUser) {
						// console.log('data user ono');
						delete hasilUser.password;
						hasilUser['token'] = result.hash;
						// return callback(result.hash);
						return callback(hasilUser);
					} else {
						// console.log('data user ora ono');
						return callback(null);
					}
				});
				// } else {
				// 	return callback(null);
				// }
			} else {
				return callback(null);
			}
		})
	}
}
module.exports = Token;