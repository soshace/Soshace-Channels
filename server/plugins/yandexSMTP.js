Meteor.methods({
	'replyEmail': function(params, message) {
		var smtp = initSmtp(params);
		sendEmail(message, smtp);
	},
});

function initSmtp(params) {
	var nodemailer = new Npm.require('nodemailer'),
		xoauth2 = new Npm.require('xoauth2');

	return smtp = nodemailer.createTransport({
		service: 'yandex',
		auth: {
			xoauth2: xoauth2.createXOAuth2Generator({
				user: params.login,
				accessToken: params.token,
				clientId: Meteor.settings.public.yandex_client_id,
				clientSecret: Meteor.settings.private.yandex_client_secret
			})
		}
	});
};

function sendEmail(message, smtp) {

	var mailOptions = {
		from: message.login.indexOf('@') === -1 ? message.login + '@yandex.ru' : message.login,
		to: message.receiver,
		subject: message.subject,
		text: message.body,
		html: message.bodyHtml,
		bcc: message.login.indexOf('@') === -1 ? message.login + '@yandex.ru' : message.login
	};

	smtp.sendMail(mailOptions, function(error, info) {
		if (error) {
			return console.log(error);
		}
		// appendMessageToSentFolder();
	});
};

function appendMessageToSentFolder() {
	var attemptsCount = 0;
	var repeat = setInterval(function() {
		attemptsCount++;
		imap.openBox('INBOX', false, function(err, box) {
			imap.search(['UNSEEN', ['UID', box.uidnext - 1]], function(err, results) {
				if (err) {
					console.log(err);
					return;
				}
				if (results.length > 0) {
					attemptsCount = 60;

					var f2 = imap.addFlags(results, 'Seen', function() {
						var f1 = imap.move(results, sentBox, function(err) {
							if (err) {
								console.log(err);
							}
						});
					});
				}
			});
		});
		if (attemptsCount >= 60) {
			clearInterval(repeat);
		}
	}, 2000);
};


