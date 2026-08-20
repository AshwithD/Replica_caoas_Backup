// import React, { useEffect, useState, useContext, useRef, useCallback } from 'react';
// import {
//   Layout, Avatar, Typography, App, Dropdown,
//   List, Badge, Empty, Drawer, Tooltip,
// } from 'antd';
// import {
//   UserOutlined, LogoutOutlined, BellOutlined,
//   MenuFoldOutlined, MenuUnfoldOutlined,
//   MailOutlined, FileDoneOutlined, ScheduleOutlined,
//   BlockOutlined, TeamOutlined, SolutionOutlined,
//   CalendarOutlined, DownOutlined,
//   DashboardOutlined, FileTextOutlined,
//   ClockCircleOutlined, CheckSquareOutlined,
//   SafetyCertificateOutlined,
//   ClusterOutlined, BarChartOutlined, InboxOutlined,
//   MessageOutlined, CloudServerOutlined, DollarOutlined,
// } from '@ant-design/icons';
// import { useNavigate, useLocation, Navigate } from 'react-router-dom';
// import { useAuth } from '../contexts/AuthContext';
// import ProfileModal from '../pages/ProfileModal';
// import { SpinnerContext } from '../components/SpinnerContext';
// import { PuffLoader } from 'react-spinners';

// import DashboardPage from '../components/Dashboardpage';
// import ComingSoon    from '../pages/ComingSoon';

// import logo      from '../assets/CKPSCA_logo.png';
// import caosalogo from '../assets/caoas-logo.png';

// const { Header, Content, Sider } = Layout;

// /* ── Service Worker + Web Push ─────────────────────────────────────────── */
// let _swReg = null;

// async function getSwReg() {
//   if (_swReg) return _swReg;
//   if (!('serviceWorker' in navigator)) return null;
//   try {
//     _swReg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
//     await navigator.serviceWorker.ready;
//     navigator.serviceWorker.addEventListener('message', (ev) => {
//       if (ev.data?.type === 'OPEN_ROOM' && ev.data.roomId) {
//         try { sessionStorage.setItem('caoas_open_room', String(ev.data.roomId)); } catch {}
//         window.dispatchEvent(new CustomEvent('openChatRoom', { detail: { roomId: ev.data.roomId } }));
//       }
//     });
//     return _swReg;
//   } catch (e) {
//     console.warn('[SW] registration failed:', e);
//     return null;
//   }
// }

// function urlBase64ToUint8Array(base64String) {
//   const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
//   const base64  = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
//   const raw     = atob(base64);
//   return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
// }

// let _pushSubscribed = false;

// async function subscribeToPush(apiBase) {
//   if (!('PushManager' in window)) return;
//   if (Notification.permission !== 'granted') return;
//   const reg = await getSwReg();
//   if (!reg) return;
//   try {
//     const keyRes = await fetch(`${apiBase}/api/chat_notifications/push/vapid-key/`);
//     if (!keyRes.ok) return;
//     const { publicKey } = await keyRes.json();
//     let sub = await reg.pushManager.getSubscription();
//     if (!sub) {
//       sub = await reg.pushManager.subscribe({
//         userVisibleOnly:      true,
//         applicationServerKey: urlBase64ToUint8Array(publicKey),
//       });
//     }
//     const token = localStorage.getItem('token') || sessionStorage.getItem('token') || '';
//     const res = await fetch(`${apiBase}/api/chat_notifications/push/subscribe/`, {
//       method:  'POST',
//       headers: { 'Content-Type': 'application/json', 'Authorization': `Token ${token}` },
//       body: JSON.stringify({
//         endpoint: sub.endpoint,
//         p256dh:   btoa(String.fromCharCode(...new Uint8Array(sub.getKey('p256dh')))),
//         auth:     btoa(String.fromCharCode(...new Uint8Array(sub.getKey('auth')))),
//       }),
//     });
//     if (res.ok) { _pushSubscribed = true; console.log('[Push] Subscribed ✓'); }
//   } catch (e) { console.warn('[Push] Subscribe failed:', e); }
// }

// window._caoas_subscribePush = () => {
//   const base = window.__CAOAS_API_BASE__ || '';
//   subscribeToPush(base);
// };

// async function unsubscribeFromPush(apiBase) {
//   const reg = await getSwReg();
//   if (!reg) return;
//   try {
//     const sub = await reg.pushManager.getSubscription();
//     if (!sub) return;
//     const token = localStorage.getItem('token') || sessionStorage.getItem('token') || '';
//     await fetch(`${apiBase}/api/chat_notifications/push/unsubscribe/`, {
//       method:  'POST',
//       headers: { 'Content-Type': 'application/json', 'Authorization': `Token ${token}` },
//       body: JSON.stringify({ endpoint: sub.endpoint }),
//     });
//     await sub.unsubscribe();
//     _pushSubscribed = false;
//   } catch {}
// }

// const NOTIF_ICON = '/caoas-logo.png';

// let _notifAudio = null;
// function playNotifSound() {
//   try {
//     if (!_notifAudio) _notifAudio = new Audio('/notification-sound.mp3');
//     _notifAudio.currentTime = 0;
//     _notifAudio.play().catch(() => {});
//   } catch {}
// }

// const _isMobileDevice = () =>
//   /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
//   navigator.maxTouchPoints > 1;

// async function showNotif(title, body, tag, roomId, requireInteraction = false) {
//   if (typeof Notification === 'undefined') return;
//   if (Notification.permission !== 'granted') return;
//   playNotifSound();
//   const reg = await getSwReg();
//   if (reg) {
//     try {
//       await reg.showNotification(title, {
//         body, icon: NOTIF_ICON, badge: NOTIF_ICON, tag,
//         renotify: true, vibrate: [200, 100, 200], requireInteraction, data: { roomId },
//       });
//       return;
//     } catch (e) { console.warn('[Notif] SW showNotification failed, falling back:', e); }
//   }
//   try {
//     const n = new Notification(title, { body, icon: NOTIF_ICON, tag, renotify: true, requireInteraction });
//     if (roomId) {
//       n.onclick = () => {
//         window.focus();
//         try { sessionStorage.setItem('caoas_open_room', String(roomId)); } catch {}
//         window.dispatchEvent(new CustomEvent('openChatRoom', { detail: { roomId } }));
//         n.close();
//       };
//     }
//     if (!requireInteraction) setTimeout(() => { try { n.close(); } catch {} }, 6000);
//   } catch (e) { console.warn('[Notif] new Notification() failed:', e); }
// }

// const getWsUrl = (path) => {
//   const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
//   const token = localStorage.getItem('token') || sessionStorage.getItem('token') || '';
//   const host = (window.location.hostname === 'localhost' || 
//                 window.location.hostname === '127.0.0.1')
//       ? 'localhost:8000'
//       : 'api.ckpsca.in';
//   return `${proto}://${host}${path}?token=${token}`;
// };

// const { Text } = Typography;

// const isLocalhost = window.location.hostname === 'localhost' || 
//                     window.location.hostname === '127.0.0.1';

// const API_BASE = isLocalhost 
//     ? 'http://localhost:8000'        // ← Development
//     : 'https://api.ckpsca.in';      // ← Production

// if (typeof window !== 'undefined') window.__CAOAS_API_BASE__ = API_BASE;

// const SIDEBAR_WIDTH           = 240;
// const SIDEBAR_COLLAPSED_WIDTH = 64;

// function useIsMobile(breakpoint = 768) {
//   const [isMobile, setIsMobile] = useState(window.innerWidth <= breakpoint);
//   useEffect(() => {
//     const handler = () => setIsMobile(window.innerWidth <= breakpoint);
//     window.addEventListener('resize', handler);
//     return () => window.removeEventListener('resize', handler);
//   }, [breakpoint]);
//   return isMobile;
// }

// function getCookie(name) {
//   let v = null;
//   if (document.cookie) {
//     for (const c of document.cookie.split(';')) {
//       const t = c.trim();
//       if (t.startsWith(name + '=')) { v = decodeURIComponent(t.slice(name.length + 1)); break; }
//     }
//   }
//   return v;
// }

// function timeAgo(d) {
//   if (!d) return '';
//   const s = Math.floor((Date.now() - new Date(d)) / 1000);
//   if (s < 60)     return 'Just now';
//   if (s < 3600)   return `${Math.floor(s / 60)}m ago`;
//   if (s < 86400)  return `${Math.floor(s / 3600)}h ago`;
//   if (s < 604800) return `${Math.floor(s / 86400)}d ago`;
//   return new Date(d).toLocaleDateString();
// }

// function notifIcon(title = '') {
//   const t = title.toLowerCase();
//   if (t.includes('mention')) return { icon: '@',  bg: '#ede9fe', color: '#6d28d9' };
//   if (t.includes('message')) return { icon: '💬', bg: '#e0f2fe', color: '#0369a1' };
//   if (t.includes('task'))    return { icon: '✓',  bg: '#dcfce7', color: '#15803d' };
//   if (t.includes('due') || t.includes('expir')) return { icon: '⏰', bg: '#fef9c3', color: '#92400e' };
//   return { icon: '🔔', bg: '#f1f5f9', color: '#475569' };
// }

// const AVATAR_COLORS = ['#5b6af0','#0ea5e9','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899','#14b8a6'];
// function avatarColor(name = '') {
//   let h = 0;
//   for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
//   return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
// }
// function initials(name = '') {
//   const parts = name.trim().split(' ').filter(Boolean);
//   if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
//   return (parts[0]?.[0] || '?').toUpperCase();
// }

// /* ══════════════════════════════════════════════════════
//    MENU DEFINITION
// ══════════════════════════════════════════════════════ */
// const buildMenuItems = (user) => {
//   const role    = user?.role?.toLowerCase() || '';
//   const email   = user?.email?.toLowerCase() || '';
//   const hasRole  = (...roles)  => roles.map(r => r.toLowerCase()).includes(role);
//   const hasEmail = (...emails) => emails.map(e => e.toLowerCase()).includes(email);

