
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