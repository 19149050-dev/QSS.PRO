'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import StoreInitializer from '@/components/StoreInitializer';
import GlobalDialog from '@/components/Modals/GlobalDialog';
import { useStore } from '@/store/useStore';

export default function DashboardLayout({ children }) {
  const currentUser = useStore((s) => s.currentUser);
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

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
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
      <GlobalDialog />
    </div>
  );
}
