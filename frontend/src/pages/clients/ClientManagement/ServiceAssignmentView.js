// import React, { useState, useEffect, useCallback, useMemo, useContext, useRef } from 'react';
// import { List, Card, Typography, Spin, Alert, App, Divider, Empty, Button, Modal, Form, Input, Select, Space, Dropdown, Menu } from 'antd';
// import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
// import { SpinnerContext } from '../../../components/SpinnerContext';
// import { api } from '../../../services/api';
// import { useAuth } from '../../../contexts/AuthContext';
// import '../../../CSS/pages/serviceassignmentview.css';



// // Import the new button component


// const { Title, Text } = Typography;
// const { Option } = Select;
// const { useApp } = App;


// const getOrdinal = (n) => {
//   const s = ['th', 'st', 'nd', 'rd'];
//   const v = n % 100;
//   return n + (s[(v - 20) % 10] || s[v] || s[0]);
// };

// const monthShort = (m) =>
//   new Date(0, m - 1).toLocaleString('default', { month: 'short' });

// const monthFull = (m) =>
//   new Date(0, m - 1).toLocaleString('default', { month: 'long' });

// const formatPeriodDisplay = (sub) => {
//   if (!sub?.period) return null;

//   // ✅ Event-Based has NO due date → handle first
//   if (sub.period === 'Event-Based') {
//     return 'Event-Based';
//   }

//   // ⛔ other periods REQUIRE due_day
//   if (!sub.due_day) return null;

//   const d = sub.due_day;
//   const m = sub.due_month;

//   if (sub.period === 'Monthly') {
//     return `Monthly: ${getOrdinal(d)} of every month`;
//   }

//   if (sub.period === 'Annually') {
//     return `Annually: ${getOrdinal(d)} ${monthFull(m)}`;
//   }

//   if (sub.period === 'Quarterly') {
//     const months = [];
//     for (let i = 0; i < 4; i++) {
//       const mm = ((m - 1 + i * 3) % 12) + 1;
//       months.push(`${monthShort(mm)}-${d}`);
//     }
//     return `Quarterly: ${months.join(', ')}`;
//   }

//   if (sub.period === 'Half-Yearly') {
//     const m1 = m;
//     const m2 = ((m - 1 + 6) % 12) + 1;
//     return `Half-Yearly: ${monthShort(m1)}-${d}, ${monthShort(m2)}-${d}`;
//   }

//   return null;
// };


// // The helper function for the confirmation dialog is no longer needed since delete buttons are removed.
// // const { confirm } = Modal; 

// // Reusable modal form for adding a new Team.
// const AddTeamModal = ({ visible, onClose, onSuccess }) => {
//     const [form] = Form.useForm();
//     const { authToken } = useAuth();
//     const token = authToken || localStorage.getItem('token');
//     const { message } = useApp();
    

//     const onFinish = async (values) => {
//         const headers = { Authorization: `Bearer ${token}` };
//         try {
//             await api.post('/employee/teams/', values, { headers });
//             message.success('Team added successfully!');
//             onSuccess();
//             onClose();
//             form.resetFields();
//         } catch (error) {
//             console.error('Failed to add team:', error);
//             message.error('Failed to add team. Please check the form and try again.');
//         }
//     };

//     return (
//         <Modal
//             title="Add New Team"
//             open={visible}
//             onCancel={onClose}
//             onOk={() => form.submit()}
//             confirmLoading={false}
//         >
//             <Form form={form} layout="vertical" onFinish={onFinish}>
//                 <Form.Item
//                     name="name"
//                     label="Team Name"
//                     rules={[{ required: true, message: 'Please enter the team name!' }]}
//                 >
//                     <Input />
//                 </Form.Item>
//                 <Form.Item
//                     name="description"
//                     label="Description"
//                 >
//                     <Input.TextArea />
//                 </Form.Item>
//             </Form>
//         </Modal>
//     );
// };

// // Reusable modal form for adding a new Main Service.
// const AddMainServiceModal = ({ visible, onClose, onSuccess, teams }) => {
//     const [form] = Form.useForm();
//     const { authToken } = useAuth();
//     const token = authToken || localStorage.getItem('token');
//     const { message } = useApp();

//     const onFinish = async (values) => {
//         const headers = { Authorization: `Bearer ${token}` };
//         try {
//             await api.post('/clients/mainservices/', values, { headers });
//             message.success('Main service added successfully!');
//             onSuccess();
//             onClose();
//             form.resetFields();
//         } catch (error) {
//             console.error('Failed to add main service:', error);
//             message.error('Failed to add main service. Please check the form and try again.');
//         }
//     };

