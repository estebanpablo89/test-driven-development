const mongoose = require('mongoose');
const config = require('config');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(config.get('conn'), {
      useNewUrlParser: true,
      useCreateIndex: true,
      useFindAndModify: false,
      useUnifiedTopology: true,
    });
    console.log('Connected to DB');
  } catch (err) {
    console.log('Could not connect to mongodb', err.message);
  }
};

module.exports = connectDB;
