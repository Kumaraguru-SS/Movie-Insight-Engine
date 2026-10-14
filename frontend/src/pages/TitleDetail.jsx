import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Star, Clock, Calendar, Globe, Bookmark, Check, Heart, MessageSquare, 
  Share2, ArrowLeft, ExternalLink, Sparkles 
} from 'lucide-react';
import { titlesApi, watchlistApi, feedbackApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import TitleCard from '../components/TitleCard';

export default function TitleDetail() {
  const { id } = useParams();
  const { isAuthenticated } = useAuth();

  const [title, setTitle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Watchlist interaction state
  const [watchlistStatus, setWatchlistStatus] = useState('none');
  const [savingStatus, setSavingStatus] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(null);

  useEffect(() => {
    async function loadTitle() {
      setLoading(true);
      setError(null);
      try {
        const data = await titlesApi.getDetail(id);
        setTitle(data);
        if (data.in_watchlist && data.watchlist_status) {
          setWatchlistStatus(data.watchlist_status);
        } else {
          setWatchlistStatus('none');
        }
      } catch (err) {
        console.error(err);
        setError('Failed to load title details. Title may not exist or catalog provider is unreachable.');
      } finally {
        setLoading(false);
      }
    }
    loadTitle();
  }, [id]);

  const handleStatusChange = async (newStatus) => {
    if (!isAuthenticated) {
      window.location.href = '/login';
      return;
    }
    setSavingStatus(true);
    try {
      await watchlistApi.add({
        title_id: title.id,
        status: newStatus
      });
      setWatchlistStatus(newStatus);
    } catch (err) {
      console.error('Error saving watchlist status:', err);
    } finally {
      setSavingStatus(false);
    }
  };

  const handleFeedback = async (feedbackType) => {
    if (!isAuthenticated) {
      window.location.href = '/login';
      return;
    }
    try {
      await feedbackApi.submit({
        title_id: title.id,
        feedback_type: feedbackType,
        context: 'title_detail'
      });
      setFeedbackSubmitted(feedbackType);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div style={{ maxWidth: 1200, margin: '60px auto', padding: '0 24px', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>Loading title insights and metadata...</p>
      </div>
    );
  }

  if (error || !title) {
    return (
      <div style={{ maxWidth: 800, margin: '60px auto', padding: '0 24px', textAlign: 'center' }}>
        <div className="glass-panel" style={{ padding: 40 }}>
          <h2 style={{ marginBottom: 12, color: '#ef4444' }}>Title Not Found</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>{error || 'Unable to retrieve title metadata.'}</p>
          <Link to="/explore" className="btn btn-primary">
            Back to Catalog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ paddingBottom: 80 }}>
      {/* Backdrop Header */}
      <div style={{
        position: 'relative',
        minHeight: '48vh',
        backgroundImage: `linear-gradient(to top, var(--bg-primary) 5%, rgba(10, 13, 20, 0.7) 60%, rgba(10, 13, 20, 0.95) 100%), url(${title.backdrop_url || title.poster_url})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        display: 'flex',
        alignItems: 'flex-end',
        padding: '40px 24px 20px',
        borderBottom: '1px solid var(--border-subtle)'
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', width: '100%' }}>
          <Link to="/explore" style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            color: 'var(--text-muted)',
            fontSize: '0.85rem',
            marginBottom: 20
          }}>
            <ArrowLeft size={16} /> Back to Catalog
          </Link>
        </div>
      </div>

      {/* Main Content Layout */}
      <div style={{ maxWidth: 1200, margin: '-100px auto 0', padding: '0 24px', position: 'relative', zIndex: 10 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(240px, 300px) 1fr', gap: 36 }} className="title-detail-grid">
          {/* Left Column: Poster & Quick Controls */}
          <div>
            <div style={{
              borderRadius: 'var(--radius-md)',
              overflow: 'hidden',
              boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.8)',
              border: '1px solid var(--border-subtle)',
              marginBottom: 20
            }}>
              <img
                src={title.poster_url || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&auto=format&fit=crop&q=60'}
                alt={title.title}
                style={{ width: '100%', display: 'block', objectFit: 'cover' }}
              />
            </div>

            {/* Watchlist Status Selector */}
            <div className="glass-panel" style={{ padding: 18, marginBottom: 20 }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 10 }}>
                My Watchlist Status
              </span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {[
                  { key: 'plan_to_watch', label: 'Plan to Watch' },
                  { key: 'watching', label: 'Watching' },
                  { key: 'watched', label: 'Watched' },
                  { key: 'dropped', label: 'Dropped' }
                ].map(opt => (
                  <button
                    key={opt.key}
                    disabled={savingStatus}
                    onClick={() => handleStatusChange(opt.key)}
                    style={{
                      padding: '8px 10px',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      background: watchlistStatus === opt.key ? 'var(--accent-gradient)' : 'rgba(255, 255, 255, 0.05)',
                      color: watchlistStatus === opt.key ? '#fff' : 'var(--text-muted)',
                      border: watchlistStatus === opt.key ? 'none' : '1px solid var(--border-subtle)',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {watchlistStatus === opt.key ? '✓ ' : ''}{opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Lightweight Feedback */}
            <div className="glass-panel" style={{ padding: 16 }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 10 }}>
                Recommendation Feedback
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[
                  { key: 'relevant', label: '👍 Relevant to my tastes' },
                  { key: 'more_like_this', label: '✨ More like this' },
                  { key: 'not_interested', label: '👎 Not interested' }
                ].map(fb => (
                  <button
                    key={fb.key}
                    onClick={() => handleFeedback(fb.key)}
                    style={{
                      textAlign: 'left',
                      padding: '6px 10px',
                      borderRadius: 6,
                      fontSize: '0.8rem',
                      background: feedbackSubmitted === fb.key ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                      border: feedbackSubmitted === fb.key ? '1px solid #ffffff' : '1px solid transparent',
                      color: feedbackSubmitted === fb.key ? '#ffffff' : 'var(--text-muted)'
                    }}
                  >
                    {feedbackSubmitted === fb.key ? '✓ Feedback saved: ' : ''}{fb.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Title Info & Insights */}
          <div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12, flexWrap: 'wrap' }}>
              <span 
                className={`badge-${(title.content_type || 'movie').toLowerCase()}`}
                style={{
                  padding: '4px 10px',
                  borderRadius: 6,
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  textTransform: 'uppercase'
                }}
              >
                {title.content_type}
              </span>
              {(title.genres || []).map(g => (
                <span key={g} style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  color: '#ffffff',
                  border: '1px solid var(--border-subtle)',
                  padding: '4px 10px',
                  borderRadius: 6,
                  fontSize: '0.75rem',
                  fontWeight: 600
                }}>
                  {g}
                </span>
              ))}
            </div>

            <h1 style={{ fontSize: 'clamp(2rem, 4vw, 2.8rem)', fontWeight: 800, marginBottom: 14 }}>
              {title.title}
            </h1>

            {/* Quick Metrics */}
            <div style={{
              display: 'flex',
              gap: 20,
              flexWrap: 'wrap',
              alignItems: 'center',
              padding: '12px 18px',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              marginBottom: 24
            }}>
              {title.rating > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Star size={18} fill="#facc15" color="#facc15" />
                  <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>{title.rating.toFixed(1)}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>({title.vote_count?.toLocaleString()} votes)</span>
                </div>
              )}
              {title.release_year && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                  <Calendar size={16} /> {title.release_year}
                </div>
              )}
              {title.runtime && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                  <Clock size={16} /> {title.runtime}
                </div>
              )}
              {title.language && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  <Globe size={16} /> {title.language}
                </div>
              )}
            </div>

            {/* Synopsis */}
            <div style={{ marginBottom: 30 }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 10 }}>Synopsis</h3>
              <p style={{ color: '#cbd5e1', lineHeight: 1.7, fontSize: '0.95rem' }}>
                {title.synopsis || 'No official synopsis available from catalog provider.'}
              </p>
            </div>

            {/* Cast & Creators */}
            {((title.cast && title.cast.length > 0) || title.creator) && (
              <div style={{ marginBottom: 30, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                {title.creator && (
                  <div className="glass-panel" style={{ padding: 14 }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Director / Creator</span>
                    <strong style={{ fontSize: '0.95rem' }}>{title.creator}</strong>
                  </div>
                )}
                {title.cast && title.cast.length > 0 && (
                  <div className="glass-panel" style={{ padding: 14 }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Featured Cast</span>
                    <strong style={{ fontSize: '0.95rem' }}>{title.cast.join(', ')}</strong>
                  </div>
                )}
              </div>
            )}

            {/* Legal Watch Link */}
            {title.legal_watch_url && (
              <div style={{ marginBottom: 40 }}>
                <a
                  href={title.legal_watch_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary"
                  style={{ display: 'inline-flex', gap: 8, fontSize: '0.85rem' }}
                >
                  <ExternalLink size={15} /> Official Provider Information & Where to Watch
                </a>
              </div>
            )}

            {/* Attribution Notice */}
            {title.attribution && (
              <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: 40 }}>
                {title.attribution}
              </p>
            )}

            {/* Related Titles */}
            {title.related_titles && title.related_titles.length > 0 && (
              <div>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: 18 }} className="font-display">
                  Related Entertainment
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}>
                  {title.related_titles.map(rel => (
                    <TitleCard key={rel.id} title={rel} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 800px) {
          .title-detail-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
