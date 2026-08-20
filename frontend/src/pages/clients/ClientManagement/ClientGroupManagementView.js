// // // D:\Onging Projects\HRMS\frontend\src\pages\clients\ClientManagement\ClientGroupManagementView.js

// // import React, { useState, useEffect, useCallback } from 'react';
// // import { Steps, Button, message, Form, Typography, Spin, Card, Divider, Descriptions, Tag, Table, Col, Row, Space } from 'antd'; // Added Tag, Table
// // import { SolutionOutlined, UsergroupAddOutlined, ReconciliationOutlined, CheckCircleOutlined, CrownOutlined, GoldOutlined, StarOutlined, UserOutlined, TagOutlined, CalendarOutlined, DollarOutlined, PlusOutlined } from '@ant-design/icons'; // Added more icons
// // import ClientGroupForm from './ClientGroupForm';
// // import ClientGroupClientsForm from './ClientGroupClientsForm';
// // import ClientGroupServicesForm from './ClientGroupServicesForm';
// // import moment from 'moment';

// // import { api } from '../../../services/api';
// // import { useAuth } from '../../../contexts/AuthContext';

// // const { Step } = Steps;
// // const { Title, Text } = Typography;

// // function ClientGroupManagementView({ onGroupSaved, initialGroupData, clients, groupCategories, mainServices, subServicesMap, spocs }) {
// //     const { authToken } = useAuth();
// //     const token = authToken || localStorage.getItem('token');

// //     const [currentStep, setCurrentStep] = useState(0);
// //     const [loading, setLoading] = useState(false); // Initial state should be false
// //     const [groupSaving, setGroupSaving] = useState(false); // Initial state should be false

// //     // State for different sections of the form
// //     const [groupDetails, setGroupDetails] = useState({});
// //     const [selectedClients, setSelectedClients] = useState([]); // Clients with real IDs
// //     const [services, setServices] = useState({});

// //     // Ant Design Form instances for each step
// //     const [groupForm] = Form.useForm();
// //     const [clientsForm] = Form.useForm();
// //     const [servicesForm] = Form.useForm();

// //     // Helper functions (replicated from ClientGroupDetailView for review page)
// //     const getGroupCategoryName = (categoryId) => {
// //         const category = groupCategories.find(cat => cat.id === categoryId);
// //         return category ? category.name : 'N/A';
// //     };

// //     const getSpocName = (spocId) => {
// //         const spoc = spocs.find(s => s.id === spocId);
// //         return spoc ? (spoc.name || spoc.email) : 'N/A';
// //     };

// //     const getMainServiceName = (serviceId) => {
// //         const service = mainServices.find(s => s.id === serviceId);
// //         return service ? service.name : 'N/A';
// //     };

// //     const getSubServiceName = (mainService, subServiceId) => {
// //         const mainServiceId = mainService?.id || mainService; // handle object or ID
// //         const subServices = subServicesMap[mainServiceId] || [];
// //         const subService = subServices.find(s => s.id === subServiceId);
// //         return subService ? subService.name : 'N/A';
// //     };




// //     const getCategoryIcon = (categoryName) => {
// //         switch (categoryName) {
// //             case 'Class A':
// //             return <CrownOutlined style={{ color: '#e9bc37' }} />; // Gold/yellow
// //             case 'Class B':
// //             return <GoldOutlined style={{ color: '#607d8b' }} />; // Gray/blue
// //             case 'Class C':
// //             return <StarOutlined style={{ color: '#2196f3' }} />; // Blue
// //             default:
// //             return null;
// //         }
// //     };

// //     // Function to fetch and set group data (for initial load and refresh)
// //     const fetchGroupData = useCallback(async (groupId) => {
// //         if (!groupId) {
// //             console.warn("fetchGroupData called without a valid groupId. Skipping fetch.");
// //             setLoading(false); // Ensure loading is false if no ID
// //             return;
// //         }
// //         setLoading(true);
// //         console.log("DEBUG: fetchGroupData - Starting fetch for groupId:", groupId);
// //         try {
// //             const headers = { Authorization: `Bearer ${token}` };
// //             const response = await api.get(`/clients/client-groups/${groupId}/`, { headers });
// //             const fetchedGroupData = response.data;

// //             console.log("DEBUG: fetchGroupData - fetchedGroupData:", fetchedGroupData);

// //             // Update group details state and form
// //             groupForm.setFieldsValue(fetchedGroupData);
// //             setGroupDetails(fetchedGroupData);

// //             // Re-populate selectedClients and services based on fetchedGroupData
// //             const clientsFromGroup = fetchedGroupData.clients || [];
            
// //             // Ensure all clients referenced in services are also in selectedClients
// //             const clientsFromServices = (fetchedGroupData.group_services || []).map(serviceItem => {
// //                 // Find the full client object from the main 'clients' prop
// //                 return clients.find(c => c.id === serviceItem.client);
// //             }).filter(Boolean); // Filter out any clients not found

// //             const allUniqueClients = Array.from(new Set([...clientsFromGroup, ...clientsFromServices].map(c => c.id)))
// //                 .map(clientId => clients.find(c => c.id === clientId))
// //                 .filter(Boolean); // Filter out any nulls if client not found in main 'clients' prop

// //             setSelectedClients(allUniqueClients);
// //             console.log("DEBUG: fetchGroupData - allUniqueClients:", allUniqueClients);
            
// //             const initialServices = {};
// //             (fetchedGroupData.group_services || []).forEach(serviceItem => {
// //                 const correspondingClient = allUniqueClients.find(
// //                     client => client.id === serviceItem.client
// //                 );

// //                 if (correspondingClient) {
// //                     const clientKey = correspondingClient.id;
// //                     if (!initialServices[clientKey]) {
// //                         initialServices[clientKey] = [];
// //                     }
// //                     initialServices[clientKey].push({
// //                         main_service: serviceItem.main_service.id,
// //                         sub_service: serviceItem.sub_service,
// //                         sub_service_name: serviceItem.sub_service_name,
// //                         fee: serviceItem.fee,
// //                         period: serviceItem.period,
// //                         due_date: serviceItem.due_date ? moment(serviceItem.due_date) : null,
// //                     });
// //                 } else {
// //                     console.warn(`Client "${serviceItem.client}" not found in finalSelectedClients for service ID ${serviceItem.id}. Service will not be pre-filled.`);
// //                 }
// //             });
// //             setServices(initialServices);
// //             servicesForm.setFieldsValue(initialServices);
// //             console.log("DEBUG: fetchGroupData - initialServices (for form):", initialServices);

// //         } catch (error) {
// //             console.error('Failed to fetch group data for refresh:', error);
// //             message.error('Failed to refresh group data.');
// //         } finally {
// //             setLoading(false); // Ensure loading is always set to false
// //             console.log("DEBUG: fetchGroupData - Finished fetch, loading set to false.");
// //         }
// //     }, [token, groupForm, clients, servicesForm]);


