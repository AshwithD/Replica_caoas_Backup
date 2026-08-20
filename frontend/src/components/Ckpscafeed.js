// // // import { useState, useEffect, useCallback } from 'react';
// // // import {
// // //   CalendarOutlined, ArrowRightOutlined, ReloadOutlined,
// // //   CheckCircleOutlined, ExclamationCircleOutlined,
// // //   BellOutlined, LinkOutlined, FilterOutlined,
// // // } from '@ant-design/icons';
// // // import { api } from '../services/api';

// // // const C = {
// // //   navy:'#023C6C', navyDk:'#011f3a', teal:'#0891b2', tealLt:'#e0f2f9',
// // //   amber:'#d97706', amberLt:'#fef3c7', green:'#059669', greenLt:'#d1fae5',
// // //   red:'#dc2626', redLt:'#fee2e2', purple:'#7c3aed', purpleLt:'#ede9fe',
// // //   slate:'#64748b', border:'#e2e8f0', pink:'#db2777', pinkLt:'#fce7f3',
// // //   indigo:'#4f46e5', indigoLt:'#eef2ff', cyan:'#0e7490', cyanLt:'#cffafe',
// // // };

// // // const CATEGORIES = {
// // //   'All':              { color: C.navy,   bg: '#e0eaf4' },
// // //   'GST':              { color: C.green,  bg: C.greenLt  },
// // //   'Income Tax':       { color: C.teal,   bg: C.tealLt   },
// // //   'Corporate':        { color: C.amber,  bg: C.amberLt  },
// // //   'Audit & Accounts': { color: C.purple, bg: C.purpleLt },
// // //   'Finance & FEMA':   { color: C.indigo, bg: C.indigoLt },
// // //   'SEBI':             { color: C.pink,   bg: C.pinkLt   },
// // //   'Customs':          { color: C.cyan,   bg: C.cyanLt   },
// // //   'Labour & PF':      { color: C.slate,  bg: '#f1f5f9'  },
// // //   'General':          { color: C.slate,  bg: '#f1f5f9'  },
// // // };

// // // const DUE_CATEGORIES = ['All', 'GST', 'Income Tax', 'Corporate', 'Audit & Accounts', 'Labour & PF'];
// // // const getTagStyle = (category = '') => CATEGORIES[category] || CATEGORIES['General'];

// // // const daysUntil = (dateStr) => {
// // //   try {
// // //     const [day, mon, yr] = dateStr.split(' ');
// // //     return Math.ceil((new Date(`${mon} ${day} 20${yr}`) - new Date()) / 86400000);
// // //   } catch { return 999; }
// // // };

// // // // ─── Summary Modal — uses Anthropic API directly ──────────────────────────
// // // function SummaryModal({ item, onClose }) {
// // //   const [loading, setLoading] = useState(true);
// // //   const [keyPoints, setKeyPoints] = useState([]);
// // //   const [summary, setSummary] = useState('');
// // //   const [error, setError] = useState(null);
// // //   const tag = getTagStyle(item.category);

// // //   useEffect(() => {
// // //     const load = async () => {
// // //       try {
// // //         const res = await api.post('/compliance_tracker/article-summary/', {
// // //           title:    item.title,
// // //           category: item.category,
// // //           source:   item.source,
// // //           date:     item.date,
// // //           link:     item.link,
// // //         });
// // //         setKeyPoints(res.data.key_points || []);
// // //         setSummary(res.data.summary || '');
// // //       } catch (e) {
// // //         setError('Could not generate summary. Please read the full article.');
// // //       } finally {
// // //         setLoading(false);
// // //       }
// // //     };
// // //     load();
// // //   }, [item.title, item.category, item.source, item.date]);

// // //   useEffect(() => {
// // //     const onKey = (e) => { if (e.key === 'Escape') onClose(); };
// // //     window.addEventListener('keydown', onKey);
// // //     return () => window.removeEventListener('keydown', onKey);
// // //   }, [onClose]);

// // //   return (
// // //     <div
// // //       onClick={onClose}
// // //       style={{
// // //         position: 'fixed', inset: 0, zIndex: 9999,
// // //         background: 'rgba(1,31,58,0.5)',
// // //         display: 'flex', alignItems: 'center', justifyContent: 'center',
// // //         padding: '20px',
// // //       }}
// // //     >
// // //       <div
// // //         onClick={e => e.stopPropagation()}
// // //         style={{
// // //           background: '#fff', borderRadius: 16, width: '100%', maxWidth: 560,
// // //           maxHeight: '82vh', overflowY: 'auto',
// // //           boxShadow: '0 24px 60px rgba(1,31,58,0.2)',
// // //           fontFamily: "'DM Sans',sans-serif",
// // //         }}
// // //       >
// // //         {/* Header */}
// // //         <div style={{
// // //           padding: '18px 20px 14px', borderBottom: `1px solid ${C.border}`,
// // //           position: 'sticky', top: 0, background: '#fff', zIndex: 1,
// // //           borderRadius: '16px 16px 0 0',
// // //         }}>
// // //           <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
// // //             <span style={{ padding: '2px 9px', borderRadius: 20, background: tag.bg, color: tag.color, fontSize: 10, fontWeight: 700 }}>
// // //               {item.category}
// // //             </span>
// // //             <button
// // //               onClick={onClose}
// // //               style={{ background: '#f1f5f9', border: 'none', borderRadius: 8, width: 28, height: 28, cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.slate }}
// // //             >x</button>
// // //           </div>
// // //           <div style={{ fontSize: 14, fontWeight: 600, color: C.navyDk, lineHeight: 1.45 }}>{item.title}</div>
// // //           <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 5 }}>{item.date} &middot; {item.source}</div>
// // //         </div>

// // //         {/* Body */}
// // //         <div style={{ padding: '18px 20px 20px' }}>
// // //           {loading ? (
// // //             <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '30px 0' }}>
// // //               <div style={{ display: 'flex', gap: 6 }}>
// // //                 {[0,1,2].map(i => (
// // //                   <span key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: C.teal, display: 'inline-block', animation: 'tickPulse 1.2s ease-in-out infinite', animationDelay: `${i * 0.2}s` }} />
// // //                 ))}
// // //               </div>
// // //               <div style={{ fontSize: 13, color: C.slate }}>Generating AI summary...</div>
// // //               <div style={{ fontSize: 11, color: '#94a3b8' }}>This takes a few seconds</div>
// // //             </div>
// // //           ) : error ? (
// // //             <div style={{ fontSize: 13, color: C.red, padding: '16px 0', textAlign: 'center' }}>{error}</div>
// // //           ) : (
// // //             <>
// // //               {keyPoints.length > 0 && (
// // //                 <div style={{ marginBottom: 18 }}>
// // //                   <div style={{ fontSize: 11, fontWeight: 700, color: C.slate, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>Key points</div>
// // //                   {keyPoints.map((pt, i) => (
// // //                     <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 9, alignItems: 'flex-start' }}>
// // //                       <span style={{ width: 20, height: 20, borderRadius: '50%', flexShrink: 0, background: C.tealLt, color: C.teal, fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 1 }}>{i + 1}</span>
// // //                       <span style={{ fontSize: 13, lineHeight: 1.55, color: C.navyDk }}>{pt}</span>
// // //                     </div>
// // //                   ))}
// // //                 </div>
// // //               )}
// // //               {summary && (
// // //                 <div style={{ marginBottom: 18 }}>
// // //                   <div style={{ fontSize: 11, fontWeight: 700, color: C.slate, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Summary</div>
// // //                   <div style={{ fontSize: 13, lineHeight: 1.7, color: '#374151', background: '#f8fafc', borderRadius: 10, padding: '12px 14px', borderLeft: `3px solid ${C.teal}` }}>
// // //                     {summary}
// // //                   </div>
// // //                 </div>
// // //               )}
// // //             </>
// // //           )}
// // //           <a
// // //             href={item.link}
// // //             target="_blank"
// // //             rel="noopener noreferrer"
// // //             style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px 16px', borderRadius: 9, marginTop: 8, background: C.navy, color: '#fff', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}
// // //           >
// // //             Read full article <ArrowRightOutlined style={{ fontSize: 11 }} />
// // //           </a>
// // //         </div>
// // //       </div>
// // //     </div>
// // //   );
// // // }

// // // // ─── News Row ─────────────────────────────────────────────────────────────
// // // function NewsRow({ item }) {
// // //   const [hovered, setHovered]         = useState(false);
// // //   const [showSummary, setShowSummary] = useState(false);
// // //   const tag = getTagStyle(item.category);

// // //   return (
// // //     <>
// // //       <div
// // //         onMouseEnter={() => setHovered(true)}
// // //         onMouseLeave={() => setHovered(false)}
// // //         style={{
// // //           display: 'flex', alignItems: 'flex-start', gap: 10,
// // //           padding: '10px 10px', margin: '0 -10px', borderRadius: 9,
// // //           borderBottom: `1px solid ${C.border}`,
// // //           background: hovered ? '#f8fafc' : 'transparent',
// // //           transition: 'background .12s',
// // //         }}
// // //       >
// // //         <span style={{ padding: '2px 9px', borderRadius: 20, flexShrink: 0, marginTop: 2, background: tag.bg, color: tag.color, fontSize: 10, fontWeight: 700, fontFamily: "'DM Sans',sans-serif", whiteSpace: 'nowrap' }}>
// // //           {item.category || 'General'}
// // //         </span>
// // //         <div style={{ flex: 1, minWidth: 0 }}>
// // //           <div style={{ fontSize: 13, lineHeight: 1.5, color: C.navyDk, fontFamily: "'DM Sans',sans-serif" }}>
// // //             {item.title}
// // //           </div>
// // //           <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 6, flexWrap: 'wrap' }}>
// // //             <span style={{ fontSize: 11, color: '#94a3b8', fontFamily: "'DM Sans',sans-serif" }}>{item.date}</span>
// // //             {item.source && (
// // //               <span style={{ fontSize: 10, color: C.slate, background: '#f1f5f9', padding: '1px 6px', borderRadius: 4, fontFamily: "'DM Sans',sans-serif" }}>{item.source}</span>
// // //             )}
// // //             {item.link && (
// // //               <button
// // //                 onClick={(e) => { e.stopPropagation(); setShowSummary(true); }}
// // //                 style={{
// // //                   padding: '2px 10px', borderRadius: 20, fontSize: 10, fontWeight: 600,
// // //                   cursor: 'pointer', fontFamily: "'DM Sans',sans-serif",
// // //                   border: `1px solid ${C.teal}`,
// // //                   background: hovered ? C.tealLt : 'transparent',
// // //                   color: C.teal, transition: 'all .15s',
// // //                   display: 'flex', alignItems: 'center', gap: 4,
// // //                 }}
// // //               >
// // //                 AI Summary
// // //               </button>
// // //             )}
// // //             {item.link && (
// // //               <a
// // //                 href={item.link}
// // //                 target="_blank"
// // //                 rel="noopener noreferrer"
// // //                 onClick={e => e.stopPropagation()}
// // //                 style={{ padding: '2px 10px', borderRadius: 20, fontSize: 10, fontWeight: 600, fontFamily: "'DM Sans',sans-serif", border: `1px solid ${C.border}`, background: 'transparent', color: C.slate, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}
// // //               >
// // //                 <LinkOutlined style={{ fontSize: 9 }} /> Read more
// // //               </a>
// // //             )}
// // //           </div>
// // //         </div>
// // //       </div>
// // //       {showSummary && <SummaryModal item={item} onClose={() => setShowSummary(false)} />}
// // //     </>
// // //   );
// // // }

// // // // ─── Due Date Row ─────────────────────────────────────────────────────────
// // // function DueRow({ item }) {
// // //   const days   = daysUntil(item.date);
// // //   const urgent = days >= 0 && days <= 3;
// // //   const past   = days < 0;
// // //   const [day, mon] = item.date.split(' ');
// // //   const tag = getTagStyle(item.category);

