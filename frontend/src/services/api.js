import axios from 'axios';

const api = axios.create({ baseURL: 'http://localhost:5055' });

export default api;
