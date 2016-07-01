Template.forgotPassword.events({
  'submit form': function(e) {
    e.preventDefault();

    var email = $('#email-field').val().toLowerCase();

    if (email) { // TODO: check(email, email)
      Accounts.forgotPassword({email: email}, function(err) {
        if (err) {
          if (err.message === 'User not found [403]') {
            Bert.alert('This user does not exist.', 'danger');
          } else {
            Bert.alert('We are sorry but something went wrong.', 'warning');
          }
        } else {
          Bert.alert('Email Sent. Check your mailbox.', 'success');
        }
      });
    }

    return false;
  },
});