//     return (
//         <Modal
//             title="Add New Main Service"
//             open={visible}
//             onCancel={onClose}
//             onOk={() => form.submit()}
//             confirmLoading={false}
//         >
//             <Form form={form} layout="vertical" onFinish={onFinish}>
//                 <Form.Item
//                     name="name"
//                     label="Service Name"
//                     rules={[{ required: true, message: 'Please enter the service name!' }]}
//                 >
//                     <Input />
//                 </Form.Item>
//                 <Form.Item
//                     name="description"
//                     label="Description"
//                 >
//                     <Input.TextArea />
//                 </Form.Item>
//                 <Form.Item
//                     name="team"
//                     label="Assign to Team"
//                     rules={[{ required: true, message: 'Please select a team!' }]}
//                 >
//                     <Select placeholder="Select a team">
//                         {teams.map(team => (
//                             <Option key={team.id} value={team.id}>{team.name}</Option>
//                         ))}
//                     </Select>
//                 </Form.Item>
//             </Form>
//         </Modal>
//     );
// };

// // Reusable modal form for adding a new Sub-Service.
// const AddSubServiceModal = ({ visible, onClose, onSuccess, mainServices, teams }) => {
//   const [form] = Form.useForm();
//   const { authToken } = useAuth();
//   const token = authToken || localStorage.getItem('token');
//   const { message } = useApp();
//   const [filteredMainServices, setFilteredMainServices] = useState([]);

//   const period = Form.useWatch('period', form);

//   const onFinish = async (values) => {
//     const headers = { Authorization: `Bearer ${token}` };

//     try {
//       await api.post('/clients/subservices/', {
//         name: values.name,
//         team: values.team,
//         main_service: values.main_service,
//         period: values.period || null,
//         due_day: values.due_day || null,
//         due_month: values.period !== 'Monthly' ? values.due_month || null : null,
//       }, { headers });

//       message.success('Sub-service added successfully!');
//       onSuccess();
//       onClose();
//       form.resetFields();
//     } catch (error) {
//       console.error(error);
//       message.error('Failed to add sub-service');
//     }
//   };

//   const handleTeamChange = (teamId) => {
//     const filtered = mainServices
//       .filter(ms => ms.team === teamId)
//       .sort((a, b) => a.name.localeCompare(b.name));

//     setFilteredMainServices(filtered);
//     form.setFieldsValue({ main_service: undefined });
//   };

//   return (
//     <Modal
//       title="Add New Sub-Service"
//       open={visible}
//       onCancel={onClose}
//       onOk={() => form.submit()}
//       width={520}
//     >
//       <Form form={form} layout="vertical" onFinish={onFinish}>

//         <Form.Item
//           name="name"
//           label="Sub-Service Name"
//           rules={[{ required: true }]}
//         >
//           <Input />
//         </Form.Item>

//         <Form.Item
//           name="team"
//           label="Department / Team"
//           rules={[{ required: true }]}
//         >
//           <Select onChange={handleTeamChange}>
//             {teams.map(t => (
//               <Option key={t.id} value={t.id}>{t.name}</Option>
//             ))}
//           </Select>
//         </Form.Item>

//         <Form.Item
//           name="main_service"
//           label="Main Service"
//           rules={[{ required: true }]}
//         >
//           <Select disabled={!form.getFieldValue('team')}>
//             {filteredMainServices.map(ms => (
//               <Option key={ms.id} value={ms.id}>{ms.name}</Option>
//             ))}
//           </Select>
//         </Form.Item>

//         {/* 🔹 PERIOD */}
//         <Form.Item name="period" label="Period">
//           <Select allowClear placeholder="Select period">
//             <Option value="Monthly">Monthly</Option>
//             <Option value="Quarterly">Quarterly</Option>
//             <Option value="Half-Yearly">Half-Yearly</Option>
//             <Option value="Annually">Annually</Option>
//             <Option value="Event-Based">Event-Based</Option>
//           </Select>
//         </Form.Item>

//         {/* 🔹 DUE DAY */}
//           {period && period !== 'Event-Based' && (
//             <Form.Item
//               name="due_day"
//               label="Due Day"
//               rules={[
//                 { required: true, message: 'Due day is required for this period' }
//               ]}
//             >
//               <Input type="number" min={1} max={31} />
//             </Form.Item>
//           )}


