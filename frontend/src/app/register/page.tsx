'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'employee',
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

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

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    // Password validation
    const passwordCheck = validatePassword(formData.password);
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (!passwordCheck.isValid) {
      newErrors.password = 'Password must contain uppercase, lowercase, special character and be 8+ characters';
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please re-enter your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError('');

    if (!validateForm()) return;

    setLoading(true);

    try {
      await register(formData.name, formData.email, formData.password, formData.role);
      router.push('/dashboard');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Registration failed';
      if (errorMessage.includes('duplicate') || errorMessage.includes('exists')) {
        setApiError('Email id should not be a duplicate in database');
      } else {
        setApiError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const passwordValidation = validatePassword(formData.password);

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white overflow-y-auto">
        <div className="w-full max-w-md">
          {/* Logo and Title */}
          <div className="mb-8">
            <div className="mb-6">
              <span className="text-2xl font-bold text-gray-900">GearGuard</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Join GearGuard!</h1>
            <p className="text-gray-500 text-sm">Create Your Account To Get Started</p>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-4 mb-8 border-b border-gray-200">
            <button
              onClick={() => router.push('/login')}
              className="pb-3 px-1 font-medium text-gray-500 hover:text-gray-700 transition-all"
            >
              Sign in
            </button>
            <button
              className="pb-3 px-1 font-medium text-odoo-primary transition-all relative"
            >
              Sign Up
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-odoo-primary"></div>
            </button>
          </div>

          {/* API Error Message */}
          {apiError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
              {apiError}
            </div>
          )}
          {/* Signup Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name Field */}
            <div>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value });
                  setErrors({ ...errors, name: '' });
                }}
                className={`w-full px-4 py-3 bg-gray-50 border ${
                  errors.name ? 'border-red-500' : 'border-gray-200'
                } rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-odoo-primary focus:border-transparent transition-all`}
                placeholder="Enter your full name"
              />
              {errors.name && (
                <p className="mt-1 text-xs text-red-500">{errors.name}</p>
              )}
            </div>

            {/* Email Field */}
            <div>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => {
                  setFormData({ ...formData, email: e.target.value });
                  setErrors({ ...errors, email: '' });
                }}
                className={`w-full px-4 py-3 bg-gray-50 border ${
                  errors.email ? 'border-red-500' : 'border-gray-200'
                } rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-odoo-primary focus:border-transparent transition-all`}
                placeholder="Enter your email"
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-500">{errors.email}</p>
              )}
            </div>

            {/* Password Field */}
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => {
                  setFormData({ ...formData, password: e.target.value });
                  setErrors({ ...errors, password: '' });
                }}
                className={`w-full px-4 py-3 bg-gray-50 border ${
                  errors.password ? 'border-red-500' : 'border-gray-200'
                } rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-odoo-primary focus:border-transparent transition-all pr-12`}
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                )}
              </button>
              {errors.password && (
                <p className="mt-1 text-xs text-red-500">{errors.password}</p>
              )}
            </div>

            {/* Confirm Password Field */}
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={(e) => {
                  setFormData({ ...formData, confirmPassword: e.target.value });
                  setErrors({ ...errors, confirmPassword: '' });
                }}
                className={`w-full px-4 py-3 bg-gray-50 border ${
                  errors.confirmPassword ? 'border-red-500' : 'border-gray-200'
                } rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-odoo-primary focus:border-transparent transition-all pr-12`}
                placeholder="Confirm your password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                )}
              </button>
              {errors.confirmPassword && (
                <p className="mt-1 text-xs text-red-500">{errors.confirmPassword}</p>
              )}
            </div>

            {/* Role Selection */}
            <div>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-odoo-primary focus:border-transparent transition-all"
              >
                <option value="employee">Employee</option>
                <option value="technician">Technician</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            {/* Sign Up Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-odoo-primary to-purple-500 hover:from-odoo-primary/90 hover:to-purple-600 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed mt-6"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating account...
                </span>
              ) : 'Sign Up'}
            </button>
          </form>

          {/* Footer */}
          <p className="mt-8 text-center text-xs text-gray-500">
            © 2025 GearGuard. All rights reserved.{' '}
            <br className="sm:hidden" />
            For more information, visit our{' '}
            <a href="#" className="text-odoo-primary hover:underline">Terms of Service</a> and{' '}
            <a href="#" className="text-odoo-primary hover:underline">Privacy</a>
          </p>
        </div>
      </div>

      {/* Right Side - Gradient Background */}
      <div className="hidden lg:block lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-odoo-primary via-purple-600 to-purple-800">
        {/* Animated wavy gradient effect */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-purple-400 to-transparent animate-pulse"></div>
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-96 h-96 bg-gradient-to-br from-purple-400/30 to-odoo-primary/30 rounded-full blur-3xl animate-pulse"></div>
        </div>
        {/* Wavy layers */}
        <div className="absolute bottom-0 left-0 right-0 h-3/4">
          <svg className="absolute bottom-0 w-full h-full" viewBox="0 0 1440 800" preserveAspectRatio="none">
            <path fill="rgba(135, 90, 123, 0.3)" d="M0,400 C360,300 720,500 1440,400 L1440,800 L0,800 Z" className="animate-wave">
              <animate attributeName="d" dur="10s" repeatCount="indefinite" 
                values="M0,400 C360,300 720,500 1440,400 L1440,800 L0,800 Z;
                        M0,400 C360,500 720,300 1440,400 L1440,800 L0,800 Z;
                        M0,400 C360,300 720,500 1440,400 L1440,800 L0,800 Z"/>
            </path>
            <path fill="rgba(168, 85, 247, 0.3)" d="M0,500 C360,400 720,600 1440,500 L1440,800 L0,800 Z">
              <animate attributeName="d" dur="15s" repeatCount="indefinite" 
                values="M0,500 C360,400 720,600 1440,500 L1440,800 L0,800 Z;
                        M0,500 C360,600 720,400 1440,500 L1440,800 L0,800 Z;
                        M0,500 C360,400 720,600 1440,500 L1440,800 L0,800 Z"/>
            </path>
            <path fill="rgba(192, 132, 252, 0.3)" d="M0,600 C360,500 720,700 1440,600 L1440,800 L0,800 Z">
              <animate attributeName="d" dur="20s" repeatCount="indefinite" 
                values="M0,600 C360,500 720,700 1440,600 L1440,800 L0,800 Z;
                        M0,600 C360,700 720,500 1440,600 L1440,800 L0,800 Z;
                        M0,600 C360,500 720,700 1440,600 L1440,800 L0,800 Z"/>
            </path>
          </svg>
        </div>
      </div>
    </div>
  );
}
