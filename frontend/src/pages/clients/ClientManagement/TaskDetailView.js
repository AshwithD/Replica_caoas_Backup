// import React, { useState, useEffect, useCallback } from 'react';
// import { Modal, Spin, Typography, Button, Divider, App, Form, Input, DatePicker, Card, Tag, Row, Col, List, Skeleton, Empty } from 'antd';
// import { EditOutlined, ClockCircleOutlined, UserOutlined, CalendarOutlined, FileTextOutlined } from '@ant-design/icons';
// import { api } from '../../../services/api';
// import { useAuth } from '../../../contexts/AuthContext';
// import moment from 'moment';
// import 'antd/dist/reset.css'; // This is important for Ant Design to work correctly

// const { Title, Text } = Typography;
// const { TextArea } = Input;

// // This component displays task details in an editable form within a modal.
// const TaskDetailView = ({ visible, taskId, onClose, onTaskUpdated }) => {
//     const [form] = Form.useForm();
//     const { authToken } = useAuth();
//     const token = authToken || localStorage.getItem('token');
//     const { message } = App.useApp();

//     const [task, setTask] = useState(null);
//     const [isLoading, setIsLoading] = useState(false);
//     const [isSaving, setIsSaving] = useState(false);
//     const [error, setError] = useState(null);

//     // Fetch the detailed task data from the backend
//     const fetchTaskDetails = useCallback(async (id) => {
//         if (!id) return;

//         setIsLoading(true);
//         setError(null);

//         const headers = { Authorization: `Bearer ${token}` };

//         try {
//             // Fetch the task data
//             const taskResponse = await api.get(`/clients/tasks/${id}/`, { headers });
            
//             // Fetch related data for a more detailed view
//             const clientResponse = await api.get(`/clients/clients/${taskResponse.data.client}/`, { headers });
//             const spocResponse = await api.get(`/clients/spocs/${taskResponse.data.spoc}/`, { headers });
//             const subServiceResponse = await api.get(`/clients/subservices/${taskResponse.data.sub_service}/`, { headers });
//             const teamResponse = await api.get(`/employee/teams/${taskResponse.data.team}/`, { headers });

//             const fullTaskData = {
//                 ...taskResponse.data,
//                 client_name: clientResponse.data.name,
//                 spoc_name: spocResponse.data.name,
//                 sub_service_name: subServiceResponse.data.name,
//                 team_name: teamResponse.data.name,
//             };

//             setTask(fullTaskData);
//             // Set form fields with fetched data for editing
//             form.setFieldsValue({
//                 employee_id: fullTaskData.employee_id,
//                 comments: fullTaskData.comments,
//                 total_hours: fullTaskData.total_hours,
//                 start_time: fullTaskData.start_time ? moment(fullTaskData.start_time) : null,
//                 end_time: fullTaskData.end_time ? moment(fullTaskData.end_time) : null,
//             });

//         } catch (err) {
//             console.error('Failed to fetch task details:', err);
//             setError('Failed to load task details. Please try again.');
//             message.error('Failed to load task details.');
//         } finally {
//             setIsLoading(false);
//         }
//     }, [token, message, form]);

//     useEffect(() => {
//         if (visible && taskId) {
//             fetchTaskDetails(taskId);
//         }
//     }, [visible, taskId, fetchTaskDetails]);

//     // Handle closing the modal
//     const handleClose = () => {
//         setTask(null);
//         form.resetFields();
//         onClose();
//     };

//     const handleSave = async (values) => {
//         setIsSaving(true);
//         try {
//             const headers = { Authorization: `Bearer ${token}` };
//             const payload = {
//                 ...task,
//                 employee_id: values.employee_id || null,
//                 comments: values.comments || null,
//                 total_hours: values.total_hours || null,
//                 start_time: values.start_time ? values.start_time.toISOString() : null,
//                 end_time: values.end_time ? values.end_time.toISOString() : null,
//             };

//             await api.put(`/clients/tasks/${task.id}/`, payload, { headers });
//             message.success('Task updated successfully!');
//             onTaskUpdated(); // Refresh the parent list
//             handleClose();
//         } catch (error) {
//             console.error('Failed to update task:', error);
//             message.error(`Failed to update task: ${error.response?.data ? JSON.stringify(error.response.data) : error.message}`);
//         } finally {
//             setIsSaving(false);
//         }
//     };

//     const getStatusColor = (status) => {
//         switch (status) {
//             case 'To Do':
//                 return 'red';
//             case 'In Progress':
//                 return 'blue';
//             case 'Done':
//                 return 'green';
//             case 'Over Due':
//                 return 'red';    
//             default:
//                 return 'default';
//         }
//     };

