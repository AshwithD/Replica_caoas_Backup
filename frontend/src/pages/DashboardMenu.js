// import React, { useEffect, useState } from 'react';
// import { Badge, Card, Row, Col, Typography } from 'antd';
// import { useNavigate } from 'react-router-dom';
// import { api } from '../services/api';
// import {
//   MailOutlined, UserAddOutlined, ScheduleOutlined,
//   CalendarOutlined, FileDoneOutlined, SolutionOutlined, TeamOutlined,
//   BlockOutlined
// } from '@ant-design/icons';
// import { motion } from 'framer-motion';

// const { Title } = Typography;

// const iconMap = {
//   // ... (iconMap remains unchanged)
//   '/mail-box': <MailOutlined />,
//   '/udin-records': <FileDoneOutlined />,
//   '/payroll-table': <ScheduleOutlined />,
//   '/employee': <UserAddOutlined />,
//   '/client-management': <TeamOutlined />,
//   '/invoice': <FileDoneOutlined />,
//   '/leave-management': <SolutionOutlined />,
//   '/payroll-trigger': <ScheduleOutlined />,
//   '/holiday-list': <CalendarOutlined />,
//   '/attendance-logs': <CalendarOutlined />,
//   '/time-tracker' : <CalendarOutlined />,
//   '/leave-balance': <SolutionOutlined />,
//   '/leave-tracker': <TeamOutlined />,
//   '/payrolls': <FileDoneOutlined />,
//   '/documents': <FileDoneOutlined />,
//   '/stt-records': <FileDoneOutlined />,
//   '/important-links': <BlockOutlined style={{ transform: 'rotate(45deg)' }} />,
// };

// const gradientColors = [
//   'linear-gradient(135deg,rgb(2, 60, 108) 100%)',
// ];

// // Define the time limit (30 minutes in milliseconds)
// const ANIMATION_COOLDOWN = 30 * 60 * 1000; // 1800000 ms

// export default function DashboardMenu({ user }) {
//   const navigate = useNavigate();
//   const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
//   const [invoiceDraftCount, setInvoiceDraftCount] = useState(0);
//   const [pendingCount, setPendingCount] = useState(0);
//   const [focusedIndex, setFocusedIndex] = useState(
//     Number(sessionStorage.getItem("lastFocusedIndex") || 0) // restore saved focus
//   );
  
//   // 🆕 NEW STATE: Controls whether the initial animation should run
//   const [shouldAnimate, setShouldAnimate] = useState(false);

//   // 🆕 NEW EFFECT: Logic to run animation only once in 30 minutes
//   useEffect(() => {
//     const lastAnimationTime = localStorage.getItem('lastAnimationTime');
//     const now = new Date().getTime();

//     if (!lastAnimationTime || now - lastAnimationTime > ANIMATION_COOLDOWN) {
//       // If no time is stored OR if 30 minutes have passed, enable animation
//       setShouldAnimate(true);
//       // Store the current time
//       localStorage.setItem('lastAnimationTime', now);
//     } else {
//       // If less than 30 minutes passed, disable animation
//       setShouldAnimate(false);
//     }
//   }, []); // Run only on component mount

//   // ... (handleResize useEffect remains unchanged) ...
//   useEffect(() => {
//     const handleResize = () => setIsMobile(window.innerWidth <= 768);
//     window.addEventListener('resize', handleResize);
//     return () => window.removeEventListener('resize', handleResize);
//   }, []);

//   // ... (invoice draft count useEffect remains unchanged) ...
//   useEffect(() => {
//     api.get('/clients/invoices/draft_count/')
//       .then(response => setInvoiceDraftCount(response.data.draft_count))
//       .catch(error => console.error('Error fetching invoice draft count:', error));
//   }, []);

//   const fetchPendingCount = async () => {
//     try {
//       const res = await api.get('/employee/leave-requests/pending_count/');
//       setPendingCount(res.data.pending_count);
//     } catch (err) {
//       console.error('Failed to fetch pending leave count', err);
//     }
//   };

//    useEffect(() => {
//     fetchPendingCount();
//   }, []);

//   // ... (adminTabs, employeeTabs, menuItems remain unchanged) ...
//   const adminTabs = [
//     { key: '/mail-box', label: 'Mail Box' },
//     { key: '/udin-records', label: 'UDIN Records' },
//     { key: '/stt-records', label: 'STT Records' },
//     { key: '/client-management', label: 'Client Management' },
//     { key: '/payroll-table', label: 'Payroll Table' }, 
//     { key: '/invoice', label: 'Invoice' },
//     { key: '/employee', label: 'Employee Management' },
//     { key: '/documents', label: 'Document Hub' },
//     { key: '/attendance-logs', label: 'Attendance Logs' },
//     { key: '/time-tracker', label: 'Time Tracker' },
//     { key: '/leave-tracker', label: 'Leave Tracker' },
//     { key: '/leave-management', label: 'Leave Management' },
//   ];

