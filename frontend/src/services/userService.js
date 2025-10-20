import api from './api';

export const getUsers = (params) => {
  return api.get('/users', { params });
};

export const getUser = (id) => {
  return api.get(`/users/${id}`);
};
