var nodemailer = require('nodemailer');
// var mode = process.env.NODE_ENV || 'dev';
var smtpTransport = require('nodemailer-smtp-transport');
// var maillerConfig = require('../config/mailler.json');
// maillerConfig = maillerConfig[mode] || maillerConfig['dev'];
// var	mailer = require('nodemailer');

function Mailler () {

	this.sendMessage = function (smtpConfig , options , callback ) {
		// if (maillerConfig.status == true ) {
			var transport = nodemailer.createTransport(smtpConfig);
			transport.sendMail(options, callback);
		// } else {
		// 	callback();
		// }
	}

	this.getEmail = function (req , callback) {
		var list = [];
		req.db.find('mailler',{} , {} , function (err , Email){
			Email.forEach(function (i){
				list.push(i.email);
			});
			return callback(list)
		});
	}


}

module.exports = Mailler;