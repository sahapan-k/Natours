const express = require('express');
const reviewController = require('../controller/reviewController');
const authController = require('../controller/authController');

const router = express.Router({ mergeParams: true });

router
  .route('/')
  .get(reviewController.getAllReviews)
  .post(
    authController.protect,
    authController.restrictTo('user'),
    reviewController.setTourUserId,
    reviewController.createReview
  );

router
  .route('/:id')
  .delete(authController.protect, reviewController.deleteReview)
  .patch(
    authController.protect,
    authController.restrictTo('user', 'admin'),
    reviewController.updateReview
  )
  .get(
    authController.protect,
    authController.restrictTo('user', 'admin'),
    reviewController.getReview
  );
module.exports = router;
