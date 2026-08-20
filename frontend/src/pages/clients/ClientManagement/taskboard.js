import React, { useState, useEffect, useCallback, useContext, useRef  } from 'react';
import {
    Typography,
    Card,
    Row,
    Col,
    Space,
    Button,
    Form,
    Select,
    Input,
    DatePicker,
    Spin,
    Modal,
    Table,
    Tag,
    Descriptions,
    Divider,
    App,
    Collapse,
    message,
    Menu,
    Dropdown,
    Tooltip,
} from 'antd';
import {
    PlusOutlined,
    UserOutlined,
    CalendarOutlined,
    TagOutlined,
    TableOutlined,
    AppstoreOutlined,
    MinusCircleOutlined,
    ClockCircleOutlined,
    CheckCircleOutlined,
    FilterOutlined,
    DownloadOutlined,
    LeftOutlined,
    DownOutlined,
    ReloadOutlined,
    DeleteOutlined
} from '@ant-design/icons';
import * as XLSX from 'xlsx-js-style';
import moment from 'moment';
import CreateMonthlyTasksButton from './CreateMonthlyTasksButton';
import { Upload, Checkbox } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { SpinnerContext } from '../../../components/SpinnerContext';


import { api } from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;
const { RangePicker } = DatePicker;
const { Panel } = Collapse;

// Utility functions (e.g., formatDurationFromHours, calculateDuration, etc.)
// ... (The code for these functions remains the same)
const calculateDuration = (start, end) => {
    if (!start || !end) return '';
    const diff = moment.duration(end.diff(start));
    const hours = Math.floor(diff.asHours());
    const minutes = diff.minutes();
    return `${hours}h ${minutes}m`;
};

const calculateTotalHours = (assignedEmployeesData) => {
    let totalMillis = 0;
    assignedEmployeesData.forEach(employee => {
        if (employee && employee.time_entries) {
            employee.time_entries.forEach(entry => {
                if (entry && entry.start_time && entry.end_time) {
                    const start = moment(entry.start_time);
                    const end = moment(entry.end_time);
                    if (end.isAfter(start)) {
                        totalMillis += end.diff(start);
                    }
                }
            });
        }
    });
    return moment.duration(totalMillis).asHours();
};

export const formatDurationFromHours = (totalHours) => {
    if (totalHours === null || totalHours === undefined || isNaN(totalHours)) {
        return 'N/A';
    }
    const duration = moment.duration(totalHours, 'hours');
    const hours = Math.floor(duration.asHours());
    const minutes = duration.minutes();

    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    } else {
        return `${minutes}m`;
    }
};

const getEffectiveTaskStatus = (task) => {
    if (task.status === 'Done') {
        return 'Done';
    }
    const dueDate = moment(task.due_date);
    const today = moment();
    if (dueDate.isBefore(today, 'day')) {
        return 'Over Due';
    }
    return task.status;
};



