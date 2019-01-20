var validator = require('email-validator');

function Validasi() {

	this.ValidEmail = function (email ) {
		var status = validator.validate(email);
		return status;
	}
}
module.exports = Validasi;