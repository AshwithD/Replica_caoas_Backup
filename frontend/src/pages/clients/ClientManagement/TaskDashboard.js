
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
    Col, Row, Typography, message, Table, DatePicker,
    Select, Space, Button, Segmented, Modal, Spin, Progress, Tooltip,
} from 'antd';
import { api } from '../../../services/api';
import EChartsReact from 'echarts-for-react';
import CountUp from 'react-countup';
import {
    ClockCircleOutlined, CheckCircleOutlined,
    MinusCircleOutlined, ExclamationCircleOutlined,
    FilterOutlined, ClearOutlined, ReloadOutlined,
    BarChartOutlined,
} from '@ant-design/icons';
import { FcList } from 'react-icons/fc';
import moment from 'moment';
import { formatDurationFromMillis } from './STT_Records';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

/* ─── Design tokens ─────────────────────────────────────────── */
const C = {
    done:       '#10b981',
    inProgress: '#f59e0b',
    overdue:    '#ef4444',
    toDo:       '#6366f1',
    all:        '#0f172a',
    bg:         '#f1f5f9',
    surface:    '#ffffff',
    border:     '#e2e8f0',
    text:       '#0f172a',
    muted:      '#64748b',
};

const STATUS_META = {
    'Done':        { color: C.done,       light: '#d1fae5' },
    'In Progress': { color: C.inProgress, light: '#fef3c7' },
    'Over Due':    { color: C.overdue,    light: '#fee2e2' },
    'To Do':       { color: C.toDo,       light: '#ede9fe' },
};

/* ══════════════ DASHBOARD LOADER ══════════════ */
const LOADER_LABELS = [
    'Loading analytics…',
    'Fetching task data…',
    'Crunching time logs…',
    'Almost ready…',
];

const loaderStyles = `
@keyframes dlSpin       { to { transform: rotate(360deg); } }
@keyframes dlArcFill    { from { stroke-dashoffset: 160; } to { stroke-dashoffset: 0; } }
@keyframes dlPulse      { 0%,100%{ opacity:1; transform:scale(1); } 50%{ opacity:0.5; transform:scale(0.88); } }
@keyframes dlBarBounce  { 0%,100%{ transform:scaleY(1); opacity:0.7; } 50%{ transform:scaleY(0.35); opacity:0.3; } }
@keyframes dlFadeInOut  { 0%,100%{ opacity:0.4; } 50%{ opacity:1; } }
@keyframes dlOverlayOut { to { opacity:0; visibility:hidden; } }

.dl-overlay {
    position: absolute; inset: 0; z-index: 9999;
    background: #f1f5f9;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    gap: 28px;
    transition: opacity 0.55s ease, visibility 0.55s ease;
    pointer-events: all;
    font-family: "DM Sans","Segoe UI",sans-serif;
}
.dl-overlay.dl-gone { opacity:0; visibility:hidden; pointer-events:none; }

.dl-ring-wrap { position:relative; width:80px; height:80px; }
.dl-ring-wrap svg { width:80px; height:80px; display:block; }

.dl-spin {
    position:absolute; inset:-10px;
    width:100px; height:100px;
    border:2.5px solid transparent;
    border-top-color:#6366f1;
    border-right-color:#6366f133;
    border-radius:50%;
    animation: dlSpin 1.1s linear infinite;
}

.dl-track { fill:none; stroke:#e2e8f0; stroke-width:6; }
.dl-arc {
    fill:none; stroke-width:6; stroke-linecap:round;
    stroke-dashoffset:160;
    animation: dlArcFill 1.8s cubic-bezier(0.4,0,0.2,1) forwards;
}
.dl-arc1 { stroke:#6366f1; animation-delay:0s;   stroke-dasharray:50 210; }
.dl-arc2 { stroke:#10b981; animation-delay:0.18s; stroke-dasharray:50 210; }
.dl-arc3 { stroke:#f59e0b; animation-delay:0.36s; stroke-dasharray:40 220; }
.dl-arc4 { stroke:#ef4444; animation-delay:0.54s; stroke-dasharray:30 230; }

.dl-center {
    position:absolute; inset:0;
    display:flex; align-items:center; justify-content:center;
    font-size:22px; color:#6366f1;
    animation: dlPulse 1.8s ease-in-out infinite;
}

.dl-bars { display:flex; align-items:flex-end; gap:5px; height:32px; }
.dl-bar  { width:5px; border-radius:3px; animation: dlBarBounce 1s ease-in-out infinite; }
.dl-bar:nth-child(1){ background:#6366f1; animation-delay:0s;    height:60%; }
.dl-bar:nth-child(2){ background:#10b981; animation-delay:0.1s;  height:100%; }
.dl-bar:nth-child(3){ background:#f59e0b; animation-delay:0.2s;  height:75%; }
.dl-bar:nth-child(4){ background:#ef4444; animation-delay:0.3s;  height:45%; }
.dl-bar:nth-child(5){ background:#6366f1; animation-delay:0.4s;  height:90%; }
.dl-bar:nth-child(6){ background:#10b981; animation-delay:0.5s;  height:55%; }
.dl-bar:nth-child(7){ background:#f59e0b; animation-delay:0.6s;  height:80%; }

.dl-label {
    font-size:13px; font-weight:600; color:#64748b;
    letter-spacing:0.06em; text-transform:uppercase;
    animation: dlFadeInOut 2s ease-in-out infinite;
}

.dl-dots { display:flex; gap:6px; }
.dl-dot  {
    width:6px; height:6px; border-radius:50%;
    animation: dlBarBounce 0.9s ease-in-out infinite;
}
.dl-dot:nth-child(1){ background:#6366f1; animation-delay:0s; }
.dl-dot:nth-child(2){ background:#10b981; animation-delay:0.15s; }
.dl-dot:nth-child(3){ background:#f59e0b; animation-delay:0.3s; }
`;

const DashboardLoader = ({ visible }) => {
    const [labelIdx, setLabelIdx] = useState(0);

    useEffect(() => {
        if (!visible) return;
        const id = setInterval(
            () => setLabelIdx(i => (i + 1) % LOADER_LABELS.length),
            2000
        );
        return () => clearInterval(id);
    }, [visible]);

    return (
        <>
            <style>{loaderStyles}</style>
            <div className={`dl-overlay${visible ? '' : ' dl-gone'}`}>
                {/* <div className="dl-ring-wrap">
                    <div className="dl-spin" />
                    <svg viewBox="0 0 80 80">
                        <circle className="dl-track" cx="40" cy="40" r="30" />
                        <circle className="dl-arc dl-arc1" cx="40" cy="40" r="30" transform="rotate(-90 40 40)" />
                        <circle className="dl-arc dl-arc2" cx="40" cy="40" r="30" transform="rotate(0 40 40)" />
                        <circle className="dl-arc dl-arc3" cx="40" cy="40" r="30" transform="rotate(90 40 40)" />
                        <circle className="dl-arc dl-arc4" cx="40" cy="40" r="30" transform="rotate(180 40 40)" />
                    </svg>
                    <div className="dl-center">
                        <BarChartOutlined />
                    </div>
                </div> */}

                <div className="dl-bars">
                    {[...Array(7)].map((_, i) => <div key={i} className="dl-bar" />)}
                </div>

                <div className="dl-label">{LOADER_LABELS[labelIdx]}</div>

                <div className="dl-dots">
                    <div className="dl-dot" />
                    <div className="dl-dot" />
                    <div className="dl-dot" />
                </div>
            </div>
        </>
    );
};

/* ─── Stat Card ─────────────────────────────────────────────── */
const StatCard = ({ title, value, color, lightColor, icon, subtitle, onClick, loading }) => (
    <div
        onClick={onClick}
        style={{
            background: C.surface, borderRadius: 16, padding: '20px 22px',
            cursor: 'pointer', border: `1px solid ${C.border}`,
            borderTop: `4px solid ${color}`,
            transition: 'all 0.2s', flex: 1, minWidth: 0,
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)', position: 'relative', overflow: 'hidden',
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = `0 10px 28px ${color}28`; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)'; }}
    >
        <div style={{ position: 'absolute', right: 18, top: 18, width: 44, height: 44, borderRadius: 12, background: lightColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color }}>
            {icon}
        </div>
        <Text style={{ fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: '0.07em', textTransform: 'uppercase' }}>
            {title}
        </Text>
        <div style={{ marginTop: 8 }}>
            {loading
                ? <div style={{ fontSize: 28, fontWeight: 700, color: C.muted }}>—</div>
                : <CountUp end={value} duration={1.6} style={{ fontSize: 34, fontWeight: 800, color, lineHeight: 1 }} />
            }
        </div>
        {subtitle && <Text style={{ fontSize: 11, color: C.muted, marginTop: 6, display: 'block' }}>{subtitle}</Text>}
    </div>
);

/* ─── Section header ────────────────────────────────────────── */
const SectionTitle = ({ children, extra }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Text style={{ fontSize: 14, fontWeight: 700, color: C.text, letterSpacing: '-0.01em' }}>{children}</Text>
        {extra}
    </div>
);

