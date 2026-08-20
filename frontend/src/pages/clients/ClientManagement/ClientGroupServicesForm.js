
import React, { useState, useEffect, useCallback } from 'react';
import {
  Form, Select, Button, Space, Typography,
  InputNumber, Row, Col, Input, Tooltip,
} from 'antd';
import {
  MinusCircleOutlined, PlusOutlined, TagOutlined,
  DollarOutlined, CalendarOutlined, AppstoreOutlined,
} from '@ant-design/icons';
import moment from 'moment';

const { Option } = Select;
const { Text, Title } = Typography;

const P = {
  navy:'#023C6C', navyDk:'#011f3a', teal:'#0891b2', tealLt:'#e0f2f9',
  indigo:'#4f46e5', indigoLt:'#eef2ff', slate:'#64748b', border:'#e2e8f0',
  green:'#059669', greenLt:'#d1fae5', amber:'#d97706', amberLt:'#fef3c7',
  red:'#dc2626', redLt:'#fee2e2',
  bg:'linear-gradient(135deg,#eef2ff,#f8fafc,#ecfeff)',
};

const avatarColors = ['#4f46e5','#0891b2','#059669','#d97706','#7c3aed','#dc2626'];

if (!document.getElementById('cgsf-styles')) {
  const s = document.createElement('style');
  s.id = 'cgsf-styles';
  s.textContent = `
    @keyframes cgsfFadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
    .cgsf-client-block{background:#fff;border-radius:16px;border:1px solid #e2e8f0;
      overflow:hidden;margin-bottom:20px;animation:cgsfFadeUp .3s ease both;
      box-shadow:0 2px 12px rgba(2,60,108,.06)}
    .cgsf-service-row{background:#fafbff;border-radius:12px;border:1px solid #e0e7ff;
      padding:14px 16px;margin-bottom:10px;transition:box-shadow .2s}
    .cgsf-service-row:hover{box-shadow:0 4px 14px rgba(79,70,229,.08)}
    .cgsf-add-svc-btn{display:flex;align-items:center;justify-content:center;gap:7px;
      width:100%;padding:10px;border-radius:10px;border:2px dashed #c7d2fe;
      background:#f8faff;color:#4f46e5;font-weight:700;font-size:12px;cursor:pointer;
      transition:all .18s}
    .cgsf-add-svc-btn:hover{border-color:#4f46e5;background:#eef2ff}
    .cgsf-select .ant-select-selector{border-radius:9px!important;font-size:12px!important}
    .cgsf-label label{font-weight:600!important;color:#374151!important;font-size:11px!important}
    .cgsf-section{font-size:11px;font-weight:700;color:#4f46e5;text-transform:uppercase;
      letter-spacing:.07em;display:flex;align-items:center;gap:6px;margin-bottom:12px}
    .cgsf-section::after{content:'';flex:1;height:1px;background:#e0e7ff}
  `;
  document.head.appendChild(s);
}

const servicePeriods = [
  {value:'Monthly',      label:'Monthly'},
  {value:'Quarterly',    label:'Quarterly'},
  {value:'Annually',     label:'Annually'},
  {value:'Half-Yearly',  label:'Half-Yearly'},
  {value:'Not Applicable',label:'Not Applicable'},
];

const getDays = () => Array.from({length:31},(_,i)=>i+1);
const filterOption = (input, option) =>
  String(option?.label??'').toLowerCase().includes(input.toLowerCase());

function DueDateInput({ field, periodValue }) {
  if (periodValue === 'Monthly') {
    return (
      <Form.Item
        {...field}
        name={[field.name,'due_day']}
        fieldKey={[field.fieldKey,'due_day']}
        rules={[{required:true,message:'Required'}]}
        label="Due Day"
        style={{marginBottom:0,flex:'1 1 120px'}}
      >
        <Select placeholder="Day" showSearch allowClear filterOption={filterOption}
          style={{borderRadius:9}}>
          {getDays().map(d=><Option key={d} value={d} label={d}>{d}</Option>)}
        </Select>
      </Form.Item>
    );
  }
  if (['Quarterly','Half-Yearly','Annually'].includes(periodValue)) {
    return (
      <div style={{flex:'1 1 220px'}}>
        <div style={{fontSize:11,fontWeight:600,color:'#374151',marginBottom:4}}>Due Date</div>
        <Space.Compact style={{width:'100%'}}>
          <Form.Item
            {...field}
            name={[field.name,'due_month']}
            fieldKey={[field.fieldKey,'due_month']}
            rules={[{required:true,message:'Required'}]}
            noStyle
          >
            <Select style={{width:'50%'}} placeholder="Month" showSearch allowClear filterOption={filterOption}>
              {moment.months().map((m,i)=><Option key={i+1} value={i+1} label={m}>{m}</Option>)}
            </Select>
          </Form.Item>
          <Form.Item
            {...field}
            name={[field.name,'due_day']}
            fieldKey={[field.fieldKey,'due_day']}
            rules={[{required:true,message:'Required'}]}
            noStyle
          >
            <Select style={{width:'50%'}} placeholder="Day" showSearch allowClear filterOption={filterOption}>
              {getDays().map(d=><Option key={d} value={d} label={d}>{d}</Option>)}
            </Select>
          </Form.Item>
        </Space.Compact>
      </div>
    );
  }
  if (periodValue === 'Not Applicable') {
    return (
      <Form.Item label="Due Date" style={{flex:'1 1 120px',marginBottom:0}}>
        <Input value="N/A" disabled style={{borderRadius:9}}/>
      </Form.Item>
    );
  }
  return null;
}

