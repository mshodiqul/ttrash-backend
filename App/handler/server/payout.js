function Payout () {

	this.index = (req, res, next) => {
		const userLogin = req.user;
		req.db.find('bank_sampah', {} ,{ sort : { nama : 1 }}, (err, rows) => {
			return res.render('panel/payout',{
				role_group : userLogin.role_group[0],
				BankSampah : rows,
				id_bankSampah : userLogin.bank_sampah,
			});
		})
	}

	this.dataTable = (req, res, next) => {
		const userLogin = req.user;
		const role_group = userLogin.role_group[0];
		const request = req.query;
		const status = req.params.status;
		const bankSampah = req.params.bankSampah;
		const sColumn = ['_id','rekening','bank','cabang','nama','total','status','time_added'];
		const kirim = JSON.stringify({"iTotalDisplayRecords":0,"iTotalRecords":0,"aaData":[]});
		let data = [];
		req.plugin.datatable.olahAttr(sColumn , request , function (err , HasilAttr){
			if (err) return res.send(kirim);
			if (status != "all") {
				HasilAttr.where['status'] = status;
			}

			if (role_group == "admin") {
				HasilAttr.where['bank_sampah'] = userLogin.bank_sampah;
			}

			if (bankSampah != "all") {
				HasilAttr.where['bank_sampah'] = bankSampah;
			}
			req.db.find('payout', HasilAttr.where , { sort : HasilAttr.order , limit : HasilAttr.limit , skip : HasilAttr.offset }, function (err , results){
				results.forEach(function (i){
					data.push({
						_id : i._id,
						rekening : i.rekening,
						bank : i.bank,
						cabang : i.cabang,
						nama : i.nama,
						total : i.total,
						status : i.status,
						time_added : req.generate.SetTanggal(i.time_added , 'DD MMMM YYYY HH:mm:ss')
					});
				});
				req.db.count('payout' ,HasilAttr.where , function (err , jumlah){
					if (err) return res.send(kirim);
					req.plugin.datatable.parsingObjectData( sColumn , request ,data , jumlah  , function (err , output ){
						if (err) return res.send(kirim);
						return res.send(JSON.stringify(output));
					});
				});
			})
		});
	}

	this.Complete = (req, res, next) => {
		let id = req.body.id;
		req.db.update('payout',{_id : id }, { $set : { status : 'complete'}}, (err, rows) => {
			return res.json({status : 200});
		});
	}

	this.deleteData = (req, res, next) => {
		var b = req.body;
		var data = JSON.parse(b.data);	
		req.db.remove('payout', {_id : { $in : data.id }}, function (err , rows){
			return res.json({status : 'sukses'})
		})
	}
}

module.exports = Payout;