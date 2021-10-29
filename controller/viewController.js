const Tour = require('../models/tourModel');
const catchAsync = require('../utility/catchAsync');
const AppError = require('../utility/appError');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const Booking = require('../models/bookingModel');

exports.getOverview = catchAsync(async (request, response, next) => {
  // get tour data from collection
  const tours = await Tour.find();
  // build template

  // render template using tour data from 1)
  response.status(200).render('overview', {
    title: 'All Tours',
    tours,
  });
});

exports.getLoginForm = catchAsync(async (request, response, next) => {
  response
    .status(200)
    .set(
      'Content-Security-Policy',
      "connect-src 'self' https://cdnjs.cloudflare.com"
    )
    .render('login', {
      title: 'Login',
    });
});

exports.getTour = catchAsync(async (request, response, next) => {
  // 1) get data for requested tours (including reviews and guides)
  const tour = await Tour.findOne({ slug: request.params.tourSlug }).populate({
    path: 'reviews',
    fields: 'review rating user',
  });

  if (!tour) {
    return next(new AppError('There is no tour with that name.', 404));
  }
  // 2)  Build template

  // 3) Render template using data from 1)
  response
    .status(200)
    .set(
      'Content-Security-Policy',
      "default-src 'self' https://*.mapbox.com ;base-uri 'self';block-all-mixed-content;font-src 'self' https: data:;frame-ancestors 'self';img-src 'self' data:;object-src 'none';script-src https://cdnjs.cloudflare.com https://api.mapbox.com 'self' blob: ;script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests;"
    )
    .render('tour', {
      title: `${tour.name} tour`,
      tour,
    });
});

exports.getMe = catchAsync(async (request, response, next) => {
  const token = request.cookies.jwt;
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  const user = await User.findById(decoded.id);
  response.status(200).render('account', {
    title: 'User Account',
    user,
  });
});

exports.getMyTours = catchAsync(async (request, response, next) => {
  // Find all booking in that user
  const bookings = await Booking.find({ user: request.user.id });
  // Find tour with the returned IDs
  const tourIDs = bookings.map((element) => element.tour);
  const tours = await Tour.find({ _id: { $in: tourIDs } });

  response.status(200).render('overview', {
    title: 'My Tours',
    tours,
  });
});