/* ─── Status Badge ──────────────────────────────────────────── */
const StatusBadge = ({ status }) => {
    const meta = STATUS_META[status] || { color: C.muted, light: '#f1f5f9' };
    return (
        <span style={{
            background: meta.light, color: meta.color,
            borderRadius: 20, padding: '2px 10px',
            fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap',
        }}>
            {status}
        </span>
    );
};

/* ─── Chart helpers ─────────────────────────────────────────── */
const pieOption = (data) => ({
    backgroundColor: 'transparent',
    tooltip: {
        trigger: 'item',
        formatter: '{b}: <b>{c}</b> ({d}%)',
        backgroundColor: '#1e293b', borderColor: 'transparent',
        textStyle: { color: '#f1f5f9', fontSize: 13 },
    },
    legend: {
        orient: 'horizontal', bottom: 0, left: 'center',
        textStyle: { color: C.muted, fontSize: 12 },
        itemWidth: 10, itemHeight: 10,
    },
    series: [{
        type: 'pie', radius: ['42%', '70%'], center: ['50%', '44%'],
        avoidLabelOverlap: true,
        itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
        label: { show: true, formatter: '{b}\n{c}', fontSize: 11, color: C.muted, lineHeight: 16 },
        labelLine: { length: 10, length2: 6 },
        data: data.map(d => ({ ...d, itemStyle: { color: STATUS_META[d.name]?.color || '#94a3b8' } })),
        emphasis: { itemStyle: { shadowBlur: 12, shadowColor: 'rgba(0,0,0,0.15)' } },
    }],
});

const barOption = (data, colorStart = '#6366f1', colorEnd = '#818cf8') => ({
    backgroundColor: 'transparent',
    tooltip: {
        trigger: 'axis', axisPointer: { type: 'shadow' },
        backgroundColor: '#1e293b', borderColor: 'transparent',
        textStyle: { color: '#f1f5f9', fontSize: 12 },
        formatter: (params) => {
            const p = params[0];
            const orig = data[p.dataIndex];
            return `<b>${orig?.fullName || p.name}</b><br/>${formatDurationFromMillis(p.value)}`;
        },
    },
    grid: { top: 16, right: 16, bottom: 48, left: 16, containLabel: true },
    xAxis: {
        type: 'category',
        data: data.map(d => d.name.length > 13 ? d.name.slice(0, 12) + '…' : d.name),
        axisLabel: { color: C.muted, fontSize: 11, rotate: data.length > 5 ? 30 : 0, interval: 0 },
        axisLine: { lineStyle: { color: C.border } },
        axisTick: { show: false },
    },
    yAxis: {
        type: 'value',
        axisLabel: { color: C.muted, fontSize: 10, formatter: v => formatDurationFromMillis(v) },
        splitLine: { lineStyle: { color: C.border, type: 'dashed' } },
        axisLine: { show: false }, axisTick: { show: false },
    },
    series: [{
        type: 'bar',
        data: data.map(d => ({
            value: d.ms,
            itemStyle: {
                color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: colorStart }, { offset: 1, color: colorEnd }] },
                borderRadius: [6, 6, 0, 0],
            },
        })),
        barMaxWidth: 48,
        emphasis: {
            itemStyle: {
                color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: colorEnd }, { offset: 1, color: colorStart }] },
            },
        },
    }],
});

const hBarOption = (data, colorStart = '#06b6d4', colorEnd = '#0ea5e9') => {
    const reversed = [...data].reverse();
    return {
        backgroundColor: 'transparent',
        tooltip: {
            trigger: 'axis', axisPointer: { type: 'shadow' },
            backgroundColor: '#1e293b', borderColor: 'transparent',
            textStyle: { color: '#f1f5f9', fontSize: 12 },
            formatter: (params) => `<b>${params[0].name}</b><br/>${formatDurationFromMillis(params[0].value)}`,
        },
        grid: { top: 4, right: 96, bottom: 4, left: 8, containLabel: true },
        xAxis: { type: 'value', show: false, splitLine: { show: false } },
        yAxis: {
            type: 'category',
            data: reversed.map(d => d.name?.length > 18 ? d.name.slice(0, 17) + '…' : d.name || 'N/A'),
            axisLabel: { color: C.muted, fontSize: 11 },
            axisLine: { show: false }, axisTick: { show: false },
        },
        series: [{
            type: 'bar',
            data: reversed.map(d => ({
                value: d.ms || 0,
                itemStyle: {
                    color: { type: 'linear', x: 0, y: 0, x2: 1, y2: 0, colorStops: [{ offset: 0, color: colorStart }, { offset: 1, color: colorEnd }] },
                    borderRadius: [0, 6, 6, 0],
                },
            })),
            barMaxWidth: 18,
            label: {
                show: true, position: 'right',
                formatter: p => formatDurationFromMillis(p.value),
                color: C.muted, fontSize: 10,
            },
        }],
    };
};

/* ─── Shared table column builder ───────────────────────────── */
const makeIndexCol = () => ({
    title: '#',
    render: (_, __, i) => <Text style={{ color: C.muted, fontSize: 12 }}>{i + 1}</Text>,
    width: 44,
});

const makeTimeCol = (colorKey = C.toDo, msField = 'total_hours') => ({
    title: 'Time Spent',
    key: 'time',
    align: 'right',
    width: 120,
    render: (_, r) => (
        <Text style={{ fontSize: 13, fontWeight: 700, color: colorKey }}>
            {formatDurationFromMillis(r[msField])}
        </Text>
    ),
    sorter: (a, b) => (a[msField] || 0) - (b[msField] || 0),
    defaultSortOrder: 'descend',
});

