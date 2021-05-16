const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const { resource } = require('../app');
const User = require('./User');

const UserService = require('./UserService');

router.post(
  '/api/1.0/users',
  check('username')
    .notEmpty()
    .withMessage('Username cannot be null')
    .bail()
    .isLength({ min: 4, max: 32 })
    .withMessage('Must have min 4 and max 32 characters'),
  check('email')
    .notEmpty()
    .withMessage('Email cannot be null')
    .bail()
    .isEmail()
    .withMessage('Email is not valid')
    .bail()
    .custom(async (email) => {
      const user = await UserService.findByEmail(email);
      if (user) {
        throw new Error('Email in use');
      }
    }),
  check('password')
    .notEmpty()
    .withMessage('Password cannot be null')
    .bail()
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters')
    .bail()
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/)
    .withMessage(
      'Password must have at least 1 uppercase, 1 lowercase letter and 1 number'
    ),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const validationErrors = {};
      errors
        .array()
        .forEach((error) => (validationErrors[error.param] = error.msg));
      return res.status(400).send({ validationErrors });
    }
    try {
      await UserService.save(req.body);
      res.send({ message: 'User created' });
    } catch (error) {
      return res.status(502).send({ message: 'Email failure' });
    }
  }
);

router.post('/api/1.0/users/token/:token', async (req, res) => {
  const token = req.params.token;
  try {
    await UserService.activate(token);
  } catch (err) {
    return res.status(400).send({
      message: 'This account is either active or the token is invalid',
    });
  }
  res.send({ message: 'Account is activated' });
});

router.get('/api/1.0/users', async (req, res) => {
  const users = await UserService.getUsers();
  res.send(users);
});

module.exports = router;
