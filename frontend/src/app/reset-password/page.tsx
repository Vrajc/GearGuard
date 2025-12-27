'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  useEffect(() => {
    if (!token) {
      router.push('/forgot-password');
    }
  }, [token, router]);

  const validatePassword = (password: string) => {
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const hasMinLength = password.length >= 8;

    return {
      hasUpperCase,
      hasLowerCase,
      hasSpecialChar,
      hasMinLength,
      isValid: hasUpperCase && hasLowerCase && hasSpecialChar && hasMinLength,
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError('');
    const newErrors: { [key: string]: string } = {};

    const passwordCheck = validatePassword(formData.password);
    if (!passwordCheck.isValid) {
      newErrors.password = 'Password must contain uppercase, lowercase, special character and be 8+ characters';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setLoading(true);

    try {
      const response = await api.post(`/auth/reset-password/${token}`, {
        password: formData.password,
      });
      
      // Store token and redirect
      localStorage.setItem('token', response.data.token);
      router.push('/dashboard');
    } catch (err: any) {
      setApiError(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  const passwordValidation = validatePassword(formData.password);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-odoo-bg-app">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="icon-wrapper icon-wrapper-green">
              <img src="/icons/lightning.svg" alt="GearGuard" className="w-12 h-12" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-odoo-text-primary mb-2">
            Reset Password
          </h1>
          <p className="text-odoo-text-secondary">Enter your new password</p>
        </div>

        <div className="odoo-card p-8">{apiError && (
            <div className="bg-odoo-danger/10 border border-odoo-danger/50 text-odoo-danger px-4 py-3 rounded mb-6 text-sm">
              {apiError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-odoo-text-primary mb-2">
                New Password
              </label>
              <input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className={`w-full px-4 py-3 bg-white border ${
                  errors.password ? 'border-odoo-danger' : 'border-odoo-border'
                } rounded text-odoo-text-primary placeholder-odoo-text-muted focus:outline-none focus:ring-2 focus:ring-odoo-primary focus:border-transparent transition-all`}
                placeholder="••••••••"
              />
              {errors.password && (
                <p className="mt-1 text-xs text-odoo-danger">{errors.password}</p>
              )}
              
              {formData.password && (
                <div className="mt-2 space-y-1">
                  <p className={`text-xs ${passwordValidation.hasMinLength ? 'text-odoo-success' : 'text-odoo-text-muted'}`}>
                    {passwordValidation.hasMinLength ? '✓' : '○'} At least 8 characters
                  </p>
                  <p className={`text-xs ${passwordValidation.hasUpperCase ? 'text-odoo-success' : 'text-odoo-text-muted'}`}>
                    {passwordValidation.hasUpperCase ? '✓' : '○'} One uppercase letter
                  </p>
                  <p className={`text-xs ${passwordValidation.hasLowerCase ? 'text-odoo-success' : 'text-odoo-text-muted'}`}>
                    {passwordValidation.hasLowerCase ? '✓' : '○'} One lowercase letter
                  </p>
                  <p className={`text-xs ${passwordValidation.hasSpecialChar ? 'text-odoo-success' : 'text-odoo-text-muted'}`}>
                    {passwordValidation.hasSpecialChar ? '✓' : '○'} One special character
                  </p>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-odoo-text-primary mb-2">
                Confirm New Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className={`w-full px-4 py-3 bg-white border ${
                  errors.confirmPassword ? 'border-odoo-danger' : 'border-odoo-border'
                } rounded text-odoo-text-primary placeholder-odoo-text-muted focus:outline-none focus:ring-2 focus:ring-odoo-primary focus:border-transparent transition-all`}
                placeholder="••••••••"
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-xs text-odoo-danger">{errors.confirmPassword}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full odoo-button-primary py-3 text-base disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        </div>

        <div className="mt-6 text-center text-sm text-odoo-text-secondary">
          Remember your password?{' '}
          <Link href="/login" className="text-odoo-primary hover:text-odoo-primary/80 font-medium transition-colors">
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