// //     // Effect to handle initial data loading or resetting when initialGroupData changes
// //     useEffect(() => {
// //         console.log("DEBUG: ClientGroupManagementView - useEffect triggered. initialGroupData:", initialGroupData);
// //         if (initialGroupData?.id) { // Only fetch if an ID exists
// //             console.log("DEBUG: ClientGroupManagementView - Calling fetchGroupData for initialGroupData.id:", initialGroupData.id);
// //             fetchGroupData(initialGroupData.id);
// //         } else {
// //             console.log("DEBUG: ClientGroupManagementView - initialGroupData is null/undefined, resetting form fields.");
// //             // Reset fields for new group creation
// //             groupForm.resetFields();
// //             clientsForm.resetFields();
// //             servicesForm.resetFields();
// //             setCurrentStep(0);
// //             setGroupDetails({});
// //             setSelectedClients([]);
// //             setServices({});
// //             setLoading(false); // Ensure loading is false when resetting for new group
// //             setGroupSaving(false); // Ensure saving is false when resetting for new group
// //         }
// //     }, [initialGroupData, fetchGroupData, groupForm, clientsForm, servicesForm, clients]);


// //     // Effect to re-populate form fields when navigating between steps
// //     useEffect(() => {
// //         console.log("DEBUG: currentStep useEffect - currentStep:", currentStep);
// //         if (currentStep === 0) {
// //             groupForm.setFieldsValue(groupDetails);
// //         } else if (currentStep === 1) {
// //             // No direct setFieldsValue for clientsForm needed here as ClientGroupClientsForm manages its own form state
// //             // and the List component directly uses `selectedClients` prop.
// //         } else if (currentStep === 2) {
// //             servicesForm.setFieldsValue(services);
// //         }
// //     }, [currentStep, groupDetails, selectedClients, services, groupForm, clientsForm, servicesForm]);


// //     // --- Client Management Callbacks (Passed to ClientGroupClientsForm) ---
// //     const handleAddClient = useCallback(async (newClientData) => {
// //         setLoading(true);
// //         console.log("DEBUG: handleAddClient - Starting client add operation.");
// //         try {
// //             const headers = { Authorization: `Bearer ${token}` };
// //             const clientPayload = { ...newClientData };
// //             delete clientPayload.id; 
// //             delete clientPayload._tempId;

// //             const response = await api.post('/clients/clients/', clientPayload, { headers });
// //             message.success('Client added successfully!');
            
// //             // If we are editing an existing group, refresh the group data to reflect client changes
// //             if (initialGroupData?.id) {
// //                 console.log("DEBUG: handleAddClient - Existing group, re-fetching group data.");
// //                 await fetchGroupData(initialGroupData.id); // This will re-fetch and update all states
// //             } else {
// //                 console.log("DEBUG: handleAddClient - New group, updating selectedClients state.");
// //                 // For new group creation flow, simply add the client to selectedClients
// //                 setSelectedClients(prevClients => [...prevClients, response.data]);
// //             }
// //             return response.data;
// //         } catch (error) {
// //             console.error('Failed to add client:', error);
// //             message.error(`Failed to add client: ${error.response?.data ? JSON.stringify(error.response.data) : error.message}`);
// //             throw error;
// //         } finally {
// //             setLoading(false); // Ensure loading is always set to false
// //             console.log("DEBUG: handleAddClient - Finished client add, loading set to false.");
// //         }
// //     }, [token, initialGroupData, fetchGroupData]);

// //     const handleUpdateClient = useCallback(async (updatedClientData) => {
// //         setLoading(true);
// //         console.log("DEBUG: handleUpdateClient - Starting client update operation.");
// //         try {
// //             if (!updatedClientData.id) {
// //                 message.error('Cannot update client: Client ID is missing.');
// //                 throw new Error('Client ID missing for update.');
// //             }
// //             const headers = { Authorization: `Bearer ${token}` };
// //             const clientPayload = { ...updatedClientData };
// //             delete clientPayload._tempId; 

// //             const response = await api.put(`/clients/clients/${updatedClientData.id}/`, clientPayload, { headers });
// //             message.success('Client updated successfully!');
            
// //             // If we are editing an existing group, refresh the group data to reflect client changes
// //             if (initialGroupData?.id) {
// //                 console.log("DEBUG: handleUpdateClient - Existing group, re-fetching group data.");
// //                 await fetchGroupData(initialGroupData.id); // This will re-fetch and update all states
// //             } else {
// //                 console.log("DEBUG: handleUpdateClient - New group, updating selectedClients state.");
// //                 setSelectedClients(prevClients => 
// //                     prevClients.map(client => 
// //                         client.id === updatedClientData.id ? response.data : client
// //                     )
// //                 );
// //             }
// //             return response.data;
// //         } catch (error) {
// //             console.error('Failed to update client:', error);
// //             message.error(`Failed to update client: ${error.response?.data ? JSON.stringify(error.response.data) : error.message}`);
// //             throw error;
// //         } finally {
// //             setLoading(false); // Ensure loading is always set to false
// //             console.log("DEBUG: handleUpdateClient - Finished client update, loading set to false.");
// //         }
// //     }, [token, initialGroupData, fetchGroupData]);

// //     const handleRemoveClient = useCallback(async (clientId) => {
// //         setLoading(true);
// //         console.log("DEBUG: handleRemoveClient - Starting client remove operation.");
// //         try {
// //             const headers = { Authorization: `Bearer ${token}` };
// //             await api.delete(`/clients/clients/${clientId}/`, { headers });
// //             message.success('Client removed successfully!');
            
// //             // If we are editing an existing group, refresh the group data to reflect client changes
// //             if (initialGroupData?.id) {
// //                 console.log("DEBUG: handleRemoveClient - Existing group, re-fetching group data.");
// //                 await fetchGroupData(initialGroupData.id); // This will re-fetch and update all states
// //             } else {
// //                  // For new group creation flow, simply remove the client from selectedClients
// //                 console.log("DEBUG: handleRemoveClient - New group, updating selectedClients/services state.");
// //                 setSelectedClients(prevClients => prevClients.filter(client => client.id !== clientId));
// //                 setServices(prevServices => {
// //                     const newServices = { ...prevServices };
// //                     delete newServices[clientId];
// //                     return newServices;
// //                 });
// //             }

// //         } catch (error) {
// //             console.error('Failed to remove client:', error);
// //             message.error(`Failed to remove client: ${error.response?.data ? JSON.stringify(error.response.data) : error.message}`);
// //             throw error;
// //         } finally {
// //             setLoading(false); // Ensure loading is always set to false
// //             console.log("DEBUG: handleRemoveClient - Finished client remove, loading set to false.");
// //         }
// //     }, [token, initialGroupData, fetchGroupData]);