// // //   return (
// // //     <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 8px', margin: '0 -8px', borderRadius: 9, background: urgent ? '#fff8f8' : 'transparent', borderBottom: `1px solid ${C.border}`, opacity: past ? 0.55 : 1 }}>
// // //       <div style={{ minWidth: 44, textAlign: 'center', padding: '4px 5px', borderRadius: 8, flexShrink: 0, background: urgent ? '#fee2e2' : past ? '#f8fafc' : '#f1f5f9', border: `1px solid ${urgent ? 'rgba(220,38,38,.25)' : C.border}` }}>
// // //         <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 18, fontWeight: 800, lineHeight: 1, color: urgent ? C.red : past ? '#94a3b8' : C.navyDk }}>{day}</div>
// // //         <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2, color: urgent ? C.red : C.slate }}>{mon}</div>
// // //       </div>
// // //       <div style={{ flex: 1, fontFamily: "'DM Sans',sans-serif" }}>
// // //         <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4, flexWrap: 'wrap' }}>
// // //           {item.category && (
// // //             <span style={{ padding: '1px 8px', borderRadius: 20, background: tag.bg, color: tag.color, fontSize: 10, fontWeight: 700 }}>{item.category}</span>
// // //           )}
// // //           {item.period && (
// // //             <span style={{ padding: '1px 7px', borderRadius: 20, background: '#f1f5f9', color: C.slate, fontSize: 10, fontWeight: 500, border: `1px solid ${C.border}` }}>{item.period}</span>
// // //           )}
// // //         </div>
// // //         <div style={{ fontSize: 13, lineHeight: 1.5, color: past ? C.slate : C.navyDk }}>{item.desc}</div>
// // //         {urgent && (
// // //           <div style={{ marginTop: 4, fontSize: 10, fontWeight: 700, color: days === 0 ? C.red : C.amber, display: 'flex', alignItems: 'center', gap: 4 }}>
// // //             <ExclamationCircleOutlined style={{ fontSize: 10 }} />
// // //             {days === 0 ? 'Due today' : `${days} day${days > 1 ? 's' : ''} left`}
// // //           </div>
// // //         )}
// // //         {past && <div style={{ marginTop: 3, fontSize: 10, color: '#94a3b8' }}>{Math.abs(days)} day{Math.abs(days) > 1 ? 's' : ''} ago</div>}
// // //       </div>
// // //     </div>
// // //   );
// // // }

// // // function SectionHeader({ title, icon, accent }) {
// // //   return (
// // //     <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
// // //       <div style={{ width: 34, height: 34, borderRadius: 9, background: accent + '18', color: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>{icon}</div>
// // //       <span style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 14, color: C.navyDk }}>{title}</span>
// // //     </div>
// // //   );
// // // }

// // // export default function CKPSCAFeed() {
// // //   const [tab, setTab]                   = useState('news');
// // //   const [news, setNews]                 = useState([]);
// // //   const [due, setDue]                   = useState([]);
// // //   const [loading, setLoading]           = useState(true);
// // //   const [error, setError]               = useState(null);
// // //   const [lastUpdated, setLastUpdated]   = useState(null);
// // //   const [newsCategory, setNewsCategory] = useState('All');
// // //   const CURRENT_MON = new Date().toLocaleString('en-US', { month: 'short' });
// // //   const [activeMon, setActiveMon]       = useState(CURRENT_MON);
// // //   const [dueCat, setDueCat]             = useState('All');

// // //   const fetchData = useCallback(async () => {
// // //     setLoading(true);
// // //     setError(null);
// // //     try {
// // //       const res = await api.get('/compliance_tracker/ckpsca-feed/');
// // //       setNews(res.data.news || []);
// // //       setDue(res.data.due   || []);
// // //       setLastUpdated(new Date());
// // //     } catch (err) {
// // //       setError(err.message);
// // //     } finally {
// // //       setLoading(false);
// // //     }
// // //   }, []);

// // //   useEffect(() => { fetchData(); }, [fetchData]);

// // //   const newsCategories = ['All', ...Object.keys(CATEGORIES).filter(k => k !== 'All' && k !== 'General' && news.some(n => n.category === k))];
// // //   const filteredNews = newsCategory === 'All' ? news : news.filter(n => n.category === newsCategory);
// // //   const grouped = filteredNews.reduce((acc, item) => { (acc[item.date] = acc[item.date] || []).push(item); return acc; }, {});

// // //   const MONTH_ORDER = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
// // //   const months = ['All', ...MONTH_ORDER.filter(m => due.some(d => d.date.includes(m)))];
// // //   const filteredDue = due.filter(d => activeMon === 'All' || d.date.split(' ')[1] === activeMon).filter(d => dueCat === 'All' || d.category === dueCat);
// // //   const urgentCount = due.filter(d => { const x = daysUntil(d.date); return x >= 0 && x <= 3; }).length;

// // //   const tabStyle = (active) => ({ padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", border: `1.5px solid ${active ? C.teal : C.border}`, background: active ? C.tealLt : 'transparent', color: active ? C.teal : C.slate, transition: 'all .15s', display: 'flex', alignItems: 'center', gap: 5 });
// // //   const pillStyle = (active, color) => ({ padding: '3px 11px', borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", transition: 'all .15s', border: `1px solid ${active ? color : C.border}`, background: active ? color + '18' : 'transparent', color: active ? color : C.slate });

// // //   return (
// // //     <>
// // //       <div style={{ fontSize: 11, fontWeight: 700, color: C.slate, textTransform: 'uppercase', letterSpacing: '.09em', marginBottom: 12, fontFamily: "'Sora',sans-serif" }}>Latest Updates</div>
// // //       <div className="db-box db-fade" style={{ animationDelay: '500ms', marginBottom: 24 }}>

// // //         <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
// // //           <SectionHeader title="Daily News & Compliance Calendar" icon={<BellOutlined />} accent={C.navy} />
// // //           <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
// // //             <span style={{ fontSize: 11, color: C.slate, fontFamily: "'DM Sans',sans-serif" }}>
// // //               {loading ? (
// // //                 <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
// // //                   <span style={{ width: 7, height: 7, borderRadius: '50%', display: 'inline-block', background: C.amber, animation: 'tickPulse 1s infinite' }} /> Syncing...
// // //                 </span>
// // //               ) : error ? <span style={{ color: C.red }}>Failed to load</span>
// // //               : lastUpdated ? (
// // //                 <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
// // //                   <span style={{ width: 7, height: 7, borderRadius: '50%', display: 'inline-block', background: C.green }} />
// // //                   {lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
// // //                   {/* {lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} &middot; {news.length} news &middot; {due.length} dates */}
// // //                 </span>
// // //               ) : null}
// // //             </span>
// // //             <button onClick={fetchData} style={{ background: 'none', border: `1px solid ${C.border}`, borderRadius: 7, padding: '4px 10px', cursor: 'pointer', fontSize: 11, color: C.slate, fontFamily: "'DM Sans',sans-serif", display: 'flex', alignItems: 'center', gap: 5 }}
// // //               onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
// // //               onMouseLeave={e => e.currentTarget.style.background = 'none'}>
// // //               <ReloadOutlined style={{ fontSize: 10 }} /> Refresh
// // //             </button>
// // //           </div>
// // //         </div>

// // //         <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
// // //           <button style={tabStyle(tab === 'news')} onClick={() => setTab('news')}>
// // //             <BellOutlined style={{ fontSize: 11 }} /> Latest News
// // //             {!loading && filteredNews.length > 0 && <span style={{ background: tab === 'news' ? C.teal : C.border, color: tab === 'news' ? '#fff' : C.slate, borderRadius: 20, padding: '1px 7px', fontSize: 10, fontWeight: 700 }}>{filteredNews.length}</span>}
// // //           </button>
// // //           <button style={tabStyle(tab === 'due')} onClick={() => setTab('due')}>
// // //             <CalendarOutlined style={{ fontSize: 11 }} /> Due Dates
// // //             {!loading && urgentCount > 0 && <span style={{ background: C.red, color: '#fff', borderRadius: 20, padding: '1px 7px', fontSize: 10, fontWeight: 700 }}>{urgentCount} urgent</span>}
// // //           </button>
// // //         </div>

// // //         {loading ? (
// // //           <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', gap: 12 }}>
// // //             <div style={{ display: 'flex', gap: 6 }}>
// // //               {[0,1,2].map(i => <span key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: C.teal, display: 'inline-block', animation: 'tickPulse 1.2s ease-in-out infinite', animationDelay: `${i * 0.2}s` }} />)}
// // //             </div>
// // //             <div style={{ fontSize: 13, fontWeight: 600, color: C.navyDk, fontFamily: "'DM Sans',sans-serif" }}>
// // //               {tab === 'news' ? 'Please wait, latest news loading...' : 'Please wait, due dates loading...'}
// // //             </div>
// // //             <div style={{ fontSize: 11, color: C.slate, fontFamily: "'DM Sans',sans-serif" }}>Fetching from taxguru.in</div>
// // //           </div>
// // //         ) : error ? (
// // //           <div style={{ padding: '20px', textAlign: 'center', color: C.slate, fontSize: 13, fontFamily: "'DM Sans',sans-serif" }}>
// // //             <ExclamationCircleOutlined style={{ fontSize: 24, color: C.red, display: 'block', marginBottom: 8 }} />
// // //             Could not load data<br />
// // //             <button onClick={fetchData} style={{ marginTop: 10, padding: '6px 16px', borderRadius: 8, cursor: 'pointer', border: `1.5px solid ${C.teal}`, background: C.tealLt, color: C.teal, fontSize: 12, fontWeight: 600, fontFamily: "'DM Sans',sans-serif" }}>Retry</button>
// // //           </div>
// // //         ) : tab === 'news' ? (
// // //           <>
// // //             <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12, paddingBottom: 12, borderBottom: `1px solid ${C.border}` }}>
// // //               <FilterOutlined style={{ fontSize: 11, color: C.slate }} />
// // //               <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
// // //                 {newsCategories.map(cat => <button key={cat} onClick={() => setNewsCategory(cat)} style={pillStyle(newsCategory === cat, CATEGORIES[cat]?.color || C.navy)}>{cat}</button>)}
// // //               </div>
// // //             </div>
// // //             <div style={{ maxHeight: 420, overflowY: 'auto' }}>
// // //               {Object.keys(grouped).length === 0 ? (
// // //                 <div style={{ padding: '20px', textAlign: 'center', color: C.slate, fontSize: 13 }}>No news found for this category.</div>
// // //               ) : Object.entries(grouped).map(([date, items]) => (
// // //                 <div key={date}>
// // //                   <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '10px 0 4px', fontFamily: "'Sora',sans-serif" }}>{date}</div>
// // //                   {items.map((item, i) => <NewsRow key={i} item={item} />)}
// // //                 </div>
// // //               ))}
// // //             </div>
// // //           </>
// // //         ) : (
// // //           <>
// // //             <div style={{ paddingBottom: 12, marginBottom: 4, borderBottom: `1px solid ${C.border}` }}>
// // //               <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
// // //                 <CalendarOutlined style={{ fontSize: 11, color: C.slate }} />
// // //                 <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
// // //                   {months.map(m => <button key={m} onClick={() => setActiveMon(m)} style={pillStyle(activeMon === m, C.navy)}>{m}</button>)}
// // //                 </div>
// // //               </div>
// // //               <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
// // //                 <FilterOutlined style={{ fontSize: 11, color: C.slate }} />
// // //                 <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
// // //                   {DUE_CATEGORIES.map(cat => <button key={cat} onClick={() => setDueCat(cat)} style={pillStyle(dueCat === cat, CATEGORIES[cat]?.color || C.navy)}>{cat}</button>)}
// // //                 </div>
// // //               </div>
// // //             </div>
// // //             <div style={{ fontSize: 11, color: C.slate, marginBottom: 8, fontFamily: "'DM Sans',sans-serif" }}>
// // //               {filteredDue.length} due date{filteredDue.length !== 1 ? 's' : ''}{activeMon !== 'All' ? ` in ${activeMon}` : ''}{dueCat !== 'All' ? ` - ${dueCat}` : ''}
// // //             </div>
// // //             <div style={{ maxHeight: 420, overflowY: 'auto' }}>
// // //               {filteredDue.length === 0 ? (
// // //                 <div style={{ padding: '20px', textAlign: 'center', fontSize: 13, color: C.slate, fontFamily: "'DM Sans',sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
// // //                   <CheckCircleOutlined style={{ color: C.green }} /> No due dates for this filter.
// // //                 </div>
// // //               ) : filteredDue.map((item, i) => <DueRow key={i} item={item} />)}
// // //             </div>
// // //           </>
// // //         )}
// // //       </div>
// // //     </>
// // //   );
// // // }

// // import { useState, useEffect, useCallback, useRef } from 'react';
// // import {
// //   CalendarOutlined, ArrowRightOutlined, ReloadOutlined,
// //   CheckCircleOutlined, ExclamationCircleOutlined,
// //   BellOutlined, LinkOutlined, FilterOutlined,
// // } from '@ant-design/icons';
// // import { api } from '../services/api';

