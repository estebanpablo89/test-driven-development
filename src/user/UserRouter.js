const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const { resource } = require('../app');
const User = require('./User');
const pagination = require('../middleware/pagination');

const UserService = require('./UserService');
const UserNotFoundException = require('./UserNotFoundException');

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

router.get('/api/1.0/users', pagination, async (req, res) => {
  const { page, size } = req.pagination;
  const users = await UserService.getUsers(page, size);
  res.send(users);
});

router.get('/api/1.0/users/all', async (req, res) => {
  const users = await UserService.getAllUsers();
  res.send(users);
});

router.get('/api/1.0/users/:id', async (req, res, next) => {
  try {
    const user = await UserService.getUser(req.params.id);
    res.send(user);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
