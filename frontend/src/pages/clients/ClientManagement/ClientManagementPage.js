// import React, { useState, useCallback, useEffect } from 'react';
// import { Layout, Menu, message, Spin, Button, App as AntdApp } from 'antd';
// import {
//   ApartmentOutlined,
//   UsergroupAddOutlined,
//   ClusterOutlined,
//   BarChartOutlined,
//   MenuUnfoldOutlined,
//   MenuFoldOutlined,
// } from '@ant-design/icons';
// import { SpinnerContext } from '../../../components/SpinnerContext';
// import ClientGroupManagementView from './ClientGroupManagementView';
// import ClientGroupListView from './ClientGroupListView';
// import ClientGroupedListView from './ClientGroupedListView';
// import ClientGroupDetailView from './ClientGroupDetailView';
// import ServiceTeamManagementView from './ServiceAssignmentView';
// import JiraBoard from './taskboard';
// import TaskDashboard from './TaskDashboard';

// import { api } from '../../../services/api';
// import { useAuth } from '../../../contexts/AuthContext';

// const { Sider, Content, Header } = Layout;

// function ClientManagementPage() {
//   const { authToken } = useAuth();
//   const token = authToken || localStorage.getItem('token');
//   const { showSpinner, hideSpinner } = useContext(SpinnerContext);

//   /* ---------------- UI STATE ---------------- */
//   const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
//   const [collapsed, setCollapsed] = useState(window.innerWidth <= 768);
//   const [currentView, setCurrentView] = useState(
//     localStorage.getItem('clientManagementView') || 'listClientGroups'
//   );

//   /* ---------------- DATA STATE ---------------- */
//   const [clients, setClients] = useState([]);
//   const [spocs, setSpocs] = useState([]);
//   const [groupCategories, setGroupCategories] = useState([]);
//   const [mainServices, setMainServices] = useState([]);
//   const [subServicesMap, setSubServicesMap] = useState({});
//   const [clientGroups, setClientGroups] = useState([]);
//   const [teams, setTeams] = useState([]);

//   // Track which data sets have been loaded to avoid re-fetching
//   const [loadedSections, setLoadedSections] = useState({
//     common: false, // SPOCs, Categories, Teams (Lightweight)
//     clients: false,
//     groups: false,
//     services: false,
//   });

//   const [viewLoading, setViewLoading] = useState(false);

//   /* ---------------- SELECTION STATE ---------------- */
//   const [selectedGroupForEdit, setSelectedGroupForEdit] = useState(null);
//   const [selectedGroupForDetail, setSelectedGroupForDetail] = useState(null);
//   const [isDetailViewEditMode, setIsDetailViewEditMode] = useState(false);

//   /* ---------------- PERSIST VIEW ---------------- */
//   useEffect(() => {
//     localStorage.setItem('clientManagementView', currentView);
//   }, [currentView]);

//   /* ---------------- RESPONSIVE ---------------- */
//   useEffect(() => {
//     const handleResize = () => {
//       const mobile = window.innerWidth <= 768;
//       setIsMobile(mobile);
//       setCollapsed(mobile);
//     };
//     window.addEventListener('resize', handleResize);
//     return () => window.removeEventListener('resize', handleResize);
//   }, []);

//   /* ---------------- FETCH HELPERS ---------------- */
//   const headers = { Authorization: `Bearer ${token}` };

//   // 1. Fetch Lightweight Common Data (SPOCs, Categories, Teams)
//   const fetchCommonData = useCallback(async () => {
//     if (loadedSections.common) return;
//     try {
//       const [spocsRes, categoriesRes, teamsRes] = await Promise.all([
//         api.get('/clients/spocs/', { headers }),
//         api.get('/clients/client-group-categories/', { headers }),
//         api.get('/employee/teams/', { headers }),
//       ]);
//       setSpocs(spocsRes.data.results || spocsRes.data);
//       setGroupCategories(categoriesRes.data.results || categoriesRes.data);
//       setTeams(teamsRes.data.results || teamsRes.data);
//       setLoadedSections((prev) => ({ ...prev, common: true }));
//     } catch (err) {
//       console.error(err);
//     }
//   }, [token, loadedSections.common]);

//   // 2. Fetch Client Groups
//   const fetchGroups = useCallback(async () => {
//     if (loadedSections.groups) return;
//     setViewLoading(true);
//     try {
//       const res = await api.get('/clients/client-groups/', { headers });
//       setClientGroups(res.data.results || res.data);
//       setLoadedSections((prev) => ({ ...prev, groups: true }));
//     } catch (err) {
//       message.error('Failed to load groups');
//     } finally {
//       setViewLoading(false);
//     }
//   }, [token, loadedSections.groups]);

//   // 3. Fetch Clients
//   const fetchClients = useCallback(async () => {
//     if (loadedSections.clients) return;
//     setViewLoading(true);
//     try {
//       const res = await api.get('/clients/clients/', { headers });
//       setClients(res.data.results || res.data);
//       setLoadedSections((prev) => ({ ...prev, clients: true }));
//     } catch (err) {
//       message.error('Failed to load clients');
//     } finally {
//       setViewLoading(false);
//     }
//   }, [token, loadedSections.clients]);

//   // 4. Fetch Services (Main & Sub)
//   const fetchServices = useCallback(async () => {
//     if (loadedSections.services) return;
//     setViewLoading(true);
//     try {
//       const [mainRes, subRes] = await Promise.all([
//         api.get('/clients/mainservices/', { headers }),
//         api.get('/clients/subservices/', { headers }),
//       ]);
//       setMainServices(mainRes.data.results || mainRes.data);

