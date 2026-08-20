// // D:\Onging Projects\HRMS\frontend\src\pages\clients\ClientManagement\ClientGroupForm.js


import React from 'react';
import { Form, Input, Select, Row, Col, Typography } from 'antd';
import { CrownOutlined, GoldOutlined, StarOutlined, UserOutlined, TeamOutlined } from '@ant-design/icons';

const { Option } = Select;
const { Text, Title } = Typography;

const P = {
  navy:'#023C6C', navyDk:'#011f3a', teal:'#0891b2', tealLt:'#e0f2f9',
  indigo:'#4f46e5', indigoLt:'#eef2ff', slate:'#64748b', border:'#e2e8f0',
  amber:'#d97706', amberLt:'#fef3c7', bg:'linear-gradient(135deg,#eef2ff,#f8fafc,#ecfeff)',
};

if (!document.getElementById('cgf-styles')) {
  const s = document.createElement('style');
  s.id = 'cgf-styles';
  s.textContent = `
    .cgf-cat-card{border-radius:10px;border:2px solid #e2e8f0;padding:10px 12px;
      cursor:pointer;transition:all .2s;background:#fff;
      display:flex;align-items:center;gap:10px}
    .cgf-cat-card:hover{border-color:#4f46e5;transform:translateY(-1px);
      box-shadow:0 6px 16px rgba(79,70,229,.10)}
    .cgf-cat-card.selected{border-color:#4f46e5;background:#eef2ff;
      box-shadow:0 0 0 3px rgba(79,70,229,.10)}
    .cgf-label label{font-weight:700!important;color:#374151!important;
      font-size:12px!important;text-transform:uppercase;letter-spacing:.05em}
    .cgf-input{border-radius:10px!important;padding:10px 14px!important;font-size:13px!important}
    .cgf-select .ant-select-selector{border-radius:10px!important;padding:6px 12px!important;
      min-height:42px!important;font-size:13px!important}
    .cgf-section{font-size:11px;font-weight:700;color:#4f46e5;text-transform:uppercase;
      letter-spacing:.08em;margin-bottom:14px;display:flex;align-items:center;gap:8px}
    .cgf-section::after{content:'';flex:1;height:1px;background:#e0e7ff}
  `;
  document.head.appendChild(s);
}

const CATEGORIES = [
  {
    name:'Class A', desc:'High-value, priority support',
    icon:<CrownOutlined style={{fontSize:18,color:'#d97706'}}/>,
    color:'#d97706', bg:'#fef3c7', border:'#fcd34d',
  },
  {
    name:'Class B', desc:'Regular, standard support',
    icon:<GoldOutlined style={{fontSize:18,color:'#607d8b'}}/>,
    color:'#607d8b', bg:'#f1f5f9', border:'#cbd5e1',
  },
  {
    name:'Class C', desc:'New or smaller clients',
    icon:<StarOutlined style={{fontSize:18,color:'#2196f3'}}/>,
    color:'#2196f3', bg:'#dbeafe', border:'#93c5fd',
  },
];