// // const C = {
// //   navy:'#023C6C', navyDk:'#011f3a', teal:'#0891b2', tealLt:'#e0f2f9',
// //   amber:'#d97706', amberLt:'#fef3c7', green:'#059669', greenLt:'#d1fae5',
// //   red:'#dc2626', redLt:'#fee2e2', purple:'#7c3aed', purpleLt:'#ede9fe',
// //   slate:'#64748b', border:'#e2e8f0', pink:'#db2777', pinkLt:'#fce7f3',
// //   indigo:'#4f46e5', indigoLt:'#eef2ff', cyan:'#0e7490', cyanLt:'#cffafe',
// // };

// // const CATEGORIES = {
// //   'All':              { color: C.navy,   bg: '#e0eaf4' },
// //   'GST':              { color: C.green,  bg: C.greenLt  },
// //   'Income Tax':       { color: C.teal,   bg: C.tealLt   },
// //   'Corporate':        { color: C.amber,  bg: C.amberLt  },
// //   'Audit & Accounts': { color: C.purple, bg: C.purpleLt },
// //   'Finance & FEMA':   { color: C.indigo, bg: C.indigoLt },
// //   'SEBI':             { color: C.pink,   bg: C.pinkLt   },
// //   'Customs':          { color: C.cyan,   bg: C.cyanLt   },
// //   'Labour & PF':      { color: C.slate,  bg: '#f1f5f9'  },
// //   'General':          { color: C.slate,  bg: '#f1f5f9'  },
// // };

// // const DUE_CATEGORIES = ['All', 'GST', 'Income Tax', 'Corporate', 'Audit & Accounts', 'Labour & PF'];
// // const getTagStyle = (category = '') => CATEGORIES[category] || CATEGORIES['General'];

// // const daysUntil = (dateStr) => {
// //   try {
// //     const [day, mon, yr] = dateStr.split(' ');
// //     return Math.ceil((new Date(`${mon} ${day} 20${yr}`) - new Date()) / 86400000);
// //   } catch { return 999; }
// // };

// // // ─── Summary Modal ────────────────────────────────────────────────────────
// // function SummaryModal({ item, onClose }) {
// //   const [loading, setLoading] = useState(true);
// //   const [keyPoints, setKeyPoints] = useState([]);
// //   const [summary, setSummary] = useState('');
// //   const [error, setError] = useState(null);
// //   const tag = getTagStyle(item.category);

// //   useEffect(() => {
// //     const load = async () => {
// //       try {
// //         const res = await api.post('/compliance_tracker/article-summary/', {
// //           title:    item.title,
// //           category: item.category,
// //           source:   item.source,
// //           date:     item.date,
// //           link:     item.link,
// //         });
// //         setKeyPoints(res.data.key_points || []);
// //         setSummary(res.data.summary || '');
// //       } catch (e) {
// //         setError('Could not generate summary. Please read the full article.');
// //       } finally {
// //         setLoading(false);
// //       }
// //     };
// //     load();
// //   }, [item.title, item.category, item.source, item.date]);

// //   useEffect(() => {
// //     const onKey = (e) => { if (e.key === 'Escape') onClose(); };
// //     window.addEventListener('keydown', onKey);
// //     return () => window.removeEventListener('keydown', onKey);
// //   }, [onClose]);

// //   return (
// //     <div
// //       onClick={onClose}
// //       style={{
// //         position: 'fixed', inset: 0, zIndex: 9999,
// //         background: 'rgba(1,31,58,0.5)',
// //         display: 'flex', alignItems: 'center', justifyContent: 'center',
// //         padding: '20px',
// //       }}
// //     >
// //       <div
// //         onClick={e => e.stopPropagation()}
// //         style={{
// //           background: '#fff', borderRadius: 16, width: '100%', maxWidth: 560,
// //           maxHeight: '82vh', overflowY: 'auto',
// //           boxShadow: '0 24px 60px rgba(1,31,58,0.2)',
// //           fontFamily: "'DM Sans',sans-serif",
// //         }}
// //       >
// //         <div style={{
// //           padding: '18px 20px 14px', borderBottom: `1px solid ${C.border}`,
// //           position: 'sticky', top: 0, background: '#fff', zIndex: 1,
// //           borderRadius: '16px 16px 0 0',
// //         }}>
// //           <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
// //             <span style={{ padding: '2px 9px', borderRadius: 20, background: tag.bg, color: tag.color, fontSize: 10, fontWeight: 700 }}>
// //               {item.category}
// //             </span>
// //             <button
// //               onClick={onClose}
// //               style={{ background: '#f1f5f9', border: 'none', borderRadius: 8, width: 28, height: 28, cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.slate }}
// //             >x</button>
// //           </div>
// //           <div style={{ fontSize: 14, fontWeight: 600, color: C.navyDk, lineHeight: 1.45 }}>{item.title}</div>
// //           <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 5 }}>{item.date} &middot; {item.source}</div>
// //         </div>
// //         <div style={{ padding: '18px 20px 20px' }}>
// //           {loading ? (
// //             <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '30px 0' }}>
// //               <div style={{ display: 'flex', gap: 6 }}>
// //                 {[0,1,2].map(i => (
// //                   <span key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: C.teal, display: 'inline-block', animation: 'tickPulse 1.2s ease-in-out infinite', animationDelay: `${i * 0.2}s` }} />
// //                 ))}
// //               </div>
// //               <div style={{ fontSize: 13, color: C.slate }}>Generating AI summary...</div>
// //               <div style={{ fontSize: 11, color: '#94a3b8' }}>This takes a few seconds</div>
// //             </div>
// //           ) : error ? (
// //             <div style={{ fontSize: 13, color: C.red, padding: '16px 0', textAlign: 'center' }}>{error}</div>
// //           ) : (
// //             <>
// //               {keyPoints.length > 0 && (
// //                 <div style={{ marginBottom: 18 }}>
// //                   <div style={{ fontSize: 11, fontWeight: 700, color: C.slate, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>Key points</div>
// //                   {keyPoints.map((pt, i) => (
// //                     <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 9, alignItems: 'flex-start' }}>
// //                       <span style={{ width: 20, height: 20, borderRadius: '50%', flexShrink: 0, background: C.tealLt, color: C.teal, fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 1 }}>{i + 1}</span>
// //                       <span style={{ fontSize: 13, lineHeight: 1.55, color: C.navyDk }}>{pt}</span>
// //                     </div>
// //                   ))}
// //                 </div>
// //               )}
// //               {summary && (
// //                 <div style={{ marginBottom: 18 }}>
// //                   <div style={{ fontSize: 11, fontWeight: 700, color: C.slate, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Summary</div>
// //                   <div style={{ fontSize: 13, lineHeight: 1.7, color: '#374151', background: '#f8fafc', borderRadius: 10, padding: '12px 14px', borderLeft: `3px solid ${C.teal}` }}>
// //                     {summary}
// //                   </div>
// //                 </div>
// //               )}
// //             </>
// //           )}
// //           <a
// //             href={item.link} target="_blank" rel="noopener noreferrer"
// //             style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px 16px', borderRadius: 9, marginTop: 8, background: C.navy, color: '#fff', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}
// //           >
// //             Read full article <ArrowRightOutlined style={{ fontSize: 11 }} />
// //           </a>
// //         </div>
// //       </div>
// //     </div>
// //   );
// // }

// // // ─── News Row — fixed height for smooth scroll ────────────────────────────
// // const NEWS_ROW_H = 62; // px — must match the rendered height

// // function NewsRow({ item, onSummary }) {
// //   const [hovered, setHovered] = useState(false);
// //   const tag = getTagStyle(item.category);

// //   return (
// //     <div
// //       onMouseEnter={() => setHovered(true)}
// //       onMouseLeave={() => setHovered(false)}
// //       style={{
// //         display: 'flex', alignItems: 'flex-start', gap: 10,
// //         padding: '0 10px', margin: '0 -10px',
// //         height: NEWS_ROW_H, boxSizing: 'border-box',
// //         borderBottom: `1px solid ${C.border}`,
// //         background: hovered ? '#f8fafc' : 'transparent',
// //         transition: 'background .12s',
// //         overflow: 'hidden',
// //       }}
// //     >
// //       <span style={{
// //         padding: '2px 9px', borderRadius: 20, flexShrink: 0, marginTop: 14,
// //         background: tag.bg, color: tag.color,
// //         fontSize: 10, fontWeight: 700, fontFamily: "'DM Sans',sans-serif", whiteSpace: 'nowrap',
// //       }}>
// //         {item.category || 'General'}
// //       </span>
// //       <div style={{ flex: 1, minWidth: 0, paddingTop: 11 }}>
// //         <div style={{
// //           fontSize: 12, lineHeight: 1.4, color: C.navyDk,
// //           fontFamily: "'DM Sans',sans-serif",
// //           overflow: 'hidden', display: '-webkit-box',
// //           WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
// //         }}>
// //           {item.title}
// //         </div>
// //         <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 5, flexWrap: 'nowrap' }}>
// //           <span style={{ fontSize: 10, color: '#94a3b8', fontFamily: "'DM Sans',sans-serif", whiteSpace: 'nowrap' }}>{item.date}</span>
// //           {item.source && (
// //             <span style={{ fontSize: 10, color: C.slate, background: '#f1f5f9', padding: '1px 5px', borderRadius: 4, fontFamily: "'DM Sans',sans-serif", whiteSpace: 'nowrap' }}>{item.source}</span>
// //           )}
// //           {item.link && (
// //             <button
// //               onClick={(e) => { e.stopPropagation(); onSummary(item); }}
// //               style={{
// //                 padding: '1px 8px', borderRadius: 20, fontSize: 10, fontWeight: 600,
// //                 cursor: 'pointer', fontFamily: "'DM Sans',sans-serif",
// //                 border: `1px solid ${C.teal}`,
// //                 background: hovered ? C.tealLt : 'transparent',
// //                 color: C.teal, transition: 'all .15s',
// //                 display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0,
// //               }}
// //             >
// //               AI Summary
// //             </button>
// //           )}
// //           {item.link && (
// //             <a
// //               href={item.link} target="_blank" rel="noopener noreferrer"
// //               onClick={e => e.stopPropagation()}
// //               style={{
// //                 padding: '1px 8px', borderRadius: 20, fontSize: 10, fontWeight: 600,
// //                 fontFamily: "'DM Sans',sans-serif", border: `1px solid ${C.border}`,
// //                 background: 'transparent', color: C.slate, textDecoration: 'none',
// //                 display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0,
// //               }}
// //             >
// //               <LinkOutlined style={{ fontSize: 9 }} /> Read
// //             </a>
// //           )}
// //         </div>
// //       </div>
// //     </div>
// //   );
// // }

// // // ─── Auto-scrolling news list ─────────────────────────────────────────────
// // const VISIBLE_ROWS = 5;
// // const SPEED        = 0.28; // px per rAF frame

// // function NewsFeed({ items, onSummary }) {
// //   const scrollRef  = useRef(null);
// //   const pxRef      = useRef(0);
// //   const pausedRef  = useRef(false);
// //   const rafRef     = useRef(null);

// //   const needsScroll = items.length > VISIBLE_ROWS;
// //   // Triple for seamless wrap-around
// //   const looped = needsScroll ? [...items, ...items, ...items] : items;
// //   const oneH   = items.length * NEWS_ROW_H; // height of one full copy

// //   useEffect(() => {
// //     pxRef.current = 0;
// //     if (scrollRef.current) scrollRef.current.style.transform = 'translateY(0)';
// //     if (rafRef.current) cancelAnimationFrame(rafRef.current);
// //     if (!needsScroll) return;

// //     const tick = () => {
// //       if (!pausedRef.current && scrollRef.current) {
// //         pxRef.current += SPEED;
// //         if (pxRef.current >= oneH) pxRef.current -= oneH;
// //         scrollRef.current.style.transform = `translateY(-${pxRef.current}px)`;
// //       }
// //       rafRef.current = requestAnimationFrame(tick);
// //     };
// //     rafRef.current = requestAnimationFrame(tick);
// //     return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
// //   }, [items.length, needsScroll, oneH]);

// //   const viewH = VISIBLE_ROWS * NEWS_ROW_H;

// //   if (items.length === 0) {
// //     return (
// //       <div style={{ padding: '20px', textAlign: 'center', color: C.slate, fontSize: 13 }}>
// //         No news found for this category.
// //       </div>
// //     );
// //   }

// //   return (
// //     <div
// //       style={{ height: viewH, overflow: 'hidden', position: 'relative' }}
// //       onMouseEnter={() => { pausedRef.current = true; }}
// //       onMouseLeave={() => { pausedRef.current = false; }}
// //     >
// //       <div ref={scrollRef} style={{ willChange: 'transform' }}>
// //         {looped.map((item, i) => (
// //           <NewsRow key={`${i}-${item.title}`} item={item} onSummary={onSummary} />
// //         ))}
// //       </div>
// //     </div>
// //   );
// // }