//       const subMap = {};
//       (subRes.data.results || subRes.data).forEach((sub) => {
//         const mainId = typeof sub.main_service === 'object' ? sub.main_service.id : sub.main_service;
//         if (!subMap[mainId]) subMap[mainId] = [];
//         subMap[mainId].push(sub);
//       });
//       setSubServicesMap(subMap);
//       setLoadedSections((prev) => ({ ...prev, services: true }));
//     } catch (err) {
//       message.error('Failed to load services');
//     } finally {
//       setViewLoading(false);
//     }
//   }, [token, loadedSections.services]);

//   /* ---------------- LAZY LOAD TRIGGER ---------------- */
//   // This effect runs whenever the View changes to load ONLY what is needed
//   useEffect(() => {
//     // Always fetch common data (it's fast and needed everywhere)
//     fetchCommonData();

//     switch (currentView) {
//       case 'listClientGroups':
//         fetchGroups();
//         break;
//       case 'clientsWithGroupDetails':
//         // This view likely needs both Groups and Clients
//         fetchGroups();
//         fetchClients();
//         break;
//       case 'detailClientGroup':
//       case 'clientGroupManagement':
//         // Editing/Viewing details needs everything usually
//         fetchGroups();
//         fetchClients();
//         fetchServices();
//         break;
//       case 'serviceAssignment':
//         fetchClients();
//         fetchServices();
//         break;
//       case 'dashboard':
//       case 'taskboard':
//         // Dashboard fetches its own data, NO need to fetch anything here!
//         break;
//       default:
//         break;
//     }
//   }, [currentView, fetchCommonData, fetchGroups, fetchClients, fetchServices]);

//   /* ---------------- DETAIL REFRESH ---------------- */
//   const handleRefreshGroupDetails = useCallback(
//     async (group) => {
//       if (!group?.id) return;
//       try {
//         const res = await api.get(`/clients/client-groups/${group.id}/`, { headers });
//         setSelectedGroupForDetail(res.data);
//       } catch {
//         message.error('Failed to refresh group details');
//       }
//     },
//     [token]
//   );

//   /* ---------------- NAVIGATION ---------------- */
//   const handleMenuClick = ({ key }) => {
//     setCurrentView(key);
//     setSelectedGroupForEdit(null);
//     setSelectedGroupForDetail(null);
//     setIsDetailViewEditMode(false);
//     if (isMobile) setCollapsed(true);
//   };

//   /* ---------------- RENDER ---------------- */
//   const renderContent = () => {
//     // If we are waiting for data specific to this view, show spinner
//     if (viewLoading) {
//         return (
//             <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
//                 <Spin size="large" tip="Loading View Data..." />
//             </div>
//         );
//     }

//     switch (currentView) {
//       case 'clientGroupManagement':
//         return (
//           <ClientGroupManagementView
//             initialGroupData={selectedGroupForEdit}
//             clients={clients}
//             groupCategories={groupCategories}
//             mainServices={mainServices}
//             subServicesMap={subServicesMap}
//             spocs={spocs}
//             onGroupSaved={() => {
//               // Force re-fetch of groups next time we visit list
//               setLoadedSections(prev => ({ ...prev, groups: false }));
//               setCurrentView('listClientGroups');
//             }}
//           />
//         );

//       case 'listClientGroups':
//         return (
//           <ClientGroupListView
//             clientGroups={clientGroups}
//             allGroupCategories={groupCategories}
//             allSpocs={spocs}
//             onAddGroup={() => setCurrentView('clientGroupManagement')}
//             onViewGroupDetails={(group) => {
//               setSelectedGroupForDetail(group);
//               // Ensure services are loaded before going to detail
//               fetchServices();
//               fetchClients();
//               setCurrentView('detailClientGroup');
//             }}
//           />
//         );

//       case 'clientsWithGroupDetails':
//         return (
//           <ClientGroupedListView
//             allClients={clients}
//             allClientGroups={clientGroups}
//             allSpocs={spocs}
//             onViewGroupDetails={(group) => {
//               setSelectedGroupForDetail(group);
//               fetchServices(); 
//               setCurrentView('detailClientGroup');
//             }}
//           />
//         );

//       case 'detailClientGroup':
//         return (
//           <ClientGroupDetailView
//             group={selectedGroupForDetail}
//             allClients={clients}
//             allGroupCategories={groupCategories}
//             allMainServices={mainServices}
//             allSubServicesMap={subServicesMap}
//             allSubServices={Object.values(subServicesMap).flat()}
//             allSpocs={spocs}
//             isEditMode={isDetailViewEditMode}
//             onToggleEditMode={setIsDetailViewEditMode}
//             onBack={() => setCurrentView('listClientGroups')}
//             onGroupDataRefreshed={handleRefreshGroupDetails}
//           />
//         );

//       case 'serviceAssignment':
//         return (
//           <ServiceTeamManagementView
//             clients={clients}
//             mainServices={mainServices}
//             subServicesMap={subServicesMap}
//             teams={teams}
//           />
//         );

//       case 'taskboard':
//         return <JiraBoard />;

//       case 'dashboard':
//         return <TaskDashboard />;

//       default:
//         return null;
//     }
//   };

//   const iconStyle = (color) => ({ fontSize: 18, color });

//   return (
//     <AntdApp>
//       <Layout style={{ minHeight: '100vh' }}>
//         <Sider
//           theme="light"
//           width={220}
//           collapsed={collapsed}
//           collapsible={!isMobile}
//           collapsedWidth={isMobile ? 0 : 80}
//           trigger={null}
//         >
//           {!collapsed && (
//             <div style={{ padding: 16, fontWeight: 700, color: '#4338ca' }}>
//               Client Management
//             </div>
//           )}

//           <Menu mode="inline" selectedKeys={[currentView]} onClick={handleMenuClick}>
//             <Menu.Item key="listClientGroups" icon={<ApartmentOutlined style={iconStyle('#6366f1')} />}>
//               Client Groups
//             </Menu.Item>
//             <Menu.Item key="clientsWithGroupDetails" icon={<UsergroupAddOutlined style={iconStyle('#0ea5e9')} />}>
//               Client List
//             </Menu.Item>
//             <Menu.Item key="serviceAssignment" icon={<ClusterOutlined style={iconStyle('#22c55e')} />}>
//               Teams & Services
//             </Menu.Item>
//             <Menu.Item key="dashboard" icon={<BarChartOutlined style={iconStyle('#a855f7')} />}>
//               Dashboard
//             </Menu.Item>
//           </Menu>
//         </Sider>

