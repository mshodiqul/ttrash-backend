function Attach() {
	var fs = require('fs');
	this.use = function(req, callback) {
		req.db.find('attach', {}, {}, function(err, hasil) {
			var elementHeader = "";
			var elementFooter = "";
			hasil.forEach(function(doc) {
				if (doc.location == "header") {
					elementHeader += doc.code;
				}
				else {
					elementFooter += doc.code;
				}
			})
			return callback({header : elementHeader, footer : elementFooter});
		})
	}
}
module.exports = Attach;