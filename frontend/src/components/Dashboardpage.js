import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import CountUp from 'react-countup';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import { TaskDetailView } from '../pages/clients/ClientManagement/STT_Records';
import {
  CheckSquareOutlined, ClockCircleOutlined, CheckCircleOutlined,
  ExclamationCircleOutlined, FileTextOutlined, CalendarOutlined,
  TeamOutlined, ArrowRightOutlined, RiseOutlined,
  LoginOutlined, BellOutlined, FileProtectOutlined, HomeOutlined,
} from '@ant-design/icons';

// ─── Disabled Components (not available locally) ──────────────────────────────
const CKPSCAFeed = () => null;

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

const C = {
  navy:'#023C6C', navyDk:'#011f3a', teal:'#0891b2', tealLt:'#e0f2f9',
  amber:'#d97706', amberLt:'#fef3c7', green:'#059669', greenLt:'#d1fae5',
  red:'#dc2626', redLt:'#fee2e2', purple:'#7c3aed', purpleLt:'#ede9fe',
  slate:'#64748b', border:'#e2e8f0',
};

if (!document.head.querySelector('[href*="Sora"]')) {
  const l = document.createElement('link');
  l.rel = 'stylesheet';
  l.href = 'https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=DM+Sans:wght@400;500;600&display=swap';
  document.head.appendChild(l);
}

if (!document.getElementById('db-styles')) {
  const s = document.createElement('style');
  s.id = 'db-styles';
  s.textContent = `
    @keyframes caDayGlow {
        0%, 100% { opacity: 1; text-shadow: 0 0 0 rgba(253,230,138,0); }
        50% { opacity: 0.85; text-shadow: 0 0 12px rgba(253,230,138,.6); }
        }
        @keyframes caDayBounce {
        0%, 100% { transform: translateY(0) rotate(0deg); }
        25% { transform: translateY(-2px) rotate(-8deg); }
        75% { transform: translateY(-2px) rotate(8deg); }
        }
        .ca-day-badge {
        animation: fadeUp 0.5s ease both, caDayGlow 2.4s ease-in-out infinite;
        }
        .ca-day-emoji {
        display: inline-block;
        animation: caDayBounce 1.6s ease-in-out infinite;
        }
    @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
    @keyframes shimmer{0%{background-position:-400px 0}100%{background-position:400px 0}}
    @keyframes tickPulse{0%,100%{opacity:1}50%{opacity:.5}}
    @keyframes modalIn{from{opacity:0;transform:translateY(24px) scale(.97)}to{opacity:1;transform:translateY(0) scale(1)}}
    @keyframes overlayIn{from{opacity:0}to{opacity:1}}
    @keyframes fadeIn{from{opacity:0}to{opacity:1}}
    @keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
    @keyframes subtitleSlideIn{from{opacity:0;transform:translateX(-8px)}to{opacity:1;transform:translateX(0)}}
    .db-fade{animation:fadeUp 0.4s ease both}
    .db-card{background:#fff;border-radius:14px;border:1px solid #e2e8f0;padding:20px 22px;cursor:pointer;position:relative;overflow:hidden;transition:transform .18s,box-shadow .18s,border-color .18s}
    .db-card:hover{transform:translateY(-3px);box-shadow:0 10px 28px rgba(2,60,108,.11);border-color:#0891b2}
    .db-card::before{content:'';position:absolute;top:0;left:0;right:0;height:3px;border-radius:14px 14px 0 0;background:var(--ac,#0891b2);opacity:0;transition:opacity .18s}
    .db-card:hover::before{opacity:1}
    .db-box{background:#fff;border-radius:16px;border:1px solid #e2e8f0;padding:22px 24px}
    .skel{background:linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%);background-size:400px 100%;animation:shimmer 1.4s infinite;border-radius:8px}
    .qbtn{padding:8px 16px;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif;display:inline-flex;align-items:center;gap:6px;transition:transform .15s,background .15s;border-width:1.5px;border-style:solid}
    .qbtn:hover{transform:translateY(-2px)}
    .live-dot{width:7px;height:7px;border-radius:50%;background:#22c55e;display:inline-block;animation:tickPulse 1.5s infinite}
    .ci-chip{transition:opacity .15s}
    .ci-chip:active{opacity:.75}
    .co-overlay{position:fixed;inset:0;z-index:9999;background:rgba(1,31,58,.55);backdrop-filter:blur(7px);display:flex;align-items:center;justify-content:center;animation:overlayIn .2s ease both}
    .co-card{background:#fff;border-radius:22px;width:100%;max-width:410px;margin:0 16px;overflow:hidden;box-shadow:0 40px 100px rgba(1,31,58,.25),0 2px 8px rgba(0,0,0,.06);animation:modalIn .28s cubic-bezier(.34,1.26,.64,1) both}
    .co-btn{height:46px;border-radius:12px;font-size:14px;font-weight:700;cursor:pointer;font-family:'DM Sans',sans-serif;border:none;transition:transform .15s,box-shadow .15s,background .15s}
    .co-btn:hover{transform:translateY(-2px)}
    .co-btn-cancel{flex:1;background:#f1f5f9;color:#475569;border:1.5px solid #e2e8f0 !important}
    .co-btn-cancel:hover{background:#e2e8f0 !important}
    .co-btn-confirm{flex:1;background:linear-gradient(135deg,#dc2626,#b91c1c);color:#fff;box-shadow:0 4px 14px rgba(220,38,38,.35)}
    .co-btn-confirm:hover{box-shadow:0 8px 22px rgba(220,38,38,.45) !important}
    .task-row{transition:background .2s ease,opacity .2s ease}
    .tw-wrap{display:flex;align-items:center;flex-wrap:nowrap;margin-top:8px;min-height:24px}
    .tw-line{display:inline;white-space:normal;word-break:break-word;color:rgba(255,255,255,.78);font-size:12.5px;font-family:'DM Sans',sans-serif;font-weight:500;letter-spacing:.01em;opacity:0;animation:fadeIn 0.6s ease 0.2s forwards}
    .tw-cursor{display:inline-block;width:2px;height:12px;background:rgba(255,255,255,.55);margin-left:2px;vertical-align:middle;border-radius:1px;flex-shrink:0;animation:blink 1s step-end infinite;animation-delay:0.8s}
    .ticker-tag{display:inline-flex;align-items:center;gap:4px;padding:2px 8px;border-radius:20px;font-size:10px;font-weight:700;font-family:'Sora',sans-serif;margin-right:6px;flex-shrink:0}
    @keyframes tickerFadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
    @keyframes tickerFadeOut{from{opacity:1;transform:translateY(0)}to{opacity:0;transform:translateY(-6px)}}
    .ticker-enter{animation:tickerFadeIn 0.4s ease forwards}
    .ticker-exit{animation:tickerFadeOut 0.3s ease forwards}
    @media(max-width:600px){
      .db-card{min-width:calc(50% - 7px)!important;flex:1 1 calc(50% - 7px)!important}
      .ci-chip>div:first-child~div{font-size:14px!important}
    }
  `;
  document.head.appendChild(s);
}

const Skel = ({ h=18, w='100%', mt=0 }) =>
  <div className="skel" style={{height:h,width:w,marginTop:mt}} />;

