var mode = process.env.NODE_ENV || 'dev';
var confMailler = require('../config/mailler.json');
var configMailer = confMailler[mode] || confMailler['dev'];
var shortid = require('shortid');
var moment = require('moment');
moment.locale('id');

function Mailer() {
	var nodemailer = require('nodemailer');
	// var mg = require('nodemailer-mailgun-transport');
	var smtpTransport = require('nodemailer-smtp-transport');


	// var auth = {
	// 	auth : {
	// 		api_key : 'key-f29ab9dca144b345551e782252784742',
	// 		domain : 'steamhdmovies.com'
	// 	}
	// }

	this.send = function(auth, options, cb) {
		var smtpConfig = {
			service : auth.service,
			auth: {
				user: auth.username, //configMailer.auth.user,
				pass: auth.password //configMailer.auth.pass
			}
		};

		var transport = nodemailer.createTransport(smtpConfig);
		//////// VERSI MAILGUN /////////////
		const mode = process.env.NODE_ENV || 'dev';
		transport.sendMail(options, function (err, info) {
			return cb(err, info);
		})
	}
}
module.exports = Mailer;