// //     const handleNext = async () => {
// //         setLoading(true); // Set loading when validating and moving to next step
// //         console.log("DEBUG: handleNext - Starting validation and next step.");
// //         try {
// //             const currentFormValues = await steps[currentStep].form.validateFields();
// //             steps[currentStep].onSave(currentFormValues);
// //             setCurrentStep(currentStep + 1);
// //         } catch (errorInfo) {
// //             message.error('Please complete the current step correctly.');
// //             console.error('Validation failed:', errorInfo);
// //         } finally {
// //             setLoading(false); // Ensure loading is false after validation
// //             console.log("DEBUG: handleNext - Finished validation, loading set to false.");
// //         }
// //     };

// //     const handlePrev = () => {
// //         setCurrentStep(currentStep - 1);
// //     };

// //     const handleFinish = async () => {
// //         setGroupSaving(true);
// //         console.log("DEBUG: handleFinish - Starting group save/update operation.");
// //         try {
// //             await groupForm.validateFields();
// //             if (selectedClients.length > 0) {
// //                 await servicesForm.validateFields(); 
// //             }

// //             const clientIdsToLink = selectedClients.map(client => client.id); 

// //             const groupServicesData = Object.keys(services).flatMap(clientId => {
// //                 return (services[clientId] || []).map(service => {
// //                     const servicePayload = {
// //                         client: clientId,
// //                         main_service: service.main_service,
// //                         sub_service: service.sub_service, 
// //                         fee: service.fee,
// //                         period: service.period,
// //                         due_date: service.due_date ? moment(service.due_date).format('YYYY-MM-DD') : null,
// //                     };
// //                     return servicePayload;
// //                 });
// //             });

// //             const payload = {
// //                 ...groupDetails,
// //                 clients: clientIdsToLink,
// //                 group_services_data: groupServicesData,
// //             };

// //             console.log("DEBUG: handleFinish - Final payload being sent:", payload);

// //             const headers = { Authorization: `Bearer ${token}` };

// //             const response = initialGroupData?.id
// //                 ? await api.put(`/clients/client-groups/${initialGroupData.id}/`, payload, { headers })
// //                 : await api.post('/clients/client-groups/', payload, { headers });

// //             message.success(initialGroupData ? 'Client Group updated successfully!' : 'Client Group created successfully!');
            
// //             // After successful group save/update, refresh the data
// //             if (response.data.id) { // For both create and update, use the response ID
// //                 console.log("DEBUG: handleFinish - Group saved, calling fetchGroupData for ID:", response.data.id);
// //                 await fetchGroupData(response.data.id);
// //             }
// //             onGroupSaved(); // Still call this for parent-level actions like closing modal

// //         } catch (error) {
// //             console.error('❌ Submission error:', error);
// //             if (error.response?.data) {
// //                 console.error('Backend validation errors:', error.response.data);
// //                 message.error(`Failed to save client group: ${JSON.stringify(error.response.data)}`);
// //             } else {
// //                 message.error('Failed to save client group. Please check all fields.');
// //             }
// //         } finally {
// //             setGroupSaving(false); // Ensure saving is always set to false
// //             console.log("DEBUG: handleFinish - Finished save/update, groupSaving set to false.");
// //         }
// //     };

// //     // Define service columns for the review table (similar to ClientGroupDetailView)
// //     const serviceColumns = [
// //         {
// //             title: 'Main Service',
// //             dataIndex: 'main_service',
// //             key: 'main_service',
// //             render: (mainServiceId) => <Tag color="volcano">{getMainServiceName(mainServiceId)}</Tag>,
// //         },
// //         {
// //             title: 'Sub Service',
// //             dataIndex: 'sub_service',
// //             key: 'sub_service',
// //             render: (subServiceId, record) => {
// //                 const name = getSubServiceName(record.main_service, subServiceId);
// //                 return <Tag color="green">{name}</Tag>;
// //             },
// //         },


// //         {
// //             title: 'Fee',
// //             dataIndex: 'fee',
// //             key: 'fee',
// //             render: (fee) => fee ? `₹${fee}` : 'N/A',
// //         },
// //         {
// //             title: 'Period',
// //             dataIndex: 'period',
// //             key: 'period',
// //             render: (period) => <Tag color="processing">{period}</Tag>,
// //         },
// //         {
// //             title: 'Due Date',
// //             dataIndex: 'due_date',
// //             key: 'due_date',
// //             render: (date) => date ? moment(date).format('YYYY-MM-DD') : 'N/A',
// //         },
// //     ];


// //     const steps = [
// //         {
// //             title: 'Group Details',
// //             icon: <SolutionOutlined />,
// //             content: <ClientGroupForm form={groupForm} initialValues={groupDetails} groupCategories={groupCategories} spocs={spocs} />,
// //             form: groupForm,
// //             onSave: (values) => {
// //                 setGroupDetails(values);
// //             },
// //         },
// //         {
// //             title: 'Clients in Group',
// //             icon: <UsergroupAddOutlined />,
// //             content: (
// //                 <ClientGroupClientsForm 
// //                     form={clientsForm} 
// //                     initialClients={selectedClients} 
// //                     onClientsChange={setSelectedClients}
// //                     onAddClient={handleAddClient}
// //                     onUpdateClient={handleUpdateClient}
// //                     onRemoveClient={handleRemoveClient}
// //                     allClients={clients}
// //                 />
// //             ),
// //             form: clientsForm,
// //             onSave: (values) => {
// //                 // The `onClientsChange` prop already updates `selectedClients` directly.
// //             },
// //         },
// //         {
// //             title: 'Services',
// //             icon: <ReconciliationOutlined />,
// //             content: <ClientGroupServicesForm form={servicesForm} groupClients={selectedClients} initialValues={services} mainServices={mainServices} subServicesMap={subServicesMap} />,
// //             form: servicesForm,
// //             onSave: (values) => {
// //                 setServices(values);
// //             },
// //         },
// //         {
// //             title: 'Review & Finish',
// //             icon: <CheckCircleOutlined />,
// //             content: (
// //                 <>
// //                     <Typography.Paragraph strong style={{ marginBottom: '20px', fontSize: '16px' }}>
// //                         Review and Submit below
// //                     </Typography.Paragraph>
// //                     <Card
// //                         title={
// //                             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', font: '200' }}>
// //                                 <div style={{ flex: 1 }}></div> 
// //                                 <Space align="center" style={{ flexShrink: 0 }}>
// //                                     <Title level={3} style={{ margin: 0, whiteSpace: 'nowrap' }}>{groupDetails.group_name}</Title>
// //                                     {groupDetails.group_category && (
// //                                         <Button
// //                                             type="primary"
// //                                             size="small"
// //                                             icon={getCategoryIcon(getGroupCategoryName(groupDetails.group_category))}
// //                                             style={{ 
// //                                                 borderColor: getGroupCategoryName(groupDetails.group_category) === 'Class A' ? '#e9bc37ff' : 
// //                                                              getGroupCategoryName(groupDetails.group_category) === 'Class B' ? '#607d8b' : 
// //                                                              getGroupCategoryName(groupDetails.group_category) === 'Class C' ? '#2196f3' : 'blue', 
// //                                                 color: getGroupCategoryName(groupDetails.group_category) === 'Class A' ? '#000' : '#fff', 
// //                                                 backgroundColor: getGroupCategoryName(groupDetails.group_category) === 'Class A' ? '#e9bc37ff' : 
// //                                                                  getGroupCategoryName(groupDetails.group_category) === 'Class B' ? '#607d8b' : 
// //                                                                  getGroupCategoryName(groupDetails.group_category) === 'Class C' ? '#2196f3' : 'blue',
// //                                                 fontWeight: 'bold',
// //                                                 marginLeft: 16
// //                                             }}
// //                                         >
// //                                             {getGroupCategoryName(groupDetails.group_category)}
// //                                         </Button>
// //                                     )}
// //                                 </Space>
// //                                 <div style={{ flex: 1, textAlign: 'right' }}>
// //                                     {/* No edit button here, as this is a review page */}
// //                                 </div>
// //                             </div>
// //                         }
// //                         bordered={false}
// //                         style={{ marginBottom: '24px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.09)' }}
// //                         styles={{body: {padding: '24px'}}}
// //                     >
// //                         <Descriptions bordered column={{ xs: 1, sm: 2, md: 3 }}>
// //                             <Descriptions.Item label="Primary SPOC">
// //                                 <Tag color="green"><UserOutlined style={{ marginRight: 4 }} />{getSpocName(groupDetails.primary_spoc)}</Tag>
// //                             </Descriptions.Item>
// //                             {groupDetails.secondary_spoc && (
// //                                 <Descriptions.Item label="Secondary SPOC">
// //                                     <Tag color="geekblue"><UserOutlined style={{ marginRight: 4 }} />{getSpocName(groupDetails.secondary_spoc)}</Tag>
// //                                 </Descriptions.Item>
// //                             )}
// //                             {groupDetails.created_at && (
// //                                 <Descriptions.Item label="Created At">
// //                                     {moment(groupDetails.created_at).format('YYYY-MM-DD HH:mm')}
// //                                 </Descriptions.Item>
// //                             )}
// //                             {groupDetails.description && (
// //                                 <Descriptions.Item label="Description" span={3}>
// //                                     {groupDetails.description}
// //                                 </Descriptions.Item>
// //                             )}
// //                         </Descriptions>
// //                     </Card>

