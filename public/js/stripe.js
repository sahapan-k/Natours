import axios from 'axios';
import { showAlert } from './alert';
const stripe = Stripe(
  'pk_test_51JpqYkJlwBvMYQB9botyojcvHSy5qGwTLcpUNky3ItIE7lO7A2xKI9NkKehd85OONfGzVvIZ6LMoGwTJfp6gtt0V00JlPOdZRG'
);

export const bookTour = async (tourId) => {
  try {
    // Get session from endpoint API
    const session = await axios(
      `http://127.0.0.1:3000/api/v1/bookings/checkout-session/${tourId}`
    );
    // use stripe to create checkout form + charge credit card
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id,
    });
  } catch (error) {
    console.log(error);
    showAlert(
      'error',
      'Something went wrong while processing payment, please try again...'
    );
  }
};