// // // ─── Due Date Row ─────────────────────────────────────────────────────────
// // function DueRow({ item }) {
// //   const days   = daysUntil(item.date);
// //   const urgent = days >= 0 && days <= 3;
// //   const past   = days < 0;
// //   const [day, mon] = item.date.split(' ');
// //   const tag = getTagStyle(item.category);

// //   return (
// //     <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 8px', margin: '0 -8px', borderRadius: 9, background: urgent ? '#fff8f8' : 'transparent', borderBottom: `1px solid ${C.border}`, opacity: past ? 0.55 : 1 }}>
// //       <div style={{ minWidth: 44, textAlign: 'center', padding: '4px 5px', borderRadius: 8, flexShrink: 0, background: urgent ? '#fee2e2' : past ? '#f8fafc' : '#f1f5f9', border: `1px solid ${urgent ? 'rgba(220,38,38,.25)' : C.border}` }}>
// //         <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 18, fontWeight: 800, lineHeight: 1, color: urgent ? C.red : past ? '#94a3b8' : C.navyDk }}>{day}</div>
// //         <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2, color: urgent ? C.red : C.slate }}>{mon}</div>
// //       </div>
// //       <div style={{ flex: 1, fontFamily: "'DM Sans',sans-serif" }}>
// //         <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4, flexWrap: 'wrap' }}>
// //           {item.category && (
// //             <span style={{ padding: '1px 8px', borderRadius: 20, background: tag.bg, color: tag.color, fontSize: 10, fontWeight: 700 }}>{item.category}</span>
// //           )}
// //           {item.period && (
// //             <span style={{ padding: '1px 7px', borderRadius: 20, background: '#f1f5f9', color: C.slate, fontSize: 10, fontWeight: 500, border: `1px solid ${C.border}` }}>{item.period}</span>
// //           )}
// //         </div>
// //         <div style={{ fontSize: 13, lineHeight: 1.5, color: past ? C.slate : C.navyDk }}>{item.desc}</div>
// //         {urgent && (
// //           <div style={{ marginTop: 4, fontSize: 10, fontWeight: 700, color: days === 0 ? C.red : C.amber, display: 'flex', alignItems: 'center', gap: 4 }}>
// //             <ExclamationCircleOutlined style={{ fontSize: 10 }} />
// //             {days === 0 ? 'Due today' : `${days} day${days > 1 ? 's' : ''} left`}
// //           </div>
// //         )}
// //         {past && <div style={{ marginTop: 3, fontSize: 10, color: '#94a3b8' }}>{Math.abs(days)} day{Math.abs(days) > 1 ? 's' : ''} ago</div>}
// //       </div>
// //     </div>
// //   );
// // }

// // function SectionHeader({ title, icon, accent }) {
// //   return (
// //     <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
// //       <div style={{ width: 34, height: 34, borderRadius: 9, background: accent + '18', color: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>{icon}</div>
// //       <span style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 14, color: C.navyDk }}>{title}</span>
// //     </div>
// //   );
// // }

// // // ─── Main Component ───────────────────────────────────────────────────────
// // export default function CKPSCAFeed() {
// //   const [tab, setTab]                   = useState('news');
// //   const [news, setNews]                 = useState([]);
// //   const [due, setDue]                   = useState([]);
// //   const [loading, setLoading]           = useState(true);
// //   const [error, setError]               = useState(null);
// //   const [lastUpdated, setLastUpdated]   = useState(null);
// //   const [newsCategory, setNewsCategory] = useState('All');
// //   const [summaryItem, setSummaryItem]   = useState(null);

// //   const CURRENT_MON = new Date().toLocaleString('en-US', { month: 'short' });
// //   const [activeMon, setActiveMon] = useState(CURRENT_MON);
// //   const [dueCat, setDueCat]       = useState('All');

// //   const fetchData = useCallback(async () => {
// //     setLoading(true);
// //     setError(null);
// //     try {
// //       const res = await api.get('/compliance_tracker/ckpsca-feed/');
// //       setNews(res.data.news || []);
// //       setDue(res.data.due   || []);
// //       setLastUpdated(new Date());
// //     } catch (err) {
// //       setError(err.message);
// //     } finally {
// //       setLoading(false);
// //     }
// //   }, []);

// //   useEffect(() => { fetchData(); }, [fetchData]);

// //   const newsCategories = ['All', ...Object.keys(CATEGORIES).filter(k => k !== 'All' && k !== 'General' && news.some(n => n.category === k))];
// //   const filteredNews   = newsCategory === 'All' ? news : news.filter(n => n.category === newsCategory);

// //   const MONTH_ORDER  = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
// //   const months       = ['All', ...MONTH_ORDER.filter(m => due.some(d => d.date.includes(m)))];
// //   const filteredDue  = due.filter(d => activeMon === 'All' || d.date.split(' ')[1] === activeMon).filter(d => dueCat === 'All' || d.category === dueCat);
// //   const urgentCount  = due.filter(d => { const x = daysUntil(d.date); return x >= 0 && x <= 3; }).length;

// //   const tabStyle  = (active) => ({ padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", border: `1.5px solid ${active ? C.teal : C.border}`, background: active ? C.tealLt : 'transparent', color: active ? C.teal : C.slate, transition: 'all .15s', display: 'flex', alignItems: 'center', gap: 5 });
// //   const pillStyle = (active, color) => ({ padding: '3px 11px', borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", transition: 'all .15s', border: `1px solid ${active ? color : C.border}`, background: active ? color + '18' : 'transparent', color: active ? color : C.slate });

// //   return (
// //     <>
// //       <div style={{ fontSize: 11, fontWeight: 700, color: C.slate, textTransform: 'uppercase', letterSpacing: '.09em', marginBottom: 12, fontFamily: "'Sora',sans-serif" }}>Latest Updates</div>
// //       <div className="db-box db-fade" style={{ animationDelay: '500ms', marginBottom: 24 }}>

// //         {/* Header */}
// //         <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
// //           <SectionHeader title="Daily News & Compliance Calendar" icon={<BellOutlined />} accent={C.navy} />
// //           <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
// //             <span style={{ fontSize: 11, color: C.slate, fontFamily: "'DM Sans',sans-serif" }}>
// //               {loading ? (
// //                 <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
// //                   <span style={{ width: 7, height: 7, borderRadius: '50%', display: 'inline-block', background: C.amber, animation: 'tickPulse 1s infinite' }} /> Syncing...
// //                 </span>
// //               ) : error ? (
// //                 <span style={{ color: C.red }}>Failed to load</span>
// //               ) : lastUpdated ? (
// //                 <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
// //                   <span style={{ width: 7, height: 7, borderRadius: '50%', display: 'inline-block', background: C.green }} />
// //                   {lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
// //                 </span>
// //               ) : null}
// //             </span>
// //             <button
// //               onClick={fetchData}
// //               style={{ background: 'none', border: `1px solid ${C.border}`, borderRadius: 7, padding: '4px 10px', cursor: 'pointer', fontSize: 11, color: C.slate, fontFamily: "'DM Sans',sans-serif", display: 'flex', alignItems: 'center', gap: 5 }}
// //               onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
// //               onMouseLeave={e => e.currentTarget.style.background = 'none'}
// //             >
// //               <ReloadOutlined style={{ fontSize: 10 }} /> Refresh
// //             </button>
// //           </div>
// //         </div>

// //         {/* Tabs */}
// //         <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
// //           <button style={tabStyle(tab === 'news')} onClick={() => setTab('news')}>
// //             <BellOutlined style={{ fontSize: 11 }} /> Latest News
// //             {!loading && filteredNews.length > 0 && (
// //               <span style={{ background: tab === 'news' ? C.teal : C.border, color: tab === 'news' ? '#fff' : C.slate, borderRadius: 20, padding: '1px 7px', fontSize: 10, fontWeight: 700 }}>
// //                 {filteredNews.length}
// //               </span>
// //             )}
// //           </button>
// //           <button style={tabStyle(tab === 'due')} onClick={() => setTab('due')}>
// //             <CalendarOutlined style={{ fontSize: 11 }} /> Due Dates
// //             {!loading && urgentCount > 0 && (
// //               <span style={{ background: C.red, color: '#fff', borderRadius: 20, padding: '1px 7px', fontSize: 10, fontWeight: 700 }}>
// //                 {urgentCount} urgent
// //               </span>
// //             )}
// //           </button>
// //         </div>

// //         {/* Body */}
// //         {loading ? (
// //           <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', gap: 12 }}>
// //             <div style={{ display: 'flex', gap: 6 }}>
// //               {[0,1,2].map(i => (
// //                 <span key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: C.teal, display: 'inline-block', animation: 'tickPulse 1.2s ease-in-out infinite', animationDelay: `${i * 0.2}s` }} />
// //               ))}
// //             </div>
// //             <div style={{ fontSize: 13, fontWeight: 600, color: C.navyDk, fontFamily: "'DM Sans',sans-serif" }}>
// //               {tab === 'news' ? 'Please wait, latest news loading...' : 'Please wait, due dates loading...'}
// //             </div>
// //             <div style={{ fontSize: 11, color: C.slate, fontFamily: "'DM Sans',sans-serif" }}>Fetching from taxguru.in</div>
// //           </div>
// //         ) : error ? (
// //           <div style={{ padding: '20px', textAlign: 'center', color: C.slate, fontSize: 13, fontFamily: "'DM Sans',sans-serif" }}>
// //             <ExclamationCircleOutlined style={{ fontSize: 24, color: C.red, display: 'block', marginBottom: 8 }} />
// //             Could not load data<br />
// //             <button onClick={fetchData} style={{ marginTop: 10, padding: '6px 16px', borderRadius: 8, cursor: 'pointer', border: `1.5px solid ${C.teal}`, background: C.tealLt, color: C.teal, fontSize: 12, fontWeight: 600, fontFamily: "'DM Sans',sans-serif" }}>Retry</button>
// //           </div>
// //         ) : tab === 'news' ? (
// //           <>
// //             {/* Category filter pills */}
// //             <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12, paddingBottom: 12, borderBottom: `1px solid ${C.border}` }}>
// //               <FilterOutlined style={{ fontSize: 11, color: C.slate }} />
// //               <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
// //                 {newsCategories.map(cat => (
// //                   <button key={cat} onClick={() => setNewsCategory(cat)} style={pillStyle(newsCategory === cat, CATEGORIES[cat]?.color || C.navy)}>
// //                     {cat}
// //                   </button>
// //                 ))}
// //               </div>
// //             </div>

// //             {/* Auto-scrolling news — no progress bar */}
// //             <NewsFeed items={filteredNews} onSummary={setSummaryItem} />
// //           </>
// //         ) : (
// //           <>
// //             <div style={{ paddingBottom: 12, marginBottom: 4, borderBottom: `1px solid ${C.border}` }}>
// //               <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
// //                 <CalendarOutlined style={{ fontSize: 11, color: C.slate }} />
// //                 <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
// //                   {months.map(m => (
// //                     <button key={m} onClick={() => setActiveMon(m)} style={pillStyle(activeMon === m, C.navy)}>{m}</button>
// //                   ))}
// //                 </div>
// //               </div>
// //               <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
// //                 <FilterOutlined style={{ fontSize: 11, color: C.slate }} />
// //                 <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
// //                   {DUE_CATEGORIES.map(cat => (
// //                     <button key={cat} onClick={() => setDueCat(cat)} style={pillStyle(dueCat === cat, CATEGORIES[cat]?.color || C.navy)}>{cat}</button>
// //                   ))}
// //                 </div>
// //               </div>
// //             </div>
// //             <div style={{ fontSize: 11, color: C.slate, marginBottom: 8, fontFamily: "'DM Sans',sans-serif" }}>
// //               {filteredDue.length} due date{filteredDue.length !== 1 ? 's' : ''}{activeMon !== 'All' ? ` in ${activeMon}` : ''}{dueCat !== 'All' ? ` - ${dueCat}` : ''}
// //             </div>
// //             <div style={{ maxHeight: 420, overflowY: 'auto' }}>
// //               {filteredDue.length === 0 ? (
// //                 <div style={{ padding: '20px', textAlign: 'center', fontSize: 13, color: C.slate, fontFamily: "'DM Sans',sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
// //                   <CheckCircleOutlined style={{ color: C.green }} /> No due dates for this filter.
// //                 </div>
// //               ) : filteredDue.map((item, i) => <DueRow key={i} item={item} />)}
// //             </div>
// //           </>
// //         )}
// //       </div>

