Meteor.startup(function() {
  // ''%40' = encoded '@'
  process.env.MAIL_URL = 'smtp://testov.testin%40yandex.ru:123123123123@smtp.yandex.ru:465/';

  //  process.env.MAIL_URL = "smtp://postmaster%40<your-mailgun-address>.mailgun.org:password@smtp.mailgun.org:587";
  // yandex settings
  // адрес почтового сервера — smtp.yandex.ru;
  // защита соединения — SSL;
  // порт — 465.
//   MAIL_SERVICE=yandex
// MAIL_NO_REPLY=testov.testin@yandex.ru
// MAIL_NO_REPLY_PASSWORD=123123123123
});

Accounts.emailTemplates.siteName = 'Soshace Channels';
Accounts.emailTemplates.from     = 'NoReply <testov.testin@yandex.ru>';

Accounts.emailTemplates.verifyEmail = {
  subject: function() {
    return '[SoshaceChannels] Verify Your Email Address';
  },
  text: function(user, url) {
    var emailAddress   = user.emails[0].address,
        urlWithoutHash = url.replace( '#/', '' ),
        supportEmail   = 'shakirov_af@soshace.com',
        emailBody      = 'To verify your email address ' + emailAddress + 'visit the following link: \n\n' + urlWithoutHash + '\n\n If you did not request this verification, please ignore this email. If you feel something is wrong, please contact our support team: ' + supportEmail;

    return emailBody;
  }
};

// In your server code: define a method that the client can call
Meteor.methods({
  sendEmail: function (to, from, subject, text) {
    //check([to, from, subject, text], [String]);

    // Let other method calls from the same client start running,
    // without waiting for the email sending to complete.
    //this.unblock();

    Email.send({
      to: to,
      from: from,
      subject: subject,
      text: text
    });
  }
});

// !!! meteor add meteorhacks:ssr
// package for email templating
