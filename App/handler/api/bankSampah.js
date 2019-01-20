function BankSampah () {

	this.index = async (req, res, next) => {
		req.db.find('bank_sampah',{}, { sort : { nama : 1 }}, (err, rows) => {
			console.log('jumlah data bank sampah ===> '+ rows.length);
			if (err) return res.json({status : 500, pesan : err.message});
			return res.json({status : 200, data : rows});
		});
	}
}

module.exports = BankSampah;