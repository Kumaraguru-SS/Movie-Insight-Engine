import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Sliders, ArrowRight, Compass, Info, RefreshCw } from 'lucide-react';
import { recommendationsApi } from '../services/api';
import TitleCard from '../components/TitleCard';
import { useAuth } from '../context/AuthContext';

export default function Recommendations() {
  const { isAuthenticated } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecommendations();
  }, []);

  const loadRecommendations = async () => {
    setLoading(true);
    try {
      const res = await recommendationsApi.get(16);
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: '30px 24px 80px' }} className="animate-fade-in">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 30, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span className="cross-genre-badge">
              <Sparkles size={12} /> Hybrid TF-IDF & Behavioral Model
            </span>
          </div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: 6 }} className="font-display">
            Personalized Discoveries & Cross-Genre Insights
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Transparent AI recommendation feeds driven by your active preferences and watchlist telemetry.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={loadRecommendations} className="btn btn-secondary" style={{ fontSize: '0.85rem' }}>
            <RefreshCw size={15} /> Refresh Engine
          </button>
          <Link to="/profile" className="btn btn-primary" style={{ fontSize: '0.85rem' }}>
            <Sliders size={15} /> Tuning & Preferences
          </Link>
        </div>
      </div>

      {/* Model Rationale Explainer Banner */}
      {data && (
        <div className="glass-panel" style={{ padding: '16px 20px', marginBottom: 36, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Info size={20} color="#ffffff" />
            <div style={{ fontSize: '0.85rem' }}>
              <span>Your dominant interests: <strong>{(data.dominant_genres || []).join(', ') || 'General Catalog'}</strong></span>
              <span style={{ margin: '0 8px', color: 'var(--border-subtle)' }}>|</span>
              <span>Target exploration: <strong>{(data.exploration_genres || []).join(', ') || 'Cross-Genre Catalog'}</strong></span>
              <span style={{ margin: '0 8px', color: 'var(--border-subtle)' }}>|</span>
              <span>Exploration mode: <strong style={{ textTransform: 'capitalize', color: '#ffffff' }}>{data.exploration_level}</strong></span>
            </div>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
            Engine: {data.model_version}
          </span>
        </div>
      )}

      {/* Section 1: Outside Your Comfort Zone */}
      <section style={{ marginBottom: 50 }}>
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="cross-genre-badge">
              <Sparkles size={12} /> Core Differentiator
            </span>
          </div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginTop: 4 }} className="font-display">
            Outside Your Comfort Zone
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Titles intentionally selected from underrepresented genres, verified against your thematic tastes for guaranteed discovery relevance.
          </p>
        </div>

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 20 }}>
            {[1, 2, 3, 4].map(n => (
              <div key={n} style={{ height: 360, background: 'var(--bg-card)', borderRadius: 14 }} />
            ))}
          </div>
        ) : (data?.outside_comfort_zone && data.outside_comfort_zone.length > 0) ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 22 }}>
            {data.outside_comfort_zone.map(item => (
              <TitleCard
                key={item.id}
                title={item}
                explanation={item.explanation}
                isCrossGenre={true}
                matchType={item.match_type}
              />
            ))}
          </div>
        ) : (
          <div className="glass-panel" style={{ padding: 40, textAlign: 'center' }}>
            <Compass size={36} color="var(--accent-magenta)" style={{ margin: '0 auto 12px' }} />
            <p style={{ color: 'var(--text-muted)' }}>No cross-genre candidates found matching current filter thresholds.</p>
          </div>
        )}
      </section>

      {/* Section 2: Recommended For You */}
      <section>
        <div style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800 }} className="font-display">
            Recommended For You
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            High-confidence recommendations directly aligned with your preferred genres and ratings.
          </p>
        </div>

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 20 }}>
            {[1, 2, 3, 4, 5, 6].map(n => (
              <div key={n} style={{ height: 360, background: 'var(--bg-card)', borderRadius: 14 }} />
            ))}
          </div>
        ) : (data?.recommended_for_you && data.recommended_for_you.length > 0) ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 22 }}>
            {data.recommended_for_you.map(item => (
              <TitleCard
                key={item.id}
                title={item}
                explanation={item.explanation}
                matchType={item.match_type}
              />
            ))}
          </div>
        ) : (
          <div className="glass-panel" style={{ padding: 40, textAlign: 'center' }}>
            <p style={{ color: 'var(--text-muted)' }}>Start rating titles and adding to your watchlist to generate tailored suggestions.</p>
          </div>
        )}
      </section>
    </div>
  );
}
