// // // D:\Onging Projects\HRMS\frontend\src\pages\clients\ClientManagement\ClientGroupManagementView.js


// ClientGroupManagementView.js

import React, { useState, useEffect, useCallback } from 'react';
import {
  Form, Typography, Spin, Card,
  Divider, Descriptions, Tag, Table, Col, Row, Space,
} from 'antd';
import {
  SolutionOutlined, UsergroupAddOutlined, ReconciliationOutlined,
  CheckCircleOutlined, CrownOutlined, GoldOutlined, StarOutlined,
  UserOutlined, TagOutlined,
} from '@ant-design/icons';
import ClientGroupForm from './ClientGroupForm';
import ClientGroupClientsForm from './ClientGroupClientsForm';
import ClientGroupServicesForm from './ClientGroupServicesForm';
import moment from 'moment';
import { api } from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';

const { Title, Text } = Typography;

const P = {
  navy:'#023C6C', navyDk:'#011f3a', teal:'#0891b2', tealLt:'#e0f2f9',
  indigo:'#4f46e5', indigoLt:'#eef2ff', slate:'#64748b', border:'#e2e8f0',
  green:'#059669', greenLt:'#d1fae5', amber:'#d97706', amberLt:'#fef3c7',
  red:'#dc2626', redLt:'#fee2e2',
};

if (!document.getElementById('cgmv-styles')) {
  const s = document.createElement('style');
  s.id = 'cgmv-styles';
  s.textContent = `
    @keyframes cgmvSpin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
    @keyframes cgmvFadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
    .cgmv-nav-btn{padding:10px 22px;border-radius:10px;font-weight:700;font-size:13px;
      cursor:pointer;transition:all .18s;border:none;display:inline-flex;align-items:center;gap:7px}
    .cgmv-nav-btn:disabled{opacity:.5;cursor:not-allowed}
    .cgmv-nav-btn.secondary{background:#f8fafc;color:#475569;border:1.5px solid #e2e8f0}
    .cgmv-nav-btn.secondary:hover:not(:disabled){background:#e2e8f0}
    .cgmv-nav-btn.primary{background:linear-gradient(135deg,#4f46e5,#0891b2);color:#fff;
      box-shadow:0 4px 14px rgba(79,70,229,.28)}
    .cgmv-nav-btn.primary:hover:not(:disabled){transform:translateY(-1px);
      box-shadow:0 8px 20px rgba(79,70,229,.36)}
    .cgmv-nav-btn.success{background:linear-gradient(135deg,#059669,#0891b2);color:#fff;
      box-shadow:0 4px 14px rgba(5,150,105,.28)}
    .cgmv-nav-btn.success:hover:not(:disabled){transform:translateY(-1px);
      box-shadow:0 8px 20px rgba(5,150,105,.36)}
    .cgmv-review-card{background:#fff;border-radius:16px;border:1px solid #e2e8f0;
      overflow:hidden;margin-bottom:16px;box-shadow:0 2px 12px rgba(2,60,108,.06)}
    .cgmv-chip{display:inline-flex;align-items:center;gap:4px;padding:3px 10px;
      border-radius:20px;font-size:11px;font-weight:600;white-space:nowrap}
  `;
  document.head.appendChild(s);
}

