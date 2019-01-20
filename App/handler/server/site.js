function Site () {

	this.index = function (req , res , next ) {
		const userLogin = req.user;
		req.db.findOne('site', {} , function (err , hasil){
			req.db.find('users', {} , { sort : { _id : 1 }}, function (err , User){
				return res.render('panel/site',{
					hasil : hasil,
					user : User,
					role_group : userLogin.role_group[0],
				});
			});
		});
	}

	this.SimpanSite = function (req ,res , next ) {
		var b = req.body;
		var data = JSON.parse(b.data)
		var data = {
			site_name : data.name,
			description : data.desc,
			tagline : data.tagline,
			admin : data.admin,
			point : data.point,
			harga : data.harga,
			fee : data.fee,
			// reSiteKey : data.reSiteKey,
			// reSecretKey : data.reSecretKey
		}
		req.db.find('site',{} , {} , function (err , rows){
			if (rows.length == 0) {
				data['id'] = 1;
				req.userLog.insert(req, "Menambah Site Baru");				
				req.db.SaveData('site',  data , function (err , doc){
					return res.json('sukses');
				})
			} else {
				req.userLog.insert(req, "Mengubah Site");				
				req.db.update('site', {id : 1}, {$set : data }, function (err , doc){
					return res.json('sukses');
				});
			}
		})
	}

}
module.exports = Site;