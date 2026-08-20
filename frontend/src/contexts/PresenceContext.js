import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';

const PresenceContext = createContext({ onlineUsers: [] });

/* WS URL helper — token auth via query string */
const getWsUrl = (path) => {
  const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
  const token = localStorage.getItem('token') || sessionStorage.getItem('token') || '';
  const isLocalhost = window.location.hostname === 'localhost' || 
                      window.location.hostname === '127.0.0.1';
  const host = isLocalhost ? 'localhost:8000' : 'api.ckpsca.in';
  return `${proto}://${host}${path}?token=${token}`;
};
export function PresenceProvider({ children }) {
  const { user } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState([]);
  const wsRef       = useRef(null);
  const retryRef    = useRef(null);
  const mountedRef  = useRef(true);

  const isLocalhost = window.location.hostname === 'localhost' || 
                      window.location.hostname === '127.0.0.1';

  const connect = useCallback(() => {
    if (!user) return;
    if (isLocalhost) return;   // ← Disable WebSocket in development
    if (wsRef.current && (wsRef.current.readyState === 0 || wsRef.current.readyState === 1)) return;

    const ws = new WebSocket(getWsUrl('/ws/presence/'));

    ws.onopen = () => {
      // Backend marks us online on connect via scope["user"].
      // Send an initial ping to refresh the Redis TTL.
      ws.send(JSON.stringify({ type: 'ping' }));
    };

    ws.onmessage = (ev) => {
      if (!mountedRef.current) return;
      try {
        const data = JSON.parse(ev.data);

        // Initial list sent on connect: { type: "initial", users: ["1","2",...] }
        if (data.type === 'initial') {
          setOnlineUsers((data.users || []).map(String));
          return;
        }

        // Someone came online: { type: "user_online", user_id: 5 }
        if (data.type === 'user_online') {
          const uid = String(data.user_id);
          setOnlineUsers(prev => prev.includes(uid) ? prev : [...prev, uid]);
          return;
        }

        // Someone went offline: { type: "user_offline", user_id: 5 }
        if (data.type === 'user_offline') {
          const uid = String(data.user_id);
          setOnlineUsers(prev => prev.filter(id => id !== uid));
          return;
        }

        // Heartbeat reply — ignore
        if (data.type === 'pong') return;

      } catch (e) {
        console.warn('[Presence] parse error', e);
      }
    };

    ws.onerror = () => {};

    ws.onclose = () => {
      if (!mountedRef.current) return;
      // Retry after 5s
      retryRef.current = setTimeout(() => {
        if (mountedRef.current) connect();
      }, 5000);
    };

    wsRef.current = ws;
  }, [user]);

  // Heartbeat — send ping every 30s to keep presence alive
  useEffect(() => {
    if (!user) return;
    connect();

    const heartbeat = setInterval(() => {
      if (wsRef.current?.readyState === 1) {
        wsRef.current.send(JSON.stringify({ type: 'ping' }));
      } else {
        connect();
      }
    }, 30_000);

    // Mark offline on tab close
    const handleUnload = () => {
      // Close the WS cleanly — backend's disconnect() handler
      // deletes the Redis key and broadcasts user_offline automatically.
      try { wsRef.current?.close(); } catch {}
    };
    window.addEventListener('beforeunload', handleUnload);

    return () => {
      clearInterval(heartbeat);
      clearTimeout(retryRef.current);
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, [user, connect]);

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      clearTimeout(retryRef.current);
      try { wsRef.current?.close(); } catch {}
    };
  }, []);

  return (
    <PresenceContext.Provider value={{ onlineUsers }}>
      {children}
    </PresenceContext.Provider>
  );
}

export function usePresence() {
  return useContext(PresenceContext);
}

export default PresenceContext;