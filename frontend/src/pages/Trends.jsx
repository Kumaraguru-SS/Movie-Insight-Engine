import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, BarChart3, Clock, Database, Layers, ArrowUpRight, ArrowDownRight, Info 
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, 
  PieChart, Pie, Cell, BarChart, Bar 
} from 'recharts';
import { trendsApi } from '../services/api';

export default function Trends() {
  const [period, setPeriod] = useState('weekly');
  const [trends, setTrends] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTrends();
  }, [period]);

  const loadTrends = async () => {
    setLoading(true);
    try {
      const res = await trendsApi.get(period);
      setTrends(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#ffffff', '#d4d4d4', '#a3a3a3', '#737373', '#525252'];

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: '30px 24px 80px' }} className="animate-fade-in">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 30, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{
              background: 'rgba(255, 255, 255, 0.1)',
              color: '#ffffff',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              borderRadius: 20,
              padding: '3px 10px',
              fontSize: '0.75rem',
              fontWeight: 700
            }}>
              Timestamped Analytics
            </span>
          </div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: 6 }} className="font-display">
            Entertainment Trends & Aggregated Demand
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Historical genre shifts, demand indicators, and cross-platform entertainment analytics.
          </p>
        </div>

        {/* Time Period Filter */}
        <div style={{ display: 'flex', gap: 8, background: 'rgba(255, 255, 255, 0.05)', padding: 4, borderRadius: 'var(--radius-sm)' }}>
          {['daily', 'weekly', 'monthly'].map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              style={{
                padding: '6px 14px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.85rem',
                fontWeight: 600,
                textTransform: 'capitalize',
                background: period === p ? 'var(--accent-gradient)' : 'transparent',
                color: period === p ? '#fff' : 'var(--text-muted)'
              }}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Observability and Source Metadata Strip */}
      {trends && (
        <div className="glass-panel" style={{ padding: '14px 20px', marginBottom: 30, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.85rem' }}>
            <Database size={16} color="#00f2fe" />
            <span>Data Source: <strong>{trends.data_source}</strong></span>
            <span style={{ margin: '0 8px', color: 'var(--border-subtle)' }}>|</span>
            <Clock size={16} color="#94a3b8" />
            <span>Snapshot: <strong>{new Date(trends.last_updated).toLocaleString()}</strong></span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.8rem' }}>
            <span style={{
              background: trends.is_demo ? 'rgba(234, 179, 8, 0.15)' : 'rgba(16, 185, 129, 0.15)',
              color: trends.is_demo ? '#eab308' : '#10b981',
              padding: '3px 8px',
              borderRadius: 4,
              fontWeight: 700
            }}>
              {trends.is_demo ? 'DEMO ESTIMATE' : 'OBSERVED METRICS'}
            </span>
            <span style={{ color: 'var(--text-dim)' }}>{trends.coverage_notes}</span>
          </div>
        </div>
      )}

      {/* Main Charts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 24, marginBottom: 40 }}>
        {/* Genre Popularity Timeline */}
        <div className="glass-panel" style={{ padding: 24 }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 6 }}>
            Genre Popularity Over Time
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: 20 }}>
            Relative engagement trajectory across dominant entertainment categories.
          </p>
          <div style={{ width: '100%', height: 280 }}>
            {trends?.genre_history && (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trends.genre_history}>
                  <defs>
                    <linearGradient id="scifiGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ffffff" stopOpacity={0.7}/>
                      <stop offset="95%" stopColor="#ffffff" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="animeGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#888888" stopOpacity={0.7}/>
                      <stop offset="95%" stopColor="#888888" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.08)" />
                  <XAxis dataKey="period" stroke="#737373" fontSize={12} />
                  <YAxis stroke="#737373" fontSize={12} domain={[60, 100]} />
                  <Tooltip contentStyle={{ backgroundColor: '#0a0a0a', borderColor: 'var(--border-subtle)', borderRadius: 8 }} />
                  <Area type="monotone" dataKey="Science Fiction" stroke="#ffffff" strokeWidth={2} fillOpacity={1} fill="url(#scifiGrad)" />
                  <Area type="monotone" dataKey="Anime" stroke="#a3a3a3" strokeWidth={2} fillOpacity={1} fill="url(#animeGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Catalog Content Type Distribution */}
        <div className="glass-panel" style={{ padding: 24 }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 6 }}>
            Catalog Content Proportion
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: 20 }}>
            Active share of Movies, Series, and Anime in our discovery engine.
          </p>
          <div style={{ width: '100%', height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {trends?.content_type_distribution && (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={trends.content_type_distribution}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={95}
                    innerRadius={55}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {trends.content_type_distribution.map((entry, index) => {
                      let color = '#a3a3a3';
                      const lower = (entry.name || '').toLowerCase();
                      if (lower.includes('movie')) color = '#3b82f6';
                      else if (lower.includes('series') || lower.includes('tv')) color = '#10b981';
                      else if (lower.includes('anime')) color = '#ec4899';
                      return <Cell key={`cell-${index}`} fill={color} />;
                    })}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#0a0a0a', borderColor: 'var(--border-subtle)', borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Cross-Platform ML Trend Forecasting Intelligence */}
      {trends?.platform_signals && (
        <div style={{ marginBottom: 30 }}>
          <div className="glass-panel" style={{ padding: 24, marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <TrendingUp size={20} color="#00f2fe" /> Multi-Source Entertainment Velocity (ML Model)
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  Aggregated signals from YouTube, SIMKL, Reddit, X (Twitter), Twitch, and Discord analyzed by GradientBoosting Regressor.
                </p>
              </div>
              {trends.ml_forecast && (
                <div style={{ background: 'rgba(0, 242, 254, 0.1)', border: '1px solid rgba(0, 242, 254, 0.3)', padding: '6px 14px', borderRadius: 20, fontSize: '0.8rem', color: '#00f2fe', fontWeight: 600 }}>
                  Breakout Probability: {trends.ml_forecast.breakout_probability}
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 16 }}>
              {trends.platform_signals.map((sig, i) => (
                <div key={i} style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-subtle)', borderRadius: 12, padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#fff' }}>{sig.platform}</span>
                    <span style={{ fontSize: '0.7rem', color: '#00f2fe', background: 'rgba(0, 242, 254, 0.1)', padding: '2px 8px', borderRadius: 10 }}>
                      Weight {sig.weight}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 10, minHeight: 32 }}>
                    {sig.metric}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f8fafc' }}>{sig.score}</span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#10b981' }}>{sig.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Top Trending Genres Table */}
      <div className="glass-panel" style={{ padding: 24 }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 16 }}>
          Rising Entertainment Categories
        </h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '12px 16px' }}>Category Name</th>
                <th style={{ padding: '12px 16px' }}>Engagement Score</th>
                <th style={{ padding: '12px 16px' }}>{period.toUpperCase()} Shift</th>
                <th style={{ padding: '12px 16px' }}>Evaluation Notes</th>
              </tr>
            </thead>
            <tbody>
              {(trends?.top_genres || []).map((genre, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                  <td style={{ padding: '14px 16px', fontWeight: 700, color: '#f1f5f9' }}>
                    {genre.name}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 100, height: 6, background: 'rgba(255, 255, 255, 0.1)', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ width: `${genre.score}%`, height: '100%', background: 'var(--accent-gradient)' }} />
                      </div>
                      <span>{genre.score.toFixed(1)}</span>
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      color: genre.change_pct >= 0 ? '#10b981' : '#ef4444',
                      fontWeight: 600
                    }}>
                      {genre.change_pct >= 0 ? <ArrowUpRight size={15} /> : <ArrowDownRight size={15} />}
                      {genre.change_pct > 0 ? `+${genre.change_pct}%` : `${genre.change_pct}%`}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    {genre.coverage_notes || 'Standard activity aggregation'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