//                   {/* 🔹 DUE MONTH */}
//           {period &&
//             period !== 'Monthly' &&
//             period !== 'Event-Based' && (
//               <Form.Item
//                 name="due_month"
//                 label="Due Month"
//                 rules={[{ required: true }]}
//               >
//                 <Select>
//                   {Array.from({ length: 12 }).map((_, i) => (
//                     <Option key={i + 1} value={i + 1}>
//                       {new Date(0, i).toLocaleString('default', { month: 'long' })}
//                     </Option>
//                   ))}
//                 </Select>
//               </Form.Item>
//           )}


//                 </Form>
//               </Modal>
//             );
//           };


// // Main component
// const TeamListView = () => {
//     const [teams, setTeams] = useState([]);
//     const [mainServices, setMainServices] = useState([]);
//     const [subServicesMap, setSubServicesMap] = useState({});
//     const [isLoading, setIsLoading] = useState(true);
//     const [error, setError] = useState(null);
//     const [selectedTeamId, setSelectedTeamId] = useState(null);
//     const { showSpinner, hideSpinner } = useContext(SpinnerContext);

//     // State for modals
//     const [isAddTeamModalVisible, setIsAddTeamModalVisible] = useState(false);
//     const [isAddMainServiceModalVisible, setIsAddMainServiceModalVisible] = useState(false);
//     const [isAddSubServiceModalVisible, setIsAddSubServiceModalVisible] = useState(false);

//     const selectedTeamServices = useMemo(() => {
//       if (!selectedTeamId) return [];
//       return mainServices.filter(service => service.team === selectedTeamId);
//     }, [mainServices, selectedTeamId]);

//     const selectedTeam = teams.find(t => t.id === selectedTeamId);

//     const { authToken } = useAuth();
//     const token = authToken || localStorage.getItem('token');
//     const { message } = useApp();

//     // 1. Add this ref at the top of your component
//     const isInitialMount = useRef(true);

//     const fetchData = useCallback(async () => {
//         showSpinner();
//         setError(null);
//         const headers = { Authorization: `Bearer ${token}` };

//         try {
//             const [teamsRes, mainServicesRes, subServicesRes] = await Promise.all([
//                 api.get('/employee/teams/', { headers }),
//                 api.get('/clients/mainservices/', { headers }),
//                 api.get('/clients/subservices/', { headers }),
//             ]);

//             const fetchedTeams = (teamsRes.data.results || teamsRes.data)
//                 .slice()
//                 .sort((a, b) => (a.name || '').localeCompare(b.name || ''));

//             setTeams(fetchedTeams);

//             // 🔥 FIX: Only set the ID automatically on the FIRST load
//             if (isInitialMount.current && fetchedTeams.length > 0) {
//                 setSelectedTeamId(fetchedTeams[0].id);
//                 isInitialMount.current = false; 
//             }

//             const fetchedMainServices = (mainServicesRes.data.results || mainServicesRes.data)
//                 .slice()
//                 .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
//             setMainServices(fetchedMainServices);

//             const fetchedSubServices = subServicesRes.data.results || subServicesRes.data;
//             const newSubServicesMap = {};
//             fetchedSubServices.forEach(sub => {
//                 const mainServiceId = sub.main_service_detail?.id || sub.main_service;
//                 if (!newSubServicesMap[mainServiceId]) newSubServicesMap[mainServiceId] = [];
//                 newSubServicesMap[mainServiceId].push(sub);
//             });
//             setSubServicesMap(newSubServicesMap);

//             } catch (err) {
//                 console.error('Failed to fetch data:', err);
//                 setError('Failed to load data.');
//             } finally {
//                 setIsLoading(false);
//                 hideSpinner();
//             }
//             // ⛔ REMOVED selectedTeamId from here
//         }, [token, showSpinner, hideSpinner]); 

//         useEffect(() => {
//             fetchData();
//         }, [fetchData]);



//     const handleTeamChange = (value) => {
//         setSelectedTeamId(value);
//     };

//     const handleMenuClick = (e) => {
//         if (e.key === 'add-team') {
//             setIsAddTeamModalVisible(true);
//         } else if (e.key === 'add-main-service') {
//             setIsAddMainServiceModalVisible(true);
//         } else if (e.key === 'add-sub-service') {
//             setIsAddSubServiceModalVisible(true);
//         }
//     };
    
