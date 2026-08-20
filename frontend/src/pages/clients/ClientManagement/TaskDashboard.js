// // // // // // // // // import React, { useState, useEffect, useCallback } from 'react';
// // // // // // // // // import {
// // // // // // // // //     Card, Col, Row, Spin, Typography, message, Table, DatePicker, Select,
// // // // // // // // //     Space, Button, Segmented, Collapse, Modal
// // // // // // // // // } from 'antd';
// // // // // // // // // import { api } from '../../../services/api';
// // // // // // // // // import EChartsReact from 'echarts-for-react';
// // // // // // // // // import CountUp from 'react-countup';
// // // // // // // // // import {
// // // // // // // // //     ClockCircleOutlined,
// // // // // // // // //     CheckCircleOutlined,
// // // // // // // // //     MinusCircleOutlined,
// // // // // // // // //     ExclamationCircleOutlined,
// // // // // // // // //     FilterOutlined,
// // // // // // // // //     ClearOutlined
// // // // // // // // // } from '@ant-design/icons';
// // // // // // // // // import { FcList } from "react-icons/fc";
// // // // // // // // // import moment from 'moment'; // Add this import statement
// // // // // // // // // import { formatDurationFromMillis } from './STT_Records';
// // // // // // // // // import { MdOutlineOpenInNew } from "react-icons/md";
// // // // // // // // // import { useNavigate } from "react-router-dom";


// // // // // // // // // const { Title, Text } = Typography;
// // // // // // // // // const { RangePicker } = DatePicker;
// // // // // // // // // const { Option } = Select;
// // // // // // // // // const { Panel } = Collapse;

// // // // // // // // // const TASK_STATUS_COLORS = {
// // // // // // // // //     'Done': '#68ad6eff',
// // // // // // // // //     'In Progress': '#e9d94aff',
// // // // // // // // //     'Over Due': '#bd4e44',
// // // // // // // // //     'To Do': '#5a54adff',
// // // // // // // // //     'All Tasks': '#414750ff'
// // // // // // // // // };

// // // // // // // // // const getTaskStatusOptions = (data) => {
// // // // // // // // //     const colorPalette = data.map(item => TASK_STATUS_COLORS[item.name] || '#ccc');
// // // // // // // // //     return {
// // // // // // // // //         title: { text: 'Task Status Overview', left: 'center', textStyle: { fontSize: 18, fontWeight: 'bold' } },
// // // // // // // // //         tooltip: { trigger: 'item', formatter: "{b} : {c} ({d}%)" },
// // // // // // // // //         legend: { orient: 'horizontal', bottom: 'bottom', left: 'center', padding: 5 },
// // // // // // // // //         series: [{
// // // // // // // // //             name: 'Task Status',
// // // // // // // // //             type: 'pie',
// // // // // // // // //             radius: '65%',
// // // // // // // // //             center: ['50%', '50%'],
// // // // // // // // //             data: data,
// // // // // // // // //             color: colorPalette,
// // // // // // // // //             label: { show: true, formatter: '{b}: {c}', fontSize: 12 },
// // // // // // // // //             labelLine: { show: true },
// // // // // // // // //             emphasis: { itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0, 0, 0, 0.5)' } },
// // // // // // // // //         }],
// // // // // // // // //     };
// // // // // // // // // };

// // // // // // // // // const DashboardCard = ({ title, value, icon, color, onClick }) => (
// // // // // // // // //     <Card
// // // // // // // // //         bordered={false}
// // // // // // // // //         hoverable
// // // // // // // // //         onClick={onClick}
// // // // // // // // //         style={{
// // // // // // // // //             backgroundColor: color,
// // // // // // // // //             color: 'white',
// // // // // // // // //             minHeight: 120,
// // // // // // // // //             display: 'flex',
// // // // // // // // //             flexDirection: 'column',
// // // // // // // // //             justifyContent: 'space-between',
// // // // // // // // //             borderRadius: '8px',
// // // // // // // // //             flex: 1,
// // // // // // // // //             cursor: 'pointer'
// // // // // // // // //         }}

// // // // // // // // //         bodyStyle={{ padding: '16px', flex: 1 }}
// // // // // // // // //     >
// // // // // // // // //         <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
// // // // // // // // //             {React.cloneElement(icon, { style: { fontSize: '24px', color: 'white' } })}
// // // // // // // // //             <Text style={{ marginLeft: 8, color: 'white', fontWeight: 'bold', fontSize: '16px' }}>{title}</Text>
// // // // // // // // //         </div>
// // // // // // // // //         <CountUp
// // // // // // // // //             end={value}
// // // // // // // // //             duration={2.5}
// // // // // // // // //             style={{ fontSize: '2em', fontWeight: 'bold', color: 'white', alignSelf: 'flex-end' }}
// // // // // // // // //         />
// // // // // // // // //     </Card>
// // // // // // // // // );

// // // // // // // // // // 🔑 SINGLE SOURCE OF TRUTH
// // // // // // // // // const calculateTotalHoursFromTasks = (tasks = []) => {
// // // // // // // // //   let totalMinutes = 0;

// // // // // // // // //   tasks.forEach(task => {
// // // // // // // // //     getFlatTimeEntries(task).forEach(entry => {
// // // // // // // // //       if (entry.start_time && entry.end_time) {
// // // // // // // // //         totalMinutes += moment
// // // // // // // // //           .duration(moment(entry.end_time).diff(moment(entry.start_time)))
// // // // // // // // //           .asMinutes();
// // // // // // // // //       }
// // // // // // // // //     });
// // // // // // // // //   });

// // // // // // // // //   return totalMinutes / 60;
// // // // // // // // // };


// // // // // // // // // // ✅ NORMALIZE time entries (handles BOTH shapes safely)
// // // // // // // // // // const getFlatTimeEntries = (task) => {
// // // // // // // // // //   if (!task?.time_entries) return [];

// // // // // // // // // //   // Shape A: flat entries
// // // // // // // // // //   if (task.time_entries.length && task.time_entries[0]?.start_time) {
// // // // // // // // // //     return task.time_entries;
// // // // // // // // // //   }

// // // // // // // // // //   // Shape B: nested under employee
// // // // // // // // // //   return task.time_entries.flatMap(emp =>
// // // // // // // // // //     emp?.time_entries || []
// // // // // // // // // //   );
// // // // // // // // // // };

// // // // // // // // // const getFlatTimeEntries = (task) => {
// // // // // // // // //   // 🔥 Support BOTH API shapes
// // // // // // // // //   if (task?.time_entries?.length) {
// // // // // // // // //     return task.time_entries;
// // // // // // // // //   }

// // // // // // // // //   if (task?.assigned_employees_data?.length) {
// // // // // // // // //     return task.assigned_employees_data.flatMap(emp =>
// // // // // // // // //       emp?.time_entries || []
// // // // // // // // //     );
// // // // // // // // //   }

// // // // // // // // //   return [];
// // // // // // // // // };




// // // // // // // // // const TaskDashboard = () => {
// // // // // // // // //     const [loading, setLoading] = useState(true);
// // // // // // // // //     const [dashboardData, setDashboardData] = useState(null);
// // // // // // // // //     const [error, setError] = useState(null);
// // // // // // // // //     const [dateRange, setDateRange] = useState(null);
// // // // // // // // //     const [clients, setClients] = useState([]);
// // // // // // // // //     const [selectedClient, setSelectedClient] = useState([]);
// // // // // // // // //     const [teams, setTeams] = useState([]);
// // // // // // // // //     const [selectedTeam, setSelectedTeam] = useState([]);
// // // // // // // // //     const [clientGroups, setClientGroups] = useState([]);
// // // // // // // // //     const [selectedClientGroup, setSelectedClientGroup] = useState([]);
// // // // // // // // //     const [allSpocs, setAllSpocs] = useState([]);
// // // // // // // // //     const [subServices, setSubServices] = useState([]);
// // // // // // // // //     const [tableView, setTableView] = useState('client');
// // // // // // // // //     const [taskCounts, setTaskCounts] = useState({ allTasks: 0, done: 0, toDo: 0, overdue: 0, inProgress: 0 });
// // // // // // // // //     const [activeFilterKey, setActiveFilterKey] = useState([]);
// // // // // // // // //     const [selectedClientDetails, setSelectedClientDetails] = useState(null);
// // // // // // // // //     const [clientTaskSummary, setClientTaskSummary] = useState(null);
// // // // // // // // //     const [showAllSubServices, setShowAllSubServices] = useState(false);
// // // // // // // // //     const [clientModalVisible, setClientModalVisible] = useState(false);
// // // // // // // // //     const [selectedClientId, setSelectedClientId] = useState(null);
// // // // // // // // //     const [currentView, setCurrentView] = useState('dashboard');
// // // // // // // // //     const [selectedSubService, setSelectedSubService] = useState([]);



// // // // // // // // //     const navigate = useNavigate();

// // // // // // // // //     const getSpocNameFromClient = (client) => {
// // // // // // // // //         if (!client) return 'N/A';
// // // // // // // // //         if (client.primary_spoc_name) return client.primary_spoc_name;
// // // // // // // // //         const group = clientGroups.find(g =>
// // // // // // // // //             g.clients?.some(cg => (typeof cg === 'object' ? cg.id : cg) === client.id)
// // // // // // // // //         );
// // // // // // // // //         if (group?.primary_spoc_name) return group.primary_spoc_name;
// // // // // // // // //         if (typeof client.primary_spoc === 'number') {
// // // // // // // // //             const spocObj = allSpocs.find(s => s.id === client.primary_spoc);
// // // // // // // // //             if (spocObj) return `${spocObj.first_name || ''} ${spocObj.last_name || ''}`.trim() || spocObj.user?.email || 'N/A';
// // // // // // // // //         }
// // // // // // // // //         return 'N/A';
// // // // // // // // //     };

// // // // // // // // //     const getGroupNameFromClient = (client) => {
// // // // // // // // //         if (!client) return "N/A";
// // // // // // // // //         const group = clientGroups.find(g =>
// // // // // // // // //             g.clients?.some(cg => (typeof cg === "object" ? cg.id : cg) === client.id)
// // // // // // // // //         );
// // // // // // // // //         return group ? group.group_name : "N/A";
// // // // // // // // //     };

// // // // // // // // //     const getSubServiceName = (id) => {
// // // // // // // // //         const svc = subServices.find(s => s.id === id);
// // // // // // // // //         return svc ? svc.name : "N/A";
// // // // // // // // //     };



// // // // // // // // //     const fetchInitialData = async () => {
// // // // // // // // //         try {
// // // // // // // // //             const [clientsResponse, teamsResponse, clientGroupsResponse, spocsResponse, subServicesResponse] = await Promise.all([
// // // // // // // // //                 api.get('/clients/clients/'),
// // // // // // // // //                 api.get('/employee/teams/'),
// // // // // // // // //                 api.get('/clients/client-groups/'),
// // // // // // // // //                 api.get('/employee/employees/'),
// // // // // // // // //                 api.get('/clients/subservices/'),
// // // // // // // // //             ]);
// // // // // // // // //             setClients(clientsResponse.data.results || clientsResponse.data);
// // // // // // // // //             setTeams(teamsResponse.data.results || teamsResponse.data);
// // // // // // // // //             setClientGroups(clientGroupsResponse.data.results || clientGroupsResponse.data);
// // // // // // // // //             setAllSpocs(spocsResponse.data.results || spocsResponse.data);
// // // // // // // // //             setSubServices(subServicesResponse.data.results || subServicesResponse.data);
// // // // // // // // //             fetchDashboardData({});
// // // // // // // // //         } catch (err) {
// // // // // // // // //             console.error('Failed to fetch initial data:', err);
// // // // // // // // //             setError('Failed to load initial data. Please try again later.');
// // // // // // // // //         } finally {
// // // // // // // // //             setLoading(false);
// // // // // // // // //         }
// // // // // // // // //     };

// // // // // // // // //     const fetchDashboardData = useCallback(async (filters = {}) => {
// // // // // // // // //         setLoading(true);
// // // // // // // // //         setError(null);
// // // // // // // // //         try {
// // // // // // // // //             const params = {
// // // // // // // // //                 start_date: filters.startDate?.format('YYYY-MM-DD'),
// // // // // // // // //                 end_date: filters.endDate?.format('YYYY-MM-DD'),
// // // // // // // // //                 client_id: filters.clientId?.join(','),
// // // // // // // // //                 team_id: filters.teamId?.join(','),
// // // // // // // // //                 client_group_id: filters.clientGroupId?.join(','),
// // // // // // // // //                 sub_service_id: filters.subServiceId?.join(','),
// // // // // // // // //             };
// // // // // // // // //             const response = await api.get('/clients/tasks/dashboard_data/', { params });
// // // // // // // // //             setDashboardData(response.data);
// // // // // // // // //         } catch (err) {
// // // // // // // // //             console.error('Failed to fetch dashboard data:', err);
// // // // // // // // //             setError('Failed to load dashboard data. Please try again later.');
// // // // // // // // //             message.error('Failed to load dashboard data.');
// // // // // // // // //         } finally {
// // // // // // // // //             setLoading(false);
// // // // // // // // //         }
// // // // // // // // //     }, []);

// // // // // // // // //     useEffect(() => { fetchInitialData(); }, []);
// // // // // // // // //     useEffect(() => {
// // // // // // // // //         const [startDate, endDate] = dateRange || [null, null];
// // // // // // // // //         fetchDashboardData({
// // // // // // // // //             startDate, endDate,
// // // // // // // // //             clientId: selectedClient,
// // // // // // // // //             teamId: selectedTeam,
// // // // // // // // //             clientGroupId: selectedClientGroup,
// // // // // // // // //             subServiceId: selectedSubService,
// // // // // // // // //         });
// // // // // // // // //     }, [dateRange, selectedClient, selectedTeam, selectedClientGroup, selectedSubService, fetchDashboardData]);

// // // // // // // // //     useEffect(() => {
// // // // // // // // //         if (dashboardData?.status_counts) {
// // // // // // // // //             const statusCounts = dashboardData.status_counts;

// // // // // // // // //             const toDoCount = statusCounts['To Do'] || 0;
// // // // // // // // //             const inProgressCount = statusCounts['In Progress'] || 0;
// // // // // // // // //             const doneCount = statusCounts['Done'] || 0;
// // // // // // // // //             const overdueCount = statusCounts['Over Due'] || 0;

// // // // // // // // //             setTaskCounts({
// // // // // // // // //                 allTasks: dashboardData.tasks?.length || 0, // ✅ TRUE total
// // // // // // // // //                 done: doneCount,
// // // // // // // // //                 toDo: toDoCount,
// // // // // // // // //                 inProgress: inProgressCount,
// // // // // // // // //                 overdue: overdueCount,
// // // // // // // // //                 });
// // // // // // // // //         }
// // // // // // // // //     }, [dashboardData]);



// // // // // // // // //     const handleClearFilters = () => {
// // // // // // // // //         setDateRange(null);
// // // // // // // // //         setSelectedClient([]);
// // // // // // // // //         setSelectedTeam([]);
// // // // // // // // //         setSelectedClientGroup([]);
// // // // // // // // //         setSelectedSubService([]);
// // // // // // // // //     };
    
// // // // // // // // //     // Utility function to calculate duration between two dates
// // // // // // // // //     const calculateDuration = (start, end) => {
// // // // // // // // //         if (!start || !end) return 0;
// // // // // // // // //         const diff = moment.duration(end.diff(start));
// // // // // // // // //         return diff.asMinutes();
// // // // // // // // //     };

// // // // // // // // //     // New function to process and summarize client tasks
// // // // // // // // //     const processClientTaskSummary = (tasks) => {
// // // // // // // // //         const relevantTasks = tasks.filter(task => {
// // // // // // // // //             const s = task.status?.toLowerCase();
// // // // // // // // //             return s === "done" || s === "in progress" || s === "over due";
// // // // // // // // //             });


// // // // // // // // //         const employeeTime = {};    // millis
// // // // // // // // //         const subServiceTime = {}; // millis
// // // // // // // // //         let totalClientTime = 0;

// // // // // // // // //         relevantTasks.forEach(task => {
// // // // // // // // //             const subName = getSubServiceName(task.sub_service) || "N/A";

// // // // // // // // //             getFlatTimeEntries(task).forEach(entry => {
// // // // // // // // //             if (entry.start_time && entry.end_time) {
// // // // // // // // //                 const millis = moment(entry.end_time).diff(moment(entry.start_time));
// // // // // // // // //                 if (millis > 0) {
// // // // // // // // //                 const employeeName = entry.employee_name || "N/A";

// // // // // // // // //                 employeeTime[employeeName] =
// // // // // // // // //                     (employeeTime[employeeName] || 0) + millis;

// // // // // // // // //                 subServiceTime[subName] =
// // // // // // // // //                     (subServiceTime[subName] || 0) + millis;

// // // // // // // // //                 totalClientTime += millis;
// // // // // // // // //                 }
// // // // // // // // //             }
// // // // // // // // //             });
// // // // // // // // //         });

// // // // // // // // //   return {
// // // // // // // // //     employeeDetails: Object.entries(employeeTime).map(([name, ms]) => ({
// // // // // // // // //       name,
// // // // // // // // //       totalTime: formatDurationFromMillis(ms),
// // // // // // // // //     })),
// // // // // // // // //     subServiceDetails: Object.entries(subServiceTime).map(([name, ms]) => ({
// // // // // // // // //       name,
// // // // // // // // //       totalTime: formatDurationFromMillis(ms),
// // // // // // // // //     })),
// // // // // // // // //     totalClientTime: formatDurationFromMillis(totalClientTime),
// // // // // // // // //   };
// // // // // // // // // };




// // // // // // // // //     const handleClientClick = (clientId) => {
// // // // // // // // //         const tasksData = (dashboardData?.tasks || []).filter(
// // // // // // // // //             t => t.client === clientId
// // // // // // // // //         );

// // // // // // // // //         const summary = processClientTaskSummary(tasksData);

// // // // // // // // //         setSelectedClientDetails({
// // // // // // // // //             client: clients.find(c => c.id === clientId),
// // // // // // // // //             tasks: tasksData
// // // // // // // // //         });

// // // // // // // // //         setClientTaskSummary(summary);
// // // // // // // // //         };


// // // // // // // // //     if (loading) {
// // // // // // // // //         return <div style={{ textAlign: 'center', marginTop: '50px' }}><Title level={4}>Loading Dashboard...</Title></div>;
// // // // // // // // //     }
// // // // // // // // //     if (error) {
// // // // // // // // //         return <div style={{ padding: '50px', textAlign: 'center', color: 'red' }}><Title level={4}>{error}</Title><Button onClick={() => fetchInitialData()}>Retry</Button></div>;
// // // // // // // // //     }

// // // // // // // // //     const taskStatusData = dashboardData?.status_counts
// // // // // // // // //         ? Object.keys(dashboardData.status_counts)
// // // // // // // // //             .filter(key => dashboardData.status_counts[key] > 0)
// // // // // // // // //             .map(key => ({ value: dashboardData.status_counts[key], name: key }))
// // // // // // // // //         : [];

// // // // // // // // //     // compute total millis for each task and store that in total_hours
// // // // // // // // //     const mappedTimePerClient = (dashboardData?.tasks || []).reduce((acc, task) => {
// // // // // // // // //     const minutes = getFlatTimeEntries(task).reduce((sum, entry) => {
// // // // // // // // //         if (entry.start_time && entry.end_time) {
// // // // // // // // //         return sum + moment.duration(moment(entry.end_time).diff(moment(entry.start_time))).asMinutes();
// // // // // // // // //         }
// // // // // // // // //         return sum;
// // // // // // // // //     }, 0);

// // // // // // // // //     if (minutes <= 0) return acc;

// // // // // // // // //     const millis = Math.round(minutes * 60 * 1000); // convert minutes -> milliseconds
// // // // // // // // //     const client = clients.find(c => c.id === task.client);
// // // // // // // // //     if (!client) return acc;

// // // // // // // // //     const existing = acc.find(i => i.client_id === task.client);

// // // // // // // // //     if (existing) {
// // // // // // // // //         existing.total_hours += millis;
// // // // // // // // //     } else {
// // // // // // // // //         acc.push({
// // // // // // // // //         client_id: task.client,
// // // // // // // // //         client_name: client.name,
// // // // // // // // //         total_hours: millis, // milliseconds now
// // // // // // // // //         group_name: getGroupNameFromClient(client),
// // // // // // // // //         spoc_name: getSpocNameFromClient(client),
// // // // // // // // //         });
// // // // // // // // //     }

// // // // // // // // //     return acc;
// // // // // // // // //     }, []);




// // // // // // // // //     const mappedTimePerGroup = mappedTimePerClient.reduce((acc, row) => {
// // // // // // // // //         const client = clients.find(c => c.id === row.client_id);
// // // // // // // // //         if (!client) return acc;

// // // // // // // // //         const groupName = getGroupNameFromClient(client);
// // // // // // // // //         if (!groupName || groupName === 'N/A') return acc;

// // // // // // // // //         const existing = acc.find(g => g.client_group_name === groupName);

// // // // // // // // //         if (existing) {
// // // // // // // // //             existing.total_hours += row.total_hours;
// // // // // // // // //         } else {
// // // // // // // // //             acc.push({
// // // // // // // // //             client_group_name: groupName,
// // // // // // // // //             spoc_name: getSpocNameFromClient(client),
// // // // // // // // //             total_hours: row.total_hours,
// // // // // // // // //             });
// // // // // // // // //         }

// // // // // // // // //         return acc;
// // // // // // // // //         }, []);



    

// // // // // // // // //     const timePerClientColumns = [
// // // // // // // // //     {
// // // // // // // // //         title: "Sl. No.",
// // // // // // // // //         render: (_, __, index) => index + 1,
// // // // // // // // //     },
// // // // // // // // //     { title: "Client", width: 300, dataIndex: "client_name", key: "client_name"},
// // // // // // // // //     // { title: "Group Name", dataIndex: "group_name", key: "group_name" },
// // // // // // // // //     { title: "SPOC", dataIndex: "spoc_name", key: "spoc_name" },
// // // // // // // // //     // { title: "Total Hours", dataIndex: "total_hours", key: "total_hours" },
// // // // // // // // //     {
// // // // // // // // //         title: "Total Hours",
// // // // // // // // //         render: (_, record) => formatDurationFromMillis(record.total_hours),
// // // // // // // // //         }

// // // // // // // // //     // {
// // // // // // // // //     // title: "Action",
// // // // // // // // //     // key: "action",
// // // // // // // // //     // render: (_, record) => {
// // // // // // // // //     //     const client = clients.find(c => c.name === record.client_name);
// // // // // // // // //     //     return client ? (
// // // // // // // // //     //     <MdOutlineOpenInNew
// // // // // // // // //     //         style={{ cursor: "pointer", color: "#1890ff" }}
// // // // // // // // //     //         onClick={() => navigate(`/clients/${client.id}/details`)}
// // // // // // // // //     //     />
// // // // // // // // //     //     ) : null;
// // // // // // // // //     // },
// // // // // // // // //     // },
// // // // // // // // //     ];


// // // // // // // // //     const timePerGroupColumns = [
// // // // // // // // //         {
// // // // // // // // //             title: "Sl. No.",
// // // // // // // // //             dataIndex: "index",
// // // // // // // // //             key: "index",
// // // // // // // // //             render: (_, __, index) => index + 1,
// // // // // // // // //         },
// // // // // // // // //         { title: 'Client Group', dataIndex: 'client_group_name', key: 'client_group_name' },
// // // // // // // // //         { title: 'SPOC', dataIndex: 'spoc_name', key: 'spoc_name' },
// // // // // // // // //         {
// // // // // // // // //         title: 'Total Hours',
// // // // // // // // //         render: (_, r) => formatDurationFromMillis(r.total_hours),
// // // // // // // // //         sorter: (a, b) => a.total_hours - b.total_hours,
// // // // // // // // //         }

// // // // // // // // //     ];

// // // // // // // // //     const handleNavigation = () => {
// // // // // // // // //         navigate('/stt-records');
// // // // // // // // //     };


// // // // // // // // //     return (
// // // // // // // // //         <div style={{ padding: '24px' }}>
// // // // // // // // //             {/* <Space style={{ width: '100%', justifyContent: 'left', marginBottom: '10px' }}>
// // // // // // // // //                 <Title level={2}>Task Dashboard</Title>
// // // // // // // // //             </Space> */}
// // // // // // // // //             <Row justify="space-between" align="middle" className="mb-6">
// // // // // // // // //                 <Col><Title level={2}>Task Dashboard</Title></Col>
// // // // // // // // //                 <Col>
// // // // // // // // //                     <Button type="primary" onClick={handleNavigation}>
// // // // // // // // //                         Back to STT Record
// // // // // // // // //                     </Button>
// // // // // // // // //                 </Col>
// // // // // // // // //             </Row>
// // // // // // // // //             {/* <Collapse activeKey={activeFilterKey} onChange={setActiveFilterKey} ghost style={{ marginBottom: '24px' }}>
// // // // // // // // //                 <Panel header={<Space><FilterOutlined /><Title level={4} style={{ marginBottom: 0 }}>Filters</Title></Space>} key="1">
// // // // // // // // //                     <Space wrap>
// // // // // // // // //                         <RangePicker value={dateRange} onChange={setDateRange} />
// // // // // // // // //                         <Select mode="multiple" placeholder="Select Client Group" style={{ width: 250 }} allowClear showSearch value={selectedClientGroup} onChange={setSelectedClientGroup}
// // // // // // // // //                             filterOption={(input, option) => (option?.children ?? '').toLowerCase().includes(input.toLowerCase())}>
// // // // // // // // //                             {clientGroups.map(group => (<Option key={group.id} value={group.id}>{group.group_name}</Option>))}
// // // // // // // // //                         </Select>
// // // // // // // // //                         <Select mode="multiple" placeholder="Select Client" style={{ width: 250 }} allowClear showSearch value={selectedClient} onChange={setSelectedClient}
// // // // // // // // //                             filterOption={(input, option) => (option?.children ?? '').toLowerCase().includes(input.toLowerCase())}>
// // // // // // // // //                             {clients.map(client => (<Option key={client.id} value={client.id}>{client.name}</Option>))}
// // // // // // // // //                         </Select>
// // // // // // // // //                         <Select mode="multiple" placeholder="Select Team" style={{ width: 200 }} allowClear showSearch value={selectedTeam} onChange={setSelectedTeam}
// // // // // // // // //                             filterOption={(input, option) => (option?.children ?? '').toLowerCase().includes(input.toLowerCase())}>
// // // // // // // // //                             {teams.map(team => (<Option key={team.id} value={team.id}>{team.name}</Option>))}
// // // // // // // // //                         </Select>
// // // // // // // // //                         <Select
// // // // // // // // //                             mode="multiple"
// // // // // // // // //                             placeholder="Select Sub Service"
// // // // // // // // //                             style={{ width: 250 }}
// // // // // // // // //                             allowClear
// // // // // // // // //                             showSearch
// // // // // // // // //                             value={selectedSubService}
// // // // // // // // //                             onChange={setSelectedSubService}
// // // // // // // // //                             filterOption={(input, option) =>
// // // // // // // // //                                 (option?.children ?? '')
// // // // // // // // //                                     .toLowerCase()
// // // // // // // // //                                     .includes(input.toLowerCase())
// // // // // // // // //                             }
// // // // // // // // //                         >
// // // // // // // // //                             {subServices.map(service => (
// // // // // // // // //                                 <Option key={service.id} value={service.id}>
// // // // // // // // //                                     {service.name}
// // // // // // // // //                                 </Option>
// // // // // // // // //                             ))}
// // // // // // // // //                         </Select>

// // // // // // // // //                         <Button onClick={handleClearFilters}>Clear</Button>
// // // // // // // // //                     </Space>
// // // // // // // // //                 </Panel>
// // // // // // // // //             </Collapse> */}
// // // // // // // // //             <Collapse
// // // // // // // // //   activeKey={activeFilterKey}
// // // // // // // // //   onChange={setActiveFilterKey}
// // // // // // // // //   style={{
// // // // // // // // //     marginBottom: 24,
// // // // // // // // //     background: "#fff",
// // // // // // // // //     borderRadius: 12,
// // // // // // // // //     boxShadow: "0 2px 10px rgba(0,0,0,0.05)"
// // // // // // // // //   }}
// // // // // // // // // >
// // // // // // // // //   <Panel
// // // // // // // // //     header={
// // // // // // // // //       <Space>
// // // // // // // // //         <FilterOutlined style={{ fontSize: 18 }} />
// // // // // // // // //         <Title level={5} style={{ margin: 0 }}>
// // // // // // // // //           Filters
// // // // // // // // //         </Title>
// // // // // // // // //       </Space>
// // // // // // // // //     }
// // // // // // // // //     key="1"
// // // // // // // // //   >
// // // // // // // // //     <Row gutter={[16, 16]}>

// // // // // // // // //       {/* Date Range */}
// // // // // // // // //       <Col xs={24} sm={12} md={8} lg={6}>
// // // // // // // // //         <RangePicker
// // // // // // // // //           style={{ width: "100%" }}
// // // // // // // // //           value={dateRange}
// // // // // // // // //           onChange={setDateRange}
// // // // // // // // //         />
// // // // // // // // //       </Col>

// // // // // // // // //       {/* Client Group */}
// // // // // // // // //       <Col xs={24} sm={12} md={8} lg={6}>
// // // // // // // // //         <Select
// // // // // // // // //           mode="multiple"
// // // // // // // // //           placeholder="Client Group"
// // // // // // // // //           allowClear
// // // // // // // // //           showSearch
// // // // // // // // //           style={{ width: "100%" }}
// // // // // // // // //           value={selectedClientGroup}
// // // // // // // // //           onChange={setSelectedClientGroup}
// // // // // // // // //           filterOption={(input, option) =>
// // // // // // // // //             (option?.children ?? "")
// // // // // // // // //               .toLowerCase()
// // // // // // // // //               .includes(input.toLowerCase())
// // // // // // // // //           }
// // // // // // // // //         >
// // // // // // // // //           {clientGroups.map(group => (
// // // // // // // // //             <Option key={group.id} value={group.id}>
// // // // // // // // //               {group.group_name}
// // // // // // // // //             </Option>
// // // // // // // // //           ))}
// // // // // // // // //         </Select>
// // // // // // // // //       </Col>

// // // // // // // // //       {/* Client */}
// // // // // // // // //       <Col xs={24} sm={12} md={8} lg={6}>
// // // // // // // // //         <Select
// // // // // // // // //           mode="multiple"
// // // // // // // // //           placeholder="Client"
// // // // // // // // //           allowClear
// // // // // // // // //           showSearch
// // // // // // // // //           style={{ width: "100%" }}
// // // // // // // // //           value={selectedClient}
// // // // // // // // //           onChange={setSelectedClient}
// // // // // // // // //           filterOption={(input, option) =>
// // // // // // // // //             (option?.children ?? "")
// // // // // // // // //               .toLowerCase()
// // // // // // // // //               .includes(input.toLowerCase())
// // // // // // // // //           }
// // // // // // // // //         >
// // // // // // // // //           {clients.map(client => (
// // // // // // // // //             <Option key={client.id} value={client.id}>
// // // // // // // // //               {client.name}
// // // // // // // // //             </Option>
// // // // // // // // //           ))}
// // // // // // // // //         </Select>
// // // // // // // // //       </Col>

// // // // // // // // //       {/* Team */}
// // // // // // // // //       <Col xs={24} sm={12} md={8} lg={6}>
// // // // // // // // //         <Select
// // // // // // // // //           mode="multiple"
// // // // // // // // //           placeholder="Team"
// // // // // // // // //           allowClear
// // // // // // // // //           showSearch
// // // // // // // // //           style={{ width: "100%" }}
// // // // // // // // //           value={selectedTeam}
// // // // // // // // //           onChange={setSelectedTeam}
// // // // // // // // //           filterOption={(input, option) =>
// // // // // // // // //             (option?.children ?? "")
// // // // // // // // //               .toLowerCase()
// // // // // // // // //               .includes(input.toLowerCase())
// // // // // // // // //           }
// // // // // // // // //         >
// // // // // // // // //           {teams.map(team => (
// // // // // // // // //             <Option key={team.id} value={team.id}>
// // // // // // // // //               {team.name}
// // // // // // // // //             </Option>
// // // // // // // // //           ))}
// // // // // // // // //         </Select>
// // // // // // // // //       </Col>

// // // // // // // // //       {/* Sub Service */}
// // // // // // // // //       <Col xs={24} sm={12} md={8} lg={6}>
// // // // // // // // //         <Select
// // // // // // // // //           mode="multiple"
// // // // // // // // //           placeholder="Sub Service"
// // // // // // // // //           allowClear
// // // // // // // // //           showSearch
// // // // // // // // //           style={{ width: "100%" }}
// // // // // // // // //           value={selectedSubService}
// // // // // // // // //           onChange={setSelectedSubService}
// // // // // // // // //           filterOption={(input, option) =>
// // // // // // // // //             (option?.children ?? "")
// // // // // // // // //               .toLowerCase()
// // // // // // // // //               .includes(input.toLowerCase())
// // // // // // // // //           }
// // // // // // // // //         >
// // // // // // // // //           {subServices.map(service => (
// // // // // // // // //             <Option key={service.id} value={service.id}>
// // // // // // // // //               {service.name}
// // // // // // // // //             </Option>
// // // // // // // // //           ))}
// // // // // // // // //         </Select>
// // // // // // // // //       </Col>

// // // // // // // // //       {/* Clear Button */}
// // // // // // // // //       <Col xs={24} style={{ textAlign: "right" }}>
// // // // // // // // //         <Button
// // // // // // // // //           icon={<ClearOutlined />}
// // // // // // // // //           onClick={handleClearFilters}
// // // // // // // // //           danger
// // // // // // // // //         >
// // // // // // // // //           Clear Filters
// // // // // // // // //         </Button>
// // // // // // // // //       </Col>

// // // // // // // // //     </Row>
// // // // // // // // //   </Panel>
// // // // // // // // // </Collapse>
// // // // // // // // //             <Row gutter={[16, 16]} style={{ marginBottom: '24px', display: 'flex', flexWrap: 'nowrap' }}>
// // // // // // // // //                 {[
// // // // // // // // //                     { title: "All Tasks", value: taskCounts.allTasks, icon: <FcList />, color: TASK_STATUS_COLORS['All Tasks'], status: 'all' },
// // // // // // // // //                     { title: "To Do Tasks", value: taskCounts.toDo, icon: <ClockCircleOutlined />, color: TASK_STATUS_COLORS['To Do'], status: 'To Do' },
// // // // // // // // //                     { title: "In Progress", value: taskCounts.inProgress, icon: <MinusCircleOutlined />, color: TASK_STATUS_COLORS['In Progress'], status: 'In Progress' },
// // // // // // // // //                     { title: "Done", value: taskCounts.done, icon: <CheckCircleOutlined />, color: TASK_STATUS_COLORS['Done'], status: 'Done' },
// // // // // // // // //                     { title: "Over Due", value: taskCounts.overdue, icon: <ExclamationCircleOutlined />, color: TASK_STATUS_COLORS['Over Due'], status: 'Over Due' },

// // // // // // // // //                 ].map((card, i) => (
// // // // // // // // //                 <Col key={i} style={{ flex: 1, display: 'flex' }}>
// // // // // // // // //                     <DashboardCard
// // // // // // // // //                     {...card}
// // // // // // // // //                     onClick={() => {
// // // // // // // // //                     const params = new URLSearchParams();

// // // // // // // // //                     // Status
// // // // // // // // //                     params.set("status", card.status);

// // // // // // // // //                     // Date range
// // // // // // // // //                     if (dateRange?.[0]) {
// // // // // // // // //                         params.set("start_date", dateRange[0].format("YYYY-MM-DD"));
// // // // // // // // //                     }
// // // // // // // // //                     if (dateRange?.[1]) {
// // // // // // // // //                         params.set("end_date", dateRange[1].format("YYYY-MM-DD"));
// // // // // // // // //                     }

// // // // // // // // //                     // Clients
// // // // // // // // //                     if (selectedClient?.length) {
// // // // // // // // //                         params.set("client_id", selectedClient.join(","));
// // // // // // // // //                     }

// // // // // // // // //                     // Teams
// // // // // // // // //                     if (selectedTeam?.length) {
// // // // // // // // //                         params.set("team_id", selectedTeam.join(","));
// // // // // // // // //                     }

// // // // // // // // //                     // Client Groups
// // // // // // // // //                     if (selectedClientGroup?.length) {
// // // // // // // // //                         params.set("client_group_id", selectedClientGroup.join(","));
// // // // // // // // //                     }

// // // // // // // // //                     // Sub Services
// // // // // // // // //                     if (selectedSubService?.length) {
// // // // // // // // //                         params.set("sub_service_id", selectedSubService.join(","));
// // // // // // // // //                     }

// // // // // // // // //                     navigate(`/stt-records?${params.toString()}`);
// // // // // // // // //                     }}

// // // // // // // // //                     />
// // // // // // // // //                 </Col>
// // // // // // // // //                 ))}
// // // // // // // // //             </Row>
// // // // // // // // //             <Row gutter={[16, 16]} align="top">
// // // // // // // // //             {/* LEFT 50%: Pie + Client Details (stacked) */}
// // // // // // // // //             <Col xs={24} lg={10}>
// // // // // // // // //                 <Space direction="vertical" size={16} style={{ width: '100%' }}>
// // // // // // // // //                 <Card bordered={false} title="Task Status Overview">
// // // // // // // // //                     <EChartsReact option={getTaskStatusOptions(taskStatusData)} style={{ height: '400px' }} />
// // // // // // // // //                 </Card>
// // // // // // // // //                 </Space>
// // // // // // // // //             </Col>

// // // // // // // // //             {/* RIGHT 50%: Total Time Spent */}
// // // // // // // // //             <Col xs={24} lg={14}>
// // // // // // // // //                 <Card
// // // // // // // // //                 bordered={false}
// // // // // // // // //                 title={
// // // // // // // // //                     <Space align="baseline" style={{ justifyContent: 'space-between', width: '100%', flexWrap: 'wrap' }}>
// // // // // // // // //                     <Title level={4} style={{ marginBottom: 0 }}>Total Time Spent</Title>
// // // // // // // // //                     <Segmented
// // // // // // // // //                         options={['Client', 'Client Group']}
// // // // // // // // //                         value={tableView === 'client' ? 'Client' : 'Client Group'}
// // // // // // // // //                         onChange={(value) => setTableView(value === 'Client' ? 'client' : 'group')}
// // // // // // // // //                     />
// // // // // // // // //                     </Space>
// // // // // // // // //                 }
// // // // // // // // //                 >
// // // // // // // // //                 {tableView === 'client' ? (
// // // // // // // // //                     <Table
// // // // // // // // //                     columns={timePerClientColumns}
// // // // // // // // //                     dataSource={mappedTimePerClient}
// // // // // // // // //                     pagination={{ pageSize: 15, size: 'small', style: { padding: '12px 20px' } }}
// // // // // // // // //                     rowKey="client_name"
                    
// // // // // // // // //                     scroll={{ x: 'max-content' }}
// // // // // // // // //                     onRow={(record) => ({
// // // // // // // // //                         onClick: () => {
// // // // // // // // //                             const client = clients.find(c => c.name === record.client_name);
// // // // // // // // //                             if (client) {
// // // // // // // // //                             handleClientClick(client.id);
// // // // // // // // //                             setClientModalVisible(true); // 🔥 open modal
// // // // // // // // //                             }
// // // // // // // // //                         },
// // // // // // // // //                         style: { cursor: 'pointer' }
// // // // // // // // //                         })}

// // // // // // // // //                     summary={() => (
// // // // // // // // //                         <Table.Summary.Row>
// // // // // // // // //                         <Table.Summary.Cell index={0} colSpan={3}>
// // // // // // // // //                             <Text strong>Total</Text>
// // // // // // // // //                         </Table.Summary.Cell>
// // // // // // // // //                         <Table.Summary.Cell index={1}>
// // // // // // // // //                             <Text strong>
// // // // // // // // //                                 {formatDurationFromMillis(
// // // // // // // // //                                     mappedTimePerClient.reduce((acc, curr) => acc + curr.total_hours, 0)
// // // // // // // // //                                 )}
// // // // // // // // //                             </Text>

// // // // // // // // //                         </Table.Summary.Cell>
// // // // // // // // //                         </Table.Summary.Row>
// // // // // // // // //                     )}
// // // // // // // // //                     />
// // // // // // // // //                 ) : (
// // // // // // // // //                     <Table
// // // // // // // // //                     columns={timePerGroupColumns}
// // // // // // // // //                     dataSource={mappedTimePerGroup}
// // // // // // // // //                     rowKey="client_group_name"
// // // // // // // // //                     pagination={{ pageSize: 15, size: 'small', style: { padding: '12px 20px' } }}
// // // // // // // // //                     scroll={{ x: 'max-content' }}
// // // // // // // // //                     />
// // // // // // // // //                 )}
// // // // // // // // //                 </Card>
// // // // // // // // //             </Col>
// // // // // // // // //             </Row>
// // // // // // // // //             <Modal
// // // // // // // // //   open={clientModalVisible}
// // // // // // // // //   onCancel={() => setClientModalVisible(false)}
// // // // // // // // //   footer={null}
// // // // // // // // //   width={800}
// // // // // // // // //   title={
// // // // // // // // //     selectedClientDetails
// // // // // // // // //       ? `Client Details - ${selectedClientDetails.client.name}`
// // // // // // // // //       : "Client Details"
// // // // // // // // //   }
// // // // // // // // // >
// // // // // // // // //   {selectedClientDetails && clientTaskSummary && (
// // // // // // // // //     <>
// // // // // // // // //       <p><strong>Group:</strong> {getGroupNameFromClient(selectedClientDetails.client)}</p>
// // // // // // // // //       <p><strong>SPOC:</strong> {getSpocNameFromClient(selectedClientDetails.client)}</p>

// // // // // // // // //       <p>
// // // // // // // // //         <strong>Total Done Tasks:</strong>{" "}
// // // // // // // // //         {(selectedClientDetails.tasks || []).filter(
// // // // // // // // //           task =>
// // // // // // // // //             task.client === selectedClientDetails.client.id &&
// // // // // // // // //             task.status?.toLowerCase() === "done"
// // // // // // // // //         ).length}
// // // // // // // // //       </p>

// // // // // // // // //       <p>
// // // // // // // // //         <strong>Total Time Taken:</strong>{" "}
// // // // // // // // //         {clientTaskSummary.totalClientTime}
// // // // // // // // //       </p>

// // // // // // // // //       <Title level={5}>Employee Time Summary</Title>
// // // // // // // // //       <Table
// // // // // // // // //         size="small"
// // // // // // // // //         dataSource={clientTaskSummary.employeeDetails.map(e => ({
// // // // // // // // //           key: e.name,
// // // // // // // // //           employee: e.name,
// // // // // // // // //           totalTime: e.totalTime
// // // // // // // // //         }))}
// // // // // // // // //         columns={[
// // // // // // // // //           { title: "Employee", dataIndex: "employee" },
// // // // // // // // //           { title: "Total Time", dataIndex: "totalTime" },
// // // // // // // // //         ]}
// // // // // // // // //         pagination={false}
// // // // // // // // //       />
// // // // // // // // //       <Title level={5} style={{ marginTop: 16 }}>
// // // // // // // // //         Sub-Service Time Summary
// // // // // // // // //         </Title>

// // // // // // // // //         <Table
// // // // // // // // //         size="small"
// // // // // // // // //         dataSource={clientTaskSummary.subServiceDetails.map(s => ({
// // // // // // // // //             key: s.name,
// // // // // // // // //             subservice: s.name,
// // // // // // // // //             totalTime: s.totalTime
// // // // // // // // //         }))}
// // // // // // // // //         columns={[
// // // // // // // // //             { title: "Sub-Service", dataIndex: "subservice" },
// // // // // // // // //             { title: "Total Time", dataIndex: "totalTime" },
// // // // // // // // //         ]}
// // // // // // // // //         pagination={false}
// // // // // // // // //         />

// // // // // // // // //             </>
// // // // // // // // //         )}
// // // // // // // // //         </Modal>


// // // // // // // // //         </div>

// // // // // // // // //     );
// // // // // // // // // };

// // // // // // // // // export default TaskDashboard;

// // // // // // // // // ── TaskDashboard.js ──────────────────────────────────────────────────────────

// // // // // // // // import React, { useState, useEffect, useCallback } from 'react';
// // // // // // // // import {
// // // // // // // //     Card, Col, Row, Typography, message, Table, DatePicker,
// // // // // // // //     Select, Space, Button, Segmented, Collapse, Modal,
// // // // // // // // } from 'antd';
// // // // // // // // import { api } from '../../../services/api';
// // // // // // // // import EChartsReact from 'echarts-for-react';
// // // // // // // // import CountUp from 'react-countup';
// // // // // // // // import {
// // // // // // // //     ClockCircleOutlined, CheckCircleOutlined,
// // // // // // // //     MinusCircleOutlined, ExclamationCircleOutlined,
// // // // // // // //     FilterOutlined, ClearOutlined,
// // // // // // // // } from '@ant-design/icons';
// // // // // // // // import { FcList } from 'react-icons/fc';
// // // // // // // // import moment from 'moment';
// // // // // // // // import { formatDurationFromMillis } from './STT_Records';
// // // // // // // // import { useNavigate } from 'react-router-dom';

// // // // // // // // const { Title, Text } = Typography;
// // // // // // // // const { RangePicker } = DatePicker;
// // // // // // // // const { Option }      = Select;
// // // // // // // // const { Panel }       = Collapse;

// // // // // // // // const TASK_STATUS_COLORS = {
// // // // // // // //     'Done':        '#68ad6e',
// // // // // // // //     'In Progress': '#e9d94a',
// // // // // // // //     'Over Due':    '#bd4e44',
// // // // // // // //     'To Do':       '#5a54ad',
// // // // // // // //     'All Tasks':   '#414750',
// // // // // // // // };

// // // // // // // // const getTaskStatusOptions = (data) => ({
// // // // // // // //     title:   { text:'Task Status Overview', left:'center', textStyle:{ fontSize:18, fontWeight:'bold' } },
// // // // // // // //     tooltip: { trigger:'item', formatter:'{b} : {c} ({d}%)' },
// // // // // // // //     legend:  { orient:'horizontal', bottom:'bottom', left:'center', padding:5 },
// // // // // // // //     series:  [{
// // // // // // // //         name:      'Task Status',
// // // // // // // //         type:      'pie',
// // // // // // // //         radius:    '65%',
// // // // // // // //         center:    ['50%','50%'],
// // // // // // // //         data,
// // // // // // // //         color:     data.map(i => TASK_STATUS_COLORS[i.name] || '#ccc'),
// // // // // // // //         label:     { show:true, formatter:'{b}: {c}', fontSize:12 },
// // // // // // // //         labelLine: { show:true },
// // // // // // // //         emphasis:  { itemStyle:{ shadowBlur:10, shadowOffsetX:0, shadowColor:'rgba(0,0,0,.5)' } },
// // // // // // // //     }],
// // // // // // // // });

// // // // // // // // const DashboardCard = ({ title, value, icon, color, onClick }) => (
// // // // // // // //     <Card
// // // // // // // //         bordered={false} hoverable onClick={onClick}
// // // // // // // //         style={{
// // // // // // // //             backgroundColor:color, color:'white', minHeight:120,
// // // // // // // //             display:'flex', flexDirection:'column',
// // // // // // // //             justifyContent:'space-between', borderRadius:8, flex:1, cursor:'pointer',
// // // // // // // //         }}
// // // // // // // //         bodyStyle={{ padding:16, flex:1 }}
// // // // // // // //     >
// // // // // // // //         <div style={{ display:'flex', alignItems:'center', marginBottom:8 }}>
// // // // // // // //             {React.cloneElement(icon, { style:{ fontSize:24, color:'white' } })}
// // // // // // // //             <Text style={{ marginLeft:8, color:'white', fontWeight:'bold', fontSize:16 }}>{title}</Text>
// // // // // // // //         </div>
// // // // // // // //         <CountUp end={value} duration={2.5}
// // // // // // // //             style={{ fontSize:'2em', fontWeight:'bold', color:'white', alignSelf:'flex-end' }}/>
// // // // // // // //     </Card>
// // // // // // // // );

// // // // // // // // /* ── Time entry helpers ── */
// // // // // // // // const getFlatTimeEntries = (task) => {
// // // // // // // //     if (task?.time_entries?.length)          return task.time_entries;
// // // // // // // //     if (task?.assigned_employees_data?.length)
// // // // // // // //         return task.assigned_employees_data.flatMap(e => e?.time_entries || []);
// // // // // // // //     return [];
// // // // // // // // };

// // // // // // // // /* ══════════════ MAIN COMPONENT ══════════════ */
// // // // // // // // // const TaskDashboard = () => {
// // // // // // // // //     const navigate = useNavigate();

// // // // // // // // //     const [loading,              setLoading]              = useState(true);
// // // // // // // // //     const [dashboardData,        setDashboardData]        = useState(null);
// // // // // // // // //     const [error,                setError]                = useState(null);
// // // // // // // // //     const [dateRange,            setDateRange]            = useState(null);
// // // // // // // // //     const [clients,              setClients]              = useState([]);
// // // // // // // // //     const [selectedClient,       setSelectedClient]       = useState([]);
// // // // // // // // //     const [teams,                setTeams]                = useState([]);
// // // // // // // // //     const [selectedTeam,         setSelectedTeam]         = useState([]);
// // // // // // // // //     const [clientGroups,         setClientGroups]         = useState([]);
// // // // // // // // //     const [selectedClientGroup,  setSelectedClientGroup]  = useState([]);
// // // // // // // // //     const [allSpocs,             setAllSpocs]             = useState([]);
// // // // // // // // //     const [subServices,          setSubServices]          = useState([]);
// // // // // // // // //     const [selectedSubService,   setSelectedSubService]   = useState([]);
// // // // // // // // //     const [tableView,            setTableView]            = useState('client');
// // // // // // // // //     const [taskCounts,           setTaskCounts]           = useState({
// // // // // // // // //         allTasks:0, done:0, toDo:0, overdue:0, inProgress:0,
// // // // // // // // //     });
// // // // // // // // //     const [activeFilterKey,      setActiveFilterKey]      = useState([]);
// // // // // // // // //     const [selectedClientDetails,setSelectedClientDetails]= useState(null);
// // // // // // // // //     const [clientTaskSummary,    setClientTaskSummary]    = useState(null);
// // // // // // // // //     const [clientModalVisible,   setClientModalVisible]   = useState(false);
// // // // // // // // //     const [timePerClientData, setTimePerClientData] = useState([]);

// // // // // // // // //     /* ── Lookup helpers ── */
// // // // // // // // //     const getSpocNameFromClient = (client) => {
// // // // // // // // //         if (!client) return 'N/A';
// // // // // // // // //         if (client.primary_spoc_name) return client.primary_spoc_name;
// // // // // // // // //         const group = clientGroups.find(g =>
// // // // // // // // //             g.clients?.some(cg => (typeof cg === 'object' ? cg.id : cg) === client.id)
// // // // // // // // //         );
// // // // // // // // //         if (group?.primary_spoc_name) return group.primary_spoc_name;
// // // // // // // // //         if (typeof client.primary_spoc === 'number') {
// // // // // // // // //             const spoc = allSpocs.find(s => s.id === client.primary_spoc);
// // // // // // // // //             if (spoc)
// // // // // // // // //                 return `${spoc.first_name||''} ${spoc.last_name||''}`.trim() || spoc.user?.email || 'N/A';
// // // // // // // // //         }
// // // // // // // // //         return 'N/A';
// // // // // // // // //     };

// // // // // // // // //     const getGroupNameFromClient = (client) => {
// // // // // // // // //         if (!client) return 'N/A';
// // // // // // // // //         const group = clientGroups.find(g =>
// // // // // // // // //             g.clients?.some(cg => (typeof cg === 'object' ? cg.id : cg) === client.id)
// // // // // // // // //         );
// // // // // // // // //         return group ? group.group_name : 'N/A';
// // // // // // // // //     };

// // // // // // // // //     const getSubServiceName = (id) => {
// // // // // // // // //         const svc = subServices.find(s => s.id === id);
// // // // // // // // //         return svc ? svc.name : 'N/A';
// // // // // // // // //     };

// // // // // // // // //     /* ── Fetch reference data ── */
// // // // // // // // //     const fetchInitialData = async () => {
// // // // // // // // //         try {
// // // // // // // // //             const [clientsRes, teamsRes, groupsRes, spocsRes, subsRes] = await Promise.all([
// // // // // // // // //                 api.get('/clients/clients/?page_size=500'),
// // // // // // // // //                 api.get('/employee/teams/'),
// // // // // // // // //                 api.get('/clients/client-groups/'),
// // // // // // // // //                 api.get('/employee/employees/'),
// // // // // // // // //                 api.get('/clients/subservices/'),
// // // // // // // // //             ]);
// // // // // // // // //             setClients(clientsRes.data.results   || clientsRes.data);
// // // // // // // // //             setTeams(teamsRes.data.results       || teamsRes.data);
// // // // // // // // //             setClientGroups(groupsRes.data.results || groupsRes.data);
// // // // // // // // //             setAllSpocs(spocsRes.data.results    || spocsRes.data);
// // // // // // // // //             setSubServices(subsRes.data.results  || subsRes.data);
// // // // // // // // //             fetchDashboardData({});
// // // // // // // // //         } catch (err) {
// // // // // // // // //             console.error('fetchInitialData error:', err);
// // // // // // // // //             setError('Failed to load initial data. Please try again later.');
// // // // // // // // //         } finally {
// // // // // // // // //             setLoading(false);
// // // // // // // // //         }
// // // // // // // // //     };

// // // // // // // // //     const fetchTimePerClient = useCallback(async (filters = {}) => {
// // // // // // // // //         try {
// // // // // // // // //             const params = {
// // // // // // // // //                 start_date:      filters.startDate?.format('YYYY-MM-DD'),
// // // // // // // // //                 end_date:        filters.endDate?.format('YYYY-MM-DD'),
// // // // // // // // //                 client_id:       filters.clientId?.join(','),
// // // // // // // // //                 team_id:         filters.teamId?.join(','),
// // // // // // // // //                 client_group_id: filters.clientGroupId?.join(','),
// // // // // // // // //                 sub_service_id:  filters.subServiceId?.join(','),
// // // // // // // // //             };
// // // // // // // // //             Object.keys(params).forEach(k => params[k] === undefined && delete params[k]);

// // // // // // // // //             const res = await api.get('/clients/tasks/time_per_client/', { params });
// // // // // // // // //             // Backend already returns client_name, so enrich with spoc/group from local state
// // // // // // // // //             const enriched = (res.data || []).map(row => {
// // // // // // // // //                 const client = clients.find(c => c.id === row.client_id);
// // // // // // // // //                 return {
// // // // // // // // //                     ...row,
// // // // // // // // //                     total_hours: row.total_hours_ms,   // keep same field name for columns
// // // // // // // // //                     group_name:  getGroupNameFromClient(client),
// // // // // // // // //                     spoc_name:   getSpocNameFromClient(client),
// // // // // // // // //                 };
// // // // // // // // //             });
// // // // // // // // //             setTimePerClientData(enriched);
// // // // // // // // //         } catch (err) {
// // // // // // // // //             console.error('fetchTimePerClient error:', err);
// // // // // // // // //         }
// // // // // // // // //     }, [clients, clientGroups, allSpocs]);

// // // // // // // // //     // Call it alongside fetchDashboardData in the filter useEffect
// // // // // // // // //     useEffect(() => {
// // // // // // // // //         const [startDate, endDate] = dateRange || [null, null];
// // // // // // // // //         const filters = {
// // // // // // // // //             startDate, endDate,
// // // // // // // // //             clientId:      selectedClient,
// // // // // // // // //             teamId:        selectedTeam,
// // // // // // // // //             clientGroupId: selectedClientGroup,
// // // // // // // // //             subServiceId:  selectedSubService,
// // // // // // // // //         };
// // // // // // // // //         fetchDashboardData(filters);
// // // // // // // // //         fetchTimePerClient(filters);
// // // // // // // // //     }, [dateRange, selectedClient, selectedTeam, selectedClientGroup, selectedSubService,
// // // // // // // // //         fetchDashboardData, fetchTimePerClient]);

// // // // // // // // //     // Also call fetchTimePerClient when clients state loads (so enrichment works)
// // // // // // // // //     useEffect(() => {
// // // // // // // // //         if (clients.length > 0) fetchTimePerClient({});
// // // // // // // // //     }, [clients]);

// // // // // // // // //     /* ── Fetch dashboard data ── */
// // // // // // // // //     const fetchDashboardData = useCallback(async (filters = {}) => {
// // // // // // // // //         setLoading(true);
// // // // // // // // //         setError(null);
// // // // // // // // //         try {
// // // // // // // // //             const params = {
// // // // // // // // //                 start_date:      filters.startDate?.format('YYYY-MM-DD'),
// // // // // // // // //                 end_date:        filters.endDate?.format('YYYY-MM-DD'),
// // // // // // // // //                 client_id:       filters.clientId?.join(','),
// // // // // // // // //                 team_id:         filters.teamId?.join(','),
// // // // // // // // //                 client_group_id: filters.clientGroupId?.join(','),
// // // // // // // // //                 sub_service_id:  filters.subServiceId?.join(','),
// // // // // // // // //             };
// // // // // // // // //             // Remove undefined params
// // // // // // // // //             Object.keys(params).forEach(k => params[k] === undefined && delete params[k]);

// // // // // // // // //             const res = await api.get('/clients/tasks/dashboard_data/', { params });
// // // // // // // // //             setDashboardData(res.data);
// // // // // // // // //         } catch (err) {
// // // // // // // // //             console.error('fetchDashboardData error:', err);
// // // // // // // // //             setError('Failed to load dashboard data. Please try again later.');
// // // // // // // // //             message.error('Failed to load dashboard data.');
// // // // // // // // //         } finally {
// // // // // // // // //             setLoading(false);
// // // // // // // // //         }
// // // // // // // // //     }, []);

// // // // // // // // //     useEffect(() => { fetchInitialData(); }, []);

// // // // // // // // //     useEffect(() => {
// // // // // // // // //         const [startDate, endDate] = dateRange || [null, null];
// // // // // // // // //         fetchDashboardData({
// // // // // // // // //             startDate, endDate,
// // // // // // // // //             clientId:      selectedClient,
// // // // // // // // //             teamId:        selectedTeam,
// // // // // // // // //             clientGroupId: selectedClientGroup,
// // // // // // // // //             subServiceId:  selectedSubService,
// // // // // // // // //         });
// // // // // // // // //     }, [dateRange, selectedClient, selectedTeam, selectedClientGroup, selectedSubService, fetchDashboardData]);

// // // // // // // // //     /* ── Derive task counts from status_counts ── */
// // // // // // // // //     useEffect(() => {
// // // // // // // // //         if (!dashboardData?.status_counts) return;
// // // // // // // // //         const sc         = dashboardData.status_counts;
// // // // // // // // //         const todo       = sc['To Do']       || 0;
// // // // // // // // //         const inProgress = sc['In Progress'] || 0;
// // // // // // // // //         const done       = sc['Done']        || 0;
// // // // // // // // //         const overdue    = sc['Over Due']    || 0;
// // // // // // // // //         setTaskCounts({
// // // // // // // // //             // Sum of all statuses — more accurate than tasks array length
// // // // // // // // //             allTasks:   todo + inProgress + done + overdue,
// // // // // // // // //             done,
// // // // // // // // //             toDo:       todo,
// // // // // // // // //             inProgress,
// // // // // // // // //             overdue,
// // // // // // // // //         });
// // // // // // // // //     }, [dashboardData]);

// // // // // // // // //     const handleClearFilters = () => {
// // // // // // // // //         setDateRange(null);
// // // // // // // // //         setSelectedClient([]);
// // // // // // // // //         setSelectedTeam([]);
// // // // // // // // //         setSelectedClientGroup([]);
// // // // // // // // //         setSelectedSubService([]);
// // // // // // // // //     };

// // // // // // // // //     /* ── Client task summary for modal ── */
// // // // // // // // //     const processClientTaskSummary = (tasks) => {
// // // // // // // // //         const relevant = tasks.filter(t => {
// // // // // // // // //             const s = t.status?.toLowerCase();
// // // // // // // // //             return s === 'done' || s === 'in progress' || s === 'over due';
// // // // // // // // //         });

// // // // // // // // //         const employeeTime   = {};
// // // // // // // // //         const subServiceTime = {};
// // // // // // // // //         let totalClientTime  = 0;

// // // // // // // // //         relevant.forEach(task => {
// // // // // // // // //             const subName = getSubServiceName(task.sub_service) || 'N/A';
// // // // // // // // //             getFlatTimeEntries(task).forEach(entry => {
// // // // // // // // //                 if (entry.start_time && entry.end_time) {
// // // // // // // // //                     const millis = moment(entry.end_time).diff(moment(entry.start_time));
// // // // // // // // //                     if (millis > 0) {
// // // // // // // // //                         const empName = entry.employee_name || 'N/A';
// // // // // // // // //                         employeeTime[empName]    = (employeeTime[empName]    || 0) + millis;
// // // // // // // // //                         subServiceTime[subName]  = (subServiceTime[subName]  || 0) + millis;
// // // // // // // // //                         totalClientTime         += millis;
// // // // // // // // //                     }
// // // // // // // // //                 }
// // // // // // // // //             });
// // // // // // // // //         });

// // // // // // // // //         return {
// // // // // // // // //             employeeDetails: Object.entries(employeeTime).map(([name, ms]) => ({
// // // // // // // // //                 name, totalTime: formatDurationFromMillis(ms),
// // // // // // // // //             })),
// // // // // // // // //             subServiceDetails: Object.entries(subServiceTime).map(([name, ms]) => ({
// // // // // // // // //                 name, totalTime: formatDurationFromMillis(ms),
// // // // // // // // //             })),
// // // // // // // // //             totalClientTime: formatDurationFromMillis(totalClientTime),
// // // // // // // // //         };
// // // // // // // // //     };

// // // // // // // // //     const handleClientClick = (clientId) => {
// // // // // // // // //         const tasksData = (dashboardData?.tasks || []).filter(t => t.client === clientId);
// // // // // // // // //         const summary   = processClientTaskSummary(tasksData);
// // // // // // // // //         setSelectedClientDetails({
// // // // // // // // //             client: clients.find(c => c.id === clientId),
// // // // // // // // //             tasks:  tasksData,
// // // // // // // // //         });
// // // // // // // // //         setClientTaskSummary(summary);
// // // // // // // // //     };

// // // // // // // // //     /* ── Derived data ── */
// // // // // // // // //     const taskStatusData = dashboardData?.status_counts
// // // // // // // // //         ? Object.entries(dashboardData.status_counts)
// // // // // // // // //             .filter(([, v]) => v > 0)
// // // // // // // // //             .map(([name, value]) => ({ name, value }))
// // // // // // // // //         : [];

// // // // // // // // //     const mappedTimePerClient = (dashboardData?.tasks || []).reduce((acc, task) => {
// // // // // // // // //         const millis = getFlatTimeEntries(task).reduce((sum, entry) => {
// // // // // // // // //             if (entry.start_time && entry.end_time) {
// // // // // // // // //                 const ms = moment(entry.end_time).diff(moment(entry.start_time));
// // // // // // // // //                 return sum + (ms > 0 ? ms : 0);
// // // // // // // // //             }
// // // // // // // // //             return sum;
// // // // // // // // //         }, 0);
// // // // // // // // //         if (millis <= 0) return acc;

// // // // // // // // //         const client   = clients.find(c => c.id === task.client);
// // // // // // // // //         if (!client) return acc;

// // // // // // // // //         const existing = acc.find(i => i.client_id === task.client);
// // // // // // // // //         if (existing) {
// // // // // // // // //             existing.total_hours += millis;
// // // // // // // // //         } else {
// // // // // // // // //             acc.push({
// // // // // // // // //                 client_id:   task.client,
// // // // // // // // //                 client_name: client.name,
// // // // // // // // //                 total_hours: millis,
// // // // // // // // //                 group_name:  getGroupNameFromClient(client),
// // // // // // // // //                 spoc_name:   getSpocNameFromClient(client),
// // // // // // // // //             });
// // // // // // // // //         }
// // // // // // // // //         return acc;
// // // // // // // // //     }, []);

// // // // // // // // //     const mappedTimePerGroup = mappedTimePerClient.reduce((acc, row) => {
// // // // // // // // //         const client    = clients.find(c => c.id === row.client_id);
// // // // // // // // //         if (!client) return acc;
// // // // // // // // //         const groupName = getGroupNameFromClient(client);
// // // // // // // // //         if (!groupName || groupName === 'N/A') return acc;
// // // // // // // // //         const existing = acc.find(g => g.client_group_name === groupName);
// // // // // // // // //         if (existing) {
// // // // // // // // //             existing.total_hours += row.total_hours;
// // // // // // // // //         } else {
// // // // // // // // //             acc.push({
// // // // // // // // //                 client_group_name: groupName,
// // // // // // // // //                 spoc_name:         getSpocNameFromClient(client),
// // // // // // // // //                 total_hours:       row.total_hours,
// // // // // // // // //             });
// // // // // // // // //         }
// // // // // // // // //         return acc;
// // // // // // // // //     }, []);

// // // // // // // // //     /* ── Column definitions ── */
// // // // // // // // //     const timePerClientColumns = [
// // // // // // // // //         { title:'Sl. No.', render:(_,__,i) => i+1, width:70 },
// // // // // // // // //         { title:'Client',  dataIndex:'client_name', key:'client_name', width:300 },
// // // // // // // // //         { title:'SPOC',    dataIndex:'spoc_name',   key:'spoc_name' },
// // // // // // // // //         { title:'Total Hours', render:(_, r) => formatDurationFromMillis(r.total_hours) },
// // // // // // // // //     ];

// // // // // // // // //     const timePerGroupColumns = [
// // // // // // // // //         { title:'Sl. No.',      render:(_,__,i) => i+1, width:70 },
// // // // // // // // //         { title:'Client Group', dataIndex:'client_group_name', key:'client_group_name' },
// // // // // // // // //         { title:'SPOC',         dataIndex:'spoc_name',         key:'spoc_name' },
// // // // // // // // //         {
// // // // // // // // //             title:'Total Hours',
// // // // // // // // //             render:(_, r) => formatDurationFromMillis(r.total_hours),
// // // // // // // // //             sorter:(a, b) => a.total_hours - b.total_hours,
// // // // // // // // //         },
// // // // // // // // //     ];

// // // // // // // // //     /* ── Loading / Error states ── */
// // // // // // // // //     if (loading && !dashboardData) {
// // // // // // // // //         return (
// // // // // // // // //             <div style={{ textAlign:'center', marginTop:50 }}>
// // // // // // // // //                 <Title level={4}>Loading Dashboard...</Title>
// // // // // // // // //             </div>
// // // // // // // // //         );
// // // // // // // // //     }
// // // // // // // // //     if (error && !dashboardData) {
// // // // // // // // //         return (
// // // // // // // // //             <div style={{ padding:50, textAlign:'center', color:'red' }}>
// // // // // // // // //                 <Title level={4}>{error}</Title>
// // // // // // // // //                 <Button onClick={fetchInitialData}>Retry</Button>
// // // // // // // // //             </div>
// // // // // // // // //         );
// // // // // // // // //     }

// // // // // // // // const TaskDashboard = () => {
// // // // // // // //     const navigate = useNavigate();

// // // // // // // //     const [loading,              setLoading]              = useState(true);
// // // // // // // //     const [dashboardData,        setDashboardData]        = useState(null);
// // // // // // // //     const [error,                setError]                = useState(null);
// // // // // // // //     const [dateRange,            setDateRange]            = useState(null);
// // // // // // // //     const [clients,              setClients]              = useState([]);
// // // // // // // //     const [selectedClient,       setSelectedClient]       = useState([]);
// // // // // // // //     const [teams,                setTeams]                = useState([]);
// // // // // // // //     const [selectedTeam,         setSelectedTeam]         = useState([]);
// // // // // // // //     const [clientGroups,         setClientGroups]         = useState([]);
// // // // // // // //     const [selectedClientGroup,  setSelectedClientGroup]  = useState([]);
// // // // // // // //     const [allSpocs,             setAllSpocs]             = useState([]);
// // // // // // // //     const [subServices,          setSubServices]          = useState([]);
// // // // // // // //     const [selectedSubService,   setSelectedSubService]   = useState([]);
// // // // // // // //     const [tableView,            setTableView]            = useState('client');
// // // // // // // //     const [taskCounts,           setTaskCounts]           = useState({
// // // // // // // //         allTasks:0, done:0, toDo:0, overdue:0, inProgress:0,
// // // // // // // //     });
// // // // // // // //     const [activeFilterKey,      setActiveFilterKey]      = useState([]);
// // // // // // // //     const [selectedClientDetails,setSelectedClientDetails]= useState(null);
// // // // // // // //     const [clientTaskSummary,    setClientTaskSummary]    = useState(null);
// // // // // // // //     const [clientModalVisible,   setClientModalVisible]   = useState(false);
// // // // // // // //     const [timePerClientData,    setTimePerClientData]    = useState([]);

// // // // // // // //     const [clientModalLoading, setClientModalLoading] = useState(false);

// // // // // // // //     /* ── Lookup helpers ── */
// // // // // // // //     const getSpocNameFromClient = useCallback((client) => {
// // // // // // // //         if (!client) return 'N/A';
// // // // // // // //         if (client.primary_spoc_name) return client.primary_spoc_name;
// // // // // // // //         const group = clientGroups.find(g =>
// // // // // // // //             g.clients?.some(cg => (typeof cg === 'object' ? cg.id : cg) === client.id)
// // // // // // // //         );
// // // // // // // //         if (group?.primary_spoc_name) return group.primary_spoc_name;
// // // // // // // //         if (typeof client.primary_spoc === 'number') {
// // // // // // // //             const spoc = allSpocs.find(s => s.id === client.primary_spoc);
// // // // // // // //             if (spoc)
// // // // // // // //                 return `${spoc.first_name||''} ${spoc.last_name||''}`.trim() || spoc.user?.email || 'N/A';
// // // // // // // //         }
// // // // // // // //         return 'N/A';
// // // // // // // //     }, [clientGroups, allSpocs]);

// // // // // // // //     const getGroupNameFromClient = useCallback((client) => {
// // // // // // // //         if (!client) return 'N/A';
// // // // // // // //         const group = clientGroups.find(g =>
// // // // // // // //             g.clients?.some(cg => (typeof cg === 'object' ? cg.id : cg) === client.id)
// // // // // // // //         );
// // // // // // // //         return group ? group.group_name : 'N/A';
// // // // // // // //     }, [clientGroups]);

// // // // // // // //     const getSubServiceName = useCallback((id) => {
// // // // // // // //         const svc = subServices.find(s => s.id === id);
// // // // // // // //         return svc ? svc.name : 'N/A';
// // // // // // // //     }, [subServices]);

// // // // // // // //     /* ── Build filter params object ── */
// // // // // // // //     const buildFilters = useCallback(() => {
// // // // // // // //         const [startDate, endDate] = dateRange || [null, null];
// // // // // // // //         return {
// // // // // // // //             startDate, endDate,
// // // // // // // //             clientId:      selectedClient,
// // // // // // // //             teamId:        selectedTeam,
// // // // // // // //             clientGroupId: selectedClientGroup,
// // // // // // // //             subServiceId:  selectedSubService,
// // // // // // // //         };
// // // // // // // //     }, [dateRange, selectedClient, selectedTeam, selectedClientGroup, selectedSubService]);

// // // // // // // //     /* ── Fetch dashboard summary (status counts) ── */
// // // // // // // //     const fetchDashboardData = useCallback(async (filters = {}) => {
// // // // // // // //         setLoading(true);
// // // // // // // //         setError(null);
// // // // // // // //         try {
// // // // // // // //             const params = {
// // // // // // // //                 start_date:      filters.startDate?.format('YYYY-MM-DD'),
// // // // // // // //                 end_date:        filters.endDate?.format('YYYY-MM-DD'),
// // // // // // // //                 client_id:       filters.clientId?.join?.(','),
// // // // // // // //                 team_id:         filters.teamId?.join?.(','),
// // // // // // // //                 client_group_id: filters.clientGroupId?.join?.(','),
// // // // // // // //                 sub_service_id:  filters.subServiceId?.join?.(','),
// // // // // // // //             };
// // // // // // // //             Object.keys(params).forEach(k => !params[k] && delete params[k]);
// // // // // // // //             const res = await api.get('/clients/tasks/dashboard_summary/', { params });
// // // // // // // //             setDashboardData(res.data);
// // // // // // // //         } catch (err) {
// // // // // // // //             console.error('fetchDashboardData error:', err);
// // // // // // // //             setError('Failed to load dashboard data.');
// // // // // // // //             message.error('Failed to load dashboard data.');
// // // // // // // //         } finally {
// // // // // // // //             setLoading(false);
// // // // // // // //         }
// // // // // // // //     }, []);

// // // // // // // //     /* ── Fetch time per client ── */
// // // // // // // //     const fetchTimePerClient = useCallback(async (filters = {}, clientsList = []) => {
// // // // // // // //         try {
// // // // // // // //             const params = {
// // // // // // // //                 start_date:      filters.startDate?.format('YYYY-MM-DD'),
// // // // // // // //                 end_date:        filters.endDate?.format('YYYY-MM-DD'),
// // // // // // // //                 client_id:       filters.clientId?.join?.(','),
// // // // // // // //                 team_id:         filters.teamId?.join?.(','),
// // // // // // // //                 client_group_id: filters.clientGroupId?.join?.(','),
// // // // // // // //                 sub_service_id:  filters.subServiceId?.join?.(','),
// // // // // // // //             };
// // // // // // // //             Object.keys(params).forEach(k => !params[k] && delete params[k]);

// // // // // // // //             const res = await api.get('/clients/tasks/time_per_client/', { params });
// // // // // // // //             const enriched = (res.data || []).map(row => {
// // // // // // // //                 const client = clientsList.find(c => c.id === row.client_id);
// // // // // // // //                 return {
// // // // // // // //                     ...row,
// // // // // // // //                     total_hours: row.total_hours_ms,
// // // // // // // //                     group_name:  client ? getGroupNameFromClient(client) : 'N/A',
// // // // // // // //                     spoc_name:   client ? getSpocNameFromClient(client)  : 'N/A',
// // // // // // // //                 };
// // // // // // // //             });
// // // // // // // //             setTimePerClientData(enriched);
// // // // // // // //         } catch (err) {
// // // // // // // //             console.error('fetchTimePerClient error:', err);
// // // // // // // //         }
// // // // // // // //     }, [getGroupNameFromClient, getSpocNameFromClient]);

// // // // // // // //     /* ── Fetch reference data FIRST, then trigger dashboard fetches ── */
// // // // // // // //     const fetchInitialData = useCallback(async () => {
// // // // // // // //         setLoading(true);
// // // // // // // //         try {
// // // // // // // //             const [clientsRes, teamsRes, groupsRes, spocsRes, subsRes] = await Promise.all([
// // // // // // // //                 api.get('/clients/clients/?page_size=500'),
// // // // // // // //                 api.get('/employee/teams/'),
// // // // // // // //                 api.get('/clients/client-groups/'),
// // // // // // // //                 api.get('/employee/employees/'),
// // // // // // // //                 api.get('/clients/subservices/'),
// // // // // // // //             ]);
// // // // // // // //             const clientsList = clientsRes.data.results || clientsRes.data;
// // // // // // // //             setClients(clientsList);
// // // // // // // //             setTeams(teamsRes.data.results       || teamsRes.data);
// // // // // // // //             setClientGroups(groupsRes.data.results || groupsRes.data);
// // // // // // // //             setAllSpocs(spocsRes.data.results    || spocsRes.data);
// // // // // // // //             setSubServices(subsRes.data.results  || subsRes.data);

// // // // // // // //             // ── Trigger both fetches with the fresh clientsList directly
// // // // // // // //             // (don't rely on state which hasn't updated yet)
// // // // // // // //             await Promise.all([
// // // // // // // //                 fetchDashboardData({}),
// // // // // // // //                 fetchTimePerClient({}, clientsList),
// // // // // // // //             ]);
// // // // // // // //         } catch (err) {
// // // // // // // //             console.error('fetchInitialData error:', err);
// // // // // // // //             setError('Failed to load initial data.');
// // // // // // // //         } finally {
// // // // // // // //             setLoading(false);
// // // // // // // //         }
// // // // // // // //     }, [fetchDashboardData, fetchTimePerClient]);

// // // // // // // //     /* ── Initial load ── */
// // // // // // // //     useEffect(() => {
// // // // // // // //         fetchInitialData();
// // // // // // // //     }, [fetchInitialData]);

// // // // // // // //     /* ── Re-fetch when filters change ── */
// // // // // // // //     useEffect(() => {
// // // // // // // //         if (!clients.length) return;   // wait for reference data
// // // // // // // //         const filters = buildFilters();
// // // // // // // //         fetchDashboardData(filters);
// // // // // // // //         fetchTimePerClient(filters, clients);
// // // // // // // //     }, [dateRange, selectedClient, selectedTeam, selectedClientGroup, selectedSubService]);
// // // // // // // //     // ↑ intentionally omitting fetchDashboardData/fetchTimePerClient/clients/buildFilters
// // // // // // // //     //   to avoid infinite loops — this effect is only for user-driven filter changes

// // // // // // // //     /* ── Derive task counts ── */
// // // // // // // //     useEffect(() => {
// // // // // // // //         if (!dashboardData?.status_counts) return;
// // // // // // // //         const sc = dashboardData.status_counts;
// // // // // // // //         setTaskCounts({
// // // // // // // //             allTasks:   (sc['To Do']||0) + (sc['In Progress']||0) + (sc['Done']||0) + (sc['Over Due']||0),
// // // // // // // //             done:       sc['Done']        || 0,
// // // // // // // //             toDo:       sc['To Do']       || 0,
// // // // // // // //             inProgress: sc['In Progress'] || 0,
// // // // // // // //             overdue:    sc['Over Due']    || 0,
// // // // // // // //         });
// // // // // // // //     }, [dashboardData]);

// // // // // // // //     /* ── Derived: time per group (from timePerClientData) ── */
// // // // // // // //     const mappedTimePerGroup = React.useMemo(() => {
// // // // // // // //         return timePerClientData.reduce((acc, row) => {
// // // // // // // //             const groupName = row.group_name;
// // // // // // // //             if (!groupName || groupName === 'N/A') return acc;
// // // // // // // //             const existing = acc.find(g => g.client_group_name === groupName);
// // // // // // // //             if (existing) {
// // // // // // // //                 existing.total_hours += row.total_hours;
// // // // // // // //             } else {
// // // // // // // //                 acc.push({
// // // // // // // //                     client_group_name: groupName,
// // // // // // // //                     spoc_name:         row.spoc_name,
// // // // // // // //                     total_hours:       row.total_hours,
// // // // // // // //                 });
// // // // // // // //             }
// // // // // // // //             return acc;
// // // // // // // //         }, []);
// // // // // // // //     }, [timePerClientData]);

// // // // // // // //     const handleClearFilters = () => {
// // // // // // // //         setDateRange(null);
// // // // // // // //         setSelectedClient([]);
// // // // // // // //         setSelectedTeam([]);
// // // // // // // //         setSelectedClientGroup([]);
// // // // // // // //         setSelectedSubService([]);
// // // // // // // //     };

// // // // // // // //     /* ── Client modal ── */
// // // // // // // //     const processClientTaskSummary = useCallback((tasks) => {
// // // // // // // //         const employeeTime   = {};
// // // // // // // //         const subServiceTime = {};
// // // // // // // //         let totalClientTime  = 0;

// // // // // // // //         tasks.forEach(task => {
// // // // // // // //             const subName = getSubServiceName(task.sub_service) || 'N/A';
// // // // // // // //             getFlatTimeEntries(task).forEach(entry => {
// // // // // // // //                 if (entry.start_time && entry.end_time) {
// // // // // // // //                     const millis = moment(entry.end_time).diff(moment(entry.start_time));
// // // // // // // //                     if (millis > 0) {
// // // // // // // //                         const empName = entry.employee_name || 'N/A';
// // // // // // // //                         employeeTime[empName]   = (employeeTime[empName]   || 0) + millis;
// // // // // // // //                         subServiceTime[subName] = (subServiceTime[subName] || 0) + millis;
// // // // // // // //                         totalClientTime        += millis;
// // // // // // // //                     }
// // // // // // // //                 }
// // // // // // // //             });
// // // // // // // //         });

// // // // // // // //         return {
// // // // // // // //             employeeDetails: Object.entries(employeeTime).map(([name, ms]) => ({
// // // // // // // //                 name, totalTime: formatDurationFromMillis(ms),
// // // // // // // //             })),
// // // // // // // //             subServiceDetails: Object.entries(subServiceTime).map(([name, ms]) => ({
// // // // // // // //                 name, totalTime: formatDurationFromMillis(ms),
// // // // // // // //             })),
// // // // // // // //             totalClientTime: formatDurationFromMillis(totalClientTime),
// // // // // // // //         };
// // // // // // // //     }, [getSubServiceName]);

// // // // // // // //     // const handleClientClick = useCallback((clientId) => {
// // // // // // // //     //     const tasksData = (dashboardData?.tasks || []).filter(t => t.client === clientId);
// // // // // // // //     //     const summary   = processClientTaskSummary(tasksData);
// // // // // // // //     //     setSelectedClientDetails({
// // // // // // // //     //         client: clients.find(c => c.id === clientId),
// // // // // // // //     //         tasks:  tasksData,
// // // // // // // //     //     });
// // // // // // // //     //     setClientTaskSummary(summary);
// // // // // // // //     // }, [dashboardData, clients, processClientTaskSummary]);

// // // // // // // //     const handleClientClick = useCallback(async (clientId) => {
// // // // // // // //         const client = clients.find(c => c.id === clientId);
// // // // // // // //         setSelectedClientDetails({ client, tasks: [] });
// // // // // // // //         setClientTaskSummary(null);
// // // // // // // //         setClientModalVisible(true);
// // // // // // // //         setClientModalLoading(true);

// // // // // // // //         try {
// // // // // // // //             const [startDate, endDate] = dateRange || [null, null];
// // // // // // // //             const params = { client_id: clientId };
// // // // // // // //             if (startDate) params.start_date = startDate.format('YYYY-MM-DD');
// // // // // // // //             if (endDate)   params.end_date   = endDate.format('YYYY-MM-DD');

// // // // // // // //             const res = await api.get('/clients/tasks/client_task_summary/', { params });
// // // // // // // //             const d   = res.data;

// // // // // // // //             setClientTaskSummary({
// // // // // // // //                 totalClientTime:   formatDurationFromMillis(d.total_hours_ms),
// // // // // // // //                 doneTasks:         d.done_count,
// // // // // // // //                 employeeDetails:   d.employees.map(e => ({
// // // // // // // //                     name:      e.name,
// // // // // // // //                     totalTime: formatDurationFromMillis(e.ms),
// // // // // // // //                 })),
// // // // // // // //                 subServiceDetails: d.sub_services.map(s => ({
// // // // // // // //                     name:      s.name,
// // // // // // // //                     totalTime: formatDurationFromMillis(s.ms),
// // // // // // // //                 })),
// // // // // // // //             });
// // // // // // // //         } catch (err) {
// // // // // // // //             console.error('client_task_summary error:', err);
// // // // // // // //             message.error('Failed to load client details');
// // // // // // // //         } finally {
// // // // // // // //             setClientModalLoading(false);
// // // // // // // //         }
// // // // // // // //     }, [clients, dateRange]);

// // // // // // // //     /* ── Derived: pie chart data ── */
// // // // // // // //     const taskStatusData = React.useMemo(() =>
// // // // // // // //         dashboardData?.status_counts
// // // // // // // //             ? Object.entries(dashboardData.status_counts)
// // // // // // // //                 .filter(([k, v]) => k !== 'total' && v > 0)
// // // // // // // //                 .map(([name, value]) => ({ name, value }))
// // // // // // // //             : []
// // // // // // // //     , [dashboardData]);

// // // // // // // //     /* ── Column definitions ── */
// // // // // // // //     const timePerClientColumns = [
// // // // // // // //         { title:'Sl. No.', render:(_,__,i) => i+1, width:70 },
// // // // // // // //         { title:'Client',  dataIndex:'client_name', key:'client_name', width:300 },
// // // // // // // //         { title:'SPOC',    dataIndex:'spoc_name',   key:'spoc_name' },
// // // // // // // //         { title:'Total Hours', render:(_, r) => formatDurationFromMillis(r.total_hours) },
// // // // // // // //     ];

// // // // // // // //     const timePerGroupColumns = [
// // // // // // // //         { title:'Sl. No.',      render:(_,__,i) => i+1, width:70 },
// // // // // // // //         { title:'Client Group', dataIndex:'client_group_name', key:'client_group_name' },
// // // // // // // //         { title:'SPOC',         dataIndex:'spoc_name',         key:'spoc_name' },
// // // // // // // //         {
// // // // // // // //             title:'Total Hours',
// // // // // // // //             render:(_, r) => formatDurationFromMillis(r.total_hours),
// // // // // // // //             sorter:(a, b) => a.total_hours - b.total_hours,
// // // // // // // //         },
// // // // // // // //     ];

// // // // // // // //     /* ── Loading / Error states ── */
// // // // // // // //     if (loading && !dashboardData) {
// // // // // // // //         return (
// // // // // // // //             <div style={{ textAlign:'center', marginTop:50 }}>
// // // // // // // //                 <Title level={4}>Loading Dashboard...</Title>
// // // // // // // //             </div>
// // // // // // // //         );
// // // // // // // //     }
// // // // // // // //     if (error && !dashboardData) {
// // // // // // // //         return (
// // // // // // // //             <div style={{ padding:50, textAlign:'center', color:'red' }}>
// // // // // // // //                 <Title level={4}>{error}</Title>
// // // // // // // //                 <Button onClick={fetchInitialData}>Retry</Button>
// // // // // // // //             </div>
// // // // // // // //         );
// // // // // // // //     }

// // // // // // // //     // ── rest of JSX is unchanged — just update dataSource and summary ──
// // // // // // // //     // dataSource={timePerClientData}  (already done in your current code)
// // // // // // // //     // dataSource={mappedTimePerGroup} (already done)
// // // // // // // //     // summary total: timePerClientData.reduce((s, r) => s + r.total_hours, 0)

// // // // // // // //     /* ── Render ── */
// // // // // // // //     return (
// // // // // // // //         <div style={{ padding:24 }}>

// // // // // // // //             {/* Header */}
// // // // // // // //             <Row justify="space-between" align="middle" style={{ marginBottom:16 }}>
// // // // // // // //                 <Col><Title level={2}>Task Dashboard</Title></Col>
// // // // // // // //                 <Col>
// // // // // // // //                     <Button type="primary" onClick={() => navigate('/stt-records')}>
// // // // // // // //                         Back to STT Records
// // // // // // // //                     </Button>
// // // // // // // //                 </Col>
// // // // // // // //             </Row>

// // // // // // // //             {/* Filters */}
// // // // // // // //             <Collapse
// // // // // // // //                 activeKey={activeFilterKey}
// // // // // // // //                 onChange={setActiveFilterKey}
// // // // // // // //                 style={{ marginBottom:24, background:'#fff', borderRadius:12, boxShadow:'0 2px 10px rgba(0,0,0,.05)' }}
// // // // // // // //             >
// // // // // // // //                 <Panel
// // // // // // // //                     key="1"
// // // // // // // //                     header={
// // // // // // // //                         <Space>
// // // // // // // //                             <FilterOutlined style={{ fontSize:18 }}/>
// // // // // // // //                             <Title level={5} style={{ margin:0 }}>Filters</Title>
// // // // // // // //                         </Space>
// // // // // // // //                     }
// // // // // // // //                 >
// // // // // // // //                     <Row gutter={[16,16]}>
// // // // // // // //                         <Col xs={24} sm={12} md={8} lg={6}>
// // // // // // // //                             <RangePicker style={{ width:'100%' }} value={dateRange} onChange={setDateRange}/>
// // // // // // // //                         </Col>
// // // // // // // //                         <Col xs={24} sm={12} md={8} lg={6}>
// // // // // // // //                             <Select mode="multiple" placeholder="Client Group" allowClear showSearch
// // // // // // // //                                 style={{ width:'100%' }} value={selectedClientGroup} onChange={setSelectedClientGroup}
// // // // // // // //                                 filterOption={(inp, opt) => (opt?.children??'').toLowerCase().includes(inp.toLowerCase())}>
// // // // // // // //                                 {clientGroups.map(g => <Option key={g.id} value={g.id}>{g.group_name}</Option>)}
// // // // // // // //                             </Select>
// // // // // // // //                         </Col>
// // // // // // // //                         <Col xs={24} sm={12} md={8} lg={6}>
// // // // // // // //                             <Select mode="multiple" placeholder="Client" allowClear showSearch
// // // // // // // //                                 style={{ width:'100%' }} value={selectedClient} onChange={setSelectedClient}
// // // // // // // //                                 filterOption={(inp, opt) => (opt?.children??'').toLowerCase().includes(inp.toLowerCase())}>
// // // // // // // //                                 {clients.map(c => <Option key={c.id} value={c.id}>{c.name}</Option>)}
// // // // // // // //                             </Select>
// // // // // // // //                         </Col>
// // // // // // // //                         <Col xs={24} sm={12} md={8} lg={6}>
// // // // // // // //                             <Select mode="multiple" placeholder="Team" allowClear showSearch
// // // // // // // //                                 style={{ width:'100%' }} value={selectedTeam} onChange={setSelectedTeam}
// // // // // // // //                                 filterOption={(inp, opt) => (opt?.children??'').toLowerCase().includes(inp.toLowerCase())}>
// // // // // // // //                                 {teams.map(t => <Option key={t.id} value={t.id}>{t.name}</Option>)}
// // // // // // // //                             </Select>
// // // // // // // //                         </Col>
// // // // // // // //                         <Col xs={24} sm={12} md={8} lg={6}>
// // // // // // // //                             <Select mode="multiple" placeholder="Sub Service" allowClear showSearch
// // // // // // // //                                 style={{ width:'100%' }} value={selectedSubService} onChange={setSelectedSubService}
// // // // // // // //                                 filterOption={(inp, opt) => (opt?.children??'').toLowerCase().includes(inp.toLowerCase())}>
// // // // // // // //                                 {subServices.map(s => <Option key={s.id} value={s.id}>{s.name}</Option>)}
// // // // // // // //                             </Select>
// // // // // // // //                         </Col>
// // // // // // // //                         <Col xs={24} style={{ textAlign:'right' }}>
// // // // // // // //                             <Button icon={<ClearOutlined/>} onClick={handleClearFilters} danger>
// // // // // // // //                                 Clear Filters
// // // // // // // //                             </Button>
// // // // // // // //                         </Col>
// // // // // // // //                     </Row>
// // // // // // // //                 </Panel>
// // // // // // // //             </Collapse>

// // // // // // // //             {/* Stat cards */}
// // // // // // // //             <Row gutter={[16,16]} style={{ marginBottom:24, display:'flex', flexWrap:'nowrap' }}>
// // // // // // // //                 {[
// // // // // // // //                     { title:'All Tasks',   value:taskCounts.allTasks,   icon:<FcList/>,                    color:TASK_STATUS_COLORS['All Tasks'],   status:'all'         },
// // // // // // // //                     { title:'To Do',       value:taskCounts.toDo,       icon:<ClockCircleOutlined/>,        color:TASK_STATUS_COLORS['To Do'],       status:'To Do'       },
// // // // // // // //                     { title:'In Progress', value:taskCounts.inProgress, icon:<MinusCircleOutlined/>,        color:TASK_STATUS_COLORS['In Progress'], status:'In Progress' },
// // // // // // // //                     { title:'Done',        value:taskCounts.done,       icon:<CheckCircleOutlined/>,        color:TASK_STATUS_COLORS['Done'],        status:'Done'        },
// // // // // // // //                     { title:'Over Due',    value:taskCounts.overdue,    icon:<ExclamationCircleOutlined/>,  color:TASK_STATUS_COLORS['Over Due'],    status:'Over Due'    },
// // // // // // // //                 ].map((card, i) => (
// // // // // // // //                     <Col key={i} style={{ flex:1, display:'flex' }}>
// // // // // // // //                         <DashboardCard
// // // // // // // //                             {...card}
// // // // // // // //                             onClick={() => {
// // // // // // // //                                 const params = new URLSearchParams();
// // // // // // // //                                 params.set('status', card.status);
// // // // // // // //                                 if (dateRange?.[0]) params.set('start_date', dateRange[0].format('YYYY-MM-DD'));
// // // // // // // //                                 if (dateRange?.[1]) params.set('end_date',   dateRange[1].format('YYYY-MM-DD'));
// // // // // // // //                                 if (selectedClient?.length)      params.set('client_id',       selectedClient.join(','));
// // // // // // // //                                 if (selectedTeam?.length)        params.set('team_id',          selectedTeam.join(','));
// // // // // // // //                                 if (selectedClientGroup?.length) params.set('client_group_id',  selectedClientGroup.join(','));
// // // // // // // //                                 if (selectedSubService?.length)  params.set('sub_service_id',   selectedSubService.join(','));
// // // // // // // //                                 navigate(`/stt-records?${params.toString()}`);
// // // // // // // //                             }}
// // // // // // // //                         />
// // // // // // // //                     </Col>
// // // // // // // //                 ))}
// // // // // // // //             </Row>

// // // // // // // //             {/* Charts + Tables */}
// // // // // // // //             <Row gutter={[16,16]} align="top">

// // // // // // // //                 {/* Pie chart */}
// // // // // // // //                 <Col xs={24} lg={10}>
// // // // // // // //                     <Card bordered={false} title="Task Status Overview">
// // // // // // // //                         <EChartsReact
// // // // // // // //                             option={getTaskStatusOptions(taskStatusData)}
// // // // // // // //                             style={{ height:400 }}
// // // // // // // //                         />
// // // // // // // //                     </Card>
// // // // // // // //                 </Col>

// // // // // // // //                 {/* Time spent table */}
// // // // // // // //                 <Col xs={24} lg={14}>
// // // // // // // //                     <Card
// // // // // // // //                         bordered={false}
// // // // // // // //                         title={
// // // // // // // //                             <Space align="baseline" style={{ justifyContent:'space-between', width:'100%', flexWrap:'wrap' }}>
// // // // // // // //                                 <Title level={4} style={{ marginBottom:0 }}>Total Time Spent</Title>
// // // // // // // //                                 <Segmented
// // // // // // // //                                     options={['Client','Client Group']}
// // // // // // // //                                     value={tableView === 'client' ? 'Client' : 'Client Group'}
// // // // // // // //                                     onChange={v => setTableView(v === 'Client' ? 'client' : 'group')}
// // // // // // // //                                 />
// // // // // // // //                             </Space>
// // // // // // // //                         }
// // // // // // // //                     >
// // // // // // // //                         {tableView === 'client' ? (
// // // // // // // //                             <Table
// // // // // // // //                                 columns={timePerClientColumns}
// // // // // // // //                                 dataSource={timePerClientData}
// // // // // // // //                                 rowKey="client_id"
// // // // // // // //                                 size="middle"
// // // // // // // //                                 scroll={{ x:'max-content' }}
// // // // // // // //                                 pagination={{ pageSize:15, size:'small', style:{ padding:'12px 20px' } }}
// // // // // // // //                                 onRow={record => ({
// // // // // // // //                                     onClick: () => {
// // // // // // // //                                         handleClientClick(record.client_id);
// // // // // // // //                                         setClientModalVisible(true);
// // // // // // // //                                     },
// // // // // // // //                                     style: { cursor:'pointer' },
// // // // // // // //                                 })}
// // // // // // // //                                 summary={() => (
// // // // // // // //                                     <Table.Summary.Row>
// // // // // // // //                                         <Table.Summary.Cell index={0} colSpan={3}>
// // // // // // // //                                             <Text strong>Total</Text>
// // // // // // // //                                         </Table.Summary.Cell>
// // // // // // // //                                         <Table.Summary.Cell index={1}>
// // // // // // // //                                             <Text strong>
// // // // // // // //                                                 {formatDurationFromMillis(
// // // // // // // //                                                     timePerClientData.reduce((s, r) => s + r.total_hours, 0)
// // // // // // // //                                                 )}
// // // // // // // //                                             </Text>
// // // // // // // //                                         </Table.Summary.Cell>
// // // // // // // //                                     </Table.Summary.Row>
// // // // // // // //                                 )}
// // // // // // // //                             />
// // // // // // // //                         ) : (
// // // // // // // //                             <Table
// // // // // // // //                                 columns={timePerGroupColumns}
// // // // // // // //                                 dataSource={mappedTimePerGroup}
// // // // // // // //                                 rowKey="client_group_name"
// // // // // // // //                                 size="middle"
// // // // // // // //                                 scroll={{ x:'max-content' }}
// // // // // // // //                                 pagination={{ pageSize:15, size:'small', style:{ padding:'12px 20px' } }}
// // // // // // // //                             />
// // // // // // // //                         )}
// // // // // // // //                     </Card>
// // // // // // // //                 </Col>
// // // // // // // //             </Row>

// // // // // // // //             {/* Client detail modal */}
// // // // // // // //             <Modal
// // // // // // // //                 open={clientModalVisible}
// // // // // // // //                 onCancel={() => setClientModalVisible(false)}
// // // // // // // //                 footer={null}
// // // // // // // //                 width={800}
// // // // // // // //                 title={
// // // // // // // //                     selectedClientDetails
// // // // // // // //                         ? `Client Details — ${selectedClientDetails.client?.name || ''}`
// // // // // // // //                         : 'Client Details'
// // // // // // // //                 }
// // // // // // // //             >
// // // // // // // //                 {clientModalLoading ? (
// // // // // // // //                     <div style={{ textAlign: 'center', padding: 40 }}>
// // // // // // // //                         <Title level={5}>Loading...</Title>
// // // // // // // //                     </div>
// // // // // // // //                 ) : clientTaskSummary ? (
// // // // // // // //                     <>
// // // // // // // //                         <p><strong>Group:</strong> {getGroupNameFromClient(selectedClientDetails.client)}</p>
// // // // // // // //                         <p><strong>SPOC:</strong>  {getSpocNameFromClient(selectedClientDetails.client)}</p>
// // // // // // // //                         <p><strong>Total Done Tasks:</strong> {clientTaskSummary.doneTasks}</p>
// // // // // // // //                         <p><strong>Total Time Taken:</strong> {clientTaskSummary.totalClientTime}</p>

// // // // // // // //                         <Title level={5}>Employee Time Summary</Title>
// // // // // // // //                         <Table
// // // // // // // //                             size="small"
// // // // // // // //                             dataSource={clientTaskSummary.employeeDetails.map(e => ({
// // // // // // // //                                 key: e.name, employee: e.name, totalTime: e.totalTime,
// // // // // // // //                             }))}
// // // // // // // //                             columns={[
// // // // // // // //                                 { title: 'Employee',   dataIndex: 'employee'  },
// // // // // // // //                                 { title: 'Total Time', dataIndex: 'totalTime' },
// // // // // // // //                             ]}
// // // // // // // //                             pagination={false}
// // // // // // // //                         />

// // // // // // // //                         <Title level={5} style={{ marginTop: 16 }}>Sub-Service Time Summary</Title>
// // // // // // // //                         <Table
// // // // // // // //                             size="small"
// // // // // // // //                             dataSource={clientTaskSummary.subServiceDetails.map(s => ({
// // // // // // // //                                 key: s.name, subservice: s.name, totalTime: s.totalTime,
// // // // // // // //                             }))}
// // // // // // // //                             columns={[
// // // // // // // //                                 { title: 'Sub-Service', dataIndex: 'subservice' },
// // // // // // // //                                 { title: 'Total Time',  dataIndex: 'totalTime'  },
// // // // // // // //                             ]}
// // // // // // // //                             pagination={false}
// // // // // // // //                         />
// // // // // // // //                     </>
// // // // // // // //                 ) : null}
// // // // // // // //             </Modal>

// // // // // // // //         </div>
// // // // // // // //     );
// // // // // // // // };

// // // // // // // // export default TaskDashboard;


// // // // // // // import React, { useState, useEffect, useCallback, useMemo } from 'react';
// // // // // // // import {
// // // // // // //     Card, Col, Row, Typography, message, Table, DatePicker,
// // // // // // //     Select, Space, Button, Segmented, Collapse, Modal, Spin, Tag, Progress,
// // // // // // // } from 'antd';
// // // // // // // import { api } from '../../../services/api';
// // // // // // // import EChartsReact from 'echarts-for-react';
// // // // // // // import CountUp from 'react-countup';
// // // // // // // import {
// // // // // // //     ClockCircleOutlined, CheckCircleOutlined,
// // // // // // //     MinusCircleOutlined, ExclamationCircleOutlined,
// // // // // // //     FilterOutlined, ClearOutlined, ReloadOutlined,
// // // // // // //     ArrowUpOutlined, ArrowDownOutlined, TeamOutlined,
// // // // // // // } from '@ant-design/icons';
// // // // // // // import { FcList } from 'react-icons/fc';
// // // // // // // import moment from 'moment';
// // // // // // // import { formatDurationFromMillis } from './STT_Records';
// // // // // // // import { useNavigate } from 'react-router-dom';

// // // // // // // const { Title, Text } = Typography;
// // // // // // // const { RangePicker } = DatePicker;
// // // // // // // const { Option } = Select;
// // // // // // // const { Panel } = Collapse;

// // // // // // // /* ─── Design tokens ─────────────────────────────────────────── */
// // // // // // // const C = {
// // // // // // //     done:       '#10b981',
// // // // // // //     inProgress: '#f59e0b',
// // // // // // //     overdue:    '#ef4444',
// // // // // // //     toDo:       '#6366f1',
// // // // // // //     all:        '#0f172a',
// // // // // // //     bg:         '#f8fafc',
// // // // // // //     surface:    '#ffffff',
// // // // // // //     border:     '#e2e8f0',
// // // // // // //     text:       '#0f172a',
// // // // // // //     muted:      '#64748b',
// // // // // // // };

// // // // // // // const STATUS_META = {
// // // // // // //     'Done':        { color: C.done,       light: '#d1fae5', icon: '✓' },
// // // // // // //     'In Progress': { color: C.inProgress, light: '#fef3c7', icon: '◐' },
// // // // // // //     'Over Due':    { color: C.overdue,    light: '#fee2e2', icon: '!' },
// // // // // // //     'To Do':       { color: C.toDo,       light: '#ede9fe', icon: '○' },
// // // // // // // };

// // // // // // // /* ─── Stat Card ─────────────────────────────────────────────── */
// // // // // // // const StatCard = ({ title, value, color, lightColor, icon, subtitle, onClick, loading }) => (
// // // // // // //     <div
// // // // // // //         onClick={onClick}
// // // // // // //         style={{
// // // // // // //             background: C.surface,
// // // // // // //             borderRadius: 16,
// // // // // // //             padding: '20px 24px',
// // // // // // //             cursor: 'pointer',
// // // // // // //             border: `1px solid ${C.border}`,
// // // // // // //             borderLeft: `4px solid ${color}`,
// // // // // // //             transition: 'all 0.2s',
// // // // // // //             flex: 1,
// // // // // // //             minWidth: 0,
// // // // // // //             boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
// // // // // // //             position: 'relative',
// // // // // // //             overflow: 'hidden',
// // // // // // //         }}
// // // // // // //         onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 8px 24px ${color}22`; }}
// // // // // // //         onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)'; }}
// // // // // // //     >
// // // // // // //         <div style={{ position: 'absolute', right: 20, top: 16, width: 48, height: 48, borderRadius: 12, background: lightColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color }}>
// // // // // // //             {icon}
// // // // // // //         </div>
// // // // // // //         <Text style={{ fontSize: 12, fontWeight: 600, color: C.muted, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
// // // // // // //             {title}
// // // // // // //         </Text>
// // // // // // //         <div style={{ marginTop: 6 }}>
// // // // // // //             {loading ? (
// // // // // // //                 <div style={{ fontSize: 28, fontWeight: 700, color: C.text }}>—</div>
// // // // // // //             ) : (
// // // // // // //                 <CountUp end={value} duration={1.8} style={{ fontSize: 32, fontWeight: 800, color, lineHeight: 1 }} />
// // // // // // //             )}
// // // // // // //         </div>
// // // // // // //         {subtitle && <Text style={{ fontSize: 11, color: C.muted, marginTop: 4, display: 'block' }}>{subtitle}</Text>}
// // // // // // //     </div>
// // // // // // // );

// // // // // // // /* ─── Section header ────────────────────────────────────────── */
// // // // // // // const SectionTitle = ({ children, extra }) => (
// // // // // // //     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
// // // // // // //         <Text style={{ fontSize: 15, fontWeight: 700, color: C.text, letterSpacing: '-0.01em' }}>{children}</Text>
// // // // // // //         {extra}
// // // // // // //     </div>
// // // // // // // );

// // // // // // // /* ─── Chart helpers ─────────────────────────────────────────── */
// // // // // // // const pieOption = (data) => ({
// // // // // // //     backgroundColor: 'transparent',
// // // // // // //     tooltip: { trigger: 'item', formatter: '{b}: <b>{c}</b> ({d}%)', backgroundColor: '#1e293b', borderColor: 'transparent', textStyle: { color: '#f1f5f9', fontSize: 13 } },
// // // // // // //     legend: { orient: 'horizontal', bottom: 0, left: 'center', textStyle: { color: C.muted, fontSize: 12 }, itemWidth: 10, itemHeight: 10 },
// // // // // // //     series: [{
// // // // // // //         type: 'pie',
// // // // // // //         radius: ['42%', '70%'],
// // // // // // //         center: ['50%', '44%'],
// // // // // // //         avoidLabelOverlap: true,
// // // // // // //         itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
// // // // // // //         label: { show: true, formatter: '{b}\n{c}', fontSize: 11, color: C.muted, lineHeight: 16 },
// // // // // // //         labelLine: { length: 10, length2: 6 },
// // // // // // //         data: data.map(d => ({ ...d, itemStyle: { color: STATUS_META[d.name]?.color || '#94a3b8' } })),
// // // // // // //         emphasis: { itemStyle: { shadowBlur: 12, shadowColor: 'rgba(0,0,0,0.15)' } },
// // // // // // //     }],
// // // // // // // });

// // // // // // // const barOption = (data, title = '') => ({
// // // // // // //     backgroundColor: 'transparent',
// // // // // // //     tooltip: {
// // // // // // //         trigger: 'axis',
// // // // // // //         axisPointer: { type: 'shadow' },
// // // // // // //         backgroundColor: '#1e293b',
// // // // // // //         borderColor: 'transparent',
// // // // // // //         textStyle: { color: '#f1f5f9', fontSize: 12 },
// // // // // // //         formatter: (params) => {
// // // // // // //             const p = params[0];
// // // // // // //             return `<b>${p.name}</b><br/>${formatDurationFromMillis(p.value)}`;
// // // // // // //         },
// // // // // // //     },
// // // // // // //     grid: { top: 16, right: 16, bottom: 40, left: 16, containLabel: true },
// // // // // // //     xAxis: {
// // // // // // //         type: 'category',
// // // // // // //         data: data.map(d => d.name.length > 14 ? d.name.slice(0, 13) + '…' : d.name),
// // // // // // //         axisLabel: { color: C.muted, fontSize: 11, rotate: data.length > 5 ? 30 : 0 },
// // // // // // //         axisLine: { lineStyle: { color: C.border } },
// // // // // // //         axisTick: { show: false },
// // // // // // //     },
// // // // // // //     yAxis: {
// // // // // // //         type: 'value',
// // // // // // //         axisLabel: { color: C.muted, fontSize: 11, formatter: v => formatDurationFromMillis(v) },
// // // // // // //         splitLine: { lineStyle: { color: C.border, type: 'dashed' } },
// // // // // // //         axisLine: { show: false },
// // // // // // //         axisTick: { show: false },
// // // // // // //     },
// // // // // // //     series: [{
// // // // // // //         type: 'bar',
// // // // // // //         data: data.map((d, i) => ({
// // // // // // //             value: d.ms || d.total_hours || 0,
// // // // // // //             itemStyle: {
// // // // // // //                 color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: '#6366f1' }, { offset: 1, color: '#818cf8' }] },
// // // // // // //                 borderRadius: [6, 6, 0, 0],
// // // // // // //             },
// // // // // // //         })),
// // // // // // //         barMaxWidth: 48,
// // // // // // //         emphasis: { itemStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: '#4f46e5' }, { offset: 1, color: '#6366f1' }] } } },
// // // // // // //     }],
// // // // // // // });

// // // // // // // const hBarOption = (data) => ({
// // // // // // //     backgroundColor: 'transparent',
// // // // // // //     tooltip: {
// // // // // // //         trigger: 'axis',
// // // // // // //         axisPointer: { type: 'shadow' },
// // // // // // //         backgroundColor: '#1e293b',
// // // // // // //         borderColor: 'transparent',
// // // // // // //         textStyle: { color: '#f1f5f9', fontSize: 12 },
// // // // // // //         formatter: (params) => {
// // // // // // //             const p = params[0];
// // // // // // //             return `<b>${p.name}</b><br/>${formatDurationFromMillis(p.value)}`;
// // // // // // //         },
// // // // // // //     },
// // // // // // //     grid: { top: 8, right: 80, bottom: 8, left: 16, containLabel: true },
// // // // // // //     xAxis: { type: 'value', axisLabel: { formatter: v => formatDurationFromMillis(v), color: C.muted, fontSize: 10 }, splitLine: { lineStyle: { color: C.border, type: 'dashed' } }, axisLine: { show: false }, axisTick: { show: false } },
// // // // // // //     yAxis: { type: 'category', data: data.map(d => d.name?.length > 16 ? d.name.slice(0, 15) + '…' : d.name || 'N/A'), axisLabel: { color: C.muted, fontSize: 11 }, axisLine: { show: false }, axisTick: { show: false } },
// // // // // // //     series: [{
// // // // // // //         type: 'bar',
// // // // // // //         data: data.map(d => ({
// // // // // // //             value: d.ms || d.total_hours || 0,
// // // // // // //             itemStyle: { color: { type: 'linear', x: 0, y: 0, x2: 1, y2: 0, colorStops: [{ offset: 0, color: '#06b6d4' }, { offset: 1, color: '#0ea5e9' }] }, borderRadius: [0, 6, 6, 0] },
// // // // // // //         })),
// // // // // // //         barMaxWidth: 20,
// // // // // // //         label: { show: true, position: 'right', formatter: p => formatDurationFromMillis(p.value), color: C.muted, fontSize: 10 },
// // // // // // //     }],
// // // // // // // });

// // // // // // // /* ══════════════ MAIN COMPONENT ══════════════ */
// // // // // // // const TaskDashboard = () => {
// // // // // // //     const navigate = useNavigate();

// // // // // // //     const [loading,             setLoading]             = useState(true);
// // // // // // //     const [dashboardData,       setDashboardData]       = useState(null);
// // // // // // //     const [error,               setError]               = useState(null);
// // // // // // //     const [dateRange,           setDateRange]           = useState(null);
// // // // // // //     const [clients,             setClients]             = useState([]);
// // // // // // //     const [selectedClient,      setSelectedClient]      = useState([]);
// // // // // // //     const [teams,               setTeams]               = useState([]);
// // // // // // //     const [selectedTeam,        setSelectedTeam]        = useState([]);
// // // // // // //     const [clientGroups,        setClientGroups]        = useState([]);
// // // // // // //     const [selectedClientGroup, setSelectedClientGroup] = useState([]);
// // // // // // //     const [allSpocs,            setAllSpocs]            = useState([]);
// // // // // // //     const [subServices,         setSubServices]         = useState([]);
// // // // // // //     const [selectedSubService,  setSelectedSubService]  = useState([]);
// // // // // // //     const [tableView,           setTableView]           = useState('client');
// // // // // // //     const [taskCounts,          setTaskCounts]          = useState({ allTasks: 0, done: 0, toDo: 0, overdue: 0, inProgress: 0 });
// // // // // // //     const [activeFilterKey,     setActiveFilterKey]     = useState([]);
// // // // // // //     const [timePerClientData,   setTimePerClientData]   = useState([]);

// // // // // // //     // Modal
// // // // // // //     const [clientModalVisible,   setClientModalVisible]   = useState(false);
// // // // // // //     const [clientModalLoading,   setClientModalLoading]   = useState(false);
// // // // // // //     const [selectedClientInfo,   setSelectedClientInfo]   = useState(null);
// // // // // // //     const [clientSummary,        setClientSummary]        = useState(null);

// // // // // // //     /* ── Lookup helpers ── */
// // // // // // //     const getSpocName = useCallback((client) => {
// // // // // // //         if (!client) return 'N/A';
// // // // // // //         if (client.primary_spoc_name) return client.primary_spoc_name;
// // // // // // //         const group = clientGroups.find(g => g.clients?.some(cg => (typeof cg === 'object' ? cg.id : cg) === client.id));
// // // // // // //         return group?.primary_spoc_name || 'N/A';
// // // // // // //     }, [clientGroups]);

// // // // // // //     const getGroupName = useCallback((client) => {
// // // // // // //         if (!client) return 'N/A';
// // // // // // //         const group = clientGroups.find(g => g.clients?.some(cg => (typeof cg === 'object' ? cg.id : cg) === client.id));
// // // // // // //         return group?.group_name || 'N/A';
// // // // // // //     }, [clientGroups]);

// // // // // // //     /* ── Build params ── */
// // // // // // //     const buildParams = useCallback((filters = {}) => {
// // // // // // //         const p = {
// // // // // // //             start_date:      filters.startDate?.format('YYYY-MM-DD'),
// // // // // // //             end_date:        filters.endDate?.format('YYYY-MM-DD'),
// // // // // // //             client_id:       filters.clientId?.join?.(','),
// // // // // // //             team_id:         filters.teamId?.join?.(','),
// // // // // // //             client_group_id: filters.clientGroupId?.join?.(','),
// // // // // // //             sub_service_id:  filters.subServiceId?.join?.(','),
// // // // // // //         };
// // // // // // //         Object.keys(p).forEach(k => !p[k] && delete p[k]);
// // // // // // //         return p;
// // // // // // //     }, []);

// // // // // // //     /* ── Fetch dashboard summary ── */
// // // // // // //     const fetchDashboard = useCallback(async (filters = {}) => {
// // // // // // //         setLoading(true);
// // // // // // //         try {
// // // // // // //             const res = await api.get('/clients/tasks/dashboard_summary/', { params: buildParams(filters) });
// // // // // // //             setDashboardData(res.data);
// // // // // // //         } catch (err) {
// // // // // // //             console.error(err);
// // // // // // //             setError('Failed to load dashboard data.');
// // // // // // //             message.error('Failed to load dashboard.');
// // // // // // //         } finally {
// // // // // // //             setLoading(false);
// // // // // // //         }
// // // // // // //     }, [buildParams]);

// // // // // // //     /* ── Fetch time per client ── */
// // // // // // //     const fetchTimePerClient = useCallback(async (filters = {}, clientsList = []) => {
// // // // // // //         try {
// // // // // // //             const res = await api.get('/clients/tasks/time_per_client/', { params: buildParams(filters) });
// // // // // // //             const list = clientsList.length ? clientsList : clients;
// // // // // // //             setTimePerClientData((res.data || []).map(row => {
// // // // // // //                 const c = list.find(x => x.id === row.client_id);
// // // // // // //                 return { ...row, total_hours: row.total_hours_ms, group_name: c ? getGroupName(c) : 'N/A', spoc_name: c ? getSpocName(c) : 'N/A' };
// // // // // // //             }));
// // // // // // //         } catch (err) {
// // // // // // //             console.error('fetchTimePerClient error:', err);
// // // // // // //         }
// // // // // // //     }, [clients, getGroupName, getSpocName, buildParams]);

// // // // // // //     /* ── Initial load ── */
// // // // // // //     const fetchInitialData = useCallback(async () => {
// // // // // // //         setLoading(true);
// // // // // // //         try {
// // // // // // //             const [cR, tR, gR, sR, ssR] = await Promise.all([
// // // // // // //                 api.get('/clients/clients/?page_size=500'),
// // // // // // //                 api.get('/employee/teams/'),
// // // // // // //                 api.get('/clients/client-groups/'),
// // // // // // //                 api.get('/employee/employees/'),
// // // // // // //                 api.get('/clients/subservices/'),
// // // // // // //             ]);
// // // // // // //             const cl = cR.data.results || cR.data;
// // // // // // //             setClients(cl);
// // // // // // //             setTeams(tR.data.results || tR.data);
// // // // // // //             setClientGroups(gR.data.results || gR.data);
// // // // // // //             setAllSpocs(sR.data.results || sR.data);
// // // // // // //             setSubServices(ssR.data.results || ssR.data);
// // // // // // //             await Promise.all([fetchDashboard({}), fetchTimePerClient({}, cl)]);
// // // // // // //         } catch (err) {
// // // // // // //             console.error(err);
// // // // // // //             setError('Failed to load initial data.');
// // // // // // //         } finally {
// // // // // // //             setLoading(false);
// // // // // // //         }
// // // // // // //     }, [fetchDashboard, fetchTimePerClient]);

// // // // // // //     useEffect(() => { fetchInitialData(); }, [fetchInitialData]);

// // // // // // //     /* ── Re-fetch on filter change ── */
// // // // // // //     useEffect(() => {
// // // // // // //         if (!clients.length) return;
// // // // // // //         const [startDate, endDate] = dateRange || [null, null];
// // // // // // //         const f = { startDate, endDate, clientId: selectedClient, teamId: selectedTeam, clientGroupId: selectedClientGroup, subServiceId: selectedSubService };
// // // // // // //         fetchDashboard(f);
// // // // // // //         fetchTimePerClient(f, clients);
// // // // // // //         // eslint-disable-next-line
// // // // // // //     }, [dateRange, selectedClient, selectedTeam, selectedClientGroup, selectedSubService]);

// // // // // // //     /* ── Derive counts ── */
// // // // // // //     useEffect(() => {
// // // // // // //         if (!dashboardData?.status_counts) return;
// // // // // // //         const sc = dashboardData.status_counts;
// // // // // // //         setTaskCounts({
// // // // // // //             allTasks:   (sc['To Do'] || 0) + (sc['In Progress'] || 0) + (sc['Done'] || 0) + (sc['Over Due'] || 0),
// // // // // // //             done:       sc['Done']        || 0,
// // // // // // //             toDo:       sc['To Do']       || 0,
// // // // // // //             inProgress: sc['In Progress'] || 0,
// // // // // // //             overdue:    sc['Over Due']    || 0,
// // // // // // //         });
// // // // // // //     }, [dashboardData]);

// // // // // // //     /* ── Time per group derived ── */
// // // // // // //     const timePerGroup = useMemo(() =>
// // // // // // //         timePerClientData.reduce((acc, row) => {
// // // // // // //             if (!row.group_name || row.group_name === 'N/A') return acc;
// // // // // // //             const ex = acc.find(g => g.client_group_name === row.group_name);
// // // // // // //             if (ex) { ex.total_hours += row.total_hours; }
// // // // // // //             else acc.push({ client_group_name: row.group_name, spoc_name: row.spoc_name, total_hours: row.total_hours });
// // // // // // //             return acc;
// // // // // // //         }, [])
// // // // // // //     , [timePerClientData]);

// // // // // // //     /* ── Pie data ── */
// // // // // // //     const pieData = useMemo(() =>
// // // // // // //         dashboardData?.status_counts
// // // // // // //             ? Object.entries(dashboardData.status_counts)
// // // // // // //                 .filter(([k, v]) => k !== 'total' && v > 0)
// // // // // // //                 .map(([name, value]) => ({ name, value }))
// // // // // // //             : []
// // // // // // //     , [dashboardData]);

// // // // // // //     /* ── Upcoming tasks ── */
// // // // // // //     const upcomingTasks = useMemo(() => (dashboardData?.tasks || []).slice(0, 8), [dashboardData]);

// // // // // // //     /* ── Top clients by time ── */
// // // // // // //     const topClients = useMemo(() => [...timePerClientData].sort((a, b) => b.total_hours - a.total_hours).slice(0, 8), [timePerClientData]);
// // // // // // //     const topGroups  = useMemo(() => [...timePerGroup].sort((a, b) => b.total_hours - a.total_hours).slice(0, 8), [timePerGroup]);

// // // // // // //     /* ── Filters ── */
// // // // // // //     const handleClearFilters = () => {
// // // // // // //         setDateRange(null);
// // // // // // //         setSelectedClient([]);
// // // // // // //         setSelectedTeam([]);
// // // // // // //         setSelectedClientGroup([]);
// // // // // // //         setSelectedSubService([]);
// // // // // // //     };

// // // // // // //     const activeFilterCount = [selectedClient, selectedTeam, selectedClientGroup, selectedSubService].filter(a => a.length).length + (dateRange ? 1 : 0);

// // // // // // //     /* ── Client modal ── */
// // // // // // //     const handleClientClick = useCallback(async (clientId) => {
// // // // // // //         const client = clients.find(c => c.id === clientId);
// // // // // // //         setSelectedClientInfo(client);
// // // // // // //         setClientSummary(null);
// // // // // // //         setClientModalVisible(true);
// // // // // // //         setClientModalLoading(true);
// // // // // // //         try {
// // // // // // //             const [startDate, endDate] = dateRange || [null, null];
// // // // // // //             const params = { client_id: clientId };
// // // // // // //             if (startDate) params.start_date = startDate.format('YYYY-MM-DD');
// // // // // // //             if (endDate)   params.end_date   = endDate.format('YYYY-MM-DD');
// // // // // // //             const res = await api.get('/clients/tasks/client_task_summary/', { params });
// // // // // // //             setClientSummary(res.data);
// // // // // // //         } catch (err) {
// // // // // // //             console.error(err);
// // // // // // //             message.error('Failed to load client details');
// // // // // // //         } finally {
// // // // // // //             setClientModalLoading(false);
// // // // // // //         }
// // // // // // //     }, [clients, dateRange]);

// // // // // // //     /* ── Navigate to task list ── */
// // // // // // //     const goToTasks = (status) => {
// // // // // // //         const params = new URLSearchParams();
// // // // // // //         if (status !== 'all') params.set('status', status);
// // // // // // //         const [s, e] = dateRange || [null, null];
// // // // // // //         if (s) params.set('start_date', s.format('YYYY-MM-DD'));
// // // // // // //         if (e) params.set('end_date', e.format('YYYY-MM-DD'));
// // // // // // //         if (selectedClient?.length)      params.set('client_id',      selectedClient.join(','));
// // // // // // //         if (selectedTeam?.length)        params.set('team_id',         selectedTeam.join(','));
// // // // // // //         if (selectedClientGroup?.length) params.set('client_group_id', selectedClientGroup.join(','));
// // // // // // //         if (selectedSubService?.length)  params.set('sub_service_id',  selectedSubService.join(','));
// // // // // // //         navigate(`/stt-records?${params.toString()}`);
// // // // // // //     };

// // // // // // //     /* ── Status badge ── */
// // // // // // //     const StatusBadge = ({ status }) => {
// // // // // // //         const meta = STATUS_META[status] || { color: C.muted, light: '#f1f5f9' };
// // // // // // //         return (
// // // // // // //             <span style={{ background: meta.light, color: meta.color, borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap' }}>
// // // // // // //                 {status}
// // // // // // //             </span>
// // // // // // //         );
// // // // // // //     };

// // // // // // //     /* ── Upcoming tasks columns ── */
// // // // // // //     const upcomingCols = [
// // // // // // //         { title: 'Task ID', dataIndex: 'task_id', key: 'task_id', width: 150, render: v => <Text style={{ fontFamily: 'monospace', fontSize: 11, color: C.muted }}>{v}</Text> },
// // // // // // //         { title: 'Client', dataIndex: 'client_name', key: 'client_name', ellipsis: true },
// // // // // // //         { title: 'Service', dataIndex: 'sub_service_name', key: 'sub_service_name', ellipsis: true },
// // // // // // //         { title: 'Due', dataIndex: 'due_date', key: 'due_date', width: 100, render: d => { const m = moment(d); const isLate = m.isBefore(moment(), 'day'); return <span style={{ color: isLate ? C.overdue : C.muted, fontWeight: isLate ? 600 : 400, fontSize: 12 }}>{m.format('DD MMM YY')}</span>; } },
// // // // // // //         { title: 'Status', dataIndex: 'status', key: 'status', width: 110, render: (_, r) => { const eff = r.due_date && moment(r.due_date).isBefore(moment(), 'day') && r.status !== 'Done' ? 'Over Due' : r.status; return <StatusBadge status={eff} />; } },
// // // // // // //     ];

// // // // // // //     /* ── Error / loading screen ── */
// // // // // // //     if (error && !dashboardData) {
// // // // // // //         return (
// // // // // // //             <div style={{ padding: 60, textAlign: 'center', background: C.bg, minHeight: '100vh' }}>
// // // // // // //                 <Text style={{ color: C.overdue, fontSize: 16 }}>{error}</Text>
// // // // // // //                 <br /><Button style={{ marginTop: 16 }} onClick={fetchInitialData} icon={<ReloadOutlined />}>Retry</Button>
// // // // // // //             </div>
// // // // // // //         );
// // // // // // //     }

// // // // // // //     const totalTime = timePerClientData.reduce((s, r) => s + (r.total_hours || 0), 0);
// // // // // // //     const completionRate = taskCounts.allTasks ? Math.round((taskCounts.done / taskCounts.allTasks) * 100) : 0;

// // // // // // //     /* ══════════════ RENDER ══════════════ */
// // // // // // //     return (
// // // // // // //         <div style={{ background: C.bg, minHeight: '100vh', padding: '24px 28px', fontFamily: '"DM Sans", "Segoe UI", sans-serif' }}>

// // // // // // //             {/* ── Header ─────────────────────────────────────────── */}
// // // // // // //             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
// // // // // // //                 <div>
// // // // // // //                     <Title level={3} style={{ margin: 0, color: C.text, fontWeight: 800, letterSpacing: '-0.03em' }}>
// // // // // // //                         Task Analytics
// // // // // // //                     </Title>
// // // // // // //                     <Text style={{ color: C.muted, fontSize: 13 }}>
// // // // // // //                         {moment().format('dddd, D MMMM YYYY')} · Real-time overview
// // // // // // //                     </Text>
// // // // // // //                 </div>
// // // // // // //                 <Space>
// // // // // // //                     <Button icon={<ReloadOutlined />} onClick={() => { fetchDashboard({}); fetchTimePerClient({}, clients); }} loading={loading}>
// // // // // // //                         Refresh
// // // // // // //                     </Button>
// // // // // // //                     <Button type="primary" onClick={() => navigate('/stt-records')} style={{ background: C.toDo, borderColor: C.toDo }}>
// // // // // // //                         All Tasks →
// // // // // // //                     </Button>
// // // // // // //                 </Space>
// // // // // // //             </div>

// // // // // // //             {/* ── Filters ────────────────────────────────────────── */}
// // // // // // //             <div style={{ background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`, marginBottom: 24, overflow: 'hidden' }}>
// // // // // // //                 <div
// // // // // // //                     onClick={() => setActiveFilterKey(activeFilterKey.length ? [] : ['1'])}
// // // // // // //                     style={{ padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', borderBottom: activeFilterKey.length ? `1px solid ${C.border}` : 'none' }}
// // // // // // //                 >
// // // // // // //                     <Space>
// // // // // // //                         <FilterOutlined style={{ color: C.toDo }} />
// // // // // // //                         <Text style={{ fontWeight: 600, color: C.text }}>Filters</Text>
// // // // // // //                         {activeFilterCount > 0 && (
// // // // // // //                             <span style={{ background: C.toDo, color: '#fff', borderRadius: 20, padding: '1px 8px', fontSize: 11, fontWeight: 700 }}>
// // // // // // //                                 {activeFilterCount} active
// // // // // // //                             </span>
// // // // // // //                         )}
// // // // // // //                     </Space>
// // // // // // //                     <Text style={{ color: C.muted, fontSize: 12 }}>{activeFilterKey.length ? '▲ collapse' : '▼ expand'}</Text>
// // // // // // //                 </div>
// // // // // // //                 {activeFilterKey.length > 0 && (
// // // // // // //                     <div style={{ padding: '16px 20px' }}>
// // // // // // //                         <Row gutter={[12, 12]}>
// // // // // // //                             <Col xs={24} sm={12} md={8} lg={5}>
// // // // // // //                                 <RangePicker style={{ width: '100%' }} value={dateRange} onChange={setDateRange} size="small" />
// // // // // // //                             </Col>
// // // // // // //                             {[
// // // // // // //                                 { placeholder: 'Client Group', value: selectedClientGroup, onChange: setSelectedClientGroup, items: clientGroups, labelKey: 'group_name' },
// // // // // // //                                 { placeholder: 'Client', value: selectedClient, onChange: setSelectedClient, items: clients, labelKey: 'name' },
// // // // // // //                                 { placeholder: 'Team', value: selectedTeam, onChange: setSelectedTeam, items: teams, labelKey: 'name' },
// // // // // // //                                 { placeholder: 'Sub Service', value: selectedSubService, onChange: setSelectedSubService, items: subServices, labelKey: 'name' },
// // // // // // //                             ].map(({ placeholder, value, onChange, items, labelKey }) => (
// // // // // // //                                 <Col xs={24} sm={12} md={8} lg={4} key={placeholder}>
// // // // // // //                                     <Select mode="multiple" placeholder={placeholder} allowClear showSearch value={value} onChange={onChange}
// // // // // // //                                         style={{ width: '100%' }} size="small"
// // // // // // //                                         filterOption={(inp, opt) => (opt?.children ?? '').toLowerCase().includes(inp.toLowerCase())}>
// // // // // // //                                         {items.map(i => <Option key={i.id} value={i.id}>{i[labelKey]}</Option>)}
// // // // // // //                                     </Select>
// // // // // // //                                 </Col>
// // // // // // //                             ))}
// // // // // // //                             <Col xs={24} sm={12} md={4} lg={3}>
// // // // // // //                                 <Button size="small" onClick={handleClearFilters} icon={<ClearOutlined />} block>Clear</Button>
// // // // // // //                             </Col>
// // // // // // //                         </Row>
// // // // // // //                     </div>
// // // // // // //                 )}
// // // // // // //             </div>

// // // // // // //             {/* ── KPI Cards ──────────────────────────────────────── */}
// // // // // // //             <Row gutter={[14, 14]} style={{ marginBottom: 24 }}>
// // // // // // //                 {[
// // // // // // //                     { title: 'Total Tasks', value: taskCounts.allTasks, color: C.all, lightColor: '#f1f5f9', icon: <FcList />, subtitle: 'Across all statuses', status: 'all' },
// // // // // // //                     { title: 'To Do', value: taskCounts.toDo, color: C.toDo, lightColor: '#ede9fe', icon: <ClockCircleOutlined />, subtitle: 'Pending start', status: 'To Do' },
// // // // // // //                     { title: 'In Progress', value: taskCounts.inProgress, color: C.inProgress, lightColor: '#fef3c7', icon: <MinusCircleOutlined />, subtitle: 'Being worked on', status: 'In Progress' },
// // // // // // //                     { title: 'Done', value: taskCounts.done, color: C.done, lightColor: '#d1fae5', icon: <CheckCircleOutlined />, subtitle: `${completionRate}% completion rate`, status: 'Done' },
// // // // // // //                     { title: 'Overdue', value: taskCounts.overdue, color: C.overdue, lightColor: '#fee2e2', icon: <ExclamationCircleOutlined />, subtitle: 'Need attention', status: 'Over Due' },
// // // // // // //                 ].map((card) => (
// // // // // // //                     <Col key={card.title} xs={24} sm={12} md={8} lg={24 / 5} style={{ display: 'flex' }}>
// // // // // // //                         <StatCard {...card} loading={loading} onClick={() => goToTasks(card.status)} />
// // // // // // //                     </Col>
// // // // // // //                 ))}
// // // // // // //             </Row>

// // // // // // //             {/* ── Completion progress bar ────────────────────────── */}
// // // // // // //             {taskCounts.allTasks > 0 && (
// // // // // // //                 <div style={{ background: C.surface, borderRadius: 14, padding: '16px 24px', marginBottom: 24, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 20 }}>
// // // // // // //                     <Text style={{ fontWeight: 600, color: C.text, whiteSpace: 'nowrap', fontSize: 13 }}>Overall Progress</Text>
// // // // // // //                     <div style={{ flex: 1 }}>
// // // // // // //                         <Progress
// // // // // // //                             percent={completionRate}
// // // // // // //                             strokeColor={{ '0%': C.toDo, '100%': C.done }}
// // // // // // //                             trailColor="#e2e8f0"
// // // // // // //                             strokeWidth={10}
// // // // // // //                             showInfo={false}
// // // // // // //                         />
// // // // // // //                     </div>
// // // // // // //                     <div style={{ display: 'flex', gap: 20, flexShrink: 0 }}>
// // // // // // //                         {[
// // // // // // //                             { label: 'Done', val: taskCounts.done, color: C.done },
// // // // // // //                             { label: 'Active', val: taskCounts.toDo + taskCounts.inProgress, color: C.inProgress },
// // // // // // //                             { label: 'Overdue', val: taskCounts.overdue, color: C.overdue },
// // // // // // //                         ].map(({ label, val, color }) => (
// // // // // // //                             <div key={label} style={{ textAlign: 'center' }}>
// // // // // // //                                 <div style={{ fontWeight: 700, color, fontSize: 16, lineHeight: 1 }}>{val}</div>
// // // // // // //                                 <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{label}</div>
// // // // // // //                             </div>
// // // // // // //                         ))}
// // // // // // //                         <div style={{ textAlign: 'center' }}>
// // // // // // //                             <div style={{ fontWeight: 700, color: C.text, fontSize: 16, lineHeight: 1 }}>{completionRate}%</div>
// // // // // // //                             <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>Complete</div>
// // // // // // //                         </div>
// // // // // // //                     </div>
// // // // // // //                 </div>
// // // // // // //             )}

// // // // // // //             {/* ── Row 1: Pie + Upcoming tasks ───────────────────── */}
// // // // // // //             <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>

// // // // // // //                 {/* Pie chart */}
// // // // // // //                 <Col xs={24} lg={9}>
// // // // // // //                     <div style={{ background: C.surface, borderRadius: 14, padding: '20px 20px 12px', border: `1px solid ${C.border}`, height: '100%' }}>
// // // // // // //                         <SectionTitle>Status Distribution</SectionTitle>
// // // // // // //                         {loading ? <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Spin /></div> : (
// // // // // // //                             pieData.length > 0
// // // // // // //                                 ? <EChartsReact option={pieOption(pieData)} style={{ height: 300 }} />
// // // // // // //                                 : <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.muted }}>No data</div>
// // // // // // //                         )}
// // // // // // //                     </div>
// // // // // // //                 </Col>

// // // // // // //                 {/* Upcoming tasks */}
// // // // // // //                 <Col xs={24} lg={15}>
// // // // // // //                     <div style={{ background: C.surface, borderRadius: 14, padding: '20px', border: `1px solid ${C.border}`, height: '100%' }}>
// // // // // // //                         <SectionTitle extra={<Button size="small" type="link" onClick={() => goToTasks('all')} style={{ color: C.toDo, padding: 0 }}>View all →</Button>}>
// // // // // // //                             Upcoming & Overdue Tasks
// // // // // // //                         </SectionTitle>
// // // // // // //                         <Table
// // // // // // //                             dataSource={upcomingTasks}
// // // // // // //                             columns={upcomingCols}
// // // // // // //                             rowKey="id"
// // // // // // //                             size="small"
// // // // // // //                             pagination={false}
// // // // // // //                             loading={loading}
// // // // // // //                             scroll={{ x: 'max-content' }}
// // // // // // //                             onRow={r => ({ onClick: () => goToTasks(r.status), style: { cursor: 'pointer' } })}
// // // // // // //                             locale={{ emptyText: <div style={{ padding: 32, color: C.muted }}>No upcoming tasks 🎉</div> }}
// // // // // // //                         />
// // // // // // //                     </div>
// // // // // // //                 </Col>
// // // // // // //             </Row>

// // // // // // //             {/* ── Row 2: Time spent charts ───────────────────────── */}
// // // // // // //             <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
// // // // // // //                 <Col xs={24}>
// // // // // // //                     <div style={{ background: C.surface, borderRadius: 14, padding: '20px', border: `1px solid ${C.border}` }}>
// // // // // // //                         <SectionTitle
// // // // // // //                             extra={
// // // // // // //                                 <Segmented
// // // // // // //                                     size="small"
// // // // // // //                                     options={['By Client', 'By Group']}
// // // // // // //                                     value={tableView === 'client' ? 'By Client' : 'By Group'}
// // // // // // //                                     onChange={v => setTableView(v === 'By Client' ? 'client' : 'group')}
// // // // // // //                                 />
// // // // // // //                             }
// // // // // // //                         >
// // // // // // //                             Total Time Spent · {formatDurationFromMillis(totalTime)}
// // // // // // //                         </SectionTitle>

// // // // // // //                         {tableView === 'client' ? (
// // // // // // //                             topClients.length > 0 ? (
// // // // // // //                                 <Row gutter={[16, 16]}>
// // // // // // //                                     {/* Bar chart */}
// // // // // // //                                     <Col xs={24} lg={14}>
// // // // // // //                                         <EChartsReact
// // // // // // //                                             option={barOption(topClients.map(r => ({ name: r.client_name, ms: r.total_hours })))}
// // // // // // //                                             style={{ height: 260 }}
// // // // // // //                                         />
// // // // // // //                                     </Col>
// // // // // // //                                     {/* Table */}
// // // // // // //                                     <Col xs={24} lg={10}>
// // // // // // //                                         <Table
// // // // // // //                                             dataSource={timePerClientData}
// // // // // // //                                             rowKey="client_id"
// // // // // // //                                             size="small"
// // // // // // //                                             pagination={{ pageSize: 6, size: 'small', showSizeChanger: false }}
// // // // // // //                                             scroll={{ x: 'max-content' }}
// // // // // // //                                             onRow={r => ({ onClick: () => handleClientClick(r.client_id), style: { cursor: 'pointer' } })}
// // // // // // //                                             columns={[
// // // // // // //                                                 { title: 'Client', dataIndex: 'client_name', ellipsis: true, render: v => <Text style={{ fontSize: 12 }}>{v}</Text> },
// // // // // // //                                                 { title: 'SPOC', dataIndex: 'spoc_name', ellipsis: true, render: v => <Text style={{ fontSize: 11, color: C.muted }}>{v}</Text> },
// // // // // // //                                                 {
// // // // // // //                                                     title: 'Hours', width: 90, align: 'right',
// // // // // // //                                                     render: (_, r) => <Text style={{ fontSize: 12, fontWeight: 600, color: C.toDo }}>{formatDurationFromMillis(r.total_hours)}</Text>,
// // // // // // //                                                     sorter: (a, b) => a.total_hours - b.total_hours,
// // // // // // //                                                     defaultSortOrder: 'descend',
// // // // // // //                                                 },
// // // // // // //                                             ]}
// // // // // // //                                             summary={() => (
// // // // // // //                                                 <Table.Summary.Row style={{ background: '#f8fafc' }}>
// // // // // // //                                                     <Table.Summary.Cell index={0} colSpan={2}><Text strong style={{ fontSize: 12 }}>Total</Text></Table.Summary.Cell>
// // // // // // //                                                     <Table.Summary.Cell index={1} align="right"><Text strong style={{ fontSize: 12, color: C.toDo }}>{formatDurationFromMillis(totalTime)}</Text></Table.Summary.Cell>
// // // // // // //                                                 </Table.Summary.Row>
// // // // // // //                                             )}
// // // // // // //                                         />
// // // // // // //                                     </Col>
// // // // // // //                                 </Row>
// // // // // // //                             ) : (
// // // // // // //                                 <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.muted }}>
// // // // // // //                                     {loading ? <Spin /> : 'No time entries recorded'}
// // // // // // //                                 </div>
// // // // // // //                             )
// // // // // // //                         ) : (
// // // // // // //                             topGroups.length > 0 ? (
// // // // // // //                                 <Row gutter={[16, 16]}>
// // // // // // //                                     <Col xs={24} lg={14}>
// // // // // // //                                         <EChartsReact
// // // // // // //                                             option={barOption(topGroups.map(r => ({ name: r.client_group_name, ms: r.total_hours })))}
// // // // // // //                                             style={{ height: 260 }}
// // // // // // //                                         />
// // // // // // //                                     </Col>
// // // // // // //                                     <Col xs={24} lg={10}>
// // // // // // //                                         <Table
// // // // // // //                                             dataSource={timePerGroup}
// // // // // // //                                             rowKey="client_group_name"
// // // // // // //                                             size="small"
// // // // // // //                                             pagination={{ pageSize: 6, size: 'small', showSizeChanger: false }}
// // // // // // //                                             scroll={{ x: 'max-content' }}
// // // // // // //                                             columns={[
// // // // // // //                                                 { title: 'Group', dataIndex: 'client_group_name', ellipsis: true, render: v => <Text style={{ fontSize: 12 }}>{v}</Text> },
// // // // // // //                                                 { title: 'SPOC', dataIndex: 'spoc_name', ellipsis: true, render: v => <Text style={{ fontSize: 11, color: C.muted }}>{v}</Text> },
// // // // // // //                                                 {
// // // // // // //                                                     title: 'Hours', width: 90, align: 'right',
// // // // // // //                                                     render: (_, r) => <Text style={{ fontSize: 12, fontWeight: 600, color: C.toDo }}>{formatDurationFromMillis(r.total_hours)}</Text>,
// // // // // // //                                                     sorter: (a, b) => a.total_hours - b.total_hours,
// // // // // // //                                                     defaultSortOrder: 'descend',
// // // // // // //                                                 },
// // // // // // //                                             ]}
// // // // // // //                                         />
// // // // // // //                                     </Col>
// // // // // // //                                 </Row>
// // // // // // //                             ) : (
// // // // // // //                                 <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.muted }}>
// // // // // // //                                     {loading ? <Spin /> : 'No time entries recorded'}
// // // // // // //                                 </div>
// // // // // // //                             )
// // // // // // //                         )}
// // // // // // //                     </div>
// // // // // // //                 </Col>
// // // // // // //             </Row>

// // // // // // //             {/* ── Client Detail Modal ────────────────────────────── */}
// // // // // // //             <Modal
// // // // // // //                 open={clientModalVisible}
// // // // // // //                 onCancel={() => setClientModalVisible(false)}
// // // // // // //                 footer={null}
// // // // // // //                 width={820}
// // // // // // //                 styles={{ body: { padding: '24px', background: C.bg } }}
// // // // // // //                 title={
// // // // // // //                     <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
// // // // // // //                         <div style={{ width: 36, height: 36, borderRadius: 10, background: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.toDo, fontWeight: 700 }}>
// // // // // // //                             {(selectedClientInfo?.name || 'C')[0]}
// // // // // // //                         </div>
// // // // // // //                         <div>
// // // // // // //                             <div style={{ fontWeight: 700, color: C.text, fontSize: 15 }}>{selectedClientInfo?.name || 'Client'}</div>
// // // // // // //                             <div style={{ fontSize: 12, color: C.muted }}>{getGroupName(selectedClientInfo)} · {getSpocName(selectedClientInfo)}</div>
// // // // // // //                         </div>
// // // // // // //                     </div>
// // // // // // //                 }
// // // // // // //             >
// // // // // // //                 {clientModalLoading ? (
// // // // // // //                     <div style={{ textAlign: 'center', padding: 60 }}><Spin size="large" /></div>
// // // // // // //                 ) : clientSummary ? (
// // // // // // //                     <>
// // // // // // //                         {/* Mini KPIs */}
// // // // // // //                         <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
// // // // // // //                             {[
// // // // // // //                                 { label: 'Done Tasks', value: clientSummary.done_count, color: C.done, bg: '#d1fae5' },
// // // // // // //                                 { label: 'Total Time', value: formatDurationFromMillis(clientSummary.total_hours_ms), color: C.toDo, bg: '#ede9fe', isText: true },
// // // // // // //                                 { label: 'Employees', value: clientSummary.employees?.length || 0, color: C.inProgress, bg: '#fef3c7' },
// // // // // // //                                 { label: 'Services', value: clientSummary.sub_services?.length || 0, color: '#0ea5e9', bg: '#e0f2fe' },
// // // // // // //                             ].map(({ label, value, color, bg, isText }) => (
// // // // // // //                                 <Col span={6} key={label}>
// // // // // // //                                     <div style={{ background: bg, borderRadius: 12, padding: '14px 16px', textAlign: 'center' }}>
// // // // // // //                                         {isText
// // // // // // //                                             ? <div style={{ fontSize: 22, fontWeight: 800, color }}>{value}</div>
// // // // // // //                                             : <CountUp end={value} duration={1.2} style={{ fontSize: 28, fontWeight: 800, color, lineHeight: 1 }} />
// // // // // // //                                         }
// // // // // // //                                         <div style={{ fontSize: 11, color: C.muted, marginTop: 4, fontWeight: 600 }}>{label}</div>
// // // // // // //                                     </div>
// // // // // // //                                 </Col>
// // // // // // //                             ))}
// // // // // // //                         </Row>

// // // // // // //                         {/* Charts */}
// // // // // // //                         <Row gutter={[12, 12]}>
// // // // // // //                             {clientSummary.employees?.length > 0 && (
// // // // // // //                                 <Col xs={24} md={12}>
// // // // // // //                                     <div style={{ background: C.surface, borderRadius: 12, padding: '16px', border: `1px solid ${C.border}` }}>
// // // // // // //                                         <Text style={{ fontWeight: 700, fontSize: 13, display: 'block', marginBottom: 8 }}>Employee Hours</Text>
// // // // // // //                                         <EChartsReact option={hBarOption(clientSummary.employees)} style={{ height: Math.min(220, clientSummary.employees.length * 32 + 40) }} />
// // // // // // //                                     </div>
// // // // // // //                                 </Col>
// // // // // // //                             )}
// // // // // // //                             {clientSummary.sub_services?.length > 0 && (
// // // // // // //                                 <Col xs={24} md={12}>
// // // // // // //                                     <div style={{ background: C.surface, borderRadius: 12, padding: '16px', border: `1px solid ${C.border}` }}>
// // // // // // //                                         <Text style={{ fontWeight: 700, fontSize: 13, display: 'block', marginBottom: 8 }}>Service Breakdown</Text>
// // // // // // //                                         <EChartsReact option={hBarOption(clientSummary.sub_services)} style={{ height: Math.min(220, clientSummary.sub_services.length * 32 + 40) }} />
// // // // // // //                                     </div>
// // // // // // //                                 </Col>
// // // // // // //                             )}
// // // // // // //                         </Row>

// // // // // // //                         {/* Employee table */}
// // // // // // //                         {clientSummary.employees?.length > 0 && (
// // // // // // //                             <div style={{ marginTop: 16 }}>
// // // // // // //                                 <Text style={{ fontWeight: 700, fontSize: 13, display: 'block', marginBottom: 8 }}>Employee Breakdown</Text>
// // // // // // //                                 <Table
// // // // // // //                                     size="small"
// // // // // // //                                     dataSource={clientSummary.employees.map((e, i) => ({ key: i, name: e.name, time: formatDurationFromMillis(e.ms), ms: e.ms }))}
// // // // // // //                                     columns={[
// // // // // // //                                         { title: '#', render: (_, __, i) => i + 1, width: 40 },
// // // // // // //                                         { title: 'Employee', dataIndex: 'name' },
// // // // // // //                                         { title: 'Time Spent', dataIndex: 'time', align: 'right', render: v => <Text style={{ fontWeight: 600, color: C.toDo }}>{v}</Text>, sorter: (a, b) => a.ms - b.ms, defaultSortOrder: 'descend' },
// // // // // // //                                     ]}
// // // // // // //                                     pagination={false}
// // // // // // //                                     bordered={false}
// // // // // // //                                     style={{ borderRadius: 8, overflow: 'hidden', border: `1px solid ${C.border}` }}
// // // // // // //                                 />
// // // // // // //                             </div>
// // // // // // //                         )}
// // // // // // //                     </>
// // // // // // //                 ) : (
// // // // // // //                     <div style={{ textAlign: 'center', padding: 40, color: C.muted }}>No data available</div>
// // // // // // //                 )}
// // // // // // //             </Modal>

// // // // // // //         </div>
// // // // // // //     );
// // // // // // // };

// // // // // // // export default TaskDashboard;

// // // // // // import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
// // // // // // import {
// // // // // //     Card, Col, Row, Typography, message, Table, DatePicker,
// // // // // //     Select, Space, Button, Segmented, Modal, Spin, Progress,
// // // // // // } from 'antd';
// // // // // // import { api } from '../../../services/api';
// // // // // // import EChartsReact from 'echarts-for-react';
// // // // // // import CountUp from 'react-countup';
// // // // // // import {
// // // // // //     ClockCircleOutlined, CheckCircleOutlined,
// // // // // //     MinusCircleOutlined, ExclamationCircleOutlined,
// // // // // //     FilterOutlined, ClearOutlined, ReloadOutlined,
// // // // // // } from '@ant-design/icons';
// // // // // // import { FcList } from 'react-icons/fc';
// // // // // // import moment from 'moment';
// // // // // // import { formatDurationFromMillis } from './STT_Records';
// // // // // // import { useNavigate } from 'react-router-dom';

// // // // // // const { Title, Text } = Typography;
// // // // // // const { RangePicker } = DatePicker;
// // // // // // const { Option } = Select;

// // // // // // /* ─── Design tokens ─────────────────────────────────────────── */
// // // // // // const C = {
// // // // // //     done:       '#10b981',
// // // // // //     inProgress: '#f59e0b',
// // // // // //     overdue:    '#ef4444',
// // // // // //     toDo:       '#6366f1',
// // // // // //     all:        '#0f172a',
// // // // // //     bg:         '#f1f5f9',
// // // // // //     surface:    '#ffffff',
// // // // // //     border:     '#e2e8f0',
// // // // // //     text:       '#0f172a',
// // // // // //     muted:      '#64748b',
// // // // // // };

// // // // // // const STATUS_META = {
// // // // // //     'Done':        { color: C.done,       light: '#d1fae5' },
// // // // // //     'In Progress': { color: C.inProgress, light: '#fef3c7' },
// // // // // //     'Over Due':    { color: C.overdue,    light: '#fee2e2' },
// // // // // //     'To Do':       { color: C.toDo,       light: '#ede9fe' },
// // // // // // };

// // // // // // /* ─── Stat Card ─────────────────────────────────────────────── */
// // // // // // const StatCard = ({ title, value, color, lightColor, icon, subtitle, onClick, loading }) => (
// // // // // //     <div
// // // // // //         onClick={onClick}
// // // // // //         style={{
// // // // // //             background: C.surface, borderRadius: 16, padding: '20px 22px',
// // // // // //             cursor: 'pointer', border: `1px solid ${C.border}`,
// // // // // //             borderTop: `4px solid ${color}`,
// // // // // //             transition: 'all 0.2s', flex: 1, minWidth: 0,
// // // // // //             boxShadow: '0 1px 4px rgba(0,0,0,0.06)', position: 'relative', overflow: 'hidden',
// // // // // //         }}
// // // // // //         onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = `0 10px 28px ${color}28`; }}
// // // // // //         onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)'; }}
// // // // // //     >
// // // // // //         <div style={{ position: 'absolute', right: 18, top: 18, width: 44, height: 44, borderRadius: 12, background: lightColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color }}>
// // // // // //             {icon}
// // // // // //         </div>
// // // // // //         <Text style={{ fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: '0.07em', textTransform: 'uppercase' }}>
// // // // // //             {title}
// // // // // //         </Text>
// // // // // //         <div style={{ marginTop: 8 }}>
// // // // // //             {loading
// // // // // //                 ? <div style={{ fontSize: 28, fontWeight: 700, color: C.muted }}>—</div>
// // // // // //                 : <CountUp end={value} duration={1.6} style={{ fontSize: 34, fontWeight: 800, color, lineHeight: 1 }} />
// // // // // //             }
// // // // // //         </div>
// // // // // //         {subtitle && <Text style={{ fontSize: 11, color: C.muted, marginTop: 6, display: 'block' }}>{subtitle}</Text>}
// // // // // //     </div>
// // // // // // );

// // // // // // /* ─── Section header ────────────────────────────────────────── */
// // // // // // const SectionTitle = ({ children, extra }) => (
// // // // // //     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
// // // // // //         <Text style={{ fontSize: 14, fontWeight: 700, color: C.text, letterSpacing: '-0.01em' }}>{children}</Text>
// // // // // //         {extra}
// // // // // //     </div>
// // // // // // );

// // // // // // /* ─── Status Badge ──────────────────────────────────────────── */
// // // // // // const StatusBadge = ({ status }) => {
// // // // // //     const meta = STATUS_META[status] || { color: C.muted, light: '#f1f5f9' };
// // // // // //     return (
// // // // // //         <span style={{
// // // // // //             background: meta.light, color: meta.color,
// // // // // //             borderRadius: 20, padding: '2px 10px',
// // // // // //             fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap',
// // // // // //         }}>
// // // // // //             {status}
// // // // // //         </span>
// // // // // //     );
// // // // // // };

// // // // // // /* ─── Chart helpers ─────────────────────────────────────────── */
// // // // // // const pieOption = (data) => ({
// // // // // //     backgroundColor: 'transparent',
// // // // // //     tooltip: {
// // // // // //         trigger: 'item',
// // // // // //         formatter: '{b}: <b>{c}</b> ({d}%)',
// // // // // //         backgroundColor: '#1e293b', borderColor: 'transparent',
// // // // // //         textStyle: { color: '#f1f5f9', fontSize: 13 },
// // // // // //     },
// // // // // //     legend: {
// // // // // //         orient: 'horizontal', bottom: 0, left: 'center',
// // // // // //         textStyle: { color: C.muted, fontSize: 12 },
// // // // // //         itemWidth: 10, itemHeight: 10,
// // // // // //     },
// // // // // //     series: [{
// // // // // //         type: 'pie', radius: ['42%', '70%'], center: ['50%', '44%'],
// // // // // //         avoidLabelOverlap: true,
// // // // // //         itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
// // // // // //         label: { show: true, formatter: '{b}\n{c}', fontSize: 11, color: C.muted, lineHeight: 16 },
// // // // // //         labelLine: { length: 10, length2: 6 },
// // // // // //         data: data.map(d => ({ ...d, itemStyle: { color: STATUS_META[d.name]?.color || '#94a3b8' } })),
// // // // // //         emphasis: { itemStyle: { shadowBlur: 12, shadowColor: 'rgba(0,0,0,0.15)' } },
// // // // // //     }],
// // // // // // });

// // // // // // const barOption = (data) => ({
// // // // // //     backgroundColor: 'transparent',
// // // // // //     tooltip: {
// // // // // //         trigger: 'axis', axisPointer: { type: 'shadow' },
// // // // // //         backgroundColor: '#1e293b', borderColor: 'transparent',
// // // // // //         textStyle: { color: '#f1f5f9', fontSize: 12 },
// // // // // //         formatter: (params) => {
// // // // // //             const p = params[0];
// // // // // //             const orig = data[p.dataIndex];
// // // // // //             return `<b>${orig?.fullName || p.name}</b><br/>${formatDurationFromMillis(p.value)}`;
// // // // // //         },
// // // // // //     },
// // // // // //     grid: { top: 16, right: 16, bottom: 48, left: 16, containLabel: true },
// // // // // //     xAxis: {
// // // // // //         type: 'category',
// // // // // //         data: data.map(d => d.name.length > 13 ? d.name.slice(0, 12) + '…' : d.name),
// // // // // //         axisLabel: { color: C.muted, fontSize: 11, rotate: data.length > 5 ? 30 : 0, interval: 0 },
// // // // // //         axisLine: { lineStyle: { color: C.border } },
// // // // // //         axisTick: { show: false },
// // // // // //     },
// // // // // //     yAxis: {
// // // // // //         type: 'value',
// // // // // //         axisLabel: { color: C.muted, fontSize: 10, formatter: v => formatDurationFromMillis(v) },
// // // // // //         splitLine: { lineStyle: { color: C.border, type: 'dashed' } },
// // // // // //         axisLine: { show: false }, axisTick: { show: false },
// // // // // //     },
// // // // // //     series: [{
// // // // // //         type: 'bar',
// // // // // //         data: data.map(d => ({
// // // // // //             value: d.ms,
// // // // // //             itemStyle: {
// // // // // //                 color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: '#6366f1' }, { offset: 1, color: '#818cf8' }] },
// // // // // //                 borderRadius: [6, 6, 0, 0],
// // // // // //             },
// // // // // //         })),
// // // // // //         barMaxWidth: 48,
// // // // // //         emphasis: {
// // // // // //             itemStyle: {
// // // // // //                 color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: '#4f46e5' }, { offset: 1, color: '#6366f1' }] },
// // // // // //             },
// // // // // //         },
// // // // // //     }],
// // // // // // });

// // // // // // const hBarOption = (data) => ({
// // // // // //     backgroundColor: 'transparent',
// // // // // //     tooltip: {
// // // // // //         trigger: 'axis', axisPointer: { type: 'shadow' },
// // // // // //         backgroundColor: '#1e293b', borderColor: 'transparent',
// // // // // //         textStyle: { color: '#f1f5f9', fontSize: 12 },
// // // // // //         formatter: (params) => `<b>${params[0].name}</b><br/>${formatDurationFromMillis(params[0].value)}`,
// // // // // //     },
// // // // // //     grid: { top: 8, right: 88, bottom: 8, left: 16, containLabel: true },
// // // // // //     xAxis: {
// // // // // //         type: 'value',
// // // // // //         axisLabel: { formatter: v => formatDurationFromMillis(v), color: C.muted, fontSize: 10 },
// // // // // //         splitLine: { lineStyle: { color: C.border, type: 'dashed' } },
// // // // // //         axisLine: { show: false }, axisTick: { show: false },
// // // // // //     },
// // // // // //     yAxis: {
// // // // // //         type: 'category',
// // // // // //         data: data.map(d => d.name?.length > 16 ? d.name.slice(0, 15) + '…' : d.name || 'N/A'),
// // // // // //         axisLabel: { color: C.muted, fontSize: 11 },
// // // // // //         axisLine: { show: false }, axisTick: { show: false },
// // // // // //     },
// // // // // //     series: [{
// // // // // //         type: 'bar',
// // // // // //         data: data.map(d => ({
// // // // // //             value: d.ms || 0,
// // // // // //             itemStyle: {
// // // // // //                 color: { type: 'linear', x: 0, y: 0, x2: 1, y2: 0, colorStops: [{ offset: 0, color: '#06b6d4' }, { offset: 1, color: '#0ea5e9' }] },
// // // // // //                 borderRadius: [0, 6, 6, 0],
// // // // // //             },
// // // // // //         })),
// // // // // //         barMaxWidth: 20,
// // // // // //         label: {
// // // // // //             show: true, position: 'right',
// // // // // //             formatter: p => formatDurationFromMillis(p.value),
// // // // // //             color: C.muted, fontSize: 10,
// // // // // //         },
// // // // // //     }],
// // // // // // });

// // // // // // /* ══════════════ MAIN COMPONENT ══════════════ */
// // // // // // const TaskDashboard = () => {
// // // // // //     const navigate = useNavigate();

// // // // // //     const [loading,             setLoading]             = useState(true);
// // // // // //     const [dashboardData,       setDashboardData]       = useState(null);
// // // // // //     const [error,               setError]               = useState(null);
// // // // // //     const [dateRange,           setDateRange]           = useState(null);
// // // // // //     const [clients,             setClients]             = useState([]);
// // // // // //     const [selectedClient,      setSelectedClient]      = useState([]);
// // // // // //     const [teams,               setTeams]               = useState([]);
// // // // // //     const [selectedTeam,        setSelectedTeam]        = useState([]);
// // // // // //     const [clientGroups,        setClientGroups]        = useState([]);
// // // // // //     const [selectedClientGroup, setSelectedClientGroup] = useState([]);
// // // // // //     const [allSpocs,            setAllSpocs]            = useState([]);
// // // // // //     const [subServices,         setSubServices]         = useState([]);
// // // // // //     const [selectedSubService,  setSelectedSubService]  = useState([]);
// // // // // //     const [tableView,           setTableView]           = useState('client');
// // // // // //     const [taskCounts,          setTaskCounts]          = useState({ allTasks: 0, done: 0, toDo: 0, overdue: 0, inProgress: 0 });
// // // // // //     const [filtersOpen,         setFiltersOpen]         = useState(false);
// // // // // //     const [timePerClientData,   setTimePerClientData]   = useState([]);

// // // // // //     // Modal
// // // // // //     const [clientModalVisible,  setClientModalVisible]  = useState(false);
// // // // // //     const [clientModalLoading,  setClientModalLoading]  = useState(false);
// // // // // //     const [selectedClientInfo,  setSelectedClientInfo]  = useState(null);
// // // // // //     const [clientSummary,       setClientSummary]       = useState(null);

// // // // // //     // Ref to track if component is still mounted (avoids state-on-unmount warnings)
// // // // // //     const mountedRef = useRef(true);
// // // // // //     useEffect(() => { mountedRef.current = true; return () => { mountedRef.current = false; }; }, []);

// // // // // //     // ── Refs for stable lookup functions that don't re-trigger effects ──────
// // // // // //     const clientGroupsRef = useRef([]);
// // // // // //     const allSpocsRef     = useRef([]);
// // // // // //     useEffect(() => { clientGroupsRef.current = clientGroups; }, [clientGroups]);
// // // // // //     useEffect(() => { allSpocsRef.current = allSpocs; }, [allSpocs]);

// // // // // //     const getSpocName = useCallback((client) => {
// // // // // //         if (!client) return 'N/A';
// // // // // //         if (client.primary_spoc_name) return client.primary_spoc_name;
// // // // // //         const groups = clientGroupsRef.current;
// // // // // //         const group = groups.find(g => g.clients?.some(cg => (typeof cg === 'object' ? cg.id : cg) === client.id));
// // // // // //         if (group?.primary_spoc_name) return group.primary_spoc_name;
// // // // // //         if (typeof client.primary_spoc === 'number') {
// // // // // //             const spoc = allSpocsRef.current.find(s => s.id === client.primary_spoc);
// // // // // //             if (spoc) return `${spoc.first_name || ''} ${spoc.last_name || ''}`.trim() || spoc.user?.email || 'N/A';
// // // // // //         }
// // // // // //         return 'N/A';
// // // // // //     }, []); // stable — reads from refs

// // // // // //     const getGroupName = useCallback((client) => {
// // // // // //         if (!client) return 'N/A';
// // // // // //         const groups = clientGroupsRef.current;
// // // // // //         const group = groups.find(g => g.clients?.some(cg => (typeof cg === 'object' ? cg.id : cg) === client.id));
// // // // // //         return group?.group_name || 'N/A';
// // // // // //     }, []); // stable

// // // // // //     /* ── Build params ── */
// // // // // //     const buildParams = (filters = {}) => {
// // // // // //         const p = {
// // // // // //             start_date:      filters.startDate?.format('YYYY-MM-DD'),
// // // // // //             end_date:        filters.endDate?.format('YYYY-MM-DD'),
// // // // // //             client_id:       filters.clientId?.length      ? filters.clientId.join(',')       : undefined,
// // // // // //             team_id:         filters.teamId?.length        ? filters.teamId.join(',')         : undefined,
// // // // // //             client_group_id: filters.clientGroupId?.length ? filters.clientGroupId.join(',') : undefined,
// // // // // //             sub_service_id:  filters.subServiceId?.length  ? filters.subServiceId.join(',')  : undefined,
// // // // // //         };
// // // // // //         Object.keys(p).forEach(k => p[k] === undefined && delete p[k]);
// // // // // //         return p;
// // // // // //     };

// // // // // //     /* ── Core fetch functions (stable — no deps that change) ── */
// // // // // //     const fetchDashboard = useCallback(async (params) => {
// // // // // //         if (!mountedRef.current) return;
// // // // // //         setLoading(true);
// // // // // //         try {
// // // // // //             const res = await api.get('/clients/tasks/dashboard_summary/', { params });
// // // // // //             if (mountedRef.current) setDashboardData(res.data);
// // // // // //         } catch (err) {
// // // // // //             console.error(err);
// // // // // //             if (mountedRef.current) {
// // // // // //                 setError('Failed to load dashboard data.');
// // // // // //                 message.error('Failed to load dashboard.');
// // // // // //             }
// // // // // //         } finally {
// // // // // //             if (mountedRef.current) setLoading(false);
// // // // // //         }
// // // // // //     }, []); // no deps — intentionally stable

// // // // // //     const fetchTimePerClient = useCallback(async (params, clientsList) => {
// // // // // //         if (!mountedRef.current) return;
// // // // // //         try {
// // // // // //             const res = await api.get('/clients/tasks/time_per_client/', { params });
// // // // // //             if (!mountedRef.current) return;
// // // // // //             setTimePerClientData((res.data || []).map(row => {
// // // // // //                 const c = (clientsList || []).find(x => x.id === row.client_id);
// // // // // //                 return {
// // // // // //                     ...row,
// // // // // //                     total_hours: row.total_hours_ms,
// // // // // //                     group_name:  c ? getGroupName(c)  : 'N/A',
// // // // // //                     spoc_name:   c ? getSpocName(c)   : 'N/A',
// // // // // //                 };
// // // // // //             }));
// // // // // //         } catch (err) {
// // // // // //             console.error('fetchTimePerClient error:', err);
// // // // // //         }
// // // // // //     }, [getGroupName, getSpocName]); // stable — getGroupName/getSpocName are stable

// // // // // //     /* ── Initial load — runs ONCE ── */
// // // // // //     const didInit = useRef(false);
// // // // // //     useEffect(() => {
// // // // // //         if (didInit.current) return;
// // // // // //         didInit.current = true;

// // // // // //         (async () => {
// // // // // //             setLoading(true);
// // // // // //             try {
// // // // // //                 const [cR, tR, gR, sR, ssR] = await Promise.all([
// // // // // //                     api.get('/clients/clients/?page_size=500'),
// // // // // //                     api.get('/employee/teams/'),
// // // // // //                     api.get('/clients/client-groups/'),
// // // // // //                     api.get('/employee/employees/'),
// // // // // //                     api.get('/clients/subservices/'),
// // // // // //                 ]);
// // // // // //                 if (!mountedRef.current) return;
// // // // // //                 const cl = cR.data.results || cR.data;
// // // // // //                 const gr = gR.data.results || gR.data;
// // // // // //                 const sp = sR.data.results || sR.data;
// // // // // //                 setClients(cl);
// // // // // //                 setTeams(tR.data.results || tR.data);
// // // // // //                 setClientGroups(gr);
// // // // // //                 setAllSpocs(sp);
// // // // // //                 setSubServices(ssR.data.results || ssR.data);
// // // // // //                 // Set refs immediately so enrichment in fetchTimePerClient works
// // // // // //                 clientGroupsRef.current = gr;
// // // // // //                 allSpocsRef.current     = sp;
// // // // // //                 await Promise.all([
// // // // // //                     fetchDashboard({}),
// // // // // //                     fetchTimePerClient({}, cl),
// // // // // //                 ]);
// // // // // //             } catch (err) {
// // // // // //                 console.error('fetchInitialData error:', err);
// // // // // //                 if (mountedRef.current) setError('Failed to load initial data.');
// // // // // //             } finally {
// // // // // //                 if (mountedRef.current) setLoading(false);
// // // // // //             }
// // // // // //         })();
// // // // // //     }, [fetchDashboard, fetchTimePerClient]);

// // // // // //     /* ── Re-fetch ONLY when user changes filters ── */
// // // // // //     const isFirstRender = useRef(true);
// // // // // //     useEffect(() => {
// // // // // //         if (isFirstRender.current) { isFirstRender.current = false; return; }
// // // // // //         const [startDate, endDate] = dateRange || [null, null];
// // // // // //         const f = { startDate, endDate, clientId: selectedClient, teamId: selectedTeam, clientGroupId: selectedClientGroup, subServiceId: selectedSubService };
// // // // // //         const p = buildParams(f);
// // // // // //         fetchDashboard(p);
// // // // // //         fetchTimePerClient(p, clients);
// // // // // //         // eslint-disable-next-line react-hooks/exhaustive-deps
// // // // // //     }, [dateRange, selectedClient, selectedTeam, selectedClientGroup, selectedSubService]);

// // // // // //     /* ── Derive counts ── */
// // // // // //     useEffect(() => {
// // // // // //         if (!dashboardData?.status_counts) return;
// // // // // //         const sc = dashboardData.status_counts;
// // // // // //         setTaskCounts({
// // // // // //             allTasks:   (sc['To Do'] || 0) + (sc['In Progress'] || 0) + (sc['Done'] || 0) + (sc['Over Due'] || 0),
// // // // // //             done:       sc['Done']        || 0,
// // // // // //             toDo:       sc['To Do']       || 0,
// // // // // //             inProgress: sc['In Progress'] || 0,
// // // // // //             overdue:    sc['Over Due']    || 0,
// // // // // //         });
// // // // // //     }, [dashboardData]);

// // // // // //     /* ── Derived data ── */
// // // // // //     const timePerGroup = useMemo(() =>
// // // // // //         timePerClientData.reduce((acc, row) => {
// // // // // //             if (!row.group_name || row.group_name === 'N/A') return acc;
// // // // // //             const ex = acc.find(g => g.client_group_name === row.group_name);
// // // // // //             if (ex) ex.total_hours += row.total_hours;
// // // // // //             else acc.push({ client_group_name: row.group_name, spoc_name: row.spoc_name, total_hours: row.total_hours });
// // // // // //             return acc;
// // // // // //         }, [])
// // // // // //     , [timePerClientData]);

// // // // // //     const pieData = useMemo(() =>
// // // // // //         dashboardData?.status_counts
// // // // // //             ? Object.entries(dashboardData.status_counts).filter(([k, v]) => k !== 'total' && v > 0).map(([name, value]) => ({ name, value }))
// // // // // //             : []
// // // // // //     , [dashboardData]);

// // // // // //     const topClients = useMemo(() => [...timePerClientData].sort((a, b) => b.total_hours - a.total_hours).slice(0, 10), [timePerClientData]);
// // // // // //     const topGroups  = useMemo(() => [...timePerGroup].sort((a, b) => b.total_hours - a.total_hours).slice(0, 10), [timePerGroup]);

// // // // // //     const totalTime       = useMemo(() => timePerClientData.reduce((s, r) => s + (r.total_hours || 0), 0), [timePerClientData]);
// // // // // //     const completionRate  = taskCounts.allTasks ? Math.round((taskCounts.done / taskCounts.allTasks) * 100) : 0;
// // // // // //     const activeFilterCount = [selectedClient, selectedTeam, selectedClientGroup, selectedSubService].filter(a => a.length).length + (dateRange ? 1 : 0);

// // // // // //     /* ── Clear filters ── */
// // // // // //     const handleClearFilters = () => {
// // // // // //         setDateRange(null);
// // // // // //         setSelectedClient([]);
// // // // // //         setSelectedTeam([]);
// // // // // //         setSelectedClientGroup([]);
// // // // // //         setSelectedSubService([]);
// // // // // //     };

// // // // // //     /* ── Navigate with filters ── */
// // // // // //     const goToTasks = (status) => {
// // // // // //         const params = new URLSearchParams();
// // // // // //         if (status !== 'all') params.set('status', status);
// // // // // //         const [s, e] = dateRange || [null, null];
// // // // // //         if (s) params.set('start_date', s.format('YYYY-MM-DD'));
// // // // // //         if (e) params.set('end_date',   e.format('YYYY-MM-DD'));
// // // // // //         if (selectedClient?.length)      params.set('client_id',      selectedClient.join(','));
// // // // // //         if (selectedTeam?.length)        params.set('team_id',         selectedTeam.join(','));
// // // // // //         if (selectedClientGroup?.length) params.set('client_group_id', selectedClientGroup.join(','));
// // // // // //         if (selectedSubService?.length)  params.set('sub_service_id',  selectedSubService.join(','));
// // // // // //         navigate(`/stt-records?${params.toString()}`);
// // // // // //     };

// // // // // //     /* ── Client modal ── */
// // // // // //     const handleClientClick = useCallback(async (clientId) => {
// // // // // //         const client = clients.find(c => c.id === clientId);
// // // // // //         setSelectedClientInfo(client);
// // // // // //         setClientSummary(null);
// // // // // //         setClientModalVisible(true);
// // // // // //         setClientModalLoading(true);
// // // // // //         try {
// // // // // //             const [startDate, endDate] = dateRange || [null, null];
// // // // // //             const params = { client_id: clientId };
// // // // // //             if (startDate) params.start_date = startDate.format('YYYY-MM-DD');
// // // // // //             if (endDate)   params.end_date   = endDate.format('YYYY-MM-DD');
// // // // // //             const res = await api.get('/clients/tasks/client_task_summary/', { params });
// // // // // //             if (mountedRef.current) setClientSummary(res.data);
// // // // // //         } catch (err) {
// // // // // //             console.error(err);
// // // // // //             message.error('Failed to load client details');
// // // // // //         } finally {
// // // // // //             if (mountedRef.current) setClientModalLoading(false);
// // // // // //         }
// // // // // //     }, [clients, dateRange]);

// // // // // //     /* ── Refresh handler ── */
// // // // // //     const handleRefresh = useCallback(() => {
// // // // // //         const [startDate, endDate] = dateRange || [null, null];
// // // // // //         const f = { startDate, endDate, clientId: selectedClient, teamId: selectedTeam, clientGroupId: selectedClientGroup, subServiceId: selectedSubService };
// // // // // //         const p = buildParams(f);
// // // // // //         fetchDashboard(p);
// // // // // //         fetchTimePerClient(p, clients);
// // // // // //     }, [dateRange, selectedClient, selectedTeam, selectedClientGroup, selectedSubService, clients, fetchDashboard, fetchTimePerClient]);

// // // // // //     /* ── Upcoming tasks ── */
// // // // // //     const upcomingTasks = useMemo(() => (dashboardData?.tasks || []).slice(0, 8), [dashboardData]);
// // // // // //     const upcomingCols = [
// // // // // //         {
// // // // // //             title: 'Task ID', dataIndex: 'task_id', key: 'task_id', width: 140,
// // // // // //             render: v => <Text style={{ fontFamily: 'monospace', fontSize: 11, color: C.muted }}>{v}</Text>,
// // // // // //         },
// // // // // //         { title: 'Client', dataIndex: 'client_name', key: 'client_name', ellipsis: true },
// // // // // //         { title: 'Service', dataIndex: 'sub_service_name', key: 'sub_service_name', ellipsis: true },
// // // // // //         {
// // // // // //             title: 'Due', dataIndex: 'due_date', key: 'due_date', width: 100,
// // // // // //             render: d => {
// // // // // //                 if (!d) return <span style={{ color: C.muted }}>—</span>;
// // // // // //                 const m = moment(d);
// // // // // //                 const isLate = m.isBefore(moment(), 'day');
// // // // // //                 return <span style={{ color: isLate ? C.overdue : C.muted, fontWeight: isLate ? 600 : 400, fontSize: 12 }}>{m.format('DD MMM YY')}</span>;
// // // // // //             },
// // // // // //         },
// // // // // //         {
// // // // // //             title: 'Status', dataIndex: 'status', key: 'status', width: 120,
// // // // // //             render: (_, r) => {
// // // // // //                 const eff = r.due_date && moment(r.due_date).isBefore(moment(), 'day') && r.status !== 'Done' ? 'Over Due' : r.status;
// // // // // //                 return <StatusBadge status={eff} />;
// // // // // //             },
// // // // // //         },
// // // // // //     ];

// // // // // //     /* ── Table columns: client ── */
// // // // // //     const clientTableCols = [
// // // // // //         {
// // // // // //             title: '#', render: (_, __, i) => <Text style={{ color: C.muted, fontSize: 12 }}>{i + 1}</Text>, width: 44,
// // // // // //         },
// // // // // //         {
// // // // // //             title: 'Client', dataIndex: 'client_name', key: 'client_name',
// // // // // //             render: v => <Text style={{ fontWeight: 500, fontSize: 13 }}>{v}</Text>,
// // // // // //             sorter: (a, b) => a.client_name.localeCompare(b.client_name),
// // // // // //         },
// // // // // //         {
// // // // // //             title: 'Group', dataIndex: 'group_name', key: 'group_name',
// // // // // //             render: v => <Text style={{ fontSize: 12, color: C.muted }}>{v || '—'}</Text>,
// // // // // //         },
// // // // // //         {
// // // // // //             title: 'SPOC', dataIndex: 'spoc_name', key: 'spoc_name',
// // // // // //             render: v => <Text style={{ fontSize: 12, color: C.muted }}>{v || '—'}</Text>,
// // // // // //         },
// // // // // //         {
// // // // // //             title: 'Time Spent', key: 'time', align: 'right',
// // // // // //             render: (_, r) => <Text style={{ fontSize: 13, fontWeight: 700, color: C.toDo }}>{formatDurationFromMillis(r.total_hours)}</Text>,
// // // // // //             sorter: (a, b) => a.total_hours - b.total_hours,
// // // // // //             defaultSortOrder: 'descend',
// // // // // //         },
// // // // // //     ];

// // // // // //     /* ── Table columns: group ── */
// // // // // //     const groupTableCols = [
// // // // // //         { title: '#', render: (_, __, i) => <Text style={{ color: C.muted, fontSize: 12 }}>{i + 1}</Text>, width: 44 },
// // // // // //         {
// // // // // //             title: 'Client Group', dataIndex: 'client_group_name', key: 'client_group_name',
// // // // // //             render: v => <Text style={{ fontWeight: 500, fontSize: 13 }}>{v}</Text>,
// // // // // //             sorter: (a, b) => a.client_group_name.localeCompare(b.client_group_name),
// // // // // //         },
// // // // // //         {
// // // // // //             title: 'SPOC', dataIndex: 'spoc_name', key: 'spoc_name',
// // // // // //             render: v => <Text style={{ fontSize: 12, color: C.muted }}>{v || '—'}</Text>,
// // // // // //         },
// // // // // //         {
// // // // // //             title: 'Time Spent', key: 'time', align: 'right',
// // // // // //             render: (_, r) => <Text style={{ fontSize: 13, fontWeight: 700, color: C.toDo }}>{formatDurationFromMillis(r.total_hours)}</Text>,
// // // // // //             sorter: (a, b) => a.total_hours - b.total_hours,
// // // // // //             defaultSortOrder: 'descend',
// // // // // //         },
// // // // // //     ];

// // // // // //     /* ── Error state ── */
// // // // // //     if (error && !dashboardData) {
// // // // // //         return (
// // // // // //             <div style={{ padding: 60, textAlign: 'center', background: C.bg, minHeight: '100vh' }}>
// // // // // //                 <Text style={{ color: C.overdue, fontSize: 16 }}>{error}</Text><br />
// // // // // //                 <Button style={{ marginTop: 16 }} onClick={() => { didInit.current = false; }} icon={<ReloadOutlined />}>Retry</Button>
// // // // // //             </div>
// // // // // //         );
// // // // // //     }

// // // // // //     /* ══════════════ RENDER ══════════════ */
// // // // // //     return (
// // // // // //         <div style={{ background: C.bg, minHeight: '100vh', padding: '24px 28px', fontFamily: '"DM Sans", "Segoe UI", sans-serif' }}>

// // // // // //             {/* ── Header ── */}
// // // // // //             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
// // // // // //                 <div>
// // // // // //                     <Title level={3} style={{ margin: 0, color: C.text, fontWeight: 800, letterSpacing: '-0.03em' }}>
// // // // // //                         Task Analytics
// // // // // //                     </Title>
// // // // // //                     <Text style={{ color: C.muted, fontSize: 13 }}>
// // // // // //                         {moment().format('dddd, D MMMM YYYY')} · Real-time overview
// // // // // //                     </Text>
// // // // // //                 </div>
// // // // // //                 <Space>
// // // // // //                     <Button icon={<ReloadOutlined />} onClick={handleRefresh} loading={loading}>Refresh</Button>
// // // // // //                     <Button type="primary" onClick={() => navigate('/stt-records')} style={{ background: C.toDo, borderColor: C.toDo }}>
// // // // // //                         All Tasks →
// // // // // //                     </Button>
// // // // // //                 </Space>
// // // // // //             </div>

// // // // // //             {/* ── Filters ── */}
// // // // // //             <div style={{ background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`, marginBottom: 24, overflow: 'hidden' }}>
// // // // // //                 <div
// // // // // //                     onClick={() => setFiltersOpen(v => !v)}
// // // // // //                     style={{ padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', borderBottom: filtersOpen ? `1px solid ${C.border}` : 'none' }}
// // // // // //                 >
// // // // // //                     <Space>
// // // // // //                         <FilterOutlined style={{ color: C.toDo }} />
// // // // // //                         <Text style={{ fontWeight: 600, color: C.text }}>Filters</Text>
// // // // // //                         {activeFilterCount > 0 && (
// // // // // //                             <span style={{ background: C.toDo, color: '#fff', borderRadius: 20, padding: '1px 8px', fontSize: 11, fontWeight: 700 }}>
// // // // // //                                 {activeFilterCount} active
// // // // // //                             </span>
// // // // // //                         )}
// // // // // //                     </Space>
// // // // // //                     <Text style={{ color: C.muted, fontSize: 12 }}>{filtersOpen ? '▲ collapse' : '▼ expand'}</Text>
// // // // // //                 </div>
// // // // // //                 {filtersOpen && (
// // // // // //                     <div style={{ padding: '16px 20px' }}>
// // // // // //                         <Row gutter={[12, 12]}>
// // // // // //                             <Col xs={24} sm={12} md={8} lg={5}>
// // // // // //                                 <RangePicker style={{ width: '100%' }} value={dateRange} onChange={setDateRange} size="small" />
// // // // // //                             </Col>
// // // // // //                             {[
// // // // // //                                 { placeholder: 'Client Group', value: selectedClientGroup, onChange: setSelectedClientGroup, items: clientGroups, labelKey: 'group_name' },
// // // // // //                                 { placeholder: 'Client',       value: selectedClient,      onChange: setSelectedClient,      items: clients,       labelKey: 'name'       },
// // // // // //                                 { placeholder: 'Team',         value: selectedTeam,        onChange: setSelectedTeam,        items: teams,         labelKey: 'name'       },
// // // // // //                                 { placeholder: 'Sub Service',  value: selectedSubService,  onChange: setSelectedSubService,  items: subServices,   labelKey: 'name'       },
// // // // // //                             ].map(({ placeholder, value, onChange, items, labelKey }) => (
// // // // // //                                 <Col xs={24} sm={12} md={8} lg={4} key={placeholder}>
// // // // // //                                     <Select mode="multiple" placeholder={placeholder} allowClear showSearch value={value} onChange={onChange}
// // // // // //                                         style={{ width: '100%' }} size="small"
// // // // // //                                         filterOption={(inp, opt) => (opt?.children ?? '').toLowerCase().includes(inp.toLowerCase())}>
// // // // // //                                         {items.map(i => <Option key={i.id} value={i.id}>{i[labelKey]}</Option>)}
// // // // // //                                     </Select>
// // // // // //                                 </Col>
// // // // // //                             ))}
// // // // // //                             <Col xs={24} sm={12} md={4} lg={3}>
// // // // // //                                 <Button size="small" onClick={handleClearFilters} icon={<ClearOutlined />} block>Clear</Button>
// // // // // //                             </Col>
// // // // // //                         </Row>
// // // // // //                     </div>
// // // // // //                 )}
// // // // // //             </div>

// // // // // //             {/* ── KPI Cards ── */}
// // // // // //             <Row gutter={[14, 14]} style={{ marginBottom: 20 }}>
// // // // // //                 {[
// // // // // //                     { title: 'Total Tasks',  value: taskCounts.allTasks,   color: C.all,        lightColor: '#f1f5f9', icon: <FcList />,                    subtitle: 'Across all statuses',          status: 'all'         },
// // // // // //                     { title: 'To Do',        value: taskCounts.toDo,       color: C.toDo,       lightColor: '#ede9fe', icon: <ClockCircleOutlined />,         subtitle: 'Pending start',                status: 'To Do'       },
// // // // // //                     { title: 'In Progress',  value: taskCounts.inProgress, color: C.inProgress, lightColor: '#fef3c7', icon: <MinusCircleOutlined />,         subtitle: 'Being worked on',              status: 'In Progress' },
// // // // // //                     { title: 'Done',         value: taskCounts.done,       color: C.done,       lightColor: '#d1fae5', icon: <CheckCircleOutlined />,         subtitle: `${completionRate}% completion`, status: 'Done'        },
// // // // // //                     { title: 'Overdue',      value: taskCounts.overdue,    color: C.overdue,    lightColor: '#fee2e2', icon: <ExclamationCircleOutlined />,   subtitle: 'Need attention',               status: 'Over Due'    },
// // // // // //                 ].map((card) => (
// // // // // //                     <Col key={card.title} xs={12} sm={8} md={8} lg={24 / 5} style={{ display: 'flex' }}>
// // // // // //                         <StatCard {...card} loading={loading} onClick={() => goToTasks(card.status)} />
// // // // // //                     </Col>
// // // // // //                 ))}
// // // // // //             </Row>

// // // // // //             {/* ── Overall progress bar ── */}
// // // // // //             {taskCounts.allTasks > 0 && (
// // // // // //                 <div style={{ background: C.surface, borderRadius: 14, padding: '16px 24px', marginBottom: 20, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
// // // // // //                     <Text style={{ fontWeight: 600, color: C.text, whiteSpace: 'nowrap', fontSize: 13 }}>Overall Progress</Text>
// // // // // //                     <div style={{ flex: 1, minWidth: 120 }}>
// // // // // //                         <Progress
// // // // // //                             percent={completionRate}
// // // // // //                             strokeColor={{ '0%': C.toDo, '100%': C.done }}
// // // // // //                             trailColor="#e2e8f0" strokeWidth={10} showInfo={false}
// // // // // //                         />
// // // // // //                     </div>
// // // // // //                     <div style={{ display: 'flex', gap: 24, flexShrink: 0 }}>
// // // // // //                         {[
// // // // // //                             { label: 'Done',    val: taskCounts.done,                            color: C.done       },
// // // // // //                             { label: 'Active',  val: taskCounts.toDo + taskCounts.inProgress,    color: C.inProgress },
// // // // // //                             { label: 'Overdue', val: taskCounts.overdue,                         color: C.overdue    },
// // // // // //                             { label: 'Complete',val: `${completionRate}%`,                       color: C.text       },
// // // // // //                         ].map(({ label, val, color }) => (
// // // // // //                             <div key={label} style={{ textAlign: 'center' }}>
// // // // // //                                 <div style={{ fontWeight: 700, color, fontSize: 16, lineHeight: 1 }}>{val}</div>
// // // // // //                                 <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{label}</div>
// // // // // //                             </div>
// // // // // //                         ))}
// // // // // //                     </div>
// // // // // //                 </div>
// // // // // //             )}

// // // // // //             {/* ── Row 1: Pie + Upcoming tasks ── */}
// // // // // //             <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
// // // // // //                 <Col xs={24} lg={9}>
// // // // // //                     <div style={{ background: C.surface, borderRadius: 14, padding: '20px 20px 12px', border: `1px solid ${C.border}`, height: '100%' }}>
// // // // // //                         <SectionTitle>Status Distribution</SectionTitle>
// // // // // //                         {loading
// // // // // //                             ? <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Spin /></div>
// // // // // //                             : pieData.length > 0
// // // // // //                                 ? <EChartsReact option={pieOption(pieData)} style={{ height: 300 }} />
// // // // // //                                 : <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.muted }}>No data</div>
// // // // // //                         }
// // // // // //                     </div>
// // // // // //                 </Col>
// // // // // //                 <Col xs={24} lg={15}>
// // // // // //                     <div style={{ background: C.surface, borderRadius: 14, padding: '20px', border: `1px solid ${C.border}`, height: '100%' }}>
// // // // // //                         <SectionTitle extra={
// // // // // //                             <Button size="small" type="link" onClick={() => goToTasks('all')} style={{ color: C.toDo, padding: 0 }}>
// // // // // //                                 View all →
// // // // // //                             </Button>
// // // // // //                         }>
// // // // // //                             Upcoming &amp; Recent Tasks
// // // // // //                         </SectionTitle>
// // // // // //                         <Table
// // // // // //                             dataSource={upcomingTasks}
// // // // // //                             columns={upcomingCols}
// // // // // //                             rowKey="id"
// // // // // //                             size="small"
// // // // // //                             pagination={false}
// // // // // //                             loading={loading}
// // // // // //                             scroll={{ x: 'max-content' }}
// // // // // //                             onRow={r => ({ onClick: () => goToTasks(r.status), style: { cursor: 'pointer' } })}
// // // // // //                             locale={{ emptyText: <div style={{ padding: 32, color: C.muted }}>No tasks found 🎉</div> }}
// // // // // //                         />
// // // // // //                     </div>
// // // // // //                 </Col>
// // // // // //             </Row>

// // // // // //             {/* ── Row 2: Time Spent — chart + full table side by side ── */}
// // // // // //             <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
// // // // // //                 <Col xs={24}>
// // // // // //                     <div style={{ background: C.surface, borderRadius: 14, padding: '20px', border: `1px solid ${C.border}` }}>
// // // // // //                         <SectionTitle
// // // // // //                             extra={
// // // // // //                                 <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
// // // // // //                                     <Text style={{ fontSize: 13, color: C.muted }}>
// // // // // //                                         Total: <strong style={{ color: C.toDo }}>{formatDurationFromMillis(totalTime)}</strong>
// // // // // //                                     </Text>
// // // // // //                                     <Segmented
// // // // // //                                         size="small"
// // // // // //                                         options={['By Client', 'By Group']}
// // // // // //                                         value={tableView === 'client' ? 'By Client' : 'By Group'}
// // // // // //                                         onChange={v => setTableView(v === 'By Client' ? 'client' : 'group')}
// // // // // //                                     />
// // // // // //                                 </div>
// // // // // //                             }
// // // // // //                         >
// // // // // //                             Total Time Spent
// // // // // //                         </SectionTitle>

// // // // // //                         {tableView === 'client' ? (
// // // // // //                             timePerClientData.length > 0 ? (
// // // // // //                                 <Row gutter={[16, 16]}>
// // // // // //                                     {/* Bar chart — top 10 */}
// // // // // //                                     <Col xs={24} xl={12}>
// // // // // //                                         <Text style={{ fontSize: 12, color: C.muted, display: 'block', marginBottom: 8 }}>
// // // // // //                                             Top {topClients.length} clients by time logged
// // // // // //                                         </Text>
// // // // // //                                         <EChartsReact
// // // // // //                                             option={barOption(topClients.map(r => ({ name: r.client_name, fullName: r.client_name, ms: r.total_hours })))}
// // // // // //                                             style={{ height: 280 }}
// // // // // //                                         />
// // // // // //                                     </Col>
// // // // // //                                     {/* Full table — all clients */}
// // // // // //                                     <Col xs={24} xl={12}>
// // // // // //                                         <Table
// // // // // //                                             dataSource={timePerClientData}
// // // // // //                                             rowKey="client_id"
// // // // // //                                             size="small"
// // // // // //                                             columns={clientTableCols}
// // // // // //                                             pagination={{ pageSize: 8, size: 'small', showSizeChanger: false }}
// // // // // //                                             scroll={{ x: 'max-content' }}
// // // // // //                                             onRow={r => ({ onClick: () => handleClientClick(r.client_id), style: { cursor: 'pointer' } })}
// // // // // //                                             summary={() => (
// // // // // //                                                 <Table.Summary.Row style={{ background: '#f8fafc' }}>
// // // // // //                                                     <Table.Summary.Cell index={0} colSpan={4}>
// // // // // //                                                         <Text strong style={{ fontSize: 12 }}>Grand Total</Text>
// // // // // //                                                     </Table.Summary.Cell>
// // // // // //                                                     <Table.Summary.Cell index={1} align="right">
// // // // // //                                                         <Text strong style={{ fontSize: 12, color: C.toDo }}>
// // // // // //                                                             {formatDurationFromMillis(totalTime)}
// // // // // //                                                         </Text>
// // // // // //                                                     </Table.Summary.Cell>
// // // // // //                                                 </Table.Summary.Row>
// // // // // //                                             )}
// // // // // //                                         />
// // // // // //                                     </Col>
// // // // // //                                 </Row>
// // // // // //                             ) : (
// // // // // //                                 <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.muted }}>
// // // // // //                                     {loading ? <Spin /> : 'No time entries recorded'}
// // // // // //                                 </div>
// // // // // //                             )
// // // // // //                         ) : (
// // // // // //                             timePerGroup.length > 0 ? (
// // // // // //                                 <Row gutter={[16, 16]}>
// // // // // //                                     <Col xs={24} xl={12}>
// // // // // //                                         <Text style={{ fontSize: 12, color: C.muted, display: 'block', marginBottom: 8 }}>
// // // // // //                                             Top {topGroups.length} groups by time logged
// // // // // //                                         </Text>
// // // // // //                                         <EChartsReact
// // // // // //                                             option={barOption(topGroups.map(r => ({ name: r.client_group_name, fullName: r.client_group_name, ms: r.total_hours })))}
// // // // // //                                             style={{ height: 280 }}
// // // // // //                                         />
// // // // // //                                     </Col>
// // // // // //                                     <Col xs={24} xl={12}>
// // // // // //                                         <Table
// // // // // //                                             dataSource={timePerGroup}
// // // // // //                                             rowKey="client_group_name"
// // // // // //                                             size="small"
// // // // // //                                             columns={groupTableCols}
// // // // // //                                             pagination={{ pageSize: 8, size: 'small', showSizeChanger: false }}
// // // // // //                                             scroll={{ x: 'max-content' }}
// // // // // //                                             summary={() => (
// // // // // //                                                 <Table.Summary.Row style={{ background: '#f8fafc' }}>
// // // // // //                                                     <Table.Summary.Cell index={0} colSpan={3}>
// // // // // //                                                         <Text strong style={{ fontSize: 12 }}>Grand Total</Text>
// // // // // //                                                     </Table.Summary.Cell>
// // // // // //                                                     <Table.Summary.Cell index={1} align="right">
// // // // // //                                                         <Text strong style={{ fontSize: 12, color: C.toDo }}>
// // // // // //                                                             {formatDurationFromMillis(timePerGroup.reduce((s, r) => s + r.total_hours, 0))}
// // // // // //                                                         </Text>
// // // // // //                                                     </Table.Summary.Cell>
// // // // // //                                                 </Table.Summary.Row>
// // // // // //                                             )}
// // // // // //                                         />
// // // // // //                                     </Col>
// // // // // //                                 </Row>
// // // // // //                             ) : (
// // // // // //                                 <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.muted }}>
// // // // // //                                     {loading ? <Spin /> : 'No time entries recorded'}
// // // // // //                                 </div>
// // // // // //                             )
// // // // // //                         )}
// // // // // //                     </div>
// // // // // //                 </Col>
// // // // // //             </Row>

// // // // // //             {/* ── Client Detail Modal ── */}
// // // // // //             <Modal
// // // // // //                 open={clientModalVisible}
// // // // // //                 onCancel={() => setClientModalVisible(false)}
// // // // // //                 footer={null}
// // // // // //                 width={860}
// // // // // //                 styles={{ body: { padding: '24px', background: C.bg } }}
// // // // // //                 title={
// // // // // //                     <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
// // // // // //                         <div style={{ width: 38, height: 38, borderRadius: 10, background: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.toDo, fontWeight: 800, fontSize: 16 }}>
// // // // // //                             {(selectedClientInfo?.name || 'C')[0]}
// // // // // //                         </div>
// // // // // //                         <div>
// // // // // //                             <div style={{ fontWeight: 700, color: C.text, fontSize: 15 }}>{selectedClientInfo?.name || 'Client'}</div>
// // // // // //                             <div style={{ fontSize: 12, color: C.muted }}>
// // // // // //                                 {getGroupName(selectedClientInfo)} · {getSpocName(selectedClientInfo)}
// // // // // //                             </div>
// // // // // //                         </div>
// // // // // //                     </div>
// // // // // //                 }
// // // // // //             >
// // // // // //                 {clientModalLoading ? (
// // // // // //                     <div style={{ textAlign: 'center', padding: 60 }}><Spin size="large" /></div>
// // // // // //                 ) : clientSummary ? (
// // // // // //                     <>
// // // // // //                         {/* Mini KPIs */}
// // // // // //                         <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
// // // // // //                             {[
// // // // // //                                 { label: 'Done Tasks',  value: clientSummary.done_count,                            color: C.done,       bg: '#d1fae5', isText: false },
// // // // // //                                 { label: 'Total Time',  value: formatDurationFromMillis(clientSummary.total_hours_ms), color: C.toDo,    bg: '#ede9fe', isText: true  },
// // // // // //                                 { label: 'Employees',   value: clientSummary.employees?.length || 0,                color: C.inProgress, bg: '#fef3c7', isText: false },
// // // // // //                                 { label: 'Services',    value: clientSummary.sub_services?.length || 0,             color: '#0ea5e9',    bg: '#e0f2fe', isText: false },
// // // // // //                             ].map(({ label, value, color, bg, isText }) => (
// // // // // //                                 <Col span={6} key={label}>
// // // // // //                                     <div style={{ background: bg, borderRadius: 12, padding: '14px 16px', textAlign: 'center' }}>
// // // // // //                                         {isText
// // // // // //                                             ? <div style={{ fontSize: 20, fontWeight: 800, color, lineHeight: 1.1 }}>{value}</div>
// // // // // //                                             : <CountUp end={value} duration={1.2} style={{ fontSize: 28, fontWeight: 800, color, lineHeight: 1 }} />
// // // // // //                                         }
// // // // // //                                         <div style={{ fontSize: 11, color: C.muted, marginTop: 4, fontWeight: 600 }}>{label}</div>
// // // // // //                                     </div>
// // // // // //                                 </Col>
// // // // // //                             ))}
// // // // // //                         </Row>

// // // // // //                         {/* Charts */}
// // // // // //                         <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
// // // // // //                             {clientSummary.employees?.length > 0 && (
// // // // // //                                 <Col xs={24} md={12}>
// // // // // //                                     <div style={{ background: C.surface, borderRadius: 12, padding: 16, border: `1px solid ${C.border}` }}>
// // // // // //                                         <Text style={{ fontWeight: 700, fontSize: 13, display: 'block', marginBottom: 8 }}>Employee Hours</Text>
// // // // // //                                         <EChartsReact
// // // // // //                                             option={hBarOption(clientSummary.employees)}
// // // // // //                                             style={{ height: Math.min(240, clientSummary.employees.length * 34 + 40) }}
// // // // // //                                         />
// // // // // //                                     </div>
// // // // // //                                 </Col>
// // // // // //                             )}
// // // // // //                             {clientSummary.sub_services?.length > 0 && (
// // // // // //                                 <Col xs={24} md={12}>
// // // // // //                                     <div style={{ background: C.surface, borderRadius: 12, padding: 16, border: `1px solid ${C.border}` }}>
// // // // // //                                         <Text style={{ fontWeight: 700, fontSize: 13, display: 'block', marginBottom: 8 }}>Service Breakdown</Text>
// // // // // //                                         <EChartsReact
// // // // // //                                             option={hBarOption(clientSummary.sub_services)}
// // // // // //                                             style={{ height: Math.min(240, clientSummary.sub_services.length * 34 + 40) }}
// // // // // //                                         />
// // // // // //                                     </div>
// // // // // //                                 </Col>
// // // // // //                             )}
// // // // // //                         </Row>

// // // // // //                         {/* Employee detail table */}
// // // // // //                         {clientSummary.employees?.length > 0 && (
// // // // // //                             <div style={{ background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`, overflow: 'hidden' }}>
// // // // // //                                 <Table
// // // // // //                                     size="small"
// // // // // //                                     dataSource={clientSummary.employees.map((e, i) => ({ key: i, name: e.name, time: formatDurationFromMillis(e.ms), ms: e.ms }))}
// // // // // //                                     columns={[
// // // // // //                                         { title: '#',          render: (_, __, i) => i + 1, width: 40 },
// // // // // //                                         { title: 'Employee',   dataIndex: 'name' },
// // // // // //                                         {
// // // // // //                                             title: 'Time Spent', dataIndex: 'time', align: 'right',
// // // // // //                                             render: v => <Text style={{ fontWeight: 600, color: C.toDo }}>{v}</Text>,
// // // // // //                                             sorter: (a, b) => a.ms - b.ms, defaultSortOrder: 'descend',
// // // // // //                                         },
// // // // // //                                     ]}
// // // // // //                                     pagination={false}
// // // // // //                                     bordered={false}
// // // // // //                                     title={() => <Text style={{ fontWeight: 700, fontSize: 13 }}>Employee Breakdown</Text>}
// // // // // //                                 />
// // // // // //                             </div>
// // // // // //                         )}
// // // // // //                     </>
// // // // // //                 ) : (
// // // // // //                     <div style={{ textAlign: 'center', padding: 40, color: C.muted }}>No data available</div>
// // // // // //                 )}
// // // // // //             </Modal>

// // // // // //         </div>
// // // // // //     );
// // // // // // };

// // // // // // export default TaskDashboard;

// // // // // import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
// // // // // import {
// // // // //     Card, Col, Row, Typography, message, Table, DatePicker,
// // // // //     Select, Space, Button, Segmented, Modal, Spin, Progress, Tooltip,
// // // // // } from 'antd';
// // // // // import { api } from '../../../services/api';
// // // // // import EChartsReact from 'echarts-for-react';
// // // // // import CountUp from 'react-countup';
// // // // // import {
// // // // //     ClockCircleOutlined, CheckCircleOutlined,
// // // // //     MinusCircleOutlined, ExclamationCircleOutlined,
// // // // //     FilterOutlined, ClearOutlined, ReloadOutlined,
// // // // // } from '@ant-design/icons';
// // // // // import { FcList } from 'react-icons/fc';
// // // // // import moment from 'moment';
// // // // // import { formatDurationFromMillis } from './STT_Records';
// // // // // import { useNavigate } from 'react-router-dom';

// // // // // const { Title, Text } = Typography;
// // // // // const { RangePicker } = DatePicker;
// // // // // const { Option } = Select;

// // // // // /* ─── Design tokens ─────────────────────────────────────────── */
// // // // // const C = {
// // // // //     done:       '#10b981',
// // // // //     inProgress: '#f59e0b',
// // // // //     overdue:    '#ef4444',
// // // // //     toDo:       '#6366f1',
// // // // //     all:        '#0f172a',
// // // // //     bg:         '#f1f5f9',
// // // // //     surface:    '#ffffff',
// // // // //     border:     '#e2e8f0',
// // // // //     text:       '#0f172a',
// // // // //     muted:      '#64748b',
// // // // // };

// // // // // const STATUS_META = {
// // // // //     'Done':        { color: C.done,       light: '#d1fae5' },
// // // // //     'In Progress': { color: C.inProgress, light: '#fef3c7' },
// // // // //     'Over Due':    { color: C.overdue,    light: '#fee2e2' },
// // // // //     'To Do':       { color: C.toDo,       light: '#ede9fe' },
// // // // // };

// // // // // /* ─── Stat Card ─────────────────────────────────────────────── */
// // // // // const StatCard = ({ title, value, color, lightColor, icon, subtitle, onClick, loading }) => (
// // // // //     <div
// // // // //         onClick={onClick}
// // // // //         style={{
// // // // //             background: C.surface, borderRadius: 16, padding: '20px 22px',
// // // // //             cursor: 'pointer', border: `1px solid ${C.border}`,
// // // // //             borderTop: `4px solid ${color}`,
// // // // //             transition: 'all 0.2s', flex: 1, minWidth: 0,
// // // // //             boxShadow: '0 1px 4px rgba(0,0,0,0.06)', position: 'relative', overflow: 'hidden',
// // // // //         }}
// // // // //         onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = `0 10px 28px ${color}28`; }}
// // // // //         onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)'; }}
// // // // //     >
// // // // //         <div style={{ position: 'absolute', right: 18, top: 18, width: 44, height: 44, borderRadius: 12, background: lightColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color }}>
// // // // //             {icon}
// // // // //         </div>
// // // // //         <Text style={{ fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: '0.07em', textTransform: 'uppercase' }}>
// // // // //             {title}
// // // // //         </Text>
// // // // //         <div style={{ marginTop: 8 }}>
// // // // //             {loading
// // // // //                 ? <div style={{ fontSize: 28, fontWeight: 700, color: C.muted }}>—</div>
// // // // //                 : <CountUp end={value} duration={1.6} style={{ fontSize: 34, fontWeight: 800, color, lineHeight: 1 }} />
// // // // //             }
// // // // //         </div>
// // // // //         {subtitle && <Text style={{ fontSize: 11, color: C.muted, marginTop: 6, display: 'block' }}>{subtitle}</Text>}
// // // // //     </div>
// // // // // );

// // // // // /* ─── Section header ────────────────────────────────────────── */
// // // // // const SectionTitle = ({ children, extra }) => (
// // // // //     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
// // // // //         <Text style={{ fontSize: 14, fontWeight: 700, color: C.text, letterSpacing: '-0.01em' }}>{children}</Text>
// // // // //         {extra}
// // // // //     </div>
// // // // // );

// // // // // /* ─── Status Badge ──────────────────────────────────────────── */
// // // // // const StatusBadge = ({ status }) => {
// // // // //     const meta = STATUS_META[status] || { color: C.muted, light: '#f1f5f9' };
// // // // //     return (
// // // // //         <span style={{
// // // // //             background: meta.light, color: meta.color,
// // // // //             borderRadius: 20, padding: '2px 10px',
// // // // //             fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap',
// // // // //         }}>
// // // // //             {status}
// // // // //         </span>
// // // // //     );
// // // // // };

// // // // // /* ─── Chart helpers ─────────────────────────────────────────── */
// // // // // const pieOption = (data) => ({
// // // // //     backgroundColor: 'transparent',
// // // // //     tooltip: {
// // // // //         trigger: 'item',
// // // // //         formatter: '{b}: <b>{c}</b> ({d}%)',
// // // // //         backgroundColor: '#1e293b', borderColor: 'transparent',
// // // // //         textStyle: { color: '#f1f5f9', fontSize: 13 },
// // // // //     },
// // // // //     legend: {
// // // // //         orient: 'horizontal', bottom: 0, left: 'center',
// // // // //         textStyle: { color: C.muted, fontSize: 12 },
// // // // //         itemWidth: 10, itemHeight: 10,
// // // // //     },
// // // // //     series: [{
// // // // //         type: 'pie', radius: ['42%', '70%'], center: ['50%', '44%'],
// // // // //         avoidLabelOverlap: true,
// // // // //         itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
// // // // //         label: { show: true, formatter: '{b}\n{c}', fontSize: 11, color: C.muted, lineHeight: 16 },
// // // // //         labelLine: { length: 10, length2: 6 },
// // // // //         data: data.map(d => ({ ...d, itemStyle: { color: STATUS_META[d.name]?.color || '#94a3b8' } })),
// // // // //         emphasis: { itemStyle: { shadowBlur: 12, shadowColor: 'rgba(0,0,0,0.15)' } },
// // // // //     }],
// // // // // });

// // // // // const barOption = (data) => ({
// // // // //     backgroundColor: 'transparent',
// // // // //     tooltip: {
// // // // //         trigger: 'axis', axisPointer: { type: 'shadow' },
// // // // //         backgroundColor: '#1e293b', borderColor: 'transparent',
// // // // //         textStyle: { color: '#f1f5f9', fontSize: 12 },
// // // // //         formatter: (params) => {
// // // // //             const p = params[0];
// // // // //             const orig = data[p.dataIndex];
// // // // //             return `<b>${orig?.fullName || p.name}</b><br/>${formatDurationFromMillis(p.value)}`;
// // // // //         },
// // // // //     },
// // // // //     grid: { top: 16, right: 16, bottom: 48, left: 16, containLabel: true },
// // // // //     xAxis: {
// // // // //         type: 'category',
// // // // //         data: data.map(d => d.name.length > 13 ? d.name.slice(0, 12) + '…' : d.name),
// // // // //         axisLabel: { color: C.muted, fontSize: 11, rotate: data.length > 5 ? 30 : 0, interval: 0 },
// // // // //         axisLine: { lineStyle: { color: C.border } },
// // // // //         axisTick: { show: false },
// // // // //     },
// // // // //     yAxis: {
// // // // //         type: 'value',
// // // // //         axisLabel: { color: C.muted, fontSize: 10, formatter: v => formatDurationFromMillis(v) },
// // // // //         splitLine: { lineStyle: { color: C.border, type: 'dashed' } },
// // // // //         axisLine: { show: false }, axisTick: { show: false },
// // // // //     },
// // // // //     series: [{
// // // // //         type: 'bar',
// // // // //         data: data.map(d => ({
// // // // //             value: d.ms,
// // // // //             itemStyle: {
// // // // //                 color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: '#6366f1' }, { offset: 1, color: '#818cf8' }] },
// // // // //                 borderRadius: [6, 6, 0, 0],
// // // // //             },
// // // // //         })),
// // // // //         barMaxWidth: 48,
// // // // //         emphasis: {
// // // // //             itemStyle: {
// // // // //                 color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: '#4f46e5' }, { offset: 1, color: '#6366f1' }] },
// // // // //             },
// // // // //         },
// // // // //     }],
// // // // // });

// // // // // const hBarOption = (data, colorStart = '#06b6d4', colorEnd = '#0ea5e9') => {
// // // // //     // ECharts renders category axis bottom-up, so reverse to show highest at top
// // // // //     const reversed = [...data].reverse();
// // // // //     return {
// // // // //     backgroundColor: 'transparent',
// // // // //     tooltip: {
// // // // //         trigger: 'axis', axisPointer: { type: 'shadow' },
// // // // //         backgroundColor: '#1e293b', borderColor: 'transparent',
// // // // //         textStyle: { color: '#f1f5f9', fontSize: 12 },
// // // // //         formatter: (params) => `<b>${params[0].name}</b><br/>${formatDurationFromMillis(params[0].value)}`,
// // // // //     },
// // // // //     grid: { top: 4, right: 96, bottom: 4, left: 8, containLabel: true },
// // // // //     xAxis: {
// // // // //         type: 'value',
// // // // //         show: false,
// // // // //         splitLine: { show: false },
// // // // //     },
// // // // //     yAxis: {
// // // // //         type: 'category',
// // // // //         data: reversed.map(d => d.name?.length > 18 ? d.name.slice(0, 17) + '…' : d.name || 'N/A'),
// // // // //         axisLabel: { color: C.muted, fontSize: 11 },
// // // // //         axisLine: { show: false }, axisTick: { show: false },
// // // // //     },
// // // // //     series: [{
// // // // //         type: 'bar',
// // // // //         data: reversed.map(d => ({
// // // // //             value: d.ms || 0,
// // // // //             itemStyle: {
// // // // //                 color: { type: 'linear', x: 0, y: 0, x2: 1, y2: 0, colorStops: [{ offset: 0, color: colorStart }, { offset: 1, color: colorEnd }] },
// // // // //                 borderRadius: [0, 6, 6, 0],
// // // // //             },
// // // // //         })),
// // // // //         barMaxWidth: 18,
// // // // //         label: {
// // // // //             show: true, position: 'right',
// // // // //             formatter: p => formatDurationFromMillis(p.value),
// // // // //             color: C.muted, fontSize: 10,
// // // // //         },
// // // // //     }],
// // // // //     };
// // // // // };

// // // // // /* ══════════════ MAIN COMPONENT ══════════════ */
// // // // // const TaskDashboard = () => {
// // // // //     const navigate = useNavigate();

// // // // //     const [loading,             setLoading]             = useState(true);
// // // // //     const [dashboardData,       setDashboardData]       = useState(null);
// // // // //     const [error,               setError]               = useState(null);
// // // // //     const [dateRange,           setDateRange]           = useState(null);
// // // // //     const [clients,             setClients]             = useState([]);
// // // // //     const [selectedClient,      setSelectedClient]      = useState([]);
// // // // //     const [teams,               setTeams]               = useState([]);
// // // // //     const [selectedTeam,        setSelectedTeam]        = useState([]);
// // // // //     const [clientGroups,        setClientGroups]        = useState([]);
// // // // //     const [selectedClientGroup, setSelectedClientGroup] = useState([]);
// // // // //     const [allSpocs,            setAllSpocs]            = useState([]);
// // // // //     const [subServices,         setSubServices]         = useState([]);
// // // // //     const [selectedSubService,  setSelectedSubService]  = useState([]);
// // // // //     const [tableView,           setTableView]           = useState('client');
// // // // //     const [taskCounts,          setTaskCounts]          = useState({ allTasks: 0, done: 0, toDo: 0, overdue: 0, inProgress: 0 });
// // // // //     const [filtersOpen,         setFiltersOpen]         = useState(false);
// // // // //     const [timePerClientData,   setTimePerClientData]   = useState([]);

// // // // //     // Client modal
// // // // //     const [clientModalVisible,  setClientModalVisible]  = useState(false);
// // // // //     const [clientModalLoading,  setClientModalLoading]  = useState(false);
// // // // //     const [selectedClientInfo,  setSelectedClientInfo]  = useState(null);
// // // // //     const [clientSummary,       setClientSummary]       = useState(null);

// // // // //     // Drill-down modal (employee → services  /  service → employees)
// // // // //     const [drillVisible,        setDrillVisible]        = useState(false);
// // // // //     const [drillTitle,          setDrillTitle]          = useState('');
// // // // //     const [drillData,           setDrillData]           = useState([]);  // [{name, ms}]
// // // // //     const [drillType,           setDrillType]           = useState('');  // 'employee' | 'service'

// // // // //     // Ref to track if component is still mounted (avoids state-on-unmount warnings)
// // // // //     const mountedRef = useRef(true);
// // // // //     useEffect(() => { mountedRef.current = true; return () => { mountedRef.current = false; }; }, []);

// // // // //     // ── Refs for stable lookup functions that don't re-trigger effects ──────
// // // // //     const clientGroupsRef = useRef([]);
// // // // //     const allSpocsRef     = useRef([]);
// // // // //     useEffect(() => { clientGroupsRef.current = clientGroups; }, [clientGroups]);
// // // // //     useEffect(() => { allSpocsRef.current = allSpocs; }, [allSpocs]);

// // // // //     const getSpocName = useCallback((client) => {
// // // // //         if (!client) return 'N/A';
// // // // //         if (client.primary_spoc_name) return client.primary_spoc_name;
// // // // //         const groups = clientGroupsRef.current;
// // // // //         const group = groups.find(g => g.clients?.some(cg => (typeof cg === 'object' ? cg.id : cg) === client.id));
// // // // //         if (group?.primary_spoc_name) return group.primary_spoc_name;
// // // // //         if (typeof client.primary_spoc === 'number') {
// // // // //             const spoc = allSpocsRef.current.find(s => s.id === client.primary_spoc);
// // // // //             if (spoc) return `${spoc.first_name || ''} ${spoc.last_name || ''}`.trim() || spoc.user?.email || 'N/A';
// // // // //         }
// // // // //         return 'N/A';
// // // // //     }, []); // stable — reads from refs

// // // // //     const getGroupName = useCallback((client) => {
// // // // //         if (!client) return 'N/A';
// // // // //         const groups = clientGroupsRef.current;
// // // // //         const group = groups.find(g => g.clients?.some(cg => (typeof cg === 'object' ? cg.id : cg) === client.id));
// // // // //         return group?.group_name || 'N/A';
// // // // //     }, []); // stable

// // // // //     /* ── Build params ── */
// // // // //     const buildParams = (filters = {}) => {
// // // // //         const p = {
// // // // //             start_date:      filters.startDate?.format('YYYY-MM-DD'),
// // // // //             end_date:        filters.endDate?.format('YYYY-MM-DD'),
// // // // //             client_id:       filters.clientId?.length      ? filters.clientId.join(',')       : undefined,
// // // // //             team_id:         filters.teamId?.length        ? filters.teamId.join(',')         : undefined,
// // // // //             client_group_id: filters.clientGroupId?.length ? filters.clientGroupId.join(',') : undefined,
// // // // //             sub_service_id:  filters.subServiceId?.length  ? filters.subServiceId.join(',')  : undefined,
// // // // //         };
// // // // //         Object.keys(p).forEach(k => p[k] === undefined && delete p[k]);
// // // // //         return p;
// // // // //     };

// // // // //     /* ── Core fetch functions (stable — no deps that change) ── */
// // // // //     const fetchDashboard = useCallback(async (params) => {
// // // // //         if (!mountedRef.current) return;
// // // // //         setLoading(true);
// // // // //         try {
// // // // //             const res = await api.get('/clients/tasks/dashboard_summary/', { params });
// // // // //             if (mountedRef.current) setDashboardData(res.data);
// // // // //         } catch (err) {
// // // // //             console.error(err);
// // // // //             if (mountedRef.current) {
// // // // //                 setError('Failed to load dashboard data.');
// // // // //                 message.error('Failed to load dashboard.');
// // // // //             }
// // // // //         } finally {
// // // // //             if (mountedRef.current) setLoading(false);
// // // // //         }
// // // // //     }, []); // no deps — intentionally stable

// // // // //     const fetchTimePerClient = useCallback(async (params, clientsList) => {
// // // // //         if (!mountedRef.current) return;
// // // // //         try {
// // // // //             const res = await api.get('/clients/tasks/time_per_client/', { params });
// // // // //             if (!mountedRef.current) return;
// // // // //             setTimePerClientData((res.data || []).map(row => {
// // // // //                 const c = (clientsList || []).find(x => x.id === row.client_id);
// // // // //                 return {
// // // // //                     ...row,
// // // // //                     total_hours: row.total_hours_ms,
// // // // //                     group_name:  c ? getGroupName(c)  : 'N/A',
// // // // //                     spoc_name:   c ? getSpocName(c)   : 'N/A',
// // // // //                 };
// // // // //             }));
// // // // //         } catch (err) {
// // // // //             console.error('fetchTimePerClient error:', err);
// // // // //         }
// // // // //     }, [getGroupName, getSpocName]); // stable — getGroupName/getSpocName are stable

// // // // //     /* ── Initial load — runs ONCE ── */
// // // // //     const didInit = useRef(false);
// // // // //     useEffect(() => {
// // // // //         if (didInit.current) return;
// // // // //         didInit.current = true;

// // // // //         (async () => {
// // // // //             setLoading(true);
// // // // //             try {
// // // // //                 const [cR, tR, gR, sR, ssR] = await Promise.all([
// // // // //                     api.get('/clients/clients/?page_size=500'),
// // // // //                     api.get('/employee/teams/'),
// // // // //                     api.get('/clients/client-groups/'),
// // // // //                     api.get('/employee/employees/'),
// // // // //                     api.get('/clients/subservices/'),
// // // // //                 ]);
// // // // //                 if (!mountedRef.current) return;
// // // // //                 const cl = cR.data.results || cR.data;
// // // // //                 const gr = gR.data.results || gR.data;
// // // // //                 const sp = sR.data.results || sR.data;
// // // // //                 setClients(cl);
// // // // //                 setTeams(tR.data.results || tR.data);
// // // // //                 setClientGroups(gr);
// // // // //                 setAllSpocs(sp);
// // // // //                 setSubServices(ssR.data.results || ssR.data);
// // // // //                 // Set refs immediately so enrichment in fetchTimePerClient works
// // // // //                 clientGroupsRef.current = gr;
// // // // //                 allSpocsRef.current     = sp;
// // // // //                 await Promise.all([
// // // // //                     fetchDashboard({}),
// // // // //                     fetchTimePerClient({}, cl),
// // // // //                 ]);
// // // // //             } catch (err) {
// // // // //                 console.error('fetchInitialData error:', err);
// // // // //                 if (mountedRef.current) setError('Failed to load initial data.');
// // // // //             } finally {
// // // // //                 if (mountedRef.current) setLoading(false);
// // // // //             }
// // // // //         })();
// // // // //     }, [fetchDashboard, fetchTimePerClient]);

// // // // //     /* ── Re-fetch ONLY when user changes filters ── */
// // // // //     const isFirstRender = useRef(true);
// // // // //     useEffect(() => {
// // // // //         if (isFirstRender.current) { isFirstRender.current = false; return; }
// // // // //         const [startDate, endDate] = dateRange || [null, null];
// // // // //         const f = { startDate, endDate, clientId: selectedClient, teamId: selectedTeam, clientGroupId: selectedClientGroup, subServiceId: selectedSubService };
// // // // //         const p = buildParams(f);
// // // // //         fetchDashboard(p);
// // // // //         fetchTimePerClient(p, clients);
// // // // //         // eslint-disable-next-line react-hooks/exhaustive-deps
// // // // //     }, [dateRange, selectedClient, selectedTeam, selectedClientGroup, selectedSubService]);

// // // // //     /* ── Derive counts ── */
// // // // //     useEffect(() => {
// // // // //         if (!dashboardData?.status_counts) return;
// // // // //         const sc = dashboardData.status_counts;
// // // // //         setTaskCounts({
// // // // //             allTasks:   (sc['To Do'] || 0) + (sc['In Progress'] || 0) + (sc['Done'] || 0) + (sc['Over Due'] || 0),
// // // // //             done:       sc['Done']        || 0,
// // // // //             toDo:       sc['To Do']       || 0,
// // // // //             inProgress: sc['In Progress'] || 0,
// // // // //             overdue:    sc['Over Due']    || 0,
// // // // //         });
// // // // //     }, [dashboardData]);

// // // // //     /* ── Derived data ── */
// // // // //     const timePerGroup = useMemo(() =>
// // // // //         timePerClientData.reduce((acc, row) => {
// // // // //             if (!row.group_name || row.group_name === 'N/A') return acc;
// // // // //             const ex = acc.find(g => g.client_group_name === row.group_name);
// // // // //             if (ex) ex.total_hours += row.total_hours;
// // // // //             else acc.push({ client_group_name: row.group_name, spoc_name: row.spoc_name, total_hours: row.total_hours });
// // // // //             return acc;
// // // // //         }, [])
// // // // //     , [timePerClientData]);

// // // // //     const pieData = useMemo(() =>
// // // // //         dashboardData?.status_counts
// // // // //             ? Object.entries(dashboardData.status_counts).filter(([k, v]) => k !== 'total' && v > 0).map(([name, value]) => ({ name, value }))
// // // // //             : []
// // // // //     , [dashboardData]);

// // // // //     const topClients = useMemo(() => [...timePerClientData].sort((a, b) => b.total_hours - a.total_hours).slice(0, 10), [timePerClientData]);
// // // // //     const topGroups  = useMemo(() => [...timePerGroup].sort((a, b) => b.total_hours - a.total_hours).slice(0, 10), [timePerGroup]);

// // // // //     const totalTime       = useMemo(() => timePerClientData.reduce((s, r) => s + (r.total_hours || 0), 0), [timePerClientData]);
// // // // //     const completionRate  = taskCounts.allTasks ? Math.round((taskCounts.done / taskCounts.allTasks) * 100) : 0;
// // // // //     const activeFilterCount = [selectedClient, selectedTeam, selectedClientGroup, selectedSubService].filter(a => a.length).length + (dateRange ? 1 : 0);

// // // // //     /* ── Clear filters ── */
// // // // //     const handleClearFilters = () => {
// // // // //         setDateRange(null);
// // // // //         setSelectedClient([]);
// // // // //         setSelectedTeam([]);
// // // // //         setSelectedClientGroup([]);
// // // // //         setSelectedSubService([]);
// // // // //     };

// // // // //     /* ── Navigate with filters ── */
// // // // //     const goToTasks = (status) => {
// // // // //         const params = new URLSearchParams();
// // // // //         if (status !== 'all') params.set('status', status);
// // // // //         const [s, e] = dateRange || [null, null];
// // // // //         if (s) params.set('start_date', s.format('YYYY-MM-DD'));
// // // // //         if (e) params.set('end_date',   e.format('YYYY-MM-DD'));
// // // // //         if (selectedClient?.length)      params.set('client_id',      selectedClient.join(','));
// // // // //         if (selectedTeam?.length)        params.set('team_id',         selectedTeam.join(','));
// // // // //         if (selectedClientGroup?.length) params.set('client_group_id', selectedClientGroup.join(','));
// // // // //         if (selectedSubService?.length)  params.set('sub_service_id',  selectedSubService.join(','));
// // // // //         navigate(`/stt-records?${params.toString()}`);
// // // // //     };

// // // // //     /* ── Client modal ── */
// // // // //     const handleClientClick = useCallback(async (clientId) => {
// // // // //         const client = clients.find(c => c.id === clientId);
// // // // //         setSelectedClientInfo(client);
// // // // //         setClientSummary(null);
// // // // //         setClientModalVisible(true);
// // // // //         setClientModalLoading(true);
// // // // //         try {
// // // // //             const [startDate, endDate] = dateRange || [null, null];
// // // // //             const params = { client_id: clientId };
// // // // //             if (startDate) params.start_date = startDate.format('YYYY-MM-DD');
// // // // //             if (endDate)   params.end_date   = endDate.format('YYYY-MM-DD');
// // // // //             const res = await api.get('/clients/tasks/client_task_summary/', { params });
// // // // //             if (mountedRef.current) setClientSummary(res.data);
// // // // //         } catch (err) {
// // // // //             console.error(err);
// // // // //             message.error('Failed to load client details');
// // // // //         } finally {
// // // // //             if (mountedRef.current) setClientModalLoading(false);
// // // // //         }
// // // // //     }, [clients, dateRange]);

// // // // //     /* ── Refresh handler ── */
// // // // //     const handleRefresh = useCallback(() => {
// // // // //         const [startDate, endDate] = dateRange || [null, null];
// // // // //         const f = { startDate, endDate, clientId: selectedClient, teamId: selectedTeam, clientGroupId: selectedClientGroup, subServiceId: selectedSubService };
// // // // //         const p = buildParams(f);
// // // // //         fetchDashboard(p);
// // // // //         fetchTimePerClient(p, clients);
// // // // //     }, [dateRange, selectedClient, selectedTeam, selectedClientGroup, selectedSubService, clients, fetchDashboard, fetchTimePerClient]);

// // // // //     /* ── Upcoming tasks ── */
// // // // //     const upcomingTasks = useMemo(() => (dashboardData?.tasks || []).slice(0, 8), [dashboardData]);
// // // // //     const upcomingCols = [
// // // // //         {
// // // // //             title: 'Task ID', dataIndex: 'task_id', key: 'task_id', width: 140,
// // // // //             render: v => <Text style={{ fontFamily: 'monospace', fontSize: 11, color: C.muted }}>{v}</Text>,
// // // // //         },
// // // // //         { title: 'Client', dataIndex: 'client_name', key: 'client_name', ellipsis: true },
// // // // //         { title: 'Service', dataIndex: 'sub_service_name', key: 'sub_service_name', ellipsis: true },
// // // // //         {
// // // // //             title: 'Due', dataIndex: 'due_date', key: 'due_date', width: 100,
// // // // //             render: d => {
// // // // //                 if (!d) return <span style={{ color: C.muted }}>—</span>;
// // // // //                 const m = moment(d);
// // // // //                 const isLate = m.isBefore(moment(), 'day');
// // // // //                 return <span style={{ color: isLate ? C.overdue : C.muted, fontWeight: isLate ? 600 : 400, fontSize: 12 }}>{m.format('DD MMM YY')}</span>;
// // // // //             },
// // // // //         },
// // // // //         {
// // // // //             title: 'Status', dataIndex: 'status', key: 'status', width: 120,
// // // // //             render: (_, r) => {
// // // // //                 const eff = r.due_date && moment(r.due_date).isBefore(moment(), 'day') && r.status !== 'Done' ? 'Over Due' : r.status;
// // // // //                 return <StatusBadge status={eff} />;
// // // // //             },
// // // // //         },
// // // // //     ];

// // // // //     /* ── Table columns: client ── */
// // // // //     const clientTableCols = [
// // // // //         {
// // // // //             title: '#', render: (_, __, i) => <Text style={{ color: C.muted, fontSize: 12 }}>{i + 1}</Text>, width: 44,
// // // // //         },
// // // // //         {
// // // // //             title: 'Client', dataIndex: 'client_name', key: 'client_name',
// // // // //             width: 180,
// // // // //             render: v => (
// // // // //                 <Tooltip title={v} placement="topLeft">
// // // // //                     <Text style={{
// // // // //                         fontWeight: 500, fontSize: 13,
// // // // //                         maxWidth: 160, display: 'block',
// // // // //                         overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
// // // // //                     }}>
// // // // //                         {v}
// // // // //                     </Text>
// // // // //                 </Tooltip>
// // // // //             ),
// // // // //             sorter: (a, b) => a.client_name.localeCompare(b.client_name),
// // // // //         },
// // // // //         {
// // // // //             title: 'Group', dataIndex: 'group_name', key: 'group_name',
// // // // //             width: 130,
// // // // //             render: v => (
// // // // //                 <Tooltip title={v} placement="topLeft">
// // // // //                     <Text style={{ fontSize: 12, color: C.muted, maxWidth: 120, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
// // // // //                         {v || '—'}
// // // // //                     </Text>
// // // // //                 </Tooltip>
// // // // //             ),
// // // // //         },
// // // // //         {
// // // // //             title: 'SPOC', dataIndex: 'spoc_name', key: 'spoc_name',
// // // // //             width: 120,
// // // // //             render: v => (
// // // // //                 <Tooltip title={v} placement="topLeft">
// // // // //                     <Text style={{ fontSize: 12, color: C.muted, maxWidth: 110, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
// // // // //                         {v || '—'}
// // // // //                     </Text>
// // // // //                 </Tooltip>
// // // // //             ),
// // // // //         },
// // // // //         {
// // // // //             title: 'Time Spent', key: 'time', align: 'right', width: 110,
// // // // //             render: (_, r) => <Text style={{ fontSize: 13, fontWeight: 700, color: C.toDo }}>{formatDurationFromMillis(r.total_hours)}</Text>,
// // // // //             sorter: (a, b) => a.total_hours - b.total_hours,
// // // // //             defaultSortOrder: 'descend',
// // // // //         },
// // // // //     ];

// // // // //     /* ── Table columns: group ── */
// // // // //     const groupTableCols = [
// // // // //         { title: '#', render: (_, __, i) => <Text style={{ color: C.muted, fontSize: 12 }}>{i + 1}</Text>, width: 44 },
// // // // //         {
// // // // //             title: 'Client Group', dataIndex: 'client_group_name', key: 'client_group_name',
// // // // //             render: v => <Text style={{ fontWeight: 500, fontSize: 13 }}>{v}</Text>,
// // // // //             sorter: (a, b) => a.client_group_name.localeCompare(b.client_group_name),
// // // // //         },
// // // // //         {
// // // // //             title: 'SPOC', dataIndex: 'spoc_name', key: 'spoc_name',
// // // // //             render: v => <Text style={{ fontSize: 12, color: C.muted }}>{v || '—'}</Text>,
// // // // //         },
// // // // //         {
// // // // //             title: 'Time Spent', key: 'time', align: 'right',
// // // // //             render: (_, r) => <Text style={{ fontSize: 13, fontWeight: 700, color: C.toDo }}>{formatDurationFromMillis(r.total_hours)}</Text>,
// // // // //             sorter: (a, b) => a.total_hours - b.total_hours,
// // // // //             defaultSortOrder: 'descend',
// // // // //         },
// // // // //     ];

// // // // //     /* ── Error state ── */
// // // // //     if (error && !dashboardData) {
// // // // //         return (
// // // // //             <div style={{ padding: 60, textAlign: 'center', background: C.bg, minHeight: '100vh' }}>
// // // // //                 <Text style={{ color: C.overdue, fontSize: 16 }}>{error}</Text><br />
// // // // //                 <Button style={{ marginTop: 16 }} onClick={() => { didInit.current = false; }} icon={<ReloadOutlined />}>Retry</Button>
// // // // //             </div>
// // // // //         );
// // // // //     }

// // // // //     /* ══════════════ RENDER ══════════════ */
// // // // //     return (
// // // // //         <div style={{ background: C.bg, minHeight: '100vh', padding: '24px 28px', fontFamily: '"DM Sans", "Segoe UI", sans-serif' }}>

// // // // //             {/* ── Header ── */}
// // // // //             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
// // // // //                 <div>
// // // // //                     <Title level={3} style={{ margin: 0, color: C.text, fontWeight: 800, letterSpacing: '-0.03em' }}>
// // // // //                         Task Analytics
// // // // //                     </Title>
// // // // //                     <Text style={{ color: C.muted, fontSize: 13 }}>
// // // // //                         {moment().format('dddd, D MMMM YYYY')} · Real-time overview
// // // // //                     </Text>
// // // // //                 </div>
// // // // //                 <Space>
// // // // //                     <Button icon={<ReloadOutlined />} onClick={handleRefresh} loading={loading}>Refresh</Button>
// // // // //                     <Button type="primary" onClick={() => navigate('/stt-records')} style={{ background: C.toDo, borderColor: C.toDo }}>
// // // // //                         All Tasks →
// // // // //                     </Button>
// // // // //                 </Space>
// // // // //             </div>

// // // // //             {/* ── Filters ── */}
// // // // //             <div style={{ background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`, marginBottom: 24, overflow: 'hidden' }}>
// // // // //                 <div
// // // // //                     onClick={() => setFiltersOpen(v => !v)}
// // // // //                     style={{ padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', borderBottom: filtersOpen ? `1px solid ${C.border}` : 'none' }}
// // // // //                 >
// // // // //                     <Space>
// // // // //                         <FilterOutlined style={{ color: C.toDo }} />
// // // // //                         <Text style={{ fontWeight: 600, color: C.text }}>Filters</Text>
// // // // //                         {activeFilterCount > 0 && (
// // // // //                             <span style={{ background: C.toDo, color: '#fff', borderRadius: 20, padding: '1px 8px', fontSize: 11, fontWeight: 700 }}>
// // // // //                                 {activeFilterCount} active
// // // // //                             </span>
// // // // //                         )}
// // // // //                     </Space>
// // // // //                     <Text style={{ color: C.muted, fontSize: 12 }}>{filtersOpen ? '▲ collapse' : '▼ expand'}</Text>
// // // // //                 </div>
// // // // //                 {filtersOpen && (
// // // // //                     <div style={{ padding: '16px 20px' }}>
// // // // //                         <Row gutter={[12, 12]}>
// // // // //                             <Col xs={24} sm={12} md={8} lg={5}>
// // // // //                                 <RangePicker style={{ width: '100%' }} value={dateRange} onChange={setDateRange} size="small" />
// // // // //                             </Col>
// // // // //                             {[
// // // // //                                 { placeholder: 'Client Group', value: selectedClientGroup, onChange: setSelectedClientGroup, items: clientGroups, labelKey: 'group_name' },
// // // // //                                 { placeholder: 'Client',       value: selectedClient,      onChange: setSelectedClient,      items: clients,       labelKey: 'name'       },
// // // // //                                 { placeholder: 'Team',         value: selectedTeam,        onChange: setSelectedTeam,        items: teams,         labelKey: 'name'       },
// // // // //                                 { placeholder: 'Sub Service',  value: selectedSubService,  onChange: setSelectedSubService,  items: subServices,   labelKey: 'name'       },
// // // // //                             ].map(({ placeholder, value, onChange, items, labelKey }) => (
// // // // //                                 <Col xs={24} sm={12} md={8} lg={4} key={placeholder}>
// // // // //                                     <Select mode="multiple" placeholder={placeholder} allowClear showSearch value={value} onChange={onChange}
// // // // //                                         style={{ width: '100%' }} size="small"
// // // // //                                         filterOption={(inp, opt) => (opt?.children ?? '').toLowerCase().includes(inp.toLowerCase())}>
// // // // //                                         {items.map(i => <Option key={i.id} value={i.id}>{i[labelKey]}</Option>)}
// // // // //                                     </Select>
// // // // //                                 </Col>
// // // // //                             ))}
// // // // //                             <Col xs={24} sm={12} md={4} lg={3}>
// // // // //                                 <Button size="small" onClick={handleClearFilters} icon={<ClearOutlined />} block>Clear</Button>
// // // // //                             </Col>
// // // // //                         </Row>
// // // // //                     </div>
// // // // //                 )}
// // // // //             </div>

// // // // //             {/* ── KPI Cards ── */}
// // // // //             <Row gutter={[14, 14]} style={{ marginBottom: 20, flexWrap: 'nowrap' }}>
// // // // //                 {[
// // // // //                     { title: 'Total Tasks',  value: taskCounts.allTasks,   color: C.all,        lightColor: '#f1f5f9', icon: <FcList />,                    subtitle: 'Across all statuses',          status: 'all'         },
// // // // //                     { title: 'To Do',        value: taskCounts.toDo,       color: C.toDo,       lightColor: '#ede9fe', icon: <ClockCircleOutlined />,         subtitle: 'Pending start',                status: 'To Do'       },
// // // // //                     { title: 'In Progress',  value: taskCounts.inProgress, color: C.inProgress, lightColor: '#fef3c7', icon: <MinusCircleOutlined />,         subtitle: 'Being worked on',              status: 'In Progress' },
// // // // //                     { title: 'Done',         value: taskCounts.done,       color: C.done,       lightColor: '#d1fae5', icon: <CheckCircleOutlined />,         subtitle: `${completionRate}% completion`, status: 'Done'        },
// // // // //                     { title: 'Overdue',      value: taskCounts.overdue,    color: C.overdue,    lightColor: '#fee2e2', icon: <ExclamationCircleOutlined />,   subtitle: 'Need attention',               status: 'Over Due'    },
// // // // //                 ].map((card) => (
// // // // //                     <Col key={card.title} style={{ flex: '1 1 0', minWidth: 0, display: 'flex' }}>
// // // // //                         <StatCard {...card} loading={loading} onClick={() => goToTasks(card.status)} />
// // // // //                     </Col>
// // // // //                 ))}
// // // // //             </Row>

// // // // //             {/* ── Overall progress bar ── */}
// // // // //             {taskCounts.allTasks > 0 && (
// // // // //                 <div style={{ background: C.surface, borderRadius: 14, padding: '16px 24px', marginBottom: 20, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
// // // // //                     <Text style={{ fontWeight: 600, color: C.text, whiteSpace: 'nowrap', fontSize: 13 }}>Overall Progress</Text>
// // // // //                     <div style={{ flex: 1, minWidth: 120 }}>
// // // // //                         <Progress
// // // // //                             percent={completionRate}
// // // // //                             strokeColor={{ '0%': C.toDo, '100%': C.done }}
// // // // //                             trailColor="#e2e8f0" strokeWidth={10} showInfo={false}
// // // // //                         />
// // // // //                     </div>
// // // // //                     <div style={{ display: 'flex', gap: 24, flexShrink: 0 }}>
// // // // //                         {[
// // // // //                             { label: 'Done',    val: taskCounts.done,                            color: C.done       },
// // // // //                             { label: 'Active',  val: taskCounts.toDo + taskCounts.inProgress,    color: C.inProgress },
// // // // //                             { label: 'Overdue', val: taskCounts.overdue,                         color: C.overdue    },
// // // // //                             { label: 'Complete',val: `${completionRate}%`,                       color: C.text       },
// // // // //                         ].map(({ label, val, color }) => (
// // // // //                             <div key={label} style={{ textAlign: 'center' }}>
// // // // //                                 <div style={{ fontWeight: 700, color, fontSize: 16, lineHeight: 1 }}>{val}</div>
// // // // //                                 <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{label}</div>
// // // // //                             </div>
// // // // //                         ))}
// // // // //                     </div>
// // // // //                 </div>
// // // // //             )}

// // // // //             {/* ── Row 1: Pie + Upcoming tasks ── */}
// // // // //             <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
// // // // //                 <Col xs={24} lg={9}>
// // // // //                     <div style={{ background: C.surface, borderRadius: 14, padding: '20px 20px 12px', border: `1px solid ${C.border}`, height: '100%' }}>
// // // // //                         <SectionTitle>Status Distribution</SectionTitle>
// // // // //                         {loading
// // // // //                             ? <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Spin /></div>
// // // // //                             : pieData.length > 0
// // // // //                                 ? <EChartsReact option={pieOption(pieData)} style={{ height: 300 }} />
// // // // //                                 : <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.muted }}>No data</div>
// // // // //                         }
// // // // //                     </div>
// // // // //                 </Col>
// // // // //                 <Col xs={24} lg={15}>
// // // // //                     <div style={{ background: C.surface, borderRadius: 14, padding: '20px', border: `1px solid ${C.border}`, height: '100%' }}>
// // // // //                         <SectionTitle extra={
// // // // //                             <Button size="small" type="link" onClick={() => goToTasks('all')} style={{ color: C.toDo, padding: 0 }}>
// // // // //                                 View all →
// // // // //                             </Button>
// // // // //                         }>
// // // // //                             Upcoming &amp; Recent Tasks
// // // // //                         </SectionTitle>
// // // // //                         <Table
// // // // //                             dataSource={upcomingTasks}
// // // // //                             columns={upcomingCols}
// // // // //                             rowKey="id"
// // // // //                             size="small"
// // // // //                             pagination={false}
// // // // //                             loading={loading}
// // // // //                             scroll={{ x: 'max-content' }}
// // // // //                             onRow={r => ({ onClick: () => goToTasks(r.status), style: { cursor: 'pointer' } })}
// // // // //                             locale={{ emptyText: <div style={{ padding: 32, color: C.muted }}>No tasks found 🎉</div> }}
// // // // //                         />
// // // // //                     </div>
// // // // //                 </Col>
// // // // //             </Row>

// // // // //             {/* ── Row 2: Time Spent — chart + full table side by side ── */}
// // // // //             <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
// // // // //                 <Col xs={24}>
// // // // //                     <div style={{ background: C.surface, borderRadius: 14, padding: '20px', border: `1px solid ${C.border}` }}>
// // // // //                         <SectionTitle
// // // // //                             extra={
// // // // //                                 <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
// // // // //                                     <Text style={{ fontSize: 13, color: C.muted }}>
// // // // //                                         Total: <strong style={{ color: C.toDo }}>{formatDurationFromMillis(totalTime)}</strong>
// // // // //                                     </Text>
// // // // //                                     <Segmented
// // // // //                                         size="small"
// // // // //                                         options={['By Client', 'By Group']}
// // // // //                                         value={tableView === 'client' ? 'By Client' : 'By Group'}
// // // // //                                         onChange={v => setTableView(v === 'By Client' ? 'client' : 'group')}
// // // // //                                     />
// // // // //                                 </div>
// // // // //                             }
// // // // //                         >
// // // // //                             Total Time Spent
// // // // //                         </SectionTitle>

// // // // //                         {tableView === 'client' ? (
// // // // //                             timePerClientData.length > 0 ? (
// // // // //                                 <Row gutter={[16, 16]}>
// // // // //                                     {/* Bar chart — top 10 */}
// // // // //                                     <Col xs={24} xl={12}>
// // // // //                                         <Text style={{ fontSize: 12, color: C.muted, display: 'block', marginBottom: 8 }}>
// // // // //                                             Top {topClients.length} clients by time logged
// // // // //                                         </Text>
// // // // //                                         <EChartsReact
// // // // //                                             option={barOption(topClients.map(r => ({ name: r.client_name, fullName: r.client_name, ms: r.total_hours })))}
// // // // //                                             style={{ height: 280 }}
// // // // //                                         />
// // // // //                                     </Col>
// // // // //                                     {/* Full table — all clients */}
// // // // //                                     <Col xs={24} xl={12}>
// // // // //                                         <Table
// // // // //                                             dataSource={timePerClientData}
// // // // //                                             rowKey="client_id"
// // // // //                                             size="small"
// // // // //                                             columns={clientTableCols}
// // // // //                                             pagination={{ pageSize: 8, size: 'small', showSizeChanger: false }}
// // // // //                                             scroll={{ x: 'max-content' }}
// // // // //                                             onRow={r => ({ onClick: () => handleClientClick(r.client_id), style: { cursor: 'pointer' } })}
// // // // //                                             summary={() => (
// // // // //                                                 <Table.Summary.Row style={{ background: '#f8fafc' }}>
// // // // //                                                     <Table.Summary.Cell index={0} colSpan={4}>
// // // // //                                                         <Text strong style={{ fontSize: 12 }}>Grand Total</Text>
// // // // //                                                     </Table.Summary.Cell>
// // // // //                                                     <Table.Summary.Cell index={1} align="right">
// // // // //                                                         <Text strong style={{ fontSize: 12, color: C.toDo }}>
// // // // //                                                             {formatDurationFromMillis(totalTime)}
// // // // //                                                         </Text>
// // // // //                                                     </Table.Summary.Cell>
// // // // //                                                 </Table.Summary.Row>
// // // // //                                             )}
// // // // //                                         />
// // // // //                                     </Col>
// // // // //                                 </Row>
// // // // //                             ) : (
// // // // //                                 <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.muted }}>
// // // // //                                     {loading ? <Spin /> : 'No time entries recorded'}
// // // // //                                 </div>
// // // // //                             )
// // // // //                         ) : (
// // // // //                             timePerGroup.length > 0 ? (
// // // // //                                 <Row gutter={[16, 16]}>
// // // // //                                     <Col xs={24} xl={12}>
// // // // //                                         <Text style={{ fontSize: 12, color: C.muted, display: 'block', marginBottom: 8 }}>
// // // // //                                             Top {topGroups.length} groups by time logged
// // // // //                                         </Text>
// // // // //                                         <EChartsReact
// // // // //                                             option={barOption(topGroups.map(r => ({ name: r.client_group_name, fullName: r.client_group_name, ms: r.total_hours })))}
// // // // //                                             style={{ height: 280 }}
// // // // //                                         />
// // // // //                                     </Col>
// // // // //                                     <Col xs={24} xl={12}>
// // // // //                                         <Table
// // // // //                                             dataSource={timePerGroup}
// // // // //                                             rowKey="client_group_name"
// // // // //                                             size="small"
// // // // //                                             columns={groupTableCols}
// // // // //                                             pagination={{ pageSize: 8, size: 'small', showSizeChanger: false }}
// // // // //                                             scroll={{ x: 'max-content' }}
// // // // //                                             summary={() => (
// // // // //                                                 <Table.Summary.Row style={{ background: '#f8fafc' }}>
// // // // //                                                     <Table.Summary.Cell index={0} colSpan={3}>
// // // // //                                                         <Text strong style={{ fontSize: 12 }}>Grand Total</Text>
// // // // //                                                     </Table.Summary.Cell>
// // // // //                                                     <Table.Summary.Cell index={1} align="right">
// // // // //                                                         <Text strong style={{ fontSize: 12, color: C.toDo }}>
// // // // //                                                             {formatDurationFromMillis(timePerGroup.reduce((s, r) => s + r.total_hours, 0))}
// // // // //                                                         </Text>
// // // // //                                                     </Table.Summary.Cell>
// // // // //                                                 </Table.Summary.Row>
// // // // //                                             )}
// // // // //                                         />
// // // // //                                     </Col>
// // // // //                                 </Row>
// // // // //                             ) : (
// // // // //                                 <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.muted }}>
// // // // //                                     {loading ? <Spin /> : 'No time entries recorded'}
// // // // //                                 </div>
// // // // //                             )
// // // // //                         )}
// // // // //                     </div>
// // // // //                 </Col>
// // // // //             </Row>

// // // // //             {/* ── Client Detail Modal ── */}
// // // // //             <Modal
// // // // //                 open={clientModalVisible}
// // // // //                 onCancel={() => setClientModalVisible(false)}
// // // // //                 footer={null}
// // // // //                 width={900}
// // // // //                 styles={{ body: { padding: '24px', background: C.bg } }}
// // // // //                 title={
// // // // //                     <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
// // // // //                         <div style={{ width: 38, height: 38, borderRadius: 10, background: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.toDo, fontWeight: 800, fontSize: 16 }}>
// // // // //                             {(selectedClientInfo?.name || 'C')[0]}
// // // // //                         </div>
// // // // //                         <div>
// // // // //                             <div style={{ fontWeight: 700, color: C.text, fontSize: 15 }}>{selectedClientInfo?.name || 'Client'}</div>
// // // // //                             <div style={{ fontSize: 12, color: C.muted }}>
// // // // //                                 {getGroupName(selectedClientInfo)} · {getSpocName(selectedClientInfo)}
// // // // //                             </div>
// // // // //                         </div>
// // // // //                     </div>
// // // // //                 }
// // // // //             >
// // // // //                 {clientModalLoading ? (
// // // // //                     <div style={{ textAlign: 'center', padding: 60 }}><Spin size="large" /></div>
// // // // //                 ) : clientSummary ? (
// // // // //                     <>
// // // // //                         {/* Mini KPIs */}
// // // // //                         <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
// // // // //                             {[
// // // // //                                 { label: 'Done Tasks',  value: clientSummary.done_count,                               color: C.done,       bg: '#d1fae5', isText: false },
// // // // //                                 { label: 'Total Time',  value: formatDurationFromMillis(clientSummary.total_hours_ms),  color: C.toDo,       bg: '#ede9fe', isText: true  },
// // // // //                                 { label: 'Employees',   value: clientSummary.employees?.length || 0,                   color: C.inProgress, bg: '#fef3c7', isText: false },
// // // // //                                 { label: 'Services',    value: clientSummary.sub_services?.length || 0,                color: '#0ea5e9',    bg: '#e0f2fe', isText: false },
// // // // //                             ].map(({ label, value, color, bg, isText }) => (
// // // // //                                 <Col span={6} key={label}>
// // // // //                                     <div style={{ background: bg, borderRadius: 12, padding: '14px 16px', textAlign: 'center' }}>
// // // // //                                         {isText
// // // // //                                             ? <div style={{ fontSize: 20, fontWeight: 800, color, lineHeight: 1.1 }}>{value}</div>
// // // // //                                             : <CountUp end={value} duration={1.2} style={{ fontSize: 28, fontWeight: 800, color, lineHeight: 1 }} />
// // // // //                                         }
// // // // //                                         <div style={{ fontSize: 11, color: C.muted, marginTop: 4, fontWeight: 600 }}>{label}</div>
// // // // //                                     </div>
// // // // //                                 </Col>
// // // // //                             ))}
// // // // //                         </Row>

// // // // //                         {/* Employee Hours + Service Breakdown charts — full height */}
// // // // //                         <Row gutter={[12, 12]}>
// // // // //                             {clientSummary.employees?.length > 0 && (
// // // // //                                 <Col xs={24} md={clientSummary.sub_services?.length > 0 ? 12 : 24}>
// // // // //                                     <div style={{ background: C.surface, borderRadius: 12, padding: 16, border: `1px solid ${C.border}` }}>
// // // // //                                         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
// // // // //                                             <Text style={{ fontWeight: 700, fontSize: 13 }}>Employee Hours</Text>
// // // // //                                             <Text style={{ fontSize: 11, color: C.muted }}>Click a bar to see services</Text>
// // // // //                                         </div>
// // // // //                                         <EChartsReact
// // // // //                                             option={hBarOption(clientSummary.employees, '#818cf8', '#6366f1')}
// // // // //                                             style={{ height: Math.max(140, clientSummary.employees.length * 32 + 20) }}
// // // // //                                             onEvents={{
// // // // //                                                 click: (params) => {
// // // // //                                                     // hBarOption reverses data; reversed[dataIndex] = original[last-dataIndex]
// // // // //                                                     const reversed = [...clientSummary.employees].reverse();
// // // // //                                                     const emp = reversed[params.dataIndex];
// // // // //                                                     if (!emp) return;
// // // // //                                                     const services = clientSummary.per_employee_services?.[emp.name] || [];
// // // // //                                                     setDrillTitle(`Services worked on by ${emp.name}`);
// // // // //                                                     setDrillData(services);
// // // // //                                                     setDrillType('employee');
// // // // //                                                     setDrillVisible(true);
// // // // //                                                 },
// // // // //                                             }}
// // // // //                                         />
// // // // //                                     </div>
// // // // //                                 </Col>
// // // // //                             )}
// // // // //                             {clientSummary.sub_services?.length > 0 && (
// // // // //                                 <Col xs={24} md={clientSummary.employees?.length > 0 ? 12 : 24}>
// // // // //                                     <div style={{ background: C.surface, borderRadius: 12, padding: 16, border: `1px solid ${C.border}` }}>
// // // // //                                         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
// // // // //                                             <Text style={{ fontWeight: 700, fontSize: 13 }}>Service Breakdown</Text>
// // // // //                                             <Text style={{ fontSize: 11, color: C.muted }}>Click a bar to see employees</Text>
// // // // //                                         </div>
// // // // //                                         <EChartsReact
// // // // //                                             option={hBarOption(clientSummary.sub_services, '#06b6d4', '#0ea5e9')}
// // // // //                                             style={{ height: Math.max(140, clientSummary.sub_services.length * 32 + 20) }}
// // // // //                                             onEvents={{
// // // // //                                                 click: (params) => {
// // // // //                                                     const reversed = [...clientSummary.sub_services].reverse();
// // // // //                                                     const svc = reversed[params.dataIndex];
// // // // //                                                     if (!svc) return;
// // // // //                                                     const employees = clientSummary.per_service_employees?.[svc.name] || [];
// // // // //                                                     setDrillTitle(`Employees on "${svc.name}"`);
// // // // //                                                     setDrillData(employees);
// // // // //                                                     setDrillType('service');
// // // // //                                                     setDrillVisible(true);
// // // // //                                                 },
// // // // //                                             }}
// // // // //                                         />
// // // // //                                     </div>
// // // // //                                 </Col>
// // // // //                             )}
// // // // //                         </Row>
// // // // //                     </>
// // // // //                 ) : (
// // // // //                     <div style={{ textAlign: 'center', padding: 40, color: C.muted }}>No data available</div>
// // // // //                 )}
// // // // //             </Modal>

// // // // //             {/* ── Drill-down Modal (employee → services  /  service → employees) ── */}
// // // // //             <Modal
// // // // //                 open={drillVisible}
// // // // //                 onCancel={() => setDrillVisible(false)}
// // // // //                 footer={null}
// // // // //                 width={520}
// // // // //                 title={
// // // // //                     <div style={{ fontWeight: 700, color: C.text, fontSize: 14 }}>
// // // // //                         {drillType === 'employee' ? '🛠 ' : '👤 '}{drillTitle}
// // // // //                     </div>
// // // // //                 }
// // // // //                 styles={{ body: { padding: '20px 24px', background: C.bg } }}
// // // // //             >
// // // // //                 {drillData.length === 0 ? (
// // // // //                     <div style={{ textAlign: 'center', padding: 32, color: C.muted, fontSize: 13 }}>
// // // // //                         No breakdown data available
// // // // //                     </div>
// // // // //                 ) : (
// // // // //                     <>
// // // // //                         <EChartsReact
// // // // //                             option={hBarOption(drillData)}
// // // // //                             style={{ height: Math.max(120, drillData.length * 30 + 30) }}
// // // // //                         />
// // // // //                         <Table
// // // // //                             size="small"
// // // // //                             style={{ marginTop: 16, borderRadius: 10, overflow: 'hidden', border: `1px solid ${C.border}` }}
// // // // //                             dataSource={[...drillData]
// // // // //                                 .sort((a, b) => b.ms - a.ms)
// // // // //                                 .map((d, i) => ({ key: i, name: d.name, time: formatDurationFromMillis(d.ms), ms: d.ms }))
// // // // //                             }
// // // // //                             columns={[
// // // // //                                 { title: '#', render: (_, __, i) => <Text style={{ color: C.muted, fontSize: 12 }}>{i + 1}</Text>, width: 40 },
// // // // //                                 {
// // // // //                                     title: drillType === 'employee' ? 'Service' : 'Employee',
// // // // //                                     dataIndex: 'name',
// // // // //                                     render: v => <Text style={{ fontSize: 13 }}>{v}</Text>,
// // // // //                                 },
// // // // //                                 {
// // // // //                                     title: 'Time Spent', dataIndex: 'time', align: 'right',
// // // // //                                     render: (v, r) => <Text style={{ fontWeight: 700, color: drillType === 'employee' ? '#0ea5e9' : C.toDo }}>{v}</Text>,
// // // // //                                     sorter: (a, b) => a.ms - b.ms,
// // // // //                                     defaultSortOrder: 'descend',
// // // // //                                 },
// // // // //                             ]}
// // // // //                             pagination={false}
// // // // //                             bordered={false}
// // // // //                         />
// // // // //                     </>
// // // // //                 )}
// // // // //             </Modal>

// // // // //         </div>
// // // // //     );
// // // // // };

// // // // // export default TaskDashboard;

// // // // import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
// // // // import ReactDOM from 'react-dom';
// // // // import {
// // // //     Card, Col, Row, Typography, message, Table, DatePicker,
// // // //     Select, Space, Button, Segmented, Modal, Spin, Progress, Tooltip,
// // // // } from 'antd';
// // // // import { api } from '../../../services/api';
// // // // import EChartsReact from 'echarts-for-react';
// // // // import CountUp from 'react-countup';
// // // // import {
// // // //     ClockCircleOutlined, CheckCircleOutlined,
// // // //     MinusCircleOutlined, ExclamationCircleOutlined,
// // // //     FilterOutlined, ClearOutlined, ReloadOutlined,
// // // // } from '@ant-design/icons';
// // // // import { FcList } from 'react-icons/fc';
// // // // import moment from 'moment';
// // // // import { formatDurationFromMillis } from './STT_Records';
// // // // import { useNavigate } from 'react-router-dom';

// // // // const { Title, Text } = Typography;
// // // // const { RangePicker } = DatePicker;
// // // // const { Option } = Select;

// // // // /* ─── Design tokens ─────────────────────────────────────────── */
// // // // const C = {
// // // //     done:       '#10b981',
// // // //     inProgress: '#f59e0b',
// // // //     overdue:    '#ef4444',
// // // //     toDo:       '#6366f1',
// // // //     all:        '#0f172a',
// // // //     bg:         '#f1f5f9',
// // // //     surface:    '#ffffff',
// // // //     border:     '#e2e8f0',
// // // //     text:       '#0f172a',
// // // //     muted:      '#64748b',
// // // // };

// // // // const STATUS_META = {
// // // //     'Done':        { color: C.done,       light: '#d1fae5' },
// // // //     'In Progress': { color: C.inProgress, light: '#fef3c7' },
// // // //     'Over Due':    { color: C.overdue,    light: '#fee2e2' },
// // // //     'To Do':       { color: C.toDo,       light: '#ede9fe' },
// // // // };

// // // // /* ─── Stat Card ─────────────────────────────────────────────── */
// // // // const StatCard = ({ title, value, color, lightColor, icon, subtitle, onClick, loading }) => (
// // // //     <div
// // // //         onClick={onClick}
// // // //         style={{
// // // //             background: C.surface, borderRadius: 16, padding: '20px 22px',
// // // //             cursor: 'pointer', border: `1px solid ${C.border}`,
// // // //             borderTop: `4px solid ${color}`,
// // // //             transition: 'all 0.2s', flex: 1, minWidth: 0,
// // // //             boxShadow: '0 1px 4px rgba(0,0,0,0.06)', position: 'relative', overflow: 'hidden',
// // // //         }}
// // // //         onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = `0 10px 28px ${color}28`; }}
// // // //         onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)'; }}
// // // //     >
// // // //         <div style={{ position: 'absolute', right: 18, top: 18, width: 44, height: 44, borderRadius: 12, background: lightColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color }}>
// // // //             {icon}
// // // //         </div>
// // // //         <Text style={{ fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: '0.07em', textTransform: 'uppercase' }}>
// // // //             {title}
// // // //         </Text>
// // // //         <div style={{ marginTop: 8 }}>
// // // //             {loading
// // // //                 ? <div style={{ fontSize: 28, fontWeight: 700, color: C.muted }}>—</div>
// // // //                 : <CountUp end={value} duration={1.6} style={{ fontSize: 34, fontWeight: 800, color, lineHeight: 1 }} />
// // // //             }
// // // //         </div>
// // // //         {subtitle && <Text style={{ fontSize: 11, color: C.muted, marginTop: 6, display: 'block' }}>{subtitle}</Text>}
// // // //     </div>
// // // // );

// // // // /* ─── Section header ────────────────────────────────────────── */
// // // // const SectionTitle = ({ children, extra }) => (
// // // //     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
// // // //         <Text style={{ fontSize: 14, fontWeight: 700, color: C.text, letterSpacing: '-0.01em' }}>{children}</Text>
// // // //         {extra}
// // // //     </div>
// // // // );

// // // // /* ─── Status Badge ──────────────────────────────────────────── */
// // // // const StatusBadge = ({ status }) => {
// // // //     const meta = STATUS_META[status] || { color: C.muted, light: '#f1f5f9' };
// // // //     return (
// // // //         <span style={{
// // // //             background: meta.light, color: meta.color,
// // // //             borderRadius: 20, padding: '2px 10px',
// // // //             fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap',
// // // //         }}>
// // // //             {status}
// // // //         </span>
// // // //     );
// // // // };

// // // // /* ─── Chart helpers ─────────────────────────────────────────── */
// // // // const pieOption = (data) => ({
// // // //     backgroundColor: 'transparent',
// // // //     tooltip: {
// // // //         trigger: 'item',
// // // //         formatter: '{b}: <b>{c}</b> ({d}%)',
// // // //         backgroundColor: '#1e293b', borderColor: 'transparent',
// // // //         textStyle: { color: '#f1f5f9', fontSize: 13 },
// // // //     },
// // // //     legend: {
// // // //         orient: 'horizontal', bottom: 0, left: 'center',
// // // //         textStyle: { color: C.muted, fontSize: 12 },
// // // //         itemWidth: 10, itemHeight: 10,
// // // //     },
// // // //     series: [{
// // // //         type: 'pie', radius: ['42%', '70%'], center: ['50%', '44%'],
// // // //         avoidLabelOverlap: true,
// // // //         itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
// // // //         label: { show: true, formatter: '{b}\n{c}', fontSize: 11, color: C.muted, lineHeight: 16 },
// // // //         labelLine: { length: 10, length2: 6 },
// // // //         data: data.map(d => ({ ...d, itemStyle: { color: STATUS_META[d.name]?.color || '#94a3b8' } })),
// // // //         emphasis: { itemStyle: { shadowBlur: 12, shadowColor: 'rgba(0,0,0,0.15)' } },
// // // //     }],
// // // // });

// // // // const barOption = (data) => ({
// // // //     backgroundColor: 'transparent',
// // // //     tooltip: {
// // // //         trigger: 'axis', axisPointer: { type: 'shadow' },
// // // //         backgroundColor: '#1e293b', borderColor: 'transparent',
// // // //         textStyle: { color: '#f1f5f9', fontSize: 12 },
// // // //         formatter: (params) => {
// // // //             const p = params[0];
// // // //             const orig = data[p.dataIndex];
// // // //             return `<b>${orig?.fullName || p.name}</b><br/>${formatDurationFromMillis(p.value)}`;
// // // //         },
// // // //     },
// // // //     grid: { top: 16, right: 16, bottom: 48, left: 16, containLabel: true },
// // // //     xAxis: {
// // // //         type: 'category',
// // // //         data: data.map(d => d.name.length > 13 ? d.name.slice(0, 12) + '…' : d.name),
// // // //         axisLabel: { color: C.muted, fontSize: 11, rotate: data.length > 5 ? 30 : 0, interval: 0 },
// // // //         axisLine: { lineStyle: { color: C.border } },
// // // //         axisTick: { show: false },
// // // //     },
// // // //     yAxis: {
// // // //         type: 'value',
// // // //         axisLabel: { color: C.muted, fontSize: 10, formatter: v => formatDurationFromMillis(v) },
// // // //         splitLine: { lineStyle: { color: C.border, type: 'dashed' } },
// // // //         axisLine: { show: false }, axisTick: { show: false },
// // // //     },
// // // //     series: [{
// // // //         type: 'bar',
// // // //         data: data.map(d => ({
// // // //             value: d.ms,
// // // //             itemStyle: {
// // // //                 color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: '#6366f1' }, { offset: 1, color: '#818cf8' }] },
// // // //                 borderRadius: [6, 6, 0, 0],
// // // //             },
// // // //         })),
// // // //         barMaxWidth: 48,
// // // //         emphasis: {
// // // //             itemStyle: {
// // // //                 color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: '#4f46e5' }, { offset: 1, color: '#6366f1' }] },
// // // //             },
// // // //         },
// // // //     }],
// // // // });

// // // // const hBarOption = (data, colorStart = '#06b6d4', colorEnd = '#0ea5e9') => {
// // // //     // ECharts renders category axis bottom-up, so reverse to show highest at top
// // // //     const reversed = [...data].reverse();
// // // //     return {
// // // //     backgroundColor: 'transparent',
// // // //     tooltip: {
// // // //         trigger: 'axis', axisPointer: { type: 'shadow' },
// // // //         backgroundColor: '#1e293b', borderColor: 'transparent',
// // // //         textStyle: { color: '#f1f5f9', fontSize: 12 },
// // // //         formatter: (params) => `<b>${params[0].name}</b><br/>${formatDurationFromMillis(params[0].value)}`,
// // // //     },
// // // //     grid: { top: 4, right: 96, bottom: 4, left: 8, containLabel: true },
// // // //     xAxis: {
// // // //         type: 'value',
// // // //         show: false,
// // // //         splitLine: { show: false },
// // // //     },
// // // //     yAxis: {
// // // //         type: 'category',
// // // //         data: reversed.map(d => d.name?.length > 18 ? d.name.slice(0, 17) + '…' : d.name || 'N/A'),
// // // //         axisLabel: { color: C.muted, fontSize: 11 },
// // // //         axisLine: { show: false }, axisTick: { show: false },
// // // //     },
// // // //     series: [{
// // // //         type: 'bar',
// // // //         data: reversed.map(d => ({
// // // //             value: d.ms || 0,
// // // //             itemStyle: {
// // // //                 color: { type: 'linear', x: 0, y: 0, x2: 1, y2: 0, colorStops: [{ offset: 0, color: colorStart }, { offset: 1, color: colorEnd }] },
// // // //                 borderRadius: [0, 6, 6, 0],
// // // //             },
// // // //         })),
// // // //         barMaxWidth: 18,
// // // //         label: {
// // // //             show: true, position: 'right',
// // // //             formatter: p => formatDurationFromMillis(p.value),
// // // //             color: C.muted, fontSize: 10,
// // // //         },
// // // //     }],
// // // //     };
// // // // };

// // // // /* ══════════════ MAIN COMPONENT ══════════════ */
// // // // const TaskDashboard = () => {
// // // //     const navigate = useNavigate();

// // // //     const [loading,             setLoading]             = useState(true);
// // // //     const [dashboardData,       setDashboardData]       = useState(null);
// // // //     const [error,               setError]               = useState(null);
// // // //     const [dateRange,           setDateRange]           = useState(null);
// // // //     const [clients,             setClients]             = useState([]);
// // // //     const [selectedClient,      setSelectedClient]      = useState([]);
// // // //     const [teams,               setTeams]               = useState([]);
// // // //     const [selectedTeam,        setSelectedTeam]        = useState([]);
// // // //     const [clientGroups,        setClientGroups]        = useState([]);
// // // //     const [selectedClientGroup, setSelectedClientGroup] = useState([]);
// // // //     const [allSpocs,            setAllSpocs]            = useState([]);
// // // //     const [subServices,         setSubServices]         = useState([]);
// // // //     const [selectedSubService,  setSelectedSubService]  = useState([]);
// // // //     const [tableView,           setTableView]           = useState('client');
// // // //     const [taskCounts,          setTaskCounts]          = useState({ allTasks: 0, done: 0, toDo: 0, overdue: 0, inProgress: 0 });
// // // //     const [filtersOpen,         setFiltersOpen]         = useState(false);
// // // //     const [timePerClientData,   setTimePerClientData]   = useState([]);

// // // //     // Client modal
// // // //     const [clientModalVisible,  setClientModalVisible]  = useState(false);
// // // //     const [clientModalLoading,  setClientModalLoading]  = useState(false);
// // // //     const [selectedClientInfo,  setSelectedClientInfo]  = useState(null);
// // // //     const [clientSummary,       setClientSummary]       = useState(null);

// // // //     // Drill-down modal (employee → services  /  service → employees)
// // // //     const [drillVisible,        setDrillVisible]        = useState(false);
// // // //     const [drillTitle,          setDrillTitle]          = useState('');
// // // //     const [drillData,           setDrillData]           = useState([]);  // [{name, ms}]
// // // //     const [drillType,           setDrillType]           = useState('');  // 'employee' | 'service'

// // // //     // Ref to track if component is still mounted (avoids state-on-unmount warnings)
// // // //     const mountedRef = useRef(true);
// // // //     useEffect(() => { mountedRef.current = true; return () => { mountedRef.current = false; }; }, []);

// // // //     // ── Refs for stable lookup functions that don't re-trigger effects ──────
// // // //     const clientGroupsRef = useRef([]);
// // // //     const allSpocsRef     = useRef([]);
// // // //     useEffect(() => { clientGroupsRef.current = clientGroups; }, [clientGroups]);
// // // //     useEffect(() => { allSpocsRef.current = allSpocs; }, [allSpocs]);

// // // //     const getSpocName = useCallback((client) => {
// // // //         if (!client) return 'N/A';
// // // //         if (client.primary_spoc_name) return client.primary_spoc_name;
// // // //         const groups = clientGroupsRef.current;
// // // //         const group = groups.find(g => g.clients?.some(cg => (typeof cg === 'object' ? cg.id : cg) === client.id));
// // // //         if (group?.primary_spoc_name) return group.primary_spoc_name;
// // // //         if (typeof client.primary_spoc === 'number') {
// // // //             const spoc = allSpocsRef.current.find(s => s.id === client.primary_spoc);
// // // //             if (spoc) return `${spoc.first_name || ''} ${spoc.last_name || ''}`.trim() || spoc.user?.email || 'N/A';
// // // //         }
// // // //         return 'N/A';
// // // //     }, []); // stable — reads from refs

// // // //     const getGroupName = useCallback((client) => {
// // // //         if (!client) return 'N/A';
// // // //         const groups = clientGroupsRef.current;
// // // //         const group = groups.find(g => g.clients?.some(cg => (typeof cg === 'object' ? cg.id : cg) === client.id));
// // // //         return group?.group_name || 'N/A';
// // // //     }, []); // stable

// // // //     /* ── Build params ── */
// // // //     const buildParams = (filters = {}) => {
// // // //         const p = {
// // // //             start_date:      filters.startDate?.format('YYYY-MM-DD'),
// // // //             end_date:        filters.endDate?.format('YYYY-MM-DD'),
// // // //             client_id:       filters.clientId?.length      ? filters.clientId.join(',')       : undefined,
// // // //             team_id:         filters.teamId?.length        ? filters.teamId.join(',')         : undefined,
// // // //             client_group_id: filters.clientGroupId?.length ? filters.clientGroupId.join(',') : undefined,
// // // //             sub_service_id:  filters.subServiceId?.length  ? filters.subServiceId.join(',')  : undefined,
// // // //         };
// // // //         Object.keys(p).forEach(k => p[k] === undefined && delete p[k]);
// // // //         return p;
// // // //     };

// // // //     /* ── Core fetch functions (stable — no deps that change) ── */
// // // //     const fetchDashboard = useCallback(async (params) => {
// // // //         if (!mountedRef.current) return;
// // // //         setLoading(true);
// // // //         try {
// // // //             const res = await api.get('/clients/tasks/dashboard_summary/', { params });
// // // //             if (mountedRef.current) setDashboardData(res.data);
// // // //         } catch (err) {
// // // //             console.error(err);
// // // //             if (mountedRef.current) {
// // // //                 setError('Failed to load dashboard data.');
// // // //                 message.error('Failed to load dashboard.');
// // // //             }
// // // //         } finally {
// // // //             if (mountedRef.current) setLoading(false);
// // // //         }
// // // //     }, []); // no deps — intentionally stable

// // // //     const fetchTimePerClient = useCallback(async (params, clientsList) => {
// // // //         if (!mountedRef.current) return;
// // // //         try {
// // // //             const res = await api.get('/clients/tasks/time_per_client/', { params });
// // // //             if (!mountedRef.current) return;
// // // //             setTimePerClientData((res.data || []).map(row => {
// // // //                 const c = (clientsList || []).find(x => x.id === row.client_id);
// // // //                 return {
// // // //                     ...row,
// // // //                     total_hours: row.total_hours_ms,
// // // //                     group_name:  c ? getGroupName(c)  : 'N/A',
// // // //                     spoc_name:   c ? getSpocName(c)   : 'N/A',
// // // //                 };
// // // //             }));
// // // //         } catch (err) {
// // // //             console.error('fetchTimePerClient error:', err);
// // // //         }
// // // //     }, [getGroupName, getSpocName]); // stable — getGroupName/getSpocName are stable

// // // //     /* ── Initial load — runs ONCE ── */
// // // //     const didInit = useRef(false);
// // // //     useEffect(() => {
// // // //         if (didInit.current) return;
// // // //         didInit.current = true;

// // // //         (async () => {
// // // //             setLoading(true);
// // // //             try {
// // // //                 const [cR, tR, gR, sR, ssR] = await Promise.all([
// // // //                     api.get('/clients/clients/?page_size=500'),
// // // //                     api.get('/employee/teams/'),
// // // //                     api.get('/clients/client-groups/'),
// // // //                     api.get('/employee/employees/'),
// // // //                     api.get('/clients/subservices/'),
// // // //                 ]);
// // // //                 if (!mountedRef.current) return;
// // // //                 const cl = cR.data.results || cR.data;
// // // //                 const gr = gR.data.results || gR.data;
// // // //                 const sp = sR.data.results || sR.data;
// // // //                 setClients(cl);
// // // //                 setTeams(tR.data.results || tR.data);
// // // //                 setClientGroups(gr);
// // // //                 setAllSpocs(sp);
// // // //                 setSubServices(ssR.data.results || ssR.data);
// // // //                 // Set refs immediately so enrichment in fetchTimePerClient works
// // // //                 clientGroupsRef.current = gr;
// // // //                 allSpocsRef.current     = sp;
// // // //                 await Promise.all([
// // // //                     fetchDashboard({}),
// // // //                     fetchTimePerClient({}, cl),
// // // //                 ]);
// // // //             } catch (err) {
// // // //                 console.error('fetchInitialData error:', err);
// // // //                 if (mountedRef.current) setError('Failed to load initial data.');
// // // //             } finally {
// // // //                 if (mountedRef.current) setLoading(false);
// // // //             }
// // // //         })();
// // // //     }, [fetchDashboard, fetchTimePerClient]);

// // // //     /* ── Re-fetch ONLY when user changes filters ── */
// // // //     const isFirstRender = useRef(true);
// // // //     useEffect(() => {
// // // //         if (isFirstRender.current) { isFirstRender.current = false; return; }
// // // //         const [startDate, endDate] = dateRange || [null, null];
// // // //         const f = { startDate, endDate, clientId: selectedClient, teamId: selectedTeam, clientGroupId: selectedClientGroup, subServiceId: selectedSubService };
// // // //         const p = buildParams(f);
// // // //         fetchDashboard(p);
// // // //         fetchTimePerClient(p, clients);
// // // //         // eslint-disable-next-line react-hooks/exhaustive-deps
// // // //     }, [dateRange, selectedClient, selectedTeam, selectedClientGroup, selectedSubService]);

// // // //     /* ── Derive counts ── */
// // // //     useEffect(() => {
// // // //         if (!dashboardData?.status_counts) return;
// // // //         const sc = dashboardData.status_counts;
// // // //         setTaskCounts({
// // // //             allTasks:   (sc['To Do'] || 0) + (sc['In Progress'] || 0) + (sc['Done'] || 0) + (sc['Over Due'] || 0),
// // // //             done:       sc['Done']        || 0,
// // // //             toDo:       sc['To Do']       || 0,
// // // //             inProgress: sc['In Progress'] || 0,
// // // //             overdue:    sc['Over Due']    || 0,
// // // //         });
// // // //     }, [dashboardData]);

// // // //     /* ── Derived data ── */
// // // //     const timePerGroup = useMemo(() =>
// // // //         timePerClientData.reduce((acc, row) => {
// // // //             if (!row.group_name || row.group_name === 'N/A') return acc;
// // // //             const ex = acc.find(g => g.client_group_name === row.group_name);
// // // //             if (ex) ex.total_hours += row.total_hours;
// // // //             else acc.push({ client_group_name: row.group_name, spoc_name: row.spoc_name, total_hours: row.total_hours });
// // // //             return acc;
// // // //         }, [])
// // // //     , [timePerClientData]);

// // // //     const pieData = useMemo(() =>
// // // //         dashboardData?.status_counts
// // // //             ? Object.entries(dashboardData.status_counts).filter(([k, v]) => k !== 'total' && v > 0).map(([name, value]) => ({ name, value }))
// // // //             : []
// // // //     , [dashboardData]);

// // // //     const topClients = useMemo(() => [...timePerClientData].sort((a, b) => b.total_hours - a.total_hours).slice(0, 10), [timePerClientData]);
// // // //     const topGroups  = useMemo(() => [...timePerGroup].sort((a, b) => b.total_hours - a.total_hours).slice(0, 10), [timePerGroup]);

// // // //     const totalTime       = useMemo(() => timePerClientData.reduce((s, r) => s + (r.total_hours || 0), 0), [timePerClientData]);
// // // //     const completionRate  = taskCounts.allTasks ? Math.round((taskCounts.done / taskCounts.allTasks) * 100) : 0;
// // // //     const activeFilterCount = [selectedClient, selectedTeam, selectedClientGroup, selectedSubService].filter(a => a.length).length + (dateRange ? 1 : 0);

// // // //     /* ── Clear filters ── */
// // // //     const handleClearFilters = () => {
// // // //         setDateRange(null);
// // // //         setSelectedClient([]);
// // // //         setSelectedTeam([]);
// // // //         setSelectedClientGroup([]);
// // // //         setSelectedSubService([]);
// // // //     };

// // // //     /* ── Navigate with filters ── */
// // // //     const goToTasks = (status) => {
// // // //         const params = new URLSearchParams();
// // // //         if (status !== 'all') params.set('status', status);
// // // //         const [s, e] = dateRange || [null, null];
// // // //         if (s) params.set('start_date', s.format('YYYY-MM-DD'));
// // // //         if (e) params.set('end_date',   e.format('YYYY-MM-DD'));
// // // //         if (selectedClient?.length)      params.set('client_id',      selectedClient.join(','));
// // // //         if (selectedTeam?.length)        params.set('team_id',         selectedTeam.join(','));
// // // //         if (selectedClientGroup?.length) params.set('client_group_id', selectedClientGroup.join(','));
// // // //         if (selectedSubService?.length)  params.set('sub_service_id',  selectedSubService.join(','));
// // // //         navigate(`/stt-records?${params.toString()}`);
// // // //     };

// // // //     /* ── Client modal ── */
// // // //     const handleClientClick = useCallback(async (clientId) => {
// // // //         const client = clients.find(c => c.id === clientId);
// // // //         setSelectedClientInfo(client);
// // // //         setClientSummary(null);
// // // //         setDrillVisible(false);   // reset any open drill panel
// // // //         setDrillData([]);
// // // //         setClientModalVisible(true);
// // // //         setClientModalLoading(true);
// // // //         try {
// // // //             const [startDate, endDate] = dateRange || [null, null];
// // // //             const params = { client_id: clientId };
// // // //             if (startDate) params.start_date = startDate.format('YYYY-MM-DD');
// // // //             if (endDate)   params.end_date   = endDate.format('YYYY-MM-DD');
// // // //             const res = await api.get('/clients/tasks/client_task_summary/', { params });
// // // //             if (mountedRef.current) setClientSummary(res.data);
// // // //         } catch (err) {
// // // //             console.error(err);
// // // //             message.error('Failed to load client details');
// // // //         } finally {
// // // //             if (mountedRef.current) setClientModalLoading(false);
// // // //         }
// // // //     }, [clients, dateRange]);

// // // //     /* ── Refresh handler ── */
// // // //     const handleRefresh = useCallback(() => {
// // // //         const [startDate, endDate] = dateRange || [null, null];
// // // //         const f = { startDate, endDate, clientId: selectedClient, teamId: selectedTeam, clientGroupId: selectedClientGroup, subServiceId: selectedSubService };
// // // //         const p = buildParams(f);
// // // //         fetchDashboard(p);
// // // //         fetchTimePerClient(p, clients);
// // // //     }, [dateRange, selectedClient, selectedTeam, selectedClientGroup, selectedSubService, clients, fetchDashboard, fetchTimePerClient]);

// // // //     /* ── Upcoming tasks ── */
// // // //     const upcomingTasks = useMemo(() => (dashboardData?.tasks || []).slice(0, 8), [dashboardData]);
// // // //     const upcomingCols = [
// // // //         {
// // // //             title: 'Task ID', dataIndex: 'task_id', key: 'task_id', width: 140,
// // // //             render: v => <Text style={{ fontFamily: 'monospace', fontSize: 11, color: C.muted }}>{v}</Text>,
// // // //         },
// // // //         { title: 'Client', dataIndex: 'client_name', key: 'client_name', ellipsis: true },
// // // //         { title: 'Service', dataIndex: 'sub_service_name', key: 'sub_service_name', ellipsis: true },
// // // //         {
// // // //             title: 'Due', dataIndex: 'due_date', key: 'due_date', width: 100,
// // // //             render: d => {
// // // //                 if (!d) return <span style={{ color: C.muted }}>—</span>;
// // // //                 const m = moment(d);
// // // //                 const isLate = m.isBefore(moment(), 'day');
// // // //                 return <span style={{ color: isLate ? C.overdue : C.muted, fontWeight: isLate ? 600 : 400, fontSize: 12 }}>{m.format('DD MMM YY')}</span>;
// // // //             },
// // // //         },
// // // //         {
// // // //             title: 'Status', dataIndex: 'status', key: 'status', width: 120,
// // // //             render: (_, r) => {
// // // //                 const eff = r.due_date && moment(r.due_date).isBefore(moment(), 'day') && r.status !== 'Done' ? 'Over Due' : r.status;
// // // //                 return <StatusBadge status={eff} />;
// // // //             },
// // // //         },
// // // //     ];

// // // //     /* ── Table columns: client ── */
// // // //     const clientTableCols = [
// // // //         {
// // // //             title: '#', render: (_, __, i) => <Text style={{ color: C.muted, fontSize: 12 }}>{i + 1}</Text>, width: 44,
// // // //         },
// // // //         {
// // // //             title: 'Client', dataIndex: 'client_name', key: 'client_name',
// // // //             width: 180,
// // // //             render: v => (
// // // //                 <Tooltip title={v} placement="topLeft">
// // // //                     <Text style={{
// // // //                         fontWeight: 500, fontSize: 13,
// // // //                         maxWidth: 160, display: 'block',
// // // //                         overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
// // // //                     }}>
// // // //                         {v}
// // // //                     </Text>
// // // //                 </Tooltip>
// // // //             ),
// // // //             sorter: (a, b) => a.client_name.localeCompare(b.client_name),
// // // //         },
// // // //         {
// // // //             title: 'Group', dataIndex: 'group_name', key: 'group_name',
// // // //             width: 130,
// // // //             render: v => (
// // // //                 <Tooltip title={v} placement="topLeft">
// // // //                     <Text style={{ fontSize: 12, color: C.muted, maxWidth: 120, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
// // // //                         {v || '—'}
// // // //                     </Text>
// // // //                 </Tooltip>
// // // //             ),
// // // //         },
// // // //         {
// // // //             title: 'SPOC', dataIndex: 'spoc_name', key: 'spoc_name',
// // // //             width: 120,
// // // //             render: v => (
// // // //                 <Tooltip title={v} placement="topLeft">
// // // //                     <Text style={{ fontSize: 12, color: C.muted, maxWidth: 110, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
// // // //                         {v || '—'}
// // // //                     </Text>
// // // //                 </Tooltip>
// // // //             ),
// // // //         },
// // // //         {
// // // //             title: 'Time Spent', key: 'time', align: 'right', width: 110,
// // // //             render: (_, r) => <Text style={{ fontSize: 13, fontWeight: 700, color: C.toDo }}>{formatDurationFromMillis(r.total_hours)}</Text>,
// // // //             sorter: (a, b) => a.total_hours - b.total_hours,
// // // //             defaultSortOrder: 'descend',
// // // //         },
// // // //     ];

// // // //     /* ── Table columns: group ── */
// // // //     const groupTableCols = [
// // // //         { title: '#', render: (_, __, i) => <Text style={{ color: C.muted, fontSize: 12 }}>{i + 1}</Text>, width: 44 },
// // // //         {
// // // //             title: 'Client Group', dataIndex: 'client_group_name', key: 'client_group_name',
// // // //             render: v => <Text style={{ fontWeight: 500, fontSize: 13 }}>{v}</Text>,
// // // //             sorter: (a, b) => a.client_group_name.localeCompare(b.client_group_name),
// // // //         },
// // // //         {
// // // //             title: 'SPOC', dataIndex: 'spoc_name', key: 'spoc_name',
// // // //             render: v => <Text style={{ fontSize: 12, color: C.muted }}>{v || '—'}</Text>,
// // // //         },
// // // //         {
// // // //             title: 'Time Spent', key: 'time', align: 'right',
// // // //             render: (_, r) => <Text style={{ fontSize: 13, fontWeight: 700, color: C.toDo }}>{formatDurationFromMillis(r.total_hours)}</Text>,
// // // //             sorter: (a, b) => a.total_hours - b.total_hours,
// // // //             defaultSortOrder: 'descend',
// // // //         },
// // // //     ];

// // // //     /* ── Error state ── */
// // // //     if (error && !dashboardData) {
// // // //         return (
// // // //             <div style={{ padding: 60, textAlign: 'center', background: C.bg, minHeight: '100vh' }}>
// // // //                 <Text style={{ color: C.overdue, fontSize: 16 }}>{error}</Text><br />
// // // //                 <Button style={{ marginTop: 16 }} onClick={() => { didInit.current = false; }} icon={<ReloadOutlined />}>Retry</Button>
// // // //             </div>
// // // //         );
// // // //     }

// // // //     /* ══════════════ RENDER ══════════════ */
// // // //     return (
// // // //         <div style={{ background: C.bg, minHeight: '100vh', padding: '24px 28px', fontFamily: '"DM Sans", "Segoe UI", sans-serif' }}>

// // // //             {/* ── Header ── */}
// // // //             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
// // // //                 <div>
// // // //                     <Title level={3} style={{ margin: 0, color: C.text, fontWeight: 800, letterSpacing: '-0.03em' }}>
// // // //                         Task Analytics
// // // //                     </Title>
// // // //                     <Text style={{ color: C.muted, fontSize: 13 }}>
// // // //                         {moment().format('dddd, D MMMM YYYY')} · Real-time overview
// // // //                     </Text>
// // // //                 </div>
// // // //                 <Space>
// // // //                     <Button icon={<ReloadOutlined />} onClick={handleRefresh} loading={loading}>Refresh</Button>
// // // //                     <Button type="primary" onClick={() => navigate('/stt-records')} style={{ background: C.toDo, borderColor: C.toDo }}>
// // // //                         All Tasks →
// // // //                     </Button>
// // // //                 </Space>
// // // //             </div>

// // // //             {/* ── Filters ── */}
// // // //             <div style={{ background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`, marginBottom: 24, overflow: 'hidden' }}>
// // // //                 <div
// // // //                     onClick={() => setFiltersOpen(v => !v)}
// // // //                     style={{ padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', borderBottom: filtersOpen ? `1px solid ${C.border}` : 'none' }}
// // // //                 >
// // // //                     <Space>
// // // //                         <FilterOutlined style={{ color: C.toDo }} />
// // // //                         <Text style={{ fontWeight: 600, color: C.text }}>Filters</Text>
// // // //                         {activeFilterCount > 0 && (
// // // //                             <span style={{ background: C.toDo, color: '#fff', borderRadius: 20, padding: '1px 8px', fontSize: 11, fontWeight: 700 }}>
// // // //                                 {activeFilterCount} active
// // // //                             </span>
// // // //                         )}
// // // //                     </Space>
// // // //                     <Text style={{ color: C.muted, fontSize: 12 }}>{filtersOpen ? '▲ collapse' : '▼ expand'}</Text>
// // // //                 </div>
// // // //                 {filtersOpen && (
// // // //                     <div style={{ padding: '16px 20px' }}>
// // // //                         <Row gutter={[12, 12]}>
// // // //                             <Col xs={24} sm={12} md={8} lg={5}>
// // // //                                 <RangePicker style={{ width: '100%' }} value={dateRange} onChange={setDateRange} size="small" />
// // // //                             </Col>
// // // //                             {[
// // // //                                 { placeholder: 'Client Group', value: selectedClientGroup, onChange: setSelectedClientGroup, items: clientGroups, labelKey: 'group_name' },
// // // //                                 { placeholder: 'Client',       value: selectedClient,      onChange: setSelectedClient,      items: clients,       labelKey: 'name'       },
// // // //                                 { placeholder: 'Team',         value: selectedTeam,        onChange: setSelectedTeam,        items: teams,         labelKey: 'name'       },
// // // //                                 { placeholder: 'Sub Service',  value: selectedSubService,  onChange: setSelectedSubService,  items: subServices,   labelKey: 'name'       },
// // // //                             ].map(({ placeholder, value, onChange, items, labelKey }) => (
// // // //                                 <Col xs={24} sm={12} md={8} lg={4} key={placeholder}>
// // // //                                     <Select mode="multiple" placeholder={placeholder} allowClear showSearch value={value} onChange={onChange}
// // // //                                         style={{ width: '100%' }} size="small"
// // // //                                         filterOption={(inp, opt) => (opt?.children ?? '').toLowerCase().includes(inp.toLowerCase())}>
// // // //                                         {items.map(i => <Option key={i.id} value={i.id}>{i[labelKey]}</Option>)}
// // // //                                     </Select>
// // // //                                 </Col>
// // // //                             ))}
// // // //                             <Col xs={24} sm={12} md={4} lg={3}>
// // // //                                 <Button size="small" onClick={handleClearFilters} icon={<ClearOutlined />} block>Clear</Button>
// // // //                             </Col>
// // // //                         </Row>
// // // //                     </div>
// // // //                 )}
// // // //             </div>

// // // //             {/* ── KPI Cards ── */}
// // // //             <Row gutter={[14, 14]} style={{ marginBottom: 20, flexWrap: 'nowrap' }}>
// // // //                 {[
// // // //                     { title: 'Total Tasks',  value: taskCounts.allTasks,   color: C.all,        lightColor: '#f1f5f9', icon: <FcList />,                    subtitle: 'Across all statuses',          status: 'all'         },
// // // //                     { title: 'To Do',        value: taskCounts.toDo,       color: C.toDo,       lightColor: '#ede9fe', icon: <ClockCircleOutlined />,         subtitle: 'Pending start',                status: 'To Do'       },
// // // //                     { title: 'In Progress',  value: taskCounts.inProgress, color: C.inProgress, lightColor: '#fef3c7', icon: <MinusCircleOutlined />,         subtitle: 'Being worked on',              status: 'In Progress' },
// // // //                     { title: 'Done',         value: taskCounts.done,       color: C.done,       lightColor: '#d1fae5', icon: <CheckCircleOutlined />,         subtitle: `${completionRate}% completion`, status: 'Done'        },
// // // //                     { title: 'Overdue',      value: taskCounts.overdue,    color: C.overdue,    lightColor: '#fee2e2', icon: <ExclamationCircleOutlined />,   subtitle: 'Need attention',               status: 'Over Due'    },
// // // //                 ].map((card) => (
// // // //                     <Col key={card.title} style={{ flex: '1 1 0', minWidth: 0, display: 'flex' }}>
// // // //                         <StatCard {...card} loading={loading} onClick={() => goToTasks(card.status)} />
// // // //                     </Col>
// // // //                 ))}
// // // //             </Row>

// // // //             {/* ── Overall progress bar ── */}
// // // //             {taskCounts.allTasks > 0 && (
// // // //                 <div style={{ background: C.surface, borderRadius: 14, padding: '16px 24px', marginBottom: 20, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
// // // //                     <Text style={{ fontWeight: 600, color: C.text, whiteSpace: 'nowrap', fontSize: 13 }}>Overall Progress</Text>
// // // //                     <div style={{ flex: 1, minWidth: 120 }}>
// // // //                         <Progress
// // // //                             percent={completionRate}
// // // //                             strokeColor={{ '0%': C.toDo, '100%': C.done }}
// // // //                             trailColor="#e2e8f0" strokeWidth={10} showInfo={false}
// // // //                         />
// // // //                     </div>
// // // //                     <div style={{ display: 'flex', gap: 24, flexShrink: 0 }}>
// // // //                         {[
// // // //                             { label: 'Done',    val: taskCounts.done,                            color: C.done       },
// // // //                             { label: 'Active',  val: taskCounts.toDo + taskCounts.inProgress,    color: C.inProgress },
// // // //                             { label: 'Overdue', val: taskCounts.overdue,                         color: C.overdue    },
// // // //                             { label: 'Complete',val: `${completionRate}%`,                       color: C.text       },
// // // //                         ].map(({ label, val, color }) => (
// // // //                             <div key={label} style={{ textAlign: 'center' }}>
// // // //                                 <div style={{ fontWeight: 700, color, fontSize: 16, lineHeight: 1 }}>{val}</div>
// // // //                                 <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{label}</div>
// // // //                             </div>
// // // //                         ))}
// // // //                     </div>
// // // //                 </div>
// // // //             )}

// // // //             {/* ── Row 1: Pie + Upcoming tasks ── */}
// // // //             <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
// // // //                 <Col xs={24} lg={9}>
// // // //                     <div style={{ background: C.surface, borderRadius: 14, padding: '20px 20px 12px', border: `1px solid ${C.border}`, height: '100%' }}>
// // // //                         <SectionTitle>Status Distribution</SectionTitle>
// // // //                         {loading
// // // //                             ? <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Spin /></div>
// // // //                             : pieData.length > 0
// // // //                                 ? <EChartsReact option={pieOption(pieData)} style={{ height: 300 }} />
// // // //                                 : <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.muted }}>No data</div>
// // // //                         }
// // // //                     </div>
// // // //                 </Col>
// // // //                 <Col xs={24} lg={15}>
// // // //                     <div style={{ background: C.surface, borderRadius: 14, padding: '20px', border: `1px solid ${C.border}`, height: '100%' }}>
// // // //                         <SectionTitle extra={
// // // //                             <Button size="small" type="link" onClick={() => goToTasks('all')} style={{ color: C.toDo, padding: 0 }}>
// // // //                                 View all →
// // // //                             </Button>
// // // //                         }>
// // // //                             Upcoming &amp; Recent Tasks
// // // //                         </SectionTitle>
// // // //                         <Table
// // // //                             dataSource={upcomingTasks}
// // // //                             columns={upcomingCols}
// // // //                             rowKey="id"
// // // //                             size="small"
// // // //                             pagination={false}
// // // //                             loading={loading}
// // // //                             scroll={{ x: 'max-content' }}
// // // //                             onRow={r => ({ onClick: () => goToTasks(r.status), style: { cursor: 'pointer' } })}
// // // //                             locale={{ emptyText: <div style={{ padding: 32, color: C.muted }}>No tasks found 🎉</div> }}
// // // //                         />
// // // //                     </div>
// // // //                 </Col>
// // // //             </Row>

// // // //             {/* ── Row 2: Time Spent — chart + full table side by side ── */}
// // // //             <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
// // // //                 <Col xs={24}>
// // // //                     <div style={{ background: C.surface, borderRadius: 14, padding: '20px', border: `1px solid ${C.border}` }}>
// // // //                         <SectionTitle
// // // //                             extra={
// // // //                                 <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
// // // //                                     <Text style={{ fontSize: 13, color: C.muted }}>
// // // //                                         Total: <strong style={{ color: C.toDo }}>{formatDurationFromMillis(totalTime)}</strong>
// // // //                                     </Text>
// // // //                                     <Segmented
// // // //                                         size="small"
// // // //                                         options={['By Client', 'By Group']}
// // // //                                         value={tableView === 'client' ? 'By Client' : 'By Group'}
// // // //                                         onChange={v => setTableView(v === 'By Client' ? 'client' : 'group')}
// // // //                                     />
// // // //                                 </div>
// // // //                             }
// // // //                         >
// // // //                             Total Time Spent
// // // //                         </SectionTitle>

// // // //                         {tableView === 'client' ? (
// // // //                             timePerClientData.length > 0 ? (
// // // //                                 <Row gutter={[16, 16]}>
// // // //                                     {/* Bar chart — top 10 */}
// // // //                                     <Col xs={24} xl={12}>
// // // //                                         <Text style={{ fontSize: 12, color: C.muted, display: 'block', marginBottom: 8 }}>
// // // //                                             Top {topClients.length} clients by time logged
// // // //                                         </Text>
// // // //                                         <EChartsReact
// // // //                                             option={barOption(topClients.map(r => ({ name: r.client_name, fullName: r.client_name, ms: r.total_hours })))}
// // // //                                             style={{ height: 280 }}
// // // //                                         />
// // // //                                     </Col>
// // // //                                     {/* Full table — all clients */}
// // // //                                     <Col xs={24} xl={12}>
// // // //                                         <Table
// // // //                                             dataSource={timePerClientData}
// // // //                                             rowKey="client_id"
// // // //                                             size="small"
// // // //                                             columns={clientTableCols}
// // // //                                             pagination={{ pageSize: 8, size: 'small', showSizeChanger: false }}
// // // //                                             scroll={{ x: 'max-content' }}
// // // //                                             onRow={r => ({ onClick: () => handleClientClick(r.client_id), style: { cursor: 'pointer' } })}
// // // //                                             summary={() => (
// // // //                                                 <Table.Summary.Row style={{ background: '#f8fafc' }}>
// // // //                                                     <Table.Summary.Cell index={0} colSpan={4}>
// // // //                                                         <Text strong style={{ fontSize: 12 }}>Grand Total</Text>
// // // //                                                     </Table.Summary.Cell>
// // // //                                                     <Table.Summary.Cell index={1} align="right">
// // // //                                                         <Text strong style={{ fontSize: 12, color: C.toDo }}>
// // // //                                                             {formatDurationFromMillis(totalTime)}
// // // //                                                         </Text>
// // // //                                                     </Table.Summary.Cell>
// // // //                                                 </Table.Summary.Row>
// // // //                                             )}
// // // //                                         />
// // // //                                     </Col>
// // // //                                 </Row>
// // // //                             ) : (
// // // //                                 <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.muted }}>
// // // //                                     {loading ? <Spin /> : 'No time entries recorded'}
// // // //                                 </div>
// // // //                             )
// // // //                         ) : (
// // // //                             timePerGroup.length > 0 ? (
// // // //                                 <Row gutter={[16, 16]}>
// // // //                                     <Col xs={24} xl={12}>
// // // //                                         <Text style={{ fontSize: 12, color: C.muted, display: 'block', marginBottom: 8 }}>
// // // //                                             Top {topGroups.length} groups by time logged
// // // //                                         </Text>
// // // //                                         <EChartsReact
// // // //                                             option={barOption(topGroups.map(r => ({ name: r.client_group_name, fullName: r.client_group_name, ms: r.total_hours })))}
// // // //                                             style={{ height: 280 }}
// // // //                                         />
// // // //                                     </Col>
// // // //                                     <Col xs={24} xl={12}>
// // // //                                         <Table
// // // //                                             dataSource={timePerGroup}
// // // //                                             rowKey="client_group_name"
// // // //                                             size="small"
// // // //                                             columns={groupTableCols}
// // // //                                             pagination={{ pageSize: 8, size: 'small', showSizeChanger: false }}
// // // //                                             scroll={{ x: 'max-content' }}
// // // //                                             summary={() => (
// // // //                                                 <Table.Summary.Row style={{ background: '#f8fafc' }}>
// // // //                                                     <Table.Summary.Cell index={0} colSpan={3}>
// // // //                                                         <Text strong style={{ fontSize: 12 }}>Grand Total</Text>
// // // //                                                     </Table.Summary.Cell>
// // // //                                                     <Table.Summary.Cell index={1} align="right">
// // // //                                                         <Text strong style={{ fontSize: 12, color: C.toDo }}>
// // // //                                                             {formatDurationFromMillis(timePerGroup.reduce((s, r) => s + r.total_hours, 0))}
// // // //                                                         </Text>
// // // //                                                     </Table.Summary.Cell>
// // // //                                                 </Table.Summary.Row>
// // // //                                             )}
// // // //                                         />
// // // //                                     </Col>
// // // //                                 </Row>
// // // //                             ) : (
// // // //                                 <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.muted }}>
// // // //                                     {loading ? <Spin /> : 'No time entries recorded'}
// // // //                                 </div>
// // // //                             )
// // // //                         )}
// // // //                     </div>
// // // //                 </Col>
// // // //             </Row>

// // // //             {/* ── Client Detail Modal ── */}
// // // //             <Modal
// // // //                 open={clientModalVisible}
// // // //                 onCancel={() => { setClientModalVisible(false); setDrillVisible(false); }}
// // // //                 footer={null}
// // // //                 width={900}
// // // //                 styles={{ body: { padding: '24px', background: C.bg } }}
// // // //                 title={
// // // //                     <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
// // // //                         <div style={{ width: 38, height: 38, borderRadius: 10, background: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.toDo, fontWeight: 800, fontSize: 16 }}>
// // // //                             {(selectedClientInfo?.name || 'C')[0]}
// // // //                         </div>
// // // //                         <div>
// // // //                             <div style={{ fontWeight: 700, color: C.text, fontSize: 15 }}>{selectedClientInfo?.name || 'Client'}</div>
// // // //                             <div style={{ fontSize: 12, color: C.muted }}>
// // // //                                 {getGroupName(selectedClientInfo)} · {getSpocName(selectedClientInfo)}
// // // //                             </div>
// // // //                         </div>
// // // //                     </div>
// // // //                 }
// // // //             >
// // // //                 {clientModalLoading ? (
// // // //                     <div style={{ textAlign: 'center', padding: 60 }}><Spin size="large" /></div>
// // // //                 ) : clientSummary ? (
// // // //                     <>
// // // //                         {/* Mini KPIs */}
// // // //                         <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
// // // //                             {[
// // // //                                 { label: 'Done Tasks',  value: clientSummary.done_count,                               color: C.done,       bg: '#d1fae5', isText: false },
// // // //                                 { label: 'Total Time',  value: formatDurationFromMillis(clientSummary.total_hours_ms),  color: C.toDo,       bg: '#ede9fe', isText: true  },
// // // //                                 { label: 'Employees',   value: clientSummary.employees?.length || 0,                   color: C.inProgress, bg: '#fef3c7', isText: false },
// // // //                                 { label: 'Services',    value: clientSummary.sub_services?.length || 0,                color: '#0ea5e9',    bg: '#e0f2fe', isText: false },
// // // //                             ].map(({ label, value, color, bg, isText }) => (
// // // //                                 <Col span={6} key={label}>
// // // //                                     <div style={{ background: bg, borderRadius: 12, padding: '14px 16px', textAlign: 'center' }}>
// // // //                                         {isText
// // // //                                             ? <div style={{ fontSize: 20, fontWeight: 800, color, lineHeight: 1.1 }}>{value}</div>
// // // //                                             : <CountUp end={value} duration={1.2} style={{ fontSize: 28, fontWeight: 800, color, lineHeight: 1 }} />
// // // //                                         }
// // // //                                         <div style={{ fontSize: 11, color: C.muted, marginTop: 4, fontWeight: 600 }}>{label}</div>
// // // //                                     </div>
// // // //                                 </Col>
// // // //                             ))}
// // // //                         </Row>

// // // //                         {/* Employee Hours + Service Breakdown charts */}
// // // //                         <Row gutter={[12, 12]}>
// // // //                             {clientSummary.employees?.length > 0 && (
// // // //                                 <Col xs={24} md={clientSummary.sub_services?.length > 0 ? 12 : 24}>
// // // //                                     <div style={{ background: C.surface, borderRadius: 12, padding: 16, border: `1px solid ${C.border}` }}>
// // // //                                         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
// // // //                                             <Text style={{ fontWeight: 700, fontSize: 13 }}>Employee Hours</Text>
// // // //                                             <Text style={{ fontSize: 11, color: C.muted }}>Click bar for details</Text>
// // // //                                         </div>
// // // //                                         <EChartsReact
// // // //                                             option={hBarOption(clientSummary.employees, '#818cf8', '#6366f1')}
// // // //                                             style={{ height: Math.max(140, clientSummary.employees.length * 32 + 20) }}
// // // //                                             onEvents={{
// // // //                                                 click: (params) => {
// // // //                                                     const reversed = [...clientSummary.employees].reverse();
// // // //                                                     const emp = reversed[params.dataIndex];
// // // //                                                     if (!emp) return;
// // // //                                                     const services = clientSummary.per_employee_services?.[emp.name] || [];
// // // //                                                     setDrillTitle(emp.name);
// // // //                                                     setDrillData(services);
// // // //                                                     setDrillType('employee');
// // // //                                                     setDrillVisible(true);
// // // //                                                 },
// // // //                                             }}
// // // //                                         />
// // // //                                     </div>
// // // //                                 </Col>
// // // //                             )}
// // // //                             {clientSummary.sub_services?.length > 0 && (
// // // //                                 <Col xs={24} md={clientSummary.employees?.length > 0 ? 12 : 24}>
// // // //                                     <div style={{ background: C.surface, borderRadius: 12, padding: 16, border: `1px solid ${C.border}` }}>
// // // //                                         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
// // // //                                             <Text style={{ fontWeight: 700, fontSize: 13 }}>Service Breakdown</Text>
// // // //                                             <Text style={{ fontSize: 11, color: C.muted }}>Click bar for details</Text>
// // // //                                         </div>
// // // //                                         <EChartsReact
// // // //                                             option={hBarOption(clientSummary.sub_services, '#06b6d4', '#0ea5e9')}
// // // //                                             style={{ height: Math.max(140, clientSummary.sub_services.length * 32 + 20) }}
// // // //                                             onEvents={{
// // // //                                                 click: (params) => {
// // // //                                                     const reversed = [...clientSummary.sub_services].reverse();
// // // //                                                     const svc = reversed[params.dataIndex];
// // // //                                                     if (!svc) return;
// // // //                                                     const employees = clientSummary.per_service_employees?.[svc.name] || [];
// // // //                                                     setDrillTitle(svc.name);
// // // //                                                     setDrillData(employees);
// // // //                                                     setDrillType('service');
// // // //                                                     setDrillVisible(true);
// // // //                                                 },
// // // //                                             }}
// // // //                                         />
// // // //                                     </div>
// // // //                                 </Col>
// // // //                             )}
// // // //                         </Row>
// // // //                     </>
// // // //                 ) : (
// // // //                     <div style={{ textAlign: 'center', padding: 40, color: C.muted }}>No data available</div>
// // // //                 )}
// // // //             </Modal>

// // // //             {/* ── Drill-down Panel — rendered via Portal, no mask conflict ── */}
// // // //             {drillVisible && typeof document !== 'undefined' && (() => {
// // // //                 const color    = drillType === 'employee' ? '#0ea5e9' : '#6366f1';
// // // //                 const colorEnd = drillType === 'employee' ? '#06b6d4' : '#818cf8';

// // // //                 const panel = (
// // // //                     <div style={{
// // // //                         position: 'fixed',
// // // //                         top: '8vh',
// // // //                         right: 24,
// // // //                         width: 400,
// // // //                         maxHeight: '80vh',
// // // //                         zIndex: 1100,
// // // //                         display: 'flex',
// // // //                         flexDirection: 'column',
// // // //                         background: C.surface,
// // // //                         borderRadius: 16,
// // // //                         boxShadow: '0 20px 60px rgba(0,0,0,0.22)',
// // // //                         border: `1px solid ${C.border}`,
// // // //                         animation: 'drillSlideIn 0.26s cubic-bezier(0.4,0,0.2,1) both',
// // // //                         overflow: 'hidden',
// // // //                     }}>
// // // //                         <style>{`
// // // //                             @keyframes drillSlideIn {
// // // //                                 from { opacity:0; transform: translateX(28px) scale(0.97); }
// // // //                                 to   { opacity:1; transform: translateX(0)     scale(1);    }
// // // //                             }
// // // //                         `}</style>

// // // //                         {/* Header */}
// // // //                         <div style={{
// // // //                             display: 'flex', alignItems: 'center', justifyContent: 'space-between',
// // // //                             padding: '14px 18px',
// // // //                             borderBottom: `1px solid ${C.border}`,
// // // //                             background: drillType === 'employee' ? '#f5f3ff' : '#ecfeff',
// // // //                             flexShrink: 0,
// // // //                         }}>
// // // //                             <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
// // // //                                 <div style={{
// // // //                                     width: 32, height: 32, borderRadius: 8,
// // // //                                     background: drillType === 'employee' ? '#ede9fe' : '#cffafe',
// // // //                                     display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15,
// // // //                                 }}>
// // // //                                     {drillType === 'employee' ? '🛠' : '👤'}
// // // //                                 </div>
// // // //                                 <div>
// // // //                                     <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
// // // //                                         {drillType === 'employee' ? 'Services by' : 'Employees on'}
// // // //                                     </div>
// // // //                                     <div style={{ fontSize: 13, fontWeight: 700, color: C.text, lineHeight: 1.3, maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
// // // //                                         {drillTitle}
// // // //                                     </div>
// // // //                                 </div>
// // // //                             </div>
// // // //                             <button
// // // //                                 onClick={() => setDrillVisible(false)}
// // // //                                 style={{
// // // //                                     background: 'none', border: 'none', cursor: 'pointer',
// // // //                                     color: C.muted, fontSize: 20, lineHeight: 1,
// // // //                                     padding: '4px 8px', borderRadius: 8,
// // // //                                     display: 'flex', alignItems: 'center', justifyContent: 'center',
// // // //                                     flexShrink: 0,
// // // //                                 }}
// // // //                                 onMouseEnter={e => { e.currentTarget.style.background = C.border; e.currentTarget.style.color = C.text; }}
// // // //                                 onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = C.muted; }}
// // // //                             >
// // // //                                 ×
// // // //                             </button>
// // // //                         </div>

// // // //                         {/* Body — scrollable */}
// // // //                         <div style={{ overflowY: 'auto', padding: '16px 18px', flex: 1 }}>
// // // //                             {drillData.length === 0 ? (
// // // //                                 <div style={{ textAlign: 'center', padding: '32px 0', color: C.muted, fontSize: 13 }}>No data available</div>
// // // //                             ) : (
// // // //                                 <>
// // // //                                     <EChartsReact
// // // //                                         option={hBarOption(drillData, colorEnd, color)}
// // // //                                         style={{ height: Math.max(90, drillData.length * 30 + 16) }}
// // // //                                     />
// // // //                                     <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
// // // //                                         {[...drillData].sort((a, b) => b.ms - a.ms).map((d, i) => {
// // // //                                             const maxMs = drillData[0]?.ms || 1;
// // // //                                             const pct   = Math.round((d.ms / maxMs) * 100);
// // // //                                             return (
// // // //                                                 <div key={d.name} style={{
// // // //                                                     padding: '8px 12px', borderRadius: 10,
// // // //                                                     background: C.bg, border: `1px solid ${C.border}`,
// // // //                                                 }}>
// // // //                                                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
// // // //                                                         <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
// // // //                                                             <span style={{ fontSize: 10, fontWeight: 700, color: C.muted, flexShrink: 0 }}>#{i + 1}</span>
// // // //                                                             <span title={d.name} style={{
// // // //                                                                 fontSize: 12, fontWeight: 500, color: C.text,
// // // //                                                                 overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
// // // //                                                                 maxWidth: 210,
// // // //                                                             }}>{d.name}</span>
// // // //                                                         </div>
// // // //                                                         <span style={{ fontSize: 11, fontWeight: 700, color, flexShrink: 0, marginLeft: 8 }}>
// // // //                                                             {formatDurationFromMillis(d.ms)}
// // // //                                                         </span>
// // // //                                                     </div>
// // // //                                                     <div style={{ height: 3, background: C.border, borderRadius: 4 }}>
// // // //                                                         <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 4, transition: 'width 0.5s ease' }} />
// // // //                                                     </div>
// // // //                                                 </div>
// // // //                                             );
// // // //                                         })}
// // // //                                     </div>
// // // //                                 </>
// // // //                             )}
// // // //                         </div>
// // // //                     </div>
// // // //                 );

// // // //                 return ReactDOM.createPortal(panel, document.body);
// // // //             })()}

// // // //         </div>
// // // //     );
// // // // };

// // // // export default TaskDashboard;

// // // import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
// // // import ReactDOM from 'react-dom';
// // // import {
// // //     Card, Col, Row, Typography, message, Table, DatePicker,
// // //     Select, Space, Button, Segmented, Modal, Spin, Progress, Tooltip,
// // // } from 'antd';
// // // import { api } from '../../../services/api';
// // // import EChartsReact from 'echarts-for-react';
// // // import CountUp from 'react-countup';
// // // import {
// // //     ClockCircleOutlined, CheckCircleOutlined,
// // //     MinusCircleOutlined, ExclamationCircleOutlined,
// // //     FilterOutlined, ClearOutlined, ReloadOutlined,
// // // } from '@ant-design/icons';
// // // import { FcList } from 'react-icons/fc';
// // // import moment from 'moment';
// // // import { formatDurationFromMillis } from './STT_Records';
// // // import { useNavigate } from 'react-router-dom';

// // // const { Title, Text } = Typography;
// // // const { RangePicker } = DatePicker;
// // // const { Option } = Select;

// // // /* ─── Design tokens ─────────────────────────────────────────── */
// // // const C = {
// // //     done:       '#10b981',
// // //     inProgress: '#f59e0b',
// // //     overdue:    '#ef4444',
// // //     toDo:       '#6366f1',
// // //     all:        '#0f172a',
// // //     bg:         '#f1f5f9',
// // //     surface:    '#ffffff',
// // //     border:     '#e2e8f0',
// // //     text:       '#0f172a',
// // //     muted:      '#64748b',
// // // };

// // // const STATUS_META = {
// // //     'Done':        { color: C.done,       light: '#d1fae5' },
// // //     'In Progress': { color: C.inProgress, light: '#fef3c7' },
// // //     'Over Due':    { color: C.overdue,    light: '#fee2e2' },
// // //     'To Do':       { color: C.toDo,       light: '#ede9fe' },
// // // };

// // // /* ─── Stat Card ─────────────────────────────────────────────── */
// // // const StatCard = ({ title, value, color, lightColor, icon, subtitle, onClick, loading }) => (
// // //     <div
// // //         onClick={onClick}
// // //         style={{
// // //             background: C.surface, borderRadius: 16, padding: '20px 22px',
// // //             cursor: 'pointer', border: `1px solid ${C.border}`,
// // //             borderTop: `4px solid ${color}`,
// // //             transition: 'all 0.2s', flex: 1, minWidth: 0,
// // //             boxShadow: '0 1px 4px rgba(0,0,0,0.06)', position: 'relative', overflow: 'hidden',
// // //         }}
// // //         onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = `0 10px 28px ${color}28`; }}
// // //         onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)'; }}
// // //     >
// // //         <div style={{ position: 'absolute', right: 18, top: 18, width: 44, height: 44, borderRadius: 12, background: lightColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color }}>
// // //             {icon}
// // //         </div>
// // //         <Text style={{ fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: '0.07em', textTransform: 'uppercase' }}>
// // //             {title}
// // //         </Text>
// // //         <div style={{ marginTop: 8 }}>
// // //             {loading
// // //                 ? <div style={{ fontSize: 28, fontWeight: 700, color: C.muted }}>—</div>
// // //                 : <CountUp end={value} duration={1.6} style={{ fontSize: 34, fontWeight: 800, color, lineHeight: 1 }} />
// // //             }
// // //         </div>
// // //         {subtitle && <Text style={{ fontSize: 11, color: C.muted, marginTop: 6, display: 'block' }}>{subtitle}</Text>}
// // //     </div>
// // // );

// // // /* ─── Section header ────────────────────────────────────────── */
// // // const SectionTitle = ({ children, extra }) => (
// // //     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
// // //         <Text style={{ fontSize: 14, fontWeight: 700, color: C.text, letterSpacing: '-0.01em' }}>{children}</Text>
// // //         {extra}
// // //     </div>
// // // );

// // // /* ─── Status Badge ──────────────────────────────────────────── */
// // // const StatusBadge = ({ status }) => {
// // //     const meta = STATUS_META[status] || { color: C.muted, light: '#f1f5f9' };
// // //     return (
// // //         <span style={{
// // //             background: meta.light, color: meta.color,
// // //             borderRadius: 20, padding: '2px 10px',
// // //             fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap',
// // //         }}>
// // //             {status}
// // //         </span>
// // //     );
// // // };

// // // /* ─── Chart helpers ─────────────────────────────────────────── */
// // // const pieOption = (data) => ({
// // //     backgroundColor: 'transparent',
// // //     tooltip: {
// // //         trigger: 'item',
// // //         formatter: '{b}: <b>{c}</b> ({d}%)',
// // //         backgroundColor: '#1e293b', borderColor: 'transparent',
// // //         textStyle: { color: '#f1f5f9', fontSize: 13 },
// // //     },
// // //     legend: {
// // //         orient: 'horizontal', bottom: 0, left: 'center',
// // //         textStyle: { color: C.muted, fontSize: 12 },
// // //         itemWidth: 10, itemHeight: 10,
// // //     },
// // //     series: [{
// // //         type: 'pie', radius: ['42%', '70%'], center: ['50%', '44%'],
// // //         avoidLabelOverlap: true,
// // //         itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
// // //         label: { show: true, formatter: '{b}\n{c}', fontSize: 11, color: C.muted, lineHeight: 16 },
// // //         labelLine: { length: 10, length2: 6 },
// // //         data: data.map(d => ({ ...d, itemStyle: { color: STATUS_META[d.name]?.color || '#94a3b8' } })),
// // //         emphasis: { itemStyle: { shadowBlur: 12, shadowColor: 'rgba(0,0,0,0.15)' } },
// // //     }],
// // // });

// // // const barOption = (data) => ({
// // //     backgroundColor: 'transparent',
// // //     tooltip: {
// // //         trigger: 'axis', axisPointer: { type: 'shadow' },
// // //         backgroundColor: '#1e293b', borderColor: 'transparent',
// // //         textStyle: { color: '#f1f5f9', fontSize: 12 },
// // //         formatter: (params) => {
// // //             const p = params[0];
// // //             const orig = data[p.dataIndex];
// // //             return `<b>${orig?.fullName || p.name}</b><br/>${formatDurationFromMillis(p.value)}`;
// // //         },
// // //     },
// // //     grid: { top: 16, right: 16, bottom: 48, left: 16, containLabel: true },
// // //     xAxis: {
// // //         type: 'category',
// // //         data: data.map(d => d.name.length > 13 ? d.name.slice(0, 12) + '…' : d.name),
// // //         axisLabel: { color: C.muted, fontSize: 11, rotate: data.length > 5 ? 30 : 0, interval: 0 },
// // //         axisLine: { lineStyle: { color: C.border } },
// // //         axisTick: { show: false },
// // //     },
// // //     yAxis: {
// // //         type: 'value',
// // //         axisLabel: { color: C.muted, fontSize: 10, formatter: v => formatDurationFromMillis(v) },
// // //         splitLine: { lineStyle: { color: C.border, type: 'dashed' } },
// // //         axisLine: { show: false }, axisTick: { show: false },
// // //     },
// // //     series: [{
// // //         type: 'bar',
// // //         data: data.map(d => ({
// // //             value: d.ms,
// // //             itemStyle: {
// // //                 color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: '#6366f1' }, { offset: 1, color: '#818cf8' }] },
// // //                 borderRadius: [6, 6, 0, 0],
// // //             },
// // //         })),
// // //         barMaxWidth: 48,
// // //         emphasis: {
// // //             itemStyle: {
// // //                 color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: '#4f46e5' }, { offset: 1, color: '#6366f1' }] },
// // //             },
// // //         },
// // //     }],
// // // });

// // // const hBarOption = (data, colorStart = '#06b6d4', colorEnd = '#0ea5e9') => {
// // //     // ECharts renders category axis bottom-up, so reverse to show highest at top
// // //     const reversed = [...data].reverse();
// // //     return {
// // //     backgroundColor: 'transparent',
// // //     tooltip: {
// // //         trigger: 'axis', axisPointer: { type: 'shadow' },
// // //         backgroundColor: '#1e293b', borderColor: 'transparent',
// // //         textStyle: { color: '#f1f5f9', fontSize: 12 },
// // //         formatter: (params) => `<b>${params[0].name}</b><br/>${formatDurationFromMillis(params[0].value)}`,
// // //     },
// // //     grid: { top: 4, right: 96, bottom: 4, left: 8, containLabel: true },
// // //     xAxis: {
// // //         type: 'value',
// // //         show: false,
// // //         splitLine: { show: false },
// // //     },
// // //     yAxis: {
// // //         type: 'category',
// // //         data: reversed.map(d => d.name?.length > 18 ? d.name.slice(0, 17) + '…' : d.name || 'N/A'),
// // //         axisLabel: { color: C.muted, fontSize: 11 },
// // //         axisLine: { show: false }, axisTick: { show: false },
// // //     },
// // //     series: [{
// // //         type: 'bar',
// // //         data: reversed.map(d => ({
// // //             value: d.ms || 0,
// // //             itemStyle: {
// // //                 color: { type: 'linear', x: 0, y: 0, x2: 1, y2: 0, colorStops: [{ offset: 0, color: colorStart }, { offset: 1, color: colorEnd }] },
// // //                 borderRadius: [0, 6, 6, 0],
// // //             },
// // //         })),
// // //         barMaxWidth: 18,
// // //         label: {
// // //             show: true, position: 'right',
// // //             formatter: p => formatDurationFromMillis(p.value),
// // //             color: C.muted, fontSize: 10,
// // //         },
// // //     }],
// // //     };
// // // };

// // // /* ══════════════ MAIN COMPONENT ══════════════ */
// // // const TaskDashboard = () => {
// // //     const navigate = useNavigate();

// // //     const [loading,             setLoading]             = useState(true);
// // //     const [dashboardData,       setDashboardData]       = useState(null);
// // //     const [error,               setError]               = useState(null);
// // //     const [dateRange,           setDateRange]           = useState(null);
// // //     const [clients,             setClients]             = useState([]);
// // //     const [selectedClient,      setSelectedClient]      = useState([]);
// // //     const [teams,               setTeams]               = useState([]);
// // //     const [selectedTeam,        setSelectedTeam]        = useState([]);
// // //     const [clientGroups,        setClientGroups]        = useState([]);
// // //     const [selectedClientGroup, setSelectedClientGroup] = useState([]);
// // //     const [allSpocs,            setAllSpocs]            = useState([]);
// // //     const [subServices,         setSubServices]         = useState([]);
// // //     const [selectedSubService,  setSelectedSubService]  = useState([]);
// // //     const [tableView,           setTableView]           = useState('client');
// // //     const [taskCounts,          setTaskCounts]          = useState({ allTasks: 0, done: 0, toDo: 0, overdue: 0, inProgress: 0 });
// // //     const [filtersOpen,         setFiltersOpen]         = useState(false);
// // //     const [timePerClientData,   setTimePerClientData]   = useState([]);

// // //     // Client modal
// // //     const [clientModalVisible,  setClientModalVisible]  = useState(false);
// // //     const [clientModalLoading,  setClientModalLoading]  = useState(false);
// // //     const [selectedClientInfo,  setSelectedClientInfo]  = useState(null);
// // //     const [clientSummary,       setClientSummary]       = useState(null);

// // //     // Drill-down modal (employee → services  /  service → employees)
// // //     const [drillVisible,        setDrillVisible]        = useState(false);
// // //     const [drillTitle,          setDrillTitle]          = useState('');
// // //     const [drillData,           setDrillData]           = useState([]);  // [{name, ms}]
// // //     const [drillType,           setDrillType]           = useState('');  // 'employee' | 'service'

// // //     // Ref to track if component is still mounted (avoids state-on-unmount warnings)
// // //     const mountedRef = useRef(true);
// // //     useEffect(() => { mountedRef.current = true; return () => { mountedRef.current = false; }; }, []);

// // //     // ── Refs for stable lookup functions that don't re-trigger effects ──────
// // //     const clientGroupsRef = useRef([]);
// // //     const allSpocsRef     = useRef([]);
// // //     useEffect(() => { clientGroupsRef.current = clientGroups; }, [clientGroups]);
// // //     useEffect(() => { allSpocsRef.current = allSpocs; }, [allSpocs]);

// // //     const getSpocName = useCallback((client) => {
// // //         if (!client) return 'N/A';
// // //         if (client.primary_spoc_name) return client.primary_spoc_name;
// // //         const groups = clientGroupsRef.current;
// // //         const group = groups.find(g => g.clients?.some(cg => (typeof cg === 'object' ? cg.id : cg) === client.id));
// // //         if (group?.primary_spoc_name) return group.primary_spoc_name;
// // //         if (typeof client.primary_spoc === 'number') {
// // //             const spoc = allSpocsRef.current.find(s => s.id === client.primary_spoc);
// // //             if (spoc) return `${spoc.first_name || ''} ${spoc.last_name || ''}`.trim() || spoc.user?.email || 'N/A';
// // //         }
// // //         return 'N/A';
// // //     }, []); // stable — reads from refs

// // //     const getGroupName = useCallback((client) => {
// // //         if (!client) return 'N/A';
// // //         const groups = clientGroupsRef.current;
// // //         const group = groups.find(g => g.clients?.some(cg => (typeof cg === 'object' ? cg.id : cg) === client.id));
// // //         return group?.group_name || 'N/A';
// // //     }, []); // stable

// // //     /* ── Build params ── */
// // //     const buildParams = (filters = {}) => {
// // //         const p = {
// // //             start_date:      filters.startDate?.format('YYYY-MM-DD'),
// // //             end_date:        filters.endDate?.format('YYYY-MM-DD'),
// // //             client_id:       filters.clientId?.length      ? filters.clientId.join(',')       : undefined,
// // //             team_id:         filters.teamId?.length        ? filters.teamId.join(',')         : undefined,
// // //             client_group_id: filters.clientGroupId?.length ? filters.clientGroupId.join(',') : undefined,
// // //             sub_service_id:  filters.subServiceId?.length  ? filters.subServiceId.join(',')  : undefined,
// // //         };
// // //         Object.keys(p).forEach(k => p[k] === undefined && delete p[k]);
// // //         return p;
// // //     };

// // //     /* ── Core fetch functions (stable — no deps that change) ── */
// // //     const fetchDashboard = useCallback(async (params) => {
// // //         if (!mountedRef.current) return;
// // //         setLoading(true);
// // //         try {
// // //             const res = await api.get('/clients/tasks/dashboard_summary/', { params });
// // //             if (mountedRef.current) setDashboardData(res.data);
// // //         } catch (err) {
// // //             console.error(err);
// // //             if (mountedRef.current) {
// // //                 setError('Failed to load dashboard data.');
// // //                 message.error('Failed to load dashboard.');
// // //             }
// // //         } finally {
// // //             if (mountedRef.current) setLoading(false);
// // //         }
// // //     }, []); // no deps — intentionally stable

// // //     const fetchTimePerClient = useCallback(async (params, clientsList) => {
// // //         if (!mountedRef.current) return;
// // //         try {
// // //             const res = await api.get('/clients/tasks/time_per_client/', { params });
// // //             if (!mountedRef.current) return;
// // //             setTimePerClientData((res.data || []).map(row => {
// // //                 const c = (clientsList || []).find(x => x.id === row.client_id);
// // //                 return {
// // //                     ...row,
// // //                     total_hours: row.total_hours_ms,
// // //                     group_name:  c ? getGroupName(c)  : 'N/A',
// // //                     spoc_name:   c ? getSpocName(c)   : 'N/A',
// // //                 };
// // //             }));
// // //         } catch (err) {
// // //             console.error('fetchTimePerClient error:', err);
// // //         }
// // //     }, [getGroupName, getSpocName]); // stable — getGroupName/getSpocName are stable

// // //     /* ── Initial load — runs ONCE ── */
// // //     const didInit = useRef(false);
// // //     useEffect(() => {
// // //         if (didInit.current) return;
// // //         didInit.current = true;

// // //         (async () => {
// // //             setLoading(true);
// // //             try {
// // //                 const [cR, tR, gR, sR, ssR] = await Promise.all([
// // //                     api.get('/clients/clients/?page_size=500'),
// // //                     api.get('/employee/teams/'),
// // //                     api.get('/clients/client-groups/'),
// // //                     api.get('/employee/employees/'),
// // //                     api.get('/clients/subservices/'),
// // //                 ]);
// // //                 if (!mountedRef.current) return;
// // //                 const cl = cR.data.results || cR.data;
// // //                 const gr = gR.data.results || gR.data;
// // //                 const sp = sR.data.results || sR.data;
// // //                 setClients(cl);
// // //                 setTeams(tR.data.results || tR.data);
// // //                 setClientGroups(gr);
// // //                 setAllSpocs(sp);
// // //                 setSubServices(ssR.data.results || ssR.data);
// // //                 // Set refs immediately so enrichment in fetchTimePerClient works
// // //                 clientGroupsRef.current = gr;
// // //                 allSpocsRef.current     = sp;
// // //                 await Promise.all([
// // //                     fetchDashboard({}),
// // //                     fetchTimePerClient({}, cl),
// // //                 ]);
// // //             } catch (err) {
// // //                 console.error('fetchInitialData error:', err);
// // //                 if (mountedRef.current) setError('Failed to load initial data.');
// // //             } finally {
// // //                 if (mountedRef.current) setLoading(false);
// // //             }
// // //         })();
// // //     }, [fetchDashboard, fetchTimePerClient]);

// // //     /* ── Re-fetch ONLY when user changes filters ── */
// // //     const isFirstRender = useRef(true);
// // //     useEffect(() => {
// // //         if (isFirstRender.current) { isFirstRender.current = false; return; }
// // //         const [startDate, endDate] = dateRange || [null, null];
// // //         const f = { startDate, endDate, clientId: selectedClient, teamId: selectedTeam, clientGroupId: selectedClientGroup, subServiceId: selectedSubService };
// // //         const p = buildParams(f);
// // //         fetchDashboard(p);
// // //         fetchTimePerClient(p, clients);
// // //         // eslint-disable-next-line react-hooks/exhaustive-deps
// // //     }, [dateRange, selectedClient, selectedTeam, selectedClientGroup, selectedSubService]);

// // //     /* ── Derive counts ── */
// // //     useEffect(() => {
// // //         if (!dashboardData?.status_counts) return;
// // //         const sc = dashboardData.status_counts;
// // //         setTaskCounts({
// // //             allTasks:   (sc['To Do'] || 0) + (sc['In Progress'] || 0) + (sc['Done'] || 0) + (sc['Over Due'] || 0),
// // //             done:       sc['Done']        || 0,
// // //             toDo:       sc['To Do']       || 0,
// // //             inProgress: sc['In Progress'] || 0,
// // //             overdue:    sc['Over Due']    || 0,
// // //         });
// // //     }, [dashboardData]);

// // //     /* ── Derived data ── */
// // //     const timePerGroup = useMemo(() =>
// // //         timePerClientData.reduce((acc, row) => {
// // //             if (!row.group_name || row.group_name === 'N/A') return acc;
// // //             const ex = acc.find(g => g.client_group_name === row.group_name);
// // //             if (ex) ex.total_hours += row.total_hours;
// // //             else acc.push({ client_group_name: row.group_name, spoc_name: row.spoc_name, total_hours: row.total_hours });
// // //             return acc;
// // //         }, [])
// // //     , [timePerClientData]);

// // //     const pieData = useMemo(() =>
// // //         dashboardData?.status_counts
// // //             ? Object.entries(dashboardData.status_counts).filter(([k, v]) => k !== 'total' && v > 0).map(([name, value]) => ({ name, value }))
// // //             : []
// // //     , [dashboardData]);

// // //     const topClients = useMemo(() => [...timePerClientData].sort((a, b) => b.total_hours - a.total_hours).slice(0, 10), [timePerClientData]);
// // //     const topGroups  = useMemo(() => [...timePerGroup].sort((a, b) => b.total_hours - a.total_hours).slice(0, 10), [timePerGroup]);

// // //     const totalTime       = useMemo(() => timePerClientData.reduce((s, r) => s + (r.total_hours || 0), 0), [timePerClientData]);
// // //     const completionRate  = taskCounts.allTasks ? Math.round((taskCounts.done / taskCounts.allTasks) * 100) : 0;
// // //     const activeFilterCount = [selectedClient, selectedTeam, selectedClientGroup, selectedSubService].filter(a => a.length).length + (dateRange ? 1 : 0);

// // //     /* ── Clear filters ── */
// // //     const handleClearFilters = () => {
// // //         setDateRange(null);
// // //         setSelectedClient([]);
// // //         setSelectedTeam([]);
// // //         setSelectedClientGroup([]);
// // //         setSelectedSubService([]);
// // //     };

// // //     /* ── Navigate with filters ── */
// // //     const goToTasks = (status) => {
// // //         const params = new URLSearchParams();
// // //         if (status !== 'all') params.set('status', status);
// // //         const [s, e] = dateRange || [null, null];
// // //         if (s) params.set('start_date', s.format('YYYY-MM-DD'));
// // //         if (e) params.set('end_date',   e.format('YYYY-MM-DD'));
// // //         if (selectedClient?.length)      params.set('client_id',      selectedClient.join(','));
// // //         if (selectedTeam?.length)        params.set('team_id',         selectedTeam.join(','));
// // //         if (selectedClientGroup?.length) params.set('client_group_id', selectedClientGroup.join(','));
// // //         if (selectedSubService?.length)  params.set('sub_service_id',  selectedSubService.join(','));
// // //         navigate(`/stt-records?${params.toString()}`);
// // //     };

// // //     /* ── Client modal ── */
// // //     const handleClientClick = useCallback(async (clientId) => {
// // //         const client = clients.find(c => c.id === clientId);
// // //         setSelectedClientInfo(client);
// // //         setClientSummary(null);
// // //         setDrillVisible(false);   // reset any open drill panel
// // //         setDrillData([]);
// // //         setClientModalVisible(true);
// // //         setClientModalLoading(true);
// // //         try {
// // //             const [startDate, endDate] = dateRange || [null, null];
// // //             const params = { client_id: clientId };
// // //             if (startDate) params.start_date = startDate.format('YYYY-MM-DD');
// // //             if (endDate)   params.end_date   = endDate.format('YYYY-MM-DD');
// // //             const res = await api.get('/clients/tasks/client_task_summary/', { params });
// // //             if (mountedRef.current) setClientSummary(res.data);
// // //         } catch (err) {
// // //             console.error(err);
// // //             message.error('Failed to load client details');
// // //         } finally {
// // //             if (mountedRef.current) setClientModalLoading(false);
// // //         }
// // //     }, [clients, dateRange]);

// // //     /* ── Refresh handler ── */
// // //     const handleRefresh = useCallback(() => {
// // //         const [startDate, endDate] = dateRange || [null, null];
// // //         const f = { startDate, endDate, clientId: selectedClient, teamId: selectedTeam, clientGroupId: selectedClientGroup, subServiceId: selectedSubService };
// // //         const p = buildParams(f);
// // //         fetchDashboard(p);
// // //         fetchTimePerClient(p, clients);
// // //     }, [dateRange, selectedClient, selectedTeam, selectedClientGroup, selectedSubService, clients, fetchDashboard, fetchTimePerClient]);

// // //     /* ── Upcoming tasks ── */
// // //     const upcomingTasks = useMemo(() => (dashboardData?.tasks || []).slice(0, 8), [dashboardData]);
// // //     const upcomingCols = [
// // //         {
// // //             title: 'Task ID', dataIndex: 'task_id', key: 'task_id', width: 140,
// // //             render: v => <Text style={{ fontFamily: 'monospace', fontSize: 11, color: C.muted }}>{v}</Text>,
// // //         },
// // //         { title: 'Client', dataIndex: 'client_name', key: 'client_name', ellipsis: true },
// // //         { title: 'Service', dataIndex: 'sub_service_name', key: 'sub_service_name', ellipsis: true },
// // //         {
// // //             title: 'Due', dataIndex: 'due_date', key: 'due_date', width: 100,
// // //             render: d => {
// // //                 if (!d) return <span style={{ color: C.muted }}>—</span>;
// // //                 const m = moment(d);
// // //                 const isLate = m.isBefore(moment(), 'day');
// // //                 return <span style={{ color: isLate ? C.overdue : C.muted, fontWeight: isLate ? 600 : 400, fontSize: 12 }}>{m.format('DD MMM YY')}</span>;
// // //             },
// // //         },
// // //         {
// // //             title: 'Status', dataIndex: 'status', key: 'status', width: 120,
// // //             render: (_, r) => {
// // //                 const eff = r.due_date && moment(r.due_date).isBefore(moment(), 'day') && r.status !== 'Done' ? 'Over Due' : r.status;
// // //                 return <StatusBadge status={eff} />;
// // //             },
// // //         },
// // //     ];

// // //     /* ── Table columns: client ── */
// // //     const clientTableCols = [
// // //         {
// // //             title: '#', render: (_, __, i) => <Text style={{ color: C.muted, fontSize: 12 }}>{i + 1}</Text>, width: 44,
// // //         },
// // //         {
// // //             title: 'Client', dataIndex: 'client_name', key: 'client_name',
// // //             width: 180,
// // //             render: v => (
// // //                 <Tooltip title={v} placement="topLeft">
// // //                     <Text style={{
// // //                         fontWeight: 500, fontSize: 13,
// // //                         maxWidth: 160, display: 'block',
// // //                         overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
// // //                     }}>
// // //                         {v}
// // //                     </Text>
// // //                 </Tooltip>
// // //             ),
// // //             sorter: (a, b) => a.client_name.localeCompare(b.client_name),
// // //         },
// // //         {
// // //             title: 'Group', dataIndex: 'group_name', key: 'group_name',
// // //             width: 130,
// // //             render: v => (
// // //                 <Tooltip title={v} placement="topLeft">
// // //                     <Text style={{ fontSize: 12, color: C.muted, maxWidth: 120, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
// // //                         {v || '—'}
// // //                     </Text>
// // //                 </Tooltip>
// // //             ),
// // //         },
// // //         {
// // //             title: 'SPOC', dataIndex: 'spoc_name', key: 'spoc_name',
// // //             width: 120,
// // //             render: v => (
// // //                 <Tooltip title={v} placement="topLeft">
// // //                     <Text style={{ fontSize: 12, color: C.muted, maxWidth: 110, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
// // //                         {v || '—'}
// // //                     </Text>
// // //                 </Tooltip>
// // //             ),
// // //         },
// // //         {
// // //             title: 'Time Spent', key: 'time', align: 'right', width: 110,
// // //             render: (_, r) => <Text style={{ fontSize: 13, fontWeight: 700, color: C.toDo }}>{formatDurationFromMillis(r.total_hours)}</Text>,
// // //             sorter: (a, b) => a.total_hours - b.total_hours,
// // //             defaultSortOrder: 'descend',
// // //         },
// // //     ];

// // //     /* ── Table columns: group ── */
// // //     const groupTableCols = [
// // //         { title: '#', render: (_, __, i) => <Text style={{ color: C.muted, fontSize: 12 }}>{i + 1}</Text>, width: 44 },
// // //         {
// // //             title: 'Client Group', dataIndex: 'client_group_name', key: 'client_group_name',
// // //             render: v => <Text style={{ fontWeight: 500, fontSize: 13 }}>{v}</Text>,
// // //             sorter: (a, b) => a.client_group_name.localeCompare(b.client_group_name),
// // //         },
// // //         {
// // //             title: 'SPOC', dataIndex: 'spoc_name', key: 'spoc_name',
// // //             render: v => <Text style={{ fontSize: 12, color: C.muted }}>{v || '—'}</Text>,
// // //         },
// // //         {
// // //             title: 'Time Spent', key: 'time', align: 'right',
// // //             render: (_, r) => <Text style={{ fontSize: 13, fontWeight: 700, color: C.toDo }}>{formatDurationFromMillis(r.total_hours)}</Text>,
// // //             sorter: (a, b) => a.total_hours - b.total_hours,
// // //             defaultSortOrder: 'descend',
// // //         },
// // //     ];

// // //     /* ── Error state ── */
// // //     if (error && !dashboardData) {
// // //         return (
// // //             <div style={{ padding: 60, textAlign: 'center', background: C.bg, minHeight: '100vh' }}>
// // //                 <Text style={{ color: C.overdue, fontSize: 16 }}>{error}</Text><br />
// // //                 <Button style={{ marginTop: 16 }} onClick={() => { didInit.current = false; }} icon={<ReloadOutlined />}>Retry</Button>
// // //             </div>
// // //         );
// // //     }

// // //     /* ══════════════ RENDER ══════════════ */
// // //     return (
// // //         <div style={{ background: C.bg, minHeight: '100vh', padding: '24px 28px', fontFamily: '"DM Sans", "Segoe UI", sans-serif' }}>

// // //             {/* ── Header ── */}
// // //             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
// // //                 <div>
// // //                     <Title level={3} style={{ margin: 0, color: C.text, fontWeight: 800, letterSpacing: '-0.03em' }}>
// // //                         Task Analytics
// // //                     </Title>
// // //                     <Text style={{ color: C.muted, fontSize: 13 }}>
// // //                         {moment().format('dddd, D MMMM YYYY')} · Real-time overview
// // //                     </Text>
// // //                 </div>
// // //                 <Space>
// // //                     <Button icon={<ReloadOutlined />} onClick={handleRefresh} loading={loading}>Refresh</Button>
// // //                     <Button type="primary" onClick={() => navigate('/stt-records')} style={{ background: C.toDo, borderColor: C.toDo }}>
// // //                         All Tasks →
// // //                     </Button>
// // //                 </Space>
// // //             </div>

// // //             {/* ── Filters ── */}
// // //             <div style={{ background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`, marginBottom: 24, overflow: 'hidden' }}>
// // //                 <div
// // //                     onClick={() => setFiltersOpen(v => !v)}
// // //                     style={{ padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', borderBottom: filtersOpen ? `1px solid ${C.border}` : 'none' }}
// // //                 >
// // //                     <Space>
// // //                         <FilterOutlined style={{ color: C.toDo }} />
// // //                         <Text style={{ fontWeight: 600, color: C.text }}>Filters</Text>
// // //                         {activeFilterCount > 0 && (
// // //                             <span style={{ background: C.toDo, color: '#fff', borderRadius: 20, padding: '1px 8px', fontSize: 11, fontWeight: 700 }}>
// // //                                 {activeFilterCount} active
// // //                             </span>
// // //                         )}
// // //                     </Space>
// // //                     <Text style={{ color: C.muted, fontSize: 12 }}>{filtersOpen ? '▲ collapse' : '▼ expand'}</Text>
// // //                 </div>
// // //                 {filtersOpen && (
// // //                     <div style={{ padding: '16px 20px' }}>
// // //                         <Row gutter={[12, 12]}>
// // //                             <Col xs={24} sm={12} md={8} lg={5}>
// // //                                 <RangePicker style={{ width: '100%' }} value={dateRange} onChange={setDateRange} size="small" />
// // //                             </Col>
// // //                             {[
// // //                                 { placeholder: 'Client Group', value: selectedClientGroup, onChange: setSelectedClientGroup, items: clientGroups, labelKey: 'group_name' },
// // //                                 { placeholder: 'Client',       value: selectedClient,      onChange: setSelectedClient,      items: clients,       labelKey: 'name'       },
// // //                                 { placeholder: 'Team',         value: selectedTeam,        onChange: setSelectedTeam,        items: teams,         labelKey: 'name'       },
// // //                                 { placeholder: 'Sub Service',  value: selectedSubService,  onChange: setSelectedSubService,  items: subServices,   labelKey: 'name'       },
// // //                             ].map(({ placeholder, value, onChange, items, labelKey }) => (
// // //                                 <Col xs={24} sm={12} md={8} lg={4} key={placeholder}>
// // //                                     <Select mode="multiple" placeholder={placeholder} allowClear showSearch value={value} onChange={onChange}
// // //                                         style={{ width: '100%' }} size="small"
// // //                                         filterOption={(inp, opt) => (opt?.children ?? '').toLowerCase().includes(inp.toLowerCase())}>
// // //                                         {items.map(i => <Option key={i.id} value={i.id}>{i[labelKey]}</Option>)}
// // //                                     </Select>
// // //                                 </Col>
// // //                             ))}
// // //                             <Col xs={24} sm={12} md={4} lg={3}>
// // //                                 <Button size="small" onClick={handleClearFilters} icon={<ClearOutlined />} block>Clear</Button>
// // //                             </Col>
// // //                         </Row>
// // //                     </div>
// // //                 )}
// // //             </div>

// // //             {/* ── KPI Cards ── */}
// // //             <Row gutter={[14, 14]} style={{ marginBottom: 20, flexWrap: 'nowrap' }}>
// // //                 {[
// // //                     { title: 'Total Tasks',  value: taskCounts.allTasks,   color: C.all,        lightColor: '#f1f5f9', icon: <FcList />,                    subtitle: 'Across all statuses',          status: 'all'         },
// // //                     { title: 'To Do',        value: taskCounts.toDo,       color: C.toDo,       lightColor: '#ede9fe', icon: <ClockCircleOutlined />,         subtitle: 'Pending start',                status: 'To Do'       },
// // //                     { title: 'In Progress',  value: taskCounts.inProgress, color: C.inProgress, lightColor: '#fef3c7', icon: <MinusCircleOutlined />,         subtitle: 'Being worked on',              status: 'In Progress' },
// // //                     { title: 'Done',         value: taskCounts.done,       color: C.done,       lightColor: '#d1fae5', icon: <CheckCircleOutlined />,         subtitle: `${completionRate}% completion`, status: 'Done'        },
// // //                     { title: 'Overdue',      value: taskCounts.overdue,    color: C.overdue,    lightColor: '#fee2e2', icon: <ExclamationCircleOutlined />,   subtitle: 'Need attention',               status: 'Over Due'    },
// // //                 ].map((card) => (
// // //                     <Col key={card.title} style={{ flex: '1 1 0', minWidth: 0, display: 'flex' }}>
// // //                         <StatCard {...card} loading={loading} onClick={() => goToTasks(card.status)} />
// // //                     </Col>
// // //                 ))}
// // //             </Row>

// // //             {/* ── Overall progress bar ── */}
// // //             {taskCounts.allTasks > 0 && (
// // //                 <div style={{ background: C.surface, borderRadius: 14, padding: '16px 24px', marginBottom: 20, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
// // //                     <Text style={{ fontWeight: 600, color: C.text, whiteSpace: 'nowrap', fontSize: 13 }}>Overall Progress</Text>
// // //                     <div style={{ flex: 1, minWidth: 120 }}>
// // //                         <Progress
// // //                             percent={completionRate}
// // //                             strokeColor={{ '0%': C.toDo, '100%': C.done }}
// // //                             trailColor="#e2e8f0" strokeWidth={10} showInfo={false}
// // //                         />
// // //                     </div>
// // //                     <div style={{ display: 'flex', gap: 24, flexShrink: 0 }}>
// // //                         {[
// // //                             { label: 'Done',    val: taskCounts.done,                            color: C.done       },
// // //                             { label: 'Active',  val: taskCounts.toDo + taskCounts.inProgress,    color: C.inProgress },
// // //                             { label: 'Overdue', val: taskCounts.overdue,                         color: C.overdue    },
// // //                             { label: 'Complete',val: `${completionRate}%`,                       color: C.text       },
// // //                         ].map(({ label, val, color }) => (
// // //                             <div key={label} style={{ textAlign: 'center' }}>
// // //                                 <div style={{ fontWeight: 700, color, fontSize: 16, lineHeight: 1 }}>{val}</div>
// // //                                 <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{label}</div>
// // //                             </div>
// // //                         ))}
// // //                     </div>
// // //                 </div>
// // //             )}

// // //             {/* ── Row 1: Pie + Upcoming tasks ── */}
// // //             <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
// // //                 <Col xs={24} lg={9}>
// // //                     <div style={{ background: C.surface, borderRadius: 14, padding: '20px 20px 12px', border: `1px solid ${C.border}`, height: '100%' }}>
// // //                         <SectionTitle>Status Distribution</SectionTitle>
// // //                         {loading
// // //                             ? <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Spin /></div>
// // //                             : pieData.length > 0
// // //                                 ? <EChartsReact option={pieOption(pieData)} style={{ height: 300 }} />
// // //                                 : <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.muted }}>No data</div>
// // //                         }
// // //                     </div>
// // //                 </Col>
// // //                 <Col xs={24} lg={15}>
// // //                     <div style={{ background: C.surface, borderRadius: 14, padding: '20px', border: `1px solid ${C.border}`, height: '100%' }}>
// // //                         <SectionTitle extra={
// // //                             <Button size="small" type="link" onClick={() => goToTasks('all')} style={{ color: C.toDo, padding: 0 }}>
// // //                                 View all →
// // //                             </Button>
// // //                         }>
// // //                             Upcoming &amp; Recent Tasks
// // //                         </SectionTitle>
// // //                         <Table
// // //                             dataSource={upcomingTasks}
// // //                             columns={upcomingCols}
// // //                             rowKey="id"
// // //                             size="small"
// // //                             pagination={false}
// // //                             loading={loading}
// // //                             scroll={{ x: 'max-content' }}
// // //                             onRow={r => ({ onClick: () => goToTasks(r.status), style: { cursor: 'pointer' } })}
// // //                             locale={{ emptyText: <div style={{ padding: 32, color: C.muted }}>No tasks found 🎉</div> }}
// // //                         />
// // //                     </div>
// // //                 </Col>
// // //             </Row>

// // //             {/* ── Row 2: Time Spent — chart + full table side by side ── */}
// // //             <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
// // //                 <Col xs={24}>
// // //                     <div style={{ background: C.surface, borderRadius: 14, padding: '20px', border: `1px solid ${C.border}` }}>
// // //                         <SectionTitle
// // //                             extra={
// // //                                 <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
// // //                                     <Text style={{ fontSize: 13, color: C.muted }}>
// // //                                         Total: <strong style={{ color: C.toDo }}>{formatDurationFromMillis(totalTime)}</strong>
// // //                                     </Text>
// // //                                     <Segmented
// // //                                         size="small"
// // //                                         options={['By Client', 'By Group']}
// // //                                         value={tableView === 'client' ? 'By Client' : 'By Group'}
// // //                                         onChange={v => setTableView(v === 'By Client' ? 'client' : 'group')}
// // //                                     />
// // //                                 </div>
// // //                             }
// // //                         >
// // //                             Total Time Spent
// // //                         </SectionTitle>

// // //                         {tableView === 'client' ? (
// // //                             timePerClientData.length > 0 ? (
// // //                                 <Row gutter={[16, 16]}>
// // //                                     {/* Bar chart — top 10 */}
// // //                                     <Col xs={24} xl={12}>
// // //                                         <Text style={{ fontSize: 12, color: C.muted, display: 'block', marginBottom: 8 }}>
// // //                                             Top {topClients.length} clients by time logged
// // //                                         </Text>
// // //                                         <EChartsReact
// // //                                             option={barOption(topClients.map(r => ({ name: r.client_name, fullName: r.client_name, ms: r.total_hours })))}
// // //                                             style={{ height: 280 }}
// // //                                         />
// // //                                     </Col>
// // //                                     {/* Full table — all clients */}
// // //                                     <Col xs={24} xl={12}>
// // //                                         <Table
// // //                                             dataSource={timePerClientData}
// // //                                             rowKey="client_id"
// // //                                             size="small"
// // //                                             columns={clientTableCols}
// // //                                             pagination={{ pageSize: 8, size: 'small', showSizeChanger: false }}
// // //                                             scroll={{ x: 'max-content' }}
// // //                                             onRow={r => ({ onClick: () => handleClientClick(r.client_id), style: { cursor: 'pointer' } })}
// // //                                             summary={() => (
// // //                                                 <Table.Summary.Row style={{ background: '#f8fafc' }}>
// // //                                                     <Table.Summary.Cell index={0} colSpan={4}>
// // //                                                         <Text strong style={{ fontSize: 12 }}>Grand Total</Text>
// // //                                                     </Table.Summary.Cell>
// // //                                                     <Table.Summary.Cell index={1} align="right">
// // //                                                         <Text strong style={{ fontSize: 12, color: C.toDo }}>
// // //                                                             {formatDurationFromMillis(totalTime)}
// // //                                                         </Text>
// // //                                                     </Table.Summary.Cell>
// // //                                                 </Table.Summary.Row>
// // //                                             )}
// // //                                         />
// // //                                     </Col>
// // //                                 </Row>
// // //                             ) : (
// // //                                 <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.muted }}>
// // //                                     {loading ? <Spin /> : 'No time entries recorded'}
// // //                                 </div>
// // //                             )
// // //                         ) : (
// // //                             timePerGroup.length > 0 ? (
// // //                                 <Row gutter={[16, 16]}>
// // //                                     <Col xs={24} xl={12}>
// // //                                         <Text style={{ fontSize: 12, color: C.muted, display: 'block', marginBottom: 8 }}>
// // //                                             Top {topGroups.length} groups by time logged
// // //                                         </Text>
// // //                                         <EChartsReact
// // //                                             option={barOption(topGroups.map(r => ({ name: r.client_group_name, fullName: r.client_group_name, ms: r.total_hours })))}
// // //                                             style={{ height: 280 }}
// // //                                         />
// // //                                     </Col>
// // //                                     <Col xs={24} xl={12}>
// // //                                         <Table
// // //                                             dataSource={timePerGroup}
// // //                                             rowKey="client_group_name"
// // //                                             size="small"
// // //                                             columns={groupTableCols}
// // //                                             pagination={{ pageSize: 8, size: 'small', showSizeChanger: false }}
// // //                                             scroll={{ x: 'max-content' }}
// // //                                             summary={() => (
// // //                                                 <Table.Summary.Row style={{ background: '#f8fafc' }}>
// // //                                                     <Table.Summary.Cell index={0} colSpan={3}>
// // //                                                         <Text strong style={{ fontSize: 12 }}>Grand Total</Text>
// // //                                                     </Table.Summary.Cell>
// // //                                                     <Table.Summary.Cell index={1} align="right">
// // //                                                         <Text strong style={{ fontSize: 12, color: C.toDo }}>
// // //                                                             {formatDurationFromMillis(timePerGroup.reduce((s, r) => s + r.total_hours, 0))}
// // //                                                         </Text>
// // //                                                     </Table.Summary.Cell>
// // //                                                 </Table.Summary.Row>
// // //                                             )}
// // //                                         />
// // //                                     </Col>
// // //                                 </Row>
// // //                             ) : (
// // //                                 <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.muted }}>
// // //                                     {loading ? <Spin /> : 'No time entries recorded'}
// // //                                 </div>
// // //                             )
// // //                         )}
// // //                     </div>
// // //                 </Col>
// // //             </Row>

// // //             {/* ── Client Detail Modal ── */}
// // //             <Modal
// // //                 open={clientModalVisible}
// // //                 onCancel={() => { setClientModalVisible(false); setDrillVisible(false); }}
// // //                 footer={null}
// // //                 width={900}
// // //                 styles={{ body: { padding: '24px', background: C.bg } }}
// // //                 title={
// // //                     <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
// // //                         <div style={{ width: 38, height: 38, borderRadius: 10, background: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.toDo, fontWeight: 800, fontSize: 16 }}>
// // //                             {(selectedClientInfo?.name || 'C')[0]}
// // //                         </div>
// // //                         <div>
// // //                             <div style={{ fontWeight: 700, color: C.text, fontSize: 15 }}>{selectedClientInfo?.name || 'Client'}</div>
// // //                             <div style={{ fontSize: 12, color: C.muted }}>
// // //                                 {getGroupName(selectedClientInfo)} · {getSpocName(selectedClientInfo)}
// // //                             </div>
// // //                         </div>
// // //                     </div>
// // //                 }
// // //             >
// // //                 {clientModalLoading ? (
// // //                     <div style={{ textAlign: 'center', padding: 60 }}><Spin size="large" /></div>
// // //                 ) : clientSummary ? (
// // //                     <>
// // //                         {/* Mini KPIs */}
// // //                         <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
// // //                             {[
// // //                                 { label: 'Done Tasks',  value: clientSummary.done_count,                               color: C.done,       bg: '#d1fae5', isText: false },
// // //                                 { label: 'Total Time',  value: formatDurationFromMillis(clientSummary.total_hours_ms),  color: C.toDo,       bg: '#ede9fe', isText: true  },
// // //                                 { label: 'Employees',   value: clientSummary.employees?.length || 0,                   color: C.inProgress, bg: '#fef3c7', isText: false },
// // //                                 { label: 'Services',    value: clientSummary.sub_services?.length || 0,                color: '#0ea5e9',    bg: '#e0f2fe', isText: false },
// // //                             ].map(({ label, value, color, bg, isText }) => (
// // //                                 <Col span={6} key={label}>
// // //                                     <div style={{ background: bg, borderRadius: 12, padding: '14px 16px', textAlign: 'center' }}>
// // //                                         {isText
// // //                                             ? <div style={{ fontSize: 20, fontWeight: 800, color, lineHeight: 1.1 }}>{value}</div>
// // //                                             : <CountUp end={value} duration={1.2} style={{ fontSize: 28, fontWeight: 800, color, lineHeight: 1 }} />
// // //                                         }
// // //                                         <div style={{ fontSize: 11, color: C.muted, marginTop: 4, fontWeight: 600 }}>{label}</div>
// // //                                     </div>
// // //                                 </Col>
// // //                             ))}
// // //                         </Row>

// // //                         {/* Employee Hours + Service Breakdown charts */}
// // //                         <Row gutter={[12, 12]}>
// // //                             {clientSummary.employees?.length > 0 && (
// // //                                 <Col xs={24} md={clientSummary.sub_services?.length > 0 ? 12 : 24}>
// // //                                     <div style={{ background: C.surface, borderRadius: 12, padding: 16, border: `1px solid ${C.border}` }}>
// // //                                         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
// // //                                             <Text style={{ fontWeight: 700, fontSize: 13 }}>Employee Hours</Text>
// // //                                             <Text style={{ fontSize: 11, color: C.muted }}>Click bar for details</Text>
// // //                                         </div>
// // //                                         <EChartsReact
// // //                                             option={hBarOption(clientSummary.employees, '#818cf8', '#6366f1')}
// // //                                             style={{ height: Math.max(140, clientSummary.employees.length * 32 + 20) }}
// // //                                             onEvents={{
// // //                                                 click: (params) => {
// // //                                                     const reversed = [...clientSummary.employees].reverse();
// // //                                                     const emp = reversed[params.dataIndex];
// // //                                                     if (!emp) return;
// // //                                                     const services = clientSummary.per_employee_services?.[emp.name] || [];
// // //                                                     setDrillTitle(emp.name);
// // //                                                     setDrillData(services);
// // //                                                     setDrillType('employee');
// // //                                                     setDrillVisible(true);
// // //                                                 },
// // //                                             }}
// // //                                         />
// // //                                     </div>
// // //                                 </Col>
// // //                             )}
// // //                             {clientSummary.sub_services?.length > 0 && (
// // //                                 <Col xs={24} md={clientSummary.employees?.length > 0 ? 12 : 24}>
// // //                                     <div style={{ background: C.surface, borderRadius: 12, padding: 16, border: `1px solid ${C.border}` }}>
// // //                                         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
// // //                                             <Text style={{ fontWeight: 700, fontSize: 13 }}>Service Breakdown</Text>
// // //                                             <Text style={{ fontSize: 11, color: C.muted }}>Click bar for details</Text>
// // //                                         </div>
// // //                                         <EChartsReact
// // //                                             option={hBarOption(clientSummary.sub_services, '#06b6d4', '#0ea5e9')}
// // //                                             style={{ height: Math.max(140, clientSummary.sub_services.length * 32 + 20) }}
// // //                                             onEvents={{
// // //                                                 click: (params) => {
// // //                                                     const reversed = [...clientSummary.sub_services].reverse();
// // //                                                     const svc = reversed[params.dataIndex];
// // //                                                     if (!svc) return;
// // //                                                     const employees = clientSummary.per_service_employees?.[svc.name] || [];
// // //                                                     setDrillTitle(svc.name);
// // //                                                     setDrillData(employees);
// // //                                                     setDrillType('service');
// // //                                                     setDrillVisible(true);
// // //                                                 },
// // //                                             }}
// // //                                         />
// // //                                     </div>
// // //                                 </Col>
// // //                             )}
// // //                         </Row>
// // //                     </>
// // //                 ) : (
// // //                     <div style={{ textAlign: 'center', padding: 40, color: C.muted }}>No data available</div>
// // //                 )}
// // //             </Modal>

// // //             {/* ── Drill-down Panel — rendered via Portal, no mask conflict ── */}
// // //             {drillVisible && typeof document !== 'undefined' && (() => {
// // //                 const color    = drillType === 'employee' ? '#0ea5e9' : '#6366f1';
// // //                 const colorEnd = drillType === 'employee' ? '#06b6d4' : '#818cf8';

// // //                 const panel = (
// // //                     <div style={{
// // //                         position: 'fixed',
// // //                         top: 100,
// // //                         left: 'calc(50% + 466px)',
// // //                         width: 360,
// // //                         maxHeight: '78vh',
// // //                         zIndex: 1100,
// // //                         display: 'flex',
// // //                         flexDirection: 'column',
// // //                         background: C.surface,
// // //                         borderRadius: 16,
// // //                         boxShadow: '0 24px 64px rgba(0,0,0,0.20), 0 4px 16px rgba(0,0,0,0.10)',
// // //                         border: `1px solid ${C.border}`,
// // //                         animation: 'drillIn 0.32s cubic-bezier(0.34,1.56,0.64,1) both',
// // //                         overflow: 'hidden',
// // //                     }}>
// // //                         <style>{`
// // //                             @keyframes drillIn {
// // //                                 0%   { opacity:0; transform: translateX(-18px) translateY(10px) scale(0.94); }
// // //                                 60%  { opacity:1; transform: translateX(3px)   translateY(-2px) scale(1.01); }
// // //                                 100% { opacity:1; transform: translateX(0)     translateY(0)    scale(1);    }
// // //                             }
// // //                             .drill-item-enter {
// // //                                 animation: drillItemIn 0.22s ease both;
// // //                             }
// // //                             @keyframes drillItemIn {
// // //                                 from { opacity:0; transform: translateX(-10px); }
// // //                                 to   { opacity:1; transform: translateX(0); }
// // //                             }
// // //                             .drill-close-btn:hover {
// // //                                 background: #e2e8f0 !important;
// // //                                 color: #0f172a !important;
// // //                                 transform: scale(1.1);
// // //                             }
// // //                             .drill-close-btn {
// // //                                 transition: background 0.15s, color 0.15s, transform 0.15s !important;
// // //                             }
// // //                         `}</style>

// // //                         {/* Header */}
// // //                         <div style={{
// // //                             display: 'flex', alignItems: 'center', justifyContent: 'space-between',
// // //                             padding: '14px 18px',
// // //                             borderBottom: `1px solid ${C.border}`,
// // //                             background: drillType === 'employee' ? '#f5f3ff' : '#ecfeff',
// // //                             flexShrink: 0,
// // //                         }}>
// // //                             <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
// // //                                 <div style={{
// // //                                     width: 32, height: 32, borderRadius: 8,
// // //                                     background: drillType === 'employee' ? '#ede9fe' : '#cffafe',
// // //                                     display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15,
// // //                                 }}>
// // //                                     {drillType === 'employee' ? '🛠' : '👤'}
// // //                                 </div>
// // //                                 <div>
// // //                                     <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
// // //                                         {drillType === 'employee' ? 'Services by' : 'Employees on'}
// // //                                     </div>
// // //                                     <div style={{ fontSize: 13, fontWeight: 700, color: C.text, lineHeight: 1.3, maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
// // //                                         {drillTitle}
// // //                                     </div>
// // //                                 </div>
// // //                             </div>
// // //                             <button
// // //                                 onClick={() => setDrillVisible(false)}
// // //                                 className="drill-close-btn"
// // //                                 style={{
// // //                                     background: 'none', border: 'none', cursor: 'pointer',
// // //                                     color: C.muted, fontSize: 20, lineHeight: 1,
// // //                                     padding: '4px 8px', borderRadius: 8,
// // //                                     display: 'flex', alignItems: 'center', justifyContent: 'center',
// // //                                     flexShrink: 0,
// // //                                 }}
// // //                             >
// // //                                 ×
// // //                             </button>
// // //                         </div>

// // //                         {/* Body — scrollable */}
// // //                         <div style={{ overflowY: 'auto', padding: '16px 18px', flex: 1 }}>
// // //                             {drillData.length === 0 ? (
// // //                                 <div style={{ textAlign: 'center', padding: '32px 0', color: C.muted, fontSize: 13 }}>No data available</div>
// // //                             ) : (
// // //                                 <>
// // //                                     <EChartsReact
// // //                                         option={hBarOption(drillData, colorEnd, color)}
// // //                                         style={{ height: Math.max(90, drillData.length * 30 + 16) }}
// // //                                     />
// // //                                     <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
// // //                                         {[...drillData].sort((a, b) => b.ms - a.ms).map((d, i) => {
// // //                                             const maxMs = drillData[0]?.ms || 1;
// // //                                             const pct   = Math.round((d.ms / maxMs) * 100);
// // //                                             return (
// // //                                                 <div key={d.name} className="drill-item-enter" style={{
// // //                                                     padding: '8px 12px', borderRadius: 10,
// // //                                                     background: C.bg, border: `1px solid ${C.border}`,
// // //                                                     animationDelay: `${0.18 + i * 0.055}s`,
// // //                                                 }}>
// // //                                                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
// // //                                                         <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
// // //                                                             <span style={{ fontSize: 10, fontWeight: 700, color: C.muted, flexShrink: 0 }}>#{i + 1}</span>
// // //                                                             <span title={d.name} style={{
// // //                                                                 fontSize: 12, fontWeight: 500, color: C.text,
// // //                                                                 overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
// // //                                                                 maxWidth: 210,
// // //                                                             }}>{d.name}</span>
// // //                                                         </div>
// // //                                                         <span style={{ fontSize: 11, fontWeight: 700, color, flexShrink: 0, marginLeft: 8 }}>
// // //                                                             {formatDurationFromMillis(d.ms)}
// // //                                                         </span>
// // //                                                     </div>
// // //                                                     <div style={{ height: 3, background: C.border, borderRadius: 4 }}>
// // //                                                         <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 4, transition: 'width 0.5s ease' }} />
// // //                                                     </div>
// // //                                                 </div>
// // //                                             );
// // //                                         })}
// // //                                     </div>
// // //                                 </>
// // //                             )}
// // //                         </div>
// // //                     </div>
// // //                 );

// // //                 return ReactDOM.createPortal(panel, document.body);
// // //             })()}

// // //         </div>
// // //     );
// // // };

// // // export default TaskDashboard;


// // import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
// // import ReactDOM from 'react-dom';
// // import {
// //     Card, Col, Row, Typography, message, Table, DatePicker,
// //     Select, Space, Button, Segmented, Modal, Spin, Progress, Tooltip,
// // } from 'antd';
// // import { api } from '../../../services/api';
// // import EChartsReact from 'echarts-for-react';
// // import CountUp from 'react-countup';
// // import {
// //     ClockCircleOutlined, CheckCircleOutlined,
// //     MinusCircleOutlined, ExclamationCircleOutlined,
// //     FilterOutlined, ClearOutlined, ReloadOutlined,
// // } from '@ant-design/icons';
// // import { FcList } from 'react-icons/fc';
// // import moment from 'moment';
// // import { formatDurationFromMillis } from './STT_Records';
// // import { useNavigate } from 'react-router-dom';

// // const { Title, Text } = Typography;
// // const { RangePicker } = DatePicker;
// // const { Option } = Select;

// // /* ─── Design tokens ─────────────────────────────────────────── */
// // const C = {
// //     done:       '#10b981',
// //     inProgress: '#f59e0b',
// //     overdue:    '#ef4444',
// //     toDo:       '#6366f1',
// //     all:        '#0f172a',
// //     bg:         '#f1f5f9',
// //     surface:    '#ffffff',
// //     border:     '#e2e8f0',
// //     text:       '#0f172a',
// //     muted:      '#64748b',
// // };

// // const STATUS_META = {
// //     'Done':        { color: C.done,       light: '#d1fae5' },
// //     'In Progress': { color: C.inProgress, light: '#fef3c7' },
// //     'Over Due':    { color: C.overdue,    light: '#fee2e2' },
// //     'To Do':       { color: C.toDo,       light: '#ede9fe' },
// // };

// // /* ─── Stat Card ─────────────────────────────────────────────── */
// // const StatCard = ({ title, value, color, lightColor, icon, subtitle, onClick, loading }) => (
// //     <div
// //         onClick={onClick}
// //         style={{
// //             background: C.surface, borderRadius: 16, padding: '20px 22px',
// //             cursor: 'pointer', border: `1px solid ${C.border}`,
// //             borderTop: `4px solid ${color}`,
// //             transition: 'all 0.2s', flex: 1, minWidth: 0,
// //             boxShadow: '0 1px 4px rgba(0,0,0,0.06)', position: 'relative', overflow: 'hidden',
// //         }}
// //         onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = `0 10px 28px ${color}28`; }}
// //         onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)'; }}
// //     >
// //         <div style={{ position: 'absolute', right: 18, top: 18, width: 44, height: 44, borderRadius: 12, background: lightColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color }}>
// //             {icon}
// //         </div>
// //         <Text style={{ fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: '0.07em', textTransform: 'uppercase' }}>
// //             {title}
// //         </Text>
// //         <div style={{ marginTop: 8 }}>
// //             {loading
// //                 ? <div style={{ fontSize: 28, fontWeight: 700, color: C.muted }}>—</div>
// //                 : <CountUp end={value} duration={1.6} style={{ fontSize: 34, fontWeight: 800, color, lineHeight: 1 }} />
// //             }
// //         </div>
// //         {subtitle && <Text style={{ fontSize: 11, color: C.muted, marginTop: 6, display: 'block' }}>{subtitle}</Text>}
// //     </div>
// // );

// // /* ─── Section header ────────────────────────────────────────── */
// // const SectionTitle = ({ children, extra }) => (
// //     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
// //         <Text style={{ fontSize: 14, fontWeight: 700, color: C.text, letterSpacing: '-0.01em' }}>{children}</Text>
// //         {extra}
// //     </div>
// // );

// // /* ─── Status Badge ──────────────────────────────────────────── */
// // const StatusBadge = ({ status }) => {
// //     const meta = STATUS_META[status] || { color: C.muted, light: '#f1f5f9' };
// //     return (
// //         <span style={{
// //             background: meta.light, color: meta.color,
// //             borderRadius: 20, padding: '2px 10px',
// //             fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap',
// //         }}>
// //             {status}
// //         </span>
// //     );
// // };

// // /* ─── Chart helpers ─────────────────────────────────────────── */
// // const pieOption = (data) => ({
// //     backgroundColor: 'transparent',
// //     tooltip: {
// //         trigger: 'item',
// //         formatter: '{b}: <b>{c}</b> ({d}%)',
// //         backgroundColor: '#1e293b', borderColor: 'transparent',
// //         textStyle: { color: '#f1f5f9', fontSize: 13 },
// //     },
// //     legend: {
// //         orient: 'horizontal', bottom: 0, left: 'center',
// //         textStyle: { color: C.muted, fontSize: 12 },
// //         itemWidth: 10, itemHeight: 10,
// //     },
// //     series: [{
// //         type: 'pie', radius: ['42%', '70%'], center: ['50%', '44%'],
// //         avoidLabelOverlap: true,
// //         itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
// //         label: { show: true, formatter: '{b}\n{c}', fontSize: 11, color: C.muted, lineHeight: 16 },
// //         labelLine: { length: 10, length2: 6 },
// //         data: data.map(d => ({ ...d, itemStyle: { color: STATUS_META[d.name]?.color || '#94a3b8' } })),
// //         emphasis: { itemStyle: { shadowBlur: 12, shadowColor: 'rgba(0,0,0,0.15)' } },
// //     }],
// // });

// // const barOption = (data) => ({
// //     backgroundColor: 'transparent',
// //     tooltip: {
// //         trigger: 'axis', axisPointer: { type: 'shadow' },
// //         backgroundColor: '#1e293b', borderColor: 'transparent',
// //         textStyle: { color: '#f1f5f9', fontSize: 12 },
// //         formatter: (params) => {
// //             const p = params[0];
// //             const orig = data[p.dataIndex];
// //             return `<b>${orig?.fullName || p.name}</b><br/>${formatDurationFromMillis(p.value)}`;
// //         },
// //     },
// //     grid: { top: 16, right: 16, bottom: 48, left: 16, containLabel: true },
// //     xAxis: {
// //         type: 'category',
// //         data: data.map(d => d.name.length > 13 ? d.name.slice(0, 12) + '…' : d.name),
// //         axisLabel: { color: C.muted, fontSize: 11, rotate: data.length > 5 ? 30 : 0, interval: 0 },
// //         axisLine: { lineStyle: { color: C.border } },
// //         axisTick: { show: false },
// //     },
// //     yAxis: {
// //         type: 'value',
// //         axisLabel: { color: C.muted, fontSize: 10, formatter: v => formatDurationFromMillis(v) },
// //         splitLine: { lineStyle: { color: C.border, type: 'dashed' } },
// //         axisLine: { show: false }, axisTick: { show: false },
// //     },
// //     series: [{
// //         type: 'bar',
// //         data: data.map(d => ({
// //             value: d.ms,
// //             itemStyle: {
// //                 color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: '#6366f1' }, { offset: 1, color: '#818cf8' }] },
// //                 borderRadius: [6, 6, 0, 0],
// //             },
// //         })),
// //         barMaxWidth: 48,
// //         emphasis: {
// //             itemStyle: {
// //                 color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: '#4f46e5' }, { offset: 1, color: '#6366f1' }] },
// //             },
// //         },
// //     }],
// // });

// // const hBarOption = (data, colorStart = '#06b6d4', colorEnd = '#0ea5e9') => {
// //     // ECharts renders category axis bottom-up, so reverse to show highest at top
// //     const reversed = [...data].reverse();
// //     return {
// //     backgroundColor: 'transparent',
// //     tooltip: {
// //         trigger: 'axis', axisPointer: { type: 'shadow' },
// //         backgroundColor: '#1e293b', borderColor: 'transparent',
// //         textStyle: { color: '#f1f5f9', fontSize: 12 },
// //         formatter: (params) => `<b>${params[0].name}</b><br/>${formatDurationFromMillis(params[0].value)}`,
// //     },
// //     grid: { top: 4, right: 96, bottom: 4, left: 8, containLabel: true },
// //     xAxis: {
// //         type: 'value',
// //         show: false,
// //         splitLine: { show: false },
// //     },
// //     yAxis: {
// //         type: 'category',
// //         data: reversed.map(d => d.name?.length > 18 ? d.name.slice(0, 17) + '…' : d.name || 'N/A'),
// //         axisLabel: { color: C.muted, fontSize: 11 },
// //         axisLine: { show: false }, axisTick: { show: false },
// //     },
// //     series: [{
// //         type: 'bar',
// //         data: reversed.map(d => ({
// //             value: d.ms || 0,
// //             itemStyle: {
// //                 color: { type: 'linear', x: 0, y: 0, x2: 1, y2: 0, colorStops: [{ offset: 0, color: colorStart }, { offset: 1, color: colorEnd }] },
// //                 borderRadius: [0, 6, 6, 0],
// //             },
// //         })),
// //         barMaxWidth: 18,
// //         label: {
// //             show: true, position: 'right',
// //             formatter: p => formatDurationFromMillis(p.value),
// //             color: C.muted, fontSize: 10,
// //         },
// //     }],
// //     };
// // };

// // /* ══════════════ MAIN COMPONENT ══════════════ */
// // const TaskDashboard = () => {
// //     const navigate = useNavigate();

// //     const [loading,             setLoading]             = useState(true);
// //     const [dashboardData,       setDashboardData]       = useState(null);
// //     const [error,               setError]               = useState(null);
// //     const [dateRange,           setDateRange]           = useState(null);
// //     const [clients,             setClients]             = useState([]);
// //     const [selectedClient,      setSelectedClient]      = useState([]);
// //     const [teams,               setTeams]               = useState([]);
// //     const [selectedTeam,        setSelectedTeam]        = useState([]);
// //     const [clientGroups,        setClientGroups]        = useState([]);
// //     const [selectedClientGroup, setSelectedClientGroup] = useState([]);
// //     const [allSpocs,            setAllSpocs]            = useState([]);
// //     const [subServices,         setSubServices]         = useState([]);
// //     const [selectedSubService,  setSelectedSubService]  = useState([]);
// //     const [tableView,           setTableView]           = useState('client');
// //     const [taskCounts,          setTaskCounts]          = useState({ allTasks: 0, done: 0, toDo: 0, overdue: 0, inProgress: 0 });
// //     const [filtersOpen,         setFiltersOpen]         = useState(false);
// //     const [timePerClientData,   setTimePerClientData]   = useState([]);

// //     // Client modal
// //     const [clientModalVisible,  setClientModalVisible]  = useState(false);
// //     const [clientModalLoading,  setClientModalLoading]  = useState(false);
// //     const [selectedClientInfo,  setSelectedClientInfo]  = useState(null);
// //     const [clientSummary,       setClientSummary]       = useState(null);

// //     // Drill-down modal (employee → services  /  service → employees)
// //     const [drillVisible,        setDrillVisible]        = useState(false);
// //     const [drillTitle,          setDrillTitle]          = useState('');
// //     const [drillData,           setDrillData]           = useState([]);  // [{name, ms}]
// //     const [drillType,           setDrillType]           = useState('');  // 'employee' | 'service'

// //     // Ref to track if component is still mounted (avoids state-on-unmount warnings)
// //     const mountedRef = useRef(true);
// //     useEffect(() => { mountedRef.current = true; return () => { mountedRef.current = false; }; }, []);

// //     // ── Refs for stable lookup functions that don't re-trigger effects ──────
// //     const clientGroupsRef = useRef([]);
// //     const allSpocsRef     = useRef([]);
// //     useEffect(() => { clientGroupsRef.current = clientGroups; }, [clientGroups]);
// //     useEffect(() => { allSpocsRef.current = allSpocs; }, [allSpocs]);

// //     const getSpocName = useCallback((client) => {
// //         if (!client) return 'N/A';
// //         if (client.primary_spoc_name) return client.primary_spoc_name;
// //         const groups = clientGroupsRef.current;
// //         const group = groups.find(g => g.clients?.some(cg => (typeof cg === 'object' ? cg.id : cg) === client.id));
// //         if (group?.primary_spoc_name) return group.primary_spoc_name;
// //         if (typeof client.primary_spoc === 'number') {
// //             const spoc = allSpocsRef.current.find(s => s.id === client.primary_spoc);
// //             if (spoc) return `${spoc.first_name || ''} ${spoc.last_name || ''}`.trim() || spoc.user?.email || 'N/A';
// //         }
// //         return 'N/A';
// //     }, []); // stable — reads from refs

// //     const getGroupName = useCallback((client) => {
// //         if (!client) return 'N/A';
// //         const groups = clientGroupsRef.current;
// //         const group = groups.find(g => g.clients?.some(cg => (typeof cg === 'object' ? cg.id : cg) === client.id));
// //         return group?.group_name || 'N/A';
// //     }, []); // stable

// //     /* ── Build params ── */
// //     const buildParams = (filters = {}) => {
// //         const p = {
// //             start_date:      filters.startDate?.format('YYYY-MM-DD'),
// //             end_date:        filters.endDate?.format('YYYY-MM-DD'),
// //             client_id:       filters.clientId?.length      ? filters.clientId.join(',')       : undefined,
// //             team_id:         filters.teamId?.length        ? filters.teamId.join(',')         : undefined,
// //             client_group_id: filters.clientGroupId?.length ? filters.clientGroupId.join(',') : undefined,
// //             sub_service_id:  filters.subServiceId?.length  ? filters.subServiceId.join(',')  : undefined,
// //         };
// //         Object.keys(p).forEach(k => p[k] === undefined && delete p[k]);
// //         return p;
// //     };

// //     /* ── Core fetch functions (stable — no deps that change) ── */
// //     const fetchDashboard = useCallback(async (params) => {
// //         if (!mountedRef.current) return;
// //         setLoading(true);
// //         try {
// //             const res = await api.get('/clients/tasks/dashboard_summary/', { params });
// //             if (mountedRef.current) setDashboardData(res.data);
// //         } catch (err) {
// //             console.error(err);
// //             if (mountedRef.current) {
// //                 setError('Failed to load dashboard data.');
// //                 message.error('Failed to load dashboard.');
// //             }
// //         } finally {
// //             if (mountedRef.current) setLoading(false);
// //         }
// //     }, []); // no deps — intentionally stable

// //     const fetchTimePerClient = useCallback(async (params, clientsList) => {
// //         if (!mountedRef.current) return;
// //         try {
// //             const res = await api.get('/clients/tasks/time_per_client/', { params });
// //             if (!mountedRef.current) return;
// //             setTimePerClientData((res.data || []).map(row => {
// //                 const c = (clientsList || []).find(x => x.id === row.client_id);
// //                 return {
// //                     ...row,
// //                     total_hours: row.total_hours_ms,
// //                     group_name:  c ? getGroupName(c)  : 'N/A',
// //                     spoc_name:   c ? getSpocName(c)   : 'N/A',
// //                 };
// //             }));
// //         } catch (err) {
// //             console.error('fetchTimePerClient error:', err);
// //         }
// //     }, [getGroupName, getSpocName]); // stable — getGroupName/getSpocName are stable

// //     /* ── Initial load — runs ONCE ── */
// //     const didInit = useRef(false);
// //     useEffect(() => {
// //         if (didInit.current) return;
// //         didInit.current = true;

// //         (async () => {
// //             setLoading(true);
// //             try {
// //                 const [cR, tR, gR, sR, ssR] = await Promise.all([
// //                     api.get('/clients/clients/?page_size=500'),
// //                     api.get('/employee/teams/'),
// //                     api.get('/clients/client-groups/'),
// //                     api.get('/employee/employees/'),
// //                     api.get('/clients/subservices/'),
// //                 ]);
// //                 if (!mountedRef.current) return;
// //                 const cl = cR.data.results || cR.data;
// //                 const gr = gR.data.results || gR.data;
// //                 const sp = sR.data.results || sR.data;
// //                 setClients(cl);
// //                 setTeams(tR.data.results || tR.data);
// //                 setClientGroups(gr);
// //                 setAllSpocs(sp);
// //                 setSubServices(ssR.data.results || ssR.data);
// //                 // Set refs immediately so enrichment in fetchTimePerClient works
// //                 clientGroupsRef.current = gr;
// //                 allSpocsRef.current     = sp;
// //                 await Promise.all([
// //                     fetchDashboard({}),
// //                     fetchTimePerClient({}, cl),
// //                 ]);
// //             } catch (err) {
// //                 console.error('fetchInitialData error:', err);
// //                 if (mountedRef.current) setError('Failed to load initial data.');
// //             } finally {
// //                 if (mountedRef.current) setLoading(false);
// //             }
// //         })();
// //     }, [fetchDashboard, fetchTimePerClient]);

// //     /* ── Re-fetch ONLY when user changes filters ── */
// //     const isFirstRender = useRef(true);
// //     useEffect(() => {
// //         if (isFirstRender.current) { isFirstRender.current = false; return; }
// //         const [startDate, endDate] = dateRange || [null, null];
// //         const f = { startDate, endDate, clientId: selectedClient, teamId: selectedTeam, clientGroupId: selectedClientGroup, subServiceId: selectedSubService };
// //         const p = buildParams(f);
// //         fetchDashboard(p);
// //         fetchTimePerClient(p, clients);
// //         // eslint-disable-next-line react-hooks/exhaustive-deps
// //     }, [dateRange, selectedClient, selectedTeam, selectedClientGroup, selectedSubService]);

// //     /* ── Derive counts ── */
// //     useEffect(() => {
// //         if (!dashboardData?.status_counts) return;
// //         const sc = dashboardData.status_counts;
// //         setTaskCounts({
// //             allTasks:   (sc['To Do'] || 0) + (sc['In Progress'] || 0) + (sc['Done'] || 0) + (sc['Over Due'] || 0),
// //             done:       sc['Done']        || 0,
// //             toDo:       sc['To Do']       || 0,
// //             inProgress: sc['In Progress'] || 0,
// //             overdue:    sc['Over Due']    || 0,
// //         });
// //     }, [dashboardData]);

// //     /* ── Derived data ── */
// //     const timePerGroup = useMemo(() =>
// //         timePerClientData.reduce((acc, row) => {
// //             if (!row.group_name || row.group_name === 'N/A') return acc;
// //             const ex = acc.find(g => g.client_group_name === row.group_name);
// //             if (ex) ex.total_hours += row.total_hours;
// //             else acc.push({ client_group_name: row.group_name, spoc_name: row.spoc_name, total_hours: row.total_hours });
// //             return acc;
// //         }, [])
// //     , [timePerClientData]);

// //     const pieData = useMemo(() =>
// //         dashboardData?.status_counts
// //             ? Object.entries(dashboardData.status_counts).filter(([k, v]) => k !== 'total' && v > 0).map(([name, value]) => ({ name, value }))
// //             : []
// //     , [dashboardData]);

// //     const topClients = useMemo(() => [...timePerClientData].sort((a, b) => b.total_hours - a.total_hours).slice(0, 10), [timePerClientData]);
// //     const topGroups  = useMemo(() => [...timePerGroup].sort((a, b) => b.total_hours - a.total_hours).slice(0, 10), [timePerGroup]);

// //     const totalTime       = useMemo(() => timePerClientData.reduce((s, r) => s + (r.total_hours || 0), 0), [timePerClientData]);
// //     const completionRate  = taskCounts.allTasks ? Math.round((taskCounts.done / taskCounts.allTasks) * 100) : 0;
// //     const activeFilterCount = [selectedClient, selectedTeam, selectedClientGroup, selectedSubService].filter(a => a.length).length + (dateRange ? 1 : 0);

// //     /* ── Clear filters ── */
// //     const handleClearFilters = () => {
// //         setDateRange(null);
// //         setSelectedClient([]);
// //         setSelectedTeam([]);
// //         setSelectedClientGroup([]);
// //         setSelectedSubService([]);
// //     };

// //     /* ── Navigate with filters ── */
// //     const goToTasks = (status) => {
// //         const params = new URLSearchParams();
// //         if (status !== 'all') params.set('status', status);
// //         const [s, e] = dateRange || [null, null];
// //         if (s) params.set('start_date', s.format('YYYY-MM-DD'));
// //         if (e) params.set('end_date',   e.format('YYYY-MM-DD'));
// //         if (selectedClient?.length)      params.set('client_id',      selectedClient.join(','));
// //         if (selectedTeam?.length)        params.set('team_id',         selectedTeam.join(','));
// //         if (selectedClientGroup?.length) params.set('client_group_id', selectedClientGroup.join(','));
// //         if (selectedSubService?.length)  params.set('sub_service_id',  selectedSubService.join(','));
// //         navigate(`/stt-records?${params.toString()}`);
// //     };

// //     /* ── Client modal ── */
// //     const handleClientClick = useCallback(async (clientId) => {
// //         const client = clients.find(c => c.id === clientId);
// //         setSelectedClientInfo(client);
// //         setClientSummary(null);
// //         setDrillVisible(false);   // reset any open drill panel
// //         setDrillData([]);
// //         setClientModalVisible(true);
// //         setClientModalLoading(true);
// //         try {
// //             const [startDate, endDate] = dateRange || [null, null];
// //             const params = { client_id: clientId };
// //             if (startDate) params.start_date = startDate.format('YYYY-MM-DD');
// //             if (endDate)   params.end_date   = endDate.format('YYYY-MM-DD');
// //             const res = await api.get('/clients/tasks/client_task_summary/', { params });
// //             if (mountedRef.current) setClientSummary(res.data);
// //         } catch (err) {
// //             console.error(err);
// //             message.error('Failed to load client details');
// //         } finally {
// //             if (mountedRef.current) setClientModalLoading(false);
// //         }
// //     }, [clients, dateRange]);

// //     /* ── Refresh handler ── */
// //     const handleRefresh = useCallback(() => {
// //         const [startDate, endDate] = dateRange || [null, null];
// //         const f = { startDate, endDate, clientId: selectedClient, teamId: selectedTeam, clientGroupId: selectedClientGroup, subServiceId: selectedSubService };
// //         const p = buildParams(f);
// //         fetchDashboard(p);
// //         fetchTimePerClient(p, clients);
// //     }, [dateRange, selectedClient, selectedTeam, selectedClientGroup, selectedSubService, clients, fetchDashboard, fetchTimePerClient]);

// //     /* ── Upcoming tasks ── */
// //     const upcomingTasks = useMemo(() => (dashboardData?.tasks || []).slice(0, 8), [dashboardData]);
// //     const upcomingCols = [
// //         {
// //             title: 'Task ID', dataIndex: 'task_id', key: 'task_id', width: 140,
// //             render: v => <Text style={{ fontFamily: 'monospace', fontSize: 11, color: C.muted }}>{v}</Text>,
// //         },
// //         { title: 'Client', dataIndex: 'client_name', key: 'client_name', ellipsis: true },
// //         { title: 'Service', dataIndex: 'sub_service_name', key: 'sub_service_name', ellipsis: true },
// //         {
// //             title: 'Due', dataIndex: 'due_date', key: 'due_date', width: 100,
// //             render: d => {
// //                 if (!d) return <span style={{ color: C.muted }}>—</span>;
// //                 const m = moment(d);
// //                 const isLate = m.isBefore(moment(), 'day');
// //                 return <span style={{ color: isLate ? C.overdue : C.muted, fontWeight: isLate ? 600 : 400, fontSize: 12 }}>{m.format('DD MMM YY')}</span>;
// //             },
// //         },
// //         {
// //             title: 'Status', dataIndex: 'status', key: 'status', width: 120,
// //             render: (_, r) => {
// //                 const eff = r.due_date && moment(r.due_date).isBefore(moment(), 'day') && r.status !== 'Done' ? 'Over Due' : r.status;
// //                 return <StatusBadge status={eff} />;
// //             },
// //         },
// //     ];

// //     /* ── Table columns: client ── */
// //     const clientTableCols = [
// //         {
// //             title: '#', render: (_, __, i) => <Text style={{ color: C.muted, fontSize: 12 }}>{i + 1}</Text>, width: 44,
// //         },
// //         {
// //             title: 'Client', dataIndex: 'client_name', key: 'client_name',
// //             width: 180,
// //             render: v => (
// //                 <Tooltip title={v} placement="topLeft">
// //                     <Text style={{
// //                         fontWeight: 500, fontSize: 13,
// //                         maxWidth: 160, display: 'block',
// //                         overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
// //                     }}>
// //                         {v}
// //                     </Text>
// //                 </Tooltip>
// //             ),
// //             sorter: (a, b) => a.client_name.localeCompare(b.client_name),
// //         },
// //         {
// //             title: 'Group', dataIndex: 'group_name', key: 'group_name',
// //             width: 130,
// //             render: v => (
// //                 <Tooltip title={v} placement="topLeft">
// //                     <Text style={{ fontSize: 12, color: C.muted, maxWidth: 120, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
// //                         {v || '—'}
// //                     </Text>
// //                 </Tooltip>
// //             ),
// //         },
// //         {
// //             title: 'SPOC', dataIndex: 'spoc_name', key: 'spoc_name',
// //             width: 120,
// //             render: v => (
// //                 <Tooltip title={v} placement="topLeft">
// //                     <Text style={{ fontSize: 12, color: C.muted, maxWidth: 110, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
// //                         {v || '—'}
// //                     </Text>
// //                 </Tooltip>
// //             ),
// //         },
// //         {
// //             title: 'Time Spent', key: 'time', align: 'right', width: 110,
// //             render: (_, r) => <Text style={{ fontSize: 13, fontWeight: 700, color: C.toDo }}>{formatDurationFromMillis(r.total_hours)}</Text>,
// //             sorter: (a, b) => a.total_hours - b.total_hours,
// //             defaultSortOrder: 'descend',
// //         },
// //     ];

// //     /* ── Table columns: group ── */
// //     const groupTableCols = [
// //         { title: '#', render: (_, __, i) => <Text style={{ color: C.muted, fontSize: 12 }}>{i + 1}</Text>, width: 44 },
// //         {
// //             title: 'Client Group', dataIndex: 'client_group_name', key: 'client_group_name',
// //             render: v => <Text style={{ fontWeight: 500, fontSize: 13 }}>{v}</Text>,
// //             sorter: (a, b) => a.client_group_name.localeCompare(b.client_group_name),
// //         },
// //         {
// //             title: 'SPOC', dataIndex: 'spoc_name', key: 'spoc_name',
// //             render: v => <Text style={{ fontSize: 12, color: C.muted }}>{v || '—'}</Text>,
// //         },
// //         {
// //             title: 'Time Spent', key: 'time', align: 'right',
// //             render: (_, r) => <Text style={{ fontSize: 13, fontWeight: 700, color: C.toDo }}>{formatDurationFromMillis(r.total_hours)}</Text>,
// //             sorter: (a, b) => a.total_hours - b.total_hours,
// //             defaultSortOrder: 'descend',
// //         },
// //     ];

// //     /* ── Error state ── */
// //     if (error && !dashboardData) {
// //         return (
// //             <div style={{ padding: 60, textAlign: 'center', background: C.bg, minHeight: '100vh' }}>
// //                 <Text style={{ color: C.overdue, fontSize: 16 }}>{error}</Text><br />
// //                 <Button style={{ marginTop: 16 }} onClick={() => { didInit.current = false; }} icon={<ReloadOutlined />}>Retry</Button>
// //             </div>
// //         );
// //     }

// //     /* ══════════════ RENDER ══════════════ */
// //     return (
// //         <div style={{ background: C.bg, minHeight: '100vh', padding: '24px 28px', fontFamily: '"DM Sans", "Segoe UI", sans-serif' }}>

// //             {/* ── Header ── */}
// //             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
// //                 <div>
// //                     <Title level={3} style={{ margin: 0, color: C.text, fontWeight: 800, letterSpacing: '-0.03em' }}>
// //                         Task Analytics
// //                     </Title>
// //                     <Text style={{ color: C.muted, fontSize: 13 }}>
// //                         {moment().format('dddd, D MMMM YYYY')} · Real-time overview
// //                     </Text>
// //                 </div>
// //                 <Space>
// //                     <Button icon={<ReloadOutlined />} onClick={handleRefresh} loading={loading}>Refresh</Button>
// //                     <Button type="primary" onClick={() => navigate('/stt-records')} style={{ background: C.toDo, borderColor: C.toDo }}>
// //                         All Tasks →
// //                     </Button>
// //                 </Space>
// //             </div>

// //             {/* ── Filters ── */}
// //             <div style={{ background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`, marginBottom: 24, overflow: 'hidden' }}>
// //                 <div
// //                     onClick={() => setFiltersOpen(v => !v)}
// //                     style={{ padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', borderBottom: filtersOpen ? `1px solid ${C.border}` : 'none' }}
// //                 >
// //                     <Space>
// //                         <FilterOutlined style={{ color: C.toDo }} />
// //                         <Text style={{ fontWeight: 600, color: C.text }}>Filters</Text>
// //                         {activeFilterCount > 0 && (
// //                             <span style={{ background: C.toDo, color: '#fff', borderRadius: 20, padding: '1px 8px', fontSize: 11, fontWeight: 700 }}>
// //                                 {activeFilterCount} active
// //                             </span>
// //                         )}
// //                     </Space>
// //                     <Text style={{ color: C.muted, fontSize: 12 }}>{filtersOpen ? '▲ collapse' : '▼ expand'}</Text>
// //                 </div>
// //                 {filtersOpen && (
// //                     <div style={{ padding: '16px 20px' }}>
// //                         <Row gutter={[12, 12]}>
// //                             <Col xs={24} sm={12} md={8} lg={5}>
// //                                 <RangePicker style={{ width: '100%' }} value={dateRange} onChange={setDateRange} size="small" />
// //                             </Col>
// //                             {[
// //                                 { placeholder: 'Client Group', value: selectedClientGroup, onChange: setSelectedClientGroup, items: clientGroups, labelKey: 'group_name' },
// //                                 { placeholder: 'Client',       value: selectedClient,      onChange: setSelectedClient,      items: clients,       labelKey: 'name'       },
// //                                 { placeholder: 'Team',         value: selectedTeam,        onChange: setSelectedTeam,        items: teams,         labelKey: 'name'       },
// //                                 { placeholder: 'Sub Service',  value: selectedSubService,  onChange: setSelectedSubService,  items: subServices,   labelKey: 'name'       },
// //                             ].map(({ placeholder, value, onChange, items, labelKey }) => (
// //                                 <Col xs={24} sm={12} md={8} lg={4} key={placeholder}>
// //                                     <Select mode="multiple" placeholder={placeholder} allowClear showSearch value={value} onChange={onChange}
// //                                         style={{ width: '100%' }} size="small"
// //                                         filterOption={(inp, opt) => (opt?.children ?? '').toLowerCase().includes(inp.toLowerCase())}>
// //                                         {items.map(i => <Option key={i.id} value={i.id}>{i[labelKey]}</Option>)}
// //                                     </Select>
// //                                 </Col>
// //                             ))}
// //                             <Col xs={24} sm={12} md={4} lg={3}>
// //                                 <Button size="small" onClick={handleClearFilters} icon={<ClearOutlined />} block>Clear</Button>
// //                             </Col>
// //                         </Row>
// //                     </div>
// //                 )}
// //             </div>

// //             {/* ── KPI Cards ── */}
// //             <Row gutter={[14, 14]} style={{ marginBottom: 20, flexWrap: 'nowrap' }}>
// //                 {[
// //                     { title: 'Total Tasks',  value: taskCounts.allTasks,   color: C.all,        lightColor: '#f1f5f9', icon: <FcList />,                    subtitle: 'Across all statuses',          status: 'all'         },
// //                     { title: 'To Do',        value: taskCounts.toDo,       color: C.toDo,       lightColor: '#ede9fe', icon: <ClockCircleOutlined />,         subtitle: 'Pending start',                status: 'To Do'       },
// //                     { title: 'In Progress',  value: taskCounts.inProgress, color: C.inProgress, lightColor: '#fef3c7', icon: <MinusCircleOutlined />,         subtitle: 'Being worked on',              status: 'In Progress' },
// //                     { title: 'Done',         value: taskCounts.done,       color: C.done,       lightColor: '#d1fae5', icon: <CheckCircleOutlined />,         subtitle: `${completionRate}% completion`, status: 'Done'        },
// //                     { title: 'Overdue',      value: taskCounts.overdue,    color: C.overdue,    lightColor: '#fee2e2', icon: <ExclamationCircleOutlined />,   subtitle: 'Need attention',               status: 'Over Due'    },
// //                 ].map((card) => (
// //                     <Col key={card.title} style={{ flex: '1 1 0', minWidth: 0, display: 'flex' }}>
// //                         <StatCard {...card} loading={loading} onClick={() => goToTasks(card.status)} />
// //                     </Col>
// //                 ))}
// //             </Row>

// //             {/* ── Overall progress bar ── */}
// //             {taskCounts.allTasks > 0 && (
// //                 <div style={{ background: C.surface, borderRadius: 14, padding: '16px 24px', marginBottom: 20, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
// //                     <Text style={{ fontWeight: 600, color: C.text, whiteSpace: 'nowrap', fontSize: 13 }}>Overall Progress</Text>
// //                     <div style={{ flex: 1, minWidth: 120 }}>
// //                         <Progress
// //                             percent={completionRate}
// //                             strokeColor={{ '0%': C.toDo, '100%': C.done }}
// //                             trailColor="#e2e8f0" strokeWidth={10} showInfo={false}
// //                         />
// //                     </div>
// //                     <div style={{ display: 'flex', gap: 24, flexShrink: 0 }}>
// //                         {[
// //                             { label: 'Done',    val: taskCounts.done,                            color: C.done       },
// //                             { label: 'Active',  val: taskCounts.toDo + taskCounts.inProgress,    color: C.inProgress },
// //                             { label: 'Overdue', val: taskCounts.overdue,                         color: C.overdue    },
// //                             { label: 'Complete',val: `${completionRate}%`,                       color: C.text       },
// //                         ].map(({ label, val, color }) => (
// //                             <div key={label} style={{ textAlign: 'center' }}>
// //                                 <div style={{ fontWeight: 700, color, fontSize: 16, lineHeight: 1 }}>{val}</div>
// //                                 <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{label}</div>
// //                             </div>
// //                         ))}
// //                     </div>
// //                 </div>
// //             )}

// //             {/* ── Row 1: Pie + Upcoming tasks ── */}
// //             <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
// //                 <Col xs={24} lg={9}>
// //                     <div style={{ background: C.surface, borderRadius: 14, padding: '20px 20px 12px', border: `1px solid ${C.border}`, height: '100%' }}>
// //                         <SectionTitle>Status Distribution</SectionTitle>
// //                         {loading
// //                             ? <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Spin /></div>
// //                             : pieData.length > 0
// //                                 ? <EChartsReact option={pieOption(pieData)} style={{ height: 300 }} />
// //                                 : <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.muted }}>No data</div>
// //                         }
// //                     </div>
// //                 </Col>
// //                 <Col xs={24} lg={15}>
// //                     <div style={{ background: C.surface, borderRadius: 14, padding: '20px', border: `1px solid ${C.border}`, height: '100%' }}>
// //                         <SectionTitle extra={
// //                             <Button size="small" type="link" onClick={() => goToTasks('all')} style={{ color: C.toDo, padding: 0 }}>
// //                                 View all →
// //                             </Button>
// //                         }>
// //                             Upcoming &amp; Recent Tasks
// //                         </SectionTitle>
// //                         <Table
// //                             dataSource={upcomingTasks}
// //                             columns={upcomingCols}
// //                             rowKey="id"
// //                             size="small"
// //                             pagination={false}
// //                             loading={loading}
// //                             scroll={{ x: 'max-content' }}
// //                             onRow={r => ({ onClick: () => goToTasks(r.status), style: { cursor: 'pointer' } })}
// //                             locale={{ emptyText: <div style={{ padding: 32, color: C.muted }}>No tasks found 🎉</div> }}
// //                         />
// //                     </div>
// //                 </Col>
// //             </Row>

// //             {/* ── Row 2: Time Spent — chart + full table side by side ── */}
// //             <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
// //                 <Col xs={24}>
// //                     <div style={{ background: C.surface, borderRadius: 14, padding: '20px', border: `1px solid ${C.border}` }}>
// //                         <SectionTitle
// //                             extra={
// //                                 <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
// //                                     <Text style={{ fontSize: 13, color: C.muted }}>
// //                                         Total: <strong style={{ color: C.toDo }}>{formatDurationFromMillis(totalTime)}</strong>
// //                                     </Text>
// //                                     <Segmented
// //                                         size="small"
// //                                         options={['By Client', 'By Group']}
// //                                         value={tableView === 'client' ? 'By Client' : 'By Group'}
// //                                         onChange={v => setTableView(v === 'By Client' ? 'client' : 'group')}
// //                                     />
// //                                 </div>
// //                             }
// //                         >
// //                             Total Time Spent
// //                         </SectionTitle>

// //                         {tableView === 'client' ? (
// //                             timePerClientData.length > 0 ? (
// //                                 <Row gutter={[16, 16]}>
// //                                     {/* Bar chart — top 10 */}
// //                                     <Col xs={24} xl={12}>
// //                                         <Text style={{ fontSize: 12, color: C.muted, display: 'block', marginBottom: 8 }}>
// //                                             Top {topClients.length} clients by time logged
// //                                         </Text>
// //                                         <EChartsReact
// //                                             option={barOption(topClients.map(r => ({ name: r.client_name, fullName: r.client_name, ms: r.total_hours })))}
// //                                             style={{ height: 280 }}
// //                                         />
// //                                     </Col>
// //                                     {/* Full table — all clients */}
// //                                     <Col xs={24} xl={12}>
// //                                         <Table
// //                                             dataSource={timePerClientData}
// //                                             rowKey="client_id"
// //                                             size="small"
// //                                             columns={clientTableCols}
// //                                             pagination={{ pageSize: 8, size: 'small', showSizeChanger: false }}
// //                                             scroll={{ x: 'max-content' }}
// //                                             onRow={r => ({ onClick: () => handleClientClick(r.client_id), style: { cursor: 'pointer' } })}
// //                                             summary={() => (
// //                                                 <Table.Summary.Row style={{ background: '#f8fafc' }}>
// //                                                     <Table.Summary.Cell index={0} colSpan={4}>
// //                                                         <Text strong style={{ fontSize: 12 }}>Grand Total</Text>
// //                                                     </Table.Summary.Cell>
// //                                                     <Table.Summary.Cell index={1} align="right">
// //                                                         <Text strong style={{ fontSize: 12, color: C.toDo }}>
// //                                                             {formatDurationFromMillis(totalTime)}
// //                                                         </Text>
// //                                                     </Table.Summary.Cell>
// //                                                 </Table.Summary.Row>
// //                                             )}
// //                                         />
// //                                     </Col>
// //                                 </Row>
// //                             ) : (
// //                                 <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.muted }}>
// //                                     {loading ? <Spin /> : 'No time entries recorded'}
// //                                 </div>
// //                             )
// //                         ) : (
// //                             timePerGroup.length > 0 ? (
// //                                 <Row gutter={[16, 16]}>
// //                                     <Col xs={24} xl={12}>
// //                                         <Text style={{ fontSize: 12, color: C.muted, display: 'block', marginBottom: 8 }}>
// //                                             Top {topGroups.length} groups by time logged
// //                                         </Text>
// //                                         <EChartsReact
// //                                             option={barOption(topGroups.map(r => ({ name: r.client_group_name, fullName: r.client_group_name, ms: r.total_hours })))}
// //                                             style={{ height: 280 }}
// //                                         />
// //                                     </Col>
// //                                     <Col xs={24} xl={12}>
// //                                         <Table
// //                                             dataSource={timePerGroup}
// //                                             rowKey="client_group_name"
// //                                             size="small"
// //                                             columns={groupTableCols}
// //                                             pagination={{ pageSize: 8, size: 'small', showSizeChanger: false }}
// //                                             scroll={{ x: 'max-content' }}
// //                                             summary={() => (
// //                                                 <Table.Summary.Row style={{ background: '#f8fafc' }}>
// //                                                     <Table.Summary.Cell index={0} colSpan={3}>
// //                                                         <Text strong style={{ fontSize: 12 }}>Grand Total</Text>
// //                                                     </Table.Summary.Cell>
// //                                                     <Table.Summary.Cell index={1} align="right">
// //                                                         <Text strong style={{ fontSize: 12, color: C.toDo }}>
// //                                                             {formatDurationFromMillis(timePerGroup.reduce((s, r) => s + r.total_hours, 0))}
// //                                                         </Text>
// //                                                     </Table.Summary.Cell>
// //                                                 </Table.Summary.Row>
// //                                             )}
// //                                         />
// //                                     </Col>
// //                                 </Row>
// //                             ) : (
// //                                 <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.muted }}>
// //                                     {loading ? <Spin /> : 'No time entries recorded'}
// //                                 </div>
// //                             )
// //                         )}
// //                     </div>
// //                 </Col>
// //             </Row>

// //             {/* ── Client Detail Modal ── */}
// //             <Modal
// //                 open={clientModalVisible}
// //                 onCancel={() => { setClientModalVisible(false); setDrillVisible(false); }}
// //                 footer={null}
// //                 width={900}
// //                 styles={{ body: { padding: '24px', background: C.bg } }}
// //                 title={
// //                     <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
// //                         <div style={{ width: 38, height: 38, borderRadius: 10, background: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.toDo, fontWeight: 800, fontSize: 16 }}>
// //                             {(selectedClientInfo?.name || 'C')[0]}
// //                         </div>
// //                         <div>
// //                             <div style={{ fontWeight: 700, color: C.text, fontSize: 15 }}>{selectedClientInfo?.name || 'Client'}</div>
// //                             <div style={{ fontSize: 12, color: C.muted }}>
// //                                 {getGroupName(selectedClientInfo)} · {getSpocName(selectedClientInfo)}
// //                             </div>
// //                         </div>
// //                     </div>
// //                 }
// //             >
// //                 {clientModalLoading ? (
// //                     <div style={{ textAlign: 'center', padding: 60 }}><Spin size="large" /></div>
// //                 ) : clientSummary ? (
// //                     <>
// //                         {/* Mini KPIs */}
// //                         <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
// //                             {[
// //                                 { label: 'Done Tasks',  value: clientSummary.done_count,                               color: C.done,       bg: '#d1fae5', isText: false },
// //                                 { label: 'Total Time',  value: formatDurationFromMillis(clientSummary.total_hours_ms),  color: C.toDo,       bg: '#ede9fe', isText: true  },
// //                                 { label: 'Employees',   value: clientSummary.employees?.length || 0,                   color: C.inProgress, bg: '#fef3c7', isText: false },
// //                                 { label: 'Services',    value: clientSummary.sub_services?.length || 0,                color: '#0ea5e9',    bg: '#e0f2fe', isText: false },
// //                             ].map(({ label, value, color, bg, isText }) => (
// //                                 <Col span={6} key={label}>
// //                                     <div style={{ background: bg, borderRadius: 12, padding: '14px 16px', textAlign: 'center' }}>
// //                                         {isText
// //                                             ? <div style={{ fontSize: 20, fontWeight: 800, color, lineHeight: 1.1 }}>{value}</div>
// //                                             : <CountUp end={value} duration={1.2} style={{ fontSize: 28, fontWeight: 800, color, lineHeight: 1 }} />
// //                                         }
// //                                         <div style={{ fontSize: 11, color: C.muted, marginTop: 4, fontWeight: 600 }}>{label}</div>
// //                                     </div>
// //                                 </Col>
// //                             ))}
// //                         </Row>

// //                         {/* Employee Hours + Service Breakdown charts */}
// //                         <Row gutter={[12, 12]}>
// //                             {clientSummary.employees?.length > 0 && (
// //                                 <Col xs={24} md={clientSummary.sub_services?.length > 0 ? 12 : 24}>
// //                                     <div style={{ background: C.surface, borderRadius: 12, padding: 16, border: `1px solid ${C.border}` }}>
// //                                         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
// //                                             <Text style={{ fontWeight: 700, fontSize: 13 }}>Employee Hours</Text>
// //                                             <Text style={{ fontSize: 11, color: C.muted }}>Click bar for details</Text>
// //                                         </div>
// //                                         <EChartsReact
// //                                             option={hBarOption(clientSummary.employees, '#818cf8', '#6366f1')}
// //                                             style={{ height: Math.max(140, clientSummary.employees.length * 32 + 20) }}
// //                                             onEvents={{
// //                                                 click: (params) => {
// //                                                     const reversed = [...clientSummary.employees].reverse();
// //                                                     const emp = reversed[params.dataIndex];
// //                                                     if (!emp) return;
// //                                                     const services = clientSummary.per_employee_services?.[emp.name] || [];
// //                                                     setDrillTitle(emp.name);
// //                                                     setDrillData(services);
// //                                                     setDrillType('employee');
// //                                                     setDrillVisible(true);
// //                                                 },
// //                                             }}
// //                                         />
// //                                     </div>
// //                                 </Col>
// //                             )}
// //                             {clientSummary.sub_services?.length > 0 && (
// //                                 <Col xs={24} md={clientSummary.employees?.length > 0 ? 12 : 24}>
// //                                     <div style={{ background: C.surface, borderRadius: 12, padding: 16, border: `1px solid ${C.border}` }}>
// //                                         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
// //                                             <Text style={{ fontWeight: 700, fontSize: 13 }}>Service Breakdown</Text>
// //                                             <Text style={{ fontSize: 11, color: C.muted }}>Click bar for details</Text>
// //                                         </div>
// //                                         <EChartsReact
// //                                             option={hBarOption(clientSummary.sub_services, '#06b6d4', '#0ea5e9')}
// //                                             style={{ height: Math.max(140, clientSummary.sub_services.length * 32 + 20) }}
// //                                             onEvents={{
// //                                                 click: (params) => {
// //                                                     const reversed = [...clientSummary.sub_services].reverse();
// //                                                     const svc = reversed[params.dataIndex];
// //                                                     if (!svc) return;
// //                                                     const employees = clientSummary.per_service_employees?.[svc.name] || [];
// //                                                     setDrillTitle(svc.name);
// //                                                     setDrillData(employees);
// //                                                     setDrillType('service');
// //                                                     setDrillVisible(true);
// //                                                 },
// //                                             }}
// //                                         />
// //                                     </div>
// //                                 </Col>
// //                             )}
// //                         </Row>
// //                     </>
// //                 ) : (
// //                     <div style={{ textAlign: 'center', padding: 40, color: C.muted }}>No data available</div>
// //                 )}
// //             </Modal>

// //             {/* ── Drill-down Panel — rendered via Portal, no mask conflict ── */}
// //             {drillVisible && typeof document !== 'undefined' && (() => {
// //                 const color    = drillType === 'employee' ? '#0ea5e9' : '#6366f1';
// //                 const colorEnd = drillType === 'employee' ? '#06b6d4' : '#818cf8';

// //                 const panel = (
// //                     <div style={{
// //                         position: 'fixed',
// //                         top: 100,
// //                         left: 'calc(50% + 466px)',
// //                         width: 360,
// //                         maxHeight: '78vh',
// //                         zIndex: 1100,
// //                         display: 'flex',
// //                         flexDirection: 'column',
// //                         background: C.surface,
// //                         borderRadius: 16,
// //                         boxShadow: '0 24px 64px rgba(0,0,0,0.20), 0 4px 16px rgba(0,0,0,0.10)',
// //                         border: `1px solid ${C.border}`,
// //                         animation: 'drillIn 0.32s cubic-bezier(0.34,1.56,0.64,1) both',
// //                         overflow: 'hidden',
// //                     }}>
// //                         <style>{`
// //                             @keyframes drillIn {
// //                                 0%   { opacity:0; transform: translateX(-18px) translateY(10px) scale(0.94); }
// //                                 60%  { opacity:1; transform: translateX(3px)   translateY(-2px) scale(1.01); }
// //                                 100% { opacity:1; transform: translateX(0)     translateY(0)    scale(1);    }
// //                             }
// //                             .drill-item-enter {
// //                                 animation: drillItemIn 0.22s ease both;
// //                             }
// //                             @keyframes drillItemIn {
// //                                 from { opacity:0; transform: translateX(-10px); }
// //                                 to   { opacity:1; transform: translateX(0); }
// //                             }
// //                             .drill-close-btn:hover {
// //                                 background: #e2e8f0 !important;
// //                                 color: #0f172a !important;
// //                                 transform: scale(1.1);
// //                             }
// //                             .drill-close-btn {
// //                                 transition: background 0.15s, color 0.15s, transform 0.15s !important;
// //                             }
// //                         `}</style>

// //                         {/* Header */}
// //                         <div style={{
// //                             display: 'flex', alignItems: 'center', justifyContent: 'space-between',
// //                             padding: '14px 18px',
// //                             borderBottom: `1px solid ${C.border}`,
// //                             background: drillType === 'employee' ? '#f5f3ff' : '#ecfeff',
// //                             flexShrink: 0,
// //                         }}>
// //                             <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
// //                                 <div style={{
// //                                     width: 32, height: 32, borderRadius: 8,
// //                                     background: drillType === 'employee' ? '#ede9fe' : '#cffafe',
// //                                     display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15,
// //                                 }}>
// //                                     {drillType === 'employee' ? '🛠' : '👤'}
// //                                 </div>
// //                                 <div>
// //                                     <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
// //                                         {drillType === 'employee' ? 'Services by' : 'Employees on'}
// //                                     </div>
// //                                     <div style={{ fontSize: 13, fontWeight: 700, color: C.text, lineHeight: 1.3, maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
// //                                         {drillTitle}
// //                                     </div>
// //                                 </div>
// //                             </div>
// //                             <button
// //                                 onClick={() => setDrillVisible(false)}
// //                                 className="drill-close-btn"
// //                                 style={{
// //                                     background: 'none', border: 'none', cursor: 'pointer',
// //                                     color: C.muted, fontSize: 20, lineHeight: 1,
// //                                     padding: '4px 8px', borderRadius: 8,
// //                                     display: 'flex', alignItems: 'center', justifyContent: 'center',
// //                                     flexShrink: 0,
// //                                 }}
// //                             >
// //                                 ×
// //                             </button>
// //                         </div>

// //                         {/* Body — scrollable */}
// //                         <div style={{ overflowY: 'auto', padding: '16px 18px', flex: 1 }}>
// //                             {drillData.length === 0 ? (
// //                                 <div style={{ textAlign: 'center', padding: '32px 0', color: C.muted, fontSize: 13 }}>No data available</div>
// //                             ) : (
// //                                 <>
// //                                     <EChartsReact
// //                                         option={hBarOption(drillData, colorEnd, color)}
// //                                         style={{ height: Math.max(90, drillData.length * 30 + 16) }}
// //                                     />
// //                                     <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
// //                                         <div style={{ fontSize: 11, color: C.muted, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
// //                                             <span>💡</span>
// //                                             <span>Click any row to open STT Records</span>
// //                                         </div>
// //                                         {[...drillData].sort((a, b) => b.ms - a.ms).map((d, i) => {
// //                                             const maxMs = drillData[0]?.ms || 1;
// //                                             const pct   = Math.round((d.ms / maxMs) * 100);

// //                                             const handleDrillItemClick = () => {
// //                                                 const p = new URLSearchParams();
// //                                                 // Always pass the client
// //                                                 if (selectedClientInfo?.id) p.set('client_id', selectedClientInfo.id);
// //                                                 // Pass date range if active
// //                                                 const [s, e] = dateRange || [null, null];
// //                                                 if (s) p.set('start_date', s.format('YYYY-MM-DD'));
// //                                                 if (e) p.set('end_date',   e.format('YYYY-MM-DD'));
// //                                                 // Pass the drill dimension by NAME
// //                                                 // (TeamWorkHistoryView reads employee_name and sub_service_name)
// //                                                 if (drillType === 'employee') {
// //                                                     p.set('employee_name', d.name);
// //                                                 } else {
// //                                                     p.set('sub_service_name', d.name);
// //                                                 }
// //                                                 // Open in new tab
// //                                                 window.open(`/stt-records?${p.toString()}`, '_blank');
// //                                             };

// //                                             return (
// //                                                 <div
// //                                                     key={d.name}
// //                                                     className="drill-item-enter"
// //                                                     onClick={handleDrillItemClick}
// //                                                     style={{
// //                                                         padding: '8px 12px', borderRadius: 10,
// //                                                         background: C.bg, border: `1px solid ${C.border}`,
// //                                                         animationDelay: `${0.18 + i * 0.055}s`,
// //                                                         cursor: 'pointer',
// //                                                         transition: 'background 0.15s, border-color 0.15s, transform 0.15s',
// //                                                     }}
// //                                                     onMouseEnter={e => {
// //                                                         e.currentTarget.style.background = C.surface;
// //                                                         e.currentTarget.style.borderColor = color;
// //                                                         e.currentTarget.style.transform = 'translateX(3px)';
// //                                                     }}
// //                                                     onMouseLeave={e => {
// //                                                         e.currentTarget.style.background = C.bg;
// //                                                         e.currentTarget.style.borderColor = C.border;
// //                                                         e.currentTarget.style.transform = 'translateX(0)';
// //                                                     }}
// //                                                 >
// //                                                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
// //                                                         <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
// //                                                             <span style={{ fontSize: 10, fontWeight: 700, color: C.muted, flexShrink: 0 }}>#{i + 1}</span>
// //                                                             <span title={d.name} style={{
// //                                                                 fontSize: 12, fontWeight: 500, color: C.text,
// //                                                                 overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
// //                                                                 maxWidth: 190,
// //                                                             }}>{d.name}</span>
// //                                                         </div>
// //                                                         <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, marginLeft: 8 }}>
// //                                                             <span style={{ fontSize: 11, fontWeight: 700, color }}>{formatDurationFromMillis(d.ms)}</span>
// //                                                             <span style={{ fontSize: 11, color: C.muted }}>→</span>
// //                                                         </div>
// //                                                     </div>
// //                                                     <div style={{ height: 3, background: C.border, borderRadius: 4 }}>
// //                                                         <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 4, transition: 'width 0.5s ease' }} />
// //                                                     </div>
// //                                                 </div>
// //                                             );
// //                                         })}
// //                                     </div>
// //                                 </>
// //                             )}
// //                         </div>
// //                     </div>
// //                 );

// //                 return ReactDOM.createPortal(panel, document.body);
// //             })()}

// //         </div>
// //     );
// // };

// // export default TaskDashboard;

// import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
// import ReactDOM from 'react-dom';
// import {
//     Card, Col, Row, Typography, message, Table, DatePicker,
//     Select, Space, Button, Segmented, Modal, Spin, Progress, Tooltip,
// } from 'antd';
// import { api } from '../../../services/api';
// import EChartsReact from 'echarts-for-react';
// import CountUp from 'react-countup';
// import {
//     ClockCircleOutlined, CheckCircleOutlined,
//     MinusCircleOutlined, ExclamationCircleOutlined,
//     FilterOutlined, ClearOutlined, ReloadOutlined,
// } from '@ant-design/icons';
// import { FcList } from 'react-icons/fc';
// import moment from 'moment';
// import { formatDurationFromMillis } from './STT_Records';
// import { useNavigate } from 'react-router-dom';

// const { Title, Text } = Typography;
// const { RangePicker } = DatePicker;
// const { Option } = Select;

// /* ─── Design tokens ─────────────────────────────────────────── */
// const C = {
//     done:       '#10b981',
//     inProgress: '#f59e0b',
//     overdue:    '#ef4444',
//     toDo:       '#6366f1',
//     all:        '#0f172a',
//     bg:         '#f1f5f9',
//     surface:    '#ffffff',
//     border:     '#e2e8f0',
//     text:       '#0f172a',
//     muted:      '#64748b',
//     employee:   '#f59e0b',
// };

// const STATUS_META = {
//     'Done':        { color: C.done,       light: '#d1fae5' },
//     'In Progress': { color: C.inProgress, light: '#fef3c7' },
//     'Over Due':    { color: C.overdue,    light: '#fee2e2' },
//     'To Do':       { color: C.toDo,       light: '#ede9fe' },
// };

// /* ─── Stat Card ─────────────────────────────────────────────── */
// const StatCard = ({ title, value, color, lightColor, icon, subtitle, onClick, loading }) => (
//     <div
//         onClick={onClick}
//         style={{
//             background: C.surface, borderRadius: 16, padding: '20px 22px',
//             cursor: 'pointer', border: `1px solid ${C.border}`,
//             borderTop: `4px solid ${color}`,
//             transition: 'all 0.2s', flex: 1, minWidth: 0,
//             boxShadow: '0 1px 4px rgba(0,0,0,0.06)', position: 'relative', overflow: 'hidden',
//         }}
//         onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = `0 10px 28px ${color}28`; }}
//         onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)'; }}
//     >
//         <div style={{ position: 'absolute', right: 18, top: 18, width: 44, height: 44, borderRadius: 12, background: lightColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color }}>
//             {icon}
//         </div>
//         <Text style={{ fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: '0.07em', textTransform: 'uppercase' }}>
//             {title}
//         </Text>
//         <div style={{ marginTop: 8 }}>
//             {loading
//                 ? <div style={{ fontSize: 28, fontWeight: 700, color: C.muted }}>—</div>
//                 : <CountUp end={value} duration={1.6} style={{ fontSize: 34, fontWeight: 800, color, lineHeight: 1 }} />
//             }
//         </div>
//         {subtitle && <Text style={{ fontSize: 11, color: C.muted, marginTop: 6, display: 'block' }}>{subtitle}</Text>}
//     </div>
// );

// /* ─── Section header ────────────────────────────────────────── */
// const SectionTitle = ({ children, extra }) => (
//     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
//         <Text style={{ fontSize: 14, fontWeight: 700, color: C.text, letterSpacing: '-0.01em' }}>{children}</Text>
//         {extra}
//     </div>
// );

// /* ─── Status Badge ──────────────────────────────────────────── */
// const StatusBadge = ({ status }) => {
//     const meta = STATUS_META[status] || { color: C.muted, light: '#f1f5f9' };
//     return (
//         <span style={{
//             background: meta.light, color: meta.color,
//             borderRadius: 20, padding: '2px 10px',
//             fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap',
//         }}>
//             {status}
//         </span>
//     );
// };

// /* ─── Chart helpers ─────────────────────────────────────────── */
// const pieOption = (data) => ({
//     backgroundColor: 'transparent',
//     tooltip: {
//         trigger: 'item',
//         formatter: '{b}: <b>{c}</b> ({d}%)',
//         backgroundColor: '#1e293b', borderColor: 'transparent',
//         textStyle: { color: '#f1f5f9', fontSize: 13 },
//     },
//     legend: {
//         orient: 'horizontal', bottom: 0, left: 'center',
//         textStyle: { color: C.muted, fontSize: 12 },
//         itemWidth: 10, itemHeight: 10,
//     },
//     series: [{
//         type: 'pie', radius: ['42%', '70%'], center: ['50%', '44%'],
//         avoidLabelOverlap: true,
//         itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
//         label: { show: true, formatter: '{b}\n{c}', fontSize: 11, color: C.muted, lineHeight: 16 },
//         labelLine: { length: 10, length2: 6 },
//         data: data.map(d => ({ ...d, itemStyle: { color: STATUS_META[d.name]?.color || '#94a3b8' } })),
//         emphasis: { itemStyle: { shadowBlur: 12, shadowColor: 'rgba(0,0,0,0.15)' } },
//     }],
// });

// const barOption = (data, colorStart = '#6366f1', colorEnd = '#818cf8') => ({
//     backgroundColor: 'transparent',
//     tooltip: {
//         trigger: 'axis', axisPointer: { type: 'shadow' },
//         backgroundColor: '#1e293b', borderColor: 'transparent',
//         textStyle: { color: '#f1f5f9', fontSize: 12 },
//         formatter: (params) => {
//             const p = params[0];
//             const orig = data[p.dataIndex];
//             return `<b>${orig?.fullName || p.name}</b><br/>${formatDurationFromMillis(p.value)}`;
//         },
//     },
//     grid: { top: 16, right: 16, bottom: 48, left: 16, containLabel: true },
//     xAxis: {
//         type: 'category',
//         data: data.map(d => d.name.length > 13 ? d.name.slice(0, 12) + '…' : d.name),
//         axisLabel: { color: C.muted, fontSize: 11, rotate: data.length > 5 ? 30 : 0, interval: 0 },
//         axisLine: { lineStyle: { color: C.border } },
//         axisTick: { show: false },
//     },
//     yAxis: {
//         type: 'value',
//         axisLabel: { color: C.muted, fontSize: 10, formatter: v => formatDurationFromMillis(v) },
//         splitLine: { lineStyle: { color: C.border, type: 'dashed' } },
//         axisLine: { show: false }, axisTick: { show: false },
//     },
//     series: [{
//         type: 'bar',
//         data: data.map(d => ({
//             value: d.ms,
//             itemStyle: {
//                 color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: colorStart }, { offset: 1, color: colorEnd }] },
//                 borderRadius: [6, 6, 0, 0],
//             },
//         })),
//         barMaxWidth: 48,
//         emphasis: {
//             itemStyle: {
//                 color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: colorEnd }, { offset: 1, color: colorStart }] },
//             },
//         },
//     }],
// });

// const hBarOption = (data, colorStart = '#06b6d4', colorEnd = '#0ea5e9') => {
//     const reversed = [...data].reverse();
//     return {
//         backgroundColor: 'transparent',
//         tooltip: {
//             trigger: 'axis', axisPointer: { type: 'shadow' },
//             backgroundColor: '#1e293b', borderColor: 'transparent',
//             textStyle: { color: '#f1f5f9', fontSize: 12 },
//             formatter: (params) => `<b>${params[0].name}</b><br/>${formatDurationFromMillis(params[0].value)}`,
//         },
//         grid: { top: 4, right: 96, bottom: 4, left: 8, containLabel: true },
//         xAxis: { type: 'value', show: false, splitLine: { show: false } },
//         yAxis: {
//             type: 'category',
//             data: reversed.map(d => d.name?.length > 18 ? d.name.slice(0, 17) + '…' : d.name || 'N/A'),
//             axisLabel: { color: C.muted, fontSize: 11 },
//             axisLine: { show: false }, axisTick: { show: false },
//         },
//         series: [{
//             type: 'bar',
//             data: reversed.map(d => ({
//                 value: d.ms || 0,
//                 itemStyle: {
//                     color: { type: 'linear', x: 0, y: 0, x2: 1, y2: 0, colorStops: [{ offset: 0, color: colorStart }, { offset: 1, color: colorEnd }] },
//                     borderRadius: [0, 6, 6, 0],
//                 },
//             })),
//             barMaxWidth: 18,
//             label: {
//                 show: true, position: 'right',
//                 formatter: p => formatDurationFromMillis(p.value),
//                 color: C.muted, fontSize: 10,
//             },
//         }],
//     };
// };

// /* ══════════════ MAIN COMPONENT ══════════════ */
// const TaskDashboard = () => {
//     const navigate = useNavigate();

//     const [loading,             setLoading]             = useState(true);
//     const [dashboardData,       setDashboardData]       = useState(null);
//     const [error,               setError]               = useState(null);
//     const [dateRange,           setDateRange]           = useState(null);
//     const [clients,             setClients]             = useState([]);
//     const [selectedClient,      setSelectedClient]      = useState([]);
//     const [teams,               setTeams]               = useState([]);
//     const [selectedTeam,        setSelectedTeam]        = useState([]);
//     const [clientGroups,        setClientGroups]        = useState([]);
//     const [selectedClientGroup, setSelectedClientGroup] = useState([]);
//     const [allSpocs,            setAllSpocs]            = useState([]);
//     const [subServices,         setSubServices]         = useState([]);
//     const [selectedSubService,  setSelectedSubService]  = useState([]);
//     const [tableView,           setTableView]           = useState('client');
//     const [taskCounts,          setTaskCounts]          = useState({ allTasks: 0, done: 0, toDo: 0, overdue: 0, inProgress: 0 });
//     const [filtersOpen,         setFiltersOpen]         = useState(false);
//     const [timePerClientData,   setTimePerClientData]   = useState([]);
//     const [timePerEmployeeData, setTimePerEmployeeData] = useState([]);

//     // Client modal
//     const [clientModalVisible,  setClientModalVisible]  = useState(false);
//     const [clientModalLoading,  setClientModalLoading]  = useState(false);
//     const [selectedClientInfo,  setSelectedClientInfo]  = useState(null);
//     const [clientSummary,       setClientSummary]       = useState(null);

//     // Employee drill-down modal
//     const [empModalVisible,     setEmpModalVisible]     = useState(false);
//     const [empModalLoading,     setEmpModalLoading]     = useState(false);
//     const [empModalName,        setEmpModalName]        = useState('');
//     const [empModalClients,     setEmpModalClients]     = useState([]);

//     // Drill-down panel (inside client modal)
//     const [drillVisible,        setDrillVisible]        = useState(false);
//     const [drillTitle,          setDrillTitle]          = useState('');
//     const [drillData,           setDrillData]           = useState([]);
//     const [drillType,           setDrillType]           = useState('');

//     const mountedRef = useRef(true);
//     useEffect(() => { mountedRef.current = true; return () => { mountedRef.current = false; }; }, []);

//     const clientGroupsRef = useRef([]);
//     const allSpocsRef     = useRef([]);
//     useEffect(() => { clientGroupsRef.current = clientGroups; }, [clientGroups]);
//     useEffect(() => { allSpocsRef.current = allSpocs; }, [allSpocs]);

//     const getSpocName = useCallback((client) => {
//         if (!client) return 'N/A';
//         if (client.primary_spoc_name) return client.primary_spoc_name;
//         const groups = clientGroupsRef.current;
//         const group = groups.find(g => g.clients?.some(cg => (typeof cg === 'object' ? cg.id : cg) === client.id));
//         if (group?.primary_spoc_name) return group.primary_spoc_name;
//         if (typeof client.primary_spoc === 'number') {
//             const spoc = allSpocsRef.current.find(s => s.id === client.primary_spoc);
//             if (spoc) return `${spoc.first_name || ''} ${spoc.last_name || ''}`.trim() || spoc.user?.email || 'N/A';
//         }
//         return 'N/A';
//     }, []);

//     const getGroupName = useCallback((client) => {
//         if (!client) return 'N/A';
//         const groups = clientGroupsRef.current;
//         const group = groups.find(g => g.clients?.some(cg => (typeof cg === 'object' ? cg.id : cg) === client.id));
//         return group?.group_name || 'N/A';
//     }, []);

//     /* ── Build params ── */
//     const buildParams = (filters = {}) => {
//         const p = {
//             start_date:      filters.startDate?.format('YYYY-MM-DD'),
//             end_date:        filters.endDate?.format('YYYY-MM-DD'),
//             client_id:       filters.clientId?.length      ? filters.clientId.join(',')       : undefined,
//             team_id:         filters.teamId?.length        ? filters.teamId.join(',')         : undefined,
//             client_group_id: filters.clientGroupId?.length ? filters.clientGroupId.join(',') : undefined,
//             sub_service_id:  filters.subServiceId?.length  ? filters.subServiceId.join(',')  : undefined,
//         };
//         Object.keys(p).forEach(k => p[k] === undefined && delete p[k]);
//         return p;
//     };

//     /* ── Core fetch functions ── */
//     const fetchDashboard = useCallback(async (params) => {
//         if (!mountedRef.current) return;
//         setLoading(true);
//         try {
//             const res = await api.get('/clients/tasks/dashboard_summary/', { params });
//             if (mountedRef.current) setDashboardData(res.data);
//         } catch (err) {
//             console.error(err);
//             if (mountedRef.current) {
//                 setError('Failed to load dashboard data.');
//                 message.error('Failed to load dashboard.');
//             }
//         } finally {
//             if (mountedRef.current) setLoading(false);
//         }
//     }, []);

//     const fetchTimePerClient = useCallback(async (params, clientsList) => {
//         if (!mountedRef.current) return;
//         try {
//             const res = await api.get('/clients/tasks/time_per_client/', { params });
//             if (!mountedRef.current) return;
//             setTimePerClientData((res.data || []).map(row => {
//                 const c = (clientsList || []).find(x => x.id === row.client_id);
//                 return {
//                     ...row,
//                     total_hours: row.total_hours_ms,
//                     group_name:  c ? getGroupName(c) : 'N/A',
//                     spoc_name:   c ? getSpocName(c)  : 'N/A',
//                 };
//             }));
//         } catch (err) {
//             console.error('fetchTimePerClient error:', err);
//         }
//     }, [getGroupName, getSpocName]);

//     const fetchTimePerEmployee = useCallback(async (params) => {
//         if (!mountedRef.current) return;
//         try {
//             const res = await api.get('/clients/tasks/time_per_employee/', { params });
//             if (mountedRef.current) setTimePerEmployeeData(res.data || []);
//         } catch (err) {
//             console.error('fetchTimePerEmployee error:', err);
//         }
//     }, []);

//     /* ── Initial load ── */
//     const didInit = useRef(false);
//     useEffect(() => {
//         if (didInit.current) return;
//         didInit.current = true;

//         (async () => {
//             setLoading(true);
//             try {
//                 const [cR, tR, gR, sR, ssR] = await Promise.all([
//                     api.get('/clients/clients/?page_size=500'),
//                     api.get('/employee/teams/'),
//                     api.get('/clients/client-groups/'),
//                     api.get('/employee/employees/'),
//                     api.get('/clients/subservices/'),
//                 ]);
//                 if (!mountedRef.current) return;
//                 const cl = cR.data.results || cR.data;
//                 const gr = gR.data.results || gR.data;
//                 const sp = sR.data.results || sR.data;
//                 setClients(cl);
//                 setTeams(tR.data.results || tR.data);
//                 setClientGroups(gr);
//                 setAllSpocs(sp);
//                 setSubServices(ssR.data.results || ssR.data);
//                 clientGroupsRef.current = gr;
//                 allSpocsRef.current     = sp;
//                 await Promise.all([
//                     fetchDashboard({}),
//                     fetchTimePerClient({}, cl),
//                     fetchTimePerEmployee({}),
//                 ]);
//             } catch (err) {
//                 console.error('fetchInitialData error:', err);
//                 if (mountedRef.current) setError('Failed to load initial data.');
//             } finally {
//                 if (mountedRef.current) setLoading(false);
//             }
//         })();
//     }, [fetchDashboard, fetchTimePerClient, fetchTimePerEmployee]);

//     /* ── Re-fetch on filter change ── */
//     const isFirstRender = useRef(true);
//     useEffect(() => {
//         if (isFirstRender.current) { isFirstRender.current = false; return; }
//         const [startDate, endDate] = dateRange || [null, null];
//         const f = { startDate, endDate, clientId: selectedClient, teamId: selectedTeam, clientGroupId: selectedClientGroup, subServiceId: selectedSubService };
//         const p = buildParams(f);
//         fetchDashboard(p);
//         fetchTimePerClient(p, clients);
//         fetchTimePerEmployee(p);
//         // eslint-disable-next-line react-hooks/exhaustive-deps
//     }, [dateRange, selectedClient, selectedTeam, selectedClientGroup, selectedSubService]);

//     /* ── Derive counts ── */
//     useEffect(() => {
//         if (!dashboardData?.status_counts) return;
//         const sc = dashboardData.status_counts;
//         setTaskCounts({
//             allTasks:   (sc['To Do'] || 0) + (sc['In Progress'] || 0) + (sc['Done'] || 0) + (sc['Over Due'] || 0),
//             done:       sc['Done']        || 0,
//             toDo:       sc['To Do']       || 0,
//             inProgress: sc['In Progress'] || 0,
//             overdue:    sc['Over Due']    || 0,
//         });
//     }, [dashboardData]);

//     /* ── Derived data ── */
//     const timePerGroup = useMemo(() =>
//         timePerClientData.reduce((acc, row) => {
//             if (!row.group_name || row.group_name === 'N/A') return acc;
//             const ex = acc.find(g => g.client_group_name === row.group_name);
//             if (ex) ex.total_hours += row.total_hours;
//             else acc.push({ client_group_name: row.group_name, spoc_name: row.spoc_name, total_hours: row.total_hours });
//             return acc;
//         }, [])
//     , [timePerClientData]);

//     const pieData = useMemo(() =>
//         dashboardData?.status_counts
//             ? Object.entries(dashboardData.status_counts).filter(([k, v]) => k !== 'total' && v > 0).map(([name, value]) => ({ name, value }))
//             : []
//     , [dashboardData]);

//     const topClients   = useMemo(() => [...timePerClientData].sort((a, b) => b.total_hours - a.total_hours).slice(0, 10), [timePerClientData]);
//     const topGroups    = useMemo(() => [...timePerGroup].sort((a, b) => b.total_hours - a.total_hours).slice(0, 10), [timePerGroup]);
//     const topEmployees = useMemo(() => [...timePerEmployeeData].sort((a, b) => b.total_hours_ms - a.total_hours_ms).slice(0, 10), [timePerEmployeeData]);

//     const totalTime       = useMemo(() => timePerClientData.reduce((s, r) => s + (r.total_hours || 0), 0), [timePerClientData]);
//     const totalEmpTime    = useMemo(() => timePerEmployeeData.reduce((s, r) => s + (r.total_hours_ms || 0), 0), [timePerEmployeeData]);
//     const completionRate  = taskCounts.allTasks ? Math.round((taskCounts.done / taskCounts.allTasks) * 100) : 0;
//     const activeFilterCount = [selectedClient, selectedTeam, selectedClientGroup, selectedSubService].filter(a => a.length).length + (dateRange ? 1 : 0);

//     /* ── Clear filters ── */
//     const handleClearFilters = () => {
//         setDateRange(null);
//         setSelectedClient([]);
//         setSelectedTeam([]);
//         setSelectedClientGroup([]);
//         setSelectedSubService([]);
//     };

//     /* ── Navigate with filters ── */
//     const goToTasks = (status) => {
//         const params = new URLSearchParams();
//         if (status !== 'all') params.set('status', status);
//         const [s, e] = dateRange || [null, null];
//         if (s) params.set('start_date', s.format('YYYY-MM-DD'));
//         if (e) params.set('end_date',   e.format('YYYY-MM-DD'));
//         if (selectedClient?.length)      params.set('client_id',      selectedClient.join(','));
//         if (selectedTeam?.length)        params.set('team_id',         selectedTeam.join(','));
//         if (selectedClientGroup?.length) params.set('client_group_id', selectedClientGroup.join(','));
//         if (selectedSubService?.length)  params.set('sub_service_id',  selectedSubService.join(','));
//         navigate(`/stt-records?${params.toString()}`);
//     };

//     /* ── Refresh ── */
//     const handleRefresh = useCallback(() => {
//         const [startDate, endDate] = dateRange || [null, null];
//         const f = { startDate, endDate, clientId: selectedClient, teamId: selectedTeam, clientGroupId: selectedClientGroup, subServiceId: selectedSubService };
//         const p = buildParams(f);
//         fetchDashboard(p);
//         fetchTimePerClient(p, clients);
//         fetchTimePerEmployee(p);
//     }, [dateRange, selectedClient, selectedTeam, selectedClientGroup, selectedSubService, clients, fetchDashboard, fetchTimePerClient, fetchTimePerEmployee]);

//     /* ── Client modal ── */
//     const handleClientClick = useCallback(async (clientId) => {
//         const client = clients.find(c => c.id === clientId);
//         setSelectedClientInfo(client);
//         setClientSummary(null);
//         setDrillVisible(false);
//         setDrillData([]);
//         setClientModalVisible(true);
//         setClientModalLoading(true);
//         try {
//             const [startDate, endDate] = dateRange || [null, null];
//             const params = { client_id: clientId };
//             if (startDate) params.start_date = startDate.format('YYYY-MM-DD');
//             if (endDate)   params.end_date   = endDate.format('YYYY-MM-DD');
//             const res = await api.get('/clients/tasks/client_task_summary/', { params });
//             if (mountedRef.current) setClientSummary(res.data);
//         } catch (err) {
//             console.error(err);
//             message.error('Failed to load client details');
//         } finally {
//             if (mountedRef.current) setClientModalLoading(false);
//         }
//     }, [clients, dateRange]);

//     /* ── Employee modal ── */
//     const handleEmployeeClick = useCallback(async (employeeName) => {
//         setEmpModalName(employeeName);
//         setEmpModalClients([]);
//         setEmpModalVisible(true);
//         setEmpModalLoading(true);
//         try {
//             const [startDate, endDate] = dateRange || [null, null];
//             const params = { employee_name: employeeName };
//             if (startDate) params.start_date = startDate.format('YYYY-MM-DD');
//             if (endDate)   params.end_date   = endDate.format('YYYY-MM-DD');
//             const res = await api.get('/clients/tasks/time_per_employee_clients/', { params });
//             if (mountedRef.current) setEmpModalClients(res.data || []);
//         } catch (err) {
//             console.error(err);
//             message.error('Failed to load employee details');
//         } finally {
//             if (mountedRef.current) setEmpModalLoading(false);
//         }
//     }, [dateRange]);

//     /* ── Upcoming tasks ── */
//     const upcomingTasks = useMemo(() => (dashboardData?.tasks || []).slice(0, 8), [dashboardData]);
//     const upcomingCols = [
//         {
//             title: 'Task ID', dataIndex: 'task_id', key: 'task_id', width: 140,
//             render: v => <Text style={{ fontFamily: 'monospace', fontSize: 11, color: C.muted }}>{v}</Text>,
//         },
//         { title: 'Client',  dataIndex: 'client_name',      key: 'client_name',      ellipsis: true },
//         { title: 'Service', dataIndex: 'sub_service_name',  key: 'sub_service_name', ellipsis: true },
//         {
//             title: 'Due', dataIndex: 'due_date', key: 'due_date', width: 100,
//             render: d => {
//                 if (!d) return <span style={{ color: C.muted }}>—</span>;
//                 const m = moment(d);
//                 const isLate = m.isBefore(moment(), 'day');
//                 return <span style={{ color: isLate ? C.overdue : C.muted, fontWeight: isLate ? 600 : 400, fontSize: 12 }}>{m.format('DD MMM YY')}</span>;
//             },
//         },
//         {
//             title: 'Status', dataIndex: 'status', key: 'status', width: 120,
//             render: (_, r) => {
//                 const eff = r.due_date && moment(r.due_date).isBefore(moment(), 'day') && r.status !== 'Done' ? 'Over Due' : r.status;
//                 return <StatusBadge status={eff} />;
//             },
//         },
//     ];

//     /* ── Table columns: client ── */
//     const clientTableCols = [
//         { title: '#', render: (_, __, i) => <Text style={{ color: C.muted, fontSize: 12 }}>{i + 1}</Text>, width: 44 },
//         {
//             title: 'Client', dataIndex: 'client_name', key: 'client_name', width: 180,
//             render: v => (
//                 <Tooltip title={v} placement="topLeft">
//                     <Text style={{ fontWeight: 500, fontSize: 13, maxWidth: 160, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
//                         {v}
//                     </Text>
//                 </Tooltip>
//             ),
//             sorter: (a, b) => a.client_name.localeCompare(b.client_name),
//         },
//         {
//             title: 'Group', dataIndex: 'group_name', key: 'group_name', width: 130,
//             render: v => (
//                 <Tooltip title={v} placement="topLeft">
//                     <Text style={{ fontSize: 12, color: C.muted, maxWidth: 120, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
//                         {v || '—'}
//                     </Text>
//                 </Tooltip>
//             ),
//         },
//         {
//             title: 'SPOC', dataIndex: 'spoc_name', key: 'spoc_name', width: 120,
//             render: v => (
//                 <Tooltip title={v} placement="topLeft">
//                     <Text style={{ fontSize: 12, color: C.muted, maxWidth: 110, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
//                         {v || '—'}
//                     </Text>
//                 </Tooltip>
//             ),
//         },
//         {
//             title: 'Time Spent', key: 'time', align: 'right', width: 110,
//             render: (_, r) => <Text style={{ fontSize: 13, fontWeight: 700, color: C.toDo }}>{formatDurationFromMillis(r.total_hours)}</Text>,
//             sorter: (a, b) => a.total_hours - b.total_hours,
//             defaultSortOrder: 'descend',
//         },
//     ];

//     /* ── Table columns: group ── */
//     const groupTableCols = [
//         { title: '#', render: (_, __, i) => <Text style={{ color: C.muted, fontSize: 12 }}>{i + 1}</Text>, width: 44 },
//         {
//             title: 'Client Group', dataIndex: 'client_group_name', key: 'client_group_name',
//             render: v => <Text style={{ fontWeight: 500, fontSize: 13 }}>{v}</Text>,
//             sorter: (a, b) => a.client_group_name.localeCompare(b.client_group_name),
//         },
//         {
//             title: 'SPOC', dataIndex: 'spoc_name', key: 'spoc_name',
//             render: v => <Text style={{ fontSize: 12, color: C.muted }}>{v || '—'}</Text>,
//         },
//         {
//             title: 'Time Spent', key: 'time', align: 'right',
//             render: (_, r) => <Text style={{ fontSize: 13, fontWeight: 700, color: C.toDo }}>{formatDurationFromMillis(r.total_hours)}</Text>,
//             sorter: (a, b) => a.total_hours - b.total_hours,
//             defaultSortOrder: 'descend',
//         },
//     ];

//     /* ── Table columns: employee ── */
//     const employeeTableCols = [
//         { title: '#', render: (_, __, i) => <Text style={{ color: C.muted, fontSize: 12 }}>{i + 1}</Text>, width: 44 },
//         {
//             title: 'Employee', dataIndex: 'name', key: 'name',
//             render: v => (
//                 <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
//                     <div style={{
//                         width: 28, height: 28, borderRadius: '50%',
//                         background: '#fef3c7', color: C.inProgress,
//                         display: 'flex', alignItems: 'center', justifyContent: 'center',
//                         fontSize: 12, fontWeight: 700, flexShrink: 0,
//                     }}>
//                         {(v || 'N')[0]}
//                     </div>
//                     <Text style={{ fontWeight: 500, fontSize: 13 }}>{v || 'N/A'}</Text>
//                 </div>
//             ),
//             sorter: (a, b) => (a.name || '').localeCompare(b.name || ''),
//         },
//         {
//             title: 'Time Spent', key: 'time', align: 'right',
//             render: (_, r) => <Text style={{ fontSize: 13, fontWeight: 700, color: C.inProgress }}>{formatDurationFromMillis(r.total_hours_ms)}</Text>,
//             sorter: (a, b) => a.total_hours_ms - b.total_hours_ms,
//             defaultSortOrder: 'descend',
//         },
//     ];

//     /* ── Employee modal client columns ── */
//     const empModalClientCols = [
//         { title: '#', render: (_, __, i) => <Text style={{ color: C.muted, fontSize: 12 }}>{i + 1}</Text>, width: 44 },
//         {
//             title: 'Client', dataIndex: 'client_name', key: 'client_name',
//             render: v => <Text style={{ fontWeight: 500, fontSize: 13 }}>{v || '—'}</Text>,
//             sorter: (a, b) => (a.client_name || '').localeCompare(b.client_name || ''),
//         },
//         {
//             title: 'Time Spent', key: 'time', align: 'right',
//             render: (_, r) => <Text style={{ fontSize: 13, fontWeight: 700, color: C.inProgress }}>{formatDurationFromMillis(r.total_hours_ms)}</Text>,
//             sorter: (a, b) => a.total_hours_ms - b.total_hours_ms,
//             defaultSortOrder: 'descend',
//         },
//     ];

//     /* ── Error state ── */
//     if (error && !dashboardData) {
//         return (
//             <div style={{ padding: 60, textAlign: 'center', background: C.bg, minHeight: '100vh' }}>
//                 <Text style={{ color: C.overdue, fontSize: 16 }}>{error}</Text><br />
//                 <Button style={{ marginTop: 16 }} onClick={() => { didInit.current = false; }} icon={<ReloadOutlined />}>Retry</Button>
//             </div>
//         );
//     }

//     /* ── Grand total for current tab ── */
//     const grandTotal = tableView === 'employee'
//         ? totalEmpTime
//         : tableView === 'group'
//             ? timePerGroup.reduce((s, r) => s + r.total_hours, 0)
//             : totalTime;

//     /* ══════════════ RENDER ══════════════ */
//     return (
//         <div style={{ background: C.bg, minHeight: '100vh', padding: '24px 28px', fontFamily: '"DM Sans", "Segoe UI", sans-serif' }}>

//             {/* ── Header ── */}
//             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
//                 <div>
//                     <Title level={3} style={{ margin: 0, color: C.text, fontWeight: 800, letterSpacing: '-0.03em' }}>
//                         Task Analytics
//                     </Title>
//                     <Text style={{ color: C.muted, fontSize: 13 }}>
//                         {moment().format('dddd, D MMMM YYYY')} · Real-time overview
//                     </Text>
//                 </div>
//                 <Space>
//                     <Button icon={<ReloadOutlined />} onClick={handleRefresh} loading={loading}>Refresh</Button>
//                     <Button type="primary" onClick={() => navigate('/stt-records')} style={{ background: C.toDo, borderColor: C.toDo }}>
//                         All Tasks →
//                     </Button>
//                 </Space>
//             </div>

//             {/* ── Filters ── */}
//             <div style={{ background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`, marginBottom: 24, overflow: 'hidden' }}>
//                 <div
//                     onClick={() => setFiltersOpen(v => !v)}
//                     style={{ padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', borderBottom: filtersOpen ? `1px solid ${C.border}` : 'none' }}
//                 >
//                     <Space>
//                         <FilterOutlined style={{ color: C.toDo }} />
//                         <Text style={{ fontWeight: 600, color: C.text }}>Filters</Text>
//                         {activeFilterCount > 0 && (
//                             <span style={{ background: C.toDo, color: '#fff', borderRadius: 20, padding: '1px 8px', fontSize: 11, fontWeight: 700 }}>
//                                 {activeFilterCount} active
//                             </span>
//                         )}
//                     </Space>
//                     <Text style={{ color: C.muted, fontSize: 12 }}>{filtersOpen ? '▲ collapse' : '▼ expand'}</Text>
//                 </div>
//                 {filtersOpen && (
//                     <div style={{ padding: '16px 20px' }}>
//                         <Row gutter={[12, 12]}>
//                             <Col xs={24} sm={12} md={8} lg={5}>
//                                 <RangePicker style={{ width: '100%' }} value={dateRange} onChange={setDateRange} size="small" />
//                             </Col>
//                             {[
//                                 { placeholder: 'Client Group', value: selectedClientGroup, onChange: setSelectedClientGroup, items: clientGroups, labelKey: 'group_name' },
//                                 { placeholder: 'Client',       value: selectedClient,      onChange: setSelectedClient,      items: clients,       labelKey: 'name'       },
//                                 { placeholder: 'Team',         value: selectedTeam,        onChange: setSelectedTeam,        items: teams,         labelKey: 'name'       },
//                                 { placeholder: 'Sub Service',  value: selectedSubService,  onChange: setSelectedSubService,  items: subServices,   labelKey: 'name'       },
//                             ].map(({ placeholder, value, onChange, items, labelKey }) => (
//                                 <Col xs={24} sm={12} md={8} lg={4} key={placeholder}>
//                                     <Select mode="multiple" placeholder={placeholder} allowClear showSearch value={value} onChange={onChange}
//                                         style={{ width: '100%' }} size="small"
//                                         filterOption={(inp, opt) => (opt?.children ?? '').toLowerCase().includes(inp.toLowerCase())}>
//                                         {items.map(i => <Option key={i.id} value={i.id}>{i[labelKey]}</Option>)}
//                                     </Select>
//                                 </Col>
//                             ))}
//                             <Col xs={24} sm={12} md={4} lg={3}>
//                                 <Button size="small" onClick={handleClearFilters} icon={<ClearOutlined />} block>Clear</Button>
//                             </Col>
//                         </Row>
//                     </div>
//                 )}
//             </div>

//             {/* ── KPI Cards ── */}
//             <Row gutter={[14, 14]} style={{ marginBottom: 20, flexWrap: 'nowrap' }}>
//                 {[
//                     { title: 'Total Tasks',  value: taskCounts.allTasks,   color: C.all,        lightColor: '#f1f5f9', icon: <FcList />,                    subtitle: 'Across all statuses',          status: 'all'         },
//                     { title: 'To Do',        value: taskCounts.toDo,       color: C.toDo,       lightColor: '#ede9fe', icon: <ClockCircleOutlined />,         subtitle: 'Pending start',                status: 'To Do'       },
//                     { title: 'In Progress',  value: taskCounts.inProgress, color: C.inProgress, lightColor: '#fef3c7', icon: <MinusCircleOutlined />,         subtitle: 'Being worked on',              status: 'In Progress' },
//                     { title: 'Done',         value: taskCounts.done,       color: C.done,       lightColor: '#d1fae5', icon: <CheckCircleOutlined />,         subtitle: `${completionRate}% completion`, status: 'Done'        },
//                     { title: 'Overdue',      value: taskCounts.overdue,    color: C.overdue,    lightColor: '#fee2e2', icon: <ExclamationCircleOutlined />,   subtitle: 'Need attention',               status: 'Over Due'    },
//                 ].map((card) => (
//                     <Col key={card.title} style={{ flex: '1 1 0', minWidth: 0, display: 'flex' }}>
//                         <StatCard {...card} loading={loading} onClick={() => goToTasks(card.status)} />
//                     </Col>
//                 ))}
//             </Row>

//             {/* ── Overall progress bar ── */}
//             {taskCounts.allTasks > 0 && (
//                 <div style={{ background: C.surface, borderRadius: 14, padding: '16px 24px', marginBottom: 20, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
//                     <Text style={{ fontWeight: 600, color: C.text, whiteSpace: 'nowrap', fontSize: 13 }}>Overall Progress</Text>
//                     <div style={{ flex: 1, minWidth: 120 }}>
//                         <Progress
//                             percent={completionRate}
//                             strokeColor={{ '0%': C.toDo, '100%': C.done }}
//                             trailColor="#e2e8f0" strokeWidth={10} showInfo={false}
//                         />
//                     </div>
//                     <div style={{ display: 'flex', gap: 24, flexShrink: 0 }}>
//                         {[
//                             { label: 'Done',     val: taskCounts.done,                            color: C.done       },
//                             { label: 'Active',   val: taskCounts.toDo + taskCounts.inProgress,    color: C.inProgress },
//                             { label: 'Overdue',  val: taskCounts.overdue,                         color: C.overdue    },
//                             { label: 'Complete', val: `${completionRate}%`,                       color: C.text       },
//                         ].map(({ label, val, color }) => (
//                             <div key={label} style={{ textAlign: 'center' }}>
//                                 <div style={{ fontWeight: 700, color, fontSize: 16, lineHeight: 1 }}>{val}</div>
//                                 <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{label}</div>
//                             </div>
//                         ))}
//                     </div>
//                 </div>
//             )}

//             {/* ── Row 1: Pie + Upcoming tasks ── */}
//             <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
//                 <Col xs={24} lg={9}>
//                     <div style={{ background: C.surface, borderRadius: 14, padding: '20px 20px 12px', border: `1px solid ${C.border}`, height: '100%' }}>
//                         <SectionTitle>Status Distribution</SectionTitle>
//                         {loading
//                             ? <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Spin /></div>
//                             : pieData.length > 0
//                                 ? <EChartsReact option={pieOption(pieData)} style={{ height: 300 }} />
//                                 : <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.muted }}>No data</div>
//                         }
//                     </div>
//                 </Col>
//                 <Col xs={24} lg={15}>
//                     <div style={{ background: C.surface, borderRadius: 14, padding: '20px', border: `1px solid ${C.border}`, height: '100%' }}>
//                         <SectionTitle extra={
//                             <Button size="small" type="link" onClick={() => goToTasks('all')} style={{ color: C.toDo, padding: 0 }}>
//                                 View all →
//                             </Button>
//                         }>
//                             Upcoming &amp; Recent Tasks
//                         </SectionTitle>
//                         <Table
//                             dataSource={upcomingTasks}
//                             columns={upcomingCols}
//                             rowKey="id"
//                             size="small"
//                             pagination={false}
//                             loading={loading}
//                             scroll={{ x: 'max-content' }}
//                             onRow={r => ({ onClick: () => goToTasks(r.status), style: { cursor: 'pointer' } })}
//                             locale={{ emptyText: <div style={{ padding: 32, color: C.muted }}>No tasks found 🎉</div> }}
//                         />
//                     </div>
//                 </Col>
//             </Row>

//             {/* ── Row 2: Time Spent ── */}
//             <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
//                 <Col xs={24}>
//                     <div style={{ background: C.surface, borderRadius: 14, padding: '20px', border: `1px solid ${C.border}` }}>
//                         <SectionTitle
//                             extra={
//                                 <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
//                                     <Text style={{ fontSize: 13, color: C.muted }}>
//                                         Total: <strong style={{ color: tableView === 'employee' ? C.inProgress : C.toDo }}>{formatDurationFromMillis(grandTotal)}</strong>
//                                     </Text>
//                                     <Segmented
//                                         size="small"
//                                         options={['By Client', 'By Group', 'By Employee']}
//                                         value={tableView === 'client' ? 'By Client' : tableView === 'group' ? 'By Group' : 'By Employee'}
//                                         onChange={v => setTableView(v === 'By Client' ? 'client' : v === 'By Group' ? 'group' : 'employee')}
//                                     />
//                                 </div>
//                             }
//                         >
//                             Total Time Spent
//                         </SectionTitle>

//                         {/* ── By Client ── */}
//                         {tableView === 'client' && (
//                             timePerClientData.length > 0 ? (
//                                 <Row gutter={[16, 16]}>
//                                     <Col xs={24} xl={12}>
//                                         <Text style={{ fontSize: 12, color: C.muted, display: 'block', marginBottom: 8 }}>
//                                             Top {topClients.length} clients by time logged
//                                         </Text>
//                                         <EChartsReact
//                                             option={barOption(topClients.map(r => ({ name: r.client_name, fullName: r.client_name, ms: r.total_hours })))}
//                                             style={{ height: 280 }}
//                                         />
//                                     </Col>
//                                     <Col xs={24} xl={12}>
//                                         <Table
//                                             dataSource={timePerClientData}
//                                             rowKey="client_id"
//                                             size="small"
//                                             columns={clientTableCols}
//                                             pagination={{ pageSize: 8, size: 'small', showSizeChanger: false }}
//                                             scroll={{ x: 'max-content' }}
//                                             onRow={r => ({ onClick: () => handleClientClick(r.client_id), style: { cursor: 'pointer' } })}
//                                             summary={() => (
//                                                 <Table.Summary.Row style={{ background: '#f8fafc' }}>
//                                                     <Table.Summary.Cell index={0} colSpan={4}>
//                                                         <Text strong style={{ fontSize: 12 }}>Grand Total</Text>
//                                                     </Table.Summary.Cell>
//                                                     <Table.Summary.Cell index={1} align="right">
//                                                         <Text strong style={{ fontSize: 12, color: C.toDo }}>
//                                                             {formatDurationFromMillis(totalTime)}
//                                                         </Text>
//                                                     </Table.Summary.Cell>
//                                                 </Table.Summary.Row>
//                                             )}
//                                         />
//                                     </Col>
//                                 </Row>
//                             ) : (
//                                 <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.muted }}>
//                                     {loading ? <Spin /> : 'No time entries recorded'}
//                                 </div>
//                             )
//                         )}

//                         {/* ── By Group ── */}
//                         {tableView === 'group' && (
//                             timePerGroup.length > 0 ? (
//                                 <Row gutter={[16, 16]}>
//                                     <Col xs={24} xl={12}>
//                                         <Text style={{ fontSize: 12, color: C.muted, display: 'block', marginBottom: 8 }}>
//                                             Top {topGroups.length} groups by time logged
//                                         </Text>
//                                         <EChartsReact
//                                             option={barOption(topGroups.map(r => ({ name: r.client_group_name, fullName: r.client_group_name, ms: r.total_hours })))}
//                                             style={{ height: 280 }}
//                                         />
//                                     </Col>
//                                     <Col xs={24} xl={12}>
//                                         <Table
//                                             dataSource={timePerGroup}
//                                             rowKey="client_group_name"
//                                             size="small"
//                                             columns={groupTableCols}
//                                             pagination={{ pageSize: 8, size: 'small', showSizeChanger: false }}
//                                             scroll={{ x: 'max-content' }}
//                                             summary={() => (
//                                                 <Table.Summary.Row style={{ background: '#f8fafc' }}>
//                                                     <Table.Summary.Cell index={0} colSpan={3}>
//                                                         <Text strong style={{ fontSize: 12 }}>Grand Total</Text>
//                                                     </Table.Summary.Cell>
//                                                     <Table.Summary.Cell index={1} align="right">
//                                                         <Text strong style={{ fontSize: 12, color: C.toDo }}>
//                                                             {formatDurationFromMillis(timePerGroup.reduce((s, r) => s + r.total_hours, 0))}
//                                                         </Text>
//                                                     </Table.Summary.Cell>
//                                                 </Table.Summary.Row>
//                                             )}
//                                         />
//                                     </Col>
//                                 </Row>
//                             ) : (
//                                 <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.muted }}>
//                                     {loading ? <Spin /> : 'No time entries recorded'}
//                                 </div>
//                             )
//                         )}

//                         {/* ── By Employee ── */}
//                         {tableView === 'employee' && (
//                             timePerEmployeeData.length > 0 ? (
//                                 <Row gutter={[16, 16]}>
//                                     <Col xs={24} xl={12}>
//                                         <Text style={{ fontSize: 12, color: C.muted, display: 'block', marginBottom: 8 }}>
//                                             Top {topEmployees.length} employees by time logged
//                                         </Text>
//                                         <EChartsReact
//                                             option={barOption(
//                                                 topEmployees.map(r => ({ name: r.name, fullName: r.name, ms: r.total_hours_ms })),
//                                                 '#f59e0b', '#fbbf24'
//                                             )}
//                                             style={{ height: 280 }}
//                                         />
//                                     </Col>
//                                     <Col xs={24} xl={12}>
//                                         <Table
//                                             dataSource={timePerEmployeeData}
//                                             rowKey="name"
//                                             size="small"
//                                             columns={employeeTableCols}
//                                             pagination={{ pageSize: 8, size: 'small', showSizeChanger: false }}
//                                             scroll={{ x: 'max-content' }}
//                                             onRow={r => ({
//                                                 onClick: () => handleEmployeeClick(r.name),
//                                                 style: { cursor: 'pointer' },
//                                             })}
//                                             summary={() => (
//                                                 <Table.Summary.Row style={{ background: '#f8fafc' }}>
//                                                     <Table.Summary.Cell index={0} colSpan={2}>
//                                                         <Text strong style={{ fontSize: 12 }}>Grand Total</Text>
//                                                     </Table.Summary.Cell>
//                                                     <Table.Summary.Cell index={1} align="right">
//                                                         <Text strong style={{ fontSize: 12, color: C.inProgress }}>
//                                                             {formatDurationFromMillis(totalEmpTime)}
//                                                         </Text>
//                                                     </Table.Summary.Cell>
//                                                 </Table.Summary.Row>
//                                             )}
//                                         />
//                                     </Col>
//                                 </Row>
//                             ) : (
//                                 <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.muted }}>
//                                     {loading ? <Spin /> : 'No time entries recorded'}
//                                 </div>
//                             )
//                         )}
//                     </div>
//                 </Col>
//             </Row>

//             {/* ── Client Detail Modal ── */}
//             <Modal
//                 open={clientModalVisible}
//                 onCancel={() => { setClientModalVisible(false); setDrillVisible(false); }}
//                 footer={null}
//                 width={900}
//                 styles={{ body: { padding: '24px', background: C.bg } }}
//                 title={
//                     <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
//                         <div style={{ width: 38, height: 38, borderRadius: 10, background: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.toDo, fontWeight: 800, fontSize: 16 }}>
//                             {(selectedClientInfo?.name || 'C')[0]}
//                         </div>
//                         <div>
//                             <div style={{ fontWeight: 700, color: C.text, fontSize: 15 }}>{selectedClientInfo?.name || 'Client'}</div>
//                             <div style={{ fontSize: 12, color: C.muted }}>
//                                 {getGroupName(selectedClientInfo)} · {getSpocName(selectedClientInfo)}
//                             </div>
//                         </div>
//                     </div>
//                 }
//             >
//                 {clientModalLoading ? (
//                     <div style={{ textAlign: 'center', padding: 60 }}><Spin size="large" /></div>
//                 ) : clientSummary ? (
//                     <>
//                         <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
//                             {[
//                                 { label: 'Done Tasks',  value: clientSummary.done_count,                               color: C.done,       bg: '#d1fae5', isText: false },
//                                 { label: 'Total Time',  value: formatDurationFromMillis(clientSummary.total_hours_ms),  color: C.toDo,       bg: '#ede9fe', isText: true  },
//                                 { label: 'Employees',   value: clientSummary.employees?.length || 0,                   color: C.inProgress, bg: '#fef3c7', isText: false },
//                                 { label: 'Services',    value: clientSummary.sub_services?.length || 0,                color: '#0ea5e9',    bg: '#e0f2fe', isText: false },
//                             ].map(({ label, value, color, bg, isText }) => (
//                                 <Col span={6} key={label}>
//                                     <div style={{ background: bg, borderRadius: 12, padding: '14px 16px', textAlign: 'center' }}>
//                                         {isText
//                                             ? <div style={{ fontSize: 20, fontWeight: 800, color, lineHeight: 1.1 }}>{value}</div>
//                                             : <CountUp end={value} duration={1.2} style={{ fontSize: 28, fontWeight: 800, color, lineHeight: 1 }} />
//                                         }
//                                         <div style={{ fontSize: 11, color: C.muted, marginTop: 4, fontWeight: 600 }}>{label}</div>
//                                     </div>
//                                 </Col>
//                             ))}
//                         </Row>

//                         <Row gutter={[12, 12]}>
//                             {clientSummary.employees?.length > 0 && (
//                                 <Col xs={24} md={clientSummary.sub_services?.length > 0 ? 12 : 24}>
//                                     <div style={{ background: C.surface, borderRadius: 12, padding: 16, border: `1px solid ${C.border}` }}>
//                                         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
//                                             <Text style={{ fontWeight: 700, fontSize: 13 }}>Employee Hours</Text>
//                                             <Text style={{ fontSize: 11, color: C.muted }}>Click bar for details</Text>
//                                         </div>
//                                         <EChartsReact
//                                             option={hBarOption(clientSummary.employees, '#818cf8', '#6366f1')}
//                                             style={{ height: Math.max(140, clientSummary.employees.length * 32 + 20) }}
//                                             onEvents={{
//                                                 click: (params) => {
//                                                     const reversed = [...clientSummary.employees].reverse();
//                                                     const emp = reversed[params.dataIndex];
//                                                     if (!emp) return;
//                                                     const services = clientSummary.per_employee_services?.[emp.name] || [];
//                                                     setDrillTitle(emp.name);
//                                                     setDrillData(services);
//                                                     setDrillType('employee');
//                                                     setDrillVisible(true);
//                                                 },
//                                             }}
//                                         />
//                                     </div>
//                                 </Col>
//                             )}
//                             {clientSummary.sub_services?.length > 0 && (
//                                 <Col xs={24} md={clientSummary.employees?.length > 0 ? 12 : 24}>
//                                     <div style={{ background: C.surface, borderRadius: 12, padding: 16, border: `1px solid ${C.border}` }}>
//                                         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
//                                             <Text style={{ fontWeight: 700, fontSize: 13 }}>Service Breakdown</Text>
//                                             <Text style={{ fontSize: 11, color: C.muted }}>Click bar for details</Text>
//                                         </div>
//                                         <EChartsReact
//                                             option={hBarOption(clientSummary.sub_services, '#06b6d4', '#0ea5e9')}
//                                             style={{ height: Math.max(140, clientSummary.sub_services.length * 32 + 20) }}
//                                             onEvents={{
//                                                 click: (params) => {
//                                                     const reversed = [...clientSummary.sub_services].reverse();
//                                                     const svc = reversed[params.dataIndex];
//                                                     if (!svc) return;
//                                                     const employees = clientSummary.per_service_employees?.[svc.name] || [];
//                                                     setDrillTitle(svc.name);
//                                                     setDrillData(employees);
//                                                     setDrillType('service');
//                                                     setDrillVisible(true);
//                                                 },
//                                             }}
//                                         />
//                                     </div>
//                                 </Col>
//                             )}
//                         </Row>
//                     </>
//                 ) : (
//                     <div style={{ textAlign: 'center', padding: 40, color: C.muted }}>No data available</div>
//                 )}
//             </Modal>

//             {/* ── Employee Detail Modal ── */}
//             <Modal
//                 open={empModalVisible}
//                 onCancel={() => setEmpModalVisible(false)}
//                 footer={null}
//                 width={700}
//                 styles={{ body: { padding: '24px', background: C.bg } }}
//                 title={
//                     <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
//                         <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.inProgress, fontWeight: 800, fontSize: 16 }}>
//                             {(empModalName || 'E')[0]}
//                         </div>
//                         <div>
//                             <div style={{ fontWeight: 700, color: C.text, fontSize: 15 }}>{empModalName}</div>
//                             <div style={{ fontSize: 12, color: C.muted }}>Client-wise time breakdown</div>
//                         </div>
//                     </div>
//                 }
//             >
//                 {empModalLoading ? (
//                     <div style={{ textAlign: 'center', padding: 60 }}><Spin size="large" /></div>
//                 ) : empModalClients.length > 0 ? (
//                     <>
//                         {/* Mini stat bar */}
//                         <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
//                             <div style={{ flex: 1, minWidth: 120, background: '#fef3c7', borderRadius: 12, padding: '12px 16px', textAlign: 'center' }}>
//                                 <div style={{ fontSize: 22, fontWeight: 800, color: C.inProgress, lineHeight: 1 }}>
//                                     {empModalClients.length}
//                                 </div>
//                                 <div style={{ fontSize: 11, color: C.muted, marginTop: 4, fontWeight: 600 }}>Clients Worked On</div>
//                             </div>
//                             <div style={{ flex: 1, minWidth: 120, background: '#ede9fe', borderRadius: 12, padding: '12px 16px', textAlign: 'center' }}>
//                                 <div style={{ fontSize: 22, fontWeight: 800, color: C.toDo, lineHeight: 1 }}>
//                                     {formatDurationFromMillis(empModalClients.reduce((s, r) => s + (r.total_hours_ms || 0), 0))}
//                                 </div>
//                                 <div style={{ fontSize: 11, color: C.muted, marginTop: 4, fontWeight: 600 }}>Total Time</div>
//                             </div>
//                             <div style={{ flex: 1, minWidth: 120, background: '#d1fae5', borderRadius: 12, padding: '12px 16px', textAlign: 'center' }}>
//                                 <div style={{ fontSize: 22, fontWeight: 800, color: C.done, lineHeight: 1 }}>
//                                     {formatDurationFromMillis(
//                                         empModalClients.length > 0
//                                             ? Math.round(empModalClients.reduce((s, r) => s + (r.total_hours_ms || 0), 0) / empModalClients.length)
//                                             : 0
//                                     )}
//                                 </div>
//                                 <div style={{ fontSize: 11, color: C.muted, marginTop: 4, fontWeight: 600 }}>Avg per Client</div>
//                             </div>
//                         </div>

//                         {/* Horizontal bar chart */}
//                         <div style={{ background: C.surface, borderRadius: 12, padding: 16, border: `1px solid ${C.border}`, marginBottom: 16 }}>
//                             <Text style={{ fontWeight: 700, fontSize: 13, display: 'block', marginBottom: 10 }}>Time per Client</Text>
//                             <EChartsReact
//                                 option={hBarOption(
//                                     [...empModalClients].sort((a, b) => b.total_hours_ms - a.total_hours_ms).slice(0, 10)
//                                         .map(r => ({ name: r.client_name, ms: r.total_hours_ms })),
//                                     '#f59e0b', '#fbbf24'
//                                 )}
//                                 style={{ height: Math.max(120, Math.min(empModalClients.length, 10) * 32 + 24) }}
//                             />
//                         </div>

//                         {/* Full table */}
//                         <Table
//                             dataSource={[...empModalClients].sort((a, b) => b.total_hours_ms - a.total_hours_ms)}
//                             rowKey="client_id"
//                             size="small"
//                             columns={empModalClientCols}
//                             pagination={{ pageSize: 8, size: 'small', showSizeChanger: false }}
//                             scroll={{ x: 'max-content' }}
//                             onRow={r => ({
//                                 onClick: () => {
//                                     const p = new URLSearchParams();
//                                     p.set('employee_name', empModalName);
//                                     if (r.client_id) p.set('client_id', r.client_id);
//                                     const [s, e] = dateRange || [null, null];
//                                     if (s) p.set('start_date', s.format('YYYY-MM-DD'));
//                                     if (e) p.set('end_date',   e.format('YYYY-MM-DD'));
//                                     window.open(`/stt-records?${p.toString()}`, '_blank');
//                                 },
//                                 style: { cursor: 'pointer' },
//                             })}
//                             summary={() => (
//                                 <Table.Summary.Row style={{ background: '#f8fafc' }}>
//                                     <Table.Summary.Cell index={0} colSpan={2}>
//                                         <Text strong style={{ fontSize: 12 }}>Grand Total</Text>
//                                     </Table.Summary.Cell>
//                                     <Table.Summary.Cell index={1} align="right">
//                                         <Text strong style={{ fontSize: 12, color: C.inProgress }}>
//                                             {formatDurationFromMillis(empModalClients.reduce((s, r) => s + (r.total_hours_ms || 0), 0))}
//                                         </Text>
//                                     </Table.Summary.Cell>
//                                 </Table.Summary.Row>
//                             )}
//                         />
//                         <Text style={{ fontSize: 11, color: C.muted, display: 'block', marginTop: 10 }}>
//                             💡 Click any row to open STT Records filtered by this employee + client
//                         </Text>
//                     </>
//                 ) : (
//                     <div style={{ textAlign: 'center', padding: 40, color: C.muted }}>No time entries found</div>
//                 )}
//             </Modal>

//             {/* ── Drill-down Panel (inside client modal) ── */}
//             {drillVisible && typeof document !== 'undefined' && (() => {
//                 const color    = drillType === 'employee' ? '#0ea5e9' : '#6366f1';
//                 const colorEnd = drillType === 'employee' ? '#06b6d4' : '#818cf8';

//                 const panel = (
//                     <div style={{
//                         position: 'fixed',
//                         top: 100,
//                         left: 'calc(50% + 466px)',
//                         width: 360,
//                         maxHeight: '78vh',
//                         zIndex: 1100,
//                         display: 'flex',
//                         flexDirection: 'column',
//                         background: C.surface,
//                         borderRadius: 16,
//                         boxShadow: '0 24px 64px rgba(0,0,0,0.20), 0 4px 16px rgba(0,0,0,0.10)',
//                         border: `1px solid ${C.border}`,
//                         animation: 'drillIn 0.32s cubic-bezier(0.34,1.56,0.64,1) both',
//                         overflow: 'hidden',
//                     }}>
//                         <style>{`
//                             @keyframes drillIn {
//                                 0%   { opacity:0; transform: translateX(-18px) translateY(10px) scale(0.94); }
//                                 60%  { opacity:1; transform: translateX(3px)   translateY(-2px) scale(1.01); }
//                                 100% { opacity:1; transform: translateX(0)     translateY(0)    scale(1);    }
//                             }
//                             .drill-item-enter { animation: drillItemIn 0.22s ease both; }
//                             @keyframes drillItemIn {
//                                 from { opacity:0; transform: translateX(-10px); }
//                                 to   { opacity:1; transform: translateX(0); }
//                             }
//                             .drill-close-btn:hover { background: #e2e8f0 !important; color: #0f172a !important; transform: scale(1.1); }
//                             .drill-close-btn { transition: background 0.15s, color 0.15s, transform 0.15s !important; }
//                         `}</style>

//                         <div style={{
//                             display: 'flex', alignItems: 'center', justifyContent: 'space-between',
//                             padding: '14px 18px',
//                             borderBottom: `1px solid ${C.border}`,
//                             background: drillType === 'employee' ? '#f5f3ff' : '#ecfeff',
//                             flexShrink: 0,
//                         }}>
//                             <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
//                                 <div style={{
//                                     width: 32, height: 32, borderRadius: 8,
//                                     background: drillType === 'employee' ? '#ede9fe' : '#cffafe',
//                                     display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15,
//                                 }}>
//                                     {drillType === 'employee' ? '🛠' : '👤'}
//                                 </div>
//                                 <div>
//                                     <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
//                                         {drillType === 'employee' ? 'Services by' : 'Employees on'}
//                                     </div>
//                                     <div style={{ fontSize: 13, fontWeight: 700, color: C.text, lineHeight: 1.3, maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
//                                         {drillTitle}
//                                     </div>
//                                 </div>
//                             </div>
//                             <button
//                                 onClick={() => setDrillVisible(false)}
//                                 className="drill-close-btn"
//                                 style={{
//                                     background: 'none', border: 'none', cursor: 'pointer',
//                                     color: C.muted, fontSize: 20, lineHeight: 1,
//                                     padding: '4px 8px', borderRadius: 8,
//                                     display: 'flex', alignItems: 'center', justifyContent: 'center',
//                                     flexShrink: 0,
//                                 }}
//                             >
//                                 ×
//                             </button>
//                         </div>

//                         <div style={{ overflowY: 'auto', padding: '16px 18px', flex: 1 }}>
//                             {drillData.length === 0 ? (
//                                 <div style={{ textAlign: 'center', padding: '32px 0', color: C.muted, fontSize: 13 }}>No data available</div>
//                             ) : (
//                                 <>
//                                     <EChartsReact
//                                         option={hBarOption(drillData, colorEnd, color)}
//                                         style={{ height: Math.max(90, drillData.length * 30 + 16) }}
//                                     />
//                                     <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
//                                         <div style={{ fontSize: 11, color: C.muted, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
//                                             <span>💡</span>
//                                             <span>Click any row to open STT Records</span>
//                                         </div>
//                                         {[...drillData].sort((a, b) => b.ms - a.ms).map((d, i) => {
//                                             const maxMs = drillData[0]?.ms || 1;
//                                             const pct   = Math.round((d.ms / maxMs) * 100);

//                                             const handleDrillItemClick = () => {
//                                                 const p = new URLSearchParams();
//                                                 if (selectedClientInfo?.id) p.set('client_id', selectedClientInfo.id);
//                                                 const [s, e] = dateRange || [null, null];
//                                                 if (s) p.set('start_date', s.format('YYYY-MM-DD'));
//                                                 if (e) p.set('end_date',   e.format('YYYY-MM-DD'));
//                                                 if (drillType === 'employee') {
//                                                     p.set('employee_name', d.name);
//                                                 } else {
//                                                     p.set('sub_service_name', d.name);
//                                                 }
//                                                 window.open(`/stt-records?${p.toString()}`, '_blank');
//                                             };

//                                             return (
//                                                 <div
//                                                     key={d.name}
//                                                     className="drill-item-enter"
//                                                     onClick={handleDrillItemClick}
//                                                     style={{
//                                                         padding: '8px 12px', borderRadius: 10,
//                                                         background: C.bg, border: `1px solid ${C.border}`,
//                                                         animationDelay: `${0.18 + i * 0.055}s`,
//                                                         cursor: 'pointer',
//                                                         transition: 'background 0.15s, border-color 0.15s, transform 0.15s',
//                                                     }}
//                                                     onMouseEnter={e => {
//                                                         e.currentTarget.style.background = C.surface;
//                                                         e.currentTarget.style.borderColor = color;
//                                                         e.currentTarget.style.transform = 'translateX(3px)';
//                                                     }}
//                                                     onMouseLeave={e => {
//                                                         e.currentTarget.style.background = C.bg;
//                                                         e.currentTarget.style.borderColor = C.border;
//                                                         e.currentTarget.style.transform = 'translateX(0)';
//                                                     }}
//                                                 >
//                                                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
//                                                         <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
//                                                             <span style={{ fontSize: 10, fontWeight: 700, color: C.muted, flexShrink: 0 }}>#{i + 1}</span>
//                                                             <span title={d.name} style={{
//                                                                 fontSize: 12, fontWeight: 500, color: C.text,
//                                                                 overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
//                                                                 maxWidth: 190,
//                                                             }}>{d.name}</span>
//                                                         </div>
//                                                         <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, marginLeft: 8 }}>
//                                                             <span style={{ fontSize: 11, fontWeight: 700, color }}>{formatDurationFromMillis(d.ms)}</span>
//                                                             <span style={{ fontSize: 11, color: C.muted }}>→</span>
//                                                         </div>
//                                                     </div>
//                                                     <div style={{ height: 3, background: C.border, borderRadius: 4 }}>
//                                                         <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 4, transition: 'width 0.5s ease' }} />
//                                                     </div>
//                                                 </div>
//                                             );
//                                         })}
//                                     </div>
//                                 </>
//                             )}
//                         </div>
//                     </div>
//                 );

//                 return ReactDOM.createPortal(panel, document.body);
//             })()}

//         </div>
//     );
// };

// export default TaskDashboard;


// import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
// import ReactDOM from 'react-dom';
// import {
//     Col, Row, Typography, message, Table, DatePicker,
//     Select, Space, Button, Segmented, Modal, Spin, Progress, Tooltip,
// } from 'antd';
// import { api } from '../../../services/api';
// import EChartsReact from 'echarts-for-react';
// import CountUp from 'react-countup';
// import {
//     ClockCircleOutlined, CheckCircleOutlined,
//     MinusCircleOutlined, ExclamationCircleOutlined,
//     FilterOutlined, ClearOutlined, ReloadOutlined,
// } from '@ant-design/icons';
// import { FcList } from 'react-icons/fc';
// import moment from 'moment';
// import { formatDurationFromMillis } from './STT_Records';
// import { useNavigate } from 'react-router-dom';

// const { Title, Text } = Typography;
// const { RangePicker } = DatePicker;
// const { Option } = Select;

// /* ─── Design tokens ─────────────────────────────────────────── */
// const C = {
//     done:       '#10b981',
//     inProgress: '#f59e0b',
//     overdue:    '#ef4444',
//     toDo:       '#6366f1',
//     all:        '#0f172a',
//     bg:         '#f1f5f9',
//     surface:    '#ffffff',
//     border:     '#e2e8f0',
//     text:       '#0f172a',
//     muted:      '#64748b',
// };

// const STATUS_META = {
//     'Done':        { color: C.done,       light: '#d1fae5' },
//     'In Progress': { color: C.inProgress, light: '#fef3c7' },
//     'Over Due':    { color: C.overdue,    light: '#fee2e2' },
//     'To Do':       { color: C.toDo,       light: '#ede9fe' },
// };

// /* ─── Stat Card ─────────────────────────────────────────────── */
// const StatCard = ({ title, value, color, lightColor, icon, subtitle, onClick, loading }) => (
//     <div
//         onClick={onClick}
//         style={{
//             background: C.surface, borderRadius: 16, padding: '20px 22px',
//             cursor: 'pointer', border: `1px solid ${C.border}`,
//             borderTop: `4px solid ${color}`,
//             transition: 'all 0.2s', flex: 1, minWidth: 0,
//             boxShadow: '0 1px 4px rgba(0,0,0,0.06)', position: 'relative', overflow: 'hidden',
//         }}
//         onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = `0 10px 28px ${color}28`; }}
//         onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)'; }}
//     >
//         <div style={{ position: 'absolute', right: 18, top: 18, width: 44, height: 44, borderRadius: 12, background: lightColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color }}>
//             {icon}
//         </div>
//         <Text style={{ fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: '0.07em', textTransform: 'uppercase' }}>
//             {title}
//         </Text>
//         <div style={{ marginTop: 8 }}>
//             {loading
//                 ? <div style={{ fontSize: 28, fontWeight: 700, color: C.muted }}>—</div>
//                 : <CountUp end={value} duration={1.6} style={{ fontSize: 34, fontWeight: 800, color, lineHeight: 1 }} />
//             }
//         </div>
//         {subtitle && <Text style={{ fontSize: 11, color: C.muted, marginTop: 6, display: 'block' }}>{subtitle}</Text>}
//     </div>
// );

// /* ─── Section header ────────────────────────────────────────── */
// const SectionTitle = ({ children, extra }) => (
//     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
//         <Text style={{ fontSize: 14, fontWeight: 700, color: C.text, letterSpacing: '-0.01em' }}>{children}</Text>
//         {extra}
//     </div>
// );

// /* ─── Status Badge ──────────────────────────────────────────── */
// const StatusBadge = ({ status }) => {
//     const meta = STATUS_META[status] || { color: C.muted, light: '#f1f5f9' };
//     return (
//         <span style={{
//             background: meta.light, color: meta.color,
//             borderRadius: 20, padding: '2px 10px',
//             fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap',
//         }}>
//             {status}
//         </span>
//     );
// };

// /* ─── Chart helpers ─────────────────────────────────────────── */
// const pieOption = (data) => ({
//     backgroundColor: 'transparent',
//     tooltip: {
//         trigger: 'item',
//         formatter: '{b}: <b>{c}</b> ({d}%)',
//         backgroundColor: '#1e293b', borderColor: 'transparent',
//         textStyle: { color: '#f1f5f9', fontSize: 13 },
//     },
//     legend: {
//         orient: 'horizontal', bottom: 0, left: 'center',
//         textStyle: { color: C.muted, fontSize: 12 },
//         itemWidth: 10, itemHeight: 10,
//     },
//     series: [{
//         type: 'pie', radius: ['42%', '70%'], center: ['50%', '44%'],
//         avoidLabelOverlap: true,
//         itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
//         label: { show: true, formatter: '{b}\n{c}', fontSize: 11, color: C.muted, lineHeight: 16 },
//         labelLine: { length: 10, length2: 6 },
//         data: data.map(d => ({ ...d, itemStyle: { color: STATUS_META[d.name]?.color || '#94a3b8' } })),
//         emphasis: { itemStyle: { shadowBlur: 12, shadowColor: 'rgba(0,0,0,0.15)' } },
//     }],
// });

// const barOption = (data, colorStart = '#6366f1', colorEnd = '#818cf8') => ({
//     backgroundColor: 'transparent',
//     tooltip: {
//         trigger: 'axis', axisPointer: { type: 'shadow' },
//         backgroundColor: '#1e293b', borderColor: 'transparent',
//         textStyle: { color: '#f1f5f9', fontSize: 12 },
//         formatter: (params) => {
//             const p = params[0];
//             const orig = data[p.dataIndex];
//             return `<b>${orig?.fullName || p.name}</b><br/>${formatDurationFromMillis(p.value)}`;
//         },
//     },
//     grid: { top: 16, right: 16, bottom: 48, left: 16, containLabel: true },
//     xAxis: {
//         type: 'category',
//         data: data.map(d => d.name.length > 13 ? d.name.slice(0, 12) + '…' : d.name),
//         axisLabel: { color: C.muted, fontSize: 11, rotate: data.length > 5 ? 30 : 0, interval: 0 },
//         axisLine: { lineStyle: { color: C.border } },
//         axisTick: { show: false },
//     },
//     yAxis: {
//         type: 'value',
//         axisLabel: { color: C.muted, fontSize: 10, formatter: v => formatDurationFromMillis(v) },
//         splitLine: { lineStyle: { color: C.border, type: 'dashed' } },
//         axisLine: { show: false }, axisTick: { show: false },
//     },
//     series: [{
//         type: 'bar',
//         data: data.map(d => ({
//             value: d.ms,
//             itemStyle: {
//                 color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: colorStart }, { offset: 1, color: colorEnd }] },
//                 borderRadius: [6, 6, 0, 0],
//             },
//         })),
//         barMaxWidth: 48,
//         emphasis: {
//             itemStyle: {
//                 color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: colorEnd }, { offset: 1, color: colorStart }] },
//             },
//         },
//     }],
// });

// const hBarOption = (data, colorStart = '#06b6d4', colorEnd = '#0ea5e9') => {
//     const reversed = [...data].reverse();
//     return {
//         backgroundColor: 'transparent',
//         tooltip: {
//             trigger: 'axis', axisPointer: { type: 'shadow' },
//             backgroundColor: '#1e293b', borderColor: 'transparent',
//             textStyle: { color: '#f1f5f9', fontSize: 12 },
//             formatter: (params) => `<b>${params[0].name}</b><br/>${formatDurationFromMillis(params[0].value)}`,
//         },
//         grid: { top: 4, right: 96, bottom: 4, left: 8, containLabel: true },
//         xAxis: { type: 'value', show: false, splitLine: { show: false } },
//         yAxis: {
//             type: 'category',
//             data: reversed.map(d => d.name?.length > 18 ? d.name.slice(0, 17) + '…' : d.name || 'N/A'),
//             axisLabel: { color: C.muted, fontSize: 11 },
//             axisLine: { show: false }, axisTick: { show: false },
//         },
//         series: [{
//             type: 'bar',
//             data: reversed.map(d => ({
//                 value: d.ms || 0,
//                 itemStyle: {
//                     color: { type: 'linear', x: 0, y: 0, x2: 1, y2: 0, colorStops: [{ offset: 0, color: colorStart }, { offset: 1, color: colorEnd }] },
//                     borderRadius: [0, 6, 6, 0],
//                 },
//             })),
//             barMaxWidth: 18,
//             label: {
//                 show: true, position: 'right',
//                 formatter: p => formatDurationFromMillis(p.value),
//                 color: C.muted, fontSize: 10,
//             },
//         }],
//     };
// };

// /* ─── Shared table column builder ───────────────────────────── */
// const makeIndexCol = () => ({
//     title: '#',
//     render: (_, __, i) => <Text style={{ color: C.muted, fontSize: 12 }}>{i + 1}</Text>,
//     width: 44,
// });

// const makeTimeCol = (colorKey = C.toDo, msField = 'total_hours') => ({
//     title: 'Time Spent',
//     key: 'time',
//     align: 'right',
//     width: 120,
//     render: (_, r) => (
//         <Text style={{ fontSize: 13, fontWeight: 700, color: colorKey }}>
//             {formatDurationFromMillis(r[msField])}
//         </Text>
//     ),
//     sorter: (a, b) => (a[msField] || 0) - (b[msField] || 0),
//     defaultSortOrder: 'descend',
// });

// /* ══════════════ MAIN COMPONENT ══════════════ */
// const TaskDashboard = () => {
//     const navigate = useNavigate();

//     const [loading,             setLoading]             = useState(true);
//     const [dashboardData,       setDashboardData]       = useState(null);
//     const [error,               setError]               = useState(null);
//     const [dateRange,           setDateRange]           = useState(null);
//     const [clients,             setClients]             = useState([]);
//     const [selectedClient,      setSelectedClient]      = useState([]);
//     const [teams,               setTeams]               = useState([]);
//     const [selectedTeam,        setSelectedTeam]        = useState([]);
//     const [clientGroups,        setClientGroups]        = useState([]);
//     const [selectedClientGroup, setSelectedClientGroup] = useState([]);
//     const [allSpocs,            setAllSpocs]            = useState([]);
//     const [subServices,         setSubServices]         = useState([]);
//     const [selectedSubService,  setSelectedSubService]  = useState([]);
//     const [tableView,           setTableView]           = useState('client');
//     const [taskCounts,          setTaskCounts]          = useState({ allTasks: 0, done: 0, toDo: 0, overdue: 0, inProgress: 0 });
//     const [filtersOpen,         setFiltersOpen]         = useState(false);
//     const [timePerClientData,   setTimePerClientData]   = useState([]);
//     const [timePerEmployeeData, setTimePerEmployeeData] = useState([]);

//     // Client modal
//     const [clientModalVisible,  setClientModalVisible]  = useState(false);
//     const [clientModalLoading,  setClientModalLoading]  = useState(false);
//     const [selectedClientInfo,  setSelectedClientInfo]  = useState(null);
//     const [clientSummary,       setClientSummary]       = useState(null);

//     // Employee modal
//     const [empModalVisible,     setEmpModalVisible]     = useState(false);
//     const [empModalLoading,     setEmpModalLoading]     = useState(false);
//     const [empModalName,        setEmpModalName]        = useState('');
//     const [empModalClients,     setEmpModalClients]     = useState([]);

//     // Employee modal sub-drill (click a client bar → show sub-services)
//     const [empDrillVisible,     setEmpDrillVisible]     = useState(false);
//     const [empDrillClient,      setEmpDrillClient]      = useState(null);
//     const [empDrillServices,    setEmpDrillServices]    = useState([]);
//     const [empDrillLoading,     setEmpDrillLoading]     = useState(false);

//     // Client-modal drill panel
//     const [drillVisible,        setDrillVisible]        = useState(false);
//     const [drillTitle,          setDrillTitle]          = useState('');
//     const [drillData,           setDrillData]           = useState([]);
//     const [drillType,           setDrillType]           = useState('');

//     const mountedRef = useRef(true);
//     useEffect(() => { mountedRef.current = true; return () => { mountedRef.current = false; }; }, []);

//     const clientGroupsRef = useRef([]);
//     const allSpocsRef     = useRef([]);
//     useEffect(() => { clientGroupsRef.current = clientGroups; }, [clientGroups]);
//     useEffect(() => { allSpocsRef.current = allSpocs; }, [allSpocs]);

//     const getSpocName = useCallback((client) => {
//         if (!client) return 'N/A';
//         if (client.primary_spoc_name) return client.primary_spoc_name;
//         const groups = clientGroupsRef.current;
//         const group = groups.find(g => g.clients?.some(cg => (typeof cg === 'object' ? cg.id : cg) === client.id));
//         if (group?.primary_spoc_name) return group.primary_spoc_name;
//         if (typeof client.primary_spoc === 'number') {
//             const spoc = allSpocsRef.current.find(s => s.id === client.primary_spoc);
//             if (spoc) return `${spoc.first_name || ''} ${spoc.last_name || ''}`.trim() || spoc.user?.email || 'N/A';
//         }
//         return 'N/A';
//     }, []);

//     const getGroupName = useCallback((client) => {
//         if (!client) return 'N/A';
//         const groups = clientGroupsRef.current;
//         const group = groups.find(g => g.clients?.some(cg => (typeof cg === 'object' ? cg.id : cg) === client.id));
//         return group?.group_name || 'N/A';
//     }, []);

//     const buildParams = (filters = {}) => {
//         const p = {
//             start_date:      filters.startDate?.format('YYYY-MM-DD'),
//             end_date:        filters.endDate?.format('YYYY-MM-DD'),
//             client_id:       filters.clientId?.length      ? filters.clientId.join(',')       : undefined,
//             // FIX: send team_id as exact IDs — do NOT do string-contains matching client-side
//             team_id:         filters.teamId?.length        ? filters.teamId.join(',')         : undefined,
//             client_group_id: filters.clientGroupId?.length ? filters.clientGroupId.join(',') : undefined,
//             sub_service_id:  filters.subServiceId?.length  ? filters.subServiceId.join(',')  : undefined,
//         };
//         Object.keys(p).forEach(k => p[k] === undefined && delete p[k]);
//         return p;
//     };

//     /* ── Fetches ── */
//     const fetchDashboard = useCallback(async (params) => {
//         if (!mountedRef.current) return;
//         setLoading(true);
//         try {
//             const res = await api.get('/clients/tasks/dashboard_summary/', { params });
//             if (mountedRef.current) setDashboardData(res.data);
//         } catch (err) {
//             console.error(err);
//             if (mountedRef.current) { setError('Failed to load dashboard data.'); message.error('Failed to load dashboard.'); }
//         } finally {
//             if (mountedRef.current) setLoading(false);
//         }
//     }, []);

//     const fetchTimePerClient = useCallback(async (params, clientsList) => {
//         if (!mountedRef.current) return;
//         try {
//             const res = await api.get('/clients/tasks/time_per_client/', { params });
//             if (!mountedRef.current) return;
//             setTimePerClientData((res.data || []).map(row => {
//                 const c = (clientsList || []).find(x => x.id === row.client_id);
//                 return {
//                     ...row,
//                     total_hours: row.total_hours_ms,
//                     group_name:  c ? getGroupName(c) : 'N/A',
//                     spoc_name:   c ? getSpocName(c) : 'N/A',
//                 };
//             }));
//         } catch (err) { console.error('fetchTimePerClient error:', err); }
//     }, [getGroupName, getSpocName]);

//     const fetchTimePerEmployee = useCallback(async (params) => {
//         if (!mountedRef.current) return;
//         try {
//             const res = await api.get('/clients/tasks/time_per_employee/', { params });
//             if (mountedRef.current) setTimePerEmployeeData(res.data || []);
//         } catch (err) { console.error('fetchTimePerEmployee error:', err); }
//     }, []);

//     /* ── Initial load ── */
//     const didInit = useRef(false);
//     useEffect(() => {
//         if (didInit.current) return;
//         didInit.current = true;
//         (async () => {
//             setLoading(true);
//             try {
//                 const [cR, tR, gR, sR, ssR] = await Promise.all([
//                     api.get('/clients/clients/?page_size=500'),
//                     api.get('/employee/teams/'),
//                     api.get('/clients/client-groups/'),
//                     api.get('/employee/employees/'),
//                     api.get('/clients/subservices/'),
//                 ]);
//                 if (!mountedRef.current) return;
//                 const cl = cR.data.results || cR.data;
//                 const gr = gR.data.results || gR.data;
//                 const sp = sR.data.results || sR.data;
//                 setClients(cl); setTeams(tR.data.results || tR.data);
//                 setClientGroups(gr); setAllSpocs(sp); setSubServices(ssR.data.results || ssR.data);
//                 clientGroupsRef.current = gr; allSpocsRef.current = sp;
//                 await Promise.all([fetchDashboard({}), fetchTimePerClient({}, cl), fetchTimePerEmployee({})]);
//             } catch (err) {
//                 console.error('fetchInitialData error:', err);
//                 if (mountedRef.current) setError('Failed to load initial data.');
//             } finally {
//                 if (mountedRef.current) setLoading(false);
//             }
//         })();
//     }, [fetchDashboard, fetchTimePerClient, fetchTimePerEmployee]);

//     /* ── Re-fetch on filter change ── */
//     const isFirstRender = useRef(true);
//     useEffect(() => {
//         if (isFirstRender.current) { isFirstRender.current = false; return; }
//         const [startDate, endDate] = dateRange || [null, null];
//         const f = {
//             startDate,
//             endDate,
//             clientId:      selectedClient,
//             // FIX: pass exact numeric IDs — the team filter dropdown uses item.id
//             teamId:        selectedTeam,
//             clientGroupId: selectedClientGroup,
//             subServiceId:  selectedSubService,
//         };
//         const p = buildParams(f);
//         fetchDashboard(p);
//         fetchTimePerClient(p, clients);
//         fetchTimePerEmployee(p);
//         // eslint-disable-next-line react-hooks/exhaustive-deps
//     }, [dateRange, selectedClient, selectedTeam, selectedClientGroup, selectedSubService]);

//     /* ── Derive task counts directly from dashboardData so they always reflect the filtered response ── */
//     useEffect(() => {
//         if (!dashboardData?.status_counts) return;
//         const sc = dashboardData.status_counts;
//         setTaskCounts({
//             allTasks:   (sc['To Do'] || 0) + (sc['In Progress'] || 0) + (sc['Done'] || 0) + (sc['Over Due'] || 0),
//             done:       sc['Done']        || 0,
//             toDo:       sc['To Do']       || 0,
//             inProgress: sc['In Progress'] || 0,
//             overdue:    sc['Over Due']    || 0,
//         });
//     }, [dashboardData]);

//     /* ── Derived ── */
//     const timePerGroup = useMemo(() =>
//         timePerClientData.reduce((acc, row) => {
//             if (!row.group_name || row.group_name === 'N/A') return acc;
//             const ex = acc.find(g => g.client_group_name === row.group_name);
//             if (ex) ex.total_hours += row.total_hours;
//             else acc.push({ client_group_name: row.group_name, spoc_name: row.spoc_name, total_hours: row.total_hours });
//             return acc;
//         }, [])
//     , [timePerClientData]);

//     const pieData      = useMemo(() =>
//         dashboardData?.status_counts
//             ? Object.entries(dashboardData.status_counts).filter(([k, v]) => k !== 'total' && v > 0).map(([name, value]) => ({ name, value }))
//             : []
//     , [dashboardData]);

//     const topClients   = useMemo(() => [...timePerClientData].sort((a, b) => b.total_hours - a.total_hours).slice(0, 10), [timePerClientData]);
//     const topGroups    = useMemo(() => [...timePerGroup].sort((a, b) => b.total_hours - a.total_hours).slice(0, 10), [timePerGroup]);
//     const topEmployees = useMemo(() => [...timePerEmployeeData].sort((a, b) => b.total_hours_ms - a.total_hours_ms).slice(0, 10), [timePerEmployeeData]);

//     const totalTime      = useMemo(() => timePerClientData.reduce((s, r) => s + (r.total_hours || 0), 0), [timePerClientData]);
//     const totalEmpTime   = useMemo(() => timePerEmployeeData.reduce((s, r) => s + (r.total_hours_ms || 0), 0), [timePerEmployeeData]);
//     const completionRate = taskCounts.allTasks ? Math.round((taskCounts.done / taskCounts.allTasks) * 100) : 0;

//     // Count only filters that have actual values selected
//     const activeFilterCount = [selectedClient, selectedTeam, selectedClientGroup, selectedSubService]
//         .filter(a => Array.isArray(a) && a.length > 0).length + (dateRange ? 1 : 0);

//     const grandTotal = tableView === 'employee'
//         ? totalEmpTime
//         : tableView === 'group'
//             ? timePerGroup.reduce((s, r) => s + r.total_hours, 0)
//             : totalTime;

//     const handleClearFilters = () => {
//         setDateRange(null); setSelectedClient([]); setSelectedTeam([]); setSelectedClientGroup([]); setSelectedSubService([]);
//     };

//     /* ── Navigate to tasks with current filters ── */
//     const goToTasks = (status) => {
//         const params = new URLSearchParams();
//         if (status !== 'all') params.set('status', status);
//         const [s, e] = dateRange || [null, null];
//         if (s) params.set('start_date', s.format('YYYY-MM-DD'));
//         if (e) params.set('end_date',   e.format('YYYY-MM-DD'));
//         if (selectedClient?.length)      params.set('client_id',      selectedClient.join(','));
//         if (selectedTeam?.length)        params.set('team_id',         selectedTeam.join(','));
//         if (selectedClientGroup?.length) params.set('client_group_id', selectedClientGroup.join(','));
//         if (selectedSubService?.length)  params.set('sub_service_id',  selectedSubService.join(','));
//         navigate(`/stt-records?${params.toString()}`);
//     };

//     const handleRefresh = useCallback(() => {
//         const [startDate, endDate] = dateRange || [null, null];
//         const f = {
//             startDate, endDate,
//             clientId:      selectedClient,
//             teamId:        selectedTeam,
//             clientGroupId: selectedClientGroup,
//             subServiceId:  selectedSubService,
//         };
//         const p = buildParams(f);
//         fetchDashboard(p); fetchTimePerClient(p, clients); fetchTimePerEmployee(p);
//     }, [dateRange, selectedClient, selectedTeam, selectedClientGroup, selectedSubService, clients, fetchDashboard, fetchTimePerClient, fetchTimePerEmployee]);

//     /* ── Client modal ── */
//     const handleClientClick = useCallback(async (clientId) => {
//         const client = clients.find(c => c.id === clientId);
//         setSelectedClientInfo(client); setClientSummary(null);
//         setDrillVisible(false); setDrillData([]);
//         setClientModalVisible(true); setClientModalLoading(true);
//         try {
//             const [startDate, endDate] = dateRange || [null, null];
//             const params = { client_id: clientId };
//             if (startDate) params.start_date = startDate.format('YYYY-MM-DD');
//             if (endDate)   params.end_date   = endDate.format('YYYY-MM-DD');
//             const res = await api.get('/clients/tasks/client_task_summary/', { params });
//             if (mountedRef.current) setClientSummary(res.data);
//         } catch (err) { console.error(err); message.error('Failed to load client details'); }
//         finally { if (mountedRef.current) setClientModalLoading(false); }
//     }, [clients, dateRange]);

//     /* ── Employee modal ── */
//     const handleEmployeeClick = useCallback(async (employeeName) => {
//         setEmpModalName(employeeName);
//         setEmpModalClients([]);
//         setEmpDrillVisible(false);
//         setEmpDrillClient(null);
//         setEmpDrillServices([]);
//         setEmpModalVisible(true);
//         setEmpModalLoading(true);
//         try {
//             const [startDate, endDate] = dateRange || [null, null];
//             const params = { employee_name: employeeName };
//             if (startDate) params.start_date = startDate.format('YYYY-MM-DD');
//             if (endDate)   params.end_date   = endDate.format('YYYY-MM-DD');
//             const res = await api.get('/clients/tasks/time_per_employee_clients/', { params });
//             if (mountedRef.current) setEmpModalClients(res.data || []);
//         } catch (err) { console.error(err); message.error('Failed to load employee details'); }
//         finally { if (mountedRef.current) setEmpModalLoading(false); }
//     }, [dateRange]);

//     /* ── Employee modal: click a client bar → load sub-services (Description) ── */
//     const handleEmpClientBarClick = useCallback(async (clientRow) => {
//         setEmpDrillClient(clientRow);
//         setEmpDrillServices([]);
//         setEmpDrillVisible(true);
//         setEmpDrillLoading(true);
//         try {
//             const [startDate, endDate] = dateRange || [null, null];
//             const params = {
//                 client_id:     clientRow.client_id,
//                 employee_name: empModalName,
//             };
//             if (startDate) params.start_date = startDate.format('YYYY-MM-DD');
//             if (endDate)   params.end_date   = endDate.format('YYYY-MM-DD');
//             const res = await api.get('/clients/tasks/client_task_summary/', { params });
//             // per_employee_services keyed by employee name → [{name, ms}]
//             const raw = res.data?.per_employee_services?.[empModalName] || [];
//             const svcList = raw.map(s => ({
//                 name: s.name,
//                 ms:   s.ms ?? s.total_hours_ms ?? 0,
//             })).filter(s => s.ms > 0);
//             if (mountedRef.current) setEmpDrillServices(svcList);
//         } catch (err) { console.error(err); message.error('Failed to load service breakdown'); }
//         finally { if (mountedRef.current) setEmpDrillLoading(false); }
//     }, [dateRange, empModalName]);

//     /* ── Upcoming tasks ── */
//     const upcomingTasks = useMemo(() => (dashboardData?.tasks || []).slice(0, 8), [dashboardData]);
//     const upcomingCols = [
//         { title: 'Task ID', dataIndex: 'task_id', key: 'task_id', width: 140, render: v => <Text style={{ fontFamily: 'monospace', fontSize: 11, color: C.muted }}>{v}</Text> },
//         { title: 'Client',  dataIndex: 'client_name',      key: 'client_name',      ellipsis: true },
//         { title: 'Service', dataIndex: 'sub_service_name',  key: 'sub_service_name', ellipsis: true },
//         {
//             title: 'Due', dataIndex: 'due_date', key: 'due_date', width: 100,
//             render: d => {
//                 if (!d) return <span style={{ color: C.muted }}>—</span>;
//                 const m = moment(d); const isLate = m.isBefore(moment(), 'day');
//                 return <span style={{ color: isLate ? C.overdue : C.muted, fontWeight: isLate ? 600 : 400, fontSize: 12 }}>{m.format('DD MMM YY')}</span>;
//             },
//         },
//         {
//             title: 'Status', dataIndex: 'status', key: 'status', width: 120,
//             render: (_, r) => {
//                 const eff = r.due_date && moment(r.due_date).isBefore(moment(), 'day') && r.status !== 'Done' ? 'Over Due' : r.status;
//                 return <StatusBadge status={eff} />;
//             },
//         },
//     ];

//     /* ── Shared ── */
//     const sharedRowStyle = { cursor: 'pointer' };
//     const sharedPagination = { pageSize: 8, size: 'small', showSizeChanger: false };

//     /* ── CLIENT table columns ── */
//     const clientTableCols = [
//         makeIndexCol(),
//         {
//             title: 'Client', dataIndex: 'client_name', key: 'client_name',
//             render: v => (
//                 <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
//                     <div style={{
//                         width: 28, height: 28, borderRadius: '50%',
//                         background: '#ede9fe', color: C.toDo,
//                         display: 'flex', alignItems: 'center', justifyContent: 'center',
//                         fontSize: 12, fontWeight: 700, flexShrink: 0,
//                     }}>
//                         {(v || 'C')[0].toUpperCase()}
//                     </div>
//                     <Tooltip title={v} placement="topLeft">
//                         <Text style={{ fontWeight: 500, fontSize: 13, maxWidth: 130, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v || '—'}</Text>
//                     </Tooltip>
//                 </div>
//             ),
//             sorter: (a, b) => (a.client_name || '').localeCompare(b.client_name || ''),
//         },
//         {
//             title: 'Group', dataIndex: 'group_name', key: 'group_name', width: 130,
//             render: v => v && v !== '—' && v !== 'N/A' ? (
//                 <Tooltip title={v} placement="topLeft">
//                     <span style={{
//                         background: '#f0fdf4', color: C.done,
//                         borderRadius: 20, padding: '2px 10px',
//                         fontSize: 11, fontWeight: 600,
//                         maxWidth: 120, display: 'inline-block',
//                         overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
//                         verticalAlign: 'middle',
//                     }}>{v}</span>
//                 </Tooltip>
//             ) : <Text style={{ fontSize: 12, color: C.muted }}>—</Text>,
//         },
//         {
//             title: 'SPOC', dataIndex: 'spoc_name', key: 'spoc_name', width: 120,
//             render: v => v && v !== '—' && v !== 'N/A' ? (
//                 <Tooltip title={v} placement="topLeft">
//                     <span style={{
//                         background: '#f0f9ff', color: '#0ea5e9',
//                         borderRadius: 20, padding: '2px 10px',
//                         fontSize: 11, fontWeight: 600,
//                         maxWidth: 110, display: 'inline-block',
//                         overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
//                         verticalAlign: 'middle',
//                     }}>{v}</span>
//                 </Tooltip>
//             ) : <Text style={{ fontSize: 12, color: C.muted }}>—</Text>,
//         },
//         makeTimeCol(C.toDo, 'total_hours'),
//     ];

//     /* ── GROUP table columns ── */
//     const groupTableCols = [
//         makeIndexCol(),
//         {
//             title: 'Client Group', dataIndex: 'client_group_name', key: 'client_group_name',
//             render: v => (
//                 <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
//                     <div style={{
//                         width: 28, height: 28, borderRadius: '50%',
//                         background: '#f0fdf4', color: C.done,
//                         display: 'flex', alignItems: 'center', justifyContent: 'center',
//                         fontSize: 12, fontWeight: 700, flexShrink: 0,
//                     }}>
//                         {(v || 'G')[0].toUpperCase()}
//                     </div>
//                     <Tooltip title={v} placement="topLeft">
//                         <Text style={{ fontWeight: 500, fontSize: 13, maxWidth: 150, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v || '—'}</Text>
//                     </Tooltip>
//                 </div>
//             ),
//             sorter: (a, b) => (a.client_group_name || '').localeCompare(b.client_group_name || ''),
//         },
//         {
//             title: 'SPOC', dataIndex: 'spoc_name', key: 'spoc_name', width: 140,
//             render: v => v && v !== '—' && v !== 'N/A' ? (
//                 <Tooltip title={v} placement="topLeft">
//                     <span style={{
//                         background: '#f0f9ff', color: '#0ea5e9',
//                         borderRadius: 20, padding: '2px 10px',
//                         fontSize: 11, fontWeight: 600,
//                         maxWidth: 130, display: 'inline-block',
//                         overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
//                         verticalAlign: 'middle',
//                     }}>{v}</span>
//                 </Tooltip>
//             ) : <Text style={{ fontSize: 12, color: C.muted }}>—</Text>,
//         },
//         makeTimeCol(C.toDo, 'total_hours'),
//     ];

//     /* ── EMPLOYEE table columns — includes Team column ── */
//     const employeeTableCols = [
//         makeIndexCol(),
//         {
//             title: 'Employee', dataIndex: 'name', key: 'name',
//             render: v => (
//                 <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
//                     <div style={{
//                         width: 28, height: 28, borderRadius: '50%',
//                         background: '#fef3c7', color: C.inProgress,
//                         display: 'flex', alignItems: 'center', justifyContent: 'center',
//                         fontSize: 12, fontWeight: 700, flexShrink: 0,
//                     }}>
//                         {(v || 'N')[0]}
//                     </div>
//                     <Text style={{ fontWeight: 500, fontSize: 13 }}>{v || 'N/A'}</Text>
//                 </div>
//             ),
//             sorter: (a, b) => (a.name || '').localeCompare(b.name || ''),
//         },
//         {
//             title: 'Team', dataIndex: 'team_name', key: 'team_name', width: 130,
//             render: v => (
//                 <Tooltip title={v} placement="topLeft">
//                     <Text style={{ fontSize: 12, color: C.muted, maxWidth: 120, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v || '—'}</Text>
//                 </Tooltip>
//             ),
//         },
//         makeTimeCol(C.inProgress, 'total_hours_ms'),
//     ];

//     /* ── Employee modal: client breakdown columns ── */
//     const empClientCols = [
//         makeIndexCol(),
//         {
//             title: 'Client', dataIndex: 'client_name', key: 'client_name',
//             render: v => (
//                 <Tooltip title={v} placement="topLeft">
//                     <Text style={{ fontWeight: 500, fontSize: 13, maxWidth: 200, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v || '—'}</Text>
//                 </Tooltip>
//             ),
//             sorter: (a, b) => (a.client_name || '').localeCompare(b.client_name || ''),
//         },
//         makeTimeCol(C.inProgress, 'total_hours_ms'),
//     ];

//     /* ── Sub-service drill table columns (same look as other tables) ── */
//     const empDrillCols = [
//         makeIndexCol(),
//         {
//             title: 'Sub-service / Description', dataIndex: 'name', key: 'name',
//             render: v => (
//                 <Tooltip title={v} placement="topLeft">
//                     <Text style={{ fontWeight: 500, fontSize: 13, maxWidth: 220, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v || '—'}</Text>
//                 </Tooltip>
//             ),
//             sorter: (a, b) => (a.name || '').localeCompare(b.name || ''),
//         },
//         {
//             title: 'Time Spent', dataIndex: 'ms', key: 'ms',
//             align: 'right', width: 120,
//             render: v => (
//                 <Text style={{ fontSize: 13, fontWeight: 700, color: '#f59e0b' }}>
//                     {formatDurationFromMillis(v)}
//                 </Text>
//             ),
//             sorter: (a, b) => (a.ms || 0) - (b.ms || 0),
//             defaultSortOrder: 'descend',
//         },
//     ];

//     /* ── Error state ── */
//     if (error && !dashboardData) {
//         return (
//             <div style={{ padding: 60, textAlign: 'center', background: C.bg, minHeight: '100vh' }}>
//                 <Text style={{ color: C.overdue, fontSize: 16 }}>{error}</Text><br />
//                 <Button style={{ marginTop: 16 }} onClick={() => { didInit.current = false; }} icon={<ReloadOutlined />}>Retry</Button>
//             </div>
//         );
//     }

//     /* ══════════════ RENDER ══════════════ */
//     return (
//         <div style={{ background: C.bg, minHeight: '100vh', padding: '24px 28px', fontFamily: '"DM Sans", "Segoe UI", sans-serif' }}>

//             {/* ── Header ── */}
//             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
//                 <div>
//                     <Title level={3} style={{ margin: 0, color: C.text, fontWeight: 800, letterSpacing: '-0.03em' }}>Task Analytics</Title>
//                     <Text style={{ color: C.muted, fontSize: 13 }}>{moment().format('dddd, D MMMM YYYY')} · Real-time overview</Text>
//                 </div>
//                 <Space>
//                     <Button icon={<ReloadOutlined />} onClick={handleRefresh} loading={loading}>Refresh</Button>
//                     <Button type="primary" onClick={() => navigate('/stt-records')} style={{ background: C.toDo, borderColor: C.toDo }}>All Tasks →</Button>
//                 </Space>
//             </div>

//             {/* ── Filters ── */}
//             <div style={{ background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`, marginBottom: 24, overflow: 'hidden' }}>
//                 <div
//                     onClick={() => setFiltersOpen(v => !v)}
//                     style={{ padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', borderBottom: filtersOpen ? `1px solid ${C.border}` : 'none' }}
//                 >
//                     <Space>
//                         <FilterOutlined style={{ color: C.toDo }} />
//                         <Text style={{ fontWeight: 600, color: C.text }}>Filters</Text>
//                         {activeFilterCount > 0 && (
//                             <span style={{ background: C.toDo, color: '#fff', borderRadius: 20, padding: '1px 8px', fontSize: 11, fontWeight: 700 }}>{activeFilterCount} active</span>
//                         )}
//                     </Space>
//                     <Text style={{ color: C.muted, fontSize: 12 }}>{filtersOpen ? '▲ collapse' : '▼ expand'}</Text>
//                 </div>
//                 {filtersOpen && (
//                     <div style={{ padding: '16px 20px' }}>
//                         <Row gutter={[12, 12]}>
//                             <Col xs={24} sm={12} md={8} lg={5}>
//                                 <RangePicker style={{ width: '100%' }} value={dateRange} onChange={setDateRange} size="small" />
//                             </Col>
//                             {[
//                                 { placeholder: 'Client Group', value: selectedClientGroup, onChange: setSelectedClientGroup, items: clientGroups, labelKey: 'group_name' },
//                                 { placeholder: 'Client',       value: selectedClient,      onChange: setSelectedClient,      items: clients,       labelKey: 'name'       },
//                                 {
//                                     // FIX: Team filter uses item.id (numeric) — label is item.name
//                                     // The backend filters by team_id exactly, so we must NOT do substring matching
//                                     placeholder: 'Team', value: selectedTeam, onChange: setSelectedTeam, items: teams, labelKey: 'name',
//                                 },
//                                 { placeholder: 'Sub Service',  value: selectedSubService,  onChange: setSelectedSubService,  items: subServices,   labelKey: 'name'       },
//                             ].map(({ placeholder, value, onChange, items, labelKey }) => (
//                                 <Col xs={24} sm={12} md={8} lg={4} key={placeholder}>
//                                     <Select
//                                         mode="multiple"
//                                         placeholder={placeholder}
//                                         allowClear
//                                         showSearch
//                                         value={value}
//                                         onChange={onChange}
//                                         style={{ width: '100%' }}
//                                         size="small"
//                                         // FIX: use exact label match only — prevents "IT" matching "Audit" etc.
//                                         filterOption={(inp, opt) =>
//                                             (opt?.children ?? '').toLowerCase().startsWith(inp.toLowerCase()) ||
//                                             (opt?.children ?? '').toLowerCase().includes(inp.toLowerCase())
//                                         }
//                                         optionFilterProp="children"
//                                     >
//                                         {items.map(i => (
//                                             <Option key={i.id} value={i.id}>{i[labelKey]}</Option>
//                                         ))}
//                                     </Select>
//                                 </Col>
//                             ))}
//                             <Col xs={24} sm={12} md={4} lg={3}>
//                                 <Button size="small" onClick={handleClearFilters} icon={<ClearOutlined />} block>Clear</Button>
//                             </Col>
//                         </Row>
//                     </div>
//                 )}
//             </div>

//             {/* ── KPI Cards ── */}
//             <Row gutter={[14, 14]} style={{ marginBottom: 20, flexWrap: 'nowrap' }}>
//                 {[
//                     { title: 'Total Tasks',  value: taskCounts.allTasks,   color: C.all,        lightColor: '#f1f5f9', icon: <FcList />,                  subtitle: 'Across all statuses',           status: 'all'         },
//                     { title: 'To Do',        value: taskCounts.toDo,       color: C.toDo,       lightColor: '#ede9fe', icon: <ClockCircleOutlined />,       subtitle: 'Pending start',                 status: 'To Do'       },
//                     { title: 'In Progress',  value: taskCounts.inProgress, color: C.inProgress, lightColor: '#fef3c7', icon: <MinusCircleOutlined />,       subtitle: 'Being worked on',               status: 'In Progress' },
//                     { title: 'Done',         value: taskCounts.done,       color: C.done,       lightColor: '#d1fae5', icon: <CheckCircleOutlined />,       subtitle: `${completionRate}% completion`, status: 'Done'        },
//                     { title: 'Overdue',      value: taskCounts.overdue,    color: C.overdue,    lightColor: '#fee2e2', icon: <ExclamationCircleOutlined />, subtitle: 'Need attention',                status: 'Over Due'    },
//                 ].map((card) => (
//                     <Col key={card.title} style={{ flex: '1 1 0', minWidth: 0, display: 'flex' }}>
//                         <StatCard {...card} loading={loading} onClick={() => goToTasks(card.status)} />
//                     </Col>
//                 ))}
//             </Row>

//             {/* ── Overall progress bar ── */}
//             {taskCounts.allTasks > 0 && (
//                 <div style={{ background: C.surface, borderRadius: 14, padding: '16px 24px', marginBottom: 20, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
//                     <Text style={{ fontWeight: 600, color: C.text, whiteSpace: 'nowrap', fontSize: 13 }}>Overall Progress</Text>
//                     <div style={{ flex: 1, minWidth: 120 }}>
//                         <Progress percent={completionRate} strokeColor={{ '0%': C.toDo, '100%': C.done }} trailColor="#e2e8f0" strokeWidth={10} showInfo={false} />
//                     </div>
//                     <div style={{ display: 'flex', gap: 24, flexShrink: 0 }}>
//                         {[
//                             { label: 'Done',     val: taskCounts.done,                          color: C.done       },
//                             { label: 'Active',   val: taskCounts.toDo + taskCounts.inProgress,  color: C.inProgress },
//                             { label: 'Overdue',  val: taskCounts.overdue,                       color: C.overdue    },
//                             { label: 'Complete', val: `${completionRate}%`,                     color: C.text       },
//                         ].map(({ label, val, color }) => (
//                             <div key={label} style={{ textAlign: 'center' }}>
//                                 <div style={{ fontWeight: 700, color, fontSize: 16, lineHeight: 1 }}>{val}</div>
//                                 <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{label}</div>
//                             </div>
//                         ))}
//                     </div>
//                 </div>
//             )}

//             {/* ── Pie + Upcoming ── */}
//             <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
//                 <Col xs={24} lg={9}>
//                     <div style={{ background: C.surface, borderRadius: 14, padding: '20px 20px 12px', border: `1px solid ${C.border}`, height: '100%' }}>
//                         <SectionTitle>Status Distribution</SectionTitle>
//                         {loading
//                             ? <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Spin /></div>
//                             : pieData.length > 0
//                                 ? <EChartsReact option={pieOption(pieData)} style={{ height: 300 }} />
//                                 : <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.muted }}>No data</div>
//                         }
//                     </div>
//                 </Col>
//                 <Col xs={24} lg={15}>
//                     <div style={{ background: C.surface, borderRadius: 14, padding: '20px', border: `1px solid ${C.border}`, height: '100%' }}>
//                         <SectionTitle extra={<Button size="small" type="link" onClick={() => goToTasks('all')} style={{ color: C.toDo, padding: 0 }}>View all →</Button>}>
//                             Upcoming &amp; Recent Tasks
//                         </SectionTitle>
//                         <Table
//                             dataSource={upcomingTasks} columns={upcomingCols} rowKey="id" size="small"
//                             pagination={false} loading={loading} scroll={{ x: 'max-content' }}
//                             onRow={r => ({ onClick: () => goToTasks(r.status), style: sharedRowStyle })}
//                             locale={{ emptyText: <div style={{ padding: 32, color: C.muted }}>No tasks found 🎉</div> }}
//                         />
//                     </div>
//                 </Col>
//             </Row>

//             {/* ── Time Spent ── */}
//             <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
//                 <Col xs={24}>
//                     <div style={{ background: C.surface, borderRadius: 14, padding: '20px', border: `1px solid ${C.border}` }}>
//                         <SectionTitle
//                             extra={
//                                 <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
//                                     <Text style={{ fontSize: 13, color: C.muted }}>
//                                         Total: <strong style={{ color: tableView === 'employee' ? C.inProgress : C.toDo }}>{formatDurationFromMillis(grandTotal)}</strong>
//                                     </Text>
//                                     <Segmented
//                                         size="small"
//                                         options={['By Client', 'By Group', 'By Employee']}
//                                         value={tableView === 'client' ? 'By Client' : tableView === 'group' ? 'By Group' : 'By Employee'}
//                                         onChange={v => setTableView(v === 'By Client' ? 'client' : v === 'By Group' ? 'group' : 'employee')}
//                                     />
//                                 </div>
//                             }
//                         >
//                             Total Time Spent
//                         </SectionTitle>

//                         {/* ─ By Client ─ */}
//                         {tableView === 'client' && (
//                             timePerClientData.length > 0 ? (
//                                 <Row gutter={[16, 16]}>
//                                     <Col xs={24} xl={12}>
//                                         <Text style={{ fontSize: 12, color: C.muted, display: 'block', marginBottom: 8 }}>Top {topClients.length} clients by time logged</Text>
//                                         <EChartsReact option={barOption(topClients.map(r => ({ name: r.client_name, fullName: r.client_name, ms: r.total_hours })))} style={{ height: 280 }} />
//                                     </Col>
//                                     <Col xs={24} xl={12}>
//                                         <Table
//                                             dataSource={timePerClientData} rowKey="client_id" size="small"
//                                             columns={clientTableCols} pagination={sharedPagination} scroll={{ x: 'max-content' }}
//                                             onRow={r => ({ onClick: () => handleClientClick(r.client_id), style: sharedRowStyle })}
//                                             summary={() => (
//                                                 <Table.Summary.Row style={{ background: '#f8fafc' }}>
//                                                     <Table.Summary.Cell index={0} colSpan={4}><Text strong style={{ fontSize: 12 }}>Grand Total</Text></Table.Summary.Cell>
//                                                     <Table.Summary.Cell index={1} align="right"><Text strong style={{ fontSize: 12, color: C.toDo }}>{formatDurationFromMillis(totalTime)}</Text></Table.Summary.Cell>
//                                                 </Table.Summary.Row>
//                                             )}
//                                         />
//                                     </Col>
//                                 </Row>
//                             ) : (
//                                 <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.muted }}>{loading ? <Spin /> : 'No time entries recorded'}</div>
//                             )
//                         )}

//                         {/* ─ By Group ─ */}
//                         {tableView === 'group' && (
//                             timePerGroup.length > 0 ? (
//                                 <Row gutter={[16, 16]}>
//                                     <Col xs={24} xl={12}>
//                                         <Text style={{ fontSize: 12, color: C.muted, display: 'block', marginBottom: 8 }}>Top {topGroups.length} groups by time logged</Text>
//                                         <EChartsReact option={barOption(topGroups.map(r => ({ name: r.client_group_name, fullName: r.client_group_name, ms: r.total_hours })))} style={{ height: 280 }} />
//                                     </Col>
//                                     <Col xs={24} xl={12}>
//                                         <Table
//                                             dataSource={timePerGroup} rowKey="client_group_name" size="small"
//                                             columns={groupTableCols} pagination={sharedPagination} scroll={{ x: 'max-content' }}
//                                             summary={() => (
//                                                 <Table.Summary.Row style={{ background: '#f8fafc' }}>
//                                                     <Table.Summary.Cell index={0} colSpan={3}><Text strong style={{ fontSize: 12 }}>Grand Total</Text></Table.Summary.Cell>
//                                                     <Table.Summary.Cell index={1} align="right"><Text strong style={{ fontSize: 12, color: C.toDo }}>{formatDurationFromMillis(timePerGroup.reduce((s, r) => s + r.total_hours, 0))}</Text></Table.Summary.Cell>
//                                                 </Table.Summary.Row>
//                                             )}
//                                         />
//                                     </Col>
//                                 </Row>
//                             ) : (
//                                 <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.muted }}>{loading ? <Spin /> : 'No time entries recorded'}</div>
//                             )
//                         )}

//                         {/* ─ By Employee ─ */}
//                         {tableView === 'employee' && (
//                             timePerEmployeeData.length > 0 ? (
//                                 <Row gutter={[16, 16]}>
//                                     <Col xs={24} xl={12}>
//                                         <Text style={{ fontSize: 12, color: C.muted, display: 'block', marginBottom: 8 }}>Top {topEmployees.length} employees by time logged</Text>
//                                         <EChartsReact
//                                             option={barOption(topEmployees.map(r => ({ name: r.name, fullName: r.name, ms: r.total_hours_ms })), '#f59e0b', '#fbbf24')}
//                                             style={{ height: 280 }}
//                                         />
//                                     </Col>
//                                     <Col xs={24} xl={12}>
//                                         <Table
//                                             dataSource={timePerEmployeeData} rowKey="name" size="small"
//                                             columns={employeeTableCols} pagination={sharedPagination} scroll={{ x: 'max-content' }}
//                                             onRow={r => ({ onClick: () => handleEmployeeClick(r.name), style: sharedRowStyle })}
//                                             summary={() => (
//                                                 <Table.Summary.Row style={{ background: '#f8fafc' }}>
//                                                     <Table.Summary.Cell index={0} colSpan={3}><Text strong style={{ fontSize: 12 }}>Grand Total</Text></Table.Summary.Cell>
//                                                     <Table.Summary.Cell index={1} align="right"><Text strong style={{ fontSize: 12, color: C.inProgress }}>{formatDurationFromMillis(totalEmpTime)}</Text></Table.Summary.Cell>
//                                                 </Table.Summary.Row>
//                                             )}
//                                         />
//                                     </Col>
//                                 </Row>
//                             ) : (
//                                 <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.muted }}>{loading ? <Spin /> : 'No time entries recorded'}</div>
//                             )
//                         )}
//                     </div>
//                 </Col>
//             </Row>

//             {/* ══ CLIENT DETAIL MODAL ══ */}
//             <Modal
//                 open={clientModalVisible}
//                 onCancel={() => { setClientModalVisible(false); setDrillVisible(false); }}
//                 footer={null} width={900}
//                 styles={{ body: { padding: '24px', background: C.bg } }}
//                 title={
//                     <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
//                         <div style={{ width: 38, height: 38, borderRadius: 10, background: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.toDo, fontWeight: 800, fontSize: 16 }}>
//                             {(selectedClientInfo?.name || 'C')[0]}
//                         </div>
//                         <div>
//                             <div style={{ fontWeight: 700, color: C.text, fontSize: 15 }}>{selectedClientInfo?.name || 'Client'}</div>
//                             <div style={{ fontSize: 12, color: C.muted }}>{getGroupName(selectedClientInfo)} · {getSpocName(selectedClientInfo)}</div>
//                         </div>
//                     </div>
//                 }
//             >
//                 {clientModalLoading ? (
//                     <div style={{ textAlign: 'center', padding: 60 }}><Spin size="large" /></div>
//                 ) : clientSummary ? (
//                     <>
//                         <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
//                             {[
//                                 { label: 'Done Tasks',  value: clientSummary.done_count,                               color: C.done,       bg: '#d1fae5', isText: false },
//                                 { label: 'Total Time',  value: formatDurationFromMillis(clientSummary.total_hours_ms),  color: C.toDo,       bg: '#ede9fe', isText: true  },
//                                 { label: 'Employees',   value: clientSummary.employees?.length || 0,                   color: C.inProgress, bg: '#fef3c7', isText: false },
//                                 { label: 'Services',    value: clientSummary.sub_services?.length || 0,                color: '#0ea5e9',    bg: '#e0f2fe', isText: false },
//                             ].map(({ label, value, color, bg, isText }) => (
//                                 <Col span={6} key={label}>
//                                     <div style={{ background: bg, borderRadius: 12, padding: '14px 16px', textAlign: 'center' }}>
//                                         {isText
//                                             ? <div style={{ fontSize: 20, fontWeight: 800, color, lineHeight: 1.1 }}>{value}</div>
//                                             : <CountUp end={value} duration={1.2} style={{ fontSize: 28, fontWeight: 800, color, lineHeight: 1 }} />
//                                         }
//                                         <div style={{ fontSize: 11, color: C.muted, marginTop: 4, fontWeight: 600 }}>{label}</div>
//                                     </div>
//                                 </Col>
//                             ))}
//                         </Row>
//                         <Row gutter={[12, 12]}>
//                             {clientSummary.employees?.length > 0 && (
//                                 <Col xs={24} md={clientSummary.sub_services?.length > 0 ? 12 : 24}>
//                                     <div style={{ background: C.surface, borderRadius: 12, padding: 16, border: `1px solid ${C.border}` }}>
//                                         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
//                                             <Text style={{ fontWeight: 700, fontSize: 13 }}>Employee Hours</Text>
//                                             <Text style={{ fontSize: 11, color: C.muted }}>Click bar for details</Text>
//                                         </div>
//                                         <EChartsReact
//                                             option={hBarOption(clientSummary.employees, '#818cf8', '#6366f1')}
//                                             style={{ height: Math.max(140, clientSummary.employees.length * 32 + 20) }}
//                                             onEvents={{
//                                                 click: (params) => {
//                                                     const reversed = [...clientSummary.employees].reverse();
//                                                     const emp = reversed[params.dataIndex];
//                                                     if (!emp) return;
//                                                     const services = clientSummary.per_employee_services?.[emp.name] || [];
//                                                     setDrillTitle(emp.name); setDrillData(services); setDrillType('employee'); setDrillVisible(true);
//                                                 },
//                                             }}
//                                         />
//                                     </div>
//                                 </Col>
//                             )}
//                             {clientSummary.sub_services?.length > 0 && (
//                                 <Col xs={24} md={clientSummary.employees?.length > 0 ? 12 : 24}>
//                                     <div style={{ background: C.surface, borderRadius: 12, padding: 16, border: `1px solid ${C.border}` }}>
//                                         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
//                                             <Text style={{ fontWeight: 700, fontSize: 13 }}>Service Breakdown</Text>
//                                             <Text style={{ fontSize: 11, color: C.muted }}>Click bar for details</Text>
//                                         </div>
//                                         <EChartsReact
//                                             option={hBarOption(clientSummary.sub_services, '#06b6d4', '#0ea5e9')}
//                                             style={{ height: Math.max(140, clientSummary.sub_services.length * 32 + 20) }}
//                                             onEvents={{
//                                                 click: (params) => {
//                                                     const reversed = [...clientSummary.sub_services].reverse();
//                                                     const svc = reversed[params.dataIndex];
//                                                     if (!svc) return;
//                                                     const employees = clientSummary.per_service_employees?.[svc.name] || [];
//                                                     setDrillTitle(svc.name); setDrillData(employees); setDrillType('service'); setDrillVisible(true);
//                                                 },
//                                             }}
//                                         />
//                                     </div>
//                                 </Col>
//                             )}
//                         </Row>

//                         {/* ── Client-modal inline drill panel ── */}
//                         {drillVisible && (
//                             <div style={{
//                                 marginTop: 20,
//                                 background: C.surface,
//                                 borderRadius: 12,
//                                 border: `2px solid ${drillType === 'employee' ? '#6366f1' : '#0ea5e9'}`,
//                                 padding: 20,
//                             }}>
//                                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
//                                     <div>
//                                         <Text style={{ fontWeight: 700, fontSize: 14, color: C.text }}>
//                                             {drillType === 'employee' ? `Services — ${drillTitle}` : `Employees — ${drillTitle}`}
//                                         </Text>
//                                         <Text style={{ fontSize: 12, color: C.muted, display: 'block' }}>
//                                             {drillType === 'employee' ? 'Time by sub-service for this employee' : 'Time by employee for this service'}
//                                         </Text>
//                                     </div>
//                                     <Button size="small" onClick={() => setDrillVisible(false)}>✕ Close</Button>
//                                 </div>
//                                 {drillData.length > 0 ? (
//                                     <Row gutter={[16, 0]}>
//                                         <Col xs={24} xl={12}>
//                                             <EChartsReact
//                                                 option={hBarOption(
//                                                     drillData.map(d => ({ name: d.name, ms: d.ms ?? d.total_hours_ms ?? 0 })),
//                                                     drillType === 'employee' ? '#818cf8' : '#06b6d4',
//                                                     drillType === 'employee' ? '#6366f1' : '#0ea5e9',
//                                                 )}
//                                                 style={{ height: Math.max(140, drillData.length * 32 + 20) }}
//                                             />
//                                         </Col>
//                                         <Col xs={24} xl={12}>
//                                             <Table
//                                                 dataSource={drillData.map(d => ({ ...d, ms: d.ms ?? d.total_hours_ms ?? 0 }))}
//                                                 rowKey="name"
//                                                 size="small"
//                                                 pagination={sharedPagination}
//                                                 columns={[
//                                                     makeIndexCol(),
//                                                     {
//                                                         title: drillType === 'employee' ? 'Sub-service' : 'Employee',
//                                                         dataIndex: 'name', key: 'name',
//                                                         render: v => (
//                                                             <Tooltip title={v} placement="topLeft">
//                                                                 <Text style={{ fontWeight: 500, fontSize: 13, maxWidth: 200, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v || '—'}</Text>
//                                                             </Tooltip>
//                                                         ),
//                                                         sorter: (a, b) => (a.name || '').localeCompare(b.name || ''),
//                                                     },
//                                                     {
//                                                         title: 'Time Spent', dataIndex: 'ms', key: 'ms',
//                                                         align: 'right', width: 120,
//                                                         render: v => (
//                                                             <Text style={{ fontSize: 13, fontWeight: 700, color: drillType === 'employee' ? '#6366f1' : '#0ea5e9' }}>
//                                                                 {formatDurationFromMillis(v)}
//                                                             </Text>
//                                                         ),
//                                                         sorter: (a, b) => (a.ms || 0) - (b.ms || 0),
//                                                         defaultSortOrder: 'descend',
//                                                     },
//                                                 ]}
//                                                 summary={() => (
//                                                     <Table.Summary.Row style={{ background: '#f8fafc' }}>
//                                                         <Table.Summary.Cell index={0} colSpan={2}><Text strong style={{ fontSize: 12 }}>Total</Text></Table.Summary.Cell>
//                                                         <Table.Summary.Cell index={1} align="right">
//                                                             <Text strong style={{ fontSize: 12, color: drillType === 'employee' ? '#6366f1' : '#0ea5e9' }}>
//                                                                 {formatDurationFromMillis(drillData.reduce((s, d) => s + (d.ms ?? d.total_hours_ms ?? 0), 0))}
//                                                             </Text>
//                                                         </Table.Summary.Cell>
//                                                     </Table.Summary.Row>
//                                                 )}
//                                             />
//                                         </Col>
//                                     </Row>
//                                 ) : (
//                                     <div style={{ textAlign: 'center', padding: 32, color: C.muted }}>No breakdown data found</div>
//                                 )}
//                             </div>
//                         )}
//                     </>
//                 ) : (
//                     <div style={{ textAlign: 'center', padding: 40, color: C.muted }}>No data available</div>
//                 )}
//             </Modal>

//             {/* ══ EMPLOYEE DETAIL MODAL ══ */}
//             <Modal
//                 open={empModalVisible}
//                 onCancel={() => { setEmpModalVisible(false); setEmpDrillVisible(false); }}
//                 footer={null} width={960}
//                 styles={{ body: { padding: '24px', background: C.bg } }}
//                 title={
//                     <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
//                         <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.inProgress, fontWeight: 800, fontSize: 16 }}>
//                             {(empModalName || 'E')[0]}
//                         </div>
//                         <div>
//                             <div style={{ fontWeight: 700, color: C.text, fontSize: 15 }}>{empModalName}</div>
//                             <div style={{ fontSize: 12, color: C.muted }}>Client-wise time breakdown · click a bar or row to drill into sub-services</div>
//                         </div>
//                     </div>
//                 }
//             >
//                 {empModalLoading ? (
//                     <div style={{ textAlign: 'center', padding: 60 }}><Spin size="large" /></div>
//                 ) : empModalClients.length > 0 ? (
//                     <>
//                         {/* Mini stat strip */}
//                         <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
//                             {[
//                                 { label: 'Clients Worked On', value: empModalClients.length, color: C.inProgress, bg: '#fef3c7', isText: false },
//                                 { label: 'Total Time',        value: formatDurationFromMillis(empModalClients.reduce((s, r) => s + (r.total_hours_ms || 0), 0)), color: C.toDo, bg: '#ede9fe', isText: true },
//                                 { label: 'Avg per Client',    value: formatDurationFromMillis(empModalClients.length ? Math.round(empModalClients.reduce((s, r) => s + (r.total_hours_ms || 0), 0) / empModalClients.length) : 0), color: C.done, bg: '#d1fae5', isText: true },
//                             ].map(({ label, value, color, bg, isText }) => (
//                                 <Col span={8} key={label}>
//                                     <div style={{ background: bg, borderRadius: 12, padding: '14px 16px', textAlign: 'center' }}>
//                                         {isText
//                                             ? <div style={{ fontSize: 20, fontWeight: 800, color, lineHeight: 1.1 }}>{value}</div>
//                                             : <CountUp end={value} duration={1.2} style={{ fontSize: 28, fontWeight: 800, color, lineHeight: 1 }} />
//                                         }
//                                         <div style={{ fontSize: 11, color: C.muted, marginTop: 4, fontWeight: 600 }}>{label}</div>
//                                     </div>
//                                 </Col>
//                             ))}
//                         </Row>

//                         {/* Chart + Table side by side */}
//                         <Row gutter={[16, 16]}>
//                             <Col xs={24} xl={12}>
//                                 <div style={{ background: C.surface, borderRadius: 12, padding: 16, border: `1px solid ${C.border}`, height: '100%' }}>
//                                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
//                                         <Text style={{ fontWeight: 700, fontSize: 13 }}>Time per Client</Text>
//                                         <Text style={{ fontSize: 11, color: C.muted }}>Click bar for sub-services</Text>
//                                     </div>
//                                     <EChartsReact
//                                         option={hBarOption(
//                                             [...empModalClients]
//                                                 .sort((a, b) => b.total_hours_ms - a.total_hours_ms)
//                                                 .slice(0, 10)
//                                                 .map(r => ({ name: r.client_name, ms: r.total_hours_ms })),
//                                             '#f59e0b', '#fbbf24'
//                                         )}
//                                         style={{ height: Math.max(160, Math.min(empModalClients.length, 10) * 32 + 24) }}
//                                         onEvents={{
//                                             click: (params) => {
//                                                 const sorted   = [...empModalClients].sort((a, b) => b.total_hours_ms - a.total_hours_ms).slice(0, 10);
//                                                 const reversed = [...sorted].reverse();
//                                                 const row = reversed[params.dataIndex];
//                                                 if (!row) return;
//                                                 handleEmpClientBarClick(row);
//                                             },
//                                         }}
//                                     />
//                                 </div>
//                             </Col>

//                             <Col xs={24} xl={12}>
//                                 <Table
//                                     dataSource={[...empModalClients].sort((a, b) => b.total_hours_ms - a.total_hours_ms)}
//                                     rowKey="client_id" size="small"
//                                     columns={empClientCols}
//                                     pagination={sharedPagination}
//                                     scroll={{ x: 'max-content' }}
//                                     onRow={r => ({
//                                         onClick: () => handleEmpClientBarClick(r),
//                                         style: sharedRowStyle,
//                                     })}
//                                     summary={() => (
//                                         <Table.Summary.Row style={{ background: '#f8fafc' }}>
//                                             <Table.Summary.Cell index={0} colSpan={2}><Text strong style={{ fontSize: 12 }}>Grand Total</Text></Table.Summary.Cell>
//                                             <Table.Summary.Cell index={1} align="right">
//                                                 <Text strong style={{ fontSize: 12, color: C.inProgress }}>
//                                                     {formatDurationFromMillis(empModalClients.reduce((s, r) => s + (r.total_hours_ms || 0), 0))}
//                                                 </Text>
//                                             </Table.Summary.Cell>
//                                         </Table.Summary.Row>
//                                     )}
//                                 />
//                                 <Text style={{ fontSize: 11, color: C.muted, display: 'block', marginTop: 8 }}>
//                                     💡 Click any row or chart bar to see sub-service breakdown
//                                 </Text>
//                             </Col>
//                         </Row>

//                         {/* ── Inline sub-service drill panel ── */}
//                         {empDrillVisible && (
//                             <div style={{
//                                 marginTop: 20,
//                                 background: C.surface,
//                                 borderRadius: 12,
//                                 border: `2px solid #f59e0b`,
//                                 padding: 20,
//                             }}>
//                                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
//                                     <div>
//                                         <Text style={{ fontWeight: 700, fontSize: 14, color: C.text }}>
//                                             Sub-services — {empDrillClient?.client_name}
//                                         </Text>
//                                         <Text style={{ fontSize: 12, color: C.muted, display: 'block' }}>
//                                             Time breakdown by description/service for <strong>{empModalName}</strong>
//                                         </Text>
//                                     </div>
//                                     <Button size="small" onClick={() => setEmpDrillVisible(false)}>✕ Close</Button>
//                                 </div>

//                                 {empDrillLoading ? (
//                                     <div style={{ textAlign: 'center', padding: 32 }}><Spin /></div>
//                                 ) : empDrillServices.length > 0 ? (
//                                     <Row gutter={[16, 0]}>
//                                         <Col xs={24} xl={12}>
//                                             <EChartsReact
//                                                 option={hBarOption(
//                                                     empDrillServices.map(s => ({ name: s.name, ms: s.ms })),
//                                                     '#f59e0b', '#fbbf24'
//                                                 )}
//                                                 style={{ height: Math.max(140, empDrillServices.length * 32 + 20) }}
//                                             />
//                                         </Col>
//                                         <Col xs={24} xl={12}>
//                                             <Table
//                                                 dataSource={empDrillServices}
//                                                 rowKey="name"
//                                                 size="small"
//                                                 pagination={sharedPagination}
//                                                 columns={empDrillCols}
//                                                 summary={() => (
//                                                     <Table.Summary.Row style={{ background: '#f8fafc' }}>
//                                                         <Table.Summary.Cell index={0} colSpan={2}><Text strong style={{ fontSize: 12 }}>Total</Text></Table.Summary.Cell>
//                                                         <Table.Summary.Cell index={1} align="right">
//                                                             <Text strong style={{ fontSize: 12, color: '#f59e0b' }}>
//                                                                 {formatDurationFromMillis(empDrillServices.reduce((s, r) => s + (r.ms || 0), 0))}
//                                                             </Text>
//                                                         </Table.Summary.Cell>
//                                                     </Table.Summary.Row>
//                                                 )}
//                                             />
//                                         </Col>
//                                     </Row>
//                                 ) : (
//                                     <div style={{ textAlign: 'center', padding: 32, color: C.muted }}>
//                                         No sub-service entries found for this client
//                                     </div>
//                                 )}
//                             </div>
//                         )}
//                     </>
//                 ) : (
//                     <div style={{ textAlign: 'center', padding: 40, color: C.muted }}>No time entries found</div>
//                 )}
//             </Modal>

//         </div>
//     );
// };

// // export default TaskDashboard;
// import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
// import ReactDOM from 'react-dom';
// import {
//     Col, Row, Typography, message, Table, DatePicker,
//     Select, Space, Button, Segmented, Modal, Spin, Progress, Tooltip,
// } from 'antd';
// import { api } from '../../../services/api';
// import EChartsReact from 'echarts-for-react';
// import CountUp from 'react-countup';
// import {
//     ClockCircleOutlined, CheckCircleOutlined,
//     MinusCircleOutlined, ExclamationCircleOutlined,
//     FilterOutlined, ClearOutlined, ReloadOutlined,
// } from '@ant-design/icons';
// import { FcList } from 'react-icons/fc';
// import moment from 'moment';
// import { formatDurationFromMillis } from './STT_Records';
// import { useNavigate } from 'react-router-dom';

// const { Title, Text } = Typography;
// const { RangePicker } = DatePicker;
// const { Option } = Select;

// /* ─── Design tokens ─────────────────────────────────────────── */
// const C = {
//     done:       '#10b981',
//     inProgress: '#f59e0b',
//     overdue:    '#ef4444',
//     toDo:       '#6366f1',
//     all:        '#0f172a',
//     bg:         '#f1f5f9',
//     surface:    '#ffffff',
//     border:     '#e2e8f0',
//     text:       '#0f172a',
//     muted:      '#64748b',
// };

// const STATUS_META = {
//     'Done':        { color: C.done,       light: '#d1fae5' },
//     'In Progress': { color: C.inProgress, light: '#fef3c7' },
//     'Over Due':    { color: C.overdue,    light: '#fee2e2' },
//     'To Do':       { color: C.toDo,       light: '#ede9fe' },
// };

// /* ─── Stat Card ─────────────────────────────────────────────── */
// const StatCard = ({ title, value, color, lightColor, icon, subtitle, onClick, loading }) => (
//     <div
//         onClick={onClick}
//         style={{
//             background: C.surface, borderRadius: 16, padding: '20px 22px',
//             cursor: 'pointer', border: `1px solid ${C.border}`,
//             borderTop: `4px solid ${color}`,
//             transition: 'all 0.2s', flex: 1, minWidth: 0,
//             boxShadow: '0 1px 4px rgba(0,0,0,0.06)', position: 'relative', overflow: 'hidden',
//         }}
//         onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = `0 10px 28px ${color}28`; }}
//         onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)'; }}
//     >
//         <div style={{ position: 'absolute', right: 18, top: 18, width: 44, height: 44, borderRadius: 12, background: lightColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color }}>
//             {icon}
//         </div>
//         <Text style={{ fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: '0.07em', textTransform: 'uppercase' }}>
//             {title}
//         </Text>
//         <div style={{ marginTop: 8 }}>
//             {loading
//                 ? <div style={{ fontSize: 28, fontWeight: 700, color: C.muted }}>—</div>
//                 : <CountUp end={value} duration={1.6} style={{ fontSize: 34, fontWeight: 800, color, lineHeight: 1 }} />
//             }
//         </div>
//         {subtitle && <Text style={{ fontSize: 11, color: C.muted, marginTop: 6, display: 'block' }}>{subtitle}</Text>}
//     </div>
// );

// /* ─── Section header ────────────────────────────────────────── */
// const SectionTitle = ({ children, extra }) => (
//     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
//         <Text style={{ fontSize: 14, fontWeight: 700, color: C.text, letterSpacing: '-0.01em' }}>{children}</Text>
//         {extra}
//     </div>
// );

// /* ─── Status Badge ──────────────────────────────────────────── */
// const StatusBadge = ({ status }) => {
//     const meta = STATUS_META[status] || { color: C.muted, light: '#f1f5f9' };
//     return (
//         <span style={{
//             background: meta.light, color: meta.color,
//             borderRadius: 20, padding: '2px 10px',
//             fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap',
//         }}>
//             {status}
//         </span>
//     );
// };

// /* ─── Chart helpers ─────────────────────────────────────────── */
// const pieOption = (data) => ({
//     backgroundColor: 'transparent',
//     tooltip: {
//         trigger: 'item',
//         formatter: '{b}: <b>{c}</b> ({d}%)',
//         backgroundColor: '#1e293b', borderColor: 'transparent',
//         textStyle: { color: '#f1f5f9', fontSize: 13 },
//     },
//     legend: {
//         orient: 'horizontal', bottom: 0, left: 'center',
//         textStyle: { color: C.muted, fontSize: 12 },
//         itemWidth: 10, itemHeight: 10,
//     },
//     series: [{
//         type: 'pie', radius: ['42%', '70%'], center: ['50%', '44%'],
//         avoidLabelOverlap: true,
//         itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
//         label: { show: true, formatter: '{b}\n{c}', fontSize: 11, color: C.muted, lineHeight: 16 },
//         labelLine: { length: 10, length2: 6 },
//         data: data.map(d => ({ ...d, itemStyle: { color: STATUS_META[d.name]?.color || '#94a3b8' } })),
//         emphasis: { itemStyle: { shadowBlur: 12, shadowColor: 'rgba(0,0,0,0.15)' } },
//     }],
// });

// const barOption = (data, colorStart = '#6366f1', colorEnd = '#818cf8') => ({
//     backgroundColor: 'transparent',
//     tooltip: {
//         trigger: 'axis', axisPointer: { type: 'shadow' },
//         backgroundColor: '#1e293b', borderColor: 'transparent',
//         textStyle: { color: '#f1f5f9', fontSize: 12 },
//         formatter: (params) => {
//             const p = params[0];
//             const orig = data[p.dataIndex];
//             return `<b>${orig?.fullName || p.name}</b><br/>${formatDurationFromMillis(p.value)}`;
//         },
//     },
//     grid: { top: 16, right: 16, bottom: 48, left: 16, containLabel: true },
//     xAxis: {
//         type: 'category',
//         data: data.map(d => d.name.length > 13 ? d.name.slice(0, 12) + '…' : d.name),
//         axisLabel: { color: C.muted, fontSize: 11, rotate: data.length > 5 ? 30 : 0, interval: 0 },
//         axisLine: { lineStyle: { color: C.border } },
//         axisTick: { show: false },
//     },
//     yAxis: {
//         type: 'value',
//         axisLabel: { color: C.muted, fontSize: 10, formatter: v => formatDurationFromMillis(v) },
//         splitLine: { lineStyle: { color: C.border, type: 'dashed' } },
//         axisLine: { show: false }, axisTick: { show: false },
//     },
//     series: [{
//         type: 'bar',
//         data: data.map(d => ({
//             value: d.ms,
//             itemStyle: {
//                 color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: colorStart }, { offset: 1, color: colorEnd }] },
//                 borderRadius: [6, 6, 0, 0],
//             },
//         })),
//         barMaxWidth: 48,
//         emphasis: {
//             itemStyle: {
//                 color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: colorEnd }, { offset: 1, color: colorStart }] },
//             },
//         },
//     }],
// });

// const hBarOption = (data, colorStart = '#06b6d4', colorEnd = '#0ea5e9') => {
//     const reversed = [...data].reverse();
//     return {
//         backgroundColor: 'transparent',
//         tooltip: {
//             trigger: 'axis', axisPointer: { type: 'shadow' },
//             backgroundColor: '#1e293b', borderColor: 'transparent',
//             textStyle: { color: '#f1f5f9', fontSize: 12 },
//             formatter: (params) => `<b>${params[0].name}</b><br/>${formatDurationFromMillis(params[0].value)}`,
//         },
//         grid: { top: 4, right: 96, bottom: 4, left: 8, containLabel: true },
//         xAxis: { type: 'value', show: false, splitLine: { show: false } },
//         yAxis: {
//             type: 'category',
//             data: reversed.map(d => d.name?.length > 18 ? d.name.slice(0, 17) + '…' : d.name || 'N/A'),
//             axisLabel: { color: C.muted, fontSize: 11 },
//             axisLine: { show: false }, axisTick: { show: false },
//         },
//         series: [{
//             type: 'bar',
//             data: reversed.map(d => ({
//                 value: d.ms || 0,
//                 itemStyle: {
//                     color: { type: 'linear', x: 0, y: 0, x2: 1, y2: 0, colorStops: [{ offset: 0, color: colorStart }, { offset: 1, color: colorEnd }] },
//                     borderRadius: [0, 6, 6, 0],
//                 },
//             })),
//             barMaxWidth: 18,
//             label: {
//                 show: true, position: 'right',
//                 formatter: p => formatDurationFromMillis(p.value),
//                 color: C.muted, fontSize: 10,
//             },
//         }],
//     };
// };

// /* ─── Shared table column builder ───────────────────────────── */
// const makeIndexCol = () => ({
//     title: '#',
//     render: (_, __, i) => <Text style={{ color: C.muted, fontSize: 12 }}>{i + 1}</Text>,
//     width: 44,
// });

// const makeTimeCol = (colorKey = C.toDo, msField = 'total_hours') => ({
//     title: 'Time Spent',
//     key: 'time',
//     align: 'right',
//     width: 120,
//     render: (_, r) => (
//         <Text style={{ fontSize: 13, fontWeight: 700, color: colorKey }}>
//             {formatDurationFromMillis(r[msField])}
//         </Text>
//     ),
//     sorter: (a, b) => (a[msField] || 0) - (b[msField] || 0),
//     defaultSortOrder: 'descend',
// });

// /* ══════════════ MAIN COMPONENT ══════════════ */
// const TaskDashboard = () => {
//     const navigate = useNavigate();

//     const [loading,             setLoading]             = useState(true);
//     const [dashboardData,       setDashboardData]       = useState(null);
//     const [filteredTasks,       setFilteredTasks]       = useState(null);
//     const [filteredTaskList,    setFilteredTaskList]    = useState([]);   // filtered tasks for upcoming table
//     const [statsLoading,        setStatsLoading]        = useState(false);
//     const [error,               setError]               = useState(null);
//     const [dateRange,           setDateRange]           = useState(null);
//     const [clients,             setClients]             = useState([]);
//     const [selectedClient,      setSelectedClient]      = useState([]);
//     const [teams,               setTeams]               = useState([]);
//     const [selectedTeam,        setSelectedTeam]        = useState([]);
//     const [clientGroups,        setClientGroups]        = useState([]);
//     const [selectedClientGroup, setSelectedClientGroup] = useState([]);
//     const [allSpocs,            setAllSpocs]            = useState([]);
//     const [subServices,         setSubServices]         = useState([]);
//     const [selectedSubService,  setSelectedSubService]  = useState([]);
//     const [tableView,           setTableView]           = useState('client');
//     const [taskCounts,          setTaskCounts]          = useState({ allTasks: 0, done: 0, toDo: 0, overdue: 0, inProgress: 0 });
//     const [filtersOpen,         setFiltersOpen]         = useState(false);
//     const [timePerClientData,   setTimePerClientData]   = useState([]);
//     const [timePerEmployeeData, setTimePerEmployeeData] = useState([]);

//     // Client modal
//     const [clientModalVisible,  setClientModalVisible]  = useState(false);
//     const [clientModalLoading,  setClientModalLoading]  = useState(false);
//     const [selectedClientInfo,  setSelectedClientInfo]  = useState(null);
//     const [clientSummary,       setClientSummary]       = useState(null);

//     // Employee modal
//     const [empModalVisible,     setEmpModalVisible]     = useState(false);
//     const [empModalLoading,     setEmpModalLoading]     = useState(false);
//     const [empModalName,        setEmpModalName]        = useState('');
//     const [empModalClients,     setEmpModalClients]     = useState([]);

//     // Employee modal sub-drill (click a client bar → show sub-services)
//     const [empDrillVisible,     setEmpDrillVisible]     = useState(false);
//     const [empDrillClient,      setEmpDrillClient]      = useState(null);
//     const [empDrillServices,    setEmpDrillServices]    = useState([]);
//     const [empDrillLoading,     setEmpDrillLoading]     = useState(false);

//     // Client-modal drill panel
//     const [drillVisible,        setDrillVisible]        = useState(false);
//     const [drillTitle,          setDrillTitle]          = useState('');
//     const [drillData,           setDrillData]           = useState([]);
//     const [drillType,           setDrillType]           = useState('');

//     const mountedRef = useRef(true);
//     useEffect(() => { mountedRef.current = true; return () => { mountedRef.current = false; }; }, []);

//     const clientGroupsRef = useRef([]);
//     const allSpocsRef     = useRef([]);
//     useEffect(() => { clientGroupsRef.current = clientGroups; }, [clientGroups]);
//     useEffect(() => { allSpocsRef.current = allSpocs; }, [allSpocs]);

//     const getSpocName = useCallback((client) => {
//         if (!client) return 'N/A';
//         if (client.primary_spoc_name) return client.primary_spoc_name;
//         const groups = clientGroupsRef.current;
//         const group = groups.find(g => g.clients?.some(cg => (typeof cg === 'object' ? cg.id : cg) === client.id));
//         if (group?.primary_spoc_name) return group.primary_spoc_name;
//         if (typeof client.primary_spoc === 'number') {
//             const spoc = allSpocsRef.current.find(s => s.id === client.primary_spoc);
//             if (spoc) return `${spoc.first_name || ''} ${spoc.last_name || ''}`.trim() || spoc.user?.email || 'N/A';
//         }
//         return 'N/A';
//     }, []);

//     const getGroupName = useCallback((client) => {
//         if (!client) return 'N/A';
//         const groups = clientGroupsRef.current;
//         const group = groups.find(g => g.clients?.some(cg => (typeof cg === 'object' ? cg.id : cg) === client.id));
//         return group?.group_name || 'N/A';
//     }, []);

//     const buildParams = (filters = {}) => {
//         const p = {
//             start_date:      filters.startDate?.format('YYYY-MM-DD'),
//             end_date:        filters.endDate?.format('YYYY-MM-DD'),
//             client_id:       filters.clientId?.length      ? filters.clientId.join(',')       : undefined,
//             // FIX: send team_id as exact IDs — do NOT do string-contains matching client-side
//             team_id:         filters.teamId?.length        ? filters.teamId.join(',')         : undefined,
//             client_group_id: filters.clientGroupId?.length ? filters.clientGroupId.join(',') : undefined,
//             sub_service_id:  filters.subServiceId?.length  ? filters.subServiceId.join(',')  : undefined,
//         };
//         Object.keys(p).forEach(k => p[k] === undefined && delete p[k]);
//         return p;
//     };

//     /* ── Fetches ── */
//     const fetchDashboard = useCallback(async (params) => {
//         if (!mountedRef.current) return;
//         setLoading(true);
//         try {
//             const res = await api.get('/clients/tasks/dashboard_summary/', { params });
//             if (mountedRef.current) {
//                 setDashboardData(res.data);
//                 setFilteredTasks(res.data);
//             }
//         } catch (err) {
//             console.error(err);
//             if (mountedRef.current) { setError('Failed to load dashboard data.'); message.error('Failed to load dashboard.'); }
//         } finally {
//             if (mountedRef.current) setLoading(false);
//         }
//     }, []);

//     const fetchTimePerClient = useCallback(async (params, clientsList) => {
//         if (!mountedRef.current) return;
//         try {
//             const res = await api.get('/clients/tasks/time_per_client/', { params });
//             if (!mountedRef.current) return;
//             setTimePerClientData((res.data || []).map(row => {
//                 const c = (clientsList || []).find(x => x.id === row.client_id);
//                 return {
//                     ...row,
//                     total_hours: row.total_hours_ms,
//                     group_name:  c ? getGroupName(c) : 'N/A',
//                     spoc_name:   c ? getSpocName(c) : 'N/A',
//                 };
//             }));
//         } catch (err) { console.error('fetchTimePerClient error:', err); }
//     }, [getGroupName, getSpocName]);

//     const fetchTimePerEmployee = useCallback(async (params) => {
//         if (!mountedRef.current) return;
//         try {
//             const res = await api.get('/clients/tasks/time_per_employee/', { params });
//             if (mountedRef.current) setTimePerEmployeeData(res.data || []);
//         } catch (err) { console.error('fetchTimePerEmployee error:', err); }
//     }, []);

//     // Fetches filtered task list for stat cards, pie chart, upcoming table
//     // Uses the same dashboard_summary endpoint — but now with ALL filter params applied
//     const fetchFilteredStats = useCallback(async (params) => {
//         if (!mountedRef.current) return;
//         setStatsLoading(true);
//         try {
//             const res = await api.get('/clients/tasks/dashboard_summary/', { params });
//             if (mountedRef.current) {
//                 setFilteredTasks(res.data);
//                 setFilteredTaskList(res.data?.tasks || []);
//             }
//         } catch (err) { console.error('fetchFilteredStats error:', err); }
//         finally { if (mountedRef.current) setStatsLoading(false); }
//     }, []);

//     /* ── Initial load ── */
//     const didInit = useRef(false);
//     useEffect(() => {
//         if (didInit.current) return;
//         didInit.current = true;
//         (async () => {
//             setLoading(true);
//             try {
//                 const [cR, tR, gR, sR, ssR] = await Promise.all([
//                     api.get('/clients/clients/?page_size=500'),
//                     api.get('/employee/teams/'),
//                     api.get('/clients/client-groups/'),
//                     api.get('/employee/employees/'),
//                     api.get('/clients/subservices/'),
//                 ]);
//                 if (!mountedRef.current) return;
//                 const cl = cR.data.results || cR.data;
//                 const gr = gR.data.results || gR.data;
//                 const sp = sR.data.results || sR.data;
//                 setClients(cl); setTeams(tR.data.results || tR.data);
//                 setClientGroups(gr); setAllSpocs(sp); setSubServices(ssR.data.results || ssR.data);
//                 clientGroupsRef.current = gr; allSpocsRef.current = sp;
//                 await Promise.all([fetchDashboard({}), fetchFilteredStats({}), fetchTimePerClient({}, cl), fetchTimePerEmployee({})]);
//             } catch (err) {
//                 console.error('fetchInitialData error:', err);
//                 if (mountedRef.current) setError('Failed to load initial data.');
//             } finally {
//                 if (mountedRef.current) setLoading(false);
//             }
//         })();
//     }, [fetchDashboard, fetchFilteredStats, fetchTimePerClient, fetchTimePerEmployee]);

//     /* ── Re-fetch on filter change ── */
//     const isFirstRender = useRef(true);
//     useEffect(() => {
//         if (isFirstRender.current) { isFirstRender.current = false; return; }
//         const [startDate, endDate] = dateRange || [null, null];
//         const f = {
//             startDate,
//             endDate,
//             clientId:      selectedClient,
//             // FIX: pass exact numeric IDs — the team filter dropdown uses item.id
//             teamId:        selectedTeam,
//             clientGroupId: selectedClientGroup,
//             subServiceId:  selectedSubService,
//         };
//         const p = buildParams(f);
//         fetchDashboard(p);
//         fetchFilteredStats(p);
//         fetchTimePerClient(p, clients);
//         fetchTimePerEmployee(p);
//         // eslint-disable-next-line react-hooks/exhaustive-deps
//     }, [dateRange, selectedClient, selectedTeam, selectedClientGroup, selectedSubService]);

//     /* ── Derive task counts from filteredTasks (always has current filter params applied) ── */
//     useEffect(() => {
//         const sc = filteredTasks?.status_counts;
//         if (!sc) return;
//         setTaskCounts({
//             allTasks:   (sc['To Do'] || 0) + (sc['In Progress'] || 0) + (sc['Done'] || 0) + (sc['Over Due'] || 0),
//             done:       sc['Done']        || 0,
//             toDo:       sc['To Do']       || 0,
//             inProgress: sc['In Progress'] || 0,
//             overdue:    sc['Over Due']    || 0,
//         });
//     }, [filteredTasks]);

//     /* ── Derived ── */
//     const timePerGroup = useMemo(() =>
//         timePerClientData.reduce((acc, row) => {
//             if (!row.group_name || row.group_name === 'N/A') return acc;
//             const ex = acc.find(g => g.client_group_name === row.group_name);
//             if (ex) ex.total_hours += row.total_hours;
//             else acc.push({ client_group_name: row.group_name, spoc_name: row.spoc_name, total_hours: row.total_hours });
//             return acc;
//         }, [])
//     , [timePerClientData]);

//     const pieData      = useMemo(() =>
//         filteredTasks?.status_counts
//             ? Object.entries(filteredTasks.status_counts).filter(([k, v]) => k !== 'total' && v > 0).map(([name, value]) => ({ name, value }))
//             : []
//     , [filteredTasks]);

//     const topClients   = useMemo(() => [...timePerClientData].sort((a, b) => b.total_hours - a.total_hours).slice(0, 10), [timePerClientData]);
//     const topGroups    = useMemo(() => [...timePerGroup].sort((a, b) => b.total_hours - a.total_hours).slice(0, 10), [timePerGroup]);
//     const topEmployees = useMemo(() => [...timePerEmployeeData].sort((a, b) => b.total_hours_ms - a.total_hours_ms).slice(0, 10), [timePerEmployeeData]);

//     const totalTime      = useMemo(() => timePerClientData.reduce((s, r) => s + (r.total_hours || 0), 0), [timePerClientData]);
//     const totalEmpTime   = useMemo(() => timePerEmployeeData.reduce((s, r) => s + (r.total_hours_ms || 0), 0), [timePerEmployeeData]);
//     const completionRate = taskCounts.allTasks ? Math.round((taskCounts.done / taskCounts.allTasks) * 100) : 0;

//     // Count only filters that have actual values selected
//     const activeFilterCount = [selectedClient, selectedTeam, selectedClientGroup, selectedSubService]
//         .filter(a => Array.isArray(a) && a.length > 0).length + (dateRange ? 1 : 0);

//     const grandTotal = tableView === 'employee'
//         ? totalEmpTime
//         : tableView === 'group'
//             ? timePerGroup.reduce((s, r) => s + r.total_hours, 0)
//             : totalTime;

//     const handleClearFilters = () => {
//         setDateRange(null); setSelectedClient([]); setSelectedTeam([]); setSelectedClientGroup([]); setSelectedSubService([]);
//     };

//     /* ── Navigate to tasks with current filters ── */
//     const goToTasks = (status) => {
//         const params = new URLSearchParams();
//         if (status !== 'all') params.set('status', status);
//         const [s, e] = dateRange || [null, null];
//         if (s) params.set('start_date', s.format('YYYY-MM-DD'));
//         if (e) params.set('end_date',   e.format('YYYY-MM-DD'));
//         if (selectedClient?.length)      params.set('client_id',      selectedClient.join(','));
//         if (selectedTeam?.length)        params.set('team_id',         selectedTeam.join(','));
//         if (selectedClientGroup?.length) params.set('client_group_id', selectedClientGroup.join(','));
//         if (selectedSubService?.length)  params.set('sub_service_id',  selectedSubService.join(','));
//         navigate(`/stt-records?${params.toString()}`);
//     };

//     const handleRefresh = useCallback(() => {
//         const [startDate, endDate] = dateRange || [null, null];
//         const f = {
//             startDate, endDate,
//             clientId:      selectedClient,
//             teamId:        selectedTeam,
//             clientGroupId: selectedClientGroup,
//             subServiceId:  selectedSubService,
//         };
//         const p = buildParams(f);
//         fetchDashboard(p); fetchFilteredStats(p); fetchTimePerClient(p, clients); fetchTimePerEmployee(p);
//     }, [dateRange, selectedClient, selectedTeam, selectedClientGroup, selectedSubService, clients, fetchDashboard, fetchFilteredStats, fetchTimePerClient, fetchTimePerEmployee]);

//     /* ── Client modal ── */
//     const handleClientClick = useCallback(async (clientId) => {
//         const client = clients.find(c => c.id === clientId);
//         setSelectedClientInfo(client); setClientSummary(null);
//         setDrillVisible(false); setDrillData([]);
//         setClientModalVisible(true); setClientModalLoading(true);
//         try {
//             const [startDate, endDate] = dateRange || [null, null];
//             const params = { client_id: clientId };
//             if (startDate)                params.start_date      = startDate.format('YYYY-MM-DD');
//             if (endDate)                  params.end_date        = endDate.format('YYYY-MM-DD');
//             if (selectedTeam?.length)     params.team_id         = selectedTeam.join(',');
//             if (selectedSubService?.length) params.sub_service_id = selectedSubService.join(',');
//             if (selectedClientGroup?.length) params.client_group_id = selectedClientGroup.join(',');
//             const res = await api.get('/clients/tasks/client_task_summary/', { params });
//             if (mountedRef.current) setClientSummary(res.data);
//         } catch (err) { console.error(err); message.error('Failed to load client details'); }
//         finally { if (mountedRef.current) setClientModalLoading(false); }
//     }, [clients, dateRange, selectedTeam, selectedSubService, selectedClientGroup]);

//     /* ── Employee modal ── */
//     const handleEmployeeClick = useCallback(async (employeeName) => {
//         setEmpModalName(employeeName);
//         setEmpModalClients([]);
//         setEmpDrillVisible(false);
//         setEmpDrillClient(null);
//         setEmpDrillServices([]);
//         setEmpModalVisible(true);
//         setEmpModalLoading(true);
//         try {
//             const [startDate, endDate] = dateRange || [null, null];
//             const params = { employee_name: employeeName };
//             if (startDate)                   params.start_date       = startDate.format('YYYY-MM-DD');
//             if (endDate)                     params.end_date         = endDate.format('YYYY-MM-DD');
//             if (selectedClient?.length)      params.client_id        = selectedClient.join(',');
//             if (selectedTeam?.length)        params.team_id          = selectedTeam.join(',');
//             if (selectedSubService?.length)  params.sub_service_id   = selectedSubService.join(',');
//             if (selectedClientGroup?.length) params.client_group_id  = selectedClientGroup.join(',');
//             const res = await api.get('/clients/tasks/time_per_employee_clients/', { params });
//             if (mountedRef.current) setEmpModalClients(res.data || []);
//         } catch (err) { console.error(err); message.error('Failed to load employee details'); }
//         finally { if (mountedRef.current) setEmpModalLoading(false); }
//     }, [dateRange, selectedClient, selectedTeam, selectedSubService, selectedClientGroup]);

//     /* ── Employee modal: click a client bar → load sub-services (Description) ── */
//     const handleEmpClientBarClick = useCallback(async (clientRow) => {
//         setEmpDrillClient(clientRow);
//         setEmpDrillServices([]);
//         setEmpDrillVisible(true);
//         setEmpDrillLoading(true);
//         try {
//             const [startDate, endDate] = dateRange || [null, null];
//             const params = {
//                 client_id:     clientRow.client_id,
//                 employee_name: empModalName,
//             };
//             if (startDate)                   params.start_date      = startDate.format('YYYY-MM-DD');
//             if (endDate)                     params.end_date        = endDate.format('YYYY-MM-DD');
//             if (selectedTeam?.length)        params.team_id         = selectedTeam.join(',');
//             if (selectedSubService?.length)  params.sub_service_id  = selectedSubService.join(',');
//             if (selectedClientGroup?.length) params.client_group_id = selectedClientGroup.join(',');
//             const res = await api.get('/clients/tasks/client_task_summary/', { params });
//             const raw = res.data?.per_employee_services?.[empModalName] || [];
//             const svcList = raw.map(s => ({
//                 name: s.name,
//                 ms:   s.ms ?? s.total_hours_ms ?? 0,
//             })).filter(s => s.ms > 0);
//             if (mountedRef.current) setEmpDrillServices(svcList);
//         } catch (err) { console.error(err); message.error('Failed to load service breakdown'); }
//         finally { if (mountedRef.current) setEmpDrillLoading(false); }
//     }, [dateRange, empModalName, selectedTeam, selectedSubService, selectedClientGroup]);

//     /* ── Upcoming tasks ── */
//     const upcomingTasks = useMemo(() => (filteredTaskList || []).slice(0, 8), [filteredTaskList]);
//     const upcomingCols = [
//         { title: 'Task ID', dataIndex: 'task_id', key: 'task_id', width: 140, render: v => <Text style={{ fontFamily: 'monospace', fontSize: 11, color: C.muted }}>{v}</Text> },
//         { title: 'Client',  dataIndex: 'client_name',      key: 'client_name',      ellipsis: true },
//         { title: 'Service', dataIndex: 'sub_service_name',  key: 'sub_service_name', ellipsis: true },
//         {
//             title: 'Due', dataIndex: 'due_date', key: 'due_date', width: 100,
//             render: d => {
//                 if (!d) return <span style={{ color: C.muted }}>—</span>;
//                 const m = moment(d); const isLate = m.isBefore(moment(), 'day');
//                 return <span style={{ color: isLate ? C.overdue : C.muted, fontWeight: isLate ? 600 : 400, fontSize: 12 }}>{m.format('DD MMM YY')}</span>;
//             },
//         },
//         {
//             title: 'Status', dataIndex: 'status', key: 'status', width: 120,
//             render: (_, r) => {
//                 const eff = r.due_date && moment(r.due_date).isBefore(moment(), 'day') && r.status !== 'Done' ? 'Over Due' : r.status;
//                 return <StatusBadge status={eff} />;
//             },
//         },
//     ];

//     /* ── Shared ── */
//     const sharedRowStyle = { cursor: 'pointer' };
//     const sharedPagination = { pageSize: 8, size: 'small', showSizeChanger: false };

//     /* ── CLIENT table columns ── */
//     const clientTableCols = [
//         makeIndexCol(),
//         {
//             title: 'Client', dataIndex: 'client_name', key: 'client_name',
//             render: v => (
//                 <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
//                     <div style={{
//                         width: 28, height: 28, borderRadius: '50%',
//                         background: '#ede9fe', color: C.toDo,
//                         display: 'flex', alignItems: 'center', justifyContent: 'center',
//                         fontSize: 12, fontWeight: 700, flexShrink: 0,
//                     }}>
//                         {(v || 'C')[0].toUpperCase()}
//                     </div>
//                     <Tooltip title={v} placement="topLeft">
//                         <Text style={{ fontWeight: 500, fontSize: 13, maxWidth: 130, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v || '—'}</Text>
//                     </Tooltip>
//                 </div>
//             ),
//             sorter: (a, b) => (a.client_name || '').localeCompare(b.client_name || ''),
//         },
//         {
//             title: 'Group', dataIndex: 'group_name', key: 'group_name', width: 130,
//             render: v => v && v !== '—' && v !== 'N/A' ? (
//                 <Tooltip title={v} placement="topLeft">
//                     <span style={{
//                         background: '#f0fdf4', color: C.done,
//                         borderRadius: 20, padding: '2px 10px',
//                         fontSize: 11, fontWeight: 600,
//                         maxWidth: 120, display: 'inline-block',
//                         overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
//                         verticalAlign: 'middle',
//                     }}>{v}</span>
//                 </Tooltip>
//             ) : <Text style={{ fontSize: 12, color: C.muted }}>—</Text>,
//         },
//         {
//             title: 'SPOC', dataIndex: 'spoc_name', key: 'spoc_name', width: 120,
//             render: v => v && v !== '—' && v !== 'N/A' ? (
//                 <Tooltip title={v} placement="topLeft">
//                     <span style={{
//                         background: '#f0f9ff', color: '#0ea5e9',
//                         borderRadius: 20, padding: '2px 10px',
//                         fontSize: 11, fontWeight: 600,
//                         maxWidth: 110, display: 'inline-block',
//                         overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
//                         verticalAlign: 'middle',
//                     }}>{v}</span>
//                 </Tooltip>
//             ) : <Text style={{ fontSize: 12, color: C.muted }}>—</Text>,
//         },
//         makeTimeCol(C.toDo, 'total_hours'),
//     ];

//     /* ── GROUP table columns ── */
//     const groupTableCols = [
//         makeIndexCol(),
//         {
//             title: 'Client Group', dataIndex: 'client_group_name', key: 'client_group_name',
//             render: v => (
//                 <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
//                     <div style={{
//                         width: 28, height: 28, borderRadius: '50%',
//                         background: '#f0fdf4', color: C.done,
//                         display: 'flex', alignItems: 'center', justifyContent: 'center',
//                         fontSize: 12, fontWeight: 700, flexShrink: 0,
//                     }}>
//                         {(v || 'G')[0].toUpperCase()}
//                     </div>
//                     <Tooltip title={v} placement="topLeft">
//                         <Text style={{ fontWeight: 500, fontSize: 13, maxWidth: 150, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v || '—'}</Text>
//                     </Tooltip>
//                 </div>
//             ),
//             sorter: (a, b) => (a.client_group_name || '').localeCompare(b.client_group_name || ''),
//         },
//         {
//             title: 'SPOC', dataIndex: 'spoc_name', key: 'spoc_name', width: 140,
//             render: v => v && v !== '—' && v !== 'N/A' ? (
//                 <Tooltip title={v} placement="topLeft">
//                     <span style={{
//                         background: '#f0f9ff', color: '#0ea5e9',
//                         borderRadius: 20, padding: '2px 10px',
//                         fontSize: 11, fontWeight: 600,
//                         maxWidth: 130, display: 'inline-block',
//                         overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
//                         verticalAlign: 'middle',
//                     }}>{v}</span>
//                 </Tooltip>
//             ) : <Text style={{ fontSize: 12, color: C.muted }}>—</Text>,
//         },
//         makeTimeCol(C.toDo, 'total_hours'),
//     ];

//     /* ── EMPLOYEE table columns — includes Team column ── */
//     const employeeTableCols = [
//         makeIndexCol(),
//         {
//             title: 'Employee', dataIndex: 'name', key: 'name',
//             render: v => (
//                 <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
//                     <div style={{
//                         width: 28, height: 28, borderRadius: '50%',
//                         background: '#fef3c7', color: C.inProgress,
//                         display: 'flex', alignItems: 'center', justifyContent: 'center',
//                         fontSize: 12, fontWeight: 700, flexShrink: 0,
//                     }}>
//                         {(v || 'N')[0]}
//                     </div>
//                     <Text style={{ fontWeight: 500, fontSize: 13 }}>{v || 'N/A'}</Text>
//                 </div>
//             ),
//             sorter: (a, b) => (a.name || '').localeCompare(b.name || ''),
//         },
//         {
//             title: 'Team', dataIndex: 'team_name', key: 'team_name', width: 130,
//             render: v => (
//                 <Tooltip title={v} placement="topLeft">
//                     <Text style={{ fontSize: 12, color: C.muted, maxWidth: 120, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v || '—'}</Text>
//                 </Tooltip>
//             ),
//         },
//         makeTimeCol(C.inProgress, 'total_hours_ms'),
//     ];

//     /* ── Employee modal: client breakdown columns ── */
//     const empClientCols = [
//         makeIndexCol(),
//         {
//             title: 'Client', dataIndex: 'client_name', key: 'client_name',
//             render: v => (
//                 <Tooltip title={v} placement="topLeft">
//                     <Text style={{ fontWeight: 500, fontSize: 13, maxWidth: 200, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v || '—'}</Text>
//                 </Tooltip>
//             ),
//             sorter: (a, b) => (a.client_name || '').localeCompare(b.client_name || ''),
//         },
//         makeTimeCol(C.inProgress, 'total_hours_ms'),
//     ];

//     /* ── Sub-service drill table columns (same look as other tables) ── */
//     const empDrillCols = [
//         makeIndexCol(),
//         {
//             title: 'Sub-service / Description', dataIndex: 'name', key: 'name',
//             render: v => (
//                 <Tooltip title={v} placement="topLeft">
//                     <Text style={{ fontWeight: 500, fontSize: 13, maxWidth: 220, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v || '—'}</Text>
//                 </Tooltip>
//             ),
//             sorter: (a, b) => (a.name || '').localeCompare(b.name || ''),
//         },
//         {
//             title: 'Time Spent', dataIndex: 'ms', key: 'ms',
//             align: 'right', width: 120,
//             render: v => (
//                 <Text style={{ fontSize: 13, fontWeight: 700, color: '#f59e0b' }}>
//                     {formatDurationFromMillis(v)}
//                 </Text>
//             ),
//             sorter: (a, b) => (a.ms || 0) - (b.ms || 0),
//             defaultSortOrder: 'descend',
//         },
//     ];

//     /* ── Error state ── */
//     if (error && !dashboardData) {
//         return (
//             <div style={{ padding: 60, textAlign: 'center', background: C.bg, minHeight: '100vh' }}>
//                 <Text style={{ color: C.overdue, fontSize: 16 }}>{error}</Text><br />
//                 <Button style={{ marginTop: 16 }} onClick={() => { didInit.current = false; }} icon={<ReloadOutlined />}>Retry</Button>
//             </div>
//         );
//     }

//     /* ══════════════ RENDER ══════════════ */
//     return (
//         <div style={{ background: C.bg, minHeight: '100vh', padding: '24px 28px', fontFamily: '"DM Sans", "Segoe UI", sans-serif' }}>

//             {/* ── Header ── */}
//             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
//                 <div>
//                     <Title level={3} style={{ margin: 0, color: C.text, fontWeight: 800, letterSpacing: '-0.03em' }}>Task Analytics</Title>
//                     <Text style={{ color: C.muted, fontSize: 13 }}>{moment().format('dddd, D MMMM YYYY')} · Real-time overview</Text>
//                 </div>
//                 <Space>
//                     <Button icon={<ReloadOutlined />} onClick={handleRefresh} loading={loading}>Refresh</Button>
//                     <Button type="primary" onClick={() => navigate('/stt-records')} style={{ background: C.toDo, borderColor: C.toDo }}>All Tasks →</Button>
//                 </Space>
//             </div>

//             {/* ── Filters ── */}
//             <div style={{ background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`, marginBottom: 24, overflow: 'hidden' }}>
//                 <div
//                     onClick={() => setFiltersOpen(v => !v)}
//                     style={{ padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', borderBottom: filtersOpen ? `1px solid ${C.border}` : 'none' }}
//                 >
//                     <Space>
//                         <FilterOutlined style={{ color: C.toDo }} />
//                         <Text style={{ fontWeight: 600, color: C.text }}>Filters</Text>
//                         {activeFilterCount > 0 && (
//                             <span style={{ background: C.toDo, color: '#fff', borderRadius: 20, padding: '1px 8px', fontSize: 11, fontWeight: 700 }}>{activeFilterCount} active</span>
//                         )}
//                     </Space>
//                     <Text style={{ color: C.muted, fontSize: 12 }}>{filtersOpen ? '▲ collapse' : '▼ expand'}</Text>
//                 </div>
//                 {filtersOpen && (
//                     <div style={{ padding: '16px 20px' }}>
//                         <Row gutter={[12, 12]}>
//                             <Col xs={24} sm={12} md={8} lg={5}>
//                                 <RangePicker style={{ width: '100%' }} value={dateRange} onChange={setDateRange} size="small" />
//                             </Col>
//                             {[
//                                 { placeholder: 'Client Group', value: selectedClientGroup, onChange: setSelectedClientGroup, items: clientGroups, labelKey: 'group_name' },
//                                 { placeholder: 'Client',       value: selectedClient,      onChange: setSelectedClient,      items: clients,       labelKey: 'name'       },
//                                 {
//                                     // FIX: Team filter uses item.id (numeric) — label is item.name
//                                     // The backend filters by team_id exactly, so we must NOT do substring matching
//                                     placeholder: 'Team', value: selectedTeam, onChange: setSelectedTeam, items: teams, labelKey: 'name',
//                                 },
//                                 { placeholder: 'Sub Service',  value: selectedSubService,  onChange: setSelectedSubService,  items: subServices,   labelKey: 'name'       },
//                             ].map(({ placeholder, value, onChange, items, labelKey }) => (
//                                 <Col xs={24} sm={12} md={8} lg={4} key={placeholder}>
//                                     <Select
//                                         mode="multiple"
//                                         placeholder={placeholder}
//                                         allowClear
//                                         showSearch
//                                         value={value}
//                                         onChange={onChange}
//                                         style={{ width: '100%' }}
//                                         size="small"
//                                         // FIX: use exact label match only — prevents "IT" matching "Audit" etc.
//                                         filterOption={(inp, opt) =>
//                                             (opt?.children ?? '').toLowerCase().startsWith(inp.toLowerCase()) ||
//                                             (opt?.children ?? '').toLowerCase().includes(inp.toLowerCase())
//                                         }
//                                         optionFilterProp="children"
//                                     >
//                                         {items.map(i => (
//                                             <Option key={i.id} value={i.id}>{i[labelKey]}</Option>
//                                         ))}
//                                     </Select>
//                                 </Col>
//                             ))}
//                             <Col xs={24} sm={12} md={4} lg={3}>
//                                 <Button size="small" onClick={handleClearFilters} icon={<ClearOutlined />} block>Clear</Button>
//                             </Col>
//                         </Row>
//                     </div>
//                 )}
//             </div>

//             {/* ── KPI Cards ── */}
//             <Row gutter={[14, 14]} style={{ marginBottom: 20, flexWrap: 'nowrap' }}>
//                 {[
//                     { title: 'Total Tasks',  value: taskCounts.allTasks,   color: C.all,        lightColor: '#f1f5f9', icon: <FcList />,                  subtitle: 'Across all statuses',           status: 'all'         },
//                     { title: 'To Do',        value: taskCounts.toDo,       color: C.toDo,       lightColor: '#ede9fe', icon: <ClockCircleOutlined />,       subtitle: 'Pending start',                 status: 'To Do'       },
//                     { title: 'In Progress',  value: taskCounts.inProgress, color: C.inProgress, lightColor: '#fef3c7', icon: <MinusCircleOutlined />,       subtitle: 'Being worked on',               status: 'In Progress' },
//                     { title: 'Done',         value: taskCounts.done,       color: C.done,       lightColor: '#d1fae5', icon: <CheckCircleOutlined />,       subtitle: `${completionRate}% completion`, status: 'Done'        },
//                     { title: 'Overdue',      value: taskCounts.overdue,    color: C.overdue,    lightColor: '#fee2e2', icon: <ExclamationCircleOutlined />, subtitle: 'Need attention',                status: 'Over Due'    },
//                 ].map((card) => (
//                     <Col key={card.title} style={{ flex: '1 1 0', minWidth: 0, display: 'flex' }}>
//                         <StatCard {...card} loading={loading || statsLoading} onClick={() => goToTasks(card.status)} />
//                     </Col>
//                 ))}
//             </Row>

//             {/* ── Overall progress bar ── */}
//             {taskCounts.allTasks > 0 && (
//                 <div style={{ background: C.surface, borderRadius: 14, padding: '16px 24px', marginBottom: 20, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
//                     <Text style={{ fontWeight: 600, color: C.text, whiteSpace: 'nowrap', fontSize: 13 }}>Overall Progress</Text>
//                     <div style={{ flex: 1, minWidth: 120 }}>
//                         <Progress percent={completionRate} strokeColor={{ '0%': C.toDo, '100%': C.done }} trailColor="#e2e8f0" strokeWidth={10} showInfo={false} />
//                     </div>
//                     <div style={{ display: 'flex', gap: 24, flexShrink: 0 }}>
//                         {[
//                             { label: 'Done',     val: taskCounts.done,                          color: C.done       },
//                             { label: 'Active',   val: taskCounts.toDo + taskCounts.inProgress,  color: C.inProgress },
//                             { label: 'Overdue',  val: taskCounts.overdue,                       color: C.overdue    },
//                             { label: 'Complete', val: `${completionRate}%`,                     color: C.text       },
//                         ].map(({ label, val, color }) => (
//                             <div key={label} style={{ textAlign: 'center' }}>
//                                 <div style={{ fontWeight: 700, color, fontSize: 16, lineHeight: 1 }}>{val}</div>
//                                 <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{label}</div>
//                             </div>
//                         ))}
//                     </div>
//                 </div>
//             )}

//             {/* ── Pie + Upcoming ── */}
//             <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
//                 <Col xs={24} lg={9}>
//                     <div style={{ background: C.surface, borderRadius: 14, padding: '20px 20px 12px', border: `1px solid ${C.border}`, height: '100%' }}>
//                         <SectionTitle>Status Distribution</SectionTitle>
//                         {(loading || statsLoading)
//                             ? <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Spin /></div>
//                             : pieData.length > 0
//                                 ? <EChartsReact option={pieOption(pieData)} style={{ height: 300 }} />
//                                 : <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.muted }}>No data</div>
//                         }
//                     </div>
//                 </Col>
//                 <Col xs={24} lg={15}>
//                     <div style={{ background: C.surface, borderRadius: 14, padding: '20px', border: `1px solid ${C.border}`, height: '100%' }}>
//                         <SectionTitle extra={<Button size="small" type="link" onClick={() => goToTasks('all')} style={{ color: C.toDo, padding: 0 }}>View all →</Button>}>
//                             Upcoming &amp; Recent Tasks
//                         </SectionTitle>
//                         <Table
//                             dataSource={upcomingTasks} columns={upcomingCols} rowKey="id" size="small"
//                             pagination={false} loading={loading || statsLoading} scroll={{ x: 'max-content' }}
//                             onRow={r => ({ onClick: () => goToTasks(r.status), style: sharedRowStyle })}
//                             locale={{ emptyText: <div style={{ padding: 32, color: C.muted }}>No tasks found 🎉</div> }}
//                         />
//                     </div>
//                 </Col>
//             </Row>

//             {/* ── Time Spent ── */}
//             <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
//                 <Col xs={24}>
//                     <div style={{ background: C.surface, borderRadius: 14, padding: '20px', border: `1px solid ${C.border}` }}>
//                         <SectionTitle
//                             extra={
//                                 <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
//                                     <Text style={{ fontSize: 13, color: C.muted }}>
//                                         Total: <strong style={{ color: tableView === 'employee' ? C.inProgress : C.toDo }}>{formatDurationFromMillis(grandTotal)}</strong>
//                                     </Text>
//                                     <Segmented
//                                         size="small"
//                                         options={['By Client', 'By Group', 'By Employee']}
//                                         value={tableView === 'client' ? 'By Client' : tableView === 'group' ? 'By Group' : 'By Employee'}
//                                         onChange={v => setTableView(v === 'By Client' ? 'client' : v === 'By Group' ? 'group' : 'employee')}
//                                     />
//                                 </div>
//                             }
//                         >
//                             Total Time Spent
//                         </SectionTitle>

//                         {/* ─ By Client ─ */}
//                         {tableView === 'client' && (
//                             timePerClientData.length > 0 ? (
//                                 <Row gutter={[16, 16]}>
//                                     <Col xs={24} xl={12}>
//                                         <Text style={{ fontSize: 12, color: C.muted, display: 'block', marginBottom: 8 }}>Top {topClients.length} clients by time logged</Text>
//                                         <EChartsReact option={barOption(topClients.map(r => ({ name: r.client_name, fullName: r.client_name, ms: r.total_hours })))} style={{ height: 280 }} />
//                                     </Col>
//                                     <Col xs={24} xl={12}>
//                                         <Table
//                                             dataSource={timePerClientData} rowKey="client_id" size="small"
//                                             columns={clientTableCols} pagination={sharedPagination} scroll={{ x: 'max-content' }}
//                                             onRow={r => ({ onClick: () => handleClientClick(r.client_id), style: sharedRowStyle })}
//                                             summary={() => (
//                                                 <Table.Summary.Row style={{ background: '#f8fafc' }}>
//                                                     <Table.Summary.Cell index={0} colSpan={4}><Text strong style={{ fontSize: 12 }}>Grand Total</Text></Table.Summary.Cell>
//                                                     <Table.Summary.Cell index={1} align="right"><Text strong style={{ fontSize: 12, color: C.toDo }}>{formatDurationFromMillis(totalTime)}</Text></Table.Summary.Cell>
//                                                 </Table.Summary.Row>
//                                             )}
//                                         />
//                                     </Col>
//                                 </Row>
//                             ) : (
//                                 <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.muted }}>{loading ? <Spin /> : 'No time entries recorded'}</div>
//                             )
//                         )}

//                         {/* ─ By Group ─ */}
//                         {tableView === 'group' && (
//                             timePerGroup.length > 0 ? (
//                                 <Row gutter={[16, 16]}>
//                                     <Col xs={24} xl={12}>
//                                         <Text style={{ fontSize: 12, color: C.muted, display: 'block', marginBottom: 8 }}>Top {topGroups.length} groups by time logged</Text>
//                                         <EChartsReact option={barOption(topGroups.map(r => ({ name: r.client_group_name, fullName: r.client_group_name, ms: r.total_hours })))} style={{ height: 280 }} />
//                                     </Col>
//                                     <Col xs={24} xl={12}>
//                                         <Table
//                                             dataSource={timePerGroup} rowKey="client_group_name" size="small"
//                                             columns={groupTableCols} pagination={sharedPagination} scroll={{ x: 'max-content' }}
//                                             summary={() => (
//                                                 <Table.Summary.Row style={{ background: '#f8fafc' }}>
//                                                     <Table.Summary.Cell index={0} colSpan={3}><Text strong style={{ fontSize: 12 }}>Grand Total</Text></Table.Summary.Cell>
//                                                     <Table.Summary.Cell index={1} align="right"><Text strong style={{ fontSize: 12, color: C.toDo }}>{formatDurationFromMillis(timePerGroup.reduce((s, r) => s + r.total_hours, 0))}</Text></Table.Summary.Cell>
//                                                 </Table.Summary.Row>
//                                             )}
//                                         />
//                                     </Col>
//                                 </Row>
//                             ) : (
//                                 <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.muted }}>{loading ? <Spin /> : 'No time entries recorded'}</div>
//                             )
//                         )}

//                         {/* ─ By Employee ─ */}
//                         {tableView === 'employee' && (
//                             timePerEmployeeData.length > 0 ? (
//                                 <Row gutter={[16, 16]}>
//                                     <Col xs={24} xl={12}>
//                                         <Text style={{ fontSize: 12, color: C.muted, display: 'block', marginBottom: 8 }}>Top {topEmployees.length} employees by time logged</Text>
//                                         <EChartsReact
//                                             option={barOption(topEmployees.map(r => ({ name: r.name, fullName: r.name, ms: r.total_hours_ms })), '#f59e0b', '#fbbf24')}
//                                             style={{ height: 280 }}
//                                         />
//                                     </Col>
//                                     <Col xs={24} xl={12}>
//                                         <Table
//                                             dataSource={timePerEmployeeData} rowKey="name" size="small"
//                                             columns={employeeTableCols} pagination={sharedPagination} scroll={{ x: 'max-content' }}
//                                             onRow={r => ({ onClick: () => handleEmployeeClick(r.name), style: sharedRowStyle })}
//                                             summary={() => (
//                                                 <Table.Summary.Row style={{ background: '#f8fafc' }}>
//                                                     <Table.Summary.Cell index={0} colSpan={3}><Text strong style={{ fontSize: 12 }}>Grand Total</Text></Table.Summary.Cell>
//                                                     <Table.Summary.Cell index={1} align="right"><Text strong style={{ fontSize: 12, color: C.inProgress }}>{formatDurationFromMillis(totalEmpTime)}</Text></Table.Summary.Cell>
//                                                 </Table.Summary.Row>
//                                             )}
//                                         />
//                                     </Col>
//                                 </Row>
//                             ) : (
//                                 <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.muted }}>{loading ? <Spin /> : 'No time entries recorded'}</div>
//                             )
//                         )}
//                     </div>
//                 </Col>
//             </Row>

//             {/* ══ CLIENT DETAIL MODAL ══ */}
//             <Modal
//                 open={clientModalVisible}
//                 onCancel={() => { setClientModalVisible(false); setDrillVisible(false); }}
//                 footer={null} width={900}
//                 styles={{ body: { padding: '24px', background: C.bg } }}
//                 title={
//                     <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
//                         <div style={{ width: 38, height: 38, borderRadius: 10, background: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.toDo, fontWeight: 800, fontSize: 16 }}>
//                             {(selectedClientInfo?.name || 'C')[0]}
//                         </div>
//                         <div>
//                             <div style={{ fontWeight: 700, color: C.text, fontSize: 15 }}>{selectedClientInfo?.name || 'Client'}</div>
//                             <div style={{ fontSize: 12, color: C.muted }}>{getGroupName(selectedClientInfo)} · {getSpocName(selectedClientInfo)}</div>
//                         </div>
//                     </div>
//                 }
//             >
//                 {clientModalLoading ? (
//                     <div style={{ textAlign: 'center', padding: 60 }}><Spin size="large" /></div>
//                 ) : clientSummary ? (
//                     <>
//                         <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
//                             {[
//                                 { label: 'Done Tasks',  value: clientSummary.done_count,                               color: C.done,       bg: '#d1fae5', isText: false },
//                                 { label: 'Total Time',  value: formatDurationFromMillis(clientSummary.total_hours_ms),  color: C.toDo,       bg: '#ede9fe', isText: true  },
//                                 { label: 'Employees',   value: clientSummary.employees?.length || 0,                   color: C.inProgress, bg: '#fef3c7', isText: false },
//                                 { label: 'Services',    value: clientSummary.sub_services?.length || 0,                color: '#0ea5e9',    bg: '#e0f2fe', isText: false },
//                             ].map(({ label, value, color, bg, isText }) => (
//                                 <Col span={6} key={label}>
//                                     <div style={{ background: bg, borderRadius: 12, padding: '14px 16px', textAlign: 'center' }}>
//                                         {isText
//                                             ? <div style={{ fontSize: 20, fontWeight: 800, color, lineHeight: 1.1 }}>{value}</div>
//                                             : <CountUp end={value} duration={1.2} style={{ fontSize: 28, fontWeight: 800, color, lineHeight: 1 }} />
//                                         }
//                                         <div style={{ fontSize: 11, color: C.muted, marginTop: 4, fontWeight: 600 }}>{label}</div>
//                                     </div>
//                                 </Col>
//                             ))}
//                         </Row>
//                         <Row gutter={[12, 12]}>
//                             {clientSummary.employees?.length > 0 && (
//                                 <Col xs={24} md={clientSummary.sub_services?.length > 0 ? 12 : 24}>
//                                     <div style={{ background: C.surface, borderRadius: 12, padding: 16, border: `1px solid ${C.border}` }}>
//                                         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
//                                             <Text style={{ fontWeight: 700, fontSize: 13 }}>Employee Hours</Text>
//                                             <Text style={{ fontSize: 11, color: C.muted }}>Click bar for details</Text>
//                                         </div>
//                                         <EChartsReact
//                                             option={hBarOption(clientSummary.employees, '#818cf8', '#6366f1')}
//                                             style={{ height: Math.max(140, clientSummary.employees.length * 32 + 20) }}
//                                             onEvents={{
//                                                 click: (params) => {
//                                                     const reversed = [...clientSummary.employees].reverse();
//                                                     const emp = reversed[params.dataIndex];
//                                                     if (!emp) return;
//                                                     const services = clientSummary.per_employee_services?.[emp.name] || [];
//                                                     setDrillTitle(emp.name); setDrillData(services); setDrillType('employee'); setDrillVisible(true);
//                                                 },
//                                             }}
//                                         />
//                                     </div>
//                                 </Col>
//                             )}
//                             {clientSummary.sub_services?.length > 0 && (
//                                 <Col xs={24} md={clientSummary.employees?.length > 0 ? 12 : 24}>
//                                     <div style={{ background: C.surface, borderRadius: 12, padding: 16, border: `1px solid ${C.border}` }}>
//                                         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
//                                             <Text style={{ fontWeight: 700, fontSize: 13 }}>Service Breakdown</Text>
//                                             <Text style={{ fontSize: 11, color: C.muted }}>Click bar for details</Text>
//                                         </div>
//                                         <EChartsReact
//                                             option={hBarOption(clientSummary.sub_services, '#06b6d4', '#0ea5e9')}
//                                             style={{ height: Math.max(140, clientSummary.sub_services.length * 32 + 20) }}
//                                             onEvents={{
//                                                 click: (params) => {
//                                                     const reversed = [...clientSummary.sub_services].reverse();
//                                                     const svc = reversed[params.dataIndex];
//                                                     if (!svc) return;
//                                                     const employees = clientSummary.per_service_employees?.[svc.name] || [];
//                                                     setDrillTitle(svc.name); setDrillData(employees); setDrillType('service'); setDrillVisible(true);
//                                                 },
//                                             }}
//                                         />
//                                     </div>
//                                 </Col>
//                             )}
//                         </Row>

//                         {/* ── Client-modal inline drill panel ── */}
//                         {drillVisible && (
//                             <div style={{
//                                 marginTop: 20,
//                                 background: C.surface,
//                                 borderRadius: 12,
//                                 border: `2px solid ${drillType === 'employee' ? '#6366f1' : '#0ea5e9'}`,
//                                 padding: 20,
//                             }}>
//                                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
//                                     <div>
//                                         <Text style={{ fontWeight: 700, fontSize: 14, color: C.text }}>
//                                             {drillType === 'employee' ? `Services — ${drillTitle}` : `Employees — ${drillTitle}`}
//                                         </Text>
//                                         <Text style={{ fontSize: 12, color: C.muted, display: 'block' }}>
//                                             {drillType === 'employee' ? 'Time by sub-service for this employee' : 'Time by employee for this service'}
//                                         </Text>
//                                     </div>
//                                     <Button size="small" onClick={() => setDrillVisible(false)}>✕ Close</Button>
//                                 </div>
//                                 {drillData.length > 0 ? (
//                                     <Row gutter={[16, 0]}>
//                                         <Col xs={24} xl={12}>
//                                             <EChartsReact
//                                                 option={hBarOption(
//                                                     drillData.map(d => ({ name: d.name, ms: d.ms ?? d.total_hours_ms ?? 0 })),
//                                                     drillType === 'employee' ? '#818cf8' : '#06b6d4',
//                                                     drillType === 'employee' ? '#6366f1' : '#0ea5e9',
//                                                 )}
//                                                 style={{ height: Math.max(140, drillData.length * 32 + 20) }}
//                                             />
//                                         </Col>
//                                         <Col xs={24} xl={12}>
//                                             <Table
//                                                 dataSource={drillData.map(d => ({ ...d, ms: d.ms ?? d.total_hours_ms ?? 0 }))}
//                                                 rowKey="name"
//                                                 size="small"
//                                                 pagination={sharedPagination}
//                                                 columns={[
//                                                     makeIndexCol(),
//                                                     {
//                                                         title: drillType === 'employee' ? 'Sub-service' : 'Employee',
//                                                         dataIndex: 'name', key: 'name',
//                                                         render: v => (
//                                                             <Tooltip title={v} placement="topLeft">
//                                                                 <Text style={{ fontWeight: 500, fontSize: 13, maxWidth: 200, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v || '—'}</Text>
//                                                             </Tooltip>
//                                                         ),
//                                                         sorter: (a, b) => (a.name || '').localeCompare(b.name || ''),
//                                                     },
//                                                     {
//                                                         title: 'Time Spent', dataIndex: 'ms', key: 'ms',
//                                                         align: 'right', width: 120,
//                                                         render: v => (
//                                                             <Text style={{ fontSize: 13, fontWeight: 700, color: drillType === 'employee' ? '#6366f1' : '#0ea5e9' }}>
//                                                                 {formatDurationFromMillis(v)}
//                                                             </Text>
//                                                         ),
//                                                         sorter: (a, b) => (a.ms || 0) - (b.ms || 0),
//                                                         defaultSortOrder: 'descend',
//                                                     },
//                                                 ]}
//                                                 summary={() => (
//                                                     <Table.Summary.Row style={{ background: '#f8fafc' }}>
//                                                         <Table.Summary.Cell index={0} colSpan={2}><Text strong style={{ fontSize: 12 }}>Total</Text></Table.Summary.Cell>
//                                                         <Table.Summary.Cell index={1} align="right">
//                                                             <Text strong style={{ fontSize: 12, color: drillType === 'employee' ? '#6366f1' : '#0ea5e9' }}>
//                                                                 {formatDurationFromMillis(drillData.reduce((s, d) => s + (d.ms ?? d.total_hours_ms ?? 0), 0))}
//                                                             </Text>
//                                                         </Table.Summary.Cell>
//                                                     </Table.Summary.Row>
//                                                 )}
//                                             />
//                                         </Col>
//                                     </Row>
//                                 ) : (
//                                     <div style={{ textAlign: 'center', padding: 32, color: C.muted }}>No breakdown data found</div>
//                                 )}
//                             </div>
//                         )}
//                     </>
//                 ) : (
//                     <div style={{ textAlign: 'center', padding: 40, color: C.muted }}>No data available</div>
//                 )}
//             </Modal>

//             {/* ══ EMPLOYEE DETAIL MODAL ══ */}
//             <Modal
//                 open={empModalVisible}
//                 onCancel={() => { setEmpModalVisible(false); setEmpDrillVisible(false); }}
//                 footer={null} width={960}
//                 styles={{ body: { padding: '24px', background: C.bg } }}
//                 title={
//                     <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
//                         <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.inProgress, fontWeight: 800, fontSize: 16 }}>
//                             {(empModalName || 'E')[0]}
//                         </div>
//                         <div>
//                             <div style={{ fontWeight: 700, color: C.text, fontSize: 15 }}>{empModalName}</div>
//                             <div style={{ fontSize: 12, color: C.muted }}>Client-wise time breakdown · click a bar or row to drill into sub-services</div>
//                         </div>
//                     </div>
//                 }
//             >
//                 {empModalLoading ? (
//                     <div style={{ textAlign: 'center', padding: 60 }}><Spin size="large" /></div>
//                 ) : empModalClients.length > 0 ? (
//                     <>
//                         {/* Mini stat strip */}
//                         <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
//                             {[
//                                 { label: 'Clients Worked On', value: empModalClients.length, color: C.inProgress, bg: '#fef3c7', isText: false },
//                                 { label: 'Total Time',        value: formatDurationFromMillis(empModalClients.reduce((s, r) => s + (r.total_hours_ms || 0), 0)), color: C.toDo, bg: '#ede9fe', isText: true },
//                                 { label: 'Avg per Client',    value: formatDurationFromMillis(empModalClients.length ? Math.round(empModalClients.reduce((s, r) => s + (r.total_hours_ms || 0), 0) / empModalClients.length) : 0), color: C.done, bg: '#d1fae5', isText: true },
//                             ].map(({ label, value, color, bg, isText }) => (
//                                 <Col span={8} key={label}>
//                                     <div style={{ background: bg, borderRadius: 12, padding: '14px 16px', textAlign: 'center' }}>
//                                         {isText
//                                             ? <div style={{ fontSize: 20, fontWeight: 800, color, lineHeight: 1.1 }}>{value}</div>
//                                             : <CountUp end={value} duration={1.2} style={{ fontSize: 28, fontWeight: 800, color, lineHeight: 1 }} />
//                                         }
//                                         <div style={{ fontSize: 11, color: C.muted, marginTop: 4, fontWeight: 600 }}>{label}</div>
//                                     </div>
//                                 </Col>
//                             ))}
//                         </Row>

//                         {/* Chart + Table side by side */}
//                         <Row gutter={[16, 16]}>
//                             <Col xs={24} xl={12}>
//                                 <div style={{ background: C.surface, borderRadius: 12, padding: 16, border: `1px solid ${C.border}`, height: '100%' }}>
//                                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
//                                         <Text style={{ fontWeight: 700, fontSize: 13 }}>Time per Client</Text>
//                                         <Text style={{ fontSize: 11, color: C.muted }}>Click bar for sub-services</Text>
//                                     </div>
//                                     <EChartsReact
//                                         option={hBarOption(
//                                             [...empModalClients]
//                                                 .sort((a, b) => b.total_hours_ms - a.total_hours_ms)
//                                                 .slice(0, 10)
//                                                 .map(r => ({ name: r.client_name, ms: r.total_hours_ms })),
//                                             '#f59e0b', '#fbbf24'
//                                         )}
//                                         style={{ height: Math.max(160, Math.min(empModalClients.length, 10) * 32 + 24) }}
//                                         onEvents={{
//                                             click: (params) => {
//                                                 const sorted   = [...empModalClients].sort((a, b) => b.total_hours_ms - a.total_hours_ms).slice(0, 10);
//                                                 const reversed = [...sorted].reverse();
//                                                 const row = reversed[params.dataIndex];
//                                                 if (!row) return;
//                                                 handleEmpClientBarClick(row);
//                                             },
//                                         }}
//                                     />
//                                 </div>
//                             </Col>

//                             <Col xs={24} xl={12}>
//                                 <Table
//                                     dataSource={[...empModalClients].sort((a, b) => b.total_hours_ms - a.total_hours_ms)}
//                                     rowKey="client_id" size="small"
//                                     columns={empClientCols}
//                                     pagination={sharedPagination}
//                                     scroll={{ x: 'max-content' }}
//                                     onRow={r => ({
//                                         onClick: () => handleEmpClientBarClick(r),
//                                         style: sharedRowStyle,
//                                     })}
//                                     summary={() => (
//                                         <Table.Summary.Row style={{ background: '#f8fafc' }}>
//                                             <Table.Summary.Cell index={0} colSpan={2}><Text strong style={{ fontSize: 12 }}>Grand Total</Text></Table.Summary.Cell>
//                                             <Table.Summary.Cell index={1} align="right">
//                                                 <Text strong style={{ fontSize: 12, color: C.inProgress }}>
//                                                     {formatDurationFromMillis(empModalClients.reduce((s, r) => s + (r.total_hours_ms || 0), 0))}
//                                                 </Text>
//                                             </Table.Summary.Cell>
//                                         </Table.Summary.Row>
//                                     )}
//                                 />
//                                 <Text style={{ fontSize: 11, color: C.muted, display: 'block', marginTop: 8 }}>
//                                     💡 Click any row or chart bar to see sub-service breakdown
//                                 </Text>
//                             </Col>
//                         </Row>

//                         {/* ── Inline sub-service drill panel ── */}
//                         {empDrillVisible && (
//                             <div style={{
//                                 marginTop: 20,
//                                 background: C.surface,
//                                 borderRadius: 12,
//                                 border: `2px solid #f59e0b`,
//                                 padding: 20,
//                             }}>
//                                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
//                                     <div>
//                                         <Text style={{ fontWeight: 700, fontSize: 14, color: C.text }}>
//                                             Sub-services — {empDrillClient?.client_name}
//                                         </Text>
//                                         <Text style={{ fontSize: 12, color: C.muted, display: 'block' }}>
//                                             Time breakdown by description/service for <strong>{empModalName}</strong>
//                                         </Text>
//                                     </div>
//                                     <Button size="small" onClick={() => setEmpDrillVisible(false)}>✕ Close</Button>
//                                 </div>

//                                 {empDrillLoading ? (
//                                     <div style={{ textAlign: 'center', padding: 32 }}><Spin /></div>
//                                 ) : empDrillServices.length > 0 ? (
//                                     <Row gutter={[16, 0]}>
//                                         <Col xs={24} xl={12}>
//                                             <EChartsReact
//                                                 option={hBarOption(
//                                                     empDrillServices.map(s => ({ name: s.name, ms: s.ms })),
//                                                     '#f59e0b', '#fbbf24'
//                                                 )}
//                                                 style={{ height: Math.max(140, empDrillServices.length * 32 + 20) }}
//                                             />
//                                         </Col>
//                                         <Col xs={24} xl={12}>
//                                             <Table
//                                                 dataSource={empDrillServices}
//                                                 rowKey="name"
//                                                 size="small"
//                                                 pagination={sharedPagination}
//                                                 columns={empDrillCols}
//                                                 summary={() => (
//                                                     <Table.Summary.Row style={{ background: '#f8fafc' }}>
//                                                         <Table.Summary.Cell index={0} colSpan={2}><Text strong style={{ fontSize: 12 }}>Total</Text></Table.Summary.Cell>
//                                                         <Table.Summary.Cell index={1} align="right">
//                                                             <Text strong style={{ fontSize: 12, color: '#f59e0b' }}>
//                                                                 {formatDurationFromMillis(empDrillServices.reduce((s, r) => s + (r.ms || 0), 0))}
//                                                             </Text>
//                                                         </Table.Summary.Cell>
//                                                     </Table.Summary.Row>
//                                                 )}
//                                             />
//                                         </Col>
//                                     </Row>
//                                 ) : (
//                                     <div style={{ textAlign: 'center', padding: 32, color: C.muted }}>
//                                         No sub-service entries found for this client
//                                     </div>
//                                 )}
//                             </div>
//                         )}
//                     </>
//                 ) : (
//                     <div style={{ textAlign: 'center', padding: 40, color: C.muted }}>No time entries found</div>
//                 )}
//             </Modal>

//         </div>
//     );
// };

// export default TaskDashboard;

// import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
// import ReactDOM from 'react-dom';
// import {
//     Col, Row, Typography, message, Table, DatePicker,
//     Select, Space, Button, Segmented, Modal, Spin, Progress, Tooltip,
// } from 'antd';
// import { api } from '../../../services/api';
// import EChartsReact from 'echarts-for-react';
// import CountUp from 'react-countup';
// import {
//     ClockCircleOutlined, CheckCircleOutlined,
//     MinusCircleOutlined, ExclamationCircleOutlined,
//     FilterOutlined, ClearOutlined, ReloadOutlined,
// } from '@ant-design/icons';
// import { FcList } from 'react-icons/fc';
// import moment from 'moment';
// import { formatDurationFromMillis } from './STT_Records';
// import { useNavigate } from 'react-router-dom';

// const { Title, Text } = Typography;
// const { RangePicker } = DatePicker;
// const { Option } = Select;

// /* ─── Design tokens ─────────────────────────────────────────── */
// const C = {
//     done:       '#10b981',
//     inProgress: '#f59e0b',
//     overdue:    '#ef4444',
//     toDo:       '#6366f1',
//     all:        '#0f172a',
//     bg:         '#f1f5f9',
//     surface:    '#ffffff',
//     border:     '#e2e8f0',
//     text:       '#0f172a',
//     muted:      '#64748b',
// };

// const STATUS_META = {
//     'Done':        { color: C.done,       light: '#d1fae5' },
//     'In Progress': { color: C.inProgress, light: '#fef3c7' },
//     'Over Due':    { color: C.overdue,    light: '#fee2e2' },
//     'To Do':       { color: C.toDo,       light: '#ede9fe' },
// };

// /* ─── Stat Card ─────────────────────────────────────────────── */
// const StatCard = ({ title, value, color, lightColor, icon, subtitle, onClick, loading }) => (
//     <div
//         onClick={onClick}
//         style={{
//             background: C.surface, borderRadius: 16, padding: '20px 22px',
//             cursor: 'pointer', border: `1px solid ${C.border}`,
//             borderTop: `4px solid ${color}`,
//             transition: 'all 0.2s', flex: 1, minWidth: 0,
//             boxShadow: '0 1px 4px rgba(0,0,0,0.06)', position: 'relative', overflow: 'hidden',
//         }}
//         onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = `0 10px 28px ${color}28`; }}
//         onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)'; }}
//     >
//         <div style={{ position: 'absolute', right: 18, top: 18, width: 44, height: 44, borderRadius: 12, background: lightColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color }}>
//             {icon}
//         </div>
//         <Text style={{ fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: '0.07em', textTransform: 'uppercase' }}>
//             {title}
//         </Text>
//         <div style={{ marginTop: 8 }}>
//             {loading
//                 ? <div style={{ fontSize: 28, fontWeight: 700, color: C.muted }}>—</div>
//                 : <CountUp end={value} duration={1.6} style={{ fontSize: 34, fontWeight: 800, color, lineHeight: 1 }} />
//             }
//         </div>
//         {subtitle && <Text style={{ fontSize: 11, color: C.muted, marginTop: 6, display: 'block' }}>{subtitle}</Text>}
//     </div>
// );

// /* ─── Section header ────────────────────────────────────────── */
// const SectionTitle = ({ children, extra }) => (
//     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
//         <Text style={{ fontSize: 14, fontWeight: 700, color: C.text, letterSpacing: '-0.01em' }}>{children}</Text>
//         {extra}
//     </div>
// );

// /* ─── Status Badge ──────────────────────────────────────────── */
// const StatusBadge = ({ status }) => {
//     const meta = STATUS_META[status] || { color: C.muted, light: '#f1f5f9' };
//     return (
//         <span style={{
//             background: meta.light, color: meta.color,
//             borderRadius: 20, padding: '2px 10px',
//             fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap',
//         }}>
//             {status}
//         </span>
//     );
// };

// /* ─── Chart helpers ─────────────────────────────────────────── */
// const pieOption = (data) => ({
//     backgroundColor: 'transparent',
//     tooltip: {
//         trigger: 'item',
//         formatter: '{b}: <b>{c}</b> ({d}%)',
//         backgroundColor: '#1e293b', borderColor: 'transparent',
//         textStyle: { color: '#f1f5f9', fontSize: 13 },
//     },
//     legend: {
//         orient: 'horizontal', bottom: 0, left: 'center',
//         textStyle: { color: C.muted, fontSize: 12 },
//         itemWidth: 10, itemHeight: 10,
//     },
//     series: [{
//         type: 'pie', radius: ['42%', '70%'], center: ['50%', '44%'],
//         avoidLabelOverlap: true,
//         itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
//         label: { show: true, formatter: '{b}\n{c}', fontSize: 11, color: C.muted, lineHeight: 16 },
//         labelLine: { length: 10, length2: 6 },
//         data: data.map(d => ({ ...d, itemStyle: { color: STATUS_META[d.name]?.color || '#94a3b8' } })),
//         emphasis: { itemStyle: { shadowBlur: 12, shadowColor: 'rgba(0,0,0,0.15)' } },
//     }],
// });

// const barOption = (data, colorStart = '#6366f1', colorEnd = '#818cf8') => ({
//     backgroundColor: 'transparent',
//     tooltip: {
//         trigger: 'axis', axisPointer: { type: 'shadow' },
//         backgroundColor: '#1e293b', borderColor: 'transparent',
//         textStyle: { color: '#f1f5f9', fontSize: 12 },
//         formatter: (params) => {
//             const p = params[0];
//             const orig = data[p.dataIndex];
//             return `<b>${orig?.fullName || p.name}</b><br/>${formatDurationFromMillis(p.value)}`;
//         },
//     },
//     grid: { top: 16, right: 16, bottom: 48, left: 16, containLabel: true },
//     xAxis: {
//         type: 'category',
//         data: data.map(d => d.name.length > 13 ? d.name.slice(0, 12) + '…' : d.name),
//         axisLabel: { color: C.muted, fontSize: 11, rotate: data.length > 5 ? 30 : 0, interval: 0 },
//         axisLine: { lineStyle: { color: C.border } },
//         axisTick: { show: false },
//     },
//     yAxis: {
//         type: 'value',
//         axisLabel: { color: C.muted, fontSize: 10, formatter: v => formatDurationFromMillis(v) },
//         splitLine: { lineStyle: { color: C.border, type: 'dashed' } },
//         axisLine: { show: false }, axisTick: { show: false },
//     },
//     series: [{
//         type: 'bar',
//         data: data.map(d => ({
//             value: d.ms,
//             itemStyle: {
//                 color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: colorStart }, { offset: 1, color: colorEnd }] },
//                 borderRadius: [6, 6, 0, 0],
//             },
//         })),
//         barMaxWidth: 48,
//         emphasis: {
//             itemStyle: {
//                 color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: colorEnd }, { offset: 1, color: colorStart }] },
//             },
//         },
//     }],
// });

// const hBarOption = (data, colorStart = '#06b6d4', colorEnd = '#0ea5e9') => {
//     const reversed = [...data].reverse();
//     return {
//         backgroundColor: 'transparent',
//         tooltip: {
//             trigger: 'axis', axisPointer: { type: 'shadow' },
//             backgroundColor: '#1e293b', borderColor: 'transparent',
//             textStyle: { color: '#f1f5f9', fontSize: 12 },
//             formatter: (params) => `<b>${params[0].name}</b><br/>${formatDurationFromMillis(params[0].value)}`,
//         },
//         grid: { top: 4, right: 96, bottom: 4, left: 8, containLabel: true },
//         xAxis: { type: 'value', show: false, splitLine: { show: false } },
//         yAxis: {
//             type: 'category',
//             data: reversed.map(d => d.name?.length > 18 ? d.name.slice(0, 17) + '…' : d.name || 'N/A'),
//             axisLabel: { color: C.muted, fontSize: 11 },
//             axisLine: { show: false }, axisTick: { show: false },
//         },
//         series: [{
//             type: 'bar',
//             data: reversed.map(d => ({
//                 value: d.ms || 0,
//                 itemStyle: {
//                     color: { type: 'linear', x: 0, y: 0, x2: 1, y2: 0, colorStops: [{ offset: 0, color: colorStart }, { offset: 1, color: colorEnd }] },
//                     borderRadius: [0, 6, 6, 0],
//                 },
//             })),
//             barMaxWidth: 18,
//             label: {
//                 show: true, position: 'right',
//                 formatter: p => formatDurationFromMillis(p.value),
//                 color: C.muted, fontSize: 10,
//             },
//         }],
//     };
// };

// /* ─── Shared table column builder ───────────────────────────── */
// const makeIndexCol = () => ({
//     title: '#',
//     render: (_, __, i) => <Text style={{ color: C.muted, fontSize: 12 }}>{i + 1}</Text>,
//     width: 44,
// });

// const makeTimeCol = (colorKey = C.toDo, msField = 'total_hours') => ({
//     title: 'Time Spent',
//     key: 'time',
//     align: 'right',
//     width: 120,
//     render: (_, r) => (
//         <Text style={{ fontSize: 13, fontWeight: 700, color: colorKey }}>
//             {formatDurationFromMillis(r[msField])}
//         </Text>
//     ),
//     sorter: (a, b) => (a[msField] || 0) - (b[msField] || 0),
//     defaultSortOrder: 'descend',
// });

// /* ══════════════ MAIN COMPONENT ══════════════ */
// const TaskDashboard = () => {
//     const navigate = useNavigate();

//     const [loading,             setLoading]             = useState(true);
//     const [dashboardData,       setDashboardData]       = useState(null);
//     const [filteredTasks,       setFilteredTasks]       = useState(null);
//     const [filteredTaskList,    setFilteredTaskList]    = useState([]);   // filtered tasks for upcoming table
//     const [statsLoading,        setStatsLoading]        = useState(false);
//     const [error,               setError]               = useState(null);
//     const [dateRange,           setDateRange]           = useState(null);
//     const [clients,             setClients]             = useState([]);
//     const [selectedClient,      setSelectedClient]      = useState([]);
//     const [teams,               setTeams]               = useState([]);
//     const [selectedTeam,        setSelectedTeam]        = useState([]);
//     const [clientGroups,        setClientGroups]        = useState([]);
//     const [selectedClientGroup, setSelectedClientGroup] = useState([]);
//     const [allSpocs,            setAllSpocs]            = useState([]);
//     const [subServices,         setSubServices]         = useState([]);
//     const [selectedSubService,  setSelectedSubService]  = useState([]);
//     const [employees,           setEmployees]           = useState([]);
//     const [selectedEmployee,    setSelectedEmployee]    = useState([]);
//     const [tableView,           setTableView]           = useState('client');
//     const [taskCounts,          setTaskCounts]          = useState({ allTasks: 0, done: 0, toDo: 0, overdue: 0, inProgress: 0 });
//     const [filtersOpen,         setFiltersOpen]         = useState(false);
//     const [timePerClientData,   setTimePerClientData]   = useState([]);
//     const [timePerEmployeeData, setTimePerEmployeeData] = useState([]);

//     // Client modal
//     const [clientModalVisible,  setClientModalVisible]  = useState(false);
//     const [clientModalLoading,  setClientModalLoading]  = useState(false);
//     const [selectedClientInfo,  setSelectedClientInfo]  = useState(null);
//     const [clientSummary,       setClientSummary]       = useState(null);

//     // Employee modal
//     const [empModalVisible,     setEmpModalVisible]     = useState(false);
//     const [empModalLoading,     setEmpModalLoading]     = useState(false);
//     const [empModalName,        setEmpModalName]        = useState('');
//     const [empModalClients,     setEmpModalClients]     = useState([]);

//     // Employee modal sub-drill (click a client bar → show sub-services)
//     const [empDrillVisible,     setEmpDrillVisible]     = useState(false);
//     const [empDrillClient,      setEmpDrillClient]      = useState(null);
//     const [empDrillServices,    setEmpDrillServices]    = useState([]);
//     const [empDrillLoading,     setEmpDrillLoading]     = useState(false);

//     // Client-modal drill panel
//     const [drillVisible,        setDrillVisible]        = useState(false);
//     const [drillTitle,          setDrillTitle]          = useState('');
//     const [drillData,           setDrillData]           = useState([]);
//     const [drillType,           setDrillType]           = useState('');

//     const mountedRef = useRef(true);
//     useEffect(() => { mountedRef.current = true; return () => { mountedRef.current = false; }; }, []);

//     const clientGroupsRef = useRef([]);
//     const allSpocsRef     = useRef([]);
//     useEffect(() => { clientGroupsRef.current = clientGroups; }, [clientGroups]);
//     useEffect(() => { allSpocsRef.current = allSpocs; }, [allSpocs]);

//     const getSpocName = useCallback((client) => {
//         if (!client) return 'N/A';
//         if (client.primary_spoc_name) return client.primary_spoc_name;
//         const groups = clientGroupsRef.current;
//         const group = groups.find(g => g.clients?.some(cg => (typeof cg === 'object' ? cg.id : cg) === client.id));
//         if (group?.primary_spoc_name) return group.primary_spoc_name;
//         if (typeof client.primary_spoc === 'number') {
//             const spoc = allSpocsRef.current.find(s => s.id === client.primary_spoc);
//             if (spoc) return `${spoc.first_name || ''} ${spoc.last_name || ''}`.trim() || spoc.user?.email || 'N/A';
//         }
//         return 'N/A';
//     }, []);

//     const getGroupName = useCallback((client) => {
//         if (!client) return 'N/A';
//         const groups = clientGroupsRef.current;
//         const group = groups.find(g => g.clients?.some(cg => (typeof cg === 'object' ? cg.id : cg) === client.id));
//         return group?.group_name || 'N/A';
//     }, []);

//     const buildParams = (filters = {}) => {
//         const p = {
//             start_date:      filters.startDate?.format('YYYY-MM-DD'),
//             end_date:        filters.endDate?.format('YYYY-MM-DD'),
//             client_id:       filters.clientId?.length      ? filters.clientId.join(',')       : undefined,
//             team_id:         filters.teamId?.length        ? filters.teamId.join(',')         : undefined,
//             client_group_id: filters.clientGroupId?.length ? filters.clientGroupId.join(',') : undefined,
//             sub_service_id:  filters.subServiceId?.length  ? filters.subServiceId.join(',')  : undefined,
//             employee_name:   filters.employeeName?.length  ? filters.employeeName.join(',')  : undefined,
//         };
//         Object.keys(p).forEach(k => p[k] === undefined && delete p[k]);
//         return p;
//     };

//     /* ── Fetches ── */
//     const fetchDashboard = useCallback(async (params) => {
//         if (!mountedRef.current) return;
//         setLoading(true);
//         try {
//             const res = await api.get('/clients/tasks/dashboard_summary/', { params });
//             if (mountedRef.current) {
//                 setDashboardData(res.data);
//                 setFilteredTasks(res.data);
//             }
//         } catch (err) {
//             console.error(err);
//             if (mountedRef.current) { setError('Failed to load dashboard data.'); message.error('Failed to load dashboard.'); }
//         } finally {
//             if (mountedRef.current) setLoading(false);
//         }
//     }, []);

//     const fetchTimePerClient = useCallback(async (params, clientsList) => {
//         if (!mountedRef.current) return;
//         try {
//             const res = await api.get('/clients/tasks/time_per_client/', { params });
//             if (!mountedRef.current) return;
//             setTimePerClientData((res.data || []).map(row => {
//                 const c = (clientsList || []).find(x => x.id === row.client_id);
//                 return {
//                     ...row,
//                     total_hours: row.total_hours_ms,
//                     group_name:  c ? getGroupName(c) : 'N/A',
//                     spoc_name:   c ? getSpocName(c) : 'N/A',
//                 };
//             }));
//         } catch (err) { console.error('fetchTimePerClient error:', err); }
//     }, [getGroupName, getSpocName]);

//     const fetchTimePerEmployee = useCallback(async (params) => {
//         if (!mountedRef.current) return;
//         try {
//             const res = await api.get('/clients/tasks/time_per_employee/', { params });
//             if (mountedRef.current) setTimePerEmployeeData(res.data || []);
//         } catch (err) { console.error('fetchTimePerEmployee error:', err); }
//     }, []);

//     // Fetches filtered task list for stat cards, pie chart, upcoming table
//     // Uses the same dashboard_summary endpoint — but now with ALL filter params applied
//     const fetchFilteredStats = useCallback(async (params) => {
//         if (!mountedRef.current) return;
//         setStatsLoading(true);
//         try {
//             const res = await api.get('/clients/tasks/dashboard_summary/', { params });
//             if (mountedRef.current) {
//                 setFilteredTasks(res.data);
//                 setFilteredTaskList(res.data?.tasks || []);
//             }
//         } catch (err) { console.error('fetchFilteredStats error:', err); }
//         finally { if (mountedRef.current) setStatsLoading(false); }
//     }, []);

//     /* ── Initial load ── */
//     const didInit = useRef(false);
//     useEffect(() => {
//         if (didInit.current) return;
//         didInit.current = true;
//         (async () => {
//             setLoading(true);
//             try {
//                 const [cR, tR, gR, sR, ssR] = await Promise.all([
//                     api.get('/clients/clients/?page_size=500'),
//                     api.get('/employee/teams/'),
//                     api.get('/clients/client-groups/'),
//                     api.get('/employee/employees/'),
//                     api.get('/clients/subservices/'),
//                 ]);
//                 if (!mountedRef.current) return;
//                 const cl = cR.data.results || cR.data;
//                 const gr = gR.data.results || gR.data;
//                 const sp = sR.data.results || sR.data;
//                 setClients(cl); setTeams(tR.data.results || tR.data);
//                 setClientGroups(gr); setAllSpocs(sp); setSubServices(ssR.data.results || ssR.data);
//                 // Build employee list from allSpocs (User objects with first_name/last_name)
//                 const empList = sp
//                     .filter(u => u.first_name || u.last_name)
//                     .map(u => ({
//                         id:       `${u.first_name || ''} ${u.last_name || ''}`.trim(),
//                         name:     `${u.first_name || ''} ${u.last_name || ''}`.trim(),
//                     }))
//                     .filter(u => u.name)
//                     .sort((a, b) => a.name.localeCompare(b.name));
//                 setEmployees(empList);
//                 clientGroupsRef.current = gr; allSpocsRef.current = sp;
//                 await Promise.all([fetchDashboard({}), fetchFilteredStats({}), fetchTimePerClient({}, cl), fetchTimePerEmployee({})]);
//             } catch (err) {
//                 console.error('fetchInitialData error:', err);
//                 if (mountedRef.current) setError('Failed to load initial data.');
//             } finally {
//                 if (mountedRef.current) setLoading(false);
//             }
//         })();
//     }, [fetchDashboard, fetchFilteredStats, fetchTimePerClient, fetchTimePerEmployee]);

//     /* ── Re-fetch on filter change ── */
//     const isFirstRender = useRef(true);
//     useEffect(() => {
//         if (isFirstRender.current) { isFirstRender.current = false; return; }
//         const [startDate, endDate] = dateRange || [null, null];
//         const f = {
//             startDate,
//             endDate,
//             clientId:      selectedClient,
//             teamId:        selectedTeam,
//             clientGroupId: selectedClientGroup,
//             subServiceId:  selectedSubService,
//             employeeName:  selectedEmployee,
//         };
//         const p = buildParams(f);
//         fetchDashboard(p);
//         fetchFilteredStats(p);
//         fetchTimePerClient(p, clients);
//         fetchTimePerEmployee(p);
//         // eslint-disable-next-line react-hooks/exhaustive-deps
//     }, [dateRange, selectedClient, selectedTeam, selectedClientGroup, selectedSubService, selectedEmployee]);

//     /* ── Derive task counts from filteredTasks (always has current filter params applied) ── */
//     useEffect(() => {
//         const sc = filteredTasks?.status_counts;
//         if (!sc) return;
//         setTaskCounts({
//             allTasks:   (sc['To Do'] || 0) + (sc['In Progress'] || 0) + (sc['Done'] || 0) + (sc['Over Due'] || 0),
//             done:       sc['Done']        || 0,
//             toDo:       sc['To Do']       || 0,
//             inProgress: sc['In Progress'] || 0,
//             overdue:    sc['Over Due']    || 0,
//         });
//     }, [filteredTasks]);

//     /* ── Derived ── */
//     const timePerGroup = useMemo(() =>
//         timePerClientData.reduce((acc, row) => {
//             if (!row.group_name || row.group_name === 'N/A') return acc;
//             const ex = acc.find(g => g.client_group_name === row.group_name);
//             if (ex) ex.total_hours += row.total_hours;
//             else acc.push({ client_group_name: row.group_name, spoc_name: row.spoc_name, total_hours: row.total_hours });
//             return acc;
//         }, [])
//     , [timePerClientData]);

//     const pieData      = useMemo(() =>
//         filteredTasks?.status_counts
//             ? Object.entries(filteredTasks.status_counts).filter(([k, v]) => k !== 'total' && v > 0).map(([name, value]) => ({ name, value }))
//             : []
//     , [filteredTasks]);

//     const topClients   = useMemo(() => [...timePerClientData].sort((a, b) => b.total_hours - a.total_hours).slice(0, 10), [timePerClientData]);
//     const topGroups    = useMemo(() => [...timePerGroup].sort((a, b) => b.total_hours - a.total_hours).slice(0, 10), [timePerGroup]);
//     const topEmployees = useMemo(() => [...timePerEmployeeData].sort((a, b) => b.total_hours_ms - a.total_hours_ms).slice(0, 10), [timePerEmployeeData]);

//     const totalTime      = useMemo(() => timePerClientData.reduce((s, r) => s + (r.total_hours || 0), 0), [timePerClientData]);
//     const totalEmpTime   = useMemo(() => timePerEmployeeData.reduce((s, r) => s + (r.total_hours_ms || 0), 0), [timePerEmployeeData]);
//     const completionRate = taskCounts.allTasks ? Math.round((taskCounts.done / taskCounts.allTasks) * 100) : 0;

//     // Count only filters that have actual values selected
//     const activeFilterCount = [selectedClient, selectedTeam, selectedClientGroup, selectedSubService, selectedEmployee]
//         .filter(a => Array.isArray(a) && a.length > 0).length + (dateRange ? 1 : 0);

//     const grandTotal = tableView === 'employee'
//         ? totalEmpTime
//         : tableView === 'group'
//             ? timePerGroup.reduce((s, r) => s + r.total_hours, 0)
//             : totalTime;

//     const handleClearFilters = () => {
//         setDateRange(null); setSelectedClient([]); setSelectedTeam([]); setSelectedClientGroup([]); setSelectedSubService([]); setSelectedEmployee([]);
//     };

//     /* ── Navigate to tasks with current filters ── */
//     const goToTasks = (status) => {
//         const params = new URLSearchParams();
//         if (status !== 'all') params.set('status', status);
//         const [s, e] = dateRange || [null, null];
//         if (s) params.set('start_date', s.format('YYYY-MM-DD'));
//         if (e) params.set('end_date',   e.format('YYYY-MM-DD'));
//         if (selectedClient?.length)      params.set('client_id',      selectedClient.join(','));
//         if (selectedTeam?.length)        params.set('team_id',         selectedTeam.join(','));
//         if (selectedClientGroup?.length) params.set('client_group_id', selectedClientGroup.join(','));
//         if (selectedSubService?.length)  params.set('sub_service_id',  selectedSubService.join(','));
//         navigate(`/stt-records?${params.toString()}`);
//     };

//     const handleRefresh = useCallback(() => {
//         const [startDate, endDate] = dateRange || [null, null];
//         const f = {
//             startDate, endDate,
//             clientId:      selectedClient,
//             teamId:        selectedTeam,
//             clientGroupId: selectedClientGroup,
//             subServiceId:  selectedSubService,
//             employeeName:  selectedEmployee,
//         };
//         const p = buildParams(f);
//         fetchDashboard(p); fetchFilteredStats(p); fetchTimePerClient(p, clients); fetchTimePerEmployee(p);
//     }, [dateRange, selectedClient, selectedTeam, selectedClientGroup, selectedSubService, selectedEmployee, clients, fetchDashboard, fetchFilteredStats, fetchTimePerClient, fetchTimePerEmployee]);

//     /* ── Client modal ── */
//     const handleClientClick = useCallback(async (clientId) => {
//         const client = clients.find(c => c.id === clientId);
//         setSelectedClientInfo(client); setClientSummary(null);
//         setDrillVisible(false); setDrillData([]);
//         setClientModalVisible(true); setClientModalLoading(true);
//         try {
//             const [startDate, endDate] = dateRange || [null, null];
//             const params = { client_id: clientId };
//             if (startDate)                params.start_date      = startDate.format('YYYY-MM-DD');
//             if (endDate)                  params.end_date        = endDate.format('YYYY-MM-DD');
//             if (selectedTeam?.length)     params.team_id         = selectedTeam.join(',');
//             if (selectedSubService?.length) params.sub_service_id = selectedSubService.join(',');
//             if (selectedClientGroup?.length) params.client_group_id = selectedClientGroup.join(',');
//             const res = await api.get('/clients/tasks/client_task_summary/', { params });
//             if (mountedRef.current) setClientSummary(res.data);
//         } catch (err) { console.error(err); message.error('Failed to load client details'); }
//         finally { if (mountedRef.current) setClientModalLoading(false); }
//     }, [clients, dateRange, selectedTeam, selectedSubService, selectedClientGroup]);

//     /* ── Employee modal ── */
//     const handleEmployeeClick = useCallback(async (employeeName) => {
//         setEmpModalName(employeeName);
//         setEmpModalClients([]);
//         setEmpDrillVisible(false);
//         setEmpDrillClient(null);
//         setEmpDrillServices([]);
//         setEmpModalVisible(true);
//         setEmpModalLoading(true);
//         try {
//             const [startDate, endDate] = dateRange || [null, null];
//             const params = { employee_name: employeeName };
//             if (startDate)                   params.start_date       = startDate.format('YYYY-MM-DD');
//             if (endDate)                     params.end_date         = endDate.format('YYYY-MM-DD');
//             if (selectedClient?.length)      params.client_id        = selectedClient.join(',');
//             if (selectedTeam?.length)        params.team_id          = selectedTeam.join(',');
//             if (selectedSubService?.length)  params.sub_service_id   = selectedSubService.join(',');
//             if (selectedClientGroup?.length) params.client_group_id  = selectedClientGroup.join(',');
//             const res = await api.get('/clients/tasks/time_per_employee_clients/', { params });
//             if (mountedRef.current) setEmpModalClients(res.data || []);
//         } catch (err) { console.error(err); message.error('Failed to load employee details'); }
//         finally { if (mountedRef.current) setEmpModalLoading(false); }
//     }, [dateRange, selectedClient, selectedTeam, selectedSubService, selectedClientGroup]);

//     /* ── Employee modal: click a client bar → load sub-services (Description) ── */
//     const handleEmpClientBarClick = useCallback(async (clientRow) => {
//         setEmpDrillClient(clientRow);
//         setEmpDrillServices([]);
//         setEmpDrillVisible(true);
//         setEmpDrillLoading(true);
//         try {
//             const [startDate, endDate] = dateRange || [null, null];
//             const params = {
//                 client_id:     clientRow.client_id,
//                 employee_name: empModalName,
//             };
//             if (startDate)                   params.start_date      = startDate.format('YYYY-MM-DD');
//             if (endDate)                     params.end_date        = endDate.format('YYYY-MM-DD');
//             if (selectedTeam?.length)        params.team_id         = selectedTeam.join(',');
//             if (selectedSubService?.length)  params.sub_service_id  = selectedSubService.join(',');
//             if (selectedClientGroup?.length) params.client_group_id = selectedClientGroup.join(',');
//             const res = await api.get('/clients/tasks/client_task_summary/', { params });
//             const raw = res.data?.per_employee_services?.[empModalName] || [];
//             const svcList = raw.map(s => ({
//                 name: s.name,
//                 ms:   s.ms ?? s.total_hours_ms ?? 0,
//             })).filter(s => s.ms > 0);
//             if (mountedRef.current) setEmpDrillServices(svcList);
//         } catch (err) { console.error(err); message.error('Failed to load service breakdown'); }
//         finally { if (mountedRef.current) setEmpDrillLoading(false); }
//     }, [dateRange, empModalName, selectedTeam, selectedSubService, selectedClientGroup]);

//     /* ── Upcoming tasks ── */
//     const upcomingTasks = useMemo(() => (filteredTaskList || []).slice(0, 8), [filteredTaskList]);
//     const upcomingCols = [
//         { title: 'Task ID', dataIndex: 'task_id', key: 'task_id', width: 140, render: v => <Text style={{ fontFamily: 'monospace', fontSize: 11, color: C.muted }}>{v}</Text> },
//         { title: 'Client',  dataIndex: 'client_name',      key: 'client_name',      ellipsis: true },
//         { title: 'Service', dataIndex: 'sub_service_name',  key: 'sub_service_name', ellipsis: true },
//         {
//             title: 'Due', dataIndex: 'due_date', key: 'due_date', width: 100,
//             render: d => {
//                 if (!d) return <span style={{ color: C.muted }}>—</span>;
//                 const m = moment(d); const isLate = m.isBefore(moment(), 'day');
//                 return <span style={{ color: isLate ? C.overdue : C.muted, fontWeight: isLate ? 600 : 400, fontSize: 12 }}>{m.format('DD MMM YY')}</span>;
//             },
//         },
//         {
//             title: 'Status', dataIndex: 'status', key: 'status', width: 120,
//             render: (_, r) => {
//                 const eff = r.due_date && moment(r.due_date).isBefore(moment(), 'day') && r.status !== 'Done' ? 'Over Due' : r.status;
//                 return <StatusBadge status={eff} />;
//             },
//         },
//     ];

//     /* ── Shared ── */
//     const sharedRowStyle = { cursor: 'pointer' };
//     const sharedPagination = { pageSize: 8, size: 'small', showSizeChanger: false };

//     /* ── CLIENT table columns ── */
//     const clientTableCols = [
//         makeIndexCol(),
//         {
//             title: 'Client', dataIndex: 'client_name', key: 'client_name',
//             render: v => (
//                 <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
//                     <div style={{
//                         width: 28, height: 28, borderRadius: '50%',
//                         background: '#ede9fe', color: C.toDo,
//                         display: 'flex', alignItems: 'center', justifyContent: 'center',
//                         fontSize: 12, fontWeight: 700, flexShrink: 0,
//                     }}>
//                         {(v || 'C')[0].toUpperCase()}
//                     </div>
//                     <Tooltip title={v} placement="topLeft">
//                         <Text style={{ fontWeight: 500, fontSize: 13, maxWidth: 130, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v || '—'}</Text>
//                     </Tooltip>
//                 </div>
//             ),
//             sorter: (a, b) => (a.client_name || '').localeCompare(b.client_name || ''),
//         },
//         {
//             title: 'Group', dataIndex: 'group_name', key: 'group_name', width: 130,
//             render: v => v && v !== '—' && v !== 'N/A' ? (
//                 <Tooltip title={v} placement="topLeft">
//                     <span style={{
//                         background: '#f0fdf4', color: C.done,
//                         borderRadius: 20, padding: '2px 10px',
//                         fontSize: 11, fontWeight: 600,
//                         maxWidth: 120, display: 'inline-block',
//                         overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
//                         verticalAlign: 'middle',
//                     }}>{v}</span>
//                 </Tooltip>
//             ) : <Text style={{ fontSize: 12, color: C.muted }}>—</Text>,
//         },
//         {
//             title: 'SPOC', dataIndex: 'spoc_name', key: 'spoc_name', width: 120,
//             render: v => v && v !== '—' && v !== 'N/A' ? (
//                 <Tooltip title={v} placement="topLeft">
//                     <span style={{
//                         background: '#f0f9ff', color: '#0ea5e9',
//                         borderRadius: 20, padding: '2px 10px',
//                         fontSize: 11, fontWeight: 600,
//                         maxWidth: 110, display: 'inline-block',
//                         overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
//                         verticalAlign: 'middle',
//                     }}>{v}</span>
//                 </Tooltip>
//             ) : <Text style={{ fontSize: 12, color: C.muted }}>—</Text>,
//         },
//         makeTimeCol(C.toDo, 'total_hours'),
//     ];

//     /* ── GROUP table columns ── */
//     const groupTableCols = [
//         makeIndexCol(),
//         {
//             title: 'Client Group', dataIndex: 'client_group_name', key: 'client_group_name',
//             render: v => (
//                 <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
//                     <div style={{
//                         width: 28, height: 28, borderRadius: '50%',
//                         background: '#f0fdf4', color: C.done,
//                         display: 'flex', alignItems: 'center', justifyContent: 'center',
//                         fontSize: 12, fontWeight: 700, flexShrink: 0,
//                     }}>
//                         {(v || 'G')[0].toUpperCase()}
//                     </div>
//                     <Tooltip title={v} placement="topLeft">
//                         <Text style={{ fontWeight: 500, fontSize: 13, maxWidth: 150, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v || '—'}</Text>
//                     </Tooltip>
//                 </div>
//             ),
//             sorter: (a, b) => (a.client_group_name || '').localeCompare(b.client_group_name || ''),
//         },
//         {
//             title: 'SPOC', dataIndex: 'spoc_name', key: 'spoc_name', width: 140,
//             render: v => v && v !== '—' && v !== 'N/A' ? (
//                 <Tooltip title={v} placement="topLeft">
//                     <span style={{
//                         background: '#f0f9ff', color: '#0ea5e9',
//                         borderRadius: 20, padding: '2px 10px',
//                         fontSize: 11, fontWeight: 600,
//                         maxWidth: 130, display: 'inline-block',
//                         overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
//                         verticalAlign: 'middle',
//                     }}>{v}</span>
//                 </Tooltip>
//             ) : <Text style={{ fontSize: 12, color: C.muted }}>—</Text>,
//         },
//         makeTimeCol(C.toDo, 'total_hours'),
//     ];

//     /* ── EMPLOYEE table columns — includes Team column ── */
//     const employeeTableCols = [
//         makeIndexCol(),
//         {
//             title: 'Employee', dataIndex: 'name', key: 'name',
//             render: v => (
//                 <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
//                     <div style={{
//                         width: 28, height: 28, borderRadius: '50%',
//                         background: '#fef3c7', color: C.inProgress,
//                         display: 'flex', alignItems: 'center', justifyContent: 'center',
//                         fontSize: 12, fontWeight: 700, flexShrink: 0,
//                     }}>
//                         {(v || 'N')[0]}
//                     </div>
//                     <Text style={{ fontWeight: 500, fontSize: 13 }}>{v || 'N/A'}</Text>
//                 </div>
//             ),
//             sorter: (a, b) => (a.name || '').localeCompare(b.name || ''),
//         },
//         {
//             title: 'Team', dataIndex: 'team_name', key: 'team_name', width: 130,
//             render: v => (
//                 <Tooltip title={v} placement="topLeft">
//                     <Text style={{ fontSize: 12, color: C.muted, maxWidth: 120, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v || '—'}</Text>
//                 </Tooltip>
//             ),
//         },
//         makeTimeCol(C.inProgress, 'total_hours_ms'),
//     ];

//     /* ── Employee modal: client breakdown columns ── */
//     const empClientCols = [
//         makeIndexCol(),
//         {
//             title: 'Client', dataIndex: 'client_name', key: 'client_name',
//             render: v => (
//                 <Tooltip title={v} placement="topLeft">
//                     <Text style={{ fontWeight: 500, fontSize: 13, maxWidth: 200, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v || '—'}</Text>
//                 </Tooltip>
//             ),
//             sorter: (a, b) => (a.client_name || '').localeCompare(b.client_name || ''),
//         },
//         makeTimeCol(C.inProgress, 'total_hours_ms'),
//     ];

//     /* ── Sub-service drill table columns (same look as other tables) ── */
//     const empDrillCols = [
//         makeIndexCol(),
//         {
//             title: 'Sub-service / Description', dataIndex: 'name', key: 'name',
//             render: v => (
//                 <Tooltip title={v} placement="topLeft">
//                     <Text style={{ fontWeight: 500, fontSize: 13, maxWidth: 220, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v || '—'}</Text>
//                 </Tooltip>
//             ),
//             sorter: (a, b) => (a.name || '').localeCompare(b.name || ''),
//         },
//         {
//             title: 'Time Spent', dataIndex: 'ms', key: 'ms',
//             align: 'right', width: 120,
//             render: v => (
//                 <Text style={{ fontSize: 13, fontWeight: 700, color: '#f59e0b' }}>
//                     {formatDurationFromMillis(v)}
//                 </Text>
//             ),
//             sorter: (a, b) => (a.ms || 0) - (b.ms || 0),
//             defaultSortOrder: 'descend',
//         },
//     ];

//     /* ── Error state ── */
//     if (error && !dashboardData) {
//         return (
//             <div style={{ padding: 60, textAlign: 'center', background: C.bg, minHeight: '100vh' }}>
//                 <Text style={{ color: C.overdue, fontSize: 16 }}>{error}</Text><br />
//                 <Button style={{ marginTop: 16 }} onClick={() => { didInit.current = false; }} icon={<ReloadOutlined />}>Retry</Button>
//             </div>
//         );
//     }

//     /* ══════════════ RENDER ══════════════ */
//     return (
//         <div style={{ background: C.bg, minHeight: '100vh', padding: '24px 28px', fontFamily: '"DM Sans", "Segoe UI", sans-serif' }}>

//             {/* ── Header ── */}
//             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
//                 <div>
//                     <Title level={3} style={{ margin: 0, color: C.text, fontWeight: 800, letterSpacing: '-0.03em' }}>Task Analytics</Title>
//                     <Text style={{ color: C.muted, fontSize: 13 }}>{moment().format('dddd, D MMMM YYYY')} · Real-time overview</Text>
//                 </div>
//                 <Space>
//                     <Button icon={<ReloadOutlined />} onClick={handleRefresh} loading={loading}>Refresh</Button>
//                     <Button type="primary" onClick={() => navigate('/stt-records')} style={{ background: C.toDo, borderColor: C.toDo }}>All Tasks →</Button>
//                 </Space>
//             </div>

//             {/* ── Filters ── */}
//             <div style={{ background: C.surface, borderRadius: 16, border: `1px solid ${C.border}`, marginBottom: 24, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
//                 {/* Filter header bar */}
//                 <div
//                     onClick={() => setFiltersOpen(v => !v)}
//                     style={{
//                         padding: '13px 20px',
//                         display: 'flex', justifyContent: 'space-between', alignItems: 'center',
//                         cursor: 'pointer',
//                         borderBottom: filtersOpen ? `1px solid ${C.border}` : 'none',
//                         background: filtersOpen ? '#fafbff' : C.surface,
//                         transition: 'background 0.2s',
//                     }}
//                 >
//                     <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
//                         <div style={{ width: 30, height: 30, borderRadius: 8, background: activeFilterCount > 0 ? '#ede9fe' : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
//                             <FilterOutlined style={{ color: activeFilterCount > 0 ? C.toDo : C.muted, fontSize: 13 }} />
//                         </div>
//                         <div>
//                             <Text style={{ fontWeight: 700, color: C.text, fontSize: 13 }}>Filters</Text>
//                             {activeFilterCount > 0
//                                 ? <Text style={{ fontSize: 11, color: C.muted, marginLeft: 8 }}>{activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''} active</Text>
//                                 : <Text style={{ fontSize: 11, color: C.muted, marginLeft: 8 }}>No filters applied</Text>
//                             }
//                         </div>
//                         {activeFilterCount > 0 && (
//                             <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginLeft: 4 }}>
//                                 {dateRange && (
//                                     <span style={{ background: '#ede9fe', color: C.toDo, borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 600 }}>
//                                         {dateRange[0]?.format('DD MMM')} – {dateRange[1]?.format('DD MMM YY')}
//                                     </span>
//                                 )}
//                                 {selectedClientGroup.length > 0 && <span style={{ background: '#f0fdf4', color: C.done, borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 600 }}>{selectedClientGroup.length} group{selectedClientGroup.length > 1 ? 's' : ''}</span>}
//                                 {selectedClient.length > 0 && <span style={{ background: '#ede9fe', color: C.toDo, borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 600 }}>{selectedClient.length} client{selectedClient.length > 1 ? 's' : ''}</span>}
//                                 {selectedTeam.length > 0 && <span style={{ background: '#f0f9ff', color: '#0ea5e9', borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 600 }}>{selectedTeam.length} team{selectedTeam.length > 1 ? 's' : ''}</span>}
//                                 {selectedSubService.length > 0 && <span style={{ background: '#fff7ed', color: '#f97316', borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 600 }}>{selectedSubService.length} service{selectedSubService.length > 1 ? 's' : ''}</span>}
//                                 {selectedEmployee.length > 0 && <span style={{ background: '#fef3c7', color: C.inProgress, borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 600 }}>{selectedEmployee.length} employee{selectedEmployee.length > 1 ? 's' : ''}</span>}
//                             </div>
//                         )}
//                     </div>
//                     <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
//                         {activeFilterCount > 0 && (
//                             <div
//                                 onClick={e => { e.stopPropagation(); handleClearFilters(); }}
//                                 style={{ display: 'flex', alignItems: 'center', gap: 4, color: C.overdue, fontSize: 12, fontWeight: 600, cursor: 'pointer', padding: '4px 10px', borderRadius: 6, background: '#fff1f2', border: '1px solid #fecdd3' }}
//                             >
//                                 <ClearOutlined style={{ fontSize: 11 }} /> Clear all
//                             </div>
//                         )}
//                         <div style={{ color: C.muted, fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
//                             {filtersOpen
//                                 ? <><span style={{ fontSize: 10 }}>▲</span> Hide</>
//                                 : <><span style={{ fontSize: 10 }}>▼</span> Show</>
//                             }
//                         </div>
//                     </div>
//                 </div>

//                 {/* Filter body */}
//                 {filtersOpen && (
//                     <div style={{ padding: '20px 20px 16px' }}>
//                         <Row gutter={[14, 14]}>

//                             {/* Date Range */}
//                             <Col xs={24} sm={12} md={8} lg={6}>
//                                 <div style={{ marginBottom: 5 }}>
//                                     <Text style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Date Range</Text>
//                                 </div>
//                                 <RangePicker
//                                     style={{ width: '100%' }}
//                                     value={dateRange}
//                                     onChange={setDateRange}
//                                     size="middle"
//                                     format="DD MMM YYYY"
//                                     placeholder={['From date', 'To date']}
//                                     allowClear
//                                 />
//                             </Col>

//                             {/* Client Group */}
//                             <Col xs={24} sm={12} md={8} lg={6}>
//                                 <div style={{ marginBottom: 5 }}>
//                                     <Text style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Client Group</Text>
//                                 </div>
//                                 <Select
//                                     mode="multiple" allowClear showSearch
//                                     placeholder="All groups"
//                                     value={selectedClientGroup}
//                                     onChange={setSelectedClientGroup}
//                                     style={{ width: '100%' }}
//                                     size="middle"
//                                     maxTagCount={2}
//                                     maxTagPlaceholder={omitted => `+${omitted.length} more`}
//                                     filterOption={(inp, opt) => (opt?.children ?? '').toLowerCase().includes(inp.toLowerCase())}
//                                     optionFilterProp="children"
//                                 >
//                                     {clientGroups.map(i => <Option key={i.id} value={i.id}>{i.group_name}</Option>)}
//                                 </Select>
//                             </Col>

//                             {/* Client */}
//                             <Col xs={24} sm={12} md={8} lg={6}>
//                                 <div style={{ marginBottom: 5 }}>
//                                     <Text style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Client</Text>
//                                 </div>
//                                 <Select
//                                     mode="multiple" allowClear showSearch
//                                     placeholder="All clients"
//                                     value={selectedClient}
//                                     onChange={setSelectedClient}
//                                     style={{ width: '100%' }}
//                                     size="middle"
//                                     maxTagCount={2}
//                                     maxTagPlaceholder={omitted => `+${omitted.length} more`}
//                                     filterOption={(inp, opt) => (opt?.children ?? '').toLowerCase().includes(inp.toLowerCase())}
//                                     optionFilterProp="children"
//                                 >
//                                     {clients.map(i => <Option key={i.id} value={i.id}>{i.name}</Option>)}
//                                 </Select>
//                             </Col>

//                             {/* Team */}
//                             <Col xs={24} sm={12} md={8} lg={6}>
//                                 <div style={{ marginBottom: 5 }}>
//                                     <Text style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Team</Text>
//                                 </div>
//                                 <Select
//                                     mode="multiple" allowClear showSearch
//                                     placeholder="All teams"
//                                     value={selectedTeam}
//                                     onChange={setSelectedTeam}
//                                     style={{ width: '100%' }}
//                                     size="middle"
//                                     maxTagCount={2}
//                                     maxTagPlaceholder={omitted => `+${omitted.length} more`}
//                                     filterOption={(inp, opt) => (opt?.children ?? '').toLowerCase().includes(inp.toLowerCase())}
//                                     optionFilterProp="children"
//                                 >
//                                     {teams.map(i => <Option key={i.id} value={i.id}>{i.name}</Option>)}
//                                 </Select>
//                             </Col>

//                             {/* Sub Service */}
//                             <Col xs={24} sm={12} md={8} lg={6}>
//                                 <div style={{ marginBottom: 5 }}>
//                                     <Text style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Sub Service</Text>
//                                 </div>
//                                 <Select
//                                     mode="multiple" allowClear showSearch
//                                     placeholder="All services"
//                                     value={selectedSubService}
//                                     onChange={setSelectedSubService}
//                                     style={{ width: '100%' }}
//                                     size="middle"
//                                     maxTagCount={2}
//                                     maxTagPlaceholder={omitted => `+${omitted.length} more`}
//                                     filterOption={(inp, opt) => (opt?.children ?? '').toLowerCase().includes(inp.toLowerCase())}
//                                     optionFilterProp="children"
//                                 >
//                                     {subServices.map(i => <Option key={i.id} value={i.id}>{i.name}</Option>)}
//                                 </Select>
//                             </Col>

//                             {/* Employee */}
//                             <Col xs={24} sm={12} md={8} lg={6}>
//                                 <div style={{ marginBottom: 5 }}>
//                                     <Text style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Employee</Text>
//                                 </div>
//                                 <Select
//                                     mode="multiple" allowClear showSearch
//                                     placeholder="All employees"
//                                     value={selectedEmployee}
//                                     onChange={setSelectedEmployee}
//                                     style={{ width: '100%' }}
//                                     size="middle"
//                                     maxTagCount={2}
//                                     maxTagPlaceholder={omitted => `+${omitted.length} more`}
//                                     filterOption={(inp, opt) => (opt?.children ?? '').toLowerCase().includes(inp.toLowerCase())}
//                                     optionFilterProp="children"
//                                 >
//                                     {employees.map(i => <Option key={i.id} value={i.id}>{i.name}</Option>)}
//                                 </Select>
//                             </Col>

//                         </Row>
//                     </div>
//                 )}
//             </div>

//             {/* ── KPI Cards ── */}
//             <Row gutter={[14, 14]} style={{ marginBottom: 20, flexWrap: 'nowrap' }}>
//                 {[
//                     { title: 'Total Tasks',  value: taskCounts.allTasks,   color: C.all,        lightColor: '#f1f5f9', icon: <FcList />,                  subtitle: 'Across all statuses',           status: 'all'         },
//                     { title: 'To Do',        value: taskCounts.toDo,       color: C.toDo,       lightColor: '#ede9fe', icon: <ClockCircleOutlined />,       subtitle: 'Pending start',                 status: 'To Do'       },
//                     { title: 'In Progress',  value: taskCounts.inProgress, color: C.inProgress, lightColor: '#fef3c7', icon: <MinusCircleOutlined />,       subtitle: 'Being worked on',               status: 'In Progress' },
//                     { title: 'Done',         value: taskCounts.done,       color: C.done,       lightColor: '#d1fae5', icon: <CheckCircleOutlined />,       subtitle: `${completionRate}% completion`, status: 'Done'        },
//                     { title: 'Overdue',      value: taskCounts.overdue,    color: C.overdue,    lightColor: '#fee2e2', icon: <ExclamationCircleOutlined />, subtitle: 'Need attention',                status: 'Over Due'    },
//                 ].map((card) => (
//                     <Col key={card.title} style={{ flex: '1 1 0', minWidth: 0, display: 'flex' }}>
//                         <StatCard {...card} loading={loading || statsLoading} onClick={() => goToTasks(card.status)} />
//                     </Col>
//                 ))}
//             </Row>

//             {/* ── Overall progress bar ── */}
//             {taskCounts.allTasks > 0 && (
//                 <div style={{ background: C.surface, borderRadius: 14, padding: '16px 24px', marginBottom: 20, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
//                     <Text style={{ fontWeight: 600, color: C.text, whiteSpace: 'nowrap', fontSize: 13 }}>Overall Progress</Text>
//                     <div style={{ flex: 1, minWidth: 120 }}>
//                         <Progress percent={completionRate} strokeColor={{ '0%': C.toDo, '100%': C.done }} trailColor="#e2e8f0" strokeWidth={10} showInfo={false} />
//                     </div>
//                     <div style={{ display: 'flex', gap: 24, flexShrink: 0 }}>
//                         {[
//                             { label: 'Done',     val: taskCounts.done,                          color: C.done       },
//                             { label: 'Active',   val: taskCounts.toDo + taskCounts.inProgress,  color: C.inProgress },
//                             { label: 'Overdue',  val: taskCounts.overdue,                       color: C.overdue    },
//                             { label: 'Complete', val: `${completionRate}%`,                     color: C.text       },
//                         ].map(({ label, val, color }) => (
//                             <div key={label} style={{ textAlign: 'center' }}>
//                                 <div style={{ fontWeight: 700, color, fontSize: 16, lineHeight: 1 }}>{val}</div>
//                                 <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{label}</div>
//                             </div>
//                         ))}
//                     </div>
//                 </div>
//             )}

//             {/* ── Pie + Upcoming ── */}
//             <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
//                 <Col xs={24} lg={9}>
//                     <div style={{ background: C.surface, borderRadius: 14, padding: '20px 20px 12px', border: `1px solid ${C.border}`, height: '100%' }}>
//                         <SectionTitle>Status Distribution</SectionTitle>
//                         {(loading || statsLoading)
//                             ? <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Spin /></div>
//                             : pieData.length > 0
//                                 ? <EChartsReact option={pieOption(pieData)} style={{ height: 300 }} />
//                                 : <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.muted }}>No data</div>
//                         }
//                     </div>
//                 </Col>
//                 <Col xs={24} lg={15}>
//                     <div style={{ background: C.surface, borderRadius: 14, padding: '20px', border: `1px solid ${C.border}`, height: '100%' }}>
//                         <SectionTitle extra={<Button size="small" type="link" onClick={() => goToTasks('all')} style={{ color: C.toDo, padding: 0 }}>View all →</Button>}>
//                             Upcoming &amp; Recent Tasks
//                         </SectionTitle>
//                         <Table
//                             dataSource={upcomingTasks} columns={upcomingCols} rowKey="id" size="small"
//                             pagination={false} loading={loading || statsLoading} scroll={{ x: 'max-content' }}
//                             onRow={r => ({ onClick: () => goToTasks(r.status), style: sharedRowStyle })}
//                             locale={{ emptyText: <div style={{ padding: 32, color: C.muted }}>No tasks found 🎉</div> }}
//                         />
//                     </div>
//                 </Col>
//             </Row>

//             {/* ── Time Spent ── */}
//             <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
//                 <Col xs={24}>
//                     <div style={{ background: C.surface, borderRadius: 14, padding: '20px', border: `1px solid ${C.border}` }}>
//                         <SectionTitle
//                             extra={
//                                 <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
//                                     <Text style={{ fontSize: 13, color: C.muted }}>
//                                         Total: <strong style={{ color: tableView === 'employee' ? C.inProgress : C.toDo }}>{formatDurationFromMillis(grandTotal)}</strong>
//                                     </Text>
//                                     <Segmented
//                                         size="small"
//                                         options={['By Client', 'By Group', 'By Employee']}
//                                         value={tableView === 'client' ? 'By Client' : tableView === 'group' ? 'By Group' : 'By Employee'}
//                                         onChange={v => setTableView(v === 'By Client' ? 'client' : v === 'By Group' ? 'group' : 'employee')}
//                                     />
//                                 </div>
//                             }
//                         >
//                             Total Time Spent
//                         </SectionTitle>

//                         {/* ─ By Client ─ */}
//                         {tableView === 'client' && (
//                             timePerClientData.length > 0 ? (
//                                 <Row gutter={[16, 16]}>
//                                     <Col xs={24} xl={12}>
//                                         <Text style={{ fontSize: 12, color: C.muted, display: 'block', marginBottom: 8 }}>Top {topClients.length} clients by time logged</Text>
//                                         <EChartsReact option={barOption(topClients.map(r => ({ name: r.client_name, fullName: r.client_name, ms: r.total_hours })))} style={{ height: 280 }} />
//                                     </Col>
//                                     <Col xs={24} xl={12}>
//                                         <Table
//                                             dataSource={timePerClientData} rowKey="client_id" size="small"
//                                             columns={clientTableCols} pagination={sharedPagination} scroll={{ x: 'max-content' }}
//                                             onRow={r => ({ onClick: () => handleClientClick(r.client_id), style: sharedRowStyle })}
//                                             summary={() => (
//                                                 <Table.Summary.Row style={{ background: '#f8fafc' }}>
//                                                     <Table.Summary.Cell index={0} colSpan={4}><Text strong style={{ fontSize: 12 }}>Grand Total</Text></Table.Summary.Cell>
//                                                     <Table.Summary.Cell index={1} align="right"><Text strong style={{ fontSize: 12, color: C.toDo }}>{formatDurationFromMillis(totalTime)}</Text></Table.Summary.Cell>
//                                                 </Table.Summary.Row>
//                                             )}
//                                         />
//                                     </Col>
//                                 </Row>
//                             ) : (
//                                 <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.muted }}>{loading ? <Spin /> : 'No time entries recorded'}</div>
//                             )
//                         )}

//                         {/* ─ By Group ─ */}
//                         {tableView === 'group' && (
//                             timePerGroup.length > 0 ? (
//                                 <Row gutter={[16, 16]}>
//                                     <Col xs={24} xl={12}>
//                                         <Text style={{ fontSize: 12, color: C.muted, display: 'block', marginBottom: 8 }}>Top {topGroups.length} groups by time logged</Text>
//                                         <EChartsReact option={barOption(topGroups.map(r => ({ name: r.client_group_name, fullName: r.client_group_name, ms: r.total_hours })))} style={{ height: 280 }} />
//                                     </Col>
//                                     <Col xs={24} xl={12}>
//                                         <Table
//                                             dataSource={timePerGroup} rowKey="client_group_name" size="small"
//                                             columns={groupTableCols} pagination={sharedPagination} scroll={{ x: 'max-content' }}
//                                             summary={() => (
//                                                 <Table.Summary.Row style={{ background: '#f8fafc' }}>
//                                                     <Table.Summary.Cell index={0} colSpan={3}><Text strong style={{ fontSize: 12 }}>Grand Total</Text></Table.Summary.Cell>
//                                                     <Table.Summary.Cell index={1} align="right"><Text strong style={{ fontSize: 12, color: C.toDo }}>{formatDurationFromMillis(timePerGroup.reduce((s, r) => s + r.total_hours, 0))}</Text></Table.Summary.Cell>
//                                                 </Table.Summary.Row>
//                                             )}
//                                         />
//                                     </Col>
//                                 </Row>
//                             ) : (
//                                 <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.muted }}>{loading ? <Spin /> : 'No time entries recorded'}</div>
//                             )
//                         )}

//                         {/* ─ By Employee ─ */}
//                         {tableView === 'employee' && (
//                             timePerEmployeeData.length > 0 ? (
//                                 <Row gutter={[16, 16]}>
//                                     <Col xs={24} xl={12}>
//                                         <Text style={{ fontSize: 12, color: C.muted, display: 'block', marginBottom: 8 }}>Top {topEmployees.length} employees by time logged</Text>
//                                         <EChartsReact
//                                             option={barOption(topEmployees.map(r => ({ name: r.name, fullName: r.name, ms: r.total_hours_ms })), '#f59e0b', '#fbbf24')}
//                                             style={{ height: 280 }}
//                                         />
//                                     </Col>
//                                     <Col xs={24} xl={12}>
//                                         <Table
//                                             dataSource={timePerEmployeeData} rowKey="name" size="small"
//                                             columns={employeeTableCols} pagination={sharedPagination} scroll={{ x: 'max-content' }}
//                                             onRow={r => ({ onClick: () => handleEmployeeClick(r.name), style: sharedRowStyle })}
//                                             summary={() => (
//                                                 <Table.Summary.Row style={{ background: '#f8fafc' }}>
//                                                     <Table.Summary.Cell index={0} colSpan={3}><Text strong style={{ fontSize: 12 }}>Grand Total</Text></Table.Summary.Cell>
//                                                     <Table.Summary.Cell index={1} align="right"><Text strong style={{ fontSize: 12, color: C.inProgress }}>{formatDurationFromMillis(totalEmpTime)}</Text></Table.Summary.Cell>
//                                                 </Table.Summary.Row>
//                                             )}
//                                         />
//                                     </Col>
//                                 </Row>
//                             ) : (
//                                 <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.muted }}>{loading ? <Spin /> : 'No time entries recorded'}</div>
//                             )
//                         )}
//                     </div>
//                 </Col>
//             </Row>

//             {/* ══ CLIENT DETAIL MODAL ══ */}
//             <Modal
//                 open={clientModalVisible}
//                 onCancel={() => { setClientModalVisible(false); setDrillVisible(false); }}
//                 footer={null} width={900}
//                 styles={{ body: { padding: '24px', background: C.bg } }}
//                 title={
//                     <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
//                         <div style={{ width: 38, height: 38, borderRadius: 10, background: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.toDo, fontWeight: 800, fontSize: 16 }}>
//                             {(selectedClientInfo?.name || 'C')[0]}
//                         </div>
//                         <div>
//                             <div style={{ fontWeight: 700, color: C.text, fontSize: 15 }}>{selectedClientInfo?.name || 'Client'}</div>
//                             <div style={{ fontSize: 12, color: C.muted }}>{getGroupName(selectedClientInfo)} · {getSpocName(selectedClientInfo)}</div>
//                         </div>
//                     </div>
//                 }
//             >
//                 {clientModalLoading ? (
//                     <div style={{ textAlign: 'center', padding: 60 }}><Spin size="large" /></div>
//                 ) : clientSummary ? (
//                     <>
//                         <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
//                             {[
//                                 { label: 'Done Tasks',  value: clientSummary.done_count,                               color: C.done,       bg: '#d1fae5', isText: false },
//                                 { label: 'Total Time',  value: formatDurationFromMillis(clientSummary.total_hours_ms),  color: C.toDo,       bg: '#ede9fe', isText: true  },
//                                 { label: 'Employees',   value: clientSummary.employees?.length || 0,                   color: C.inProgress, bg: '#fef3c7', isText: false },
//                                 { label: 'Services',    value: clientSummary.sub_services?.length || 0,                color: '#0ea5e9',    bg: '#e0f2fe', isText: false },
//                             ].map(({ label, value, color, bg, isText }) => (
//                                 <Col span={6} key={label}>
//                                     <div style={{ background: bg, borderRadius: 12, padding: '14px 16px', textAlign: 'center' }}>
//                                         {isText
//                                             ? <div style={{ fontSize: 20, fontWeight: 800, color, lineHeight: 1.1 }}>{value}</div>
//                                             : <CountUp end={value} duration={1.2} style={{ fontSize: 28, fontWeight: 800, color, lineHeight: 1 }} />
//                                         }
//                                         <div style={{ fontSize: 11, color: C.muted, marginTop: 4, fontWeight: 600 }}>{label}</div>
//                                     </div>
//                                 </Col>
//                             ))}
//                         </Row>
//                         <Row gutter={[12, 12]}>
//                             {clientSummary.employees?.length > 0 && (
//                                 <Col xs={24} md={clientSummary.sub_services?.length > 0 ? 12 : 24}>
//                                     <div style={{ background: C.surface, borderRadius: 12, padding: 16, border: `1px solid ${C.border}` }}>
//                                         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
//                                             <Text style={{ fontWeight: 700, fontSize: 13 }}>Employee Hours</Text>
//                                             <Text style={{ fontSize: 11, color: C.muted }}>Click bar for details</Text>
//                                         </div>
//                                         <EChartsReact
//                                             option={hBarOption(clientSummary.employees, '#818cf8', '#6366f1')}
//                                             style={{ height: Math.max(140, clientSummary.employees.length * 32 + 20) }}
//                                             onEvents={{
//                                                 click: (params) => {
//                                                     const reversed = [...clientSummary.employees].reverse();
//                                                     const emp = reversed[params.dataIndex];
//                                                     if (!emp) return;
//                                                     const services = clientSummary.per_employee_services?.[emp.name] || [];
//                                                     setDrillTitle(emp.name); setDrillData(services); setDrillType('employee'); setDrillVisible(true);
//                                                 },
//                                             }}
//                                         />
//                                     </div>
//                                 </Col>
//                             )}
//                             {clientSummary.sub_services?.length > 0 && (
//                                 <Col xs={24} md={clientSummary.employees?.length > 0 ? 12 : 24}>
//                                     <div style={{ background: C.surface, borderRadius: 12, padding: 16, border: `1px solid ${C.border}` }}>
//                                         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
//                                             <Text style={{ fontWeight: 700, fontSize: 13 }}>Service Breakdown</Text>
//                                             <Text style={{ fontSize: 11, color: C.muted }}>Click bar for details</Text>
//                                         </div>
//                                         <EChartsReact
//                                             option={hBarOption(clientSummary.sub_services, '#06b6d4', '#0ea5e9')}
//                                             style={{ height: Math.max(140, clientSummary.sub_services.length * 32 + 20) }}
//                                             onEvents={{
//                                                 click: (params) => {
//                                                     const reversed = [...clientSummary.sub_services].reverse();
//                                                     const svc = reversed[params.dataIndex];
//                                                     if (!svc) return;
//                                                     const employees = clientSummary.per_service_employees?.[svc.name] || [];
//                                                     setDrillTitle(svc.name); setDrillData(employees); setDrillType('service'); setDrillVisible(true);
//                                                 },
//                                             }}
//                                         />
//                                     </div>
//                                 </Col>
//                             )}
//                         </Row>

//                         {/* ── Client-modal inline drill panel ── */}
//                         {drillVisible && (
//                             <div style={{
//                                 marginTop: 20,
//                                 background: C.surface,
//                                 borderRadius: 12,
//                                 border: `2px solid ${drillType === 'employee' ? '#6366f1' : '#0ea5e9'}`,
//                                 padding: 20,
//                             }}>
//                                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
//                                     <div>
//                                         <Text style={{ fontWeight: 700, fontSize: 14, color: C.text }}>
//                                             {drillType === 'employee' ? `Services — ${drillTitle}` : `Employees — ${drillTitle}`}
//                                         </Text>
//                                         <Text style={{ fontSize: 12, color: C.muted, display: 'block' }}>
//                                             {drillType === 'employee' ? 'Time by sub-service for this employee' : 'Time by employee for this service'}
//                                         </Text>
//                                     </div>
//                                     <Button size="small" onClick={() => setDrillVisible(false)}>✕ Close</Button>
//                                 </div>
//                                 {drillData.length > 0 ? (
//                                     <Row gutter={[16, 0]}>
//                                         <Col xs={24} xl={12}>
//                                             <EChartsReact
//                                                 option={hBarOption(
//                                                     drillData.map(d => ({ name: d.name, ms: d.ms ?? d.total_hours_ms ?? 0 })),
//                                                     drillType === 'employee' ? '#818cf8' : '#06b6d4',
//                                                     drillType === 'employee' ? '#6366f1' : '#0ea5e9',
//                                                 )}
//                                                 style={{ height: Math.max(140, drillData.length * 32 + 20) }}
//                                             />
//                                         </Col>
//                                         <Col xs={24} xl={12}>
//                                             <Table
//                                                 dataSource={drillData.map(d => ({ ...d, ms: d.ms ?? d.total_hours_ms ?? 0 }))}
//                                                 rowKey="name"
//                                                 size="small"
//                                                 pagination={sharedPagination}
//                                                 columns={[
//                                                     makeIndexCol(),
//                                                     {
//                                                         title: drillType === 'employee' ? 'Sub-service' : 'Employee',
//                                                         dataIndex: 'name', key: 'name',
//                                                         render: v => (
//                                                             <Tooltip title={v} placement="topLeft">
//                                                                 <Text style={{ fontWeight: 500, fontSize: 13, maxWidth: 200, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v || '—'}</Text>
//                                                             </Tooltip>
//                                                         ),
//                                                         sorter: (a, b) => (a.name || '').localeCompare(b.name || ''),
//                                                     },
//                                                     {
//                                                         title: 'Time Spent', dataIndex: 'ms', key: 'ms',
//                                                         align: 'right', width: 120,
//                                                         render: v => (
//                                                             <Text style={{ fontSize: 13, fontWeight: 700, color: drillType === 'employee' ? '#6366f1' : '#0ea5e9' }}>
//                                                                 {formatDurationFromMillis(v)}
//                                                             </Text>
//                                                         ),
//                                                         sorter: (a, b) => (a.ms || 0) - (b.ms || 0),
//                                                         defaultSortOrder: 'descend',
//                                                     },
//                                                 ]}
//                                                 summary={() => (
//                                                     <Table.Summary.Row style={{ background: '#f8fafc' }}>
//                                                         <Table.Summary.Cell index={0} colSpan={2}><Text strong style={{ fontSize: 12 }}>Total</Text></Table.Summary.Cell>
//                                                         <Table.Summary.Cell index={1} align="right">
//                                                             <Text strong style={{ fontSize: 12, color: drillType === 'employee' ? '#6366f1' : '#0ea5e9' }}>
//                                                                 {formatDurationFromMillis(drillData.reduce((s, d) => s + (d.ms ?? d.total_hours_ms ?? 0), 0))}
//                                                             </Text>
//                                                         </Table.Summary.Cell>
//                                                     </Table.Summary.Row>
//                                                 )}
//                                             />
//                                         </Col>
//                                     </Row>
//                                 ) : (
//                                     <div style={{ textAlign: 'center', padding: 32, color: C.muted }}>No breakdown data found</div>
//                                 )}
//                             </div>
//                         )}
//                     </>
//                 ) : (
//                     <div style={{ textAlign: 'center', padding: 40, color: C.muted }}>No data available</div>
//                 )}
//             </Modal>

//             {/* ══ EMPLOYEE DETAIL MODAL ══ */}
//             <Modal
//                 open={empModalVisible}
//                 onCancel={() => { setEmpModalVisible(false); setEmpDrillVisible(false); }}
//                 footer={null} width={960}
//                 styles={{ body: { padding: '24px', background: C.bg } }}
//                 title={
//                     <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
//                         <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.inProgress, fontWeight: 800, fontSize: 16 }}>
//                             {(empModalName || 'E')[0]}
//                         </div>
//                         <div>
//                             <div style={{ fontWeight: 700, color: C.text, fontSize: 15 }}>{empModalName}</div>
//                             <div style={{ fontSize: 12, color: C.muted }}>Client-wise time breakdown · click a bar or row to drill into sub-services</div>
//                         </div>
//                     </div>
//                 }
//             >
//                 {empModalLoading ? (
//                     <div style={{ textAlign: 'center', padding: 60 }}><Spin size="large" /></div>
//                 ) : empModalClients.length > 0 ? (
//                     <>
//                         {/* Mini stat strip */}
//                         <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
//                             {[
//                                 { label: 'Clients Worked On', value: empModalClients.length, color: C.inProgress, bg: '#fef3c7', isText: false },
//                                 { label: 'Total Time',        value: formatDurationFromMillis(empModalClients.reduce((s, r) => s + (r.total_hours_ms || 0), 0)), color: C.toDo, bg: '#ede9fe', isText: true },
//                                 { label: 'Avg per Client',    value: formatDurationFromMillis(empModalClients.length ? Math.round(empModalClients.reduce((s, r) => s + (r.total_hours_ms || 0), 0) / empModalClients.length) : 0), color: C.done, bg: '#d1fae5', isText: true },
//                             ].map(({ label, value, color, bg, isText }) => (
//                                 <Col span={8} key={label}>
//                                     <div style={{ background: bg, borderRadius: 12, padding: '14px 16px', textAlign: 'center' }}>
//                                         {isText
//                                             ? <div style={{ fontSize: 20, fontWeight: 800, color, lineHeight: 1.1 }}>{value}</div>
//                                             : <CountUp end={value} duration={1.2} style={{ fontSize: 28, fontWeight: 800, color, lineHeight: 1 }} />
//                                         }
//                                         <div style={{ fontSize: 11, color: C.muted, marginTop: 4, fontWeight: 600 }}>{label}</div>
//                                     </div>
//                                 </Col>
//                             ))}
//                         </Row>

//                         {/* Chart + Table side by side */}
//                         <Row gutter={[16, 16]}>
//                             <Col xs={24} xl={12}>
//                                 <div style={{ background: C.surface, borderRadius: 12, padding: 16, border: `1px solid ${C.border}`, height: '100%' }}>
//                                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
//                                         <Text style={{ fontWeight: 700, fontSize: 13 }}>Time per Client</Text>
//                                         <Text style={{ fontSize: 11, color: C.muted }}>Click bar for sub-services</Text>
//                                     </div>
//                                     <EChartsReact
//                                         option={hBarOption(
//                                             [...empModalClients]
//                                                 .sort((a, b) => b.total_hours_ms - a.total_hours_ms)
//                                                 .slice(0, 10)
//                                                 .map(r => ({ name: r.client_name, ms: r.total_hours_ms })),
//                                             '#f59e0b', '#fbbf24'
//                                         )}
//                                         style={{ height: Math.max(160, Math.min(empModalClients.length, 10) * 32 + 24) }}
//                                         onEvents={{
//                                             click: (params) => {
//                                                 const sorted   = [...empModalClients].sort((a, b) => b.total_hours_ms - a.total_hours_ms).slice(0, 10);
//                                                 const reversed = [...sorted].reverse();
//                                                 const row = reversed[params.dataIndex];
//                                                 if (!row) return;
//                                                 handleEmpClientBarClick(row);
//                                             },
//                                         }}
//                                     />
//                                 </div>
//                             </Col>

//                             <Col xs={24} xl={12}>
//                                 <Table
//                                     dataSource={[...empModalClients].sort((a, b) => b.total_hours_ms - a.total_hours_ms)}
//                                     rowKey="client_id" size="small"
//                                     columns={empClientCols}
//                                     pagination={sharedPagination}
//                                     scroll={{ x: 'max-content' }}
//                                     onRow={r => ({
//                                         onClick: () => handleEmpClientBarClick(r),
//                                         style: sharedRowStyle,
//                                     })}
//                                     summary={() => (
//                                         <Table.Summary.Row style={{ background: '#f8fafc' }}>
//                                             <Table.Summary.Cell index={0} colSpan={2}><Text strong style={{ fontSize: 12 }}>Grand Total</Text></Table.Summary.Cell>
//                                             <Table.Summary.Cell index={1} align="right">
//                                                 <Text strong style={{ fontSize: 12, color: C.inProgress }}>
//                                                     {formatDurationFromMillis(empModalClients.reduce((s, r) => s + (r.total_hours_ms || 0), 0))}
//                                                 </Text>
//                                             </Table.Summary.Cell>
//                                         </Table.Summary.Row>
//                                     )}
//                                 />
//                                 <Text style={{ fontSize: 11, color: C.muted, display: 'block', marginTop: 8 }}>
//                                     💡 Click any row or chart bar to see sub-service breakdown
//                                 </Text>
//                             </Col>
//                         </Row>

//                         {/* ── Inline sub-service drill panel ── */}
//                         {empDrillVisible && (
//                             <div style={{
//                                 marginTop: 20,
//                                 background: C.surface,
//                                 borderRadius: 12,
//                                 border: `2px solid #f59e0b`,
//                                 padding: 20,
//                             }}>
//                                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
//                                     <div>
//                                         <Text style={{ fontWeight: 700, fontSize: 14, color: C.text }}>
//                                             Sub-services — {empDrillClient?.client_name}
//                                         </Text>
//                                         <Text style={{ fontSize: 12, color: C.muted, display: 'block' }}>
//                                             Time breakdown by description/service for <strong>{empModalName}</strong>
//                                         </Text>
//                                     </div>
//                                     <Button size="small" onClick={() => setEmpDrillVisible(false)}>✕ Close</Button>
//                                 </div>

//                                 {empDrillLoading ? (
//                                     <div style={{ textAlign: 'center', padding: 32 }}><Spin /></div>
//                                 ) : empDrillServices.length > 0 ? (
//                                     <Row gutter={[16, 0]}>
//                                         <Col xs={24} xl={12}>
//                                             <EChartsReact
//                                                 option={hBarOption(
//                                                     empDrillServices.map(s => ({ name: s.name, ms: s.ms })),
//                                                     '#f59e0b', '#fbbf24'
//                                                 )}
//                                                 style={{ height: Math.max(140, empDrillServices.length * 32 + 20) }}
//                                             />
//                                         </Col>
//                                         <Col xs={24} xl={12}>
//                                             <Table
//                                                 dataSource={empDrillServices}
//                                                 rowKey="name"
//                                                 size="small"
//                                                 pagination={sharedPagination}
//                                                 columns={empDrillCols}
//                                                 summary={() => (
//                                                     <Table.Summary.Row style={{ background: '#f8fafc' }}>
//                                                         <Table.Summary.Cell index={0} colSpan={2}><Text strong style={{ fontSize: 12 }}>Total</Text></Table.Summary.Cell>
//                                                         <Table.Summary.Cell index={1} align="right">
//                                                             <Text strong style={{ fontSize: 12, color: '#f59e0b' }}>
//                                                                 {formatDurationFromMillis(empDrillServices.reduce((s, r) => s + (r.ms || 0), 0))}
//                                                             </Text>
//                                                         </Table.Summary.Cell>
//                                                     </Table.Summary.Row>
//                                                 )}
//                                             />
//                                         </Col>
//                                     </Row>
//                                 ) : (
//                                     <div style={{ textAlign: 'center', padding: 32, color: C.muted }}>
//                                         No sub-service entries found for this client
//                                     </div>
//                                 )}
//                             </div>
//                         )}
//                     </>
//                 ) : (
//                     <div style={{ textAlign: 'center', padding: 40, color: C.muted }}>No time entries found</div>
//                 )}
//             </Modal>

//         </div>
//     );
// };

// export default TaskDashboard;


import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
    Col, Row, Typography, message, Table, DatePicker,
    Select, Space, Button, Segmented, Modal, Spin, Progress, Tooltip,
} from 'antd';
import { api } from '../../../services/api';
import EChartsReact from 'echarts-for-react';
import CountUp from 'react-countup';
import {
    ClockCircleOutlined, CheckCircleOutlined,
    MinusCircleOutlined, ExclamationCircleOutlined,
    FilterOutlined, ClearOutlined, ReloadOutlined,
    BarChartOutlined,
} from '@ant-design/icons';
import { FcList } from 'react-icons/fc';
import moment from 'moment';
import { formatDurationFromMillis } from './STT_Records';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

/* ─── Design tokens ─────────────────────────────────────────── */
const C = {
    done:       '#10b981',
    inProgress: '#f59e0b',
    overdue:    '#ef4444',
    toDo:       '#6366f1',
    all:        '#0f172a',
    bg:         '#f1f5f9',
    surface:    '#ffffff',
    border:     '#e2e8f0',
    text:       '#0f172a',
    muted:      '#64748b',
};

const STATUS_META = {
    'Done':        { color: C.done,       light: '#d1fae5' },
    'In Progress': { color: C.inProgress, light: '#fef3c7' },
    'Over Due':    { color: C.overdue,    light: '#fee2e2' },
    'To Do':       { color: C.toDo,       light: '#ede9fe' },
};

/* ══════════════ DASHBOARD LOADER ══════════════ */
const LOADER_LABELS = [
    'Loading analytics…',
    'Fetching task data…',
    'Crunching time logs…',
    'Almost ready…',
];

const loaderStyles = `
@keyframes dlSpin       { to { transform: rotate(360deg); } }
@keyframes dlArcFill    { from { stroke-dashoffset: 160; } to { stroke-dashoffset: 0; } }
@keyframes dlPulse      { 0%,100%{ opacity:1; transform:scale(1); } 50%{ opacity:0.5; transform:scale(0.88); } }
@keyframes dlBarBounce  { 0%,100%{ transform:scaleY(1); opacity:0.7; } 50%{ transform:scaleY(0.35); opacity:0.3; } }
@keyframes dlFadeInOut  { 0%,100%{ opacity:0.4; } 50%{ opacity:1; } }
@keyframes dlOverlayOut { to { opacity:0; visibility:hidden; } }

.dl-overlay {
    position: absolute; inset: 0; z-index: 9999;
    background: #f1f5f9;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    gap: 28px;
    transition: opacity 0.55s ease, visibility 0.55s ease;
    pointer-events: all;
    font-family: "DM Sans","Segoe UI",sans-serif;
}
.dl-overlay.dl-gone { opacity:0; visibility:hidden; pointer-events:none; }

.dl-ring-wrap { position:relative; width:80px; height:80px; }
.dl-ring-wrap svg { width:80px; height:80px; display:block; }

.dl-spin {
    position:absolute; inset:-10px;
    width:100px; height:100px;
    border:2.5px solid transparent;
    border-top-color:#6366f1;
    border-right-color:#6366f133;
    border-radius:50%;
    animation: dlSpin 1.1s linear infinite;
}

.dl-track { fill:none; stroke:#e2e8f0; stroke-width:6; }
.dl-arc {
    fill:none; stroke-width:6; stroke-linecap:round;
    stroke-dashoffset:160;
    animation: dlArcFill 1.8s cubic-bezier(0.4,0,0.2,1) forwards;
}
.dl-arc1 { stroke:#6366f1; animation-delay:0s;   stroke-dasharray:50 210; }
.dl-arc2 { stroke:#10b981; animation-delay:0.18s; stroke-dasharray:50 210; }
.dl-arc3 { stroke:#f59e0b; animation-delay:0.36s; stroke-dasharray:40 220; }
.dl-arc4 { stroke:#ef4444; animation-delay:0.54s; stroke-dasharray:30 230; }

.dl-center {
    position:absolute; inset:0;
    display:flex; align-items:center; justify-content:center;
    font-size:22px; color:#6366f1;
    animation: dlPulse 1.8s ease-in-out infinite;
}

.dl-bars { display:flex; align-items:flex-end; gap:5px; height:32px; }
.dl-bar  { width:5px; border-radius:3px; animation: dlBarBounce 1s ease-in-out infinite; }
.dl-bar:nth-child(1){ background:#6366f1; animation-delay:0s;    height:60%; }
.dl-bar:nth-child(2){ background:#10b981; animation-delay:0.1s;  height:100%; }
.dl-bar:nth-child(3){ background:#f59e0b; animation-delay:0.2s;  height:75%; }
.dl-bar:nth-child(4){ background:#ef4444; animation-delay:0.3s;  height:45%; }
.dl-bar:nth-child(5){ background:#6366f1; animation-delay:0.4s;  height:90%; }
.dl-bar:nth-child(6){ background:#10b981; animation-delay:0.5s;  height:55%; }
.dl-bar:nth-child(7){ background:#f59e0b; animation-delay:0.6s;  height:80%; }

.dl-label {
    font-size:13px; font-weight:600; color:#64748b;
    letter-spacing:0.06em; text-transform:uppercase;
    animation: dlFadeInOut 2s ease-in-out infinite;
}

.dl-dots { display:flex; gap:6px; }
.dl-dot  {
    width:6px; height:6px; border-radius:50%;
    animation: dlBarBounce 0.9s ease-in-out infinite;
}
.dl-dot:nth-child(1){ background:#6366f1; animation-delay:0s; }
.dl-dot:nth-child(2){ background:#10b981; animation-delay:0.15s; }
.dl-dot:nth-child(3){ background:#f59e0b; animation-delay:0.3s; }
`;

const DashboardLoader = ({ visible }) => {
    const [labelIdx, setLabelIdx] = useState(0);

    useEffect(() => {
        if (!visible) return;
        const id = setInterval(
            () => setLabelIdx(i => (i + 1) % LOADER_LABELS.length),
            2000
        );
        return () => clearInterval(id);
    }, [visible]);

    return (
        <>
            <style>{loaderStyles}</style>
            <div className={`dl-overlay${visible ? '' : ' dl-gone'}`}>
                {/* <div className="dl-ring-wrap">
                    <div className="dl-spin" />
                    <svg viewBox="0 0 80 80">
                        <circle className="dl-track" cx="40" cy="40" r="30" />
                        <circle className="dl-arc dl-arc1" cx="40" cy="40" r="30" transform="rotate(-90 40 40)" />
                        <circle className="dl-arc dl-arc2" cx="40" cy="40" r="30" transform="rotate(0 40 40)" />
                        <circle className="dl-arc dl-arc3" cx="40" cy="40" r="30" transform="rotate(90 40 40)" />
                        <circle className="dl-arc dl-arc4" cx="40" cy="40" r="30" transform="rotate(180 40 40)" />
                    </svg>
                    <div className="dl-center">
                        <BarChartOutlined />
                    </div>
                </div> */}

                <div className="dl-bars">
                    {[...Array(7)].map((_, i) => <div key={i} className="dl-bar" />)}
                </div>

                <div className="dl-label">{LOADER_LABELS[labelIdx]}</div>

                <div className="dl-dots">
                    <div className="dl-dot" />
                    <div className="dl-dot" />
                    <div className="dl-dot" />
                </div>
            </div>
        </>
    );
};

/* ─── Stat Card ─────────────────────────────────────────────── */
const StatCard = ({ title, value, color, lightColor, icon, subtitle, onClick, loading }) => (
    <div
        onClick={onClick}
        style={{
            background: C.surface, borderRadius: 16, padding: '20px 22px',
            cursor: 'pointer', border: `1px solid ${C.border}`,
            borderTop: `4px solid ${color}`,
            transition: 'all 0.2s', flex: 1, minWidth: 0,
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)', position: 'relative', overflow: 'hidden',
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = `0 10px 28px ${color}28`; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)'; }}
    >
        <div style={{ position: 'absolute', right: 18, top: 18, width: 44, height: 44, borderRadius: 12, background: lightColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color }}>
            {icon}
        </div>
        <Text style={{ fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: '0.07em', textTransform: 'uppercase' }}>
            {title}
        </Text>
        <div style={{ marginTop: 8 }}>
            {loading
                ? <div style={{ fontSize: 28, fontWeight: 700, color: C.muted }}>—</div>
                : <CountUp end={value} duration={1.6} style={{ fontSize: 34, fontWeight: 800, color, lineHeight: 1 }} />
            }
        </div>
        {subtitle && <Text style={{ fontSize: 11, color: C.muted, marginTop: 6, display: 'block' }}>{subtitle}</Text>}
    </div>
);

/* ─── Section header ────────────────────────────────────────── */
const SectionTitle = ({ children, extra }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Text style={{ fontSize: 14, fontWeight: 700, color: C.text, letterSpacing: '-0.01em' }}>{children}</Text>
        {extra}
    </div>
);

/* ─── Status Badge ──────────────────────────────────────────── */
const StatusBadge = ({ status }) => {
    const meta = STATUS_META[status] || { color: C.muted, light: '#f1f5f9' };
    return (
        <span style={{
            background: meta.light, color: meta.color,
            borderRadius: 20, padding: '2px 10px',
            fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap',
        }}>
            {status}
        </span>
    );
};

/* ─── Chart helpers ─────────────────────────────────────────── */
const pieOption = (data) => ({
    backgroundColor: 'transparent',
    tooltip: {
        trigger: 'item',
        formatter: '{b}: <b>{c}</b> ({d}%)',
        backgroundColor: '#1e293b', borderColor: 'transparent',
        textStyle: { color: '#f1f5f9', fontSize: 13 },
    },
    legend: {
        orient: 'horizontal', bottom: 0, left: 'center',
        textStyle: { color: C.muted, fontSize: 12 },
        itemWidth: 10, itemHeight: 10,
    },
    series: [{
        type: 'pie', radius: ['42%', '70%'], center: ['50%', '44%'],
        avoidLabelOverlap: true,
        itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
        label: { show: true, formatter: '{b}\n{c}', fontSize: 11, color: C.muted, lineHeight: 16 },
        labelLine: { length: 10, length2: 6 },
        data: data.map(d => ({ ...d, itemStyle: { color: STATUS_META[d.name]?.color || '#94a3b8' } })),
        emphasis: { itemStyle: { shadowBlur: 12, shadowColor: 'rgba(0,0,0,0.15)' } },
    }],
});

const barOption = (data, colorStart = '#6366f1', colorEnd = '#818cf8') => ({
    backgroundColor: 'transparent',
    tooltip: {
        trigger: 'axis', axisPointer: { type: 'shadow' },
        backgroundColor: '#1e293b', borderColor: 'transparent',
        textStyle: { color: '#f1f5f9', fontSize: 12 },
        formatter: (params) => {
            const p = params[0];
            const orig = data[p.dataIndex];
            return `<b>${orig?.fullName || p.name}</b><br/>${formatDurationFromMillis(p.value)}`;
        },
    },
    grid: { top: 16, right: 16, bottom: 48, left: 16, containLabel: true },
    xAxis: {
        type: 'category',
        data: data.map(d => d.name.length > 13 ? d.name.slice(0, 12) + '…' : d.name),
        axisLabel: { color: C.muted, fontSize: 11, rotate: data.length > 5 ? 30 : 0, interval: 0 },
        axisLine: { lineStyle: { color: C.border } },
        axisTick: { show: false },
    },
    yAxis: {
        type: 'value',
        axisLabel: { color: C.muted, fontSize: 10, formatter: v => formatDurationFromMillis(v) },
        splitLine: { lineStyle: { color: C.border, type: 'dashed' } },
        axisLine: { show: false }, axisTick: { show: false },
    },
    series: [{
        type: 'bar',
        data: data.map(d => ({
            value: d.ms,
            itemStyle: {
                color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: colorStart }, { offset: 1, color: colorEnd }] },
                borderRadius: [6, 6, 0, 0],
            },
        })),
        barMaxWidth: 48,
        emphasis: {
            itemStyle: {
                color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: colorEnd }, { offset: 1, color: colorStart }] },
            },
        },
    }],
});

const hBarOption = (data, colorStart = '#06b6d4', colorEnd = '#0ea5e9') => {
    const reversed = [...data].reverse();
    return {
        backgroundColor: 'transparent',
        tooltip: {
            trigger: 'axis', axisPointer: { type: 'shadow' },
            backgroundColor: '#1e293b', borderColor: 'transparent',
            textStyle: { color: '#f1f5f9', fontSize: 12 },
            formatter: (params) => `<b>${params[0].name}</b><br/>${formatDurationFromMillis(params[0].value)}`,
        },
        grid: { top: 4, right: 96, bottom: 4, left: 8, containLabel: true },
        xAxis: { type: 'value', show: false, splitLine: { show: false } },
        yAxis: {
            type: 'category',
            data: reversed.map(d => d.name?.length > 18 ? d.name.slice(0, 17) + '…' : d.name || 'N/A'),
            axisLabel: { color: C.muted, fontSize: 11 },
            axisLine: { show: false }, axisTick: { show: false },
        },
        series: [{
            type: 'bar',
            data: reversed.map(d => ({
                value: d.ms || 0,
                itemStyle: {
                    color: { type: 'linear', x: 0, y: 0, x2: 1, y2: 0, colorStops: [{ offset: 0, color: colorStart }, { offset: 1, color: colorEnd }] },
                    borderRadius: [0, 6, 6, 0],
                },
            })),
            barMaxWidth: 18,
            label: {
                show: true, position: 'right',
                formatter: p => formatDurationFromMillis(p.value),
                color: C.muted, fontSize: 10,
            },
        }],
    };
};

/* ─── Shared table column builder ───────────────────────────── */
const makeIndexCol = () => ({
    title: '#',
    render: (_, __, i) => <Text style={{ color: C.muted, fontSize: 12 }}>{i + 1}</Text>,
    width: 44,
});

const makeTimeCol = (colorKey = C.toDo, msField = 'total_hours') => ({
    title: 'Time Spent',
    key: 'time',
    align: 'right',
    width: 120,
    render: (_, r) => (
        <Text style={{ fontSize: 13, fontWeight: 700, color: colorKey }}>
            {formatDurationFromMillis(r[msField])}
        </Text>
    ),
    sorter: (a, b) => (a[msField] || 0) - (b[msField] || 0),
    defaultSortOrder: 'descend',
});

/* ══════════════ MAIN COMPONENT ══════════════ */
const TaskDashboard = () => {
    const navigate = useNavigate();

    const [loading,             setLoading]             = useState(true);
    const [dashboardData,       setDashboardData]       = useState(null);
    const [filteredTasks,       setFilteredTasks]       = useState(null);
    const [filteredTaskList,    setFilteredTaskList]    = useState([]);
    const [statsLoading,        setStatsLoading]        = useState(false);
    const [error,               setError]               = useState(null);
    const [dateRange,           setDateRange]           = useState(null);
    const [clients,             setClients]             = useState([]);
    const [selectedClient,      setSelectedClient]      = useState([]);
    const [teams,               setTeams]               = useState([]);
    const [selectedTeam,        setSelectedTeam]        = useState([]);
    const [clientGroups,        setClientGroups]        = useState([]);
    const [selectedClientGroup, setSelectedClientGroup] = useState([]);
    const [allSpocs,            setAllSpocs]            = useState([]);
    const [subServices,         setSubServices]         = useState([]);
    const [selectedSubService,  setSelectedSubService]  = useState([]);
    const [employees,           setEmployees]           = useState([]);
    const [selectedEmployee,    setSelectedEmployee]    = useState([]);
    const [tableView,           setTableView]           = useState('client');
    const [taskCounts,          setTaskCounts]          = useState({ allTasks: 0, done: 0, toDo: 0, overdue: 0, inProgress: 0 });
    const [filtersOpen,         setFiltersOpen]         = useState(false);
    const [timePerClientData,   setTimePerClientData]   = useState([]);
    const [timePerEmployeeData, setTimePerEmployeeData] = useState([]);

    // Client modal
    const [clientModalVisible,  setClientModalVisible]  = useState(false);
    const [clientModalLoading,  setClientModalLoading]  = useState(false);
    const [selectedClientInfo,  setSelectedClientInfo]  = useState(null);
    const [clientSummary,       setClientSummary]       = useState(null);

    // Employee modal
    const [empModalVisible,     setEmpModalVisible]     = useState(false);
    const [empModalLoading,     setEmpModalLoading]     = useState(false);
    const [empModalName,        setEmpModalName]        = useState('');
    const [empModalClients,     setEmpModalClients]     = useState([]);

    // Employee modal sub-drill
    const [empDrillVisible,     setEmpDrillVisible]     = useState(false);
    const [empDrillClient,      setEmpDrillClient]      = useState(null);
    const [empDrillServices,    setEmpDrillServices]    = useState([]);
    const [empDrillLoading,     setEmpDrillLoading]     = useState(false);

    // Client-modal drill panel
    const [drillVisible,        setDrillVisible]        = useState(false);
    const [drillTitle,          setDrillTitle]          = useState('');
    const [drillData,           setDrillData]           = useState([]);
    const [drillType,           setDrillType]           = useState('');

    const mountedRef = useRef(true);
    useEffect(() => { mountedRef.current = true; return () => { mountedRef.current = false; }; }, []);

    const clientGroupsRef = useRef([]);
    const allSpocsRef     = useRef([]);
    useEffect(() => { clientGroupsRef.current = clientGroups; }, [clientGroups]);
    useEffect(() => { allSpocsRef.current = allSpocs; }, [allSpocs]);

    const getSpocName = useCallback((client) => {
        if (!client) return 'N/A';
        if (client.primary_spoc_name) return client.primary_spoc_name;
        const groups = clientGroupsRef.current;
        const group = groups.find(g => g.clients?.some(cg => (typeof cg === 'object' ? cg.id : cg) === client.id));
        if (group?.primary_spoc_name) return group.primary_spoc_name;
        if (typeof client.primary_spoc === 'number') {
            const spoc = allSpocsRef.current.find(s => s.id === client.primary_spoc);
            if (spoc) return `${spoc.first_name || ''} ${spoc.last_name || ''}`.trim() || spoc.user?.email || 'N/A';
        }
        return 'N/A';
    }, []);

    const getGroupName = useCallback((client) => {
        if (!client) return 'N/A';
        const groups = clientGroupsRef.current;
        const group = groups.find(g => g.clients?.some(cg => (typeof cg === 'object' ? cg.id : cg) === client.id));
        return group?.group_name || 'N/A';
    }, []);

    const buildParams = (filters = {}) => {
        const p = {
            start_date:      filters.startDate?.format('YYYY-MM-DD'),
            end_date:        filters.endDate?.format('YYYY-MM-DD'),
            client_id:       filters.clientId?.length      ? filters.clientId.join(',')       : undefined,
            team_id:         filters.teamId?.length        ? filters.teamId.join(',')         : undefined,
            client_group_id: filters.clientGroupId?.length ? filters.clientGroupId.join(',') : undefined,
            sub_service_id:  filters.subServiceId?.length  ? filters.subServiceId.join(',')  : undefined,
            employee_name:   filters.employeeName?.length  ? filters.employeeName.join(',')  : undefined,
        };
        Object.keys(p).forEach(k => p[k] === undefined && delete p[k]);
        return p;
    };

    /* ── Fetches ── */
    const fetchDashboard = useCallback(async (params) => {
        if (!mountedRef.current) return;
        setLoading(true);
        try {
            const res = await api.get('/clients/tasks/dashboard_summary/', { params });
            if (mountedRef.current) {
                setDashboardData(res.data);
                setFilteredTasks(res.data);
            }
        } catch (err) {
            console.error(err);
            if (mountedRef.current) { setError('Failed to load dashboard data.'); message.error('Failed to load dashboard.'); }
        } finally {
            if (mountedRef.current) setLoading(false);
        }
    }, []);

    const fetchTimePerClient = useCallback(async (params, clientsList) => {
        if (!mountedRef.current) return;
        try {
            const res = await api.get('/clients/tasks/time_per_client/', { params });
            if (!mountedRef.current) return;
            setTimePerClientData((res.data || []).map(row => {
                const c = (clientsList || []).find(x => x.id === row.client_id);
                return {
                    ...row,
                    total_hours: row.total_hours_ms,
                    group_name:  c ? getGroupName(c) : 'N/A',
                    spoc_name:   c ? getSpocName(c) : 'N/A',
                };
            }));
        } catch (err) { console.error('fetchTimePerClient error:', err); }
    }, [getGroupName, getSpocName]);

    const fetchTimePerEmployee = useCallback(async (params) => {
        if (!mountedRef.current) return;
        try {
            const res = await api.get('/clients/tasks/time_per_employee/', { params });
            if (mountedRef.current) setTimePerEmployeeData(res.data || []);
        } catch (err) { console.error('fetchTimePerEmployee error:', err); }
    }, []);

    const fetchFilteredStats = useCallback(async (params) => {
        if (!mountedRef.current) return;
        setStatsLoading(true);
        try {
            const res = await api.get('/clients/tasks/dashboard_summary/', { params });
            if (mountedRef.current) {
                setFilteredTasks(res.data);
                setFilteredTaskList(res.data?.tasks || []);
            }
        } catch (err) { console.error('fetchFilteredStats error:', err); }
        finally { if (mountedRef.current) setStatsLoading(false); }
    }, []);

    /* ── Initial load ── */
    const didInit = useRef(false);
    useEffect(() => {
        if (didInit.current) return;
        didInit.current = true;
        (async () => {
            setLoading(true);
            try {
                const [cR, tR, gR, sR, ssR] = await Promise.all([
                    api.get('/clients/clients/?page_size=500'),
                    api.get('/employee/teams/'),
                    api.get('/clients/client-groups/'),
                    api.get('/employee/employees/'),
                    api.get('/clients/subservices/'),
                ]);
                if (!mountedRef.current) return;
                const cl = cR.data.results || cR.data;
                const gr = gR.data.results || gR.data;
                const sp = sR.data.results || sR.data;
                setClients(cl); setTeams(tR.data.results || tR.data);
                setClientGroups(gr); setAllSpocs(sp); setSubServices(ssR.data.results || ssR.data);
                const empList = sp
                    .filter(u => u.first_name || u.last_name)
                    .map(u => ({
                        id:   `${u.first_name || ''} ${u.last_name || ''}`.trim(),
                        name: `${u.first_name || ''} ${u.last_name || ''}`.trim(),
                    }))
                    .filter(u => u.name)
                    .sort((a, b) => a.name.localeCompare(b.name));
                setEmployees(empList);
                clientGroupsRef.current = gr; allSpocsRef.current = sp;
                await Promise.all([fetchDashboard({}), fetchFilteredStats({}), fetchTimePerClient({}, cl), fetchTimePerEmployee({})]);
            } catch (err) {
                console.error('fetchInitialData error:', err);
                if (mountedRef.current) setError('Failed to load initial data.');
            } finally {
                if (mountedRef.current) setLoading(false);
            }
        })();
    }, [fetchDashboard, fetchFilteredStats, fetchTimePerClient, fetchTimePerEmployee]);

    /* ── Re-fetch on filter change ── */
    const isFirstRender = useRef(true);
    useEffect(() => {
        if (isFirstRender.current) { isFirstRender.current = false; return; }
        const [startDate, endDate] = dateRange || [null, null];
        const f = {
            startDate, endDate,
            clientId:      selectedClient,
            teamId:        selectedTeam,
            clientGroupId: selectedClientGroup,
            subServiceId:  selectedSubService,
            employeeName:  selectedEmployee,
        };
        const p = buildParams(f);
        fetchDashboard(p);
        fetchFilteredStats(p);
        fetchTimePerClient(p, clients);
        fetchTimePerEmployee(p);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dateRange, selectedClient, selectedTeam, selectedClientGroup, selectedSubService, selectedEmployee]);

    /* ── Derive task counts ── */
    useEffect(() => {
        const sc = filteredTasks?.status_counts;
        if (!sc) return;
        setTaskCounts({
            allTasks:   (sc['To Do'] || 0) + (sc['In Progress'] || 0) + (sc['Done'] || 0) + (sc['Over Due'] || 0),
            done:       sc['Done']        || 0,
            toDo:       sc['To Do']       || 0,
            inProgress: sc['In Progress'] || 0,
            overdue:    sc['Over Due']    || 0,
        });
    }, [filteredTasks]);

    /* ── Derived ── */
    const timePerGroup = useMemo(() =>
        timePerClientData.reduce((acc, row) => {
            if (!row.group_name || row.group_name === 'N/A') return acc;
            const ex = acc.find(g => g.client_group_name === row.group_name);
            if (ex) ex.total_hours += row.total_hours;
            else acc.push({ client_group_name: row.group_name, spoc_name: row.spoc_name, total_hours: row.total_hours });
            return acc;
        }, [])
    , [timePerClientData]);

    const pieData      = useMemo(() =>
        filteredTasks?.status_counts
            ? Object.entries(filteredTasks.status_counts).filter(([k, v]) => k !== 'total' && v > 0).map(([name, value]) => ({ name, value }))
            : []
    , [filteredTasks]);

    const topClients   = useMemo(() => [...timePerClientData].sort((a, b) => b.total_hours - a.total_hours).slice(0, 10), [timePerClientData]);
    const topGroups    = useMemo(() => [...timePerGroup].sort((a, b) => b.total_hours - a.total_hours).slice(0, 10), [timePerGroup]);
    const topEmployees = useMemo(() => [...timePerEmployeeData].sort((a, b) => b.total_hours_ms - a.total_hours_ms).slice(0, 10), [timePerEmployeeData]);

    const totalTime      = useMemo(() => timePerClientData.reduce((s, r) => s + (r.total_hours || 0), 0), [timePerClientData]);
    const totalEmpTime   = useMemo(() => timePerEmployeeData.reduce((s, r) => s + (r.total_hours_ms || 0), 0), [timePerEmployeeData]);
    const completionRate = taskCounts.allTasks ? Math.round((taskCounts.done / taskCounts.allTasks) * 100) : 0;

    const activeFilterCount = [selectedClient, selectedTeam, selectedClientGroup, selectedSubService, selectedEmployee]
        .filter(a => Array.isArray(a) && a.length > 0).length + (dateRange ? 1 : 0);

    const grandTotal = tableView === 'employee'
        ? totalEmpTime
        : tableView === 'group'
            ? timePerGroup.reduce((s, r) => s + r.total_hours, 0)
            : totalTime;

    const handleClearFilters = () => {
        setDateRange(null); setSelectedClient([]); setSelectedTeam([]); setSelectedClientGroup([]); setSelectedSubService([]); setSelectedEmployee([]);
    };

    const goToTasks = (status) => {
        const params = new URLSearchParams();
        if (status !== 'all') params.set('status', status);
        const [s, e] = dateRange || [null, null];
        if (s) params.set('start_date', s.format('YYYY-MM-DD'));
        if (e) params.set('end_date',   e.format('YYYY-MM-DD'));
        if (selectedClient?.length)      params.set('client_id',      selectedClient.join(','));
        if (selectedTeam?.length)        params.set('team_id',         selectedTeam.join(','));
        if (selectedClientGroup?.length) params.set('client_group_id', selectedClientGroup.join(','));
        if (selectedSubService?.length)  params.set('sub_service_id',  selectedSubService.join(','));
        navigate(`/stt-records?${params.toString()}`);
    };

    const handleRefresh = useCallback(() => {
        const [startDate, endDate] = dateRange || [null, null];
        const f = {
            startDate, endDate,
            clientId:      selectedClient,
            teamId:        selectedTeam,
            clientGroupId: selectedClientGroup,
            subServiceId:  selectedSubService,
            employeeName:  selectedEmployee,
        };
        const p = buildParams(f);
        fetchDashboard(p); fetchFilteredStats(p); fetchTimePerClient(p, clients); fetchTimePerEmployee(p);
    }, [dateRange, selectedClient, selectedTeam, selectedClientGroup, selectedSubService, selectedEmployee, clients, fetchDashboard, fetchFilteredStats, fetchTimePerClient, fetchTimePerEmployee]);

    /* ── Client modal ── */
    const handleClientClick = useCallback(async (clientId) => {
        const client = clients.find(c => c.id === clientId);
        setSelectedClientInfo(client); setClientSummary(null);
        setDrillVisible(false); setDrillData([]);
        setClientModalVisible(true); setClientModalLoading(true);
        try {
            const [startDate, endDate] = dateRange || [null, null];
            const params = { client_id: clientId };
            if (startDate)                   params.start_date      = startDate.format('YYYY-MM-DD');
            if (endDate)                     params.end_date        = endDate.format('YYYY-MM-DD');
            if (selectedTeam?.length)        params.team_id         = selectedTeam.join(',');
            if (selectedSubService?.length)  params.sub_service_id  = selectedSubService.join(',');
            if (selectedClientGroup?.length) params.client_group_id = selectedClientGroup.join(',');
            const res = await api.get('/clients/tasks/client_task_summary/', { params });
            if (mountedRef.current) setClientSummary(res.data);
        } catch (err) { console.error(err); message.error('Failed to load client details'); }
        finally { if (mountedRef.current) setClientModalLoading(false); }
    }, [clients, dateRange, selectedTeam, selectedSubService, selectedClientGroup]);

    /* ── Employee modal ── */
    const handleEmployeeClick = useCallback(async (employeeName) => {
        setEmpModalName(employeeName);
        setEmpModalClients([]);
        setEmpDrillVisible(false);
        setEmpDrillClient(null);
        setEmpDrillServices([]);
        setEmpModalVisible(true);
        setEmpModalLoading(true);
        try {
            const [startDate, endDate] = dateRange || [null, null];
            const params = { employee_name: employeeName };
            if (startDate)                   params.start_date       = startDate.format('YYYY-MM-DD');
            if (endDate)                     params.end_date         = endDate.format('YYYY-MM-DD');
            if (selectedClient?.length)      params.client_id        = selectedClient.join(',');
            if (selectedTeam?.length)        params.team_id          = selectedTeam.join(',');
            if (selectedSubService?.length)  params.sub_service_id   = selectedSubService.join(',');
            if (selectedClientGroup?.length) params.client_group_id  = selectedClientGroup.join(',');
            const res = await api.get('/clients/tasks/time_per_employee_clients/', { params });
            if (mountedRef.current) setEmpModalClients(res.data || []);
        } catch (err) { console.error(err); message.error('Failed to load employee details'); }
        finally { if (mountedRef.current) setEmpModalLoading(false); }
    }, [dateRange, selectedClient, selectedTeam, selectedSubService, selectedClientGroup]);

    /* ── Employee modal: click a client bar → load sub-services ── */
    const handleEmpClientBarClick = useCallback(async (clientRow) => {
        setEmpDrillClient(clientRow);
        setEmpDrillServices([]);
        setEmpDrillVisible(true);
        setEmpDrillLoading(true);
        try {
            const [startDate, endDate] = dateRange || [null, null];
            const params = { client_id: clientRow.client_id, employee_name: empModalName };
            if (startDate)                   params.start_date      = startDate.format('YYYY-MM-DD');
            if (endDate)                     params.end_date        = endDate.format('YYYY-MM-DD');
            if (selectedTeam?.length)        params.team_id         = selectedTeam.join(',');
            if (selectedSubService?.length)  params.sub_service_id  = selectedSubService.join(',');
            if (selectedClientGroup?.length) params.client_group_id = selectedClientGroup.join(',');
            const res = await api.get('/clients/tasks/client_task_summary/', { params });
            const raw = res.data?.per_employee_services?.[empModalName] || [];
            const svcList = raw.map(s => ({ name: s.name, ms: s.ms ?? s.total_hours_ms ?? 0 })).filter(s => s.ms > 0);
            if (mountedRef.current) setEmpDrillServices(svcList);
        } catch (err) { console.error(err); message.error('Failed to load service breakdown'); }
        finally { if (mountedRef.current) setEmpDrillLoading(false); }
    }, [dateRange, empModalName, selectedTeam, selectedSubService, selectedClientGroup]);

    /* ── Upcoming tasks ── */
    const upcomingTasks = useMemo(() => (filteredTaskList || []).slice(0, 8), [filteredTaskList]);
    const upcomingCols = [
        { title: 'Task ID', dataIndex: 'task_id', key: 'task_id', width: 140, render: v => <Text style={{ fontFamily: 'monospace', fontSize: 11, color: C.muted }}>{v}</Text> },
        { title: 'Client',  dataIndex: 'client_name',      key: 'client_name',      ellipsis: true },
        { title: 'Service', dataIndex: 'sub_service_name',  key: 'sub_service_name', ellipsis: true },
        {
            title: 'Due', dataIndex: 'due_date', key: 'due_date', width: 100,
            render: d => {
                if (!d) return <span style={{ color: C.muted }}>—</span>;
                const m = moment(d); const isLate = m.isBefore(moment(), 'day');
                return <span style={{ color: isLate ? C.overdue : C.muted, fontWeight: isLate ? 600 : 400, fontSize: 12 }}>{m.format('DD MMM YY')}</span>;
            },
        },
        {
            title: 'Status', dataIndex: 'status', key: 'status', width: 120,
            render: (_, r) => {
                const eff = r.due_date && moment(r.due_date).isBefore(moment(), 'day') && r.status !== 'Done' ? 'Over Due' : r.status;
                return <StatusBadge status={eff} />;
            },
        },
    ];

    const sharedRowStyle       = { cursor: 'pointer' };
    const sharedPagination     = { pageSize: 8, size: 'small', showSizeChanger: false };

    /* ── CLIENT table columns ── */
    const clientTableCols = [
        makeIndexCol(),
        {
            title: 'Client', dataIndex: 'client_name', key: 'client_name',
            render: v => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#ede9fe', color: C.toDo, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                        {(v || 'C')[0].toUpperCase()}
                    </div>
                    <Tooltip title={v} placement="topLeft">
                        <Text style={{ fontWeight: 500, fontSize: 13, maxWidth: 130, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v || '—'}</Text>
                    </Tooltip>
                </div>
            ),
            sorter: (a, b) => (a.client_name || '').localeCompare(b.client_name || ''),
        },
        {
            title: 'Group', dataIndex: 'group_name', key: 'group_name', width: 130,
            render: v => v && v !== '—' && v !== 'N/A' ? (
                <Tooltip title={v} placement="topLeft">
                    <span style={{ background: '#f0fdf4', color: C.done, borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 600, maxWidth: 120, display: 'inline-block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>{v}</span>
                </Tooltip>
            ) : <Text style={{ fontSize: 12, color: C.muted }}>—</Text>,
        },
        {
            title: 'SPOC', dataIndex: 'spoc_name', key: 'spoc_name', width: 120,
            render: v => v && v !== '—' && v !== 'N/A' ? (
                <Tooltip title={v} placement="topLeft">
                    <span style={{ background: '#f0f9ff', color: '#0ea5e9', borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 600, maxWidth: 110, display: 'inline-block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>{v}</span>
                </Tooltip>
            ) : <Text style={{ fontSize: 12, color: C.muted }}>—</Text>,
        },
        makeTimeCol(C.toDo, 'total_hours'),
    ];

    /* ── GROUP table columns ── */
    const groupTableCols = [
        makeIndexCol(),
        {
            title: 'Client Group', dataIndex: 'client_group_name', key: 'client_group_name',
            render: v => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#f0fdf4', color: C.done, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                        {(v || 'G')[0].toUpperCase()}
                    </div>
                    <Tooltip title={v} placement="topLeft">
                        <Text style={{ fontWeight: 500, fontSize: 13, maxWidth: 150, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v || '—'}</Text>
                    </Tooltip>
                </div>
            ),
            sorter: (a, b) => (a.client_group_name || '').localeCompare(b.client_group_name || ''),
        },
        {
            title: 'SPOC', dataIndex: 'spoc_name', key: 'spoc_name', width: 140,
            render: v => v && v !== '—' && v !== 'N/A' ? (
                <Tooltip title={v} placement="topLeft">
                    <span style={{ background: '#f0f9ff', color: '#0ea5e9', borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 600, maxWidth: 130, display: 'inline-block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>{v}</span>
                </Tooltip>
            ) : <Text style={{ fontSize: 12, color: C.muted }}>—</Text>,
        },
        makeTimeCol(C.toDo, 'total_hours'),
    ];

    /* ── EMPLOYEE table columns ── */
    const employeeTableCols = [
        makeIndexCol(),
        {
            title: 'Employee', dataIndex: 'name', key: 'name',
            render: v => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#fef3c7', color: C.inProgress, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                        {(v || 'N')[0]}
                    </div>
                    <Text style={{ fontWeight: 500, fontSize: 13 }}>{v || 'N/A'}</Text>
                </div>
            ),
            sorter: (a, b) => (a.name || '').localeCompare(b.name || ''),
        },
        {
            title: 'Team', dataIndex: 'team_name', key: 'team_name', width: 130,
            render: v => (
                <Tooltip title={v} placement="topLeft">
                    <Text style={{ fontSize: 12, color: C.muted, maxWidth: 120, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v || '—'}</Text>
                </Tooltip>
            ),
        },
        makeTimeCol(C.inProgress, 'total_hours_ms'),
    ];

    /* ── Employee modal: client breakdown columns ── */
    const empClientCols = [
        makeIndexCol(),
        {
            title: 'Client', dataIndex: 'client_name', key: 'client_name',
            render: v => (
                <Tooltip title={v} placement="topLeft">
                    <Text style={{ fontWeight: 500, fontSize: 13, maxWidth: 200, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v || '—'}</Text>
                </Tooltip>
            ),
            sorter: (a, b) => (a.client_name || '').localeCompare(b.client_name || ''),
        },
        makeTimeCol(C.inProgress, 'total_hours_ms'),
    ];

    /* ── Sub-service drill table columns ── */
    const empDrillCols = [
        makeIndexCol(),
        {
            title: 'Sub-service / Description', dataIndex: 'name', key: 'name',
            render: v => (
                <Tooltip title={v} placement="topLeft">
                    <Text style={{ fontWeight: 500, fontSize: 13, maxWidth: 220, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v || '—'}</Text>
                </Tooltip>
            ),
            sorter: (a, b) => (a.name || '').localeCompare(b.name || ''),
        },
        {
            title: 'Time Spent', dataIndex: 'ms', key: 'ms', align: 'right', width: 120,
            render: v => <Text style={{ fontSize: 13, fontWeight: 700, color: '#f59e0b' }}>{formatDurationFromMillis(v)}</Text>,
            sorter: (a, b) => (a.ms || 0) - (b.ms || 0),
            defaultSortOrder: 'descend',
        },
    ];

    /* ── Error state ── */
    if (error && !dashboardData) {
        return (
            <div style={{ padding: 60, textAlign: 'center', background: C.bg, minHeight: '100vh' }}>
                <Text style={{ color: C.overdue, fontSize: 16 }}>{error}</Text><br />
                <Button style={{ marginTop: 16 }} onClick={() => { didInit.current = false; }} icon={<ReloadOutlined />}>Retry</Button>
            </div>
        );
    }

    /* ══════════════ RENDER ══════════════ */
    return (
        <div style={{ position: 'relative', background: C.bg, minHeight: '100vh', padding: '24px 28px', fontFamily: '"DM Sans", "Segoe UI", sans-serif' }}>

            {/* ══ FANCY LOADER — covers entire page on initial load ══ */}
            <DashboardLoader visible={loading} />

            {/* ── Header ── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                <div>
                    <Title level={3} style={{ margin: 0, color: C.text, fontWeight: 800, letterSpacing: '-0.03em' }}>Task Analytics</Title>
                    <Text style={{ color: C.muted, fontSize: 13 }}>{moment().format('dddd, D MMMM YYYY')} · Real-time overview</Text>
                </div>
                <Space>
                    <Button icon={<ReloadOutlined />} onClick={handleRefresh} loading={loading}>Refresh</Button>
                    <Button type="primary" onClick={() => navigate('/stt-records')} style={{ background: C.toDo, borderColor: C.toDo }}>All Tasks →</Button>
                </Space>
            </div>

            {/* ── Filters ── */}
            <div style={{ background: C.surface, borderRadius: 16, border: `1px solid ${C.border}`, marginBottom: 24, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                <div
                    onClick={() => setFiltersOpen(v => !v)}
                    style={{ padding: '13px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', borderBottom: filtersOpen ? `1px solid ${C.border}` : 'none', background: filtersOpen ? '#fafbff' : C.surface, transition: 'background 0.2s' }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 30, height: 30, borderRadius: 8, background: activeFilterCount > 0 ? '#ede9fe' : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <FilterOutlined style={{ color: activeFilterCount > 0 ? C.toDo : C.muted, fontSize: 13 }} />
                        </div>
                        <div>
                            <Text style={{ fontWeight: 700, color: C.text, fontSize: 13 }}>Filters</Text>
                            {activeFilterCount > 0
                                ? <Text style={{ fontSize: 11, color: C.muted, marginLeft: 8 }}>{activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''} active</Text>
                                : <Text style={{ fontSize: 11, color: C.muted, marginLeft: 8 }}>No filters applied</Text>
                            }
                        </div>
                        {activeFilterCount > 0 && (
                            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginLeft: 4 }}>
                                {dateRange && (
                                    <span style={{ background: '#ede9fe', color: C.toDo, borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 600 }}>
                                        {dateRange[0]?.format('DD MMM')} – {dateRange[1]?.format('DD MMM YY')}
                                    </span>
                                )}
                                {selectedClientGroup.length > 0 && <span style={{ background: '#f0fdf4', color: C.done, borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 600 }}>{selectedClientGroup.length} group{selectedClientGroup.length > 1 ? 's' : ''}</span>}
                                {selectedClient.length > 0 && <span style={{ background: '#ede9fe', color: C.toDo, borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 600 }}>{selectedClient.length} client{selectedClient.length > 1 ? 's' : ''}</span>}
                                {selectedTeam.length > 0 && <span style={{ background: '#f0f9ff', color: '#0ea5e9', borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 600 }}>{selectedTeam.length} team{selectedTeam.length > 1 ? 's' : ''}</span>}
                                {selectedSubService.length > 0 && <span style={{ background: '#fff7ed', color: '#f97316', borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 600 }}>{selectedSubService.length} service{selectedSubService.length > 1 ? 's' : ''}</span>}
                                {selectedEmployee.length > 0 && <span style={{ background: '#fef3c7', color: C.inProgress, borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 600 }}>{selectedEmployee.length} employee{selectedEmployee.length > 1 ? 's' : ''}</span>}
                            </div>
                        )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {activeFilterCount > 0 && (
                            <div
                                onClick={e => { e.stopPropagation(); handleClearFilters(); }}
                                style={{ display: 'flex', alignItems: 'center', gap: 4, color: C.overdue, fontSize: 12, fontWeight: 600, cursor: 'pointer', padding: '4px 10px', borderRadius: 6, background: '#fff1f2', border: '1px solid #fecdd3' }}
                            >
                                <ClearOutlined style={{ fontSize: 11 }} /> Clear all
                            </div>
                        )}
                        <div style={{ color: C.muted, fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                            {filtersOpen ? <><span style={{ fontSize: 10 }}>▲</span> Hide</> : <><span style={{ fontSize: 10 }}>▼</span> Show</>}
                        </div>
                    </div>
                </div>

                {filtersOpen && (
                    <div style={{ padding: '20px 20px 16px' }}>
                        <Row gutter={[14, 14]}>
                            <Col xs={24} sm={12} md={8} lg={6}>
                                <div style={{ marginBottom: 5 }}><Text style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Date Range</Text></div>
                                <RangePicker style={{ width: '100%' }} value={dateRange} onChange={setDateRange} size="middle" format="DD MMM YYYY" placeholder={['From date', 'To date']} allowClear />
                            </Col>
                            <Col xs={24} sm={12} md={8} lg={6}>
                                <div style={{ marginBottom: 5 }}><Text style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Client Group</Text></div>
                                <Select mode="multiple" allowClear showSearch placeholder="All groups" value={selectedClientGroup} onChange={setSelectedClientGroup} style={{ width: '100%' }} size="middle" maxTagCount={2} maxTagPlaceholder={o => `+${o.length} more`} filterOption={(inp, opt) => (opt?.children ?? '').toLowerCase().includes(inp.toLowerCase())} optionFilterProp="children">
                                    {clientGroups.map(i => <Option key={i.id} value={i.id}>{i.group_name}</Option>)}
                                </Select>
                            </Col>
                            <Col xs={24} sm={12} md={8} lg={6}>
                                <div style={{ marginBottom: 5 }}><Text style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Client</Text></div>
                                <Select mode="multiple" allowClear showSearch placeholder="All clients" value={selectedClient} onChange={setSelectedClient} style={{ width: '100%' }} size="middle" maxTagCount={2} maxTagPlaceholder={o => `+${o.length} more`} filterOption={(inp, opt) => (opt?.children ?? '').toLowerCase().includes(inp.toLowerCase())} optionFilterProp="children">
                                    {clients.map(i => <Option key={i.id} value={i.id}>{i.name}</Option>)}
                                </Select>
                            </Col>
                            <Col xs={24} sm={12} md={8} lg={6}>
                                <div style={{ marginBottom: 5 }}><Text style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Team</Text></div>
                                <Select mode="multiple" allowClear showSearch placeholder="All teams" value={selectedTeam} onChange={setSelectedTeam} style={{ width: '100%' }} size="middle" maxTagCount={2} maxTagPlaceholder={o => `+${o.length} more`} filterOption={(inp, opt) => (opt?.children ?? '').toLowerCase().includes(inp.toLowerCase())} optionFilterProp="children">
                                    {teams.map(i => <Option key={i.id} value={i.id}>{i.name}</Option>)}
                                </Select>
                            </Col>
                            <Col xs={24} sm={12} md={8} lg={6}>
                                <div style={{ marginBottom: 5 }}><Text style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Sub Service</Text></div>
                                <Select mode="multiple" allowClear showSearch placeholder="All services" value={selectedSubService} onChange={setSelectedSubService} style={{ width: '100%' }} size="middle" maxTagCount={2} maxTagPlaceholder={o => `+${o.length} more`} filterOption={(inp, opt) => (opt?.children ?? '').toLowerCase().includes(inp.toLowerCase())} optionFilterProp="children">
                                    {subServices.map(i => <Option key={i.id} value={i.id}>{i.name}</Option>)}
                                </Select>
                            </Col>
                            <Col xs={24} sm={12} md={8} lg={6}>
                                <div style={{ marginBottom: 5 }}><Text style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Employee</Text></div>
                                <Select mode="multiple" allowClear showSearch placeholder="All employees" value={selectedEmployee} onChange={setSelectedEmployee} style={{ width: '100%' }} size="middle" maxTagCount={2} maxTagPlaceholder={o => `+${o.length} more`} filterOption={(inp, opt) => (opt?.children ?? '').toLowerCase().includes(inp.toLowerCase())} optionFilterProp="children">
                                    {employees.map(i => <Option key={i.id} value={i.id}>{i.name}</Option>)}
                                </Select>
                            </Col>
                        </Row>
                    </div>
                )}
            </div>

            {/* ── KPI Cards ── */}
            <Row gutter={[14, 14]} style={{ marginBottom: 20, flexWrap: 'nowrap' }}>
                {[
                    { title: 'Total Tasks',  value: taskCounts.allTasks,   color: C.all,        lightColor: '#f1f5f9', icon: <FcList />,                  subtitle: 'Across all statuses',           status: 'all'         },
                    { title: 'To Do',        value: taskCounts.toDo,       color: C.toDo,       lightColor: '#ede9fe', icon: <ClockCircleOutlined />,       subtitle: 'Pending start',                 status: 'To Do'       },
                    { title: 'In Progress',  value: taskCounts.inProgress, color: C.inProgress, lightColor: '#fef3c7', icon: <MinusCircleOutlined />,       subtitle: 'Being worked on',               status: 'In Progress' },
                    { title: 'Done',         value: taskCounts.done,       color: C.done,       lightColor: '#d1fae5', icon: <CheckCircleOutlined />,       subtitle: `${completionRate}% completion`, status: 'Done'        },
                    { title: 'Overdue',      value: taskCounts.overdue,    color: C.overdue,    lightColor: '#fee2e2', icon: <ExclamationCircleOutlined />, subtitle: 'Need attention',                status: 'Over Due'    },
                ].map((card) => (
                    <Col key={card.title} style={{ flex: '1 1 0', minWidth: 0, display: 'flex' }}>
                        <StatCard {...card} loading={statsLoading} onClick={() => goToTasks(card.status)} />
                    </Col>
                ))}
            </Row>

            {/* ── Overall progress bar ── */}
            {taskCounts.allTasks > 0 && (
                <div style={{ background: C.surface, borderRadius: 14, padding: '16px 24px', marginBottom: 20, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
                    <Text style={{ fontWeight: 600, color: C.text, whiteSpace: 'nowrap', fontSize: 13 }}>Overall Progress</Text>
                    <div style={{ flex: 1, minWidth: 120 }}>
                        <Progress percent={completionRate} strokeColor={{ '0%': C.toDo, '100%': C.done }} trailColor="#e2e8f0" strokeWidth={10} showInfo={false} />
                    </div>
                    <div style={{ display: 'flex', gap: 24, flexShrink: 0 }}>
                        {[
                            { label: 'Done',     val: taskCounts.done,                         color: C.done       },
                            { label: 'Active',   val: taskCounts.toDo + taskCounts.inProgress, color: C.inProgress },
                            { label: 'Overdue',  val: taskCounts.overdue,                      color: C.overdue    },
                            { label: 'Complete', val: `${completionRate}%`,                    color: C.text       },
                        ].map(({ label, val, color }) => (
                            <div key={label} style={{ textAlign: 'center' }}>
                                <div style={{ fontWeight: 700, color, fontSize: 16, lineHeight: 1 }}>{val}</div>
                                <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ── Pie + Upcoming ── */}
            <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                <Col xs={24} lg={9}>
                    <div style={{ background: C.surface, borderRadius: 14, padding: '20px 20px 12px', border: `1px solid ${C.border}`, height: '100%' }}>
                        <SectionTitle>Status Distribution</SectionTitle>
                        {statsLoading
                            ? <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Spin /></div>
                            : pieData.length > 0
                                ? <EChartsReact option={pieOption(pieData)} style={{ height: 300 }} />
                                : <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.muted }}>No data</div>
                        }
                    </div>
                </Col>
                <Col xs={24} lg={15}>
                    <div style={{ background: C.surface, borderRadius: 14, padding: '20px', border: `1px solid ${C.border}`, height: '100%' }}>
                        <SectionTitle extra={<Button size="small" type="link" onClick={() => goToTasks('all')} style={{ color: C.toDo, padding: 0 }}>View all →</Button>}>
                            Upcoming &amp; Recent Tasks
                        </SectionTitle>
                        <Table
                            dataSource={upcomingTasks} columns={upcomingCols} rowKey="id" size="small"
                            pagination={false} loading={statsLoading} scroll={{ x: 'max-content' }}
                            onRow={r => ({ onClick: () => goToTasks(r.status), style: sharedRowStyle })}
                            locale={{ emptyText: <div style={{ padding: 32, color: C.muted }}>No tasks found 🎉</div> }}
                        />
                    </div>
                </Col>
            </Row>

            {/* ── Time Spent ── */}
            <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                <Col xs={24}>
                    <div style={{ background: C.surface, borderRadius: 14, padding: '20px', border: `1px solid ${C.border}` }}>
                        <SectionTitle
                            extra={
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <Text style={{ fontSize: 13, color: C.muted }}>
                                        Total: <strong style={{ color: tableView === 'employee' ? C.inProgress : C.toDo }}>{formatDurationFromMillis(grandTotal)}</strong>
                                    </Text>
                                    <Segmented
                                        size="small"
                                        options={['By Client', 'By Group', 'By Employee']}
                                        value={tableView === 'client' ? 'By Client' : tableView === 'group' ? 'By Group' : 'By Employee'}
                                        onChange={v => setTableView(v === 'By Client' ? 'client' : v === 'By Group' ? 'group' : 'employee')}
                                    />
                                </div>
                            }
                        >
                            Total Time Spent
                        </SectionTitle>

                        {/* ─ By Client ─ */}
                        {tableView === 'client' && (
                            timePerClientData.length > 0 ? (
                                <Row gutter={[16, 16]}>
                                    <Col xs={24} xl={12}>
                                        <Text style={{ fontSize: 12, color: C.muted, display: 'block', marginBottom: 8 }}>Top {topClients.length} clients by time logged</Text>
                                        <EChartsReact option={barOption(topClients.map(r => ({ name: r.client_name, fullName: r.client_name, ms: r.total_hours })))} style={{ height: 280 }} />
                                    </Col>
                                    <Col xs={24} xl={12}>
                                        <Table
                                            dataSource={timePerClientData} rowKey="client_id" size="small"
                                            columns={clientTableCols} pagination={sharedPagination} scroll={{ x: 'max-content' }}
                                            onRow={r => ({ onClick: () => handleClientClick(r.client_id), style: sharedRowStyle })}
                                            summary={() => (
                                                <Table.Summary.Row style={{ background: '#f8fafc' }}>
                                                    <Table.Summary.Cell index={0} colSpan={4}><Text strong style={{ fontSize: 12 }}>Grand Total</Text></Table.Summary.Cell>
                                                    <Table.Summary.Cell index={1} align="right"><Text strong style={{ fontSize: 12, color: C.toDo }}>{formatDurationFromMillis(totalTime)}</Text></Table.Summary.Cell>
                                                </Table.Summary.Row>
                                            )}
                                        />
                                    </Col>
                                </Row>
                            ) : (
                                <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.muted }}><Spin /></div>
                            )
                        )}

                        {/* ─ By Group ─ */}
                        {tableView === 'group' && (
                            timePerGroup.length > 0 ? (
                                <Row gutter={[16, 16]}>
                                    <Col xs={24} xl={12}>
                                        <Text style={{ fontSize: 12, color: C.muted, display: 'block', marginBottom: 8 }}>Top {topGroups.length} groups by time logged</Text>
                                        <EChartsReact option={barOption(topGroups.map(r => ({ name: r.client_group_name, fullName: r.client_group_name, ms: r.total_hours })))} style={{ height: 280 }} />
                                    </Col>
                                    <Col xs={24} xl={12}>
                                        <Table
                                            dataSource={timePerGroup} rowKey="client_group_name" size="small"
                                            columns={groupTableCols} pagination={sharedPagination} scroll={{ x: 'max-content' }}
                                            summary={() => (
                                                <Table.Summary.Row style={{ background: '#f8fafc' }}>
                                                    <Table.Summary.Cell index={0} colSpan={3}><Text strong style={{ fontSize: 12 }}>Grand Total</Text></Table.Summary.Cell>
                                                    <Table.Summary.Cell index={1} align="right"><Text strong style={{ fontSize: 12, color: C.toDo }}>{formatDurationFromMillis(timePerGroup.reduce((s, r) => s + r.total_hours, 0))}</Text></Table.Summary.Cell>
                                                </Table.Summary.Row>
                                            )}
                                        />
                                    </Col>
                                </Row>
                            ) : (
                                <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.muted }}><Spin /></div>
                            )
                        )}

                        {/* ─ By Employee ─ */}
                        {tableView === 'employee' && (
                            timePerEmployeeData.length > 0 ? (
                                <Row gutter={[16, 16]}>
                                    <Col xs={24} xl={12}>
                                        <Text style={{ fontSize: 12, color: C.muted, display: 'block', marginBottom: 8 }}>Top {topEmployees.length} employees by time logged</Text>
                                        <EChartsReact option={barOption(topEmployees.map(r => ({ name: r.name, fullName: r.name, ms: r.total_hours_ms })), '#f59e0b', '#fbbf24')} style={{ height: 280 }} />
                                    </Col>
                                    <Col xs={24} xl={12}>
                                        <Table
                                            dataSource={timePerEmployeeData} rowKey="name" size="small"
                                            columns={employeeTableCols} pagination={sharedPagination} scroll={{ x: 'max-content' }}
                                            onRow={r => ({ onClick: () => handleEmployeeClick(r.name), style: sharedRowStyle })}
                                            summary={() => (
                                                <Table.Summary.Row style={{ background: '#f8fafc' }}>
                                                    <Table.Summary.Cell index={0} colSpan={3}><Text strong style={{ fontSize: 12 }}>Grand Total</Text></Table.Summary.Cell>
                                                    <Table.Summary.Cell index={1} align="right"><Text strong style={{ fontSize: 12, color: C.inProgress }}>{formatDurationFromMillis(totalEmpTime)}</Text></Table.Summary.Cell>
                                                </Table.Summary.Row>
                                            )}
                                        />
                                    </Col>
                                </Row>
                            ) : (
                                <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.muted }}><Spin /></div>
                            )
                        )}
                    </div>
                </Col>
            </Row>

            {/* ══ CLIENT DETAIL MODAL ══ */}
            <Modal
                open={clientModalVisible}
                onCancel={() => { setClientModalVisible(false); setDrillVisible(false); }}
                footer={null} width={900}
                styles={{ body: { padding: '24px', background: C.bg } }}
                title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 38, height: 38, borderRadius: 10, background: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.toDo, fontWeight: 800, fontSize: 16 }}>
                            {(selectedClientInfo?.name || 'C')[0]}
                        </div>
                        <div>
                            <div style={{ fontWeight: 700, color: C.text, fontSize: 15 }}>{selectedClientInfo?.name || 'Client'}</div>
                            <div style={{ fontSize: 12, color: C.muted }}>{getGroupName(selectedClientInfo)} · {getSpocName(selectedClientInfo)}</div>
                        </div>
                    </div>
                }
            >
                {clientModalLoading ? (
                    <div style={{ textAlign: 'center', padding: 60 }}><Spin size="large" /></div>
                ) : clientSummary ? (
                    <>
                        <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
                            {[
                                { label: 'Done Tasks',  value: clientSummary.done_count,                              color: C.done,       bg: '#d1fae5', isText: false },
                                { label: 'Total Time',  value: formatDurationFromMillis(clientSummary.total_hours_ms), color: C.toDo,       bg: '#ede9fe', isText: true  },
                                { label: 'Employees',   value: clientSummary.employees?.length || 0,                  color: C.inProgress, bg: '#fef3c7', isText: false },
                                { label: 'Services',    value: clientSummary.sub_services?.length || 0,               color: '#0ea5e9',    bg: '#e0f2fe', isText: false },
                            ].map(({ label, value, color, bg, isText }) => (
                                <Col span={6} key={label}>
                                    <div style={{ background: bg, borderRadius: 12, padding: '14px 16px', textAlign: 'center' }}>
                                        {isText
                                            ? <div style={{ fontSize: 20, fontWeight: 800, color, lineHeight: 1.1 }}>{value}</div>
                                            : <CountUp end={value} duration={1.2} style={{ fontSize: 28, fontWeight: 800, color, lineHeight: 1 }} />
                                        }
                                        <div style={{ fontSize: 11, color: C.muted, marginTop: 4, fontWeight: 600 }}>{label}</div>
                                    </div>
                                </Col>
                            ))}
                        </Row>
                        <Row gutter={[12, 12]}>
                            {clientSummary.employees?.length > 0 && (
                                <Col xs={24} md={clientSummary.sub_services?.length > 0 ? 12 : 24}>
                                    <div style={{ background: C.surface, borderRadius: 12, padding: 16, border: `1px solid ${C.border}` }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                                            <Text style={{ fontWeight: 700, fontSize: 13 }}>Employee Hours</Text>
                                            <Text style={{ fontSize: 11, color: C.muted }}>Click bar for details</Text>
                                        </div>
                                        <EChartsReact
                                            option={hBarOption(clientSummary.employees, '#818cf8', '#6366f1')}
                                            style={{ height: Math.max(140, clientSummary.employees.length * 32 + 20) }}
                                            onEvents={{
                                                click: (params) => {
                                                    const reversed = [...clientSummary.employees].reverse();
                                                    const emp = reversed[params.dataIndex];
                                                    if (!emp) return;
                                                    const services = clientSummary.per_employee_services?.[emp.name] || [];
                                                    setDrillTitle(emp.name); setDrillData(services); setDrillType('employee'); setDrillVisible(true);
                                                },
                                            }}
                                        />
                                    </div>
                                </Col>
                            )}
                            {clientSummary.sub_services?.length > 0 && (
                                <Col xs={24} md={clientSummary.employees?.length > 0 ? 12 : 24}>
                                    <div style={{ background: C.surface, borderRadius: 12, padding: 16, border: `1px solid ${C.border}` }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                                            <Text style={{ fontWeight: 700, fontSize: 13 }}>Service Breakdown</Text>
                                            <Text style={{ fontSize: 11, color: C.muted }}>Click bar for details</Text>
                                        </div>
                                        <EChartsReact
                                            option={hBarOption(clientSummary.sub_services, '#06b6d4', '#0ea5e9')}
                                            style={{ height: Math.max(140, clientSummary.sub_services.length * 32 + 20) }}
                                            onEvents={{
                                                click: (params) => {
                                                    const reversed = [...clientSummary.sub_services].reverse();
                                                    const svc = reversed[params.dataIndex];
                                                    if (!svc) return;
                                                    const employees = clientSummary.per_service_employees?.[svc.name] || [];
                                                    setDrillTitle(svc.name); setDrillData(employees); setDrillType('service'); setDrillVisible(true);
                                                },
                                            }}
                                        />
                                    </div>
                                </Col>
                            )}
                        </Row>

                        {drillVisible && (
                            <div style={{ marginTop: 20, background: C.surface, borderRadius: 12, border: `2px solid ${drillType === 'employee' ? '#6366f1' : '#0ea5e9'}`, padding: 20 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                                    <div>
                                        <Text style={{ fontWeight: 700, fontSize: 14, color: C.text }}>
                                            {drillType === 'employee' ? `Services — ${drillTitle}` : `Employees — ${drillTitle}`}
                                        </Text>
                                        <Text style={{ fontSize: 12, color: C.muted, display: 'block' }}>
                                            {drillType === 'employee' ? 'Time by sub-service for this employee' : 'Time by employee for this service'}
                                        </Text>
                                    </div>
                                    <Button size="small" onClick={() => setDrillVisible(false)}>✕ Close</Button>
                                </div>
                                {drillData.length > 0 ? (
                                    <Row gutter={[16, 0]}>
                                        <Col xs={24} xl={12}>
                                            <EChartsReact
                                                option={hBarOption(drillData.map(d => ({ name: d.name, ms: d.ms ?? d.total_hours_ms ?? 0 })), drillType === 'employee' ? '#818cf8' : '#06b6d4', drillType === 'employee' ? '#6366f1' : '#0ea5e9')}
                                                style={{ height: Math.max(140, drillData.length * 32 + 20) }}
                                            />
                                        </Col>
                                        <Col xs={24} xl={12}>
                                            <Table
                                                dataSource={drillData.map(d => ({ ...d, ms: d.ms ?? d.total_hours_ms ?? 0 }))}
                                                rowKey="name" size="small" pagination={sharedPagination}
                                                columns={[
                                                    makeIndexCol(),
                                                    {
                                                        title: drillType === 'employee' ? 'Sub-service' : 'Employee',
                                                        dataIndex: 'name', key: 'name',
                                                        render: v => <Tooltip title={v} placement="topLeft"><Text style={{ fontWeight: 500, fontSize: 13, maxWidth: 200, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v || '—'}</Text></Tooltip>,
                                                        sorter: (a, b) => (a.name || '').localeCompare(b.name || ''),
                                                    },
                                                    {
                                                        title: 'Time Spent', dataIndex: 'ms', key: 'ms', align: 'right', width: 120,
                                                        render: v => <Text style={{ fontSize: 13, fontWeight: 700, color: drillType === 'employee' ? '#6366f1' : '#0ea5e9' }}>{formatDurationFromMillis(v)}</Text>,
                                                        sorter: (a, b) => (a.ms || 0) - (b.ms || 0),
                                                        defaultSortOrder: 'descend',
                                                    },
                                                ]}
                                                summary={() => (
                                                    <Table.Summary.Row style={{ background: '#f8fafc' }}>
                                                        <Table.Summary.Cell index={0} colSpan={2}><Text strong style={{ fontSize: 12 }}>Total</Text></Table.Summary.Cell>
                                                        <Table.Summary.Cell index={1} align="right">
                                                            <Text strong style={{ fontSize: 12, color: drillType === 'employee' ? '#6366f1' : '#0ea5e9' }}>
                                                                {formatDurationFromMillis(drillData.reduce((s, d) => s + (d.ms ?? d.total_hours_ms ?? 0), 0))}
                                                            </Text>
                                                        </Table.Summary.Cell>
                                                    </Table.Summary.Row>
                                                )}
                                            />
                                        </Col>
                                    </Row>
                                ) : (
                                    <div style={{ textAlign: 'center', padding: 32, color: C.muted }}>No breakdown data found</div>
                                )}
                            </div>
                        )}
                    </>
                ) : (
                    <div style={{ textAlign: 'center', padding: 40, color: C.muted }}>No data available</div>
                )}
            </Modal>

            {/* ══ EMPLOYEE DETAIL MODAL ══ */}
            <Modal
                open={empModalVisible}
                onCancel={() => { setEmpModalVisible(false); setEmpDrillVisible(false); }}
                footer={null} width={960}
                styles={{ body: { padding: '24px', background: C.bg } }}
                title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.inProgress, fontWeight: 800, fontSize: 16 }}>
                            {(empModalName || 'E')[0]}
                        </div>
                        <div>
                            <div style={{ fontWeight: 700, color: C.text, fontSize: 15 }}>{empModalName}</div>
                            <div style={{ fontSize: 12, color: C.muted }}>Client-wise time breakdown · click a bar or row to drill into sub-services</div>
                        </div>
                    </div>
                }
            >
                {empModalLoading ? (
                    <div style={{ textAlign: 'center', padding: 60 }}><Spin size="large" /></div>
                ) : empModalClients.length > 0 ? (
                    <>
                        <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
                            {[
                                { label: 'Clients Worked On', value: empModalClients.length, color: C.inProgress, bg: '#fef3c7', isText: false },
                                { label: 'Total Time',        value: formatDurationFromMillis(empModalClients.reduce((s, r) => s + (r.total_hours_ms || 0), 0)), color: C.toDo, bg: '#ede9fe', isText: true },
                                { label: 'Avg per Client',    value: formatDurationFromMillis(empModalClients.length ? Math.round(empModalClients.reduce((s, r) => s + (r.total_hours_ms || 0), 0) / empModalClients.length) : 0), color: C.done, bg: '#d1fae5', isText: true },
                            ].map(({ label, value, color, bg, isText }) => (
                                <Col span={8} key={label}>
                                    <div style={{ background: bg, borderRadius: 12, padding: '14px 16px', textAlign: 'center' }}>
                                        {isText
                                            ? <div style={{ fontSize: 20, fontWeight: 800, color, lineHeight: 1.1 }}>{value}</div>
                                            : <CountUp end={value} duration={1.2} style={{ fontSize: 28, fontWeight: 800, color, lineHeight: 1 }} />
                                        }
                                        <div style={{ fontSize: 11, color: C.muted, marginTop: 4, fontWeight: 600 }}>{label}</div>
                                    </div>
                                </Col>
                            ))}
                        </Row>

                        <Row gutter={[16, 16]}>
                            <Col xs={24} xl={12}>
                                <div style={{ background: C.surface, borderRadius: 12, padding: 16, border: `1px solid ${C.border}`, height: '100%' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                                        <Text style={{ fontWeight: 700, fontSize: 13 }}>Time per Client</Text>
                                        <Text style={{ fontSize: 11, color: C.muted }}>Click bar for sub-services</Text>
                                    </div>
                                    <EChartsReact
                                        option={hBarOption(
                                            [...empModalClients].sort((a, b) => b.total_hours_ms - a.total_hours_ms).slice(0, 10).map(r => ({ name: r.client_name, ms: r.total_hours_ms })),
                                            '#f59e0b', '#fbbf24'
                                        )}
                                        style={{ height: Math.max(160, Math.min(empModalClients.length, 10) * 32 + 24) }}
                                        onEvents={{
                                            click: (params) => {
                                                const sorted   = [...empModalClients].sort((a, b) => b.total_hours_ms - a.total_hours_ms).slice(0, 10);
                                                const reversed = [...sorted].reverse();
                                                const row = reversed[params.dataIndex];
                                                if (!row) return;
                                                handleEmpClientBarClick(row);
                                            },
                                        }}
                                    />
                                </div>
                            </Col>
                            <Col xs={24} xl={12}>
                                <Table
                                    dataSource={[...empModalClients].sort((a, b) => b.total_hours_ms - a.total_hours_ms)}
                                    rowKey="client_id" size="small"
                                    columns={empClientCols} pagination={sharedPagination} scroll={{ x: 'max-content' }}
                                    onRow={r => ({ onClick: () => handleEmpClientBarClick(r), style: sharedRowStyle })}
                                    summary={() => (
                                        <Table.Summary.Row style={{ background: '#f8fafc' }}>
                                            <Table.Summary.Cell index={0} colSpan={2}><Text strong style={{ fontSize: 12 }}>Grand Total</Text></Table.Summary.Cell>
                                            <Table.Summary.Cell index={1} align="right">
                                                <Text strong style={{ fontSize: 12, color: C.inProgress }}>
                                                    {formatDurationFromMillis(empModalClients.reduce((s, r) => s + (r.total_hours_ms || 0), 0))}
                                                </Text>
                                            </Table.Summary.Cell>
                                        </Table.Summary.Row>
                                    )}
                                />
                                <Text style={{ fontSize: 11, color: C.muted, display: 'block', marginTop: 8 }}>
                                    💡 Click any row or chart bar to see sub-service breakdown
                                </Text>
                            </Col>
                        </Row>

                        {empDrillVisible && (
                            <div style={{ marginTop: 20, background: C.surface, borderRadius: 12, border: `2px solid #f59e0b`, padding: 20 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                                    <div>
                                        <Text style={{ fontWeight: 700, fontSize: 14, color: C.text }}>Sub-services — {empDrillClient?.client_name}</Text>
                                        <Text style={{ fontSize: 12, color: C.muted, display: 'block' }}>Time breakdown by description/service for <strong>{empModalName}</strong></Text>
                                    </div>
                                    <Button size="small" onClick={() => setEmpDrillVisible(false)}>✕ Close</Button>
                                </div>
                                {empDrillLoading ? (
                                    <div style={{ textAlign: 'center', padding: 32 }}><Spin /></div>
                                ) : empDrillServices.length > 0 ? (
                                    <Row gutter={[16, 0]}>
                                        <Col xs={24} xl={12}>
                                            <EChartsReact
                                                option={hBarOption(empDrillServices.map(s => ({ name: s.name, ms: s.ms })), '#f59e0b', '#fbbf24')}
                                                style={{ height: Math.max(140, empDrillServices.length * 32 + 20) }}
                                            />
                                        </Col>
                                        <Col xs={24} xl={12}>
                                            <Table
                                                dataSource={empDrillServices} rowKey="name" size="small"
                                                pagination={sharedPagination} columns={empDrillCols}
                                                summary={() => (
                                                    <Table.Summary.Row style={{ background: '#f8fafc' }}>
                                                        <Table.Summary.Cell index={0} colSpan={2}><Text strong style={{ fontSize: 12 }}>Total</Text></Table.Summary.Cell>
                                                        <Table.Summary.Cell index={1} align="right">
                                                            <Text strong style={{ fontSize: 12, color: '#f59e0b' }}>
                                                                {formatDurationFromMillis(empDrillServices.reduce((s, r) => s + (r.ms || 0), 0))}
                                                            </Text>
                                                        </Table.Summary.Cell>
                                                    </Table.Summary.Row>
                                                )}
                                            />
                                        </Col>
                                    </Row>
                                ) : (
                                    <div style={{ textAlign: 'center', padding: 32, color: C.muted }}>No sub-service entries found for this client</div>
                                )}
                            </div>
                        )}
                    </>
                ) : (
                    <div style={{ textAlign: 'center', padding: 40, color: C.muted }}>No time entries found</div>
                )}
            </Modal>

        </div>
    );
};

export default TaskDashboard;