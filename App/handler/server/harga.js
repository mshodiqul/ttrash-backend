function HargaHandler () {
	const path = require('path');
	const multer = require('multer');

	function rupiah(n) {
		return "Rp. "+ (n/1000).toFixed(3).replace(/(\d)(?=(\d{3})+\.)/g, "$1.");
	}

	this.index = (req, res, next) => {
		const userLogin = req.user;
		req.db.find('bank_sampah', {} ,{ sort : { nama : 1 }}, (err, rows) => {
			return res.render('panel/harga',{
				role_group : userLogin.role_group[0],
				BankSampah : rows,
				id_bankSampah : userLogin.bank_sampah,
			});
		})
	}

	this.dataTable = (req, res, next) => {
		const request = req.query;
		const sColumn = ['_id','nama','harga'];
		const bankSampah = req.params.bankSampah;
		const kirim = JSON.stringify({"iTotalDisplayRecords":0,"iTotalRecords":0,"aaData":[]});
		var data = [];
		req.plugin.datatable.olahAttr(sColumn , request , function (err , HasilAttr){
			if (err) return res.send(kirim);
			if (bankSampah != "all") {
				HasilAttr.where['bank_sampah'] = bankSampah;
			}
			req.db.find('harga', HasilAttr.where , { sort : HasilAttr.order , limit : HasilAttr.limit , skip : HasilAttr.offset }, function (err , results){
				results.forEach(function (i){
					data.push({
						_id : i._id,
						nama : i.nama,
						harga : rupiah(i.harga)
					});
				});
				req.db.count('harga' ,HasilAttr.where , function (err , jumlah){
					if (err) return res.send(kirim);
					req.plugin.datatable.parsingObjectData( sColumn , request ,data , jumlah  , function (err , output ){
						if (err) return res.send(kirim);
						return res.send(JSON.stringify(output));
					});
				});
			})
		});
	}

	this.tambahHarga = (req, res, next) => {
		return res.render("panel/form/formHarga",{
			type : 'tambah',
			url : "/manage/harga/simpan",
		});
	}

	this.uploadFile = async (req, res, next) => {
		const upload = multer({
			storage : req.file.storage,
			fileFilter : function (req, file , cb) {
				let filetypes = /jpeg|jpg|png/;
				let mimetype = filetypes.test(file.mimetype);
				let extname = filetypes.test(path.extname(file.originalname).toLowerCase());
				if (mimetype && extname) {
					return cb(null, true);
				}
				cb("Error: File upload only supports the following filetypes - " + filetypes);
			}
		}).single('gambar');
		upload(req,res, (err) => {
			if (err) {
				return res.json({
					status : "gagal",
					pesan : "Failed to upload image"
				});
			}
			next();
		});
	}

	this.simpanHarga = (req, res, next) => {
		const b = req.body;
		const userLogin = req.user;
		const role_group = userLogin.role_group[0];
		if (role_group == "admin") {
			b['bank_sampah'] = userLogin.bank_sampah;
		}
		b['gambar'] = "/media/image/"+req.gambar;
		b['_id'] = req.generate.GetId();
		b['created_at'] = req.generate.Tanggal();
		console.log(b);
		req.db.SaveData('harga', b, (err, rows) => {
			if (err) return res.json({status : 'gagal' , pesan : 'Tambah Harga Baru Gagal !!!'});
			return res.json({status : 'sukses'})
		});
	}

	this.getDataHarga = (req, res, next) => {
		let id = req.params.id;
		req.db.findOne('harga',{_id : id }, (err, rows) => {
			if (err || rows == null) return next("ERROR");
			return res.render("panel/form/formHarga",{
				type : 'edit',
				data : rows,
				url : "/manage/harga/update"
			});
			// const obj = [{
			// 	id : 'nama',
			// 	label : 'Nama',
			// 	type : 'text',
			// 	value : rows.nama,
			// },{
			// 	id : 'harga',
			// 	label : 'Harga Per Kilo',
			// 	type : 'text',
			// 	value : rows.harga,
			// }];
			// const tombol = {
			// 	'edit' : {
			// 		kelas : 'simpan-edit',
			// 		id : id,
			// 		label : 'Simpan',
			// 		url : '/manage/harga/update'
			// 	}
			// }
			// return res.render('panel/form/dynamic_form',{
			// 	type : 'edit',
			// 	obj : obj,
			// 	tombol : tombol
			// });
		});
	}

	function removeFile (url , cb ) {
		const fs = require('fs');
		const target = path.normalize(__dirname+'/..');
		fs.unlink(target+'/public'+url, function (err){
			return cb('sukses')
		});
	}

	this.updateHarga = (req, res, next) => {
		let b = req.body;
		let data = {
			nama : b.nama,
			harga : b.harga
		}
		if (req.gambar != undefined) {
			removeFile(b.urlgambar, (pesan) => {
				data['gambar'] = "/media/image/"+req.gambar;
				console.log(data);
				req.db.update('harga',{ _id : b.idne }, { $set : data}, (err, rows) => {
					if (err) return res.json({status : 'gagal' , pesan : 'data gagal di proses !!!'});
					return res.json({status : 'sukses'});
				});
			});
		} else {
			// console.log(data);
			req.db.update('harga',{ _id : b.idne }, { $set : data}, (err, rows) => {
				if (err) return res.json({status : 'gagal' , pesan : 'data gagal di proses !!!'});
				return res.json({status : 'sukses'});
			});
		}
	}

	this.deleteHarga = (req, res, next) => {
		const b = req.body;
		const data = JSON.parse(b.data);
		req.db.remove('harga', {_id : { $in : data.id }}, function (err , rows){
			return res.json({status : 'sukses'})
		});
	}
}

module.exports = HargaHandler;