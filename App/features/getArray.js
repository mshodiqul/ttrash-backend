var _ = require('underscore');
var async = require('async');

function GetArray () {

	this.getNameBox = function (arr , cb) {
		var box_name = [];
		arr.forEach(function (i){
			i.col_object.forEach(function (c){
				c.content.forEach(function (b){
					box_name.push(b.name);
				});
			});
		});
		return cb(box_name);
	}

	this.CreateElementSelect = function (arr , type , text , values) {
		var value = values || '';
		var element = '<option value = ""> Choose </option>';
		arr.forEach(function (i){
			var id = i.id || i._id;
			if (type == 'tambah') {
				element +='<option value = "'+id+'">'+i[text]+'</option>';
			} else {
				switch(id) {
					case value : 
						element +='<option selected value = "'+id+'">'+i[text]+'</option>';
					break;
					default :
						element +='<option value = "'+id+'">'+i[text]+'</option>';
				}
			}
		});
		return element;
	}

	this.CheckTags = function (req , obj ) {
		var keyObj = _.keys(obj);
		keyObj.forEach(function (i){
			req.db.find('tag',{ label : i }, {}, function (err , tags){
				if (obj[i] != null) {
					obj[i].forEach(function (x){
						var tag = _.findWhere(tags ,{ _id : x});
						if (tag == undefined ) {
							var namaTag = x;
							namaTag = namaTag.replace(/\s/gi, '-');
							req.db.SaveData('tag', {
								id : req.generate.GetId(),
								_id : namaTag,
								label : i,
								menu_parent_id : '0'
							}, function (err , doc){
								if (err) console.log(x);
							});
						}
					});					
				}
			});
		});
	}

	var GetParent = function (obj , array , tree ) {
		parent = obj.menu_parent_id;
		var parent_tag = _.filter( array, function (child){ return child.id == parent; });
		if( !_.isEmpty( parent_tag )  ){
			tree.push(parent_tag[0]);
			_.each( parent_tag, function ( child ){ GetParent( parent_tag[0] , array , tree) } );
		}
		return tree;
	}

	this.GetParent = function( obj , array, tree ){
		tree = typeof tree !== 'undefined' ? tree : [];
		parent = obj.menu_parent_id;
		var parent_tag = _.filter( array, function (child){	return child.id == parent; });
		if( !_.isEmpty( parent_tag )  ){
			tree = parent_tag;
			_.each( parent_tag, function ( child ){ GetParent( parent_tag[0] , array , tree) } );
		}
		return tree;
	}

	var unflatten = function( array, parent, tree ){
		tree = typeof tree !== 'undefined' ? tree : [];
		parent = typeof parent !== 'undefined' ? parent : { id: 0 };

		var children = _.filter( array, function(child){ return child.menu_parent_id == parent.id; });

		if( !_.isEmpty( children )  ){
			if( parent.id == 0 ){
				tree = children;   
			} else {
				parent['children'] = children
			}
			_.each( children, function( child ){ unflatten( array, child ) } );                    
		}
		return tree;
	}

	this.unflatten = function( array, parent, tree ){
		tree = typeof tree !== 'undefined' ? tree : [];
		parent = typeof parent !== 'undefined' ? parent : { id: 0 };

		var children = _.filter( array, function(child){ return child.menu_parent_id == parent.id; });

		if( !_.isEmpty( children )  ){
			if( parent.id == 0 ){
				tree = children;   
			} else {
				parent['children'] = children
			}
			_.each( children, function( child ){ unflatten( array, child ) } );                    
		}
		return tree;
	}

	this.initTagLabel = function (Tag) {
		function initTaglist(arr) {
			admin_sidebar+="<ul>";
			if ('children' in arr) {
				arr = arr['children'];
			}
			for (var i = 0; i < arr.length; i++) {
				admin_sidebar+='<li data-id = \''+arr[i].id+'\' ><span>'+arr[i]._id.replace(/[^\w\s]/gi,' ')+'</span> &ndash; <a style = "cursor : pointer" title="Hapus" onClick = "HapusTag(this,\''+arr[i].id+'\')" id='+arr[i].id+' class="btn btn-xs hapus-menu"><i class="glyphicon glyphicon-trash"></i></a>';
				if('children' in arr[i]) {
					initTaglist(arr[i]);
				} 
				admin_sidebar+='</li>';
			}
			admin_sidebar+="</ul>";
		}
		var admin_sidebar ='';
		initTaglist(Tag);
		return admin_sidebar;
	}

	this.initMenuList = function (Menu) {
		function initmenulist(arr) {
			admin_sidebar+="<ul>";
			if ('children' in arr) {
				arr = arr['children'];
			}
			for (var i = 0; i < arr.length; i++) {
				admin_sidebar+='<li data-id = \''+arr[i].id+'\'><span>'+arr[i].menu_title+'</span>&ndash;  <label style="vertical-align:top !important;" class ="checkbox-inline"><input id="centang" type="checkbox" data-id="'+arr[i].id+'" value="'+arr[i].menu_title+'"  name="checkbox" ></label> &ndash;<a style = "cursor : pointer;" title="Edit" onClick = "EditMenu(\''+arr[i].id+'\')" id='+arr[i].id+' class="btn btn-xs edit-menu"><i class="glyphicon glyphicon-pencil"></i></a>&ndash; <a style = "cursor : pointer" title="Hapus" onClick = "HapusMenu(this,\''+arr[i].id+'\')" id='+arr[i].id+' class="btn btn-xs hapus-menu"><i class="glyphicon glyphicon-trash"></i></a>';
				if('children' in arr[i]) {
					initmenulist(arr[i]);
				} 
				admin_sidebar+='</li>';
			}
			admin_sidebar+="</ul>";
		}
		var admin_sidebar ='';
		initmenulist(Menu);
		return admin_sidebar;
	}

	Array.prototype.move = function (old_index, new_index) {
		if (new_index >= this.length) {
			var k = new_index - this.length;
			while ((k--) + 1) {
				this.push(undefined);
			}
		}
		this.splice(new_index, 0, this.splice(old_index, 1)[0]);
		return this; // for testing purposes
	};

	this.GetParentTag = function (Tag , options) {
		var batas = '';
		function initoption(arr , value) {
			var isi = value || null;
			if ('children' in arr) {
				arr = arr['children'];
			}
			arr.forEach(function (i){
				if (isi == null) {
					if (i.menu_parent_id.toString() == '0') {
						option_menu+='<option value ="'+i.id+'">'+i._id+'</option>';
					} else {
						option_menu+='<option value ="'+i.id+'">'+ batas +i._id+ batas +'</option>';
					}
					if('children' in i) {
						batas += '---';
						initoption(i , value);
					}
				} else {
					if (i.id == value) {
						if (i.menu_parent_id.toString() == '0') {
							option_menu+='<option selected value ="'+i.id+'">'+i._id+'</option>'
						} else {
							option_menu+='<option selected value ="'+i.id+'">'+ batas +i._id+ batas +'</option>'
						}
					} else {
						if (i.menu_parent_id.toString() == '0' ) {
							option_menu+='<option value ="'+i.id+'">'+i._id+'</option>'
						} else {
							option_menu+='<option value ="'+i.id+'">'+ batas +i._id+ batas +'</option>'
						}
					}
					if('children' in i) {
						batas += '---';
						initoption(i , value);
					}
				}
			});
			batas = batas.substr(0,3);
		}
		var option_menu = '';
		Tag.push({
			id : 0,
			menu_parent_id : 0,
			_id : 'Parent'
		});
		Tag.move(Tag.length -1 , 0);
		if (options != undefined) {
			initoption(Tag, options.value);
		} else {
			initoption(Tag);
		}
		return option_menu;
	}

	this.initmenuOption = function (Menu , options) {
		var batas = '';
		function initoption(arr , value) {
			var isi = value || null;
			if ('children' in arr) {
				arr = arr['children'];
			}
			arr.forEach(function (i){
				if (isi == null) {
					if (i.menu_parent_id.toString() == '0') {
						option_menu+='<option value ="'+i.id+'">'+i.menu_title+'</option>';
					} else {
						option_menu+='<option value ="'+i.id+'">'+ batas +i.menu_title+ batas +'</option>';
					}
					if('children' in i) {
						batas += '---';
						initoption(i , value);
					}
				} else {
					if (i.id == value) {
						if (i.menu_parent_id.toString() == '0') {
							option_menu+='<option selected value ="'+i.id+'">'+i.menu_title+'</option>'
						} else {
							option_menu+='<option selected value ="'+i.id+'">'+ batas +i.menu_title+ batas +'</option>'
						}
					} else {
						if (i.menu_parent_id.toString() == '0' ) {
							option_menu+='<option value ="'+i.id+'">'+i.menu_title+'</option>'
						} else {
							option_menu+='<option value ="'+i.id+'">'+ batas +i.menu_title+ batas +'</option>'
						}
					}
					if('children' in i) {
						batas += '---';
						initoption(i , value);
					}
				}
			});
			batas = batas.substr(0,3);
		}
		var option_menu = '';
		Menu.push({
			id : 0,
			menu_parent_id : 0,
			menu_title : 'Parent'
		});
		Menu.move(Menu.length -1 , 0);
		if (options != undefined) {
			initoption(Menu, options.value);
		} else {
			initoption(Menu);
		}
		return option_menu;
	}
}

module.exports = GetArray;