//   return [
//     {
//       key:   '/dashboard',
//       label: 'Dashboard',
//       icon:  <DashboardOutlined />,
//       show:  true,
//     },
//     {
//       key:   '/client-management',
//       label: 'Client Management',
//       icon:  <TeamOutlined />,
//       show:  hasRole('Admin', 'Founder', 'Manager'),
//       children: [
//         { key: '/client-management',              label: 'Client Groups',    icon: <DashboardOutlined /> },
//         { key: '/client-management?view=clients', label: 'Client List',      icon: <TeamOutlined /> },
//         { key: '/client-management?view=service', label: 'Teams & Services', icon: <ClusterOutlined /> },
//         { key: '/client-management?view=dash',    label: 'Task Analytics',   icon: <BarChartOutlined /> },
//       ],
//     },
//     {
//       key:   '/stt-records',
//       label: 'STT Records',
//       icon:  <CheckSquareOutlined />,
//       show:  true,
//     },
//     {
//       key:   '/udin-records',
//       label: 'UDIN Records',
//       icon:  <FileDoneOutlined />,
//       show:  hasRole('Admin','Founder','Manager') ||
//              hasEmail('purnesh.rs@gmail.com','mis@ckpsca.com','sreekanth.d.ckpsca@gmail.com'),
//     },
//     {
//       key:   '/my-work-history',
//       label: 'My Work History',
//       icon:  <ClockCircleOutlined />,
//       show:  true,
//     },
//     {
//       key:   '/documents',
//       label: 'Documents',
//       icon:  <FileTextOutlined />,
//       show:  true,
//     },
//     {
//       key:   '/sop',
//       label: 'Process Documentation',
//       icon:  <BlockOutlined />,
//       show:  true,
//     },
//     {
//       key:   '/employee',
//       label: 'Employees',
//       icon:  <TeamOutlined />,
//       show:  hasRole('Admin', 'Founder', 'HR'),
//     },
//     {
//       key:   '/company-profile',
//       label: 'Company Profile',
//       icon:  <SolutionOutlined />,
//       show:  hasRole('Admin', 'Founder'),
//     },
//   ].filter(item => item.show !== false);
// };

// /* ══════════════════════════════════════════════════════
//    SIDEBAR
// ══════════════════════════════════════════════════════ */
// function Sidebar({ collapsed, user, navigate, location }) {
//   const menuItems = buildMenuItems(user);
//   const [openMenus, setOpenMenus] = useState({});

//   const isActive = (key) => {
//     const [path, query] = key.split('?');
//     if (query) return location.pathname === path && location.search === '?' + query;
//     return (location.pathname === path || location.pathname.startsWith(path + '/')) && !location.search;
//   };

//   useEffect(() => {
//     const updates = {};
//     menuItems.forEach(item => {
//       if (item.children && item.children.some(c => isActive(c.key))) updates[item.key] = true;
//     });
//     if (Object.keys(updates).length) setOpenMenus(prev => ({ ...prev, ...updates }));
//   }, [location.pathname, location.search]);

//   const toggleMenu = (key) => setOpenMenus(prev => ({ ...prev, [key]: !prev[key] }));

//   const itemBase = {
//     display: 'flex', alignItems: 'center',
//     borderRadius: 8, cursor: 'pointer',
//     margin: '1px 8px',
//     fontSize: 13,
//     transition: 'all 0.18s ease',
//     whiteSpace: 'nowrap',
//     flexShrink: 0,
//   };

//   const itemStyle = (active) => ({
//     ...itemBase,
//     gap: collapsed ? 0 : 10,
//     padding: collapsed ? '9px 0' : '9px 14px',
//     justifyContent: collapsed ? 'center' : 'flex-start',
//     background: active ? 'rgba(255,255,255,0.13)' : 'transparent',
//     borderLeft: active ? '3px solid #60a5fa' : '3px solid transparent',
//     color: active ? '#fff' : 'rgba(255,255,255,0.7)',
//     fontWeight: active ? 600 : 400,
//   });

//   const iconStyle = { fontSize: 15, flexShrink: 0, minWidth: 15 };

//   return (
//     <div style={{ paddingTop: 6 }}>
//       {menuItems.map(item => {
//         if (item.children) {
//           const anyChildActive = item.children.some(c => isActive(c.key));
//           const active = isActive(item.key) || anyChildActive;
//           return (
//             <div key={item.key}>
//               {collapsed ? (
//                 <Tooltip title={item.label} placement="right">
//                   <div
//                     style={itemStyle(active)}
//                     onClick={() => navigate(item.children[0]?.key || item.key)}
//                     onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
//                     onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
//                   >
//                     <span style={iconStyle}>{item.icon}</span>
//                   </div>
//                 </Tooltip>
//               ) : (
//                 <div
//                   style={{ ...itemStyle(active), justifyContent: 'space-between' }}
//                   onClick={() => toggleMenu(item.key)}
//                   onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
//                   onMouseLeave={e => { if (!active) e.currentTarget.style.background = active ? 'rgba(255,255,255,0.13)' : 'transparent'; }}
//                 >
//                   <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
//                     <span style={iconStyle}>{item.icon}</span>
//                     <span>{item.label}</span>
//                   </div>
//                   <DownOutlined style={{
//                     fontSize: 9, opacity: 0.6,
//                     transition: 'transform 0.2s',
//                     transform: openMenus[item.key] ? 'rotate(180deg)' : 'rotate(0deg)',
//                     flexShrink: 0,
//                   }} />
//                 </div>
//               )}

//               {!collapsed && openMenus[item.key] && (
//                 <div style={{
//                   marginLeft: 14,
//                   borderLeft: '1px solid rgba(255,255,255,0.12)',
//                   paddingLeft: 6,
//                   marginRight: 8,
//                 }}>
//                   {item.children.map(child => {
//                     const cActive = isActive(child.key);
//                     return (
//                       <div
//                         key={child.key}
//                         style={{
//                           ...itemStyle(cActive),
//                           margin: '1px 0',
//                           padding: '7px 10px',
//                           fontSize: 12,
//                         }}
//                         onClick={() => navigate(child.key)}
//                         onMouseEnter={e => { if (!cActive) e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
//                         onMouseLeave={e => { if (!cActive) e.currentTarget.style.background = 'transparent'; }}
//                       >
//                         <span style={{ ...iconStyle, fontSize: 12 }}>{child.icon}</span>
//                         <span>{child.label}</span>
//                       </div>
//                     );
//                   })}
//                 </div>
//               )}
//             </div>
//           );
//         }

//         const active = isActive(item.key);
//         return collapsed ? (
//           <Tooltip key={item.key} title={item.label} placement="right">
//             <div
//               style={itemStyle(active)}
//               onClick={() => navigate(item.key)}
//               onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
//               onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
//             >
//               <span style={iconStyle}>{item.icon}</span>
//             </div>
//           </Tooltip>
//         ) : (
//           <div
//             key={item.key}
//             style={itemStyle(active)}
//             onClick={() => navigate(item.key)}
//             onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
//             onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
//           >
//             <span style={iconStyle}>{item.icon}</span>
//             <span>{item.label}</span>
//           </div>
//         );
//       })}
//     </div>
//   );
// }

// /* ══════════════════════════════════════════════════════
//    NOTIFICATION PANEL
// ══════════════════════════════════════════════════════ */
// const NotificationPanel = ({ notifications, isMobile, onOpen, unreadCount, onMarkAll, chatUnreadItems = [], onOpenChat }) => {
//   const hasChatUnread  = chatUnreadItems.length > 0;
//   const hasSystemNotif = notifications.length > 0;
//   const isEmpty        = !hasChatUnread && !hasSystemNotif;

//   return (
//     <div style={{ width: isMobile ? '100%' : 420, fontFamily: 'system-ui,sans-serif' }}>
//       <div style={{
//         display: 'flex', alignItems: 'center', justifyContent: 'space-between',
//         padding: '14px 18px 10px', borderBottom: '1px solid #f1f5f9',
//       }}>
//         <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
//           <span style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Notifications</span>
//           {unreadCount > 0 && (
//             <span style={{ background: '#6366f1', color: '#fff', fontSize: 11, fontWeight: 700, padding: '1px 7px', borderRadius: 20 }}>
//               {unreadCount}
//             </span>
//           )}
//         </div>
//         {unreadCount > 0 && (
//           <button onClick={onMarkAll} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: '#6366f1', fontWeight: 600, padding: 0 }}>
//             Mark all read
//           </button>
//         )}
//       </div>