function ServiceRow({ field, remove, clientId, form, mainServices, getSubServicesForMainService, handleMainServiceChange, index }) {
  const mainSvcVal = Form.useWatch([clientId, field.name, 'main_service'], form);
  const periodVal  = Form.useWatch([clientId, field.name, 'period'], form);

  return (
    <div className="cgsf-service-row">
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
        <span style={{
          fontSize:11,fontWeight:700,color:P.indigo,
          background:P.indigoLt,padding:'2px 10px',borderRadius:20,
        }}>
          Service #{index+1}
        </span>
        <Tooltip title="Remove service">
          <button
            onClick={() => remove(field.name)}
            style={{
              border:'none',background:'transparent',cursor:'pointer',
              color:P.slate,borderRadius:8,padding:'4px 6px',
              transition:'all .15s',display:'flex',alignItems:'center',
            }}
            onMouseEnter={e=>{e.currentTarget.style.background=P.redLt;e.currentTarget.style.color=P.red;}}
            onMouseLeave={e=>{e.currentTarget.style.background='transparent';e.currentTarget.style.color=P.slate;}}
          >
            <MinusCircleOutlined style={{fontSize:15}}/>
          </button>
        </Tooltip>
      </div>

      <Row gutter={[12,12]}>
        <Col xs={24} sm={12} md={8}>
          <Form.Item
            className="cgsf-label"
            {...field}
            name={[field.name,'main_service']}
            fieldKey={[field.fieldKey,'main_service']}
            label="Main Service"
            rules={[{required:true,message:'Required'}]}
            style={{marginBottom:0}}
          >
            <Select
              className="cgsf-select"
              placeholder="Select main service"
              onChange={() => handleMainServiceChange(clientId, field.name)}
              allowClear showSearch filterOption={filterOption}
            >
              {mainServices.map(s=>(
                <Option key={s.id} value={s.id} label={s.name}>{s.name}</Option>
              ))}
            </Select>
          </Form.Item>
        </Col>

        <Col xs={24} sm={12} md={8}>
          <Form.Item
            className="cgsf-label"
            {...field}
            name={[field.name,'sub_service']}
            fieldKey={[field.fieldKey,'sub_service']}
            label="Sub Service"
            rules={[{required:true,message:'Required'}]}
            style={{marginBottom:0}}
          >
            <Select
              className="cgsf-select"
              placeholder={mainSvcVal ? 'Select sub service' : 'Select main service first'}
              allowClear showSearch filterOption={filterOption}
              disabled={!mainSvcVal}
            >
              {(getSubServicesForMainService(mainSvcVal)||[]).map(sub=>(
                <Option key={sub.id} value={sub.id} label={sub.name}>{sub.name}</Option>
              ))}
            </Select>
          </Form.Item>
        </Col>

        <Col xs={24} sm={12} md={8}>
          <Form.Item
            className="cgsf-label"
            {...field}
            name={[field.name,'period']}
            fieldKey={[field.fieldKey,'period']}
            label="Period"
            rules={[{required:true,message:'Required'}]}
            style={{marginBottom:0}}
          >
            <Select
              className="cgsf-select"
              placeholder="Select period"
              allowClear showSearch filterOption={filterOption}
            >
              {servicePeriods.map(p=>(
                <Option key={p.value} value={p.value} label={p.label}>{p.label}</Option>
              ))}
            </Select>
          </Form.Item>
        </Col>

        {periodVal && periodVal !== 'Not Applicable' && (
          <Col xs={24} sm={12} md={8}>
            <DueDateInput field={field} periodValue={periodVal}/>
          </Col>
        )}

        <Col xs={24} sm={12} md={8}>
          <Form.Item
            className="cgsf-label"
            {...field}
            name={[field.name,'fee']}
            fieldKey={[field.fieldKey,'fee']}
            label="Fee (₹)"
            rules={[{required:true,message:'Required'}]}
            style={{marginBottom:0}}
          >
            <InputNumber
              min={0}
              style={{width:'100%',borderRadius:9}}
              placeholder="0.00"
              formatter={v=>`₹ ${v}`.replace(/\B(?=(\d{3})+(?!\d))/g,',')}
              parser={v=>v.replace(/₹\s?|(,*)/g,'')}
            />
          </Form.Item>
        </Col>
      </Row>
    </div>
  );
}

