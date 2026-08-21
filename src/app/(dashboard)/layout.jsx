'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import StoreInitializer from '@/components/StoreInitializer';
import GlobalDialog from '@/components/Modals/GlobalDialog';
import { useStore } from '@/store/useStore';
import { Menu } from 'lucide-react';

export default function DashboardLayout({ children }) {
  const currentUser = useStore((s) => s.currentUser);
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Đợi Zustand hydrate xong state từ localStorage
    const timer = setTimeout(() => {
      const current = useStore.getState().currentUser;
      if (!current) {
        document.cookie = 'isAuthenticated=; path=/; max-age=0; samesite=lax';
        router.replace('/login');
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [router]);

  if (!mounted || !currentUser) return null;

  return (
    <div className="flex min-h-screen bg-white text-slate-900 font-sans selection:bg-black selection:text-white">
      <StoreInitializer />
      
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden" 
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Wrapper */}
      <div className={`fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 md:relative md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <Sidebar onCloseMobile={() => setIsMobileMenuOpen(false)} />
      </div>

      <div className="flex-1 flex flex-col min-w-0 w-full overflow-hidden">
        {/* Mobile Header with Hamburger */}
        <div className="md:hidden flex items-center justify-between p-4 bg-[#0a0a0a] text-white border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-black font-black text-sm">
              Q
            </div>
            <h1 className="font-black text-sm tracking-wider">QSS PRO</h1>
          </div>
          <button onClick={() => setIsMobileMenuOpen(true)} className="p-1 rounded-md bg-zinc-800 hover:bg-zinc-700">
            <Menu className="w-5 h-5" />
          </button>
        </div>

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
      <GlobalDialog />
    </div>
  );
}
