import React, { useState } from 'react';
import { Modal, Button, Input, Typography, message, Form, Select } from 'antd';
import { LinkOutlined, CopyOutlined, SendOutlined, CheckOutlined } from '@ant-design/icons';
import { api } from '../../../services/api';

const { Text, Paragraph } = Typography;
const { Option } = Select;

/**
 * Button + modal that lets staff generate a unique, tokenized onboarding link
 * to send to a prospective client. The client opens the link (no login needed),
 * fills their own details and uploads documents, and it lands in the same
 * Client Request review queue as an internally-created request.
 *
 * Expected backend endpoint:
 *   POST /clients/onboarding-invites/
 *     body: { client_group?: number, note?: string }
 *     response: { token: string, url: string, expires_at: string }
 */
export default function GenerateOnboardingLinkModal({ token: authToken, clientGroups = [] }){
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [link, setLink] = useState(null);
  const [copied, setCopied] = useState(false);
  const [form] = Form.useForm();

  const hdrs = { Authorization: `Bearer ${authToken}` };

  const handleGenerate = async () => {
    setCreating(true);
    try{
      const values = await form.validateFields().catch(()=>({}));
      const res = await api.post('/clients/onboarding-invites/', {
        client_group: values.client_group || null,
      }, { headers: hdrs });
      setLink(res.data.url);
    }catch(err){
      message.error('Could not generate the link. Please try again.');
    }finally{
      setCreating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(link);
    setCopied(true);
    message.success('Link copied to clipboard');
    setTimeout(()=>setCopied(false), 2000);
  };

  const handleClose = () => {
    setOpen(false);
    setLink(null);
    form.resetFields();
  };

  return (
    <>
      <Button icon={<LinkOutlined />} onClick={()=>setOpen(true)}>
        Onboarding Link
      </Button>
      <Modal
        open={open}
        onCancel={handleClose}
        title={
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <div style={{width:34,height:34,borderRadius:9,background:'#eef2ff',
              display:'flex',alignItems:'center',justifyContent:'center',fontSize:16}}>🔗</div>
            <span>Generate Client Onboarding Link</span>
          </div>
        }
        footer={link ? [
          <Button key="close" onClick={handleClose}>Done</Button>,
        ] : [
          <Button key="cancel" onClick={handleClose}>Cancel</Button>,
          <Button key="gen" type="primary" icon={<SendOutlined/>} loading={creating} onClick={handleGenerate}>
            Generate Link
          </Button>,
        ]}
        width={480}
      >
        {!link ? (
          <>
            <Paragraph style={{color:'#64748b',fontSize:13}}>
              This creates a unique, one-time link you can send to a client. They'll be able to
              fill in their own details and upload documents — no login required — and it will
              show up in your Client Requests queue for review.
            </Paragraph>
            <Form form={form} layout="vertical">
              <Form.Item name="client_group" label="Link to an existing group (optional)">
                <Select placeholder="No group — this is a new client" allowClear showSearch optionFilterProp="children">
                  {clientGroups.map(g=>(
                    <Option key={g.id} value={g.id}>{g.group_name}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Form>
          </>
        ) : (
          <div>
            <Paragraph style={{color:'#64748b',fontSize:13,marginBottom:10}}>
              Share this link with your client. It expires in 7 days or once submitted, whichever comes first.
            </Paragraph>
            <Input.Group compact style={{display:'flex'}}>
              <Input readOnly value={link} style={{flex:1}}/>
              <Button icon={copied?<CheckOutlined/>:<CopyOutlined/>} onClick={handleCopy}
                type={copied?'primary':'default'}/>
            </Input.Group>
          </div>
        )}
      </Modal>
    </>
  );
}