function MenuHandler () {

	this.index = function (req , res , next ) {
		const userLogin = req.user;
		req.db.find('s_menu', {} , { sort : { 'order_point' : 1 }} , function (err , Menu ){
			var json_menu = req.getArray.unflatten(Menu);
			var element = req.getArray.initMenuList(json_menu);
			req.db.find('s_group', {} , {} , function (err , list){
				return res.render('panel/menu',{
					admin_sidebar : element,
					group : list,
					role_group : userLogin.role_group[0],
				});
			});
		});
	}

	this.DeleteMenu = function (req , res , next ) {
		var b = req.body;
		req.db.remove('s_menu', {id : b.id }, function (err , rows){
			return res.json('sukses')
		})
	}

	this.TambahMenu = function (req , res , next ) {
		req.db.find('s_menu', {}, {} , function (err , Menu){
			var json_menu = req.getArray.unflatten(Menu);
			var element = req.getArray.initmenuOption(json_menu);
			var obj = [{
					id : 'menu_title',
					label : 'Menu Title',
					type : 'text'
				},{
					id : 'menu_uri',
					label : 'Menu Uri',
					type : 'text'
				},{
					id : 'menu_parent_id',
					label : 'Menu Parent Id',
					type : 'select',
					element : element
				},{
					id : 'icon',
					label : 'Icon',
					type : 'icon'
				},{
					id : 'order_point',
					label : 'Order',
					type : 'text'
				}];
			var tombol = {
				'tambah' : {
					kelas : 'simpan',
					label : 'Simpan',
					url : '/manage/menu/simpan'
				}
			}
			return res.render('panel/form/dynamic_form',{
				type : 'tambah',
				obj : obj,
				tombol : tombol
			})
		});
	}

	this.SimpanMenu = function (req , res , next ) {
		var b = req.body;
		var parent = '';
		if (req.body.menu_parent_id == '0') {
			parent = '0';
		} else {
			parent = b.menu_parent_id;
		}
		req.db.find('s_group', { group_name : { $regex : new RegExp('root'.replace(/[^\w\s]/gi, '') ,"gi")}}, {} , function (err , Group){
			if (Group.length != 0 ) {
				var id_menu = req.generate.GetId(); 
				var data = {
					id : id_menu,
					menu_title : req.body.menu_title,
					menu_uri : req.body.menu_uri,
					menu_parent_id : parent,
					status : 1,
					icon : req.body.icon,
					order_point : parseInt(req.body.order_point)
				}
				var data_access = {
					id :  req.generate.GetId(),
					group_id : Group[0]._id,
					group : Group[0].group_name,
					accessType : 'MENU',
					accessObj : id_menu,
					Obj : req.body.menu_title
				};
				req.db.SaveData('s_menu', data , function (err , rows){
					if (err) return res.json({status : 'gagal', pesan : 'Simpan Menu Gagal !!!'});
					req.db.SaveData('s_access', data_access , function (err , doc){
						if (err) return res.json({status : 'gagal', pesan : 'Simpan Menu Gagal !!!'});
						return res.json({status : 'sukses' , reload : true});
					});
				});
			} else {
				return res.json({status : 'gagal', pesan : 'Simpan Menu Gagal !!!'});
			}
		});
	}

	this.GetMenu = function (req , res , next ) {
		var id = req.params.id;
		req.db.find('s_menu', {id : id }, {} , function (err , Mymenu){
			req.db.find('s_menu', {}, {} , function (err , Menu){
				var json_menu = req.getArray.unflatten(Menu);
				var element = req.getArray.initmenuOption(json_menu, { type : 'edit' , value : Mymenu[0].menu_parent_id });
				var obj = [{
						id : 'menu_title',
						label : 'Menu Title',
						type : 'text',
						value : Mymenu[0].menu_title
					},{
						id : 'menu_uri',
						label : 'Menu Uri',
						type : 'text',
						value : Mymenu[0].menu_uri
					},{
						id : 'menu_parent_id',
						label : 'Menu Parent Id',
						type : 'select',
						element : element
					},{
						id : 'order_point',
						label : 'Order',
						type : 'text',
						value : Mymenu[0].order_point
					},{
						id : 'icon',
						label : 'Icon',
						type : 'icon',
						value : Mymenu[0].icon
					},{
						id : 'status',
						label : 'Status',
						type : 'checkbox',
						value : Mymenu[0].status
					}];
				var tombol = {
					'edit' : {
						kelas : 'simpan-edit',
						label : 'Simpan',
						url : '/manage/menu/edit',
						id : id
					}
				}
				return res.render('panel/form/dynamic_form',{
					type : 'edit',
					obj : obj,
					tombol : tombol
				})
			})
		});
	}

	this.EditMenu = function (req , res , next ) {
		var b = req.body;
		var parent = '';
		if (req.body.menu_parent_id == '0') {
			parent = '0';
		} else {
			parent = b.menu_parent_id;
		}
		var data = {
			menu_title : req.body.menu_title,
			menu_uri : req.body.menu_uri,
			menu_parent_id : parent,
			status : parseInt(req.body.status),
			icon : req.body.icon,
			order_point : parseInt(req.body.order_point)
		}
		req.db.update('s_menu', { id : b.id }, { $set : data }, function (err , rows){
			if (err) return res.json({status : 'gagal', pesan : 'Edit Menu Gagal !!!'});
			return res.json({status : 'sukses' , reload : true});
		})
	}

	this.GetAccess = function (req , res , next ) {
		var id_group = req.body.id;
		var group = [];
		req.db.find('s_access', { group_id : id_group , accessType : 'MENU' } , {} , function (err , Access){
			if (err) return res.json({status : 'gagal', pesan : ''});
			for (var i = 0; i < Access.length; i++) {
				group.push(Access[i].accessObj);
			}
			return res.json({ status : 'sukses', pesan : group});
		});
	}

	this.SetAccess = function (req , res , next ) {
		var b = req.body;
		var id_group = b.group_id;
		var accessObj = b.menu_id;
		var menu = b.menu;
		var group = b.group;
		var accessType = b.accessType;
		var perintah = b.perintah;
		if (perintah == 'add') {
			var data = {
				id :  req.generate.GetId(),
				group_id : id_group,
				group : group,
				accessType : accessType,
				accessObj : accessObj,
				Obj : menu
			};
			req.db.SaveData('s_access', data , function (err , rows){
				if (err) return res.json(err);
				return res.json('sukses');
			});
		} else {
			req.db.remove('s_access' ,{ group_id : id_group, accessType : 'MENU', accessObj : accessObj}, function (err , doc){
				if (err) return res.json(err);
				return res.json('sukses');
			})
		}
	}
}

module.exports = MenuHandler;