//       <div style={{ maxHeight: isMobile ? '70vh' : 520, overflowY: 'auto', padding: '6px 8px' }}>
//         {isEmpty ? (
//           <div style={{ padding: '40px 0', textAlign: 'center' }}>
//             <div style={{ fontSize: 36, marginBottom: 8 }}>🔕</div>
//             <div style={{ fontSize: 13, color: '#94a3b8', fontWeight: 500 }}>You're all caught up!</div>
//           </div>
//         ) : (
//           <>
//             {hasChatUnread && (
//               <div>
//                 <div style={{ padding: '8px 10px 4px', fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: '.8px', textTransform: 'uppercase' }}>
//                   💬 Unread Messages
//                 </div>
//                 {chatUnreadItems.map(item => {
//                   const msgs      = item.messages || [];
//                   const lastMsg   = msgs[msgs.length - 1];
//                   const bg        = item.isMentioned ? 'rgba(109,40,217,0.06)' : 'rgba(91,106,240,0.05)';
//                   const accentClr = item.isMentioned ? '#7c3aed' : '#5b6af0';
//                   return (
//                     <div key={item.roomId} onClick={() => onOpenChat?.(item.roomId)}
//                       style={{ borderRadius: 12, marginBottom: 6, cursor: 'pointer', background: bg, border: `1px solid ${item.isMentioned ? 'rgba(124,58,237,0.18)' : 'rgba(91,106,240,0.12)'}`, transition: 'background 0.15s, box-shadow 0.15s', overflow: 'hidden' }}
//                       onMouseEnter={e => { e.currentTarget.style.background = '#eef0fe'; e.currentTarget.style.boxShadow = '0 2px 10px rgba(91,106,240,0.12)'; }}
//                       onMouseLeave={e => { e.currentTarget.style.background = bg; e.currentTarget.style.boxShadow = 'none'; }}>
//                       <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px 6px' }}>
//                         <div style={{ width: 34, height: 34, borderRadius: 9, flexShrink: 0, background: avatarColor(item.name), display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 13, position: 'relative' }}>
//                           {initials(item.name)}
//                           {item.isMentioned && (
//                             <div style={{ position: 'absolute', top: -3, right: -3, width: 13, height: 13, borderRadius: '50%', background: '#7c3aed', color: '#fff', fontSize: 7, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1.5px solid #fff' }}>@</div>
//                           )}
//                         </div>
//                         <div style={{ flex: 1, minWidth: 0 }}>
//                           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
//                             <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>{item.name}</span>
//                             <span style={{ fontSize: 10, color: '#94a3b8', flexShrink: 0, marginLeft: 8 }}>{lastMsg?.time ? timeAgo(lastMsg.time) : ''}</span>
//                           </div>
//                           {item.isMentioned && <div style={{ fontSize: 10, color: '#7c3aed', fontWeight: 700, marginTop: 1 }}>You were mentioned</div>}
//                         </div>
//                         <div style={{ minWidth: 20, height: 20, borderRadius: 10, background: accentClr, color: '#fff', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 5px', flexShrink: 0 }}>
//                           {item.count > 99 ? '99+' : item.count}
//                         </div>
//                       </div>
//                       <div style={{ padding: '0 12px 10px', display: 'flex', flexDirection: 'column', gap: 4 }}>
//                         {msgs.map((m, mi) => {
//                           const isLast    = mi === msgs.length - 1;
//                           const bubbleBg  = m.isMentioned ? '#ede9fe' : isLast ? '#fff' : '#f8fafc';
//                           const textClr   = m.isMentioned ? '#5b21b6' : '#334155';
//                           const borderClr = m.isMentioned ? 'rgba(124,58,237,0.25)' : 'rgba(0,0,0,0.07)';
//                           return (
//                             <div key={mi} style={{ background: bubbleBg, border: `1px solid ${borderClr}`, borderRadius: 8, padding: '5px 9px', opacity: isLast ? 1 : 0.72 }}>
//                               {item.isGroup && m.sender && <div style={{ fontSize: 10, fontWeight: 700, color: accentClr, marginBottom: 2 }}>{m.sender}</div>}
//                               <div style={{ fontSize: 12, color: textClr, lineHeight: 1.45, wordBreak: 'break-word' }}>
//                                 {m.isMentioned && <span style={{ background: '#ddd6fe', color: '#5b21b6', borderRadius: 4, padding: '0 3px', marginRight: 4, fontSize: 10, fontWeight: 700 }}>@you</span>}
//                                 {m.text}
//                               </div>
//                             </div>
//                           );
//                         })}
//                       </div>
//                     </div>
//                   );
//                 })}
//                 <div onClick={() => onOpenChat?.(null)}
//                   style={{ padding: '7px 10px', fontSize: 12, color: '#5b6af0', fontWeight: 600, cursor: 'pointer', textAlign: 'center', borderRadius: 8, transition: 'background 0.13s' }}
//                   onMouseEnter={e => e.currentTarget.style.background = '#eef0fe'}
//                   onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
//                   {chatUnreadItems.reduce((s, x) => s + x.count, 0)} unread message{chatUnreadItems.reduce((s, x) => s + x.count, 0) !== 1 ? 's' : ''} — Open Chat →
//                 </div>
//               </div>
//             )}

//             {hasChatUnread && hasSystemNotif && <div style={{ height: 1, background: '#f1f5f9', margin: '4px 8px 8px' }} />}

//             {hasSystemNotif && (
//               <div>
//                 {hasChatUnread && (
//                   <div style={{ padding: '4px 10px 4px', fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: '.8px', textTransform: 'uppercase' }}>
//                     🔔 Other Notifications
//                   </div>
//                 )}
//                 {notifications.map(item => {
//                   const ni = notifIcon(item.title);
//                   return (
//                     <div key={item.id} onClick={() => onOpen(item)}
//                       style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '11px 10px', borderRadius: 10, marginBottom: 2, cursor: 'pointer', background: item.is_read ? 'transparent' : 'rgba(99,102,241,0.06)', transition: 'background 0.15s' }}
//                       onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
//                       onMouseLeave={e => e.currentTarget.style.background = item.is_read ? 'transparent' : 'rgba(99,102,241,0.06)'}>
//                       <div style={{ width: 38, height: 38, borderRadius: 10, flexShrink: 0, background: ni.bg, color: ni.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700 }}>{ni.icon}</div>
//                       <div style={{ flex: 1, minWidth: 0 }}>
//                         <div style={{ fontSize: 13, fontWeight: item.is_read ? 500 : 700, color: '#0f172a', marginBottom: 2 }}>{item.title}</div>
//                         <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.5 }}>{item.message}</div>
//                         <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>{timeAgo(item.created_at)}</div>
//                       </div>
//                       {!item.is_read && <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#6366f1', flexShrink: 0, marginTop: 4 }} />}
//                     </div>
//                   );
//                 })}
//               </div>
//             )}
//           </>
//         )}
//       </div>
//     </div>
//   );
// };

// /* ══════════════════════════════════════════════════════
//    INTRACHAT BUTTON COMPONENTS
// ══════════════════════════════════════════════════════ */

// function IntraChatButton({ chatUnread, isActive, onClick, collapsed }) {
//   const [hovered, setHovered] = useState(false);

//   if (collapsed) {
//     return (
//       <Tooltip title="IntraChat" placement="right">
//         <div
//           onClick={onClick}
//           onMouseEnter={() => setHovered(true)}
//           onMouseLeave={() => setHovered(false)}
//           style={{
//             display: 'flex',
//             alignItems: 'center',
//             justifyContent: 'center',
//             margin: '0 8px',
//             padding: '10px 0',
//             borderRadius: 10,
//             cursor: 'pointer',
//             background: isActive
//               ? 'linear-gradient(135deg, #3b82f6, #6366f1)'
//               : hovered
//                 ? 'rgba(255,255,255,0.1)'
//                 : 'transparent',
//             transition: 'all 0.2s ease',
//             position: 'relative',
//           }}
//         >
//           <Badge count={chatUnread > 99 ? '99+' : chatUnread} size="small" offset={[4, -2]}>
//             <MessageOutlined style={{ fontSize: 18, color: '#fff' }} />
//           </Badge>
//         </div>
//       </Tooltip>
//     );
//   }

//   return (
//     <div
//       onClick={onClick}
//       onMouseEnter={() => setHovered(true)}
//       onMouseLeave={() => setHovered(false)}
//       style={{
//         margin: '0 8px',
//         borderRadius: 12,
//         cursor: 'pointer',
//         overflow: 'hidden',
//         transition: 'all 0.2s ease',
//         background: isActive
//           ? 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)'
//           : hovered
//             ? 'linear-gradient(135deg, rgba(59,130,246,0.25) 0%, rgba(99,102,241,0.25) 100%)'
//             : 'linear-gradient(135deg, rgba(59,130,246,0.12) 0%, rgba(99,102,241,0.12) 100%)',
//         border: isActive
//           ? '1px solid rgba(255,255,255,0.2)'
//           : '1px solid rgba(99,102,241,0.25)',
//         boxShadow: isActive
//           ? '0 4px 16px rgba(79,70,229,0.4), inset 0 1px 0 rgba(255,255,255,0.15)'
//           : hovered
//             ? '0 2px 8px rgba(79,70,229,0.2)'
//             : 'none',
//         transform: hovered && !isActive ? 'translateY(-1px)' : 'none',
//       }}
//     >
//       <div style={{
//         display: 'flex',
//         alignItems: 'center',
//         justifyContent: 'space-between',
//         padding: '10px 14px',
//       }}>
//         <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
//           <div style={{
//             width: 30,
//             height: 30,
//             borderRadius: 8,
//             background: isActive
//               ? 'rgba(255,255,255,0.2)'
//               : 'rgba(99,102,241,0.2)',
//             display: 'flex',
//             alignItems: 'center',
//             justifyContent: 'center',
//             flexShrink: 0,
//             boxShadow: isActive ? '0 0 8px rgba(99,102,241,0.6)' : 'none',
//             transition: 'all 0.2s',
//           }}>
//             <MessageOutlined style={{ fontSize: 14, color: '#fff' }} />
//           </div>
//           <div>
//             <div style={{
//               fontSize: 13,
//               fontWeight: 700,
//               color: '#fff',
//               lineHeight: '16px',
//               letterSpacing: '0.01em',
//             }}>
//               IntraChat
//             </div>
//             <div style={{
//               fontSize: 10,
//               color: isActive ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.45)',
//               lineHeight: '13px',
//               marginTop: 1,
//             }}>
//               {chatUnread > 0 ? `${chatUnread} unread` : 'Internal messaging'}
//             </div>
//           </div>
//         </div>

//         {chatUnread > 0 ? (
//           <div style={{
//             minWidth: 20,
//             height: 20,
//             borderRadius: 10,
//             background: '#f43f5e',
//             color: '#fff',
//             fontSize: 10,
//             fontWeight: 800,
//             display: 'flex',
//             alignItems: 'center',
//             justifyContent: 'center',
//             padding: '0 5px',
//             flexShrink: 0,
//             boxShadow: '0 2px 6px rgba(244,63,94,0.5)',
//             animation: 'pulse 2s infinite',
//           }}>
//             {chatUnread > 99 ? '99+' : chatUnread}
//           </div>
//         ) : (
//           <div style={{
//             width: 8,
//             height: 8,
//             borderRadius: '50%',
//             background: '#10b981',
//             flexShrink: 0,
//             boxShadow: '0 0 6px rgba(16,185,129,0.6)',
//           }} />
//         )}
//       </div>
//     </div>
//   );
// }