// //                     <Row gutter={[24, 24]}>
// //                         <Col span={24}>
// //                             <Card
// //                                 title={
// //                                     <Space style={{ width: '100%', justifyContent: 'space-between' }}>
// //                                         <Title level={4} style={{ margin: 0 }}><UserOutlined style={{ marginRight: 8 }} />Clients in this Group</Title>
// //                                     </Space>
// //                                 }
// //                                 bordered={false}
// //                                 style={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.09)' }}
// //                                 styles={{body: {padding: '24px'}}}
// //                             >
// //                                 {selectedClients && selectedClients.length > 0 ? (
// //                                     selectedClients.map((client) => {
// //                                         const clientServices = (services[client.id] || []).map(service => ({
// //                                             ...service,
// //                                             // Ensure due_date is a moment object for rendering if it's not already
// //                                             due_date: service.due_date ? moment(service.due_date) : null
// //                                         }));

// //                                         return (
// //                                             <Card
// //                                                 key={client.id || client._tempId} // Use _tempId for new clients
// //                                                 type="inner"
// //                                                 title={
// //                                                     <Space>
// //                                                         <Title level={5} style={{ margin: 0 }}><UserOutlined style={{ marginRight: 4 }} />Client: {client.name}</Title>
// //                                                     </Space>
// //                                                 }
// //                                                 style={{ marginBottom: '16px', backgroundColor: '#fafafa' }}
// //                                                 styles={{body: {padding: '16px'}}}
// //                                             >
// //                                                 <Descriptions column={2} size="small" bordered>
// //                                                     {client.email && <Descriptions.Item label="Email">{client.email}</Descriptions.Item>}
// //                                                     {client.phone && <Descriptions.Item label="Phone">{client.phone}</Descriptions.Item>}
// //                                                     {client.contact_person && <Descriptions.Item label="Contact Person">{client.contact_person}</Descriptions.Item>}
// //                                                     {client.nature_of_business && <Descriptions.Item label="Nature of Business">{client.nature_of_business}</Descriptions.Item>}
// //                                                     {client.gstin && <Descriptions.Item label="GSTIN">{client.gstin}</Descriptions.Item>}
// //                                                     {client.pan && <Descriptions.Item label="PAN">{client.pan}</Descriptions.Item>}
// //                                                     {client.cin && <Descriptions.Item label="CIN">{client.cin}</Descriptions.Item>}
// //                                                     {client.iec && <Descriptions.Item label="IEC">{client.iec}</Descriptions.Item>}
// //                                                     {client.ksea && <Descriptions.Item label="KSEA">{client.ksea}</Descriptions.Item>}
// //                                                     {client.udyam && <Descriptions.Item label="UDYAM">{client.udyam}</Descriptions.Item>}
// //                                                     {client.apt && <Descriptions.Item label="APT">{client.apt}</Descriptions.Item>}
// //                                                     {client.ept && <Descriptions.Item label="EPT">{client.ept}</Descriptions.Item>}
// //                                                     {client.tan && <Descriptions.Item label="TAN">{client.tan}</Descriptions.Item>}
// //                                                     {client.lei && <Descriptions.Item label="LEI">{client.lei}</Descriptions.Item>}
// //                                                     {client.billing_cycle && <Descriptions.Item label="Billing Cycle">{client.billing_cycle}</Descriptions.Item>}
// //                                                     {client.invoice_date && <Descriptions.Item label="Invoice Date">{moment(client.invoice_date).format('YYYY-MM-DD')}</Descriptions.Item>}
// //                                                 </Descriptions>

// //                                                 <Divider orientation="left" style={{ margin: '24px 0 16px' }}>
// //                                                     <TagOutlined style={{ marginRight: 4 }} />Services for {client.name}
// //                                                 </Divider>

// //                                                 {clientServices && clientServices.length > 0 ? (
// //                                                     <Table
// //                                                         dataSource={clientServices}
// //                                                         columns={serviceColumns}
// //                                                         rowKey={(record, index) => record.id || `service-${client.id}-${index}`} // Use a unique key
// //                                                         pagination={false}
// //                                                         size="small"
// //                                                         bordered
// //                                                         style={{ marginBottom: '16px' }}
// //                                                     />
// //                                                 ) : (
// //                                                     <Text type="secondary">No services assigned to this client within this group.</Text>
// //                                                 )}
// //                                             </Card>
// //                                         );
// //                                     })
// //                                 ) : (
// //                                     <Text type="secondary">No clients assigned to this group.</Text>
// //                                 )}
// //                             </Card>
// //                         </Col>
// //                     </Row>
// //                 </>
// //             ),
// //         },
// //     ];

