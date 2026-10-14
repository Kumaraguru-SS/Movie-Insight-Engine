import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sparkles, AlertCircle, Lock, User, Mail } from 'lucide-react';

export default function AuthPage({ isRegister = false }) {
  const { login, register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleGoogleSignIn = async () => {
    setError(null);
    setSubmitting(true);
    try {
      // Prompt user or use Google Identity prompt
      const sampleEmail = window.prompt("Enter your Google Account email to sign in:", "user@gmail.com");
      if (!sampleEmail) {
        setSubmitting(false);
        return;
      }
      const displayName = sampleEmail.split('@')[0];
      await loginWithGoogle({ email: sampleEmail, name: displayName });
      navigate('/');
    } catch (err) {
      setError(err.message || 'Google sign-in encountered an issue.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      if (isRegister) {
        await register(username, email, password);
      } else {
        await login(username, password);
      }
      navigate('/');
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      maxWidth: 440,
      margin: '60px auto 80px',
      padding: '0 24px'
    }} className="animate-fade-in">
      <div className="glass-panel" style={{ padding: '36px 32px' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            background: 'var(--accent-gradient)',
            width: 44,
            height: 44,
            borderRadius: 12,
            margin: '0 auto 12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Sparkles size={24} color="#fff" />
          </div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: 6 }} className="font-display">
            {isRegister ? 'Create Your Account' : 'Welcome Back'}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            {isRegister
              ? 'Unlock tailored cross-genre exploration and personal watchlist persistence.'
              : 'Sign in to access your saved watchlist and personalized insights.'}
          </p>
        </div>

        {error && (
          <div style={{
            padding: '10px 14px',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            color: '#f87171',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 20
          }}>
            <AlertCircle size={16} /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: 6 }}>
              Username
            </label>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              background: 'rgba(0,0,0,0.3)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              padding: '10px 14px'
            }}>
              <User size={16} color="var(--text-muted)" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Choose a username"
                style={{ background: 'transparent', border: 'none', width: '100%', fontSize: '0.9rem' }}
              />
            </div>
          </div>

          {isRegister && (
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: 6 }}>
                Email Address
              </label>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: '10px 14px'
              }}>
                <Mail size={16} color="var(--text-muted)" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  style={{ background: 'transparent', border: 'none', width: '100%', fontSize: '0.9rem' }}
                />
              </div>
            </div>
          )}

          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: 6 }}>
              Password
            </label>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              background: 'rgba(0,0,0,0.3)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              padding: '10px 14px'
            }}>
              <Lock size={16} color="var(--text-muted)" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{ background: 'transparent', border: 'none', width: '100%', fontSize: '0.9rem' }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="btn btn-primary"
            style={{ width: '100%', padding: '12px', marginTop: 10 }}
          >
            {submitting ? 'Authenticating...' : isRegister ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        {/* Divider */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          margin: '22px 0',
          color: 'var(--text-muted)',
          fontSize: '0.8rem'
        }}>
          <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
          <span style={{ padding: '0 12px' }}>or continue with</span>
          <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
        </div>

        {/* Google Sign-In Button */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={submitting}
          style={{
            width: '100%',
            padding: '11px 16px',
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: 'var(--radius-sm)',
            color: '#f8fafc',
            fontSize: '0.9rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'}
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
          </svg>
          Continue with Google
        </button>

        <div style={{ textAlign: 'center', marginTop: 22, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          {isRegister ? (
            <span>Already have an account? <Link to="/login" style={{ color: '#00f2fe', fontWeight: 600 }}>Sign in</Link></span>
          ) : (
            <span>New to Movie Insight Engine? <Link to="/register" style={{ color: '#00f2fe', fontWeight: 600 }}>Create account</Link></span>
          )}
        </div>
      </div>
    </div>
  );
}