// /* ══════════════════════════════════════════════════════
//    MAIN LAYOUT
// ══════════════════════════════════════════════════════ */
// export default function AppLayout({ children }) {
//   const navigate  = useNavigate();
//   const location  = useLocation();
//   const { showSpinner, hideSpinner } = useContext(SpinnerContext);
//   const { message: antMessage }      = App.useApp();
//   const { user, logout, loading: authLoading, setUser } = useAuth();
//   const isMobile  = useIsMobile();

//   const [collapsed,        setCollapsed]       = useState(false);
//   const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
//   const [isProfileVisible, setProfileVisible]   = useState(false);
//   const [notifications,    setNotifications]    = useState([]);
//   const [unreadCount,      setUnreadCount]      = useState(0);
//   const [notifOpen,        setNotifOpen]        = useState(false);
//   const [userDrawerOpen,   setUserDrawerOpen]   = useState(false);

//   const [chatUnread,      setChatUnread]      = useState(0);
//   const [chatUnreadItems, setChatUnreadItems] = useState([]);

//   useEffect(() => {
//     const handler = (e) => {
//       const roomId = e.detail?.roomId;
//       if (!roomId) return;
//       setChatUnreadItems(prev => {
//         const item = prev.find(x => String(x.roomId) === String(roomId));
//         if (!item) return prev;
//         setChatUnread(n => Math.max(n - item.count, 0));
//         return prev.filter(x => String(x.roomId) !== String(roomId));
//       });
//     };
//     window.addEventListener('clearChatRoom', handler);
//     return () => window.removeEventListener('clearChatRoom', handler);
//   }, []);

//   const totalBellCount = unreadCount + chatUnread;

//   const bgWsRef    = useRef({});
//   const bgRoomsRef = useRef([]);

//   const fireGlobalNotif = useCallback((title, body, tag = 'caoas-global', roomId = null) => {
//     showNotif(title, body, tag, roomId, false);
//   }, []);

//   const openBgSockets = useCallback((rooms) => {
//     const currentIds = new Set(rooms.map(r => String(r.id)));
//     Object.keys(bgWsRef.current).forEach(rid => {
//       if (!currentIds.has(rid)) {
//         try { bgWsRef.current[rid].close(); } catch {}
//         delete bgWsRef.current[rid];
//       }
//     });
//     rooms.forEach(room => {
//       const rid = String(room.id);
//       const ex  = bgWsRef.current[rid];
//       if (ex && (ex.readyState === 0 || ex.readyState === 1)) return;
//       const ws = new WebSocket(getWsUrl(`/ws/chat/${rid}/`));
//       ws.onmessage = (ev) => {
//         try {
//           const d = JSON.parse(ev.data);
//           if (d.type !== 'message' && d.type !== 'file_message') return;
//           const me       = user;
//           const senderId = d.sender ?? d.sender_id ?? d.user_id ?? d.user ?? null;
//           if (senderId !== null && String(senderId) === String(me?.id)) return;
//           const activeChatRoomId = sessionStorage.getItem('caoas_active_room_id');
//           const tabFocused = document.hasFocus();
//           const tabVisible = document.visibilityState === 'visible';
//           if (window.location.pathname === '/chat' && tabFocused && tabVisible && activeChatRoomId === rid) return;
//           const r = bgRoomsRef.current.find(x => String(x.id) === rid);
//           if (!d.sender_name && r) {
//             const p = r.participants?.find(p => String(p.id) === String(senderId));
//             if (p) d.sender_name = p.full_name || p.email || '';
//           }
//           const senderName = (d.sender_name || '').trim() || 'New message';
//           const msgText    = (d.message || d.content || '').trim() ||
//             (d.attachments?.length ? `📎 ${d.attachments[0]?.original_filename || 'Attachment'}` : 'Sent a message');
//           const roomName   = r?.is_group ? (r.display_name || 'Group Chat') : '';
//           const body       = roomName ? `${roomName}\n${msgText}` : msgText;
//           const isMention = (() => {
//             const myName = (me?.first_name || me?.username || me?.email || '').toLowerCase();
//             const lower  = msgText.toLowerCase();
//             return myName && (lower.includes(`@${myName}`) || (d.mentions || []).some(x => x.toLowerCase().includes(myName)));
//           })();
//           const title = isMention ? `${senderName} mentioned you` : senderName;
//           const activeRoomId = sessionStorage.getItem('caoas_active_room_id');
//           const isWatchingThis = (
//             document.hasFocus() && document.visibilityState === 'visible' &&
//             window.location.pathname === '/chat' &&
//             activeRoomId && String(activeRoomId) === rid
//           );
//           if (!isWatchingThis) fireGlobalNotif(title, body, `caoas-bg-${rid}`, rid);
//           const newMsg = {
//             sender:      r?.is_group ? senderName : '',
//             text:        msgText,
//             time:        d.created_at || new Date().toISOString(),
//             isMentioned: isMention,
//           };
//           setChatUnreadItems(prev => {
//             const existing    = prev.find(x => String(x.roomId) === rid);
//             const displayName = roomName || r?.display_name || senderName || 'Chat';
//             if (existing) {
//               const msgs = [...(existing.messages || []), newMsg].slice(-3);
//               return prev.map(x => String(x.roomId) !== rid ? x : {
//                 ...x, count: x.count + 1, messages: msgs, isMentioned: x.isMentioned || isMention,
//               });
//             }
//             return [...prev, { roomId: rid, name: displayName, count: 1, isGroup: r?.is_group || false, messages: [newMsg], isMentioned: isMention }];
//           });
//           setChatUnread(n => n + 1);
//           window.dispatchEvent(new CustomEvent('bgRoomUnread', { detail: { roomId: rid, count: 1 } }));
//           window.dispatchEvent(new CustomEvent('bgLastMessage', { detail: { roomId: rid, content: msgText, time: d.created_at || new Date().toISOString() }}));
//         } catch {}
//       };
//       let _bgPing = null;
//       ws.onopen = () => {
//         _bgPing = setInterval(() => {
//           if (ws.readyState === WebSocket.OPEN) { try { ws.send(JSON.stringify({ type: 'ping' })); } catch {} }
//           else clearInterval(_bgPing);
//         }, 30000);
//       };
//       ws.onerror = () => {};
//       // ws.onclose = () => {
//       //   if (_bgPing) { clearInterval(_bgPing); _bgPing = null; }
//       //   setTimeout(() => {
//       //     if (bgRoomsRef.current.some(r => String(r.id) === rid)) openBgSockets(bgRoomsRef.current);
//       //   }, 5000);
//       // };

//       ws.onclose = () => {
//         if (_bgPing) { clearInterval(_bgPing); _bgPing = null; }
//         setTimeout(() => {
//           // Don't reconnect if user has been logged out
//           const token = localStorage.getItem('token') || sessionStorage.getItem('token');
//           if (token && bgRoomsRef.current.some(r => String(r.id) === rid)) {
//             openBgSockets(bgRoomsRef.current);
//           }
//         }, 5000);
//       };
//       bgWsRef.current[rid] = ws;
//     });
//   }, [user, fireGlobalNotif]);

//   useEffect(() => {
//     if (!user) return;
    
//     // ← Disable chat WebSocket in development (chat_notifications app not available)
//     const isLocalhost = window.location.hostname === 'localhost' || 
//                         window.location.hostname === '127.0.0.1';
//     if (isLocalhost) return;

//     let cancelled = false;
//     (async () => {
//       try {
//         const token = sessionStorage.getItem('token') || '';
//         const res = await fetch(`${API_BASE}/api/chat_notifications/conversations/`, {
//           credentials: 'include',
//           headers: token ? { 'Authorization': `Token ${token}` } : {},
//         });
//         if (!res.ok || cancelled) return;
//         const rooms = await res.json();
//         bgRoomsRef.current = rooms;
//         openBgSockets(rooms);
//       } catch {}
//     })();
//     return () => { cancelled = true; };
//   }, [user]);

//   useEffect(() => {
//     return () => {
//       Object.values(bgWsRef.current).forEach(ws => { try { ws.close(); } catch {} });
//       bgWsRef.current = {};
//     };
//   }, []);

//   const fetchUser = async () => {
//     try {
//       const token = localStorage.getItem('token') || sessionStorage.getItem('token') || '';
//       const res = await fetch(`${API_BASE}/api/auth/user/`, {
//         credentials: 'include',
//         headers: token ? { 'Authorization': `Token ${token}` } : {},
//       });
//       if (res.ok) setUser(await res.json());
//     } catch {}
//   };

//   const notifWsRef    = useRef(null);
//   const notifRetryRef = useRef(null);

//   const connectNotifSocket = useCallback(() => {
//     if (!user) return;

//     // ← Disable in development
//     const isLocalhost = window.location.hostname === 'localhost' || 
//                         window.location.hostname === '127.0.0.1';
//     if (isLocalhost) return;

//     if (notifWsRef.current && (notifWsRef.current.readyState === 0 || notifWsRef.current.readyState === 1)) return;
//     const ws = new WebSocket(getWsUrl('/ws/notifications/'));
//     ws.onmessage = (ev) => {
//       try {
//         const d = JSON.parse(ev.data);
//         const isReaction = d.type === 'reaction_notification' ||
//           (d.message || '').toLowerCase().includes('reacted to your message');
//         const notif = {
//           id:            d.id || `rt-${Date.now()}`,
//           title:         d.title || (isReaction ? `${d.sender_name || 'Someone'} reacted` : 'Notification'),
//           message:       d.message || d.content || '',
//           is_read:       false,
//           created_at:    d.created_at || new Date().toISOString(),
//           reference_url: d.reference_url || null,
//           type:          d.type || 'notification',
//         };
//         setNotifications(prev => {
//           if (prev.some(n => n.id === notif.id)) return prev;
//           return [notif, ...prev];
//         });
//         if (!isReaction) setUnreadCount(prev => prev + 1);
//         const activeRoomId = sessionStorage.getItem('caoas_active_room_id');
//         const isWatchingConv = (
//           document.hasFocus() && document.visibilityState === 'visible' &&
//           window.location.pathname === '/chat' &&
//           d.conversation_id && String(activeRoomId) === String(d.conversation_id)
//         );
//         if (!isWatchingConv) {
//           const tag = isReaction ? `caoas-reaction-${d.message_id || d.id}` : `caoas-notif-${d.id || Date.now()}`;
//           showNotif(notif.title, notif.message, tag, d.conversation_id || null, isReaction);
//         }
//       } catch {}
//     };
//     let _notifPing = null;
//     ws.onopen = (ws._onopen = () => {
//       _notifPing = setInterval(() => {
//         if (ws.readyState === WebSocket.OPEN) { try { ws.send(JSON.stringify({ type: 'ping' })); } catch {} }
//         else clearInterval(_notifPing);
//       }, 30000);
//     });
//     ws.onerror = () => {};
//     ws.onclose = () => {
//       if (_notifPing) { clearInterval(_notifPing); _notifPing = null; }
//       notifRetryRef.current = setTimeout(() => { if (user) connectNotifSocket(); }, 5000);
//     };
//     notifWsRef.current = ws;
//   }, [user]);

