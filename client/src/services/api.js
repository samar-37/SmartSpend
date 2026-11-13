import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

let csrfInitialization;

function getCookie(name) {
  return document.cookie.split('; ').find((part) => part.startsWith(`${name}=`))?.split('=').slice(1).join('=');
}

api.interceptors.request.use(async (config) => {
  const isSafeMethod = ['get', 'head', 'options'].includes(config.method?.toLowerCase());
  if (!navigator.onLine && !isSafeMethod) {
    const error = new Error('You are offline. Changes were not sent.');
    error.code = 'OFFLINE';
    return Promise.reject(error);
  }
  if (!isSafeMethod && !getCookie('smartspend_csrf')) await initializeCsrf();
  const csrfToken = getCookie('smartspend_csrf');
  if (csrfToken && !isSafeMethod) {
    config.headers['X-CSRF-Token'] = csrfToken;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const isRefreshRequest = originalRequest?.url?.endsWith('/auth/refresh');
    const isAuthRequest = originalRequest?.url?.includes('/auth/');
    const isCsrfFailure = error.response?.status === 403 && error.response?.data?.message === 'Invalid CSRF token';
    if (isCsrfFailure && originalRequest && !originalRequest._csrfRetry) {
      originalRequest._csrfRetry = true;
      await initializeCsrf();
      return api(originalRequest);
    }
    if (error.response?.status !== 401 || !originalRequest || originalRequest._retry || isRefreshRequest || isAuthRequest) {
      return Promise.reject(error);
    }
    originalRequest._retry = true;
    try {
      await api.post('/auth/refresh');
      return api(originalRequest);
    } catch {
      return Promise.reject(error);
    }
  },
);

export async function getHealthStatus() {
  const { data } = await api.get('/health');
  return data;
}

export async function initializeCsrf() {
  if (!csrfInitialization) {
    csrfInitialization = api.get('/auth/csrf').finally(() => {
      csrfInitialization = undefined;
    });
  }
  await csrfInitialization;
}

export default api;