// //       {/* AI Summary Modal — lifted out of the scroll container so it's never clipped */}
// //       {summaryItem && (
// //         <SummaryModal item={summaryItem} onClose={() => setSummaryItem(null)} />
// //       )}
// //     </>
// //   );
// // }

// import { useState, useEffect, useCallback, useRef } from 'react';
// import {
//   CalendarOutlined, ArrowRightOutlined, ReloadOutlined,
//   CheckCircleOutlined, ExclamationCircleOutlined,
//   BellOutlined, LinkOutlined, FilterOutlined,
// } from '@ant-design/icons';
// import { api } from '../services/api';

// const C = {
//   navy:'#023C6C', navyDk:'#011f3a', teal:'#0891b2', tealLt:'#e0f2f9',
//   amber:'#d97706', amberLt:'#fef3c7', green:'#059669', greenLt:'#d1fae5',
//   red:'#dc2626', redLt:'#fee2e2', purple:'#7c3aed', purpleLt:'#ede9fe',
//   slate:'#64748b', border:'#e2e8f0', pink:'#db2777', pinkLt:'#fce7f3',
//   indigo:'#4f46e5', indigoLt:'#eef2ff', cyan:'#0e7490', cyanLt:'#cffafe',
// };

// const CATEGORIES = {
//   'All':              { color: C.navy,   bg: '#e0eaf4' },
//   'GST':              { color: C.green,  bg: C.greenLt  },
//   'Income Tax':       { color: C.teal,   bg: C.tealLt   },
//   'Corporate':        { color: C.amber,  bg: C.amberLt  },
//   'Audit & Accounts': { color: C.purple, bg: C.purpleLt },
//   'Finance & FEMA':   { color: C.indigo, bg: C.indigoLt },
//   'SEBI':             { color: C.pink,   bg: C.pinkLt   },
//   'Customs':          { color: C.cyan,   bg: C.cyanLt   },
//   'Labour & PF':      { color: C.slate,  bg: '#f1f5f9'  },
//   'General':          { color: C.slate,  bg: '#f1f5f9'  },
// };

// const DUE_CATEGORIES = ['All', 'GST', 'Income Tax', 'Corporate', 'Audit & Accounts', 'Labour & PF'];
// const getTagStyle = (category = '') => CATEGORIES[category] || CATEGORIES['General'];

// const daysUntil = (dateStr) => {
//   try {
//     const [day, mon, yr] = dateStr.split(' ');
//     return Math.ceil((new Date(`${mon} ${day} 20${yr}`) - new Date()) / 86400000);
//   } catch { return 999; }
// };

// /* ─── Module-level cache — survives re-mounts and soft navigations ─── */
// const FEED_CACHE = { data: null, ts: 0 };
// const FEED_TTL   = 5 * 60 * 1000; // 5 minutes — feed data changes slowly
// const isFeedFresh = () => FEED_CACHE.data !== null && Date.now() - FEED_CACHE.ts < FEED_TTL;

// // ─── Summary Modal ────────────────────────────────────────────────────────
// function SummaryModal({ item, onClose }) {
//   const [loading, setLoading] = useState(true);
//   const [keyPoints, setKeyPoints] = useState([]);
//   const [summary, setSummary] = useState('');
//   const [error, setError] = useState(null);
//   const tag = getTagStyle(item.category);

//   useEffect(() => {
//     const load = async () => {
//       try {
//         const res = await api.post('/compliance_tracker/article-summary/', {
//           title:    item.title,
//           category: item.category,
//           source:   item.source,
//           date:     item.date,
//           link:     item.link,
//         });
//         setKeyPoints(res.data.key_points || []);
//         setSummary(res.data.summary || '');
//       } catch {
//         setError('Could not generate summary. Please read the full article.');
//       } finally {
//         setLoading(false);
//       }
//     };
//     load();
//   }, [item.title, item.category, item.source, item.date]);

//   useEffect(() => {
//     const onKey = (e) => { if (e.key === 'Escape') onClose(); };
//     window.addEventListener('keydown', onKey);
//     return () => window.removeEventListener('keydown', onKey);
//   }, [onClose]);

//   return (
//     <div
//       onClick={onClose}
//       style={{
//         position: 'fixed', inset: 0, zIndex: 9999,
//         background: 'rgba(1,31,58,0.5)',
//         display: 'flex', alignItems: 'center', justifyContent: 'center',
//         padding: '20px',
//       }}
//     >
//       <div
//         onClick={e => e.stopPropagation()}
//         style={{
//           background: '#fff', borderRadius: 16, width: '100%', maxWidth: 560,
//           maxHeight: '82vh', overflowY: 'auto',
//           boxShadow: '0 24px 60px rgba(1,31,58,0.2)',
//           fontFamily: "'DM Sans',sans-serif",
//         }}
//       >
//         <div style={{
//           padding: '18px 20px 14px', borderBottom: `1px solid ${C.border}`,
//           position: 'sticky', top: 0, background: '#fff', zIndex: 1,
//           borderRadius: '16px 16px 0 0',
//         }}>
//           <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
//             <span style={{ padding: '2px 9px', borderRadius: 20, background: tag.bg, color: tag.color, fontSize: 10, fontWeight: 700 }}>
//               {item.category}
//             </span>
//             <button
//               onClick={onClose}
//               style={{ background: '#f1f5f9', border: 'none', borderRadius: 8, width: 28, height: 28, cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.slate }}
//             >x</button>
//           </div>
//           <div style={{ fontSize: 14, fontWeight: 600, color: C.navyDk, lineHeight: 1.45 }}>{item.title}</div>
//           <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 5 }}>{item.date} &middot; {item.source}</div>
//         </div>
//         <div style={{ padding: '18px 20px 20px' }}>
//           {loading ? (
//             <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '30px 0' }}>
//               <div style={{ display: 'flex', gap: 6 }}>
//                 {[0,1,2].map(i => (
//                   <span key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: C.teal, display: 'inline-block', animation: 'tickPulse 1.2s ease-in-out infinite', animationDelay: `${i * 0.2}s` }} />
//                 ))}
//               </div>
//               <div style={{ fontSize: 13, color: C.slate }}>Generating AI summary...</div>
//               <div style={{ fontSize: 11, color: '#94a3b8' }}>This takes a few seconds</div>
//             </div>
//           ) : error ? (
//             <div style={{ fontSize: 13, color: C.red, padding: '16px 0', textAlign: 'center' }}>{error}</div>
//           ) : (
//             <>
//               {keyPoints.length > 0 && (
//                 <div style={{ marginBottom: 18 }}>
//                   <div style={{ fontSize: 11, fontWeight: 700, color: C.slate, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>Key points</div>
//                   {keyPoints.map((pt, i) => (
//                     <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 9, alignItems: 'flex-start' }}>
//                       <span style={{ width: 20, height: 20, borderRadius: '50%', flexShrink: 0, background: C.tealLt, color: C.teal, fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 1 }}>{i + 1}</span>
//                       <span style={{ fontSize: 13, lineHeight: 1.55, color: C.navyDk }}>{pt}</span>
//                     </div>
//                   ))}
//                 </div>
//               )}
//               {summary && (
//                 <div style={{ marginBottom: 18 }}>
//                   <div style={{ fontSize: 11, fontWeight: 700, color: C.slate, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Summary</div>
//                   <div style={{ fontSize: 13, lineHeight: 1.7, color: '#374151', background: '#f8fafc', borderRadius: 10, padding: '12px 14px', borderLeft: `3px solid ${C.teal}` }}>
//                     {summary}
//                   </div>
//                 </div>
//               )}
//             </>
//           )}
//           <a
//             href={item.link} target="_blank" rel="noopener noreferrer"
//             style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px 16px', borderRadius: 9, marginTop: 8, background: C.navy, color: '#fff', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}
//           >
//             Read full article <ArrowRightOutlined style={{ fontSize: 11 }} />
//           </a>
//         </div>
//       </div>
//     </div>
//   );
// }

// // ─── News Row — fixed height for smooth scroll ────────────────────────────
// const NEWS_ROW_H = 62;

// function NewsRow({ item, onSummary }) {
//   const [hovered, setHovered] = useState(false);
//   const tag = getTagStyle(item.category);

//   return (
//     <div
//       onMouseEnter={() => setHovered(true)}
//       onMouseLeave={() => setHovered(false)}
//       style={{
//         display: 'flex', alignItems: 'flex-start', gap: 10,
//         padding: '0 10px', margin: '0 -10px',
//         height: NEWS_ROW_H, boxSizing: 'border-box',
//         borderBottom: `1px solid ${C.border}`,
//         background: hovered ? '#f8fafc' : 'transparent',
//         transition: 'background .12s',
//         overflow: 'hidden',
//       }}
//     >
//       <span style={{
//         padding: '2px 9px', borderRadius: 20, flexShrink: 0, marginTop: 14,
//         background: tag.bg, color: tag.color,
//         fontSize: 10, fontWeight: 700, fontFamily: "'DM Sans',sans-serif", whiteSpace: 'nowrap',
//       }}>
//         {item.category || 'General'}
//       </span>
//       <div style={{ flex: 1, minWidth: 0, paddingTop: 11 }}>
//         <div style={{
//           fontSize: 12, lineHeight: 1.4, color: C.navyDk,
//           fontFamily: "'DM Sans',sans-serif",
//           overflow: 'hidden', display: '-webkit-box',
//           WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
//         }}>
//           {item.title}
//         </div>
//         <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 5, flexWrap: 'nowrap' }}>
//           <span style={{ fontSize: 10, color: '#94a3b8', fontFamily: "'DM Sans',sans-serif", whiteSpace: 'nowrap' }}>{item.date}</span>
//           {item.source && (
//             <span style={{ fontSize: 10, color: C.slate, background: '#f1f5f9', padding: '1px 5px', borderRadius: 4, fontFamily: "'DM Sans',sans-serif", whiteSpace: 'nowrap' }}>{item.source}</span>
//           )}
//           {item.link && (
//             <button
//               onClick={(e) => { e.stopPropagation(); onSummary(item); }}
//               style={{
//                 padding: '1px 8px', borderRadius: 20, fontSize: 10, fontWeight: 600,
//                 cursor: 'pointer', fontFamily: "'DM Sans',sans-serif",
//                 border: `1px solid ${C.teal}`,
//                 background: hovered ? C.tealLt : 'transparent',
//                 color: C.teal, transition: 'all .15s',
//                 display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0,
//               }}
//             >
//               AI Summary
//             </button>
//           )}
//           {item.link && (
//             <a
//               href={item.link} target="_blank" rel="noopener noreferrer"
//               onClick={e => e.stopPropagation()}
//               style={{
//                 padding: '1px 8px', borderRadius: 20, fontSize: 10, fontWeight: 600,
//                 fontFamily: "'DM Sans',sans-serif", border: `1px solid ${C.border}`,
//                 background: 'transparent', color: C.slate, textDecoration: 'none',
//                 display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0,
//               }}
//             >
//               <LinkOutlined style={{ fontSize: 9 }} /> Read
//             </a>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }

// // ─── Auto-scrolling news list ─────────────────────────────────────────────
// const VISIBLE_ROWS = 5;
// const SPEED        = 0.28;

// function NewsFeed({ items, onSummary }) {
//   const scrollRef  = useRef(null);
//   const pxRef      = useRef(0);
//   const pausedRef  = useRef(false);
//   const rafRef     = useRef(null);

//   const needsScroll = items.length > VISIBLE_ROWS;
//   const looped = needsScroll ? [...items, ...items, ...items] : items;
//   const oneH   = items.length * NEWS_ROW_H;

//   useEffect(() => {
//     pxRef.current = 0;
//     if (scrollRef.current) scrollRef.current.style.transform = 'translateY(0)';
//     if (rafRef.current) cancelAnimationFrame(rafRef.current);
//     if (!needsScroll) return;

//     const tick = () => {
//       if (!pausedRef.current && scrollRef.current) {
//         pxRef.current += SPEED;
//         if (pxRef.current >= oneH) pxRef.current -= oneH;
//         scrollRef.current.style.transform = `translateY(-${pxRef.current}px)`;
//       }
//       rafRef.current = requestAnimationFrame(tick);
//     };
//     rafRef.current = requestAnimationFrame(tick);
//     return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
//   }, [items.length, needsScroll, oneH]);

//   const viewH = VISIBLE_ROWS * NEWS_ROW_H;

//   if (items.length === 0) {
//     return (
//       <div style={{ padding: '20px', textAlign: 'center', color: C.slate, fontSize: 13 }}>
//         No news found for this category.
//       </div>
//     );
//   }

