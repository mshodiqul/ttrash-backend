function Task () {
	const Expo = require('expo-server-sdk');
	const request = require('request');

	this.registerToken = (req, res, next) => {
		const b = req.body;
		// console.log('register token sedang di proses ');
		// console.log(b);
		const session = b.session;
		if (session != null) {
			const ModelTokenDevice = req.db.collection('tokenDevice');
			let userid = session.username;
			req.db.findOne('tokenDevice', ({ token : b.token }), (err, cek) => {
				if (err) return res.json({status : 503, pesan : 'server sedang masalah ' , token : b.token});
				if (cek == null) {
					// console.log('token belum terdaftar')
					let data = {
						id : req.generate.GetId(),
						userid : userid,
						token : b.token,
						created_at : req.generate.Tanggal()
					}
					req.db.SaveData('tokenDevice', data, (err, rows) => {
						if (err) return res.json({status : 503, pesan : 'server sedang masalah ', token : b.token});
						return res.json({status : 200 , token : b.token});
					});
				} else {
					// console.log('token sudah terdaftar')
					ModelTokenDevice.update({userid : userid }, { $set : { token : b.token}},{ multi : true}, (err, doc) => {
						return res.json({status : 402 , pesan : 'token sudah terdaftar' , token : b.token});
					});
				}
			});
		}
	}

	this.pushNotification = (req, res, next) => {
		const b = req.body;
		let id_receiver = b.id_receiver;
		let body = b.message;
		let data = b.data;
		// console.log(b);
		// console.log(body);
		req.db.findOne('tokenDevice',{userid : id_receiver}, (err, rows) => {
			if (rows != null ) {
				// console.log(rows);
				let formData = {
					to: rows.token, 
					sound: 'default',
					// title : 'Sangkuts',
					body: body,
					data : data,
				};
				let options = {
					url: 'https://exp.host/--/api/v2/push/send',
					method : 'POST',
					headers: {
						'accept': 'application/json',
						'accept-encoding': 'gzip, deflate',
						'content-type': 'application/json'
					}
				};
				// console.log(formData);
				request.post({
					url : 'https://exp.host/--/api/v2/push/send',
					form: formData,
					headers: {
						'accept': 'application/json',
						'accept-encoding': 'gzip, deflate',
						'content-type': 'application/json'
					}
				}, (err, httpResponse, body) => {
					// console.log(err, body);
				});
			}
		});
	}

	this.listTokenDevice = (req, res, next) => {
		req.db.find('tokenDevice',{},{}, (err, rows) => {
			if (err) return res.json({status : 503, pesan : 'server sedang masalah '});
			return res.json({status : 200, data : rows});
		});
	}
}

module.exports = Task;