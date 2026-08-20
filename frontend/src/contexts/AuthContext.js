import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { api } from '../services/api';
import { message, Spin } from 'antd'; 
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import Cookies from 'js-cookie';

const AuthContext = createContext({
  user: null,
  loading: true,
  login: async () => { /* no-op */ },
  logout: async () => { /* no-op */ },
  register: async () => { /* no-op */ },
});

export const useAuth = () => useContext(AuthContext);

// ── Token helpers — localStorage persists across tab/window close ────────────
// sessionStorage was clearing token on browser close, causing auto-logout.
const getToken  = ()      => localStorage.getItem('token');
const setToken  = (token) => localStorage.setItem('token', token);
const clearToken = ()     => localStorage.removeItem('token');

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate              = useNavigate();

  const fetchCurrentUser = useCallback(async () => {
    const token = getToken();

    // No token → not logged in
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const res = await api.get('/auth/user/');
      setUser(res.data);
    } catch (err) {
      console.error('Session validation failed', err);
      setUser(null);
      clearToken();
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  // ── Login ─────────────────────────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    setLoading(true);
    try {
      // Skip CSRF prefetch in development - token is set automatically
      const isLocalhost = window.location.hostname === 'localhost' || 
                          window.location.hostname === '127.0.0.1';
      if (!isLocalhost) {
        await api.get('/auth/csrf/');
      }
      const res = await api.post('/auth/login/', { email, password });
      setUser(res.data);

      if (res.data.token) {
        setToken(res.data.token);           // ← localStorage, persists after close
        // Keep sessionStorage in sync so AppLayout/ChatPage getWsUrl() still works
        sessionStorage.setItem('token', res.data.token);
      }

      message.success(
        `Logged in as ${res.data.full_name || res.data.first_name || res.data.email}`
      );

      if (res.data.role === 'Admin' || res.data.role === 'HR') {
        navigate('');
      } else {
        navigate('/');
      }
      return true;
    } catch (err) {
      console.error('Login failed:', err.response?.data || err);
      const backendMsg =
        err.response?.data?.message ||
        err.response?.data?.detail  ||
        'Login failed';
      setUser(null);
      return { success: false, message: backendMsg };
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  // ── Logout ────────────────────────────────────────────────────────────────
  // const logout = useCallback((isAutoLogout = false) => {
  //   if (!getToken()) {
  //     setUser(null);
  //     return;
  //   }

  //   // Clear both storages
  //   clearToken();
  //   sessionStorage.removeItem('token');
  //   setUser(null);

  //   // Best-effort server logout
  //   const csrfToken = Cookies.get('csrftoken');
  //   if (csrfToken) {
  //     api.post('/auth/logout/', {}, {
  //       headers: { 'X-CSRFToken': csrfToken },
  //     }).catch((err) => {
  //       console.log('Server logout suppressed:', err);
  //     });
  //   }

  //   if (isAutoLogout) {
  //     message.warning('Session expired due to inactivity.');
  //   } else {
  //     message.success('Logged out successfully!');
  //   }

  //   navigate('/login');
  // }, [navigate]);

  // Change the logout signature from:
  // const logout = useCallback((isAutoLogout = false) => {

  // To:
  const logout = useCallback((isAutoLogout = false, reason = null) => {
    if (!getToken()) {
      setUser(null);
      return;
    }

    clearToken();
    sessionStorage.removeItem('token');
    setUser(null);

    const csrfToken = Cookies.get('csrftoken');
    if (csrfToken) {
      api.post('/auth/logout/', {}, {
        headers: { 'X-CSRFToken': csrfToken },
      }).catch(() => {});
    }

    // Show appropriate message based on reason
    if (reason === 'deactivated') {
      message.error('Your account has been deactivated. Please contact your administrator.');
    } else if (isAutoLogout) {
      message.warning('Session expired due to inactivity.');
    } else {
      message.success('Logged out successfully!');
    }

    navigate('/login');
  }, [navigate]);

  // ── Sync localStorage token → sessionStorage on tab open ─────────────────
  // AppLayout and ChatPage read token from sessionStorage for WS URLs.
  // On a fresh tab open, sessionStorage is empty even though localStorage has
  // the token. This effect copies it over so WS connections work immediately.
  useEffect(() => {
    const token = getToken();
    if (token && !sessionStorage.getItem('token')) {
      sessionStorage.setItem('token', token);
    }
  }, []);

  // ── Auto-logout timer (currently disabled — timer body is commented out) ──
  const timerRef = useRef(null);

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    // Uncomment below to enable auto-logout after inactivity:
    // timerRef.current = setTimeout(() => logout(true), 30 * 60 * 1000); // 30 min
  }, [logout]);

  // useEffect(() => {
  //   if (!user) return;
  //   const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
  //   const handleActivity = () => resetTimer();
  //   events.forEach(e => window.addEventListener(e, handleActivity));
  //   resetTimer();
  //   return () => {
  //     if (timerRef.current) clearTimeout(timerRef.current);
  //     events.forEach(e => window.removeEventListener(e, handleActivity));
  //   };
  // }, [user, resetTimer]);

  // Inside AuthProvider, add this effect after the existing auto-logout timer effect:

  // ── Deactivation listener (fired by api.js interceptor) ──────────────────
  useEffect(() => {
    const handleDeactivated = () => logout(false, 'deactivated');
    window.addEventListener('auth:deactivated', handleDeactivated);
    return () => window.removeEventListener('auth:deactivated', handleDeactivated);
  }, [logout]);

  // ── Periodic active-status poll (every 2 minutes) ────────────────────────
  useEffect(() => {
    if (!user) return;

    const checkActive = async () => {
      try {
        await api.get('/auth/user/');
        // If the response comes back fine, user is still active — do nothing
      } catch (err) {
        const status = err.response?.status;
        const detail = (err.response?.data?.detail || '').toLowerCase();
        
        if (
          status === 401 &&
          (detail.includes('inactive') ||
          detail.includes('disabled') ||
          detail.includes('no longer active'))
        ) {
          logout(false, 'deactivated');
        }
      }
    };

    const pollInterval = setInterval(checkActive, 2 * 60 * 1000); // every 2 min
    return () => clearInterval(pollInterval);
  }, [user, logout]);

  // ── Register ──────────────────────────────────────────────────────────────
  const register = useCallback(async (email, password, first_name, last_name, role) => {
    setLoading(true);
    try {
      await api.get('/auth/csrf/');
      const res = await api.post('/auth/register/', { email, password, first_name, last_name, role });
      setUser(res.data);
      message.success('Account created successfully!');
      if (res.data.token) {
        setToken(res.data.token);
        sessionStorage.setItem('token', res.data.token);
      }
      return true;
    } catch (err) {
      const errorMessage = err.response?.data?.email || 'Registration failed.';
      message.error(errorMessage);
      setUser(null);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const contextValue = useMemo(() => ({
    user,
    setUser,
    loading,
    login,
    logout,
    register,
  }), [user, loading, login, logout, register]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// ── PrivateRoute ──────────────────────────────────────────────────────────────
export const PrivateRoute = ({ children, allowedRoles, allowedEmails }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <Spin size="large" tip="Loading authentication..." />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!allowedEmails && !allowedRoles) return children;

  const emailAllowed = allowedEmails && allowedEmails.includes(user.email);
  const roleAllowed  = allowedRoles  && allowedRoles.includes(user.role);

  if (emailAllowed || roleAllowed) return children;

  message.error("You don't have permission to access this page.");
  return <Navigate to="/access-denied" replace />;
};