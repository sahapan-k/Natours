const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/userModel');
const catchAsync = require('../utility/catchAsync');
const AppError = require('../utility/appError');
const Email = require('../utility/email');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

const createSendToken = (user, statusCode, response) => {
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;
  const token = signToken(user._id);
  response.cookie('jwt', token, cookieOptions);
  // eslint-disable-next-line no-param-reassign
  user.password = undefined;
  response.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

exports.signup = catchAsync(async (request, response, next) => {
  const newUser = await User.create({
    name: request.body.name,
    email: request.body.email,
    password: request.body.password,
    passwordConfirm: request.body.passwordConfirm,
  });
  const url = `${request.protocol}://${request.get('host')}/me`;
  await new Email(newUser, url).sendWelcome();
  createSendToken(newUser, 201, response);
});

exports.login = catchAsync(async (request, response, next) => {
  const { email, password } = request.body;
  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }
  createSendToken(user, 200, response);
});

exports.logout = (request, response) => {
  response.cookie('jwt', 'loggedout', {
    expiresIn: new Date(Date.now) + 10 * 1000,
    httpOnly: true,
  });
  response.status(200).json({ status: 'success' });
};
exports.protect = catchAsync(async (request, response, next) => {
  let token;
  if (
    request.headers.authorization &&
    request.headers.authorization.startsWith('Bearer')
  ) {
    token = request.headers.authorization.split(' ')[1];
  } else if (request.cookies.jwt) {
    token = request.cookies.jwt;
  }
  if (!token) {
    return next(
      new AppError('You are not logged in, please login first...'),
      401
    );
  }
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError('The user belonging to the token no longer existed...')
    );
  }
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError(
        'Password has been changed while the token was issued! Please login again...'
      ),
      401
    );
  }
  request.user = currentUser;
  next();
});

exports.restrictTo =
  (...roles) =>
  (request, response, next) => {
    if (!roles.includes(request.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403)
      );
    }
    next();
  };

exports.forgotPassword = catchAsync(async (request, response, next) => {
  // 1. Get user based on posted email
  const user = await User.findOne({ email: request.body.email });
  if (!user) {
    return next(new AppError('There is no user with that email address', 401));
  }
  // 2. generate random token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });
  // 3. sent back as an email
  const resetURL = `${request.protocol}://${request.get(
    'host'
  )}/api/v1/users/resetPassword/${resetToken}`;

  try {
    await new Email(user, resetURL).sendPasswordReset();
    response.status(200).json({
      status: 'success',
      message: 'Token has been sent to your email!',
    });
  } catch (error) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError(
        'There was an error while sending email..., Please try again later!'
      ),
      500
    );
  }
});

exports.resetPassword = catchAsync(async (request, response, next) => {
  // 1 get user based on the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(request.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });
  // 2 If token has not expired, and there is user, set the new password
  if (!user) {
    return next(new AppError('Token is invalid or has expired!', 400));
  }
  user.password = request.body.password;
  user.passwordConfirm = request.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();
  // 3 Update changedPasswordAt property
  // 4 Logged the user and sent JWT
  createSendToken(user, 200, response);
});

exports.updatePassword = catchAsync(async (request, response, next) => {
  // 1. Get user from collection
  // 2. check if POST password is correct
  const password = request.body.passwordCurrent;
  if (!password) {
    return next(
      new AppError('Password is required in order to change password!', 400)
    );
  }
  const user = await User.findById(request.user.id).select('+password');
  if (!(await user.correctPassword(password, user.password))) {
    return next(new AppError('Password incorrect, please try again!', 401));
  }
  // 3. If so, update password
  user.password = request.body.newPassword;
  user.passwordConfirm = request.body.newPasswordConfirm;
  await user.save();
  // 4. Log user in, send JWT
  createSendToken(user, 200, response);
});

exports.isLoggedIn = catchAsync(async (request, response, next) => {
  if (request.cookies.jwt) {
    try {
      const decoded = await promisify(jwt.verify)(
        request.cookies.jwt,
        process.env.JWT_SECRET
      );
      const currentUser = await User.findById(decoded.id);
      if (!currentUser) {
        next();
      }
      if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next();
      }
      response.locals.user = currentUser;
      return next();
    } catch (error) {
      return next();
    }
    next();
  }
});
