// // // D:\Onging Projects\HRMS\frontend\src\pages\clients\ClientManagement\ClientGroupClientsForm.js

// // import React, { useState, useEffect } from 'react';
// // import { Form, Button, Typography, List, Space, message, Select } from 'antd'; // Added Select
// // import { PlusOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
// // import AddClientModalForm from './AddClientModalForm';

// // const { Text } = Typography;
// // const { Option } = Select;

// // function ClientGroupClientsForm({ form, initialClients = [], onClientsChange, onAddClient, onUpdateClient, onRemoveClient, allClients }) {
// //     const [isAddModalVisible, setIsAddModalVisible] = useState(false);
// //     const [isEditModalVisible, setIsEditModalVisible] = useState(false);
// //     const [editingClient, setEditingClient] = useState(null);
// //     const [selectedExistingClient, setSelectedExistingClient] = useState(null); // State for selecting existing client

// //     // This useEffect ensures the Ant Design Form component has the correct value.
// //     // initialClients comes from selectedClients in ClientGroupManagementView
// //     useEffect(() => {
// //         // The form field `new_clients` is not strictly needed for the List dataSource anymore
// //         // as `initialClients` prop directly drives it. However, if you use form.getFieldsValue()
// //         // elsewhere to get the list of clients, this keeps it updated.
// //         const clientIds = (initialClients || []).map(client => client.id);
// //         form.setFieldsValue({ linked_client_ids: clientIds }); 
// //         console.log("DEBUG ClientGroupClientsForm: useEffect - initialClients:", initialClients);
// //     }, [initialClients, form]);


// //     const handleAddModalCancel = () => {
// //         setIsAddModalVisible(false);
// //     };

// //     const handleAddModalFinish = async (newClientData) => {
// //   try {
// //     const addedClient = await onAddClient(newClientData);

// //     // ✅ Link client to group UI immediately
// //     onClientsChange(prev => [...prev, addedClient]);

// //     message.success('New client added and linked to group successfully!');
// //     setIsAddModalVisible(false);
// //   } catch (error) {
// //     console.error("Client add failed", error);
// //   }
// // };


// //     const handleEditModalCancel = () => {
// //         setIsEditModalVisible(false);
// //         setEditingClient(null);
// //     };

// //     const handleEditModalFinish = async (updatedClientData) => {
// //         try {
// //             // Call the parent's onUpdateClient prop which makes the API call
// //             await onUpdateClient(updatedClientData);
// //             // onClientsChange is already called by the parent after successful API call
// //             message.success('Client details updated successfully!');
// //             setIsEditModalVisible(false);
// //             setEditingClient(null);
// //         } catch (error) {
// //             // Error message is already handled by onUpdateClient
// //             // message.error('Failed to update client. Please check input and try again.');
// //         }
// //     };

// //     const handleRemoveClient = async (clientId) => {
// //         try {
// //             // Call the parent's onRemoveClient prop which makes the API call
// //             await onRemoveClient(clientId);
// //             // onClientsChange is already called by the parent after successful API call
// //             message.success('Client removed from group successfully!');
// //         } catch (error) {
// //             // Error message is already handled by onRemoveClient
// //             // message.error('Failed to remove client from group.');
// //         }
// //     };

// //     const handleSelectExistingClient = (clientId) => {
// //         const clientToAdd = allClients.find(client => client.id === clientId);
// //         if (clientToAdd) {
// //             // Check if client is already in the group
// //             if (initialClients.some(client => client.id === clientId)) {
// //                 message.warning('This client is already in the group.');
// //                 return;
// //             }
// //             onClientsChange([...initialClients, clientToAdd]);
// //             message.success('Existing client added to group!');
// //             setSelectedExistingClient(null); // Reset select
// //         }
// //     };

// //     // Filter out clients already in initialClients from the allClients list for the dropdown
// //     const availableClientsForSelection = (allClients || []).filter(
// //         client => !initialClients.some(ic => ic.id === client.id)
// //     );

