function UserLog() {
	this.insert = function(req, desc) {
		var data = {};
		if (data) {
			data._id = req.generate.GetId();
			data.user = req.user ? req.user._id : "Anonymouse";
			data.description = desc || "No Description";
			data.time = req.generate.Tanggal();
		}
		req.db.SaveData('userLog', data, function(err, hasil) {
			if (err) {
				console.error(err);
				next(err);
			}
		})
	}
}
module.exports = UserLog;