//         <Layout>
//           {isMobile && (
//             <Header style={{ background: '#fff' }}>
//               <Button
//                 type="text"
//                 icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
//                 onClick={() => setCollapsed((v) => !v)}
//               />
//             </Header>
//           )}

//           <Content style={{ margin: 16, padding: 16, background: '#fff', borderRadius: 12 }}>
//             {renderContent()}
//           </Content>
//         </Layout>
//       </Layout>
//     </AntdApp>
//   );
// }

// export default ClientManagementPage;

// import React, { useState, useCallback, useEffect, useContext } from 'react'; // Added useContext
// import { Layout, Menu, message, Spin, Button, App as AntdApp } from 'antd';
// import {
//   ApartmentOutlined,
//   UsergroupAddOutlined,
//   ClusterOutlined,
//   BarChartOutlined,
//   MenuUnfoldOutlined,
//   MenuFoldOutlined,
// } from '@ant-design/icons';
// import { SpinnerContext } from '../../../components/SpinnerContext';
// import ClientGroupManagementView from './ClientGroupManagementView';
// import ClientGroupListView from './ClientGroupListView';
// import ClientGroupedListView from './ClientGroupedListView';
// import ClientGroupDetailView from './ClientGroupDetailView';
// import ServiceTeamManagementView from './ServiceAssignmentView';
// import JiraBoard from './taskboard';
// import TaskDashboard from './TaskDashboard';

// import { api } from '../../../services/api';
// import { useAuth } from '../../../contexts/AuthContext';

// const { Sider, Content, Header } = Layout;

// function ClientManagementPage() {
//   const { authToken } = useAuth();
//   const token = authToken || localStorage.getItem('token');
//   const { showSpinner, hideSpinner } = useContext(SpinnerContext);

//   /* ---------------- UI STATE ---------------- */
//   const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
//   const [collapsed, setCollapsed] = useState(window.innerWidth <= 768);
//   const [currentView, setCurrentView] = useState(
//     localStorage.getItem('clientManagementView') || 'listClientGroups'
//   );

//   /* ---------------- DATA STATE ---------------- */
//   const [clients, setClients] = useState([]);
//   const [spocs, setSpocs] = useState([]);
//   const [groupCategories, setGroupCategories] = useState([]);
//   const [mainServices, setMainServices] = useState([]);
//   const [subServicesMap, setSubServicesMap] = useState({});
//   const [clientGroups, setClientGroups] = useState([]);
//   const [teams, setTeams] = useState([]);

//   // Track which data sets have been loaded to avoid re-fetching
//   const [loadedSections, setLoadedSections] = useState({
//     common: false, // SPOCs, Categories, Teams (Lightweight)
//     clients: false,
//     groups: false,
//     services: false,
//   });

//   const [viewLoading, setViewLoading] = useState(false);

//   /* ---------------- SELECTION STATE ---------------- */
//   const [selectedGroupForEdit, setSelectedGroupForEdit] = useState(null);
//   const [selectedGroupForDetail, setSelectedGroupForDetail] = useState(null);
//   const [isDetailViewEditMode, setIsDetailViewEditMode] = useState(false);
//   const [selectedClientId, setSelectedClientId] = useState(null);

//   /* ---------------- PERSIST VIEW ---------------- */
//   useEffect(() => {
//     localStorage.setItem('clientManagementView', currentView);
//   }, [currentView]);

//   /* ---------------- RESPONSIVE ---------------- */
//   useEffect(() => {
//     const handleResize = () => {
//       const mobile = window.innerWidth <= 768;
//       setIsMobile(mobile);
//       setCollapsed(mobile);
//     };
//     window.addEventListener('resize', handleResize);
//     return () => window.removeEventListener('resize', handleResize);
//   }, []);

//   /* ---------------- FETCH HELPERS ---------------- */
//   const headers = { Authorization: `Bearer ${token}` };

//   // 1. Fetch Lightweight Common Data (SPOCs, Categories, Teams)
//   const fetchCommonData = useCallback(async () => {
//     if (loadedSections.common) return;
//     showSpinner(); // 🔥 Start Spinner
//     try {
//       const [spocsRes, categoriesRes, teamsRes] = await Promise.all([
//         api.get('/clients/spocs/', { headers }),
//         api.get('/clients/client-group-categories/', { headers }),
//         api.get('/employee/teams/', { headers }),
//       ]);
//       setSpocs(spocsRes.data.results || spocsRes.data);
//       setGroupCategories(categoriesRes.data.results || categoriesRes.data);
//       setTeams(teamsRes.data.results || teamsRes.data);
//       setLoadedSections((prev) => ({ ...prev, common: true }));
//     } catch (err) {
//       console.error(err);
//     } finally {
//         hideSpinner(); // 🔥 Stop Spinner
//     }
//   }, [token, loadedSections.common, showSpinner, hideSpinner]);

//   // 2. Fetch Client Groups
//   const fetchGroups = useCallback(async () => {
//     if (loadedSections.groups) return;
//     showSpinner();
//     setViewLoading(true);
//     try {
//       const res = await api.get('/clients/client-groups/', { headers });
//       setClientGroups(res.data.results || res.data);
//       setLoadedSections((prev) => ({ ...prev, groups: true }));
//     } catch (err) {
//       message.error('Failed to load groups');
//     } finally {
//       setViewLoading(false);
//       hideSpinner();
//     }
//   }, [token, loadedSections.groups, showSpinner, hideSpinner]);