//   return (
//     <div
//       style={{ height: viewH, overflow: 'hidden', position: 'relative' }}
//       onMouseEnter={() => { pausedRef.current = true; }}
//       onMouseLeave={() => { pausedRef.current = false; }}
//     >
//       <div ref={scrollRef} style={{ willChange: 'transform' }}>
//         {looped.map((item, i) => (
//           <NewsRow key={`${i}-${item.title}`} item={item} onSummary={onSummary} />
//         ))}
//       </div>
//     </div>
//   );
// }

// // ─── Due Date Row ─────────────────────────────────────────────────────────
// function DueRow({ item }) {
//   const days   = daysUntil(item.date);
//   const urgent = days >= 0 && days <= 3;
//   const past   = days < 0;
//   const [day, mon] = item.date.split(' ');
//   const tag = getTagStyle(item.category);

//   return (
//     <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 8px', margin: '0 -8px', borderRadius: 9, background: urgent ? '#fff8f8' : 'transparent', borderBottom: `1px solid ${C.border}`, opacity: past ? 0.55 : 1 }}>
//       <div style={{ minWidth: 44, textAlign: 'center', padding: '4px 5px', borderRadius: 8, flexShrink: 0, background: urgent ? '#fee2e2' : past ? '#f8fafc' : '#f1f5f9', border: `1px solid ${urgent ? 'rgba(220,38,38,.25)' : C.border}` }}>
//         <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 18, fontWeight: 800, lineHeight: 1, color: urgent ? C.red : past ? '#94a3b8' : C.navyDk }}>{day}</div>
//         <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2, color: urgent ? C.red : C.slate }}>{mon}</div>
//       </div>
//       <div style={{ flex: 1, fontFamily: "'DM Sans',sans-serif" }}>
//         <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4, flexWrap: 'wrap' }}>
//           {item.category && (
//             <span style={{ padding: '1px 8px', borderRadius: 20, background: tag.bg, color: tag.color, fontSize: 10, fontWeight: 700 }}>{item.category}</span>
//           )}
//           {item.period && (
//             <span style={{ padding: '1px 7px', borderRadius: 20, background: '#f1f5f9', color: C.slate, fontSize: 10, fontWeight: 500, border: `1px solid ${C.border}` }}>{item.period}</span>
//           )}
//         </div>
//         <div style={{ fontSize: 13, lineHeight: 1.5, color: past ? C.slate : C.navyDk }}>{item.desc}</div>
//         {urgent && (
//           <div style={{ marginTop: 4, fontSize: 10, fontWeight: 700, color: days === 0 ? C.red : C.amber, display: 'flex', alignItems: 'center', gap: 4 }}>
//             <ExclamationCircleOutlined style={{ fontSize: 10 }} />
//             {days === 0 ? 'Due today' : `${days} day${days > 1 ? 's' : ''} left`}
//           </div>
//         )}
//         {past && <div style={{ marginTop: 3, fontSize: 10, color: '#94a3b8' }}>{Math.abs(days)} day{Math.abs(days) > 1 ? 's' : ''} ago</div>}
//       </div>
//     </div>
//   );
// }

// function SectionHeader({ title, icon, accent }) {
//   return (
//     <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
//       <div style={{ width: 34, height: 34, borderRadius: 9, background: accent + '18', color: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>{icon}</div>
//       <span style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 14, color: C.navyDk }}>{title}</span>
//     </div>
//   );
// }

// // ─── Skeleton loader for stale-while-revalidate ───────────────────────────
// function FeedSkeleton() {
//   return (
//     <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
//       {[1,2,3,4,5].map(i => (
//         <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, height: NEWS_ROW_H, borderBottom: `1px solid ${C.border}`, padding: '0 10px', margin: '0 -10px', boxSizing: 'border-box' }}>
//           <div style={{ width: 56, height: 20, borderRadius: 20, background: '#e2e8f0', flexShrink: 0, marginTop: 14, animation: 'shimmer 1.4s infinite', backgroundSize: '400px 100%', backgroundImage: 'linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)' }} />
//           <div style={{ flex: 1, paddingTop: 12 }}>
//             <div style={{ height: 12, borderRadius: 6, background: '#e2e8f0', marginBottom: 6, animation: 'shimmer 1.4s infinite', backgroundSize: '400px 100%', backgroundImage: 'linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)' }} />
//             <div style={{ height: 12, borderRadius: 6, background: '#e2e8f0', width: '70%', animation: 'shimmer 1.4s infinite', backgroundSize: '400px 100%', backgroundImage: 'linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)' }} />
//           </div>
//         </div>
//       ))}
//     </div>
//   );
// }

// // ─── Main Component ───────────────────────────────────────────────────────
// export default function CKPSCAFeed() {
//   const [tab, setTab]                   = useState('news');
//   const [news, setNews]                 = useState(() => FEED_CACHE.data?.news || []);
//   const [due, setDue]                   = useState(() => FEED_CACHE.data?.due  || []);

//   // If cache is fresh, start as not loading. Otherwise start loading.
//   const [loading, setLoading]           = useState(!isFeedFresh());
//   // Background refresh flag — shows subtle indicator without blocking UI
//   const [refreshing, setRefreshing]     = useState(false);
//   const [error, setError]               = useState(null);
//   const [lastUpdated, setLastUpdated]   = useState(() => FEED_CACHE.data ? new Date(FEED_CACHE.ts) : null);
//   const [newsCategory, setNewsCategory] = useState('All');
//   const [summaryItem, setSummaryItem]   = useState(null);

//   const CURRENT_MON = new Date().toLocaleString('en-US', { month: 'short' });
//   const [activeMon, setActiveMon] = useState(CURRENT_MON);
//   const [dueCat, setDueCat]       = useState('All');

//   const fetchData = useCallback(async (isBackground = false) => {
//     if (isBackground) {
//       setRefreshing(true);
//     } else {
//       setLoading(true);
//       setError(null);
//     }
//     try {
//       const res = await api.get('/compliance_tracker/ckpsca-feed/');
//       const newNews = res.data.news || [];
//       const newDue  = res.data.due  || [];
//       setNews(newNews);
//       setDue(newDue);
//       const now = new Date();
//       setLastUpdated(now);
//       // Update module-level cache
//       FEED_CACHE.data = { news: newNews, due: newDue };
//       FEED_CACHE.ts   = now.getTime();
//     } catch (err) {
//       if (!isBackground) setError(err.message);
//       // On background refresh failure, silently keep stale data
//     } finally {
//       setLoading(false);
//       setRefreshing(false);
//     }
//   }, []);

//   useEffect(() => {
//     if (isFeedFresh()) {
//       // Cache is fresh — serve immediately, refresh silently in background
//       // after a short delay so the UI paints first
//       const t = setTimeout(() => fetchData(true), 800);
//       return () => clearTimeout(t);
//     } else {
//       // Cache is stale or empty — full load
//       fetchData(false);
//     }
//   }, [fetchData]);

//   const newsCategories = ['All', ...Object.keys(CATEGORIES).filter(k => k !== 'All' && k !== 'General' && news.some(n => n.category === k))];
//   const filteredNews   = newsCategory === 'All' ? news : news.filter(n => n.category === newsCategory);

//   const MONTH_ORDER  = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
//   const months       = ['All', ...MONTH_ORDER.filter(m => due.some(d => d.date.includes(m)))];
//   const filteredDue  = due.filter(d => activeMon === 'All' || d.date.split(' ')[1] === activeMon).filter(d => dueCat === 'All' || d.category === dueCat);
//   const urgentCount  = due.filter(d => { const x = daysUntil(d.date); return x >= 0 && x <= 3; }).length;

//   const tabStyle  = (active) => ({ padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", border: `1.5px solid ${active ? C.teal : C.border}`, background: active ? C.tealLt : 'transparent', color: active ? C.teal : C.slate, transition: 'all .15s', display: 'flex', alignItems: 'center', gap: 5 });
//   const pillStyle = (active, color) => ({ padding: '3px 11px', borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", transition: 'all .15s', border: `1px solid ${active ? color : C.border}`, background: active ? color + '18' : 'transparent', color: active ? color : C.slate });

//   return (
//     <>
//       <div style={{ fontSize: 11, fontWeight: 700, color: C.slate, textTransform: 'uppercase', letterSpacing: '.09em', marginBottom: 12, fontFamily: "'Sora',sans-serif" }}>Latest Updates</div>
//       <div className="db-box db-fade" style={{ animationDelay: '500ms', marginBottom: 24 }}>

//         {/* Header */}
//         <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
//           <SectionHeader title="Daily News & Compliance Calendar" icon={<BellOutlined />} accent={C.navy} />
//           <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
//             <span style={{ fontSize: 11, color: C.slate, fontFamily: "'DM Sans',sans-serif" }}>
//               {loading ? (
//                 <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
//                   <span style={{ width: 7, height: 7, borderRadius: '50%', display: 'inline-block', background: C.amber, animation: 'tickPulse 1s infinite' }} /> Loading...
//                 </span>
//               ) : refreshing ? (
//                 <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
//                   <span style={{ width: 7, height: 7, borderRadius: '50%', display: 'inline-block', background: C.amber, animation: 'tickPulse 1s infinite' }} /> Updating...
//                 </span>
//               ) : error ? (
//                 <span style={{ color: C.red }}>Failed to load</span>
//               ) : lastUpdated ? (
//                 <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
//                   <span style={{ width: 7, height: 7, borderRadius: '50%', display: 'inline-block', background: C.green }} />
//                   {lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
//                 </span>
//               ) : null}
//             </span>
//             <button
//               onClick={() => fetchData(false)}
//               style={{ background: 'none', border: `1px solid ${C.border}`, borderRadius: 7, padding: '4px 10px', cursor: 'pointer', fontSize: 11, color: C.slate, fontFamily: "'DM Sans',sans-serif", display: 'flex', alignItems: 'center', gap: 5 }}
//               onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
//               onMouseLeave={e => e.currentTarget.style.background = 'none'}
//             >
//               <ReloadOutlined style={{ fontSize: 10 }} /> Refresh
//             </button>
//           </div>
//         </div>

//         {/* Tabs */}
//         <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
//           <button style={tabStyle(tab === 'news')} onClick={() => setTab('news')}>
//             <BellOutlined style={{ fontSize: 11 }} /> Latest News
//             {!loading && filteredNews.length > 0 && (
//               <span style={{ background: tab === 'news' ? C.teal : C.border, color: tab === 'news' ? '#fff' : C.slate, borderRadius: 20, padding: '1px 7px', fontSize: 10, fontWeight: 700 }}>
//                 {filteredNews.length}
//               </span>
//             )}
//           </button>
//           <button style={tabStyle(tab === 'due')} onClick={() => setTab('due')}>
//             <CalendarOutlined style={{ fontSize: 11 }} /> Due Dates
//             {!loading && urgentCount > 0 && (
//               <span style={{ background: C.red, color: '#fff', borderRadius: 20, padding: '1px 7px', fontSize: 10, fontWeight: 700 }}>
//                 {urgentCount} urgent
//               </span>
//             )}
//           </button>
//         </div>

//         {/* Body */}
//         {loading ? (
//           /* First-time load — show skeleton so layout doesn't jump */
//           <FeedSkeleton />
//         ) : error ? (
//           <div style={{ padding: '20px', textAlign: 'center', color: C.slate, fontSize: 13, fontFamily: "'DM Sans',sans-serif" }}>
//             <ExclamationCircleOutlined style={{ fontSize: 24, color: C.red, display: 'block', marginBottom: 8 }} />
//             Could not load data<br />
//             <button onClick={() => fetchData(false)} style={{ marginTop: 10, padding: '6px 16px', borderRadius: 8, cursor: 'pointer', border: `1.5px solid ${C.teal}`, background: C.tealLt, color: C.teal, fontSize: 12, fontWeight: 600, fontFamily: "'DM Sans',sans-serif" }}>Retry</button>
//           </div>
//         ) : tab === 'news' ? (
//           <>
//             {/* Category filter pills */}
//             <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12, paddingBottom: 12, borderBottom: `1px solid ${C.border}` }}>
//               <FilterOutlined style={{ fontSize: 11, color: C.slate }} />
//               <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
//                 {newsCategories.map(cat => (
//                   <button key={cat} onClick={() => setNewsCategory(cat)} style={pillStyle(newsCategory === cat, CATEGORIES[cat]?.color || C.navy)}>
//                     {cat}
//                   </button>
//                 ))}
//               </div>
//             </div>
//             <NewsFeed items={filteredNews} onSummary={setSummaryItem} />
//           </>
//         ) : (
//           <>
//             <div style={{ paddingBottom: 12, marginBottom: 4, borderBottom: `1px solid ${C.border}` }}>
//               <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
//                 <CalendarOutlined style={{ fontSize: 11, color: C.slate }} />
//                 <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
//                   {months.map(m => (
//                     <button key={m} onClick={() => setActiveMon(m)} style={pillStyle(activeMon === m, C.navy)}>{m}</button>
//                   ))}
//                 </div>
//               </div>
//               <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
//                 <FilterOutlined style={{ fontSize: 11, color: C.slate }} />
//                 <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
//                   {DUE_CATEGORIES.map(cat => (
//                     <button key={cat} onClick={() => setDueCat(cat)} style={pillStyle(dueCat === cat, CATEGORIES[cat]?.color || C.navy)}>{cat}</button>
//                   ))}
//                 </div>
//               </div>
//             </div>
//             <div style={{ fontSize: 11, color: C.slate, marginBottom: 8, fontFamily: "'DM Sans',sans-serif" }}>
//               {filteredDue.length} due date{filteredDue.length !== 1 ? 's' : ''}{activeMon !== 'All' ? ` in ${activeMon}` : ''}{dueCat !== 'All' ? ` - ${dueCat}` : ''}
//             </div>
//             <div style={{ maxHeight: 420, overflowY: 'auto' }}>
//               {filteredDue.length === 0 ? (
//                 <div style={{ padding: '20px', textAlign: 'center', fontSize: 13, color: C.slate, fontFamily: "'DM Sans',sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
//                   <CheckCircleOutlined style={{ color: C.green }} /> No due dates for this filter.
//                 </div>
//               ) : filteredDue.map((item, i) => <DueRow key={i} item={item} />)}
//             </div>
//           </>
//         )}
//       </div>

