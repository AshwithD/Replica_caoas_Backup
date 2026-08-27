
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
    {
        key:   '/payroll',
        label: 'Payroll',
        icon:  <CheckSquareOutlined />,
        show:  hasRole('Admin', 'Founder', 'HR'), // or `true` if everyone should see it
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