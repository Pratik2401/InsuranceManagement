'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertCircle, ArrowLeft, CheckCircle2, Eye, EyeOff, KeyRound, Loader2, Lock, Mail, Shield } from 'lucide-react';
import api from '@/lib/axios';
import './forgot-password.css';

type Step = 'email' | 'otp' | 'reset' | 'success';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('email');

  // Shared state across steps
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // ─── Step 1: Send OTP ──────────────────────────────────────────────────────
  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    setIsLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setStep('otp');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // ─── OTP input handler ─────────────────────────────────────────────────────
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...otp];
    next[index] = value.slice(-1);
    setOtp(next);
    if (value && index < 5) {
      const el = document.getElementById(`otp-${index + 1}`);
      el?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(''));
      document.getElementById('otp-5')?.focus();
    }
    e.preventDefault();
  };

  // ─── Step 2: Verify OTP ────────────────────────────────────────────────────
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const otpString = otp.join('');
    if (otpString.length !== 6) {
      setError('Please enter the complete 6-digit OTP.');
      return;
    }
    setIsLoading(true);
    try {
      await api.post('/auth/verify-otp', { email, otp: otpString });
      setStep('reset');
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Invalid or expired OTP.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Step 3: Reset Password ────────────────────────────────────────────────
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }
    setIsLoading(true);
    try {
      await api.post('/auth/reset-password', {
        email,
        otp: otp.join(''),
        newPassword,
      });
      setStep('success');
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to reset password.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Step indicator ────────────────────────────────────────────────────────
  const steps: Step[] = ['email', 'otp', 'reset'];
  const stepIndex = steps.indexOf(step);

  return (
    <div className="auth-page">
      <div className="auth-blob auth-blob--1" />
      <div className="auth-blob auth-blob--2" />

      <div className="auth-card">
        {/* Logo */}
        <div className="auth-logo">
          <div className="auth-logo-icon">
            <Shield size={22} />
          </div>
          <div>
            <p className="auth-brand-name">InsureFlow</p>
            <p className="auth-brand-sub">Management Suite</p>
          </div>
        </div>

        {/* Step progress (only for steps 1-3) */}
        {step !== 'success' && (
          <div className="auth-steps">
            {steps.map((s, i) => (
              <div key={s} className="auth-step-wrap">
                <div className={`auth-step-dot ${i <= stepIndex ? 'active' : ''}`}>
                  {i < stepIndex ? <CheckCircle2 size={12} /> : i + 1}
                </div>
                {i < steps.length - 1 && (
                  <div className={`auth-step-line ${i < stepIndex ? 'filled' : ''}`} />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="auth-error">
            <AlertCircle size={15} />
            <span>{error}</span>
          </div>
        )}

        {/* ─── Step 1: Email ── */}
        {step === 'email' && (
          <>
            <h1 className="auth-title">Forgot password?</h1>
            <p className="auth-subtitle">Enter your email and we&apos;ll send you a one-time code</p>
            <form onSubmit={handleSendOTP} noValidate>
              <div className="auth-field">
                <label className="auth-label" htmlFor="fp-email">Email address</label>
                <div className="auth-input-wrap">
                  <Mail size={16} className="auth-input-icon" />
                  <input
                    id="fp-email"
                    type="email"
                    placeholder="you@example.com"
                    className="auth-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>
              <button type="submit" id="fp-send-otp-btn" className="auth-btn" disabled={isLoading}>
                {isLoading ? <><Loader2 size={16} className="auth-spinner" /> Sending OTP…</> : 'Send OTP'}
              </button>
            </form>
          </>
        )}

        {/* ─── Step 2: OTP ── */}
        {step === 'otp' && (
          <>
            <h1 className="auth-title">Enter OTP</h1>
            <p className="auth-subtitle">
              We sent a 6-digit code to <strong style={{ color: '#c3c0ff' }}>{email}</strong>
            </p>
            <form onSubmit={handleVerifyOTP}>
              <div className="auth-otp-group">
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    id={`otp-${i}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    className={`auth-otp-input ${digit ? 'filled' : ''}`}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    onPaste={i === 0 ? handleOtpPaste : undefined}
                  />
                ))}
              </div>
              <button type="submit" id="fp-verify-otp-btn" className="auth-btn" disabled={isLoading}>
                {isLoading ? <><Loader2 size={16} className="auth-spinner" /> Verifying…</> : 'Verify OTP'}
              </button>
              <button
                type="button"
                className="auth-btn auth-btn--ghost"
                onClick={() => { setStep('email'); setOtp(['', '', '', '', '', '']); setError(''); }}
              >
                <ArrowLeft size={15} /> Back
              </button>
            </form>
          </>
        )}

        {/* ─── Step 3: New Password ── */}
        {step === 'reset' && (
          <>
            <h1 className="auth-title">Set new password</h1>
            <p className="auth-subtitle">Choose a strong password for your account</p>
            <form onSubmit={handleResetPassword} noValidate>
              <div className="auth-field">
                <label className="auth-label" htmlFor="fp-new-pw">New password</label>
                <div className="auth-input-wrap">
                  <Lock size={16} className="auth-input-icon" />
                  <input
                    id="fp-new-pw"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Min. 8 characters"
                    className="auth-input"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                  <button type="button" className="auth-eye-btn" onClick={() => setShowPassword((v) => !v)} aria-label="Toggle">
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
              <div className="auth-field">
                <label className="auth-label" htmlFor="fp-confirm-pw">Confirm password</label>
                <div className="auth-input-wrap">
                  <KeyRound size={16} className="auth-input-icon" />
                  <input
                    id="fp-confirm-pw"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Re-enter password"
                    className="auth-input"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>
              <button type="submit" id="fp-reset-btn" className="auth-btn" disabled={isLoading}>
                {isLoading ? <><Loader2 size={16} className="auth-spinner" /> Resetting…</> : 'Reset Password'}
              </button>
            </form>
          </>
        )}

        {/* ─── Step 4: Success ── */}
        {step === 'success' && (
          <div className="auth-success">
            <div className="auth-success-icon">
              <CheckCircle2 size={40} />
            </div>
            <h1 className="auth-title">Password reset!</h1>
            <p className="auth-subtitle">Your password has been updated successfully.</p>
            <button
              id="fp-go-login-btn"
              className="auth-btn"
              onClick={() => router.push('/login')}
            >
              Go to Login
            </button>
          </div>
        )}

        {step === 'email' && (
          <p className="auth-switch">
            Remember your password?{' '}
            <Link href="/login" className="auth-switch-link">Sign in</Link>
          </p>
        )}
      </div>
    </div>
  );
}
