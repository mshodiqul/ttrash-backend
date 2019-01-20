module.exports = exports = function (app, io) {
	// Handler Server
	const ContentHandler = require('./handler/server/content') , Content = new ContentHandler();
	const UserHandler = require('./handler/server/users') , User = new UserHandler();
	const GroupHandler = require('./handler/server/group') , Group = new GroupHandler();
	const MenuHandler = require('./handler/server/menu') , Menu = new MenuHandler();
	const MaillerHandler = require('./handler/server/mailler') , Mailler = new MaillerHandler();
	const SiteHandler = require('./handler/server/site') , Site = new SiteHandler();
	const TagHandler = require('./handler/server/tag') , Tags = new TagHandler();
	const HistoryHandler = require('./handler/server/history') , History = new HistoryHandler();
	const PayoutHandler = require('./handler/server/payout') , Payout = new PayoutHandler();
	const ErrorHandlerLogs = require('./handler/server/dataError'), LogsError = new ErrorHandlerLogs();
	const TransaksiHandler = require('./handler/server/transaksi'), Transaksi = new TransaksiHandler();
	const RequestSampahHandler = require('./handler/server/requestSampah'), RequestSampah = new RequestSampahHandler(io);
	const RequestApaAjaHandler = require('./handler/server/requestApaAja'), RequestApaAja = new RequestApaAjaHandler(io);
	const TransaksiSampahHandler = require('./handler/server/transaksiSampah'), TransaksiSampah = new TransaksiSampahHandler();
	const KategoriHandler = require('./handler/server/kategori'), Kategori = new KategoriHandler();
	const HargaHandler = require('./handler/server/harga'), Harga = new HargaHandler();
	const AboutHandler = require('./handler/server/about'), About = new AboutHandler();
	const BankSampahHandler = require('./handler/server/bank-sampah'), BankSampah = new BankSampahHandler();
	
	const ContentTypeHandler = require('./handler/server/content-type') , ContentType = new ContentTypeHandler();
	const ContentItemHandler = require('./handler/server/content-item') , ContentItem = new ContentItemHandler();
	const authPassport = require('../App/plugins/passport'), Session = new authPassport();
	const ErrorHandler = require('./handler/error').errorHandler;
	
	const BackupRestoreHandler = require('./handler/server/backupRestore'), Backup = new BackupRestoreHandler();

	const upload = require('jquery-file-upload-middleware')
	const shortid = require('shortid');

	app.use('/upload/image',  upload.fileHandler({
		uploadDir: __dirname + '/public/media/image',
		uploadUrl: '/file/upload/image'
	}));

	upload.on('begin', function (fileInfo , req , res ) {
		fileInfo.name = shortid.generate()+fileInfo.name;
		fileInfo.originalName =  shortid.generate()+fileInfo.name;
	});

	// ======================================== HANDLER SERVER ======================================
	app.get('/main', Session.isAuthenticated , Content.index);
	app.get('/dashboard', Session.ProtectMenu ,Content.Dashboard);
											// ROUTE HALAMAN LOGIN
	app.get('/user/login', User.FromLogin)
	app.post('/user/login', User.ProccessLogin);
	app.get('/user/logout', User.Logout);

	// Transaksi Sampah
	app.get('/transaksi/sampah', Session.ProtectMenu, TransaksiSampah.index);
	app.post('/transaksi/sampah/delete', Session.isAuthenticated, TransaksiSampah.deleteData);
	app.get('/transaksi/sampah/dataTable/:status', Session.isAuthenticated, TransaksiSampah.dataTable);
	app.post('/transaksi/sampah/hitung', Session.isAuthenticated, TransaksiSampah.prosesHitung);
	app.get('/transaksi/sampah/hitung/:id_order', Session.isAuthenticated, TransaksiSampah.hitungPoint);

	app.get('/manage/about', Session.ProtectMenu, About.index);
	app.post('/manage/about/proses', Session.isAuthenticated, About.prosesData);

	app.get('/bank-sampah', Session.ProtectMenu , BankSampah.index);
	app.get('/bank-sampah/dataTable', Session.isAuthenticated, BankSampah.dataTable);
	app.get('/bank-sampah/add', Session.isAuthenticated, BankSampah.tambahBankSampah);
	app.post('/bank-sampah/simpan', Session.isAuthenticated, BankSampah.simpanBankSampah);
	app.get('/bank-sampah/edit/:id', Session.isAuthenticated, BankSampah.getBankSampah);
	app.post('/bank-sampah/update', Session.isAuthenticated, BankSampah.updateBankSampah);
	app.post('/bank-sampah/delete', Session.isAuthenticated, BankSampah.deleteBankSampah);

	// ROUTE HARGA
	app.get('/manage/harga', Session.ProtectMenu, Harga.index);
	app.get('/manage/harga/dataTable/:bankSampah', Session.isAuthenticated, Harga.dataTable);
	app.get('/manage/harga/add', Session.isAuthenticated, Harga.tambahHarga);
	app.post('/manage/harga/simpan', Harga.uploadFile, Harga.simpanHarga);
	app.get('/manage/harga/edit/:id', Session.isAuthenticated, Harga.getDataHarga);
	app.post('/manage/harga/update', Harga.uploadFile, Harga.updateHarga);
	app.post('/manage/harga/delete', Session.isAuthenticated, Harga.deleteHarga);

	app.get('/request/sampah', Session.ProtectMenu, RequestSampah.index);
	app.get('/request/sampah/dataTable/:status/:bankSampah', Session.isAuthenticated, RequestSampah.dataTable);
	app.post('/request/sampah/getDriver', Session.isAuthenticated, RequestSampah.searchDriver);
	app.post('/request/sampah/jemput', Session.isAuthenticated, RequestSampah.jemputSampah);

	app.get('/request/apaaja', Session.ProtectMenu, RequestApaAja.index);
	app.get('/request/apaaja/dataTable/:status', Session.isAuthenticated, RequestApaAja.dataTable);
	app.post('/request/apaaja/getDriver', Session.isAuthenticated, RequestApaAja.searchDriver);
	app.post('/request/apaaja/jemput', Session.isAuthenticated, RequestApaAja.jemputBarang);

											// ROUTE USER MANAGEMENT
	app.get('/manage/user', Session.ProtectMenu , User.index);
	app.get('/manage/user/dataTable/:group/:bankSampah', Session.isAuthenticated , User.DataTable);
	app.get('/manage/user/add', Session.isAuthenticated , User.TambahBaru);
	app.post('/manage/user/simpan', Session.isAuthenticated , User.SimpanUser);
	app.get('/manage/user/edit/:id', Session.isAuthenticated , User.GetDataUser);
	app.post('/manage/user/pushGroup', Session.isAuthenticated , User.PushGroup);
	app.post('/manage/user/edit', Session.isAuthenticated , User.EditUser);
	app.post('/manage/user/pullGroup', Session.isAuthenticated , User.PullGroup);
	app.post('/manage/user/delete', Session.isAuthenticated , User.Delete);
	app.post('/manage/user/gatiPassword', Session.isAuthenticated , User.GantiPassword1);
	app.post('/manage/user/gatiPassword2', Session.isAuthenticated , User.GantiPassword2);

	app.get('/manage/history', Session.ProtectMenu, History.index);
	app.get('/manage/history/dataTable/:bankSampah', Session.isAuthenticated, History.DataTable);
	app.get('/laporan/history', Session.isAuthenticated, History.laporanDriver);

	app.get('/payout', Session.ProtectMenu, Payout.index);
	app.get('/payout/dataTable/:status/:bankSampah', Session.isAuthenticated, Payout.dataTable);
	app.post('/payout/complete', Session.isAuthenticated, Payout.Complete);
	app.post('/payout/delete', Session.isAuthenticated, Payout.deleteData);

	app.get('/transaksi', Session.ProtectMenu, Transaksi.index);
	app.get('/transaksi/dataTable/:status', Session.isAuthenticated, Transaksi.dataTable);
	app.get('/transaksi/preview/:id', Session.isAuthenticated, Transaksi.Preview);
	app.get('/transaksi/bukti/:id', Session.isAuthenticated, Transaksi.viewPembayaran);
	app.post('/transaksi/complete', Session.isAuthenticated, Transaksi.Complete);
	app.post('/transaksi/cancel', Session.isAuthenticated, Transaksi.CancelOrder);

	app.get('/kategori', Session.ProtectMenu, Kategori.index);
	app.get('/kategori/dataTable', Session.isAuthenticated, Kategori.dataTable);
	app.get('/kategori/add', Session.isAuthenticated, Kategori.TambahKategori);
	app.post('/kategori/simpan', Session.isAuthenticated, Kategori.SimpanKategori);
	app.get('/kategori/edit/:id', Session.isAuthenticated, Kategori.getDataKatagori);
	app.post('/kategori/update', Session.isAuthenticated, Kategori.updateKategori);
	app.post('/kategori/delete', Session.isAuthenticated, Kategori.deleteKategori);

											// ROUTE GROUP MANAGEMENT
	app.get('/manage/group', Session.ProtectMenu , Group.index);
	app.get('/manage/group/dataTable', Session.isAuthenticated , Group.DataTable);
	app.get('/manage/group/add', Session.isAuthenticated , Group.GroupBaru);
	app.post('/manage/group/simpan' , Session.isAuthenticated , Group.SimpanGroup);
	app.post('/manage/group/delete', Session.isAuthenticated , Group.DeleteGroup);

											// ROUTE MENU MANAGEMENT
	app.get('/manage/menu', Session.ProtectMenu , Menu.index);
	app.post('/manage/menu/delete', Session.isAuthenticated , Menu.DeleteMenu);
	app.get('/manage/menu/edit/:id', Session.isAuthenticated , Menu.GetMenu);
	app.post('/manage/menu/edit', Session.isAuthenticated , Menu.EditMenu);
	app.get('/manage/menu/add' , Session.isAuthenticated , Menu.TambahMenu);
	app.post('/manage/menu/simpan' , Session.isAuthenticated , Menu.SimpanMenu);
	app.post('/manage/menu/getAccess' , Session.isAuthenticated , Menu.GetAccess);
	app.post('/manage/menu/SetAccess', Session.isAuthenticated , Menu.SetAccess);

											// ROUTE SITE MANAGEMENT
	app.get('/manage/site', Session.ProtectMenu , Site.index );
	app.post('/manage/site/simpan', Session.isAuthenticated , Site.SimpanSite);

	//////////////////////////////////////// MANAGE ERROR HANDLE /////////////////////////////
	app.get("/manage/logs/error", Session.ProtectMenu , LogsError.index);
	app.get("/manage/logs/error/dataTable", Session.isAuthenticated , LogsError.dataTable);
	
											// ROUTE TAG MANAGEMENT
	app.get('/manage/label-tag', Session.ProtectMenu, Tags.index);
	app.get('/manage/label-tag/add', Session.isAuthenticated , Tags.TambahTag);
	app.get('/manage/label-tag/dataTable/:label', Session.isAuthenticated , Tags.DataTableTag);
	app.post('/manage/label-tag/cekLabel', Session.isAuthenticated, Tags.CekLabel);
	app.post('/manage/label-tag/simpan', Session.isAuthenticated , Tags.SimpanTag);
	app.get('/manage/label-tag/edit/:id', Session.isAuthenticated , Tags.GetTag);
	app.post('/manage/label-tag/edit', Session.isAuthenticated , Tags.EditTag);
	app.post('/manage/label-tag/delete', Session.isAuthenticated , Tags.DeleteTag);
	app.post('/manage/label-tag/GetSubLabel', Session.isAuthenticated , Tags.getSubLabelTag);
	app.post('/manage/label-tag/getData', Session.isAuthenticated , Tags.getDataLabel);
	app.post('/manage/label-tag/getParent', Session.isAuthenticated , Tags.GetParantTag);
	app.post('/manage/label-tag/GetTagLabel', Session.isAuthenticated , Tags.GetTagLabel);
	app.post('/manage/label-tag/ambilData', Session.isAuthenticated, Tags.ambilData);

											// ROUTE CONTENT TYPE MANAGEMENT
	app.get('/manage/content-type', Session.ProtectMenu , ContentType.index);
	app.get('/manage/content-type/dataTable', Session.isAuthenticated , ContentType.DataTable);
	app.get('/manage/content-type/add', Session.isAuthenticated , ContentType.TambahContentType);
	app.post('/manage/content-type/simpan', Session.isAuthenticated , ContentType.SimpanContentType);
	app.get('/manage/content-type/edit/:id', Session.isAuthenticated , ContentType.GetContentType);
	app.post('/manage/content-type/edit', Session.isAuthenticated , ContentType.EditContentType);
	app.post('/manage/content-type/delete', Session.isAuthenticated , ContentType.DeleteContentType );
	app.post('/manage/content-type/getFieldParent', Session.isAuthenticated , ContentType.GetFieldParent);

	app.get("/manage/backup-restore", Session.ProtectMenu , Backup.index);
	app.get("/manage/backup-restore/tambah", Session.isAuthenticated, Backup.tambah);
	app.post("/manage/backup-restore/delete", Session.isAuthenticated, Backup.Delete);
	app.post("/manage/backup-restore/backup", Session.isAuthenticated, Backup.backup);
	app.post("/manage/backup-restore/restore", Session.isAuthenticated, Backup.restore);
	app.get("/manage/backup-restore/dataTable", Session.isAuthenticated, Backup.dataTable);
	app.post('/manage/backup', Session.isAuthenticated , Backup.BackupData);

											// ROUTE CONTENT MANAGEMENT
	app.get('/content', Session.ProtectMenu , ContentItem.index );
	app.get('/content/:type', Session.isAuthenticated , ContentItem.ContentType);
	app.post('/item/getField', Session.isAuthenticated , ContentItem.GetItemField);
	app.get('/content/:type/add', Session.isAuthenticated, ContentItem.TambahContentBaru);
	app.post('/content/simpanItem', ContentItem.SimpanItem);
	app.get('/content/:type/edit/:id', Session.isAuthenticated , ContentItem.GetContentItem);
	app.get('/content/:type/:id_field/edit/:id', Session.isAuthenticated , ContentItem.GetContentItem);
	app.post('/content/editItem', Session.isAuthenticated , ContentItem.UpdateItem);
	app.post('/item/file/removeImage', Session.isAuthenticated , ContentItem.RemoveImage);
	app.post('/content/delete-item' , Session.isAuthenticated , ContentItem.DeleteItem);
	app.get('/restAutoComplete', Session.isAuthenticated , ContentItem.ItemAutoComlete);
	app.get('/content/dataTable/parent/:id_type/:type', Session.isAuthenticated , ContentItem.DataTableItem);
	app.get('/content/dataTable/:id_type/:id_field', Session.isAuthenticated , ContentItem.DataTableItem);
	app.get('/content/:type/:id_field/add', Session.isAuthenticated, ContentItem.TambahContentBaru);
	app.get('/content/:type/:id_field', Session.isAuthenticated , ContentItem.ContentSingleItem);
	app.post('/item/getFilm', Session.isAuthenticated , ContentItem.GetItemLink);
											// URI MANAGEMENT
	// MAILLER
	app.get('/setting/mailler', Session.ProtectMenu , Mailler.index);
	app.post('/setting/mailler/simpan', Session.isAuthenticated , Mailler.SimpanEmail);
	app.post('/setting/mailler/smtp', Session.isAuthenticated , Mailler.SimpanService);
	// app.get('/mailler/send', Mailler.SendMessage);
	app.post('/mailler/send', Mailler.SendMessage);

	
	// CLIENT
	// require('./handler/client/')(app);
	// API
	
	require('./handler/api/')(app);

	app.use(Content.notFound);
	app.use(ErrorHandler);
}