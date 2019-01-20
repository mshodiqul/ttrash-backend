module.exports = exports = function(app, io) {
	// const express = require('express');
	// const app = express();
	const UserHandler = require('./users'), User = new UserHandler();
	const ContentHandler = require('./content'), Content = new ContentHandler();
	const OrderHandler = require('./order'), Order = new OrderHandler();
	const TaskHandler = require('./task'), Task = new TaskHandler();
	const AboutHandler = require('./about'), About = new AboutHandler();
	const BankSampahHandler = require('./bankSampah'), BankSampah = new BankSampahHandler();

	app.post('/api/get/bankSampah', BankSampah.index);

	app.get('/verify', User.verify);
	app.get('/forgot', User.placeForgot);
	app.post('/proses/forgot', User.prosesForgot);
	// USER
	app.get("/api/user/oauth/token", User.login);
	app.post("/api/oauth/token", User.login);
	app.post('/api/users/logout', User.logout);
	app.post('/api/users/forgot', User.forgot);
	app.post('/api/user/daftar', User.daftar);
	app.post("/api/user/info", User.info);
	app.post('/api/user/updateStatus', User.updateStatus);
	app.post('/api/user/history', User.getHistory);
	app.post('/api/user/detailHistory', User.detailHistory);
	app.post('/api/user/addBank', User.addBank);
	app.post('/api/user/checkBank', User.checkBank);
	app.post('/api/user/payout', User.Payout);
	app.post('/api/get/about', About.index);

	app.post('/api/register-token-device', Task.registerToken);
	app.post('/api/push-notification', Task.pushNotification);

	app.post('/api/order/request', Order.getRequest);
	// app.post('/api/order/ambil', User.checkToken, Order.ambilOrder);
	app.post('/api/order/sampah', User.checkToken , Order.angkutSampah);
	app.post('/api/order/barang', User.checkToken , Order.angkutBarang);
	app.post('/api/order/history', User.checkToken, Order.listHistory);
	app.post('/api/order/getOrderBarang', User.checkToken, Order.getOrderBarang);
	app.post('/api/order/getOrderSampah', User.checkToken, Order.getOrderSampah);
	app.post('/api/order/listHarga', User.checkToken, Order.ListHarga);
	app.post('/api/order/hitungBarang', User.checkToken, Order.hitungBarang);
	app.post('/api/order/selesai', User.checkToken, Order.selesaiOrder);
	app.post('/api/order/cancel', User.checkToken , Order.cancelOrder);
	app.post('/api/order/selesaiSampah', User.checkToken, Order.selesaiOrderSampah);

	// CONTENT
	// app.get('/api/content/rekening', Content.getRekening);
	app.post('/api/content/rekening', Content.getRekening);
	app.get("/api/content/get/:name", Content.find);
	// app.get("/content/get/:name", User.checkToken, Content.find);
	app.post("/api/content/insert/:name", User.checkToken, Content.insert);
	app.get("/api/content/search", User.checkToken, Content.search);

	// ex.use("/api", app);
}