// //     return (
// //         <div
// //       style={{
// //         padding: '24px',
// //         background: 'linear-gradient(to right, #f8f9fa, #e0e7ff)',
// //         borderRadius: '12px',
// //         boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)',
// //         minHeight: '50vh'
// //       }}
// //     >
// //         <Form form={form} layout="vertical" name="client_group_clients_form">
// //             <Text type="secondary" style={{ marginBottom: '20px', display: 'block' }}>
// //                 Manage clients associated with this group. You can add new clients, link existing ones, or modify/remove them.
// //             </Text>

// //             <Space style={{ marginBottom: '20px', width: '100%', justifyContent: 'flex-end' }} wrap>
// //                 <Button
// //                     type="dashed"
// //                     onClick={() => setIsAddModalVisible(true)}
// //                     icon={<PlusOutlined />}
// //                     style={{ marginRight: '10px'}} // Removed flexGrow
// //                 >
// //                     Add New Client
// //                 </Button>
// //                 <Select
// //                     showSearch
// //                     placeholder="Link Existing Client"
// //                     optionFilterProp="children"
// //                     onChange={handleSelectExistingClient}
// //                     value={selectedExistingClient} // Controlled component
// //                     style={{ minWidth: 200 }} // Added a minWidth for better layout
// //                     filterOption={(input, option) =>
// //                         option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
// //                     }
// //                 >
// //                     {availableClientsForSelection.map((client) => (
// //                         <Option key={client.id} value={client.id}>
// //                             {client.name} ({client.email})
// //                         </Option>
// //                     ))}
// //                 </Select>
// //             </Space>

// //             <List
// //                 bordered
// //                 dataSource={initialClients}
// //                 renderItem={(client) => (
// //                     <List.Item
// //                         key={client.id} // Now always use real ID for keying
// //                         actions={[
// //                             <Button
// //                                 type="link"
// //                                 icon={<EditOutlined />}
// //                                 onClick={() => {
// //                                     setEditingClient(client);
// //                                     setIsEditModalVisible(true);
// //                                 }}
// //                                 title="Edit Client"
// //                             />,
// //                             <Button
// //                                 type="link"
// //                                 danger
// //                                 icon={<DeleteOutlined />}
// //                                 onClick={() => handleRemoveClient(client.id)}
// //                                 title="Remove Client"
// //                             />,
// //                         ]}
// //                     >
// //                         <List.Item.Meta
// //                             title={client.name}
// //                             description={
// //                                 <Space direction="vertical" size={0}>
// //                                     {client.email && <span>Email: {client.email}</span>}
// //                                     {client.phone && <span>Phone: {client.phone}</span>}
// //                                     {client.nature_of_business && <span>Business: {client.nature_of_business}</span>}
// //                                     {client.contact_person && <span>Contact Person: {client.contact_person}</span>}
// //                                     {client.cin && <span>CIN: {client.cin}</span>}
// //                                     {client.pan && <span>PAN: {client.pan}</span>}
// //                                     {client.gstin && <span>GSTIN: {client.gstin}</span>}
// //                                     {client.iec && <span>IEC: {client.iec}</span>}
// //                                     {client.ksea && <span>KSEA: {client.ksea}</span>}
// //                                     {client.udyam && <span>UDYAM: {client.udyam}</span>}
// //                                     {client.apt && <span>APT: {client.apt}</span>}
// //                                     {client.ept && <span>EPT: {client.ept}</span>}
// //                                     {client.tan && <span>TAN: {client.tan}</span>}
// //                                     {client.lei && <span>LEI: {client.lei}</span>}
// //                                 </Space>
// //                             }
// //                         />
// //                     </List.Item>
// //                 )}
// //             />

// //             <AddClientModalForm
// //                 visible={isAddModalVisible}
// //                 onCancel={handleAddModalCancel}
// //                 onFinish={handleAddModalFinish}
// //                 initialValues={null}
// //             />

// //             {editingClient && (
// //                 <AddClientModalForm
// //                     visible={isEditModalVisible}
// //                     onCancel={handleEditModalCancel}
// //                     onFinish={handleEditModalFinish}
// //                     initialValues={editingClient}
// //                 />
// //             )}
// //         </Form>
// //         </div>
// //     );
// // }

// // export default ClientGroupClientsForm;

// // ClientGroupClientsForm.js

