function GroupHandler () {

	this.index = function (req ,res , next) {
		const userLogin = req.user;
		return res.render('panel/group',{
			role_group : userLogin.role_group[0],
		});
	}

	this.DataTable = function (req , res , next ) {
		var request = req.query;
		var sColumn = ['id','_id'];
		var kirim = JSON.stringify({"iTotalDisplayRecords":0,"iTotalRecords":0,"aaData":[]});
		var data = [];
		req.plugin.datatable.olahAttr(sColumn , request , function (err , HasilAttr){
			if (err) return res.send(kirim);
			req.db.find('s_group', HasilAttr.where , { sort : HasilAttr.order , limit : HasilAttr.limit , skip : HasilAttr.offset }, function (err , results){
				results.forEach(function (i){
					data.push({
						id : i.id,
						_id : i._id
					});
				});
				req.db.count('s_group' ,HasilAttr.where , function (err , jumlah){
					if (err) return res.send(kirim);
					req.plugin.datatable.parsingObjectData( sColumn , request ,data , jumlah  , function (err , output ){
						if (err) return res.send(kirim);
						return res.send(JSON.stringify(output));
					});
				});
			});
		});
	}

	this.GroupBaru = function (req , res , next ) {
		var obj = [{
				id : '_id',
				label : 'Group',
				type : 'text'
			}];
		var tombol = {
			'tambah' : {
				kelas : 'simpan',
				label : 'Simpan',
				url : '/manage/group/simpan'
			}
		}
		return res.render('panel/form/dynamic_form',{
			type : 'tambah',
			obj : obj,
			tombol : tombol
		});
	}

	this.SimpanGroup = function (req , res , next ) {
		var b = req.body;
		var data = {
			id : req.generate.GetId(),
			_id : b._id,
			status : 1,
			created_at : req.generate.Tanggal()
		}
		// req.userLog.insert(req, "Menambah Group Baru Dengan Nama " + obj.group_name);		
		req.db.SaveData('s_group', data , function (err , rows){
			if (err) return res.json({status : 'gagal' , pesan : 'Tambah Group Baru Gagal !!!'});
			return res.json({status : 'sukses'})
		});
	}

	this.DeleteGroup = function (req , res , next ) {
		var b = req.body;
		var data = JSON.parse(b.data);
		// req.userLog.insert(req, "Delete Group Dengan Nama " + data.id.join(", "));		
		req.db.remove('s_group', { id : { $in : data.id }}, function (err ,  rows){
			return res.json({status : 'sukses'});
		});
	}
}

module.exports = GroupHandler;