//   // 3. Fetch Clients
//   const fetchClients = useCallback(async () => {
//     if (loadedSections.clients) return;
    
//     showSpinner();
//     setViewLoading(true);
    
//     try {
//       let allClients = [];
//       let page = 1;
//       let hasMore = true;
//       const pageSize = 100; // Fetch 100 at a time
      
//       while (hasMore) {
//         const res = await api.get(`/clients/clients/?page=${page}&page_size=${pageSize}`, { headers });
        
//         // Handle both paginated and non-paginated responses
//         if (res.data.results) {
//           // Paginated response
//           allClients = [...allClients, ...res.data.results];
//           hasMore = !!res.data.next;
//         } else {
//           // Non-paginated response (backward compatible)
//           allClients = res.data;
//           hasMore = false;
//         }
        
//         page++;
//       }
      
//       setClients(allClients);
//       setLoadedSections((prev) => ({ ...prev, clients: true }));
//     } catch (err) {
//       message.error('Failed to load clients');
//       console.error('Error fetching clients:', err);
//     } finally {
//       setViewLoading(false);
//       hideSpinner();
//     }
//   }, [token, loadedSections.clients, showSpinner, hideSpinner]);

//   // 4. Fetch Services (Main & Sub)
//   const fetchServices = useCallback(async () => {
//     if (loadedSections.services) return;
//     showSpinner(); // 🔥 Start Spinner
//     setViewLoading(true);
//     try {
//       const [mainRes, subRes] = await Promise.all([
//         api.get('/clients/mainservices/', { headers }),
//         api.get('/clients/subservices/', { headers }),
//       ]);
//       setMainServices(mainRes.data.results || mainRes.data);

//       const subMap = {};
//       (subRes.data.results || subRes.data).forEach((sub) => {
//         const mainId = typeof sub.main_service === 'object' ? sub.main_service.id : sub.main_service;
//         if (!subMap[mainId]) subMap[mainId] = [];
//         subMap[mainId].push(sub);
//       });
//       setSubServicesMap(subMap);
//       setLoadedSections((prev) => ({ ...prev, services: true }));
//     } catch (err) {
//       message.error('Failed to load services');
//     } finally {
//       setViewLoading(false);
//       hideSpinner(); // 🔥 Stop Spinner
//     }
//   }, [token, loadedSections.services, showSpinner, hideSpinner]);

//   /* ---------------- LAZY LOAD TRIGGER ---------------- */
//   // This effect runs whenever the View changes to load ONLY what is needed
//   useEffect(() => {
//     // Always fetch common data (it's fast and needed everywhere)
//     fetchCommonData();

//     switch (currentView) {
//       case 'listClientGroups':
//         fetchGroups();
//         break;
//       case 'clientsWithGroupDetails':
//         // This view likely needs both Groups and Clients
//         fetchGroups();
//         fetchClients();
//         break;
//       case 'detailClientGroup':
//       case 'clientGroupManagement':
//         // Editing/Viewing details needs everything usually
//         fetchGroups();
//         fetchClients();
//         fetchServices();
//         break;
//       case 'serviceAssignment':
//         fetchClients();
//         fetchServices();
//         break;
//       case 'dashboard':
//       case 'taskboard':
//         // Dashboard fetches its own data, NO need to fetch anything here!
//         break;
//       default:
//         break;
//     }
//   }, [currentView, fetchCommonData, fetchGroups, fetchClients, fetchServices]);

//   /* ---------------- DETAIL REFRESH ---------------- */
//   const handleRefreshGroupDetails = useCallback(
//     async (group) => {
//       if (!group?.id) return;
//       showSpinner(); // 🔥 Start Spinner
//       try {
//         const res = await api.get(`/clients/client-groups/${group.id}/`, { headers });
//         setSelectedGroupForDetail(res.data);
//       } catch {
//         message.error('Failed to refresh group details');
//       } finally {
//         hideSpinner(); // 🔥 Stop Spinner
//       }
//     },
//     [token, showSpinner, hideSpinner]
//   );

//   /* ---------------- NAVIGATION ---------------- */
//   const handleMenuClick = ({ key }) => {
//     setCurrentView(key);
//     setSelectedGroupForEdit(null);
//     setSelectedGroupForDetail(null);
//     setIsDetailViewEditMode(false);
//     if (isMobile) setCollapsed(true);
//   };

//   /* ---------------- RENDER ---------------- */
//   const renderContent = () => {
//     // If we are waiting for data specific to this view, show spinner
//     // Note: Global spinner handles the full screen overlay, but we keep this logic 
//     // in case you want a specific placeholder for the content area.
//     if (viewLoading) {
//         return (
//             <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
//                 {/* <Spin size="large" tip="Loading View Data..." /> */}
//             </div>
//         );
//     }

//     switch (currentView) {
//       case 'clientGroupManagement':
//         return (
//           <ClientGroupManagementView
//             initialGroupData={selectedGroupForEdit}
//             clients={clients}
//             groupCategories={groupCategories}
//             mainServices={mainServices}
//             subServicesMap={subServicesMap}
//             spocs={spocs}
//             onGroupSaved={() => {
//               // Force re-fetch of groups next time we visit list
//               setLoadedSections(prev => ({ ...prev, groups: false }));
//               setCurrentView('listClientGroups');
//             }}
//           />
//         );

//       case 'listClientGroups':
//         return (
//           <ClientGroupListView
//             clientGroups={clientGroups}
//             allGroupCategories={groupCategories}
//             allSpocs={spocs}
//             onAddGroup={() => setCurrentView('clientGroupManagement')}
//             onViewGroupDetails={(group, clientId = null) => {
//               setSelectedGroupForDetail(group);
//               setSelectedClientId(clientId);
//               fetchServices();
//               fetchClients();
//               setCurrentView('detailClientGroup');
//             }}
//           />
//         );