const CreateTaskModal = ({ visible, onClose, onTaskCreated }) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [clients, setClients] = useState([]);
    const [spocs, setSpocs] = useState([]);
    const [clientGroups, setClientGroups] = useState([]);
    const [subServices, setSubServices] = useState([]);
    const [teams, setTeams] = useState([]);
    const [periodType, setPeriodType] = useState(null);
    const [periodStartDate, setPeriodStartDate] = useState(null);
    const [mainServices, setMainServices] = useState([]);
    const [uploadEnabled, setUploadEnabled] = useState(false);
    const { showSpinner, hideSpinner } = useContext(SpinnerContext);

    useEffect(() => {
        const fetchDropdownData = async () => {
            setLoading(true);
            try {
                const [
                    clientsRes,
                    spocsRes,
                    clientGroupsRes,
                    subServicesRes,
                    teamsRes,
                    mainServicesRes,
                ] = await Promise.all([
                    api.get('/clients/clients/'),
                    api.get('/clients/spocs/'),
                    api.get('/clients/client-groups/'),
                    api.get('/clients/subservices/'),
                    api.get('/employee/teams/'),
                    api.get('/clients/mainservices/'),
                ]);

                setClients(clientsRes.data);
                setSpocs(spocsRes.data);
                setClientGroups(clientGroupsRes.data);
                setSubServices(subServicesRes.data);
                setTeams(teamsRes.data);
                setMainServices(mainServicesRes.data);
            } catch (error) {
                message.error('Failed to load dropdown data.');
                console.error('API fetch error:', error);
            } finally {
                setLoading(false);
            }
        };

        if (visible) {
            fetchDropdownData();
            form.resetFields();
            setPeriodType(null);
            setPeriodStartDate(null);
        }
    }, [visible, form]);

    const handleClientChange = (clientId) => {
        form.resetFields(['spoc']);
        const clientGroup = clientGroups.find(group =>
            group.clients.some(client => client.id === clientId)
        );
        
        if (clientGroup) {
            if (clientGroup.primary_spoc) {
                form.setFieldsValue({ spoc: clientGroup.primary_spoc });
            } else {
                message.info('No primary SPOC found for this client group.');
            }
        } else {
            message.info('This client is not associated with a client group.');
        }
    };

    const handleSubServiceChange = (subServiceId) => {
        const selectedSubService = subServices.find(sub => sub.id === subServiceId);
        
        if (selectedSubService && selectedSubService.main_service) {
            const mainService = selectedSubService.main_service;
            
            if (mainService.team) {
                form.setFieldsValue({ team: mainService.team });
            } else {
                form.setFieldsValue({ team: null });
                message.info('No team found for this sub service.');
            }
        }
    };
    
    const getPeriodEndDate = () => {
        if (!periodStartDate || !periodType) {
            return null;
        }

        let endDate = moment(periodStartDate);
        switch (periodType) {
            case 'monthly':
                endDate = periodStartDate.clone().endOf('month');
                break;
            case 'quarterly':
                endDate = periodStartDate.clone().add(2, 'months').endOf('month'); // Start month + 2 months = 3 months total
                break;
            case 'half_yearly':
                endDate = periodStartDate.clone().add(5, 'months').endOf('month'); // Start month + 5 months = 6 months total
                break;
            case 'annually':
                endDate = periodStartDate.clone().add(11, 'months').endOf('month'); // Start month + 11 months = 12 months total
                break;
            default:
                return null;
        }
        return endDate;
    };
    
    const getPeriodString = () => {
        if (!periodType || periodType === 'not_applicable') {
            return null;
        }

        const formattedStart = periodStartDate?.format('MMM-YYYY');
        const endDate = getPeriodEndDate();

        if (periodType === 'monthly') {
            return formattedStart;
        } else {
            const formattedEnd = endDate?.format('MMM-YYYY');
            return `${formattedStart} to ${formattedEnd}`;
        }
    };

    const onFinish = async (values) => {
    setLoading(true);
    const spocValue = form.getFieldValue('spoc');
    const teamValue = form.getFieldValue('team');
    const periodString = getPeriodString();

    try {
        const formData = new FormData();
        formData.append("client", values.client);
        formData.append("sub_service", values.sub_service);
        formData.append("spoc", spocValue);
        formData.append("team", teamValue);
        formData.append("due_date", values.due_date?.format("YYYY-MM-DD"));
        if (periodString) formData.append("period", periodString);

        if (periodType === 'not_applicable') {
            formData.append("period", "N/A");
        } else if (periodString) {
            formData.append("period", periodString);
        }

        // 👇 Append file if selected
        if (values.file && values.file[0]?.originFileObj) {
            formData.append("file", values.file[0].originFileObj);
        }


        await api.post("/clients/tasks/", formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });

        message.success("Task created successfully!");
        form.resetFields();
        onTaskCreated();
        onClose();
    } catch (error) {
        message.error("Failed to create task.");
        console.error("Task creation error:", error.response?.data || error);
    } finally {
        setLoading(false);
    }
};



    return (
        <Modal
            title="Create New Task"
            open={visible}
            onCancel={onClose}
            footer={[
                <Button key="back" onClick={onClose}>
                    Cancel
                </Button>,
                <Button
                    key="submit"
                    type="primary"
                    loading={loading}
                    onClick={() => form.submit()}
                >
                    Create
                </Button>,
            ]}
        >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={onFinish}
                >
                    <Form.Item
                        name="client"
                        label="Client Name"
                        rules={[{ required: true, message: 'Please select a client!' }]}
                    >
                        <Select showSearch onChange={handleClientChange} placeholder="Select Client"
                        allowClear
                        optionFilterProp="children">
                            {clients.map(client => (
                                <Option key={client.id} value={client.id}>
                                    {client.name}
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item
                        name="sub_service"
                        label="Description"
                        rules={[{ required: true, message: 'Please select a sub service!' }]}
                    >
                        <Select showSearch onChange={handleSubServiceChange} placeholder="Select a Description"
                        allowClear
                        optionFilterProp="children">
                            {subServices.map(sub => (
                                <Option key={sub.id} value={sub.id}>
                                    {sub.name}
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                name="due_date"
                                label="Due Date"
                                rules={[{ required: true, message: 'Please select a due date!' }]}
                            >
                                <DatePicker style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name="period_type"
                                label="Period Type"
                                rules={[{ required: true, message: 'Please select a period type!' }]}
                            >
                                <Select
                                    placeholder="Select Period Type"
                                    onChange={(value) => {
                                        setPeriodType(value);
                                        form.setFieldsValue({ period_start_date: null });
                                        setPeriodStartDate(null);
                                    }}
                                >
                                    <Option value="monthly">Monthly</Option>
                                    <Option value="quarterly">Quarterly</Option>
                                    <Option value="half_yearly">Half-Yearly</Option>
                                    <Option value="annually">Annually</Option>
                                    <Option value="not_applicable">Not Applicable</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>
                    
                    {/* Period fields */}
                    <Row gutter={16}>
                    {periodType && periodType !== 'not_applicable' && (
                        <Col span={12}>
                        <Form.Item
                            name="period_start_date"
                            label="Period Start Date"
                            rules={[{ required: true, message: 'Please select a start date!' }]}
                        >
                            <DatePicker
                            picker="month"
                            format="MMM-YYYY"
                            style={{ width: '100%' }}
                            onChange={(date) => setPeriodStartDate(date)}
                            />
                        </Form.Item>
                        </Col>
                    )}
                    {periodType && ['quarterly', 'half_yearly', 'annually'].includes(periodType) && (
                        <Col span={12}>
                        <Form.Item label="Period End Date">
                            <Input
                            value={getPeriodEndDate()?.format('MMM-YYYY') || ''}
                            readOnly
                            />
                        </Form.Item>
                        </Col>
                    )}
                    </Row>

                    {/* Upload Related File checkbox in a separate row */}
                    <Row gutter={16} style={{ marginTop: 16 }}>
                    <Col span={24}>
                        <Form.Item label="">
                        <Checkbox
                            checked={uploadEnabled}
                            onChange={(e) => setUploadEnabled(e.target.checked)}
                        >
                            Upload Related File
                        </Checkbox>
                        </Form.Item>
                    </Col>
                    </Row>

                    {/* File upload field, only if checkbox checked */}
                    {uploadEnabled && (
                    <Row gutter={16}>
                        <Col span={24}>
                        <Form.Item
                            name="file"
                            label=""
                            valuePropName="fileList"
                            getValueFromEvent={(e) => (Array.isArray(e) ? e : e && e.fileList)}
                        >
                            <Upload beforeUpload={() => false} maxCount={1}>
                            <Button icon={<UploadOutlined />}>Select File</Button>
                            </Upload>
                        </Form.Item>
                        </Col>
                    </Row>
                    )}
                </Form>
        </Modal>
    );
};


const TaskDetailView = ({ visible, taskId, onClose, onOpenEditModal, onTaskUpdated, allEmployees }) => {
    const [isSaving, setIsSaving] = useState(false);
    const [form] = Form.useForm();
    const { authToken, user } = useAuth();
    const loggedInUserName = user?.full_name || 'Logged-in User';
    const token = authToken || sessionStorage.getItem('token');
    const { message } = App.useApp();

    const [task, setTask] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isCompleting, setIsCompleting] = useState(false);
    const [proofNotRequired, setProofNotRequired] = useState(false);
    const [startTime, setStartTime] = useState(moment());
    const { showSpinner, hideSpinner } = useContext(SpinnerContext);

    const modalBodyRef = useRef(null);

    useEffect(() => {
        if (visible && task && modalBodyRef.current) {
            const body = modalBodyRef.current;

        // wait for DOM render
        setTimeout(() => {
        if (body.scrollHeight > body.clientHeight) {
            // scroll all the way down
            body.scrollTo({ top: body.scrollHeight, behavior: "smooth" });

            // after scrolling down, scroll back to top
            setTimeout(() => {
            body.scrollTo({ top: 0, behavior: "smooth" });
            }, 600); // wait long enough for the first scroll to finish
        }
        }, 200);
    }
    }, [visible, task]);



    const getEmployeeName = useCallback((employeeId) => {
        const employee = allEmployees.find(emp => emp.id === employeeId);
        if (!employee) {
            return 'N/A';
        }
        if (employee.full_name) {
            return employee.full_name;
        } else if (employee.first_name || employee.last_name) {
            return `${employee.first_name || ''} ${employee.last_name || ''}`.trim();
        }
        return employee.id;
    }, [allEmployees]);

    const fetchTaskDetails = useCallback(async (id) => {
        if (!id) return;

        setIsLoading(true);
        setError(null);

        const headers = { Authorization: `Token ${token}` };

        try {
            const taskResponse = await api.get(`/clients/tasks/${id}/`, { headers });

            const clientResponse = taskResponse.data.client
                ? await api.get(`/clients/clients/${taskResponse.data.client}/`, { headers })
                : { data: { name: 'N/A' } };

            const spocResponse = taskResponse.data.spoc
                ? await api.get(`/clients/spocs/${taskResponse.data.spoc}/`, { headers })
                : { data: { name: 'N/A' } };

            const subServiceResponse = taskResponse.data.sub_service
                ? await api.get(`/clients/subservices/${taskResponse.data.sub_service}/`, { headers })
                : { data: { name: 'N/A' } };

            const teamResponse = taskResponse.data.team
                ? await api.get(`/employee/teams/${taskResponse.data.team}/`, { headers })
                : { data: { name: 'N/A' } };

            const fullTaskData = {
                ...taskResponse.data,
                client_name: clientResponse.data.name,
                spoc_name: spocResponse.data.name,
                sub_service_name: subServiceResponse.data.name,
                team_name: teamResponse.data.name,
            };

            setTask(fullTaskData);
        } catch (err) {
            console.error('TaskDetailView: Failed to fetch task details:', err);
            setError('Failed to load task details. Please try again.');
            message.error('Failed to load task details.');
        } finally {
            setIsLoading(false);
        }
    }, [token, message]);

    useEffect(() => {
        if (visible && taskId) {
            fetchTaskDetails(taskId);
        }
    }, [visible, taskId, fetchTaskDetails]);

    const handleClose = () => {
        setTask(null);
        onClose();
    };

    const handleCompleteTask = async () => {
        setIsCompleting(true);
        try {
            const headers = { Authorization: `Token ${token}` };

            // ✅ Only send status update
            await api.patch(
            `/clients/tasks/${task.id}/`,
            { status: "Done" },
            { headers }
            );

            message.success("Task marked as Done!");
            setTask((prevTask) => ({ ...prevTask, status: "Done" }));
            onTaskUpdated();
        } catch (error) {
            console.error("Failed to mark task as Done:", error);
            message.error(
            `Failed to mark task as Done: ${
                error.response?.data
                ? JSON.stringify(error.response.data)
                : error.message
            }`
            );
        } finally {
            setIsCompleting(false);
        }
        };


    const getStatusColor = (status) => {
        switch (status) {
            case 'To Do': return 'green';
            case 'In Progress': return 'blue';
            case 'Done': return 'blue';
            case 'Over Due': return 'red';
            default: return 'default';
        }
    };


    const timeEntriesColumns = [
        {
            title: 'Start Time',
            dataIndex: 'start_time',
            key: 'start_time',
            render: (text) => text ? moment(text).format('DD MMM YYYY, h:mm A') : '-',
        },
        {
            title: 'End Time',
            dataIndex: 'end_time',
            key: 'end_time',
            render: (text) => text ? moment(text).format('DD MMM YYYY, h:mm A') : <Tag color="processing">Running</Tag>,
        },
        {
            title: 'Duration',
            key: 'duration',
            render: (_, record) => calculateDuration(moment(record.start_time), record.end_time ? moment(record.end_time) : moment()),
        },
        {
            title: 'Comment',
            dataIndex: 'notes',
            key: 'notes',
            render: (text) => text || '-',
        },
    ];

    const isTaskDone = task?.status === 'Done';

    function groupTimeEntriesByEmployee(timeEntries) {
        const grouped = {};
        (timeEntries || []).forEach(entry => {
            const name = entry.employee_name || 'Unknown';
            if (!grouped[name]) grouped[name] = [];
            grouped[name].push(entry);
        });
        return Object.entries(grouped).map(([employee_name, time_entries]) => ({
            employee_name,
            time_entries,
        }));
    }

    const groupedEntries = groupTimeEntriesByEmployee(task?.time_entries || []);

    const getFileName = (fileUrl) => {
        if (!fileUrl) return "";
        try {
            const url = new URL(fileUrl, window.location.origin); // handles absolute/relative
            const last = url.pathname.split("/").pop() || "";
            return decodeURIComponent(last);
        } catch {
            const last = (fileUrl.split("?")[0] || "").split("/").pop() || "";
            return decodeURIComponent(last);
        }
    };

    const getproofFileName = (fileUrl) => {
        if (!fileUrl) return "";
        try {
            const url = new URL(fileUrl, window.location.origin);
            const fileName = decodeURIComponent(url.pathname.split("/").pop());

            // ✅ Remove _<digits> before extension (taskId suffix)
            return fileName.replace(/_[A-Za-z0-9]+(\.[a-zA-Z0-9]+)$/, "$1");
        } catch {
            const fileName = decodeURIComponent(fileUrl.split("/").pop());
            return fileName.replace(/_[A-Za-z0-9]+(\.[a-zA-Z0-9]+)$/, "$1");
        }
        };


    useEffect(() => {
        if (task && form) {
            const initialTimeEntries = [];
            (task.assigned_employees_data || []).forEach(assignedEmployee => {
                const employeeObject = allEmployees.find(emp => emp.id === assignedEmployee.employee_id);
                const employeeName = employeeObject ? getEmployeeName(employeeObject) : '';
                (assignedEmployee.time_entries || []).forEach(entry => {
                    initialTimeEntries.push({
                        employee: employeeName,
                        start_time: entry.start_time ? moment(entry.start_time) : null,
                        end_time: entry.end_time ? moment(entry.end_time) : null,
                        notes: entry.notes || '',
                    });
                });
            });

            form.setFieldsValue({
                notes: task.notes,
                time_entries: initialTimeEntries,
            });
        }
    }, [task, form, allEmployees, getEmployeeName]);

    const handleFinish = async (values) => {
        setIsSaving(true);
        try {
            const headers = { Authorization: `Token ${token}` };
            const loggedInUserName = user?.full_name || user?.email || 'Logged-in User';

            const existingTimeEntries = task.time_entries || [];
            const newTimeEntries = (values.time_entries || []).map(entry => ({
                employee_name: loggedInUserName,
                start_time: entry.start_time ? entry.start_time.toISOString() : null,
                end_time: entry.end_time ? entry.end_time.toISOString() : null,
                notes: entry.notes || null,
            }));

            const allTimeEntries = [...existingTimeEntries, ...newTimeEntries];

            let newStatus = task.status;
            if (newStatus === 'To Do' && allTimeEntries.some(entry => entry.start_time)) {
            newStatus = 'In Progress';
            }

            // 🔑 Recalculate total hours
            const recalculatedHours = calculateTotalHours([{
            employee_name: loggedInUserName,
            time_entries: allTimeEntries,
            }]);

            const updatedTask = {
            ...task,
            status: newStatus,
            notes: values.notes,   // ✅ update comments
            time_entries: allTimeEntries,
            total_hours: recalculatedHours, // ✅ update total hours
            };

            await api.put(`/clients/tasks/${task.id}/`, {
                ...updatedTask,
                assigned_employees_data: [{
                    employee_name: loggedInUserName,
                    time_entries: newTimeEntries,
                }]
                }, { headers });

            // ✅ Re-fetch latest from DB
            await fetchTaskDetails(task.id);

            message.success('Task updated successfully!');
            onTaskUpdated();
            form.resetFields();

            // ✅ instantly reflect in UI
            setTask(updatedTask);

            onTaskUpdated();
            form.resetFields();
        } catch (error) {
            console.error('TaskEditModal: Failed to update task:', error);
            message.error(`Failed to update task: ${error.response?.data ? JSON.stringify(error.response.data) : error.message}`);
        } finally {
            setIsSaving(false);
        }
    };




    return (
        <Modal
            title={`Task Details: ${task?.task_id || ''} - (${task?.sub_service_name || ''})`}
            open={visible}
            onCancel={handleClose}
            width={800}
            // bodyStyle={{ maxHeight: '70vh', overflowY: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            bodyStyle={{ padding: 0 }}
            style={{ top: 60 }}
            footer={[
                !isTaskDone && (
                <Button
                    key="complete"
                    icon={<CheckCircleOutlined />}
                    onClick={handleCompleteTask}
                    loading={isCompleting}
                    style={{ float: 'left' }}
                    disabled={!(task?.proof_file || proofNotRequired)}
                >
                    Completed
                </Button>
                ),
                <Button key="close" onClick={handleClose}>
                Close
                </Button>,
                !isTaskDone && (
                <Button key="submit" type="primary" loading={isSaving} onClick={() => form.submit()}>
                    Save
                </Button>
                ),
            ]}
            >
            <div
                ref={modalBodyRef}
                style={{
                maxHeight: '70vh',
                overflowY: 'auto',
                padding: '24px',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none'
                }}
            >
            {isLoading ? (
                <div style={{ textAlign: 'center', padding: '50px' }}></div>
            ) : error ? (
                <div style={{ padding: '20px' }}>
                <Text type="danger">{error}</Text>
                </div>
            ) : task ? (
                <div>
                {/* Task Details */}
                <Descriptions column={{ xs: 1, sm: 2, md: 2, lg: 3 }} layout="vertical">
                    <Descriptions.Item label="Client">{task.client_name}</Descriptions.Item>
                    <Descriptions.Item label="Period">{task.period}</Descriptions.Item>
                    <Descriptions.Item label="Status">
                    <Tag color={getStatusColor(task.status)}>{task.status}</Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Due Date">{moment(task.due_date).format('DD MMM YYYY')}</Descriptions.Item>
                    <Descriptions.Item label="Assigned Team">{task.team_name}</Descriptions.Item>
                    <Descriptions.Item label="SPOC">{task.spoc_name}</Descriptions.Item>
                    <Descriptions.Item label="Total Hours" style={{ textAlign: 'left' }}>
                    {formatDurationFromHours(
                        task.total_hours !== null && task.total_hours !== undefined
                        ? task.total_hours
                        : calculateTotalHours(task.assigned_employees_data || [])
                    )}
                    </Descriptions.Item>
                    <Descriptions.Item label="Created By" style={{ textAlign: 'left' }}>
                    {task.created_by_username || 'System'}
                    </Descriptions.Item>
                    {task.file && (
                    <Descriptions.Item label="Related File" style={{ textAlign: 'left' }}>
                        <a href={task.file} target="_blank" rel="noopener noreferrer">
                        {getFileName(task.file)}
                        </a>
                    </Descriptions.Item>
                    )}
                </Descriptions>

                <Divider />

                {/* Assigned Employees & Time Entries */}
                <Title level={5}>Assigned Employees & Time Entries</Title>
                {task.time_entries && task.time_entries.length > 0 ? (
                    groupedEntries.map((employee, empIndex) => (
                    <div
                        key={empIndex}
                        style={{ marginBottom: '20px', border: '1px solid #f0f0f0', padding: '15px', borderRadius: '8px' }}
                    >
                        <Title level={5} style={{ marginTop: 0, marginBottom: 10 }}>
                        <UserOutlined style={{ marginRight: 8 }} />
                        {employee.employee_name}
                        </Title>
                        <Table
                        dataSource={employee.time_entries || []}
                        columns={timeEntriesColumns}
                        pagination={false}
                        rowKey={(record, index) => `${empIndex}-${index}`}
                        size="small"
                        />
                    </div>
                    ))
                ) : (
                    <Text type="secondary">No employee time entries recorded.</Text>
                )}

                <Divider />

                {/* Time Logs Form */}
                <Form form={form} layout="vertical" onFinish={handleFinish} preserve={false}>
                    <Divider orientation="left">Time Logs</Divider>
                    <Form.List name="time_entries">
                    {(timeFields, { add: addTimeEntry, remove: removeTimeEntry }) => (
                        <>
                        {timeFields.map(({ key: timeKey, name: timeName, ...timeRestField }) => (
                            <Row key={timeKey} gutter={15} align="middle" style={{ marginBottom: 8 }}>
                            <Col span={6}>
                                <Form.Item name={[timeName, 'start_time']} noStyle>
                                <DatePicker
                                    showTime={{ minuteStep: 5, use12Hours: true, format: 'h:mm A' }}
                                    format="YYYY-MM-DD h:mm A"
                                    placeholder="Start Time"
                                    value={startTime}
                                    style={{ width: '100%' }}
                                    onChange={(value) => setStartTime(value)}
                                />
                                </Form.Item>
                            </Col>
                            <Col span={6}>
                                <Form.Item name={[timeName, 'end_time']} noStyle>
                                <DatePicker
                                    showTime={{ minuteStep: 5, use12Hours: true, format: 'h:mm A' }}
                                    format="YYYY-MM-DD h:mm A"
                                    placeholder="End Time"
                                    style={{ width: '100%' }}
                                    disabledDate={(currentDate) =>
                                    startTime ? currentDate && currentDate < startTime.startOf('day') : false
                                    }
                                    disabledTime={(currentDate) => {
                                    if (!startTime) return {};
                                    if (currentDate && currentDate.isSame(startTime, 'day')) {
                                        return {
                                        disabledHours: () =>
                                            Array.from({ length: 24 }, (_, i) => i).filter((hour) => hour < startTime.hour()),
                                        disabledMinutes: (hour) =>
                                            hour === startTime.hour()
                                            ? Array.from({ length: 60 }, (_, i) => i).filter(
                                                (minute) => minute < startTime.minute()
                                                )
                                            : [],
                                        };
                                    }
                                    return {};
                                    }}
                                />
                                </Form.Item>
                            </Col>
                            <Col span={11}>
                                <Form.Item {...timeRestField} name={[timeName, 'notes']} noStyle>
                                <Input placeholder="Comment" />
                                </Form.Item>
                            </Col>
                            <Col span={1}>
                                <MinusCircleOutlined onClick={() => removeTimeEntry(timeName)} style={{ color: 'red' }} />
                            </Col>
                            </Row>
                        ))}
                        <Form.Item>
                            <Button type="dashed" onClick={() => addTimeEntry({ notes: '' })} block icon={<ClockCircleOutlined />}>
                            Add Time Entry
                            </Button>
                        </Form.Item>
                        </>
                    )}
                    </Form.List>
                </Form>

                <Divider />

                {/* ✅ Proof Section */}
                <Descriptions.Item label="Proof File" span={1}>
                    {task?.proof_file ? (
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        Proof:
                        <a href={task.proof_file} target="_blank" rel="noopener noreferrer">
                        {getproofFileName(task.proof_file)}
                        </a>

                        {/* Allow clearing only if task NOT Done */}
                        {task?.status !== "Done" && (
                        <DeleteOutlined
                            style={{ color: "red", cursor: "pointer", fontSize: "12px" }}
                            onClick={async () => {
                            try {
                                await api.patch(`/clients/tasks/${task.id}/`, { proof_file: null }, {
                                headers: { Authorization: `Token ${token}` },
                                });
                                message.success("Proof file cleared");
                                setTask((prev) => ({ ...prev, proof_file: null }));
                                onTaskUpdated();
                            } catch (err) {
                                console.error("Clear proof failed:", err);
                                message.error("Failed to clear proof file");
                            }
                            }}
                        />
                        )}
                    </div>
                    ) : (
                    // Upload only if task NOT Done
                    task?.status !== "Done" && (
                        <Upload
                        name="proof_file"
                        showUploadList={false}
                        customRequest={async ({ file, onSuccess, onError }) => {
                            const formData = new FormData();
                            formData.append("proof_file", file);

                            try {
                            const response = await api.patch(`/clients/tasks/${task.id}/`, formData, {
                                headers: {
                                Authorization: `Token ${token}`,
                                "Content-Type": "multipart/form-data",
                                },
                            });
                            message.success("Proof file uploaded successfully");
                            setTask((prev) => ({
                                ...prev,
                                proof_file: response.data.proof_file,
                            }));
                            onTaskUpdated();
                            onSuccess("ok");
                            } catch (err) {
                            console.error("Upload failed:", err);
                            message.error("Proof file upload failed");
                            onError(err);
                            }
                        }}
                        >
                        <Button icon={<UploadOutlined />}>Upload Proof</Button>
                        </Upload>
                    )
                    )}
                </Descriptions.Item>
                <br />

                {/* Proof Not Required Checkbox */}
                {!task?.proof_file && task?.status !== "Done" && (
                    <Checkbox
                    style={{ marginTop: 8 }}
                    checked={proofNotRequired}
                    onChange={(e) => setProofNotRequired(e.target.checked)}
                    >
                    Proof not required
                    </Checkbox>
                )}
                </div>
            ) : null}
            </div>
            </Modal>

    );
};

// const TaskEditModal = ({ visible, task, onClose, onTaskUpdated, allEmployees }) => {
//     const [form] = Form.useForm();
//     const { authToken } = useAuth();
//     const token = authToken || localStorage.getItem('accessToken') || localStorage.getItem('token');
//     const { message } = App.useApp();
//     const [isSaving, setIsSaving] = useState(false);
//     // const [startTime, setStartTime] = React.useState(null);
//     const [startTime, setStartTime] = useState(moment());
//     const { showSpinner, hideSpinner } = useContext(SpinnerContext);

//     const getEmployeeName = useCallback((employee) => {
//         if (!employee) {
//             return 'N/A';
//         }
//         if (employee.full_name) {
//             return employee.full_name;
//         } else if (employee.first_name || employee.last_name) {
//             return `${employee.first_name || ''} ${employee.last_name || ''}`.trim();
//         }
//         return employee.id;
//     }, []);

//     const getEmployeeByName = useCallback((fullName) => {
//         return allEmployees.find(emp => getEmployeeName(emp) === fullName);
//     }, [allEmployees, getEmployeeName]);

//     useEffect(() => {
//         if (task && form) {
//             const initialTimeEntries = [];
//             (task.assigned_employees_data || []).forEach(assignedEmployee => {
//                 const employeeObject = allEmployees.find(emp => emp.id === assignedEmployee.employee_id);
//                 const employeeName = employeeObject ? getEmployeeName(employeeObject) : '';
//                 (assignedEmployee.time_entries || []).forEach(entry => {
//                     initialTimeEntries.push({
//                         employee: employeeName,
//                         start_time: entry.start_time ? moment(entry.start_time) : null,
//                         end_time: entry.end_time ? moment(entry.end_time) : null,
//                         comments: entry.comments || '',
//                     });
//                 });
//             });

//             form.setFieldsValue({
//                 comments: task.comments,
//                 time_entries: initialTimeEntries,
//             });
//         }
//     }, [task, form, allEmployees, getEmployeeName]);

//     const handleFinish = async (values) => {
//         setIsSaving(true);
//         try {
//             const headers = { Authorization: `Token ${token}` };

//             let newStatus = task.status;
//             if (newStatus === 'To Do' && (values.time_entries || []).some(entry => entry.start_time)) {
//                 newStatus = 'In Progress';
//             }

//             const assigned_employees_data = [{
//                 employee_name: "Logged-in User",
//                 time_entries: (values.time_entries || []).map(entry => ({
//                     start_time: entry.start_time ? entry.start_time.toISOString() : null,
//                     end_time: entry.end_time ? entry.end_time.toISOString() : null,
//                     comments: entry.comments || null,
//                 })),
//             }];

//             const updatedTask = {
//                 ...task,
//                 status: newStatus,
//                 comments: values.comments,
//                 assigned_employees_data,
//             };

//             await api.put(`/clients/tasks/${task.id}/`, updatedTask, { headers });
//             message.success('Task updated successfully!');
//             onClose();
//             onTaskUpdated();
//         } catch (error) {
//             console.error('TaskEditModal: Failed to update task:', error);
//             message.error(`Failed to update task: ${error.response?.data ? JSON.stringify(error.response.data) : error.message}`);
//         } finally {
//             setIsSaving(false);
//         }
//     };

//     return (
//         <Modal
//     title={`Time Logs: ${task?.task_id || ''} ${task?.sub_service_name ? `(${task.sub_service_name})` : ''}`}
//     open={visible}
//     onCancel={onClose}
//     width={800}
//     footer={[
//         <Button key="back" onClick={onClose}> Cancel </Button>,
//         <Button key="submit" type="primary" loading={isSaving} onClick={() => form.submit()}> Save </Button>,
//     ]}
// >
//     <Form form={form} layout="vertical" onFinish={handleFinish} preserve={false}>
//         <Divider orientation="left">Time Logs</Divider>
//         <Form.List name="time_entries">
//             {(timeFields, { add: addTimeEntry, remove: removeTimeEntry }) => (
//                 <>
//                     {timeFields.map(({ key: timeKey, name: timeName, ...timeRestField }) => (
//                         <Row key={timeKey} gutter={15} align="middle" style={{ marginBottom: 8 }}>
//                             <Col span={6}>
//                                 <Form.Item name={[timeName, 'start_time']} noStyle>
//                                     <DatePicker
//                                         showTime={{ minuteStep: 5, use12Hours: true, format: 'h:mm A' }}
//                                         format="YYYY-MM-DD h:mm A"
//                                         placeholder="Start Time"
//                                         value={startTime}
//                                         style={{ width: '100%' }}
//                                         onChange={(value) => setStartTime(value)}
//                                     />
//                                     </Form.Item>
//                             </Col>
//                             <Col span={6}>
//                                 <Form.Item name={[timeName, 'end_time']} noStyle>
//                                 <DatePicker
//                                     showTime={{ minuteStep: 30, use12Hours: true, format: 'h:mm A' }}
//                                     format="YYYY-MM-DD h:mm A"
//                                     placeholder="End Time"
//                                     style={{ width: '100%' }} 

//                                     disabledDate={(currentDate) => {
//                                     return startTime ? currentDate && currentDate < startTime.startOf('day') : false;
//                                     }}
//                                     disabledTime={(currentDate) => {
//                                     if (!startTime) return {};
//                                     if (currentDate && currentDate.isSame(startTime, 'day')) {
//                                         return {
//                                         disabledHours: () => Array.from({ length: 24 }, (_, i) => i).filter(hour => hour < startTime.hour()),
//                                         disabledMinutes: (hour) => hour === startTime.hour() ? Array.from({ length: 60 }, (_, i) => i).filter(minute => minute < startTime.minute()) : [],
//                                         };
//                                     }
//                                     return {};
//                                     }}
//                                 />
//                                 </Form.Item>
//                             </Col>
//                             <Col span={11}>
//                                 <Form.Item {...timeRestField} name={[timeName, 'comments']} noStyle >
//                                     <Input placeholder="Comment" />
//                                 </Form.Item>
//                             </Col>
//                             <Col span={1}>
//                                 <MinusCircleOutlined onClick={() => removeTimeEntry(timeName)} style={{ color: 'red' }} />
//                             </Col>
//                         </Row>
//                     ))}
//                     <Form.Item>
//                         <Button type="dashed" onClick={() => addTimeEntry({ comments: '' })} block icon={<ClockCircleOutlined />}>
//                             Add Time Entry
//                         </Button>
//                     </Form.Item>
//                 </>
//             )}
//         </Form.List>
//     </Form>
// </Modal>
//     );
// };

// const KanbanBoardView = ({ tasks, spocs, subservices, onTaskClick }) => {
//     const getTasksByStatus = (status) => {
//         return tasks.filter((task) => task.status === status);
//     };

//     const getSubserviceName = (subserviceId) => {
//         const service = subservices.find(s => s.id === subserviceId);
//         return service ? service.name : 'N/A';
//     };

//     const renderTaskCard = (task) => (
//         <Card
//             key={task.id}
//             style={{ marginBottom: '16px', borderLeft: '4px solid #1890ff' }}
//             hoverable
//             onClick={() => onTaskClick(task.id)}
//         >
//             <Title level={5} style={{ margin: 0 }}>
//                 <TagOutlined style={{ marginRight: 4 }} /> {getSubserviceName(task.sub_service)}
//             </Title>
//             <Text type="secondary" style={{ display: 'block', marginBottom: '8px' }}>
//                 {task.task_id || ''}
//             </Text>
//             <Space direction="vertical" size="small">
//                 <Text>
//                     <CalendarOutlined style={{ marginRight: 4 }} /> Due Date: {task.due_date}
//                 </Text>
//             </Space>
//         </Card>
//     );

//     return (
//         <Spin spinning={false} tip="Loading tasks...">
//             <Row gutter={16}>
//                 {['To Do', 'In Progress', 'Over Due', 'Done'].map((status) => (
//                     <Col xs={24} sm={12} md={8} key={status}>
//                         <Card title={<Title level={4}>{status}</Title>} style={{ minHeight: '500px' }}>
//                             {getTasksByStatus(status).map(renderTaskCard)}
//                         </Card>
//                     </Col>
//                 ))}
//             </Row>
//         </Spin>
//     );
// };



const TaskTableView = ({ tasks, clients, spocs, subservices, teams, onTaskClick, pagination, setPagination }) => {
    const [totalRecordsCount, setTotalRecordsCount] = useState(0);
    const { showSpinner, hideSpinner } = useContext(SpinnerContext);

    const getClientName = (clientId) => {
        const client = clients.find(c => c.id === clientId);
        return client ? client.name : 'N/A';
    };
    const getSpocName = (spocId) => {
        const spoc = spocs.find(s => s.id === spocId);
        return spoc ? (spoc.name || spoc.email) : 'N/A';
    };
    const getTeamName = (teamId) => {
        const team = teams.find(t => t.id === teamId);
        return team ? team.name : 'N/A';
    };
    const getSubserviceName = (subserviceId) => {
        const service = subservices.find(s => s.id === subserviceId);
        return service ? service.name : 'N/A';
    };
    const getStatusColor = (status) => {
        switch (status) {
            case 'To Do': return 'green';
            case 'In Progress': return 'blue';
            case 'Done': return 'green';
            case 'Over Due': return 'red';
            default: return 'default';
        }
    };
    const columns = [
        {
            title: 'Sl No',
            key: 'serial_number',
            render: (text, record, index) => index + 1,
        },
        {
            title: 'Task ID',
            dataIndex: 'task_id',
            key: 'task_id',
            sorter: (a, b) => (a.task_id || '').localeCompare(b.task_id || ''),
        },
        {
            title: 'Date',
            dataIndex: 'created_at',
            key: 'created_at',
            render: (date) => moment(date).format('DD-MM-YYYY'),
            sorter: (a, b) => moment(a.created_at).unix() - moment(b.created_at).unix(),
        },
        {
            title: 'Client',
            dataIndex: 'client',
            key: 'client',
            render: (clientId) => getClientName(clientId),
            sorter: (a, b) => getClientName(a.client).localeCompare(getClientName(b.client)),
        },
        {
            title: 'Description',
            dataIndex: 'sub_service',
            key: 'sub_service',
            render: (subserviceId) => getSubserviceName(subserviceId),
            sorter: (a, b) => getSubserviceName(a.sub_service).localeCompare(getSubserviceName(b.sub_service)),
        },
        {
            title: 'SPOC',
            dataIndex: 'spoc',
            key: 'spoc',
            render: (spocId) => getSpocName(spocId),
            sorter: (a, b) => getSpocName(a.spoc).localeCompare(getSpocName(b.spoc)),
        },
        {
            title: 'Team',
            dataIndex: 'team',
            key: 'team',
            render: (teamId) => getTeamName(teamId),
            sorter: (a, b) => getTeamName(a.team).localeCompare(getTeamName(b.team)),
        },
        {
            title: 'Period',
            dataIndex: 'period',
            key: 'period',
            // render: (period) => formatPeriod(period),
            // sorter: (a, b) => moment(a.period).unix() - moment(b.period).unix(),
        },
        {
            title: 'Due Date',
            dataIndex: 'due_date',
            key: 'due_date',
            render: (date) => moment(date).format('YYYY-MM-DD'),
            sorter: (a, b) => moment(a.due_date).unix() - moment(b.due_date).unix(),
        },
        // {
        //     title: 'Status',
        //     dataIndex: 'status',
        //     key: 'status',
        //     render: (status) => (
        //         <Tag color={status === 'To Do' ? 'green' : status === 'In Progress' ? 'yellow' : status === 'Done' ? 'purple' : 'red'}>
        //             {status.toUpperCase()}
        //         </Tag>
        //     ),
        //     sorter: (a, b) => a.status.localeCompare(b.status),
        // },
        {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status, record) => {
        const color =
          status === "To Do"
            ? "green"
            : status === "In Progress"
            ? "yellow"
            : status === "Done"
            ? "purple"
            : "red";

        const tag = (
          <Tag color={color}>
            {status.toUpperCase()}
          </Tag>
        );

        // ✅ Tooltip ONLY for Done
        if (status === "Done") {
          return (
            <Tooltip
              title={
                <>
                  <div><b>Done by:</b> {record.marked_done_by_name || "Unknown"}</div>
                  <div>
                    <b>On:</b>{" "}
                    {record.marked_done_at
                      ? moment(record.marked_done_at).format("DD MMM YYYY, hh:mm A")
                      : "-"}
                  </div>
                </>
              }
              mouseEnterDelay={0.3}
            >
              {/* ⛔ prevent row click from killing tooltip */}
              <span
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
              >
                {tag}
              </span>
            </Tooltip>
          );
        }

        return tag;
      },
      sorter: (a, b) => a.status.localeCompare(b.status),
    },
        {
            title: 'Created By',
            dataIndex: 'created_by_username',
            key: 'created_by',
            render: (text) => text || 'System',
            sorter: (a, b) => (a.created_by_username || 'System').localeCompare(b.created_by_username || 'System'),
        },
    ];
    return (<Table
            dataSource={tasks}
            columns={columns}
            rowKey="id"
            size="small"
            bordered
            pagination={
                tasks.length > 20
                  ? {
                    current: pagination.current,
                    pageSize: pagination.pageSize,
                    total: tasks.length,   // 👈 always match to actual data
                    showSizeChanger: true,
                    pageSizeOptions: ['10', '20', '50', '100', tasks.length.toString()],
                    showTotal: (total, range) =>
                    pagination.pageSize === total
                        ? `Showing all ${total} records`
                        : `${range[0]}-${range[1]} of ${total} records`,
                    onChange: (page, pageSize) => {
                    setPagination({ current: page, pageSize });
                    },
                }: false
            }
            style={{ marginTop: 2, fontSize: '8px' }}
            components={{
                body: {
                row: (props) => <tr {...props} style={{ lineHeight: '1.2' }} />,
                cell: (props) => <td {...props} style={{ padding: '4px' }} />,
                },
            }}
            scroll={{ x: 'max-content' }}
            onRow={(record) => ({
                onClick: () => onTaskClick(record.id),
                style: { cursor: 'pointer' },
            })}
            />);

            };

const FilterForm = ({ clients, subservices, spocs, teams, allEmployees, onFilter, onReset, initialValues, isClientFilterDisabled }) => {
    const [form] = Form.useForm();
    const handleFinish = (values) => {
        onFilter(values);
    };

    const handleReset = () => {
        form.resetFields();
        onReset();
    };

    useEffect(() => {
        form.setFieldsValue(initialValues);
    }, [initialValues, form]);


    return (
        <Form form={form} layout="vertical" onFinish={handleFinish} style={{ marginTop: '16px', marginBottom: '24px' }}>
            <Row gutter={16}>
                <Col xs={24} sm={12} md={8} lg={6}>
                    <Form.Item name="client" label="Client">
                        <Select
                            placeholder="Select a Client"
                            allowClear
                            disabled={isClientFilterDisabled}
                            showSearch
                            optionFilterProp="children"
                            filterOption={(input, option) =>
                                option.children.toLowerCase().includes(input.toLowerCase())
                            }
                        >
                            {clients.map(client => (
                                <Option key={client.id} value={client.id}>{client.name}</Option>
                            ))}
                        </Select>
                    </Form.Item>
                </Col>

                <Col xs={24} sm={12} md={8} lg={6}>
                    <Form.Item name="subservice" label="Description">
                        <Select
                            placeholder="Select a Description"
                            allowClear
                            showSearch
                            optionFilterProp="children"
                            filterOption={(input, option) =>
                                option.children.toLowerCase().includes(input.toLowerCase())
                            }
                        >
                            {subservices.map(service => (
                                <Option key={service.id} value={service.id}>{service.name}</Option>
                            ))}
                        </Select>
                    </Form.Item>
                </Col>

                <Col xs={24} sm={12} md={8} lg={6}>
                    <Form.Item name="spoc" label="SPOC">
                        <Select
                            placeholder="Select a SPOC"
                            allowClear
                            showSearch
                            optionFilterProp="children"
                            filterOption={(input, option) =>
                                option.children.toLowerCase().includes(input.toLowerCase())
                            }
                        >
                            {spocs.map(spoc => (
                                <Option key={spoc.id} value={spoc.id}>{spoc.name}</Option>
                            ))}
                        </Select>
                    </Form.Item>
                </Col>

                <Col xs={24} sm={12} md={8} lg={6}>
                    <Form.Item name="team" label="Team">
                        <Select
                            placeholder="Select a Team"
                            allowClear
                            showSearch
                            optionFilterProp="children"
                            filterOption={(input, option) =>
                                option.children.toLowerCase().includes(input.toLowerCase())
                            }
                        >
                            {teams.map(team => (
                                <Option key={team.id} value={team.id}>{team.name}</Option>
                            ))}
                        </Select>
                    </Form.Item>
                </Col>

                <Col xs={24} sm={12} md={8} lg={6}>
                    <Form.Item name="status" label="Status">
                        <Select
                            placeholder="Select a Status"
                            allowClear
                            showSearch
                            optionFilterProp="children"
                            filterOption={(input, option) =>
                                option.children.toLowerCase().includes(input.toLowerCase())
                            }
                        >
                            <Option value="To Do">To Do</Option>
                            <Option value="In Progress">In Progress</Option>
                            <Option value="Done">Done</Option>
                            <Option value="Over Due">Over Due</Option>
                        </Select>
                    </Form.Item>
                </Col>

                <Col xs={24} sm={12} md={8} lg={6}>
                    <Form.Item name="createdBy" label="Created By">
                        <Select
                            placeholder="Select a User"
                            allowClear
                            showSearch
                            optionFilterProp="children"
                            filterOption={(input, option) =>
                                option.children.toLowerCase().includes(input.toLowerCase())
                            }
                        >
                            {allEmployees.map(employee => (
                                <Option key={employee.id} value={employee.id}>
                                    {employee.full_name || `${employee.first_name || ''} ${employee.last_name || ''}`.trim() || employee.id}
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>
                </Col>

                <Col xs={24} sm={12} md={8} lg={6}>
                    <Form.Item name="dateRange" label="Due Date Range">
                        <RangePicker style={{ width: '100%' }} />
                    </Form.Item>
                </Col>

                <Col xs={24} style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
                    <Space>
                        <Button onClick={handleReset}>
                            Reset
                        </Button>
                        <Button type="primary" htmlType="submit">
                            Apply Filters
                        </Button>
                    </Space>
                </Col>
            </Row>
        </Form>
    );
};

const JiraBoard = ({ statusFilter, clientIdFilter, onBack }) => {
    const { authToken, user } = useAuth(); //  <-- Added 'user' here
    const token = authToken || sessionStorage.getItem('token');
    const { message } = App.useApp();
    const { showSpinner, hideSpinner } = useContext(SpinnerContext);

    const [isLoading, setIsLoading] = useState(false);
    const [tasks, setTasks] = useState([]);
    const [clients, setClients] = useState([]);
    const [spocs, setSpocs] = useState([]);
    const [subservices, setSubservices] = useState([]);
    const [teams, setTeams] = useState([]);
    const [allEmployees, setAllEmployees] = useState([]);

    const [filterValues, setFilterValues] = useState({});
    const [filteredTasks, setFilteredTasks] = useState([]);
    const [pagination, setPagination] = useState({ current: 1, pageSize: 20 });

    const [isTaskDetailModalVisible, setIsTaskDetailModalVisible] = useState(false);
    const [isTaskEditModalVisible, setIsTaskEditModalVisible] = useState(false);
    const [isCreateTaskModalVisible, setIsCreateTaskModalVisible] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const [currentView, setCurrentView] = useState('table');

    useEffect(() => {
        const initialFilters = {};
        if (statusFilter) {
            initialFilters.status = statusFilter;
        }
        if (clientIdFilter) {
            initialFilters.client = clientIdFilter;
        }
        setFilterValues(initialFilters);
    }, [statusFilter, clientIdFilter]);

    const handleTaskClick = (taskId) => {
        const task = filteredTasks.find(t => t.id === taskId);
        setSelectedTask(task);
        setIsTaskDetailModalVisible(true);
    };

    const handleOpenEditModal = (task) => {
        setSelectedTask(task);
        setIsTaskDetailModalVisible(false);
        setIsTaskEditModalVisible(true);
    };

    const handleCloseEditModal = () => {
        setIsTaskEditModalVisible(false);
        setSelectedTask(null);
    };

    const fetchAllData = useCallback(async () => {
        if (!token) {
            message.error("Authentication token not found.");
            return;
        }

        setIsLoading(true);
        const headers = { Authorization: `Token ${token}` };

        try {
            const [
                tasksResponse,
                clientsResponse,
                spocsResponse,
                subservicesResponse,
                teamsResponse,
                employeesResponse,
            ] = await Promise.all([
                api.get('/clients/tasks/', { headers }),
                api.get('/clients/clients/', { headers }),
                api.get('/clients/spocs/', { headers }),
                api.get('/clients/subservices/', { headers }),
                api.get('/employee/teams/', { headers }),
                api.get('/employee/employees/', { headers }),
            ]);

            setTasks(tasksResponse.data);
            setClients(clientsResponse.data);
            setSpocs(spocsResponse.data);
            setSubservices(subservicesResponse.data);
            setTeams(teamsResponse.data);
            setAllEmployees(employeesResponse.data);
        } catch (err) {
            console.error('JiraBoard: Failed to fetch all data:', err);
            message.error('Failed to load dashboard data.');
        } finally {
            setIsLoading(false);
        }
    }, [token, message]);

    useEffect(() => {
        fetchAllData();
    }, [fetchAllData]);

    useEffect(() => {
        let tempTasks = tasks.map(task => ({
            ...task,
            status: getEffectiveTaskStatus(task),
        }));

        if (filterValues.client) {
            tempTasks = tempTasks.filter(task => task.client === filterValues.client);
        }
        if (filterValues.subservice) {
            tempTasks = tempTasks.filter(task => task.sub_service === filterValues.subservice);
        }
        if (filterValues.spoc) {
            tempTasks = tempTasks.filter(task => task.spoc === filterValues.spoc);
        }
        if (filterValues.team) {
            tempTasks = tempTasks.filter(task => task.team === filterValues.team);
        }
        if (filterValues.status && filterValues.status !== 'all') {
            tempTasks = tempTasks.filter(task => task.status === filterValues.status);
        }
        if (filterValues.createdBy) {
            tempTasks = tempTasks.filter(task => task.created_by === filterValues.createdBy);
        }
        if (filterValues.dateRange && filterValues.dateRange.length === 2) {
            const [startDate, endDate] = filterValues.dateRange;
            tempTasks = tempTasks.filter(task => {
                const dueDate = moment(task.due_date);
                return dueDate.isSameOrAfter(startDate, 'day') && dueDate.isSameOrBefore(endDate, 'day');
            });
        }

        setFilteredTasks(tempTasks);

    }, [tasks, filterValues]);

    useEffect(() => {
            const handleKeyNav = (e) => {
              const tag = e.target.tagName.toLowerCase();
        
              // Don't trigger if typing in an input field
              if (tag === 'input' || tag === 'textarea') return;
        
              // Handle Escape and Backspace
              // if (e.key === 'Backspace') {
              //   e.preventDefault();
              //   navigateToParentFolder();
              // }
        
              // Handle Ctrl + R for refresh
              if (e.ctrlKey && e.key === 'r') {
                e.preventDefault(); // Prevents the default browser refresh
                fetchAllData();
              }
            };
        
            window.addEventListener('keydown', handleKeyNav);
            return () => window.removeEventListener('keydown', handleKeyNav);
          }, [fetchAllData]);

    const exportToExcel = (tasksToExport, fileNamePrefix) => {

        console.log("exportToExcel called");
        console.log("tasksToExport length:", tasksToExport?.length);
        console.log("First task:", tasksToExport?.[0]);
        console.log("total_hours:", tasksToExport?.[0]?.total_hours);
        console.log("time_entries:", tasksToExport?.[0]?.time_entries);
        const headers = [
          'Sl No', 'Task ID', 'Date', 'Client', 'Description', 'SPOC',
          'Team', 'Period', 'Due Date', 'Status', 'Created By', 'Total Hours',
        ];
    
        const data = tasksToExport.map((task, index) => {
          
          
          const clientName = clients.find(c => c.id === task.client)?.name || 'N/A';
          const subserviceName = subservices.find(s => s.id === task.sub_service)?.name || 'N/A';
          const spocName = spocs.find(s => s.id === task.spoc)?.name || 'N/A';
          const teamName = teams.find(t => t.id === task.team)?.name || 'N/A';
          const createdByUsername = task.created_by_name  || 'System';
          const formattedCreatedAt = moment(task.created_at).format('DD-MM-YYYY');
          const formattedPeriod = task.period || 'N/A';
          const formattedDueDate = moment(task.due_date).format('YYYY-MM-DD');
    
          const totalHours = task.total_hours !== null && task.total_hours !== undefined
            ? formatDurationFromHours(task.total_hours)
            : formatDurationFromHours(calculateTotalHours(task.assigned_employees_data || []));

          
    
          return [
            index + 1,
            task.task_id,
            formattedCreatedAt,
            clientName,
            subserviceName,
            spocName,
            teamName,
            formattedPeriod,
            formattedDueDate,
            task.status,
            createdByUsername,
            totalHours,
          ];
        });
    
        const allData = [headers, ...data];
        const worksheet = XLSX.utils.aoa_to_sheet(allData);
    
        const headerStyle = {
          font: { bold: true, color: { rgb: "FFFFFF" } },
          fill: { fgColor: { rgb: "01263a" } },
          border: { top: { style: "thin" }, right: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" } }
        };
        const cellStyle = {
          border: { top: { style: "thin" }, right: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" } }
        };
    
        const range = XLSX.utils.decode_range(worksheet['!ref']);
        for (let R = range.s.r; R <= range.e.r; ++R) {
          for (let C = range.s.c; C <= range.e.c; ++C) {
            const cellref = XLSX.utils.encode_cell({ r: R, c: C });
            if (!worksheet[cellref]) continue;
            worksheet[cellref].s = R === 0 ? headerStyle : cellStyle;
          }
        }
    
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Tasks');
    
        const today = moment().format('YYYY-MM-DD');
        const userName = user?.full_name?.replace(/\s/g, '_') || 'exported';
        const fileName = `${userName}_${fileNamePrefix}_${today}.xlsx`;
    
        XLSX.writeFile(workbook, fileName);
      };

    const handleMenuClick = ({ key }) => {
        if (key === "all") {
          exportToExcel(filteredTasks, "all_tasks");
        } else if (key === "current") {
          const start = (pagination.current - 1) * pagination.pageSize;
          const end = start + pagination.pageSize;
          const currentPageTasks = filteredTasks.slice(start, end);
          exportToExcel(currentPageTasks, `page_${pagination.current}_tasks`);
        }
    };

    const downloadMenu = (
    <Menu
        onClick={handleMenuClick}
        items={[
        { key: "all", label: "Download All" },
        { key: "current", label: "Download Current Page" },
        ]}
    />
    );

    return (
        <App>
            <div
                style={{
                padding: '24px',
                background: 'linear-gradient(to right, #f8f9fa, #e0e7ff)',
                borderRadius: '12px',
                boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)',
                }}
            >
                <Row justify="space-between" align="middle" style={{ marginBottom: '24px' }}>
                    <Col>
                        <Title level={2} style={{ margin: 0 }}>
                            {clientIdFilter ? `Tasks for ${clients.find(c => c.id === clientIdFilter)?.name || 'Client'}` : 'STT Record1'}
                        </Title>
                    </Col>
                    <Col>
                        <Space>
                            {clientIdFilter && (
                                <Button icon={<LeftOutlined />} onClick={onBack}>
                                    Back to Dashboard
                                </Button>
                            )}
                            <Button
                                // type="primary"
                                icon={<PlusOutlined />}
                                onClick={() => setIsCreateTaskModalVisible(true)}
                            >
                                Create New Task
                            </Button>
                            <CreateMonthlyTasksButton />
                            <Dropdown overlay={downloadMenu} trigger={['click']}>
                                <Button icon={<DownloadOutlined />}>
                                    Download 
                                </Button>
                            </Dropdown>
                            <Button type="default" icon={<ReloadOutlined />} onClick={fetchAllData}>
                                Refresh
                            </Button>
                        </Space>
                    </Col>
                </Row>
                <Collapse
                    items={[{
                        key: '1',
                        label: <div style={{ fontWeight: 'bold', fontSize: 19 }}><FilterOutlined /> Filters</div>,
                        children: (
                            <FilterForm
                                clients={clients}
                                subservices={subservices}
                                spocs={spocs}
                                teams={teams}
                                allEmployees={allEmployees}
                                onFilter={setFilterValues}
                                onReset={() => setFilterValues(clientIdFilter ? { client: clientIdFilter } : {})}
                                initialValues={{ ...filterValues }}
                                isClientFilterDisabled={!!clientIdFilter}
                            />
                        ),
                    }]}
                    bordered={false}
                    style={{ marginBottom: '24px' }}
                />
                    {/* {currentView === 'kanban' ? (
                        <KanbanBoardView
                            tasks={filteredTasks}
                            clients={clients}
                            spocs={spocs}
                            subservices={subservices}
                            teams={teams}
                            onTaskClick={handleTaskClick}
                            pagination={pagination}
                            setPagination={setPagination}
                        />
                    ) : (
                        <TaskTableView
                            tasks={filteredTasks}
                            clients={clients}
                            spocs={spocs}
                            subservices={subservices}
                            teams={teams}
                            onTaskClick={handleTaskClick}
                            pagination={pagination}
                            setPagination={setPagination}
                        />
                    )} */}

                <TaskTableView
                            tasks={filteredTasks}
                            clients={clients}
                            spocs={spocs}
                            subservices={subservices}
                            teams={teams}
                            onTaskClick={handleTaskClick}
                            pagination={pagination}
                            setPagination={setPagination}
                        />

                <TaskDetailView
                    visible={isTaskDetailModalVisible}
                    taskId={selectedTask?.id}
                    onClose={() => {
                        setIsTaskDetailModalVisible(false);
                        setSelectedTask(null);
                    }}
                    onOpenEditModal={handleOpenEditModal}
                    onTaskUpdated={fetchAllData}
                    allEmployees={allEmployees}
                />

                {/* {selectedTask && (
                    <TaskEditModal
                        visible={isTaskEditModalVisible}
                        task={selectedTask}
                        onClose={handleCloseEditModal}
                        onTaskUpdated={fetchAllData}
                        allEmployees={allEmployees}
                    />
                )} */}

                <CreateTaskModal
                    visible={isCreateTaskModalVisible}
                    onClose={() => setIsCreateTaskModalVisible(false)}
                    clients={clients}
                    spocs={spocs}
                    subservices={subservices}
                    teams={teams}
                    onTaskCreated={fetchAllData}
                />
            </div>
        </App>
    );
};

export default JiraBoard;