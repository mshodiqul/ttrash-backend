module.exports = exports = function(app) {
	const HomeHandler = require('./home'), Home = new HomeHandler();
	const KategoriHandler = require('./kategori'), Kategori = new KategoriHandler();
	const UploadHandler = require('./upload'), Upload = new UploadHandler();

	app.get('/', Home.index);
	app.get('/page/:id', Home.Paging);
	app.get('/kategori/:kategori', Kategori.index);
	app.get('/kategori/page/:kategori/:id', Kategori.pagingKategori);
	app.get('/cart', Home.Card);
	app.get('/item/:id', Home.previewProduct);
	app.get('/checkout', Home.Checkout);
	app.get('/konfirmasi-pembayaran', Home.checkKonfirmasi);
	app.post('/konfirmasi/cek', Home.getListOrder);
	app.get('/konfirmasi-pembayaran/:id', Home.Konfirmasi);
	app.post('/checkout/proses', Home.prosesCheckout);
	app.post('/checkout/confirm', Upload.index , Home.confirmPembayaran);
}