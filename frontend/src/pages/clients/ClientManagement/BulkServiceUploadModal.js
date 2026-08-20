/**
 * BulkServiceUploadModal.jsx
 *
 * Self-contained modal. Fetches its own data so it works from
 * ClientGroupListView without needing extra props drilled down.
 *
 * Integration — two small changes needed (see bottom of this file):
 *   1. ClientGroupListView.js  — add button + import
 *   2. ClientManagementPage.js — pass token prop (already has it)
 */

import React, { useState, useRef } from 'react';
import {
  Modal, Button, Upload, Table, Tag, Space, Steps,
  Alert, Spin, message, Tooltip, Typography,
} from 'antd';
import {
  FileExcelOutlined, UploadOutlined, DownloadOutlined,
  CheckCircleOutlined, CloseCircleOutlined, WarningOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { api } from '../../../services/api';
import * as XLSX from 'xlsx';

const { Text } = Typography;

/* ─── SheetJS ───────────────────────────────────────────────────── */
// Install once:  npm install xlsx

function loadXLSX() { return Promise.resolve(XLSX); }

/* ─── Helpers ───────────────────────────────────────────────────── */
function toStr(v) {
  if (v == null) return '';
  return String(v).trim();
}
function toNum(v) {
  if (v == null || v === '') return null;
  const n = Number(v);
  return isNaN(n) ? null : n;
}
function toBool(v, def = true) {
  if (v == null || v === '') return def;
  if (typeof v === 'boolean') return v;
  return !['0', 'false', 'no', 'n'].includes(String(v).toLowerCase().trim());
}
function toDate(v) {
  if (v == null || v === '') return null;
  if (v instanceof Date) return v.toISOString().split('T')[0];
  const s = toStr(v);
  return s || null;
}

/* ─── Generate downloadable template ───────────────────────────── */
async function downloadTemplate(clients, groups, subServices, mainServices) {
  const XLSX = await loadXLSX();
  const wb = XLSX.utils.book_new();

  const thin = () => ({ style: 'thin', color: { rgb: 'D1D5DB' } });
  const hdrStyle = {
    font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 11, name: 'Arial' },
    fill: { patternType: 'solid', fgColor: { rgb: '1E3A5F' } },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: { top: thin(), bottom: thin(), left: thin(), right: thin() },
  };
  const cellStyle = (bg = 'FFFFFF') => ({
    font: { sz: 10, name: 'Arial', color: { rgb: '1E293B' } },
    fill: { patternType: 'solid', fgColor: { rgb: bg } },
    alignment: { vertical: 'center' },
    border: { top: thin(), bottom: thin(), left: thin(), right: thin() },
  });

  function styleSheet(ws, headerCount, dataRows) {
    for (let ci = 0; ci < headerCount; ci++) {
      const addr = XLSX.utils.encode_cell({ r: 0, c: ci });
      if (ws[addr]) ws[addr].s = hdrStyle;
    }
    for (let ri = 1; ri <= dataRows; ri++) {
      const bg = ri % 2 === 0 ? 'F8FAFC' : 'FFFFFF';
      for (let ci = 0; ci < headerCount; ci++) {
        const addr = XLSX.utils.encode_cell({ r: ri, c: ci });
        if (ws[addr]) ws[addr].s = cellStyle(bg);
      }
    }
  }

  /* Sheet 1 — assignments (blank template, user fills this) */
  const asgHdr = ['Client Name', 'Group Name', 'Sub Service Name', 'Fee', 'Period', 'Due Date', 'Active'];
  const ws1 = XLSX.utils.aoa_to_sheet([asgHdr]);
  ws1['!cols'] = [28, 28, 30, 12, 18, 16, 10].map(w => ({ wch: w }));
  styleSheet(ws1, asgHdr.length, 0);
  XLSX.utils.book_append_sheet(wb, ws1, 'assignments');

  /* Sheet 2 — client_list */
  const clientRows = clients.map(c => {
    const grp = groups.find(g => (g.clients || []).some(cl => cl.id === c.id));
    return [c.name, grp ? grp.group_name : ''];
  });
  const ws2 = XLSX.utils.aoa_to_sheet([
    ['Client Name', 'Group Name'],
    ...clientRows,
  ]);
  ws2['!cols'] = [{ wch: 32 }, { wch: 28 }];
  styleSheet(ws2, 2, clientRows.length);
  XLSX.utils.book_append_sheet(wb, ws2, 'client_list');

  /* Sheet 3 — service_list */
  const svcRows = subServices.map(sub => {
    const mainId = typeof sub.main_service === 'object' ? sub.main_service.id : sub.main_service;
    const main = mainServices.find(m => m.id === mainId);
    return [sub.name, main ? main.name : '', sub.period || ''];
  });
  const ws3 = XLSX.utils.aoa_to_sheet([
    ['Sub Service Name', 'Main Service', 'Default Period'],
    ...svcRows,
  ]);
  ws3['!cols'] = [{ wch: 34 }, { wch: 26 }, { wch: 16 }];
  styleSheet(ws3, 3, svcRows.length);
  XLSX.utils.book_append_sheet(wb, ws3, 'service_list');

  /* Sheet 4 — instructions */
  const instrRows = [
    ['Field', 'Required?', 'What to enter'],
    ['Client Name',       'YES', 'Exact name from client_list sheet'],
    ['Group Name',        'YES', 'Exact group name from client_list sheet'],
    ['Sub Service Name',  'YES', 'Exact name from service_list sheet'],
    ['Fee',               'No',  'Number e.g. 15000. Leave blank for NULL'],
    ['Period',            'No',  'Monthly / Quarterly / Half-Yearly / Annually / One-Time'],
    ['Due Date',          'No',  'YYYY-MM-DD e.g. 2025-03-31. Leave blank for NULL'],
    ['Active',            'No',  '1 = active (default), 0 = inactive'],
    [],
    ['Rules', '', ''],
    ['', '1.', 'One row = one service assigned to one client'],
    ['', '2.', 'Rows where Client Name is blank are ignored'],
    ['', '3.', 'Already-assigned (Client + Sub Service) combos are skipped automatically'],
    ['', '4.', 'Names must match exactly — copy from client_list / service_list tabs'],
  ];
  const ws4 = XLSX.utils.aoa_to_sheet(instrRows);
  ws4['!cols'] = [{ wch: 22 }, { wch: 10 }, { wch: 55 }];
  styleSheet(ws4, 3, instrRows.length - 1);
  XLSX.utils.book_append_sheet(wb, ws4, 'instructions');

  XLSX.writeFile(wb, 'bulk_service_assignment.xlsx');
}

