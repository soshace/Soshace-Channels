$.validator.setDefaults({
  rules: {
    password: {
      minlength: 6
    }
  },
  messages: {
    password: {
      required: 'Required field',
      minlength: 'Min 6 characters'
    },
    email: {
      required: 'Required field',
      email: 'Not valid'
    },
    username: {
      required: 'Reqiured field',
      username: 'Not valid'
    }
  }
});
