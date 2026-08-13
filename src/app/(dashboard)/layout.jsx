'use client';

import React from 'react';
import Sidebar from '@/components/Sidebar';
import StoreInitializer from '@/components/StoreInitializer';

export default function DashboardLayout({ children }) {
  return (
    <div className="flex min-h-screen bg-white text-slate-900 font-sans selection:bg-black selection:text-white">
      <StoreInitializer />
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
