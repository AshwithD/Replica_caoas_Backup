// import React, { useState, useEffect } from 'react';
// import {
//     Form,
//     Input,
//     Button,
//     Card,
//     Row,
//     Col,
//     Divider,
//     Descriptions,
//     Space,
//     DatePicker,
//     Select,
//     message,
//     Table
// } from 'antd';
// import { MinusCircleOutlined, PlusOutlined, EditOutlined, SaveOutlined } from '@ant-design/icons';
// import dayjs from 'dayjs';
// import { api } from '../services/api'; // Adjust the import path as necessary
// import Title from 'antd/lib/typography/Title';
// import { useAuth } from '../contexts/AuthContext';

// const { TextArea } = Input;
// const { Option } = Select;

// // Define initial state for company details
// const initialCompanyDetails = {
//     companyName: null,
//     companytype: null,
//     natureOfBusiness: null,
//     incorporationDate: null,
//     stateOfRegistration: null,
//     panNo: null,
//     tanNo: null,
//     gstNo: null,
//     cin: null,
//     lutNo: null,
//     lutDate: null,
//     contactPerson: null,
//     contactEmail: null,
//     contactPhone: null,
//     address: null,
//     bankAccountNo: null,
//     ifscCode: null,
//     bankName: null,
//     bankAddress: null,
//     additionalBasicDetails: [],
//     additionalIdentificationDetails: [],
//     additionalContactDetails: [],
//     additionalBankingDetails: [],
//     otherDetails: [],
//     sacDetails: []
// };

// // Main component for the Company Details Form
// export default function CompanyDetailsForm() {
//     const { user } = useAuth();
//     const [companyDetails, setCompanyDetails] = useState(initialCompanyDetails);
//     const [isDataSaved, setIsDataSaved] = useState(true);
//     const [form] = Form.useForm();
//     const [loading, setLoading] = useState(false);

//     // This effect runs once on component mount to fetch data from the backend
//     useEffect(() => {
//         const fetchData = async () => {
//             setLoading(true);
//             try {
//                 const companyRes = await api.get('clients/company/');
//                 const companyData = companyRes.data || initialCompanyDetails;

//                 // Ensure the entire companyData object, including sacDetails, is used to update the state
//                 setCompanyDetails({
//                     ...companyData,
//                     // Parse date strings to dayjs objects if they exist
//                     incorporationDate: companyData.incorporationDate ? dayjs(companyData.incorporationDate) : null,
//                     lutDate: companyData.lutDate ? dayjs(companyData.lutDate) : null,
//                 });

//                 setIsDataSaved(!!companyRes.data?.companyName);
//             } catch (error) {
//                 if (error.response?.status === 404) {
//                     setCompanyDetails(initialCompanyDetails);
//                     setIsDataSaved(false);
//                 } else {
//                     message.error('Failed to fetch company details.');
//                     console.error('Fetch error:', error);
//                 }
//             } finally {
//                 setLoading(false);
//             }
//         };

//         fetchData();
//     }, []);


//     // Handles form submission
//     const onFinish = async (values) => {
//         setLoading(true);
//         try {
//             const formatDynamicFields = (fields) => {
//                 return fields?.map(detail => ({
//                     ...detail,
//                     value: detail.type === 'date' && dayjs.isDayjs(detail.value)
//                         ? detail.value.format('YYYY-MM-DD')
//                         : detail.value,
//                 })) || [];
//             };

//             const payload = {
//                 ...values,
//                 incorporationDate: values.incorporationDate
//                     ? values.incorporationDate.format('YYYY-MM-DD')
//                     : null,
//                 lutDate: values.lutDate
//                     ? values.lutDate.format('YYYY-MM-DD')
//                     : null,
//                 additionalBasicDetails: formatDynamicFields(values.additionalBasicDetails),
//                 additionalIdentificationDetails: formatDynamicFields(values.additionalIdentificationDetails),
//                 additionalContactDetails: formatDynamicFields(values.additionalContactDetails),
//                 additionalBankingDetails: formatDynamicFields(values.additionalBankingDetails),
//                 otherDetails: formatDynamicFields(values.otherDetails),
//                 // Ensure sacDetails are part of the payload being sent to the backend
//                 sacDetails: values.sacDetails || [],
//             };

//             const res = await api.post('clients/company/', payload);

//             if (res.data) {
//                 // Fetch the complete data from the server after a successful save
//                 const companyRes = await api.get('clients/company/');
//                 const companyData = companyRes.data || initialCompanyDetails;

//                 // Update the local state with the new values from the API response
//                 setCompanyDetails({
//                     ...companyData,
//                     // Ensure dates are converted back to dayjs objects for local state
//                     incorporationDate: companyData.incorporationDate ? dayjs(companyData.incorporationDate) : null,
//                     lutDate: companyData.lutDate ? dayjs(companyData.lutDate) : null,
//                 });
//                 setIsDataSaved(true);
//                 message.success('Company details saved successfully!');
//             }
//         } catch (error) {
//             message.error('Failed to save company details.');
//             console.error('Save error:', error);
//         } finally {
//             setLoading(false);
//         }
//     };


//     // Handles edit button click
//     const handleEdit = () => {
//         setIsDataSaved(false);

//         const parseDynamicFields = (fields) => {
//             return fields?.map(detail => ({
//                 ...detail,
//                 value: detail.type === 'date' && detail.value ? dayjs(detail.value) : detail.value,
//             })) || [];
//         };

