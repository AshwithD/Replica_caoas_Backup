
// D:\Onging Projects\HRMS\frontend\src\pages\clients\ClientManagement\ClientGroupDetailView.jsx

import React, { useState, useEffect } from 'react';
import {
  Typography,
  Card,
  Descriptions,
  Row,
  Col,
  Space,
  Divider,
  Tag,
  Button,
  message,
  Table,
  Modal,
  Form,
  Select,
  Input,
  Switch,
  Spin,
  Checkbox,
  Avatar,
  DatePicker,
} from 'antd';

import {
  ArrowLeftOutlined,
  EditOutlined,
  InfoCircleOutlined,
  UserOutlined,
  TagOutlined,
  CalendarOutlined,
  PlusOutlined,
  CrownOutlined,
  GoldOutlined,
  StarOutlined,
} from '@ant-design/icons';

import dayjs from 'dayjs';
import moment from 'moment';
import { api } from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';
import AddServiceModalForm from './AddServiceModalForm';
import AddClientModalForm from './AddClientModalForm';

const { Title, Text } = Typography;
const { Option } = Select;

/* ---------------- UI STYLES ---------------- */

const PAGE_BG = {
  padding: 24,
  minHeight: '100vh',
  background: 'linear-gradient(135deg, #eef2ff, #f8fafc, #ecfeff)',
};

const CARD = {
  borderRadius: 14,
  boxShadow: '0 10px 28px rgba(0,0,0,0.07)',
};

const INNER_CARD = {
  borderRadius: 12,
  background: 'linear-gradient(180deg, #ffffff, #f9fafb)',
};

/* ---------------- COMPONENT ---------------- */

