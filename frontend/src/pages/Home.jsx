import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Sparkles, Compass, TrendingUp, Flame, Play, ArrowRight, ShieldCheck, Layers, Eye
} from 'lucide-react';
import { titlesApi, recommendationsApi, trendsApi } from '../services/api';
import TitleCard from '../components/TitleCard';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [trending, setTrending] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [outsideComfort, setOutsideComfort] = useState([]);
  const [dominantGenres, setDominantGenres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);
        // Fetch in parallel
        const [recRes, trendRes] = await Promise.all([
          recommendationsApi.get(8).catch(() => ({ recommended_for_you: [], outside_comfort_zone: [] })),
          trendsApi.get('weekly').catch(() => ({ trending_titles: [] }))
        ]);

        setRecommendations(recRes.recommended_for_you || []);
        setOutsideComfort(recRes.outside_comfort_zone || []);
        setDominantGenres(recRes.dominant_genres || []);
        setTrending(trendRes.trending_titles || []);
      } catch (err) {
        console.error('Error loading dashboard:', err);
        setError('Failed to load personalized content. Showing catalog fallbacks.');
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, []);

  const heroTitle = trending[0] || recommendations[0];

  return (
    <div style={{ paddingBottom: 80 }} className="animate-fade-in">
      {/* Hero Cinematic Banner */}
      {heroTitle && (
        <div style={{
          position: 'relative',
          minHeight: '65vh',
          display: 'flex',
          alignItems: 'flex-end',
          padding: '60px 40px',
          backgroundImage: `linear-gradient(to top, var(--bg-primary) 10%, rgba(10, 13, 20, 0.4) 60%, rgba(10, 13, 20, 0.8) 100%), url(${heroTitle.backdrop_url || heroTitle.poster_url})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center top',
          borderBottom: '1px solid var(--border-subtle)',
          marginBottom: 40
        }}>
          <div style={{ maxWidth: 800 }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 12 }}>
              <span className="cross-genre-badge">
                <Flame size={12} /> Spotlight
              </span>
              <span 
                className={`badge-${(heroTitle.content_type || 'movie').toLowerCase()}`}
                style={{
                  padding: '3px 8px',
                  borderRadius: 6,
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  textTransform: 'uppercase'
                }}
              >
                {heroTitle.content_type}
              </span>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                {heroTitle.release_year} • ⭐ {heroTitle.rating}/10
              </span>
            </div>

            <h1 style={{
              fontSize: 'clamp(2rem, 5vw, 3.5rem)',
              fontWeight: 800,
              lineHeight: 1.1,
              marginBottom: 16
            }}>
              {heroTitle.title}
            </h1>

            <p style={{
              fontSize: '1rem',
              color: 'var(--text-muted)',
              marginBottom: 24,
              lineHeight: 1.6,
              maxWidth: 680,
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}>
              {heroTitle.synopsis}
            </p>

            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              <Link to={`/titles/${heroTitle.slug || heroTitle.id}`} className="btn btn-primary" style={{ padding: '12px 24px', fontSize: '1rem' }}>
                <Eye size={18} /> View Insights
              </Link>
              <Link to="/explore" className="btn btn-secondary" style={{ padding: '12px 20px', fontSize: '1rem' }}>
                <Compass size={18} /> Browse Full Catalog
              </Link>
            </div>
          </div>
        </div>
      )}

      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 24px' }}>
        {/* Core Differentiator Banner: Outside Your Comfort Zone */}
        <section style={{ marginBottom: 50 }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 20,
            flexWrap: 'wrap',
            gap: 12
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="cross-genre-badge">
                  <Sparkles size={13} /> Core Engine Differentiator
                </span>
              </div>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: 6 }} className="font-display">
                Outside Your Comfort Zone
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: 2 }}>
                Intentional cross-genre discovery connecting your passion for{' '}
                <strong style={{ color: '#ffffff' }}>{dominantGenres.join(', ') || 'Action & Sci-Fi'}</strong> to unexpected styles.
              </p>
            </div>

            <Link to="/profile" className="btn btn-secondary" style={{ fontSize: '0.85rem' }}>
              Adjust Exploration Intensity <ArrowRight size={15} />
            </Link>
          </div>

          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 20 }}>
              {[1, 2, 3, 4].map(n => (
                <div key={n} style={{ height: 360, background: 'var(--bg-card)', borderRadius: 14 }} />
              ))}
            </div>
          ) : outsideComfort.length > 0 ? (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
              gap: 22
            }}>
              {outsideComfort.slice(0, 4).map(item => (
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
            <div className="glass-panel" style={{ padding: 30, textAlign: 'center' }}>
              <Compass size={36} color="var(--accent-magenta)" style={{ margin: '0 auto 12px' }} />
              <p>Explore titles and save them to your watchlist to unlock tailored cross-genre journeys!</p>
            </div>
          )}
        </section>

        {/* Personalized Recommendations Lane */}
        <section style={{ marginBottom: 50 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20 }}>
            <div>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 700 }} className="font-display">
                Recommended For You
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                Algorithmic matches weighted by your preferred genres, content types, and activity.
              </p>
            </div>
            <Link to="/recommendations" style={{ color: '#ffffff', fontSize: '0.9rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
              View all <ArrowRight size={16} />
            </Link>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: 20
          }}>
            {recommendations.slice(0, 4).map(item => (
              <TitleCard
                key={item.id}
                title={item}
                explanation={item.explanation}
                matchType={item.match_type}
              />
            ))}
          </div>
        </section>

        {/* Trending Now Across Platforms */}
        <section style={{ marginBottom: 50 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20 }}>
            <div>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 700 }} className="font-display">
                Trending Right Now
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                High-engagement movies, television series, and anime with verified public interest.
              </p>
            </div>
            <Link to="/trends" style={{ color: '#ffffff', fontSize: '0.9rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
              Analytics & Trends <ArrowRight size={16} />
            </Link>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: 20
          }}>
            {trending.slice(0, 4).map(item => (
              <TitleCard
                key={item.id}
                title={item}
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