//     // Dropdown menu for adding new items
//     const menu = (
//         <Menu onClick={handleMenuClick}>
//             <Menu.Item key="add-team" icon={<PlusOutlined />}>
//                 Add Team
//             </Menu.Item>
//             <Menu.Item key="add-main-service" icon={<PlusOutlined />}>
//                 Add Main Service
//             </Menu.Item>
//             <Menu.Item key="add-sub-service" icon={<PlusOutlined />}>
//                 Add Sub-Service
//             </Menu.Item>
//         </Menu>
//     );

//     // if (isLoading) {
//     //     return (
//     //         <div style={{ padding: '50px', textAlign: 'center' }}>
//     //             <Spin size="large" tip="Loading teams and services..." />
//     //         </div>
//     //     );
//     // }

//     if (error) {
//         return (
//             <Alert
//                 message="Error"
//                 description={error}
//                 type="error"
//                 showIcon
//                 style={{ margin: '20px' }}
//             />
//         );
//     }

//     // const selectedTeamServices = mainServices.filter(service => service.team === selectedTeamId);
    

//     return (
//         <App>
//             <div
//                 style={{
//                 padding: '24px',
//                 background: 'linear-gradient(to right, #f8f9fa, #e0e7ff)',
//                 borderRadius: '12px',
//                 boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)',
//                 }}
//             >
//                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
//                     <Title level={2} style={{ margin: 0 }}>Teams and Services</Title>
//                     <Space>
//                       {/* The new button component */}
                      
//                       <Dropdown overlay={menu} trigger={['click']} placement="bottomRight">
//                           <Button type="primary" icon={<PlusOutlined />}>
//                               Add New
//                           </Button>
//                       </Dropdown>
//                     </Space>
//                 </div>
                
//                 {/* <Divider /> */}

//                 {/* Team Selection Section */}
//                 <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
//                     <Text strong>Select a Team:</Text>
//                     <Select
//                         placeholder="Select a team"
//                         style={{ width: 150 }}
//                         onChange={handleTeamChange}
//                         value={selectedTeamId}
//                     >
//                         {teams.map(team => (
//                             <Option key={team.id} value={team.id}>{team.name}</Option>
//                         ))}
//                     </Select>
//                 </div>

//                 {/* <Divider /> */}

//                 {/* Display Services for the selected team */}
//                 <Title level={4}>Services for {selectedTeam?.name || 'Selected Team'}</Title>
//                 {selectedTeamId && (
//                     <div className="masonry">
//   {selectedTeamServices.map(service => (
//     <div key={service.id} className="masonry-item">
//       <Card
//         title={
//           <Text strong ellipsis={{ tooltip: service.name }}>
//             {service.name}
//           </Text>
//         }
//         style={{ borderRadius: 8 }}
//       >
//         <Text strong>Sub-services:</Text>
//         <List
//   size="small"
//   dataSource={subServicesMap[service.id] || []}
//   renderItem={(sub) => (
//     <List.Item>
//       <Space direction="vertical" size={0}>
//         <Text>{sub.name}</Text>

//         {formatPeriodDisplay(sub) && (
//           <Text type="secondary" style={{ fontSize: 12 }}>
//             {formatPeriodDisplay(sub)}
//           </Text>
//         )}
//       </Space>
//     </List.Item>
//   )}
//   locale={{ emptyText: 'No sub-services' }}
// />


//       </Card>
//     </div>
//   ))}
// </div>

//                 )}
//             </div>
            
//             {/* All Modals */}
//             <AddTeamModal visible={isAddTeamModalVisible} onClose={() => setIsAddTeamModalVisible(false)} onSuccess={fetchData} />
//             <AddMainServiceModal visible={isAddMainServiceModalVisible} onClose={() => setIsAddMainServiceModalVisible(false)} onSuccess={fetchData} teams={teams} />
//             <AddSubServiceModal 
//                 visible={isAddSubServiceModalVisible} 
//                 onClose={() => setIsAddSubServiceModalVisible(false)} 
//                 onSuccess={fetchData} 
//                 mainServices={mainServices}
//                 teams={teams} // Pass the teams prop to the modal
//             />
//         </App>
//     );
// };

// export default TeamListView;