// //     if (loading || groupSaving) {
// //         return (
// //             <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px', background: '#f0f2f5', borderRadius: '8px', padding: '24px' }}>
// //                 <Spin size="large" tip={groupSaving ? "Saving group..." : "Loading..."} />
// //             </div>
// //         );
// //     }

// //     return (
// //         <div
// //       style={{
// //         padding: '24px',
// //         background: 'linear-gradient(to right, #f8f9fa, #e0e7ff)',
// //         borderRadius: '12px',
// //         boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)',
// //         // minHeight: '0vh'
// //       }}
// //     >
// //         <div style={{ padding: '24px', minHeight: 'calc(100vh - 64px)', borderRadius: '8px' }}>
// //             <Title level={2} style={{ marginBottom: '74px', color: '#333' }}>
// //                 {initialGroupData ? 'Edit Client Group' : 'Add Client Group'}
// //             </Title>

// //             <Card style={{ marginBottom: '30px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.09)', background: 'linear-gradient(to right, #f8f9fa, #e0e7ff)', }} styles={{body: {padding: '24px'}}}>
// //                 <Steps current={currentStep} responsive={true}>
// //                     {steps.map((item) => (
// //                         <Step key={item.title} title={item.title} icon={item.icon} />
// //                     ))}
// //                 </Steps>
// //             </Card>

// //             <div className="steps-content">
// //                 {steps[currentStep].content}
// //             </div>

// //             <div className="steps-action" style={{ marginTop: '30px', textAlign: 'right' }}>
// //                 {currentStep > 0 && (
// //                     <Button style={{ margin: '0 8px' }} onClick={handlePrev} disabled={loading || groupSaving}>
// //                         Previous
// //                     </Button>
// //                 )}
// //                 {currentStep < steps.length - 1 && (
// //                     <Button type="primary" onClick={handleNext} disabled={loading || groupSaving}>
// //                         Next
// //                     </Button>
// //                 )}
// //                 {currentStep === steps.length - 1 && (
// //                     <Button type="primary" onClick={handleFinish} disabled={loading || groupSaving}>
// //                         {initialGroupData ? 'Update Group' : 'Create Group'}
// //                     </Button>
// //                 )}
// //             </div>
// //         </div>
// //         </div>
// //     );
// // }

// // export default ClientGroupManagementView;


// // D:\Onging Projects\HRMS\frontend\src\pages\clients\ClientManagement\ClientGroupManagementView.js

// import React, { useState, useEffect, useCallback } from 'react';
// import {
//   Steps, Button, message, Form, Typography, Spin, Card,
//   Divider, Descriptions, Tag, Table, Col, Row, Space,
// } from 'antd';
// import {
//   SolutionOutlined, UsergroupAddOutlined, ReconciliationOutlined,
//   CheckCircleOutlined, CrownOutlined, GoldOutlined, StarOutlined,
//   UserOutlined, TagOutlined,
// } from '@ant-design/icons';
// import ClientGroupForm from './ClientGroupForm';
// import ClientGroupClientsForm from './ClientGroupClientsForm';
// import ClientGroupServicesForm from './ClientGroupServicesForm';
// import moment from 'moment';
// import { api } from '../../../services/api';
// import { useAuth } from '../../../contexts/AuthContext';

// const { Step } = Steps;
// const { Title, Text } = Typography;

// function ClientGroupManagementView({
//   onGroupSaved, initialGroupData, clients,
//   groupCategories, mainServices, subServicesMap, spocs,
// }) {
//   const { authToken } = useAuth();
//   const token = authToken || localStorage.getItem('token');

//   const [currentStep,    setCurrentStep]    = useState(0);
//   const [loading,        setLoading]        = useState(false);
//   const [groupSaving,    setGroupSaving]    = useState(false);
//   const [groupDetails,   setGroupDetails]   = useState({});
//   const [selectedClients, setSelectedClients] = useState([]);
//   const [pendingClients, setPendingClients] = useState([]); // not-yet-saved clients for new group
//   const [services,       setServices]       = useState({});

//   const [groupForm]    = Form.useForm();
//   const [clientsForm]  = Form.useForm();
//   const [servicesForm] = Form.useForm();

//   const headers = { Authorization: `Bearer ${token}` };

//   /* ── helpers ── */
//   const getGroupCategoryName = (categoryId) => {
//     const cat = groupCategories.find(c => c.id === categoryId);
//     return cat ? cat.name : 'N/A';
//   };

//   const getSpocName = (spocId) => {
//     const spoc = spocs.find(s => s.id === spocId);
//     return spoc ? (spoc.name || spoc.email) : 'N/A';
//   };

//   const getMainServiceName = (serviceId) => {
//     const svc = mainServices.find(s => s.id === serviceId);
//     return svc ? svc.name : 'N/A';
//   };

//   const getSubServiceName = (mainService, subServiceId) => {
//     const mainId   = mainService?.id || mainService;
//     const subList  = subServicesMap[mainId] || [];
//     const sub      = subList.find(s => s.id === subServiceId);
//     return sub ? sub.name : 'N/A';
//   };

//   const getCategoryIcon = (categoryName) => {
//     switch (categoryName) {
//       case 'Class A': return <CrownOutlined style={{ color: '#e9bc37' }} />;
//       case 'Class B': return <GoldOutlined  style={{ color: '#607d8b' }} />;
//       case 'Class C': return <StarOutlined  style={{ color: '#2196f3' }} />;
//       default:        return null;
//     }
//   };

//   /* ── fetch existing group ── */
//   const fetchGroupData = useCallback(async (groupId) => {
//     if (!groupId) { setLoading(false); return; }
//     setLoading(true);
//     try {
//       const res             = await api.get(`/clients/client-groups/${groupId}/`, { headers });
//       const fetchedGroupData = res.data;

//       groupForm.setFieldsValue(fetchedGroupData);
//       setGroupDetails(fetchedGroupData);

//       const clientsFromGroup    = fetchedGroupData.clients || [];
//       const clientsFromServices = (fetchedGroupData.group_services || [])
//         .map(s => clients.find(c => c.id === s.client))
//         .filter(Boolean);

//       const allUniqueClients = Array.from(
//         new Set([...clientsFromGroup, ...clientsFromServices].map(c => c.id))
//       ).map(id => clients.find(c => c.id === id)).filter(Boolean);

//       setSelectedClients(allUniqueClients);

//       const initialServices = {};
//       (fetchedGroupData.group_services || []).forEach(svcItem => {
//         const client = allUniqueClients.find(c => c.id === svcItem.client);
//         if (!client) return;
//         if (!initialServices[client.id]) initialServices[client.id] = [];
//         initialServices[client.id].push({
//           main_service:    svcItem.main_service.id,
//           sub_service:     svcItem.sub_service,
//           sub_service_name: svcItem.sub_service_name,
//           fee:             svcItem.fee,
//           period:          svcItem.period,
//           due_date:        svcItem.due_date ? moment(svcItem.due_date) : null,
//         });
//       });
//       setServices(initialServices);
//       servicesForm.setFieldsValue(initialServices);
//     } catch (err) {
//       console.error('Failed to fetch group data:', err);
//       message.error('Failed to refresh group data.');
//     } finally {
//       setLoading(false);
//     }
//   }, [token, groupForm, clients, servicesForm]);