//   const menuItems = adminTabs; // Or whatever logic you use here

//   // ... (Arrow key navigation useEffect remains unchanged) ...
//   useEffect(() => {
//     const handleKeyDown = (e) => {
//       const columns = 4; // adjust based on your grid layout (lg: 4 cols, md: 3 cols, etc.)
//       if (['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown', 'Enter'].includes(e.key)) {
//         e.preventDefault();
//       }

//       if (e.key === 'ArrowRight') {
//         setFocusedIndex((prev) => (prev + 1) % menuItems.length);
//       } else if (e.key === 'ArrowLeft') {
//         setFocusedIndex((prev) => (prev - 1 + menuItems.length) % menuItems.length);
//       } else if (e.key === 'ArrowDown') {
//         setFocusedIndex((prev) => (prev + columns) % menuItems.length);
//       } else if (e.key === 'ArrowUp') {
//         setFocusedIndex((prev) => (prev - columns + menuItems.length) % menuItems.length);
//       } else if (e.key === 'Enter') {
//         sessionStorage.setItem("lastFocusedIndex", focusedIndex);
//         navigate(menuItems[focusedIndex].key);
//       }
//     };

//     window.addEventListener('keydown', handleKeyDown);
//     return () => window.removeEventListener('keydown', handleKeyDown);
//   }, [menuItems, focusedIndex, navigate]);

//   const udinPendingCount = Number(sessionStorage.getItem('udin_pending_count') || 0);
//   const sttPendingCount = Number(sessionStorage.getItem('stt_pending_count') || 0);
  
//   // ... (cardStyle remains unchanged) ...
//   const cardStyle = isMobile ? {
//     position: 'relative',
//     height: 0,
//     paddingBottom: '100%',
//     width: '100%',
//     textAlign: 'center',
//     borderRadius: 16,
//     background: gradientColors[0],
//     color: '#fff',
//     transition: 'transform 0.2s ease, box-shadow 0.2s ease',
//     boxShadow: '0 6px 20px rgba(0,0,0,0.1)',
//   } : {
//     height: 180,
//     width: '100%',
//     textAlign: 'center',
//     borderRadius: 16,
//     background: gradientColors[0],
//     color: '#fff',
//     display: 'flex',
//     flexDirection: 'column',
//     justifyContent: 'center',
//     transition: 'transform 0.2s ease, box-shadow 0.2s ease',
//     boxShadow: '0 6px 20px rgba(0,0,0,0.1)'
//   };

//   return (
//     <div>
//       <Title level={4} style={{
//         // ... (Title style remains unchanged) ...
//         marginBottom: 24,
//         color: '#333',
//         background: 'linear-gradient(to right,rgb(3, 19, 23), #0072ff)',
//         WebkitBackgroundClip: 'text',
//         WebkitTextFillColor: 'transparent'
//       }}>
//         Dashboard
//       </Title>

