import React, { useState, useEffect, useCallback } from 'react';
import {
  Form, Input, Select, Row, Col, Typography, Upload, Button, Spin,
} from 'antd';
import {
  UserOutlined, MailOutlined, PhoneOutlined, BankOutlined, IdcardOutlined,
  SendOutlined, ArrowLeftOutlined, ArrowRightOutlined, InboxOutlined,
  CheckCircleFilled, FileTextOutlined, CloseCircleOutlined,
} from '@ant-design/icons';
import { useParams } from 'react-router-dom';
import { api } from '../../../services/api';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TextArea } = Input;
const { Dragger } = Upload;

/* ─── palette — matches RequestPage.jsx ───────── */
const P = {
  navy:'#023C6C', navyDk:'#011f3a',
  teal:'#0891b2', tealLt:'#e0f2f9',
  indigo:'#4f46e5', indigoLt:'#eef2ff',
  slate:'#64748b', border:'#e2e8f0',
  green:'#059669', greenLt:'#d1fae5',
  amber:'#d97706', amberLt:'#fef3c7',
  red:'#dc2626',   redLt:'#fee2e2',
  bg:'linear-gradient(135deg,#eef2ff 0%,#f8fafc 50%,#ecfeff 100%)',
};

const REG_FIELDS = [
  {name:'gstin', label:'GSTIN',  hint:'15-digit GST Identification Number'},
  {name:'pan',   label:'PAN',    hint:'10-character Permanent Account Number'},
  {name:'tan',   label:'TAN',    hint:'Tax Deduction Account Number'},
  {name:'cin',   label:'CIN',    hint:'Corporate Identification Number'},
  {name:'iec',   label:'IEC',    hint:'Import Export Code'},
  {name:'lei',   label:'LEI',    hint:'Legal Entity Identifier'},
  {name:'udyam', label:'UDYAM',  hint:'MSME Udyam Registration Number'},
  {name:'ksea',  label:'KSEA',   hint:'State shops & establishment registration'},
  {name:'apt',   label:'APT',    hint:'Professional tax registration'},
  {name:'ept',   label:'EPT',    hint:'Employer professional tax registration'},
];

const DOC_TYPES = [
  {key:'pan_card',        label:'PAN Card',                  required:true},
  {key:'gst_certificate', label:'GST Certificate',           required:false},
  {key:'incorporation',   label:'Incorporation / Registration Certificate', required:false},
  {key:'address_proof',   label:'Address Proof',             required:false},
  {key:'other',           label:'Other Supporting Document',  required:false},
];

const STEPS = [
  {title:'Your Details',  icon:'👤', desc:'Contact & business info'},
  {title:'Registration',  icon:'🪪', desc:'Tax & legal numbers'},
  {title:'Documents',     icon:'📎', desc:'Upload supporting files'},
  {title:'Review',        icon:'✅', desc:'Confirm & submit'},
];

