const Tour = require('../models/tourModel');
const Booking = require('../models/bookingModel');
const catchAsync = require('../utility/catchAsync');
const factory = require('./handleFactory');
const AppError = require('../utility/appError');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.getCheckoutSession = catchAsync(async (request, response, next) => {
  // Get the currently booked tour
  const tour = await Tour.findById(request.params.tourId);
  // Create checkout session based on tour
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    success_url: `${request.protocol}://${request.get('host')}/?tour=${
      request.params.tourId
    }&user=${request.user.id}&price=${tour.price}`,
    cancel_url: `${request.protocol}://${request.get('host')}/${tour.slug}`,
    customer_email: request.user.email,
    client_reference_id: request.params.tourId,
    line_items: [
      {
        name: `${tour.name} Tour`,
        description: tour.summary,
        images: [`https://www.natours.dev/img/tours/${tour.imageCover}`],
        amount: tour.price * 100,
        currency: 'usd',
        quantity: 1,
      },
    ],
  });
  // send it to client as response
  response.status(200).json({
    status: 'success',
    session,
  });
});

exports.createBookingCheckout = catchAsync(async (request, response, next) => {
  // Temporary while no deployment was made, webhook couldnt be used
  const { tour, user, price } = request.query;
  if (!tour || !user || !price) return next();
  await Booking.create({ tour, user, price });
  response.redirect(request.originalUrl.split('?')[0]);
});

exports.getAllBooking = factory.getAll(Booking);
exports.getBooking = factory.updateOne(Booking);
exports.createBooking = factory.createOne(Booking);
exports.updateBooking = factory.updateOne(Booking);

exports.deleteBooking = factory.deleteOne(Booking);
