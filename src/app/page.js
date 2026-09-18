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

      if (!data || (!data.user && !data.token)) {
        throw new Error('Invalid login response from server.');
      }

      if (data.token && typeof window !== 'undefined') {
        localStorage.setItem('kumarda_token', data.token);
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

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <label style={{ margin: 0 }}>
                Password
              </label>

              <button
                type="button"
                onClick={() =>
                  setShowPassword((prev) => !prev)
                }
                disabled={loading}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--muted)',
                  fontSize: '0.8rem',
                  cursor: loading
                    ? 'not-allowed'
                    : 'pointer',
                  fontWeight: 600,
                }}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>

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
            />
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