//       <Row gutter={[16, 16]}>
//         {menuItems.map((item, index) => (
//           <Col key={item.key} xs={12} sm={8} md={6} lg={6}>
//             <motion.div
//               // 🔄 MODIFIED: Conditionally set initial and animate props
//               initial={shouldAnimate ? { opacity: 0, y: 20 } : false}
//               animate={shouldAnimate ? { opacity: 1, y: 0 } : { opacity: 1, y: 0 }}
//               transition={{ duration: 0.4, delay: shouldAnimate ? index * 0.1 : 0 }}
//             >
//               <Card
//                 hoverable
//                 onClick={() => navigate(item.key)}
//                 onMouseEnter={(e) => {
//                   e.currentTarget.style.transform = 'scale(1.05)';
//                 }}
//                 onMouseLeave={(e) => {
//                   if (index !== focusedIndex) {
//                     e.currentTarget.style.transform = 'scale(1)';
//                   }
//                 }}
//                 style={{
//                   ...cardStyle,
//                   outline: index === focusedIndex ? '3px solid #1890ff' : 'none',
//                   transform: index === focusedIndex ? 'scale(1.05)' : 'scale(1)',
//                   transition: 'transform 0.2s ease, box-shadow 0.2s ease',
//                 }}
//               >
//                 <div
//                   style={{
//                     // ... (Inner div style remains unchanged) ...
//                     position: 'absolute',
//                     top: 0,
//                     bottom: 0,
//                     left: 0,
//                     right: 0,
//                     display: 'flex',
//                     flexDirection: 'column',
//                     justifyContent: 'center',
//                     alignItems: 'center',
//                   }}
//                 >
//                   <div style={{ fontSize: 36, marginBottom: 8 }}>
//                     {iconMap[item.key]}
//                   </div>
//                   <div style={{ fontWeight: 600, fontSize: 16, position: 'relative' }}>
//                     {/* ... (Badge/Label logic remains unchanged) ... */}
//                     {item.key === '/udin-records' || item.key === '/stt-records' ? (
//                       <>
//                         <span>{item.label}</span>
//                         {item.key === '/udin-records' && udinPendingCount > 0 && (
//                           <motion.div
//                             initial={shouldAnimate ? { scale: 0 } : false}
//                             animate={{ scale: 1 }}
//                             transition={{ type: 'spring', stiffness: 300, damping: 20 }}
//                             style={{ position: 'absolute', top: -10, right: -10 }}
//                           >
//                             <Badge count={udinPendingCount} style={{ backgroundColor: '#52c41a' }} />
//                           </motion.div>
//                         )}
//                         {item.key === '/stt-records' && sttPendingCount > 0 && (
//                           <motion.div
//                             initial={shouldAnimate ? { scale: 0 } : false}
//                             animate={{ scale: 1 }}
//                             transition={{ type: 'spring', stiffness: 300, damping: 20 }}
//                             style={{ position: 'absolute', top: -10, right: -10 }}
//                           >
//                             <Badge count={sttPendingCount} style={{ backgroundColor: '#faad14' }} />
//                           </motion.div>
//                         )}
//                       </>
//                     ) : item.key === '/invoice' ? (
//                       <div style={{ position: 'relative', display: 'inline-block' }}>
//                         <span>{item.label}</span>
//                         {invoiceDraftCount > 0 && (
//                           <Badge
//                             count={invoiceDraftCount}
//                             style={{
//                               backgroundColor: '#52c41a',
//                               width: 24,
//                               height: 24,
//                               borderRadius: 8,
//                               display: 'flex',
//                               justifyContent: 'center',
//                               alignItems: 'center',
//                               position: 'absolute',
//                               top: -110,
//                               right: -140,
//                               boxShadow: '0 2px 8px rgba(82,196,26,0.15)',
//                               fontSize: 12,
//                             }}
//                           />
//                         )}
//                       </div>
//                     ) : item.key === '/leave-management' ? (
//                       <div style={{ position: 'relative', display: 'inline-block' }}>
//                         <span>{item.label}</span>
//                         {pendingCount > 0 && (
//                           <Badge
//                             count={pendingCount}
//                             style={{
//                               backgroundColor: '#52c41a',
//                               width: 24,
//                               height: 24,
//                               borderRadius: 8,
//                               display: 'flex',
//                               justifyContent: 'center',
//                               alignItems: 'center',
//                               position: 'absolute',
//                               top: -110,
//                               right: -95,
//                               boxShadow: '0 2px 8px rgba(82,196,26,0.15)',
//                               fontSize: 12,
//                             }}
//                           />
//                         )}
//                       </div>
//                     ) : (
//                       item.label
//                     )}
//                   </div>
//                 </div>
//               </Card>
//             </motion.div>
//           </Col>
//         ))}
//       </Row>
//     </div>
//   );
// }

// import React, { useEffect, useState } from 'react';
// import { Badge, Card, Row, Col, Typography } from 'antd';
// import { useNavigate } from 'react-router-dom';
// import { api } from '../services/api';
// import {
//   MailOutlined, UserAddOutlined, ScheduleOutlined,
//   CalendarOutlined, FileDoneOutlined, SolutionOutlined, TeamOutlined,
//   BlockOutlined
// } from '@ant-design/icons';
// import { motion } from 'framer-motion';

// const { Title } = Typography;

// const iconMap = {
//   // ... (iconMap remains unchanged)
//   '/mail-box': <MailOutlined />,
//   '/udin-records': <FileDoneOutlined />,
//   '/payroll-table': <ScheduleOutlined />,
//   '/employee': <UserAddOutlined />,
//   '/client-management': <TeamOutlined />,
//   '/invoice': <FileDoneOutlined />,
//   '/leave-management': <SolutionOutlined />,
//   '/payroll-trigger': <ScheduleOutlined />,
//   '/holiday-list': <CalendarOutlined />,
//   '/attendance-logs': <CalendarOutlined />,
//   '/time-tracker' : <CalendarOutlined />,
//   '/leave-balance': <SolutionOutlined />,
//   '/leave-tracker': <TeamOutlined />,
//   // '/payrolls': <FileDoneOutlined />,
//   '/hr-solutions': <FileDoneOutlined />,
//   '/documents': <FileDoneOutlined />,
//   '/stt-records': <FileDoneOutlined />,
//   '/important-links': <BlockOutlined style={{ transform: 'rotate(45deg)' }} />,
// };

// const gradientColors = [
//   'linear-gradient(135deg,rgb(2, 60, 108) 100%)',
// ];

// // Define the time limit (30 minutes in milliseconds)
// const ANIMATION_COOLDOWN = 30 * 60 * 1000; // 1800000 ms