//         // Set form fields with the current state data for editing
//         form.setFieldsValue({
//             ...companyDetails,
//             incorporationDate: companyDetails?.incorporationDate ? dayjs(companyDetails.incorporationDate) : null,
//             lutDate: companyDetails?.lutDate ? dayjs(companyDetails.lutDate) : null,
//             additionalBasicDetails: parseDynamicFields(companyDetails.additionalBasicDetails),
//             additionalIdentificationDetails: parseDynamicFields(companyDetails.additionalIdentificationDetails),
//             additionalContactDetails: parseDynamicFields(companyDetails.additionalContactDetails),
//             additionalBankingDetails: parseDynamicFields(companyDetails.additionalBankingDetails),
//             otherDetails: parseDynamicFields(companyDetails.otherDetails),
//             sacDetails: parseDynamicFields(companyDetails.sacDetails),
//         });
//     };

//     // A modern and elegant container style
//     const containerStyle = {
//         padding: '0px 24px',
//         maxWidth: '1300px',
//         margin: '0 auto',
//         minHeight: '100vh',
//         fontFamily: 'Roboto, sans-serif',
//     };

//     // A more styled card component
//     const StyledCard = ({ children, title }) => (
//         <Card
//             title={<Title level={4} style={{ margin: 0, fontWeight: 600 }}>{title}</Title>}
//             bordered={false}
//             style={{
//                 borderRadius: '12px',
//                 boxShadow: '0 8px 30px rgba(0, 0, 0, 0.08)',
//                 marginBottom: '24px',
//             }}
//             headStyle={{
//                 backgroundColor: '#f8f9fa',
//                 borderTopLeftRadius: '12px',
//                 borderTopRightRadius: '12px',
//                 display: 'flex',
//                 alignItems: 'center',
//                 flexWrap: 'wrap',
//             }}
//             bodyStyle={{ padding: '24px' }}
//         >
//             {children}
//         </Card>
//     );

//     // Helper function to render a Descriptions.Item only if the value exists and format dates
//     const renderDescriptionItem = (label, value) => {
//         if (value) {
//             let displayValue = value;
//             if (dayjs.isDayjs(value)) {
//                 displayValue = value.format('YYYY-MM-DD');
//             }
//             return (
//                 <Descriptions.Item label={label}>
//                     {displayValue}
//                 </Descriptions.Item>
//             );
//         }
//         return null;
//     };

//     // Reusable component for dynamic fields
//     const DynamicFieldList = ({ name, label, initialValue = 'text' }) => (
//         <>
//             <Form.List name={name}>
//                 {(fields, { add, remove }) => (
//                     <>
//                         {fields.map(({ key, name: fieldName, fieldKey, ...restField }) => (
//                             <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
//                                 <Form.Item
//                                     {...restField}
//                                     name={[fieldName, 'label']}
//                                     fieldKey={[fieldKey, 'label']}
//                                     rules={[{ required: true, message: 'Missing label' }]}
//                                 >
//                                     <Input placeholder="Field Label" style={{ width: 150 }} />
//                                 </Form.Item>
//                                 <Form.Item
//                                     {...restField}
//                                     name={[fieldName, 'type']}
//                                     fieldKey={[fieldKey, 'type']}
//                                     initialValue={initialValue}
//                                     style={{ width: 120 }}
//                                 >
//                                     <Select placeholder="Select type">
//                                         <Option value="text">Text</Option>
//                                         <Option value="date">Date</Option>
//                                     </Select>
//                                 </Form.Item>
//                                 <Form.Item
//                                     {...restField}
//                                     shouldUpdate={(prev, current) => prev[name]?.[fieldName]?.type !== current[name]?.[fieldName]?.type}
//                                     noStyle
//                                 >
//                                     {({ getFieldValue }) => {
//                                         const fieldType = getFieldValue([name, fieldName, 'type']);
//                                         const fieldPlaceholder = fieldType === 'date' ? 'Select Date' : 'Field Value';
//                                         return (
//                                             <Form.Item
//                                                 name={[fieldName, 'value']}
//                                                 fieldKey={[fieldKey, 'value']}
//                                                 rules={[{ required: true, message: `Missing ${fieldPlaceholder}` }]}
//                                                 style={{ flexGrow: 1 }}
//                                             >
//                                                 {fieldType === 'date' ? (
//                                                     <DatePicker style={{ width: '100%' }} placeholder={fieldPlaceholder} />
//                                                 ) : (
//                                                     <Input placeholder={fieldPlaceholder} />
//                                                 )}
//                                             </Form.Item>
//                                         );
//                                     }}
//                                 </Form.Item>
//                                 <MinusCircleOutlined onClick={() => remove(fieldName)} />
//                             </Space>
//                         ))}
//                         <Form.Item>
//                             <Button type="dashed" onClick={() => add({ type: 'text' })} block icon={<PlusOutlined />}>
//                                 {`Add Additional ${label}`}
//                             </Button>
//                         </Form.Item>
//                     </>
//                 )}
//             </Form.List>
//         </>
//     );

//     // Reusable component for rendering dynamic fields in view mode
//     const DynamicDescriptions = ({ title, details }) => {
//         if (!details || details.length === 0) return null;
//         return (
//             <>
//                 <Divider orientation="left" style={{ margin: '32px 0 16px 0' }}>{title}</Divider>
//                 <Descriptions column={1} labelStyle={{ fontWeight: 600, color: '#555' }} contentStyle={{ color: '#333' }}>
//                     {details.map((detail, index) => (
//                         <Descriptions.Item key={index} label={detail.label}>
//                             {/* Format the date value for display */}
//                             {detail.type === 'date' ? dayjs(detail.value).format('YYYY-MM-DD') : detail.value}
//                         </Descriptions.Item>
//                     ))}
//                 </Descriptions>
//             </>
//         );
//     };

