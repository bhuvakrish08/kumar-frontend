'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();

  // Mode: 'login' or 'register'
  const [mode, setMode] = useState('login');

  // Form State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [email, setEmail] = useState('');
  const [mobileNo, setMobileNo] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Switch between Login and Register modes
  function switchMode(newMode) {
    setMode(newMode);
    setError('');
  }

  // Handle Login Submission
  async function handleLogin(e) {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setError('');

    try {
      const data = await apiFetch('/auth/login', {
        method: 'POST',
        credentials: 'include',
        body: JSON.stringify({
          username: username.trim(),
          password: password,
        }),
      });

      if (!data || !data.user) {
        throw new Error('Invalid login response from server.');
      }

      router.push('/dashboard');
      router.refresh();

    } catch (err) {
      console.error('Login error:', err);
      setError(
        err?.message ||
        'Incorrect username or password. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }

  // Handle Register Submission
  async function handleRegister(e) {
    e.preventDefault();
    if (loading) return;

    if (!regUsername.trim()) {
      setError('Please enter a username');
      return;
    }
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }
    if (!mobileNo.trim()) {
      setError('Please enter your mobile number');
      return;
    }
    if (!password || password.length < 4) {
      setError('Password must be at least 4 characters long');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = await apiFetch('/auth/register', {
        method: 'POST',
        credentials: 'include',
        body: JSON.stringify({
          username: regUsername.trim(),
          email: email.trim(),
          mobile_no: mobileNo.trim(),
          password: password,
          name: regUsername.trim(),
        }),
      });

      if (!data || !data.user) {
        throw new Error('Registration failed. Invalid response from server.');
      }

      // Automatically logged in via HTTP-only cookie, redirect to dashboard
      router.push('/dashboard');
      router.refresh();

    } catch (err) {
      console.error('Registration error:', err);
      setError(
        err?.message ||
        'Registration failed. Please check your information and try again.'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-wrap">
      <div className="card login" style={{ maxWidth: '440px', width: '100%' }}>

        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div
            className="brand-icon"
            style={{
              width: '56px',
              height: '56px',
              fontSize: '28px',
              margin: '0 auto 12px auto',
              borderRadius: 'var(--radius-lg)',
            }}
          >
            K
          </div>

          <h1 className="brand" style={{ fontSize: '26px', marginBottom: '4px' }}>
            Kumarda Contacts
          </h1>

          <p className="subtle" style={{ fontSize: '0.9rem' }}>
            {mode === 'login'
              ? 'Sign in to your relationship memory'
              : 'Create a new account to get started'}
          </p>
        </div>

        {/* Navigation Tabs for Sign In / Register */}
        <div
          style={{
            display: 'flex',
            borderBottom: '2px solid var(--line, #e2e8f0)',
            marginBottom: '20px',
          }}
        >
          <button
            type="button"
            onClick={() => switchMode('login')}
            style={{
              flex: 1,
              padding: '10px',
              fontWeight: 600,
              fontSize: '0.95rem',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              color: mode === 'login' ? 'var(--primary, #2563eb)' : 'var(--muted, #64748b)',
              borderBottom: mode === 'login' ? '2px solid var(--primary, #2563eb)' : '2px solid transparent',
              marginBottom: '-2px',
              transition: 'all 0.15s ease',
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => switchMode('register')}
            style={{
              flex: 1,
              padding: '10px',
              fontWeight: 600,
              fontSize: '0.95rem',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              color: mode === 'register' ? 'var(--primary, #2563eb)' : 'var(--muted, #64748b)',
              borderBottom: mode === 'register' ? '2px solid var(--primary, #2563eb)' : '2px solid transparent',
              marginBottom: '-2px',
              transition: 'all 0.15s ease',
            }}
          >
            Register
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="error" style={{ marginBottom: '16px' }}>
            {error}
          </div>
        )}

        {/* SIGN IN FORM */}
        {mode === 'login' ? (
          <form onSubmit={handleLogin} className="grid" style={{ gap: '16px' }}>
            {/* Username / Email */}
            <div className="field">
              <label>Username or Email</label>
              <input
                type="text"
                name="username"
                autoComplete="username"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (error) setError('');
                }}
                placeholder="Enter your username or email"
                required
                autoFocus
                disabled={loading}
              />
            </div>

            {/* Password */}
            <div className="field">
              <label style={{ margin: 0 }}>Password</label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="Enter your password"
                  required
                  disabled={loading}
                  style={{ paddingRight: '44px' }}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  disabled={loading}
                  title={showPassword ? 'Hide password' : 'Show password'}
                  style={{
                    position: 'absolute', right: '12px', background: 'none',
                    border: 'none', color: 'var(--muted)', cursor: loading ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px'
                  }}
                >
                  {showPassword ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Login Submit Button */}
            <button
              className="btn primary"
              type="submit"
              disabled={loading}
              style={{ width: '100%', padding: '12px', marginTop: '8px', fontSize: '1rem', fontWeight: 600 }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>

            {/* Register Action Button / Link */}
            <div style={{ textAlign: 'center', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--line, #e2e8f0)' }}>
              <p style={{ margin: '0 0 8px 0', fontSize: '0.9rem', color: 'var(--ink-secondary, #64748b)' }}>
                Don't have an account yet?
              </p>
              <button
                type="button"
                onClick={() => switchMode('register')}
                className="btn secondary"
                style={{ width: '100%', padding: '10px', fontSize: '0.95rem', fontWeight: 600 }}
              >
                Register / Create New Account
              </button>
            </div>
          </form>
        ) : (
          /* REGISTRATION FORM */
          <form onSubmit={handleRegister} className="grid" style={{ gap: '14px' }}>
            {/* Username */}
            <div className="field">
              <label>Username <span style={{ color: 'var(--danger, #dc2626)' }}>*</span></label>
              <input
                type="text"
                name="reg_username"
                value={regUsername}
                onChange={(e) => {
                  setRegUsername(e.target.value);
                  if (error) setError('');
                }}
                placeholder="e.g. johnadams"
                required
                autoFocus
                disabled={loading}
              />
            </div>

            {/* Email */}
            <div className="field">
              <label>Email Address <span style={{ color: 'var(--danger, #dc2626)' }}>*</span></label>
              <input
                type="email"
                name="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError('');
                }}
                placeholder="john.adams@example.com"
                required
                disabled={loading}
              />
            </div>

            {/* Mobile Number */}
            <div className="field">
              <label>Mobile Number <span style={{ color: 'var(--danger, #dc2626)' }}>*</span></label>
              <input
                type="tel"
                name="mobile_no"
                value={mobileNo}
                onChange={(e) => {
                  setMobileNo(e.target.value);
                  if (error) setError('');
                }}
                placeholder="+1 (914) 555-0100"
                required
                disabled={loading}
              />
            </div>

            {/* Password */}
            <div className="field">
              <label style={{ margin: 0 }}>Password <span style={{ color: 'var(--danger, #dc2626)' }}>*</span></label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="Create a password"
                  required
                  disabled={loading}
                  style={{ paddingRight: '44px' }}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  disabled={loading}
                  title={showPassword ? 'Hide password' : 'Show password'}
                  style={{
                    position: 'absolute', right: '12px', background: 'none',
                    border: 'none', color: 'var(--muted)', cursor: loading ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px'
                  }}
                >
                  {showPassword ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Register Submit Button */}
            <button
              className="btn primary"
              type="submit"
              disabled={loading}
              style={{ width: '100%', padding: '12px', marginTop: '8px', fontSize: '1rem', fontWeight: 600 }}
            >
              {loading ? 'Registering...' : 'Create Account & Sign In'}
            </button>

            {/* Sign In Back Link */}
            <div style={{ textAlign: 'center', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--line, #e2e8f0)' }}>
              <p style={{ margin: '0 0 8px 0', fontSize: '0.9rem', color: 'var(--ink-secondary, #64748b)' }}>
                Already have an account?
              </p>
              <button
                type="button"
                onClick={() => switchMode('login')}
                className="btn secondary"
                style={{ width: '100%', padding: '10px', fontSize: '0.95rem', fontWeight: 600 }}
              >
                Sign In to Existing Account
              </button>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}