function About () {

	this.index = (req, res, next) => {
		const userLogin = req.user;
		req.db.findOne('about',{}, (err, rows) => {
			return res.render('panel/about',{
				role_group : userLogin.role_group[0],
				data : rows
			});
		});
	}

	this.prosesData = (req, res, next) => {
		const b = req.body;
		req.db.findOne('about',{}, (err, rows) => {
			if (rows == null ) {
				let data = {
					_id : '1',
					desc : b.desc
				}
				req.db.SaveData('about',data , (err, doc) => {
					if (err) return res.json({stats :500 , pesan : 'data gagal di proses'});
					return res.json({status : 200 });
				})
			} else {
				req.db.update('about',{},{$set : { desc : b.desc}}, (err, rows) => {
					if (err) return res.json({stats :500 , pesan : 'data gagal di proses'});
					return res.json({status : 200 });
				});
			}
		});
	}
}

module.exports = About;