function ClientGroupForm({ form, initialValues, groupCategories, spocs }) {
  const selectedCat = Form.useWatch('group_category', form);

  return (
    <div style={{
      padding:28, background:P.bg, borderRadius:18,
      boxShadow:'0 4px 24px rgba(2,60,108,.08)', minHeight:'50vh',
    }}>

      {/* Header */}
      <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:28}}>
        <div style={{
          width:44,height:44,borderRadius:13,background:P.indigoLt,color:P.indigo,
          display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,
        }}>🏢</div>
        <div>
          <Title level={4} style={{margin:0,color:P.navyDk,fontWeight:800}}>Group Details</Title>
          <Text style={{color:P.slate,fontSize:13}}>
            Define the core identity and classification of this client group.
          </Text>
        </div>
      </div>

      <Form form={form} layout="vertical" initialValues={initialValues}>

        {/* ── Category ── */}
        <div style={{marginBottom:24}}>
          <div className="cgf-section"><CrownOutlined/> Group Classification</div>
          <Form.Item
            name="group_category"
            rules={[{required:true,message:'Please select a category'}]}
            style={{marginBottom:0}}
          >
            {/* horizontal compact row */}
            <div style={{display:'flex',gap:12,flexWrap:'wrap'}}>
              {(groupCategories??[]).map(cat => {
                const meta       = CATEGORIES.find(c => c.name === cat.name) || {};
                const isSelected = selectedCat === cat.id;
                return (
                  <div
                    key={cat.id}
                    className={`cgf-cat-card${isSelected?' selected':''}`}
                    style={{
                      flex:'1 1 160px', maxWidth:220,
                      ...(isSelected ? {
                        borderColor: meta.color||P.indigo,
                        background:  meta.bg||P.indigoLt,
                        boxShadow:   `0 0 0 3px ${meta.border||'#c7d2fe'}55`,
                      } : {}),
                    }}
                    onClick={() => form.setFieldValue('group_category', cat.id)}
                  >
                    {/* icon bubble */}
                    <div style={{
                      width:34,height:34,borderRadius:9,flexShrink:0,
                      background: isSelected ? (meta.bg||P.indigoLt) : '#f8fafc',
                      border:`1.5px solid ${isSelected?(meta.border||P.indigo):P.border}`,
                      display:'flex',alignItems:'center',justifyContent:'center',
                      transition:'all .2s',
                    }}>
                      {meta.icon}
                    </div>

                    {/* text */}
                    <div style={{minWidth:0}}>
                      <div style={{
                        fontWeight:700,fontSize:13,
                        color:isSelected?(meta.color||P.indigo):P.navyDk,
                        lineHeight:1.2,
                      }}>{cat.name}</div>
                      <div style={{fontSize:11,color:P.slate,marginTop:2,lineHeight:1.3}}>
                        {meta.desc}
                      </div>
                    </div>

                    {/* checkmark */}
                    {isSelected && (
                      <div style={{
                        marginLeft:'auto',flexShrink:0,
                        width:18,height:18,borderRadius:'50%',
                        background:meta.color||P.indigo,color:'#fff',
                        display:'flex',alignItems:'center',justifyContent:'center',
                        fontSize:10,fontWeight:700,
                      }}>✓</div>
                    )}
                  </div>
                );
              })}
            </div>
          </Form.Item>
        </div>

        {/* ── Group name ── */}
        <div style={{marginBottom:24}}>
          <div className="cgf-section"><TeamOutlined/> Group Identity</div>
          <Row gutter={[16,0]}>
            <Col xs={24} md={14}>
              <Form.Item
                className="cgf-label"
                name="group_name"
                label="Group Name"
                rules={[{required:true,message:'Please enter a group name'}]}
              >
                <Input
                  className="cgf-input"
                  placeholder="e.g. Sharma & Associates Group"
                  prefix={<TeamOutlined style={{color:P.slate}}/>}
                />
              </Form.Item>
            </Col>
          </Row>
        </div>

        {/* ── SPOCs ── */}
        <div>
          <div className="cgf-section"><UserOutlined/> Points of Contact</div>
          <Row gutter={[16,0]}>
            <Col xs={24} sm={12}>
              <Form.Item
                className="cgf-label"
                name="primary_spoc"
                label="Primary SPOC"
                rules={[{required:true,message:'Please select a primary SPOC'}]}
              >
                <Select
                  className="cgf-select"
                  showSearch placeholder="Select primary contact"
                  optionFilterProp="children"
                >
                  {(spocs??[]).map(s=>(
                    <Option key={s.id} value={s.id}>{s.name||s.email}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                className="cgf-label"
                name="secondary_spoc"
                label="Secondary SPOC (Optional)"
              >
                <Select
                  className="cgf-select"
                  showSearch placeholder="Select secondary contact"
                  allowClear optionFilterProp="children"
                >
                  {(spocs??[]).map(s=>(
                    <Option key={s.id} value={s.id}>{s.name||s.email}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </div>

      </Form>
    </div>
  );
}

export default ClientGroupForm;