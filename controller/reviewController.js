const Review = require('../models/reviewModel');
const catchAsync = require('../utility/catchAsync');
const factory = require('./handleFactory');

exports.getAllReviews = catchAsync(async (request, response, next) => {
  let filter = {};
  if (request.params.tourId) filter = { tour: request.params.tourId };

  const reviews = await Review.find(filter);

  response.status(200).json({
    status: 'success',
    results: reviews.length,
    data: {
      review: reviews,
    },
  });
});

exports.setTourUserId = (request, response, next) => {
  if (!request.body.tour) request.body.tour = request.params.tourId;
  if (!request.body.user) request.body.user = request.user.id;
  next();
};

exports.createReview = factory.createOne(Review);
exports.deleteReview = factory.deleteOne(Review);
exports.updateReview = factory.updateOne(Review);
exports.getReview = factory.getOne(Review);
