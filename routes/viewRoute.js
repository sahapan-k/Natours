const express = require('express');
const viewController = require('../controller/viewController');
const authController = require('../controller/authController');
const bookingController = require('../controller/bookingController');

const router = express.Router();
router.use(authController.isLoggedIn);
router.get(
  '/',
  bookingController.createBookingCheckout,
  viewController.getOverview
);
router.get('/tour/:tourSlug', viewController.getTour);
router.get('/login', viewController.getLoginForm);
router.get('/me', authController.protect, viewController.getMe);
router.get('/my-tours', authController.protect, viewController.getMyTours);

module.exports = router;