//     // Columns for the SAC Table
//     const sacTableColumns = [
//         {
//             title: 'SAC Code',
//             dataIndex: 'code',
//             key: 'code',
//             // style the text to be aligned left
//             onCell: () => ({
//                 style: { textAlign: 'left', width: '130px' }
//             }),
//             render: (text) => <span style={{ fontWeight: 'bold' }}>{text}</span>,
//         },
//         {
//             title: 'SAC Description',
//             dataIndex: 'description',
//             key: 'description',
//             // style the text to be aligned left
//             onCell: () => ({
//                 style: { textAlign: 'left', width: '470px' }
//             }),
//         },
//     ];

//     return (
//         <div style={containerStyle}>
//             <Title level={1} style={{ textAlign: 'center', marginBottom: '40px', fontWeight: 700, color: '#333' }}>
//                 {isDataSaved && companyDetails?.companyName ? companyDetails.companyName : "Manage Company Profile"}
//             </Title>
            
//             {loading ? (
//                 <p>Loading company details...</p>
//             ) : (
//                 <StyledCard title={isDataSaved ? "Company Information" : "Enter Company Details"}>
//                     {isDataSaved ? (
//                         <>
//                             {/* ... (rest of the Descriptions) */}
//                             <Divider orientation="left" style={{ margin: '32px 0 16px 0' }}>Basic Information</Divider>
//                             <Descriptions column={{ xs: 1, sm: 2, md: 3 }} labelStyle={{ fontWeight: 600, color: '#555' }} contentStyle={{ color: '#333' }}>
//                                 {renderDescriptionItem("Company Name", companyDetails.companyName)}
//                                 {renderDescriptionItem("Company Type", companyDetails.companytype)}
//                                 {renderDescriptionItem("Nature of Business", companyDetails.natureOfBusiness)}
//                                 {renderDescriptionItem("Incorporation Date", companyDetails.incorporationDate)}
//                                 {renderDescriptionItem("State of Registration", companyDetails.stateOfRegistration)}
//                             </Descriptions>
//                             <DynamicDescriptions
//                                 title="Additional Basic Details"
//                                 details={companyDetails.additionalBasicDetails}
//                             />

//                             <Divider orientation="left" style={{ margin: '32px 0 16px 0' }}>Legal Identifiers</Divider>
//                             <Descriptions column={{ xs: 1, sm: 2, md: 3 }} labelStyle={{ fontWeight: 600, color: '#555' }} contentStyle={{ color: '#333' }}>
//                                 {renderDescriptionItem("PAN No.", companyDetails.panNo)}
//                                 {renderDescriptionItem("TAN No.", companyDetails.tanNo)}
//                                 {renderDescriptionItem("GST No.", companyDetails.gstNo)}
//                                 {renderDescriptionItem("CIN", companyDetails.cin)}
//                                 {renderDescriptionItem("LUT No.", companyDetails.lutNo)}
//                                 {renderDescriptionItem("LUT Date", companyDetails.lutDate)}
//                             </Descriptions>
//                             <DynamicDescriptions
//                                 title="Additional Identification Details"
//                                 details={companyDetails.additionalIdentificationDetails}
//                             />

//                             <Divider orientation="left" style={{ margin: '32px 0 16px 0' }}>Contact Details</Divider>
//                             <Descriptions column={{ xs: 1, sm: 2, md: 3 }} labelStyle={{ fontWeight: 600, color: '#555' }} contentStyle={{ color: '#333' }}>
//                                 {renderDescriptionItem("Contact Person", companyDetails.contactPerson)}
//                                 {renderDescriptionItem("Contact Email", companyDetails.contactEmail)}
//                                 {renderDescriptionItem("Contact Phone", companyDetails.contactPhone)}
//                                 {renderDescriptionItem("Address", companyDetails.address)}
//                             </Descriptions>
//                             <DynamicDescriptions
//                                 title="Additional Contact Details"
//                                 details={companyDetails.additionalContactDetails}
//                             />

//                             <Divider orientation="left" style={{ margin: '32px 0 16px 0' }}>Banking Details</Divider>
//                             <Descriptions column={{ xs: 1, sm: 2, md: 3 }} labelStyle={{ fontWeight: 600, color: '#555' }} contentStyle={{ color: '#333' }}>
//                                 {renderDescriptionItem("Bank Account No.", companyDetails.bankAccountNo)}
//                                 {renderDescriptionItem("Bank IFSC Code", companyDetails.ifscCode)}
//                                 {renderDescriptionItem("Bank Name", companyDetails.bankName)}
//                                 {renderDescriptionItem("Bank Address", companyDetails.bankAddress)}
//                             </Descriptions>
//                             <DynamicDescriptions
//                                 title="Additional Banking Details"
//                                 details={companyDetails.additionalBankingDetails}
//                             />

//                             <DynamicDescriptions
//                                 title="Other Details"
//                                 details={companyDetails.otherDetails}
//                             />