// export default function DashboardMenu({ user }) {
//   const navigate = useNavigate();
//   const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
//   const [invoiceDraftCount, setInvoiceDraftCount] = useState(0);
//   const [pendingCount, setPendingCount] = useState(0);
//   const [focusedIndex, setFocusedIndex] = useState(
//     Number(sessionStorage.getItem("lastFocusedIndex") || 0) // restore saved focus
//   );
  
//   // 🆕 NEW STATE: Controls whether the initial animation should run
//   const [shouldAnimate, setShouldAnimate] = useState(false);

//   // 🆕 NEW EFFECT: Logic to run animation only once in 30 minutes
//   useEffect(() => {
//     const lastAnimationTime = localStorage.getItem('lastAnimationTime');
//     const now = new Date().getTime();

//     if (!lastAnimationTime || now - lastAnimationTime > ANIMATION_COOLDOWN) {
//       // If no time is stored OR if 30 minutes have passed, enable animation
//       setShouldAnimate(true);
//       // Store the current time
//       localStorage.setItem('lastAnimationTime', now);
//     } else {
//       // If less than 30 minutes passed, disable animation
//       setShouldAnimate(false);
//     }
//   }, []); // Run only on component mount

//   // ... (handleResize useEffect remains unchanged) ...
//   useEffect(() => {
//     const handleResize = () => setIsMobile(window.innerWidth <= 768);
//     window.addEventListener('resize', handleResize);
//     return () => window.removeEventListener('resize', handleResize);
//   }, []);

//   // ... (invoice draft count useEffect remains unchanged) ...
//   useEffect(() => {
//     api.get('/clients/invoices/draft_count/')
//       .then(response => setInvoiceDraftCount(response.data.draft_count))
//       .catch(error => console.error('Error fetching invoice draft count:', error));
//   }, []);

//   const fetchPendingCount = async () => {
//     try {
//       const res = await api.get('/employee/leave-requests/pending_count/');
//       setPendingCount(res.data.pending_count);
//     } catch (err) {
//       console.error('Failed to fetch pending leave count', err);
//     }
//   };

//    useEffect(() => {
//     fetchPendingCount();
//   }, []);

//   const menuItems = [
//     { key: '/mail-box', label: 'Mail Box', roles: ['Admin','Founder'] },
//     { key: '/udin-records', label: 'UDIN Records', roles: ['Admin', 'Founder', 'Manager'] },
//     { key: '/stt-records', label: 'STT Records', roles: ['Admin', 'HR', 'Founder', 'Manager', 'Team Lead', 'Employee'] },
//     { key: '/client-management', label: 'Client Management', roles: ['Admin','Founder'] },
//     // { key: '/payroll-table', label: 'Payroll Table', roles: ['Admin','Founder'] },
//     { key: '/hr-solutions', label: 'HR Solutions', roles: ['Admin', 'HR', 'Founder', 'Employee', 'Team Lead', 'Manager', 'Intern']},
//     { key: '/invoice', label: 'Invoice', roles: ['Founder', 'Manager'] },
//     { key: '/employee', label: 'Employee Management', roles: ['Admin','Founder'] },
//     { key: '/documents', label: 'Document Hub', roles: ['Admin', 'HR', 'Founder', 'Employee', 'Team Lead', 'Manager'] },
//     { key: '/attendance-logs', label: 'Attendance Logs', roles: ['Admin', 'HR', 'Founder', 'Employee', 'Team Lead', 'Manager', 'Intern'] },
//     { key: '/time-tracker', label: 'Time Tracker', roles: ['Admin','Founder', 'Manager'] },
//     { key: '/leave-tracker', label: 'Leave Tracker', roles: ['Admin', 'HR', 'Founder', 'Employee', 'Team Lead', 'Manager', 'Intern'] },
//     { key: '/leave-management', label: 'Leave Management', roles: ['Admin', 'Founder', 'Manager'] },
//   ];


//   // const menuItems = adminTabs; // Or whatever logic you use here

//   // ... (Arrow key navigation useEffect remains unchanged) ...
//   useEffect(() => {
//     const handleKeyDown = (e) => {
//       const columns = 4; // adjust based on your grid layout (lg: 4 cols, md: 3 cols, etc.)
//       if (['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown', 'Enter'].includes(e.key)) {
//         e.preventDefault();
//       }

//       if (e.key === 'ArrowRight') {
//         setFocusedIndex((prev) => (prev + 1) % menuItems.length);
//       } else if (e.key === 'ArrowLeft') {
//         setFocusedIndex((prev) => (prev - 1 + menuItems.length) % menuItems.length);
//       } else if (e.key === 'ArrowDown') {
//         setFocusedIndex((prev) => (prev + columns) % menuItems.length);
//       } else if (e.key === 'ArrowUp') {
//         setFocusedIndex((prev) => (prev - columns + menuItems.length) % menuItems.length);
//       // } else if (e.key === 'Enter') {
//       //   sessionStorage.setItem("lastFocusedIndex", focusedIndex);
//       //   navigate(menuItems[focusedIndex].key);
//       // }
//       } else if (e.key === 'Enter') {

