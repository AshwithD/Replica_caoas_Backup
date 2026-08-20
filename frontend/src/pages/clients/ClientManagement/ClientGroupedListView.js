import React, { useState, useMemo, useEffect } from 'react';
import { Table, Typography, Tag, Space, Collapse, Form, Select, Input, Row, Col, Button } from 'antd';
import { FilterOutlined, ReloadOutlined } from '@ant-design/icons';
import * as XLSX from "xlsx";

const { Title, Text } = Typography;
const { Panel } = Collapse;
const { Option } = Select;

function ClientGroupedListView({ allClients, allClientGroups, allSpocs, allGroupCategories, onViewGroupDetails }) {
  // ------------------------------------------------------------------
  // 1. STATE & FILTERS
  // ------------------------------------------------------------------
  const [filters, setFilters] = useState({
    clientName: '',
    groupName: '',
    spoc: undefined,
    gstin: '',
    status: undefined,
  });
  const [activeFilterKey, setActiveFilterKey] = useState([]);
  
  // Pagination State (Defaults to 20, loads user preference)
  const [pagination, setPagination] = useState({ current: 1, pageSize: 50 });

  useEffect(() => {
    const savedSize = localStorage.getItem("clientPageSize");
    if (savedSize) setPagination(prev => ({ ...prev, pageSize: parseInt(savedSize, 10) }));
  }, []);

  const getGroupCategoryName = (categoryId) => {
    if (!allGroupCategories) return 'N/A';
    const category = allGroupCategories.find(cat => cat.id === categoryId);
    return category ? category.name : 'N/A';
  };

  // ------------------------------------------------------------------
  // 2. FAST LOOKUP MAP (The Performance Fix)
  //    Instead of looping through groups 2000 times, we map them ONCE.
  // ------------------------------------------------------------------
  const clientMetaMap = useMemo(() => {
    const map = {}; // Key: client.id, Value: { groups: [], fallbackSpoc: null }
    
    if (allClientGroups) {
      allClientGroups.forEach(group => {
        if (group.clients) {
          group.clients.forEach(c => {
            if (!map[c.id]) map[c.id] = { groups: [], fallbackSpoc: null };
            
            // Add group to this client
            map[c.id].groups.push(group);
            
            // Capture the first valid SPOC we find as a fallback
            if (!map[c.id].fallbackSpoc && group.primary_spoc) {
              map[c.id].fallbackSpoc = group.primary_spoc;
            }
          });
        }
      });
    }
    return map;
  }, [allClientGroups]);

  // ------------------------------------------------------------------
  // 3. FAST FILTERING
  // ------------------------------------------------------------------
  const filteredClients = useMemo(() => {
    let data = allClients || [];

    // Filter: Client Name
    if (filters.clientName) {
      const search = filters.clientName.toLowerCase();
      data = data.filter(c => c.name.toLowerCase().includes(search));
    }

    // Filter: GSTIN
    if (filters.gstin) {
      const search = filters.gstin.toLowerCase();
      data = data.filter(c => c.gstin && c.gstin.toLowerCase().includes(search));
    }

    // Filter: Status
    if (filters.status !== undefined) {
      const isActive = filters.status === 'active';
      data = data.filter(c => c.is_active === isActive);
    }

    // Filter: Group Name (Using Map -> O(1) Lookup)
    if (filters.groupName) {
      const search = filters.groupName.toLowerCase();
      data = data.filter(client => {
        const meta = clientMetaMap[client.id];
        return meta && meta.groups.some(g => g.group_name.toLowerCase().includes(search));
      });
    }

    // Filter: SPOC (Using Map -> O(1) Lookup)
    if (filters.spoc) {
      data = data.filter(client => {
        const spoc = client.primary_spoc || clientMetaMap[client.id]?.fallbackSpoc;
        return spoc === filters.spoc;
      });
    }

    return data;
  }, [allClients, filters, clientMetaMap]);

  // ------------------------------------------------------------------
  // 4. MANUAL PAGINATION SLICING
  //    Only render the 20 rows needed for the current page.
  // ------------------------------------------------------------------
  const paginatedData = useMemo(() => {
    const start = (pagination.current - 1) * pagination.pageSize;
    const end = start + pagination.pageSize;
    
    // Create a quick Map for SPOC IDs -> Names
    const spocNameMap = {};
    (allSpocs || []).forEach(s => spocNameMap[s.id] = s.name || s.email);

    return filteredClients.slice(start, end).map((client, index) => {
      const meta = clientMetaMap[client.id] || { groups: [], fallbackSpoc: null };
      const activeSpocId = client.primary_spoc || meta.fallbackSpoc;
      const groupCategory = meta.groups?.[0]?.group_category;

      return {
        key: client.id,
        slNo: start + index + 1,
        clientName: client.name,
        clientGroups: meta.groups,
        group_category: groupCategory,
        spocName: activeSpocId ? (spocNameMap[activeSpocId] || 'N/A') : 'N/A',
        gstin: client.gstin || 'N/A',
        is_active: client.is_active,
      };
    });
  }, [filteredClients, pagination, clientMetaMap, allSpocs]);

  // ------------------------------------------------------------------
  // 5. HANDLERS
  // ------------------------------------------------------------------
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, current: 1 })); // Reset to page 1 on filter
  };

  const handleResetFilters = () => {
    setFilters({ clientName: '', groupName: '', spoc: undefined, gstin: '', status: undefined });
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleDownloadExcel = () => {
    // Generate rows for ALL filtered data (not just current page)
    const spocNameMap = {};
    (allSpocs || []).forEach(s => spocNameMap[s.id] = s.name || s.email);

    const rows = [];
    filteredClients.forEach(client => {
      const meta = clientMetaMap[client.id] || { groups: [], fallbackSpoc: null };
      const activeSpocId = client.primary_spoc || meta.fallbackSpoc;
      const spocName = activeSpocId ? (spocNameMap[activeSpocId] || 'N/A') : 'N/A';
      
      if (!meta.groups || meta.groups.length === 0) {
        rows.push({
          "Client Name": client.name,
          "Group Name": "",
          "SPOC": spocName,
          "GSTIN": client.gstin || "",
          "PAN No": client.pan || "",
          "Status": client.is_active ? "Active" : "Inactive"
        });
      } else {
        meta.groups.forEach(g => {
          rows.push({
            "Client Name": client.name,
            "Group Name": g.group_name,
            "SPOC": g.primary_spoc_name || spocName,
            "GSTIN": client.gstin || "",
            "PAN No": client.pan || "",
            "Status": client.is_active ? "Active" : "Inactive"
          });
        });
      }
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Clients");
    XLSX.writeFile(workbook, "Client_List.xlsx");
  };

  // ------------------------------------------------------------------
  // 6. COLUMNS
  // ------------------------------------------------------------------
  const columns = [
    {
      title: 'Sl. No.',
      dataIndex: 'slNo',
      key: 'slNo',
      width: 60,
    },
    // {
    //   title: 'Client Name',
    //   dataIndex: 'clientName',
    //   key: 'clientName',
    //   width: 480,
    //   sorter: (a, b) => a.clientName.localeCompare(b.clientName),
    //   render: name => <Text style={{ textAlign: 'left', display: 'block' }}>{name}</Text>,
    // },
    {
      title: 'Client Name',
      dataIndex: 'clientName',
      key: 'clientName',
      width: 440,
      render: (name, record) => (
        <Text
          type="link"
          style={{ color: '#1d4ed8', cursor: 'pointer' }}
          onClick={() => {
            if (record.clientGroups?.length > 0) {
              onViewGroupDetails(record.clientGroups[0], record.key);
            }
          }}
        >
          {name}
        </Text>
      ),
    },
    {
      title: 'Group Name',
      dataIndex: 'clientGroups',
      key: 'group_name',
      width: 270,
      render: (groups) => {
        if (!groups || groups.length === 0) return <Text type="secondary">—</Text>;
        return (
          <Space direction="vertical" size={2}>
            {groups.map(group => (
              <Text
                key={group.id}
                type="link"
                onClick={() => onViewGroupDetails(group)}
                style={{ color: '#09072eff', whiteSpace: 'normal', textAlign: 'left', cursor: 'pointer' }}
              >
                {group.group_name}
              </Text>
            ))}
          </Space>
        );
      },
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
      width: 130,
    },
    {
      title: 'SPOC Name',
      dataIndex: 'spocName',
      key: 'spocName',
      width: 170,
      sorter: (a, b) => a.spocName.localeCompare(b.spocName),
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

  // ------------------------------------------------------------------
  // 7. RENDER
  // ------------------------------------------------------------------
  return (
    <div style={{ padding: '24px', background: 'linear-gradient(to right, #f8f9fa, #e0e7ff)', borderRadius: '12px', boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)' }}>
      
      <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: '20px' }}>
        <Title level={2} style={{ marginBottom: 1 }}>Client List</Title>
        <Space>
          <Button onClick={handleDownloadExcel} type="primary">Download Client List</Button>
          <Button icon={<ReloadOutlined />} onClick={() => window.location.reload()}>Refresh</Button>
        </Space>
      </Space>

      <Collapse activeKey={activeFilterKey} onChange={setActiveFilterKey} ghost style={{ marginBottom: '24px' }}>
        <Panel header={<Space><FilterOutlined /><Title level={4} style={{ marginBottom: 0 }}>Filters</Title></Space>} key="1">
          <Form layout="vertical">
            <Row gutter={16}>
              <Col xs={24} sm={12} lg={5}>
                <Form.Item label="Client Name">
                  <Input placeholder="Search" value={filters.clientName} onChange={e => handleFilterChange('clientName', e.target.value)} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} lg={5}>
                <Form.Item label="Group Name">
                  <Input placeholder="Search" value={filters.groupName} onChange={e => handleFilterChange('groupName', e.target.value)} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} lg={5}>
                <Form.Item label="SPOC">
                  <Select placeholder="Select SPOC" allowClear value={filters.spoc} onChange={val => handleFilterChange('spoc', val)}>
                    {allSpocs && allSpocs.map(s => <Option key={s.id} value={s.id}>{s.name || s.email}</Option>)}
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} lg={4}>
                <Form.Item label="GSTIN">
                  <Input placeholder="Search GSTIN" value={filters.gstin} onChange={e => handleFilterChange('gstin', e.target.value)} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} lg={4}>
                <Form.Item label="Status">
                  <Select placeholder="Select" allowClear value={filters.status} onChange={val => handleFilterChange('status', val)}>
                    <Option value="active">Active</Option>
                    <Option value="inactive">Inactive</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} style={{ textAlign: 'right' }}>
                  <Button onClick={handleResetFilters}>Clear Filters</Button>
              </Col>
            </Row>
          </Form>
        </Panel>
      </Collapse>
      <Text type="secondary" style={{ marginBottom: '20px', display: 'block' }}>
        Click on a group name to view it's detailed information, including all associated clients and their services.
      </Text>

      <Table
        columns={columns}
        dataSource={paginatedData} // ✅ Uses the SLICED data (Fast)
        rowKey="key"
        scroll={{ x: 'max-content' }}
        bordered
        pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: filteredClients.length, // ✅ Use total filtered count for correct page numbers
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50', '100'],
            showTotal: (total, range) => `${range[0]}–${range[1]} of ${total} clients`,
            onChange: (page, pageSize) => {
                setPagination({ current: page, pageSize });
                localStorage.setItem("clientPageSize", pageSize);
            }
        }}
      />
    </div>
  );
}

export default ClientGroupedListView;