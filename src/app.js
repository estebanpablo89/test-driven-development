const express = require('express');
const connectDB = require('../config/database');
const UserRouter = require('./user/UserRouter');
const AuthRouter = require('./auth/AuthenticationRouter');
const errorHandler = require('./error/ErrorHandler');

// db
connectDB();

const app = express();
app.use(express.json());

app.use(UserRouter);
app.use(AuthRouter);
app.use(errorHandler);

module.exports = app;
