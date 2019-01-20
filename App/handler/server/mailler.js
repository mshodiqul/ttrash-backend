function MaillerHandler () {

	this.index = function (req , res , next ) {
		req.db.findOne('mailler', {}, function (err , results){
			return res.render('panel/mailler',{
				dataEmail : results
			});
		});
	}

	this.SimpanEmail = function (req , res , next ) {
		var b = req.body;
		var data = JSON.parse(b.email);
		// console.log(data);
		req.db.remove('mailler',{_id : '1' } , function (err , rows){
			if (err) return res.json({status :'gagal', pesan : 'Email Gagal di Simpan !!!'});
			req.db.SaveData('mailler',{_id : '1', email : data} , function (err , doc){
				if (err) return res.json({status :'gagal', pesan : 'Email Gagal di Simpan !!!'});
				return res.json({status : 'sukses'});
			});
		});
	}

	this.SimpanService = function (req , res , next ) {
		var b = req.body;
		req.db.findOne('mailler', { _id : '1'} , function (err , cek){
			if (cek == null ) {
				var data = {
					_id : '1',
					email : [],
					username : b.username,
					password : b.password,
					service : b.service
				}
				req.db.SaveData('mailler', data , function (err , rows){
					if (err) return res.json({status :'gagal', pesan : 'Service Gagal di Simpan !!!'});
					return res.json({status : 'sukses'});
				});
			} else {
				req.db.update('mailler',{ _id : '1'} , {$set : { username : b.username , password : b.password , service : b.service}}, function (rows){
					if (err) return res.json({status :'gagal', pesan : 'Service Gagal di Simpan !!!'});
					return res.json({status : 'sukses'});
				});
			}
		})
	}

	this.SendMessage = function (req , res , next ) {
		var b = req.body;
		var nama = b.nama;
		var phone = b.phone;
		var email = b.email;
		var pesan = b.pesan;
		req.db.findOne('mailler',{} , function (err , Service){
			var username = Service.username;
			var  password = Service.password;
			var service = Service.service;
			console.log(Service);
			var smtpConfig = {
				service : "gmail",
				auth: {
					user: 'order.harryhonda@gmail.com',
					pass: 'userbaru'
				}
			};
			var options = {
				from : nama +' no-replay@harryhonda.com',
				replyTo : email,
				to : Service.email,
				subject : 'Contact From Your Website',
				html : pesan,
			}
			
			req.plugin.mailler.sendMessage(smtpConfig , options , function (err , info ){
				console.log(err);
				if (err) return res.json({status : 'gagal' , pesan : 'Pesan Gagal di Kirim !!!'});
				return res.json({status : 'sukses'});
			});
		});
	}
}

module.exports = MaillerHandler;