function ClientGroupDetailView({
  group,
  selectedClientId,
  allClients,
  allGroupCategories,
  allMainServices,
  allSubServicesMap,
  assignedSubServiceIds,
  allSubServices,
  allSpocs,
  onBack,
  onEditGroup,
  onGroupDataRefreshed,
  isEditMode,
  onToggleEditMode,
}) {
  const { authToken } = useAuth();
  const token = authToken || localStorage.getItem('token');

  const [isEditServiceModalVisible, setIsEditServiceModalVisible] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [isAddServiceModalVisible, setIsAddServiceModalVisible] = useState(false);
  const [clientForNewService, setClientForNewService] = useState(null);

  const [isAddClientModalVisible, setIsAddClientModalVisible] = useState(false);
  const [isEditClientModalVisible, setIsEditClientModalVisible] = useState(false);
  const [editingClient, setEditingClient] = useState(null);

  const [isEditGroupDetailsModalVisible, setIsEditGroupDetailsModalVisible] = useState(false);
  const [editGroupDetailsForm] = Form.useForm();
  const [groupDetailsSaving, setGroupDetailsSaving] = useState(false);

  const [assignedSubServiceIdsForClient, setAssignedSubServiceIdsForClient] = useState([]);
  const [isGroupActive, setIsGroupActive] = useState(group?.is_active ?? true);

  useEffect(() => {
    if (group) setIsGroupActive(group.is_active);
  }, [group]);

  if (!group) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  /* ---------------- HELPERS ---------------- */

  const getSpocName = (id) => {
    const spoc = allSpocs.find((s) => s.id === id);
    return spoc ? spoc.name || spoc.email : 'N/A';
  };

  const getMainServiceName = (service) => {
    if (!service) return 'N/A';
    const id = typeof service === 'object' ? service.id : service;
    const found = allMainServices.find((s) => s.id == id);
    return found ? found.name : 'N/A';
  };

  const getSubServiceName = (mainId, subId) => {
    const list = allSubServicesMap[mainId] || [];
    const sub = list.find((s) => s.id === subId);
    return sub ? sub.name : 'N/A';
  };

  const hasValue = (v) =>
    v !== null && v !== undefined && String(v).trim() !== '';

  /* ---------------- API HANDLERS ---------------- */

  const handleGroupActiveToggle = async (checked) => {
    try {
      await api.patch(
        `/clients/client-groups/${group.id}/`,
        { is_active: checked },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      message.success(`Group marked ${checked ? 'Active' : 'Inactive'}`);
      setIsGroupActive(checked);
      onGroupDataRefreshed?.({ ...group, is_active: checked });
    } catch {
      message.error('Failed to update group status');
      setIsGroupActive(!checked);
    }
  };

  const handleClientActiveToggle = async (client, checked) => {
    try {
      await api.patch(
        `/clients/clients/${client.id}/`,
        { is_active: checked },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      message.success(`Client ${checked ? 'Activated' : 'Deactivated'}`);
      onGroupDataRefreshed?.(group);
    } catch {
      message.error('Failed to update client status');
    }
  };

  const handleServiceActiveToggle = async (record, checked) => {
    try {
      await api.patch(
        `/clients/client-group-services/${record.id}/`,
        { is_active: checked },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      message.success('Service status updated');
      onGroupDataRefreshed?.(group);
    } catch {
      message.error('Failed to update service status');
    }
  };

  /* ---------------- SERVICE TABLE COLUMNS ---------------- */

  const serviceColumns = [
    {
      title: 'Main Service',
      dataIndex: 'main_service',
      render: (v) => getMainServiceName(v),
    },
    {
      title: 'Sub Service',
      dataIndex: 'sub_service',
      render: (_, r) => getSubServiceName(r.main_service, r.sub_service),
    },
    {
      title: 'Period',
      render: (_, r) => {
        const subs = allSubServicesMap[r.main_service] || [];
        const sub = subs.find((s) => s.id === r.sub_service);
        return sub?.period || '-';
      },
    },
    {
      title: 'Due Date',
      dataIndex: 'due_date',
      render: (date, record) => {
        if (!date || !record.period) return '-';
        const d = moment(date);
        const day = d.format('DD');
        const month = d.format('MMM');
        switch (record.period) {
          case 'Monthly':
            return `${day} every month`;
          case 'Quarterly':
            return [0, 3, 6, 9]
              .map((i) => d.clone().month(i).format('MMM-DD'))
              .join(', ');
          case 'Half-Yearly':
            return `${month}-${day}, ${d.clone().add(6, 'months').format('MMM-DD')}`;
          case 'Annually':
            return `${month}-${day}`;
          default:
            return '-';
        }
      },
    },
    {
      title: 'Status',
      align: 'center',
      render: (_, r) => {
        if (isEditMode) {
          return (
            <Tag
              color={r.is_active ? 'success' : 'error'}
              style={{ borderRadius: 20, fontWeight: 600 }}
            >
              {r.is_active ? '🟢' : '🔴'}
            </Tag>
          );
        }
        return (
          <Tag
            color={r.is_active ? 'success' : 'error'}
            style={{ borderRadius: 20, fontWeight: 600 }}
          >
            {r.is_active ? '🟢 Active' : '🔴 Inactive'}
          </Tag>
        );
      },
    },
  ];

  if (isEditMode) {
    serviceColumns.push({
      title: 'Action',
      render: (_, r) => (
        <Space size={1} align="center">
          <Button
            type="link"
            onClick={() => {
              setEditingService(r);
              setIsEditServiceModalVisible(true);
            }}
          >
            Edit
          </Button>
          <Checkbox
            checked={r.is_active}
            onChange={(e) => handleServiceActiveToggle(r, e.target.checked)}
          >
            Active
          </Checkbox>
        </Space>
      ),
    });
  }

  /* ---------------- CATEGORY BADGE ---------------- */

  const category = allGroupCategories.find((c) => c.id === group.group_category);
  const categoryIcon =
    category?.name === 'Class A' ? <CrownOutlined /> :
    category?.name === 'Class B' ? <GoldOutlined /> :
    category?.name === 'Class C' ? <StarOutlined /> :
    <InfoCircleOutlined />;

  const visibleClients = selectedClientId
    ? group.clients?.filter((c) => c.id === selectedClientId)
    : group.clients;

  /* ---------------- JSX ---------------- */

  return (
    <div style={PAGE_BG}>

      {/* TOP BAR */}
      <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: 20 }}>
        <Button
          shape="circle"
          icon={<ArrowLeftOutlined />}
          onClick={onBack}
          style={{ background: '#eef2ff', borderColor: '#c7d2fe', color: '#4f46e5' }}
        />
        <Space align="center">
          <Text style={{ fontWeight: 500, color: isEditMode ? '#4338ca' : '#6b7280' }}>
            Edit Mode
          </Text>
          <Switch
            checked={isEditMode}
            onChange={onToggleEditMode}
            checkedChildren="ON"
            unCheckedChildren="OFF"
            style={{ background: isEditMode ? '#4f46e5' : '#cbd5f5' }}
          />
        </Space>
      </Space>

      {/* GROUP CARD */}
      <Card style={CARD} bordered={false}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          {/* LEFT: Group Name + Category */}
          <Space align="center">
            <Title
              level={3}
              style={{
                margin: 0,
                fontWeight: 700,
                background: 'linear-gradient(90deg,#4f46e5,#06b6d4)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {group.group_name}
            </Title>

            {selectedClientId && (
              <Button type="link" onClick={() => window.location.reload()} style={{ paddingLeft: 0 }}>
                ← Back to all clients
              </Button>
            )}

            {category && (
              <Tag
                icon={categoryIcon}
                style={{ background: '#6366f1', color: '#fff', borderRadius: 20, fontWeight: 600 }}
              >
                {category.name}
              </Tag>
            )}

            {isEditMode && (
              <Button
                type="link"
                icon={<EditOutlined />}
                onClick={() => setIsEditGroupDetailsModalVisible(true)}
              >
                Edit Group
              </Button>
            )}
          </Space>

          {/* RIGHT: Status */}
          <Space>
            <Tag
              color={isGroupActive ? 'success' : 'error'}
              style={{ fontWeight: 600, borderRadius: 20, padding: '4px 14px', fontSize: 13 }}
            >
              {isGroupActive ? '🟢 Active' : '🔴 Inactive'}
            </Tag>
          </Space>
        </div>

        <Descriptions
          bordered
          column={3}
          size="small"
          style={{ marginTop: 16 }}
          contentStyle={{ width: '16.66%', textAlign: 'center' }}
        >
          <Descriptions.Item label="Primary SPOC">
            <Tag icon={<UserOutlined />} color="blue">
              {getSpocName(group.primary_spoc)}
            </Tag>
          </Descriptions.Item>

          <Descriptions.Item label="Secondary SPOC">
            {group.secondary_spoc ? (
              <Tag icon={<UserOutlined />} color="geekblue">
                {getSpocName(group.secondary_spoc)}
              </Tag>
            ) : '—'}
          </Descriptions.Item>

          <Descriptions.Item label="Group Onboarded On">
            <Tag icon={<CalendarOutlined />} color="purple">
              {group.created_at ? dayjs(group.created_at).format('DD MMM YYYY') : '—'}
            </Tag>
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* CLIENTS */}
      <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
        <Col span={24}>
          <Card
            style={CARD}
            bordered={false}
            title="Clients in this Group"
            extra={
              isEditMode && (
                <Button
                  type="dashed"
                  icon={<PlusOutlined />}
                  onClick={() => setIsAddClientModalVisible(true)}
                >
                  Add Client
                </Button>
              )
            }
          >
            {visibleClients?.map((client) => {
              const services = (group.group_services || []).filter(
                (s) => s.client === client.id
              );

              return (
                <Card
                  key={client.id}
                  type="inner"
                  style={{ ...INNER_CARD, marginBottom: 16 }}
                  title={
                    <Space>
                      <Avatar icon={<UserOutlined />} style={{ background: '#6366f1' }} />
                      <Text strong>{client.name}</Text>
                      <Tag color={client.is_active ? 'success' : 'error'}>
                        {client.is_active ? 'Active' : 'Inactive'}
                      </Tag>

                      {isEditMode && (
                        <Checkbox
                          checked={client.is_active}
                          onChange={(e) => handleClientActiveToggle(client, e.target.checked)}
                        >
                          Active
                        </Checkbox>
                      )}

                      {isEditMode && (
                        <Button
                          type="link"
                          onClick={() => {
                            setEditingClient({ ...client });
                            setIsEditClientModalVisible(true);
                          }}
                        >
                          Edit
                        </Button>
                      )}
                    </Space>
                  }
                >
                  <Row gutter={16}>
                    {/* LEFT: Client Details */}
                    <Col xs={24} md={9}>
                      <Card
                        size="small"
                        bordered
                        title={
                          <Space>
                            <UserOutlined />
                            <Text strong>Client Details</Text>
                          </Space>
                        }
                        style={{ height: '100%' }}
                      >
                        <Descriptions bordered size="small" column={1}>
                          {hasValue(client.email) && (
                            <Descriptions.Item label="📧 Email">{client.email}</Descriptions.Item>
                          )}
                          {hasValue(client.phone) && (
                            <Descriptions.Item label="📞 Phone">{client.phone}</Descriptions.Item>
                          )}
                          {hasValue(client.contact_person) && (
                            <Descriptions.Item label="👤 Contact Person">{client.contact_person}</Descriptions.Item>
                          )}
                          {hasValue(client.nature_of_business) && (
                            <Descriptions.Item label="🏢 Nature of Business">{client.nature_of_business}</Descriptions.Item>
                          )}
                          {hasValue(client.constitution_name) && (
                            <Descriptions.Item label="📜 Constitution">{client.constitution_name}</Descriptions.Item>
                          )}
                          {hasValue(client.gstin) && (
                            <Descriptions.Item label="🧾 GSTIN">
                              <Tag color="green">{client.gstin}</Tag>
                            </Descriptions.Item>
                          )}
                          {hasValue(client.pan) && (
                            <Descriptions.Item label="🪪 PAN">
                              <Tag color="blue">{client.pan}</Tag>
                            </Descriptions.Item>
                          )}
                          {hasValue(client.tan) && (
                            <Descriptions.Item label="💳 TAN">
                              <Tag color="purple">{client.tan}</Tag>
                            </Descriptions.Item>
                          )}
                          {hasValue(client.cin) && (
                            <Descriptions.Item label="🏛️ CIN">
                              <Tag color="geekblue">{client.cin}</Tag>
                            </Descriptions.Item>
                          )}
                          {/* {hasValue(client.billing_cycle) && (
                            <Descriptions.Item label="🔁 Billing Cycle">{client.billing_cycle}</Descriptions.Item>
                          )} */}
                          {/* {hasValue(client.invoice_date) && (
                            <Descriptions.Item label="📅 Invoice Date">
                              {moment(client.invoice_date).format('DD MMM YYYY')}
                            </Descriptions.Item>
                          )} */}
                          {hasValue(client.address) && (
                            <Descriptions.Item label="📍 Address">{client.address}</Descriptions.Item>
                          )}
                        </Descriptions>
                      </Card>
                    </Col>

                    {/* RIGHT: Services */}
                    <Col xs={24} md={15}>
                      <Card
                        size="small"
                        bordered
                        title={
                          <Space>
                            <TagOutlined />
                            <Text strong>Services</Text>
                          </Space>
                        }
                        style={{ height: '100%' }}
                      >
                        {services && services.length > 0 ? (
                          <>
                            <Table
                              dataSource={services}
                              columns={serviceColumns}
                              rowKey="id"
                              pagination={false}
                              bordered
                              size="small"
                            />
                            {isEditMode && (
                              <Button
                                block
                                type="dashed"
                                icon={<PlusOutlined />}
                                style={{ marginTop: 12 }}
                                onClick={() => {
                                  setEditingService(null);
                                  setClientForNewService(client);
                                  setAssignedSubServiceIdsForClient(services.map((s) => s.sub_service));
                                  setIsAddServiceModalVisible(true);
                                }}
                              >
                                Add Service
                              </Button>
                            )}
                          </>
                        ) : (
                          <div style={{ textAlign: 'center', padding: '32px 12px', color: '#64748b' }}>
                            <InfoCircleOutlined style={{ fontSize: 24, marginBottom: 8 }} />
                            <div style={{ fontWeight: 500 }}>No services assigned to this client</div>
                            {isEditMode && (
                              <Button
                                type="primary"
                                icon={<PlusOutlined />}
                                style={{ marginTop: 12, borderRadius: 20 }}
                                onClick={() => {
                                  setEditingService(null);
                                  setClientForNewService(client);
                                  setAssignedSubServiceIdsForClient([]);
                                  setIsAddServiceModalVisible(true);
                                }}
                              >
                                Add First Service
                              </Button>
                            )}
                          </div>
                        )}
                      </Card>
                    </Col>
                  </Row>
                </Card>
              );
            })}
          </Card>
        </Col>
      </Row>

      {/* ==================== MODALS ==================== */}

      {/* Edit Service */}
      {editingService && (
        <AddServiceModalForm
          visible={isEditServiceModalVisible}
          initialValues={editingService}
          onCancel={() => {
            setIsEditServiceModalVisible(false);
            setEditingService(null);
          }}
          onFinish={async (values) => {
            try {
              await api.put(
                `/clients/client-group-services/${editingService.id}/`,
                values,
                { headers: { Authorization: `Bearer ${token}` } }
              );
              message.success('Service updated');
              setIsEditServiceModalVisible(false);
              setEditingService(null);
              onGroupDataRefreshed(group);
            } catch (err) {
              message.error('Failed to update service');
            }
          }}
          mainServices={allMainServices}
          subServices={allSubServices}
          clientId={editingService.client}
          assignedSubServices={assignedSubServiceIdsForClient}
        />
      )}

      {/* Add Service */}
      {isAddServiceModalVisible && (
        <AddServiceModalForm
          visible={isAddServiceModalVisible}
          onCancel={() => setIsAddServiceModalVisible(false)}
          onFinish={async (payloads) => {
            try {
              const headers = { Authorization: `Bearer ${token}` };
              for (const payload of payloads) {
                await api.post(
                  '/clients/client-group-services/',
                  { ...payload, client_group: group.id },
                  { headers }
                );
              }
              message.success('Service(s) added successfully');
              setIsAddServiceModalVisible(false);
              setClientForNewService(null);
              onGroupDataRefreshed(group);
            } catch (err) {
              message.error('Failed to add services');
              console.error(err);
            }
          }}
          mainServices={allMainServices}
          subServices={allSubServices}
          clientId={clientForNewService?.id}
          assignedSubServices={assignedSubServiceIdsForClient}
        />
      )}

      {/* ── Add Client ──
          AddClientModalForm now POSTs the client internally and calls
          onFinish(newClient) with the created client object.
          We use that ID here to PATCH the group and link the new client.
      */}
      {isAddClientModalVisible && (
        <AddClientModalForm
          visible={isAddClientModalVisible}
          onCancel={() => setIsAddClientModalVisible(false)}
          onFinish={async (newClient) => {
            // newClient is the response.data from POST /clients/clients/
            if (!newClient?.id) {
              // Fallback: if for some reason we didn't get an ID back, just refresh
              message.warning('Client created but could not auto-link. Please try linking manually.');
              setIsAddClientModalVisible(false);
              onGroupDataRefreshed(group);
              return;
            }

            try {
              const headers = { Authorization: `Bearer ${token}` };

              // Build updated client list for this group
              const existingIds = (group.clients || []).map((c) => c.id);
              const updatedIds = [...existingIds, newClient.id];

              // PATCH the group to include the new client
              await api.patch(
                `/clients/client-groups/${group.id}/`,
                { clients: updatedIds },
                { headers }
              );

              message.success('Client created and linked to group successfully!');
              setIsAddClientModalVisible(false);

              // Refresh parent to show the new client in the list
              onGroupDataRefreshed(group);
            } catch (err) {
              console.error('Group link error:', err);
              // Client was created but linking failed — surface this clearly
              message.error(
                'Client was created but could not be linked to the group. Please link manually.'
              );
              setIsAddClientModalVisible(false);
              onGroupDataRefreshed(group);
            }
          }}
        />
      )}

      {/* Edit Client */}
      {editingClient && (
        <AddClientModalForm
          visible={isEditClientModalVisible}
          initialValues={editingClient}
          onCancel={() => {
            setIsEditClientModalVisible(false);
            setEditingClient(null);
          }}
          onFinish={async () => {
            // AddClientModalForm handles the PATCH internally for edit mode
            // Just close and refresh
            setIsEditClientModalVisible(false);
            setEditingClient(null);
            onGroupDataRefreshed(group);
          }}
        />
      )}

      {/* Edit Group Details */}
      <Modal
        title="Edit Group Details"
        open={isEditGroupDetailsModalVisible}
        onCancel={() => setIsEditGroupDetailsModalVisible(false)}
        onOk={() => editGroupDetailsForm.submit()}
        confirmLoading={groupDetailsSaving}
      >
        <Form
          form={editGroupDetailsForm}
          layout="vertical"
          initialValues={{
            group_name: group.group_name,
            description: group.description,
            is_active: group.is_active,
            primary_spoc: group.primary_spoc,
            secondary_spoc: group.secondary_spoc,
            created_at: group.created_at ? dayjs(group.created_at) : null,
            group_category: group.group_category,
          }}
          onFinish={async (values) => {
            setGroupDetailsSaving(true);
            try {
              const payload = {
                group_name: values.group_name,
                group_category: values.group_category,
                created_at: values.created_at?.format('YYYY-MM-DD'),
                description: values.description,
                is_active: values.is_active,
                primary_spoc: values.primary_spoc,
                secondary_spoc: values.secondary_spoc || null,
              };

              await api.patch(
                `/clients/client-groups/${group.id}/`,
                payload,
                { headers: { Authorization: `Bearer ${token}` } }
              );

              message.success('Group updated successfully');
              setIsEditGroupDetailsModalVisible(false);
              onGroupDataRefreshed(group);
            } catch (err) {
              message.error('Failed to update group');
            } finally {
              setGroupDetailsSaving(false);
            }
          }}
        >
          <Form.Item name="group_name" label="Group Name" required>
            <Input />
          </Form.Item>

          <Form.Item
            name="group_category"
            label="Group Category"
            rules={[{ required: true, message: 'Group Category is required' }]}
          >
            <Select placeholder="Select Category" showSearch optionFilterProp="children">
              {allGroupCategories.map((cat) => (
                <Option key={cat.id} value={cat.id}>
                  {cat.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="primary_spoc"
            label="Primary SPOC"
            rules={[{ required: true, message: 'Primary SPOC is required' }]}
          >
            <Select placeholder="Select Primary SPOC" showSearch optionFilterProp="children">
              {allSpocs.map((spoc) => (
                <Option key={spoc.id} value={spoc.id}>
                  {spoc.name || spoc.email}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="secondary_spoc" label="Secondary SPOC (Optional)">
            <Select
              placeholder="Select Secondary SPOC"
              allowClear
              showSearch
              optionFilterProp="children"
            >
              {allSpocs.map((spoc) => (
                <Option key={spoc.id} value={spoc.id}>
                  {spoc.name || spoc.email}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="created_at" label="Created At">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="is_active" valuePropName="checked">
            <Checkbox>Active</Checkbox>
          </Form.Item>
        </Form>
      </Modal>

    </div>
  );
}

export default ClientGroupDetailView;