/* ─── styles ─────────────────────────────────── */
if (!document.getElementById('cob-styles')) {
  const s = document.createElement('style');
  s.id = 'cob-styles';
  s.textContent = `
    @keyframes cobFadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
    @keyframes cobSpin{to{transform:rotate(360deg)}}
    .cob-wrap{min-height:100vh;background:${P.bg};padding:32px 16px;display:flex;
      flex-direction:column;align-items:center}
    .cob-card{background:#fff;border-radius:18px;border:1px solid #e0e7ff;
      box-shadow:0 10px 30px rgba(79,70,229,.08);width:100%;max-width:760px;
      overflow:hidden;animation:cobFadeUp .35s ease both}
    .cob-brand{display:flex;align-items:center;gap:12px;margin-bottom:22px}
    .cob-field label{font-weight:600!important;color:#374151!important;
      font-size:12px!important;text-transform:uppercase;letter-spacing:.04em}
    .cob-sec{font-size:11px;font-weight:700;color:#4f46e5;text-transform:uppercase;
      letter-spacing:.07em;margin:0 0 14px;display:flex;align-items:center;gap:8px}
    .cob-sec::after{content:'';flex:1;height:1px;background:#e0e7ff}
    .cob-sel .ant-select-selector{border-radius:9px!important;min-height:40px!important;font-size:13px!important}
    .cob-btn{display:inline-flex;align-items:center;gap:7px;padding:10px 22px;
      border-radius:10px;font-weight:700;font-size:13px;cursor:pointer;border:none;transition:all .18s}
    .cob-btn.primary{background:linear-gradient(135deg,#4f46e5,#0891b2);color:#fff;
      box-shadow:0 4px 14px rgba(79,70,229,.28)}
    .cob-btn.primary:hover{transform:translateY(-1px)}
    .cob-btn.primary:disabled{opacity:.6;cursor:not-allowed;transform:none}
    .cob-btn.success{background:linear-gradient(135deg,#059669,#0891b2);color:#fff;
      box-shadow:0 4px 14px rgba(5,150,105,.28)}
    .cob-btn.success:disabled{opacity:.6;cursor:not-allowed;transform:none}
    .cob-btn.secondary{background:#f8fafc;color:#475569;border:1.5px solid #e2e8f0}
    .cob-btn.secondary:hover{background:#e2e8f0}
    .cob-doc-slot{border:2px dashed #c7d2fe;border-radius:12px;padding:14px 16px;
      background:#f8faff;margin-bottom:12px;transition:all .18s}
    .cob-doc-slot.has-file{border-style:solid;border-color:#a7f3d0;background:#f0fdf4}
    .cob-doc-slot .ant-upload-drag{border:none!important;background:transparent!important;padding:0!important}
    .cob-progress-rail{height:4px;background:#e0e7ff;border-radius:4px;overflow:hidden}
    .cob-progress-fill{height:100%;background:linear-gradient(90deg,#4f46e5,#0891b2);
      transition:width .4s cubic-bezier(.4,0,.2,1)}
  `;
  document.head.appendChild(s);
}

function InviteError({reason}){
  const copy = {
    expired: {icon:'⏳', title:'This link has expired', body:'Onboarding links are valid for a limited time. Please ask your contact to send you a fresh link.'},
    used:    {icon:'✅', title:'This link has already been used', body:'It looks like these details were already submitted. If you need to make changes, ask your contact for a new link.'},
    invalid: {icon:'🔍', title:"We couldn't find this link", body:'The link may be mistyped or no longer valid. Please check the link and try again, or contact the person who sent it to you.'},
  }[reason] || {icon:'⚠️', title:'Something went wrong', body:'Please try again in a moment, or contact the person who sent you this link.'};
  return (
    <div className="cob-wrap">
      <div className="cob-card" style={{padding:'56px 40px',textAlign:'center'}}>
        <div style={{fontSize:44,marginBottom:16}}>{copy.icon}</div>
        <Title level={3} style={{color:P.navyDk,marginBottom:10}}>{copy.title}</Title>
        <Paragraph style={{color:P.slate,fontSize:14,maxWidth:420,margin:'0 auto'}}>{copy.body}</Paragraph>
      </div>
    </div>
  );
}

function StepBar({step}){
  return (
    <div style={{padding:'20px 28px',background:'#f8fafc',borderBottom:`1px solid ${P.border}`}}>
      <div style={{display:'flex',justifyContent:'space-between',marginBottom:10}}>
        {STEPS.map((st,i)=>{
          const done=i<step, active=i===step;
          return (
            <div key={i} style={{display:'flex',alignItems:'center',gap:6,opacity:done||active?1:0.5}}>
              <span style={{fontSize:16}}>{done?'✓':st.icon}</span>
              <div>
                <div style={{fontSize:12,fontWeight:active||done?700:500,color:active?P.indigo:done?P.green:P.slate}}>
                  {st.title}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="cob-progress-rail">
        <div className="cob-progress-fill" style={{width:`${((step+1)/STEPS.length)*100}%`}}/>
      </div>
    </div>
  );
}

function DocSlot({docType, file, onSelect, onRemove}){
  return (
    <div className={`cob-doc-slot${file?' has-file':''}`}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:12}}>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontWeight:700,fontSize:13,color:P.navyDk}}>
            {docType.label}{docType.required&&<span style={{color:P.red}}> *</span>}
          </div>
          {file ? (
            <div style={{fontSize:12,color:P.green,marginTop:3,display:'flex',alignItems:'center',gap:6}}>
              <FileTextOutlined/> {file.name}
              <span style={{color:P.slate}}>({(file.size/1024).toFixed(0)} KB)</span>
            </div>
          ) : (
            <div style={{fontSize:12,color:P.slate,marginTop:3}}>PDF, JPG or PNG — up to 10 MB</div>
          )}
        </div>
        {file ? (
          <button onClick={onRemove} className="cob-btn secondary" style={{padding:'6px 12px',fontSize:12}}>
            <CloseCircleOutlined/> Remove
          </button>
        ) : (
          <Upload
            accept=".pdf,.jpg,.jpeg,.png"
            showUploadList={false}
            beforeUpload={(f)=>{
              const okType = ['application/pdf','image/jpeg','image/png'].includes(f.type);
              const okSize = f.size/1024/1024 < 10;
              if(!okType || !okSize) return Upload.LIST_IGNORE;
              onSelect(f);
              return false;
            }}
          >
            <button className="cob-btn secondary" style={{padding:'6px 14px',fontSize:12}}>
              <InboxOutlined/> Choose file
            </button>
          </Upload>
        )}
      </div>
    </div>
  );
}

