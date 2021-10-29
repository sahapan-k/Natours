/* eslint-disable*/
import axios from 'axios';
import { showAlert } from './alert';

export const login = async (email, password) => {
  try {
    const result = await axios({
      method: 'POST',
      url: 'http://127.0.0.1:3000/api/v1/users/login',
      data: {
        email,
        password,
      },
    });
    if (result.data.status === 'success') {
      showAlert('success', 'Logged In successfully');
      window.setTimeout(() => {
        return location.assign('/');
      }, 2000);
    }
  } catch (error) {
    showAlert('error', error.response.data.message);
    document.getElementById('password').value = '';
  }
};

export const logout = async () => {
  try {
    const res = await axios({
      method: 'GET',
      url: 'http://127.0.0.1:3000/api/v1/users/logout',
    });
    if (res.data.status === 'success') {
      showAlert('success', 'Log out successfully');
      window.setTimeout(() => {
        location.reload(true);
      }, 2000);
    }
  } catch (error) {
    console.log(error);
    showAlert('error', 'Something went wrong while logging out..');
  }
};
