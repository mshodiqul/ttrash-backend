function Upload () {
	const path = require('path');
	const multer = require('multer');

	this.index = (req, res, next) => {
		const upload = multer({
			storage : req.file.storage,
			fileFilter : function (req, file , cb) {
				let filetypes = /jpeg|jpg|png/;
				let mimetype = filetypes.test(file.mimetype);
				let extname = filetypes.test(path.extname(file.originalname).toLowerCase());
				if (mimetype && extname) {
					return cb(null, true);
				}
				cb("Error: File upload only supports the following filetypes - " + filetypes);
			}
		}).single('bukti');
		upload(req, res, (err) => {
			if (err) {
				return res.json({
					status : 403,
					pesan : "Gagal upload image"
				});
			}
			next();
		});
	}
}

module.exports = Upload;