/* ─── Parse uploaded file → preview rows ───────────────────────── */
async function parseUpload(file, clients, groups, mainServices, subServices) {
  const XLSX = await loadXLSX();
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: 'array', cellDates: true });

  const ws = wb.Sheets['assignments'];
  if (!ws) throw new Error("Sheet named 'assignments' not found in the uploaded file.");

  const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });
  if (rows.length === 0) throw new Error("No data rows found in the 'assignments' sheet.");

  // Build lookup maps (case-insensitive)
  const clientMap = new Map(clients.map(c => [c.name.trim().toLowerCase(), c]));

  const groupMap = new Map(groups.map(g => [g.group_name.trim().toLowerCase(), g]));

  // subService → { id, main_service_id }
  const subMap = new Map();
  subServices.forEach(sub => {
    const mainId = typeof sub.main_service === 'object' ? sub.main_service.id : sub.main_service;
    subMap.set(sub.name.trim().toLowerCase(), { id: sub.id, main_service_id: mainId });
  });

  // Build existing assignment set: "clientId_subServiceId"
  const existingSet = new Set();
  groups.forEach(g => {
    (g.group_services || []).forEach(s => {
      existingSet.add(`${s.client}_${s.sub_service}`);
    });
  });

  return rows.map((row, i) => {
    const excelRow = i + 2;
    const clientName = toStr(row['Client Name']);
    const groupName  = toStr(row['Group Name']);
    const subName    = toStr(row['Sub Service Name']);

    if (!clientName) return null; // blank row

    const errors = [];

    const client = clientMap.get(clientName.toLowerCase());
    if (!client) errors.push(`Client "${clientName}" not found`);

    const group = groupMap.get(groupName.toLowerCase());
    if (!group) errors.push(`Group "${groupName}" not found`);

    if (!subName) {
      errors.push('Sub Service Name is required');
    }
    const sub = subName ? subMap.get(subName.toLowerCase()) : null;
    if (subName && !sub) errors.push(`Sub service "${subName}" not found`);

    if (errors.length > 0) {
      return { _row: excelRow, status: 'error', error: errors.join(' | '), clientName, groupName, subName };
    }

    // Duplicate check
    const dupKey = `${client.id}_${sub.id}`;
    if (existingSet.has(dupKey)) {
      return {
        _row: excelRow, status: 'duplicate',
        clientName, groupName, subName,
        client_id: client.id, group_id: group.id,
        main_service_id: sub.main_service_id, sub_service_id: sub.id,
      };
    }

    return {
      _row:             excelRow,
      status:           'ok',
      clientName,
      groupName,
      subName,
      client_id:        client.id,
      group_id:         group.id,
      main_service_id:  sub.main_service_id,
      sub_service_id:   sub.id,
      fee:              toNum(row['Fee']),
      period:           toStr(row['Period']) || null,
      due_date:         toDate(row['Due Date']),
      is_active:        toBool(row['Active'], true),
    };
  }).filter(Boolean);
}