//     const taskDetailsContent = isLoading ? (
//         <Skeleton active paragraph={{ rows: 6 }} />
//     ) : error ? (
//         <Text type="danger">{error}</Text>
//     ) : (
//         <Form form={form} layout="vertical" onFinish={handleSave}>
//             <Card className="mb-4" bordered={false} style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.09)' }}>
//                 <Title level={4}>Task Details</Title>
//                 <List
//                     itemLayout="horizontal"
//                     dataSource={[
//                         { label: 'Task ID', value: task?.task_id },
//                         { label: 'Status', value: <Tag color={getStatusColor(task?.status)}>{task?.status}</Tag> },
//                         { label: 'Period', value: task?.period },
//                         { label: 'Client', value: task?.client_name },
//                         { label: 'Sub-Service', value: task?.sub_service_name },
//                         { label: 'Due Date', value: task?.due_date ? moment(task.due_date).format('DD MMM YYYY') : '' },
//                         { label: 'Assigned Team', value: task?.team_name },
//                         { label: 'SPOC', value: task?.spoc_name },
//                         { label: 'Created At', value: task?.created_at ? moment(task.created_at).format('DD MMM YYYY, h:mm A') : '' },
//                     ]}
//                     renderItem={item => (
//                         <List.Item>
//                             <List.Item.Meta
//                                 title={<Text strong>{item.label}</Text>}
//                                 description={item.value}
//                             />
//                         </List.Item>
//                     )}
//                 />
//             </Card>
//             <Divider orientation="left">Editable Fields</Divider>
//             <Form.Item name="employee_id" label="Employee ID">
//                 <Input prefix={<UserOutlined />} placeholder="Enter Employee ID" />
//             </Form.Item>
//             <Form.Item name="comments" label="Comments">
//                 <TextArea prefix={<FileTextOutlined />} rows={4} placeholder="Enter comments" />
//             </Form.Item>
//             <Form.Item name="total_hours" label="Total Hours">
//                 <Input prefix={<ClockCircleOutlined />} type="number" placeholder="Enter total hours" />
//             </Form.Item>
//             <Form.Item name="start_time" label="Start Time">
//                 <DatePicker prefix={<CalendarOutlined />} showTime format="YYYY-MM-DD HH:mm:ss" style={{ width: '100%' }} />
//             </Form.Item>
//             <Form.Item name="end_time" label="End Time">
//                 <DatePicker prefix={<CalendarOutlined />} showTime format="YYYY-MM-DD HH:mm:ss" style={{ width: '100%' }} />
//             </Form.Item>
//             {task?.file && (
//                 <p>
//                     <strong>File:</strong> <a href={task.file} target="_blank" rel="noopener noreferrer">Download File</a>
//                 </p>
//             )}
//         </Form>
//     );

//     return (
//         <Modal
//             title={<Title level={4}>Edit Task: {task?.task_id || ''}</Title>}
//             open={visible}
//             onCancel={handleClose}
//             width={800}
//             footer={[
//                 <Button key="cancel" onClick={handleClose}>
//                     Cancel
//                 </Button>,
//                 <Button key="save" type="primary" loading={isSaving} onClick={() => form.submit()}>
//                     Save
//                 </Button>,
//             ]}
//             destroyOnClose={true}
//         >
//             {taskDetailsContent}
//         </Modal>
//     );
// };

// // Example parent component to demonstrate usage
// const TaskList = () => {
//     const [tasks, setTasks] = useState([]);
//     const [isLoading, setIsLoading] = useState(true);
//     const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
//     const [selectedTaskId, setSelectedTaskId] = useState(null);
//     const { authToken } = useAuth();
//     const token = authToken || localStorage.getItem('token');
//     const { message } = App.useApp();

//     const fetchTasks = async () => {
//         setIsLoading(true);
//         const headers = { Authorization: `Bearer ${token}` };
//         try {
//             const response = await api.get('/clients/tasks/', { headers });
//             setTasks(response.data.results || response.data);
//         } catch (error) {
//             console.error('Failed to fetch tasks:', error);
//             message.error('Failed to load tasks.');
//         } finally {
//             setIsLoading(false);
//         }
//     };

//     useEffect(() => {
//         if (token) {
//             fetchTasks();
//         }
//     }, [token]);

//     const handleTaskClick = (taskId) => {
//         setSelectedTaskId(taskId);
//         setIsDetailModalVisible(true);
//     };