//   // ── Logout handler — passes reason=null for manual logout ────────────────
//   const handleLogout = async () => {
//     setUserDrawerOpen(false);
//     await unsubscribeFromPush(API_BASE);
//     logout(false, null); // isAutoLogout=false, reason=null → "Logged out successfully!"
//     showSpinner(2000);
//     hideSpinner();
//   };

//   // const fetchNotifications = async () => {
//   //   try {
//   //     const token = sessionStorage.getItem('token') || '';
//   //     if (!token) return;
//   //     const res = await fetch(`${API_BASE}/api/chat_notifications/notifications/`, {
//   //       credentials: 'include',
//   //       headers: { 'Authorization': `Token ${token}` },
//   //     });
//   //     if (!res.ok) return;

//   const fetchNotifications = async () => {
//     try {
//       const token = sessionStorage.getItem('token') || '';
//       if (!token) return;
//       const res = await fetch(`${API_BASE}/api/chat_notifications/notifications/`, {
//         credentials: 'include',
//         headers: { 'Authorization': `Token ${token}` },
//       });

//       // ── Detect deactivated account ──────────────────────────────────────
//       if (res.status === 401) {
//         try {
//           const data = await res.json();
//           const detail = (data?.detail || '').toLowerCase();
//           if (detail.includes('inactive') || detail.includes('deleted') || detail.includes('disabled')) {
//             window.dispatchEvent(new CustomEvent('auth:deactivated'));
//           }
//         } catch {}
//         return;
//       }

//       if (!res.ok) return;
//       const data = await res.json();
//       const unread = data.filter(n => !n.is_read);
//       const nonReactionUnread = unread.filter(n =>
//         n.type !== 'reaction_notification' &&
//         !(n.title || '').toLowerCase().includes('reacted') &&
//         !(n.message || '').toLowerCase().includes('reacted to your message')
//       );
//       setNotifications(unread);
//       setUnreadCount(nonReactionUnread.length);
//     } catch {}
//   };

//   useEffect(() => {
//     const init = async () => {
//       const isLocalhost = window.location.hostname === 'localhost' || 
//                           window.location.hostname === '127.0.0.1';
      
//       // Only fetch CSRF in production
//       if (!isLocalhost) {
//         try {
//           await fetch(`${API_BASE}/api/get-csrf-token/`, { credentials: 'include' });
//         } catch {}
//         fetchNotifications();
//         getSwReg();
//       }
//     };
//     init();
//     // Only poll notifications in production
//     const isLocalhost = window.location.hostname === 'localhost' || 
//                         window.location.hostname === '127.0.0.1';
//     const interval = isLocalhost ? null : setInterval(fetchNotifications, 60000);
//     return () => clearInterval(interval);
//   }, []);

//   useEffect(() => {
//     if (!user) return;
//     connectNotifSocket();
//     if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
//       subscribeToPush(API_BASE);
//     }
//     return () => {
//       clearTimeout(notifRetryRef.current);
//       try { notifWsRef.current?.close(); } catch {}
//     };
//   }, [user, connectNotifSocket]);

//   useEffect(() => {
//     if (typeof Notification === 'undefined') return;
//     if (!navigator.permissions) return;
//     navigator.permissions.query({ name: 'notifications' }).then(status => {
//       status.onchange = () => { if (status.state === 'granted' && user) subscribeToPush(API_BASE); };
//     }).catch(() => {});
//   }, [user]);

//   // ── Listen for account deactivation fired by AuthContext or api.js ─────────
//   useEffect(() => {
//       const handleDeactivated = () => {
//           logout(false, 'deactivated');
//       };
//       window.addEventListener('auth:deactivated', handleDeactivated);
//       return () => window.removeEventListener('auth:deactivated', handleDeactivated);
//   }, [logout]);

//   const openNotification = async (notif) => {
//     const csrf  = getCookie('csrftoken');
//     const token = sessionStorage.getItem('token') || '';
//     await fetch(`${API_BASE}/api/chat_notifications/notifications/${notif.id}/mark_read/`, {
//       method: 'PATCH', credentials: 'include',
//       headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrf, 'Authorization': `Token ${token}` },
//     });
//     setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n));
//     setUnreadCount(prev => Math.max(prev - 1, 0));
//     setNotifOpen(false);
//     const convId = notif.conversation_id || notif.data?.conversation_id;
//     if (convId) {
//       try { sessionStorage.setItem('caoas_open_room', String(convId)); } catch {}
//       window.dispatchEvent(new CustomEvent('openChatRoom', { detail: { roomId: convId } }));
//       navigate('/chat');
//     } else if (notif.reference_url) {
//       navigate(notif.reference_url);
//     }
//   };

//   const markAllRead = async () => {
//     const csrf  = getCookie('csrftoken');
//     const token = sessionStorage.getItem('token') || '';
//     await Promise.all(
//       notifications.filter(n => !n.is_read).map(n =>
//         fetch(`${API_BASE}/api/chat_notifications/notifications/${n.id}/mark_read/`, {
//           method: 'PATCH', credentials: 'include',
//           headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrf, 'Authorization': `Token ${token}` },
//         })
//       )
//     );
//     setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
//     setUnreadCount(0);
//   };

//   if (authLoading) {
//     return (
//       <Layout style={{ minHeight: '100vh', justifyContent: 'center', alignItems: 'center', backgroundColor: 'white' }}>
//         <PuffLoader color="#001F5B" size={80} />
//       </Layout>
//     );
//   }

//   if (!user) return <Navigate to="/login" replace />;

//   const notifProps = {
//     notifications, isMobile, onOpen: openNotification,
//     unreadCount: totalBellCount, onMarkAll: markAllRead,
//     chatUnreadItems,
//     onOpenChat: (roomId) => {
//       setNotifOpen(false);
//       if (roomId) { try { sessionStorage.setItem('caoas_open_room', String(roomId)); } catch {} }
//       window.dispatchEvent(new CustomEvent('openChatRoom', { detail: { roomId } }));
//       navigate('/chat');
//     },
//   };

//   const isChatPage    = location.pathname === '/chat';
//   const isChatActive  = isChatPage;
//   const HEADER_HEIGHT = isMobile ? 60 : 64;
//   const sidebarBg     = 'linear-gradient(180deg, #023C6C 0%, #041e3a 100%)';

//   const handleChatNavigate = () => {
//     navigate('/chat');
//     setMobileDrawerOpen(false);
//   };

//   const SidebarContent = (
//     <div style={{ background: sidebarBg, height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

//       <div style={{
//         display: 'flex', alignItems: 'center',
//         justifyContent: collapsed ? 'center' : 'space-between',
//         padding: collapsed ? '14px 0' : '14px 16px',
//         borderBottom: '1px solid rgba(255,255,255,0.1)',
//         minHeight: 56, flexShrink: 0,
//       }}>
//         {!collapsed && (
//           <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
//             Navigation
//           </span>
//         )}
//         <div
//           onClick={() => setCollapsed(c => !c)}
//           style={{ cursor: 'pointer', color: 'rgba(255,255,255,0.5)', fontSize: 17, display: 'flex', alignItems: 'center', padding: 4, borderRadius: 6, transition: 'color 0.2s' }}
//           onMouseEnter={e => e.currentTarget.style.color = '#fff'}
//           onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}
//         >
//           {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
//         </div>
//       </div>

//       <div style={{
//         flex: 1,
//         overflowY: 'auto',
//         overflowX: 'hidden',
//         paddingBottom: 8,
//         scrollbarWidth: 'thin',
//         scrollbarColor: 'rgba(255,255,255,0.15) transparent',
//       }}>
//         <Sidebar
//           collapsed={collapsed}
//           user={user}
//           navigate={(path) => { navigate(path); setMobileDrawerOpen(false); }}
//           location={location}
//         />
//       </div>

//       <div style={{
//         flexShrink: 0,
//         borderTop: '1px solid rgba(255,255,255,0.08)',
//         padding: '10px 0 8px',
//         background: 'rgba(0,0,0,0.15)',
//       }}>
//         <style>{`
//           @keyframes pulse {
//             0%, 100% { transform: scale(1); box-shadow: 0 2px 6px rgba(244,63,94,0.5); }
//             50% { transform: scale(1.08); box-shadow: 0 2px 10px rgba(244,63,94,0.75); }
//           }
//         `}</style>
//         <IntraChatButton
//           chatUnread={chatUnread}
//           isActive={isChatActive}
//           onClick={handleChatNavigate}
//           collapsed={collapsed}
//         />
//       </div>

//     </div>
//   );

//   return (
//     <Layout style={{ height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

