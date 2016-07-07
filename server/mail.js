Meteor.startup(function() {
  // '%40' = encoded '@'
  process.env.MAIL_URL = 'smtp://' + Meteor.settings.public.mail_login + ':' + Meteor.settings.private.mail_pass + '@' + Meteor.settings.private.mail_smtp + ':' + Meteor.settings.private.mail_port;
});

Accounts.emailTemplates.siteName = 'Soshace Channels';
Accounts.emailTemplates.from = 'NoReply <testov.testin@yandex.ru>';

Accounts.emailTemplates.verifyEmail = {
  subject: function() {
    return '[SoshaceChannels] Verify Your Email Address';
  },
  text: function(user, url) {
    var emailAddress = user.emails[0].address,
      urlWithoutHash = url.replace('#/', ''),
      supportEmail = 'shakirov_af@soshace.com',
      emailBody = 'To verify your email address ' + emailAddress + ' visit the following link: \n\n' + urlWithoutHash + '\n\n If you did not request this verification, please ignore this email. If you feel something is wrong, please contact our support team: ' + supportEmail;

    return emailBody;
  }
};

Meteor.methods({
  sendEmail: function(options) {
    //check([to, from, subject, text], [String]);

    // Let other method calls from the same client start running,
    // without waiting for the email sending to complete.
    this.unblock();

    Email.send({
      to: options.to,
      from: options.from || 'NoReply <testov.testin@yandex.ru>',
      subject: options.subject,
      text: options.text
    });
  }
});

// !!! meteor add meteorhacks:ssr
// package for email templating