// import React, { useState, useEffect } from 'react';
// import { Form, Button, Typography, Space, Tag, Tooltip, Avatar, Empty } from 'antd';
// import {
//   PlusOutlined, DeleteOutlined, EditOutlined,
//   UserOutlined, MailOutlined, PhoneOutlined,
//   BankOutlined, IdcardOutlined, GlobalOutlined,
// } from '@ant-design/icons';
// import AddClientModalForm from './AddClientModalForm';

// const { Text, Title } = Typography;

// /* ── palette ── */
// const P = {
//   navy:    '#023C6C',
//   navyDk:  '#011f3a',
//   teal:    '#0891b2',
//   tealLt:  '#e0f2f9',
//   indigo:  '#4f46e5',
//   indigoLt:'#eef2ff',
//   slate:   '#64748b',
//   border:  '#e2e8f0',
//   green:   '#059669',
//   greenLt: '#d1fae5',
//   amber:   '#d97706',
//   amberLt: '#fef3c7',
//   red:     '#dc2626',
//   redLt:   '#fee2e2',
//   bg:      'linear-gradient(135deg,#eef2ff,#f8fafc,#ecfeff)',
// };

// /* ── inject styles once ── */
// if (!document.getElementById('cgcf-styles')) {
//   const s = document.createElement('style');
//   s.id = 'cgcf-styles';
//   s.textContent = `
//     @keyframes cgcfFadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
//     .cgcf-card{background:#fff;border-radius:14px;border:1px solid #e2e8f0;
//       transition:box-shadow .2s,transform .2s;animation:cgcfFadeUp .35s ease both}
//     .cgcf-card:hover{box-shadow:0 8px 24px rgba(2,60,108,.1);transform:translateY(-2px)}
//     .cgcf-chip{display:inline-flex;align-items:center;gap:4px;padding:2px 10px;
//       border-radius:20px;font-size:11px;font-weight:600;white-space:nowrap}
//     .cgcf-action-btn{border:none;background:transparent;cursor:pointer;
//       border-radius:8px;padding:6px 8px;transition:background .15s,color .15s;
//       display:flex;align-items:center;justify-content:center}
//     .cgcf-action-btn:hover{background:#f1f5f9}
//     .cgcf-action-btn.danger:hover{background:#fee2e2;color:#dc2626}
//     .cgcf-add-btn{display:flex;align-items:center;gap:8px;padding:10px 22px;
//       border-radius:10px;border:none;cursor:pointer;font-weight:700;font-size:13px;
//       background:linear-gradient(135deg,#4f46e5,#0891b2);color:#fff;
//       box-shadow:0 4px 14px rgba(79,70,229,.3);transition:transform .15s,box-shadow .15s}
//     .cgcf-add-btn:hover{transform:translateY(-2px);box-shadow:0 8px 20px rgba(79,70,229,.4)}
//     .cgcf-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;
//       padding:48px 24px;border-radius:14px;border:2px dashed #c7d2fe;background:#f8faff}
//   `;
//   document.head.appendChild(s);
// }

// /* ── small field chip ── */
// function FieldChip({ icon, label, value, color = P.indigo, bg = P.indigoLt }) {
//   if (!value) return null;
//   return (
//     <span className="cgcf-chip" style={{ background: bg, color }}>
//       {icon && <span style={{ fontSize: 10 }}>{icon}</span>}
//       <span style={{ color: P.slate, fontWeight: 400 }}>{label}:</span>
//       <span>{value}</span>
//     </span>
//   );
// }

// /* ── single client card ── */
// function ClientCard({ client, onEdit, onRemove, index }) {
//   const initials = (client.name || '?')
//     .split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();

//   const avatarColors = [
//     '#4f46e5','#0891b2','#059669','#d97706','#7c3aed','#dc2626',
//   ];
//   const avatarBg = avatarColors[index % avatarColors.length];

//   return (
//     <div
//       className="cgcf-card"
//       style={{ padding: 20, marginBottom: 14, animationDelay: `${index * 60}ms` }}
//     >
//       <div style={{ display:'flex', alignItems:'flex-start', gap:14 }}>

//         {/* Avatar */}
//         <div style={{
//           width: 46, height: 46, borderRadius: 12, flexShrink: 0,
//           background: avatarBg, color: '#fff',
//           display: 'flex', alignItems: 'center', justifyContent: 'center',
//           fontWeight: 700, fontSize: 16, letterSpacing: 1,
//         }}>
//           {initials}
//         </div>

