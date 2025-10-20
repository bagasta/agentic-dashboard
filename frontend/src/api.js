import axios from 'axios/dist/node/axios.cjs';

export const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:3001';

const api = axios.create({ baseURL: API_BASE });

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = 'Bearer ' + token;
    return config;
  },
  error => Promise.reject(error)
);

api.interceptors.response.use(
  res => res,
  async err => {
    const originalRequest = err.config;
    if (
      err.response &&
      err.response.status === 401 &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      if (isRefreshing) {
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then(token => {
            originalRequest.headers['Authorization'] = 'Bearer ' + token;
            return api(originalRequest);
          })
          .catch(e => Promise.reject(e));
      }

      isRefreshing = true;
      try {
        const oldToken = localStorage.getItem('token');
        const res = await axios.post(API_BASE + '/refresh', { token: oldToken });
        const newToken = res.data.token;
        localStorage.setItem('token', newToken);
        api.defaults.headers.common['Authorization'] = 'Bearer ' + newToken;
        processQueue(null, newToken);
        originalRequest.headers['Authorization'] = 'Bearer ' + newToken;
        return api(originalRequest);
      } catch (e) {
        processQueue(e, null);
        localStorage.removeItem('token');
        window.location.reload();
        return Promise.reject(e);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(err);
  }
);

export default api;
