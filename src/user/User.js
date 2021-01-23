const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    //required: [true, 'Please add a name'],
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email',
    ],
    //unique: true,
  },

  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: 6,
    //select: false,
  },

  inactive: {
    type: Boolean,
    default: true,
  },

  activationToken: {
    type: String,
  },
});

module.exports = mongoose.model('User', UserSchema);
