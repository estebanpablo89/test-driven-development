const bcrypt = require('bcrypt');
const User = require('./User');

const save = async (body) => {
  const hash = await bcrypt.hash(body.password, 10);
  const user = { ...body, password: hash };
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