function ClientGroupManagementView({
  onGroupSaved, initialGroupData, clients,
  groupCategories, mainServices, subServicesMap, spocs,
}) {
  const { authToken } = useAuth();
  const token = authToken || localStorage.getItem('token');

  const [currentStep,     setCurrentStep]     = useState(0);
  const [loading,         setLoading]         = useState(false);
  const [groupSaving,     setGroupSaving]     = useState(false);
  const [groupDetails,    setGroupDetails]    = useState({});
  const [selectedClients, setSelectedClients] = useState([]);
  const [pendingClients,  setPendingClients]  = useState([]);
  const [services,        setServices]        = useState({});

  const [groupForm]   = Form.useForm();
  const [clientsForm] = Form.useForm();
  const [servicesForm]= Form.useForm();

  const headers = { Authorization: `Bearer ${token}` };

  /* ── helpers ── */
  const getGroupCategoryName = (categoryId) => {
    const cat = groupCategories.find(c => c.id === categoryId);
    return cat ? cat.name : 'N/A';
  };
  const getSpocName = (spocId) => {
    const spoc = spocs.find(s => s.id === spocId);
    return spoc ? (spoc.name || spoc.email) : 'N/A';
  };
  const getMainServiceName = (serviceId) => {
    const svc = mainServices.find(s => s.id === serviceId);
    return svc ? svc.name : 'N/A';
  };
  const getSubServiceName = (mainService, subServiceId) => {
    const mainId  = mainService?.id || mainService;
    const subList = subServicesMap[mainId] || [];
    const sub     = subList.find(s => s.id === subServiceId);
    return sub ? sub.name : 'N/A';
  };
  const getCategoryStyle = (catName) => {
    switch (catName) {
      case 'Class A': return { color:'#d97706', bg:'#fef3c7', icon:<CrownOutlined/> };
      case 'Class B': return { color:'#607d8b', bg:'#f1f5f9', icon:<GoldOutlined/> };
      case 'Class C': return { color:'#2196f3', bg:'#dbeafe', icon:<StarOutlined/> };
      default:        return { color:P.indigo,  bg:P.indigoLt, icon:null };
    }
  };

  /* ── fetch existing group ── */
  const fetchGroupData = useCallback(async (groupId) => {
    if (!groupId) { setLoading(false); return; }
    setLoading(true);
    try {
      const res              = await api.get(`/clients/client-groups/${groupId}/`, { headers });
      const fetchedGroupData = res.data;
      groupForm.setFieldsValue(fetchedGroupData);
      setGroupDetails(fetchedGroupData);

      const clientsFromGroup    = fetchedGroupData.clients || [];
      const clientsFromServices = (fetchedGroupData.group_services || [])
        .map(s => clients.find(c => c.id === s.client))
        .filter(Boolean);

      const allUniqueClients = Array.from(
        new Set([...clientsFromGroup, ...clientsFromServices].map(c => c.id))
      ).map(id => clients.find(c => c.id === id)).filter(Boolean);

      setSelectedClients(allUniqueClients);

      const initialServices = {};
      (fetchedGroupData.group_services || []).forEach(svcItem => {
        const client = allUniqueClients.find(c => c.id === svcItem.client);
        if (!client) return;
        if (!initialServices[client.id]) initialServices[client.id] = [];
        initialServices[client.id].push({
          main_service:     svcItem.main_service.id,
          sub_service:      svcItem.sub_service,
          sub_service_name: svcItem.sub_service_name,
          fee:              svcItem.fee,
          period:           svcItem.period,
          due_date:         svcItem.due_date ? moment(svcItem.due_date) : null,
        });
      });
      setServices(initialServices);
      servicesForm.setFieldsValue(initialServices);
    } catch (err) {
      console.error('Failed to fetch group data:', err);
    } finally {
      setLoading(false);
    }
  }, [token, groupForm, clients, servicesForm]);

  /* ── init / reset ── */
  useEffect(() => {
    if (initialGroupData?.id) {
      fetchGroupData(initialGroupData.id);
    } else {
      groupForm.resetFields();
      clientsForm.resetFields();
      servicesForm.resetFields();
      setCurrentStep(0);
      setGroupDetails({});
      setSelectedClients([]);
      setPendingClients([]);
      setServices({});
      setLoading(false);
      setGroupSaving(false);
    }
  }, [initialGroupData, fetchGroupData, groupForm, clientsForm, servicesForm, clients]);

  /* ── re-populate forms on step change ── */
  useEffect(() => {
    if (currentStep === 0) groupForm.setFieldsValue(groupDetails);
    if (currentStep === 2) servicesForm.setFieldsValue(services);
  }, [currentStep, groupDetails, services, groupForm, servicesForm]);

  /* ── client callbacks ── */
  const handleAddClient = useCallback(async (newClientData) => {
    if (initialGroupData?.id) {
      setLoading(true);
      try {
        const clientPayload = { ...newClientData };
        delete clientPayload.id;
        delete clientPayload._tempId;
        const clientRes = await api.post('/clients/clients/', clientPayload, { headers });
        const existingIds = selectedClients.filter(c => c.id).map(c => c.id);
        await api.patch(
          `/clients/client-groups/${initialGroupData.id}/`,
          { clients: [...existingIds, clientRes.data.id] },
          { headers }
        );
        await fetchGroupData(initialGroupData.id);
        return clientRes.data;
      } catch (err) {
        throw err;
      } finally {
        setLoading(false);
      }
    }
    const tempClient = { ...newClientData, _tempId:`temp_${Date.now()}`, id:undefined };
    setPendingClients(prev => [...prev, tempClient]);
    setSelectedClients(prev => [...prev, tempClient]);
    return tempClient;
  }, [token, initialGroupData, fetchGroupData, selectedClients]);

  const handleUpdateClient = useCallback(async (updatedClientData) => {
    if (updatedClientData._tempId) {
      setPendingClients(prev => prev.map(c => c._tempId === updatedClientData._tempId ? { ...c, ...updatedClientData } : c));
      setSelectedClients(prev => prev.map(c => c._tempId === updatedClientData._tempId ? { ...c, ...updatedClientData } : c));
      return updatedClientData;
    }
    if (!updatedClientData.id) throw new Error('Client ID missing');
    setLoading(true);
    try {
      const clientPayload = { ...updatedClientData };
      delete clientPayload._tempId;
      const res = await api.put(`/clients/clients/${updatedClientData.id}/`, clientPayload, { headers });
      if (initialGroupData?.id) {
        await fetchGroupData(initialGroupData.id);
      } else {
        setSelectedClients(prev => prev.map(c => c.id === updatedClientData.id ? res.data : c));
      }
      return res.data;
    } catch (err) { throw err; }
    finally { setLoading(false); }
  }, [token, initialGroupData, fetchGroupData]);

  const handleRemoveClient = useCallback(async (clientId) => {
    const isPending = pendingClients.some(c => c._tempId === clientId || String(c.id) === String(clientId));
    if (isPending || !initialGroupData?.id) {
      setPendingClients(prev => prev.filter(c => c._tempId !== clientId && String(c.id) !== String(clientId)));
      setSelectedClients(prev => prev.filter(c => c._tempId !== clientId && String(c.id) !== String(clientId)));
      setServices(prev => { const n={...prev}; delete n[clientId]; return n; });
      return;
    }
    setLoading(true);
    try {
      await api.delete(`/clients/clients/${clientId}/`, { headers });
      await fetchGroupData(initialGroupData.id);
    } catch (err) { throw err; }
    finally { setLoading(false); }
  }, [token, initialGroupData, fetchGroupData, pendingClients]);

  /* ── step navigation ── */
  const steps = [
    {
      form: groupForm,
      onSave: (values) => setGroupDetails(values),
      content: (
        <ClientGroupForm
          form={groupForm} initialValues={groupDetails}
          groupCategories={groupCategories} spocs={spocs}
        />
      ),
    },
    {
      form: clientsForm,
      onSave: () => {},
      content: (
        <ClientGroupClientsForm
          form={clientsForm} initialClients={selectedClients}
          onClientsChange={setSelectedClients}
          onAddClient={handleAddClient}
          onUpdateClient={handleUpdateClient}
          onRemoveClient={handleRemoveClient}
          allClients={clients}
        />
      ),
    },
    {
      form: servicesForm,
      onSave: (values) => setServices(values),
      content: (
        <ClientGroupServicesForm
          form={servicesForm} groupClients={selectedClients}
          initialValues={services} mainServices={mainServices}
          subServicesMap={subServicesMap}
        />
      ),
    },
    {
      form: null,
      onSave: () => {},
      content: null, // rendered inline below
    },
  ];

  const handleNext = async () => {
    setLoading(true);
    try {
      if (steps[currentStep].form) {
        const values = await steps[currentStep].form.validateFields();
        steps[currentStep].onSave(values);
      }
      setCurrentStep(s => s + 1);
    } catch {
      // validation error shown by form
    } finally {
      setLoading(false);
    }
  };

  const handlePrev = () => setCurrentStep(s => s - 1);

  /* ── finish ── */
  const handleFinish = async () => {
    setGroupSaving(true);
    try {
      await groupForm.validateFields();

      if (initialGroupData?.id) {
        const clientIdsToLink = selectedClients.filter(c => c.id && !c._tempId).map(c => c.id);
        const groupServicesData = Object.keys(services).flatMap(clientId =>
          (services[clientId] || []).map(svc => ({
            client: clientId, main_service: svc.main_service,
            sub_service: svc.sub_service, fee: svc.fee, period: svc.period,
            due_date: svc.due_date ? moment(svc.due_date).format('YYYY-MM-DD') : null,
          }))
        );
        await api.put(
          `/clients/client-groups/${initialGroupData.id}/`,
          { ...groupDetails, clients: clientIdsToLink, group_services_data: groupServicesData },
          { headers }
        );
        await fetchGroupData(initialGroupData.id);
        onGroupSaved();
      } else {
        const groupRes = await api.post(
          '/clients/client-groups/',
          { ...groupDetails, clients: [], group_services_data: [] },
          { headers }
        );
        const newGroupId = groupRes.data.id;

        const createdClients = [];
        for (const pending of pendingClients) {
          const payload = { ...pending };
          delete payload._tempId; delete payload.id;
          try {
            const res = await api.post('/clients/clients/', payload, { headers });
            createdClients.push({ tempId: pending._tempId, realId: res.data.id });
          } catch { /* skip failed */ }
        }

        const existingIds  = selectedClients.filter(c => c.id && !c._tempId).map(c => c.id);
        const allClientIds = [...existingIds, ...createdClients.map(c => c.realId)];

        const tempToReal = {};
        createdClients.forEach(({ tempId, realId }) => { tempToReal[tempId] = realId; });

        const groupServicesData = Object.keys(services).flatMap(clientKey => {
          const realId = tempToReal[clientKey] || clientKey;
          return (services[clientKey] || []).map(svc => ({
            client: realId, main_service: svc.main_service,
            sub_service: svc.sub_service, fee: svc.fee, period: svc.period,
            due_date: svc.due_date ? moment(svc.due_date).format('YYYY-MM-DD') : null,
          }));
        });

        await api.patch(
          `/clients/client-groups/${newGroupId}/`,
          { clients: allClientIds, group_services_data: groupServicesData },
          { headers }
        );

        setPendingClients([]);
        onGroupSaved();
      }
    } catch (err) {
      console.error('Submission error:', err);
    } finally {
      setGroupSaving(false);
    }
  };

  /* ── review content ── */
  const serviceColumns = [
    { title:'Main Service', dataIndex:'main_service', key:'ms', render: id => <Tag color="volcano">{getMainServiceName(id)}</Tag> },
    { title:'Sub Service',  dataIndex:'sub_service',  key:'ss', render: (id,r) => <Tag color="green">{getSubServiceName(r.main_service,id)}</Tag> },
    { title:'Fee',          dataIndex:'fee',          key:'fee', render: fee => fee ? `₹${fee}` : 'N/A' },
    { title:'Period',       dataIndex:'period',       key:'period', render: p => <Tag color="processing">{p}</Tag> },
  ];

  const avatarColors = ['#4f46e5','#0891b2','#059669','#d97706','#7c3aed','#dc2626'];

  const reviewContent = (
    <div style={{animation:'cgmvFadeUp .35s ease both'}}>
      {/* Group summary */}
      <div className="cgmv-review-card">
        <div style={{height:4,background:'linear-gradient(90deg,#4f46e5,#0891b2)'}}/>
        <div style={{padding:'20px 24px'}}>
          <div style={{display:'flex',alignItems:'center',gap:14,marginBottom:16}}>
            <div style={{
              width:52,height:52,borderRadius:14,
              background:'linear-gradient(135deg,#4f46e5,#0891b2)',
              color:'#fff',display:'flex',alignItems:'center',
              justifyContent:'center',fontSize:22,
              boxShadow:'0 4px 14px rgba(79,70,229,.28)',
            }}>🏢</div>
            <div>
              <div style={{fontWeight:800,fontSize:20,color:P.navyDk}}>{groupDetails.group_name}</div>
              {groupDetails.group_category && (() => {
                const cs = getCategoryStyle(getGroupCategoryName(groupDetails.group_category));
                return (
                  <span className="cgmv-chip" style={{background:cs.bg,color:cs.color,marginTop:4,display:'inline-flex'}}>
                    {cs.icon} {getGroupCategoryName(groupDetails.group_category)}
                  </span>
                );
              })()}
            </div>
          </div>
          <div style={{display:'flex',flexWrap:'wrap',gap:12}}>
            <div style={{padding:'10px 16px',background:P.indigoLt,borderRadius:10,flex:'1 1 200px'}}>
              <div style={{fontSize:11,color:P.slate,fontWeight:600,marginBottom:4}}>PRIMARY SPOC</div>
              <div style={{fontWeight:700,color:P.navyDk}}>{getSpocName(groupDetails.primary_spoc)}</div>
            </div>
            {groupDetails.secondary_spoc && (
              <div style={{padding:'10px 16px',background:'#f0f9ff',borderRadius:10,flex:'1 1 200px'}}>
                <div style={{fontSize:11,color:P.slate,fontWeight:600,marginBottom:4}}>SECONDARY SPOC</div>
                <div style={{fontWeight:700,color:P.navyDk}}>{getSpocName(groupDetails.secondary_spoc)}</div>
              </div>
            )}
            <div style={{padding:'10px 16px',background:P.greenLt,borderRadius:10,flex:'1 1 150px'}}>
              <div style={{fontSize:11,color:P.slate,fontWeight:600,marginBottom:4}}>CLIENTS</div>
              <div style={{fontWeight:700,color:P.green}}>{selectedClients.length}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Clients */}
      {selectedClients.length === 0 ? (
        <div style={{
          padding:'32px',textAlign:'center',borderRadius:16,
          border:`2px dashed ${P.border}`,background:'#f8fafc',
        }}>
          <div style={{fontSize:13,color:P.slate}}>No clients added to this group.</div>
        </div>
      ) : (
        selectedClients.map((client, i) => {
          const clientKey   = client._tempId || client.id;
          const avatarBg    = avatarColors[i % avatarColors.length];
          const initials    = (client.name||'?').split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase();
          const clientSvcs  = (services[clientKey]||[]);

          return (
            <div key={clientKey} className="cgmv-review-card" style={{animationDelay:`${i*50}ms`}}>
              <div style={{height:3,background:`linear-gradient(90deg,${avatarBg},${avatarBg}77)`}}/>
              <div style={{padding:'16px 20px'}}>
                {/* Client header */}
                <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:14}}>
                  <div style={{
                    width:40,height:40,borderRadius:11,flexShrink:0,
                    background:avatarBg,color:'#fff',
                    display:'flex',alignItems:'center',justifyContent:'center',
                    fontWeight:800,fontSize:14,
                    boxShadow:`0 3px 10px ${avatarBg}55`,
                  }}>{initials}</div>
                  <div>
                    <div style={{fontWeight:700,fontSize:15,color:P.navyDk}}>{client.name}</div>
                    <div style={{display:'flex',flexWrap:'wrap',gap:6,marginTop:4}}>
                      {client.email && <span className="cgmv-chip" style={{background:P.tealLt,color:P.teal}}>✉ {client.email}</span>}
                      {client.phone && <span className="cgmv-chip" style={{background:P.indigoLt,color:P.indigo}}>📞 {client.phone}</span>}
                      {client.gstin && <span className="cgmv-chip" style={{background:P.greenLt,color:P.green}}>GSTIN: {client.gstin}</span>}
                      {client.pan   && <span className="cgmv-chip" style={{background:'#dbeafe',color:'#1e40af'}}>PAN: {client.pan}</span>}
                      {client._tempId && <span className="cgmv-chip" style={{background:P.amberLt,color:P.amber}}>⏳ Pending</span>}
                    </div>
                  </div>
                </div>

                {/* Services */}
                {clientSvcs.length > 0 ? (
                  <>
                    <div style={{fontSize:11,fontWeight:700,color:P.indigo,textTransform:'uppercase',letterSpacing:'.06em',marginBottom:8}}>
                      Services ({clientSvcs.length})
                    </div>
                    <Table
                      dataSource={clientSvcs}
                      columns={serviceColumns}
                      rowKey={(_,idx)=>`svc-${clientKey}-${idx}`}
                      pagination={false}
                      size="small"
                      style={{borderRadius:10,overflow:'hidden'}}
                    />
                  </>
                ) : (
                  <div style={{fontSize:12,color:P.slate,fontStyle:'italic'}}>No services assigned.</div>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );

  /* ── step meta ── */
  const stepMeta = [
    { icon:'🏢', label:'Group Details',  desc:'Name, category & contacts' },
    { icon:'👥', label:'Clients',         desc:'Add clients to the group'  },
    { icon:'⚙️', label:'Services',        desc:'Assign services & fees'    },
    { icon:'✅', label:'Review & Submit', desc:'Confirm and create'        },
  ];

  /* ── step content (index 3 is review) ── */
  const stepContent = [
    steps[0].content,
    steps[1].content,
    steps[2].content,
    reviewContent,
  ];

  /* ── loading screen ── */
  if (loading || groupSaving) {
    return (
      <div style={{
        display:'flex', flexDirection:'column', alignItems:'center',
        justifyContent:'center', minHeight:400, gap:16,
        background:'linear-gradient(135deg,#eef2ff,#f8fafc,#ecfeff)',
        borderRadius:18, padding:48,
      }}>
        <div style={{
          width:64, height:64, borderRadius:18,
          background:'linear-gradient(135deg,#4f46e5,#0891b2)',
          display:'flex', alignItems:'center', justifyContent:'center',
          fontSize:28, boxShadow:'0 8px 24px rgba(79,70,229,.3)',
          animation:'cgmvSpin 1.4s linear infinite',
        }}>⚙️</div>
        <div style={{fontWeight:700,fontSize:16,color:P.navyDk}}>
          {groupSaving ? 'Saving group…' : 'Loading…'}
        </div>
        <div style={{fontSize:13,color:P.slate,textAlign:'center',maxWidth:280}}>
          {groupSaving
            ? 'Creating group, clients and linking services. Please wait.'
            : 'Fetching group data…'}
        </div>
      </div>
    );
  }

  /* ── main render ── */
  return (
    <div style={{
      minHeight:'100vh',
      background:'linear-gradient(135deg,#eef2ff 0%,#f8fafc 50%,#ecfeff 100%)',
      padding:'32px 24px',
    }}>

      {/* ── Page title ── */}
      <div style={{maxWidth:960,margin:'0 auto 24px'}}>
        <div style={{display:'flex',alignItems:'center',gap:14}}>
          <div style={{
            width:50,height:50,borderRadius:14,
            background:'linear-gradient(135deg,#4f46e5,#0891b2)',
            color:'#fff',display:'flex',alignItems:'center',
            justifyContent:'center',fontSize:22,
            boxShadow:'0 6px 18px rgba(79,70,229,.28)',
          }}>
            {initialGroupData ? '✏️' : '➕'}
          </div>
          <div>
            <h2 style={{margin:0,fontSize:22,fontWeight:800,color:P.navyDk}}>
              {initialGroupData ? 'Edit Client Group' : 'Create New Client Group'}
            </h2>
            <p style={{margin:0,fontSize:13,color:P.slate}}>
              {initialGroupData
                ? 'Update the details, clients and services for this group.'
                : 'Complete all steps to create a fully configured client group.'}
            </p>
          </div>
        </div>
      </div>

      {/* ── Step indicator ── */}
      <div style={{
        maxWidth:960,margin:'0 auto 24px',
        background:'#fff',borderRadius:18,padding:'20px 28px',
        boxShadow:'0 2px 16px rgba(2,60,108,.07)',
        border:`1px solid ${P.border}`,
      }}>
        <div style={{display:'flex',alignItems:'flex-start',position:'relative'}}>
          {/* track */}
          <div style={{
            position:'absolute',top:22,left:'12.5%',right:'12.5%',
            height:2,background:'#e0e7ff',zIndex:0,
          }}/>
          {/* progress */}
          <div style={{
            position:'absolute',top:22,left:'12.5%',
            height:2,zIndex:1,transition:'width .4s cubic-bezier(.4,0,.2,1)',
            background:'linear-gradient(90deg,#4f46e5,#0891b2)',
            width:`${(currentStep/(stepMeta.length-1))*75}%`,
          }}/>

          {stepMeta.map((sm,i) => {
            const done   = i < currentStep;
            const active = i === currentStep;
            return (
              <div key={i} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:8,position:'relative',zIndex:2}}>
                <div style={{
                  width:44,height:44,borderRadius:13,
                  background: done
                    ? 'linear-gradient(135deg,#4f46e5,#0891b2)'
                    : active ? '#fff' : '#f1f5f9',
                  border: active ? `2px solid ${P.indigo}` : done ? 'none' : `2px solid ${P.border}`,
                  display:'flex',alignItems:'center',justifyContent:'center',
                  fontSize: done ? 16 : 20,
                  color: done ? '#fff' : undefined,
                  boxShadow: active
                    ? `0 0 0 6px rgba(79,70,229,.12)`
                    : done ? '0 4px 12px rgba(79,70,229,.22)' : 'none',
                  transition:'all .3s',
                }}>
                  {done ? '✓' : sm.icon}
                </div>
                <div style={{textAlign:'center'}}>
                  <div style={{
                    fontSize:12,fontWeight:active||done?700:500,
                    color:active?P.indigo:done?P.green:P.slate,
                  }}>{sm.label}</div>
                  <div style={{fontSize:10,color:'#94a3b8',marginTop:2}}>{sm.desc}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Step content ── */}
      <div style={{maxWidth:960,margin:'0 auto 20px'}}>
        {stepContent[currentStep]}
      </div>

      {/* ── Navigation bar ── */}
      <div style={{
        maxWidth:960,margin:'0 auto',
        background:'#fff',borderRadius:16,padding:'16px 24px',
        boxShadow:'0 2px 16px rgba(2,60,108,.07)',
        border:`1px solid ${P.border}`,
        display:'flex',alignItems:'center',justifyContent:'space-between',
      }}>
        <div style={{fontSize:12,color:'#94a3b8',fontWeight:600}}>
          Step {currentStep+1} of {stepMeta.length}
          {selectedClients.length > 0 && (
            <span style={{
              marginLeft:10,background:P.indigoLt,color:P.indigo,
              borderRadius:20,padding:'1px 10px',fontSize:11,fontWeight:700,
            }}>
              {selectedClients.length} client{selectedClients.length!==1?'s':''}
            </span>
          )}
        </div>

        <div style={{display:'flex',gap:10}}>
          {currentStep > 0 && (
            <button
              className="cgmv-nav-btn secondary"
              onClick={handlePrev}
              disabled={loading||groupSaving}
            >
              ← Previous
            </button>
          )}

          {currentStep < stepMeta.length - 1 ? (
            <button
              className="cgmv-nav-btn primary"
              onClick={handleNext}
              disabled={loading||groupSaving}
            >
              Next →
            </button>
          ) : (
            <button
              className="cgmv-nav-btn success"
              onClick={handleFinish}
              disabled={loading||groupSaving}
            >
              ✓ {initialGroupData ? 'Update Group' : 'Create Group'}
            </button>
          )}
        </div>
      </div>

    </div>
  );
}

export default ClientGroupManagementView;