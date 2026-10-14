import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Film, Compass, Bookmark, TrendingUp, Sparkles, User, LogOut, LogIn, Menu, X, Search 
} from 'lucide-react';

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/explore?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  return (
    <nav style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      background: 'rgba(0, 0, 0, 0.9)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--border-subtle)',
      padding: '12px 24px'
    }}>
      <div style={{
        maxWidth: 1400,
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 20
      }}>
        {/* Brand */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <img 
            src="/logo.png" 
            alt="Movie Insight Engine Logo" 
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              objectFit: 'cover'
            }} 
          />
          <div>
            <span style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.03em' }} className="font-display">
              Movie<span className="gradient-text">Insight</span>
            </span>
            <span style={{
              fontSize: '0.65rem',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
              display: 'block',
              marginTop: -3
            }}>
              Engine
            </span>
          </div>
        </Link>

        {/* Global Search Bar */}
        <form onSubmit={handleSearchSubmit} style={{
          display: 'flex',
          alignItems: 'center',
          flex: 1,
          maxWidth: 420,
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-full)',
          padding: '6px 14px',
          gap: 8,
          transition: 'border var(--transition-fast)'
        }}>
          <Search size={16} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Search movies, series, anime..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              width: '100%',
              fontSize: '0.85rem'
            }}
          />
        </form>

        {/* Desktop Nav Links */}
        <div style={{ display: 'none', gap: 24, alignItems: 'center' }} className="desktop-nav">
          <Link to="/explore" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            <Compass size={17} /> Explore
          </Link>
          <Link to="/recommendations" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            <Sparkles size={17} color="#ffffff" /> For You
          </Link>
          <Link to="/watchlist" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            <Bookmark size={17} /> Watchlist
          </Link>
          <Link to="/trends" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            <TrendingUp size={17} /> Trends
          </Link>

          {isAuthenticated ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Link to="/profile" className="btn btn-secondary" style={{ padding: '6px 14px', fontSize: '0.85rem' }}>
                <User size={15} /> {user?.username}
              </Link>
              <button onClick={logout} className="btn btn-secondary" title="Logout" style={{ padding: '6px 10px' }}>
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 10 }}>
              <Link to="/login" className="btn btn-secondary" style={{ padding: '6px 14px', fontSize: '0.85rem' }}>
                Sign In
              </Link>
              <Link to="/register" className="btn btn-primary" style={{ padding: '6px 16px', fontSize: '0.85rem' }}>
                Get Started
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Toggle Button */}
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="mobile-toggle"
          style={{ display: 'block', color: 'var(--text-main)', padding: 4 }}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          padding: '20px 0 10px',
          borderTop: '1px solid var(--border-subtle)',
          marginTop: 12
        }}>
          <Link to="/explore" onClick={() => setMobileMenuOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Compass size={18} /> Explore Catalog
          </Link>
          <Link to="/recommendations" onClick={() => setMobileMenuOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Sparkles size={18} color="#00f2fe" /> Recommendations & Discovery
          </Link>
          <Link to="/watchlist" onClick={() => setMobileMenuOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Bookmark size={18} /> My Watchlist
          </Link>
          <Link to="/trends" onClick={() => setMobileMenuOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <TrendingUp size={18} /> Trend Analytics
          </Link>
          <div style={{ height: 1, background: 'var(--border-subtle)', margin: '4px 0' }} />
          {isAuthenticated ? (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Link to="/profile" onClick={() => setMobileMenuOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <User size={18} /> {user?.username}
              </Link>
              <button onClick={() => { logout(); setMobileMenuOpen(false); }} className="btn btn-danger" style={{ padding: '6px 12px' }}>
                <LogOut size={16} /> Logout
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 10 }}>
              <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="btn btn-secondary" style={{ flex: 1 }}>Sign In</Link>
              <Link to="/register" onClick={() => setMobileMenuOpen(false)} className="btn btn-primary" style={{ flex: 1 }}>Get Started</Link>
            </div>
          )}
        </div>
      )}

      <style>{`
        @media (min-width: 900px) {
          .desktop-nav { display: flex !important; }
          .mobile-toggle { display: none !important; }
        }
      `}</style>
    </nav>
  );
}
