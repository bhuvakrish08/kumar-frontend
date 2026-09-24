'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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

  return (
    <main className="login-wrap">
      <div className="card login">

        <div
          style={{
            textAlign: 'center',
            marginBottom: '24px',
          }}
        >
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

          <h1
            className="brand"
            style={{
              fontSize: '28px',
              marginBottom: '4px',
            }}
          >
            Kumarda Contacts
          </h1>

          <p
            className="subtle"
            style={{
              fontSize: '0.9rem',
            }}
          >
            Sign in to your relationship memory
          </p>
        </div>

        {error && (
          <div className="error">
            {error}
          </div>
        )}

        <form
          onSubmit={handleLogin}
          className="grid"
          style={{
            gap: '16px',
          }}
        >

          {/* Username */}
          <div className="field">
            <label>
              Username
            </label>

            <input
              type="text"
              name="username"
              autoComplete="username"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);

                if (error) {
                  setError('');
                }
              }}
              placeholder="Enter your username"
              required
              autoFocus
              disabled={loading}
            />
          </div>

          {/* Password */}
          <div className="field">
            <label style={{ margin: 0 }}>
              Password
            </label>

            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                type={
                  showPassword
                    ? 'text'
                    : 'password'
                }
                name="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);

                  if (error) {
                    setError('');
                  }
                }}
                placeholder="Enter your password"
                required
                disabled={loading}
                style={{ paddingRight: '44px' }}
              />

              <button
                type="button"
                onClick={() =>
                  setShowPassword((prev) => !prev)
                }
                disabled={loading}
                title={showPassword ? 'Hide password' : 'Show password'}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                style={{
                  position: 'absolute',
                  right: '12px',
                  background: 'none',
                  border: 'none',
                  color: 'var(--muted)',
                  cursor: loading
                    ? 'not-allowed'
                    : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '4px',
                  borderRadius: '4px',
                  transition: 'color 0.15s ease',
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

          {/* Login Button */}
          <button
            className="btn primary"
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              marginTop: '8px',
              fontSize: '1rem',
            }}
          >
            {loading
              ? 'Signing in...'
              : 'Sign In'}
          </button>

        </form>
      </div>
    </main>
  );
}