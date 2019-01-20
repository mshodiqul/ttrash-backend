function Transaksi () {

	this.index = (req, res, next) => {
		const userLogin = req.user;
		return res.render('panel/transaksi',{
			role_group : userLogin.role_group[0],
		});
	}

	this.dataTable = (req, res, next) => {
		var request = req.query;
		let status = req.params.status;
		var sColumn = ['_id','nama','email','telp','alamat','title','jumlah','totalHarga','status'];
		const kirim = JSON.stringify({"iTotalDisplayRecords":0,"iTotalRecords":0,"aaData":[]});
		var data = [];
		req.plugin.datatable.olahAttr(sColumn , request , function (err , HasilAttr){
			if (err) return res.send(kirim);
			if (status != "all") {
				HasilAttr.where['status'] = status;
			}
			req.db.find('transaksi', HasilAttr.where , { sort : HasilAttr.order , limit : HasilAttr.limit , skip : HasilAttr.offset }, function (err , results){
				results.forEach(function (i){
					data.push({
						_id : i._id,
						nama : i.nama,
						email : i.email,
						telp : i.telp,
						alamat : i.alamat,
						title : i.title,
						jumlah : i.jumlah,
						totalHarga : i.totalHarga,
						status : i.status
					});
				});
				req.db.count('transaksi' ,HasilAttr.where , function (err , jumlah){
					if (err) return res.send(kirim);
					req.plugin.datatable.parsingObjectData( sColumn , request ,data , jumlah  , function (err , output ){
						if (err) return res.send(kirim);
						return res.send(JSON.stringify(output));
					});
				});
			})
		});
	}

	this.Preview = (req, res, next) => {
		let id = req.params.id;
		req.db.findOne('transaksi',{_id : id }, (err, rows) => {
			if (rows) {
				return res.render('panel/form/preview',{
					data : rows
				});
			} else {
				return res.send('<p>data tidak di temukan</p>');
			}
		})
	}

	this.viewPembayaran = (req, res, next) => {
		let id = req.params.id;
		req.db.findOne('transaksi',{_id : id}, (err, rows) => {
			switch(rows.status) {
				case "confirm" :
					return res.render('panel/form/bukti',{
						data : rows
					});
				break;
				case "pendding" :
					return res.send('<p>transaksi belum di konfirmasi</p>');
				break;
				case "cancel" :
					return res.send('<p>transaksi sudah di cancel</p>');
				break;
			}
		});
	}

	this.Complete = (req, res, next) => {
		var id = req.body.id;
		req.db.findOne('transaksi',{_id : id , status : 'confirm'}, (err, rows) => {
			if (rows) {
				req.db.update('transaksi', {_id : id }, { $set : { status : 'complete' }} , function (err , rows){
					return res.json({status : 200})
				});
			} else {
				return res.json({status : 404, pesan : 'transaksi belum di konfirmasi'});
			}
		});
	}

	this.CancelOrder = (req, res, next) => {
		var b = req.body;
		var data = JSON.parse(b.data);
		console.log(data);
		req.db.update('transaksi', {_id : { $in : data }}, {$set : { status : 'cancel'}} , function (err , rows){
			return res.json({status : 200})
		})
	}
}

module.exports = Transaksi;