/* eslint-disable no-param-reassign */
const AppError = require('../utility/appError');

const handleCastErrorDB = (error) => {
  const message = `Invalid ${error.path}: ${error.value}`;
  return new AppError(message, 400);
};

const handleDuplicateFieldDB = (error) => {
  const Obj = Object.values(error.keyValue);
  const message = `Duplicate field value: ${Obj}. Please use another value!`;
  return new AppError(message, 400);
};

const handleValidatorErrorDB = (error) => {
  const errors = Object.values(error.errors).map((element) => element.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const handleJWTError = () =>
  new AppError('Invalid token. Please log in again!', 401);

const handleTEEError = () =>
  new AppError('Token expired, Please log in again!', 401);

const sendErrorDev = (error, request, response) => {
  if (request.originalUrl.startsWith('/api')) {
    response.status(error.statusCode).json({
      status: error.status,
      error: error,
      message: error.message,
      stack: error.stack,
    });
  } else {
    response.status(error.statusCode).render('error', {
      title: 'Error!',
      msg: error.message,
    });
  }
};

const sendErrorProd = (error, request, response) => {
  if (request.originalUrl.startsWith('/api')) {
    if (error.isOperational) {
      response.status(error.statusCode).json({
        status: error.status,
        message: error.message,
      });
    } else {
      response.status(500).json({
        status: 'error',
        message: 'Something went very wrong!',
      });
    }
  } else if (!request.originalUrl.startsWith('/api') && error.isOperational) {
    response.status(error.statusCode).render('error', {
      title: 'Error!',
      msg: error.message,
    });
  } else {
    response.status(error.statusCode).render('error', {
      title: 'Error!',
      msg: 'Something went very wrong!',
    });
  }
};

module.exports = (err, request, response, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, request, response);
  } else if (process.env.NODE_ENV === 'production') {
    let error = Object.assign(err);
    if (error.name === 'CastError') error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateFieldDB(error);
    if (error.name === 'ValidatorError') error = handleValidatorErrorDB(error);
    if (error.name === 'JsonWebTokenError') error = handleJWTError(error);
    if (error.name === 'TokenExpiredError') error = handleTEEError(error);
    sendErrorProd(error, request, response);
  }
};