//       case 'clientsWithGroupDetails':
//         return (
//           <ClientGroupedListView
//             allClients={clients}
//             allClientGroups={clientGroups}
//             allGroupCategories={groupCategories}
//             allSpocs={spocs}
//             onViewGroupDetails={(group, clientId = null) => {
//               setSelectedGroupForDetail(group);
//               setSelectedClientId(clientId);
//               fetchServices();
//               setCurrentView('detailClientGroup');
//             }}
//           />
//         );


//       case 'detailClientGroup':
//         return (
//           <ClientGroupDetailView
//             group={selectedGroupForDetail}
//             selectedClientId={selectedClientId}
//             allClients={clients}
//             allGroupCategories={groupCategories}
//             allMainServices={mainServices}
//             allSubServicesMap={subServicesMap}
//             allSubServices={Object.values(subServicesMap).flat()}
//             allSpocs={spocs}
//             isEditMode={isDetailViewEditMode}
//             onToggleEditMode={setIsDetailViewEditMode}
//             onBack={() => setCurrentView('listClientGroups')}
//             onGroupDataRefreshed={handleRefreshGroupDetails}
//           />
//         );

//       case 'serviceAssignment':
//         return (
//           <ServiceTeamManagementView
//             // clients={clients}
//             // mainServices={mainServices}
//             // subServicesMap={subServicesMap}
//             // teams={teams}
//           />
//         );

//       case 'taskboard':
//         return <JiraBoard />;

//       case 'dashboard':
//         return <TaskDashboard />;

//       default:
//         return null;
//     }
//   };

//   const iconStyle = (color) => ({ fontSize: 18, color });

//   return (
//     <AntdApp>
//       <Layout style={{ minHeight: '100vh' }}>
//         <Sider
//           theme="light"
//           width={220}
//           collapsed={collapsed}
//           collapsible={!isMobile}
//           collapsedWidth={isMobile ? 0 : 80}
//           trigger={null}
//         >
//           {!collapsed && (
//             <div style={{ padding: 16, fontWeight: 700, color: '#4338ca' }}>
//               Client Management
//             </div>
//           )}

//           <Menu mode="inline" selectedKeys={[currentView]} onClick={handleMenuClick}>
//             <Menu.Item key="listClientGroups" icon={<ApartmentOutlined style={iconStyle('#6366f1')} />}>
//               Client Groups
//             </Menu.Item>
//             <Menu.Item key="clientsWithGroupDetails" icon={<UsergroupAddOutlined style={iconStyle('#0ea5e9')} />}>
//               Client List
//             </Menu.Item>
//             <Menu.Item key="serviceAssignment" icon={<ClusterOutlined style={iconStyle('#22c55e')} />}>
//               Teams & Services
//             </Menu.Item>
//             <Menu.Item key="dashboard" icon={<BarChartOutlined style={iconStyle('#a855f7')} />}>
//               Dashboard
//             </Menu.Item>
//           </Menu>
//         </Sider>

//         <Layout>
//           {isMobile && (
//             <Header style={{ background: '#fff' }}>
//               <Button
//                 type="text"
//                 icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
//                 onClick={() => setCollapsed((v) => !v)}
//               />
//             </Header>
//           )}

//           <Content style={{ margin: 16, padding: 16, background: '#fff', borderRadius: 12 }}>
//             {renderContent()}
//           </Content>
//         </Layout>
//       </Layout>
//     </AntdApp>
//   );
// }

// export default ClientManagementPage;

// import React, { useState, useCallback, useEffect, useContext } from 'react';
// import { message } from 'antd';
// import { useLocation, useNavigate } from 'react-router-dom';
// import { SpinnerContext } from '../../../components/SpinnerContext';
// import ClientGroupManagementView from './ClientGroupManagementView';
// import ClientGroupListView from './ClientGroupListView';
// import ClientGroupedListView from './ClientGroupedListView';
// import ClientGroupDetailView from './ClientGroupDetailView';
// import ServiceTeamManagementView from './ServiceAssignmentView';
// import JiraBoard from './taskboard';
// import TaskDashboard from './TaskDashboard';
// import { api } from '../../../services/api';
// import { useAuth } from '../../../contexts/AuthContext';

// /* ── map ?view= param → internal view key ── */
// const VIEW_PARAM_MAP = {
//   clients: 'clientsWithGroupDetails',
//   service: 'serviceAssignment',
//   dash:    'dashboard',
// };

// function ClientManagementPage() {
//   const { authToken } = useAuth();
//   const token = authToken || localStorage.getItem('token');
//   const { showSpinner, hideSpinner } = useContext(SpinnerContext);
//   const location = useLocation();
//   const navigate  = useNavigate();

//   const headers = { Authorization: `Bearer ${token}` };

//   /* ── resolve initial view from URL ?view= → localStorage → default ── */
//   const resolveView = () => {
//     const param = new URLSearchParams(location.search).get('view');
//     if (param && VIEW_PARAM_MAP[param]) return VIEW_PARAM_MAP[param];
//     return localStorage.getItem('clientManagementView') || 'listClientGroups';
//   };

//   const [currentView, setCurrentView] = useState(resolveView);

//   /* ── DATA STATE ── */
//   const [clients,         setClients]         = useState([]);
//   const [spocs,           setSpocs]           = useState([]);
//   const [groupCategories, setGroupCategories] = useState([]);
//   const [mainServices,    setMainServices]    = useState([]);
//   const [subServicesMap,  setSubServicesMap]  = useState({});
//   const [clientGroups,    setClientGroups]    = useState([]);
//   const [teams,           setTeams]           = useState([]);
//   const [loadedSections,  setLoadedSections]  = useState({ common: false, clients: false, groups: false, services: false });
//   const [viewLoading,     setViewLoading]     = useState(false);

