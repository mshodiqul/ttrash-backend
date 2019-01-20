function BankSampah() {

	this.index = (req, res, next) => {
		const userLogin = req.user;
		return res.render('panel/bank-sampah',{
			role_group : userLogin.role_group[0],
		});
	}

	this.dataTable = (req, res, next) => {
		var request = req.query;
		var sColumn = ['_id','nama','latitude','longitude','alamat','created_at'];
		var kirim = JSON.stringify({"iTotalDisplayRecords":0,"iTotalRecords":0,"aaData":[]});
		var data = [];
		req.plugin.datatable.olahAttr(sColumn , request , function (err , HasilAttr){
			if (err) return res.send(kirim);
			req.db.find('bank_sampah', HasilAttr.where , { sort : HasilAttr.order , limit : HasilAttr.limit , skip : HasilAttr.offset }, function (err , results){
				results.forEach(function (i){
					data.push({
						_id : i._id,
						nama : i.nama,
						latitude : i.latitude,
						longitude : i.longitude,
						alamat : i.alamat,
						// created_at : req.generate.SetTanggal(i.created_at , 'DD MMMM YYYY HH:mm:ss'),
					});
				});
				req.db.count('bank_sampah' ,HasilAttr.where , function (err , jumlah){
					if (err) return res.send(kirim);
					req.plugin.datatable.parsingObjectData( sColumn , request ,data , jumlah  , function (err , output ){
						if (err) return res.send(kirim);
						return res.send(JSON.stringify(output));
					});
				});
			})
		});
	}

	this.tambahBankSampah = (req, res, next) => {
		var obj = [{
			id : 'nama',
			label : 'Bank Sampah',
			type : 'text'
		},{
			id : 'latitude',
			label : 'Latitude',
			type : 'text'
		},{
			id : 'longitude',
			label : 'Longitude',
			type : 'text'
		},{
			id : 'alamat',
			label : 'alamat',
			type : 'area'
		}];
		var tombol = {
			'tambah' : {
				kelas : 'simpan',
				label : 'Simpan',
				url : '/bank-sampah/simpan'
			}
		}
		return res.render('panel/form/addBankSampah',{
			type : 'tambah',
			obj : obj,
			tombol : tombol
		});
	}

	this.simpanBankSampah = (req, res, next) => {
		const b = req.body;
		let data = {
			_id : req.generate.GetId(),
			nama : b.nama,
			latitude : Number(b.latitude),
			longitude : Number(b.longitude),
			alamat : b.alamat,
			created_at : req.generate.Tanggal(),
		}
		req.db.SaveData('bank_sampah', data, (err, rows) => {
			if (err) return res.json({status : 'gagal' , pesan : 'Data Gagal di Simpan !!!'});
			return res.json({status : 'sukses'});
		});
	}

	this.getBankSampah = (req, res, next) => {
		let id = req.params.id;
		req.db.findOne("bank_sampah", { _id : id}, (err, rows) => {
			if (err || rows == null) next(err);
			var obj = [{
				id : 'nama',
				label : 'Bank Sampah',
				type : 'text',
				value : rows.nama,
			},{
				id : 'latitude',
				label : 'Latitude',
				type : 'text',
				value : rows.latitude,
			},{
				id : 'longitude',
				label : 'Longitude',
				type : 'text',
				value : rows.longitude,
			},{
				id : 'alamat',
				label : 'alamat',
				type : 'area',
				value : rows.alamat,
			}];
			var tombol = {
				'edit' : {
					kelas : 'simpan-edit',
					label : 'Simpan',
					id : id,
					url : '/bank-sampah/update'
				}
			}
			return res.render('panel/form/dynamic_form',{
				type : 'edit',
				obj : obj,
				tombol : tombol
			});
		});
	}

	this.updateBankSampah = (req, res, next) => {
		const b = req.body;
		let data = {
			nama : b.nama,
			latitude : Number(b.latitude),
			longitude : Number(b.longitude),
			alamat : b.alamat,
		}
		req.db.update("bank_sampah",{ _id : b.id}, { $set : data}, (err, rows) => {
			if (err) return res.json({status : 'gagal' , pesan : 'Edit Bank Sampah Gagal !!!'});
			return res.json({status : 'sukses'});
		});
	}

	this.deleteBankSampah = (req, res, next) => {
		const b = req.body;
		const data = JSON.parse(b.data);
		req.db.remove('bank_sampah', {_id : { $in : data.id }}, function (err , rows){
			return res.json({status : 'sukses'})
		});
	}
}

module.exports = BankSampah;