/* ─── MAIN COMPONENT ────────────────────────────────────────────── */
export default function BulkServiceUploadModal({ token, onDone }) {
  const [open,        setOpen]        = useState(false);
  const [step,        setStep]        = useState(0); // 0=upload, 1=preview, 2=done
  const [fetching,    setFetching]    = useState(false);
  const [parsing,     setParsing]     = useState(false);
  const [importing,   setImporting]   = useState(false);
  const [genLoading,  setGenLoading]  = useState(false);
  const [fetchError,  setFetchError]  = useState('');
  const [parseError,  setParseError]  = useState('');

  // fetched reference data
  const [clients,     setClients]     = useState([]);
  const [groups,      setGroups]      = useState([]);
  const [mainSvcs,    setMainSvcs]    = useState([]);
  const [subSvcs,     setSubSvcs]     = useState([]);
  const [dataReady,   setDataReady]   = useState(false);

  // preview
  const [previewRows, setPreviewRows] = useState([]);
  const [importResult, setImportResult] = useState({ ok: 0, failed: 0 });

  const headers = { Authorization: `Bearer ${token}` };

  /* ── Fetch reference data when modal opens ── */
  const fetchData = async () => {
    if (dataReady) return;
    setFetching(true);
    setFetchError('');
    try {
      const [clientsRes, groupsRes, mainRes, subRes] = await Promise.all([
        api.get('/clients/clients/?page_size=500', { headers }),
        api.get('/clients/client-groups/',          { headers }),
        api.get('/clients/mainservices/',            { headers }),
        api.get('/clients/subservices/',             { headers }),
      ]);
      setClients(clientsRes.data.results   || clientsRes.data);
      setGroups(groupsRes.data.results     || groupsRes.data);
      setMainSvcs(mainRes.data.results     || mainRes.data);
      setSubSvcs(subRes.data.results       || subRes.data);
      setDataReady(true);
    } catch (e) {
      setFetchError('Failed to load reference data. Please close and try again.');
    } finally {
      setFetching(false);
    }
  };

  const handleOpen = () => {
    setOpen(true);
    setStep(0);
    setPreviewRows([]);
    setParseError('');
    fetchData();
  };

  const handleClose = () => {
    setOpen(false);
    setStep(0);
    setPreviewRows([]);
    setParseError('');
    setImportResult({ ok: 0, failed: 0 });
  };

  /* ── Download template ── */
  const handleDownload = async () => {
    if (!dataReady) return;
    setGenLoading(true);
    try {
      await downloadTemplate(clients, groups, subSvcs, mainSvcs);
    } catch (e) {
      message.error('Could not generate template: ' + e.message);
    } finally {
      setGenLoading(false);
    }
  };

  /* ── File chosen ── */
  const handleFile = async (file) => {
    setParseError('');
    setPreviewRows([]);
    setParsing(true);
    try {
      const rows = await parseUpload(file, clients, groups, mainSvcs, subSvcs);
      setPreviewRows(rows);
      setStep(1);
    } catch (e) {
      setParseError(e.message);
    } finally {
      setParsing(false);
    }
    return false; // stop antd auto-upload
  };

  /* ── Import confirmed ── */
  const handleImport = async () => {
    const toInsert = previewRows.filter(r => r.status === 'ok');
    if (toInsert.length === 0) return;

    setImporting(true);
    let ok = 0, failed = 0;

    for (const row of toInsert) {
      try {
        await api.post(
          '/clients/client-group-services/',
          {
            client:       row.client_id,
            client_group: row.group_id,
            main_service: row.main_service_id,
            sub_service:  row.sub_service_id,
            fee:          row.fee,
            period:       row.period,
            due_date:     row.due_date,
            is_active:    row.is_active,
          },
          { headers }
        );
        ok++;
      } catch (err) {
        console.error('Failed row:', row, err);
        failed++;
      }
    }

    setImporting(false);
    setImportResult({ ok, failed });
    setStep(2);

    if (ok > 0) {
      message.success(`${ok} service${ok > 1 ? 's' : ''} assigned successfully`);
      onDone?.();
    }
    if (failed > 0) {
      message.error(`${failed} row${failed > 1 ? 's' : ''} failed to save`);
    }
  };

  /* ── Preview table columns ── */
  const okRows  = previewRows.filter(r => r.status === 'ok');
  const dupRows = previewRows.filter(r => r.status === 'duplicate');
  const errRows = previewRows.filter(r => r.status === 'error');

  const previewColumns = [
    {
      title: 'Row', dataIndex: '_row', width: 55,
      render: v => <span style={{ fontSize: 11, color: '#94a3b8' }}>{v}</span>,
    },
    {
      title: 'Client', dataIndex: 'clientName', ellipsis: true,
      render: v => <Text strong style={{ fontSize: 12 }}>{v}</Text>,
    },
    {
      title: 'Group', dataIndex: 'groupName', ellipsis: true,
      render: v => <Text style={{ fontSize: 12 }}>{v}</Text>,
    },
    {
      title: 'Sub Service', dataIndex: 'subName', ellipsis: true,
      render: v => <Text style={{ fontSize: 12 }}>{v}</Text>,
    },
    {
      title: 'Fee', dataIndex: 'fee', width: 85,
      render: v => v != null
        ? <span style={{ fontSize: 12 }}>₹{v.toLocaleString('en-IN')}</span>
        : <span style={{ color: '#d1d5db' }}>—</span>,
    },
    {
      title: 'Period', dataIndex: 'period', width: 105,
      render: v => v ? <Tag color="blue" style={{ fontSize: 11 }}>{v}</Tag>
                     : <span style={{ color: '#d1d5db' }}>—</span>,
    },
    {
      title: 'Status', dataIndex: 'status', width: 120, fixed: 'right',
      render: (s, row) => {
        if (s === 'ok')        return <Tag icon={<CheckCircleOutlined />} color="success">Will import</Tag>;
        if (s === 'duplicate') return <Tag icon={<WarningOutlined />}      color="warning">Duplicate</Tag>;
        return (
          <Tooltip title={row.error}>
            <Tag icon={<CloseCircleOutlined />} color="error">Error</Tag>
          </Tooltip>
        );
      },
    },
  ];

  /* ── Modal footer per step ── */
  const footer = () => {
    if (step === 0) return [
      <Button key="cancel" onClick={handleClose}>Cancel</Button>,
    ];
    if (step === 1) return [
      <Button key="back" onClick={() => { setStep(0); setPreviewRows([]); }}>
        ← Back
      </Button>,
      <Button
        key="import"
        type="primary"
        loading={importing}
        disabled={okRows.length === 0}
        icon={<ThunderboltOutlined />}
        style={{ background: '#10b981', borderColor: '#10b981' }}
        onClick={handleImport}
      >
        Import {okRows.length} service{okRows.length !== 1 ? 's' : ''}
      </Button>,
    ];
    // step 2
    return [
      <Button key="close" type="primary" onClick={handleClose}>Close</Button>,
    ];
  };

  return (
    <>
      {/* ── Trigger button — sits in the header next to Add Client Group ── */}
      <Button
        icon={<FileExcelOutlined />}
        onClick={handleOpen}
        style={{ borderColor: '#10b981', color: '#10b981' }}
      >
        Bulk Add Services
      </Button>

      <Modal
        title={
          <Space>
            <FileExcelOutlined style={{ color: '#10b981' }} />
            <span style={{ fontWeight: 700 }}>Bulk Add Services</span>
          </Space>
        }
        open={open}
        onCancel={handleClose}
        width={920}
        footer={footer()}
        destroyOnClose
      >
        {/* Steps indicator */}
        <Steps
          size="small"
          current={step}
          style={{ marginBottom: 24 }}
          items={[
            { title: 'Upload Excel' },
            { title: 'Review' },
            { title: 'Done' },
          ]}
        />

        {/* ── Step 0: Upload ── */}
        {step === 0 && (
          <div>
            {fetching && (
              <div style={{ textAlign: 'center', padding: '32px 0' }}>
                <Spin /> <span style={{ marginLeft: 10, color: '#64748b' }}>Loading reference data…</span>
              </div>
            )}

            {fetchError && <Alert type="error" message={fetchError} style={{ marginBottom: 16 }} />}

            {!fetching && dataReady && (
              <>
                {/* How it works */}
                <div style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: 10,
                  padding: '14px 18px',
                  marginBottom: 20,
                }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: '#0f172a', marginBottom: 10 }}>
                    How it works
                  </div>
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    {[
                      { n: '1', text: 'Download the template below' },
                      { n: '2', text: 'Fill in Client, Group & Sub Service names' },
                      { n: '3', text: 'Upload the filled file' },
                      { n: '4', text: 'Review & confirm' },
                    ].map(s => (
                      <div key={s.n} style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        background: '#fff', border: '1px solid #e2e8f0',
                        borderRadius: 8, padding: '8px 12px', flex: '1 1 160px',
                      }}>
                        <div style={{
                          width: 24, height: 24, borderRadius: '50%',
                          background: '#eef2ff', color: '#6366f1',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 700, fontSize: 12, flexShrink: 0,
                        }}>{s.n}</div>
                        <span style={{ fontSize: 12, color: '#475569' }}>{s.text}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Download template */}
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  background: '#f0fdf4', border: '1px solid #bbf7d0',
                  borderRadius: 10, padding: '12px 16px', marginBottom: 20,
                }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13, color: '#065f46' }}>
                      Step 1 — Download the template
                    </div>
                    <div style={{ fontSize: 12, color: '#047857', marginTop: 2 }}>
                      Pre-loaded with all your clients, groups and available services as reference sheets.
                    </div>
                  </div>
                  <Button
                    icon={<DownloadOutlined />}
                    loading={genLoading}
                    onClick={handleDownload}
                    style={{ borderColor: '#10b981', color: '#10b981', flexShrink: 0 }}
                  >
                    Download Template
                  </Button>
                </div>

                {/* Upload area */}
                <div style={{
                  background: '#fffbeb', border: '1px solid #fde68a',
                  borderRadius: 10, padding: '12px 16px', marginBottom: 16,
                }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: '#92400e', marginBottom: 2 }}>
                    Step 2 — Upload filled Excel
                  </div>
                  <div style={{ fontSize: 12, color: '#b45309', marginBottom: 12 }}>
                    Fill in the <code>assignments</code> sheet and upload it here.
                    Client Name, Group Name and Sub Service Name must match exactly.
                  </div>
                  <Upload
                    accept=".xlsx,.xls"
                    showUploadList={false}
                    beforeUpload={handleFile}
                    disabled={parsing}
                  >
                    <Button
                      icon={parsing ? <Spin size="small" /> : <UploadOutlined />}
                      disabled={parsing}
                      size="large"
                      style={{
                        borderRadius: 8, borderStyle: 'dashed',
                        width: '100%', height: 52, fontSize: 14,
                      }}
                    >
                      {parsing ? 'Reading file…' : 'Click or drag Excel file here to upload'}
                    </Button>
                  </Upload>
                </div>

                {parseError && (
                  <Alert type="error" message={parseError} showIcon closable
                    onClose={() => setParseError('')} style={{ borderRadius: 8 }} />
                )}

                {/* Quick stats */}
                <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
                  {[
                    { label: 'Clients', val: clients.length, color: '#6366f1', bg: '#eef2ff' },
                    { label: 'Groups',  val: groups.length,  color: '#0891b2', bg: '#e0f2fe' },
                    { label: 'Sub Services', val: subSvcs.length, color: '#059669', bg: '#d1fae5' },
                  ].map(s => (
                    <div key={s.label} style={{
                      flex: 1, padding: '8px 12px', borderRadius: 8,
                      background: s.bg, textAlign: 'center',
                    }}>
                      <div style={{ fontWeight: 700, fontSize: 18, color: s.color }}>{s.val}</div>
                      <div style={{ fontSize: 11, color: s.color, opacity: 0.8 }}>{s.label} loaded</div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* ── Step 1: Preview ── */}
        {step === 1 && (
          <div>
            {/* Summary pills */}
            <Space wrap style={{ marginBottom: 16 }}>
              <Tag color="success" style={{ padding: '3px 12px', borderRadius: 20, fontSize: 13 }}>
                <CheckCircleOutlined /> {okRows.length} will import
              </Tag>
              {dupRows.length > 0 && (
                <Tag color="warning" style={{ padding: '3px 12px', borderRadius: 20, fontSize: 13 }}>
                  <WarningOutlined /> {dupRows.length} duplicate{dupRows.length > 1 ? 's' : ''} — skipped
                </Tag>
              )}
              {errRows.length > 0 && (
                <Tag color="error" style={{ padding: '3px 12px', borderRadius: 20, fontSize: 13 }}>
                  <CloseCircleOutlined /> {errRows.length} error{errRows.length > 1 ? 's' : ''} — skipped
                </Tag>
              )}
            </Space>

            {errRows.length > 0 && (
              <Alert
                type="warning"
                showIcon
                message="Rows with errors will be skipped. Fix them in the Excel and re-upload if needed."
                style={{ marginBottom: 12, borderRadius: 8 }}
              />
            )}

            <Table
              dataSource={previewRows}
              columns={previewColumns}
              rowKey="_row"
              size="small"
              scroll={{ x: 820 }}
              pagination={previewRows.length > 15 ? { pageSize: 15, size: 'small' } : false}
              rowClassName={row =>
                row.status === 'error'     ? 'bulk-svc-err' :
                row.status === 'duplicate' ? 'bulk-svc-dup' : ''
              }
            />
            <style>{`
              .bulk-svc-err td { background: #fff5f5 !important; }
              .bulk-svc-dup td { background: #fffbeb !important; }
            `}</style>
          </div>
        )}

        {/* ── Step 2: Done ── */}
        {step === 2 && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: '#d1fae5', color: '#059669',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 30, margin: '0 auto 16px',
            }}>
              <CheckCircleOutlined />
            </div>
            <div style={{ fontWeight: 700, fontSize: 18, color: '#0f172a', marginBottom: 8 }}>
              {importResult.ok} service{importResult.ok !== 1 ? 's' : ''} assigned
            </div>
            {importResult.failed > 0 && (
              <div style={{ color: '#ef4444', fontSize: 13, marginBottom: 8 }}>
                {importResult.failed} row{importResult.failed > 1 ? 's' : ''} failed to save
              </div>
            )}
            {dupRows.length > 0 && (
              <div style={{ color: '#92400e', fontSize: 13 }}>
                {dupRows.length} duplicate{dupRows.length > 1 ? 's' : ''} were skipped
              </div>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}


/* ═══════════════════════════════════════════════════════════════
   INTEGRATION INSTRUCTIONS
   ═══════════════════════════════════════════════════════════════

── 1. ClientGroupListView.js ──────────────────────────────────

ADD import at the top:
  import BulkServiceUploadModal from './BulkServiceUploadModal';

CHANGE the prop signature to accept token:
  function ClientGroupListView({ clientGroups, onViewGroupDetails, onAddGroup,
                                  allGroupCategories, allSpocs, currentUser, token }) {

FIND the button Space block:
  <Space>
    <Button type="primary" icon={<PlusOutlined />} onClick={onAddGroup}>
      Add Client Group
    </Button>
    <Button icon={<ReloadOutlined />} onClick={() => window.location.reload()}>
      Refresh
    </Button>
  </Space>

REPLACE WITH:
  <Space>
    <BulkServiceUploadModal token={token} />
    <Button type="primary" icon={<PlusOutlined />} onClick={onAddGroup}>
      Add Client Group
    </Button>
    <Button icon={<ReloadOutlined />} onClick={() => window.location.reload()}>
      Refresh
    </Button>
  </Space>


── 2. ClientManagementPage.js ─────────────────────────────────

FIND the ClientGroupListView usage (case 'listClientGroups'):
  <ClientGroupListView
    clientGroups={clientGroups}
    allGroupCategories={groupCategories}
    allSpocs={spocs}
    onAddGroup={...}
    onViewGroupDetails={...}
  />

ADD the token prop:
  <ClientGroupListView
    clientGroups={clientGroups}
    allGroupCategories={groupCategories}
    allSpocs={spocs}
    onAddGroup={...}
    onViewGroupDetails={...}
    token={token}         ← add this line
  />

That's it. No other changes needed anywhere.
═══════════════════════════════════════════════════════════════ */