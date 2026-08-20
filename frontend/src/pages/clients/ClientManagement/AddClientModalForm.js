import React, { useState, useEffect } from 'react';
import {
  Modal, Form, Input, Select, Row, Col, Typography,
} from 'antd';
import {
  UserOutlined, MailOutlined, PhoneOutlined, BankOutlined,
  IdcardOutlined, ArrowLeftOutlined, ArrowRightOutlined, SaveOutlined,
} from '@ant-design/icons';
import { api } from '../../../services/api';
import { message } from 'antd';

const { Option } = Select;
const { TextArea } = Input;
const { Title, Text } = Typography;

const P = {
  navy:'#023C6C', navyDk:'#011f3a', teal:'#0891b2', tealLt:'#e0f2f9',
  indigo:'#4f46e5', indigoLt:'#eef2ff', slate:'#64748b', border:'#e2e8f0',
  green:'#059669', greenLt:'#d1fae5', amber:'#d97706', amberLt:'#fef3c7',
};

if (!document.getElementById('acmf-styles')) {
  const s = document.createElement('style');
  s.id = 'acmf-styles';
  s.textContent = `
    .acmf-step-btn{display:inline-flex;align-items:center;gap:6px;padding:9px 22px;
      border-radius:10px;font-weight:700;font-size:13px;cursor:pointer;border:none;
      transition:all .18s}
    .acmf-step-btn.primary{background:linear-gradient(135deg,#4f46e5,#0891b2);color:#fff;
      box-shadow:0 4px 14px rgba(79,70,229,.28)}
    .acmf-step-btn.primary:hover{transform:translateY(-2px);
      box-shadow:0 8px 20px rgba(79,70,229,.38)}
    .acmf-step-btn.primary:disabled{opacity:.6;cursor:not-allowed;transform:none;pointer-events:none}
    .acmf-step-btn.primary:not(:disabled){pointer-events:auto !important}
    .acmf-step-btn.secondary{background:#f1f5f9;color:#475569;border:1.5px solid #e2e8f0}
    .acmf-step-btn.secondary:hover{background:#e2e8f0}
    .acmf-field label{font-weight:600!important;color:#374151!important;
      font-size:12px!important;text-transform:uppercase;letter-spacing:.04em}
    .acmf-section{font-size:11px;font-weight:700;color:#4f46e5;text-transform:uppercase;
      letter-spacing:.07em;margin:0 0 14px;display:flex;align-items:center;gap:8px}
    .acmf-section::after{content:'';flex:1;height:1px;background:#e0e7ff}
    .acmf-input .ant-input{border-radius:9px!important;font-size:13px!important}
    .acmf-input .ant-input-affix-wrapper{border-radius:9px!important;font-size:13px!important;
      padding:8px 12px!important}
    .acmf-select .ant-select-selector{border-radius:9px!important;min-height:40px!important;
      font-size:13px!important}
  `;
  document.head.appendChild(s);
}

/* ── styled input wrapper ── */
function SField({ name, label, rules, prefix, placeholder, textarea, children, span=12 }) {
  return (
    <Col xs={24} sm={span}>
      <Form.Item
        className="acmf-field"
        name={name}
        label={label}
        rules={rules}
        style={{marginBottom:16}}
      >
        {children || (
          textarea
            ? <TextArea rows={3} placeholder={placeholder} style={{borderRadius:9,fontSize:13}}/>
            : (
              <Input
                className="acmf-input"
                prefix={prefix && <span style={{color:P.slate,marginRight:4}}>{prefix}</span>}
                placeholder={placeholder}
                style={{borderRadius:9,fontSize:13}}
              />
            )
        )}
      </Form.Item>
    </Col>
  );
}

const STEPS = [
  { title:'Basic Info',   icon:'👤' },
  { title:'Registration', icon:'🪪' },
];

