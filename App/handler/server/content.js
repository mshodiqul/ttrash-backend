function ContentHandler () {
	
	this.index = function (req , res , next ) {
		function initmenu_sidebar(arr) {
			htmlmenu_sidebar+="<ul>";
			if ('children' in arr) {
				arr = arr['children'];
			}
			for (var i = 0; i < arr.length; i++) {
				if (arr[i].menu_title != 'Logout'){
					htmlmenu_sidebar+='<li><a href="'+arr[i].menu_uri+'" title="'+arr[i].menu_title+'"><i class="fa fa-lg fa-fw '+arr[i].icon+'"></i><span class="menu-item-parent">\t  '+  arr[i].menu_title +'  </span></a>';
					if('children' in arr[i]) {
						initmenu_sidebar(arr[i]);
					} 
					htmlmenu_sidebar+='</li>';
				}
			};
			htmlmenu_sidebar+="</ul>"
		}

		var htmlmenu_sidebar = '';
		var UserLogin = req.user;
		req.db.find('users',{ _id : UserLogin._id }, {} , function (err , User){
			req.plugin.menu.AmbilIDMenu(req , User[0].role_group , function (err , ListAccess){
				req.plugin.menu.list_idMenu(req , ListAccess , function (err , Menu){
					var element = req.getArray.unflatten(Menu);
					initmenu_sidebar(element);
					return res.render('panel/layout',{
						title : "BANG SAMPAH",
						Menu : htmlmenu_sidebar,
						user : req.user
					});
				});
			})
		});
	}

	this.notFound = function (req , res , next ) {
		res.statusCode = 404;
		req.logger.error('SORRY THIS PAGE NOT FOUND !!!',404, function (err) {
			next(err);
		});
	}

	this.Dashboard = function (req , res , next ) {
		const userLogin = req.user;
		return res.render('panel/dashboard',{
			role_group : userLogin.role_group[0],
		});
	}
}
module.exports = ContentHandler;