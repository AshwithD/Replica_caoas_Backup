
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