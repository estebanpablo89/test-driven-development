const bcrypt = require('bcrypt');
const User = require('./User');
const crypto = require('crypto');
const EmailService = require('../email/EmailService');

const generateToken = (length) => {
  return crypto.randomBytes(length).toString('hex').substring(0, length);
};

const save = async (body) => {
  const { username, email, password } = body;
  const hash = await bcrypt.hash(password, 10);
  const user = {
    username,
    email,
    password: hash,
    activationToken: generateToken(16),
  };
  await User.create(user);
  await EmailService.sendAccountActivation(email, user.activationToken);
};

const findByEmail = async (email) => {
  return await User.findOne({ email });
};

const activate = async (token) => {
  const user = await User.findOne({ activationToken: token });
  if (!user) {
    throw new Error();
  }
  user.inactive = false;
  user.activationToken = null;
  await user.save();
};

const getUsers = async (page, size) => {
  const users = await User.find()
    .select('id username email')
    .limit(size)
    .where({ inactive: false })
    .skip(page * size);
  const count = await User.find().countDocuments({ inactive: false });

  return {
    content: users,
    page,
    size,
    totalPages: Math.ceil(count / size),
  };
};

const getAllUsers = async () => {
  const users = await User.find();

  return {
    content: users,
  };
};

module.exports = { save, findByEmail, activate, getUsers, getAllUsers };