//         {/* Info */}
//         <div style={{ flex: 1, minWidth: 0 }}>
//           <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6, flexWrap:'wrap' }}>
//             <span style={{
//               fontWeight: 700, fontSize: 15, color: P.navyDk,
//               overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
//             }}>
//               {client.name}
//             </span>
//             {client._tempId && (
//               <span className="cgcf-chip" style={{ background: P.amberLt, color: P.amber }}>
//                 ⏳ Pending
//               </span>
//             )}
//           </div>

//           {/* Key details row */}
//           <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:8 }}>
//             <FieldChip icon={<MailOutlined/>}  label="Email"   value={client.email}             color={P.teal}   bg={P.tealLt}   />
//             <FieldChip icon={<PhoneOutlined/>} label="Phone"   value={client.phone}             color={P.indigo} bg={P.indigoLt} />
//             <FieldChip icon={<UserOutlined/>}  label="Contact" value={client.contact_person}    color={P.green}  bg={P.greenLt}  />
//             <FieldChip icon={<BankOutlined/>}  label="Biz"     value={client.nature_of_business} color={P.amber} bg={P.amberLt}  />
//           </div>

//           {/* Registration numbers */}
//           <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
//             <FieldChip icon={<IdcardOutlined/>} label="GSTIN"  value={client.gstin}  color="#065f46" bg="#d1fae5" />
//             <FieldChip icon={<IdcardOutlined/>} label="PAN"    value={client.pan}    color="#1e40af" bg="#dbeafe" />
//             <FieldChip icon={<IdcardOutlined/>} label="TAN"    value={client.tan}    color="#6d28d9" bg="#ede9fe" />
//             <FieldChip icon={<IdcardOutlined/>} label="CIN"    value={client.cin}    color="#92400e" bg="#fef3c7" />
//             <FieldChip icon={<GlobalOutlined/>} label="IEC"    value={client.iec}    color={P.slate} bg="#f1f5f9" />
//             <FieldChip icon={<GlobalOutlined/>} label="UDYAM"  value={client.udyam}  color={P.slate} bg="#f1f5f9" />
//           </div>
//         </div>

//         {/* Actions */}
//         <div style={{ display:'flex', alignItems:'center', gap:4, flexShrink:0 }}>
//           <Tooltip title="Edit client">
//             <button
//               className="cgcf-action-btn"
//               onClick={() => onEdit(client)}
//               style={{ color: P.indigo }}
//             >
//               <EditOutlined style={{ fontSize: 15 }}/>
//             </button>
//           </Tooltip>
//           <Tooltip title="Remove client">
//             <button
//               className="cgcf-action-btn danger"
//               onClick={() => onRemove(client._tempId || client.id)}
//               style={{ color: P.slate }}
//             >
//               <DeleteOutlined style={{ fontSize: 15 }}/>
//             </button>
//           </Tooltip>
//         </div>

//       </div>
//     </div>
//   );
// }

// /* ══════════════ MAIN ══════════════ */
// function ClientGroupClientsForm({
//   form,
//   initialClients = [],
//   onClientsChange,
//   onAddClient,
//   onUpdateClient,
//   onRemoveClient,
// }) {
//   const [isAddModalVisible,  setIsAddModalVisible]  = useState(false);
//   const [isEditModalVisible, setIsEditModalVisible] = useState(false);
//   const [editingClient,      setEditingClient]      = useState(null);

//   useEffect(() => {
//     const ids = (initialClients || []).map(c => c.id).filter(Boolean);
//     form.setFieldsValue({ linked_client_ids: ids });
//   }, [initialClients, form]);

//   /* ── add ── */
//   const handleAddFinish = async (newClientData) => {
//     try {
//       const added = await onAddClient(newClientData);
//       // parent already updates selectedClients; guard against double-add
//       if (!initialClients.some(c =>
//         (c.id && c.id === added?.id) ||
//         (c._tempId && c._tempId === added?._tempId)
//       )) {
//         onClientsChange(prev => [...prev, added]);
//       }
//       setIsAddModalVisible(false);
//     } catch {
//       // error already shown by onAddClient
//     }
//   };