//     const getStatusColor = (status) => {
//         switch (status) {
//             case 'To Do':
//                 return 'red';
//             case 'In Progress':
//                 return 'blue';
//             case 'Done':
//                 return 'green';
//             case 'Over Due':
//                 return 'red';    
//             default:
//                 return 'default';
//         }
//     };

//     return (
//         <App>
//             <div className="p-6 bg-gray-50 min-h-screen">
//                 <Title level={2}>My Tasks</Title>
//                 <Divider />
//                 {isLoading ? (
//                     <Row gutter={[16, 16]}>
//                         {[...Array(6)].map((_, index) => (
//                             <Col xs={24} sm={12} md={8} lg={6} key={index}>
//                                 <Card className="shadow-sm">
//                                     <Skeleton active />
//                                 </Card>
//                             </Col>
//                         ))}
//                     </Row>
//                 ) : tasks.length === 0 ? (
//                     <Empty description="No tasks found." />
//                 ) : (
//                     <Row gutter={[16, 16]}>
//                         {tasks.map(task => (
//                             <Col xs={24} sm={12} md={8} lg={6} key={task.id}>
//                                 <Card
//                                     hoverable
//                                     className="shadow-sm transition-transform duration-200 hover:scale-105"
//                                     onClick={() => handleTaskClick(task.id)}
//                                     actions={[
//                                         <EditOutlined key="edit" />
//                                     ]}
//                                 >
//                                     <Card.Meta
//                                         title={<Text strong>{task.task_id || 'N/A'}</Text>}
//                                         description={
//                                             <>
//                                                 <Text type="secondary">Due Date: {task.due_date ? moment(task.due_date).format('DD MMM YYYY') : 'N/A'}</Text>
//                                                 <div className="mt-2">
//                                                     <Tag color={getStatusColor(task.status)}>{task.status || 'N/A'}</Tag>
//                                                 </div>
//                                             </>
//                                         }
//                                     />
//                                 </Card>
//                             </Col>
//                         ))}
//                     </Row>
//                 )}
//             </div>
            
//             <TaskDetailView 
//                 visible={isDetailModalVisible} 
//                 taskId={selectedTaskId} 
//                 onClose={() => setIsDetailModalVisible(false)} 
//                 onTaskUpdated={fetchTasks}
//             />
//         </App>
//     );
// };

// export default TaskList;


// ── TaskDetailView.js ─────────────────────────────────────────────────────────

import React, { useState, useEffect, useCallback } from 'react';
import {
    Modal, Typography, Button, Divider, App, Form, Input,
    DatePicker, Card, Tag, List, Skeleton,
} from 'antd';
import {
    ClockCircleOutlined, UserOutlined,
    CalendarOutlined, FileTextOutlined,
} from '@ant-design/icons';
import { api } from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';
import moment from 'moment';

const { Title, Text } = Typography;
const { TextArea } = Input;

