function About () {

	this.index = (req, res, next) => {
		req.db.findOne('about',{}, (err, rows) => {
			console.log('about');
			if (err || rows == null) return res.json({status : 500});
			return res.json({status : 200 , data : rows});
		});
	}
}

module.exports = About;