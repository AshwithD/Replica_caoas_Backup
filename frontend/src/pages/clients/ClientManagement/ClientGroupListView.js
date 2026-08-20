import React, { useState, useEffect } from 'react';
import { Table, Typography, Button, Space, Tag, Collapse, Form, Select, Input, Row, Col } from 'antd';
import { PlusOutlined, FilterOutlined, ReloadOutlined  } from '@ant-design/icons';
import BulkServiceUploadModal from './BulkServiceUploadModal';
import GenerateOnboardingLinkModal from './GenerateOnboardingLinkModal';
const { Title, Text } = Typography;
const { Panel } = Collapse;
const { Option } = Select;

function ClientGroupListView({ clientGroups, onViewGroupDetails, onAddGroup, allGroupCategories, allSpocs, currentUser, token }) {
  // All state hooks must be declared at the top level of the component, unconditionally.
  const [filters, setFilters] = useState({
    groupName: '',
    spoc: undefined,
    status: undefined,
    category: undefined,
  });

  const [filteredClientGroups, setFilteredClientGroups] = useState(clientGroups);
  const [activeFilterKey, setActiveFilterKey] = useState([]);

  // 🔹 Pagination state
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
  });

  // 🔹 Load saved page size from localStorage (optional)
  useEffect(() => {
    const savedSize = localStorage.getItem("groupPageSize");
    if (savedSize) {
      setPagination(prev => ({ ...prev, pageSize: parseInt(savedSize, 10) }));
    }
  }, []);

  // // 🔹 Pagination config
  // const paginationConfig = {
  //   ...pagination,
  //   // current: pagination.current,
  //   // pageSize: pagination.pageSize,
  //   showSizeChanger: true,
  //   pageSizeOptions: ['10', '20', '50', '100'],
  //   showTotal: (total, range) => `${range[0]}–${range[1]} of ${total} groups`,
  //   onChange: (page, pageSize) => {
  //     setPagination({ current: page, pageSize });
  //     localStorage.setItem("groupPageSize", pageSize); // persist user choice
  //   },
  // };

  // This useEffect hook must also be at the top level.
  useEffect(() => {
    let newFilteredList = clientGroups || [];
    

    // Filter by group name
    if (filters.groupName) {
      newFilteredList = newFilteredList.filter(group =>
        group.group_name.toLowerCase().includes(filters.groupName.toLowerCase())
      );
    }

    // Filter by SPOC
    if (filters.spoc) {
      newFilteredList = newFilteredList.filter(group => group.primary_spoc === filters.spoc);
    }

    // Filter by status
    if (filters.status !== undefined) {
      const isActive = filters.status === 'active';
      newFilteredList = newFilteredList.filter(group => group.is_active === isActive);
    }

    if (filters.category) {
      newFilteredList = newFilteredList.filter(group => group.group_category === filters.category);
    }
    

    setFilteredClientGroups(newFilteredList);
  }, [clientGroups, filters]);

  // Defensive check for data after hooks have been called
  if (!clientGroups) {
    return <Text>No client groups to display.</Text>;
  }

  // Helper function to get group category name by ID
  const getGroupCategoryName = (categoryId) => {
    if (!allGroupCategories) return 'N/A';
    const category = allGroupCategories.find(cat => cat.id === categoryId);
    return category ? category.name : 'N/A';
  };

  // Helper function to get SPOC name by ID
  const getSpocName = (spocId) => {
    if (!allSpocs) return 'N/A';
    const spoc = allSpocs.find(s => s.id === spocId);
    return spoc ? (spoc.name || spoc.email) : 'N/A';
  };

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters(prevFilters => ({ ...prevFilters, [key]: value }));
  };

  // Handle filter reset
  const handleResetFilters = () => {
    setFilters({
      groupName: '',
      spoc: undefined,
      status: undefined,
    });
  };

    // 🔹 Manual Pagination for continuous serial numbers
  const paginatedData = filteredClientGroups
    .slice(
      (pagination.current - 1) * pagination.pageSize,
      pagination.current * pagination.pageSize
    )
    .map((group, index) => ({
      ...group,
      slNo: (pagination.current - 1) * pagination.pageSize + (index + 1),
    }));

  const columns = [
    {
      title: 'Sl. No.',
      dataIndex: 'slNo',
      key: 'slNo',
      width: 80,
    },
    {
      title: 'Group Name',
      dataIndex: 'group_name',
      key: 'group_name',
      align: 'left',
      sorter: (a, b) => a.group_name.localeCompare(b.group_name),
      render: (text, record) => (
        <Button
          type="link"
          onClick={() => onViewGroupDetails(record)}
          style={{
            padding: 0,
            whiteSpace: 'normal',
            wordBreak: 'break-word',
            height: 'auto',
            display: 'block',
            textAlign: 'left',
            color: '#0a2b49ff',
          }}
        >
          {text}
        </Button>
      ),
    },
    {
      title: 'Group Category',
      dataIndex: 'group_category_name',
      key: 'group_category',
      render: (_, record) => getGroupCategoryName(record.group_category),
      sorter: (a, b) =>
        getGroupCategoryName(a.group_category).localeCompare(
          getGroupCategoryName(b.group_category)
        ),
      width: 150,
    },
    {
      title: 'SPOC',
      dataIndex: 'primary_spoc_name',
      key: 'primary_spoc',
      render: (_, record) => getSpocName(record.primary_spoc),
      sorter: (a, b) =>
        getSpocName(a.primary_spoc).localeCompare(getSpocName(b.primary_spoc)),
      width: 150,
    },
    {
      title: 'Number of Clients',
      key: 'client_count',
      render: (_, record) => (record.clients ? record.clients.length : 0),
      width: 150,
    },
    {
      title: 'Status',
      dataIndex: 'is_active',
      key: 'is_active',
      width: 70,
      render: (is_active) => (
        // <Tag color={is_active ? 'green' : 'red'}>
        //   {is_active ? 'Active' : 'Inactive'}
        // </Tag>
        <Tag
          color={is_active ? 'green' : 'red'}
          style={{
            fontSize: '10px',
            padding: '0 4px',
            height: '15px',
            lineHeight: '14px',
            margin: 0,
          }}
        >
          {is_active ? 'Active' : 'Inactive'}
        </Tag>
      ),
      sorter: (a, b) => (a.is_active === b.is_active ? 0 : a.is_active ? -1 : 1),
    },
  ];

  // 🔹 Pagination Config (keep this same)
  const paginationConfig = {
    ...pagination,
    total: filteredClientGroups.length,
    showSizeChanger: true,
    pageSizeOptions: ['10', '20', '50', '100'],
    showTotal: (total, range) => `${range[0]}–${range[1]} of ${total} groups`,
    onChange: (page, pageSize) => {
      setPagination({ current: page, pageSize });
      localStorage.setItem("groupPageSize", pageSize);
    },
  };

  return (
    <div
      style={{
        padding: '24px',
        background: 'linear-gradient(to right, #f8f9fa, #e0e7ff)',
        borderRadius: '12px',
        boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)',
      }}
    >
      {/* <Space
        style={{
          width: '100%',
          justifyContent: 'space-between',
          marginBottom: '20px',
        }}
      >
        <Title level={2} style={{ margin: 0 }}>
          Client Groups
        </Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={onAddGroup}>
          Add Client Group
        </Button>
      </Space> */}
      
      <Space
        style={{
          width: '100%',
          justifyContent: 'space-between',
          marginBottom: '20px',
        }}
      >
        <Title level={2} style={{ margin: 0 }}>
          Client Groups
        </Title>
        

        <Space>
          <GenerateOnboardingLinkModal token={token} />
          <BulkServiceUploadModal token={token} />
          <Button type="primary" icon={<PlusOutlined />} onClick={onAddGroup}>
            Add Client Group
          </Button>
          <Button icon={<ReloadOutlined />} onClick={() => window.location.reload()}>
            Refresh
          </Button>
        </Space>
      </Space>


      {/* Collapsible Filter Section */}
      <Collapse activeKey={activeFilterKey} onChange={setActiveFilterKey} ghost style={{ marginBottom: '24px' }}>
        <Panel header={<Space><FilterOutlined /><Title level={4} style={{ marginBottom: 0 }}>Filters</Title></Space>} key="1">
          <Form layout="vertical">
            <Row gutter={6}>
              <Col xs={24} sm={12} lg={6}>
                <Form.Item label="Group Name">
                  <Input
                    placeholder="Search by group name"
                    value={filters.groupName}
                    onChange={e => handleFilterChange('groupName', e.target.value)}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Form.Item label="SPOC">
                  <Select
                    placeholder="Select a SPOC"
                    allowClear
                    value={filters.spoc}
                    onChange={value => handleFilterChange('spoc', value)}
                  >
                    {allSpocs && allSpocs.map(spoc => (
                      <Option key={spoc.id} value={spoc.id}>
                        {spoc.name || spoc.email}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} lg={5}>
                <Form.Item label="Category">
                  <Select
                    placeholder="Select a category"
                    allowClear
                    value={filters.category}
                    onChange={value => handleFilterChange('category', value)}
                  >
                    {allGroupCategories && allGroupCategories.map(category => (
                      <Option key={category.id} value={category.id}>
                        {category.name}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} lg={5}>
                <Form.Item label="Status">
                  <Select
                    placeholder="Select status"
                    allowClear
                    value={filters.status}
                    onChange={value => handleFilterChange('status', value)}
                  >
                    <Option value="active">Active</Option>
                    <Option value="inactive">Inactive</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} sm={24} lg={2} style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-end' }}>
                <Form.Item>
                  <Button onClick={handleResetFilters}>Clear</Button>
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </Panel>
      </Collapse>

      <Text type="secondary" style={{ marginBottom: '20px', display: 'block' }}>
        Click on a group name to view its detailed information, including all associated clients and their services.
      </Text>
      <Table
        dataSource={paginatedData} // ✅ Use paginated data
        columns={columns}
        rowKey="id"
        pagination={paginationConfig}
        scroll={{ x: 'max-content' }}
        bordered
      />
    </div>
  );
}

export default ClientGroupListView;
