import axios from 'axios';

// Relative base URL works in both Vite dev (proxied) and coupled deployment (same origin)
const api = axios.create({ baseURL: '/api' });

export default api;
