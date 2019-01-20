function Kategori () {

	this.index = (req, res, next) => {
		const userLogin = req.user;
		return res.render('panel/kategori',{
			role_group : userLogin.role_group[0],
		});
	}

	this.dataTable = (req, res, next) => {
		var request = req.query;
		var sColumn = ['_id','kategori','created_at'];
		var kirim = JSON.stringify({"iTotalDisplayRecords":0,"iTotalRecords":0,"aaData":[]});
		var data = [];
		req.plugin.datatable.olahAttr(sColumn , request , function (err , HasilAttr){
			if (err) return res.send(kirim);
			req.db.find('kategori', HasilAttr.where , { sort : HasilAttr.order , limit : HasilAttr.limit , skip : HasilAttr.offset }, function (err , results){
				results.forEach(function (i){
					data.push({
						_id : i._id,
						kategori : i.kategori,
						created_at : req.generate.SetTanggal(i.created_at , 'DD MMMM YYYY HH:mm:ss'),
					});
				});
				req.db.count('kategori' ,HasilAttr.where , function (err , jumlah){
					if (err) return res.send(kirim);
					req.plugin.datatable.parsingObjectData( sColumn , request ,data , jumlah  , function (err , output ){
						if (err) return res.send(kirim);
						return res.send(JSON.stringify(output));
					});
				});
			})
		});
	}

	this.TambahKategori = (req, res, next) => {
		const obj = [{
				id : 'kategori',
				label : 'Kategori',
				type : 'text'
			}];
		var tombol = {
			'tambah' : {
				kelas : 'simpan',
				label : 'Simpan',
				url : '/kategori/simpan'
			}
		}
		return res.render('panel/form/dynamic_form',{
			type : 'tambah',
			obj : obj,
			tombol : tombol
		});
	}

	this.SimpanKategori = (req, res, next) => {
		let b = req.body;
		b['_id'] = req.generate.GetId();
		b['created_at'] = req.generate.Tanggal();
		req.db.SaveData('kategori', b, (err, rows) => {
			if (err) return res.json({status : 'gagal' , pesan : 'Tambah Kategori Baru Gagal !!!'});
			return res.json({status : 'sukses'})
		});
	}

	this.getDataKatagori = (req, res, next) => {
		let id = req.params.id;
		req.db.findOne('kategori',{_id : id }, (err, rows) => {
			if (err || rows == null) return next("ERROR");
			const obj = [{
				id : 'kategori',
				label : 'Kategori',
				type : 'text',
				value : rows.kategori,
			}];
			const tombol = {
				'edit' : {
					kelas : 'simpan-edit',
					id : id,
					label : 'Simpan',
					url : '/kategori/update'
				}
			}
			return res.render('panel/form/dynamic_form',{
				type : 'edit',
				obj : obj,
				tombol : tombol
			});
		});
	}

	this.updateKategori = (req, res, next) => {
		let b = req.body;
		let data = {
			kategori : b.kategori
		}
		req.db.update('kategori',{ _id : b.id }, { $set : data}, (err, rows) => {
			if (err) return res.json({status : 'gagal' , pesan : 'data gagal di proses !!!'});
			return res.json({status : 'sukses'});
		});
	}

	this.deleteKategori = (req, res, next) => {
		var b = req.body;
		var data = JSON.parse(b.data);		
		req.db.remove('kategori', {_id : { $in : data.id }}, function (err , rows){
			return res.json({status : 'sukses'})
		});
	}
}

module.exports = Kategori;