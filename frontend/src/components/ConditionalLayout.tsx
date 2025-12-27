'use client';

import { usePathname } from 'next/navigation';
import Header from './Header';
import Footer from './Footer';

export default function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLandingPage = pathname === '/';

  return (
    <div className="flex flex-col min-h-screen bg-odoo-bg-app">
      <Header />
      <main className="flex-1">
        {children}
      </main>
      {isLandingPage && <Footer />}
    </div>
  );
}