const TaskDetailView = ({ visible, taskId, onClose, onTaskUpdated }) => {
    const [form]    = Form.useForm();
    const { authToken } = useAuth();
    const token         = authToken || localStorage.getItem('token');
    const { message }   = App.useApp();

    const [task,      setTask]      = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving,  setIsSaving]  = useState(false);
    const [error,     setError]     = useState(null);

    /* ── Fetch task — single call, backend returns all related names ── */
    const fetchTaskDetails = useCallback(async (id) => {
        if (!id) return;
        setIsLoading(true);
        setError(null);
        try {
            const res  = await api.get(`/clients/tasks/${id}/`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = res.data;

            const fullTask = {
                ...data,
                // Use serializer fields if present, fall back gracefully
                client_name:      data.client_name      || data.client?.name      || `Client #${data.client}`,
                spoc_name:        data.spoc_name         || data.spoc?.name        || `SPOC #${data.spoc}`,
                sub_service_name: data.sub_service_name  || data.sub_service?.name || `Service #${data.sub_service}`,
                team_name:        data.team_name         || data.team?.name        || `Team #${data.team}`,
            };

            setTask(fullTask);
            form.setFieldsValue({
                employee_id: fullTask.employee_id,
                comments:    fullTask.comments,
                total_hours: fullTask.total_hours,
                start_time:  fullTask.start_time ? moment(fullTask.start_time) : null,
                end_time:    fullTask.end_time   ? moment(fullTask.end_time)   : null,
            });
        } catch (err) {
            console.error('Failed to fetch task details:', err);
            setError('Failed to load task details. Please try again.');
            message.error('Failed to load task details.');
        } finally {
            setIsLoading(false);
        }
    }, [token, message, form]);

    useEffect(() => {
        if (visible && taskId) fetchTaskDetails(taskId);
    }, [visible, taskId, fetchTaskDetails]);

    const handleClose = () => {
        setTask(null);
        form.resetFields();
        onClose();
    };

    const handleSave = async (values) => {
        setIsSaving(true);
        try {
            const payload = {
                ...task,
                employee_id: values.employee_id || null,
                comments:    values.comments    || null,
                total_hours: values.total_hours || null,
                start_time:  values.start_time  ? values.start_time.toISOString() : null,
                end_time:    values.end_time     ? values.end_time.toISOString()   : null,
            };
            await api.put(`/clients/tasks/${task.id}/`, payload, {
                headers: { Authorization: `Bearer ${token}` },
            });
            message.success('Task updated successfully!');
            onTaskUpdated();
            handleClose();
        } catch (err) {
            console.error('Failed to update task:', err);
            message.error(
                `Failed to update task: ${
                    err.response?.data ? JSON.stringify(err.response.data) : err.message
                }`
            );
        } finally {
            setIsSaving(false);
        }
    };

    const getStatusColor = (status) => ({
        'To Do':       'blue',
        'In Progress': 'orange',
        'Done':        'green',
        'Over Due':    'red',
    }[status] || 'default');

    const detailRows = task ? [
        { label:'Task ID',       value: task.task_id },
        { label:'Status',        value: <Tag color={getStatusColor(task.status)}>{task.status}</Tag> },
        { label:'Period',        value: task.period },
        { label:'Client',        value: task.client_name },
        { label:'Sub-Service',   value: task.sub_service_name },
        { label:'Due Date',      value: task.due_date ? moment(task.due_date).format('DD MMM YYYY') : '—' },
        { label:'Assigned Team', value: task.team_name },
        { label:'SPOC',          value: task.spoc_name },
        { label:'Created At',    value: task.created_at ? moment(task.created_at).format('DD MMM YYYY, h:mm A') : '—' },
    ] : [];

    return (
        <Modal
            title={<Title level={4}>Edit Task: {task?.task_id || ''}</Title>}
            open={visible}
            onCancel={handleClose}
            width={800}
            destroyOnClose
            footer={[
                <Button key="cancel" onClick={handleClose}>Cancel</Button>,
                <Button key="save" type="primary" loading={isSaving} onClick={() => form.submit()}>
                    Save
                </Button>,
            ]}
        >
            {isLoading ? (
                <Skeleton active paragraph={{ rows: 6 }} />
            ) : error ? (
                <Text type="danger">{error}</Text>
            ) : (
                <Form form={form} layout="vertical" onFinish={handleSave}>
                    <Card bordered={false} style={{ boxShadow:'0 2px 8px rgba(0,0,0,.09)', marginBottom:16 }}>
                        <Title level={5}>Task Details</Title>
                        <List
                            itemLayout="horizontal"
                            dataSource={detailRows}
                            renderItem={item => (
                                <List.Item>
                                    <List.Item.Meta
                                        title={<Text strong>{item.label}</Text>}
                                        description={item.value}
                                    />
                                </List.Item>
                            )}
                        />
                    </Card>

                    <Divider orientation="left">Editable Fields</Divider>

                    <Form.Item name="employee_id" label="Employee ID">
                        <Input prefix={<UserOutlined/>} placeholder="Enter Employee ID"/>
                    </Form.Item>
                    <Form.Item name="comments" label="Comments">
                        <TextArea rows={4} placeholder="Enter comments"/>
                    </Form.Item>
                    <Form.Item name="total_hours" label="Total Hours">
                        <Input prefix={<ClockCircleOutlined/>} type="number" placeholder="Enter total hours"/>
                    </Form.Item>
                    <Form.Item name="start_time" label="Start Time">
                        <DatePicker showTime format="YYYY-MM-DD HH:mm:ss" style={{ width:'100%' }}/>
                    </Form.Item>
                    <Form.Item name="end_time" label="End Time">
                        <DatePicker showTime format="YYYY-MM-DD HH:mm:ss" style={{ width:'100%' }}/>
                    </Form.Item>

                    {task?.file && (
                        <p>
                            <strong>File:</strong>{' '}
                            <a href={task.file} target="_blank" rel="noopener noreferrer">
                                Download File
                            </a>
                        </p>
                    )}
                </Form>
            )}
        </Modal>
    );
};

export default TaskDetailView;