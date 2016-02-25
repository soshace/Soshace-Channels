Meteor.startup(function() {
   process.env.MAIL_URL = 'smtp://USERNAME:PASSWORD@HOST:PORT/';
  //  process.env.MAIL_URL = "smtp://postmaster%40<your-mailgun-address>.mailgun.org:password@smtp.mailgun.org:587";
  // yandex settings
  // адрес почтового сервера — smtp.yandex.ru;
  // защита соединения — SSL;
  // порт — 465.
});

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
