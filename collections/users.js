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
    firstName: {
        type: String,
        regEx: /^[a-zA-Z]{2,25}$/,
        optional: true
    },
    lastName: {
        type: String,
        regEx: /^[a-zA-Z]{2,25}$/,
        optional: true
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

Schema.User = new SimpleSchema({
    username: {
        type: String,
        regEx: /^[a-z0-9A-Z_]{3,15}$/
    },
    emails: {
        type: [Object],
        // this must be optional if you also use other login services like facebook,
        // but if you use only accounts-password, then it can be required
        optional: true
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
    profile: {
        type: Schema.UserProfile,
        optional: true
    },
    services: {
        type: Object,
        optional: true,
        blackbox: true
    }
    // ,
    // // Add `roles` to your schema if you use the meteor-roles package.
    // // Note that when using this package, you must also specify the
    // // `Roles.GLOBAL_GROUP` group whenever you add a user to a role.
    // // Roles.addUsersToRoles(userId, ["admin"], Roles.GLOBAL_GROUP);
    // // You can't mix and match adding with and without a group since
    // // you will fail validation in some cases.
    // roles: {
    //     type: Object,
    //     optional: true,
    //     blackbox: true
    // }
});

Meteor.users.attachSchema(Schema.User);