//       const item = menuItems[focusedIndex];
//       const normalizedUserRole = user.role?.toLowerCase();
//       const hasAccess = item.roles?.map(r => r.toLowerCase()).includes(normalizedUserRole);

//       sessionStorage.setItem("lastFocusedIndex", focusedIndex);

//       if (hasAccess) {
//         navigate(item.key);      // ✔ allowed
//       } else {
//         // ❌ block navigation
//         console.warn("Access denied for this tab."); 
//       }
//     }

//     };

//     window.addEventListener('keydown', handleKeyDown);
//     return () => window.removeEventListener('keydown', handleKeyDown);
//   }, [menuItems, focusedIndex, navigate]);

//   const udinPendingCount = Number(sessionStorage.getItem('udin_pending_count') || 0);
//   const sttPendingCount = Number(sessionStorage.getItem('stt_pending_count') || 0);
  
//   // ... (cardStyle remains unchanged) ...
//   const cardStyle = isMobile ? {
//     position: 'relative',
//     height: 0,
//     paddingBottom: '100%',
//     width: '100%',
//     textAlign: 'center',
//     borderRadius: 16,
//     background: gradientColors[0],
//     color: '#fff',
//     transition: 'transform 0.2s ease, box-shadow 0.2s ease',
//     boxShadow: '0 6px 20px rgba(0,0,0,0.1)',
//   } : {
//     height: 180,
//     width: '100%',
//     textAlign: 'center',
//     borderRadius: 16,
//     background: gradientColors[0],
//     color: '#fff',
//     display: 'flex',
//     flexDirection: 'column',
//     justifyContent: 'center',
//     transition: 'transform 0.2s ease, box-shadow 0.2s ease',
//     boxShadow: '0 6px 20px rgba(0,0,0,0.1)'
//   };

//   return (
//     <div>
//       <Title level={4} style={{
//         // ... (Title style remains unchanged) ...
//         marginBottom: 24,
//         color: '#333',
//         background: 'linear-gradient(to right,rgb(3, 19, 23), #0072ff)',
//         WebkitBackgroundClip: 'text',
//         WebkitTextFillColor: 'transparent'
//       }}>
//         Dashboard
//       </Title>

//       <Row gutter={[16, 16]}>
//         {menuItems.map((item, index) => {

//           // ROLE CHECK
//           // const hasAccess = item.roles?.includes(user.role);
//           const normalizedUserRole = user.role?.toLowerCase(); 
//           const hasAccess = item.roles?.map(r => r.toLowerCase()).includes(normalizedUserRole);

//           return (
//             <Col key={item.key} xs={12} sm={8} md={6} lg={6}>
//               <motion.div
//                 initial={shouldAnimate ? { opacity: 0, y: 20 } : false}
//                 animate={{ opacity: 1, y: 0 }}
//                 transition={{ duration: 0.4, delay: shouldAnimate ? index * 0.1 : 0 }}
//               >
//                 <Card
//                   hoverable={hasAccess}  
//                   onClick={() => hasAccess && navigate(item.key)}   // ❌ block navigation if no access
//                   onMouseEnter={(e) => {
//                     if (hasAccess) e.currentTarget.style.transform = 'scale(1.05)';
//                   }}
//                   onMouseLeave={(e) => {
//                     if (hasAccess) e.currentTarget.style.transform = 'scale(1)';
//                   }}
//                   style={{
//                     ...cardStyle,
//                     outline: index === focusedIndex ? '3px solid #1890ff' : 'none',
//                     transform: index === focusedIndex ? 'scale(1.05)' : 'scale(1)',
//                   }}
//                 >
//                   <div
//                     style={{
//                       position: 'absolute',
//                       top: 0, bottom: 0, left: 0, right: 0,
//                       display: 'flex',
//                       flexDirection: 'column',
//                       justifyContent: 'center',
//                       alignItems: 'center',
//                     }}
//                   >
//                     <div style={{ fontSize: 36, marginBottom: 8 }}>
//                       {iconMap[item.key]}
//                     </div>

//                     <div style={{ fontWeight: 600, fontSize: 16, position: 'relative' }}>

//                     {/* ALWAYS SHOW LABEL */}
//                     <span>{item.label}</span>

//                     {/* UDIN BADGE */}
//                     {item.key === '/udin-records' && hasAccess && udinPendingCount > 0 && (
//                       <Badge
//                         count={udinPendingCount}
//                         style={{
//                           backgroundColor: '#52c41a',
//                           position: 'absolute',
//                           top: -8,
//                           right: -8,
//                           transform: 'translate(50%, -50%)'
//                         }}
//                       />
//                     )}

