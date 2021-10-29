import '@babel/polyfill';
import { login, logout } from './login.js';
import { displayMap } from './mapbox';
import { updatePassword, updateSettings } from './updateSettings.js';
import { bookTour } from './stripe';

const logoutBtn = document.querySelector('.nav__el--logout');
const loginForm = document.querySelector('.form--login');
const mapBox = document.getElementById('map');
const userDataForm = document.querySelector('.form-user-data');
const userPasswordForm = document.querySelector('.form-user-settings');
const bookBtn = document.getElementById('book-tour');

if (mapBox) {
  const locations = JSON.parse(mapBox.dataset.location);
  displayMap(locations);
}

if (loginForm) {
  loginForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    login(email, password);
  });
}

if (logoutBtn) logoutBtn.addEventListener('click', logout);
if (userDataForm)
  userDataForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const form = new FormData();
    form.append('name', document.getElementById('name').value);
    form.append('email', document.getElementById('email').value);
    form.append('photo', document.getElementById('photo').files[0]);
    updateSettings(form);
  });
if (userPasswordForm)
  userPasswordForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const passwordCurrent = document.getElementById('password-current').value;
    const newPassword = document.getElementById('password').value;
    const newPasswordConfirm =
      document.getElementById('password-confirm').value;
    updatePassword(passwordCurrent, newPassword, newPasswordConfirm);
  });

if (bookBtn)
  bookBtn.addEventListener('click', (event) => {
    event.target.textContent = 'processing...';
    const { tourId } = event.target.dataset;
    bookTour(tourId);
  });
