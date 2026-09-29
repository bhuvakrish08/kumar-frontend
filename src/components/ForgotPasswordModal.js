'use client';

import { useState } from 'react';
import { apiFetch } from '@/lib/api';

export default function ForgotPasswordModal({ isOpen, onClose, onPasswordResetSuccess }) {
  // Steps: 'email' (Step 1) -> 'otp' (Step 2) -> 'password' (Step 3) -> 'success' (Step 4)
  const [step, setStep] = useState('email');

  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  if (!isOpen) return null;

  function resetAll() {
    setStep('email');
    setEmail('');
    setOtp('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    setInfoMessage('');
    setShowPassword(false);
  }

  function handleClose() {
    resetAll();
    onClose();
  }

  // STEP 1: Request 6-digit OTP to Email
  async function handleSendOtp(e) {
    e.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setError('Please enter your email address.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await apiFetch('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: cleanEmail }),
      });

      setInfoMessage(res.message || `We sent a 6-digit code to ${cleanEmail}`);
      setStep('otp');
    } catch (err) {
      console.error('Forgot password error:', err);
      setError(err.message || 'Failed to send OTP code. Please check your email.');
    } finally {
      setLoading(false);
    }
  }

  // STEP 2: Verify 6-digit OTP
  async function handleVerifyOtp(e) {
    e.preventDefault();
    const cleanOtp = otp.trim();
    if (!cleanOtp || cleanOtp.length !== 6) {
      setError('Please enter the full 6-digit verification code.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await apiFetch('/auth/verify-otp', {
        method: 'POST',
        body: JSON.stringify({
          email: email.trim(),
          otp: cleanOtp,
        }),
      });

      setError('');
      setStep('password');
    } catch (err) {
      console.error('Verify OTP error:', err);
      setError(err.message || 'Invalid or expired OTP code.');
    } finally {
      setLoading(false);
    }
  }

  // STEP 3: Reset to New Password
  async function handleResetPassword(e) {
    e.preventDefault();
    const cleanPass = newPassword.trim();
    const cleanConfirm = confirmPassword.trim();

    if (!cleanPass || cleanPass.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }
    if (cleanPass !== cleanConfirm) {
      setError('Passwords do not match. Please verify.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await apiFetch('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({
          email: email.trim(),
          otp: otp.trim(),
          newPassword: cleanPass,
        }),
      });

      setStep('success');
      setInfoMessage(res.message || 'Password reset successfully!');
      if (onPasswordResetSuccess) {
        onPasswordResetSuccess();
      }
    } catch (err) {
      console.error('Reset password error:', err);
      setError(err.message || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.2s ease-out',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) {
          handleClose();
        }
      }}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: '440px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)',
          borderRadius: '16px',
          border: '1px solid var(--line, #e2e8f0)',
          position: 'relative',
          padding: '24px 28px',
          background: 'var(--card-bg, #ffffff)',
        }}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={handleClose}
          disabled={loading}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'none',
            border: 'none',
            fontSize: '20px',
            lineHeight: 1,
            color: 'var(--muted, #94a3b8)',
            cursor: loading ? 'not-allowed' : 'pointer',
            padding: '4px 8px',
            borderRadius: '6px',
          }}
          title="Close"
        >
          ✕
        </button>

        {/* Modal Header */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: 'rgba(37, 99, 235, 0.1)',
              color: 'var(--primary, #2563eb)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '22px',
              margin: '0 auto 10px auto',
            }}
          >
            {step === 'success' ? '✓' : '🔑'}
          </div>

          <h2 style={{ fontSize: '1.35rem', fontWeight: 700, margin: '0 0 6px 0', color: 'var(--ink, #0f172a)' }}>
            {step === 'email' && 'Forgot Password'}
            {step === 'otp' && 'Verify 6-Digit Code'}
            {step === 'password' && 'Set New Password'}
            {step === 'success' && 'Password Updated!'}
          </h2>

          <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--ink-secondary, #64748b)' }}>
            {step === 'email' && 'Enter your registered email and we will send a 6-digit OTP code to reset your password.'}
            {step === 'otp' && `Enter the 6-digit verification code sent to ${email} (valid for 2 minutes).`}
            {step === 'password' && 'Enter your new password and confirm it below.'}
            {step === 'success' && 'Your password has been changed. You can now log in.'}
          </p>
        </div>

        {/* Progress indicator */}
        {step !== 'success' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
            <div style={{ flex: 1, height: '4px', borderRadius: '2px', background: 'var(--primary, #2563eb)' }} />
            <div style={{ flex: 1, height: '4px', borderRadius: '2px', background: (step === 'otp' || step === 'password') ? 'var(--primary, #2563eb)' : 'var(--line, #e2e8f0)' }} />
            <div style={{ flex: 1, height: '4px', borderRadius: '2px', background: step === 'password' ? 'var(--primary, #2563eb)' : 'var(--line, #e2e8f0)' }} />
          </div>
        )}

        {/* Alert / Errors */}
        {error && (
          <div className="error" style={{ marginBottom: '16px', fontSize: '0.88rem', padding: '10px 14px' }}>
            {error}
          </div>
        )}
        {infoMessage && step !== 'success' && (
          <div style={{ background: 'rgba(37, 99, 235, 0.08)', color: 'var(--primary, #2563eb)', border: '1px solid rgba(37,99,235,0.2)', padding: '10px 14px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '16px' }}>
            {infoMessage}
          </div>
        )}

        {/* STEP 1: Enter Email Form */}
        {step === 'email' && (
          <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="field">
              <label style={{ fontSize: '0.88rem', fontWeight: 600 }}>Your Registered Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError('');
                }}
                placeholder="name@example.com"
                required
                autoFocus
                disabled={loading}
              />
            </div>

            <button
              className="btn primary"
              type="submit"
              disabled={loading}
              style={{ width: '100%', padding: '12px', fontWeight: 600, fontSize: '0.95rem' }}
            >
              {loading ? 'Sending OTP via Brevo...' : 'Send Verification OTP'}
            </button>
          </form>
        )}

        {/* STEP 2: Enter 6-digit OTP */}
        {step === 'otp' && (
          <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="field">
              <label style={{ fontSize: '0.88rem', fontWeight: 600 }}>6-Digit Verification Code</label>
              <input
                type="text"
                maxLength={6}
                inputMode="numeric"
                pattern="[0-9]{6}"
                value={otp}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, '');
                  setOtp(val);
                  if (error) setError('');
                }}
                placeholder="• • • • • •"
                style={{
                  textAlign: 'center',
                  fontSize: '1.6rem',
                  letterSpacing: '8px',
                  fontWeight: 700,
                  padding: '10px',
                }}
                required
                autoFocus
                disabled={loading}
              />
            </div>

            <button
              className="btn primary"
              type="submit"
              disabled={loading || otp.length !== 6}
              style={{ width: '100%', padding: '12px', fontWeight: 600, fontSize: '0.95rem' }}
            >
              {loading ? 'Verifying OTP...' : 'Verify Code'}
            </button>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
              <button
                type="button"
                onClick={() => {
                  setStep('email');
                  setError('');
                }}
                style={{ background: 'none', border: 'none', color: 'var(--muted, #64748b)', cursor: 'pointer', padding: 0 }}
              >
                ← Change Email
              </button>
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={loading}
                style={{ background: 'none', border: 'none', color: 'var(--primary, #2563eb)', cursor: 'pointer', fontWeight: 600, padding: 0 }}
              >
                Resend OTP
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: Enter New Password & Confirm Password */}
        {step === 'password' && (
          <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="field">
              <label style={{ fontSize: '0.88rem', fontWeight: 600 }}>New Password</label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="At least 6 characters"
                  required
                  autoFocus
                  disabled={loading}
                  style={{ paddingRight: '44px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--muted, #64748b)',
                    padding: '4px',
                  }}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            <div className="field">
              <label style={{ fontSize: '0.88rem', fontWeight: 600 }}>Confirm New Password</label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (error) setError('');
                }}
                placeholder="Re-enter new password"
                required
                disabled={loading}
              />
            </div>

            <button
              className="btn primary"
              type="submit"
              disabled={loading}
              style={{ width: '100%', padding: '12px', fontWeight: 600, fontSize: '0.95rem', marginTop: '6px' }}
            >
              {loading ? 'Updating Password...' : 'Save New Password'}
            </button>
          </form>
        )}

        {/* STEP 4: Reset Success State */}
        {step === 'success' && (
          <div style={{ textAlign: 'center', padding: '12px 0' }}>
            <div style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#16a34a', border: '1px solid rgba(34, 197, 94, 0.25)', padding: '14px', borderRadius: '10px', fontSize: '0.95rem', marginBottom: '20px', fontWeight: 500 }}>
              🎉 Your password has been successfully reset!
            </div>
            <button
              type="button"
              className="btn primary"
              onClick={handleClose}
              style={{ width: '100%', padding: '12px', fontWeight: 600, fontSize: '0.95rem' }}
            >
              Back to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
