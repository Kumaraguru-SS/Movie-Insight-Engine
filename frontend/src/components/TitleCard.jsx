import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, Star, Sparkles, Plus, Check } from 'lucide-react';
import { watchlistApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function TitleCard({ title, explanation, matchType, isCrossGenre = false }) {
  const { isAuthenticated } = useAuth();
  const [added, setAdded] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleQuickAdd = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      window.location.href = '/login';
      return;
    }
    setSaving(true);
    try {
      await watchlistApi.add({
        title_id: title.id,
        status: 'plan_to_watch'
      });
      setAdded(true);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const defaultPoster = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&auto=format&fit=crop&q=60';

  return (
    <div style={{
      position: 'relative',
      borderRadius: 'var(--radius-md)',
      overflow: 'hidden',
      background: 'var(--bg-card)',
      border: isCrossGenre ? '1px solid rgba(255, 255, 255, 0.4)' : '1px solid var(--border-subtle)',
      transition: 'transform var(--transition-normal), box-shadow var(--transition-normal), border-color var(--transition-normal)',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      boxShadow: 'var(--shadow-card)'
    }}
    className="title-card"
    >
      <Link to={`/titles/${title.slug || title.id}`} style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Poster Image Container */}
        <div style={{
          position: 'relative',
          paddingTop: '140%', // 1:1.4 aspect ratio standard for cinema posters
          backgroundColor: '#151c2d',
          overflow: 'hidden'
        }}>
          <img
            src={title.poster_url || defaultPoster}
            alt={title.title}
            loading="lazy"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transition: 'transform 0.4s ease'
            }}
            className="card-poster-img"
          />

          {/* Type Badge */}
          <span 
            className={`badge-${(title.content_type || 'movie').toLowerCase()}`}
            style={{
              position: 'absolute',
              top: 10,
              left: 10,
              backdropFilter: 'blur(8px)',
              fontSize: '0.7rem',
              fontWeight: 700,
              padding: '3px 8px',
              borderRadius: 6,
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}
          >
            {title.content_type}
          </span>

          {/* Cross-Genre Badge */}
          {isCrossGenre && (
            <span className="cross-genre-badge" style={{ position: 'absolute', top: 10, right: 10 }}>
              <Sparkles size={11} /> Discovery
            </span>
          )}

          {/* Quick Add Button */}
          <button
            onClick={handleQuickAdd}
            disabled={saving || added}
            title={added ? "Added to watchlist" : "Add to watchlist"}
            style={{
              position: 'absolute',
              bottom: 10,
              right: 10,
              background: added ? '#10b981' : 'rgba(0, 0, 0, 0.75)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '50%',
              width: 34,
              height: 34,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              transition: 'transform 0.2s ease, background 0.2s ease'
            }}
          >
            {added ? <Check size={16} /> : <Plus size={18} />}
          </button>
        </div>

        {/* Content Metadata */}
        <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', flex: 1, gap: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
            <h3 style={{
              fontSize: '1rem',
              fontWeight: 700,
              color: 'var(--text-main)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {title.title}
            </h3>
            {title.rating > 0 && (
              <span style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                fontSize: '0.8rem',
                fontWeight: 700,
                color: '#facc15'
              }}>
                <Star size={13} fill="#facc15" /> {title.rating.toFixed(1)}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <span>{title.release_year || 'N/A'}</span>
            <span>•</span>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {(title.genres || []).slice(0, 2).join(', ') || 'General'}
            </span>
          </div>

          {/* Transparent Rationale Explanation */}
          {explanation && (
            <div style={{
              marginTop: 'auto',
              paddingTop: 8,
              borderTop: '1px solid var(--border-subtle)',
              fontSize: '0.75rem',
              color: isCrossGenre ? '#ffffff' : '#a3a3a3',
              lineHeight: 1.3
            }}>
              💡 {explanation}
            </div>
          )}
        </div>
      </Link>

      <style>{`
        .title-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 16px 30px -10px rgba(0, 0, 0, 0.7);
        }
        .title-card:hover .card-poster-img {
          transform: scale(1.05);
        }
      `}</style>
    </div>
  );
}
