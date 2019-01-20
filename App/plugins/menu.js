function Menu () {

	this.AmbilIDMenu = function (req , data , cb){
		var arr = [];
		req.db.find('s_access', { accessType : 'MENU', group_id : { $in : data } }, {} , function (err , doc){
			doc.forEach(function (i){
				arr.push(i.accessObj);
			});
			return cb(null , arr);
		});
	}

	this.list_idMenu = function (req , data , cb) {
		req.db.find('s_menu' , {id : { $in : data } , status : 1}, { sort : { 'order_point' : 1 }}, function (err , Menu){
			return cb (null , Menu)
		});
	}
}

module.exports = Menu;