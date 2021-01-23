const bcrypt = require('bcrypt');
const User = require('./User');
const crypto = require('crypto');

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

  //   bcrypt.hash(req.body.password, 10).then(async (hash) => {
  //     const user = { ...req.body, password: hash };

  //     //const user = Object.assign({}, req.body, { password: hash });

  //     // const user = {
  //     //   username: req.body.username,
  //     //   email: req.body.email,
  //     //   password: hash,
  //     // };

  //     await User.create(user);
  //     res.send({ message: 'User created' });
  //   });
};

const findByEmail = async (email) => {
  return await User.findOne({ email });
};

module.exports = { save, findByEmail };