function AddClientModalForm({ visible, onCancel, onFinish, initialValues }) {
  const [form]          = Form.useForm();
  const [step,          setStep]          = useState(0);
  const [loading,       setLoading]       = useState(false);
  const [constitutions, setConstitutions] = useState([]);

  const isEdit = !!initialValues;

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get('/clients/constitutions/');
        setConstitutions(res.data.results || res.data);
      } catch { /* ignore */ }
    };
    if (visible) fetch();
  }, [visible]);

  useEffect(() => {
    if (visible && initialValues) {
      form.setFieldsValue({ ...initialValues,
        constitution: initialValues.constitution?.id || initialValues.constitution,
      });
      setStep(0);
    } else if (visible) {
      form.resetFields();
      setStep(0);
    }
  }, [visible, initialValues, form]);

  const handleCancel = () => { form.resetFields(); setStep(0); onCancel(); };

  const STEP_FIELDS = [
    ['name','email','phone','contact_person','nature_of_business','constitution','address'],
    ['gstin','pan','tan','cin','iec','lei','udyam','ksea','apt','ept'],
  ];

  const handleNext = async () => {
    try {
      await form.validateFields(STEP_FIELDS[step]);
      setStep(s => s + 1);
    } catch {
      message.error('Please fill in the required fields correctly.');
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Get all current form values without strict validation
      const values = form.getFieldsValue();
      
      // Build clean payload - remove empty/undefined values
      const payload = {};
      Object.entries(values).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') {
          payload[k] = v;
        }
      });

      // Ensure name exists
      if (!payload.name) {
        message.error('Client name is required!');
        setStep(0);
        setLoading(false);
        return;
      }

      // Uppercase name
      payload.name = String(payload.name).toUpperCase().trim();

      console.log('Sending payload:', payload);

      if (isEdit) {
        await api.patch(`/clients/clients/${initialValues.id}/`, payload);
        message.success('Client updated!');
      } else {
        const res = await api.post('/clients/clients/', payload);
        message.success('Client created!');
        onFinish && onFinish(res.data);
      }

      form.resetFields();
      setStep(0);
      onCancel();

    } catch (err) {
      console.error('Submit error:', err);
      console.error('Response data:', err?.response?.data);
      const backendError = err?.response?.data;
      if (backendError) {
        const msg = typeof backendError === 'string'
          ? backendError
          : Object.entries(backendError)
              .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
              .join(' | ');
        message.error(msg);
      } else if (err?.errorFields) {
        message.error('Please fill in all required fields.');
        setStep(0);
      } else {
        message.error('Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  /* ── step 0: basic info ── */
  const step0 = (
    <>
      <div className="acmf-section"><UserOutlined/> Personal & Contact</div>
      <Row gutter={[16,0]}>
        <SField name="name" label="Client Name" span={12}
          rules={[{required:true,message:'Required'}]}
          prefix={<UserOutlined/>} placeholder="Full client name"/>
        <SField name="email" label="Email" span={12}
          rules={[{type:'email',message:'Invalid email'}]}
          prefix={<MailOutlined/>} placeholder="email@example.com"/>
        <SField name="phone" label="Phone" span={12}
          prefix={<PhoneOutlined/>} placeholder="+91 98765 43210"/>
        <SField name="contact_person" label="Contact Person" span={12}
          prefix={<UserOutlined/>} placeholder="Primary contact name"/>
        <SField name="nature_of_business" label="Nature of Business" span={12}
          prefix={<BankOutlined/>} placeholder="e.g. Manufacturing"/>
        <Col xs={24} sm={12}>
          <Form.Item className="acmf-field" name="constitution" label="Constitution" style={{marginBottom:16}}>
            <Select
              className="acmf-select"
              placeholder="Select constitution"
              showSearch optionFilterProp="children"
            >
              {constitutions.map(c=>(
                <Option key={c.id} value={c.id}>{c.name}</Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
        <Col xs={24}>
          <Form.Item className="acmf-field" name="address" label="Address" style={{marginBottom:0}}>
            <TextArea rows={3} placeholder="Full registered address"
              style={{borderRadius:9,fontSize:13}}/>
          </Form.Item>
        </Col>
      </Row>
    </>
  );

  /* ── step 1: registration numbers ── */
  const REGS = [
    {name:'gstin', label:'GSTIN',  placeholder:'15-char GSTIN'},
    {name:'pan',   label:'PAN',    placeholder:'10-char PAN'},
    {name:'tan',   label:'TAN',    placeholder:'TAN number'},
    {name:'cin',   label:'CIN',    placeholder:'CIN number'},
    {name:'iec',   label:'IEC',    placeholder:'Import Export Code'},
    {name:'lei',   label:'LEI',    placeholder:'LEI number'},
    {name:'udyam', label:'UDYAM',  placeholder:'UDYAM number'},
    {name:'ksea',  label:'KSEA',   placeholder:'KSEA number'},
    {name:'apt',   label:'APT',    placeholder:'APT number'},
    {name:'ept',   label:'EPT',    placeholder:'EPT number'},
  ];

  const step1 = (
    <>
      <div className="acmf-section"><IdcardOutlined/> Registration Numbers</div>
      <Row gutter={[16,0]}>
        {REGS.map(f => (
          <SField key={f.name} name={f.name} label={f.label} span={8}
            prefix={<IdcardOutlined style={{fontSize:11}}/>}
            placeholder={f.placeholder}/>
        ))}
      </Row>
    </>
  );

  const stepContent = [step0, step1];

  return (
    <Modal
      open={visible}
      onCancel={handleCancel}
      width={680}
      destroyOnClose
      footer={null}
      styles={{body:{padding:0}}}
      title={null}
    >
      {/* ── Dark header ── */}
      <div style={{
        background:'linear-gradient(135deg,#011f3a,#023C6C)',
        padding:'20px 28px',
        borderRadius:'8px 8px 0 0',
        display:'flex',alignItems:'center',gap:12,
      }}>
        <div style={{
          width:40,height:40,borderRadius:11,
          background:'rgba(255,255,255,.12)',
          display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,
        }}>
          {isEdit ? '✏️' : '➕'}
        </div>
        <div>
          <div style={{color:'#fff',fontWeight:800,fontSize:16,lineHeight:1.2}}>
            {isEdit ? 'Edit Client' : 'Add New Client'}
          </div>
          <div style={{color:'rgba(255,255,255,.5)',fontSize:12}}>
            Step {step+1} of {STEPS.length} — {STEPS[step].title}
          </div>
        </div>
      </div>

      {/* ── Step indicator ── */}
      <div style={{
        padding:'14px 28px',background:'#f8fafc',
        borderBottom:`1px solid ${P.border}`,
        display:'flex',gap:0,
      }}>
        {STEPS.map((st,i) => {
          const done   = i < step;
          const active = i === step;
          return (
            <div key={i} style={{display:'flex',alignItems:'center',flex:1}}>
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                <div style={{
                  width:28,height:28,borderRadius:8,
                  background: done
                    ? 'linear-gradient(135deg,#4f46e5,#0891b2)'
                    : active ? P.indigoLt : '#f1f5f9',
                  border: active ? `2px solid ${P.indigo}` : done ? 'none' : `2px solid ${P.border}`,
                  display:'flex',alignItems:'center',justifyContent:'center',
                  fontSize: done ? 12 : 14,
                  color: done ? '#fff' : active ? P.indigo : P.slate,
                  fontWeight:700,flexShrink:0,transition:'all .25s',
                }}>
                  {done ? '✓' : st.icon}
                </div>
                <span style={{
                  fontSize:12,fontWeight:active||done?700:500,
                  color:active?P.indigo:done?P.green:P.slate,
                }}>
                  {st.title}
                </span>
              </div>
              {i < STEPS.length-1 && (
                <div style={{
                  flex:1,height:2,margin:'0 12px',borderRadius:2,
                  background: done
                    ? 'linear-gradient(90deg,#4f46e5,#0891b2)'
                    : P.border,
                  transition:'background .3s',
                }}/>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Content ── */}
      {/* <div style={{padding:'24px 28px',minHeight:280}}>
        <Form form={form} layout="vertical" name="add_client_form">
          {stepContent[step]}
        </Form>
      </div> */}
      {/* ── Content ── */}
      <div style={{padding:'24px 28px', minHeight:280}}>
        <Form form={form} layout="vertical" name="add_client_form">
          <div style={{display: step === 0 ? 'block' : 'none'}}>{step0}</div>
          <div style={{display: step === 1 ? 'block' : 'none'}}>{step1}</div>
        </Form>
      </div>

      {/* ── Footer ── */}
      <div style={{
        padding:'14px 28px',background:'#f8fafc',
        borderTop:`1px solid ${P.border}`,
        display:'flex',justifyContent:'space-between',alignItems:'center',
      }}>
        <button
          className="acmf-step-btn secondary"
          onClick={step===0 ? handleCancel : ()=>setStep(s=>s-1)}
        >
          {step===0 ? 'Cancel' : <><ArrowLeftOutlined/> Back</>}
        </button>

        {step < STEPS.length-1 ? (
          <button className="acmf-step-btn primary" onClick={handleNext}>
            Next <ArrowRightOutlined/>
          </button>
        ) : (
          <button
              type="button"
              className="acmf-step-btn primary"
              onClick={handleSubmit}
              disabled={loading}
              style={{
                  ...(loading ? {opacity:0.7, cursor:'wait'} : {}),
                  pointerEvents: loading ? 'none' : 'auto',
              }}
          >
              <SaveOutlined/>
              {loading ? 'Saving…' : isEdit ? 'Update Client' : 'Create Client'}
          </button>
        )}
      </div>
    </Modal>
  );
}

export default AddClientModalForm;