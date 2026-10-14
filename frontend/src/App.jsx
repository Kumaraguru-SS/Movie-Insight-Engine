import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Explore from './pages/Explore';
import TitleDetail from './pages/TitleDetail';
import Watchlist from './pages/Watchlist';
import Recommendations from './pages/Recommendations';
import Trends from './pages/Trends';
import Profile from './pages/Profile';
import AuthPage from './pages/AuthPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
          <Navbar />
          <main style={{ flex: 1 }}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/explore" element={<Explore />} />
              <Route path="/titles/:id" element={<TitleDetail />} />
              <Route path="/watchlist" element={<Watchlist />} />
              <Route path="/recommendations" element={<Recommendations />} />
              <Route path="/trends" element={<Trends />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/login" element={<AuthPage isRegister={false} />} />
              <Route path="/register" element={<AuthPage isRegister={true} />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>

          {/* Footer */}
          <footer style={{
            borderTop: '1px solid var(--border-subtle)',
            background: 'var(--bg-secondary)',
            padding: '30px 24px',
            marginTop: 'auto',
            textAlign: 'center',
            fontSize: '0.85rem',
            color: 'var(--text-muted)'
          }}>
            <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div>
                <strong style={{ color: 'var(--text-main)' }}>Movie Insight Engine</strong> • Intentional Entertainment Discovery
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', maxWidth: 700, margin: '0 auto' }}>
                Catalog metadata sourced via TMDB & Jikan benchmark adapters. This platform demonstrates explainable cross-genre algorithmic discovery. Not a streaming service; does not host media files.
              </p>
            </div>
          </footer>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
