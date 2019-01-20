var async = require('async');
moment = require('moment');
moment.locale('id');
var _ = require('underscore');

function ContentItemHandler () {

	this.index = function (req , res , next ) {
		req.db.find('contentType', { $or : [{parent : null},{parent : "" }] } , { sort : { nama : 1 }}, function (err , results){
			return res.render('panel/content-item',{
				data : results,
			});
		});
	}

	function CekParentType(req , id_type , cb) {
		req.db.findOne('contentType',{id : id_type} , function (err , rows){
			if (err || rows == null ) return cb('error', null );
			cb(null , rows);
		});
	}

	this.ContentType = function (req , res , next ) {
		var type = req.params.type;
		req.db.findOne('contentType', { nama : { $regex : new RegExp(type,"gi") } } , function (err , Type ){
			if (Type == null ) {
				req.logger.error('SORRY THIS PAGE NOT FOUND !!!',404, function (err) {
					return res.render('error', {
						message : err.message,
						error : err
					});
				});
			} else {
				req.db.find( 'contentType' , {parent : Type.id }, { sort : { nama : 1}} , function (err , cek_child){
					var child = '';
					var parent = '';
					if (cek_child.length != 0 ) {
						child = 'ada';
					}
					
					if (Type.parent != undefined && Type.parent != '') {
						parent = 'ada';
					}
					CekParentType(req , Type.parent , function (err , data_parent){
						if (Type.type == "tree") {
							// console.log(Type);
							req.db.find('contentItem', {type : { $regex : new RegExp(type,"gi") }}, {}, function(err, data) {
								if (err) throw err;
								var treeview = [];
								var buatTreeView = function(array, parent, tree) {
									var i = 0;
									tree = typeof tree !== 'undefined' ? tree : [];
									parent = typeof parent !== 'undefined' ? parent : { id: 0 };

									var children = _.filter( array, function(child){ return child.parent == parent.id; });

									if( !_.isEmpty( children )  ){
										if( parent.id == 0 ){
											tree = children;   
										} else {
											parent['child'] = children
										}
										_.each( children, function( child ){ buatTreeView( array, child ) } );                    
									}
									return tree;
								}
								var jsonTree = buatTreeView(data);
								return res.render('panel/contentTree', {
									Type : Type,
									data : data,
									tree : jsonTree
								})
							})
						} else {
							req.generate.GetVisible(Type , function (err , visible){
								if (err) return next();
								return res.render('panel/content',{
									type : type,
									id_type : Type.id,
									visibleColumn : visible,
									cek_child : child,
									TypeSub : cek_child,
									cek_parent : parent,
									obj_parent : data_parent,
								});
							});
						}
					});
				});
			}
		});
	}

	this.ContentSingleItem = function (req , res , next ) {
		const userLogin = req.user;
		var b = req.params;
		var type = b.type;
		var id_field = b.id_field;
		req.db.findOne('contentType', { nama : { $regex : new RegExp(type,"gi") } } , function (err , Type ){
			if (Type == null ) {
				req.logger.error('SORRY THIS PAGE NOT FOUND !!!',404, function (err) {
					return res.render('error', {
						message : err.message,
						error : err
					});
				});
			} else {
				var parent = 'ada';
				CekParentType(req , Type.parent , function (err , data_parent){
					req.generate.GetVisible(Type , function (err , visible){
						if (err) return next();
						return res.render('panel/content',{
							role_group : userLogin.role_group[0],
							type : type,
							id_type : Type.id,
							visibleColumn : visible,
							cek_parent : parent,
							obj_parent : data_parent,
							id_field : id_field,
							field_refs : Type.refs
						});
					});
				});
			}
		});
	}

	this.DataTableItem = function (req , res , next ) {
		const userLogin = req.user;
		let type = req.params.type;
		type = type.toLowerCase();
		var id_type = req.params.id_type;
		var request = req.query;
		var id_field = req.params.id_field;
		var sColums = ['id','title'];
		var kirim = JSON.stringify({"iTotalDisplayRecords":0,"iTotalRecords":0,"aaData":[]});
		var label = [];
		async.waterfall([
			function (callback) {
				req.db.findOne('contentType', {id : id_type } , function (err , types){
					if (types != null ) {
						for (jenis in types.itemObject ) {
							if (types.itemObject[jenis].visible) {
								sColums.push(types.itemObject[jenis].label);
								label.push(types.itemObject[jenis].label);
							}
						}
						return callback(null, types);
					} else {
						return callback('error' , null);
					}
				});
			},
			function (types , callback) {
				if (types != null ) {
					sColums.push('time_added','time_updated','author','status');
					req.plugin.datatable.olahAttr(sColums , request , function (err , HasilAttr){
						if (err) return callback('err' , null);
						HasilAttr.where['id_type'] = id_type;
						if (id_field != undefined ) {
							HasilAttr.where['item_parent'] = id_field;
						}
						if (type == "product") {
							HasilAttr.where['author'] = userLogin._id;
						}
						console.log(HasilAttr.where);
						req.db.find('contentItem', HasilAttr.where , { sort : HasilAttr.order , limit : HasilAttr.limit , skip : HasilAttr.offset } , function (err , rows){
							if (err) return callback(err , null);
							if (rows.length != 0 ) {
								var data = [];
								rows.forEach(function (i){
									var ta = {};
									ta['id'] = i.id;
									ta['title'] = i.title;
									label.forEach(function (x){
										ta[x]=eval('i[\''+x+'\']');
									});
									ta['time_added'] = req.generate.SetTanggal(i.time_added, 'DD MMMM YYYY HH:mm:ss');
									if (i.time_updated != null ) {
										ta['time_updated'] = req.generate.SetTanggal(i.time_updated, 'DD MMMM YYYY HH:mm:ss')
									} else {
										ta['time_updated'] = '';
									}
									ta['author'] = i.author;
									ta['status'] = "<span>" + i.status + "</span>";
									data.push(ta);
								});
							} else {
								return callback('error', null);
							}
							req.db.count('contentItem' , HasilAttr.where , function (err , jumlah){
								return callback(null , { data : data , jumlah : jumlah , whereField : HasilAttr.where });
							});
						});
					});
				} else {
					return callback('error ', null);
				}
			}
		], function (err , result){
			if (err) return res.send(kirim);
			req.plugin.datatable.parsingObjectData( sColums , request , result.data , result.jumlah  , function (err , output ){
				if (err) return res.send(kirim);
				return res.send(JSON.stringify(output));
			});
		});
	}

	this.TambahContentBaru = function (req , res , next ) {
		var type = req.params.type;
		var id_field = req.params.id_field;
		var name = new RegExp(type.replace(/[^\w\s]/gi, ''));
		req.db.find('contentType', { nama : { $regex :  name }}, {} , function (err , Type ) {
			if (Type.length != 0) {
				async.parallel({
					tree : function(callback) {
						if (Type[0].type == "tree") {
							req.db.find('contentItem', {type : {$regex : name}}, {}, function(err, dataItem) {
								if (err) throw err;
								callback(null, dataItem);
							})
						}
						else {
							callback(null, null);
						}
					}
				}, function(err, hasil) {
					var dataTree = hasil.tree;
					req.db.find('tag',{} , {sort : { id : 1 }}, function (err, Kategori){
						return res.render('panel/form/contentItem',{
							kategori : Kategori,
							id_type : Type[0].id,
							type : type,
							dataType : Type[0].type,
							id_field : id_field,
							dataTree : dataTree,
							data : Type[0],
							status : 'tambah'
						});
					});					
				})
			} else {
				return next();
			}
		});
	}

	this.GetContentItem = function (req , res , next ) {
		var type = req.params.type;
		var id = req.params.id;
		var id_field = req.params.id_field;
		var name = new RegExp(type , "gi");
		req.db.find('contentType', { nama : { $regex : name }}, {} , function (err , Type ) {
			if (Type.length != 0) {
				req.db.find('contentItem', { id : id }, {} , function (err ,Item) {
					if (Item.length != 0) {
						async.parallel({
							tree : function(callback) {
								if (Type[0].type == "tree") {
									req.db.find('contentItem', {type : {$regex : name}}, {}, function(err, dataItem) {
										if (err) throw err;
										callback(null, dataItem);
									})
								}
								else {
									callback(null, null);
								}
							}
						}, function(err, hasil) {
							req.db.find('tag',{} , {sort : { id : 1 }}, function (err, Kategori){
								return res.render('panel/form/contentItem',{
									kategori : Kategori,
									id_type : Type[0].id,
									type : type,
									dataType : Type[0].type,
									dataTree : hasil.tree,
									id_field : id_field,
									data : Type[0],
									result : Item[0],
									status : 'edit'
								});
							});							
						});
					} else {
						return next();
					}
				})
			} else {
				return next();
			}
		});
	}

	function CekADDContent (req , nama_type , id_type , cb ) {
		req.db.find('s_menu', {id_type : id_type }, {}, function (err , CekMenu){
			if (CekMenu.length == 0 ) {
				try {
					var group_id = req.user.role_group[0];
					req.db.find('s_menu', { menu_parent_id
					 : '0' , menu_title : { $regex : new RegExp('Content'.replace(/[^\w\s]/gi, '')) }} , {} , function (err , MenuContent){
						req.db.find('contentType',{ id : id_type }, {} , function (err , Types){
							if (Types[0].parent == undefined || Types[0].parent == '') {
								var id_parent = MenuContent[0].id;
								var id_menu = req.generate.GetId();
								var objmenu = {
									id : id_menu,
									id_type : id_type,
									menu_title : nama_type,
									menu_uri : '/content/'+nama_type,
									menu_parent_id : id_parent,
									icon : Types[0].icon,
									author : req.user._id,
									order_point : 1000,
									status : 1
								}
								var objaccess = {
									id : req.generate.GetId(),
									group_id : group_id,
									group : 'root',
									accessType : 'MENU',
									accessObj : id_menu,
									Obj : nama_type,
									id_type : id_type
								}
								req.db.SaveData('s_menu',objmenu , function (err , doc1){
									req.db.SaveData('s_access', objaccess , function (err , doc2){
										return cb(null , 'sukses');
									})
								});
							} else {
								return cb('Error', null);
							}
						})
					});
				} catch(e){
					return cb('Error', null)	
				}
			} else {
				return cb('Error', null)
			}
		});
	}

	this.SimpanItem = async (req , res , next ) => {
		var b = req.body;
		const userLogin = req.user;
		var start = moment().format('YYYY-MM-DD');
		var data_json = JSON.parse(b.data);
		data_json.time_added = req.generate.Tanggal();
		data_json.author = req.user?req.user._id:'Guest';
		data_json.id = req.generate.GetId();
		data_json.most_view = 0;
		data_json.time_updated = null;
		data_json.status = 'aktif';
		data_json.start = start;
		data_json.end = '1999-12-31';
		if (data_json.imdb != undefined && data_json.imdb == '') {
			data_json.imdb = req.generate.GetId();
		}
		if (data_json.tag != undefined || data_json.tag == '') {
			req.getArray.CheckTags(req , data_json.tag);
		}
		const bankSampah = await req.db.findOne("bank_sampah",{_id : userLogin.bank_sampah});
		if (bankSampah) {
			data_json['bank_sampah'] = bankSampah.nama;
			data_json['id_bank_sampah'] = bankSampah._id;
		}
		// console.log(bankSampah);
		req.userLog.insert(req, "Membuat Data Di Content Type " + data_json.type + " Dengan Judul " + data_json.title);
		req.db.update('contentItem',{ item_parent : data_json.item_parent , end : '1999-12-31' } , { $set : { start : start }}, function (err , update_start){
			req.db.findOne('contentType', {id : data_json.id_type }, function (err, hasil) {
				if (err) {
					console.error(err);
					next();
				} else {
					if (hasil.public != true) {
						if (!req.user) {
							return res.json({'status' : 'gagal', pesan : 'Content Type Not Input Publicable'})
						}
					}
					if (hasil.notif == true) {
						req.db.findOne('site', {}, function (err, hasil) {
							if (hasil) {
								var toEmail = [];
								req.db.find('users', {_id : {$in : hasil.owner}}, {}, function (err, doc) {
									doc.forEach(function(dataUser) {
										toEmail.push(dataUser.email);
									})
									res.render('client/mailer', {
										nama : req.user&&req.user._id,
										pesan : "You Have New Item From " + data_json.type,
										desc : "<b>" + data_json.title + "</b> now been added in your content type <b>" + data_json.type + "</b>"
									}, function (err, html) {
										var mail = {
											from : 'support@sangkuts.com',
											to : toEmail,
											subject : 'Thereis new item from ' + data_json.type,
											html : html
										}
										req.mailer.send(mail, req, function (err, response) {
											console.log("Mengirim Notifikasi");
										})
									})
								})
							} else {
								console.error("Ora ono site e ");
							}
						})
					}
					CekADDContent(req , data_json.type , data_json.id_type , function (){
						req.db.SaveData('contentItem', data_json , function (err , rows){
							if (err) return res.json({status : 'gagal', pesan : 'Tambah Item Gagal !!!'});
							return res.json({status : 'sukses'})
						});
					});				
				}
			});
		});
	}

	this.UpdateItem = async (req , res , next ) => {
		var b = req.body;
		const userLogin = req.user;
		var data_json = JSON.parse(b.data);
		data_json.time_updated = req.generate.Tanggal();
		const bankSampah = await req.db.findOne("bank_sampah",{_id : userLogin.bank_sampah});
		if (bankSampah) {
			data_json['bank_sampah'] = bankSampah.nama;
			data_json['id_bank_sampah'] = bankSampah._id;
		}
		if (data_json.tag != undefined ) {
			req.getArray.CheckTags(req , data_json.tag);
		}
		console.log(data_json);
		req.userLog.insert(req, "Edit Data Di Content Type " + data_json.type + " Dengan Judul " + data_json.title);		
		req.db.update('contentItem', {id : data_json.id } , {$set : data_json } , function (err , rows){
			if (err) return res.json({status : 'gagal', pesan : 'Edit Item Gagal !!!'});
			return res.json({status : 'sukses'})
		});
	}

	this.RemoveImage = function (req , res , next ) {
		var file = req.body.file;
		req.userLog.insert(req, "Remove Image " + file);		
		req.file.RemoveImage(file , function (){
			return res.json('sukses')
		});
	}

	this.DeleteItem = function (req , res , next ) {
		var b = req.body;
		var data_json = JSON.parse(b.data);
		req.userLog.insert(req, "Membuat Data Di Content Type " + data_json.type + " Dengan ID " + data_json.id);
		req.db.find('contentItem', { id : { $in : data_json.id }}, {} , function (err , content){
			content.forEach(function (i){
				if (i.images != undefined) {
					try{
						i.images.forEach(function (x){
							req.file.RemoveImage(x.imageUrl , function (){

							});
						});
					} catch(e){
						console.log(e);
					}
				}
			});
			req.db.remove('contentItem', {id : { $in : data_json.id }} , function (err , rows){
				return res.json('sukses');
			});
		});
	}

	this.GenerateImdb = function (req , res , next ) {
		var imdb = req.body.imdb;
		var type = req.body.type;
		if (type == undefined ) {
			req.db.findOne('contentItem', { imdb : imdb } , function (err , Cek){
				if (Cek != null ) {
					return res.json({status : 'gagal', pesan : 'imdb sudah ada silahkan di cek lagi :)'});
				} else {
					req.generate.GenerateImdb(imdb, function (err , obj_imdb){
						if (err) return res.json({status : 'gagal' , pesan : 'data tidak dapat di temukan !!!', data : null });
						return res.json({status : 'sukses', data : obj_imdb });
					});
				}
			});
		} else {
			req.generate.GenerateImdb(imdb, function (err , obj_imdb){
				if (err) return res.json({status : 'gagal' , pesan : 'data tidak dapat di temukan !!!', data : null });
				return res.json({status : 'sukses', data : obj_imdb });
			});
		}
	}

	this.ItemAutoComlete = function (req , res , next ) {
		var b = req.query;
		var id_type = b.id_type;
		var obj_query = {};
		var field_refs = b.refs;
		var arr_query = [{
			title : {
				$regex : new RegExp(b.q.replace(/[^\w\s]/gi, '') ,"gi")
			}
		}];
		obj_query[field_refs] = {
			$regex : new RegExp(b.q.replace(/[^\w\s]/gi, '') ,"gi")
		}
		arr_query.push(obj_query);
		var select_item = {
			id_type : id_type,
			$or : arr_query
		}
		// console.log(select_item);
		req.db.find('contentItem', select_item , { limit : 10 } , function (err , rows){
			if (err || rows.length == 0 ) return res.json(null);
			// console.log(rows);
			return res.json(rows);
		});
	}

	this.GetItemField = function (req , res , next ) {
		var b = req.body;
		var id_item = b.id_item;
		var field_refs = b.field_refs;
		req.db.findOne('contentItem',{id : id_item }, function (err , Item){
			if (err || Item == null ) return res.json({status : 'gagal'});
			var field = Item[field_refs];
			// console.log(Item);
			return res.json({status : 'sukses', data : field});
		})
	}

	this.GetItemLink = function (req , res , next ) {
		var b = req.body;
		var id = b.id;
		req.db.findOne('contentItem',{id : id }, function (err , Item ) {
			if (err) return res.json({status : 'gagal'});
			var title = Item.title.replace(/ /gi,'-');
			return res.json({status : 'sukses', link : '/'+title+'_'+Item.id});
		})
	}
}

module.exports = ContentItemHandler;