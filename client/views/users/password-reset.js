Template.resetPassword.onCreated(function() {
   if (Accounts._resetPasswordToken) {
     Session.set('resetPassword', Accounts._resetPasswordToken);
   }
});

Template.resetPassword.helpers({
 resetPassword: function(){
  return Session.get('resetPassword');
 }
});

Template.resetPassword.events({
  'submit form': function(e) {
    e.preventDefault();

    var password = $('#password-field').val(),
        passwordConfirm = $('#confirm-password-field').val();

    if (password && passwordConfirm && password === passwordConfirm) {
      Accounts.resetPassword(Session.get('resetPassword'), password, function(err) {
        if (err) {
          Bert.alert('We are sorry but something went wrong.', 'danger');
        } else {
          Router.go('profile');
          Bert.alert('Your password has been changed. Welcome back!', 'success');
          Session.set('resetPassword', null);
        }
      });
    }

    return false;
  }
});
