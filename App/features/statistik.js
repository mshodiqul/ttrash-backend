function Statistik() {
	var moment = require('moment');
	this.setStatistik = function(req, id_item, Model, options, cb) {	
		var ip = options.ip || null;
		var referer = options.ref || 'direct';
		var user = options.user || 'guest';
		var domain = options.domain || '::1';

		var dataStat = {
			id_item : id_item,
			time : moment().format("YYYY-MM-DD HH:mm:ss"),
			source : ip,
			referal : referer,
			domain : domain,
			user : user
		}

		Model.findOne({id_item : id_item, source : ip}, function (err, doc) {
			if (err) return cb(err, null);
			if (!doc) {
				Model.insert(dataStat, function (err, inserted) {
					if (err) return cb(err, null);
				});
			} else {
				Model.insert(dataStat, function (err, updated) {
					if (err) return cb(err, null);
				});
			}
			return cb(null, 'added');
		});
	}
}
module.exports = Statistik;