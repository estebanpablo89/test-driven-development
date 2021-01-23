const express = require('express');
const connectDB = require('../config/database');
const UserRouter = require('./user/UserRouter');

// db
connectDB();

const app = express();
app.use(express.json());

app.use(UserRouter);

//console.log(`env variable: ${process.env.NODE_ENV}`);

module.exports = app;
