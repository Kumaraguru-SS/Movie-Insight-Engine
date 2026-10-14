import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { preferencesApi } from '../services/api';
import { Sliders, Save, CheckCircle, Sparkles, AlertCircle } from 'lucide-react';

export default function Profile() {
  const { user } = useAuth();
  const [pref, setPref] = useState(null);
  const [favoriteGenres, setFavoriteGenres] = useState([]);
  const [exploreGenres, setExploreGenres] = useState([]);
  const [avoidGenres, setAvoidGenres] = useState([]);
  const [preferredTypes, setPreferredTypes] = useState(['movie', 'tv', 'anime']);
  const [explorationLevel, setExplorationLevel] = useState('balanced');
  const [minRating, setMinRating] = useState(0.0);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const ALL_GENRES = [
    'Action', 'Adventure', 'Animation', 'Anime', 'Comedy', 'Crime', 
    'Drama', 'Fantasy', 'Horror', 'Mystery', 'Psychological', 
    'Science Fiction', 'Suspense', 'Thriller'
  ];

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const data = await preferencesApi.get();
      setPref(data);
      setFavoriteGenres(data.favorite_genres || []);
      setExploreGenres(data.explore_genres || []);
      setAvoidGenres(data.avoid_genres || []);
      setPreferredTypes(data.preferred_types || ['movie', 'tv', 'anime']);
      setExplorationLevel(data.exploration_level || 'balanced');
      setMinRating(data.min_rating || 0.0);
    } catch (err) {
      console.error(err);
    }
  };

  const toggleGenre = (genre, list, setList) => {
    if (list.includes(genre)) {
      setList(list.filter(g => g !== genre));
    } else {
      setList([...list, genre]);
    }
  };

  const toggleType = (t) => {
    if (preferredTypes.includes(t)) {
      if (preferredTypes.length > 1) {
        setPreferredTypes(preferredTypes.filter(x => x !== t));
      }
    } else {
      setPreferredTypes([...preferredTypes, t]);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    try {
      await preferencesApi.update({
        favorite_genres: favoriteGenres,
        explore_genres: exploreGenres,
        avoid_genres: avoidGenres,
        preferred_types: preferredTypes,
        exploration_level: explorationLevel,
        min_rating: minRating,
        preferred_languages: ['en', 'ja']
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: 900, margin: '40px auto 80px', padding: '0 24px' }} className="animate-fade-in">
      {/* Header */}
      <div style={{ marginBottom: 30 }}>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: 6 }} className="font-display">
          Personal Discovery Profile
        </h1>
        <p style={{ color: 'var(--text-muted)' }}>
          Logged in as <strong>{user?.username}</strong> ({user?.email}). Control your recommendation weights and cross-genre discovery parameters.
        </p>
      </div>

      {success && (
        <div style={{
          padding: '12px 18px',
          background: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid #10b981',
          color: '#10b981',
          borderRadius: 'var(--radius-sm)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          marginBottom: 24
        }}>
          <CheckCircle size={18} /> Preferences updated. The recommendation engine has recalculated your discovery vectors!
        </div>
      )}

      <form onSubmit={handleSave} className="glass-panel" style={{ padding: 32 }}>
        {/* Exploration Intensity Level */}
        <div style={{ marginBottom: 32 }}>
          <label style={{ fontSize: '1rem', fontWeight: 700, display: 'block', marginBottom: 6 }}>
            Cross-Genre Exploration Intensity
          </label>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 16 }}>
            Controls how aggressively the engine introduces genres outside your primary comfort zone.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
            {[
              {
                id: 'familiar',
                title: 'Familiar Recommendations',
                desc: 'Prioritizes core favorite genres with gentle exploration.'
              },
              {
                id: 'balanced',
                title: 'Balanced Discovery',
                desc: 'Equal balance of favorite genres and thoughtful cross-genre picks.'
              },
              {
                id: 'explore',
                title: 'Explore Beyond Usual',
                desc: 'Maximum cross-genre discovery connecting your tastes to new mediums.'
              }
            ].map(lvl => (
              <div
                key={lvl.id}
                onClick={() => setExplorationLevel(lvl.id)}
                style={{
                  padding: 16,
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  border: explorationLevel === lvl.id ? '2px solid #ffffff' : '1px solid var(--border-subtle)',
                  background: explorationLevel === lvl.id ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                  transition: 'all 0.2s ease'
                }}
              >
                <strong style={{ fontSize: '0.95rem', display: 'block', marginBottom: 4, color: explorationLevel === lvl.id ? '#ffffff' : '#f1f5f9' }}>
                  {lvl.title}
                </strong>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                  {lvl.desc}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Favorite Genres */}
        <div style={{ marginBottom: 32 }}>
          <label style={{ fontSize: '1rem', fontWeight: 700, display: 'block', marginBottom: 6 }}>
            Favorite Genres
          </label>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 12 }}>
            Your foundational entertainment tastes.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {ALL_GENRES.map(g => {
              const active = favoriteGenres.includes(g);
              return (
                <button
                  type="button"
                  key={g}
                  onClick={() => toggleGenre(g, favoriteGenres, setFavoriteGenres)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 20,
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    background: active ? 'var(--accent-gradient)' : 'rgba(255, 255, 255, 0.06)',
                    color: active ? '#fff' : 'var(--text-muted)',
                    border: active ? 'none' : '1px solid var(--border-subtle)'
                  }}
                >
                  {g}
                </button>
              );
            })}
          </div>
        </div>

        {/* Target Exploration Genres */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span className="cross-genre-badge">
              <Sparkles size={11} /> Cross-Genre Targets
            </span>
          </div>
          <label style={{ fontSize: '1rem', fontWeight: 700, display: 'block', marginBottom: 6 }}>
            Genres You Want to Explore
          </label>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 12 }}>
            Specific unfamiliar areas you want the algorithm to target in "Outside Your Comfort Zone".
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {ALL_GENRES.map(g => {
              const active = exploreGenres.includes(g);
              return (
                <button
                  type="button"
                  key={g}
                  onClick={() => toggleGenre(g, exploreGenres, setExploreGenres)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 20,
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    background: active ? 'var(--cross-genre-gradient)' : 'rgba(255, 255, 255, 0.06)',
                    color: active ? '#fff' : 'var(--text-muted)',
                    border: active ? 'none' : '1px solid var(--border-subtle)'
                  }}
                >
                  {g}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Types */}
        <div style={{ marginBottom: 32 }}>
          <label style={{ fontSize: '1rem', fontWeight: 700, display: 'block', marginBottom: 12 }}>
            Preferred Entertainment Mediums
          </label>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {[
              { id: 'movie', label: 'Movies' },
              { id: 'tv', label: 'TV Series' },
              { id: 'anime', label: 'Anime' }
            ].map(t => {
              const active = preferredTypes.includes(t.id);
              return (
                <button
                  type="button"
                  key={t.id}
                  onClick={() => toggleType(t.id)}
                  style={{
                    padding: '8px 18px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    background: active ? 'var(--accent-gradient)' : 'rgba(255, 255, 255, 0.06)',
                    color: active ? '#fff' : 'var(--text-muted)',
                    border: active ? 'none' : '1px solid var(--border-subtle)'
                  }}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Submit Button */}
        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="submit"
            disabled={saving}
            className="btn btn-primary"
            style={{ padding: '12px 28px', fontSize: '1rem' }}
          >
            <Save size={18} /> {saving ? 'Saving Preferences...' : 'Save & Recalculate Discovery'}
          </button>
        </div>
      </form>
    </div>
  );
}
