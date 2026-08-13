'use client';

import { useEffect, useState } from 'react';
import { ArrowRight, Building2, Eye, LockKeyhole, ShieldCheck, Sparkles, Sun, UserRound } from 'lucide-react';
import { findAuthUser } from '@/lib/authUsers';

const highlights = [
  { label: 'Hiệu quả', icon: ShieldCheck },
  { label: 'Bảo mật', icon: LockKeyhole },
  { label: 'Tối ưu', icon: Sparkles },
];

export default function LoginPage() {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('0000');
  const [error, setError] = useState('');

  useEffect(() => {
    if (window.location.pathname !== '/') {
      window.history.replaceState({}, '', '/');
    }
  }, []);

  const handleLogin = (event) => {
    event.preventDefault();

    const authUser = findAuthUser(username, password);
    if (authUser) {
      document.cookie = 'isAuthenticated=1; path=/; max-age=86400; samesite=lax';
      window.location.assign('/');
      return;
    }

    setError('Tài khoản hoặc mật khẩu không chính xác.');
  };

  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-white text-slate-900 selection:bg-black selection:text-white p-4 sm:p-8">
      {/* Minimal Background Accents */}
      <div className="absolute inset-0 opacity-[0.2] [background-image:linear-gradient(rgba(0,0,0,.1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,.1)_1px,transparent_1px)] [background-size:64px_64px]" />
      <div className="absolute left-1/2 top-0 h-40 w-px -translate-x-1/2 bg-gradient-to-b from-black/20 to-transparent" />

      <div className="relative z-10 w-full max-w-[420px]">
        {/* Branding */}
        <div className="text-center mb-10">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-[20px] bg-black text-white shadow-xl shadow-black/10">
            <Building2 className="h-8 w-8" />
          </div>
          <h1 className="text-4xl font-black tracking-tighter text-black mb-3">
            QSS PRO
          </h1>
          <p className="text-[13px] font-medium text-slate-500">
             Quản lý QS, BOQ, vật tư và hồ sơ thanh toán.
          </p>
        </div>

        {/* Login Card */}
        <form
          onSubmit={handleLogin}
          className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-[0_20px_80px_rgba(0,0,0,0.06)] backdrop-blur-2xl"
        >
          {error && (
            <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-center text-sm font-medium text-red-600">
              {error}
            </div>
          )}

          <div className="space-y-5">
            <label className="block">
              <span className="mb-2 block text-[11px] font-bold uppercase tracking-widest text-slate-500">Tài khoản</span>
              <div className="group relative flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 transition-all focus-within:border-black focus-within:bg-white focus-within:ring-4 focus-within:ring-black/5 hover:border-slate-300">
                <UserRound className="h-4 w-4 text-slate-400 transition-colors group-focus-within:text-black" />
                <input
                  type="text"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  className="h-12 w-full bg-transparent text-[14px] font-medium text-black outline-none placeholder:text-slate-400"
                  placeholder="Nhập tài khoản..."
                />
              </div>
            </label>

            <label className="block">
              <span className="mb-2 block text-[11px] font-bold uppercase tracking-widest text-slate-500">Mật khẩu</span>
              <div className="group relative flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 transition-all focus-within:border-black focus-within:bg-white focus-within:ring-4 focus-within:ring-black/5 hover:border-slate-300">
                <LockKeyhole className="h-4 w-4 text-slate-400 transition-colors group-focus-within:text-black" />
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="h-12 w-full bg-transparent text-[14px] font-medium text-black outline-none placeholder:text-slate-400"
                  placeholder="Nhập mật khẩu..."
                />
                <Eye className="h-4 w-4 text-slate-400 cursor-pointer hover:text-black transition-colors" />
              </div>
            </label>
          </div>

          <button
            type="submit"
            className="mt-8 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-black text-[14px] font-bold text-white shadow-[0_8px_20px_rgba(0,0,0,0.15)] transition-all hover:bg-slate-900 hover:shadow-[0_12px_30px_rgba(0,0,0,0.2)] active:scale-[0.98]"
          >
            Đăng nhập
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        <div className="mt-10 text-center text-[10px] font-semibold tracking-widest text-slate-500 uppercase">
          <p>ISO 27001:2022 CERTIFIED</p>
          <p className="mt-1.5 opacity-80">© 2026 QSS PRO. All rights reserved.</p>
        </div>
      </div>
    </main>
  );
}
