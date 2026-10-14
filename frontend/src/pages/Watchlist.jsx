import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, Trash2, Filter, Star, CheckCircle, Clock, PlayCircle } from 'lucide-react';
import { watchlistApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import TitleCard from '../components/TitleCard';

export default function Watchlist() {
  const { isAuthenticated } = useAuth();
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated) {
      loadWatchlist();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, filter]);

  const loadWatchlist = async () => {
    setLoading(true);
    try {
      const data = await watchlistApi.get(filter !== 'all' ? filter : undefined);
      setItems(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (itemId) => {
    try {
      await watchlistApi.remove(itemId);
      setItems(items.filter(i => i.id !== itemId));
    } catch (err) {
      console.error(err);
    }
  };

  const handleStatusUpdate = async (itemId, newStatus) => {
    try {
      const updated = await watchlistApi.update(itemId, { status: newStatus });
      setItems(items.map(i => i.id === itemId ? updated : i));
    } catch (err) {
      console.error(err);
    }
  };

  if (!isAuthenticated) {
    return (
      <div style={{ maxWidth: 600, margin: '80px auto', textAlign: 'center', padding: '0 24px' }}>
        <div className="glass-panel" style={{ padding: 40 }}>
          <Bookmark size={48} color="#00f2fe" style={{ margin: '0 auto 16px' }} />
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: 10 }} className="font-display">
            Personal Watchlist
          </h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>
            Sign in to organize your viewing journey, track what you've watched, and sharpen your personalized recommendation engine.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <Link to="/login" className="btn btn-primary">Sign In</Link>
            <Link to="/register" className="btn btn-secondary">Create Account</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: '30px 24px 80px' }} className="animate-fade-in">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 30, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: 6 }} className="font-display">
            My Watchlist
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Manage saved titles across your personal status queues.
          </p>
        </div>

        {/* Status Filter Tabs */}
        <div style={{ display: 'flex', gap: 8, background: 'rgba(255, 255, 255, 0.05)', padding: 4, borderRadius: 'var(--radius-sm)' }}>
          {[
            { key: 'all', label: 'All' },
            { key: 'plan_to_watch', label: 'Plan to Watch' },
            { key: 'watching', label: 'Watching' },
            { key: 'watched', label: 'Watched' },
            { key: 'dropped', label: 'Dropped' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              style={{
                padding: '6px 14px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.85rem',
                fontWeight: 600,
                background: filter === tab.key ? 'var(--accent-gradient)' : 'transparent',
                color: filter === tab.key ? '#fff' : 'var(--text-muted)',
                transition: 'all 0.2s ease'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Watchlist Items */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 20 }}>
          {[1, 2, 3, 4].map(n => (
            <div key={n} style={{ height: 360, background: 'var(--bg-card)', borderRadius: 14 }} />
          ))}
        </div>
      ) : items.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 22 }}>
          {items.map(item => (
            <div key={item.id} className="glass-panel" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div style={{ flex: 1 }}>
                <TitleCard title={item.title} />
              </div>

              {/* Status and Action Strip */}
              <div style={{ padding: '12px 14px', background: 'rgba(0,0,0,0.4)', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <select
                  value={item.status}
                  onChange={(e) => handleStatusUpdate(item.id, e.target.value)}
                  style={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 6,
                    padding: '4px 8px',
                    fontSize: '0.75rem',
                    color: 'var(--text-main)'
                  }}
                >
                  <option value="plan_to_watch">Plan to Watch</option>
                  <option value="watching">Watching</option>
                  <option value="watched">Watched</option>
                  <option value="dropped">Dropped</option>
                </select>

                <button
                  onClick={() => handleRemove(item.id)}
                  title="Remove from watchlist"
                  style={{ color: '#ef4444', padding: 4, display: 'flex', alignItems: 'center' }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-panel" style={{ padding: 60, textAlign: 'center' }}>
          <Bookmark size={48} color="var(--text-muted)" style={{ margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: '1.2rem', marginBottom: 8 }}>Your watchlist is empty</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 20 }}>
            Find entertainment titles you want to watch and click the + button to save them here.
          </p>
          <Link to="/explore" className="btn btn-primary">
            Browse Catalog
          </Link>
        </div>
      )}
    </div>
  );
}