function ClientGroupServicesForm({ form, initialValues, mainServices=[], subServicesMap={}, groupClients }) {
  const [subServicesOptions, setSubServicesOptions] = useState({});

  useEffect(() => {
    const opts = {};
    if (Array.isArray(mainServices)) {
      mainServices.forEach(ms => {
        if (ms?.id) opts[ms.id] = subServicesMap[ms.id] || [];
      });
    }
    setSubServicesOptions(opts);

    const formatted = {};
    for (const clientId in initialValues) {
      if (Object.prototype.hasOwnProperty.call(initialValues, clientId)) {
        formatted[clientId] = (initialValues[clientId]||[]).map(svc => {
          const d = svc.due_date ? moment(svc.due_date) : null;
          return { ...svc, due_day: d?.date()||null, due_month: d ? d.month()+1 : null };
        });
      }
    }
    form.setFieldsValue(formatted);
  }, [initialValues, mainServices, subServicesMap, form]);

  const handleMainServiceChange = useCallback((clientId, fieldName) => {
    form.setFields([
      {name:[clientId,fieldName,'sub_service'],value:undefined},
      {name:[clientId,fieldName,'period'],value:undefined},
      {name:[clientId,fieldName,'due_day'],value:undefined},
      {name:[clientId,fieldName,'due_month'],value:undefined},
    ]);
  },[form]);

  const getSubServicesForMainService = useCallback(id => subServicesOptions[id]||[],[subServicesOptions]);

  return (
    <div style={{
      padding:28, background:P.bg, borderRadius:18,
      boxShadow:'0 4px 24px rgba(2,60,108,.08)', minHeight:'50vh',
    }}>

      {/* Header */}
      <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:28}}>
        <div style={{
          width:44,height:44,borderRadius:13,
          background:P.indigoLt,color:P.indigo,
          display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,
        }}>⚙️</div>
        <div>
          <Title level={4} style={{margin:0,color:P.navyDk,fontWeight:800}}>
            Service Assignment
          </Title>
          <Text style={{color:P.slate,fontSize:13}}>
            Assign services, periods and fees to each client in this group.
          </Text>
        </div>
      </div>

      <Form form={form} layout="vertical">
        {(groupClients??[]).length === 0 ? (
          <div style={{
            padding:'48px 24px', borderRadius:16, border:`2px dashed #c7d2fe`,
            background:'#f8faff', textAlign:'center',
          }}>
            <div style={{fontSize:36,marginBottom:12}}>👤</div>
            <Title level={5} style={{color:P.navyDk,margin:0,marginBottom:6}}>No clients to assign</Title>
            <Text style={{color:P.slate,fontSize:13}}>
              Go back and add clients to this group first.
            </Text>
          </div>
        ) : (
          (groupClients??[]).map((client, ci) => {
            const clientKey = client._tempId || client.id || `new-${ci}`;
            const avatarBg  = avatarColors[ci % avatarColors.length];
            const initials  = (client.name||'?').split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase();

            return (
              <div
                key={clientKey}
                className="cgsf-client-block"
                style={{animationDelay:`${ci*60}ms`}}
              >
                {/* Client header strip */}
                <div style={{
                  height:4, background:`linear-gradient(90deg,${avatarBg},${avatarBg}88)`,
                }}/>

                <div style={{padding:'18px 20px'}}>
                  {/* Client identity row */}
                  <div style={{
                    display:'flex', alignItems:'center', gap:12, marginBottom:18,
                    paddingBottom:14, borderBottom:`1px solid ${P.border}`,
                  }}>
                    <div style={{
                      width:42,height:42,borderRadius:11,flexShrink:0,
                      background:avatarBg, color:'#fff',
                      display:'flex',alignItems:'center',justifyContent:'center',
                      fontWeight:800, fontSize:15,
                      boxShadow:`0 3px 10px ${avatarBg}55`,
                    }}>
                      {initials}
                    </div>
                    <div>
                      <div style={{fontWeight:800,fontSize:15,color:P.navyDk}}>{client.name}</div>
                      {client.email && (
                        <div style={{fontSize:11,color:P.slate}}>{client.email}</div>
                      )}
                      {client._tempId && (
                        <span style={{
                          fontSize:10,fontWeight:700,background:P.amberLt,color:P.amber,
                          borderRadius:20,padding:'1px 8px',border:'1px solid #fcd34d',
                        }}>⏳ Pending</span>
                      )}
                    </div>
                  </div>

                  {/* Services section title */}
                  <div className="cgsf-section">
                    <TagOutlined/> Services for {client.name}
                  </div>

                  {/* Service list */}
                  <Form.List name={clientKey}>
                    {(fields, {add, remove}) => (
                      <>
                        {fields.map((field, fi) => (
                          <ServiceRow
                            key={field.key}
                            field={field}
                            remove={remove}
                            clientId={clientKey}
                            form={form}
                            index={fi}
                            mainServices={mainServices}
                            getSubServicesForMainService={getSubServicesForMainService}
                            handleMainServiceChange={handleMainServiceChange}
                          />
                        ))}
                        <button
                          type="button"
                          className="cgsf-add-svc-btn"
                          onClick={() => add()}
                        >
                          <PlusOutlined style={{fontSize:12}}/>
                          Add Service for {client.name}
                        </button>
                      </>
                    )}
                  </Form.List>
                </div>
              </div>
            );
          })
        )}
      </Form>
    </div>
  );
}

export default ClientGroupServicesForm;