//   /* ── init / reset ── */
//   useEffect(() => {
//     if (initialGroupData?.id) {
//       fetchGroupData(initialGroupData.id);
//     } else {
//       groupForm.resetFields();
//       clientsForm.resetFields();
//       servicesForm.resetFields();
//       setCurrentStep(0);
//       setGroupDetails({});
//       setSelectedClients([]);
//       setPendingClients([]);
//       setServices({});
//       setLoading(false);
//       setGroupSaving(false);
//     }
//   }, [initialGroupData, fetchGroupData, groupForm, clientsForm, servicesForm, clients]);

//   /* ── re-populate forms on step change ── */
//   useEffect(() => {
//     if (currentStep === 0) groupForm.setFieldsValue(groupDetails);
//     if (currentStep === 2) servicesForm.setFieldsValue(services);
//   }, [currentStep, groupDetails, services, groupForm, servicesForm]);

//   /* ── client callbacks ── */

//   const handleAddClient = useCallback(async (newClientData) => {
//     // EDITING existing group — create immediately and link
//     if (initialGroupData?.id) {
//       setLoading(true);
//       try {
//         const clientPayload = { ...newClientData };
//         delete clientPayload.id;
//         delete clientPayload._tempId;

//         const clientRes = await api.post('/clients/clients/', clientPayload, { headers });

//         // Link to existing group
//         const existingIds = selectedClients.filter(c => c.id).map(c => c.id);
//         await api.patch(
//           `/clients/client-groups/${initialGroupData.id}/`,
//           { clients: [...existingIds, clientRes.data.id] },
//           { headers }
//         );

//         message.success('Client added and linked to group!');
//         await fetchGroupData(initialGroupData.id);
//         return clientRes.data;
//       } catch (err) {
//         message.error(`Failed to add client: ${err.response?.data ? JSON.stringify(err.response.data) : err.message}`);
//         throw err;
//       } finally {
//         setLoading(false);
//       }
//     }

//     // NEW group — store locally, create in handleFinish
//     const tempClient = {
//       ...newClientData,
//       _tempId: `temp_${Date.now()}`,
//       id: undefined,
//     };
//     setPendingClients(prev => [...prev, tempClient]);
//     setSelectedClients(prev => [...prev, tempClient]);
//     message.success('Client added (will be saved when group is created)');
//     return tempClient;
//   }, [token, initialGroupData, fetchGroupData, selectedClients]);

//   const handleUpdateClient = useCallback(async (updatedClientData) => {
//     // If it's a pending client (no real id), update locally
//     if (updatedClientData._tempId) {
//       setPendingClients(prev =>
//         prev.map(c => c._tempId === updatedClientData._tempId ? { ...c, ...updatedClientData } : c)
//       );
//       setSelectedClients(prev =>
//         prev.map(c => c._tempId === updatedClientData._tempId ? { ...c, ...updatedClientData } : c)
//       );
//       message.success('Client updated locally');
//       return updatedClientData;
//     }

//     if (!updatedClientData.id) {
//       message.error('Cannot update client: ID missing.');
//       throw new Error('Client ID missing');
//     }

//     setLoading(true);
//     try {
//       const clientPayload = { ...updatedClientData };
//       delete clientPayload._tempId;
//       const res = await api.put(`/clients/clients/${updatedClientData.id}/`, clientPayload, { headers });
//       message.success('Client updated successfully!');

//       if (initialGroupData?.id) {
//         await fetchGroupData(initialGroupData.id);
//       } else {
//         setSelectedClients(prev =>
//           prev.map(c => c.id === updatedClientData.id ? res.data : c)
//         );
//       }
//       return res.data;
//     } catch (err) {
//       message.error(`Failed to update client: ${err.response?.data ? JSON.stringify(err.response.data) : err.message}`);
//       throw err;
//     } finally {
//       setLoading(false);
//     }
//   }, [token, initialGroupData, fetchGroupData]);

//   const handleRemoveClient = useCallback(async (clientId) => {
//     // Pending client — just remove locally
//     const isPending = pendingClients.some(c => c._tempId === clientId || String(c.id) === String(clientId));

//     if (isPending || !initialGroupData?.id) {
//       setPendingClients(prev => prev.filter(c => c._tempId !== clientId && String(c.id) !== String(clientId)));
//       setSelectedClients(prev => prev.filter(c => c._tempId !== clientId && String(c.id) !== String(clientId)));
//       setServices(prev => {
//         const next = { ...prev };
//         delete next[clientId];
//         return next;
//       });
//       message.success('Client removed');
//       return;
//     }

//     // Real client in existing group
//     setLoading(true);
//     try {
//       await api.delete(`/clients/clients/${clientId}/`, { headers });
//       message.success('Client removed successfully!');
//       await fetchGroupData(initialGroupData.id);
//     } catch (err) {
//       message.error(`Failed to remove client: ${err.response?.data ? JSON.stringify(err.response.data) : err.message}`);
//       throw err;
//     } finally {
//       setLoading(false);
//     }
//   }, [token, initialGroupData, fetchGroupData, pendingClients]);

//   /* ── step navigation ── */
//   const handleNext = async () => {
//     setLoading(true);
//     try {
//       const values = await steps[currentStep].form.validateFields();
//       steps[currentStep].onSave(values);
//       setCurrentStep(s => s + 1);
//     } catch {
//       message.error('Please complete the current step correctly.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handlePrev = () => setCurrentStep(s => s - 1);

//   /* ── finish ── */
//   const handleFinish = async () => {
//     setGroupSaving(true);
//     try {
//       await groupForm.validateFields();

//       if (initialGroupData?.id) {
//         /* ══ EDIT existing group ══ */
//         const clientIdsToLink = selectedClients
//           .filter(c => c.id && !c._tempId)
//           .map(c => c.id);

//         const groupServicesData = Object.keys(services).flatMap(clientId =>
//           (services[clientId] || []).map(svc => ({
//             client:       clientId,
//             main_service: svc.main_service,
//             sub_service:  svc.sub_service,
//             fee:          svc.fee,
//             period:       svc.period,
//             due_date:     svc.due_date ? moment(svc.due_date).format('YYYY-MM-DD') : null,
//           }))
//         );

//         await api.put(
//           `/clients/client-groups/${initialGroupData.id}/`,
//           { ...groupDetails, clients: clientIdsToLink, group_services_data: groupServicesData },
//           { headers }
//         );

//         message.success('Client Group updated successfully!');
//         await fetchGroupData(initialGroupData.id);
//         onGroupSaved();