//                             {/* Corrected SAC Information Display to use Table component */}
//                             {companyDetails.sacDetails && companyDetails.sacDetails.length > 0 && (
//                                 <>
//                                     <Divider orientation="left" style={{ margin: '32px 0 16px 0' }}>SAC Information</Divider>
//                                     <Table
//                                         dataSource={companyDetails.sacDetails}
//                                         columns={sacTableColumns}
//                                         pagination={false}
//                                         rowKey="code"
//                                         showHeader={true}
//                                         style={{ marginBottom: '24px', maxWidth: '600px' }}
//                                     />
//                                 </>
//                             )}
//                             {(user?.role === "Admin" || user?.role === "Founder") && (
//                                 <Row justify="end" style={{ marginTop: '20px' }}>
//                                     <Col>
//                                     <Space size="middle">
//                                         <Button type="default" icon={<EditOutlined />} onClick={handleEdit}>
//                                         Edit Details
//                                         </Button>
//                                     </Space>
//                                     </Col>
//                                 </Row>
//                             )}
//                         </>
//                     ) : (
//                         <Form
//                             form={form}
//                             layout="vertical"
//                             onFinish={onFinish}
//                             initialValues={{
//                                 ...companyDetails,
//                                 // Ensure the form is initialized with the sacDetails from the state
//                                 sacDetails: companyDetails.sacDetails || []
//                             }}
//                         >
//                             <Divider orientation="left" style={{ fontWeight: 600 }}>Basic Information</Divider>
//                             <Row gutter={24}>
//                                 <Col xs={24} md={12} lg={8}>
//                                     <Form.Item name="companyName" label="Company Name" rules={[{ required: true, message: 'Please enter the company name!' }]}>
//                                         <Input placeholder="Enter company name" />
//                                     </Form.Item>
//                                 </Col>
//                                 <Col xs={24} md={12} lg={8}>
//                                     <Form.Item name="companytype" label="Company Type">
//                                         <Input placeholder="e.g., Chartered Accountants" />
//                                     </Form.Item>
//                                 </Col>
//                                 <Col xs={24} md={12} lg={8}>
//                                     <Form.Item name="natureOfBusiness" label="Nature of Business">
//                                         <Input placeholder="e.g., IT Services, Manufacturing" />
//                                     </Form.Item>
//                                 </Col>
//                                 <Col xs={24} md={12} lg={8}>
//                                     <Form.Item name="incorporationDate" label="Incorporation Date">
//                                         <DatePicker style={{ width: '100%' }} />
//                                     </Form.Item>
//                                 </Col>
//                                 <Col xs={24} md={12} lg={8}>
//                                     <Form.Item name="stateOfRegistration" label="State of Registration">
//                                         <Input placeholder="e.g., Maharashtra" />
//                                     </Form.Item>
//                                 </Col>
//                             </Row>
//                             <DynamicFieldList name="additionalBasicDetails" label="Basic Detail" />

//                             <Divider orientation="left" style={{ fontWeight: 600, marginTop: '32px' }}>Legal Identifiers</Divider>
//                             <Row gutter={24}>
//                                 <Col xs={24} md={12} lg={8}>
//                                     <Form.Item name="panNo" label="PAN No." rules={[{ required: true, message: 'Please enter the PAN number!' }]}>
//                                         <Input placeholder="Enter PAN number" />
//                                     </Form.Item>
//                                 </Col>
//                                 <Col xs={24} md={12} lg={8}>
//                                     <Form.Item name="gstNo" label="GST No." rules={[{ required: true, message: 'Please enter the GST number!' }]}>
//                                         <Input placeholder="Enter GST number" />
//                                     </Form.Item>
//                                 </Col>
//                                 <Col xs={24} md={12} lg={8}>
//                                     <Form.Item name="tanNo" label="TAN No.">
//                                         <Input placeholder="Enter TAN number" />
//                                     </Form.Item>
//                                 </Col>
//                                 <Col xs={24} md={12} lg={8}>
//                                     <Form.Item name="cin" label="CIN">
//                                         <Input placeholder="Enter CIN" />
//                                     </Form.Item>
//                                 </Col>
//                                 <Col xs={24} md={12} lg={8}>
//                                     <Form.Item name="lutNo" label="LUT No.">
//                                         <Input placeholder="Enter LUT number" />
//                                     </Form.Item>
//                                 </Col>
//                                 <Col xs={24} md={12} lg={8}>
//                                     <Form.Item name="lutDate" label="LUT Date">
//                                         <DatePicker style={{ width: '100%' }} />
//                                     </Form.Item>
//                                 </Col>
//                             </Row>
//                             <DynamicFieldList name="additionalIdentificationDetails" label="Identification Number" />

//                             <Divider orientation="left" style={{ fontWeight: 600, marginTop: '32px' }}>Contact Details</Divider>
//                             <Row gutter={24}>
//                                 <Col xs={24} md={8}>
//                                     <Form.Item name="contactPerson" label="Contact Person">
//                                         <Input placeholder="Enter contact person's name" />
//                                     </Form.Item>
//                                 </Col>
//                                 <Col xs={24} md={8}>
//                                     <Form.Item name="contactEmail" label="Contact Email" rules={[{ type: 'email', message: 'The input is not a valid email!' }]}>
//                                         <Input placeholder="Enter email address" />
//                                     </Form.Item>
//                                 </Col>
//                                 <Col xs={24} md={8}>
//                                     <Form.Item name="contactPhone" label="Contact Phone">
//                                         <Input placeholder="Enter phone number" />
//                                     </Form.Item>
//                                 </Col>
//                                 <Col xs={24}>
//                                     <Form.Item name="address" label="Address">
//                                         <TextArea rows={4} placeholder="Enter full address" />
//                                     </Form.Item>
//                                 </Col>
//                             </Row>
//                             <DynamicFieldList name="additionalContactDetails" label="Contact Detail" />

//                             <Divider orientation="left" style={{ fontWeight: 600, marginTop: '32px' }}>Banking Details</Divider>
//                             <Row gutter={24}>
//                                 <Col xs={24} md={12} lg={8}>
//                                     <Form.Item name="bankAccountNo" label="Bank Account No.">
//                                         <Input placeholder="Enter bank account number" />
//                                     </Form.Item>
//                                 </Col>
//                                 <Col xs={24} md={12} lg={8}>
//                                     <Form.Item name="ifscCode" label="IFSC Code">
//                                         <Input placeholder="Enter IFSC code" />
//                                     </Form.Item>
//                                 </Col>
//                                 <Col xs={24} md={12} lg={8}>
//                                     <Form.Item name="bankName" label="Bank Name">
//                                         <Input placeholder="Enter bank name" />
//                                     </Form.Item>
//                                 </Col>
//                                 <Col xs={24}>
//                                     <Form.Item name="bankAddress" label="Bank Address">
//                                         <Input placeholder="Enter bank address" />
//                                     </Form.Item>
//                                 </Col>
//                             </Row>
//                             <DynamicFieldList name="additionalBankingDetails" label="Banking Detail" />