//       {/* ── HEADER ── */}
//       <Header style={{
//         display: 'flex', alignItems: 'center', justifyContent: 'space-between',
//         padding: isMobile ? '0 12px' : '0 24px',
//         background: 'linear-gradient(90deg, #023C6C 0%, rgb(6,65,113) 100%)',
//         color: '#fff', height: HEADER_HEIGHT, flexShrink: 0,
//         position: 'sticky', top: 0, zIndex: 1001,
//         boxShadow: '0 2px 12px rgba(0,0,0,0.25)',
//       }}>
//         {/* LEFT */}
//         <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
//           {isMobile && (
//             <div onClick={() => setMobileDrawerOpen(true)} style={{ cursor: 'pointer', color: '#fff', fontSize: 20, display: 'flex', alignItems: 'center' }}>
//               <MenuUnfoldOutlined />
//             </div>
//           )}
//           <div onClick={() => navigate('/')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
//             {isMobile
//               ? <img src={caosalogo} alt="CA Office Automation" style={{ height: 40, width: 'auto' }} />
//               : <img src={logo} alt="Company Logo" style={{ height: 40, width: 'auto' }} />
//             }
//           </div>
//         </div>

//         {/* CENTRE */}
//         {!isMobile && (
//           <div onClick={() => navigate('/')} style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', cursor: 'pointer' }}>
//             <img src={caosalogo} alt="CA Office Automation" style={{ height: 40, width: 'auto', objectFit: 'contain' }} />
//           </div>
//         )}

//         {/* RIGHT */}
//         {user && (
//           <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 14, flexShrink: 0 }}>

//             {/* Bell */}
//             {isMobile ? (
//               <>
//                 <Badge count={totalBellCount} size="small">
//                   <BellOutlined style={{ fontSize: 20, color: '#fff', cursor: 'pointer' }} onClick={() => setNotifOpen(true)} />
//                 </Badge>
//                 <Drawer
//                   title={null} placement="bottom" height="auto"
//                   open={notifOpen} onClose={() => setNotifOpen(false)}
//                   styles={{ body: { padding: 0 }, header: { display: 'none' }, wrapper: { borderRadius: '16px 16px 0 0', overflow: 'hidden' } }}
//                 >
//                   <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 2px' }}>
//                     <div style={{ width: 36, height: 4, borderRadius: 2, background: '#e2e8f0' }} />
//                   </div>
//                   <NotificationPanel {...notifProps} />
//                 </Drawer>
//               </>
//             ) : (
//               <Dropdown
//                 open={notifOpen} onOpenChange={setNotifOpen}
//                 dropdownRender={() => (
//                   <div style={{ boxShadow: '0 8px 30px rgba(0,0,0,0.12)', borderRadius: 14, overflow: 'hidden', background: '#fff', border: '1px solid #f1f5f9' }}>
//                     <NotificationPanel {...notifProps} />
//                   </div>
//                 )}
//                 trigger={['click']} placement="bottomRight"
//               >
//                 <Badge count={totalBellCount} size="small">
//                   <BellOutlined style={{ fontSize: 20, color: '#fff', cursor: 'pointer' }} />
//                 </Badge>
//               </Dropdown>
//             )}

//             {/* Username */}
//             <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', lineHeight: '16px' }}>
//               <Text style={{ fontWeight: 700, color: '#fff', fontSize: 14, whiteSpace: 'nowrap' }}>
//                 {user?.first_name ? `${user.first_name} ${user.last_name}` : user?.email}
//               </Text>
//               {user?.employee_code && (
//                 <Text style={{ color: '#e0e0e0', fontSize: 12, fontStyle: 'italic' }}>{user.employee_code}</Text>
//               )}
//             </div>

//             {/* Avatar */}
//             {isMobile ? (
//               <>
//                 <Avatar src={user?.profile_picture} icon={!user?.profile_picture && <UserOutlined />} shape="square"
//                   style={{ cursor: 'pointer', backgroundColor: '#d1c4e9' }} onClick={() => setUserDrawerOpen(true)} />
//                 <Drawer
//                   title={
//                     <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
//                       <Avatar src={user?.profile_picture} icon={!user?.profile_picture && <UserOutlined />} size={40} style={{ backgroundColor: '#d1c4e9' }} />
//                       <div>
//                         <div style={{ fontWeight: 700, fontSize: 15 }}>{user?.first_name ? `${user.first_name} ${user.last_name}` : user?.email}</div>
//                         {user?.employee_code && <div style={{ fontSize: 12, color: '#888' }}>{user.employee_code}</div>}
//                       </div>
//                     </div>
//                   }
//                   placement="right" width="80%" open={userDrawerOpen} onClose={() => setUserDrawerOpen(false)}
//                 >
//                   <List itemLayout="horizontal" dataSource={[
//                     { key: 'profile', icon: <UserOutlined style={{ fontSize: 18, color: '#023C6C' }} />, label: 'Profile', onClick: () => { setUserDrawerOpen(false); setProfileVisible(true); } },
//                     { key: 'logout',  icon: <LogoutOutlined style={{ fontSize: 18, color: '#e53935' }} />, label: 'Logout', onClick: handleLogout, danger: true },
//                   ]} renderItem={item => (
//                     <List.Item onClick={item.onClick} style={{ cursor: 'pointer', padding: '14px 8px', borderRadius: 8 }}>
//                       <List.Item.Meta avatar={item.icon} title={<span style={{ fontSize: 15, fontWeight: 500, color: item.danger ? '#e53935' : '#111' }}>{item.label}</span>} />
//                     </List.Item>
//                   )} />
//                 </Drawer>
//               </>
//             ) : (
//               <Dropdown menu={{ items: [
//                 { key: 'profile', icon: <UserOutlined style={{ color: '#4f46e5' }} />, label: <span style={{ fontWeight: 600, color: '#0f172a' }}>Profile</span>, onClick: () => setProfileVisible(true) },
//                 { type: 'divider' },
//                 { key: 'logout',  icon: <LogoutOutlined style={{ color: '#dc2626' }} />, label: <span style={{ fontWeight: 600, color: '#dc2626' }}>Logout</span>, onClick: handleLogout },
//               ]}} placement="bottomRight" arrow>
//                 <Avatar src={user?.profile_picture} icon={!user?.profile_picture && <UserOutlined />} shape="square"
//                   style={{ cursor: 'pointer', backgroundColor: '#d1c4e9' }} />
//               </Dropdown>
//             )}
//           </div>
//         )}
//       </Header>

//       {/* ── BODY ── */}
//       <Layout style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>

//         {/* Desktop sidebar */}
//         {!isMobile && (
//           <Sider
//             width={SIDEBAR_WIDTH}
//             collapsedWidth={SIDEBAR_COLLAPSED_WIDTH}
//             collapsed={collapsed}
//             style={{
//               background: sidebarBg,
//               height: '100%',
//               overflow: 'hidden',
//               flexShrink: 0,
//               transition: 'width 0.22s cubic-bezier(0.4,0,0.2,1)',
//             }}
//           >
//             {SidebarContent}
//           </Sider>
//         )}

//         {/* Mobile sidebar drawer */}
//         {isMobile && (
//           <Drawer
//             placement="left"
//             open={mobileDrawerOpen}
//             onClose={() => setMobileDrawerOpen(false)}
//             width={SIDEBAR_WIDTH}
//             styles={{ body: { padding: 0, background: 'transparent' }, header: { display: 'none' } }}
//           >
//             <div style={{ height: '100%', background: sidebarBg, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
//               <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)', flexShrink: 0 }}>
//                 <img src={logo} alt="Logo" style={{ height: 32, objectFit: 'contain' }} />
//                 <MenuFoldOutlined style={{ color: 'rgba(255,255,255,0.7)', fontSize: 18, cursor: 'pointer' }} onClick={() => setMobileDrawerOpen(false)} />
//               </div>
//               <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', paddingBottom: 8, scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.15) transparent' }}>
//                 <Sidebar
//                   collapsed={false}
//                   user={user}
//                   navigate={(path) => { navigate(path); setMobileDrawerOpen(false); }}
//                   location={location}
//                 />
//               </div>
//               <div style={{ flexShrink: 0, borderTop: '1px solid rgba(255,255,255,0.08)', padding: '10px 0 8px', background: 'rgba(0,0,0,0.15)' }}>
//                 <style>{`@keyframes pulse { 0%,100%{transform:scale(1);box-shadow:0 2px 6px rgba(244,63,94,0.5)}50%{transform:scale(1.08);box-shadow:0 2px 10px rgba(244,63,94,0.75)} }`}</style>
//                 <IntraChatButton
//                   chatUnread={chatUnread}
//                   isActive={isChatActive}
//                   onClick={handleChatNavigate}
//                   collapsed={false}
//                 />
//               </div>
//             </div>
//           </Drawer>
//         )}

//         {/* Main content */}
//         <Content style={{
//           flex: 1, minHeight: 0, minWidth: 0,
//           background: 'linear-gradient(135deg,#fdfbfb 0%,#ebedee 100%)',
//           ...(isChatPage ? {
//             padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column',
//           } : {
//             padding: isMobile ? '12px 8px' : '24px',
//             overflowY: 'auto', overflowX: 'hidden', overscrollBehavior: 'contain',
//           }),
//         }}>
//           {(() => {
//             const p = location.pathname;
//             if (p === '/' || p === '/dashboard') return <DashboardPage />;
//             return children;
//           })()}
//         </Content>
//       </Layout>

//       <ProfileModal user={user} visible={isProfileVisible} onClose={() => { setProfileVisible(false); fetchUser(); }} />
//     </Layout>
//   );
// }















import React, { useEffect, useState, useContext, useRef, useCallback } from 'react';
import {
  Layout, Avatar, Typography, App, Dropdown,
  List, Badge, Drawer, Tooltip,
} from 'antd';
import {
  UserOutlined, LogoutOutlined, BellOutlined,
  MenuFoldOutlined, MenuUnfoldOutlined,
  TeamOutlined, DownOutlined,
  DashboardOutlined, CheckSquareOutlined,
  ClusterOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ProfileModal from '../pages/ProfileModal';
import { SpinnerContext } from '../components/SpinnerContext';
import { PuffLoader } from 'react-spinners';
import DashboardPage from '../components/Dashboardpage';
import logo      from '../assets/CKPSCA_logo.png';
import caosalogo from '../assets/caoas-logo.png';

const { Header, Content, Sider } = Layout;
const { Text } = Typography;

// ─── Constants ────────────────────────────────────────────────────────────────
const isLocalhost = window.location.hostname === 'localhost' ||
                    window.location.hostname === '127.0.0.1';

const API_BASE = isLocalhost
    ? 'http://localhost:8000'
    : 'https://api.ckpsca.in';

const SIDEBAR_WIDTH           = 240;
const SIDEBAR_COLLAPSED_WIDTH = 64;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= breakpoint);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth <= breakpoint);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, [breakpoint]);
  return isMobile;
}