//   /* ── SELECTION STATE ── */
//   const [selectedGroupForEdit,   setSelectedGroupForEdit]   = useState(null);
//   const [selectedGroupForDetail, setSelectedGroupForDetail] = useState(null);
//   const [isDetailViewEditMode,   setIsDetailViewEditMode]   = useState(false);
//   const [selectedClientId,       setSelectedClientId]       = useState(null);

//   /* ── sync view when URL ?view= changes (sidebar click) ── */
//   useEffect(() => {
//     const param  = new URLSearchParams(location.search).get('view');
//     const mapped = param && VIEW_PARAM_MAP[param] ? VIEW_PARAM_MAP[param] : 'listClientGroups';
//     setCurrentView(mapped);
//   }, [location.search]);

//   /* ── persist view to localStorage ── */
//   useEffect(() => {
//     localStorage.setItem('clientManagementView', currentView);
//   }, [currentView]);

//   /* ── FETCH HELPERS ── */
//   const fetchCommonData = useCallback(async () => {
//     if (loadedSections.common) return;
//     showSpinner();
//     try {
//       const [spocsRes, categoriesRes, teamsRes] = await Promise.all([
//         api.get('/clients/spocs/', { headers }),
//         api.get('/clients/client-group-categories/', { headers }),
//         api.get('/employee/teams/', { headers }),
//       ]);
//       setSpocs(spocsRes.data.results || spocsRes.data);
//       setGroupCategories(categoriesRes.data.results || categoriesRes.data);
//       setTeams(teamsRes.data.results || teamsRes.data);
//       setLoadedSections(p => ({ ...p, common: true }));
//     } catch (err) { console.error(err); }
//     finally { hideSpinner(); }
//   }, [token, loadedSections.common, showSpinner, hideSpinner]);

//   const fetchGroups = useCallback(async () => {
//     if (loadedSections.groups) return;
//     showSpinner(); setViewLoading(true);
//     try {
//       const res = await api.get('/clients/client-groups/', { headers });
//       setClientGroups(res.data.results || res.data);
//       setLoadedSections(p => ({ ...p, groups: true }));
//     } catch { message.error('Failed to load groups'); }
//     finally { setViewLoading(false); hideSpinner(); }
//   }, [token, loadedSections.groups, showSpinner, hideSpinner]);

//   const fetchClients = useCallback(async () => {
//     if (loadedSections.clients) return;
//     showSpinner(); setViewLoading(true);
//     try {
//       let all = [], page = 1, hasMore = true;
//       while (hasMore) {
//         const res = await api.get(`/clients/clients/?page=${page}&page_size=100`, { headers });
//         if (res.data.results) { all = [...all, ...res.data.results]; hasMore = !!res.data.next; }
//         else { all = res.data; hasMore = false; }
//         page++;
//       }
//       setClients(all);
//       setLoadedSections(p => ({ ...p, clients: true }));
//     } catch { message.error('Failed to load clients'); }
//     finally { setViewLoading(false); hideSpinner(); }
//   }, [token, loadedSections.clients, showSpinner, hideSpinner]);

//   const fetchServices = useCallback(async () => {
//     if (loadedSections.services) return;
//     showSpinner(); setViewLoading(true);
//     try {
//       const [mainRes, subRes] = await Promise.all([
//         api.get('/clients/mainservices/', { headers }),
//         api.get('/clients/subservices/', { headers }),
//       ]);
//       setMainServices(mainRes.data.results || mainRes.data);
//       const subMap = {};
//       (subRes.data.results || subRes.data).forEach(sub => {
//         const id = typeof sub.main_service === 'object' ? sub.main_service.id : sub.main_service;
//         if (!subMap[id]) subMap[id] = [];
//         subMap[id].push(sub);
//       });
//       setSubServicesMap(subMap);
//       setLoadedSections(p => ({ ...p, services: true }));
//     } catch { message.error('Failed to load services'); }
//     finally { setViewLoading(false); hideSpinner(); }
//   }, [token, loadedSections.services, showSpinner, hideSpinner]);

//   /* ── lazy-load data based on current view ── */
//   useEffect(() => {
//     fetchCommonData();
//     switch (currentView) {
//       case 'listClientGroups':         fetchGroups(); break;
//       case 'clientsWithGroupDetails':  fetchGroups(); fetchClients(); break;
//       case 'detailClientGroup':
//       case 'clientGroupManagement':    fetchGroups(); fetchClients(); fetchServices(); break;
//       case 'serviceAssignment':        fetchClients(); fetchServices(); break;
//       default: break;
//     }
//   }, [currentView, fetchCommonData, fetchGroups, fetchClients, fetchServices]);

//   const handleRefreshGroupDetails = useCallback(async (group) => {
//     if (!group?.id) return;
//     showSpinner();
//     try {
//       const res = await api.get(`/clients/client-groups/${group.id}/`, { headers });
//       setSelectedGroupForDetail(res.data);
//     } catch { message.error('Failed to refresh group details'); }
//     finally { hideSpinner(); }
//   }, [token, showSpinner, hideSpinner]);

//   /* ── RENDER ── */
//   const renderContent = () => {
//     if (viewLoading) return <div style={{ height: '60vh' }} />;

//     switch (currentView) {
//       case 'clientGroupManagement':
//         return (
//           <ClientGroupManagementView
//             initialGroupData={selectedGroupForEdit}
//             clients={clients} groupCategories={groupCategories}
//             mainServices={mainServices} subServicesMap={subServicesMap} spocs={spocs}
//             onGroupSaved={() => {
//               setLoadedSections(p => ({ ...p, groups: false }));
//               setCurrentView('listClientGroups');
//               navigate('/client-management', { replace: true });
//             }}
//           />
//         );

//       case 'listClientGroups':
//         return (
//           <ClientGroupListView
//             clientGroups={clientGroups} allGroupCategories={groupCategories} allSpocs={spocs}
//             onAddGroup={() => setCurrentView('clientGroupManagement')}
//             onViewGroupDetails={(group, clientId = null) => {
//               setSelectedGroupForDetail(group);
//               setSelectedClientId(clientId);
//               fetchServices(); fetchClients();
//               setCurrentView('detailClientGroup');
//             }}
//           />
//         );