/* ══════════════ MAIN COMPONENT ══════════════ */
const TaskDashboard = () => {
    const navigate = useNavigate();

    const [loading,             setLoading]             = useState(true);
    const [dashboardData,       setDashboardData]       = useState(null);
    const [filteredTasks,       setFilteredTasks]       = useState(null);
    const [filteredTaskList,    setFilteredTaskList]    = useState([]);
    const [statsLoading,        setStatsLoading]        = useState(false);
    const [error,               setError]               = useState(null);
    const [dateRange,           setDateRange]           = useState(null);
    const [clients,             setClients]             = useState([]);
    const [selectedClient,      setSelectedClient]      = useState([]);
    const [teams,               setTeams]               = useState([]);
    const [selectedTeam,        setSelectedTeam]        = useState([]);
    const [clientGroups,        setClientGroups]        = useState([]);
    const [selectedClientGroup, setSelectedClientGroup] = useState([]);
    const [allSpocs,            setAllSpocs]            = useState([]);
    const [subServices,         setSubServices]         = useState([]);
    const [selectedSubService,  setSelectedSubService]  = useState([]);
    const [employees,           setEmployees]           = useState([]);
    const [selectedEmployee,    setSelectedEmployee]    = useState([]);
    const [tableView,           setTableView]           = useState('client');
    const [taskCounts,          setTaskCounts]          = useState({ allTasks: 0, done: 0, toDo: 0, overdue: 0, inProgress: 0 });
    const [filtersOpen,         setFiltersOpen]         = useState(false);
    const [timePerClientData,   setTimePerClientData]   = useState([]);
    const [timePerEmployeeData, setTimePerEmployeeData] = useState([]);

    // Client modal
    const [clientModalVisible,  setClientModalVisible]  = useState(false);
    const [clientModalLoading,  setClientModalLoading]  = useState(false);
    const [selectedClientInfo,  setSelectedClientInfo]  = useState(null);
    const [clientSummary,       setClientSummary]       = useState(null);

    // Employee modal
    const [empModalVisible,     setEmpModalVisible]     = useState(false);
    const [empModalLoading,     setEmpModalLoading]     = useState(false);
    const [empModalName,        setEmpModalName]        = useState('');
    const [empModalClients,     setEmpModalClients]     = useState([]);

    // Employee modal sub-drill
    const [empDrillVisible,     setEmpDrillVisible]     = useState(false);
    const [empDrillClient,      setEmpDrillClient]      = useState(null);
    const [empDrillServices,    setEmpDrillServices]    = useState([]);
    const [empDrillLoading,     setEmpDrillLoading]     = useState(false);

    // Client-modal drill panel
    const [drillVisible,        setDrillVisible]        = useState(false);
    const [drillTitle,          setDrillTitle]          = useState('');
    const [drillData,           setDrillData]           = useState([]);
    const [drillType,           setDrillType]           = useState('');

    const mountedRef = useRef(true);
    useEffect(() => { mountedRef.current = true; return () => { mountedRef.current = false; }; }, []);

    const clientGroupsRef = useRef([]);
    const allSpocsRef     = useRef([]);
    useEffect(() => { clientGroupsRef.current = clientGroups; }, [clientGroups]);
    useEffect(() => { allSpocsRef.current = allSpocs; }, [allSpocs]);

    const getSpocName = useCallback((client) => {
        if (!client) return 'N/A';
        if (client.primary_spoc_name) return client.primary_spoc_name;
        const groups = clientGroupsRef.current;
        const group = groups.find(g => g.clients?.some(cg => (typeof cg === 'object' ? cg.id : cg) === client.id));
        if (group?.primary_spoc_name) return group.primary_spoc_name;
        if (typeof client.primary_spoc === 'number') {
            const spoc = allSpocsRef.current.find(s => s.id === client.primary_spoc);
            if (spoc) return `${spoc.first_name || ''} ${spoc.last_name || ''}`.trim() || spoc.user?.email || 'N/A';
        }
        return 'N/A';
    }, []);

    const getGroupName = useCallback((client) => {
        if (!client) return 'N/A';
        const groups = clientGroupsRef.current;
        const group = groups.find(g => g.clients?.some(cg => (typeof cg === 'object' ? cg.id : cg) === client.id));
        return group?.group_name || 'N/A';
    }, []);

    const buildParams = (filters = {}) => {
        const p = {
            start_date:      filters.startDate?.format('YYYY-MM-DD'),
            end_date:        filters.endDate?.format('YYYY-MM-DD'),
            client_id:       filters.clientId?.length      ? filters.clientId.join(',')       : undefined,
            team_id:         filters.teamId?.length        ? filters.teamId.join(',')         : undefined,
            client_group_id: filters.clientGroupId?.length ? filters.clientGroupId.join(',') : undefined,
            sub_service_id:  filters.subServiceId?.length  ? filters.subServiceId.join(',')  : undefined,
            employee_name:   filters.employeeName?.length  ? filters.employeeName.join(',')  : undefined,
        };
        Object.keys(p).forEach(k => p[k] === undefined && delete p[k]);
        return p;
    };

    /* ── Fetches ── */
    const fetchDashboard = useCallback(async (params) => {
        if (!mountedRef.current) return;
        setLoading(true);
        try {
            const res = await api.get('/clients/tasks/dashboard_summary/', { params });
            if (mountedRef.current) {
                setDashboardData(res.data);
                setFilteredTasks(res.data);
            }
        } catch (err) {
            console.error(err);
            if (mountedRef.current) { setError('Failed to load dashboard data.'); message.error('Failed to load dashboard.'); }
        } finally {
            if (mountedRef.current) setLoading(false);
        }
    }, []);

    const fetchTimePerClient = useCallback(async (params, clientsList) => {
        if (!mountedRef.current) return;
        try {
            const res = await api.get('/clients/tasks/time_per_client/', { params });
            if (!mountedRef.current) return;
            setTimePerClientData((res.data || []).map(row => {
                const c = (clientsList || []).find(x => x.id === row.client_id);
                return {
                    ...row,
                    total_hours: row.total_hours_ms,
                    group_name:  c ? getGroupName(c) : 'N/A',
                    spoc_name:   c ? getSpocName(c) : 'N/A',
                };
            }));
        } catch (err) { console.error('fetchTimePerClient error:', err); }
    }, [getGroupName, getSpocName]);

    const fetchTimePerEmployee = useCallback(async (params) => {
        if (!mountedRef.current) return;
        try {
            const res = await api.get('/clients/tasks/time_per_employee/', { params });
            if (mountedRef.current) setTimePerEmployeeData(res.data || []);
        } catch (err) { console.error('fetchTimePerEmployee error:', err); }
    }, []);

    const fetchFilteredStats = useCallback(async (params) => {
        if (!mountedRef.current) return;
        setStatsLoading(true);
        try {
            const res = await api.get('/clients/tasks/dashboard_summary/', { params });
            if (mountedRef.current) {
                setFilteredTasks(res.data);
                setFilteredTaskList(res.data?.tasks || []);
            }
        } catch (err) { console.error('fetchFilteredStats error:', err); }
        finally { if (mountedRef.current) setStatsLoading(false); }
    }, []);

    /* ── Initial load ── */
    const didInit = useRef(false);
    useEffect(() => {
        if (didInit.current) return;
        didInit.current = true;
        (async () => {
            setLoading(true);
            try {
                const [cR, tR, gR, sR, ssR] = await Promise.all([
                    api.get('/clients/clients/?page_size=500'),
                    api.get('/employee/teams/'),
                    api.get('/clients/client-groups/'),
                    api.get('/employee/employees/'),
                    api.get('/clients/subservices/'),
                ]);
                if (!mountedRef.current) return;
                const cl = cR.data.results || cR.data;
                const gr = gR.data.results || gR.data;
                const sp = sR.data.results || sR.data;
                setClients(cl); setTeams(tR.data.results || tR.data);
                setClientGroups(gr); setAllSpocs(sp); setSubServices(ssR.data.results || ssR.data);
                const empList = sp
                    .filter(u => u.first_name || u.last_name)
                    .map(u => ({
                        id:   `${u.first_name || ''} ${u.last_name || ''}`.trim(),
                        name: `${u.first_name || ''} ${u.last_name || ''}`.trim(),
                    }))
                    .filter(u => u.name)
                    .sort((a, b) => a.name.localeCompare(b.name));
                setEmployees(empList);
                clientGroupsRef.current = gr; allSpocsRef.current = sp;
                await Promise.all([fetchDashboard({}), fetchFilteredStats({}), fetchTimePerClient({}, cl), fetchTimePerEmployee({})]);
            } catch (err) {
                console.error('fetchInitialData error:', err);
                if (mountedRef.current) setError('Failed to load initial data.');
            } finally {
                if (mountedRef.current) setLoading(false);
            }
        })();
    }, [fetchDashboard, fetchFilteredStats, fetchTimePerClient, fetchTimePerEmployee]);

    /* ── Re-fetch on filter change ── */
    const isFirstRender = useRef(true);
    useEffect(() => {
        if (isFirstRender.current) { isFirstRender.current = false; return; }
        const [startDate, endDate] = dateRange || [null, null];
        const f = {
            startDate, endDate,
            clientId:      selectedClient,
            teamId:        selectedTeam,
            clientGroupId: selectedClientGroup,
            subServiceId:  selectedSubService,
            employeeName:  selectedEmployee,
        };
        const p = buildParams(f);
        fetchDashboard(p);
        fetchFilteredStats(p);
        fetchTimePerClient(p, clients);
        fetchTimePerEmployee(p);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dateRange, selectedClient, selectedTeam, selectedClientGroup, selectedSubService, selectedEmployee]);

    /* ── Derive task counts ── */
    useEffect(() => {
        const sc = filteredTasks?.status_counts;
        if (!sc) return;
        setTaskCounts({
            allTasks:   (sc['To Do'] || 0) + (sc['In Progress'] || 0) + (sc['Done'] || 0) + (sc['Over Due'] || 0),
            done:       sc['Done']        || 0,
            toDo:       sc['To Do']       || 0,
            inProgress: sc['In Progress'] || 0,
            overdue:    sc['Over Due']    || 0,
        });
    }, [filteredTasks]);

    /* ── Derived ── */
    const timePerGroup = useMemo(() =>
        timePerClientData.reduce((acc, row) => {
            if (!row.group_name || row.group_name === 'N/A') return acc;
            const ex = acc.find(g => g.client_group_name === row.group_name);
            if (ex) ex.total_hours += row.total_hours;
            else acc.push({ client_group_name: row.group_name, spoc_name: row.spoc_name, total_hours: row.total_hours });
            return acc;
        }, [])
    , [timePerClientData]);

    const pieData      = useMemo(() =>
        filteredTasks?.status_counts
            ? Object.entries(filteredTasks.status_counts).filter(([k, v]) => k !== 'total' && v > 0).map(([name, value]) => ({ name, value }))
            : []
    , [filteredTasks]);

    const topClients   = useMemo(() => [...timePerClientData].sort((a, b) => b.total_hours - a.total_hours).slice(0, 10), [timePerClientData]);
    const topGroups    = useMemo(() => [...timePerGroup].sort((a, b) => b.total_hours - a.total_hours).slice(0, 10), [timePerGroup]);
    const topEmployees = useMemo(() => [...timePerEmployeeData].sort((a, b) => b.total_hours_ms - a.total_hours_ms).slice(0, 10), [timePerEmployeeData]);

    const totalTime      = useMemo(() => timePerClientData.reduce((s, r) => s + (r.total_hours || 0), 0), [timePerClientData]);
    const totalEmpTime   = useMemo(() => timePerEmployeeData.reduce((s, r) => s + (r.total_hours_ms || 0), 0), [timePerEmployeeData]);
    const completionRate = taskCounts.allTasks ? Math.round((taskCounts.done / taskCounts.allTasks) * 100) : 0;

    const activeFilterCount = [selectedClient, selectedTeam, selectedClientGroup, selectedSubService, selectedEmployee]
        .filter(a => Array.isArray(a) && a.length > 0).length + (dateRange ? 1 : 0);

    const grandTotal = tableView === 'employee'
        ? totalEmpTime
        : tableView === 'group'
            ? timePerGroup.reduce((s, r) => s + r.total_hours, 0)
            : totalTime;

    const handleClearFilters = () => {
        setDateRange(null); setSelectedClient([]); setSelectedTeam([]); setSelectedClientGroup([]); setSelectedSubService([]); setSelectedEmployee([]);
    };

    const goToTasks = (status) => {
        const params = new URLSearchParams();
        if (status !== 'all') params.set('status', status);
        const [s, e] = dateRange || [null, null];
        if (s) params.set('start_date', s.format('YYYY-MM-DD'));
        if (e) params.set('end_date',   e.format('YYYY-MM-DD'));
        if (selectedClient?.length)      params.set('client_id',      selectedClient.join(','));
        if (selectedTeam?.length)        params.set('team_id',         selectedTeam.join(','));
        if (selectedClientGroup?.length) params.set('client_group_id', selectedClientGroup.join(','));
        if (selectedSubService?.length)  params.set('sub_service_id',  selectedSubService.join(','));
        navigate(`/stt-records?${params.toString()}`);
    };

    const handleRefresh = useCallback(() => {
        const [startDate, endDate] = dateRange || [null, null];
        const f = {
            startDate, endDate,
            clientId:      selectedClient,
            teamId:        selectedTeam,
            clientGroupId: selectedClientGroup,
            subServiceId:  selectedSubService,
            employeeName:  selectedEmployee,
        };
        const p = buildParams(f);
        fetchDashboard(p); fetchFilteredStats(p); fetchTimePerClient(p, clients); fetchTimePerEmployee(p);
    }, [dateRange, selectedClient, selectedTeam, selectedClientGroup, selectedSubService, selectedEmployee, clients, fetchDashboard, fetchFilteredStats, fetchTimePerClient, fetchTimePerEmployee]);

    /* ── Client modal ── */
    const handleClientClick = useCallback(async (clientId) => {
        const client = clients.find(c => c.id === clientId);
        setSelectedClientInfo(client); setClientSummary(null);
        setDrillVisible(false); setDrillData([]);
        setClientModalVisible(true); setClientModalLoading(true);
        try {
            const [startDate, endDate] = dateRange || [null, null];
            const params = { client_id: clientId };
            if (startDate)                   params.start_date      = startDate.format('YYYY-MM-DD');
            if (endDate)                     params.end_date        = endDate.format('YYYY-MM-DD');
            if (selectedTeam?.length)        params.team_id         = selectedTeam.join(',');
            if (selectedSubService?.length)  params.sub_service_id  = selectedSubService.join(',');
            if (selectedClientGroup?.length) params.client_group_id = selectedClientGroup.join(',');
            const res = await api.get('/clients/tasks/client_task_summary/', { params });
            if (mountedRef.current) setClientSummary(res.data);
        } catch (err) { console.error(err); message.error('Failed to load client details'); }
        finally { if (mountedRef.current) setClientModalLoading(false); }
    }, [clients, dateRange, selectedTeam, selectedSubService, selectedClientGroup]);

    /* ── Employee modal ── */
    const handleEmployeeClick = useCallback(async (employeeName) => {
        setEmpModalName(employeeName);
        setEmpModalClients([]);
        setEmpDrillVisible(false);
        setEmpDrillClient(null);
        setEmpDrillServices([]);
        setEmpModalVisible(true);
        setEmpModalLoading(true);
        try {
            const [startDate, endDate] = dateRange || [null, null];
            const params = { employee_name: employeeName };
            if (startDate)                   params.start_date       = startDate.format('YYYY-MM-DD');
            if (endDate)                     params.end_date         = endDate.format('YYYY-MM-DD');
            if (selectedClient?.length)      params.client_id        = selectedClient.join(',');
            if (selectedTeam?.length)        params.team_id          = selectedTeam.join(',');
            if (selectedSubService?.length)  params.sub_service_id   = selectedSubService.join(',');
            if (selectedClientGroup?.length) params.client_group_id  = selectedClientGroup.join(',');
            const res = await api.get('/clients/tasks/time_per_employee_clients/', { params });
            if (mountedRef.current) setEmpModalClients(res.data || []);
        } catch (err) { console.error(err); message.error('Failed to load employee details'); }
        finally { if (mountedRef.current) setEmpModalLoading(false); }
    }, [dateRange, selectedClient, selectedTeam, selectedSubService, selectedClientGroup]);

    /* ── Employee modal: click a client bar → load sub-services ── */
    const handleEmpClientBarClick = useCallback(async (clientRow) => {
        setEmpDrillClient(clientRow);
        setEmpDrillServices([]);
        setEmpDrillVisible(true);
        setEmpDrillLoading(true);
        try {
            const [startDate, endDate] = dateRange || [null, null];
            const params = { client_id: clientRow.client_id, employee_name: empModalName };
            if (startDate)                   params.start_date      = startDate.format('YYYY-MM-DD');
            if (endDate)                     params.end_date        = endDate.format('YYYY-MM-DD');
            if (selectedTeam?.length)        params.team_id         = selectedTeam.join(',');
            if (selectedSubService?.length)  params.sub_service_id  = selectedSubService.join(',');
            if (selectedClientGroup?.length) params.client_group_id = selectedClientGroup.join(',');
            const res = await api.get('/clients/tasks/client_task_summary/', { params });
            const raw = res.data?.per_employee_services?.[empModalName] || [];
            const svcList = raw.map(s => ({ name: s.name, ms: s.ms ?? s.total_hours_ms ?? 0 })).filter(s => s.ms > 0);
            if (mountedRef.current) setEmpDrillServices(svcList);
        } catch (err) { console.error(err); message.error('Failed to load service breakdown'); }
        finally { if (mountedRef.current) setEmpDrillLoading(false); }
    }, [dateRange, empModalName, selectedTeam, selectedSubService, selectedClientGroup]);

    /* ── Upcoming tasks ── */
    const upcomingTasks = useMemo(() => (filteredTaskList || []).slice(0, 8), [filteredTaskList]);
    const upcomingCols = [
        { title: 'Task ID', dataIndex: 'task_id', key: 'task_id', width: 140, render: v => <Text style={{ fontFamily: 'monospace', fontSize: 11, color: C.muted }}>{v}</Text> },
        { title: 'Client',  dataIndex: 'client_name',      key: 'client_name',      ellipsis: true },
        { title: 'Service', dataIndex: 'sub_service_name',  key: 'sub_service_name', ellipsis: true },
        {
            title: 'Due', dataIndex: 'due_date', key: 'due_date', width: 100,
            render: d => {
                if (!d) return <span style={{ color: C.muted }}>—</span>;
                const m = moment(d); const isLate = m.isBefore(moment(), 'day');
                return <span style={{ color: isLate ? C.overdue : C.muted, fontWeight: isLate ? 600 : 400, fontSize: 12 }}>{m.format('DD MMM YY')}</span>;
            },
        },
        {
            title: 'Status', dataIndex: 'status', key: 'status', width: 120,
            render: (_, r) => {
                const eff = r.due_date && moment(r.due_date).isBefore(moment(), 'day') && r.status !== 'Done' ? 'Over Due' : r.status;
                return <StatusBadge status={eff} />;
            },
        },
    ];

    const sharedRowStyle       = { cursor: 'pointer' };
    const sharedPagination     = { pageSize: 8, size: 'small', showSizeChanger: false };

    /* ── CLIENT table columns ── */
    const clientTableCols = [
        makeIndexCol(),
        {
            title: 'Client', dataIndex: 'client_name', key: 'client_name',
            render: v => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#ede9fe', color: C.toDo, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                        {(v || 'C')[0].toUpperCase()}
                    </div>
                    <Tooltip title={v} placement="topLeft">
                        <Text style={{ fontWeight: 500, fontSize: 13, maxWidth: 130, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v || '—'}</Text>
                    </Tooltip>
                </div>
            ),
            sorter: (a, b) => (a.client_name || '').localeCompare(b.client_name || ''),
        },
        {
            title: 'Group', dataIndex: 'group_name', key: 'group_name', width: 130,
            render: v => v && v !== '—' && v !== 'N/A' ? (
                <Tooltip title={v} placement="topLeft">
                    <span style={{ background: '#f0fdf4', color: C.done, borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 600, maxWidth: 120, display: 'inline-block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>{v}</span>
                </Tooltip>
            ) : <Text style={{ fontSize: 12, color: C.muted }}>—</Text>,
        },
        {
            title: 'SPOC', dataIndex: 'spoc_name', key: 'spoc_name', width: 120,
            render: v => v && v !== '—' && v !== 'N/A' ? (
                <Tooltip title={v} placement="topLeft">
                    <span style={{ background: '#f0f9ff', color: '#0ea5e9', borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 600, maxWidth: 110, display: 'inline-block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>{v}</span>
                </Tooltip>
            ) : <Text style={{ fontSize: 12, color: C.muted }}>—</Text>,
        },
        makeTimeCol(C.toDo, 'total_hours'),
    ];

    /* ── GROUP table columns ── */
    const groupTableCols = [
        makeIndexCol(),
        {
            title: 'Client Group', dataIndex: 'client_group_name', key: 'client_group_name',
            render: v => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#f0fdf4', color: C.done, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                        {(v || 'G')[0].toUpperCase()}
                    </div>
                    <Tooltip title={v} placement="topLeft">
                        <Text style={{ fontWeight: 500, fontSize: 13, maxWidth: 150, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v || '—'}</Text>
                    </Tooltip>
                </div>
            ),
            sorter: (a, b) => (a.client_group_name || '').localeCompare(b.client_group_name || ''),
        },
        {
            title: 'SPOC', dataIndex: 'spoc_name', key: 'spoc_name', width: 140,
            render: v => v && v !== '—' && v !== 'N/A' ? (
                <Tooltip title={v} placement="topLeft">
                    <span style={{ background: '#f0f9ff', color: '#0ea5e9', borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 600, maxWidth: 130, display: 'inline-block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>{v}</span>
                </Tooltip>
            ) : <Text style={{ fontSize: 12, color: C.muted }}>—</Text>,
        },
        makeTimeCol(C.toDo, 'total_hours'),
    ];

    /* ── EMPLOYEE table columns ── */
    const employeeTableCols = [
        makeIndexCol(),
        {
            title: 'Employee', dataIndex: 'name', key: 'name',
            render: v => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#fef3c7', color: C.inProgress, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                        {(v || 'N')[0]}
                    </div>
                    <Text style={{ fontWeight: 500, fontSize: 13 }}>{v || 'N/A'}</Text>
                </div>
            ),
            sorter: (a, b) => (a.name || '').localeCompare(b.name || ''),
        },
        {
            title: 'Team', dataIndex: 'team_name', key: 'team_name', width: 130,
            render: v => (
                <Tooltip title={v} placement="topLeft">
                    <Text style={{ fontSize: 12, color: C.muted, maxWidth: 120, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v || '—'}</Text>
                </Tooltip>
            ),
        },
        makeTimeCol(C.inProgress, 'total_hours_ms'),
    ];

    /* ── Employee modal: client breakdown columns ── */
    const empClientCols = [
        makeIndexCol(),
        {
            title: 'Client', dataIndex: 'client_name', key: 'client_name',
            render: v => (
                <Tooltip title={v} placement="topLeft">
                    <Text style={{ fontWeight: 500, fontSize: 13, maxWidth: 200, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v || '—'}</Text>
                </Tooltip>
            ),
            sorter: (a, b) => (a.client_name || '').localeCompare(b.client_name || ''),
        },
        makeTimeCol(C.inProgress, 'total_hours_ms'),
    ];

    /* ── Sub-service drill table columns ── */
    const empDrillCols = [
        makeIndexCol(),
        {
            title: 'Sub-service / Description', dataIndex: 'name', key: 'name',
            render: v => (
                <Tooltip title={v} placement="topLeft">
                    <Text style={{ fontWeight: 500, fontSize: 13, maxWidth: 220, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v || '—'}</Text>
                </Tooltip>
            ),
            sorter: (a, b) => (a.name || '').localeCompare(b.name || ''),
        },
        {
            title: 'Time Spent', dataIndex: 'ms', key: 'ms', align: 'right', width: 120,
            render: v => <Text style={{ fontSize: 13, fontWeight: 700, color: '#f59e0b' }}>{formatDurationFromMillis(v)}</Text>,
            sorter: (a, b) => (a.ms || 0) - (b.ms || 0),
            defaultSortOrder: 'descend',
        },
    ];

    /* ── Error state ── */
    if (error && !dashboardData) {
        return (
            <div style={{ padding: 60, textAlign: 'center', background: C.bg, minHeight: '100vh' }}>
                <Text style={{ color: C.overdue, fontSize: 16 }}>{error}</Text><br />
                <Button style={{ marginTop: 16 }} onClick={() => { didInit.current = false; }} icon={<ReloadOutlined />}>Retry</Button>
            </div>
        );
    }

    /* ══════════════ RENDER ══════════════ */
    return (
        <div style={{ position: 'relative', background: C.bg, minHeight: '100vh', padding: '24px 28px', fontFamily: '"DM Sans", "Segoe UI", sans-serif' }}>

            {/* ══ FANCY LOADER — covers entire page on initial load ══ */}
            <DashboardLoader visible={loading} />

            {/* ── Header ── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                <div>
                    <Title level={3} style={{ margin: 0, color: C.text, fontWeight: 800, letterSpacing: '-0.03em' }}>Task Analytics</Title>
                    <Text style={{ color: C.muted, fontSize: 13 }}>{moment().format('dddd, D MMMM YYYY')} · Real-time overview</Text>
                </div>
                <Space>
                    <Button icon={<ReloadOutlined />} onClick={handleRefresh} loading={loading}>Refresh</Button>
                    <Button type="primary" onClick={() => navigate('/stt-records')} style={{ background: C.toDo, borderColor: C.toDo }}>All Tasks →</Button>
                </Space>
            </div>

            {/* ── Filters ── */}
            <div style={{ background: C.surface, borderRadius: 16, border: `1px solid ${C.border}`, marginBottom: 24, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                <div
                    onClick={() => setFiltersOpen(v => !v)}
                    style={{ padding: '13px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', borderBottom: filtersOpen ? `1px solid ${C.border}` : 'none', background: filtersOpen ? '#fafbff' : C.surface, transition: 'background 0.2s' }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 30, height: 30, borderRadius: 8, background: activeFilterCount > 0 ? '#ede9fe' : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <FilterOutlined style={{ color: activeFilterCount > 0 ? C.toDo : C.muted, fontSize: 13 }} />
                        </div>
                        <div>
                            <Text style={{ fontWeight: 700, color: C.text, fontSize: 13 }}>Filters</Text>
                            {activeFilterCount > 0
                                ? <Text style={{ fontSize: 11, color: C.muted, marginLeft: 8 }}>{activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''} active</Text>
                                : <Text style={{ fontSize: 11, color: C.muted, marginLeft: 8 }}>No filters applied</Text>
                            }
                        </div>
                        {activeFilterCount > 0 && (
                            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginLeft: 4 }}>
                                {dateRange && (
                                    <span style={{ background: '#ede9fe', color: C.toDo, borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 600 }}>
                                        {dateRange[0]?.format('DD MMM')} – {dateRange[1]?.format('DD MMM YY')}
                                    </span>
                                )}
                                {selectedClientGroup.length > 0 && <span style={{ background: '#f0fdf4', color: C.done, borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 600 }}>{selectedClientGroup.length} group{selectedClientGroup.length > 1 ? 's' : ''}</span>}
                                {selectedClient.length > 0 && <span style={{ background: '#ede9fe', color: C.toDo, borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 600 }}>{selectedClient.length} client{selectedClient.length > 1 ? 's' : ''}</span>}
                                {selectedTeam.length > 0 && <span style={{ background: '#f0f9ff', color: '#0ea5e9', borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 600 }}>{selectedTeam.length} team{selectedTeam.length > 1 ? 's' : ''}</span>}
                                {selectedSubService.length > 0 && <span style={{ background: '#fff7ed', color: '#f97316', borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 600 }}>{selectedSubService.length} service{selectedSubService.length > 1 ? 's' : ''}</span>}
                                {selectedEmployee.length > 0 && <span style={{ background: '#fef3c7', color: C.inProgress, borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 600 }}>{selectedEmployee.length} employee{selectedEmployee.length > 1 ? 's' : ''}</span>}
                            </div>
                        )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {activeFilterCount > 0 && (
                            <div
                                onClick={e => { e.stopPropagation(); handleClearFilters(); }}
                                style={{ display: 'flex', alignItems: 'center', gap: 4, color: C.overdue, fontSize: 12, fontWeight: 600, cursor: 'pointer', padding: '4px 10px', borderRadius: 6, background: '#fff1f2', border: '1px solid #fecdd3' }}
                            >
                                <ClearOutlined style={{ fontSize: 11 }} /> Clear all
                            </div>
                        )}
                        <div style={{ color: C.muted, fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                            {filtersOpen ? <><span style={{ fontSize: 10 }}>▲</span> Hide</> : <><span style={{ fontSize: 10 }}>▼</span> Show</>}
                        </div>
                    </div>
                </div>

                {filtersOpen && (
                    <div style={{ padding: '20px 20px 16px' }}>
                        <Row gutter={[14, 14]}>
                            <Col xs={24} sm={12} md={8} lg={6}>
                                <div style={{ marginBottom: 5 }}><Text style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Date Range</Text></div>
                                <RangePicker style={{ width: '100%' }} value={dateRange} onChange={setDateRange} size="middle" format="DD MMM YYYY" placeholder={['From date', 'To date']} allowClear />
                            </Col>
                            <Col xs={24} sm={12} md={8} lg={6}>
                                <div style={{ marginBottom: 5 }}><Text style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Client Group</Text></div>
                                <Select mode="multiple" allowClear showSearch placeholder="All groups" value={selectedClientGroup} onChange={setSelectedClientGroup} style={{ width: '100%' }} size="middle" maxTagCount={2} maxTagPlaceholder={o => `+${o.length} more`} filterOption={(inp, opt) => (opt?.children ?? '').toLowerCase().includes(inp.toLowerCase())} optionFilterProp="children">
                                    {clientGroups.map(i => <Option key={i.id} value={i.id}>{i.group_name}</Option>)}
                                </Select>
                            </Col>
                            <Col xs={24} sm={12} md={8} lg={6}>
                                <div style={{ marginBottom: 5 }}><Text style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Client</Text></div>
                                <Select mode="multiple" allowClear showSearch placeholder="All clients" value={selectedClient} onChange={setSelectedClient} style={{ width: '100%' }} size="middle" maxTagCount={2} maxTagPlaceholder={o => `+${o.length} more`} filterOption={(inp, opt) => (opt?.children ?? '').toLowerCase().includes(inp.toLowerCase())} optionFilterProp="children">
                                    {clients.map(i => <Option key={i.id} value={i.id}>{i.name}</Option>)}
                                </Select>
                            </Col>
                            <Col xs={24} sm={12} md={8} lg={6}>
                                <div style={{ marginBottom: 5 }}><Text style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Team</Text></div>
                                <Select mode="multiple" allowClear showSearch placeholder="All teams" value={selectedTeam} onChange={setSelectedTeam} style={{ width: '100%' }} size="middle" maxTagCount={2} maxTagPlaceholder={o => `+${o.length} more`} filterOption={(inp, opt) => (opt?.children ?? '').toLowerCase().includes(inp.toLowerCase())} optionFilterProp="children">
                                    {teams.map(i => <Option key={i.id} value={i.id}>{i.name}</Option>)}
                                </Select>
                            </Col>
                            <Col xs={24} sm={12} md={8} lg={6}>
                                <div style={{ marginBottom: 5 }}><Text style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Sub Service</Text></div>
                                <Select mode="multiple" allowClear showSearch placeholder="All services" value={selectedSubService} onChange={setSelectedSubService} style={{ width: '100%' }} size="middle" maxTagCount={2} maxTagPlaceholder={o => `+${o.length} more`} filterOption={(inp, opt) => (opt?.children ?? '').toLowerCase().includes(inp.toLowerCase())} optionFilterProp="children">
                                    {subServices.map(i => <Option key={i.id} value={i.id}>{i.name}</Option>)}
                                </Select>
                            </Col>
                            <Col xs={24} sm={12} md={8} lg={6}>
                                <div style={{ marginBottom: 5 }}><Text style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Employee</Text></div>
                                <Select mode="multiple" allowClear showSearch placeholder="All employees" value={selectedEmployee} onChange={setSelectedEmployee} style={{ width: '100%' }} size="middle" maxTagCount={2} maxTagPlaceholder={o => `+${o.length} more`} filterOption={(inp, opt) => (opt?.children ?? '').toLowerCase().includes(inp.toLowerCase())} optionFilterProp="children">
                                    {employees.map(i => <Option key={i.id} value={i.id}>{i.name}</Option>)}
                                </Select>
                            </Col>
                        </Row>
                    </div>
                )}
            </div>

            {/* ── KPI Cards ── */}
            <Row gutter={[14, 14]} style={{ marginBottom: 20, flexWrap: 'nowrap' }}>
                {[
                    { title: 'Total Tasks',  value: taskCounts.allTasks,   color: C.all,        lightColor: '#f1f5f9', icon: <FcList />,                  subtitle: 'Across all statuses',           status: 'all'         },
                    { title: 'To Do',        value: taskCounts.toDo,       color: C.toDo,       lightColor: '#ede9fe', icon: <ClockCircleOutlined />,       subtitle: 'Pending start',                 status: 'To Do'       },
                    { title: 'In Progress',  value: taskCounts.inProgress, color: C.inProgress, lightColor: '#fef3c7', icon: <MinusCircleOutlined />,       subtitle: 'Being worked on',               status: 'In Progress' },
                    { title: 'Done',         value: taskCounts.done,       color: C.done,       lightColor: '#d1fae5', icon: <CheckCircleOutlined />,       subtitle: `${completionRate}% completion`, status: 'Done'        },
                    { title: 'Overdue',      value: taskCounts.overdue,    color: C.overdue,    lightColor: '#fee2e2', icon: <ExclamationCircleOutlined />, subtitle: 'Need attention',                status: 'Over Due'    },
                ].map((card) => (
                    <Col key={card.title} style={{ flex: '1 1 0', minWidth: 0, display: 'flex' }}>
                        <StatCard {...card} loading={statsLoading} onClick={() => goToTasks(card.status)} />
                    </Col>
                ))}
            </Row>

            {/* ── Overall progress bar ── */}
            {taskCounts.allTasks > 0 && (
                <div style={{ background: C.surface, borderRadius: 14, padding: '16px 24px', marginBottom: 20, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
                    <Text style={{ fontWeight: 600, color: C.text, whiteSpace: 'nowrap', fontSize: 13 }}>Overall Progress</Text>
                    <div style={{ flex: 1, minWidth: 120 }}>
                        <Progress percent={completionRate} strokeColor={{ '0%': C.toDo, '100%': C.done }} trailColor="#e2e8f0" strokeWidth={10} showInfo={false} />
                    </div>
                    <div style={{ display: 'flex', gap: 24, flexShrink: 0 }}>
                        {[
                            { label: 'Done',     val: taskCounts.done,                         color: C.done       },
                            { label: 'Active',   val: taskCounts.toDo + taskCounts.inProgress, color: C.inProgress },
                            { label: 'Overdue',  val: taskCounts.overdue,                      color: C.overdue    },
                            { label: 'Complete', val: `${completionRate}%`,                    color: C.text       },
                        ].map(({ label, val, color }) => (
                            <div key={label} style={{ textAlign: 'center' }}>
                                <div style={{ fontWeight: 700, color, fontSize: 16, lineHeight: 1 }}>{val}</div>
                                <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ── Pie + Upcoming ── */}
            <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                <Col xs={24} lg={9}>
                    <div style={{ background: C.surface, borderRadius: 14, padding: '20px 20px 12px', border: `1px solid ${C.border}`, height: '100%' }}>
                        <SectionTitle>Status Distribution</SectionTitle>
                        {statsLoading
                            ? <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Spin /></div>
                            : pieData.length > 0
                                ? <EChartsReact option={pieOption(pieData)} style={{ height: 300 }} />
                                : <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.muted }}>No data</div>
                        }
                    </div>
                </Col>
                <Col xs={24} lg={15}>
                    <div style={{ background: C.surface, borderRadius: 14, padding: '20px', border: `1px solid ${C.border}`, height: '100%' }}>
                        <SectionTitle extra={<Button size="small" type="link" onClick={() => goToTasks('all')} style={{ color: C.toDo, padding: 0 }}>View all →</Button>}>
                            Upcoming &amp; Recent Tasks
                        </SectionTitle>
                        <Table
                            dataSource={upcomingTasks} columns={upcomingCols} rowKey="id" size="small"
                            pagination={false} loading={statsLoading} scroll={{ x: 'max-content' }}
                            onRow={r => ({ onClick: () => goToTasks(r.status), style: sharedRowStyle })}
                            locale={{ emptyText: <div style={{ padding: 32, color: C.muted }}>No tasks found 🎉</div> }}
                        />
                    </div>
                </Col>
            </Row>

            {/* ── Time Spent ── */}
            <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                <Col xs={24}>
                    <div style={{ background: C.surface, borderRadius: 14, padding: '20px', border: `1px solid ${C.border}` }}>
                        <SectionTitle
                            extra={
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <Text style={{ fontSize: 13, color: C.muted }}>
                                        Total: <strong style={{ color: tableView === 'employee' ? C.inProgress : C.toDo }}>{formatDurationFromMillis(grandTotal)}</strong>
                                    </Text>
                                    <Segmented
                                        size="small"
                                        options={['By Client', 'By Group', 'By Employee']}
                                        value={tableView === 'client' ? 'By Client' : tableView === 'group' ? 'By Group' : 'By Employee'}
                                        onChange={v => setTableView(v === 'By Client' ? 'client' : v === 'By Group' ? 'group' : 'employee')}
                                    />
                                </div>
                            }
                        >
                            Total Time Spent
                        </SectionTitle>

                        {/* ─ By Client ─ */}
                        {tableView === 'client' && (
                            timePerClientData.length > 0 ? (
                                <Row gutter={[16, 16]}>
                                    <Col xs={24} xl={12}>
                                        <Text style={{ fontSize: 12, color: C.muted, display: 'block', marginBottom: 8 }}>Top {topClients.length} clients by time logged</Text>
                                        <EChartsReact option={barOption(topClients.map(r => ({ name: r.client_name, fullName: r.client_name, ms: r.total_hours })))} style={{ height: 280 }} />
                                    </Col>
                                    <Col xs={24} xl={12}>
                                        <Table
                                            dataSource={timePerClientData} rowKey="client_id" size="small"
                                            columns={clientTableCols} pagination={sharedPagination} scroll={{ x: 'max-content' }}
                                            onRow={r => ({ onClick: () => handleClientClick(r.client_id), style: sharedRowStyle })}
                                            summary={() => (
                                                <Table.Summary.Row style={{ background: '#f8fafc' }}>
                                                    <Table.Summary.Cell index={0} colSpan={4}><Text strong style={{ fontSize: 12 }}>Grand Total</Text></Table.Summary.Cell>
                                                    <Table.Summary.Cell index={1} align="right"><Text strong style={{ fontSize: 12, color: C.toDo }}>{formatDurationFromMillis(totalTime)}</Text></Table.Summary.Cell>
                                                </Table.Summary.Row>
                                            )}
                                        />
                                    </Col>
                                </Row>
                            ) : (
                                <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.muted }}><Spin /></div>
                            )
                        )}

                        {/* ─ By Group ─ */}
                        {tableView === 'group' && (
                            timePerGroup.length > 0 ? (
                                <Row gutter={[16, 16]}>
                                    <Col xs={24} xl={12}>
                                        <Text style={{ fontSize: 12, color: C.muted, display: 'block', marginBottom: 8 }}>Top {topGroups.length} groups by time logged</Text>
                                        <EChartsReact option={barOption(topGroups.map(r => ({ name: r.client_group_name, fullName: r.client_group_name, ms: r.total_hours })))} style={{ height: 280 }} />
                                    </Col>
                                    <Col xs={24} xl={12}>
                                        <Table
                                            dataSource={timePerGroup} rowKey="client_group_name" size="small"
                                            columns={groupTableCols} pagination={sharedPagination} scroll={{ x: 'max-content' }}
                                            summary={() => (
                                                <Table.Summary.Row style={{ background: '#f8fafc' }}>
                                                    <Table.Summary.Cell index={0} colSpan={3}><Text strong style={{ fontSize: 12 }}>Grand Total</Text></Table.Summary.Cell>
                                                    <Table.Summary.Cell index={1} align="right"><Text strong style={{ fontSize: 12, color: C.toDo }}>{formatDurationFromMillis(timePerGroup.reduce((s, r) => s + r.total_hours, 0))}</Text></Table.Summary.Cell>
                                                </Table.Summary.Row>
                                            )}
                                        />
                                    </Col>
                                </Row>
                            ) : (
                                <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.muted }}><Spin /></div>
                            )
                        )}

                        {/* ─ By Employee ─ */}
                        {tableView === 'employee' && (
                            timePerEmployeeData.length > 0 ? (
                                <Row gutter={[16, 16]}>
                                    <Col xs={24} xl={12}>
                                        <Text style={{ fontSize: 12, color: C.muted, display: 'block', marginBottom: 8 }}>Top {topEmployees.length} employees by time logged</Text>
                                        <EChartsReact option={barOption(topEmployees.map(r => ({ name: r.name, fullName: r.name, ms: r.total_hours_ms })), '#f59e0b', '#fbbf24')} style={{ height: 280 }} />
                                    </Col>
                                    <Col xs={24} xl={12}>
                                        <Table
                                            dataSource={timePerEmployeeData} rowKey="name" size="small"
                                            columns={employeeTableCols} pagination={sharedPagination} scroll={{ x: 'max-content' }}
                                            onRow={r => ({ onClick: () => handleEmployeeClick(r.name), style: sharedRowStyle })}
                                            summary={() => (
                                                <Table.Summary.Row style={{ background: '#f8fafc' }}>
                                                    <Table.Summary.Cell index={0} colSpan={3}><Text strong style={{ fontSize: 12 }}>Grand Total</Text></Table.Summary.Cell>
                                                    <Table.Summary.Cell index={1} align="right"><Text strong style={{ fontSize: 12, color: C.inProgress }}>{formatDurationFromMillis(totalEmpTime)}</Text></Table.Summary.Cell>
                                                </Table.Summary.Row>
                                            )}
                                        />
                                    </Col>
                                </Row>
                            ) : (
                                <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.muted }}><Spin /></div>
                            )
                        )}
                    </div>
                </Col>
            </Row>

            {/* ══ CLIENT DETAIL MODAL ══ */}
            <Modal
                open={clientModalVisible}
                onCancel={() => { setClientModalVisible(false); setDrillVisible(false); }}
                footer={null} width={900}
                styles={{ body: { padding: '24px', background: C.bg } }}
                title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 38, height: 38, borderRadius: 10, background: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.toDo, fontWeight: 800, fontSize: 16 }}>
                            {(selectedClientInfo?.name || 'C')[0]}
                        </div>
                        <div>
                            <div style={{ fontWeight: 700, color: C.text, fontSize: 15 }}>{selectedClientInfo?.name || 'Client'}</div>
                            <div style={{ fontSize: 12, color: C.muted }}>{getGroupName(selectedClientInfo)} · {getSpocName(selectedClientInfo)}</div>
                        </div>
                    </div>
                }
            >
                {clientModalLoading ? (
                    <div style={{ textAlign: 'center', padding: 60 }}><Spin size="large" /></div>
                ) : clientSummary ? (
                    <>
                        <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
                            {[
                                { label: 'Done Tasks',  value: clientSummary.done_count,                              color: C.done,       bg: '#d1fae5', isText: false },
                                { label: 'Total Time',  value: formatDurationFromMillis(clientSummary.total_hours_ms), color: C.toDo,       bg: '#ede9fe', isText: true  },
                                { label: 'Employees',   value: clientSummary.employees?.length || 0,                  color: C.inProgress, bg: '#fef3c7', isText: false },
                                { label: 'Services',    value: clientSummary.sub_services?.length || 0,               color: '#0ea5e9',    bg: '#e0f2fe', isText: false },
                            ].map(({ label, value, color, bg, isText }) => (
                                <Col span={6} key={label}>
                                    <div style={{ background: bg, borderRadius: 12, padding: '14px 16px', textAlign: 'center' }}>
                                        {isText
                                            ? <div style={{ fontSize: 20, fontWeight: 800, color, lineHeight: 1.1 }}>{value}</div>
                                            : <CountUp end={value} duration={1.2} style={{ fontSize: 28, fontWeight: 800, color, lineHeight: 1 }} />
                                        }
                                        <div style={{ fontSize: 11, color: C.muted, marginTop: 4, fontWeight: 600 }}>{label}</div>
                                    </div>
                                </Col>
                            ))}
                        </Row>
                        <Row gutter={[12, 12]}>
                            {clientSummary.employees?.length > 0 && (
                                <Col xs={24} md={clientSummary.sub_services?.length > 0 ? 12 : 24}>
                                    <div style={{ background: C.surface, borderRadius: 12, padding: 16, border: `1px solid ${C.border}` }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                                            <Text style={{ fontWeight: 700, fontSize: 13 }}>Employee Hours</Text>
                                            <Text style={{ fontSize: 11, color: C.muted }}>Click bar for details</Text>
                                        </div>
                                        <EChartsReact
                                            option={hBarOption(clientSummary.employees, '#818cf8', '#6366f1')}
                                            style={{ height: Math.max(140, clientSummary.employees.length * 32 + 20) }}
                                            onEvents={{
                                                click: (params) => {
                                                    const reversed = [...clientSummary.employees].reverse();
                                                    const emp = reversed[params.dataIndex];
                                                    if (!emp) return;
                                                    const services = clientSummary.per_employee_services?.[emp.name] || [];
                                                    setDrillTitle(emp.name); setDrillData(services); setDrillType('employee'); setDrillVisible(true);
                                                },
                                            }}
                                        />
                                    </div>
                                </Col>
                            )}
                            {clientSummary.sub_services?.length > 0 && (
                                <Col xs={24} md={clientSummary.employees?.length > 0 ? 12 : 24}>
                                    <div style={{ background: C.surface, borderRadius: 12, padding: 16, border: `1px solid ${C.border}` }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                                            <Text style={{ fontWeight: 700, fontSize: 13 }}>Service Breakdown</Text>
                                            <Text style={{ fontSize: 11, color: C.muted }}>Click bar for details</Text>
                                        </div>
                                        <EChartsReact
                                            option={hBarOption(clientSummary.sub_services, '#06b6d4', '#0ea5e9')}
                                            style={{ height: Math.max(140, clientSummary.sub_services.length * 32 + 20) }}
                                            onEvents={{
                                                click: (params) => {
                                                    const reversed = [...clientSummary.sub_services].reverse();
                                                    const svc = reversed[params.dataIndex];
                                                    if (!svc) return;
                                                    const employees = clientSummary.per_service_employees?.[svc.name] || [];
                                                    setDrillTitle(svc.name); setDrillData(employees); setDrillType('service'); setDrillVisible(true);
                                                },
                                            }}
                                        />
                                    </div>
                                </Col>
                            )}
                        </Row>

                        {drillVisible && (
                            <div style={{ marginTop: 20, background: C.surface, borderRadius: 12, border: `2px solid ${drillType === 'employee' ? '#6366f1' : '#0ea5e9'}`, padding: 20 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                                    <div>
                                        <Text style={{ fontWeight: 700, fontSize: 14, color: C.text }}>
                                            {drillType === 'employee' ? `Services — ${drillTitle}` : `Employees — ${drillTitle}`}
                                        </Text>
                                        <Text style={{ fontSize: 12, color: C.muted, display: 'block' }}>
                                            {drillType === 'employee' ? 'Time by sub-service for this employee' : 'Time by employee for this service'}
                                        </Text>
                                    </div>
                                    <Button size="small" onClick={() => setDrillVisible(false)}>✕ Close</Button>
                                </div>
                                {drillData.length > 0 ? (
                                    <Row gutter={[16, 0]}>
                                        <Col xs={24} xl={12}>
                                            <EChartsReact
                                                option={hBarOption(drillData.map(d => ({ name: d.name, ms: d.ms ?? d.total_hours_ms ?? 0 })), drillType === 'employee' ? '#818cf8' : '#06b6d4', drillType === 'employee' ? '#6366f1' : '#0ea5e9')}
                                                style={{ height: Math.max(140, drillData.length * 32 + 20) }}
                                            />
                                        </Col>
                                        <Col xs={24} xl={12}>
                                            <Table
                                                dataSource={drillData.map(d => ({ ...d, ms: d.ms ?? d.total_hours_ms ?? 0 }))}
                                                rowKey="name" size="small" pagination={sharedPagination}
                                                columns={[
                                                    makeIndexCol(),
                                                    {
                                                        title: drillType === 'employee' ? 'Sub-service' : 'Employee',
                                                        dataIndex: 'name', key: 'name',
                                                        render: v => <Tooltip title={v} placement="topLeft"><Text style={{ fontWeight: 500, fontSize: 13, maxWidth: 200, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v || '—'}</Text></Tooltip>,
                                                        sorter: (a, b) => (a.name || '').localeCompare(b.name || ''),
                                                    },
                                                    {
                                                        title: 'Time Spent', dataIndex: 'ms', key: 'ms', align: 'right', width: 120,
                                                        render: v => <Text style={{ fontSize: 13, fontWeight: 700, color: drillType === 'employee' ? '#6366f1' : '#0ea5e9' }}>{formatDurationFromMillis(v)}</Text>,
                                                        sorter: (a, b) => (a.ms || 0) - (b.ms || 0),
                                                        defaultSortOrder: 'descend',
                                                    },
                                                ]}
                                                summary={() => (
                                                    <Table.Summary.Row style={{ background: '#f8fafc' }}>
                                                        <Table.Summary.Cell index={0} colSpan={2}><Text strong style={{ fontSize: 12 }}>Total</Text></Table.Summary.Cell>
                                                        <Table.Summary.Cell index={1} align="right">
                                                            <Text strong style={{ fontSize: 12, color: drillType === 'employee' ? '#6366f1' : '#0ea5e9' }}>
                                                                {formatDurationFromMillis(drillData.reduce((s, d) => s + (d.ms ?? d.total_hours_ms ?? 0), 0))}
                                                            </Text>
                                                        </Table.Summary.Cell>
                                                    </Table.Summary.Row>
                                                )}
                                            />
                                        </Col>
                                    </Row>
                                ) : (
                                    <div style={{ textAlign: 'center', padding: 32, color: C.muted }}>No breakdown data found</div>
                                )}
                            </div>
                        )}
                    </>
                ) : (
                    <div style={{ textAlign: 'center', padding: 40, color: C.muted }}>No data available</div>
                )}
            </Modal>

            {/* ══ EMPLOYEE DETAIL MODAL ══ */}
            <Modal
                open={empModalVisible}
                onCancel={() => { setEmpModalVisible(false); setEmpDrillVisible(false); }}
                footer={null} width={960}
                styles={{ body: { padding: '24px', background: C.bg } }}
                title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.inProgress, fontWeight: 800, fontSize: 16 }}>
                            {(empModalName || 'E')[0]}
                        </div>
                        <div>
                            <div style={{ fontWeight: 700, color: C.text, fontSize: 15 }}>{empModalName}</div>
                            <div style={{ fontSize: 12, color: C.muted }}>Client-wise time breakdown · click a bar or row to drill into sub-services</div>
                        </div>
                    </div>
                }
            >
                {empModalLoading ? (
                    <div style={{ textAlign: 'center', padding: 60 }}><Spin size="large" /></div>
                ) : empModalClients.length > 0 ? (
                    <>
                        <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
                            {[
                                { label: 'Clients Worked On', value: empModalClients.length, color: C.inProgress, bg: '#fef3c7', isText: false },
                                { label: 'Total Time',        value: formatDurationFromMillis(empModalClients.reduce((s, r) => s + (r.total_hours_ms || 0), 0)), color: C.toDo, bg: '#ede9fe', isText: true },
                                { label: 'Avg per Client',    value: formatDurationFromMillis(empModalClients.length ? Math.round(empModalClients.reduce((s, r) => s + (r.total_hours_ms || 0), 0) / empModalClients.length) : 0), color: C.done, bg: '#d1fae5', isText: true },
                            ].map(({ label, value, color, bg, isText }) => (
                                <Col span={8} key={label}>
                                    <div style={{ background: bg, borderRadius: 12, padding: '14px 16px', textAlign: 'center' }}>
                                        {isText
                                            ? <div style={{ fontSize: 20, fontWeight: 800, color, lineHeight: 1.1 }}>{value}</div>
                                            : <CountUp end={value} duration={1.2} style={{ fontSize: 28, fontWeight: 800, color, lineHeight: 1 }} />
                                        }
                                        <div style={{ fontSize: 11, color: C.muted, marginTop: 4, fontWeight: 600 }}>{label}</div>
                                    </div>
                                </Col>
                            ))}
                        </Row>

                        <Row gutter={[16, 16]}>
                            <Col xs={24} xl={12}>
                                <div style={{ background: C.surface, borderRadius: 12, padding: 16, border: `1px solid ${C.border}`, height: '100%' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                                        <Text style={{ fontWeight: 700, fontSize: 13 }}>Time per Client</Text>
                                        <Text style={{ fontSize: 11, color: C.muted }}>Click bar for sub-services</Text>
                                    </div>
                                    <EChartsReact
                                        option={hBarOption(
                                            [...empModalClients].sort((a, b) => b.total_hours_ms - a.total_hours_ms).slice(0, 10).map(r => ({ name: r.client_name, ms: r.total_hours_ms })),
                                            '#f59e0b', '#fbbf24'
                                        )}
                                        style={{ height: Math.max(160, Math.min(empModalClients.length, 10) * 32 + 24) }}
                                        onEvents={{
                                            click: (params) => {
                                                const sorted   = [...empModalClients].sort((a, b) => b.total_hours_ms - a.total_hours_ms).slice(0, 10);
                                                const reversed = [...sorted].reverse();
                                                const row = reversed[params.dataIndex];
                                                if (!row) return;
                                                handleEmpClientBarClick(row);
                                            },
                                        }}
                                    />
                                </div>
                            </Col>
                            <Col xs={24} xl={12}>
                                <Table
                                    dataSource={[...empModalClients].sort((a, b) => b.total_hours_ms - a.total_hours_ms)}
                                    rowKey="client_id" size="small"
                                    columns={empClientCols} pagination={sharedPagination} scroll={{ x: 'max-content' }}
                                    onRow={r => ({ onClick: () => handleEmpClientBarClick(r), style: sharedRowStyle })}
                                    summary={() => (
                                        <Table.Summary.Row style={{ background: '#f8fafc' }}>
                                            <Table.Summary.Cell index={0} colSpan={2}><Text strong style={{ fontSize: 12 }}>Grand Total</Text></Table.Summary.Cell>
                                            <Table.Summary.Cell index={1} align="right">
                                                <Text strong style={{ fontSize: 12, color: C.inProgress }}>
                                                    {formatDurationFromMillis(empModalClients.reduce((s, r) => s + (r.total_hours_ms || 0), 0))}
                                                </Text>
                                            </Table.Summary.Cell>
                                        </Table.Summary.Row>
                                    )}
                                />
                                <Text style={{ fontSize: 11, color: C.muted, display: 'block', marginTop: 8 }}>
                                    💡 Click any row or chart bar to see sub-service breakdown
                                </Text>
                            </Col>
                        </Row>

                        {empDrillVisible && (
                            <div style={{ marginTop: 20, background: C.surface, borderRadius: 12, border: `2px solid #f59e0b`, padding: 20 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                                    <div>
                                        <Text style={{ fontWeight: 700, fontSize: 14, color: C.text }}>Sub-services — {empDrillClient?.client_name}</Text>
                                        <Text style={{ fontSize: 12, color: C.muted, display: 'block' }}>Time breakdown by description/service for <strong>{empModalName}</strong></Text>
                                    </div>
                                    <Button size="small" onClick={() => setEmpDrillVisible(false)}>✕ Close</Button>
                                </div>
                                {empDrillLoading ? (
                                    <div style={{ textAlign: 'center', padding: 32 }}><Spin /></div>
                                ) : empDrillServices.length > 0 ? (
                                    <Row gutter={[16, 0]}>
                                        <Col xs={24} xl={12}>
                                            <EChartsReact
                                                option={hBarOption(empDrillServices.map(s => ({ name: s.name, ms: s.ms })), '#f59e0b', '#fbbf24')}
                                                style={{ height: Math.max(140, empDrillServices.length * 32 + 20) }}
                                            />
                                        </Col>
                                        <Col xs={24} xl={12}>
                                            <Table
                                                dataSource={empDrillServices} rowKey="name" size="small"
                                                pagination={sharedPagination} columns={empDrillCols}
                                                summary={() => (
                                                    <Table.Summary.Row style={{ background: '#f8fafc' }}>
                                                        <Table.Summary.Cell index={0} colSpan={2}><Text strong style={{ fontSize: 12 }}>Total</Text></Table.Summary.Cell>
                                                        <Table.Summary.Cell index={1} align="right">
                                                            <Text strong style={{ fontSize: 12, color: '#f59e0b' }}>
                                                                {formatDurationFromMillis(empDrillServices.reduce((s, r) => s + (r.ms || 0), 0))}
                                                            </Text>
                                                        </Table.Summary.Cell>
                                                    </Table.Summary.Row>
                                                )}
                                            />
                                        </Col>
                                    </Row>
                                ) : (
                                    <div style={{ textAlign: 'center', padding: 32, color: C.muted }}>No sub-service entries found for this client</div>
                                )}
                            </div>
                        )}
                    </>
                ) : (
                    <div style={{ textAlign: 'center', padding: 40, color: C.muted }}>No time entries found</div>
                )}
            </Modal>

        </div>
    );
};

export default TaskDashboard;