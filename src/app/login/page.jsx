'use client';

import { useEffect, useState } from 'react';
import { ArrowRight, Building2, Eye, EyeOff, LockKeyhole, ShieldCheck, Sparkles, UserRound, Zap } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const { users, loginUser } = useStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const fetchSupabaseData = useStore((s) => s.fetchSupabaseData);

  useEffect(() => {
    if (window.location.pathname !== '/') {
      window.history.replaceState({}, '', '/');
    }
    fetchSupabaseData();
  }, [fetchSupabaseData]);

  const handleLogin = (event) => {
    event.preventDefault();

    const inputUsername = username.trim().toLowerCase();
    const user = users.find(u => 
      u.username.toLowerCase() === inputUsername || 
      u.username.toLowerCase() === `@${inputUsername}`
    );

    if (user) {
      const expectedPassword = user.password || (user.username === '@admin' ? '0000' : '1234');
      if (password === expectedPassword) {
        document.cookie = 'isAuthenticated=1; path=/; max-age=86400; samesite=lax';
        loginUser(user);
        router.push('/');
        return;
      }
    }

    setError('Tài khoản hoặc mật khẩu không chính xác.');
  };

  return (
    <main className="min-h-screen bg-[#050505] flex items-center justify-center p-6 relative overflow-hidden selection:bg-yellow-500 selection:text-black">
      {/* Background Glows */}
      <div className="absolute left-1/4 top-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-yellow-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute right-1/4 top-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-yellow-600/5 rounded-full blur-[100px] pointer-events-none" />
      
      <div className="w-full max-w-[1100px] grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-8 relative z-10">
        
        {/* Left Side - Branding */}
        <div className="flex flex-col justify-center items-center md:items-start text-center md:text-left">
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl border border-yellow-500/30 bg-yellow-500/5 shadow-[0_0_30px_rgba(234,179,8,0.15)] mb-6">
            <Building2 className="w-7 h-7 text-yellow-500" />
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-white mb-2">
            QSS <span className="text-yellow-500">Pro</span>
          </h1>
          <p className="text-[10px] md:text-[11px] font-bold text-zinc-400 tracking-[0.3em] uppercase mb-8 ml-1">
            Hệ thống quản lý nội bộ
          </p>
          
          <div className="w-16 h-px bg-gradient-to-r from-yellow-500/50 to-transparent mb-8 md:mx-0 mx-auto" />

          <div className="flex flex-wrap justify-center md:justify-start gap-3">
            <div className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-yellow-500/20 bg-yellow-500/5">
              <Zap className="w-3.5 h-3.5 text-yellow-500/80" />
              <span className="text-xs font-medium text-yellow-500/80">Hiệu quả</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-yellow-500/20 bg-yellow-500/5">
              <ShieldCheck className="w-3.5 h-3.5 text-yellow-500/80" />
              <span className="text-xs font-medium text-yellow-500/80">Bảo mật</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-yellow-500/20 bg-yellow-500/5">
              <Sparkles className="w-3.5 h-3.5 text-yellow-500/80" />
              <span className="text-xs font-medium text-yellow-500/80">Tối ưu</span>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="flex flex-col items-center md:items-end justify-center">
          <div className="w-full max-w-[400px] relative">
            
            {/* The Floating Box */}
            <div className="p-10 rounded-[2rem] border border-yellow-500/10 bg-[#0a0a0a]/80 backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,0.5)] relative overflow-hidden">
              {/* Subtle top glow line */}
              <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-yellow-500/30 to-transparent" />
              
              <div className="text-center mb-8">
                <div className="mx-auto flex items-center justify-center w-12 h-12 rounded-2xl border border-yellow-500/20 bg-yellow-500/5 mb-4">
                  <Building2 className="w-6 h-6 text-yellow-500/80" />
                </div>
                <h2 className="text-xl font-bold text-white mb-2">Chào mừng trở lại</h2>
                <p className="text-xs text-zinc-500">Đăng nhập để tiếp tục làm việc</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-5">
                {error && (
                  <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-center text-xs font-medium text-red-400">
                    {error}
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 ml-1">Tài khoản</label>
                  <div className="relative flex items-center">
                    <UserRound className="h-4 w-4 text-zinc-500 absolute left-4" />
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full bg-[#f4f4f5] text-[14px] font-medium text-black rounded-xl pl-11 pr-4 py-3 outline-none focus:ring-2 focus:ring-yellow-500/50 transition-shadow"
                      placeholder="Nhập tài khoản"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 ml-1">Mật khẩu</label>
                  <div className="relative flex items-center">
                    <LockKeyhole className="h-4 w-4 text-zinc-500 absolute left-4" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-[#f4f4f5] text-[14px] font-medium text-black rounded-xl pl-11 pr-11 py-3 outline-none focus:ring-2 focus:ring-yellow-500/50 transition-shadow"
                      placeholder="Nhập mật khẩu"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 text-zinc-400 hover:text-black transition-colors">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="mt-8 w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-yellow-500 to-yellow-400 hover:to-yellow-500 text-black font-bold text-[13px] transition-all shadow-[0_4px_15px_rgba(234,179,8,0.2)] hover:shadow-[0_6px_20px_rgba(234,179,8,0.3)] active:scale-[0.98]"
                >
                  Đăng nhập
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>
            </div>

            {/* Footer Text */}
            <div className="mt-8 text-center md:text-right">
              <p className="text-[9px] font-bold text-zinc-600 tracking-widest uppercase mb-1">ISO 27001:2022 CERTIFIED SECURITY</p>
              <p className="text-[9px] font-medium text-zinc-700">© 2026 QSS PRO Enterprise. All rights reserved.</p>
            </div>
          </div>
        </div>
        
      </div>
    </main>
  );
}
