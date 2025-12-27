'use client';

import { useState } from 'react';
import Link from 'next/link';
import { authAPI } from '@/lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);

    try {
      await authAPI.forgotPassword(email);
      setSubmitted(true);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to send reset email. Please try again.';
      setError(errorMessage);
      console.error('Forgot password error:', err.response?.data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          {/* Logo and Title */}
          <div className="mb-8">
            <div className="mb-6">
              <span className="text-2xl font-bold text-gray-900">GearGuard</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Forgot Password?</h1>
            <p className="text-gray-500 text-sm">No worries, we'll send you reset instructions</p>
          </div>

          {!submitted ? (
            <>
              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
                  {error}
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Email Field */}
                <div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-odoo-primary focus:border-transparent transition-all"
                    placeholder="Enter your email"
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-odoo-primary to-purple-500 hover:from-odoo-primary/90 hover:to-purple-600 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Sending...
                    </span>
                  ) : 'Send Reset Link'}
                </button>
              </form>

              {/* Back to Login */}
              <div className="mt-6 text-center">
                <Link href="/login" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Back to Login
                </Link>
              </div>
            </>
          ) : (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Check your email</h3>
              <p className="text-gray-600 mb-2">
                We've sent a password reset link to
              </p>
              <p className="text-odoo-primary font-semibold mb-6">{email}</p>
              <p className="text-sm text-gray-500">
                Didn't receive the email?{' '}
                <button onClick={() => setSubmitted(false)} className="text-odoo-primary hover:text-purple-500 font-medium underline">
                  try again
                </button>
              </p>
              
              {/* Back to Login */}
              <div className="mt-8">
                <Link href="/login" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Back to Login
                </Link>
              </div>
            </div>
          )}

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
