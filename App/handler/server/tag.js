function TagHandler () {

	this.ambilData = (req, res, next) => {
		req.db.find('tag',{},{ sort : { _id : 1}}, (err, rows) => {
			return res.json(rows);
		});
	}

										// LABEL TAG MANAGEMENT
	this.index = function (req , res , next ) {
		const userLogin = req.user;
		const ModelTag = req.db.collection('tag');
		ModelTag.aggregate([
			{
				$group : {
					'_id' : '$label'
				}
			},{
				$project : {
					_id : 0,
					label : '$_id'
				}
			},{
				$sort : {
					'label' : 1
				}
			}
		], function (err , Label){
			return  res.render('panel/label-tag',{
				label : Label,
				role_group : userLogin.role_group[0],
			});
		});
	}

	this.CekLabel = function (req , res , next ) {
		var ModelTag = req.db.collection('tag');
		ModelTag.aggregate([
			{
				$group : {
					'_id' : '$label'
				}
			},{
				$project : {
					_id : 0,
					label : '$_id'
				}
			},{
				$sort : {
					'label' : 1
				}
			}
		], function (err , Label){
			if (err || Label.length == 0) return res.json({status : 'gagal'});
			return res.json({status : 'sukses' , data : Label});
		});
	}

	this.DataTableTag = function (req , res , next ) {
		var request = req.query;
		var sColumn = ['id','_id','label'];
		var kirim = JSON.stringify({"iTotalDisplayRecords":0,"iTotalRecords":0,"aaData":[]});
		var data = [];
		var label = req.params.label;
		req.plugin.datatable.olahAttr(sColumn , request , function (err , HasilAttr){
			if (err) return res.send(kirim);
			if (label != 'all') {
				HasilAttr.where['label'] = label;
			}
			req.db.find('tag', HasilAttr.where , { sort : HasilAttr.order , limit : HasilAttr.limit , skip : HasilAttr.offset }, function (err , results){
				results.forEach(function (i){
					data.push({
						id : i._id,
						_id : i._id.replace(/[^\w\s]/gi, ' '),
						label : i.label
					});
				});
				// console.log(data);
				req.db.count('tag' ,HasilAttr.where , function (err , jumlah){
					if (err) return res.send(kirim);
					req.plugin.datatable.parsingObjectData( sColumn , request ,data , jumlah  , function (err , output ){
						if (err) return res.send(kirim);
						return res.send(JSON.stringify(output));
					});
				});
			})
		});
	}

	this.GetTagLabel = function (req , res , next ) {
		var label = req.body.label;
		var query = {};
		if (label != '')
			query.label = label;
		req.db.find('tag', query , { sort : { _id : 1 }}, function (err , Tags){
			var json_tag = req.getArray.unflatten(Tags);
			var element = req.getArray.initTagLabel(json_tag);
			return res.json(element);
		});
	}

	Array.prototype.move = function (old_index, new_index) {
		if (new_index >= this.length) {
			var k = new_index - this.length;
			while ((k--) + 1) {
				this.push(undefined);
			}
		}
		this.splice(new_index, 0, this.splice(old_index, 1)[0]);
		return this;
	};

	this.GetParantTag = function (req , res , next ) {
		var tag = req.body.tag;
		req.db.find('tag',{ _id : escape(tag) }, {} , function (err , Tag){
			req.db.find('tag', {} , { sort : { _id : 1 }}, function (err , results){
				var parent = req.getArray.GetParent(Tag[0] , results);
				parent.push(Tag[0]);
				parent.move(parent.length - 1 , 0 );
				return res.json(parent);
			})
		});
	}

	this.getSubLabelTag = function (req , res , next ) {
		var b = req.body;
		var query = b.q;
		var label = b.label;
		var limit = parseInt(b.page_limit);
		req.db.find('tag',{
			_id :  new RegExp(query,"gi"),
			label : label
		}, { limit : limit }, function (err , rows){
			var data = [];
			rows.forEach(function (i){
				data.push({title : i._id});
			});
			return res.json(data);
		});
	}

	this.getDataLabel = function (req , res , next ) {
		var ModelTag = req.db.collection('tag');
		ModelTag.aggregate([
			{
				$group : {
					'_id' : '$label'
				}
			},{
				$project : {
					_id : 0,
					label : '$_id'
				}
			}
		], function (err , Label){
			return res.json(Label)
		})
	}

	this.TambahTag = function (req , res , next ) {
		var ModelTag = req.db.collection('tag');
		ModelTag.find().toArray(function (err, docs) {
			var json_tag = req.getArray.unflatten(docs);
			// console.log(json_tag);
			var element = req.getArray.GetParentTag(json_tag);
			ModelTag.aggregate([
				{
					$group : {
						'_id' : '$label'
					}
				},{
					$project : {
						label : '$_id'
					}
				}
			], function (err , results_label){
				var data_label = [];
				console.log(err, results_label)
				results_label.forEach(function (i){
					data_label.push(i.label);
				});
				return res.render('panel/form/tag_form',{
					type : 'tambah',
					data : data_label,
					element : element
				});
			});
		});
	};

	this.SimpanTag = function (req , res , next ) {
		var b = req.body;
		var id = req.generate.GetId().toLowerCase();
		id = id.replace(/[^\w\s]/gi, '');
		var data = {
			id : id,
			_id : b.tag,
			label : b.label,
			menu_parent_id : b.menu_parent_id
		}
		// console.log(data);
		// console.log(b);
		req.userLog.insert(req, "Menambah Tag Baru " + data.label);
		req.db.SaveData('tag', data , function (err , rows){
			if (err) return res.json({status : 'gagal' , pesan : 'Tambah Tag Baru Gagal !!!' , reload : true});
			return res.json({status : 'sukses' , reload : true})
		});
	}

	this.GetTag = function (req , res , next ) {
		var id = req.params.id;
		var ModelTag = req.db.collection('tag');
		req.db.find('tag', { id : id }, {} , function (err , Tag){
			ModelTag.find().toArray(function (err, docs) {
				var json_tag = req.getArray.unflatten(docs);
				var element = req.getArray.GetParentTag(json_tag ,{ type : 'edit' , value : Tag[0].menu_parent_id });
				ModelTag.aggregate([
					{
						$group : {
							'_id' : '$label'
						}
					},{
						$project : {
							label : '$_id'
						}
					}
				], function (err , results_label){
					var data_label = [];
					results_label.forEach(function (i){
						data_label.push(i.label);
					});
					var obj = [{
							id : 'label',
							label : 'Label',
							type : 'datalist',
							data : data_label,
							value : Tag[0].label
						},{
							id : 'menu_parent_id',
							label : 'Parent',
							type : 'select',
							element : element
						}];
					var tombol = {
						'edit' : {
							kelas : 'simpan-edit',
							label : 'Simpan',
							url : '/manage/label-tag/edit',
							id : Tag[0]._id
						}
					}
					return res.render('panel/form/dynamic_form',{
						type : 'edit',
						obj : obj,
						tombol : tombol
					});
				});
			});
		});
	}

	this.EditTag = function (req , res , next ) {
		var b = req.body;
		var data = {
			label : b.label,
			menu_parent_id : b.menu_parent_id
		}
		req.userLog.insert(req, "Edit Tag Dengan Label " + data.label);
		req.db.update('tag', { _id : b.id }, { $set  : data } , function (err , rows){
			if (err) return res.json({status : 'gagal' , pesan : 'Edit Tag Gagal !!!' });
			return res.json({status : 'sukses' , reload : true});
		});
	}

	this.DeleteTag = function (req , res , next ) {
		var b = req.body;
		var data_json = JSON.parse(b.data);
		req.db.remove('tag',{ _id : { $in : data_json.id }}, function (err , rows){
			return res.json({status : 'sukses'});
		});
	}
}

module.exports = TagHandler;