//       {summaryItem && (
//         <SummaryModal item={summaryItem} onClose={() => setSummaryItem(null)} />
//       )}
//     </>
//   );
// }

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  CalendarOutlined, ArrowRightOutlined, ReloadOutlined,
  CheckCircleOutlined, ExclamationCircleOutlined,
  BellOutlined, LinkOutlined, FilterOutlined,
} from '@ant-design/icons';
import { api } from '../services/api';

const C = {
  navy:'#023C6C', navyDk:'#011f3a', teal:'#0891b2', tealLt:'#e0f2f9',
  amber:'#d97706', amberLt:'#fef3c7', green:'#059669', greenLt:'#d1fae5',
  red:'#dc2626', redLt:'#fee2e2', purple:'#7c3aed', purpleLt:'#ede9fe',
  slate:'#64748b', border:'#e2e8f0', pink:'#db2777', pinkLt:'#fce7f3',
  indigo:'#4f46e5', indigoLt:'#eef2ff', cyan:'#0e7490', cyanLt:'#cffafe',
};

const CATEGORIES = {
  'All':              { color: C.navy,   bg: '#e0eaf4' },
  'GST':              { color: C.green,  bg: C.greenLt  },
  'Income Tax':       { color: C.teal,   bg: C.tealLt   },
  'Corporate':        { color: C.amber,  bg: C.amberLt  },
  'Audit & Accounts': { color: C.purple, bg: C.purpleLt },
  'Finance & FEMA':   { color: C.indigo, bg: C.indigoLt },
  'SEBI':             { color: C.pink,   bg: C.pinkLt   },
  'Customs':          { color: C.cyan,   bg: C.cyanLt   },
  'Labour & PF':      { color: C.slate,  bg: '#f1f5f9'  },
  'General':          { color: C.slate,  bg: '#f1f5f9'  },
};

const DUE_CATEGORIES = ['All', 'GST', 'Income Tax', 'Corporate', 'Audit & Accounts', 'Labour & PF'];
const getTagStyle = (category = '') => CATEGORIES[category] || CATEGORIES['General'];

const daysUntil = (dateStr) => {
  try {
    const [day, mon, yr] = dateStr.split(' ');
    return Math.ceil((new Date(`${mon} ${day} 20${yr}`) - new Date()) / 86400000);
  } catch { return 999; }
};

/* ─── Module-level cache — survives re-mounts and soft navigations ─── */
const FEED_TTL        = 5 * 60 * 1000; // 5 minutes
const SESSION_KEY     = 'ckpsca_feed_cache';

// In-memory reference so same-session navigations skip sessionStorage reads
const FEED_CACHE = { data: null, ts: 0 };

// Read once from sessionStorage into memory on module load (survives page refresh)
try {
  const raw = sessionStorage.getItem(SESSION_KEY);
  if (raw) {
    const parsed = JSON.parse(raw);
    if (parsed?.ts && parsed?.data) {
      FEED_CACHE.data = parsed.data;
      FEED_CACHE.ts   = parsed.ts;
    }
  }
} catch { /* sessionStorage unavailable — gracefully fall back to fetch */ }

const isFeedFresh = () => FEED_CACHE.data !== null && Date.now() - FEED_CACHE.ts < FEED_TTL;

const saveFeedCache = (news, due, ts) => {
  FEED_CACHE.data = { news, due };
  FEED_CACHE.ts   = ts;
  try { sessionStorage.setItem(SESSION_KEY, JSON.stringify({ data: { news, due }, ts })); }
  catch { /* quota exceeded or private mode — ignore */ }
};

// ─── Summary Modal ────────────────────────────────────────────────────────
function SummaryModal({ item, onClose }) {
  const [loading, setLoading] = useState(true);
  const [keyPoints, setKeyPoints] = useState([]);
  const [summary, setSummary] = useState('');
  const [error, setError] = useState(null);
  const tag = getTagStyle(item.category);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.post('/compliance_tracker/article-summary/', {
          title:    item.title,
          category: item.category,
          source:   item.source,
          date:     item.date,
          link:     item.link,
        });
        setKeyPoints(res.data.key_points || []);
        setSummary(res.data.summary || '');
      } catch {
        setError('Could not generate summary. Please read the full article.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [item.title, item.category, item.source, item.date]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(1,31,58,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff', borderRadius: 16, width: '100%', maxWidth: 560,
          maxHeight: '82vh', overflowY: 'auto',
          boxShadow: '0 24px 60px rgba(1,31,58,0.2)',
          fontFamily: "'DM Sans',sans-serif",
        }}
      >
        <div style={{
          padding: '18px 20px 14px', borderBottom: `1px solid ${C.border}`,
          position: 'sticky', top: 0, background: '#fff', zIndex: 1,
          borderRadius: '16px 16px 0 0',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ padding: '2px 9px', borderRadius: 20, background: tag.bg, color: tag.color, fontSize: 10, fontWeight: 700 }}>
              {item.category}
            </span>
            <button
              onClick={onClose}
              style={{ background: '#f1f5f9', border: 'none', borderRadius: 8, width: 28, height: 28, cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.slate }}
            >x</button>
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, color: C.navyDk, lineHeight: 1.45 }}>{item.title}</div>
          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 5 }}>{item.date} &middot; {item.source}</div>
        </div>
        <div style={{ padding: '18px 20px 20px' }}>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '30px 0' }}>
              <div style={{ display: 'flex', gap: 6 }}>
                {[0,1,2].map(i => (
                  <span key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: C.teal, display: 'inline-block', animation: 'tickPulse 1.2s ease-in-out infinite', animationDelay: `${i * 0.2}s` }} />
                ))}
              </div>
              <div style={{ fontSize: 13, color: C.slate }}>Generating AI summary...</div>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>This takes a few seconds</div>
            </div>
          ) : error ? (
            <div style={{ fontSize: 13, color: C.red, padding: '16px 0', textAlign: 'center' }}>{error}</div>
          ) : (
            <>
              {keyPoints.length > 0 && (
                <div style={{ marginBottom: 18 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: C.slate, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>Key points</div>
                  {keyPoints.map((pt, i) => (
                    <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 9, alignItems: 'flex-start' }}>
                      <span style={{ width: 20, height: 20, borderRadius: '50%', flexShrink: 0, background: C.tealLt, color: C.teal, fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 1 }}>{i + 1}</span>
                      <span style={{ fontSize: 13, lineHeight: 1.55, color: C.navyDk }}>{pt}</span>
                    </div>
                  ))}
                </div>
              )}
              {summary && (
                <div style={{ marginBottom: 18 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: C.slate, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Summary</div>
                  <div style={{ fontSize: 13, lineHeight: 1.7, color: '#374151', background: '#f8fafc', borderRadius: 10, padding: '12px 14px', borderLeft: `3px solid ${C.teal}` }}>
                    {summary}
                  </div>
                </div>
              )}
            </>
          )}
          <a
            href={item.link} target="_blank" rel="noopener noreferrer"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px 16px', borderRadius: 9, marginTop: 8, background: C.navy, color: '#fff', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}
          >
            Read full article <ArrowRightOutlined style={{ fontSize: 11 }} />
          </a>
        </div>
      </div>
    </div>
  );
}

// ─── News Row — fixed height for smooth scroll ────────────────────────────
const NEWS_ROW_H = 62;

function NewsRow({ item, onSummary }) {
  const [hovered, setHovered] = useState(false);
  const tag = getTagStyle(item.category);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'flex-start', gap: 10,
        padding: '0 10px', margin: '0 -10px',
        height: NEWS_ROW_H, boxSizing: 'border-box',
        borderBottom: `1px solid ${C.border}`,
        background: hovered ? '#f8fafc' : 'transparent',
        transition: 'background .12s',
        overflow: 'hidden',
      }}
    >
      <span style={{
        padding: '2px 9px', borderRadius: 20, flexShrink: 0, marginTop: 14,
        background: tag.bg, color: tag.color,
        fontSize: 10, fontWeight: 700, fontFamily: "'DM Sans',sans-serif", whiteSpace: 'nowrap',
      }}>
        {item.category || 'General'}
      </span>
      <div style={{ flex: 1, minWidth: 0, paddingTop: 11 }}>
        <div style={{
          fontSize: 12, lineHeight: 1.4, color: C.navyDk,
          fontFamily: "'DM Sans',sans-serif",
          overflow: 'hidden', display: '-webkit-box',
          WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
        }}>
          {item.title}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 5, flexWrap: 'nowrap' }}>
          <span style={{ fontSize: 10, color: '#94a3b8', fontFamily: "'DM Sans',sans-serif", whiteSpace: 'nowrap' }}>{item.date}</span>
          {item.source && (
            <span style={{ fontSize: 10, color: C.slate, background: '#f1f5f9', padding: '1px 5px', borderRadius: 4, fontFamily: "'DM Sans',sans-serif", whiteSpace: 'nowrap' }}>{item.source}</span>
          )}
          {item.link && (
            <button
              onClick={(e) => { e.stopPropagation(); onSummary(item); }}
              style={{
                padding: '1px 8px', borderRadius: 20, fontSize: 10, fontWeight: 600,
                cursor: 'pointer', fontFamily: "'DM Sans',sans-serif",
                border: `1px solid ${C.teal}`,
                background: hovered ? C.tealLt : 'transparent',
                color: C.teal, transition: 'all .15s',
                display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0,
              }}
            >
              AI Summary
            </button>
          )}
          {item.link && (
            <a
              href={item.link} target="_blank" rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              style={{
                padding: '1px 8px', borderRadius: 20, fontSize: 10, fontWeight: 600,
                fontFamily: "'DM Sans',sans-serif", border: `1px solid ${C.border}`,
                background: 'transparent', color: C.slate, textDecoration: 'none',
                display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0,
              }}
            >
              <LinkOutlined style={{ fontSize: 9 }} /> Read
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Auto-scrolling news list ─────────────────────────────────────────────
const VISIBLE_ROWS = 5;
const SPEED        = 0.28;

function NewsFeed({ items, onSummary }) {
  const scrollRef  = useRef(null);
  const pxRef      = useRef(0);
  const pausedRef  = useRef(false);
  const rafRef     = useRef(null);

  const needsScroll = items.length > VISIBLE_ROWS;
  const looped = needsScroll ? [...items, ...items, ...items] : items;
  const oneH   = items.length * NEWS_ROW_H;

  useEffect(() => {
    pxRef.current = 0;
    if (scrollRef.current) scrollRef.current.style.transform = 'translateY(0)';
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (!needsScroll) return;

    const tick = () => {
      if (!pausedRef.current && scrollRef.current) {
        pxRef.current += SPEED;
        if (pxRef.current >= oneH) pxRef.current -= oneH;
        scrollRef.current.style.transform = `translateY(-${pxRef.current}px)`;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [items.length, needsScroll, oneH]);

  const viewH = VISIBLE_ROWS * NEWS_ROW_H;

  if (items.length === 0) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: C.slate, fontSize: 13 }}>
        No news found for this category.
      </div>
    );
  }

  return (
    <div
      style={{ height: viewH, overflow: 'hidden', position: 'relative' }}
      onMouseEnter={() => { pausedRef.current = true; }}
      onMouseLeave={() => { pausedRef.current = false; }}
    >
      <div ref={scrollRef} style={{ willChange: 'transform' }}>
        {looped.map((item, i) => (
          <NewsRow key={`${i}-${item.title}`} item={item} onSummary={onSummary} />
        ))}
      </div>
    </div>
  );
}

// ─── Due Date Row ─────────────────────────────────────────────────────────
function DueRow({ item }) {
  const days   = daysUntil(item.date);
  const urgent = days >= 0 && days <= 3;
  const past   = days < 0;
  const [day, mon] = item.date.split(' ');
  const tag = getTagStyle(item.category);

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 8px', margin: '0 -8px', borderRadius: 9, background: urgent ? '#fff8f8' : 'transparent', borderBottom: `1px solid ${C.border}`, opacity: past ? 0.55 : 1 }}>
      <div style={{ minWidth: 44, textAlign: 'center', padding: '4px 5px', borderRadius: 8, flexShrink: 0, background: urgent ? '#fee2e2' : past ? '#f8fafc' : '#f1f5f9', border: `1px solid ${urgent ? 'rgba(220,38,38,.25)' : C.border}` }}>
        <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 18, fontWeight: 800, lineHeight: 1, color: urgent ? C.red : past ? '#94a3b8' : C.navyDk }}>{day}</div>
        <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2, color: urgent ? C.red : C.slate }}>{mon}</div>
      </div>
      <div style={{ flex: 1, fontFamily: "'DM Sans',sans-serif" }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4, flexWrap: 'wrap' }}>
          {item.category && (
            <span style={{ padding: '1px 8px', borderRadius: 20, background: tag.bg, color: tag.color, fontSize: 10, fontWeight: 700 }}>{item.category}</span>
          )}
          {item.period && (
            <span style={{ padding: '1px 7px', borderRadius: 20, background: '#f1f5f9', color: C.slate, fontSize: 10, fontWeight: 500, border: `1px solid ${C.border}` }}>{item.period}</span>
          )}
        </div>
        <div style={{ fontSize: 13, lineHeight: 1.5, color: past ? C.slate : C.navyDk }}>{item.desc}</div>
        {urgent && (
          <div style={{ marginTop: 4, fontSize: 10, fontWeight: 700, color: days === 0 ? C.red : C.amber, display: 'flex', alignItems: 'center', gap: 4 }}>
            <ExclamationCircleOutlined style={{ fontSize: 10 }} />
            {days === 0 ? 'Due today' : `${days} day${days > 1 ? 's' : ''} left`}
          </div>
        )}
        {past && <div style={{ marginTop: 3, fontSize: 10, color: '#94a3b8' }}>{Math.abs(days)} day{Math.abs(days) > 1 ? 's' : ''} ago</div>}
      </div>
    </div>
  );
}