function seededRand(seed) {
  let x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

const CACHE = {
  tasks:       { data: null, ts: 0 },
  att:         { data: null, ts: 0, key: '' },
  actions:     { data: null, ts: 0, key: '' },
  motivations: { data: null, ts: 0 },   // ← Ollama motivations cache
};
const TTL_MS = 60_000;
const isFresh = (entry) => entry.data !== null && Date.now() - entry.ts < TTL_MS;

/* ══════════════════════════════════════════════════════════
   SMART TICKER
══════════════════════════════════════════════════════════ */
function buildTickerPool({ name, hIn, isManager, isAdmin,
  taskCounts, leaveData, teamPending, invoiceDraft,
  udinPending, clientRequestsPending, groupRequestsPending, serviceRequestsPending,
  upcomingTasks, monthSummary, checkInISO, checkOutISO,
  aiMotivations,   // ← NEW param
}) {

  const overdue  = taskCounts.overdue;
  const inProg   = taskCounts.inProgress;
  const todo     = taskCounts.todo;
  const done     = taskCounts.done;
  const total    = taskCounts.total;
  const now      = dayjs();
  const pool     = [];

  const add = (text, tag='tip', tagColor='#0891b2') => pool.push({ text, tag, tagColor });

//   const now2 = dayjs();
//     if (now2.month() === 6 && now2.date() === 1) {
//     add(`🎉 Happy CA Day! Celebrating the expertise behind every audit, filing, and financial decision.`, 'CA DAY', '#d97706');
//     }
    const now2 = dayjs();
        if (now2.month() === 6 && now2.date() === 1) {
        add(`🎉 Happy CA Day,! Marking another year of ICAI's legacy of trust and excellence.`, 'CA DAY', '#d97706');
        add(`📚 Did you know? ICAI was established on 1st July 1949, making it one of the largest accounting bodies in the world.`, 'CA DAY', '#d97706');
        add(`🏛️ India's CA profession plays a vital role in nation-building — from audits to advisory to policy.`, 'CA DAY', '#d97706');
        add(`💼 Behind every clean balance sheet is a CA who made sure it stayed that way. Thank you for your work.`, 'CA DAY', '#d97706');
        add(`🎓 Becoming a CA takes years of discipline and rigor — today we celebrate that journey.`, 'CA DAY', '#d97706');
        }

  if (overdue >= 10) add(`🔴 ${overdue} tasks are overdue — your attention is needed now.`, 'URGENT', '#dc2626');
  else if (overdue >= 5) add(`⚡ ${overdue} overdue tasks waiting. Let's clear them today, ${name}.`, 'OVERDUE', '#dc2626');
  else if (overdue >= 2) add(`⏰ ${overdue} tasks are past their due date. Time to tackle them.`, 'OVERDUE', '#e57373');
  else if (overdue === 1) add(`📌 One task is overdue. Knock it out first and start fresh.`, 'OVERDUE', '#e57373');

  const dueToday    = upcomingTasks.filter(t => dayjs(t.due_date).isSame(now,'day'));
  const dueTomorrow = upcomingTasks.filter(t => dayjs(t.due_date).isSame(now.add(1,'day'),'day'));
  const dueThisWeek = upcomingTasks.filter(t => {
    const d = dayjs(t.due_date);
    return d.isAfter(now.add(1,'day'),'day') && d.isSameOrBefore(now.add(7,'day'),'day');
  });

  if (dueToday.length === 1)
    add(`📅 "${dueToday[0].sub_service_name || 'A task'}" for ${dueToday[0].client_name || 'a client'} is due today.`, 'DUE TODAY', '#d97706');
  else if (dueToday.length > 1)
    add(`📅 ${dueToday.length} tasks are due today. Check your STT Records.`, 'DUE TODAY', '#d97706');

  if (dueTomorrow.length === 1)
    add(`🗓 "${dueTomorrow[0].sub_service_name || 'A task'}" is due tomorrow — heads up!`, 'TOMORROW', '#d97706');
  else if (dueTomorrow.length > 1)
    add(`🗓 ${dueTomorrow.length} tasks are due tomorrow. Plan ahead.`, 'TOMORROW', '#d97706');

  if (dueThisWeek.length > 0)
    add(`📆 ${dueThisWeek.length} task${dueThisWeek.length>1?'s':''} coming up this week. Stay ahead of the curve.`, 'THIS WEEK', '#7c3aed');

  if (total === 0)
    add(`✨ No tasks assigned yet. A clean slate — enjoy it while it lasts!`, 'TASKS', '#059669');
  else if (todo === 0 && inProg === 0 && done > 0)
    add(`🏆 All ${done} tasks completed! That's a perfect score, ${name}.`, 'DONE', '#059669');
  else if (done > 0 && total > 0)
    add(`✅ ${done} of ${total} tasks done (${Math.round((done/total)*100)}%). Keep the momentum going!`, 'PROGRESS', '#059669');

  if (inProg >= 5) add(`🔄 ${inProg} tasks are currently in progress. Stay focused, ${name}.`, 'IN PROGRESS', '#d97706');
  else if (inProg > 0) add(`🔄 ${inProg} task${inProg>1?'s are':' is'} in progress. You're on it!`, 'IN PROGRESS', '#d97706');

  if (todo >= 10) add(`📋 ${todo} tasks in your To Do list. Time to dive in!`, 'TO DO', '#7c3aed');
  else if (todo > 0) add(`📋 ${todo} task${todo>1?'s':''} still in To Do. Let's get them moving.`, 'TO DO', '#7c3aed');

  if (leaveData.pending > 0)
    add(`🏖 You have ${leaveData.pending} pending leave request${leaveData.pending>1?'s':''}. Check their status in Leave Tracker.`, 'LEAVE', '#0891b2');
  if (leaveData.approved > 0)
    add(`✈️ You have ${leaveData.approved} approved leave${leaveData.approved>1?'s':''}. Plan your tasks accordingly.`, 'LEAVE', '#059669');

  if (monthSummary.present > 0)
    add(`📊 You've been present ${monthSummary.present} day${monthSummary.present>1?'s':''} this month. Consistency builds trust.`, 'ATTENDANCE', '#0891b2');
  if (monthSummary.late > 0)
    add(`⏱ ${monthSummary.late} late check-in${monthSummary.late>1?'s':''} this month. Early bird catches the worm! 🐦`, 'ATTENDANCE', '#d97706');

  if (!checkInISO)
    add(`🟡 You haven't checked in yet today. Don't forget to mark your attendance!`, 'REMINDER', '#d97706');
  else if (checkInISO && checkOutISO)
    add(`✅ Attendance complete for today. See you tomorrow, ${name}!`, 'ATTENDANCE', '#059669');

  if (isManager && teamPending > 0)
    add(`👥 ${teamPending} team leave request${teamPending>1?'s':''} need your approval. Head to Leave Management.`, 'ACTION', '#dc2626');
  if (isManager && invoiceDraft > 0)
    add(`🧾 ${invoiceDraft} draft invoice${invoiceDraft>1?'s':''} waiting to be finalised. Visit the Invoice section.`, 'ACTION', '#d97706');
  if ((isManager || isAdmin) && udinPending > 0)
    add(`📝 ${udinPending} UDIN record${udinPending>1?'s':''} need${udinPending===1?'s':''} attention. Check UDIN Records.`, 'ACTION', '#7c3aed');

  const totalReqPending = (clientRequestsPending||0) + (groupRequestsPending||0) + (serviceRequestsPending||0);
  if (isManager && totalReqPending > 0)
    add(`🆕 ${totalReqPending} pending request${totalReqPending>1?'s':''} need your review — clients, groups or services.`, 'ACTION', '#dc2626');

  const featureTips = [
    { text:`💡 Tip: Click any task row in "Upcoming & Overdue" to open the full task detail instantly.`, tag:'FEATURE' },
    { text:`💡 Tip: Use Quick Navigate below to jump to any section in one click.`, tag:'FEATURE' },
    { text:`💡 Tip: STT Records lets you filter tasks by status, client, and due date easily.`, tag:'FEATURE' },
    { text:`💡 Tip: The overdue count on the banner is clickable — it takes you straight to overdue tasks.`, tag:'FEATURE' },
    { text:`💡 Tip: Your attendance is tracked automatically when you check in. Don't forget each morning!`, tag:'FEATURE' },
    { text:`💡 Tip: UDIN Records keep all your attestation filings organized in one place.`, tag:'FEATURE' },
    { text:`💡 Tip: Leave Tracker shows the real-time status of all your leave applications.`, tag:'FEATURE' },
    { text:`💡 Tip: Process Docs (SOP) section has step-by-step guides for every workflow.`, tag:'FEATURE' },
    { text:`💡 Tip: Invoice section lets you track draft and invoices for all clients.`, tag:'FEATURE' },
    { text:`💡 Tip: Compliance Tracker helps ensure no deadline slips through the cracks.`, tag:'FEATURE' },
    { text:`💡 Tip: Hover over any task row to pause the auto-scroll and read at your pace.`, tag:'FEATURE' },
    { text:`💡 Tip: The check-in chip in the banner doubles as your live time-on-clock tracker.`, tag:'FEATURE' },
  ];
  const dayOfYear = now.dayOfYear ? now.dayOfYear() : now.diff(now.startOf('year'), 'day');
  const tip1 = featureTips[(dayOfYear) % featureTips.length];
  const tip2 = featureTips[(dayOfYear + 6) % featureTips.length];
  add(tip1.text, tip1.tag, '#0891b2');
  if (tip1.text !== tip2.text) add(tip2.text, tip2.tag, '#0891b2');

  if (hIn >= 6 && hIn < 9)
    add(`☀️ Early start! The best time to plan your day is right now, ${name}.`, 'MORNING', '#d97706');
  else if (hIn >= 9 && hIn < 12)
    add(`☕ Morning in full swing. Tackle your hardest task first — it only gets easier.`, 'MORNING', '#d97706');
  else if (hIn >= 12 && hIn < 14)
    add(`🍽 Lunchtime! Take a real break — a rested mind works twice as fast.`, 'MIDDAY', '#059669');
  else if (hIn >= 14 && hIn < 17)
    add(`⚡ Afternoon slump? Pick one small task and complete it. Momentum follows action.`, 'AFTERNOON', '#7c3aed');
  else if (hIn >= 17 && hIn < 20)
    add(`🌇 End of day approaching. Wrap up open tasks and plan for tomorrow.`, 'EVENING', '#0891b2');
  else if (hIn >= 20 && hIn < 23)
    add(`🌙 Late evening — great work today, ${name}. Rest up for tomorrow.`, 'EVENING', '#7c3aed');
  else
    add(`🦉 Midnight oil, ${name}? Respect the dedication. Don't forget to rest!`, 'LATE', '#dc2626');

  // ── Motivational lines: Ollama-generated if available, otherwise defaults ──
  const defaultMotivations = [
    `🚀 Progress over perfection. Ship it, improve it, repeat.`,
    `🎯 One task at a time. That's how mountains get moved.`,
    `💪 You've handled tougher days. Today is no different.`,
    `🌱 Small wins add up. Every completed task counts.`,
    `🔥 Consistency beats intensity. Show up every day, ${name}.`,
    `⭐ Great work speaks for itself. Keep doing yours.`,
    `🧠 Clarity comes from action, not from thinking. Start somewhere.`,
    `📈 Every task done today is one less worry tomorrow.`,
  ];

  const motivationLines = aiMotivations?.length > 0 ? aiMotivations : defaultMotivations;
  motivationLines.forEach(m => add(m, 'MOTIVATION', '#7c3aed'));

  return pool;
}

function CADayBadge({ message }) {
  const [phase, setPhase] = useState('loading'); // loading -> reveal

  useEffect(() => {
    const t = setTimeout(() => setPhase('reveal'), 900);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="ca-day-badge" style={{
      marginTop:4, fontSize:12.5, fontWeight:700, color:'#fde68a',
      fontFamily:"'DM Sans',sans-serif", display:'flex', alignItems:'center', gap:6,
      minHeight:18,
    }}>
      <span className="ca-day-emoji">🎉</span>
      {phase === 'loading' ? (
        <span style={{display:'inline-flex',alignItems:'center',gap:4,color:'rgba(253,230,138,.75)',fontStyle:'italic'}}>
          Preparing today's wish
          <span style={{display:'inline-flex',gap:2}}>
            <span className="ca-dot" style={{animationDelay:'0s'}}>.</span>
            <span className="ca-dot" style={{animationDelay:'.15s'}}>.</span>
            <span className="ca-dot" style={{animationDelay:'.3s'}}>.</span>
          </span>
        </span>
      ) : (
        <span className="tw-line" style={{color:'#fde68a'}}>{message}</span>
      )}
    </div>
  );
}

function SmartTicker({ pool, loading }) {
  const [idx,     setIdx]     = useState(() =>
    pool.length > 0 ? Math.floor(seededRand(Math.floor(Date.now()/1000)) * pool.length) : 0
  );
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (!pool || pool.length <= 1) return;
    const timer = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIdx(prev => (prev + 1) % pool.length);
        setVisible(true);
      }, 350);
    }, 10000);
    return () => clearInterval(timer);
  }, [pool]);

  useEffect(() => {
    if (pool && pool.length > 0) {
      setIdx(Math.floor(seededRand(Math.floor(Date.now()/1000)) * pool.length));
      setVisible(true);
    }
  }, [pool?.length]);

  if (loading) {
    return (
      <div style={{marginTop:8,minHeight:22,display:'flex',alignItems:'center',gap:6}}>
        <span style={{color:'rgba(255,255,255,.45)',fontSize:12,fontStyle:'italic',
          fontFamily:"'DM Sans',sans-serif"}}>
          Loading your workspace... ⏳
        </span>
      </div>
    );
  }

  if (!pool || !pool.length) return null;
  const current = pool[idx % pool.length];
  if (!current) return null;

  return (
    <div style={{marginTop:8,minHeight:22,display:'flex',alignItems:'flex-start',
      flexWrap:'wrap',gap:4,
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(-5px)',
      transition:'opacity 0.35s ease, transform 0.35s ease',
    }}>
      <span className="ticker-tag" style={{
        background: current.tagColor + '25',
        color:      current.tagColor,
        border:     `1px solid ${current.tagColor}40`,
        flexShrink: 0, alignSelf:'center',
      }}>
        {current.tag}
      </span>
      <span style={{
        color:'rgba(255,255,255,.78)', fontSize:12.5,
        fontFamily:"'DM Sans',sans-serif", fontWeight:500,
        letterSpacing:'.01em', lineHeight:1.5,
        flex:1, minWidth:0,
      }}>
        {current.text}
      </span>
    </div>
  );
}