//   /* ── edit ── */
//   const handleEditFinish = async (updatedData) => {
//     try {
//       await onUpdateClient(updatedData);
//       setIsEditModalVisible(false);
//       setEditingClient(null);
//     } catch {
//       // error already shown by onUpdateClient
//     }
//   };

//   /* ── remove ── */
//   const handleRemove = async (clientId) => {
//     try {
//       await onRemoveClient(clientId);
//     } catch {
//       // error already shown by onRemoveClient
//     }
//   };

//   return (
//     <div style={{
//       padding: 28,
//       background: P.bg,
//       borderRadius: 16,
//       boxShadow: '0 4px 20px rgba(2,60,108,.08)',
//       minHeight: '50vh',
//     }}>

//       {/* ── Header bar ── */}
//       <div style={{
//         display:'flex', alignItems:'center', justifyContent:'space-between',
//         marginBottom: 24, flexWrap:'wrap', gap:12,
//       }}>
//         <div>
//           <Title level={4} style={{ margin:0, color: P.navyDk, fontWeight:700 }}>
//             Clients in this Group
//           </Title>
//           <Text style={{ color: P.slate, fontSize:13, marginTop:4, display:'block' }}>
//             Add clients that belong to this group. You can edit or remove them anytime.
//           </Text>
//         </div>

//         <button
//           className="cgcf-add-btn"
//           onClick={() => setIsAddModalVisible(true)}
//         >
//           <PlusOutlined style={{ fontSize:14 }}/> Add New Client
//         </button>
//       </div>

//       {/* ── Counter badge ── */}
//       {initialClients.length > 0 && (
//         <div style={{ marginBottom:16, display:'flex', alignItems:'center', gap:8 }}>
//           <span style={{
//             background: P.indigoLt, color: P.indigo,
//             borderRadius:20, padding:'3px 14px',
//             fontSize:12, fontWeight:700,
//           }}>
//             {initialClients.length} client{initialClients.length !== 1 ? 's' : ''}
//           </span>
//           <span style={{ color: P.slate, fontSize:12 }}>in this group</span>
//         </div>
//       )}

//       {/* ── Client cards ── */}
//       <Form form={form} layout="vertical" name="client_group_clients_form">
//         <Form.Item name="linked_client_ids" noStyle><span/></Form.Item>

//         {initialClients.length === 0 ? (
//           <div className="cgcf-empty">
//             <div style={{
//               width:64, height:64, borderRadius:16, background:P.indigoLt,
//               display:'flex', alignItems:'center', justifyContent:'center',
//               marginBottom:16, fontSize:26,
//             }}>
//               👥
//             </div>
//             <Title level={5} style={{ color:P.navyDk, margin:0, marginBottom:6 }}>
//               No clients yet
//             </Title>
//             <Text style={{ color:P.slate, fontSize:13, textAlign:'center', maxWidth:300 }}>
//               Click "Add New Client" to add the first client to this group.
//             </Text>
//             <button
//               className="cgcf-add-btn"
//               onClick={() => setIsAddModalVisible(true)}
//               style={{ marginTop:20 }}
//             >
//               <PlusOutlined style={{ fontSize:14 }}/> Add First Client
//             </button>
//           </div>
//         ) : (
//           <div>
//             {initialClients.map((client, i) => (
//               <ClientCard
//                 key={client._tempId || client.id || i}
//                 client={client}
//                 index={i}
//                 onEdit={(c) => { setEditingClient(c); setIsEditModalVisible(true); }}
//                 onRemove={handleRemove}
//               />
//             ))}
//           </div>
//         )}
//       </Form>

//       {/* ── Modals ── */}
//       <AddClientModalForm
//         visible={isAddModalVisible}
//         onCancel={() => setIsAddModalVisible(false)}
//         onFinish={handleAddFinish}
//         initialValues={null}
//       />

//       {editingClient && (
//         <AddClientModalForm
//           visible={isEditModalVisible}
//           onCancel={() => { setIsEditModalVisible(false); setEditingClient(null); }}
//           onFinish={handleEditFinish}
//           initialValues={editingClient}
//         />
//       )}
//     </div>
//   );
// }

// export default ClientGroupClientsForm;

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