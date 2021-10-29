import axios from 'axios';
import { showAlert } from './alert.js';

export const updateSettings = async (data) => {
  try {
    const result = await axios({
      method: 'PATCH',
      url: 'http://127.0.0.1:3000/api/v1/users/updateMe',
      data,
    });
    if (result.data.status === 'success') {
      showAlert('success', `New User Settings have been successfully saved!`);
    }
  } catch (error) {
    showAlert('error', error.response.data.message);
  }
};

export const updatePassword = async (
  passwordCurrent,
  newPassword,
  newPasswordConfirm
) => {
  try {
    const result = await axios({
      method: 'PATCH',
      url: 'http://127.0.0.1:3000/api/v1/users/changePassword',
      data: {
        passwordCurrent,
        newPassword,
        newPasswordConfirm,
      },
    });
    if (result.data.status === 'success') {
      showAlert('success', 'Your password have succcesfully changed!');
      document.getElementById('password-current').value = '';
      document.getElementById('password').value = '';
      document.getElementById('password-confirm').value = '';
    }
  } catch (error) {
    showAlert('error', error.response.data.message);
  }
};