//       case 'clientsWithGroupDetails':
//         return (
//           <ClientGroupedListView
//             allClients={clients} allClientGroups={clientGroups}
//             allGroupCategories={groupCategories} allSpocs={spocs}
//             onViewGroupDetails={(group, clientId = null) => {
//               setSelectedGroupForDetail(group);
//               setSelectedClientId(clientId);
//               fetchServices();
//               setCurrentView('detailClientGroup');
//             }}
//           />
//         );

//       case 'detailClientGroup':
//         return (
//           <ClientGroupDetailView
//             group={selectedGroupForDetail} selectedClientId={selectedClientId}
//             allClients={clients} allGroupCategories={groupCategories}
//             allMainServices={mainServices} allSubServicesMap={subServicesMap}
//             allSubServices={Object.values(subServicesMap).flat()} allSpocs={spocs}
//             isEditMode={isDetailViewEditMode} onToggleEditMode={setIsDetailViewEditMode}
//             onBack={() => {
//               setCurrentView('listClientGroups');
//               navigate('/client-management', { replace: true });
//             }}
//             onGroupDataRefreshed={handleRefreshGroupDetails}
//           />
//         );

//       case 'serviceAssignment':
//         return <ServiceTeamManagementView />;

//       case 'taskboard':
//         return <JiraBoard />;

//       case 'dashboard':
//         return <TaskDashboard />;

//       default:
//         return null;
//     }
//   };

//   return (
//     <div style={{ background: '#fff', borderRadius: 12, padding: 16, minHeight: '60vh' }}>
//       {renderContent()}
//     </div>
//   );
// }

// export default ClientManagementPage;

import React, { useState, useCallback, useEffect, useContext } from 'react';
import { message } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';
import { SpinnerContext } from '../../../components/SpinnerContext';
import ClientGroupManagementView from './ClientGroupManagementView';
import ClientGroupListView from './ClientGroupListView';
import ClientGroupedListView from './ClientGroupedListView';
import ClientGroupDetailView from './ClientGroupDetailView';
import ServiceTeamManagementView from './ServiceAssignmentView';
import JiraBoard from './taskboard';
import TaskDashboard from './TaskDashboard';
import { api } from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';

/* ── map ?view= param → internal view key ── */
const VIEW_PARAM_MAP = {
  clients: 'clientsWithGroupDetails',
  service: 'serviceAssignment',
  dash:    'dashboard',
};

