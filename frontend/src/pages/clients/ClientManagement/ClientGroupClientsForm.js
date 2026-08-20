// // // D:\Onging Projects\HRMS\frontend\src\pages\clients\ClientManagement\ClientGroupClientsForm.js


// ClientGroupClientsForm.js

import React, { useState, useEffect } from 'react';
import { Form, Button, Typography, Space, Tag, Tooltip, Modal } from 'antd';
import {
  PlusOutlined, DeleteOutlined, EditOutlined,
  UserOutlined, MailOutlined, PhoneOutlined,
  BankOutlined, IdcardOutlined, GlobalOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import AddClientModalForm from './AddClientModalForm';

const { Text, Title } = Typography;

const P = {
  navy:    '#023C6C',
  navyDk:  '#011f3a',
  teal:    '#0891b2',
  tealLt:  '#e0f2f9',
  indigo:  '#4f46e5',
  indigoLt:'#eef2ff',
  slate:   '#64748b',
  border:  '#e2e8f0',
  green:   '#059669',
  greenLt: '#d1fae5',
  amber:   '#d97706',
  amberLt: '#fef3c7',
  red:     '#dc2626',
  redLt:   '#fee2e2',
  bg:      'linear-gradient(135deg,#eef2ff,#f8fafc,#ecfeff)',
};

if (!document.getElementById('cgcf-styles')) {
  const s = document.createElement('style');
  s.id = 'cgcf-styles';
  s.textContent = `
    @keyframes cgcfFadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
    .cgcf-card{background:#fff;border-radius:16px;border:1px solid #e2e8f0;
      transition:box-shadow .2s,transform .2s;animation:cgcfFadeUp .35s ease both;
      overflow:hidden;}
    .cgcf-card:hover{box-shadow:0 10px 28px rgba(2,60,108,.1);transform:translateY(-2px)}
    .cgcf-chip{display:inline-flex;align-items:center;gap:4px;padding:3px 10px;
      border-radius:20px;font-size:11px;font-weight:600;white-space:nowrap;
      border:1px solid transparent;}
    .cgcf-action-btn{border:none;background:transparent;cursor:pointer;
      border-radius:9px;padding:7px 9px;transition:background .15s,color .15s;
      display:flex;align-items:center;justify-content:center;font-size:14px}
    .cgcf-action-btn:hover{background:#f1f5f9}
    .cgcf-action-btn.danger:hover{background:#fee2e2;color:#dc2626!important}
    .cgcf-add-btn{display:flex;align-items:center;gap:8px;padding:11px 24px;
      border-radius:11px;border:none;cursor:pointer;font-weight:700;font-size:13px;
      background:linear-gradient(135deg,#4f46e5,#0891b2);color:#fff;
      box-shadow:0 4px 14px rgba(79,70,229,.28);transition:transform .15s,box-shadow .15s}
    .cgcf-add-btn:hover{transform:translateY(-2px);box-shadow:0 8px 22px rgba(79,70,229,.38)}
    .cgcf-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;
      padding:56px 24px;border-radius:16px;border:2px dashed #c7d2fe;background:#f8faff;
      text-align:center;}
    .cgcf-header-strip{height:4px;width:100%;
      background:linear-gradient(90deg,#4f46e5,#0891b2);}
  `;
  document.head.appendChild(s);
}

/* ── field chip ── */
function FieldChip({ icon, label, value, color, bg, borderColor }) {
  if (!value) return null;
  return (
    <span className="cgcf-chip" style={{ background:bg||'#f1f5f9', color:color||'#475569', borderColor:borderColor||'transparent' }}>
      {icon && <span style={{fontSize:10,opacity:.7}}>{icon}</span>}
      <span style={{color:'#94a3b8',fontWeight:500}}>{label}:</span>
      <span style={{color:color||'#374151'}}>{value}</span>
    </span>
  );
}

/* ── client card ── */
function ClientCard({ client, onEdit, onRemove, index }) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  const avatarColors = ['#4f46e5','#0891b2','#059669','#d97706','#7c3aed','#dc2626','#0284c7'];
  const avatarBg = avatarColors[index % avatarColors.length];
  const initials = (client.name||'?').split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase();

  const regFields = [
    {label:'GSTIN', value:client.gstin, color:'#065f46', bg:'#d1fae5', borderColor:'#6ee7b7'},
    {label:'PAN',   value:client.pan,   color:'#1e40af', bg:'#dbeafe', borderColor:'#93c5fd'},
    {label:'TAN',   value:client.tan,   color:'#6d28d9', bg:'#ede9fe', borderColor:'#c4b5fd'},
    {label:'CIN',   value:client.cin,   color:'#92400e', bg:'#fef3c7', borderColor:'#fcd34d'},
    {label:'IEC',   value:client.iec,   color:P.slate,   bg:'#f1f5f9', borderColor:P.border},
    {label:'UDYAM', value:client.udyam, color:P.slate,   bg:'#f1f5f9', borderColor:P.border},
    {label:'LEI',   value:client.lei,   color:P.slate,   bg:'#f1f5f9', borderColor:P.border},
  ].filter(f => f.value);

  return (
    <div
      className="cgcf-card"
      style={{ marginBottom:16, animationDelay:`${index*60}ms` }}
    >
      {/* colored top strip */}
      <div className="cgcf-header-strip" style={{ background:`linear-gradient(90deg,${avatarBg},${avatarBg}88)` }}/>

      <div style={{ padding:'18px 20px' }}>
        <div style={{ display:'flex', alignItems:'flex-start', gap:16 }}>

          {/* Avatar */}
          <div style={{
            width:48, height:48, borderRadius:13, flexShrink:0,
            background:avatarBg, color:'#fff',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontWeight:800, fontSize:17, letterSpacing:1,
            boxShadow:`0 4px 12px ${avatarBg}55`,
          }}>
            {initials}
          </div>

          {/* Content */}
          <div style={{ flex:1, minWidth:0 }}>

            {/* Name row */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10, flexWrap:'wrap', gap:8 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                <span style={{ fontWeight:800, fontSize:16, color:P.navyDk, lineHeight:1.2 }}>
                  {client.name}
                </span>
                {client._tempId && (
                  <span className="cgcf-chip" style={{ background:P.amberLt, color:P.amber, borderColor:'#fcd34d', fontSize:10 }}>
                    ⏳ Pending save
                  </span>
                )}
              </div>

              {/* Action buttons */}
              <div style={{ display:'flex', gap:4 }}>
                <Tooltip title="Edit client">
                  <button
                    className="cgcf-action-btn"
                    onClick={() => onEdit(client)}
                    style={{ color:P.indigo }}
                  >
                    <EditOutlined/>
                  </button>
                </Tooltip>
                <Tooltip title="Remove client">
                  <button
                    className="cgcf-action-btn danger"
                    onClick={() => setConfirmDelete(true)}
                    style={{ color:P.slate }}
                  >
                    <DeleteOutlined/>
                  </button>
                </Tooltip>
              </div>
            </div>

            {/* Contact chips */}
            <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:10 }}>
              <FieldChip icon={<MailOutlined/>}  label="Email"   value={client.email}              color={P.teal}   bg={P.tealLt}   borderColor="#7dd3fc" />
              <FieldChip icon={<PhoneOutlined/>} label="Phone"   value={client.phone}              color={P.indigo} bg={P.indigoLt} borderColor="#a5b4fc" />
              <FieldChip icon={<UserOutlined/>}  label="Contact" value={client.contact_person}     color={P.green}  bg={P.greenLt}  borderColor="#86efac" />
              <FieldChip icon={<BankOutlined/>}  label="Biz"     value={client.nature_of_business} color={P.amber}  bg={P.amberLt}  borderColor="#fcd34d" />
            </div>

            {/* Registration chips */}
            {regFields.length > 0 && (
              <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
                {regFields.map(f => (
                  <FieldChip
                    key={f.label}
                    icon={<IdcardOutlined/>}
                    label={f.label}
                    value={f.value}
                    color={f.color}
                    bg={f.bg}
                    borderColor={f.borderColor}
                  />
                ))}
              </div>
            )}

            {/* Billing info */}
            {(client.billing_cycle || client.invoice_date) && (
              <div style={{
                marginTop:10, padding:'8px 12px',
                background:'#f8fafc', borderRadius:9,
                border:`1px solid ${P.border}`,
                display:'flex', gap:16, flexWrap:'wrap',
              }}>
                {/* {client.billing_cycle && (
                  <span style={{fontSize:12,color:P.slate}}>
                    <strong style={{color:P.navyDk}}>Billing:</strong> {client.billing_cycle}
                  </span>
                )}
                {client.invoice_date && (
                  <span style={{fontSize:12,color:P.slate}}>
                    <strong style={{color:P.navyDk}}>Invoice Date:</strong> {client.invoice_date}
                  </span>
                )} */}
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Delete confirm bar */}
      {confirmDelete && (
        <div style={{
          padding:'12px 20px',
          background:'#fff8f8',
          borderTop:`1px solid #fecaca`,
          display:'flex', alignItems:'center', justifyContent:'space-between',
          gap:12, flexWrap:'wrap',
        }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, color:P.red }}>
            <ExclamationCircleOutlined/>
            Remove <strong>{client.name}</strong> from this group?
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button
              onClick={() => setConfirmDelete(false)}
              style={{
                padding:'6px 14px', borderRadius:8, border:`1px solid ${P.border}`,
                background:'#fff', cursor:'pointer', fontSize:12, fontWeight:600, color:P.slate,
              }}
            >
              Cancel
            </button>
            <button
              onClick={() => { setConfirmDelete(false); onRemove(client._tempId || client.id); }}
              style={{
                padding:'6px 14px', borderRadius:8, border:'none',
                background:P.red, color:'#fff', cursor:'pointer',
                fontSize:12, fontWeight:700,
                boxShadow:'0 2px 8px rgba(220,38,38,.3)',
              }}
            >
              Yes, Remove
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════════════ MAIN ══════════════ */
function ClientGroupClientsForm({
  form,
  initialClients = [],
  onClientsChange,
  onAddClient,
  onUpdateClient,
  onRemoveClient,
}) {
  const [isAddModalVisible,  setIsAddModalVisible]  = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editingClient,      setEditingClient]      = useState(null);

  useEffect(() => {
    const ids = (initialClients || []).map(c => c.id).filter(Boolean);
    form.setFieldsValue({ linked_client_ids: ids });
  }, [initialClients, form]);

  const handleAddFinish = async (newClientData) => {
    try {
      const added = await onAddClient(newClientData);
      const alreadyAdded = initialClients.some(c =>
        (c.id && c.id === added?.id) ||
        (c._tempId && c._tempId === added?._tempId)
      );
      if (!alreadyAdded) onClientsChange(prev => [...prev, added]);
      setIsAddModalVisible(false);
    } catch { /* handled upstream */ }
  };

  const handleEditFinish = async (updatedData) => {
    try {
      await onUpdateClient(updatedData);
      setIsEditModalVisible(false);
      setEditingClient(null);
    } catch { /* handled upstream */ }
  };

  const handleRemove = async (clientId) => {
    try {
      await onRemoveClient(clientId);
    } catch { /* handled upstream */ }
  };

  const count = initialClients.length;

  return (
    <div style={{
      padding:28,
      background:P.bg,
      borderRadius:18,
      boxShadow:'0 4px 24px rgba(2,60,108,.08)',
      minHeight:'50vh',
    }}>

      {/* ── Page header ── */}
      <div style={{
        display:'flex', alignItems:'flex-start', justifyContent:'space-between',
        marginBottom:28, flexWrap:'wrap', gap:14,
      }}>
        <div>
          <div style={{
            display:'flex', alignItems:'center', gap:10, marginBottom:6,
          }}>
            <div style={{
              width:40, height:40, borderRadius:11,
              background:P.indigoLt, color:P.indigo,
              display:'flex', alignItems:'center', justifyContent:'center', fontSize:18,
            }}>
              👥
            </div>
            <Title level={4} style={{ margin:0, color:P.navyDk, fontWeight:800 }}>
              Clients in this Group
            </Title>
            {count > 0 && (
              <span style={{
                background:P.indigo, color:'#fff',
                borderRadius:20, padding:'2px 12px',
                fontSize:12, fontWeight:700,
              }}>
                {count}
              </span>
            )}
          </div>
          <Text style={{ color:P.slate, fontSize:13 }}>
            Add and manage clients that belong to this group.
            {count === 0 && ' Start by adding your first client below.'}
          </Text>
        </div>

        <button
          className="cgcf-add-btn"
          onClick={() => setIsAddModalVisible(true)}
        >
          <PlusOutlined style={{fontSize:13}}/> Add New Client
        </button>
      </div>

      {/* ── Form (hidden field) ── */}
      <Form form={form} layout="vertical" name="client_group_clients_form">
        <Form.Item name="linked_client_ids" noStyle><span/></Form.Item>
      </Form>

      {/* ── Empty state ── */}
      {count === 0 ? (
        <div className="cgcf-empty">
          <div style={{
            width:72, height:72, borderRadius:18,
            background:P.indigoLt, color:P.indigo,
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:30, marginBottom:18,
            boxShadow:'0 4px 16px rgba(79,70,229,.15)',
          }}>
            👤
          </div>
          <Title level={5} style={{ color:P.navyDk, margin:0, marginBottom:8, fontWeight:700 }}>
            No clients added yet
          </Title>
          <Text style={{ color:P.slate, fontSize:13, maxWidth:320, lineHeight:1.6 }}>
            Click "Add New Client" to create and add clients to this group.
            All client details will be saved when you complete the group setup.
          </Text>
          <button
            className="cgcf-add-btn"
            onClick={() => setIsAddModalVisible(true)}
            style={{ marginTop:22 }}
          >
            <PlusOutlined style={{fontSize:13}}/> Add First Client
          </button>
        </div>
      ) : (
        /* ── Client cards ── */
        <div>
          {initialClients.map((client, i) => (
            <ClientCard
              key={client._tempId || client.id || i}
              client={client}
              index={i}
              onEdit={(c) => { setEditingClient(c); setIsEditModalVisible(true); }}
              onRemove={handleRemove}
            />
          ))}

          {/* Add another button at bottom */}
          <div style={{
            marginTop:6,
            padding:'14px',
            borderRadius:14,
            border:`2px dashed #c7d2fe`,
            background:'#f8faff',
            display:'flex', alignItems:'center', justifyContent:'center',
            cursor:'pointer',
            transition:'all .18s',
          }}
            onClick={() => setIsAddModalVisible(true)}
            onMouseEnter={e => { e.currentTarget.style.borderColor=P.indigo; e.currentTarget.style.background=P.indigoLt; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor='#c7d2fe'; e.currentTarget.style.background='#f8faff'; }}
          >
            <span style={{ color:P.indigo, fontWeight:700, fontSize:13, display:'flex', alignItems:'center', gap:7 }}>
              <PlusOutlined/> Add Another Client
            </span>
          </div>
        </div>
      )}

      {/* ── Modals ── */}
      <AddClientModalForm
        visible={isAddModalVisible}
        onCancel={() => setIsAddModalVisible(false)}
        onFinish={handleAddFinish}
        initialValues={null}
      />

      {editingClient && (
        <AddClientModalForm
          visible={isEditModalVisible}
          onCancel={() => { setIsEditModalVisible(false); setEditingClient(null); }}
          onFinish={handleEditFinish}
          initialValues={editingClient}
        />
      )}
    </div>
  );
}

export default ClientGroupClientsForm;