//       } else {
//         /* ══ CREATE new group ══ */

//         // STEP 1: Create the group first (empty clients)
//         const groupRes = await api.post(
//           '/clients/client-groups/',
//           { ...groupDetails, clients: [], group_services_data: [] },
//           { headers }
//         );
//         const newGroupId = groupRes.data.id;

//         // STEP 2: Create all pending clients
//         const createdClients = []; // { tempId, realId }
//         for (const pending of pendingClients) {
//           const clientPayload = { ...pending };
//           delete clientPayload._tempId;
//           delete clientPayload.id;
//           try {
//             const clientRes = await api.post('/clients/clients/', clientPayload, { headers });
//             createdClients.push({ tempId: pending._tempId, realId: clientRes.data.id });
//           } catch (err) {
//             message.warning(`Failed to create client "${pending.name}" — skipping.`);
//           }
//         }

//         // STEP 3: Collect existing real client IDs
//         const existingClientIds = selectedClients
//           .filter(c => c.id && !c._tempId)
//           .map(c => c.id);

//         const allClientIds = [
//           ...existingClientIds,
//           ...createdClients.map(c => c.realId),
//         ];

//         // STEP 4: Remap services: temp ID → real ID
//         const tempToReal = {};
//         createdClients.forEach(({ tempId, realId }) => {
//           tempToReal[tempId] = realId;
//         });

//         const groupServicesData = Object.keys(services).flatMap(clientKey => {
//           const realClientId = tempToReal[clientKey] || clientKey;
//           return (services[clientKey] || []).map(svc => ({
//             client:       realClientId,
//             main_service: svc.main_service,
//             sub_service:  svc.sub_service,
//             fee:          svc.fee,
//             period:       svc.period,
//             due_date:     svc.due_date ? moment(svc.due_date).format('YYYY-MM-DD') : null,
//           }));
//         });

//         // STEP 5: PATCH group with all clients + services
//         await api.patch(
//           `/clients/client-groups/${newGroupId}/`,
//           { clients: allClientIds, group_services_data: groupServicesData },
//           { headers }
//         );

//         message.success('Client Group created successfully!');
//         setPendingClients([]);
//         onGroupSaved();
//       }

//     } catch (err) {
//       console.error('Submission error:', err);
//       if (err.response?.data) {
//         message.error(`Failed to save: ${JSON.stringify(err.response.data)}`);
//       } else if (err.errorFields) {
//         message.error('Please fill in all required fields.');
//       } else {
//         message.error('Failed to save client group. Please try again.');
//       }
//     } finally {
//       setGroupSaving(false);
//     }
//   };

//   /* ── review table columns ── */
//   const serviceColumns = [
//     {
//       title: 'Main Service',
//       dataIndex: 'main_service',
//       key: 'main_service',
//       render: id => <Tag color="volcano">{getMainServiceName(id)}</Tag>,
//     },
//     {
//       title: 'Sub Service',
//       dataIndex: 'sub_service',
//       key: 'sub_service',
//       render: (subId, record) => <Tag color="green">{getSubServiceName(record.main_service, subId)}</Tag>,
//     },
//     {
//       title: 'Fee',
//       dataIndex: 'fee',
//       key: 'fee',
//       render: fee => fee ? `₹${fee}` : 'N/A',
//     },
//     {
//       title: 'Period',
//       dataIndex: 'period',
//       key: 'period',
//       render: period => <Tag color="processing">{period}</Tag>,
//     },
//     {
//       title: 'Due Date',
//       dataIndex: 'due_date',
//       key: 'due_date',
//       render: date => date ? moment(date).format('YYYY-MM-DD') : 'N/A',
//     },
//   ];

//   /* ── steps config ── */
//   const steps = [
//     {
//       title: 'Group Details',
//       icon: <SolutionOutlined />,
//       content: (
//         <ClientGroupForm
//           form={groupForm}
//           initialValues={groupDetails}
//           groupCategories={groupCategories}
//           spocs={spocs}
//         />
//       ),
//       form: groupForm,
//       onSave: (values) => setGroupDetails(values),
//     },
//     {
//       title: 'Clients in Group',
//       icon: <UsergroupAddOutlined />,
//       content: (
//         <ClientGroupClientsForm
//           form={clientsForm}
//           initialClients={selectedClients}
//           onClientsChange={setSelectedClients}
//           onAddClient={handleAddClient}
//           onUpdateClient={handleUpdateClient}
//           onRemoveClient={handleRemoveClient}
//           allClients={clients}
//         />
//       ),
//       form: clientsForm,
//       onSave: () => {},
//     },
//     {
//       title: 'Services',
//       icon: <ReconciliationOutlined />,
//       content: (
//         <ClientGroupServicesForm
//           form={servicesForm}
//           groupClients={selectedClients}
//           initialValues={services}
//           mainServices={mainServices}
//           subServicesMap={subServicesMap}
//         />
//       ),
//       form: servicesForm,
//       onSave: (values) => setServices(values),
//     },
//     {
//       title: 'Review & Finish',
//       icon: <CheckCircleOutlined />,
//       content: (
//         <>
//           <Typography.Paragraph strong style={{ marginBottom: 20, fontSize: 16 }}>
//             Review and Submit below
//           </Typography.Paragraph>

//           {/* Group summary card */}
//           <Card
//             title={
//               <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', width:'100%' }}>
//                 <div style={{ flex:1 }}/>
//                 <Space align="center" style={{ flexShrink:0 }}>
//                   <Title level={3} style={{ margin:0, whiteSpace:'nowrap' }}>{groupDetails.group_name}</Title>
//                   {groupDetails.group_category && (
//                     <Button
//                       type="primary"
//                       size="small"
//                       icon={getCategoryIcon(getGroupCategoryName(groupDetails.group_category))}
//                       style={{
//                         borderColor:
//                           getGroupCategoryName(groupDetails.group_category) === 'Class A' ? '#e9bc37' :
//                           getGroupCategoryName(groupDetails.group_category) === 'Class B' ? '#607d8b' : '#2196f3',
//                         color:
//                           getGroupCategoryName(groupDetails.group_category) === 'Class A' ? '#000' : '#fff',
//                         backgroundColor:
//                           getGroupCategoryName(groupDetails.group_category) === 'Class A' ? '#e9bc37' :
//                           getGroupCategoryName(groupDetails.group_category) === 'Class B' ? '#607d8b' : '#2196f3',
//                         fontWeight: 'bold',
//                         marginLeft: 16,
//                       }}
//                     >
//                       {getGroupCategoryName(groupDetails.group_category)}
//                     </Button>
//                   )}
//                 </Space>
//                 <div style={{ flex:1 }}/>
//               </div>
//             }
//             bordered={false}
//             style={{ marginBottom:24, boxShadow:'0 2px 8px rgba(0,0,0,.09)' }}
//             styles={{ body: { padding:24 } }}
//           >
//             <Descriptions bordered column={{ xs:1, sm:2, md:3 }}>
//               <Descriptions.Item label="Primary SPOC">
//                 <Tag color="green"><UserOutlined style={{ marginRight:4 }}/>{getSpocName(groupDetails.primary_spoc)}</Tag>
//               </Descriptions.Item>
//               {groupDetails.secondary_spoc && (
//                 <Descriptions.Item label="Secondary SPOC">
//                   <Tag color="geekblue"><UserOutlined style={{ marginRight:4 }}/>{getSpocName(groupDetails.secondary_spoc)}</Tag>
//                 </Descriptions.Item>
//               )}
//               {groupDetails.created_at && (
//                 <Descriptions.Item label="Created At">
//                   {moment(groupDetails.created_at).format('YYYY-MM-DD HH:mm')}
//                 </Descriptions.Item>
//               )}
//               {groupDetails.description && (
//                 <Descriptions.Item label="Description" span={3}>
//                   {groupDetails.description}
//                 </Descriptions.Item>
//               )}
//             </Descriptions>
//           </Card>