function timeAgo(d) {
  if (!d) return '';
  const s = Math.floor((Date.now() - new Date(d)) / 1000);
  if (s < 60)     return 'Just now';
  if (s < 3600)   return `${Math.floor(s / 60)}m ago`;
  if (s < 86400)  return `${Math.floor(s / 3600)}h ago`;
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`;
  return new Date(d).toLocaleDateString();
}

function notifIcon(title = '') {
  const t = title.toLowerCase();
  if (t.includes('task'))    return { icon: '✓',  bg: '#dcfce7', color: '#15803d' };
  if (t.includes('due'))     return { icon: '⏰', bg: '#fef9c3', color: '#92400e' };
  return { icon: '🔔', bg: '#f1f5f9', color: '#475569' };
}

// ─── Menu Definition ──────────────────────────────────────────────────────────
const buildMenuItems = (user) => {
  const role    = user?.role?.toLowerCase() || '';
  const hasRole = (...roles) => roles.map(r => r.toLowerCase()).includes(role);

  return [
    {
      key:   '/dashboard',
      label: 'Dashboard',
      icon:  <DashboardOutlined />,
      show:  true,
    },
    {
      key:   '/employee',
      label: 'Employees',
      icon:  <TeamOutlined />,
      show:  hasRole('Admin', 'Founder', 'HR'),
    },
    {
      key:   '/client-management',
      label: 'Client Management',
      icon:  <TeamOutlined />,
      show:  hasRole('Admin', 'Founder', 'Manager', 'HR'),
      children: [
        { key: '/client-management',              label: 'Client Groups',    icon: <DashboardOutlined /> },
        { key: '/client-management?view=clients', label: 'Client List',      icon: <TeamOutlined /> },
        { key: '/client-management?view=service', label: 'Teams & Services', icon: <ClusterOutlined /> },
      ],
    },
    {
      key:   '/stt-records',
      label: 'STT Records',
      icon:  <CheckSquareOutlined />,
      show:  true,
    },
  ].filter(item => item.show !== false);
};

// ─── Notification Panel ───────────────────────────────────────────────────────
const NotificationPanel = ({ notifications, isMobile, onOpen, unreadCount, onMarkAll }) => {
  const hasNotif = notifications.length > 0;

  return (
    <div style={{ width: isMobile ? '100%' : 380, fontFamily: 'system-ui,sans-serif' }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 18px 10px', borderBottom: '1px solid #f1f5f9',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Notifications</span>
          {unreadCount > 0 && (
            <span style={{ background: '#6366f1', color: '#fff', fontSize: 11, fontWeight: 700, padding: '1px 7px', borderRadius: 20 }}>
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button onClick={onMarkAll} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: '#6366f1', fontWeight: 600, padding: 0 }}>
            Mark all read
          </button>
        )}
      </div>

      <div style={{ maxHeight: isMobile ? '70vh' : 480, overflowY: 'auto', padding: '6px 8px' }}>
        {!hasNotif ? (
          <div style={{ padding: '40px 0', textAlign: 'center' }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>🔕</div>
            <div style={{ fontSize: 13, color: '#94a3b8', fontWeight: 500 }}>You're all caught up!</div>
          </div>
        ) : (
          notifications.map(item => {
            const ni = notifIcon(item.title);
            return (
              <div key={item.id} onClick={() => onOpen(item)}
                style={{
                  display: 'flex', gap: 12, alignItems: 'flex-start',
                  padding: '11px 10px', borderRadius: 10, marginBottom: 2,
                  cursor: 'pointer',
                  background: item.is_read ? 'transparent' : 'rgba(99,102,241,0.06)',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                onMouseLeave={e => e.currentTarget.style.background = item.is_read ? 'transparent' : 'rgba(99,102,241,0.06)'}
              >
                <div style={{ width: 38, height: 38, borderRadius: 10, flexShrink: 0, background: ni.bg, color: ni.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700 }}>
                  {ni.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: item.is_read ? 500 : 700, color: '#0f172a', marginBottom: 2 }}>{item.title}</div>
                  <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.5 }}>{item.message}</div>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>{timeAgo(item.created_at)}</div>
                </div>
                {!item.is_read && <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#6366f1', flexShrink: 0, marginTop: 4 }} />}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

// ─── Sidebar ──────────────────────────────────────────────────────────────────
function Sidebar({ collapsed, user, navigate, location }) {
  const menuItems = buildMenuItems(user);
  const [openMenus, setOpenMenus] = useState({});

  const isActive = (key) => {
    const [path, query] = key.split('?');
    if (query) return location.pathname === path && location.search === '?' + query;
    return (location.pathname === path || location.pathname.startsWith(path + '/')) && !location.search;
  };

  useEffect(() => {
    const updates = {};
    menuItems.forEach(item => {
      if (item.children && item.children.some(c => isActive(c.key))) {
        updates[item.key] = true;
      }
    });
    if (Object.keys(updates).length) setOpenMenus(prev => ({ ...prev, ...updates }));
  }, [location.pathname, location.search]);

  const toggleMenu = (key) => setOpenMenus(prev => ({ ...prev, [key]: !prev[key] }));

  const itemBase = {
    display: 'flex', alignItems: 'center',
    borderRadius: 8, cursor: 'pointer',
    margin: '1px 8px', fontSize: 13,
    transition: 'all 0.18s ease',
    whiteSpace: 'nowrap', flexShrink: 0,
  };

  const itemStyle = (active) => ({
    ...itemBase,
    gap: collapsed ? 0 : 10,
    padding: collapsed ? '9px 0' : '9px 14px',
    justifyContent: collapsed ? 'center' : 'flex-start',
    background: active ? 'rgba(255,255,255,0.13)' : 'transparent',
    borderLeft: active ? '3px solid #60a5fa' : '3px solid transparent',
    color: active ? '#fff' : 'rgba(255,255,255,0.7)',
    fontWeight: active ? 600 : 400,
  });

  const iconStyle = { fontSize: 15, flexShrink: 0, minWidth: 15 };

  return (
    <div style={{ paddingTop: 6 }}>
      {menuItems.map(item => {
        if (item.children) {
          const anyChildActive = item.children.some(c => isActive(c.key));
          const active = isActive(item.key) || anyChildActive;
          return (
            <div key={item.key}>
              {collapsed ? (
                <Tooltip title={item.label} placement="right">
                  <div style={itemStyle(active)} onClick={() => navigate(item.children[0]?.key || item.key)}
                    onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
                    onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}>
                    <span style={iconStyle}>{item.icon}</span>
                  </div>
                </Tooltip>
              ) : (
                <div style={{ ...itemStyle(active), justifyContent: 'space-between' }}
                  onClick={() => toggleMenu(item.key)}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.background = active ? 'rgba(255,255,255,0.13)' : 'transparent'; }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={iconStyle}>{item.icon}</span>
                    <span>{item.label}</span>
                  </div>
                  <DownOutlined style={{
                    fontSize: 9, opacity: 0.6, transition: 'transform 0.2s', flexShrink: 0,
                    transform: openMenus[item.key] ? 'rotate(180deg)' : 'rotate(0deg)',
                  }} />
                </div>
              )}

              {!collapsed && openMenus[item.key] && (
                <div style={{ marginLeft: 14, borderLeft: '1px solid rgba(255,255,255,0.12)', paddingLeft: 6, marginRight: 8 }}>
                  {item.children.map(child => {
                    const cActive = isActive(child.key);
                    return (
                      <div key={child.key}
                        style={{ ...itemStyle(cActive), margin: '1px 0', padding: '7px 10px', fontSize: 12 }}
                        onClick={() => navigate(child.key)}
                        onMouseEnter={e => { if (!cActive) e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
                        onMouseLeave={e => { if (!cActive) e.currentTarget.style.background = 'transparent'; }}>
                        <span style={{ ...iconStyle, fontSize: 12 }}>{child.icon}</span>
                        <span>{child.label}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        }

        const active = isActive(item.key);
        return collapsed ? (
          <Tooltip key={item.key} title={item.label} placement="right">
            <div style={itemStyle(active)} onClick={() => navigate(item.key)}
              onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}>
              <span style={iconStyle}>{item.icon}</span>
            </div>
          </Tooltip>
        ) : (
          <div key={item.key} style={itemStyle(active)} onClick={() => navigate(item.key)}
            onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
            onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}>
            <span style={iconStyle}>{item.icon}</span>
            <span>{item.label}</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Layout ──────────────────────────────────────────────────────────────
export default function AppLayout({ children }) {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { showSpinner, hideSpinner } = useContext(SpinnerContext);
  const { user, logout, loading: authLoading, setUser } = useAuth();
  const isMobile  = useIsMobile();

  const [collapsed,        setCollapsed]     = useState(false);
  const [mobileDrawerOpen, setMobileDrawer]  = useState(false);
  const [isProfileVisible, setProfileVisible] = useState(false);
  const [notifications,    setNotifications] = useState([]);
  const [unreadCount,      setUnreadCount]   = useState(0);
  const [notifOpen,        setNotifOpen]     = useState(false);
  const [userDrawerOpen,   setUserDrawer]    = useState(false);

  // ─── Logout ────────────────────────────────────────────────────────────────
  const handleLogout = async () => {
    setUserDrawer(false);
    logout(false, null);
    showSpinner(1000);
    setTimeout(hideSpinner, 1000);
  };

  // ─── Fetch User ────────────────────────────────────────────────────────────
  const fetchUser = async () => {
    try {
      const token = localStorage.getItem('token') || '';
      const res = await fetch(`${API_BASE}/api/auth/user/`, {
        credentials: 'include',
        headers: token ? { 'Authorization': `Token ${token}` } : {},
      });
      if (res.ok) setUser(await res.json());
    } catch {}
  };

  // ─── Deactivation Handler ─────────────────────────────────────────────────
  useEffect(() => {
    const handleDeactivated = () => logout(false, 'deactivated');
    window.addEventListener('auth:deactivated', handleDeactivated);
    return () => window.removeEventListener('auth:deactivated', handleDeactivated);
  }, [logout]);

  // ─── Open Notification ────────────────────────────────────────────────────
  const openNotification = (notif) => {
    setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n));
    setUnreadCount(prev => Math.max(prev - 1, 0));
    setNotifOpen(false);
    if (notif.reference_url) navigate(notif.reference_url);
  };

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  // ─── Guards ───────────────────────────────────────────────────────────────
  if (authLoading) {
    return (
      <Layout style={{ minHeight: '100vh', justifyContent: 'center', alignItems: 'center', backgroundColor: 'white' }}>
        <PuffLoader color="#001F5B" size={80} />
      </Layout>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  const HEADER_HEIGHT = isMobile ? 60 : 64;
  const sidebarBg     = 'linear-gradient(180deg, #023C6C 0%, #041e3a 100%)';

  const notifProps = {
    notifications, isMobile,
    onOpen: openNotification,
    unreadCount,
    onMarkAll: markAllRead,
  };

  // ─── Sidebar Content ──────────────────────────────────────────────────────
  const SidebarContent = (
    <div style={{ background: sidebarBg, height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'space-between',
        padding: collapsed ? '14px 0' : '14px 16px',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        minHeight: 56, flexShrink: 0,
      }}>
        {!collapsed && (
          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Navigation
          </span>
        )}
        <div onClick={() => setCollapsed(c => !c)}
          style={{ cursor: 'pointer', color: 'rgba(255,255,255,0.5)', fontSize: 17, display: 'flex', alignItems: 'center', padding: 4, borderRadius: 6, transition: 'color 0.2s' }}
          onMouseEnter={e => e.currentTarget.style.color = '#fff'}
          onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}>
          {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
        </div>
      </div>

      {/* Menu */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', paddingBottom: 8, scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.15) transparent' }}>
        <Sidebar
          collapsed={collapsed}
          user={user}
          navigate={(path) => { navigate(path); setMobileDrawer(false); }}
          location={location}
        />
      </div>

    </div>
  );

  return (
    <Layout style={{ height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

      {/* ── Header ── */}
      <Header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: isMobile ? '0 12px' : '0 24px',
        background: 'linear-gradient(90deg, #023C6C 0%, rgb(6,65,113) 100%)',
        color: '#fff', height: HEADER_HEIGHT, flexShrink: 0,
        position: 'sticky', top: 0, zIndex: 1001,
        boxShadow: '0 2px 12px rgba(0,0,0,0.25)',
      }}>

        {/* Left - Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          {isMobile && (
            <div onClick={() => setMobileDrawer(true)} style={{ cursor: 'pointer', color: '#fff', fontSize: 20, display: 'flex', alignItems: 'center' }}>
              <MenuUnfoldOutlined />
            </div>
          )}
          <div onClick={() => navigate('/')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <img src={isMobile ? caosalogo : logo} alt="Logo" style={{ height: 40, width: 'auto' }} />
          </div>
        </div>

        {/* Centre Logo */}
        {!isMobile && (
          <div onClick={() => navigate('/')} style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', cursor: 'pointer' }}>
            <img src={caosalogo} alt="CA Office Automation" style={{ height: 40, width: 'auto', objectFit: 'contain' }} />
          </div>
        )}

        {/* Right - User Info */}
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 14, flexShrink: 0 }}>

            {/* Bell */}
            {isMobile ? (
              <>
                <Badge count={unreadCount} size="small">
                  <BellOutlined style={{ fontSize: 20, color: '#fff', cursor: 'pointer' }} onClick={() => setNotifOpen(true)} />
                </Badge>
                <Drawer title={null} placement="bottom" height="auto" open={notifOpen} onClose={() => setNotifOpen(false)}
                  styles={{ body: { padding: 0 }, header: { display: 'none' }, wrapper: { borderRadius: '16px 16px 0 0', overflow: 'hidden' } }}>
                  <NotificationPanel {...notifProps} />
                </Drawer>
              </>
            ) : (
              <Dropdown open={notifOpen} onOpenChange={setNotifOpen}
                dropdownRender={() => (
                  <div style={{ boxShadow: '0 8px 30px rgba(0,0,0,0.12)', borderRadius: 14, overflow: 'hidden', background: '#fff', border: '1px solid #f1f5f9' }}>
                    <NotificationPanel {...notifProps} />
                  </div>
                )}
                trigger={['click']} placement="bottomRight">
                <Badge count={unreadCount} size="small">
                  <BellOutlined style={{ fontSize: 20, color: '#fff', cursor: 'pointer' }} />
                </Badge>
              </Dropdown>
            )}

            {/* Username */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', lineHeight: '16px' }}>
              <Text style={{ fontWeight: 700, color: '#fff', fontSize: 14, whiteSpace: 'nowrap' }}>
                {user?.first_name ? `${user.first_name} ${user.last_name}` : user?.email}
              </Text>
              {user?.role && (
                <Text style={{ color: '#e0e0e0', fontSize: 11, fontStyle: 'italic' }}>{user.role}</Text>
              )}
            </div>

            {/* Avatar */}
            {isMobile ? (
              <>
                <Avatar src={user?.profile_picture} icon={!user?.profile_picture && <UserOutlined />} shape="square"
                  style={{ cursor: 'pointer', backgroundColor: '#d1c4e9' }} onClick={() => setUserDrawer(true)} />
                <Drawer
                  title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Avatar src={user?.profile_picture} icon={!user?.profile_picture && <UserOutlined />} size={40} style={{ backgroundColor: '#d1c4e9' }} />
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 15 }}>{user?.first_name ? `${user.first_name} ${user.last_name}` : user?.email}</div>
                        {user?.role && <div style={{ fontSize: 12, color: '#888' }}>{user.role}</div>}
                      </div>
                    </div>
                  }
                  placement="right" width="80%" open={userDrawerOpen} onClose={() => setUserDrawer(false)}>
                  <List itemLayout="horizontal" dataSource={[
                    { key: 'profile', icon: <UserOutlined style={{ fontSize: 18, color: '#023C6C' }} />, label: 'Profile', onClick: () => { setUserDrawer(false); setProfileVisible(true); } },
                    { key: 'logout',  icon: <LogoutOutlined style={{ fontSize: 18, color: '#e53935' }} />, label: 'Logout', onClick: handleLogout, danger: true },
                  ]} renderItem={item => (
                    <List.Item onClick={item.onClick} style={{ cursor: 'pointer', padding: '14px 8px', borderRadius: 8 }}>
                      <List.Item.Meta avatar={item.icon} title={<span style={{ fontSize: 15, fontWeight: 500, color: item.danger ? '#e53935' : '#111' }}>{item.label}</span>} />
                    </List.Item>
                  )} />
                </Drawer>
              </>
            ) : (
              <Dropdown menu={{ items: [
                { key: 'profile', icon: <UserOutlined style={{ color: '#4f46e5' }} />, label: <span style={{ fontWeight: 600, color: '#0f172a' }}>Profile</span>, onClick: () => setProfileVisible(true) },
                { type: 'divider' },
                { key: 'logout', icon: <LogoutOutlined style={{ color: '#dc2626' }} />, label: <span style={{ fontWeight: 600, color: '#dc2626' }}>Logout</span>, onClick: handleLogout },
              ]}} placement="bottomRight" arrow>
                <Avatar src={user?.profile_picture} icon={!user?.profile_picture && <UserOutlined />} shape="square"
                  style={{ cursor: 'pointer', backgroundColor: '#d1c4e9' }} />
              </Dropdown>
            )}
          </div>
        )}
      </Header>

      {/* ── Body ── */}
      <Layout style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>

        {/* Desktop Sidebar */}
        {!isMobile && (
          <Sider width={SIDEBAR_WIDTH} collapsedWidth={SIDEBAR_COLLAPSED_WIDTH} collapsed={collapsed}
            style={{ background: sidebarBg, height: '100%', overflow: 'hidden', flexShrink: 0, transition: 'width 0.22s cubic-bezier(0.4,0,0.2,1)' }}>
            {SidebarContent}
          </Sider>
        )}

        {/* Mobile Sidebar Drawer */}
        {isMobile && (
          <Drawer placement="left" open={mobileDrawerOpen} onClose={() => setMobileDrawer(false)} width={SIDEBAR_WIDTH}
            styles={{ body: { padding: 0, background: 'transparent' }, header: { display: 'none' } }}>
            <div style={{ height: '100%', background: sidebarBg, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)', flexShrink: 0 }}>
                <img src={logo} alt="Logo" style={{ height: 32, objectFit: 'contain' }} />
                <MenuFoldOutlined style={{ color: 'rgba(255,255,255,0.7)', fontSize: 18, cursor: 'pointer' }} onClick={() => setMobileDrawer(false)} />
              </div>
              <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 8 }}>
                <Sidebar collapsed={false} user={user} navigate={(path) => { navigate(path); setMobileDrawer(false); }} location={location} />
              </div>
            </div>
          </Drawer>
        )}

        {/* Main Content */}
        <Content style={{
          flex: 1, minHeight: 0, minWidth: 0,
          background: 'linear-gradient(135deg,#fdfbfb 0%,#ebedee 100%)',
          padding: isMobile ? '12px 8px' : '24px',
          overflowY: 'auto', overflowX: 'hidden',
          overscrollBehavior: 'contain',
        }}>
          {(() => {
            const p = location.pathname;
            if (p === '/' || p === '/dashboard') return <DashboardPage />;
            return children;
          })()}
        </Content>
      </Layout>

      <ProfileModal user={user} visible={isProfileVisible} onClose={() => { setProfileVisible(false); fetchUser(); }} />
    </Layout>
  );
}