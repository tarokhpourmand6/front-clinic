import axios from 'axios';

export const login = async (username, password) => {
  const res = await axios.post('https://clinic-crm-backend.onrender.com/api/auth/login', {
    username,
    password
  });

  return res.data;
};