function Logger () {
	
	this.error = function (pesan, status, cb) {
		var err = new Error (pesan);// {message:'Are you lost ? '};
		err.status = status;
		// console.log ('errornya : '+err.message);
		return cb (err);
	}
}

module.exports = Logger;