import React, { useState, useEffect, useCallback, useMemo, useContext, useRef } from 'react';
import {
  List, Card, Typography, Spin, Alert, App, Divider, Empty,
  Button, Modal, Form, Input, Select, Space, Dropdown, Menu, Tag, Tooltip,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { SpinnerContext } from '../../../components/SpinnerContext';
import { api } from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';
import '../../../CSS/pages/serviceassignmentview.css';

const { Title, Text } = Typography;
const { Option } = Select;
const { useApp } = App;

/* ─── Helpers ───────────────────────────────────────────────────── */
const getOrdinal = (n) => {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};
const monthShort = (m) => new Date(0, m - 1).toLocaleString('default', { month: 'short' });
const monthFull  = (m) => new Date(0, m - 1).toLocaleString('default', { month: 'long' });

const formatPeriodDisplay = (sub) => {
  if (!sub?.period) return null;
  if (sub.period === 'Event-Based') return 'Event-Based';
  if (!sub.due_day) return null;
  const d = sub.due_day;
  const m = sub.due_month;
  if (sub.period === 'Monthly')
    return `Monthly: ${getOrdinal(d)} of every month`;
  if (sub.period === 'Annually')
    return `Annually: ${getOrdinal(d)} ${monthFull(m)}`;
  if (sub.period === 'Quarterly') {
    const months = [];
    for (let i = 0; i < 4; i++) months.push(`${monthShort(((m - 1 + i * 3) % 12) + 1)}-${d}`);
    return `Quarterly: ${months.join(', ')}`;
  }
  if (sub.period === 'Half-Yearly') {
    const m2 = ((m - 1 + 6) % 12) + 1;
    return `Half-Yearly: ${monthShort(m)}-${d}, ${monthShort(m2)}-${d}`;
  }
  return null;
};

/* ─── Compute default period label (mirrors Django get_period_label) ── */
function computeDefaultPeriodLabel(period, dueDay, dueMonth) {
  if (!period || period === 'Event-Based') return period === 'Event-Based' ? 'Event-Based' : '';
  if (!dueDay) return '';
  const dd  = parseInt(dueDay, 10);
  const dm  = parseInt(dueMonth, 10) || new Date().getMonth() + 1;
  const now = new Date();

  // Pick the nearest future (or current) occurrence year
  let year = now.getFullYear();
  if (dm < now.getMonth() + 1) year += 1; // due month already passed this year

  const lastDay = new Date(year, dm, 0).getDate();
  const due     = new Date(year, dm - 1, Math.min(dd, lastDay));

  const fmt = (d) => d.toLocaleString('default', { month: 'short' }) + '-' + d.getFullYear();

  const addMonths = (d, n) => {
    const r = new Date(d);
    r.setDate(1);
    r.setMonth(r.getMonth() + n);
    return r;
  };

  if (period === 'Monthly') return fmt(due);

  if (period === 'Quarterly') {
    const start = addMonths(due, -2);
    return `${fmt(start)} to ${fmt(due)}`;
  }
  if (period === 'Half-Yearly') {
    const start = addMonths(due, -5);
    return `${fmt(start)} to ${fmt(due)}`;
  }
  if (period === 'Annually') {
    const start = addMonths(due, -11);
    return `${fmt(start)} to ${fmt(due)}`;
  }
  return '';
}

/* ─── AddTeamModal ──────────────────────────────────────────────── */
const AddTeamModal = ({ visible, onClose, onSuccess }) => {
  const [form] = Form.useForm();
  const { authToken } = useAuth();
  const token = authToken || localStorage.getItem('token');
  const { message } = useApp();

  const onFinish = async (values) => {
    try {
      await api.post('/employee/teams/', values, { headers: { Authorization: `Bearer ${token}` } });
      message.success('Team added successfully!');
      onSuccess(); onClose(); form.resetFields();
    } catch { message.error('Failed to add team.'); }
  };

  return (
    <Modal title="Add New Team" open={visible} onCancel={onClose} onOk={() => form.submit()}>
      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Form.Item name="name" label="Team Name" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item name="description" label="Description">
          <Input.TextArea />
        </Form.Item>
      </Form>
    </Modal>
  );
};

/* ─── AddMainServiceModal ───────────────────────────────────────── */
const AddMainServiceModal = ({ visible, onClose, onSuccess, teams }) => {
  const [form] = Form.useForm();
  const { authToken } = useAuth();
  const token = authToken || localStorage.getItem('token');
  const { message } = useApp();

  const onFinish = async (values) => {
    try {
      await api.post('/clients/mainservices/', values, { headers: { Authorization: `Bearer ${token}` } });
      message.success('Main service added successfully!');
      onSuccess(); onClose(); form.resetFields();
    } catch { message.error('Failed to add main service.'); }
  };

  return (
    <Modal title="Add New Main Service" open={visible} onCancel={onClose} onOk={() => form.submit()}>
      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Form.Item name="name" label="Service Name" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item name="description" label="Description">
          <Input.TextArea />
        </Form.Item>
        <Form.Item name="team" label="Assign to Team" rules={[{ required: true }]}>
          <Select placeholder="Select a team">
            {teams.map(t => <Option key={t.id} value={t.id}>{t.name}</Option>)}
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  );
};

/* ─── AddSubServiceModal (create + edit) ────────────────────────── */
const SubServiceModal = ({ visible, onClose, onSuccess, mainServices, teams, initialValues = null }) => {
  const isEdit = !!initialValues;
  const [form] = Form.useForm();
  const { authToken } = useAuth();
  const token = authToken || localStorage.getItem('token');
  const { message } = useApp();
  const [filteredMainServices, setFilteredMainServices] = useState([]);
  const [autoLabel, setAutoLabel] = useState('');

  const period   = Form.useWatch('period',    form);
  const dueDay   = Form.useWatch('due_day',   form);
  const dueMonth = Form.useWatch('due_month', form);

  // Recompute default label whenever period/day/month change
  useEffect(() => {
    const label = computeDefaultPeriodLabel(period, dueDay, dueMonth);
    setAutoLabel(label);
    // Only auto-fill if user hasn't typed a custom value yet
    const current = form.getFieldValue('period_label');
    if (!current || current === autoLabel) {
      form.setFieldValue('period_label', label);
    }
  }, [period, dueDay, dueMonth]);

  // Populate form on edit
  useEffect(() => {
    if (visible && initialValues) {
      const team = mainServices.find(ms => ms.id === initialValues.main_service)?.team;
      if (team) {
        const filtered = mainServices.filter(ms => ms.team === team).sort((a, b) => a.name.localeCompare(b.name));
        setFilteredMainServices(filtered);
      }
      form.setFieldsValue({
        name:         initialValues.name,
        team:         team,
        main_service: initialValues.main_service,
        period:       initialValues.period,
        due_day:      initialValues.due_day,
        due_month:    initialValues.due_month,
        period_label: initialValues.period_label || '',
      });
    } else if (visible && !initialValues) {
      form.resetFields();
      setFilteredMainServices([]);
      setAutoLabel('');
    }
  }, [visible, initialValues]);

  const handleTeamChange = (teamId) => {
    const filtered = mainServices.filter(ms => ms.team === teamId).sort((a, b) => a.name.localeCompare(b.name));
    setFilteredMainServices(filtered);
    form.setFieldsValue({ main_service: undefined });
  };

  const onFinish = async (values) => {
    const payload = {
      name:         values.name,
      main_service: values.main_service,
      period:       values.period || null,
      due_day:      values.due_day || null,
      due_month:    values.period !== 'Monthly' ? (values.due_month || null) : null,
      period_label: values.period_label?.trim() || null,
    };
    try {
      if (isEdit) {
        await api.patch(`/clients/subservices/${initialValues.id}/`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        message.success('Sub-service updated successfully!');
      } else {
        await api.post('/clients/subservices/', payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        message.success('Sub-service added successfully!');
      }
      onSuccess(); onClose(); form.resetFields();
    } catch (e) {
      console.error(e);
      message.error(`Failed to ${isEdit ? 'update' : 'add'} sub-service.`);
    }
  };

  return (
    <Modal
      title={isEdit ? 'Edit Sub-Service' : 'Add New Sub-Service'}
      open={visible}
      onCancel={onClose}
      onOk={() => form.submit()}
      width={520}
      destroyOnClose
    >
      <Form form={form} layout="vertical" onFinish={onFinish}>

        <Form.Item name="name" label="Sub-Service Name" rules={[{ required: true }]}>
          <Input />
        </Form.Item>

        {!isEdit && (
          <Form.Item name="team" label="Department / Team" rules={[{ required: true }]}>
            <Select onChange={handleTeamChange}>
              {teams.map(t => <Option key={t.id} value={t.id}>{t.name}</Option>)}
            </Select>
          </Form.Item>
        )}

        <Form.Item name="main_service" label="Main Service" rules={[{ required: true }]}>
          <Select disabled={!isEdit && !form.getFieldValue('team')}>
            {(isEdit ? mainServices : filteredMainServices).map(ms => (
              <Option key={ms.id} value={ms.id}>{ms.name}</Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item name="period" label="Period">
          <Select allowClear placeholder="Select period">
            <Option value="Monthly">Monthly</Option>
            <Option value="Quarterly">Quarterly</Option>
            <Option value="Half-Yearly">Half-Yearly</Option>
            <Option value="Annually">Annually</Option>
            <Option value="Event-Based">Event-Based</Option>
          </Select>
        </Form.Item>

        {period && period !== 'Event-Based' && (
          <Form.Item name="due_day" label="Due Day" rules={[{ required: true }]}>
            <Input type="number" min={1} max={31} />
          </Form.Item>
        )}

        {period && period !== 'Monthly' && period !== 'Event-Based' && (
          <Form.Item name="due_month" label="Due Month" rules={[{ required: true }]}>
            <Select>
              {Array.from({ length: 12 }).map((_, i) => (
                <Option key={i + 1} value={i + 1}>
                  {new Date(0, i).toLocaleString('default', { month: 'long' })}
                </Option>
              ))}
            </Select>
          </Form.Item>
        )}

        {/* Period Label — auto-computed, user can override */}
        {period && period !== 'Event-Based' && (
          <Form.Item
            name="period_label"
            label={
              <Space size={4}>
                <span>Period Label</span>
                <Tooltip title="Auto-calculated from the due date above. You can override this — e.g. change 'Apr-2025 to Mar-2026' for a financial year task that doesn't align with the standard calculation.">
                  <InfoCircleOutlined style={{ color: '#6366f1', fontSize: 13 }} />
                </Tooltip>
              </Space>
            }
            extra={
              autoLabel && form.getFieldValue('period_label') !== autoLabel ? (
                <span
                  style={{ fontSize: 12, color: '#6366f1', cursor: 'pointer' }}
                  onClick={() => form.setFieldValue('period_label', autoLabel)}
                >
                  ↺ Reset to calculated: <strong>{autoLabel}</strong>
                </span>
              ) : (
                <span style={{ fontSize: 12, color: '#94a3b8' }}>
                  Auto-calculated · edit if this task follows a different year (e.g. Apr–Mar)
                </span>
              )
            }
          >
            <Input placeholder={autoLabel || 'e.g. Apr-2025 to Mar-2026'} />
          </Form.Item>
        )}

      </Form>
    </Modal>
  );
};

/* ─── Main Component ────────────────────────────────────────────── */
const TeamListView = () => {
  const [teams,          setTeams]          = useState([]);
  const [mainServices,   setMainServices]   = useState([]);
  const [subServicesMap, setSubServicesMap] = useState({});
  const [isLoading,      setIsLoading]      = useState(true);
  const [error,          setError]          = useState(null);
  const [selectedTeamId, setSelectedTeamId] = useState(null);
  const { showSpinner, hideSpinner } = useContext(SpinnerContext);

  const [isAddTeamModalVisible,       setIsAddTeamModalVisible]       = useState(false);
  const [isAddMainServiceModalVisible, setIsAddMainServiceModalVisible] = useState(false);
  const [isSubServiceModalVisible,    setIsSubServiceModalVisible]    = useState(false);
  const [editingSubService,           setEditingSubService]           = useState(null);

  const { authToken } = useAuth();
  const token = authToken || localStorage.getItem('token');
  const { message } = useApp();
  const isInitialMount = useRef(true);

  const selectedTeamServices = useMemo(() =>
    !selectedTeamId ? [] : mainServices.filter(s => s.team === selectedTeamId),
    [mainServices, selectedTeamId]
  );
  const selectedTeam = teams.find(t => t.id === selectedTeamId);

  const fetchData = useCallback(async () => {
    showSpinner();
    setError(null);
    const headers = { Authorization: `Bearer ${token}` };
    try {
      const [teamsRes, mainRes, subRes] = await Promise.all([
        api.get('/employee/teams/',       { headers }),
        api.get('/clients/mainservices/', { headers }),
        api.get('/clients/subservices/',  { headers }),
      ]);

      const fetchedTeams = (teamsRes.data.results || teamsRes.data)
        .slice().sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      setTeams(fetchedTeams);

      if (isInitialMount.current && fetchedTeams.length > 0) {
        setSelectedTeamId(fetchedTeams[0].id);
        isInitialMount.current = false;
      }

      setMainServices(
        (mainRes.data.results || mainRes.data)
          .slice().sort((a, b) => (a.name || '').localeCompare(b.name || ''))
      );

      const map = {};
      (subRes.data.results || subRes.data).forEach(sub => {
        const id = sub.main_service_detail?.id || sub.main_service;
        if (!map[id]) map[id] = [];
        map[id].push(sub);
      });
      setSubServicesMap(map);
    } catch (err) {
      console.error(err);
      setError('Failed to load data.');
    } finally {
      setIsLoading(false);
      hideSpinner();
    }
  }, [token, showSpinner, hideSpinner]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleMenuClick = (e) => {
    if (e.key === 'add-team')         setIsAddTeamModalVisible(true);
    if (e.key === 'add-main-service') setIsAddMainServiceModalVisible(true);
    if (e.key === 'add-sub-service')  { setEditingSubService(null); setIsSubServiceModalVisible(true); }
  };

  const handleEditSubService = (sub) => {
    setEditingSubService(sub);
    setIsSubServiceModalVisible(true);
  };

  const menu = (
    <Menu onClick={handleMenuClick}>
      <Menu.Item key="add-team"         icon={<PlusOutlined />}>Add Team</Menu.Item>
      <Menu.Item key="add-main-service" icon={<PlusOutlined />}>Add Main Service</Menu.Item>
      <Menu.Item key="add-sub-service"  icon={<PlusOutlined />}>Add Sub-Service</Menu.Item>
    </Menu>
  );

  if (error) {
    return <Alert message="Error" description={error} type="error" showIcon style={{ margin: 20 }} />;
  }

  return (
    <App>
      <div style={{
        padding: '24px',
        background: 'linear-gradient(to right, #f8f9fa, #e0e7ff)',
        borderRadius: '12px',
        boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <Title level={2} style={{ margin: 0 }}>Teams and Services</Title>
          <Dropdown overlay={menu} trigger={['click']} placement="bottomRight">
            <Button type="primary" icon={<PlusOutlined />}>Add New</Button>
          </Dropdown>
        </div>

        {/* Team selector */}
        <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <Text strong>Select a Team:</Text>
          <Select
            placeholder="Select a team"
            style={{ width: 150 }}
            onChange={setSelectedTeamId}
            value={selectedTeamId}
          >
            {teams.map(t => <Option key={t.id} value={t.id}>{t.name}</Option>)}
          </Select>
        </div>

        <Title level={4}>Services for {selectedTeam?.name || 'Selected Team'}</Title>

        {selectedTeamId && (
          <div className="masonry">
            {selectedTeamServices.map(service => (
              <div key={service.id} className="masonry-item">
                <Card
                  title={<Text strong ellipsis={{ tooltip: service.name }}>{service.name}</Text>}
                  style={{ borderRadius: 8 }}
                >
                  <Text strong>Sub-services:</Text>
                  <List
                    size="small"
                    dataSource={subServicesMap[service.id] || []}
                    renderItem={(sub) => (
                      <List.Item
                        actions={[
                          <Tooltip title="Edit sub-service" key="edit">
                            <Button
                              type="text"
                              size="small"
                              icon={<EditOutlined />}
                              onClick={() => handleEditSubService(sub)}
                              style={{ color: '#6366f1' }}
                            />
                          </Tooltip>,
                        ]}
                      >
                        <Space direction="vertical" size={0} style={{ flex: 1 }}>
                          <Text>{sub.name}</Text>
                          {formatPeriodDisplay(sub) && (
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              {formatPeriodDisplay(sub)}
                            </Text>
                          )}
                          {sub.period_label && (
                            <Tag
                              color="purple"
                              style={{ fontSize: 11, marginTop: 2, borderRadius: 10 }}
                            >
                              {sub.period_label}
                            </Tag>
                          )}
                        </Space>
                      </List.Item>
                    )}
                    locale={{ emptyText: 'No sub-services' }}
                  />
                </Card>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <AddTeamModal
        visible={isAddTeamModalVisible}
        onClose={() => setIsAddTeamModalVisible(false)}
        onSuccess={fetchData}
      />
      <AddMainServiceModal
        visible={isAddMainServiceModalVisible}
        onClose={() => setIsAddMainServiceModalVisible(false)}
        onSuccess={fetchData}
        teams={teams}
      />
      <SubServiceModal
        visible={isSubServiceModalVisible}
        onClose={() => { setIsSubServiceModalVisible(false); setEditingSubService(null); }}
        onSuccess={fetchData}
        mainServices={mainServices}
        teams={teams}
        initialValues={editingSubService}
      />
    </App>
  );
};

export default TeamListView;