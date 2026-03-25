'use client';

import React, { useState, useEffect } from 'react';
import 'chart.js/auto';
import { Bar, Doughnut, Line } from 'react-chartjs-2';

export default function FrammerDashboard() {
  
  const [openFilter, setOpenFilter] = useState(null);
  const [filters, setFilters] = useState({
    client: 'All Clients', channel: 'All Channels', language: 'All Languages', type: 'All Types', compare: 'vs Oct–Dec 2024'
  });

  const [dbDropdowns, setDbDropdowns] = useState({
    client: ['Loading DB...'], channel: ['Loading DB...'], language: ['Loading DB...'], type: ['Loading DB...'], compare: ['vs Jul–Sep 2024', 'vs Jan–Mar 2024']
  });

  const [tableTab, setTableTab] = useState('Channel');
  
  const [breakdownTab, setBreakdownTab] = useState('Channel');
  const [breakdownSort, setBreakdownSort] = useState('Published');
  const [breakdownOrder, setBreakdownOrder] = useState('Desc');

  const [hoveredKpi, setHoveredKpi] = useState(null);
  const [hoveredBreakdown, setHoveredBreakdown] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const [tableData, setTableData] = useState({ channel: [], client: [], user: [] });
  
  const [dbChartData, setDbChartData] = useState({
    Client: [], Channel: [], Language: [], 'Input Type': [], 'Output Type': []
  });

  const [isLoadingDB, setIsLoadingDB] = useState(true);

  // DATABASE FETCH
  useEffect(() => {
    async function loadDatabaseFilters() {
      try {
        setIsLoadingDB(true);
        const res = await fetch('/api/dashboard');
        
        if (res.ok) {
          const data = await res.json();
          if (data.dropdowns) {
            setDbDropdowns({
              client: data.dropdowns.clients || [], channel: data.dropdowns.channels || [], language: data.dropdowns.languages || [], type: data.dropdowns.types || [], compare: ['vs Jul–Sep 2024', 'vs Jan–Mar 2024']
            });
          }
          if (data.tableData && data.tableData.channel.length > 0) {
            setTableData(data.tableData);
          }
          if (data.chartData) {
            setDbChartData(data.chartData);
          }
        }
      } catch (error) {
        console.error("Database fetch failed:", error);
      } finally {
        setIsLoadingDB(false);
      }
    }
    loadDatabaseFilters();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => { if (!e.target.closest('.fchip')) setOpenFilter(null); };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleResetFilters = () => {
    setFilters({ client: 'All Clients', channel: 'All Channels', language: 'All Languages', type: 'All Types', compare: 'vs Oct–Dec 2024' });
    setOpenFilter(null);
  };

  const FilterChip = ({ filterKey, label, color }) => {
    const isOpen = openFilter === filterKey;
    const isCompare = filterKey === 'compare';
    const currentVal = filters[filterKey];
    const defaultOpt = isCompare ? 'vs Oct–Dec 2024' : `All ${label}s`;
    const opts = dbDropdowns[filterKey] || [];

    return (
      <div className={`fchip ${isOpen ? 'open' : ''}`} onClick={() => setOpenFilter(isOpen ? null : filterKey)} style={isCompare ? { borderColor: 'rgba(255,45,85,0.35)' } : {}}>
        {!isCompare && <span className="cdot" style={{background: color}}></span>}
        {isCompare && <span style={{color: '#ff2d55', fontSize: '11px', fontWeight: 600}}>Compare:</span>}
        <span className="cv" style={isCompare ? {color: '#ff2d55'} : {}}>{isCompare ? currentVal.replace('Compare: ', '') : currentVal}</span>
        <span className="caret" style={isCompare ? {color: '#ff2d55'} : {}}>▾</span>
        
        <div className="fdrop">
          <div className={`fdrop-item ${currentVal === defaultOpt ? 'selected' : ''}`} onClick={(e) => { e.stopPropagation(); setFilters({ ...filters, [filterKey]: defaultOpt }); setOpenFilter(null); }}>{defaultOpt} <span className="check">✓</span></div>
          {opts.length > 0 && <div className="fdrop-sep"></div>}
          <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
            {isLoadingDB && !isCompare ? (
              <div className="fdrop-item" style={{color: '#8a8c93', cursor: 'wait'}}>Loading DB...</div>
            ) : opts.length === 0 && !isCompare ? (
              <div className="fdrop-item" style={{color: '#ff453a', cursor: 'default'}}>No Data Found in DB</div>
            ) : (
              opts.map(opt => (
                <div key={opt} className={`fdrop-item ${currentVal === opt ? 'selected' : ''}`} onClick={(e) => { e.stopPropagation(); setFilters({ ...filters, [filterKey]: opt }); setOpenFilter(null); }}>{opt} <span className="check">✓</span></div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  };

  const [dim1, setDim1] = useState('Channel');
  const [dim2, setDim2] = useState('Input Type');
  const [chartType, setChartType] = useState('Stacked');

  const dim1Options = ['Channel', 'Language', 'Client'];
  const dim2Options = ['Input Type', 'Output Type'];
  const chartColors = ['#3b6ef8', '#0ea5b0', '#f59e0b', '#8b5cf6', '#e9434a'];

  const activeDim1Data = dbChartData[dim1] || [];
  const activeDim2Data = dbChartData[dim2] || [];

  const labelsDim1 = activeDim1Data.map(d => d.label);
  const labelsDim2 = activeDim2Data.map(d => d.label);
  const totalDim2 = activeDim2Data.reduce((sum, d) => sum + Number(d.value), 0) || 1;

  const dynamicBarData = {
    labels: labelsDim1.length > 0 ? labelsDim1 : ['Loading...'],
    datasets: labelsDim2.length > 0 ? activeDim2Data.map((d2, index) => {
      const dim2Share = Number(d2.value) / totalDim2;
      return {
        label: d2.label,
        data: activeDim1Data.map(d1 => Math.round(Number(d1.value) * dim2Share)),
        backgroundColor: chartColors[index % chartColors.length],
        borderRadius: 3
      };
    }) : [{ data: [], backgroundColor: '#3b6ef8' }]
  };

  const dynamicDonutData = {
    labels: labelsDim2.length > 0 ? labelsDim2 : ['Loading...'],
    datasets: [{
      data: labelsDim2.length > 0 ? activeDim2Data.map(d => Number(d.value)) : [1],
      backgroundColor: chartColors.slice(0, Math.max(labelsDim2.length, 1)),
      borderWidth: 2,
      borderColor: '#111111'
    }]
  };

  const [period, setPeriod] = useState('Month');
  const [showUpload, setShowUpload] = useState(true);
  const [showProcess, setShowProcess] = useState(true);
  const [showPublish, setShowPublish] = useState(true);
  const [trendFilterBy, setTrendFilterBy] = useState('All');

  const trendDataMap = {
    Week: { labels: ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8'], up: [900, 1020, 880, 1100, 1300, 1150, 1400, 1600], pr: [700, 790, 680, 840, 1010, 890, 1090, 1240], pb: [380, 440, 360, 490, 580, 510, 630, 710] },
    Month: { labels: ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'], up: [3800, 4100, 3600, 4400, 4900, 5200], pr: [2900, 3200, 2800, 3400, 3700, 4100], pb: [1600, 1800, 1550, 1950, 2100, 2490] },
    Quarter: { labels: ['Q2-23', 'Q3-23', 'Q4-23', 'Q1-24', 'Q2-24', 'Q3-24'], up: [9800, 10200, 11000, 12500, 13800, 15840], pr: [7600, 7900, 8500, 9600, 10700, 12480], pb: [4200, 4500, 5000, 5600, 6200, 7490] }
  };
  
  const currentTrend = trendDataMap[period];
  const mod = trendFilterBy === 'All' ? 1 : trendFilterBy === 'Client' ? 0.8 : trendFilterBy === 'Channel' ? 0.6 : trendFilterBy === 'Language' ? 0.4 : 0.7;
  const dynamicUp = currentTrend.up.map(v => Math.round(v * mod));
  const dynamicPr = currentTrend.pr.map(v => Math.round(v * mod));
  const dynamicPb = currentTrend.pb.map(v => Math.round(v * mod));

  const totalUp = dynamicUp.reduce((acc, val) => acc + val, 0);
  const totalPr = dynamicPr.reduce((acc, val) => acc + val, 0);
  const totalPb = dynamicPb.reduce((acc, val) => acc + val, 0);

  const procPct = Math.round((totalPr / totalUp) * 100) || 0;
  const pubPct = Math.round((totalPb / totalUp) * 100) || 0;
  const notProc = totalUp - totalPr;
  const notPub = totalPr - totalPb;
  const dynamicDropoffAlert = 100 - procPct;

  const activeTableData = tableData[tableTab.toLowerCase()] || [];
  const maxUploaded = Math.max(...activeTableData.map(d => Number(d.uploaded) || 0), 1);

  const activeBreakdownData = tableData[breakdownTab.toLowerCase()] || [];
  
  const sortedBreakdownData = [...activeBreakdownData].sort((a, b) => {
    const pbA = Number(a.published) || 0;
    const prA = Number(a.processed) || 0;
    const rateA = prA > 0 ? (pbA / prA) : 0;

    const pbB = Number(b.published) || 0;
    const prB = Number(b.processed) || 0;
    const rateB = prB > 0 ? (pbB / prB) : 0;

    let diff = 0;
    if (breakdownSort === 'Rate') {
      diff = rateB - rateA;
    } else if (breakdownSort === 'Processed') {
      diff = prB - prA;
    } else {
      diff = pbB - pbA;
    }

    return breakdownOrder === 'Asc' ? -diff : diff;
  });

  const maxBreakdownPub = Math.max(...activeBreakdownData.map(d => Number(d.published) || 0), 1);
  const maxBreakdownProc = Math.max(...activeBreakdownData.map(d => Number(d.processed) || 0), 1);

  const pubColor = '#10b981';
  const procColor = '#ef4444';
  const rateColor = '#3b6ef8';

  const dbTotalUp = tableData.channel.reduce((sum, d) => sum + (Number(d.uploaded) || 0), 0) || 5200;
  const dbTotalPr = tableData.channel.reduce((sum, d) => sum + (Number(d.processed) || 0), 0) || 4100;
  const dbTotalPb = tableData.channel.reduce((sum, d) => sum + (Number(d.published) || 0), 0) || 2490;

  const kpiPublishRate = dbTotalPr > 0 ? (dbTotalPb / dbTotalPr * 100).toFixed(1) : '58.7';
  const kpiProcessRate = dbTotalUp > 0 ? (dbTotalPr / dbTotalUp * 100).toFixed(1) : '78.8';
  const kpiDropGap = (dbTotalUp - dbTotalPb).toLocaleString();
  const kpiErrorRate = dbTotalUp > 0 ? (100 - (dbTotalPr / dbTotalUp * 100)).toFixed(1) : '6.2';
  const kpiBillable = dbTotalUp > 0 ? Math.min(100, (dbTotalPb / dbTotalUp * 100) + 18.2).toFixed(1) : '91.4';

  const chartOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false }, ticks: { color: '#8a8c93', font: { size: 10 } } }, y: { grid: { color: '#252628' }, ticks: { color: '#8a8c93', font: { size: 10 } } } } };
  
  const isStacked = chartType === 'Stacked';
  const dynamicBarOptions = { 
    ...chartOptions, 
    scales: { 
      x: { stacked: isStacked, grid: { display: false }, ticks: { color: '#8a8c93', font: { size: 10 } } }, 
      y: { stacked: isStacked, grid: { color: '#252628' }, ticks: { color: '#8a8c93', font: { size: 10 } } } 
    } 
  };

  return (
    <>
      <style>{`
        @keyframes slideFromLeft {
          from { width: 0%; }
        }
        .animate-bar {
          animation: slideFromLeft 0.6s ease-out forwards;
        }
      `}</style>

      <nav className="topnav"><div className="logo">FRAMMER AI</div><div className="nav-tabs"><button className="ntab">Overview</button><button className="ntab active">Analysis & Funnel</button><button className="ntab">Channels</button><button className="ntab">Content Mix</button><button className="ntab">Explorer</button></div><div className="nav-right"><div className="date-btn">📅 <span id="dateLabel">Jan – Mar 2025</span> ▾</div></div></nav>

      <div className="filterbar">
        <span className="fl">Filters</span>
        <FilterChip filterKey="client" label="Client" color="#3b6ef8" />
        <FilterChip filterKey="channel" label="Channel" color="#0ea5b0" />
        <FilterChip filterKey="language" label="Language" color="#f59e0b" />
        <FilterChip filterKey="type" label="Type" color="#8b5cf6" />
        <span className="fsep">|</span>
        <FilterChip filterKey="compare" label="Compare" />
        <span className="freset" onClick={handleResetFilters} style={{ marginLeft: 'auto', cursor: 'pointer' }}>↺ Reset</span>
      </div>

      <div className="page-title-row"><h1>Multi-Dimensional Analysis & Publishing Funnel</h1><span className="page-num">Page 2 / 5</span></div>

      <div className="main-grid">
        <div className="card">
          <div className="card-header"><div><div className="card-title">Multi-Dimensional Analysis</div><div className="card-sub">Select two dimensions and a metric to explore</div></div><select className="dim-select" style={{width: '148px'}}><option>Video Count</option></select></div>
          <div className="card-body">
            
            <div className="dim-row">
              <div className="dim-group">
                <div className="dim-label">Dimension 1</div>
                <select className="dim-select" value={dim1} onChange={(e) => setDim1(e.target.value)}>
                  {dim1Options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
              <div className="dim-cross">×</div>
              <div className="dim-group">
                <div className="dim-label">Dimension 2</div>
                <select className="dim-select" value={dim2} onChange={(e) => setDim2(e.target.value)}>
                  {dim2Options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
              <div className="dim-cross">→</div>
              <div className="dim-group">
                <div className="dim-label">Chart</div>
                <select className="dim-select" value={chartType} onChange={(e) => setChartType(e.target.value)}>
                  <option value="Stacked">Stacked</option>
                  <option value="Grouped">Grouped</option>
                </select>
              </div>
            </div>

            <div className="charts-row">
              <div className="chart-box">
                <div className="chart-box-title">{dim1} × {dim2}</div>
                <div className="chart-wrap bar-h"><Bar data={dynamicBarData} options={dynamicBarOptions} /></div>
              </div>
              
              <div className="chart-box">
                <div className="chart-box-title">Share by {dim2}</div>
                <div className="chart-wrap donut-h" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <div style={{ position: 'relative', width: '120px', height: '120px', flexShrink: 0 }}>
                    <Doughnut data={dynamicDonutData} options={{ responsive: true, maintainAspectRatio: false, cutout: '65%', plugins: { legend: { display: false } } }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, overflowY: 'auto', maxHeight: '130px', paddingRight: '5px' }}>
                    {dynamicDonutData.labels.map((label, i) => {
                      const val = dynamicDonutData.datasets[0].data[i] || 0;
                      const pct = Math.round((val / totalDim2) * 100) || 0;
                      const color = dynamicDonutData.datasets[0].backgroundColor[i] || '#8a8c93';
                      return (
                        <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11.5px', color: '#8a8c93', lineHeight: 1 }}>
                          <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: color, flexShrink: 0 }}></span>
                          <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>
                          <span style={{ fontWeight: 600, color: '#fff' }}>{pct}%</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            <div className="inference"><div className="inf-icon">✦</div><div><strong>Key insight:</strong> Top volumes originate from <strong>{labelsDim1[0] || '...'}</strong>, with a massive share dedicated to <strong>{labelsDim2[0] || '...'}</strong>.</div></div>

            <div className="bottom-row" style={{gridTemplateColumns: '1fr', gap: '8px'}}>
              <div className="sub-card">
                
                <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '7px'}}>
                  <div 
                    className="sub-title" 
                    style={{margin: 0, display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', userSelect: 'none'}}
                    onClick={() => setBreakdownOrder(breakdownOrder === 'Desc' ? 'Asc' : 'Desc')}
                    title="Toggle Ascending/Descending Order"
                  >
                    Breakdown <span style={{ fontSize: '13px', color: '#8a8c93' }}>{breakdownOrder === 'Desc' ? '↓' : '↑'}</span>
                  </div>

                  <div style={{display: 'flex', gap: '4px'}}>
                    <span className="sort-lbl" style={{alignSelf: 'center'}}>Sort:</span>
                    <button 
                      className={`spill ${breakdownSort === 'Published' ? 'active' : ''}`} 
                      onClick={() => setBreakdownSort('Published')}
                      style={breakdownSort === 'Published' ? { borderColor: pubColor, color: pubColor, background: 'rgba(16,185,129,0.15)' } : {}}
                    >Published</button>
                    
                    <button 
                      className={`spill ${breakdownSort === 'Processed' ? 'active' : ''}`} 
                      onClick={() => setBreakdownSort('Processed')}
                      style={breakdownSort === 'Processed' ? { borderColor: procColor, color: procColor, background: 'rgba(239,68,68,0.15)' } : {}}
                    >Processed</button>
                    
                    <button 
                      className={`spill ${breakdownSort === 'Rate' ? 'active' : ''}`} 
                      onClick={() => setBreakdownSort('Rate')}
                      style={breakdownSort === 'Rate' ? { borderColor: rateColor, color: rateColor, background: 'rgba(59,110,248,0.15)' } : {}}
                    >Rate</button>
                  </div>
                </div>
                
                <div className="tab-row">
                  <button className={`tbtab ${breakdownTab === 'Channel' ? 'active' : ''}`} onClick={() => setBreakdownTab('Channel')}>Channel</button>
                  <button className={`tbtab ${breakdownTab === 'Client' ? 'active' : ''}`} onClick={() => setBreakdownTab('Client')}>Client</button>
                  <button className={`tbtab ${breakdownTab === 'User' ? 'active' : ''}`} onClick={() => setBreakdownTab('User')}>User</button>
                </div>
                
                <div className="fb-list" key={breakdownTab + breakdownSort + breakdownOrder + filters.client + filters.channel}>
                  {/* 🔴 RESTORED: Only show 5 items in the Breakdown section 🔴 */}
                  {sortedBreakdownData.slice(0, 5).map((row, idx) => {
                    const up = Number(row.uploaded) || 0;
                    const pb = Number(row.published) || 0;
                    const pr = Number(row.processed) || 0;
                    
                    const rate = pr > 0 ? Math.round((pb / pr) * 100) : 0;
                    const isHovered = hoveredBreakdown === idx;

                    return (
                      <div 
                        className="bd-row" 
                        key={idx} 
                        style={{ position: 'relative' }}
                        onMouseEnter={(e) => {
                          setHoveredBreakdown(idx);
                          setTooltipPos({ x: e.clientX, y: e.clientY });
                        }}
                        onMouseLeave={() => setHoveredBreakdown(null)}
                      >
                        {isHovered && (
                          <div style={{
                            position: 'fixed',
                            top: `${tooltipPos.y}px`,
                            left: `${tooltipPos.x + 75}px`,
                            width: '180px',
                            backgroundColor: '#1c1d20',
                            border: '1px solid #252628',
                            borderRadius: '8px',
                            padding: '12px',
                            zIndex: 9999,
                            boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
                            pointerEvents: 'none',
                            transform: 'translateY(-50%)'
                          }}>
                            <div style={{ fontSize: '13px', fontWeight: 600, color: '#fff', marginBottom: '10px' }}>
                              {row.name}
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '6px' }}>
                              <span style={{ color: '#8a8c93' }}>Uploaded</span>
                              <span style={{ color: '#fff', fontWeight: 600 }}>{up.toLocaleString()}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '6px' }}>
                              <span style={{ color: '#8a8c93' }}>Processed</span>
                              <span style={{ color: '#ff453a', fontWeight: 600 }}>{pr.toLocaleString()}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '6px' }}>
                              <span style={{ color: '#8a8c93' }}>Published</span>
                              <span style={{ color: '#32d74b', fontWeight: 600 }}>{pb.toLocaleString()}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '10px' }}>
                              <span style={{ color: '#8a8c93' }}>Publish Rate</span>
                              <span style={{ color: '#3b6ef8', fontWeight: 600 }}>{rate}%</span>
                            </div>
                            <div style={{ width: '100%', height: '4px', backgroundColor: '#2c2d31', borderRadius: '2px', overflow: 'hidden' }}>
                              <div style={{ width: `${rate}%`, backgroundColor: '#3b6ef8', height: '100%' }}></div>
                            </div>
                          </div>
                        )}

                        <div className="bd-top" style={{display:'flex', justifyContent:'space-between'}}>
                          <span className="bd-name" style={{fontSize:'12px', fontWeight:500}}>{row.name}</span>
                          
                          <div className="bd-stats" style={{display:'flex', gap:'8px', fontSize:'11px'}}>
                            {breakdownSort === 'Published' && (
                              <span style={{color: pubColor, fontWeight: 700}}>{pb.toLocaleString()} pub</span>
                            )}
                            {breakdownSort === 'Processed' && (
                              <span style={{color: procColor, fontWeight: 700}}>{pr.toLocaleString()} proc</span>
                            )}
                            {breakdownSort === 'Rate' && (
                              <>
                                <span style={{color: '#5a5c63', fontWeight: 500}}>{pr.toLocaleString()} proc</span>
                                <span style={{color: '#5a5c63', fontWeight: 500}}>{pb.toLocaleString()} pub</span>
                                <span style={{color: rateColor, fontWeight: 700}}>{rate}%</span>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="bd-bar-track" style={{width:'100%', height:'5px', background:'#2c2d31', borderRadius:'3px', display:'flex', marginTop:'3px', overflow: 'hidden'}}>
                          {breakdownSort === 'Published' && (
                            <div className="animate-bar" style={{width: `${(pb / maxBreakdownPub) * 100}%`, background: pubColor, borderRadius: '3px'}}></div>
                          )}
                          {breakdownSort === 'Processed' && (
                            <div className="animate-bar" style={{width: `${(pr / maxBreakdownProc) * 100}%`, background: '#8c3a3a', borderRadius: '3px'}}></div>
                          )}
                          {breakdownSort === 'Rate' && (
                            <>
                              <div className="animate-bar" style={{width: `${rate}%`, background: pubColor, borderTopLeftRadius: '3px', borderBottomLeftRadius: '3px'}}></div>
                              <div className="animate-bar" style={{width: `${100 - rate}%`, background: procColor, opacity: 0.4, borderTopRightRadius: '3px', borderBottomRightRadius: '3px'}}></div>
                            </>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
              <div className="sub-card">
                <div className="sub-title">Performance KPIs</div>
                <div className="kpi-grid" onMouseLeave={() => setHoveredKpi(null)}>
                  {[
                    { label: 'Publish Rate', val: kpiPublishRate, span: '%', change: '↓ 3.1% vs prev', dir: 'dn', sub: 'Processed → Published' },
                    { label: 'Process Rate', val: kpiProcessRate, span: '%', change: '↑ 2.4% vs prev', dir: 'up', sub: 'Uploaded → Processed' },
                    { label: 'Avg Duration', val: '4.2', span: 'min', change: '↑ 0.3 min vs prev', dir: 'up', sub: 'Per published video' },
                    { label: 'Drop Gap', val: kpiDropGap, span: '', change: '↑ 8.4% wider', dir: 'dn', sub: 'Proc − Published count' },
                    { label: 'Error Rate', val: kpiErrorRate, span: '%', change: '↑ 1.1% vs prev', dir: 'dn', sub: 'Of all processed jobs' },
                    { label: 'Billable', val: kpiBillable, span: '%', change: '↑ 0.6% vs prev', dir: 'up', sub: 'Of published videos' }
                  ].map((kpi, idx) => {
                    const isHovered = hoveredKpi === idx;
                    return (
                      <div 
                        key={idx} 
                        className={`kpi-tile tile-${kpi.dir} ${isHovered ? 'kpi-hover' : ''}`}
                        onMouseEnter={() => setHoveredKpi(idx)}
                      >
                        <div className="kt-label">{kpi.label}</div>
                        <div className="kt-val">{kpi.val}<span>{kpi.span}</span></div>
                        <div className={`kt-change ${kpi.dir}`}>{kpi.change}</div>
                        <div className="kt-sub">{kpi.sub}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ══ RIGHT PANEL ══ */}
        <div className="card">
          <div className="card-header"><div><div className="card-title">Publishing Funnel</div><div className="card-sub">Uploaded → Processed → Published trend</div></div></div>
          <div className="card-body">
            
            <div className="funnel-kpis">
              <div className="fkpi" style={{background: '#0b1a10', borderColor: '#1a3d22'}}>
                <div className="fkpi-label">Uploaded</div>
                <div className="fkpi-val" style={{color: '#32d74b'}}>{totalUp.toLocaleString()}</div>
                <div className="fkpi-change up" style={{color: '#32d74b'}}>↑ 14.2%</div>
              </div>
              <div className="fkpi" style={{background: '#0b1a10', borderColor: '#1a3d22'}}>
                <div className="fkpi-label">Processed</div>
                <div className="fkpi-val" style={{color: '#32d74b'}}>{totalPr.toLocaleString()}</div>
                <div className="fkpi-change up" style={{color: '#32d74b'}}>↑ 18.3%</div>
              </div>
              <div className="fkpi" style={{background: '#1a0b0c', borderColor: '#3d1a1c'}}>
                <div className="fkpi-label">Published</div>
                <div className="fkpi-val" style={{color: '#ff453a'}}>{totalPb.toLocaleString()}</div>
                <div className="fkpi-change dn" style={{color: '#ff453a'}}>↓ 3.1%</div>
              </div>
            </div>

            <div className="trend-box">
              <div className="trend-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <div className="trend-title" style={{ fontSize: '11px', fontWeight: 600, color: '#8a8c93' }}>UPLOAD · PROCESSED · PUBLISHED OVER TIME</div>
                <div className="period-tabs" style={{ display: 'flex', gap: '4px' }}>
                  {['Week', 'Month', 'Quarter'].map(p => (
                    <button key={p} onClick={() => setPeriod(p)} style={{ fontSize: '11px', fontWeight: 500, padding: '3px 9px', borderRadius: '5px', border: '1px solid', borderColor: period === p ? '#ff453a' : '#252628', background: period === p ? '#ff453a' : 'transparent', color: period === p ? '#fff' : '#8a8c93', cursor: 'pointer' }}>{p}</button>
                  ))}
                </div>
              </div>

              <div className="legend-filter-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '15px' }}>
                <div className="legend-row" style={{ display: 'flex', gap: '8px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', fontWeight: 600, padding: '4px 10px', borderRadius: '6px', border: `1px solid ${showUpload ? '#3b6ef8' : '#252628'}`, background: showUpload ? '#0d1a2e' : '#1c1d20', cursor: 'pointer', color: showUpload ? '#fff' : '#8a8c93' }}>
                    <input type="checkbox" checked={showUpload} onChange={(e) => setShowUpload(e.target.checked)} style={{ cursor: 'pointer' }} /><span style={{ width: '9px', height: '9px', borderRadius: '2px', background: showUpload ? '#3b6ef8' : '#8a8c93' }}></span> Uploaded
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', fontWeight: 600, padding: '4px 10px', borderRadius: '6px', border: `1px solid ${showProcess ? '#0ea5b0' : '#252628'}`, background: showProcess ? '#071a1c' : '#1c1d20', cursor: 'pointer', color: showProcess ? '#fff' : '#8a8c93' }}>
                    <input type="checkbox" checked={showProcess} onChange={(e) => setShowProcess(e.target.checked)} style={{ cursor: 'pointer' }} /><span style={{ width: '9px', height: '9px', borderRadius: '2px', background: showProcess ? '#0ea5b0' : '#8a8c93' }}></span> Processed
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', fontWeight: 600, padding: '4px 10px', borderRadius: '6px', border: `1px solid ${showPublish ? '#10b981' : '#252628'}`, background: showPublish ? '#071a12' : '#1c1d20', cursor: 'pointer', color: showPublish ? '#fff' : '#8a8c93' }}>
                    <input type="checkbox" checked={showPublish} onChange={(e) => setShowPublish(e.target.checked)} style={{ cursor: 'pointer' }} /><span style={{ width: '9px', height: '9px', borderRadius: '2px', background: showPublish ? '#10b981' : '#8a8c93' }}></span> Published
                  </label>
                </div>
                <div className="filter-inline" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '10px', color: '#8a8c93', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Filter by</span>
                  <select value={trendFilterBy} onChange={(e) => setTrendFilterBy(e.target.value)} style={{ background: '#1c1d20', color: '#fff', border: '1px solid #252628', borderRadius: '6px', padding: '4px 8px', fontSize: '11.5px', outline: 'none', cursor: 'pointer' }}>
                    <option value="All">All</option>
                    <option value="Client">Client</option>
                    <option value="Channel">Channel</option>
                    <option value="Language">Language</option>
                    <option value="Type">Output Type</option>
                  </select>
                </div>
              </div>

              <div className="trend-chart-wrap" style={{ height: '170px' }}>
                <Line 
                  data={{ 
                    labels: currentTrend.labels, 
                    datasets: [ 
                      { label: 'Uploaded', data: dynamicUp, borderColor: '#3b6ef8', backgroundColor: 'rgba(59,110,248,0.09)', fill: true, tension: 0.42, borderWidth: 2.5, pointRadius: 4, pointBackgroundColor: '#3b6ef8', pointBorderColor: '#fff', hidden: !showUpload }, 
                      { label: 'Processed', data: dynamicPr, borderColor: '#0ea5b0', backgroundColor: 'rgba(14,165,176,0.07)', fill: true, tension: 0.42, borderWidth: 2.5, pointRadius: 4, pointBackgroundColor: '#0ea5b0', pointBorderColor: '#fff', hidden: !showProcess }, 
                      { label: 'Published', data: dynamicPb, borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.07)', fill: true, tension: 0.42, borderWidth: 2.5, pointRadius: 4, pointBackgroundColor: '#10b981', pointBorderColor: '#fff', hidden: !showPublish } 
                    ] 
                  }} 
                  options={chartOptions} 
                />
              </div>
            </div>

            <div className="sub-card" style={{padding: '12px 14px', marginTop: '10px'}}>
              <div className="sub-title">Drop-off Funnel ({trendFilterBy !== 'All' ? `Filtered by ${trendFilterBy}` : period})</div>
              <div className="fb-list">
                <div className="fb-row">
                  <div className="fb-meta"><span className="fb-lbl">Uploaded</span><span className="fb-val">{totalUp.toLocaleString()}</span></div>
                  <div className="fb-track"><div className="fb-fill" style={{width: '100%', background: '#3b6ef8'}}>100%</div></div>
                </div>
                <div className="fb-row">
                  <div className="fb-meta"><span className="fb-lbl">Processed</span><span className="fb-val">{totalPr.toLocaleString()}</span></div>
                  <div className="fb-track"><div className="fb-fill" style={{width: `${procPct}%`, background: '#0ea5b0'}}>{procPct}%</div></div>
                  <div className="fb-drop">↓ {notProc.toLocaleString()} not processed</div>
                </div>
                <div className="fb-row">
                  <div className="fb-meta"><span className="fb-lbl">Published</span><span className="fb-val">{totalPb.toLocaleString()}</span></div>
                  <div className="fb-track"><div className="fb-fill" style={{width: `${pubPct}%`, background: '#10b981'}}>{pubPct}%</div></div>
                  <div className="fb-drop">↓ {notPub.toLocaleString()} not published</div>
                </div>
              </div>
            </div>

            <div className="insight-pill" style={{marginTop: '10px'}}>
              <div className="ins-ico">↓</div>
              <div><strong>Drop-off alert:</strong> {dynamicDropoffAlert}% of uploaded videos are not being processed. Processed → Published gap widened <strong>+8.4%</strong> this quarter.</div>
            </div>

            <div className="sub-card" style={{padding: '12px 14px', marginTop: '10px'}}>
              <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px'}}>
                <div className="sub-title" style={{margin: 0}}>User / Channel / Client</div>
                
                <div className="tab-row" style={{margin: 0}}>
                  <button className={`tbtab ${tableTab === 'Channel' ? 'active' : ''}`} onClick={() => setTableTab('Channel')}>Channel</button>
                  <button className={`tbtab ${tableTab === 'Client' ? 'active' : ''}`} onClick={() => setTableTab('Client')}>Client</button>
                  <button className={`tbtab ${tableTab === 'User' ? 'active' : ''}`} onClick={() => setTableTab('User')}>User</button>
                </div>
              </div>

              {/* 🔴 EDITED SCROLLABLE ALPHABETICAL TABLE 🔴 */}
              <div style={{ maxHeight: '350px', overflowY: 'auto', paddingRight: '4px' }}>
                <style>{`
                  .custom-scrollbar-table::-webkit-scrollbar { width: 4px; }
                  .custom-scrollbar-table::-webkit-scrollbar-thumb { background: #333; border-radius: 4px; }
                `}</style>
                <table className="ucc-table" style={{ width: '100%', position: 'relative' }}>
                  <thead style={{ position: 'sticky', top: 0, backgroundColor: '#1c1d20', zIndex: 1 }}>
                    <tr>
                      <th style={{textAlign: 'left'}}>Name</th>
                      <th style={{textAlign: 'left'}}>Uploaded</th>
                      <th style={{textAlign: 'left'}}>Processed</th>
                      <th style={{textAlign: 'left'}}>Published</th>
                      <th style={{textAlign: 'left'}}>Rate</th>
                      <th style={{textAlign: 'left'}}>Volume</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeTableData.length === 0 ? (
                      <tr><td colSpan="6" style={{textAlign: 'center', color: '#8a8c93', padding: '10px'}}>Loading table data...</td></tr>
                    ) : [...activeTableData].sort((a, b) => (a.name || '').localeCompare(b.name || '')).map((row, idx) => {
                      const up = Number(row.uploaded) || 0;
                      const pr = Number(row.processed) || 0;
                      const pb = Number(row.published) || 0;
                      
                      const rate = pr > 0 ? Math.round((pb / pr) * 100) : 0;
                      const volPct = Math.max(2, Math.round((up / maxUploaded) * 100));

                      return (
                        <tr key={idx} style={{ borderBottom: '1px solid #252628' }}>
                          <td style={{fontWeight: 500, padding: '10px 4px'}}>{row.name}</td>
                          <td style={{color: '#8a8c93', padding: '10px 4px'}}>{up.toLocaleString()}</td>
                          <td style={{color: '#8a8c93', padding: '10px 4px'}}>{pr.toLocaleString()}</td>
                          <td style={{color: '#8a8c93', padding: '10px 4px'}}>{pb.toLocaleString()}</td>
                          <td style={{padding: '10px 4px'}}><span style={{color: rate < 50 ? '#ff453a' : '#32d74b', fontWeight: 600}}>{rate}%</span></td>
                          <td style={{padding: '10px 4px'}}>
                            <div className="mini-bar-wrap">
                              <div className="mini-bar">
                                <div className="mini-fill" style={{width: `${volPct}%`}}></div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

            </div>
          </div>
        </div>
      </div>
    </>
  );
}