function ClientManagementPage() {
  const { authToken } = useAuth();
  const token = authToken || localStorage.getItem('token');
  const { showSpinner, hideSpinner } = useContext(SpinnerContext);
  const location = useLocation();
  const navigate  = useNavigate();

  const headers = { Authorization: `Bearer ${token}` };

  /* ── resolve initial view from URL ?view= → localStorage → default ── */
  const resolveView = () => {
    const param = new URLSearchParams(location.search).get('view');
    if (param && VIEW_PARAM_MAP[param]) return VIEW_PARAM_MAP[param];
    return localStorage.getItem('clientManagementView') || 'listClientGroups';
  };

  const [currentView, setCurrentView] = useState(resolveView);

  /* ── DATA STATE ── */
  const [clients,         setClients]         = useState([]);
  const [spocs,           setSpocs]           = useState([]);
  const [groupCategories, setGroupCategories] = useState([]);
  const [mainServices,    setMainServices]    = useState([]);
  const [subServicesMap,  setSubServicesMap]  = useState({});
  const [clientGroups,    setClientGroups]    = useState([]);
  const [teams,           setTeams]           = useState([]);
  const [loadedSections,  setLoadedSections]  = useState({
    common: false, clients: false, groups: false, services: false,
  });
  const [viewLoading, setViewLoading] = useState(false);

  /* ── SELECTION STATE ── */
  const [selectedGroupForEdit,   setSelectedGroupForEdit]   = useState(null);
  const [selectedGroupForDetail, setSelectedGroupForDetail] = useState(null);
  const [isDetailViewEditMode,   setIsDetailViewEditMode]   = useState(false);
  const [selectedClientId,       setSelectedClientId]       = useState(null);

  /* ── sync view when URL ?view= changes (sidebar click) ── */
  useEffect(() => {
    const param  = new URLSearchParams(location.search).get('view');
    const mapped = param && VIEW_PARAM_MAP[param]
      ? VIEW_PARAM_MAP[param]
      : 'listClientGroups';
    setCurrentView(mapped);
  }, [location.search]);

  /* ── persist view to localStorage ── */
  useEffect(() => {
    localStorage.setItem('clientManagementView', currentView);
  }, [currentView]);

  /* ── FETCH HELPERS ── */

  const fetchCommonData = useCallback(async () => {
    if (loadedSections.common) return;
    showSpinner();
    try {
      const [spocsRes, categoriesRes, teamsRes] = await Promise.all([
        api.get('/clients/spocs/',                  { headers }),
        api.get('/clients/client-group-categories/', { headers }),
        api.get('/employee/teams/',                  { headers }),
      ]);
      setSpocs(spocsRes.data.results          || spocsRes.data);
      setGroupCategories(categoriesRes.data.results || categoriesRes.data);
      setTeams(teamsRes.data.results          || teamsRes.data);
      setLoadedSections(p => ({ ...p, common: true }));
    } catch (err) {
      console.error('fetchCommonData error:', err);
    } finally {
      hideSpinner();
    }
  }, [token, loadedSections.common, showSpinner, hideSpinner]);

  const fetchGroups = useCallback(async () => {
    if (loadedSections.groups) return;
    showSpinner(); setViewLoading(true);
    try {
      const res = await api.get('/clients/client-groups/', { headers });
      setClientGroups(res.data.results || res.data);
      setLoadedSections(p => ({ ...p, groups: true }));
    } catch {
      message.error('Failed to load groups');
    } finally {
      setViewLoading(false); hideSpinner();
    }
  }, [token, loadedSections.groups, showSpinner, hideSpinner]);

  /* ── OPTIMIZED: single request instead of paginated loop ── */
  const fetchClients = useCallback(async () => {
    if (loadedSections.clients) return;
    showSpinner(); setViewLoading(true);
    try {
      const res = await api.get('/clients/clients/?page_size=500', { headers });
      // Handle both paginated ({ results: [...] }) and plain array responses
      const data = res.data.results || res.data;
      setClients(Array.isArray(data) ? data : []);
      setLoadedSections(p => ({ ...p, clients: true }));
    } catch {
      message.error('Failed to load clients');
    } finally {
      setViewLoading(false); hideSpinner();
    }
  }, [token, loadedSections.clients, showSpinner, hideSpinner]);

  const fetchServices = useCallback(async () => {
    if (loadedSections.services) return;
    showSpinner(); setViewLoading(true);
    try {
      const [mainRes, subRes] = await Promise.all([
        api.get('/clients/mainservices/', { headers }),
        api.get('/clients/subservices/',  { headers }),
      ]);
      setMainServices(mainRes.data.results || mainRes.data);

      const subMap = {};
      (subRes.data.results || subRes.data).forEach(sub => {
        const id = typeof sub.main_service === 'object'
          ? sub.main_service.id
          : sub.main_service;
        if (!subMap[id]) subMap[id] = [];
        subMap[id].push(sub);
      });
      setSubServicesMap(subMap);
      setLoadedSections(p => ({ ...p, services: true }));
    } catch {
      message.error('Failed to load services');
    } finally {
      setViewLoading(false); hideSpinner();
    }
  }, [token, loadedSections.services, showSpinner, hideSpinner]);

  /* ── lazy-load data based on current view ── */
  useEffect(() => {
    fetchCommonData();
    switch (currentView) {
      case 'listClientGroups':
        fetchGroups();
        break;
      case 'clientsWithGroupDetails':
        fetchGroups();
        fetchClients();
        break;
      case 'detailClientGroup':
      case 'clientGroupManagement':
        fetchGroups();
        fetchClients();
        fetchServices();
        break;
      case 'serviceAssignment':
        fetchClients();
        fetchServices();
        break;
      default:
        break;
    }
  }, [currentView, fetchCommonData, fetchGroups, fetchClients, fetchServices]);

  const handleRefreshGroupDetails = useCallback(async (group) => {
    if (!group?.id) return;
    showSpinner();
    try {
      const res = await api.get(`/clients/client-groups/${group.id}/`, { headers });
      setSelectedGroupForDetail(res.data);
    } catch {
      message.error('Failed to refresh group details');
    } finally {
      hideSpinner();
    }
  }, [token, showSpinner, hideSpinner]);

  /* ── force-refresh clients (call after create/update/delete) ── */
  const refreshClients = useCallback(() => {
    setLoadedSections(p => ({ ...p, clients: false }));
  }, []);

  /* ── RENDER ── */
  const renderContent = () => {
    if (viewLoading) return <div style={{ height: '60vh' }} />;

    switch (currentView) {

      case 'clientGroupManagement':
        return (
          <ClientGroupManagementView
            initialGroupData={selectedGroupForEdit}
            clients={clients}
            groupCategories={groupCategories}
            mainServices={mainServices}
            subServicesMap={subServicesMap}
            spocs={spocs}
            onGroupSaved={() => {
              // Invalidate both groups and clients so they re-fetch
              setLoadedSections(p => ({ ...p, groups: false, clients: false }));
              setCurrentView('listClientGroups');
              navigate('/client-management', { replace: true });
            }}
          />
        );

      case 'listClientGroups':
        return (
          <ClientGroupListView
            clientGroups={clientGroups}
            allGroupCategories={groupCategories}
            allSpocs={spocs}
            onAddGroup={() => {
              setSelectedGroupForEdit(null);
              setCurrentView('clientGroupManagement');
            }}
            onViewGroupDetails={(group, clientId = null) => {
              setSelectedGroupForDetail(group);
              setSelectedClientId(clientId);
              fetchServices();
              fetchClients();
              setCurrentView('detailClientGroup');
            }}
            token={token}
          />
        );

      case 'clientsWithGroupDetails':
        return (
          <ClientGroupedListView
            allClients={clients}
            allClientGroups={clientGroups}
            allGroupCategories={groupCategories}
            allSpocs={spocs}
            onViewGroupDetails={(group, clientId = null) => {
              setSelectedGroupForDetail(group);
              setSelectedClientId(clientId);
              fetchServices();
              setCurrentView('detailClientGroup');
            }}
          />
        );

      case 'detailClientGroup':
        return (
          <ClientGroupDetailView
            group={selectedGroupForDetail}
            selectedClientId={selectedClientId}
            allClients={clients}
            allGroupCategories={groupCategories}
            allMainServices={mainServices}
            allSubServicesMap={subServicesMap}
            allSubServices={Object.values(subServicesMap).flat()}
            allSpocs={spocs}
            isEditMode={isDetailViewEditMode}
            onToggleEditMode={setIsDetailViewEditMode}
            onBack={() => {
              setCurrentView('listClientGroups');
              navigate('/client-management', { replace: true });
            }}
            onGroupDataRefreshed={handleRefreshGroupDetails}
          />
        );

      case 'serviceAssignment':
        return <ServiceTeamManagementView />;

      case 'taskboard':
        return <JiraBoard />;

      case 'dashboard':
        return <TaskDashboard />;

      default:
        return null;
    }
  };

  return (
    <div style={{ background: '#fff', borderRadius: 12, padding: 16, minHeight: '60vh' }}>
      {renderContent()}
    </div>
  );
}

export default ClientManagementPage;