export default function ClientOnboardingForm(){
  const { token } = useParams();
  const [form] = Form.useForm();

  const [loadState, setLoadState] = useState('loading'); // loading | ready | error | success
  const [errorReason, setErrorReason] = useState(null);
  const [invite, setInvite] = useState(null);
  const [constitutions, setConstitutions] = useState([]);
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [docs, setDocs] = useState({});

  useEffect(()=>{
    let cancelled=false;
    (async()=>{
      try{
        const res = await api.get(`/clients/onboarding/${token}/`);
        if(cancelled) return;
        setInvite(res.data);
        setConstitutions(res.data.constitutions||[]);
        // Prefill any details already known (e.g. name/email captured when invite was created)
        form.setFieldsValue({
          name: res.data.prefill?.name,
          email: res.data.prefill?.email,
          phone: res.data.prefill?.phone,
        });
        setLoadState('ready');
      }catch(err){
        if(cancelled) return;
        const status = err?.response?.status;
        const code = err?.response?.data?.code;
        if(status===410 || code==='expired') setErrorReason('expired');
        else if(status===409 || code==='used') setErrorReason('used');
        else if(status===404) setErrorReason('invalid');
        else setErrorReason(null);
        setLoadState('error');
      }
    })();
    return ()=>{cancelled=true;};
  },[token]);

  const handleNext = async () => {
    const fieldsByStep = [
      ['name','email','phone','contact_person','nature_of_business','constitution','address'],
      [], // registration numbers are all optional
      [],
    ];
    try{
      await form.validateFields(fieldsByStep[step]||[]);
      setStep(s=>s+1);
    }catch{
      // antd surfaces field errors inline
    }
  };

  const requiredMissing = DOC_TYPES.filter(d=>d.required && !docs[d.key]);

  const handleSubmit = async () => {
    if(requiredMissing.length){
      setStep(2);
      return;
    }
    setSubmitting(true);
    try{
      const values = await form.validateFields();
      const fd = new FormData();
      Object.entries(values).forEach(([k,v])=>{
        if(v!==undefined && v!==null && v!=='') fd.append(k, v);
      });
      Object.entries(docs).forEach(([docKey, file])=>{
        fd.append(`document_${docKey}`, file);
      });
      await api.post(`/clients/onboarding/${token}/submit/`, fd, {
        headers: {'Content-Type':'multipart/form-data'},
      });
      setLoadState('success');
    }catch(err){
      if(err?.errorFields){
        setStep(0);
      }
      // Surface a lightweight inline error rather than a toast, since there's no app chrome here
      setErrorReason(err?.response?.status===410 ? 'expired' : null);
      if(err?.response?.status===410 || err?.response?.status===409){
        setLoadState('error');
        setErrorReason(err.response.status===410?'expired':'used');
      }
    }finally{
      setSubmitting(false);
    }
  };

  if(loadState==='loading') return (
    <div className="cob-wrap" style={{justifyContent:'center'}}>
      <Spin size="large"/>
    </div>
  );

  if(loadState==='error') return <InviteError reason={errorReason}/>;

  if(loadState==='success') return (
    <div className="cob-wrap">
      <div className="cob-card" style={{padding:'56px 40px',textAlign:'center'}}>
        <div style={{width:76,height:76,borderRadius:'50%',margin:'0 auto 20px',
          background:'linear-gradient(135deg,#059669,#0891b2)',display:'flex',
          alignItems:'center',justifyContent:'center',boxShadow:'0 8px 24px rgba(5,150,105,.3)'}}>
          <CheckCircleFilled style={{fontSize:34,color:'#fff'}}/>
        </div>
        <Title level={3} style={{color:P.navyDk,marginBottom:10}}>Thanks — you're all set!</Title>
        <Paragraph style={{color:P.slate,fontSize:14,maxWidth:420,margin:'0 auto'}}>
          We've received your details and documents. Our team will review them shortly,
          and you'll be contacted once your account is fully set up.
        </Paragraph>
      </div>
    </div>
  );

  return (
    <div className="cob-wrap">
      <div className="cob-brand">
        <div style={{width:44,height:44,borderRadius:12,background:'linear-gradient(135deg,#4f46e5,#0891b2)',
          display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,
          boxShadow:'0 6px 18px rgba(79,70,229,.28)'}}>📋</div>
        <div>
          <Title level={4} style={{margin:0,fontWeight:800,color:P.navyDk}}>Client Onboarding</Title>
          <Text style={{color:P.slate,fontSize:13}}>
            {invite?.organisation_name ? `Requested by ${invite.organisation_name}` : 'Please fill in your details below'}
          </Text>
        </div>
      </div>

      <div className="cob-card">
        <StepBar step={step}/>
        <div style={{padding:'26px 28px'}}>
          <Form form={form} layout="vertical">
            <div style={{display:step===0?'block':'none'}}>
              <div className="cob-sec"><UserOutlined/> Your Details</div>
              <Row gutter={[16,0]}>
                <Col xs={24} sm={12}>
                  <Form.Item className="cob-field" name="name" label="Business / Client Name"
                    rules={[{required:true,message:'Please enter your business name'}]} style={{marginBottom:16}}>
                    <Input prefix={<UserOutlined style={{color:P.slate}}/>} placeholder="Full registered name"
                      style={{borderRadius:9,fontSize:13}}/>
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item className="cob-field" name="email" label="Email"
                    rules={[{required:true,message:'Please enter your email'},{type:'email',message:'Invalid email'}]} style={{marginBottom:16}}>
                    <Input prefix={<MailOutlined style={{color:P.slate}}/>} placeholder="email@example.com"
                      style={{borderRadius:9,fontSize:13}}/>
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item className="cob-field" name="phone" label="Phone"
                    rules={[{required:true,message:'Please enter your phone number'}]} style={{marginBottom:16}}>
                    <Input prefix={<PhoneOutlined style={{color:P.slate}}/>} placeholder="+91 98765 43210"
                      style={{borderRadius:9,fontSize:13}}/>
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item className="cob-field" name="contact_person" label="Contact Person"
                    rules={[{required:true,message:'Please enter a contact person'}]} style={{marginBottom:16}}>
                    <Input prefix={<UserOutlined style={{color:P.slate}}/>} placeholder="Primary contact name"
                      style={{borderRadius:9,fontSize:13}}/>
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item className="cob-field" name="nature_of_business" label="Nature of Business"
                    style={{marginBottom:16}}>
                    <Input prefix={<BankOutlined style={{color:P.slate}}/>} placeholder="e.g. Manufacturing"
                      style={{borderRadius:9,fontSize:13}}/>
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item className="cob-field" name="constitution" label="Constitution" style={{marginBottom:16}}>
                    <Select className="cob-sel" placeholder="Select constitution" showSearch
                      optionFilterProp="children" allowClear>
                      {constitutions.map(c=><Option key={c.id} value={c.id}>{c.name}</Option>)}
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24}>
                  <Form.Item className="cob-field" name="address" label="Registered Address"
                    rules={[{required:true,message:'Please enter your address'}]} style={{marginBottom:0}}>
                    <TextArea rows={3} placeholder="Full registered address" style={{borderRadius:9,fontSize:13}}/>
                  </Form.Item>
                </Col>
              </Row>
            </div>

            <div style={{display:step===1?'block':'none'}}>
              <div className="cob-sec"><IdcardOutlined/> Registration Numbers</div>
              <Paragraph style={{color:P.slate,fontSize:13,marginTop:-6,marginBottom:16}}>
                Fill in whichever of these apply to your business. You can leave the rest blank.
              </Paragraph>
              <Row gutter={[16,0]}>
                {REG_FIELDS.map(f=>(
                  <Col key={f.name} xs={24} sm={12} md={8}>
                    <Form.Item className="cob-field" name={f.name} label={f.label} style={{marginBottom:16}}
                      tooltip={f.hint}>
                      <Input prefix={<IdcardOutlined style={{fontSize:11,color:P.slate}}/>}
                        placeholder={f.label} style={{borderRadius:9,fontSize:13}}/>
                    </Form.Item>
                  </Col>
                ))}
              </Row>
            </div>

            <div style={{display:step===2?'block':'none'}}>
              <div className="cob-sec">📎 Upload Documents</div>
              <Paragraph style={{color:P.slate,fontSize:13,marginTop:-6,marginBottom:16}}>
                Please upload clear copies or photos of the following. PDF, JPG or PNG, up to 10 MB each.
              </Paragraph>
              {DOC_TYPES.map(d=>(
                <DocSlot key={d.key} docType={d} file={docs[d.key]}
                  onSelect={(f)=>setDocs(p=>({...p,[d.key]:f}))}
                  onRemove={()=>setDocs(p=>{const n={...p};delete n[d.key];return n;})}/>
              ))}
              {step===2 && requiredMissing.length>0 && (
                <div style={{marginTop:4,fontSize:12,color:P.red,fontWeight:500}}>
                  ⚠️ Please upload: {requiredMissing.map(d=>d.label).join(', ')}
                </div>
              )}
            </div>

            <div style={{display:step===3?'block':'none'}}>
              <div className="cob-sec">✅ Review Your Details</div>
              <div style={{padding:'16px 20px',borderRadius:13,background:P.tealLt,border:'1px solid #a5f3fc',marginBottom:16}}>
                <Row gutter={[12,8]}>
                  <Col span={12}><Text style={{fontSize:12,color:P.slate}}>Business Name</Text><div style={{fontWeight:700,color:P.navyDk}}>{form.getFieldValue('name')||'—'}</div></Col>
                  <Col span={12}><Text style={{fontSize:12,color:P.slate}}>Email</Text><div style={{fontWeight:700,color:P.navyDk}}>{form.getFieldValue('email')||'—'}</div></Col>
                  <Col span={12}><Text style={{fontSize:12,color:P.slate}}>Phone</Text><div style={{fontWeight:700,color:P.navyDk}}>{form.getFieldValue('phone')||'—'}</div></Col>
                  <Col span={12}><Text style={{fontSize:12,color:P.slate}}>Contact Person</Text><div style={{fontWeight:700,color:P.navyDk}}>{form.getFieldValue('contact_person')||'—'}</div></Col>
                </Row>
              </div>
              <div style={{padding:'14px 18px',borderRadius:12,background:'#f8fafc',border:`1px solid ${P.border}`}}>
                <div style={{fontSize:12,fontWeight:700,color:P.slate,textTransform:'uppercase',letterSpacing:'.05em',marginBottom:8}}>
                  Documents attached
                </div>
                {Object.keys(docs).length===0 ? (
                  <div style={{fontSize:13,color:P.slate}}>No documents attached yet.</div>
                ) : (
                  <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
                    {Object.entries(docs).map(([k,f])=>(
                      <span key={k} style={{padding:'4px 10px',borderRadius:20,background:P.greenLt,color:P.green,fontSize:12,fontWeight:600}}>
                        <FileTextOutlined/> {f.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <Paragraph style={{color:P.slate,fontSize:12,marginTop:16,marginBottom:0}}>
                By submitting, you confirm the details above are accurate. Our team will review
                everything before setting up your account.
              </Paragraph>
            </div>
          </Form>
        </div>

        <div style={{padding:'14px 28px',background:'#f8fafc',borderTop:`1px solid ${P.border}`,
          display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <span style={{fontSize:12,color:'#94a3b8',fontWeight:600}}>Step {step+1} of {STEPS.length}</span>
          <div style={{display:'flex',gap:10}}>
            <button className="cob-btn secondary" onClick={()=>setStep(s=>s-1)} disabled={step===0}
              style={{opacity:step===0?0.5:1}}>
              <ArrowLeftOutlined/> Back
            </button>
            {step<STEPS.length-1?(
              <button className="cob-btn primary" onClick={handleNext}>Next <ArrowRightOutlined/></button>
            ):(
              <button className="cob-btn success" onClick={handleSubmit} disabled={submitting}>
                <SendOutlined/>{submitting?'Submitting…':'Submit Details'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}