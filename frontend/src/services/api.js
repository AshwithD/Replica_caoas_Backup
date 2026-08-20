//   // import axios from 'axios';
//   // import Cookies from 'js-cookie';

//   // // Detect environment to switch baseURL
//   // const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

//   // export const api = axios.create({
//   //   baseURL: isLocalhost
//   //     ? 'http://localhost:8000/api'               // Development server
//   //     : 'https://api.ckpsca.in/api',       // Production server
//   //   withCredentials: true,                        // Needed for CSRF/session auth
//   //   headers: {
//   //     'Content-Type': 'application/json',
//   //   },
//   // });

//   // // ✅ Combined Request Interceptor (CSRF + Token)
//   // api.interceptors.request.use(
//   //   config => {
//   //     // Attach CSRF token for mutating requests
//   //     if (['post', 'put', 'patch', 'delete'].includes(config.method)) {
//   //       const csrfToken = Cookies.get('csrftoken');
//   //       if (csrfToken) {
//   //         config.headers['X-CSRFToken'] = csrfToken;
//   //       }
//   //     }

//   //     // Attach Authorization token (TokenAuthentication)
//   //     const token = localStorage.getItem('token');
//   //     if (token) {
//   //       config.headers['Authorization'] = `Token ${token}`;
//   //     }

//   //     return config;
//   //   },
//   //   error => Promise.reject(error)
//   // );

//   // // ✅ Optional: Global 401 handling
//   // api.interceptors.response.use(
//   //   response => response,
//   //   error => {
//   //     if (error.response && error.response.status === 401) {
//   //       localStorage.removeItem('token');
//   //       // Optional: Redirect to login page if not using protected routes
//   //       // window.location.href = '/login';
//   //     }
//   //     return Promise.reject(error);
//   //   }
//   // );


// import axios from 'axios';
// import Cookies from 'js-cookie';

// // Detect environment to switch baseURL
// const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// export const api = axios.create({
//   baseURL: isLocalhost
//     ? 'http://localhost:8000/api'        // Development server
//     : 'https://api.ckpsca.in/api',       // Production server
//   withCredentials: true,                 // Needed for CSRF/session auth
//   headers: {
//     'Content-Type': 'application/json',
//   },
// });

// // ✅ Combined Request Interceptor (CSRF + Token)
// api.interceptors.request.use(
//   config => {
//     // Attach CSRF token for mutating requests
//     if (['post', 'put', 'patch', 'delete'].includes(config.method)) {
//       const csrfToken = Cookies.get('csrftoken');
//       if (csrfToken) {
//         config.headers['X-CSRFToken'] = csrfToken;
//       }
//     }

//     // Attach Authorization token (TokenAuthentication)
//     // CHANGE: Get token from sessionStorage
//     const token = sessionStorage.getItem('token');
//     if (token) {
//       config.headers['Authorization'] = `Token ${token}`;
//     }

//     return config;
//   },
//   error => Promise.reject(error)
// );

// // ✅ Optional: Global 401 handling
// api.interceptors.response.use(
//   response => response,
//   error => {
//     if (error.response && error.response.status === 401) {
//       // CHANGE: Remove token from sessionStorage
//       sessionStorage.removeItem('token');
//       // Optional: Redirect to login page
//       // window.location.href = '/login';
//     }
//     return Promise.reject(error);
//   }
// );

import axios from 'axios';
import Cookies from 'js-cookie';

// Detect environment to switch baseURL
const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

export const api = axios.create({
  baseURL: isLocalhost
    ? 'http://localhost:8000/api'
    : 'https://api.ckpsca.in/api',
  withCredentials: isLocalhost ? false : true,   // ← Only use credentials in production
  headers: {
    'Content-Type': 'application/json',
  },
});

// ✅ Combined Request Interceptor (CSRF + Token + FormData fix)
api.interceptors.request.use(
  config => {
    // ── FormData fix ──────────────────────────────────────────
    // When sending a FormData body (file upload), the browser must set
    // Content-Type to "multipart/form-data; boundary=..." automatically.
    // If we leave 'application/json' in place, Django cannot parse the file.
    // Deleting it here forces the browser to set the correct value.
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }

    // ── CSRF token for mutating requests ─────────────────────
    if (['post', 'put', 'patch', 'delete'].includes(config.method)) {
      const csrfToken = Cookies.get('csrftoken');
      if (csrfToken) {
        config.headers['X-CSRFToken'] = csrfToken;
      }
    }

    // ── Authorization token ───────────────────────────────────
    const token = sessionStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Token ${token}`;
    }

    return config;
  },
  error => Promise.reject(error)
);

// ✅ Global 401 handling
// api.interceptors.response.use(
//   response => response,
//   error => {
//     if (error.response && error.response.status === 401) {
//       sessionStorage.removeItem('token');
//       // Optional: Redirect to login page
//       // window.location.href = '/login';
//     }
//     return Promise.reject(error);
//   }
// );

// api.interceptors.response.use(
//   (response) => response,

//   (error) => {
//     if (
//       error.response?.status ===
//       401
//     ) {
//       console.warn(
//         "401 request:",
//         error.config?.url
//       );

//       // DON'T auto-remove token
//       // sessionStorage.removeItem("token");
//     }

//     return Promise.reject(error);
//   }
// );


api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn("401 request:", error.config?.url);
      
      // If the server returns 401 with a deactivation signal, force logout
      const detail = error.response?.data?.detail || '';
      const isDeactivated =
        detail.toLowerCase().includes('inactive') ||
        detail.toLowerCase().includes('disabled') ||
        detail.toLowerCase().includes('no longer active');
      
      if (isDeactivated) {
        // Dispatch a global event — AuthContext will catch this and logout
        window.dispatchEvent(new CustomEvent('auth:deactivated'));
      }
    }
    return Promise.reject(error);
  }
);