function SectionHeader({ title, icon, accent }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
      <div style={{ width: 34, height: 34, borderRadius: 9, background: accent + '18', color: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>{icon}</div>
      <span style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 14, color: C.navyDk }}>{title}</span>
    </div>
  );
}

// ─── Skeleton loader for stale-while-revalidate ───────────────────────────
function FeedSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {[1,2,3,4,5].map(i => (
        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, height: NEWS_ROW_H, borderBottom: `1px solid ${C.border}`, padding: '0 10px', margin: '0 -10px', boxSizing: 'border-box' }}>
          <div style={{ width: 56, height: 20, borderRadius: 20, background: '#e2e8f0', flexShrink: 0, marginTop: 14, animation: 'shimmer 1.4s infinite', backgroundSize: '400px 100%', backgroundImage: 'linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)' }} />
          <div style={{ flex: 1, paddingTop: 12 }}>
            <div style={{ height: 12, borderRadius: 6, background: '#e2e8f0', marginBottom: 6, animation: 'shimmer 1.4s infinite', backgroundSize: '400px 100%', backgroundImage: 'linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)' }} />
            <div style={{ height: 12, borderRadius: 6, background: '#e2e8f0', width: '70%', animation: 'shimmer 1.4s infinite', backgroundSize: '400px 100%', backgroundImage: 'linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)' }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────
export default function CKPSCAFeed() {
  const [tab, setTab]                   = useState('news');
  const [news, setNews]                 = useState(() => FEED_CACHE.data?.news || []);
  const [due, setDue]                   = useState(() => FEED_CACHE.data?.due  || []);

  // If cache is fresh, start as not loading. Otherwise start loading.
  const [loading, setLoading]           = useState(!isFeedFresh());
  // Background refresh flag — shows subtle indicator without blocking UI
  const [refreshing, setRefreshing]     = useState(false);
  const [error, setError]               = useState(null);
  const [lastUpdated, setLastUpdated]   = useState(() => FEED_CACHE.data ? new Date(FEED_CACHE.ts) : null);
  const [newsCategory, setNewsCategory] = useState('All');
  const [summaryItem, setSummaryItem]   = useState(null);

  const CURRENT_MON = new Date().toLocaleString('en-US', { month: 'short' });
  const [activeMon, setActiveMon] = useState(CURRENT_MON);
  const [dueCat, setDueCat]       = useState('All');

  const fetchData = useCallback(async (isBackground = false) => {
    if (isBackground) {
      setRefreshing(true);
    } else {
      setLoading(true);
      setError(null);
    }
    try {
      const res = await api.get('/compliance_tracker/ckpsca-feed/');
      const newNews = res.data.news || [];
      const newDue  = res.data.due  || [];
      setNews(newNews);
      setDue(newDue);
      const now = new Date();
      setLastUpdated(now);
      // Persist to sessionStorage so page refresh is instant
      saveFeedCache(newNews, newDue, now.getTime());
    } catch (err) {
      if (!isBackground) setError(err.message);
      // On background refresh failure, silently keep stale data
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (isFeedFresh()) {
      // Cache is fresh — serve immediately, refresh silently in background
      // after a short delay so the UI paints first
      const t = setTimeout(() => fetchData(true), 800);
      return () => clearTimeout(t);
    } else {
      // Cache is stale or empty — full load
      fetchData(false);
    }
  }, [fetchData]);

  const newsCategories = ['All', ...Object.keys(CATEGORIES).filter(k => k !== 'All' && k !== 'General' && news.some(n => n.category === k))];
  const filteredNews   = newsCategory === 'All' ? news : news.filter(n => n.category === newsCategory);

  const MONTH_ORDER  = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const months       = ['All', ...MONTH_ORDER.filter(m => due.some(d => d.date.includes(m)))];
  const filteredDue  = due.filter(d => activeMon === 'All' || d.date.split(' ')[1] === activeMon).filter(d => dueCat === 'All' || d.category === dueCat);
  const urgentCount  = due.filter(d => { const x = daysUntil(d.date); return x >= 0 && x <= 3; }).length;

  const tabStyle  = (active) => ({ padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", border: `1.5px solid ${active ? C.teal : C.border}`, background: active ? C.tealLt : 'transparent', color: active ? C.teal : C.slate, transition: 'all .15s', display: 'flex', alignItems: 'center', gap: 5 });
  const pillStyle = (active, color) => ({ padding: '3px 11px', borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", transition: 'all .15s', border: `1px solid ${active ? color : C.border}`, background: active ? color + '18' : 'transparent', color: active ? color : C.slate });

  return (
    <>
      <div style={{ fontSize: 11, fontWeight: 700, color: C.slate, textTransform: 'uppercase', letterSpacing: '.09em', marginBottom: 12, fontFamily: "'Sora',sans-serif" }}>Latest Updates</div>
      <div className="db-box db-fade" style={{ animationDelay: '500ms', marginBottom: 24 }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <SectionHeader title="Daily News & Compliance Calendar" icon={<BellOutlined />} accent={C.navy} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11, color: C.slate, fontFamily: "'DM Sans',sans-serif" }}>
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', display: 'inline-block', background: C.amber, animation: 'tickPulse 1s infinite' }} /> Loading...
                </span>
              ) : refreshing ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', display: 'inline-block', background: C.amber, animation: 'tickPulse 1s infinite' }} /> Updating...
                </span>
              ) : error ? (
                <span style={{ color: C.red }}>Failed to load</span>
              ) : lastUpdated ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', display: 'inline-block', background: C.green }} />
                  {lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                </span>
              ) : null}
            </span>
            <button
              onClick={() => fetchData(false)}
              style={{ background: 'none', border: `1px solid ${C.border}`, borderRadius: 7, padding: '4px 10px', cursor: 'pointer', fontSize: 11, color: C.slate, fontFamily: "'DM Sans',sans-serif", display: 'flex', alignItems: 'center', gap: 5 }}
              onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}
            >
              <ReloadOutlined style={{ fontSize: 10 }} /> Refresh
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <button style={tabStyle(tab === 'news')} onClick={() => setTab('news')}>
            <BellOutlined style={{ fontSize: 11 }} /> Latest News
            {!loading && filteredNews.length > 0 && (
              <span style={{ background: tab === 'news' ? C.teal : C.border, color: tab === 'news' ? '#fff' : C.slate, borderRadius: 20, padding: '1px 7px', fontSize: 10, fontWeight: 700 }}>
                {filteredNews.length}
              </span>
            )}
          </button>
          <button style={tabStyle(tab === 'due')} onClick={() => setTab('due')}>
            <CalendarOutlined style={{ fontSize: 11 }} /> Due Dates
            {!loading && urgentCount > 0 && (
              <span style={{ background: C.red, color: '#fff', borderRadius: 20, padding: '1px 7px', fontSize: 10, fontWeight: 700 }}>
                {urgentCount} urgent
              </span>
            )}
          </button>
        </div>

        {/* Body */}
        {loading ? (
          /* First-time load — show skeleton so layout doesn't jump */
          <FeedSkeleton />
        ) : error ? (
          <div style={{ padding: '20px', textAlign: 'center', color: C.slate, fontSize: 13, fontFamily: "'DM Sans',sans-serif" }}>
            <ExclamationCircleOutlined style={{ fontSize: 24, color: C.red, display: 'block', marginBottom: 8 }} />
            Could not load data<br />
            <button onClick={() => fetchData(false)} style={{ marginTop: 10, padding: '6px 16px', borderRadius: 8, cursor: 'pointer', border: `1.5px solid ${C.teal}`, background: C.tealLt, color: C.teal, fontSize: 12, fontWeight: 600, fontFamily: "'DM Sans',sans-serif" }}>Retry</button>
          </div>
        ) : tab === 'news' ? (
          <>
            {/* Category filter pills */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12, paddingBottom: 12, borderBottom: `1px solid ${C.border}` }}>
              <FilterOutlined style={{ fontSize: 11, color: C.slate }} />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {newsCategories.map(cat => (
                  <button key={cat} onClick={() => setNewsCategory(cat)} style={pillStyle(newsCategory === cat, CATEGORIES[cat]?.color || C.navy)}>
                    {cat}
                  </button>
                ))}
              </div>
            </div>
            <NewsFeed items={filteredNews} onSummary={setSummaryItem} />
          </>
        ) : (
          <>
            <div style={{ paddingBottom: 12, marginBottom: 4, borderBottom: `1px solid ${C.border}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <CalendarOutlined style={{ fontSize: 11, color: C.slate }} />
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  {months.map(m => (
                    <button key={m} onClick={() => setActiveMon(m)} style={pillStyle(activeMon === m, C.navy)}>{m}</button>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <FilterOutlined style={{ fontSize: 11, color: C.slate }} />
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  {DUE_CATEGORIES.map(cat => (
                    <button key={cat} onClick={() => setDueCat(cat)} style={pillStyle(dueCat === cat, CATEGORIES[cat]?.color || C.navy)}>{cat}</button>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ fontSize: 11, color: C.slate, marginBottom: 8, fontFamily: "'DM Sans',sans-serif" }}>
              {filteredDue.length} due date{filteredDue.length !== 1 ? 's' : ''}{activeMon !== 'All' ? ` in ${activeMon}` : ''}{dueCat !== 'All' ? ` - ${dueCat}` : ''}
            </div>
            <div style={{ maxHeight: 420, overflowY: 'auto' }}>
              {filteredDue.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', fontSize: 13, color: C.slate, fontFamily: "'DM Sans',sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <CheckCircleOutlined style={{ color: C.green }} /> No due dates for this filter.
                </div>
              ) : filteredDue.map((item, i) => <DueRow key={i} item={item} />)}
            </div>
          </>
        )}
      </div>

      {summaryItem && (
        <SummaryModal item={summaryItem} onClose={() => setSummaryItem(null)} />
      )}
    </>
  );
}