//           {/* Clients + services */}
//           <Row gutter={[24, 24]}>
//             <Col span={24}>
//               <Card
//                 title={
//                   <Space style={{ width:'100%', justifyContent:'space-between' }}>
//                     <Title level={4} style={{ margin:0 }}>
//                       <UserOutlined style={{ marginRight:8 }}/>Clients in this Group
//                     </Title>
//                   </Space>
//                 }
//                 bordered={false}
//                 style={{ boxShadow:'0 2px 8px rgba(0,0,0,.09)' }}
//                 styles={{ body: { padding:24 } }}
//               >
//                 {selectedClients?.length > 0 ? (
//                   selectedClients.map(client => {
//                     const clientKey    = client._tempId || client.id;
//                     const clientSvcs   = (services[clientKey] || []).map(s => ({
//                       ...s,
//                       due_date: s.due_date ? moment(s.due_date) : null,
//                     }));

//                     return (
//                       <Card
//                         key={clientKey}
//                         type="inner"
//                         title={
//                           <Space>
//                             <Title level={5} style={{ margin:0 }}>
//                               <UserOutlined style={{ marginRight:4 }}/>
//                               {client.name}
//                               {client._tempId && (
//                                 <Tag color="orange" style={{ marginLeft:8 }}>Pending</Tag>
//                               )}
//                             </Title>
//                           </Space>
//                         }
//                         style={{ marginBottom:16, backgroundColor:'#fafafa' }}
//                         styles={{ body: { padding:16 } }}
//                       >
//                         <Descriptions column={2} size="small" bordered>
//                           {client.email           && <Descriptions.Item label="Email">{client.email}</Descriptions.Item>}
//                           {client.phone           && <Descriptions.Item label="Phone">{client.phone}</Descriptions.Item>}
//                           {client.contact_person  && <Descriptions.Item label="Contact Person">{client.contact_person}</Descriptions.Item>}
//                           {client.nature_of_business && <Descriptions.Item label="Nature of Business">{client.nature_of_business}</Descriptions.Item>}
//                           {client.gstin           && <Descriptions.Item label="GSTIN">{client.gstin}</Descriptions.Item>}
//                           {client.pan             && <Descriptions.Item label="PAN">{client.pan}</Descriptions.Item>}
//                           {client.cin             && <Descriptions.Item label="CIN">{client.cin}</Descriptions.Item>}
//                           {client.tan             && <Descriptions.Item label="TAN">{client.tan}</Descriptions.Item>}
//                           {client.billing_cycle   && <Descriptions.Item label="Billing Cycle">{client.billing_cycle}</Descriptions.Item>}
//                           {client.invoice_date    && <Descriptions.Item label="Invoice Date">{moment(client.invoice_date).format('YYYY-MM-DD')}</Descriptions.Item>}
//                         </Descriptions>

//                         <Divider orientation="left" style={{ margin:'24px 0 16px' }}>
//                           <TagOutlined style={{ marginRight:4 }}/>Services for {client.name}
//                         </Divider>

//                         {clientSvcs.length > 0 ? (
//                           <Table
//                             dataSource={clientSvcs}
//                             columns={serviceColumns}
//                             rowKey={(_, i) => `svc-${clientKey}-${i}`}
//                             pagination={false}
//                             size="small"
//                             bordered
//                             style={{ marginBottom:16 }}
//                           />
//                         ) : (
//                           <Text type="secondary">No services assigned to this client.</Text>
//                         )}
//                       </Card>
//                     );
//                   })
//                 ) : (
//                   <Text type="secondary">No clients assigned to this group.</Text>
//                 )}
//               </Card>
//             </Col>
//           </Row>
//         </>
//       ),
//     },
//   ];

//   /* ── render ── */
//   if (loading || groupSaving) {
//     return (
//       <div style={{ display:'flex', justifyContent:'center', alignItems:'center', minHeight:300, background:'#f0f2f5', borderRadius:8, padding:24 }}>
//         <Spin size="large" tip={groupSaving ? 'Saving group…' : 'Loading…'} />
//       </div>
//     );
//   }

//   return (
//     <div style={{ padding:24, background:'linear-gradient(to right,#f8f9fa,#e0e7ff)', borderRadius:12, boxShadow:'0 4px 10px rgba(0,0,0,.1)' }}>
//       <div style={{ padding:24, minHeight:'calc(100vh - 64px)', borderRadius:8 }}>

//         <Title level={2} style={{ marginBottom:74, color:'#333' }}>
//           {initialGroupData ? 'Edit Client Group' : 'Add Client Group'}
//         </Title>

//         <Card
//           style={{ marginBottom:30, boxShadow:'0 2px 8px rgba(0,0,0,.09)', background:'linear-gradient(to right,#f8f9fa,#e0e7ff)' }}
//           styles={{ body: { padding:24 } }}
//         >
//           <Steps current={currentStep} responsive>
//             {steps.map(item => (
//               <Step key={item.title} title={item.title} icon={item.icon} />
//             ))}
//           </Steps>
//         </Card>

//         <div className="steps-content">
//           {steps[currentStep].content}
//         </div>

//         <div className="steps-action" style={{ marginTop:30, textAlign:'right' }}>
//           {currentStep > 0 && (
//             <Button style={{ margin:'0 8px' }} onClick={handlePrev} disabled={loading || groupSaving}>
//               Previous
//             </Button>
//           )}
//           {currentStep < steps.length - 1 && (
//             <Button type="primary" onClick={handleNext} disabled={loading || groupSaving}>
//               Next
//             </Button>
//           )}
//           {currentStep === steps.length - 1 && (
//             <Button type="primary" onClick={handleFinish} loading={groupSaving} disabled={loading}>
//               {initialGroupData ? 'Update Group' : 'Create Group'}
//             </Button>
//           )}
//         </div>

//       </div>
//     </div>
//   );
// }

// export default ClientGroupManagementView;

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