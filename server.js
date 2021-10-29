/* eslint-disable no-console */
const mongoose = require('mongoose');
require('dotenv').config({ path: './config.env' });
const app = require('./app');

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

process.on('uncaughtException', (error) => {
  console.log(error.namme, error.essage);
  console.log(`UNCAUGT EXCEPTION! Shutting down...`);
  process.exit(1);
});

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
  })
  .then(() => console.log('DB connection successful'));

const port = process.env.PORT || 8000;
const server = app.listen(port, () => {
  console.log(`App running on port ${port}`);
});

process.on('unhandledRejection', (error) => {
  console.log(error);
  console.log(`UNHANDLERED REJECTION! Shutting down...`);
  server.close(() => process.exit(1));
});