//                             <Divider orientation="left" style={{ fontWeight: 600, marginTop: '32px' }}>Other Details</Divider>
//                             <DynamicFieldList name="otherDetails" label="Other Detail" />

//                             <Divider orientation="left" style={{ fontWeight: 600, marginTop: '32px' }}>SAC Information</Divider>
//                             {/* This is the form list for SAC details */}
//                             <Form.List name="sacDetails">
//                                 {(fields, { add, remove }) => (
//                                     <>
//                                         {fields.map(({ key, name, ...restField }) => (
//                                             <Row gutter={16} key={key} align="middle">
//                                                 <Col xs={24} md={3}>
//                                                     <Form.Item
//                                                         {...restField}
//                                                         name={[name, 'code']}
//                                                         label="SAC Code"
//                                                         rules={[{ required: true, message: 'Please enter SAC code' }]}
//                                                     >
//                                                         <Input placeholder="Enter SAC code" />
//                                                     </Form.Item>
//                                                 </Col>
//                                                 <Col xs={24} md={8}>
//                                                     <Form.Item
//                                                         {...restField}
//                                                         name={[name, 'description']}
//                                                         label="SAC Description"
//                                                         rules={[{ required: true, message: 'Please enter SAC description' }]}
//                                                     >
//                                                         <Input placeholder="Enter SAC description" />
//                                                     </Form.Item>
//                                                 </Col>
//                                                 <Col xs={24} md={4}>
//                                                     <MinusCircleOutlined onClick={() => remove(name)} />
//                                                 </Col>
//                                             </Row>
//                                         ))}
//                                         <Form.Item>
//                                             <Button type="dashed" onClick={() => add()} block>
//                                                 + Add SAC
//                                             </Button>
//                                         </Form.Item>
//                                     </>
//                                 )}
//                             </Form.List>

//                             <Form.Item style={{ marginTop: '24px' }}>
//                                 <Button type="primary" htmlType="submit" size="large" icon={<SaveOutlined />} loading={loading}>
//                                     Save Details
//                                 </Button>
//                             </Form.Item>
//                         </Form>
//                     )}
//                 </StyledCard>
//             )}
//         </div>
//     );
// }


