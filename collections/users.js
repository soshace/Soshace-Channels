// Schema for 'Meteor.users' collection

var Schema = {};

Schema.PluginService = new SimpleSchema({
  serviceName: {
    type: String
  },
  token: {
    type: String,
    optional: true
  },
  refreshToken:{
    type: String,
    optional: true
  },
  login: {
    type: String,
    optional: true
  }
});

Schema.Contact = new SimpleSchema({
  contactId: {
    type: String
  },
  // Contact from list has 4 states: sendRequest, wasRequested, accepted, rejected
  contactStatus:{
    type: String
  }

});

Schema.UserProfile = new SimpleSchema({
    picPath: {
      type: String,
      optional: true
    },
    firstName: {
        type: String,
        min: 2,
        max: 25,
        regEx: /^[a-zA-Z_ ]+$/,
        optional: true
    },
    lastName: {
        type: String,
        min: 2,
        max: 25,
        regEx: /^[a-zA-Z_ ]+$/,
        optional: true
    },
    gender: {
        type: String,
        //regEx: /^[a-zA-Z]{2,25}$/,
        optional: true
    },
    bday: {
        type: String,
        //regEx: /^[a-zA-Z]{2,25}$/,
        optional: true
    },
    phone: {
        type: String,
        //regEx: /^[a-zA-Z]{2,25}$/,
        optional: true
    },
    skype: {
        type: String,
        regEx: /^[a-z]{2,25}$/,
        optional: true
    },
    location: {
        type: String,
        regEx: /^[a-zA-Z,\- ]{2,50}$/,
        optional: true
    }
});

Schema.User = new SimpleSchema({
    username: {
        type: String,
        min: 3,
        max: 15,
        regEx: /^[a-zA-Z_]+$/
    },
    emails: {
        type: [Object]
    },
    "emails.$.address": {
        type: String,
        regEx: SimpleSchema.RegEx.Email
    },
    "emails.$.verified": {
        type: Boolean
    },
    createdAt: {
        type: Date
    },
    personalData: {
        type: Schema.UserProfile,
        optional: true
    },
    services: {
        type: Object,
        optional: true,
        blackbox: true
    },
    contacts: {
        type: [Schema.Contact],
        optional: true
    },
    channels: {
      type: [String],
      optional: true
    },
    serviceTokens: {
      type: [Schema.PluginService],
      optional: true
    }
});

Schema.User.messages({
  "regEx username": 'Error in [label]. Only English characters are allowed.',
  "regEx personalData.firstName": 'Error in [label]. Only English characters are allowed.',
  "regEx personalData.lastName": 'Error in [label]. Only English characters are allowed.',
  "regEx personalData.location": 'Error in [label]. Only English characters are allowed.'
});

Meteor.users.attachSchema(Schema.User);