//                     {/* STT BADGE */}
//                     {item.key === '/stt-records' && hasAccess && sttPendingCount > 0 && (
//                       <Badge
//                         count={sttPendingCount}
//                         style={{
//                           backgroundColor: '#52c41a',
//                           position: 'absolute',
//                           top: -8,
//                           right: -8,
//                           transform: 'translate(50%, -50%)'
//                         }}
//                       />
//                     )}

//                     {/* INVOICE BADGE */}
//                     {item.key === '/invoice' && hasAccess && invoiceDraftCount > 0 && (
//                       <Badge
//                         count={invoiceDraftCount}
//                         style={{
//                           backgroundColor: '#52c41a',
//                           borderRadius: '4px',      // <-- makes it square (0 for perfect square box, 4px for slight curve)
//                           minWidth: '22px',         // fixed width
//                           height: '22px',           // fixed height
//                           lineHeight: '22px',       // centers number vertically
//                           textAlign: 'center',      // centers number horizontally
//                           fontSize: '13px',
//                           padding: 0,
//                           position: 'absolute',
//                           top: -2,
//                           right: -20,
//                           transform: 'translate(50%, -50%)'
//                         }}
//                       />

//                     )}

//                     {/* LEAVE BADGE */}
//                     {item.key === '/leave-management' && hasAccess && pendingCount > 0 && (
//                       <Badge
//                         count={pendingCount}
//                         style={{
//                           backgroundColor: '#52c41a',
//                           borderRadius: '4px',      // <-- makes it square (0 for perfect square box, 4px for slight curve)
//                           minWidth: '22px',         // fixed width
//                           height: '22px',           // fixed height
//                           lineHeight: '22px',       // centers number vertically
//                           textAlign: 'center',      // centers number horizontally
//                           fontSize: '13px',
//                           padding: 0,
//                           position: 'absolute',
//                           top: -4,
//                           right: -15,
//                           transform: 'translate(50%, -50%)'
//                         }}
//                       />
//                     )}

//                     {/* HR Solutions BADGE */}
//                     {item.key === '/hr-solutions' && hasAccess && pendingCount > 0 && (
//                       <Badge
//                         count={pendingCount}
//                         style={{
//                           backgroundColor: '#52c41a',
//                           borderRadius: '4px',      // <-- makes it square (0 for perfect square box, 4px for slight curve)
//                           minWidth: '22px',         // fixed width
//                           height: '22px',           // fixed height
//                           lineHeight: '22px',       // centers number vertically
//                           textAlign: 'center',      // centers number horizontally
//                           fontSize: '13px',
//                           padding: 0,
//                           position: 'absolute',
//                           top: -4,
//                           right: -15,
//                           transform: 'translate(50%, -50%)'
//                         }}
//                       />
//                     )}
//                   </div>
//                   </div>
//                 </Card>
//               </motion.div>
//             </Col>
//           );
//         })}
//       </Row>
//     </div>
//   );
// }

import React, { useEffect, useState } from 'react';
import { Badge, Card, Row, Col, Typography, App } from 'antd'; // 1. Import App
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import {
  MailOutlined, UserAddOutlined, ScheduleOutlined,
  CalendarOutlined, FileDoneOutlined, SolutionOutlined, TeamOutlined,
  BlockOutlined, LockOutlined,
} from '@ant-design/icons';
import { motion } from 'framer-motion';

const { Title } = Typography;

// ... (Your iconMap, gradientColors, ANIMATION_COOLDOWN constants remain exactly the same) ...
const iconMap = {
  '/mail-box': <MailOutlined />,
  '/udin-records': <FileDoneOutlined />,
  '/payroll-table': <ScheduleOutlined />,
  '/sop': <BlockOutlined style={{ transform: 'rotate(45deg)' }} />,
  '/client-management': <TeamOutlined />,
  '/invoice': <FileDoneOutlined />,
  '/leave-management': <SolutionOutlined />,
  '/payroll-trigger': <ScheduleOutlined />,
  '/holiday-list': <CalendarOutlined />,
  '/attendance-logs': <CalendarOutlined />,
  '/time-tracker' : <CalendarOutlined />,
  '/leave-balance': <SolutionOutlined />,
  '/leave-tracker': <TeamOutlined />,
  '/hr-solutions': <FileDoneOutlined />,
  '/compliance-tracker': <FileDoneOutlined />,
  '/stt-records': <FileDoneOutlined />,
  '/important-links': <BlockOutlined style={{ transform: 'rotate(45deg)' }} />,
};

const gradientColors = [
  'linear-gradient(135deg,rgb(2, 60, 108) 100%)',
];

const ANIMATION_COOLDOWN = 30 * 60 * 1000; 