function SectionHeader({ title, icon, accent, navLabel, onNav }) {
  return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
      <div style={{display:'flex',alignItems:'center',gap:10}}>
        <div style={{width:34,height:34,borderRadius:9,background:accent+'18',color:accent,
          display:'flex',alignItems:'center',justifyContent:'center',fontSize:15}}>{icon}</div>
        <span style={{fontFamily:"'Sora',sans-serif",fontWeight:700,fontSize:14,color:C.navyDk}}>{title}</span>
      </div>
      {navLabel && (
        <button onClick={onNav} style={{background:'none',border:'none',cursor:'pointer',fontSize:12,
          color:C.teal,fontWeight:600,display:'flex',alignItems:'center',gap:4,
          fontFamily:"'DM Sans',sans-serif",padding:0,transition:'gap .15s'}}
          onMouseEnter={e=>e.currentTarget.style.gap='8px'}
          onMouseLeave={e=>e.currentTarget.style.gap='4px'}>
          {navLabel} <ArrowRightOutlined style={{fontSize:10}}/>
        </button>
      )}
    </div>
  );
}

function StatCard({ label, value, icon, accent, delay=0, onClick, loading }) {
  return (
    <div className="db-card db-fade" style={{'--ac':accent,animationDelay:`${delay}ms`,flex:1,minWidth:130}} onClick={onClick}>
      <div style={{width:38,height:38,borderRadius:10,background:accent+'18',color:accent,
        display:'flex',alignItems:'center',justifyContent:'center',fontSize:17,marginBottom:12}}>{icon}</div>
      {loading
        ? <><Skel h={30} w="55%"/><Skel h={12} w="75%" mt={7}/></>
        : <>
            <div style={{fontFamily:"'Sora',sans-serif",fontSize:28,fontWeight:800,color:C.navyDk,lineHeight:1}}>
              <CountUp end={value??0} duration={1.6}/>
            </div>
            <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:C.slate,marginTop:6,fontWeight:500}}>{label}</div>
          </>
      }
    </div>
  );
}

function useLiveTime(isoString) {
  const [display, setDisplay] = useState('');
  useEffect(() => {
    if (!isoString) return;
    const fmt = () => {
      const diff = Math.floor((Date.now() - new Date(isoString)) / 1000);
      const h = Math.floor(diff / 3600);
      const m = Math.floor((diff % 3600) / 60);
      const s = diff % 60;
      setDisplay(h > 0
        ? `${h}h ${String(m).padStart(2,'0')}m`
        : `${m}m ${String(s).padStart(2,'0')}s`);
    };
    fmt();
    const iv = setInterval(fmt, 1000);
    return () => clearInterval(iv);
  }, [isoString]);
  return display;
}

