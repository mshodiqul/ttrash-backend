const path = require('path');
const fs = require('fs');
const multer = require('multer');

function File () {
	var target = path.normalize(__dirname+'/..');

	this.RemoveImage = function (image , cb ) {
		fs.unlink(target+'/public'+image, function (err){
			return cb('sukses')
		});
	}

	this.storage = multer.diskStorage({
		destination: (req , file , callback) => {
			callback(null, __dirname + '/../public/media/image')
		},
		filename: (req, file, callback) => {
			let ext = path.extname(file.originalname);
			let filename = file.fieldname + '-' + Date.now() + ext;
			req[file.fieldname] = filename;
			callback(null, filename)
		}
	});
}

module.exports = File;