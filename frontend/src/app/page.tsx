'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

export default function Home() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center text-odoo-text-muted">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Hero Section */}
      <div className="text-center mb-20 relative">
        {/* Animated gradient orbs */}
        <div className="absolute top-0 left-1/4 w-72 h-72 bg-odoo-primary/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-10 right-1/4 w-96 h-96 bg-purple-200/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        
        <div className="relative z-10">
          <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold text-odoo-text-primary mb-6 tracking-tight">
            Welcome to <span className="bg-gradient-to-r from-odoo-primary to-purple-500 bg-clip-text text-transparent">GearGuard</span>
          </h1>
          <p className="text-xl md:text-2xl text-odoo-text-secondary mb-10 max-w-2xl mx-auto">
            The Ultimate Maintenance Tracker
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/login" className="odoo-button-primary text-lg px-10 py-4 rounded-xl shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300">
              Login
            </Link>
            <Link href="/register" className="odoo-button-secondary text-lg px-10 py-4 rounded-xl shadow-md hover:shadow-xl transform hover:scale-105 transition-all duration-300">
              Sign Up
            </Link>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
        <FeatureCard
          iconPath="/icons/dashboard.svg"
          iconColor="pink"
          title="Real-time Dashboard"
          description="Monitor equipment health, technician workload, and pending requests at a glance"
        />
        <FeatureCard
          iconPath="/icons/wrench.svg"
          iconColor="teal"
          title="Equipment Management"
          description="Track all equipment with detailed maintenance history and health metrics"
        />
        <FeatureCard
          iconPath="/icons/clipboard.svg"
          iconColor="green"
          title="Smart Requests"
          description="Auto-fill maintenance requests based on equipment data"
        />
        <FeatureCard
          iconPath="/icons/team.svg"
          iconColor="purple"
          title="Team Collaboration"
          description="Organize maintenance teams and assign tasks efficiently"
        />
        <FeatureCard
          iconPath="/icons/calendar.svg"
          iconColor="yellow"
          title="Preventive Maintenance"
          description="Schedule and track preventive maintenance to avoid breakdowns"
        />
        <FeatureCard
          iconPath="/icons/heart.svg"
          iconColor="pink"
          title="Analytics & Reports"
          description="Get insights on equipment performance and maintenance efficiency"
        />
      </div>

      {/* CTA Section */}
      <div className="text-center bg-gradient-to-br from-odoo-primary/10 via-purple-50/50 to-odoo-primary/5 rounded-3xl p-16 shadow-2xl border border-odoo-primary/20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent transform -skew-x-12 animate-shimmer"></div>
        <div className="relative z-10">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-odoo-text-primary mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl md:text-2xl text-odoo-text-secondary mb-10 max-w-2xl mx-auto">
            Join GearGuard today and streamline your maintenance operations
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/register" className="odoo-button-primary text-lg px-10 py-4 rounded-xl shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300">
              Create Account
            </Link>
            <Link href="/login" className="odoo-button-secondary text-lg px-10 py-4 rounded-xl shadow-md hover:shadow-xl transform hover:scale-105 transition-all duration-300">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ 
  iconPath, 
  iconColor, 
  title, 
  description 
}: { 
  iconPath: string; 
  iconColor: 'pink' | 'teal' | 'yellow' | 'green' | 'purple';
  title: string; 
  description: string;
}) {
  return (
    <div className="odoo-card p-8 relative overflow-hidden group hover:shadow-2xl transition-all duration-500 rounded-2xl border border-gray-100">
      <div className="absolute inset-0 bg-gradient-to-br from-odoo-primary/5 via-transparent to-purple-100/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-odoo-primary/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
      <div className="relative z-10">
        <div className={`icon-wrapper icon-wrapper-${iconColor} mb-6 transform group-hover:scale-110 group-hover:rotate-6 transition-transform duration-500`}>
          <img src={iconPath} alt={title} className="w-10 h-10" />
        </div>
        <h3 className="text-xl font-semibold text-odoo-text-primary mb-3 group-hover:text-odoo-primary transition-colors duration-300">{title}</h3>
        <p className="text-odoo-text-secondary leading-relaxed">{description}</p>
      </div>
    </div>
  );
}


