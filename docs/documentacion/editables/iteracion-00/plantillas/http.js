import axios from 'axios';

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
  withXSRFToken: true,
  headers: { Accept: 'application/json' },
});

// Antes del futuro POST de login/registro: await prepareSession().
export const prepareSession = () => http.get('/sanctum/csrf-cookie');
