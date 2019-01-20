function UserHandler () {
	const moment = require('moment');
	const async = require('async');
	moment.locale('id');

	this.index = function (req , res , next ) {
		const userLogin = req.user;
		const role_group = userLogin.role_group[0];
		async.parallel([
			function (callback) {
				let query = {};
				if (role_group == "admin") {
					query = {
						_id : {
							$nin : ['root','dinas']
						}
					}
				}
				req.db.find('s_group', query ,{ sort : { _id : 1}}, (err, rows) => {
					return callback(err, rows);
				});
			},
			function (callback) {
				req.db.find('bank_sampah', {}, {sort : { nama : 1}}, (err, docs) => {
					return callback(err, docs);
				})
			}
		], (err, results) => {
			if (err) return next(err);
			return res.render('panel/user',{
				group : results[0],
				bankSampah : results[1],
				role_group : role_group,
				id_bankSampah : userLogin.bank_sampah,
			});
		})
	}

	this.FromLogin = function (req , res , next ) {
		return res.render('panel/login',{
			title : 'Login | Bang Sampah Store'
		})
	}

	this.ProccessLogin = function (req , res , next ) {
		req.plugin.passport.Login(req , res , next );
	}

	this.DataTable = function (req , res , next ) {
		const userLogin = req.user;
		const role_group = userLogin.role_group[0];
		let request = req.query;
		let group = req.params.group;
		let bankSampah = req.params.bankSampah;
		const sColumn = ['id','name','_id','email','created_at','updated_at'];
		const kirim = JSON.stringify({"iTotalDisplayRecords":0,"iTotalRecords":0,"aaData":[]});
		var data = [];
		req.plugin.datatable.olahAttr(sColumn , request , function (err , HasilAttr){
			if (err) return res.send(kirim);
			if (group != "all") {
				HasilAttr.where['role_group'] = {
					$in : [group]
				}
			}
			if (role_group == "admin") {
				HasilAttr.where['bank_sampah'] = userLogin.bank_sampah;
			}

			if (bankSampah != "all") {
				HasilAttr.where['bank_sampah'] = bankSampah;
			}
			req.db.find('users', HasilAttr.where , { sort : HasilAttr.order , limit : HasilAttr.limit , skip : HasilAttr.offset }, function (err , results){
				results.forEach(function (i){
					data.push({
						id : i.id,
						name : i.name,
						_id : i._id,
						email : i.email,
						created_at : req.generate.SetTanggal(i.created_at , 'DD MMMM YYYY HH:mm:ss'),
						updated_at : req.generate.SetTanggal(i.updated_at , 'DD MMMM YYYY HH:mm:ss')
					});
				});
				req.db.count('users' ,HasilAttr.where , function (err , jumlah){
					if (err) return res.send(kirim);
					req.plugin.datatable.parsingObjectData( sColumn , request ,data , jumlah  , function (err , output ){
						if (err) return res.send(kirim);
						return res.send(JSON.stringify(output));
					});
				});
			})
		});
	}

	this.Logout = function (req , res , next ) {
		var redirect = '/';
		if (req.header('referer') != undefined )
			redirect = req.header('referer');
		req.logout();
		res.redirect(redirect);
	}

	this.TambahBaru = function (req , res , next ) {
		const userLogin = req.user;
		const role_group = userLogin.role_group[0];
		async.parallel([
			function (callback) {
				let query = {};
				if (role_group == "admin") {
					query = {
						_id : {
							$nin : ['root','dinas','admin']
						}
					}
				}
				req.db.find('s_group', query ,{ sort : { group_name : 1 }}, (err, rows) => {
					return callback(err, rows);
				})
			},
			function (callback) {
				let queryBank = {};
				if (role_group == "admin") {
					queryBank = {
						_id : userLogin.bank_sampah,
					}
				}
				req.db.find('bank_sampah', queryBank , {sort : { nama : 1}}, (err, BankSampah) => {
					return callback(err, BankSampah);
				});
			}
		], (err, results) => {
			if (err) return next("ERROR");
			const elmSelect = req.generate.elementOption(results[0], { name : '_id'});
			const elmBank = req.getArray.CreateElementSelect(results[1] , "tambah" , "nama");
			var obj = [{
				id : 'name',
				label : 'Nama',
				type : 'text'
			},{
				id : 'profesi',
				label : 'Profesi',
				type : 'text'
			},{
				id : 'hp',
				label : 'No. Telp',
				type : 'text'
			},{
				id : 'email',
				label : 'Email',
				type : 'text'
			},{
				id : 'password',
				label : 'Password',
				type : 'password'
			},{
				id : 'role_group',
				label : 'Group',
				type : 'select',
				element : elmSelect
			},{
				id : 'bank_sampah',
				label : 'Bank Sampah',
				type : 'select',
				element : elmBank
			}];
			var tombol = {
				'tambah' : {
					kelas : 'simpan',
					label : 'Simpan',
					url : '/manage/user/simpan'
				}
			}
			return res.render('panel/form/dynamic_form',{
				type : 'tambah',
				obj : obj,
				tombol : tombol
			});
		});
	}

	this.SimpanUser = function (req , res , next ) {
		var b = req.body;
		var hp = b.hp;
		var profesi = b.profesi;
		var email = b.email;
		var name = b.name;
		var password = req.generate.password(b.password);
		var created_at = moment().format("YYYY-MM-DD HH:mm:ss");
		var data = {
			id : req.generate.GetId(),
			name : name,
			_id : hp,
			email : email,
			verified : true,
			hp : hp,
			profesi : b.profesi,
			point : 0,
			password : password,
			status : 'offline',
			created_at : created_at,//req.generate.Tanggal(),
			role_group : [b.role_group],
			bank_sampah : b.bank_sampah,
			lokasi : {}
		}
		req.db.findOne('users',{_id : hp }, (err, cek) => {
			if (err) return res.json({status : 'gagal' , pesan : 'Simpan User Gagal !!!'});
			if (cek == null) {
				if (req.validasi.ValidEmail(email) == true ) {
					req.userLog.insert(req, "Mengambah User " + data._id);			
					req.db.SaveData('users', data , function (err , rows){
						if (err) return res.json({status : 'gagal' , pesan : 'Simpan User Gagal !!!'});
						return res.json({status : 'sukses'});
					});
				} else {
					return res.json({status : 'gagal' , pesan : 'Email Failed !!!'});
				}
			} else {
				return res.json({status : 'gagal' , pesan : 'nomor sudah di gunakan, silahkan gunakan nomor lain'});
			}
		})
	}

	this.GetDataUser = function (req , res , next ) {
		const userLogin = req.user;
		const role_group = userLogin.role_group[0];
		const id = req.params.id;
		async.parallel([
			function (callback) {
				req.db.findOne('users', { id : id } , function (err , user){
					return callback(err, user);
				})
			},
			function (callback) {
				let query = {};
				if (role_group == "admin") {
					query = {
						_id : {
							$nin : ['root','dinas','admin']
						}
					}
				}
				req.db.find('s_group', query ,{ sort : { group_name : 1 }}, (err, rows) => {
					return callback(err, rows);
				})
			},
			function (callback) {
				let queryBank = {};
				if (role_group == "admin") {
					queryBank = {
						_id : userLogin.bank_sampah,
					}
				}
				req.db.find('bank_sampah', queryBank , {sort : { nama : 1}}, (err, BankSampah) => {
					return callback(err, BankSampah);
				});
			}
		], (err, results) => {
			if (err) return next("ERROR");
			return res.render('panel/form/editor_user',{
				data : results[0],
				group : results[1],
				bankSampah : results[2],
				status : "root"
			});
		});
	}

	this.PushGroup = function (req , res , next ) {
		var b = req.body;
		var id_user = b.id_arg;
		var id_group = b.id_list;
		req.db.update('users', { _id : id_user }, { $push : { role_group : id_group }}, function (err ,  rows){
			if (err) return res.json({status : 'gagal', pesan : 'Tambah Group Gagal !!!'});
			return res.json({status : 'sukses'})
		});
	}

	this.PullGroup = function (req , res , next ) {
		var b = req.body;
		var id_user = b.id_arg;
		var id_group = b.id_list;
		req.db.update('users', { _id : id_user }, { $pull : { role_group : id_group }}, function (err ,  rows){
			if (err) return res.json({status : 'gagal', pesan : 'Hapus Group Gagal !!!'});
			return res.json({status : 'sukses'})
		});
	}

	this.EditUser = function (req , res , next ) {
		var b = req.body;
		var name = b.name;
		var email = b.email;
		var data = {
			name : name,
			email : email,
			profesi : b.profesi,
			hp : b.telp,
			bankSampah : b.bankSampah,
			role_group : [b.role_group],
			updated_at : req.generate.Tanggal()
		}
		console.log(data);
		if (req.validasi.ValidEmail(email) == true ) {		
			req.db.update('users', { _id : b.id } ,{ $set : data } , function (err , rows){
				if (err) return res.json({status : 'gagal' , pesan : 'Edit User Gagal !!!'});
				return res.json({status : 'sukses'})
			});
		} else {
			return res.json({status : 'gagal' , pesan : 'Email Failed !!!'});
		}
	}

	this.Delete = function (req , res , next ) {
		var b = req.body;
		var data = JSON.parse(b.data);
		req.userLog.insert(req, "Menghapus User Dengan ID " + data.id);		
		req.db.remove('users', {id : { $in : data.id }}, function (err , rows){
			return res.json({status : 'sukses'})
		})
	}

	this.GantiPassword1 = function (req , res , next ) {
		var b = req.body;
		try {
			req.db.findOne('users',{ _id : b.id }, function (err , user){
				var status = req.generate.CheckBcrypt(user.password , b.lama);
				if (status == 'ya') {
					var password = req.generate.password(b.baru)
					req.db.update('users',{_id : b.id } , { $set : { password : password }}, function (err ,rows){
						return res.json({status : 'sukses'});
					})
				} else {
					return res.json({status : 'gagal' , pesan : 'Password Tidak Sama !!!'});
				}
			});
		} catch (e) {
			return res.josn({status : 'gagal' , pesan : e});
		}
	}

	this.GantiPassword2 = function (req , res , next ) {
		var b = req.body;
		try {
			var password = req.generate.password(b.baru);
			req.userLog.insert(req, "Mengganti Password " + b.id);
			req.db.update('users',{_id : b.id } , { $set : { password : password }}, function (err ,rows){
				return res.json({status : 'sukses'});
			});
		}catch (e){
			return res.josn({status : 'gagal' , pesan : e});
		}
	}
}

module.exports = UserHandler;