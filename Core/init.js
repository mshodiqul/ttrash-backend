var server = require('./loader');
var duku = new server();

duku.connect(function (err , db){
	// console.log(err);
	if (err) {
		// use handler
		duku.initDatabase();
		// duku.initAutoLoad();
		duku.initDuku();
		duku.run();
	} else {
		duku.initDatabase();
		duku.initAutoLoad();
		duku.initSession();
		
		// use handler
		duku.initDuku();
		// duku.webSocket(db);
		duku.run();
	}
});
