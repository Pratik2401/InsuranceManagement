'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertCircle, CheckCircle2, Eye, EyeOff, Loader2, Lock, Mail, Shield } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/axios';
import './login.css';

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setServerError('');
    try {
      const res = await api.post('/auth/login', data);
      login(res.data.token, res.data.user);
      router.push('/dashboard');
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Login failed. Please try again.';
      setServerError(message);
    }
  };

  return (
    <div className="auth-page">
      {/* Ambient blobs */}
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

        <h1 className="auth-title">Welcome back</h1>
        <p className="auth-subtitle">Sign in to your account to continue</p>

        {/* Error */}
        {serverError && (
          <div className="auth-error">
            <AlertCircle size={15} />
            <span>{serverError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          {/* Email */}
          <div className="auth-field">
            <label className="auth-label" htmlFor="login-email">Email address</label>
            <div className={`auth-input-wrap ${errors.email ? 'error' : ''}`}>
              <Mail size={16} className="auth-input-icon" />
              <input
                id="login-email"
                type="email"
                placeholder="you@example.com"
                className="auth-input"
                {...register('email')}
              />
            </div>
            {errors.email && <p className="auth-field-error">{errors.email.message}</p>}
          </div>

          {/* Password */}
          <div className="auth-field">
            <div className="auth-label-row">
              <label className="auth-label" htmlFor="login-password">Password</label>
              <Link href="/forgot-password" className="auth-forgot-link">Forgot password?</Link>
            </div>
            <div className={`auth-input-wrap ${errors.password ? 'error' : ''}`}>
              <Lock size={16} className="auth-input-icon" />
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                className="auth-input"
                {...register('password')}
              />
              <button
                type="button"
                className="auth-eye-btn"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {errors.password && <p className="auth-field-error">{errors.password.message}</p>}
          </div>

          <button
            type="submit"
            id="login-submit-btn"
            className="auth-btn"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <><Loader2 size={16} className="auth-spinner" /> Signing in…</>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <p className="auth-switch">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="auth-switch-link">Create account</Link>
        </p>
      </div>
    </div>
  );
}
