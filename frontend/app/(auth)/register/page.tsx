'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertCircle, CheckCircle2, Eye, EyeOff, Loader2, Lock, Mail, Shield, User } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/axios';
import './register.css';

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  role: z.enum(['agent', 'admin']),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: 'agent' },
  });

  const passwordValue = watch('password', '');
  const strengthScore = [
    /[a-z]/.test(passwordValue),
    /[A-Z]/.test(passwordValue),
    /[0-9]/.test(passwordValue),
    /[^A-Za-z0-9]/.test(passwordValue),
    passwordValue.length >= 8,
  ].filter(Boolean).length;

  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'][strengthScore];
  const strengthColor = ['', '#ef4444', '#f97316', '#eab308', '#22c55e', '#10b981'][strengthScore];

  const onSubmit = async (data: FormData) => {
    setServerError('');
    try {
      const res = await api.post('/auth/register', {
        name: data.name,
        email: data.email,
        password: data.password,
        role: data.role,
      });
      login(res.data.token, res.data.user);
      router.push('/dashboard');
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Registration failed. Please try again.';
      setServerError(message);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-blob auth-blob--1" />
      <div className="auth-blob auth-blob--2" />

      <div className="auth-card auth-card--wide">
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

        <h1 className="auth-title">Create your account</h1>
        <p className="auth-subtitle">Join InsureFlow and manage your policies effortlessly</p>

        {serverError && (
          <div className="auth-error">
            <AlertCircle size={15} />
            <span>{serverError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          {/* Full Name */}
          <div className="auth-field">
            <label className="auth-label" htmlFor="reg-name">Full name</label>
            <div className={`auth-input-wrap ${errors.name ? 'error' : ''}`}>
              <User size={16} className="auth-input-icon" />
              <input id="reg-name" type="text" placeholder="John Smith" className="auth-input" {...register('name')} />
            </div>
            {errors.name && <p className="auth-field-error">{errors.name.message}</p>}
          </div>

          {/* Email */}
          <div className="auth-field">
            <label className="auth-label" htmlFor="reg-email">Email address</label>
            <div className={`auth-input-wrap ${errors.email ? 'error' : ''}`}>
              <Mail size={16} className="auth-input-icon" />
              <input id="reg-email" type="email" placeholder="you@example.com" className="auth-input" {...register('email')} />
            </div>
            {errors.email && <p className="auth-field-error">{errors.email.message}</p>}
          </div>

          {/* Role */}
          <div className="auth-field">
            <label className="auth-label">Role</label>
            <div className="auth-role-group">
              {(['agent', 'admin'] as const).map((r) => (
                <label key={r} className="auth-role-option">
                  <input type="radio" value={r} {...register('role')} className="auth-role-radio" />
                  <span className="auth-role-label">{r === 'agent' ? '🧑‍💼 Agent' : '👑 Admin'}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Password */}
          <div className="auth-field">
            <label className="auth-label" htmlFor="reg-password">Password</label>
            <div className={`auth-input-wrap ${errors.password ? 'error' : ''}`}>
              <Lock size={16} className="auth-input-icon" />
              <input id="reg-password" type={showPassword ? 'text' : 'password'} placeholder="Min. 8 characters" className="auth-input" {...register('password')} />
              <button type="button" className="auth-eye-btn" onClick={() => setShowPassword((v) => !v)} aria-label="Toggle password">
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {/* Strength meter */}
            {passwordValue.length > 0 && (
              <div className="auth-strength">
                <div className="auth-strength-bars">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className="auth-strength-bar"
                      style={{ background: i <= strengthScore ? strengthColor : 'rgba(255,255,255,0.08)' }}
                    />
                  ))}
                </div>
                <span style={{ color: strengthColor, fontSize: '0.72rem' }}>{strengthLabel}</span>
              </div>
            )}
            {errors.password && <p className="auth-field-error">{errors.password.message}</p>}
          </div>

          {/* Confirm Password */}
          <div className="auth-field">
            <label className="auth-label" htmlFor="reg-confirm">Confirm password</label>
            <div className={`auth-input-wrap ${errors.confirmPassword ? 'error' : ''}`}>
              <Lock size={16} className="auth-input-icon" />
              <input id="reg-confirm" type={showConfirm ? 'text' : 'password'} placeholder="Re-enter password" className="auth-input" {...register('confirmPassword')} />
              <button type="button" className="auth-eye-btn" onClick={() => setShowConfirm((v) => !v)} aria-label="Toggle confirm">
                {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {errors.confirmPassword && <p className="auth-field-error">{errors.confirmPassword.message}</p>}
          </div>

          <button type="submit" id="register-submit-btn" className="auth-btn" disabled={isSubmitting}>
            {isSubmitting ? (
              <><Loader2 size={16} className="auth-spinner" /> Creating account…</>
            ) : (
              <>
                <CheckCircle2 size={16} /> Create Account
              </>
            )}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account?{' '}
          <Link href="/login" className="auth-switch-link">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
