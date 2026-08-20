import React, { useEffect, useState, useContext } from 'react';
import {
  Form, Input, InputNumber, DatePicker, Upload, Tag, TimePicker, Radio, Switch,
  Button, Table, message, Avatar, Space, Select, Modal, Row, Col, Dropdown, Menu,
  Checkbox, Descriptions, Divider, Typography, Tooltip, Card,
} from 'antd';
import {
  UploadOutlined, EditOutlined, DeleteOutlined, IdcardOutlined, UserOutlined,
  EyeOutlined, ExclamationCircleOutlined, EllipsisOutlined, BankOutlined,
  ClockCircleOutlined, MailOutlined, PhoneOutlined, HomeOutlined, CalendarOutlined,
  WalletOutlined, SearchOutlined, PlusOutlined, TeamOutlined, UserAddOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { api } from '../services/api';
import { getCookie } from '../utils/csrf';
import { SpinnerContext } from '../components/SpinnerContext';

const { Title, Text } = Typography;
const { Option } = Select;
const { confirm } = Modal;

/* ── inline styles ─────────────────────────────────────────── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Syne:wght@600;700;800&display=swap');

  .emp-page * { font-family: 'DM Sans', sans-serif; }

  .emp-page {
    min-height: 100vh;
    background: #f0f2f7;
    padding: 32px 28px;
  }

  .emp-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 28px;
  }
  .emp-header-title {
    font-family: 'Syne', sans-serif !important;
    font-size: 26px !important;
    font-weight: 800 !important;
    color: #0f172a !important;
    margin: 0 !important;
    letter-spacing: -0.5px;
  }
  .emp-header-sub {
    color: #64748b;
    font-size: 13px;
    margin-top: 2px;
  }

  .emp-stats {
    display: flex;
    gap: 12px;
    margin-bottom: 24px;
    flex-wrap: wrap;
  }
  .emp-stat-chip {
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 12px 20px;
    display: flex;
    align-items: center;
    gap: 10px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.04);
  }
  .emp-stat-chip .icon-wrap {
    width: 36px; height: 36px; border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    font-size: 16px;
  }
  .emp-stat-chip .label { font-size: 11px; color: #94a3b8; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; }
  .emp-stat-chip .value { font-size: 20px; font-weight: 700; color: #0f172a; line-height: 1; }

  .emp-toolbar {
    background: #fff;
    border-radius: 14px;
    padding: 14px 18px;
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;
    border: 1px solid #e2e8f0;
    box-shadow: 0 1px 3px rgba(0,0,0,0.04);
    flex-wrap: wrap;
  }
  .emp-search .ant-input-affix-wrapper {
    border-radius: 10px !important;
    border-color: #e2e8f0 !important;
    background: #f8fafc !important;
    font-size: 13px;
  }
  .emp-search .ant-input-affix-wrapper:focus-within {
    border-color: #6366f1 !important;
    box-shadow: 0 0 0 3px rgba(99,102,241,0.1) !important;
  }

  .emp-add-btn {
    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%) !important;
    border: none !important;
    border-radius: 10px !important;
    height: 38px !important;
    font-weight: 600 !important;
    font-size: 13px !important;
    box-shadow: 0 2px 8px rgba(99,102,241,0.35) !important;
    padding: 0 18px !important;
  }
  .emp-add-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 14px rgba(99,102,241,0.45) !important;
  }

  .emp-table-card {
    background: #fff;
    border-radius: 16px;
    border: 1px solid #e2e8f0;
    overflow: hidden;
    box-shadow: 0 1px 3px rgba(0,0,0,0.04);
  }
  .emp-table-card .ant-table-thead > tr > th {
    background: #f8fafc !important;
    color: #64748b !important;
    font-size: 11px !important;
    font-weight: 600 !important;
    text-transform: uppercase;
    letter-spacing: 0.6px;
    border-bottom: 1px solid #e2e8f0 !important;
    padding: 14px 16px !important;
  }
  .emp-table-card .ant-table-tbody > tr > td {
    padding: 14px 16px !important;
    border-bottom: 1px solid #f1f5f9 !important;
    font-size: 13.5px;
    vertical-align: middle;
  }
  .emp-table-card .ant-table-tbody > tr:hover > td {
    background: #fafbff !important;
  }
  .emp-table-card .ant-table-tbody > tr:last-child > td {
    border-bottom: none !important;
  }

  .emp-avatar-cell { display: flex; align-items: center; gap: 10px; }
  .emp-avatar-initials {
    width: 36px; height: 36px; border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    font-size: 13px; font-weight: 700; color: #fff; flex-shrink: 0;
  }
  .emp-name { font-weight: 600; color: #0f172a; font-size: 13.5px; }
  .emp-email { font-size: 11.5px; color: #94a3b8; }

  .emp-badge {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600;
  }
  .emp-badge-active   { background: #dcfce7; color: #16a34a; }
  .emp-badge-inactive { background: #fee2e2; color: #dc2626; }
  .emp-badge-dot { width: 6px; height: 6px; border-radius: 50%; }
  .emp-badge-active .emp-badge-dot   { background: #16a34a; }
  .emp-badge-inactive .emp-badge-dot { background: #dc2626; }

  .emp-dept-chip {
    background: #eff6ff; color: #3b82f6;
    border: 1px solid #bfdbfe;
    border-radius: 6px; padding: 2px 8px; font-size: 11.5px; font-weight: 500;
  }

  .emp-action-btn {
    width: 32px !important; height: 32px !important;
    border-radius: 8px !important; border: 1px solid #e2e8f0 !important;
    display: flex !important; align-items: center !important; justify-content: center !important;
    background: #fff !important;
  }
  .emp-action-btn:hover { border-color: #6366f1 !important; color: #6366f1 !important; }

  .emp-modal .ant-modal-content { border-radius: 18px !important; overflow: hidden; }
  .emp-modal .ant-modal-header { background: linear-gradient(135deg, #0f172a, #1e293b) !important; padding: 20px 24px !important; border-bottom: none !important; }
  .emp-modal .ant-modal-title { color: #fff !important; font-family: 'Syne', sans-serif !important; font-size: 18px !important; font-weight: 700 !important; }
  .emp-modal .ant-modal-close { color: rgba(255,255,255,0.6) !important; top: 18px !important; }
  .emp-modal .ant-modal-close:hover { color: #fff !important; }
  .emp-modal .ant-modal-body { padding: 24px !important; background: #f8fafc; max-height: 78vh; overflow-y: auto; scrollbar-width: none; }
  .emp-modal .ant-form-item-label > label { font-size: 12px !important; font-weight: 600 !important; color: #475569 !important; text-transform: uppercase; letter-spacing: 0.4px; }
  .emp-modal .ant-input, .emp-modal .ant-input-number, .emp-modal .ant-picker, .emp-modal .ant-select-selector {
    border-radius: 9px !important; border-color: #e2e8f0 !important; font-size: 13.5px !important;
  }
  .emp-modal .ant-input:focus, .emp-modal .ant-picker-focused, .emp-modal .ant-select-focused .ant-select-selector,
  .emp-modal .ant-input-number-focused {
    border-color: #6366f1 !important;
    box-shadow: 0 0 0 3px rgba(99,102,241,0.1) !important;
  }
  .emp-modal-section {
    background: #fff; border-radius: 12px; padding: 20px;
    border: 1px solid #e2e8f0; margin-bottom: 16px;
  }
  .emp-modal-section-title {
    font-size: 11px !important; font-weight: 700 !important; text-transform: uppercase;
    letter-spacing: 0.8px; color: #94a3b8 !important; margin-bottom: 16px !important;
  }
  .emp-submit-btn {
    background: linear-gradient(135deg, #6366f1, #8b5cf6) !important;
    border: none !important; border-radius: 10px !important;
    height: 44px !important; font-size: 14px !important; font-weight: 600 !important;
    box-shadow: 0 2px 8px rgba(99,102,241,0.35) !important;
  }

  .emp-view-modal .ant-modal-content { border-radius: 18px !important; overflow: hidden; }
  .emp-view-modal .ant-modal-body {
    padding: 0 !important;
    background: #f8fafc;
    max-height: 85vh;
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: #cbd5e1 transparent;
    border-radius: 18px;
  }
  .emp-view-modal .ant-modal-body::-webkit-scrollbar { width: 5px; }
  .emp-view-modal .ant-modal-body::-webkit-scrollbar-track { background: transparent; }
  .emp-view-modal .ant-modal-body::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
  .emp-view-modal .ant-modal-body::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
  .emp-view-header {
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
    padding: 28px 28px 70px;
    position: relative;
  }
  .emp-view-body { padding: 0 24px 24px; margin-top: -50px; position: relative; }
  .emp-view-avatar {
    width: 90px; height: 90px; border-radius: 18px;
    border: 3px solid #fff;
    box-shadow: 0 8px 24px rgba(0,0,0,0.15);
    object-fit: cover;
  }
  .emp-view-name { font-family: 'Syne', sans-serif !important; font-size: 22px !important; font-weight: 800 !important; color: #0f172a !important; margin: 0 !important; }
  .emp-info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 16px; }
  .emp-info-item {
    background: #f8fafc; border-radius: 10px; padding: 12px 14px;
    border: 1px solid #e2e8f0;
  }
  .emp-info-label { font-size: 10px; color: #94a3b8; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 3px; }
  .emp-info-value { font-size: 13.5px; color: #0f172a; font-weight: 500; }

  .emp-toggle-wrap { display: flex; align-items: center; gap: 10px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 8px 14px; }
  .emp-toggle-label { font-size: 12.5px; font-weight: 500; color: #475569; }
`;

/* ── color palette for avatars ── */
const AVATAR_COLORS = ['#6366f1','#8b5cf6','#ec4899','#f59e0b','#10b981','#3b82f6','#ef4444','#14b8a6'];
const avatarColor = (name = '') => AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
const initials = (f = '', l = '') => `${f[0] || ''}${l[0] || ''}`.toUpperCase();

export default function Employees() {
  const { showSpinner, hideSpinner } = useContext(SpinnerContext);

  const [employees, setEmployees]           = useState([]);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [modalVisible, setModalVisible]     = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [selectedEmp, setSelectedEmp]       = useState(null);
  const [roleOptions, setRoleOptions]       = useState([]);
  const [teamOptions, setTeamOptions]       = useState([]);
  const [form]                              = Form.useForm();
  const [file, setFile]                     = useState(null);
  const [documents, setDocuments]           = useState([]);
  const [workTypeState, setWorkTypeState]   = useState('fixed');
  const [workWeekState, setWorkWeekState]   = useState('5_days');
  const [timingTypeState, setTimingTypeState] = useState('same');
  const [sameForWeekdays, setSameForWeekdays] = useState(false);
  const [searchText, setSearchText]         = useState('');
  const [showInactive, setShowInactive]     = useState(false);

  useEffect(() => { fetchEmployees(); fetchRoles(); fetchTeams(); }, []);

  const fetchEmployees = async () => {
    showSpinner();
    try {
      const r = await api.get('/employee/employees/');
      const list = r.data.results || r.data;
      setEmployees(list);
    }
    catch (err) {
      console.error('Failed to fetch employees:', err);
      message.error('Failed to load employees');
    }
    finally { hideSpinner(); }
  };

  const fetchRoles = async () => {
    // Hardcoded roles - user-roles endpoint returns object not array
    setRoleOptions([
      { value: 'Admin',     label: 'Admin' },
      { value: 'Founder',   label: 'Founder' },
      { value: 'HR',        label: 'HR' },
      { value: 'Manager',   label: 'Manager' },
      { value: 'Team Lead', label: 'Team Lead' },
      { value: 'Employee',  label: 'Employee' },
      { value: 'Intern',    label: 'Intern' },
    ]);
  };

  const fetchTeams = async () => {
    try {
      const r = await api.get('/employee/teams/');
      const list = r.data.results || r.data;
      setTeamOptions(
        list.map(t => ({ label: t.name, value: t.name }))
            .sort((a, b) => a.label.localeCompare(b.label))
      );
    } catch { setTeamOptions([]); }
  };

  const resetForm = () => {
    setEditingEmployee(null); form.resetFields(); setFile(null);
    setWorkTypeState('fixed'); setWorkWeekState('5_days');
    setTimingTypeState('same'); setSameForWeekdays(false);
  };

  const openAddModal = () => {
    resetForm();
    form.setFieldsValue({ ctc: 0, work_type: 'fixed', work_week_type: '5_days', timing_type: 'same', status: 'active' });
    setModalVisible(true);
  };

  const openEditModal = (record) => {
    setEditingEmployee(record);
    const wType = record.work_type || 'fixed';
    const wWeek = record.work_week_type || '5_days';
    const tType = record.is_same_timing ? 'same' : 'diff';
    setWorkTypeState(wType); setWorkWeekState(wWeek); setTimingTypeState(tType);
    // Convert comma-separated department string → array for multi-select
    const deptArray = (record.department || '').split(',').map(d => d.trim()).filter(Boolean);
    form.setFieldsValue({
      ...record,
      email:          record.user?.email,
      role:           record.user?.role,
      phone_number:   record.contact_number,
      department:     deptArray,
      hire_date:      record.hire_date      ? dayjs(record.hire_date)      : null,
      date_of_birth:  record.date_of_birth  ? dayjs(record.date_of_birth)  : null,
      ctc:            record.ctc ?? 0,
      work_type:      wType,
      work_week_type: wWeek,
      timing_type:    tType,
      fixed_start_time: record.fixed_start_time ? dayjs(record.fixed_start_time, 'HH:mm:ss') : null,
      fixed_end_time:   record.fixed_end_time   ? dayjs(record.fixed_end_time,   'HH:mm:ss') : null,
      profile_picture: record.profile_picture
        ? [{ uid: '-1', name: record.profile_picture.split('/').pop(), status: 'done', url: record.profile_picture }]
        : [],
    });
    if (record.custom_timings && !record.is_same_timing) {
      const cf = {};
      Object.keys(record.custom_timings).forEach(day => {
        if (record.custom_timings[day]?.start) cf[`${day}_start`] = dayjs(record.custom_timings[day].start, 'HH:mm:ss');
        if (record.custom_timings[day]?.end)   cf[`${day}_end`]   = dayjs(record.custom_timings[day].end,   'HH:mm:ss');
      });
      form.setFieldsValue(cf);
    }
    setFile(null);
    setModalVisible(true);
  };

  const openViewModal = (record) => {
    setSelectedEmp(record); fetchEmployeeDocuments(record.id); setViewModalVisible(true);
  };

  const fetchEmployeeDocuments = async (id) => {
    showSpinner();
    try { const r = await api.get(`employee/employees/${id}/documents/`); setDocuments(r.data); }
    catch { message.error('Failed to load documents'); }
    finally { hideSpinner(); }
  };

  const handleDocumentUpload = async ({ file, onSuccess, onError, onProgress }) => {
    const fd = new FormData();
    fd.append('files', file);
    try {
      await api.post(
        `/employee/employees/${selectedEmp.id}/documents/`,
        fd,
        {
          headers: { 'Content-Type': 'multipart/form-data', 'X-CSRFToken': getCookie('csrftoken') },
          onUploadProgress: ({ loaded, total }) => {
            onProgress({ percent: Math.round((loaded / total) * 100) });
          },
        }
      );
      onSuccess('ok');
      await fetchEmployeeDocuments(selectedEmp.id);
    } catch (err) {
      const data = err.response?.data;
      const msg = data
        ? Object.entries(data).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join(' | ')
        : 'Upload failed';
      onError();
      message.error(`${file.name} — ${msg}`);
    }
  };

  const deleteDocument = async (docId) => {
    showSpinner();
    try {
      await api.delete(`/employee/employees/${selectedEmp.id}/documents/${docId}/`);
      message.success('Deleted');
      await fetchEmployeeDocuments(selectedEmp.id);
    }
    catch { message.error('Delete failed'); }
    finally { hideSpinner(); }
  };

  const showDeleteConfirm = (id) => {
    confirm({
      title: 'Delete this employee?',
      icon: <ExclamationCircleOutlined style={{ color: '#f59e0b' }} />,
      content: 'This action cannot be undone.',
      okText: 'Delete', okType: 'danger', cancelText: 'Cancel', centered: true,
      onOk: async () => {
        showSpinner();
        try {
          await api.delete(`employee/employees/${id}/`, { headers: { 'X-CSRFToken': getCookie('csrftoken') } });
          message.success('Employee deleted');
          await fetchEmployees();
        }
        catch { message.error('Failed to delete employee'); }
        finally { hideSpinner(); }
      },
    });
  };

  /* ─────────────────────────────────────────────────────────────
     onFinish — handles both CREATE and EDIT
  ───────────────────────────────────────────────────────────── */
  const onFinish = async (values) => {
    showSpinner();
    const headers      = { 'X-CSRFToken': getCookie('csrftoken') };
    const isSameTiming = values.timing_type !== 'diff';

    // Always convert the multi-select array → comma string right here,
    // so every code path below works with a plain string.
    const departmentStr = Array.isArray(values.department)
      ? values.department.join(', ')
      : (values.department || '');

    const buildTimingData = (fd) => {
      if (values.work_type === 'fixed') {
        if (isSameTiming) {
          if (values.fixed_start_time) fd.append('fixed_start_time', values.fixed_start_time.format('HH:mm:ss'));
          if (values.fixed_end_time)   fd.append('fixed_end_time',   values.fixed_end_time.format('HH:mm:ss'));
          fd.append('custom_timings', '{}');
        } else {
          const days = ['monday','tuesday','wednesday','thursday','friday'];
          if (values.work_week_type === '6_days') days.push('saturday');
          const ct = {};
          days.forEach(d => {
            if (values[`${d}_start`] && values[`${d}_end`])
              ct[d] = { start: values[`${d}_start`].format('HH:mm:ss'), end: values[`${d}_end`].format('HH:mm:ss') };
          });
          fd.append('custom_timings', JSON.stringify(ct));
          fd.append('fixed_start_time', '');
          fd.append('fixed_end_time', '');
        }
      } else {
        fd.append('fixed_start_time', '');
        fd.append('fixed_end_time', '');
        fd.append('custom_timings', '{}');
      }
    };

    try {
      /* ── EDIT ── */
      if (editingEmployee) {
        const fd = new FormData();

        // Simple scalar fields — never include 'department' here
        const scalarFields = [
          'employee_code', 'first_name', 'last_name', 'address', 'position',
          'ctc', 'date_of_birth', 'hire_date', 'uan', 'pan_number',
          'account_no', 'status', 'work_type', 'work_week_type', 'role',
        ];

        scalarFields.forEach(k => {
          const v = values[k];
          if (dayjs.isDayjs(v)) {
            fd.append(k, v.format('YYYY-MM-DD'));
          } else if (v !== undefined && v !== null && v !== '') {
            fd.append(k, v);
          } else if (['ctc', 'uan', 'pan_number', 'account_no', 'position', 'address'].includes(k)) {
            // Send empty string so backend clears the field
            fd.append(k, '');
          }
        });

        // Department — always append as a plain comma string (even empty to clear)
        fd.append('department', departmentStr);

        // Phone is stored under a different key
        fd.append('contact_number', values.phone_number || '');

        fd.append('is_same_timing', isSameTiming ? 'True' : 'False');
        buildTimingData(fd);

        if (values.password) {
          fd.append('password', values.password);
          fd.append('confirm_password', values.confirm_password);
        }

        await api.patch(`employee/employees/${editingEmployee.id}/`, fd, { headers });
        message.success('Employee updated!');

      /* ── CREATE ── */
      } else {
        const fd = new FormData();

        fd.append('first_name',     values.first_name);
        fd.append('last_name',      values.last_name || '');
        fd.append('email',          values.email);
        fd.append('role',           values.role);
        fd.append('employee_code',  values.employee_code);
        fd.append('status',         values.status);
        fd.append('work_type',      values.work_type);
        fd.append('work_week_type', values.work_week_type);
        fd.append('is_same_timing', isSameTiming ? 'True' : 'False');

        if (values.password) {
          fd.append('password',         values.password);
          fd.append('confirm_password', values.confirm_password);
        }

        // Department — plain comma string
        if (departmentStr) fd.append('department', departmentStr);

        // Other optional fields
        ['address', 'position', 'uan', 'pan_number', 'account_no'].forEach(k => {
          if (values[k]) fd.append(k, values[k]);
        });

        if (values.ctc !== undefined) fd.append('ctc', values.ctc);
        if (values.date_of_birth)     fd.append('date_of_birth', values.date_of_birth.format('YYYY-MM-DD'));
        if (values.hire_date)         fd.append('hire_date',     values.hire_date.format('YYYY-MM-DD'));
        if (values.phone_number)      fd.append('contact_number', values.phone_number);
        if (file)                     fd.append('profile_picture', file);

        buildTimingData(fd);

        await api.post('employee/employees/', fd, { headers, withCredentials: true });
        message.success('Employee created!');
      }

      setModalVisible(false);
      resetForm();
      await fetchEmployees();

    } catch (err) {
      const data = err.response?.data || {};

      if (err.response?.status === 403 && data.error === 'user_limit_reached') {
        message.error({
          content: data.message || 'User limit reached. Contact CKPSCA to upgrade.',
          duration: 6,
          style: { marginTop: '20vh' },
        });
        setModalVisible(false);
        return;
      }

      const msg =
        data.email?.[0]    ||
        data.password?.[0] ||
        data.detail        ||
        Object.values(data).flat().join(', ') ||
        'Failed to save employee';
      message.error(msg);
    } finally {
      hideSpinner();
    }
  };

  const handleSameWeekdaysToggle = (e) => {
    setSameForWeekdays(e.target.checked);
    if (e.target.checked) {
      const ms = form.getFieldValue('monday_start');
      const me = form.getFieldValue('monday_end');
      const f  = {};
      ['tuesday','wednesday','thursday','friday'].forEach(d => { f[`${d}_start`] = ms; f[`${d}_end`] = me; });
      form.setFieldsValue(f);
    }
  };

  const onMondayTimeChange = (time, type) => {
    if (sameForWeekdays) {
      const f = {};
      ['tuesday','wednesday','thursday','friday'].forEach(d => { f[`${d}_${type}`] = time; });
      form.setFieldsValue(f);
    }
  };

  /* ── filtered list ── */
  const filteredEmployees = employees
    .filter(e => {
      if (!showInactive && e.status !== 'active') return false;
      const q = searchText.toLowerCase();
      return (
        `${e.first_name} ${e.last_name}`.toLowerCase().includes(q) ||
        (e.employee_code || '').toLowerCase().includes(q) ||
        (e.department    || '').toLowerCase().includes(q) ||
        (e.user?.email   || '').toLowerCase().includes(q)
      );
    })
    .sort((a, b) => `${a.first_name}${a.last_name}`.localeCompare(`${b.first_name}${b.last_name}`));

  /* ── stats ── */
  const activeCount   = employees.filter(e => e.status === 'active').length;
  const inactiveCount = employees.length - activeCount;
  const depts = new Set(
    employees.flatMap(e =>
      (e.department || '').split(',').map(d => d.trim()).filter(Boolean)
    )
  );

  /* ── columns ── */
  const columns = [
    {
      title: '#', key: 'sl',
      render: (_, __, i) => <Text style={{ color: '#94a3b8', fontWeight: 600, fontSize: 12 }}>{i + 1}</Text>,
      width: 50,
    },
    {
      title: 'Employee', key: 'name', width: 240, align: 'center',
      sorter: (a, b) => a.first_name.localeCompare(b.first_name),
      render: (_, r) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {r.profile_picture
            ? <img src={r.profile_picture} alt="" style={{ width: 36, height: 36, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} />
            : <div className="emp-avatar-initials" style={{ background: avatarColor(r.first_name), flexShrink: 0 }}>{initials(r.first_name, r.last_name)}</div>
          }
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div className="emp-name">{r.first_name} {r.last_name}</div>
            <div className="emp-email">{r.user?.email}</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Code', dataIndex: 'employee_code', key: 'code',
      render: v => (
        <Text style={{ fontFamily: 'monospace', fontSize: 12, color: '#6366f1', background: '#eef2ff', padding: '2px 8px', borderRadius: 6 }}>
          {v}
        </Text>
      ),
    },
    {
      title: 'Department', dataIndex: 'department', key: 'dept',
      render: v => {
        const depts = (v || '').split(',').map(d => d.trim()).filter(Boolean);
        if (!depts.length) return <Text type="secondary">—</Text>;
        return (
          <Space size={4} wrap>
            {depts.map(d => <span key={d} className="emp-dept-chip">{d}</span>)}
          </Space>
        );
      },
    },
    {
      title: 'Position', dataIndex: 'position', key: 'pos',
      render: v => <Text style={{ fontSize: 13 }}>{v || '—'}</Text>,
    },
    {
      title: 'Work Mode', key: 'wt',
      render: (_, r) => (
        <Tag
          style={{ borderRadius: 6, fontSize: 11, fontWeight: 600, border: 'none', padding: '2px 8px' }}
          color={r.work_type === 'flexible' ? 'cyan' : 'gold'}
        >
          {r.work_type === 'flexible' ? 'Flexible' : 'Fixed'}
        </Tag>
      ),
    },
    {
      title: 'Status', dataIndex: 'status', key: 'status',
      render: v => (
        <span className={`emp-badge ${v === 'active' ? 'emp-badge-active' : 'emp-badge-inactive'}`}>
          <span className="emp-badge-dot" />
          {v === 'active' ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      title: '', key: 'actions', width: 56,
      render: (_, record) => {
        const items = [
          { key: 'view',   label: 'View Details', icon: <EyeOutlined   style={{ color: '#6366f1' }} />, onClick: () => openViewModal(record) },
          { key: 'edit',   label: 'Edit',         icon: <EditOutlined  style={{ color: '#3b82f6' }} />, onClick: () => openEditModal(record) },
          { key: 'delete', label: 'Delete',       icon: <DeleteOutlined style={{ color: '#ef4444' }} />, onClick: () => showDeleteConfirm(record.id), danger: true },
        ];
        return (
          <Dropdown
            overlay={<Menu items={items.map(i => ({ ...i, onClick: e => { e.domEvent?.stopPropagation(); i.onClick(); } }))} />}
            trigger={['click']}
            placement="bottomRight"
          >
            <Button
              className="emp-action-btn"
              type="text"
              icon={<EllipsisOutlined style={{ fontSize: 18 }} />}
              onClick={e => e.stopPropagation()}
            />
          </Dropdown>
        );
      },
    },
  ];

  /* ── timing section ── */
  const TimingSection = () => (
    <div className="emp-modal-section">
      <Text className="emp-modal-section-title">Work Hours & Schedule</Text>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={12}>
          <Form.Item name="work_type" label="Work Mode" rules={[{ required: true }]}>
            <Radio.Group onChange={e => setWorkTypeState(e.target.value)} buttonStyle="solid">
              <Radio.Button value="fixed">Fixed</Radio.Button>
              <Radio.Button value="flexible">Flexible</Radio.Button>
            </Radio.Group>
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="work_week_type" label="Working Days" rules={[{ required: true }]}>
            <Radio.Group onChange={e => setWorkWeekState(e.target.value)} buttonStyle="solid">
              <Radio.Button value="5_days">5 Days</Radio.Button>
              <Radio.Button value="6_days">6 Days</Radio.Button>
            </Radio.Group>
          </Form.Item>
        </Col>
      </Row>

      {workTypeState === 'fixed' && (
        <>
          <Form.Item name="timing_type" label="Timing Setup">
            <Radio.Group onChange={e => setTimingTypeState(e.target.value)}>
              <Radio value="same">Same for all days</Radio>
              <Radio value="diff">Custom per day</Radio>
            </Radio.Group>
          </Form.Item>

          {timingTypeState === 'same' && (
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="fixed_start_time" label="Start Time" rules={[{ required: true }]}>
                  <TimePicker use12Hours format="h:mm a" minuteStep={5} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="fixed_end_time" label="End Time" rules={[{ required: true }]}>
                  <TimePicker use12Hours format="h:mm a" minuteStep={5} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>
          )}

          {timingTypeState === 'diff' && (
            <div style={{ background: '#f8fafc', borderRadius: 10, padding: 14, border: '1px solid #e2e8f0' }}>
              <div style={{ marginBottom: 12 }}>
                <Checkbox checked={sameForWeekdays} onChange={handleSameWeekdaysToggle}>
                  <Text style={{ fontSize: 13, color: '#475569', fontWeight: 500 }}>Copy Mon timings to Tue–Fri</Text>
                </Checkbox>
              </div>
              {['monday','tuesday','wednesday','thursday','friday',...(workWeekState === '6_days' ? ['saturday'] : [])].map(day => {
                const isDisabled = sameForWeekdays && ['tuesday','wednesday','thursday','friday'].includes(day);
                return (
                  <Row gutter={12} key={day} align="middle" style={{ marginBottom: 10 }}>
                    <Col span={4}>
                      <Text strong style={{ textTransform: 'capitalize', fontSize: 12, color: '#64748b' }}>{day.slice(0, 3)}</Text>
                    </Col>
                    <Col span={10}>
                      <Form.Item name={`${day}_start`} style={{ margin: 0 }} rules={[{ required: true, message: 'Required' }]}>
                        <TimePicker placeholder="Start" use12Hours format="h:mm a" minuteStep={5} style={{ width: '100%' }} disabled={isDisabled}
                          onChange={t => { if (day === 'monday') onMondayTimeChange(t, 'start'); }} />
                      </Form.Item>
                    </Col>
                    <Col span={10}>
                      <Form.Item name={`${day}_end`} style={{ margin: 0 }} rules={[{ required: true, message: 'Required' }]}>
                        <TimePicker placeholder="End" use12Hours format="h:mm a" minuteStep={5} style={{ width: '100%' }} disabled={isDisabled}
                          onChange={t => { if (day === 'monday') onMondayTimeChange(t, 'end'); }} />
                      </Form.Item>
                    </Col>
                  </Row>
                );
              })}
            </div>
          )}
        </>
      )}

      {workTypeState === 'flexible' && (
        <div style={{ background: '#fefce8', border: '1px solid #fde68a', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#92400e' }}>
          ⚡ Minimum 9 hours required · Applies to {workWeekState === '5_days' ? 'Mon–Fri' : 'Mon–Sat'}
        </div>
      )}
    </div>
  );

  return (
    <>
      <style>{CSS}</style>
      <div className="emp-page">

        {/* ── Header ── */}
        <div className="emp-header">
          <div>
            <div className="emp-header-title">Team Directory</div>
            <div className="emp-header-sub">{employees.length} total employees across {depts.size} departments</div>
          </div>
          <Button className="emp-add-btn" type="primary" icon={<PlusOutlined />} onClick={openAddModal}>
            Add Employee
          </Button>
        </div>

        {/* ── Stats ── */}
        <div className="emp-stats">
          {[
            { label: 'Total',       value: employees.length, bg: '#eef2ff', color: '#6366f1', icon: <TeamOutlined /> },
            { label: 'Active',      value: activeCount,      bg: '#dcfce7', color: '#16a34a', icon: <UserOutlined /> },
            { label: 'Inactive',    value: inactiveCount,    bg: '#fee2e2', color: '#dc2626', icon: <UserOutlined /> },
            { label: 'Departments', value: depts.size,       bg: '#eff6ff', color: '#3b82f6', icon: <BankOutlined /> },
          ].map(s => (
            <div className="emp-stat-chip" key={s.label}>
              <div className="icon-wrap" style={{ background: s.bg, color: s.color }}>{s.icon}</div>
              <div>
                <div className="label">{s.label}</div>
                <div className="value">{s.value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Toolbar ── */}
        <div className="emp-toolbar">
          <Input
            className="emp-search"
            prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
            placeholder="Search by name, email, department…"
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            allowClear
            style={{ width: 320 }}
          />
          <div style={{ flex: 1 }} />
          <div className="emp-toggle-wrap">
            <Switch size="small" checked={showInactive} onChange={setShowInactive} />
            <span className="emp-toggle-label">{showInactive ? 'Showing all' : 'Active only'}</span>
          </div>
        </div>

        {/* ── Table ── */}
        <div className="emp-table-card">
          <Table
            columns={columns}
            dataSource={filteredEmployees}
            rowKey="id"
            pagination={filteredEmployees.length > 25
              ? { pageSize: 25, showSizeChanger: false, style: { padding: '12px 20px' } }
              : false}
            bordered={false}
          />
        </div>

        {/* ══ Add / Edit Modal ══ */}
        <Modal
          className="emp-modal"
          title={editingEmployee
            ? `Edit — ${editingEmployee.first_name} ${editingEmployee.last_name}`
            : 'Add New Employee'}
          open={modalVisible}
          onCancel={() => { setModalVisible(false); resetForm(); }}
          footer={null}
          destroyOnClose
          width={820}
          style={{ top: 30 }}
        >
          <Form form={form} layout="vertical" onFinish={onFinish} initialValues={{ role: '' }}>

            {/* Account */}
            <div className="emp-modal-section">
              <Text className="emp-modal-section-title">Account</Text>
              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item label="Employee Code" name="employee_code" rules={[{ required: true }]}>
                    <Input />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item label="Email" name="email" rules={[{ required: true, type: 'email' }]}>
                    <Input />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item label="Role" name="role" rules={[{ required: true }]}>
                    <Select placeholder="Select role">
                      {roleOptions.map(o => <Option key={o.value} value={o.value}>{o.label}</Option>)}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item label="Password" name="password" rules={!editingEmployee ? [{ required: true }] : []}>
                    <Input.Password autoComplete="new-password" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    label="Confirm Password" name="confirm_password"
                    dependencies={['password']}
                    rules={[
                      ...(!editingEmployee ? [{ required: true }] : []),
                      ({ getFieldValue }) => ({
                        validator: (_, v) =>
                          !v || getFieldValue('password') === v
                            ? Promise.resolve()
                            : Promise.reject('Passwords do not match'),
                      }),
                    ]}
                  >
                    <Input.Password autoComplete="new-password" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item label="Status" name="status" rules={[{ required: true }]}>
                    <Select>
                      <Option value="active">Active</Option>
                      <Option value="inactive">Inactive</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
            </div>

            {/* Personal */}
            <div className="emp-modal-section">
              <Text className="emp-modal-section-title">Personal Information</Text>
              <Row gutter={16}>
                <Col span={8}><Form.Item label="First Name" name="first_name" rules={[{ required: true }]}><Input /></Form.Item></Col>
                <Col span={8}><Form.Item label="Last Name"  name="last_name"><Input /></Form.Item></Col>
                <Col span={8}><Form.Item label="Phone"      name="phone_number"><Input /></Form.Item></Col>
              </Row>
              <Row gutter={16}>
                <Col span={8}><Form.Item label="Date of Birth" name="date_of_birth"><DatePicker style={{ width: '100%' }} /></Form.Item></Col>
                <Col span={8}><Form.Item label="Joining Date"  name="hire_date"><DatePicker style={{ width: '100%' }} /></Form.Item></Col>
                <Col span={8}>
                  <Form.Item
                    label="Profile Picture" name="profile_picture"
                    valuePropName="fileList"
                    getValueFromEvent={e => Array.isArray(e) ? e : e?.fileList}
                  >
                    <Upload
                      name="profile_picture" listType="picture"
                      beforeUpload={() => false}
                      onChange={i => setFile(i.fileList[0]?.originFileObj || null)}
                      maxCount={1}
                    >
                      <Button icon={<UploadOutlined />} style={{ borderRadius: 9 }}>Upload</Button>
                    </Upload>
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={24}><Form.Item label="Address" name="address"><Input /></Form.Item></Col>
              </Row>
            </div>

            {/* Employment */}
            <div className="emp-modal-section">
              <Text className="emp-modal-section-title">Employment</Text>
              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item label="Department" name="department">
                    <Select
                      mode="multiple"
                      allowClear
                      showSearch
                      placeholder="Select department(s)"
                      options={teamOptions}
                      optionFilterProp="label"
                    />
                  </Form.Item>
                </Col>
                <Col span={8}><Form.Item label="Position" name="position"><Input /></Form.Item></Col>
                <Col span={8}>
                  <Form.Item label="CTC" name="ctc" rules={[{ type: 'number', transform: v => parseFloat(v) }]}>
                    <InputNumber
                      style={{ width: '100%' }} min={0}
                      formatter={v => `₹ ${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                      parser={v => v.replace(/₹\s?|(,*)/g, '')}
                    />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={8}><Form.Item label="UAN"            name="uan"><Input /></Form.Item></Col>
                <Col span={8}><Form.Item label="PAN Number"     name="pan_number"><Input /></Form.Item></Col>
                <Col span={8}><Form.Item label="Account Number" name="account_no"><Input /></Form.Item></Col>
              </Row>
            </div>

            {/* Timing */}
            <TimingSection />

            <Button htmlType="submit" type="primary" block className="emp-submit-btn">
              {editingEmployee ? 'Save Changes' : 'Create Employee'}
            </Button>
          </Form>
        </Modal>

        {/* ══ View Details Modal ══ */}
        <Modal
          className="emp-view-modal"
          open={viewModalVisible}
          onCancel={() => { setViewModalVisible(false); setSelectedEmp(null); }}
          footer={null}
          destroyOnClose
          width={720}
          style={{ top: 30 }}
          bodyStyle={{ padding: 0, background: '#f8fafc', borderRadius: 18, maxHeight: '85vh', overflowY: 'auto' }}
        >
          {selectedEmp && (
            <>
              <div className="emp-view-header">
                <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>
                  Employee Profile
                </Text>
              </div>

              <div className="emp-view-body">
                {/* avatar + name row */}
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, marginBottom: 20 }}>
                  {selectedEmp.profile_picture
                    ? <img src={selectedEmp.profile_picture} alt="" className="emp-view-avatar" />
                    : <div style={{ width: 90, height: 90, borderRadius: 18, border: '3px solid #fff', boxShadow: '0 8px 24px rgba(0,0,0,0.15)', background: avatarColor(selectedEmp.first_name), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 700, color: '#fff' }}>
                        {initials(selectedEmp.first_name, selectedEmp.last_name)}
                      </div>
                  }
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                      <Text className="emp-view-name">{selectedEmp.first_name} {selectedEmp.last_name}</Text>
                      <span className={`emp-badge ${selectedEmp.status === 'active' ? 'emp-badge-active' : 'emp-badge-inactive'}`}>
                        <span className="emp-badge-dot" />{selectedEmp.status}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                      {selectedEmp.employee_code && (
                        <Text style={{ fontFamily: 'monospace', fontSize: 12, color: '#6366f1', background: '#eef2ff', padding: '2px 8px', borderRadius: 6 }}>
                          {selectedEmp.employee_code}
                        </Text>
                      )}
                      {(selectedEmp.department || '').split(',').map(d => d.trim()).filter(Boolean).map(d => (
                        <span key={d} className="emp-dept-chip">{d}</span>
                      ))}
                      {selectedEmp.position && (
                        <Text style={{ fontSize: 12, color: '#64748b' }}>{selectedEmp.position}</Text>
                      )}
                      <Tag
                        color={selectedEmp.work_type === 'flexible' ? 'cyan' : 'gold'}
                        style={{ borderRadius: 6, border: 'none', fontSize: 11, fontWeight: 600, margin: 0 }}
                      >
                        {selectedEmp.work_type === 'flexible' ? 'Flexible' : 'Fixed Shift'}
                      </Tag>
                    </div>
                  </div>
                  <Button
                    icon={<EditOutlined />}
                    onClick={() => { setViewModalVisible(false); openEditModal(selectedEmp); }}
                    style={{ borderRadius: 10, borderColor: '#e2e8f0', fontSize: 13 }}
                  >
                    Edit
                  </Button>
                </div>

                {/* info grid */}
                <div className="emp-info-grid">
                  {[
                    { label: 'Email',        value: selectedEmp.user?.email, icon: '✉️' },
                    { label: 'Phone',        value: selectedEmp.contact_number, icon: '📞' },
                    { label: 'Date of Birth', value: selectedEmp.date_of_birth ? dayjs(selectedEmp.date_of_birth).format('DD MMM YYYY') : null, icon: '🎂' },
                    { label: 'Joining Date', value: selectedEmp.hire_date     ? dayjs(selectedEmp.hire_date).format('DD MMM YYYY')     : null, icon: '📅' },
                    { label: 'Department',   value: (selectedEmp.department || '').split(',').map(d => d.trim()).filter(Boolean).join(' · ') || null, icon: '🏢' },
                    { label: 'Role',         value: selectedEmp.user?.role,  icon: '🎯' },
                    { label: 'CTC',          value: selectedEmp.ctc ? `₹${parseFloat(selectedEmp.ctc).toLocaleString('en-IN')}` : null, icon: '💰' },
                    { label: 'UAN',          value: selectedEmp.uan,         icon: '🔖' },
                    { label: 'PAN',          value: selectedEmp.pan_number,  icon: '🪪' },
                    { label: 'Account No.',  value: selectedEmp.account_no,  icon: '🏦' },
                    { label: 'Address',      value: selectedEmp.address,     icon: '📍', full: true },
                  ].filter(i => i.value).map(i => (
                    <div key={i.label} className="emp-info-item" style={i.full ? { gridColumn: '1 / -1' } : {}}>
                      <div className="emp-info-label">{i.icon} {i.label}</div>
                      <div className="emp-info-value">{i.value}</div>
                    </div>
                  ))}
                </div>

                {/* schedule */}
                {selectedEmp.work_type === 'fixed' && (
                  <div style={{ marginTop: 16, background: '#fff', borderRadius: 12, padding: 16, border: '1px solid #e2e8f0' }}>
                    <Text style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6, color: '#94a3b8', display: 'block', marginBottom: 12 }}>
                      ⏰ Working Schedule
                    </Text>
                    {selectedEmp.is_same_timing || !selectedEmp.custom_timings ? (
                      <Tag color="processing" style={{ padding: '4px 14px', fontSize: 13, fontWeight: 600, borderRadius: 8 }}>
                        {dayjs(selectedEmp.fixed_start_time, 'HH:mm:ss').format('h:mm A')} → {dayjs(selectedEmp.fixed_end_time, 'HH:mm:ss').format('h:mm A')}
                      </Tag>
                    ) : (
                      <Row gutter={[8, 8]}>
                        {['monday','tuesday','wednesday','thursday','friday','saturday'].map(d => {
                          const t = selectedEmp.custom_timings?.[d];
                          if (!t) return null;
                          return (
                            <Col key={d} span={8}>
                              <div style={{ background: '#f8fafc', borderRadius: 8, padding: '8px 10px', border: '1px solid #e2e8f0' }}>
                                <Text style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', display: 'block' }}>{d.slice(0,3)}</Text>
                                <Text style={{ fontSize: 12, fontWeight: 600, color: '#0f172a' }}>
                                  {dayjs(t.start,'HH:mm:ss').format('h:mm A')} – {dayjs(t.end,'HH:mm:ss').format('h:mm A')}
                                </Text>
                              </div>
                            </Col>
                          );
                        })}
                      </Row>
                    )}
                  </div>
                )}

                {/* documents */}
                <div style={{ marginTop: 16, background: '#fff', borderRadius: 12, padding: 16, border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <Text style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6, color: '#94a3b8' }}>📎 Documents</Text>
                    <Upload
                      customRequest={handleDocumentUpload}
                      multiple
                      accept=".pdf,.jpg,.jpeg,.png,.xlsx,.docx"
                      showUploadList={{ showRemoveIcon: false }}
                      itemRender={(originNode, file) => (
                        <div style={{ fontSize: 12, padding: '2px 0', color: file.status === 'error' ? '#ef4444' : file.status === 'done' ? '#16a34a' : '#6366f1' }}>
                          {file.name} {file.status === 'uploading' ? `— ${file.percent || 0}%` : file.status === 'done' ? '✓' : file.status === 'error' ? '✗' : ''}
                        </div>
                      )}
                    >
                      <Button size="small" icon={<UploadOutlined />} style={{ borderRadius: 8, fontSize: 12 }}>Upload Files</Button>
                    </Upload>
                  </div>
                  {documents.length === 0
                    ? <Text style={{ color: '#94a3b8', fontSize: 13 }}>No documents uploaded yet.</Text>
                    : (
                      <Table
                        dataSource={documents} rowKey="id" pagination={false} size="small"
                        columns={[
                          {
                            title: 'File', dataIndex: 'file_name',
                            render: t => <Text ellipsis={{ tooltip: t }} style={{ fontSize: 13 }}>{t}</Text>,
                          },
                          {
                            title: '', key: 'act', width: 80, align: 'right',
                            render: (_, r) => (
                              <Space>
                                <Button type="text" size="small" icon={<EyeOutlined />}    onClick={() => window.open(r.file_url, '_blank')} />
                                <Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={() => deleteDocument(r.id)} />
                              </Space>
                            ),
                          },
                        ]}
                      />
                    )
                  }
                </div>
              </div>
            </>
          )}
        </Modal>

      </div>
    </>
  );
}