// CompanyDetailsForm.jsx — Fixed version
// KEY FIX: Form is always rendered (never unmounted), hidden via display:none when in view mode
// This prevents focus loss on every keystroke (the "1 digit" bug)
import React, { useState, useEffect } from 'react';
import {
    Form, Input, Button, Card, Row, Col, Divider,
    Descriptions, Space, DatePicker, Select, message, Table
} from 'antd';
import { MinusCircleOutlined, PlusOutlined, EditOutlined, SaveOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { api } from '../services/api';
import Title from 'antd/lib/typography/Title';
import { useAuth } from '../contexts/AuthContext';

const { TextArea } = Input;
const { Option } = Select;

const initialCompanyDetails = {
    companyName: null, companytype: null, natureOfBusiness: null,
    incorporationDate: null, stateOfRegistration: null, panNo: null,
    tanNo: null, gstNo: null, cin: null, lutNo: null, lutDate: null,
    contactPerson: null, contactEmail: null, contactPhone: null, address: null,
    bankAccountNo: null, ifscCode: null, bankName: null, bankAddress: null,
    additionalBasicDetails: [], additionalIdentificationDetails: [],
    additionalContactDetails: [], additionalBankingDetails: [],
    otherDetails: [], sacDetails: [],
};

export default function CompanyDetailsForm() {
    const { user } = useAuth();
    const [companyDetails, setCompanyDetails] = useState(initialCompanyDetails);
    const [isDataSaved, setIsDataSaved] = useState(true);
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const companyRes = await api.get('clients/company/');
                const companyData = companyRes.data || initialCompanyDetails;
                const parsed = {
                    ...companyData,
                    incorporationDate: companyData.incorporationDate ? dayjs(companyData.incorporationDate) : null,
                    lutDate: companyData.lutDate ? dayjs(companyData.lutDate) : null,
                };
                setCompanyDetails(parsed);
                setIsDataSaved(!!companyRes.data?.companyName);
                // If no saved data, populate form immediately
                if (!companyRes.data?.companyName) {
                    form.setFieldsValue(parsed);
                }
            } catch (error) {
                if (error.response?.status === 404) {
                    setCompanyDetails(initialCompanyDetails);
                    setIsDataSaved(false);
                    form.setFieldsValue(initialCompanyDetails);
                } else {
                    message.error('Failed to fetch company details.');
                }
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const parseDynamicFields = (fields) => fields?.map(d => ({
        ...d,
        value: d.type === 'date' && d.value ? dayjs(d.value) : d.value,
    })) || [];

    const formatDynamicFields = (fields) => fields?.map(d => ({
        ...d,
        value: d.type === 'date' && dayjs.isDayjs(d.value) ? d.value.format('YYYY-MM-DD') : d.value,
    })) || [];

    const onFinish = async (values) => {
        setLoading(true);
        try {
            const payload = {
                ...values,
                incorporationDate: values.incorporationDate?.format('YYYY-MM-DD') || null,
                lutDate: values.lutDate?.format('YYYY-MM-DD') || null,
                additionalBasicDetails: formatDynamicFields(values.additionalBasicDetails),
                additionalIdentificationDetails: formatDynamicFields(values.additionalIdentificationDetails),
                additionalContactDetails: formatDynamicFields(values.additionalContactDetails),
                additionalBankingDetails: formatDynamicFields(values.additionalBankingDetails),
                otherDetails: formatDynamicFields(values.otherDetails),
                sacDetails: values.sacDetails || [],
            };
            const res = await api.post('clients/company/', payload);
            if (res.data) {
                const companyRes = await api.get('clients/company/');
                const companyData = companyRes.data || initialCompanyDetails;
                const parsed = {
                    ...companyData,
                    incorporationDate: companyData.incorporationDate ? dayjs(companyData.incorporationDate) : null,
                    lutDate: companyData.lutDate ? dayjs(companyData.lutDate) : null,
                };
                setCompanyDetails(parsed);
                setIsDataSaved(true);
                message.success('Company details saved successfully!');
            }
        } catch (error) {
            message.error('Failed to save company details.');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = () => {
        // Populate form BEFORE switching to edit mode
        form.setFieldsValue({
            ...companyDetails,
            incorporationDate: companyDetails?.incorporationDate ? dayjs(companyDetails.incorporationDate) : null,
            lutDate: companyDetails?.lutDate ? dayjs(companyDetails.lutDate) : null,
            additionalBasicDetails: parseDynamicFields(companyDetails.additionalBasicDetails),
            additionalIdentificationDetails: parseDynamicFields(companyDetails.additionalIdentificationDetails),
            additionalContactDetails: parseDynamicFields(companyDetails.additionalContactDetails),
            additionalBankingDetails: parseDynamicFields(companyDetails.additionalBankingDetails),
            otherDetails: parseDynamicFields(companyDetails.otherDetails),
            sacDetails: companyDetails.sacDetails || [],
        });
        setIsDataSaved(false);  // Switch to edit mode AFTER setting values
    };

    const containerStyle = {
        padding: '0px 24px', maxWidth: '1300px', margin: '0 auto',
        minHeight: '100vh', fontFamily: 'Roboto, sans-serif',
    };

    const StyledCard = ({ children, title }) => (
        <Card
            title={<Title level={4} style={{ margin: 0, fontWeight: 600 }}>{title}</Title>}
            bordered={false}
            style={{ borderRadius:'12px', boxShadow:'0 8px 30px rgba(0,0,0,0.08)', marginBottom:'24px' }}
            headStyle={{ backgroundColor:'#f8f9fa', borderTopLeftRadius:'12px', borderTopRightRadius:'12px' }}
            bodyStyle={{ padding:'24px' }}
        >{children}</Card>
    );

    const renderDescriptionItem = (label, value) => {
        if (!value) return null;
        const displayValue = dayjs.isDayjs(value) ? value.format('YYYY-MM-DD') : value;
        return <Descriptions.Item label={label}>{displayValue}</Descriptions.Item>;
    };

    const DynamicDescriptions = ({ title, details }) => {
        if (!details?.length) return null;
        return (
            <>
                <Divider orientation="left" style={{ margin:'32px 0 16px 0' }}>{title}</Divider>
                <Descriptions column={1} labelStyle={{ fontWeight:600, color:'#555' }} contentStyle={{ color:'#333' }}>
                    {details.map((detail, i) => (
                        <Descriptions.Item key={i} label={detail.label}>
                            {detail.type === 'date' ? dayjs(detail.value).format('YYYY-MM-DD') : detail.value}
                        </Descriptions.Item>
                    ))}
                </Descriptions>
            </>
        );
    };

    const DynamicFieldList = ({ name, label }) => (
        <Form.List name={name}>
            {(fields, { add, remove }) => (
                <>
                    {fields.map(({ key, name: fieldName, ...restField }) => (
                        <Space key={key} style={{ display:'flex', marginBottom:8 }} align="baseline">
                            <Form.Item {...restField} name={[fieldName,'label']} rules={[{ required:true, message:'Missing label' }]}>
                                <Input placeholder="Field Label" style={{ width:150 }} />
                            </Form.Item>
                            <Form.Item {...restField} name={[fieldName,'type']} initialValue="text" style={{ width:120 }}>
                                <Select placeholder="Select type">
                                    <Option value="text">Text</Option>
                                    <Option value="date">Date</Option>
                                </Select>
                            </Form.Item>
                            <Form.Item
                                shouldUpdate={(prev, current) =>
                                    prev[name]?.[fieldName]?.type !== current[name]?.[fieldName]?.type}
                                noStyle
                            >
                                {({ getFieldValue }) => {
                                    const fieldType = getFieldValue([name, fieldName, 'type']);
                                    return (
                                        <Form.Item name={[fieldName,'value']}
                                            rules={[{ required:true, message:'Missing value' }]}
                                            style={{ flexGrow:1 }}>
                                            {fieldType === 'date'
                                                ? <DatePicker style={{ width:'100%' }} />
                                                : <Input placeholder="Field Value" />}
                                        </Form.Item>
                                    );
                                }}
                            </Form.Item>
                            <MinusCircleOutlined onClick={() => remove(fieldName)} />
                        </Space>
                    ))}
                    <Form.Item>
                        <Button type="dashed" onClick={() => add({ type:'text' })} block icon={<PlusOutlined />}>
                            {`Add Additional ${label}`}
                        </Button>
                    </Form.Item>
                </>
            )}
        </Form.List>
    );

    const sacTableColumns = [
        { title:'SAC Code', dataIndex:'code', key:'code',
          render: t => <span style={{ fontWeight:'bold' }}>{t}</span>,
          onCell: () => ({ style:{ textAlign:'left', width:'130px' } }) },
        { title:'SAC Description', dataIndex:'description', key:'description',
          onCell: () => ({ style:{ textAlign:'left', width:'470px' } }) },
    ];

    return (
        <div style={containerStyle}>
            <Title level={1} style={{ textAlign:'center', marginBottom:'40px', fontWeight:700, color:'#333' }}>
                {isDataSaved && companyDetails?.companyName ? companyDetails.companyName : "Manage Company Profile"}
            </Title>

            {loading ? <p>Loading company details...</p> : (
                <StyledCard title={isDataSaved ? "Company Information" : "Enter Company Details"}>

                    {/* ── VIEW MODE ── */}
                    {isDataSaved && (
                        <>
                            <Divider orientation="left" style={{ margin:'32px 0 16px 0' }}>Basic Information</Divider>
                            <Descriptions column={{ xs:1, sm:2, md:3 }} labelStyle={{ fontWeight:600, color:'#555' }} contentStyle={{ color:'#333' }}>
                                {renderDescriptionItem("Company Name", companyDetails.companyName)}
                                {renderDescriptionItem("Company Type", companyDetails.companytype)}
                                {renderDescriptionItem("Nature of Business", companyDetails.natureOfBusiness)}
                                {renderDescriptionItem("Incorporation Date", companyDetails.incorporationDate)}
                                {renderDescriptionItem("State of Registration", companyDetails.stateOfRegistration)}
                            </Descriptions>
                            <DynamicDescriptions title="Additional Basic Details" details={companyDetails.additionalBasicDetails} />

                            <Divider orientation="left" style={{ margin:'32px 0 16px 0' }}>Legal Identifiers</Divider>
                            <Descriptions column={{ xs:1, sm:2, md:3 }} labelStyle={{ fontWeight:600, color:'#555' }} contentStyle={{ color:'#333' }}>
                                {renderDescriptionItem("PAN No.", companyDetails.panNo)}
                                {renderDescriptionItem("TAN No.", companyDetails.tanNo)}
                                {renderDescriptionItem("GST No.", companyDetails.gstNo)}
                                {renderDescriptionItem("CIN", companyDetails.cin)}
                                {renderDescriptionItem("LUT No.", companyDetails.lutNo)}
                                {renderDescriptionItem("LUT Date", companyDetails.lutDate)}
                            </Descriptions>
                            <DynamicDescriptions title="Additional Identification Details" details={companyDetails.additionalIdentificationDetails} />

                            <Divider orientation="left" style={{ margin:'32px 0 16px 0' }}>Contact Details</Divider>
                            <Descriptions column={{ xs:1, sm:2, md:3 }} labelStyle={{ fontWeight:600, color:'#555' }} contentStyle={{ color:'#333' }}>
                                {renderDescriptionItem("Contact Person", companyDetails.contactPerson)}
                                {renderDescriptionItem("Contact Email", companyDetails.contactEmail)}
                                {renderDescriptionItem("Contact Phone", companyDetails.contactPhone)}
                                {renderDescriptionItem("Address", companyDetails.address)}
                            </Descriptions>
                            <DynamicDescriptions title="Additional Contact Details" details={companyDetails.additionalContactDetails} />

                            <Divider orientation="left" style={{ margin:'32px 0 16px 0' }}>Banking Details</Divider>
                            <Descriptions column={{ xs:1, sm:2, md:3 }} labelStyle={{ fontWeight:600, color:'#555' }} contentStyle={{ color:'#333' }}>
                                {renderDescriptionItem("Bank Account No.", companyDetails.bankAccountNo)}
                                {renderDescriptionItem("Bank IFSC Code", companyDetails.ifscCode)}
                                {renderDescriptionItem("Bank Name", companyDetails.bankName)}
                                {renderDescriptionItem("Bank Address", companyDetails.bankAddress)}
                            </Descriptions>
                            <DynamicDescriptions title="Additional Banking Details" details={companyDetails.additionalBankingDetails} />
                            <DynamicDescriptions title="Other Details" details={companyDetails.otherDetails} />

                            {companyDetails.sacDetails?.length > 0 && (
                                <>
                                    <Divider orientation="left" style={{ margin:'32px 0 16px 0' }}>SAC Information</Divider>
                                    <Table dataSource={companyDetails.sacDetails} columns={sacTableColumns}
                                        pagination={false} rowKey="code"
                                        style={{ marginBottom:'24px', maxWidth:'600px' }} />
                                </>
                            )}

                            {(user?.role === "Admin" || user?.role === "Founder") && (
                                <Row justify="end" style={{ marginTop:'20px' }}>
                                    <Col>
                                        <Button type="default" icon={<EditOutlined />} onClick={handleEdit}>
                                            Edit Details
                                        </Button>
                                    </Col>
                                </Row>
                            )}
                        </>
                    )}

                    {/* ── EDIT/CREATE MODE ── 
                        KEY FIX: Form is always in the DOM but hidden when not needed.
                        This prevents unmount/remount on every keystroke which caused focus loss. */}
                    <div style={{ display: isDataSaved ? 'none' : 'block' }}>
                        <Form form={form} layout="vertical" onFinish={onFinish}>

                            <Divider orientation="left" style={{ fontWeight:600 }}>Basic Information</Divider>
                            <Row gutter={24}>
                                <Col xs={24} md={12} lg={8}>
                                    <Form.Item name="companyName" label="Company Name" rules={[{ required:true, message:'Please enter the company name!' }]}>
                                        <Input placeholder="Enter company name" />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} md={12} lg={8}>
                                    <Form.Item name="companytype" label="Company Type">
                                        <Input placeholder="e.g., Chartered Accountants" />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} md={12} lg={8}>
                                    <Form.Item name="natureOfBusiness" label="Nature of Business">
                                        <Input placeholder="e.g., IT Services, Manufacturing" />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} md={12} lg={8}>
                                    <Form.Item name="incorporationDate" label="Incorporation Date">
                                        <DatePicker style={{ width:'100%' }} />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} md={12} lg={8}>
                                    <Form.Item name="stateOfRegistration" label="State of Registration">
                                        <Input placeholder="e.g., Maharashtra" />
                                    </Form.Item>
                                </Col>
                            </Row>
                            <DynamicFieldList name="additionalBasicDetails" label="Basic Detail" />

                            <Divider orientation="left" style={{ fontWeight:600, marginTop:'32px' }}>Legal Identifiers</Divider>
                            <Row gutter={24}>
                                <Col xs={24} md={12} lg={8}>
                                    <Form.Item name="panNo" label="PAN No." rules={[{ required:true, message:'Please enter the PAN number!' }]}>
                                        <Input placeholder="Enter PAN number" />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} md={12} lg={8}>
                                    <Form.Item name="gstNo" label="GST No." rules={[{ required:true, message:'Please enter the GST number!' }]}>
                                        <Input placeholder="Enter GST number" />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} md={12} lg={8}>
                                    <Form.Item name="tanNo" label="TAN No.">
                                        <Input placeholder="Enter TAN number" />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} md={12} lg={8}>
                                    <Form.Item name="cin" label="CIN">
                                        <Input placeholder="Enter CIN" />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} md={12} lg={8}>
                                    <Form.Item name="lutNo" label="LUT No.">
                                        <Input placeholder="Enter LUT number" />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} md={12} lg={8}>
                                    <Form.Item name="lutDate" label="LUT Date">
                                        <DatePicker style={{ width:'100%' }} />
                                    </Form.Item>
                                </Col>
                            </Row>
                            <DynamicFieldList name="additionalIdentificationDetails" label="Identification Number" />

                            <Divider orientation="left" style={{ fontWeight:600, marginTop:'32px' }}>Contact Details</Divider>
                            <Row gutter={24}>
                                <Col xs={24} md={8}>
                                    <Form.Item name="contactPerson" label="Contact Person">
                                        <Input placeholder="Enter contact person's name" />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} md={8}>
                                    <Form.Item name="contactEmail" label="Contact Email" rules={[{ type:'email', message:'Not a valid email!' }]}>
                                        <Input placeholder="Enter email address" />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} md={8}>
                                    <Form.Item name="contactPhone" label="Contact Phone">
                                        <Input placeholder="Enter phone number" />
                                    </Form.Item>
                                </Col>
                                <Col xs={24}>
                                    <Form.Item name="address" label="Address">
                                        <TextArea rows={4} placeholder="Enter full address" />
                                    </Form.Item>
                                </Col>
                            </Row>
                            <DynamicFieldList name="additionalContactDetails" label="Contact Detail" />

                            <Divider orientation="left" style={{ fontWeight:600, marginTop:'32px' }}>Banking Details</Divider>
                            <Row gutter={24}>
                                <Col xs={24} md={12} lg={8}>
                                    <Form.Item name="bankAccountNo" label="Bank Account No.">
                                        <Input placeholder="Enter bank account number" />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} md={12} lg={8}>
                                    <Form.Item name="ifscCode" label="IFSC Code">
                                        <Input placeholder="Enter IFSC code" />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} md={12} lg={8}>
                                    <Form.Item name="bankName" label="Bank Name">
                                        <Input placeholder="Enter bank name" />
                                    </Form.Item>
                                </Col>
                                <Col xs={24}>
                                    <Form.Item name="bankAddress" label="Bank Address">
                                        <Input placeholder="Enter bank address" />
                                    </Form.Item>
                                </Col>
                            </Row>
                            <DynamicFieldList name="additionalBankingDetails" label="Banking Detail" />

                            <Divider orientation="left" style={{ fontWeight:600, marginTop:'32px' }}>Other Details</Divider>
                            <DynamicFieldList name="otherDetails" label="Other Detail" />

                            <Divider orientation="left" style={{ fontWeight:600, marginTop:'32px' }}>SAC Information</Divider>
                            <Form.List name="sacDetails">
                                {(fields, { add, remove }) => (
                                    <>
                                        {fields.map(({ key, name, ...restField }) => (
                                            <Row gutter={16} key={key} align="middle">
                                                <Col xs={24} md={3}>
                                                    <Form.Item {...restField} name={[name,'code']} label="SAC Code"
                                                        rules={[{ required:true, message:'Please enter SAC code' }]}>
                                                        <Input placeholder="Enter SAC code" />
                                                    </Form.Item>
                                                </Col>
                                                <Col xs={24} md={8}>
                                                    <Form.Item {...restField} name={[name,'description']} label="SAC Description"
                                                        rules={[{ required:true, message:'Please enter SAC description' }]}>
                                                        <Input placeholder="Enter SAC description" />
                                                    </Form.Item>
                                                </Col>
                                                <Col xs={24} md={4}>
                                                    <MinusCircleOutlined onClick={() => remove(name)} />
                                                </Col>
                                            </Row>
                                        ))}
                                        <Form.Item>
                                            <Button type="dashed" onClick={() => add()} block>+ Add SAC</Button>
                                        </Form.Item>
                                    </>
                                )}
                            </Form.List>

                            <Form.Item style={{ marginTop:'24px' }}>
                                <Button type="primary" htmlType="submit" size="large"
                                    icon={<SaveOutlined />} loading={loading}>
                                    Save Details
                                </Button>
                            </Form.Item>
                        </Form>
                    </div>
                </StyledCard>
            )}
        </div>
    );
}