export default function DashboardMenu({ user }) {
  const navigate = useNavigate();
  
  // 2. Initialize the message hook
  const { message } = App.useApp(); 

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [invoiceDraftCount, setInvoiceDraftCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [focusedIndex, setFocusedIndex] = useState(
    Number(sessionStorage.getItem("lastFocusedIndex") || 0) 
  );
  
  const [shouldAnimate, setShouldAnimate] = useState(false);

  // ... (Your existing useEffects for animation, resize, pending counts remain exactly the same) ...
  useEffect(() => {
    const lastAnimationTime = localStorage.getItem('lastAnimationTime');
    const now = new Date().getTime();
    if (!lastAnimationTime || now - lastAnimationTime > ANIMATION_COOLDOWN) {
      setShouldAnimate(true);
      localStorage.setItem('lastAnimationTime', now);
    } else {
      setShouldAnimate(false);
    }
  }, []); 

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    api.get('/clients/invoices/draft_count/')
      .then(response => setInvoiceDraftCount(response.data.draft_count))
      .catch(error => console.error('Error fetching invoice draft count:', error));
  }, []);

   useEffect(() => {
    const fetchPendingCount = async () => {
      try {
        const res = await api.get('/employee/leave-requests/pending_count/');
        setPendingCount(res.data.pending_count);
      } catch (err) {
        console.error('Failed to fetch pending leave count', err);
      }
    };
    fetchPendingCount();
  }, []);

  const menuItems = [
    { key: '/mail-box', label: 'Mail Box', roles: ['Admin','Founder'] },
    { key: '/udin-records', label: 'UDIN Records', roles: ['Admin', 'Founder', 'Manager'], emails: ['purnesh.rs@gmail.com','mis@ckpsca.com','sreekanth.d.ckpsca@gmail.com'] },
    { key: '/stt-records', label: 'STT Records', roles: ['Admin', 'HR', 'Founder', 'Manager', 'Team Lead', 'Employee'] },
    { key: '/client-management', label: 'Client Management', roles: ['Admin','Founder', 'Manager'] },
    { key: '/hr-solutions', label: 'HR Solutions', roles: ['Admin', 'HR', 'Founder', 'Employee', 'Team Lead', 'Manager', 'Intern']},
    { key: '/invoice', label: 'Invoice', roles: ['Founder', 'Manager'] },
    { key: '/sop', label: 'Process Documentation', roles: ['Admin', 'HR', 'Founder', 'Manager', 'Team Lead', 'Employee'] },
    { key: '/compliance-tracker', label: 'Compliance Tracker', roles: ['Admin', 'Founder'], emails: ['mis@ckpsca.com'] },
    // { key: '/documents', label: 'Document Hub', roles: ['Admin', 'HR', 'Founder', 'Employee', 'Team Lead', 'Manager'] },
    { key: '/attendance-logs', label: 'Attendance Logs', roles: ['Admin', 'HR', 'Founder', 'Employee', 'Team Lead', 'Manager', 'Intern'] },
    { key: '/time-tracker', label: 'Time Tracker', roles: ['Admin','Founder', 'Manager'] },
    { key: '/leave-tracker', label: 'Leave Tracker', roles: ['Admin', 'HR', 'Founder', 'Employee', 'Team Lead', 'Manager', 'Intern'] },
    { key: '/leave-management', label: 'Leave Management', roles: ['Admin', 'Founder', 'Manager'] },
  ];

  // KEYBOARD NAVIGATION FIX
  useEffect(() => {
    const handleKeyDown = (e) => {
      const columns = 4; 
      if (['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown', 'Enter'].includes(e.key)) {
        e.preventDefault();
      }

      if (e.key === 'ArrowRight') {
        setFocusedIndex((prev) => (prev + 1) % menuItems.length);
      } else if (e.key === 'ArrowLeft') {
        setFocusedIndex((prev) => (prev - 1 + menuItems.length) % menuItems.length);
      } else if (e.key === 'ArrowDown') {
        setFocusedIndex((prev) => (prev + columns) % menuItems.length);
      } else if (e.key === 'ArrowUp') {
        setFocusedIndex((prev) => (prev - columns + menuItems.length) % menuItems.length);
      } else if (e.key === 'Enter') {

        const item = menuItems[focusedIndex];
        const normalizedUserRole = user.role?.toLowerCase();
        const hasAccess = item.roles?.map(r => r.toLowerCase()).includes(normalizedUserRole);
        const showLock = !hasAccess;

        sessionStorage.setItem("lastFocusedIndex", focusedIndex);

        if (hasAccess) {
          navigate(item.key);
        } else {
          // Warning for Keyboard Enter
          message.warning("You are not authorized to access this module."); 
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [menuItems, focusedIndex, navigate, user, message]); // Added message and user dependencies

  const udinPendingCount = Number(sessionStorage.getItem('udin_pending_count') || 0);
  const sttPendingCount = Number(sessionStorage.getItem('stt_pending_count') || 0);
  
  const cardStyle = isMobile ? {
    position: 'relative',
    height: 0,
    paddingBottom: '100%',
    width: '100%',
    textAlign: 'center',
    borderRadius: 16,
    background: gradientColors[0],
    color: '#fff',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    boxShadow: '0 6px 20px rgba(0,0,0,0.1)',
  } : {
    height: 180,
    width: '100%',
    textAlign: 'center',
    borderRadius: 16,
    background: gradientColors[0],
    color: '#fff',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    boxShadow: '0 6px 20px rgba(0,0,0,0.1)'
  };

  // ... imports and setup code remains the same ...

  return (
    <div>
      <Title level={4} style={{
        marginBottom: 24,
        color: '#333',
        background: 'linear-gradient(to right,rgb(3, 19, 23), #0072ff)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent'
      }}>
        Dashboard
      </Title>

      <Row gutter={[16, 16]}>
        {menuItems.map((item, index) => {

          // const normalizedUserRole = user.role?.toLowerCase(); 
          // const hasAccess = item.roles?.map(r => r.toLowerCase()).includes(normalizedUserRole);
          const normalizedUserRole = user.role?.toLowerCase();
          const normalizedUserEmail = user.email?.toLowerCase();

          const hasRoleAccess = item.roles?.some(r => r.toLowerCase() === normalizedUserRole);
          const hasEmailAccess = item.emails?.some(e => e.toLowerCase() === normalizedUserEmail);

          const hasAccess = hasRoleAccess || hasEmailAccess;

          const showLock = !hasAccess;
          return (
            <Col key={item.key} xs={12} sm={8} md={6} lg={6}>
              <motion.div
                initial={shouldAnimate ? { opacity: 0, y: 20 } : false}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: shouldAnimate ? index * 0.1 : 0 }}
              >
                <Card
                  // FIX 1: Only enable hover shadow if NOT mobile
                  hoverable={!isMobile} 
                  
                  onClick={() => {
                     if (hasAccess) {
                        navigate(item.key); 
                     } else {
                        message.warning("You are not authorized to access this module.");
                     }
                  }}
                  
                  // FIX 2: Disable manual scaling on mobile so the click fires immediately
                  onMouseEnter={(e) => {
                    if (!isMobile && hasAccess) {
                        e.currentTarget.style.transform = 'scale(1.05)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isMobile && hasAccess && index !== focusedIndex) {
                      e.currentTarget.style.transform = 'scale(1)';
                    }
                  }}
                  
                  style={{
                    ...cardStyle,
                    outline: index === focusedIndex ? '3px solid #1890ff' : 'none',
                    // Only apply scale transform if NOT mobile (or if focused via keyboard)
                    transform: (!isMobile && index === focusedIndex) ? 'scale(1.05)' : 'scale(1)',
                    cursor: hasAccess ? 'pointer' : 'not-allowed', 
                    // opacity: hasAccess ? 1 : 0.8
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      top: 0, bottom: 0, left: 0, right: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <div style={{ fontSize: 36, marginBottom: 8 }}>
                      {iconMap[item.key]}
                    </div>

                    <div style={{ fontWeight: 600, fontSize: 16, position: 'relative' }}>
                      <span>{item.label}</span>
                      {showLock && (
                        <LockOutlined
                          style={{ marginLeft: 8, opacity: 0.85 }}
                        />
                      )}


                      {/* --- BADGES --- */}
                      {hasAccess && item.key === '/udin-records' && udinPendingCount > 0 && (
                        <Badge count={udinPendingCount} style={{ backgroundColor: '#52c41a', position: 'absolute', top: -8, right: -8, transform: 'translate(50%, -50%)' }} />
                      )}

                      {hasAccess && item.key === '/stt-records' && sttPendingCount > 0 && (
                        <Badge count={sttPendingCount} style={{ backgroundColor: '#52c41a', position: 'absolute', top: -8, right: -8, transform: 'translate(50%, -50%)' }} />
                      )}

                      {hasAccess && item.key === '/invoice' && invoiceDraftCount > 0 && (
                        <Badge count={invoiceDraftCount} style={{ backgroundColor: '#52c41a', borderRadius: '4px', minWidth: '22px', height: '22px', lineHeight: '22px', textAlign: 'center', fontSize: '13px', padding: 0, position: 'absolute', top: -2, right: -20, transform: 'translate(50%, -50%)' }} />
                      )}

                      {hasAccess && (item.key === '/leave-management' || item.key === '/hr-solutions') && pendingCount > 0 && (
                        <Badge count={pendingCount} style={{ backgroundColor: '#52c41a', borderRadius: '4px', minWidth: '22px', height: '22px', lineHeight: '22px', textAlign: 'center', fontSize: '13px', padding: 0, position: 'absolute', top: -4, right: -15, transform: 'translate(50%, -50%)' }} />
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            </Col>
          );
        })}
      </Row>
    </div>
  );

}