function useSecondsSince(isoString) {
  const [secs, setSecs] = useState(0);
  useEffect(() => {
    if (!isoString) { setSecs(0); return; }
    const tick = () => setSecs(Math.floor((Date.now() - new Date(isoString)) / 1000));
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [isoString]);
  return secs;
}

function getShiftDate() {
  const now = dayjs();
  return now.isBefore(now.hour(7).minute(0).second(0))
    ? now.subtract(1, 'day').format('YYYY-MM-DD')
    : now.format('YYYY-MM-DD');
}

function isCADay() {
  const now = dayjs();
  return now.month() === 6 && now.date() === 1; // July is month index 6
}

function ActionsRequired({ items, loading }) {
  const alertItems   = items.filter(i => i.count > 0);
  const totalActions = alertItems.reduce((s, i) => s + i.count, 0);
  const allClear     = !loading && alertItems.length === 0;

  return (
    <div className="db-box db-fade" style={{animationDelay:'200ms',marginBottom:20,padding:'14px 18px'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <BellOutlined style={{fontSize:14,color:totalActions>0?'#e57373':C.green}}/>
          <span style={{fontFamily:"'Sora',sans-serif",fontWeight:700,fontSize:13,color:C.navyDk}}>Actions Required</span>
          {!loading && totalActions > 0 && (
            <span style={{background:'#e57373',color:'#fff',borderRadius:20,padding:'1px 8px',fontSize:11,fontWeight:700,fontFamily:"'Sora',sans-serif"}}>{totalActions}</span>
          )}
        </div>
        {allClear && (
          <span style={{fontSize:12,color:C.green,fontWeight:600,display:'flex',alignItems:'center',gap:4}}>
            <CheckCircleOutlined/> All clear
          </span>
        )}
      </div>

      {loading ? (
        <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
          {[120,150,130,110,140,125].map(w=><Skel key={w} h={36} w={w}/>)}
        </div>
      ) : allClear ? (
        <div style={{display:'flex',alignItems:'center',gap:8,padding:'6px 0',color:C.green,fontSize:13,fontWeight:500}}>
          <CheckCircleOutlined style={{fontSize:15}}/> You're all caught up — no pending actions!
        </div>
      ) : (
        <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
          {items.filter(item => item.count > 0).map(item => (
            <div key={item.key} onClick={item.onClick} title={item.sublabel}
              style={{display:'inline-flex',alignItems:'center',gap:7,padding:'6px 12px 6px 8px',
                borderRadius:10, border:`1.5px solid ${item.accent}40`,
                background:item.accent+'0d', cursor:item.onClick?'pointer':'default',
                transition:'all .15s', fontFamily:"'DM Sans',sans-serif", flexShrink:0}}
              onMouseEnter={e => {
                e.currentTarget.style.background=item.accent+'1a';
                e.currentTarget.style.borderColor=item.accent+'70';
                e.currentTarget.style.transform='translateY(-1px)';
                e.currentTarget.style.boxShadow=`0 3px 10px ${item.accent}22`;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background=item.accent+'0d';
                e.currentTarget.style.borderColor=item.accent+'40';
                e.currentTarget.style.transform='translateY(0)';
                e.currentTarget.style.boxShadow='none';
              }}
            >
              <div style={{width:22,height:22,borderRadius:6,flexShrink:0,
                background:item.accent+'20',color:item.accent,
                display:'flex',alignItems:'center',justifyContent:'center',fontSize:11}}>
                {item.icon}
              </div>
              <span style={{fontSize:12,fontWeight:600,color:C.navyDk,whiteSpace:'nowrap'}}>
                {item.label}
              </span>
              <span style={{background:item.accent,color:'#fff',borderRadius:20,padding:'1px 7px',
                fontSize:11,fontWeight:700,fontFamily:"'Sora',sans-serif",
                minWidth:20,textAlign:'center',display:'inline-block'}}>
                {item.count}
              </span>
              {item.onClick && <ArrowRightOutlined style={{fontSize:9,color:item.accent,opacity:.6,marginLeft:-2}}/>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function UpcomingTasksTable({ tasks, loading, onNavigate, onOpenTask }) {
  const [activeTab,   setActiveTab]   = useState('overdue');
  const [progressPct, setProgressPct] = useState(0);

  const ROW_H  = 36;
  const ROWS   = 5;
  const SPEED  = 0.28;
  const now    = dayjs();

  const scrollRef = useRef(null);
  const pxRef     = useRef(0);
  const pausedRef = useRef(false);
  const rafRef    = useRef(null);

  const overdueTasks  = tasks.filter(t => dayjs(t.due_date).isBefore(now, 'day'));
  const upcomingTasks = tasks.filter(t => dayjs(t.due_date).isSameOrAfter(now, 'day'));
  const activeTasks   = activeTab === 'overdue' ? overdueTasks : upcomingTasks;

  const needsScroll  = activeTasks.length > ROWS;
  const looped       = needsScroll ? [...activeTasks, ...activeTasks, ...activeTasks] : activeTasks;
  const isOverdue    = activeTab === 'overdue';
  const accentBorder = isOverdue ? '#fca5a5' : '#fcd34d';
  const accentColor  = isOverdue ? '#e57373' : C.amber;

  const lastPctRef = useRef(-1);
  const startRaf = useCallback(() => {
    const total = activeTasks.length * ROW_H;
    const tick = () => {
      if (!pausedRef.current && scrollRef.current && total > 0) {
        pxRef.current += SPEED;
        if (pxRef.current >= total) pxRef.current -= total;
        scrollRef.current.style.transform = `translateY(-${pxRef.current}px)`;
        const pct = Math.round((pxRef.current / total) * 100);
        if (pct !== lastPctRef.current) { lastPctRef.current = pct; setProgressPct(pct); }
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [activeTasks.length]);

  useEffect(() => {
    pxRef.current = 0;
    if (scrollRef.current) scrollRef.current.style.transform = 'translateY(0)';
    setProgressPct(0);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (needsScroll) startRaf();
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [activeTab, activeTasks.length, needsScroll, startRaf]);

  const thStyle = {
    fontFamily:"'Sora',sans-serif",fontSize:10,fontWeight:700,color:'#9ca3af',
    textTransform:'uppercase',letterSpacing:'.07em',padding:'6px 10px',
    borderBottom:`1px solid ${C.border}`,background:'#fafafa',textAlign:'left',whiteSpace:'nowrap',
  };

  const tabBtn = (key, label, count, color) => {
    const isActive = activeTab === key;
    return (
      <button key={key} onClick={()=>setActiveTab(key)} style={{
        padding:'7px 18px',borderRadius:'8px 8px 0 0',fontFamily:"'Sora',sans-serif",fontWeight:700,fontSize:12,
        cursor:'pointer',border:'none',borderBottom:isActive?`2px solid ${color}`:'2px solid transparent',
        background:isActive?color+'12':'transparent',color:isActive?color:C.slate,
        transition:'all .2s',display:'flex',alignItems:'center',gap:6,
      }}>
        {label}
        <span style={{background:isActive?color:'#e5e7eb',color:isActive?'#fff':'#6b7280',borderRadius:20,padding:'0 7px',lineHeight:'18px',fontSize:10,fontWeight:700,transition:'all .2s',display:'inline-block'}}>
          {count}
        </span>
      </button>
    );
  };

  const getDueDateLabel = (due, isOD) => {
    const today    = now.startOf('day');
    const dueDay   = due.startOf('day');
    const diffDays = dueDay.diff(today, 'day');
    if (isOD) { const d = today.diff(dueDay,'day'); return d===0?'today':`${d}d ago`; }
    if (diffDays === 0) return 'today';
    if (diffDays === 1) return 'tomorrow';
    return `in ${diffDays}d`;
  };

  const viewH = ROWS * ROW_H;

  return (
    <div className="db-box db-fade" style={{animationDelay:'280ms',marginBottom:24}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <div style={{width:30,height:30,borderRadius:8,background:'#f1f5f9',color:C.slate,display:'flex',alignItems:'center',justifyContent:'center',fontSize:13}}>
            <ExclamationCircleOutlined/>
          </div>
          <span style={{fontFamily:"'Sora',sans-serif",fontWeight:700,fontSize:13,color:C.navyDk}}>Upcoming &amp; Overdue Tasks</span>
        </div>
        <button onClick={()=>onNavigate('/stt-records')} style={{background:'none',border:'none',cursor:'pointer',fontSize:12,color:C.teal,fontWeight:600,display:'flex',alignItems:'center',gap:4,fontFamily:"'DM Sans',sans-serif",padding:0,transition:'gap .15s'}}
          onMouseEnter={e=>e.currentTarget.style.gap='8px'} onMouseLeave={e=>e.currentTarget.style.gap='4px'}>
          View All <ArrowRightOutlined style={{fontSize:10}}/>
        </button>
      </div>

      <div style={{display:'flex',gap:4,borderBottom:`1px solid ${C.border}`}}>
        {tabBtn('overdue','Overdue',overdueTasks.length,'#e57373')}
        {tabBtn('upcoming','Upcoming',upcomingTasks.length,C.amber)}
      </div>

      {loading ? (
        <div style={{padding:'6px 0'}}>{[0,1,2,3,4].map(i=><Skel key={i} h={ROW_H-6} mt={5}/>)}</div>
      ) : activeTasks.length === 0 ? (
        <div style={{display:'flex',alignItems:'center',gap:8,padding:'22px 0',color:isOverdue?C.slate:C.amber,fontFamily:"'DM Sans',sans-serif",fontSize:13,fontWeight:500}}>
          <CheckCircleOutlined style={{fontSize:15,color:isOverdue?C.green:C.amber}}/>
          {isOverdue ? 'No overdue tasks — great work!' : 'No upcoming tasks in the next 7 days.'}
        </div>
      ) : (
        <>
          <table style={{width:'100%',borderCollapse:'collapse',tableLayout:'fixed'}}>
            <colgroup><col style={{width:'26%'}}/><col style={{width:'15%'}}/><col style={{width:'27%'}}/><col style={{width:'22%'}}/><col style={{width:'10%'}}/></colgroup>
            <thead><tr>
              <th style={thStyle}>Client</th><th style={thStyle}>Task ID</th>
              <th style={thStyle}>Description</th><th style={thStyle}>Due Date</th><th style={thStyle}>Status</th>
            </tr></thead>
          </table>

          <div style={{height:viewH,overflow:'hidden',position:'relative'}}
            onMouseEnter={()=>{pausedRef.current=true;}} onMouseLeave={()=>{pausedRef.current=false;}}>
            <div ref={scrollRef} style={{willChange:'transform'}}>
              <table style={{width:'100%',borderCollapse:'collapse',tableLayout:'fixed'}}>
                <colgroup><col style={{width:'26%'}}/><col style={{width:'15%'}}/><col style={{width:'27%'}}/><col style={{width:'22%'}}/><col style={{width:'10%'}}/></colgroup>
                <tbody>
                  {looped.map((t, i) => {
                    const due = dayjs(t.due_date);
                    const dueLabelColor = isOverdue ? '#e57373' : (due.diff(now,'day')===0?'#e57373':C.amber);
                    const taskPk = t.task_pk ?? t.pk ?? t.id ?? t.task_id_num ?? null;
                    return (
                      <tr key={`${activeTab}-${i}`}
                        onClick={()=>{
                          if (taskPk && typeof taskPk==='number') onOpenTask(taskPk);
                          else if (taskPk && !isNaN(Number(taskPk))) onOpenTask(Number(taskPk));
                          else onNavigate('/stt-records');
                        }}
                        style={{background:'#fff',cursor:'pointer',borderLeft:`2px solid ${accentBorder}`,height:ROW_H,transition:'background .15s'}}
                        onMouseEnter={e=>e.currentTarget.style.background='#f9fafb'}
                        onMouseLeave={e=>e.currentTarget.style.background='#fff'}
                      >
                        <td style={{padding:'0 10px',fontSize:12,fontWeight:500,color:'#374151',height:ROW_H,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{t.client_name||'—'}</td>
                        <td style={{padding:'0 10px',fontSize:11,color:'#9ca3af',fontFamily:"'Sora',sans-serif",fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{t.task_id||`#${t.id}`}</td>
                        <td style={{padding:'0 10px',fontSize:12,color:'#6b7280',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{t.sub_service_name||'—'}</td>
                        <td style={{padding:'0 10px',fontSize:11,fontWeight:500,color:'#374151',fontFamily:"'Sora',sans-serif",whiteSpace:'nowrap'}}>
                          {due.format('DD MMM YYYY')}
                          <span style={{marginLeft:5,fontSize:10,fontWeight:600,color:dueLabelColor,background:isOverdue?'#fef2f2':'#fffbeb',border:`1px solid ${isOverdue?'#fecaca':'#fde68a'}`,borderRadius:20,padding:'0 6px',lineHeight:'16px',verticalAlign:'middle',display:'inline-block'}}>
                            {getDueDateLabel(due,isOverdue)}
                          </span>
                        </td>
                        <td style={{padding:'0 10px'}}>
                          <span style={{fontSize:10,fontWeight:600,borderRadius:20,padding:'2px 8px',whiteSpace:'nowrap',background:isOverdue?'#fef2f2':'#fffbeb',color:isOverdue?'#e57373':'#d97706',border:`1px solid ${isOverdue?'#fecaca':'#fde68a'}`}}>
                            {isOverdue?'Over Due':(t.status==='To Do'?'Soon':t.status)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {needsScroll && (
            <div style={{marginTop:6,display:'flex',alignItems:'center',gap:8}}>
              <div style={{flex:1,height:2,background:'#f1f5f9',borderRadius:2,overflow:'hidden'}}>
                <div style={{height:'100%',borderRadius:2,background:accentColor,width:`${progressPct}%`,transition:'width 0.1s linear'}}/>
              </div>
              <span style={{fontSize:10,color:'#d1d5db',fontFamily:"'DM Sans',sans-serif",flexShrink:0}}>{activeTasks.length} tasks</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function CheckOutModal({ visible, onConfirm, onCancel, checkInStr, elapsed }) {
  useEffect(() => {
    if (!visible) return;
    const handleKey = (e) => { if (e.key==='Escape') onCancel(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [visible, onCancel]);
  if (!visible) return null;

  return (
    <div className="co-overlay" onClick={onCancel}>
      <div className="co-card" onClick={e=>e.stopPropagation()}>
        <div style={{background:'linear-gradient(135deg,#0f172a 0%,#1e3a5f 60%,#023C6C 100%)',padding:'32px 28px 26px',textAlign:'center',position:'relative',overflow:'hidden'}}>
          <div style={{position:'absolute',top:-40,right:-40,width:140,height:140,borderRadius:'50%',background:'rgba(255,255,255,.04)',pointerEvents:'none'}}/>
          <div style={{position:'absolute',bottom:-30,left:-30,width:100,height:100,borderRadius:'50%',background:'rgba(255,255,255,.05)',pointerEvents:'none'}}/>
          <div style={{width:64,height:64,borderRadius:18,background:'rgba(220,38,38,.18)',border:'1.5px solid rgba(220,38,38,.35)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px',fontSize:26,boxShadow:'0 0 0 8px rgba(220,38,38,.08)'}}>🚪</div>
          <div style={{fontFamily:"'Sora',sans-serif",fontSize:20,fontWeight:800,color:'#fff',marginBottom:6}}>Confirm Check-Out</div>
          <div style={{fontSize:12.5,color:'rgba(255,255,255,.5)'}}>
            You checked in at <strong style={{color:'rgba(255,255,255,.85)',fontFamily:"'Sora',sans-serif"}}>{checkInStr}</strong>
          </div>
        </div>
        <div style={{padding:'22px 26px 8px'}}>
          <div style={{background:'#f0fdf4',border:'1px solid #bbf7d0',borderRadius:12,padding:'12px 18px',display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
            <div style={{display:'flex',alignItems:'center',gap:8}}>
              <span style={{width:8,height:8,borderRadius:'50%',background:'#22c55e',display:'inline-block'}}/>
              <span style={{fontSize:12.5,color:'#166534',fontWeight:500,fontFamily:"'DM Sans',sans-serif"}}>Time on clock today</span>
            </div>
            <span style={{fontFamily:"'Sora',sans-serif",fontSize:16,fontWeight:800,color:'#15803d'}}>{elapsed}</span>
          </div>
          <div style={{background:'#fffbeb',border:'1px solid #fde68a',borderRadius:11,padding:'13px 16px',display:'flex',gap:10,alignItems:'flex-start',marginBottom:22}}>
            <span style={{fontSize:16,flexShrink:0,marginTop:1}}>⚠️</span>
            <p style={{margin:0,fontSize:12.5,color:'#92400e',lineHeight:1.65,fontFamily:"'DM Sans',sans-serif"}}>
              Once you check out, you <strong>won't be able to check in again</strong> for today.
            </p>
          </div>
        </div>
        <div style={{display:'flex',gap:10,padding:'0 26px 26px'}}>
          <button className="co-btn co-btn-cancel" onClick={onCancel} style={{flex:1,border:'1.5px solid #e2e8f0'}}>Stay In</button>
          <button className="co-btn co-btn-confirm" onClick={onConfirm} style={{flex:1}}>Yes, Check Out</button>
        </div>
      </div>
    </div>
  );
}

function LazyFeed() {
  // Disabled - compliance_tracker app not available locally
  return null;
}

/* ══════════════ MAIN ══════════════ */
export default function DashboardPage() {
  const { user }  = useAuth();
  const navigate  = useNavigate();

  const role      = user?.role?.toLowerCase() || '';
  const isManager = ['admin','founder','manager','hr'].includes(role);
  const isAdmin   = ['admin','founder'].includes(role);
  const isFounder = role === 'founder';

  const [tasksLoading,   setTasksLoading]   = useState(!isFresh(CACHE.tasks));
  const [attLoading,     setAttLoading]     = useState(true);
  const [actionsLoading, setActionsLoading] = useState(true);

  const [taskCounts,              setTaskCounts]              = useState(CACHE.tasks.data?.counts || {todo:0,inProgress:0,done:0,overdue:0,total:0});
  const [upcomingTasks,           setUpcomingTasks]           = useState(CACHE.tasks.data?.tasks  || []);
  const [todayRecord,             setTodayRecord]             = useState(null);
  const [monthSummary,            setMonthSummary]            = useState({present:0,absent:0,late:0,total:0});
  const [leaveData,               setLeaveData]               = useState({pending:0,approved:0,rejected:0});
  const [teamPending,             setTeamPending]             = useState(0);
  const [invoiceDraft,            setInvoiceDraft]            = useState(0);
  const [udinPending,             setUdinPending]             = useState(0);
  const [clientRequestsPending,   setClientRequestsPending]   = useState(0);
  const [groupRequestsPending,    setGroupRequestsPending]    = useState(0);
  const [serviceRequestsPending,  setServiceRequestsPending]  = useState(0);
  const [wfhRequestsPending,      setWfhRequestsPending]      = useState(0);
  const [checkingIO,              setCheckingIO]              = useState(false);
  const [checkOutVisible,         setCheckOutVisible]         = useState(false);
  const [taskModalId,             setTaskModalId]             = useState(null);

  // ── AI Motivations (Ollama via Django) ──────────────────────────────────
  const [aiMotivations, setAiMotivations] = useState([]);

  const today       = getShiftDate();
  const checkInISO  = todayRecord?.check_in_time  || null;
  const checkOutISO = todayRecord?.check_out_time || null;

  const elapsed          = useLiveTime(checkInISO && !checkOutISO ? checkInISO : null);
  const secsSinceCheckIn = useSecondsSince(checkInISO && !checkOutISO ? checkInISO : null);
  const LOCKOUT_SECS     = 15 * 60;
  const isLocked         = checkInISO && !checkOutISO && secsSinceCheckIn < LOCKOUT_SECS;
  const lockMinsLeft     = isLocked ? Math.ceil((LOCKOUT_SECS - secsSinceCheckIn) / 60) : 0;
  const checkInStr       = checkInISO ? dayjs.utc(checkInISO).tz('Asia/Kolkata').format('hh:mm A') : null;

  const hIn        = new Date().getHours();
  const greeting   = hIn<12 ? 'Good morning' : hIn<17 ? 'Good afternoon' : 'Good evening';
  const firstName  = user?.first_name || user?.email?.split('@')[0] || 'there';
  const todayLabel = new Date().toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
  const caDay      = isCADay();
  
  const tickerPool = buildTickerPool({
    name: firstName, hIn, isManager, isAdmin,
    taskCounts, leaveData, teamPending, invoiceDraft,
    udinPending, clientRequestsPending,
    groupRequestsPending, serviceRequestsPending,
    upcomingTasks, monthSummary, checkInISO, checkOutISO,
    aiMotivations,   // ← pass Ollama lines
  });

  const tickerLoading = tasksLoading || actionsLoading || attLoading;

  /* ── FETCH 1: Tasks ── */
  useEffect(() => {
    let cancelled = false;
    if (isFresh(CACHE.tasks)) {
      setTaskCounts(CACHE.tasks.data.counts);
      setUpcomingTasks(CACHE.tasks.data.tasks);
      setTasksLoading(false);
      return;
    }
    setTasksLoading(true);
    (async () => {
      try {
        const taskRes = await api.get('/clients/tasks/dashboard_summary/');
        if (cancelled) return;
        const sc = taskRes.data?.status_counts || {};
        const counts = {
          todo:       sc['To Do']       || 0,
          inProgress: sc['In Progress'] || 0,
          done:       sc['Done']        || 0,
          overdue:    sc['Over Due']    || 0,
          total:      sc['total']       || 0,
        };
        setTaskCounts(counts);
        let filtered = [];
        if (taskRes.data?.tasks) {
          const now = dayjs();
          filtered = taskRes.data.tasks
            .filter(t => t.due_date)
            .sort((a, b) => {
              const aOd = dayjs(a.due_date).isBefore(now,'day');
              const bOd = dayjs(b.due_date).isBefore(now,'day');
              if (aOd && !bOd) return -1;
              if (!aOd && bOd) return 1;
              return dayjs(a.due_date).diff(dayjs(b.due_date));
            });
          setUpcomingTasks(filtered);
        }
        CACHE.tasks = { data: { counts, tasks: filtered }, ts: Date.now() };
      } catch (err) { console.error('dashboard_summary error:', err); }
      finally { if (!cancelled) setTasksLoading(false); }
    })();
    return () => { cancelled = true; };
  }, []);

  /* ── FETCH 2: Attendance ── */
  useEffect(() => {
    if (!user?.employee_id) { setAttLoading(false); return; }
    let cancelled = false;
    const cacheKey = `${user.employee_id}-${today}`;
    if (isFresh(CACHE.att) && CACHE.att.key === cacheKey) {
      const d = CACHE.att.data;
      setTodayRecord(d.todayRecord);
      setMonthSummary(d.monthSummary);
      setAttLoading(false);
      return;
    }
    const month = dayjs().month() + 1;
    const year  = dayjs().year();
    (async () => {
      try {
        // Attendance endpoint may not be available
        const attRes = await api.get(`/employee/attendances/?month=${month}&year=${year}&employee=${user.employee_id}`).catch(() => null);
        if (!attRes) { if (!cancelled) setAttLoading(false); return; }
        if (cancelled) return;
        const raw  = Array.isArray(attRes.data) ? attRes.data : (attRes.data.results||[]);
        const list = raw.filter(a => a.employee===user.employee_id);
        const rec  = list.find(a => a.date===today) || null;
        setTodayRecord(rec);
        let present=0, absent=0, late=0;
        list.forEach(a => {
          const st = (typeof a.status==='object' ? a.status?.name||a.status?.status||'' : a.status||'').toLowerCase();
          if (['sunday','saturday','holiday','on leave','leave'].includes(st)) return;
          if (st==='absent') { absent++; return; }
          if (!a.check_in_time) return;
          present++;
          const ci = dayjs(a.check_in_time);
          const [sh,sm] = (a.fixed_start_time||'10:00:00').split(':').map(Number);
          const shiftStart = ci.hour(sh).minute(sm).second(0);
          if (ci.isAfter(shiftStart.add(25,'minute'))) late++;
        });
        const summary = { present, absent, late, total:present+absent };
        setMonthSummary(summary);
        CACHE.att = { data: { todayRecord: rec, monthSummary: summary }, ts: Date.now(), key: cacheKey };
      } catch { /* silently ignore */ }
      finally { if (!cancelled) setAttLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [user?.employee_id, today]);

  /* ── FETCH 3: Action Items ── */
  useEffect(() => {
    if (!user?.employee_id && !isManager && !isAdmin && !isFounder) { setActionsLoading(false); return; }
    let cancelled = false;
    const cacheKey = `${user?.employee_id||'admin'}-${isManager}-${isAdmin}`;

    if (isFresh(CACHE.actions) && CACHE.actions.key === cacheKey) {
      const d = CACHE.actions.data;
      setLeaveData(d.leaveData);
      setTeamPending(d.teamPending);
      setInvoiceDraft(d.invoiceDraft);
      setUdinPending(d.udinPending);
      setClientRequestsPending(d.clientRequestsPending);
      setGroupRequestsPending(d.groupRequestsPending     || 0);
      setServiceRequestsPending(d.serviceRequestsPending || 0);
      setWfhRequestsPending(d.wfhRequestsPending         || 0);
      setActionsLoading(false);
      return;
    }

    (async () => {
      if (user?.employee_id) {
        try {
          const leaveRes = await api.get('/employee/leave-requests/my-requests').catch(()=>null);
          if (cancelled) return;
          if (leaveRes?.data) {
            const raw  = Array.isArray(leaveRes.data) ? leaveRes.data : (leaveRes.data.results||[]);
            const list = raw.filter(l => l.employee===user.employee_id);
            setLeaveData({
              pending:  list.filter(l=>(l.status||'').toLowerCase()==='pending').length,
              approved: list.filter(l=>(l.status||'').toLowerCase()==='approved').length,
              rejected: list.filter(l=>(l.status||'').toLowerCase()==='rejected').length,
            });
          }
        } catch { /* ignore */ }
      }
      if (!cancelled) setActionsLoading(false);

      if (!isManager && !isAdmin && !isFounder) return;
      try {
        const [teamLeaveRes, invoiceRes, udinRes, clientReqRes, groupReqRes, serviceReqRes, wfhReqRes] = await Promise.all([
        //   isManager ? api.get('/employee/leave-requests/pending_count/').catch(()=>null) : Promise.resolve(null),
        //   isManager ? api.get('/clients/invoices/draft_count/').catch(()=>null)           : Promise.resolve(null),
        //   api.get('/clients/udin-records/pending_count/').catch(()=>
        //     api.get('/clients/udin-records/?is_done=false&page_size=500').catch(()=>null)
        //   ),
        //   isManager
        //     ? api.get('/clients/client-requests/pending_count/').catch(()=>
        //         api.get('/clients/client-requests/?status=pending&page_size=500').catch(()=>null)
        //       )
        //     : Promise.resolve(null),
        //   isManager
        //     ? api.get('/clients/group-requests/pending_count/').catch(()=>
        //         api.get('/clients/group-requests/?status=pending&page_size=500').catch(()=>null)
        //       )
        //     : Promise.resolve(null),
        //   isManager
        //     ? api.get('/clients/service-requests/pending_count/').catch(()=>
        //         api.get('/clients/service-requests/?status=pending&page_size=500').catch(()=>null)
        //       )
        //     : Promise.resolve(null),
        //   (isManager || isFounder)
        //     ? api.get('/employee/wfh-requests/pending_count/').catch(()=>null)
        //     : Promise.resolve(null),
        Promise.resolve(null),  // leave-requests - removed
        Promise.resolve(null),  // invoices - removed
        Promise.resolve(null),  // udin-records - removed
        Promise.resolve(null),  // client-requests - removed
        Promise.resolve(null),  // group-requests - removed
        Promise.resolve(null),  // service-requests - removed
        Promise.resolve(null),  // wfh-requests - removed
        ]);
        if (cancelled) return;

        let tp=0, id=0, up=0, cr=0, gr=0, sr=0;

        if (teamLeaveRes?.data) tp = teamLeaveRes.data.pending_count ?? 0;
        if (invoiceRes?.data)   id = invoiceRes.data.draft_count ?? 0;

        if (udinRes?.data) {
          if (typeof udinRes.data.pending_count === 'number') {
            up = udinRes.data.pending_count;
          } else {
            const raw = Array.isArray(udinRes.data) ? udinRes.data : (udinRes.data.results||[]);
            const normalize = name => (name||'').toString().toLowerCase().replace(/\./g,'').replace(/\s+/g,' ').trim();
            const userFullName     = normalize(`${user?.first_name||''} ${user?.last_name||''}`);
            const isAdminOrFounder = user?.role==='Admin'||user?.role==='Founder';
            up = raw.filter(record => {
              if (record.is_done) return false;
              const requestBy = normalize(record.request_by);
              const spocName  = normalize(record.spoc_name);
              if (isAdminOrFounder) {
                const allFieldsFilled = record.internal_ref_no && record.date_of_udin && record.udin_no && record.client_name && record.attestation_type && record.request_by && record.spoc_name && record.fee && record.invoice_no && record.invoice_date;
                return (record.proposed_fee!==null && record.proposed_fee!==undefined && record.proposed_fee!=='') || Boolean(allFieldsFilled);
              }
              if (!record.udin_no || record.udin_no.trim()==='') {
                return (userFullName && requestBy && userFullName===requestBy) || (userFullName && spocName && userFullName===spocName);
              }
              if (userFullName && spocName && userFullName===spocName) {
                const needsFee     = record.fee_status==='pending'||record.fee_status==='rejected'||(!record.fee && !record.proposed_fee);
                const needsInvoice = record.fee_status==='accepted' && (!record.invoice_no||!record.invoice_date);
                return needsFee || needsInvoice;
              }
              return false;
            }).length;
          }
        }

        const resolveReqCount = (res) => {
          if (!res?.data) return 0;
          if (typeof res.data.pending_count === 'number') return res.data.pending_count;
          const raw = Array.isArray(res.data) ? res.data : (res.data.results||[]);
          return raw.filter(r=>r.status==='pending').length;
        };

        cr = resolveReqCount(clientReqRes);
        gr = resolveReqCount(groupReqRes);
        sr = resolveReqCount(serviceReqRes);
        const wr = wfhReqRes?.data?.pending_count ?? 0;

        if (!cancelled) {
          setTeamPending(tp);
          setInvoiceDraft(id);
          setUdinPending(up);
          setClientRequestsPending(cr);
          setGroupRequestsPending(gr);
          setServiceRequestsPending(sr);
          setWfhRequestsPending(wr);
          CACHE.actions = {
            data: {
              leaveData: { pending:0, approved:0, rejected:0 },
              teamPending:tp, invoiceDraft:id, udinPending:up,
              clientRequestsPending:cr, groupRequestsPending:gr, serviceRequestsPending:sr,
              wfhRequestsPending:wr,
            },
            ts: Date.now(), key: cacheKey,
          };
        }
      } catch { /* silently ignore */ }
    })();
    return () => { cancelled = true; };
  }, [user?.employee_id, isManager, isAdmin]);

    /* ── FETCH 4: Ollama Motivations - Disabled locally ── */
    useEffect(() => {
    // compliance_tracker not available in this environment
    // aiMotivations will use defaults from buildTickerPool
    }, []);

  /* ── check-in / check-out ── */
  const handleCheckInOut = useCallback(() => {
    if (checkingIO || attLoading) return;
    if (checkInISO && checkOutISO) return;
    if (checkInISO && isLocked) return;
    if (checkInISO && !checkOutISO) { setCheckOutVisible(true); return; }
    doCheckInOut();
  }, [checkingIO, attLoading, checkInISO, checkOutISO, isLocked]);

  const doCheckInOut = useCallback(async () => {
    setCheckingIO(true);
    setCheckOutVisible(false);
    CACHE.att = { data: null, ts: 0, key: '' };
    try {
      if (!checkInISO) {
        if (!user?.employee_id) return;
        const res = await api.post('employee/attendances/', {
          employee:user.employee_id, date:today,
          check_in_time:dayjs().toISOString(), status:'present',
        });
        setTodayRecord(res.data);
        setMonthSummary(prev=>({...prev,present:prev.present+1}));
      } else {
        const res = await api.patch(`employee/attendances/${todayRecord.id}/`, {
          employee:user.employee_id, check_out_time:dayjs().toISOString(),
        });
        setTodayRecord(prev=>({...prev,check_out_time:res.data.check_out_time}));
      }
    } catch (err) { console.error('Check-in/out error:', err); }
    finally { setCheckingIO(false); }
  }, [checkInISO, todayRecord, user?.employee_id, today]);

  const isFullyDone   = Boolean(checkInISO && checkOutISO);
  const chipClickable = !isFullyDone && !attLoading && user?.employee_id;
  const chipCursor    = checkingIO?'wait':isFullyDone?'default':isLocked?'not-allowed':chipClickable?'pointer':'default';
  const chipTitle     = isFullyDone
    ? 'Attendance complete for today'
    : isLocked ? `Check-out available in ${lockMinsLeft} min${lockMinsLeft!==1?'s':''}`
    : checkInISO ? 'Click to check out' : 'Click to check in';

  const REQUESTS_ROUTE = '/raise-request';

  const actionItems = [
    {
      key:'overdue-tasks',
      icon:<ExclamationCircleOutlined/>, label:'Overdue Tasks',
      sublabel:'Tasks past their due date',
      count:taskCounts.overdue, accent:'#e57373',
      onClick:()=>navigate('/stt-records?status=Over Due'), show:true,
    },
    {
      key:'leave-pending-mine',
      icon:<CalendarOutlined/>, label:'My Pending Leave',
      sublabel:'Your leave requests awaiting approval',
      count:leaveData.pending, accent:C.navy,
      onClick:()=>navigate('/leave-tracker'), show:true,
    },
    {
      key:'leave-approvals',
      icon:<TeamOutlined/>, label:'Team Leave Approvals',
      sublabel:'Requests from your team awaiting your decision',
      count:teamPending, accent:C.amber,
      onClick:()=>navigate('/leave-management'), show:isManager,
    },
    {
      key:'udin-pending',
      icon:<FileProtectOutlined/>, label:'UDIN Records Pending',
      sublabel:'UDIN filings that require action',
      count:udinPending, accent:C.purple,
      onClick:()=>navigate('/udin-records'), show:isManager||isAdmin||isFounder,
    },
    {
      key:'draft-invoices',
      icon:<FileTextOutlined/>, label:'Draft Invoices',
      sublabel:'Invoices not yet finalised or sent to clients',
      count:invoiceDraft, accent:C.teal,
      onClick:()=>navigate('/invoice'), show:isManager,
    },
    {
        key:'client-requests',
        icon:<TeamOutlined/>, label:'Client Add Requests',
        sublabel:'New client requests awaiting your review',
        count:clientRequestsPending, accent:C.navy,
        onClick:()=>navigate(`${REQUESTS_ROUTE}?tab=review`, { replace: true }), show:isManager||isFounder,
    },
    {
        key:'group-requests',
        icon:<TeamOutlined/>, label:'Group Add Requests',
        sublabel:'New group creation requests awaiting your review',
        count:groupRequestsPending, accent:C.teal,
        onClick:()=>navigate(`${REQUESTS_ROUTE}?tab=review`, { replace: true }), show:isManager||isFounder,
    },
    {
        key:'service-requests',
        icon:<FileTextOutlined/>, label:'Service Add Requests',
        sublabel:'New service/sub-service requests awaiting your review',
        count:serviceRequestsPending, accent:C.purple,
        onClick:()=>navigate(`${REQUESTS_ROUTE}?tab=review`, { replace: true }), show:isManager||isFounder,
    },
    {
        key:'wfh-requests',
        icon:<HomeOutlined/>, label:'WFH Requests',
        sublabel:'Work from home requests awaiting your approval',
        count:wfhRequestsPending, accent:C.green,
        onClick:()=>navigate(`${REQUESTS_ROUTE}?tab=review`, { replace: true }), show:isManager||isFounder,
    },
  ].filter(i=>i.show);

  /* ══════════════ JSX ══════════════ */
  return (
    <div style={{fontFamily:"'DM Sans',sans-serif",maxWidth:1200,margin:'0 auto'}}>

      {/* ══ BANNER ══ */}
      <div className="db-fade" style={{
        background:`linear-gradient(118deg,${C.navyDk} 0%,${C.navy} 55%,${C.teal} 100%)`,
        borderRadius:18, padding:'20px 22px', marginBottom:18,
        boxShadow:'0 8px 32px rgba(2,60,108,.2)',
        position:'relative', overflow:'hidden',
      }}>
        <div style={{position:'absolute',right:-50,top:-50,width:210,height:210,borderRadius:'50%',background:'rgba(255,255,255,.05)',pointerEvents:'none'}}/>
        <div style={{position:'absolute',right:80,bottom:-70,width:170,height:170,borderRadius:'50%',background:'rgba(255,255,255,.04)',pointerEvents:'none'}}/>

        <div style={{fontSize:11,fontWeight:600,color:'rgba(255,255,255,.55)',letterSpacing:'.1em',textTransform:'uppercase',marginBottom:10,position:'relative'}}>
          {todayLabel}
        </div>

        <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:14,flexWrap:'wrap',position:'relative'}}>
          <div style={{flex:'1 1 180px',minWidth:0,maxWidth:'100%',overflow:'visible'}}>
            {/* <h1 style={{fontFamily:"'Sora',sans-serif",fontSize:'clamp(18px,4vw,24px)',fontWeight:800,color:'#fff',margin:0,lineHeight:1.25}}>
              {greeting}, {firstName} 👋
            </h1>
            <SmartTicker pool={tickerPool} loading={tickerLoading}/> */}
            <h1 style={{fontFamily:"'Sora',sans-serif",fontSize:'clamp(18px,4vw,24px)',fontWeight:800,color:'#fff',margin:0,lineHeight:1.25}}>
                {greeting}, {firstName} 👋
                </h1>
                {caDay && (
                    <div className="ca-day-badge" style={{
                        marginTop:4, fontSize:12.5, fontWeight:700, color:'#fde68a',
                        fontFamily:"'DM Sans',sans-serif", display:'flex', alignItems:'center', gap:6,
                    }}>
                    <span className="ca-day-emoji">🎉</span>
                    Happy CA Day! Here's to the late nights, tight deadlines, and the trust clients place in you every single day.
                </div>
                )}
            <SmartTicker pool={tickerPool} loading={tickerLoading}/>
          </div>

          <div style={{display:'flex',gap:8,flexShrink:0,flexWrap:'wrap'}}>
            <div className="ci-chip" onClick={handleCheckInOut} title={chipTitle} style={{
              background:checkInISO?'rgba(34,197,94,.2)':'rgba(255,255,255,.1)',
              borderRadius:12, padding:'10px 16px', textAlign:'center',
              backdropFilter:'blur(4px)',
              border:`1px solid ${checkInISO?'rgba(34,197,94,.4)':'rgba(255,255,255,.15)'}`,
              display:'flex', flexDirection:'column', alignItems:'center', gap:2,
              minWidth:90, cursor:chipCursor, userSelect:'none',
            }}>
              <LoginOutlined style={{color:'rgba(255,255,255,.6)',fontSize:12}}/>
              <div style={{fontFamily:"'Sora',sans-serif",fontSize:16,fontWeight:800,color:'#fff',lineHeight:1.1}}>
                {attLoading
                    ? '–'
                    : isFullyDone
                        ? dayjs.utc(checkOutISO).tz('Asia/Kolkata').format('hh:mm A')
                        : checkInStr || '–'}
              </div>
              <div style={{fontSize:10,color:'rgba(255,255,255,.55)',whiteSpace:'nowrap'}}>
                {checkingIO ? '…'
                    : isFullyDone ? 'Checked Out'
                    : checkInISO
                        ? isLocked ? `🔒 ${lockMinsLeft}m` : 'Checked In'
                        : 'Check In'}
              </div>
              {checkInISO && !checkOutISO && (
                <div style={{fontSize:9,color:'rgba(255,255,255,.4)',display:'flex',alignItems:'center',gap:3}}>
                  <span className="live-dot"/>{elapsed}
                </div>
              )}
            </div>

            <div style={{background:'rgba(255,255,255,.12)',borderRadius:12,padding:'10px 16px',textAlign:'center',backdropFilter:'blur(4px)',border:'1px solid rgba(255,255,255,.15)',minWidth:72}}>
              <div style={{fontFamily:"'Sora',sans-serif",fontSize:20,fontWeight:800,color:'#fff',lineHeight:1}}>
                {tasksLoading?'–':taskCounts.total}
              </div>
              <div style={{fontSize:10,color:'rgba(255,255,255,.55)',marginTop:3,whiteSpace:'nowrap'}}>Total Tasks</div>
            </div>
          </div>
        </div>
      </div>

      {/* ══ ACTIONS REQUIRED ══ */}
      <div style={{fontSize:11,fontWeight:700,color:C.slate,textTransform:'uppercase',letterSpacing:'.09em',marginBottom:8,fontFamily:"'Sora',sans-serif"}}>Actions Required</div>
      <ActionsRequired items={actionItems} loading={actionsLoading||tasksLoading}/>

      {/* ══ ALL TASKS ══ */}
      <div style={{fontSize:11,fontWeight:700,color:C.slate,textTransform:'uppercase',letterSpacing:'.09em',marginBottom:8,fontFamily:"'Sora',sans-serif"}}>All Tasks</div>
      <div style={{display:'flex',gap:14,flexWrap:'wrap',marginBottom:20}}>
        <StatCard label="To Do"       value={taskCounts.todo}       accent={C.purple} icon={<ClockCircleOutlined/>}       delay={0}   loading={tasksLoading} onClick={()=>navigate('/stt-records?status=To Do')}/>
        <StatCard label="In Progress" value={taskCounts.inProgress} accent={C.amber}  icon={<CheckSquareOutlined/>}       delay={60}  loading={tasksLoading} onClick={()=>navigate('/stt-records?status=In Progress')}/>
        <StatCard label="Done"        value={taskCounts.done}       accent={C.green}  icon={<CheckCircleOutlined/>}       delay={120} loading={tasksLoading} onClick={()=>navigate('/stt-records?status=Done')}/>
        <StatCard label="Overdue"     value={taskCounts.overdue}    accent='#e57373'  icon={<ExclamationCircleOutlined/>} delay={180} loading={tasksLoading} onClick={()=>navigate('/stt-records?status=Over Due')}/>
      </div>

      {/* ══ UPCOMING & OVERDUE ══ */}
      <div style={{fontSize:11,fontWeight:700,color:C.slate,textTransform:'uppercase',letterSpacing:'.09em',marginBottom:12,fontFamily:"'Sora',sans-serif"}}>Upcoming &amp; Overdue</div>
      <UpcomingTasksTable tasks={upcomingTasks} loading={tasksLoading} onNavigate={navigate} onOpenTask={(taskPk)=>setTaskModalId(taskPk)}/>

      {/* ══ CKPSCA FEED ══ */}
      <LazyFeed />

      {/* ══ QUICK NAV ══ */}
      <div className="db-box db-fade" style={{animationDelay:'460ms'}}>
        <SectionHeader title="Quick Navigate" icon={<RiseOutlined/>} accent={C.teal}/>
        <div style={{display:'flex',flexWrap:'wrap',gap:10}}>
          {[
            {label:'STT Records',       path:'/stt-records',       color:C.purple, show:true},
            {label:'Client Management', path:'/client-management', color:C.navy,   show:isManager},
            {label:'UDIN Records',      path:'/udin-records',      color:C.slate,  show:isManager},
            {label:'Leave Tracker',     path:'/leave-tracker',     color:C.teal,   show:true},
            {label:'Attendance Logs',   path:'/attendance-logs',   color:C.green,  show:true},
            {label:'Process Docs',      path:'/sop',               color:C.amber,  show:true},
            {label:'Time Tracker',      path:'/time-tracker',      color:C.teal,   show:isManager},
            {label:'Leave Management',  path:'/leave-management',  color:C.navy,   show:isManager},
            {label:'Invoice',           path:'/invoice',           color:C.amber,  show:isManager},
            {label:'Requests',          path:REQUESTS_ROUTE,       color:C.teal,   show:isManager||isFounder},
            {label:'Compliance Tracker',path:'/compliance-tracker',color:C.red,    show:isAdmin},
          ].filter(n=>n.show).map(({label,path,color})=>(
            <button key={path} className="qbtn"
              style={{borderColor:color+'33',background:color+'10',color}}
              onClick={()=>navigate(path)}
              onMouseEnter={e=>e.currentTarget.style.background=color+'22'}
              onMouseLeave={e=>e.currentTarget.style.background=color+'10'}>
              <ArrowRightOutlined style={{fontSize:11}}/> {label}
            </button>
          ))}
        </div>
      </div>

      <CheckOutModal visible={checkOutVisible} onConfirm={doCheckInOut} onCancel={()=>setCheckOutVisible(false)} checkInStr={checkInStr} elapsed={elapsed}/>
      <TaskDetailView visible={!!taskModalId} taskId={taskModalId} onClose={()=>setTaskModalId(null)} onTaskUpdated={()=>{}} allEmployees={[]}/>
    </div>
  );
}