'use client';
import { useState } from 'react';
import { Loader2, User, Lock, Globe } from 'lucide-react';

export default function AdminLogin() {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setTimeout(() => {
      if ((username === 'admin' && password === 'admin') || (username === 'admin' && password === 'password')) {
        localStorage.setItem('admin_auth', 'true');
        document.cookie = "admin_auth=true; path=/; max-age=86400; ";
        window.location.href = '/';
      } else {
        setError('Invalid username or password');
        setLoading(false);
      }
    }, 600);
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#255f85] relative overflow-hidden p-4 select-none">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(56,134,183,0.75)_0%,rgba(29,76,107,1)_85%)] pointer-events-none z-0" />

      <div className="absolute inset-0 opacity-[0.55] pointer-events-none z-0">
        <svg className="w-full h-full" xmlns="http://w3.org" fill="none" stroke="#ffffff">
          <defs>
            <linearGradient id="meshLine" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#d1e2ed" stopOpacity="0.3" />
            </linearGradient>
          </defs>
          <path d="M100,150 L300,120 L550,220 L300,380 L100,150 Z" stroke="url(#meshLine)" strokeWidth="1.8" />
          <path d="M300,120 L800,100 L1050,180 L850,350 L550,220 Z" stroke="url(#meshLine)" strokeWidth="1.8" />
          <path d="M1050,180 L1350,130 L1500,320 L1250,420 L850,350 Z" stroke="url(#meshLine)" strokeWidth="1.8" />
          <path d="M300,380 L200,620 L500,750 L650,520 L300,380 Z" stroke="url(#meshLine)" strokeWidth="1.8" />
          <path d="M850,350 L650,520 L900,780 L1150,600 L850,350 Z" stroke="url(#meshLine)" strokeWidth="1.8" />
          <path d="M1250,420 L1150,600 L1400,740 L1600,510 L1250,420 Z" stroke="url(#meshLine)" strokeWidth="1.8" />
          <line x1="300" y1="120" x2="300" y2="380" stroke="url(#meshLine)" strokeWidth="1.2" />
          <line x1="100" y1="150" x2="550" y2="220" stroke="url(#meshLine)" strokeWidth="1.2" />
          <line x1="550" y1="220" x2="850" y2="350" stroke="url(#meshLine)" strokeWidth="1.2" />
          <line x1="800" y1="100" x2="850" y2="350" stroke="url(#meshLine)" strokeWidth="1.2" />
          <line x1="1050" y1="180" x2="1250" y2="420" stroke="url(#meshLine)" strokeWidth="1.2" />
          <line x1="650" y1="520" x2="1150" y2="600" stroke="url(#meshLine)" strokeWidth="1.2" />
          <line x1="300" y1="380" x2="650" y2="520" stroke="url(#meshLine)" strokeWidth="1.5" />
          <line x1="850" y1="350" x2="1150" y2="600" stroke="url(#meshLine)" strokeWidth="1.5" />
          <g transform="translate(80, 130)" strokeWidth="2" fill="#ffffff">
            <rect x="0" y="0" width="40" height="30" rx="3" fill="#255f85" />
            <line x1="5" y1="10" x2="35" y2="10" /><line x1="5" y1="20" x2="35" y2="20" />
          </g>
          <g transform="translate(280, 100)" strokeWidth="2" fill="#ffffff">
            <circle cx="20" cy="20" r="18" fill="#255f85" />
            <path d="M10,20 L30,20 M20,10 L20,30 M13,13 L27,27 M13,27 L27,13" />
          </g>
          <g transform="translate(530, 195)" strokeWidth="2" fill="#ffffff">
            <path d="M10,25 A 10,10 0 0,1 25,10 A 12,12 0 0,1 48,15 A 10,10 0 0,1 45,30 Z" fill="#255f85" />
          </g>
          <g transform="translate(280, 360)" strokeWidth="2" fill="#ffffff">
            <rect x="2" y="2" width="36" height="24" rx="2" fill="#255f85" />
          </g>
          <g transform="translate(830, 330)" strokeWidth="2" fill="#ffffff">
            <rect x="0" y="5" width="42" height="26" rx="2" fill="#255f85" />
          </g>
          <g transform="translate(630, 495)" strokeWidth="2" fill="#ffffff">
            <circle cx="20" cy="35" r="4" fill="#ffffff" />
            <path d="M20,35 L20,15 M10,10 Q20,0 30,10" />
          </g>
          <g transform="translate(1130, 580)" strokeWidth="2" fill="#ffffff">
            <ellipse cx="20" cy="10" rx="16" ry="6" fill="#255f85" />
            <path d="M4,10 L4,22 A16,6 0 0,0 36,22 L36,10" fill="#255f85" />
          </g>
        </svg>
      </div>
      
      <div className="w-full max-w-[430px] z-10 flex flex-col items-center">
        <div className="text-center mb-6 select-none font-sans">
          <h1 className="text-[68px] font-black tracking-wide text-[#f17a22] m-0 leading-none drop-shadow-[0_2px_5px_rgba(0,0,0,0.35)]">QASEM</h1>
          <p className="text-[34px] font-bold text-white tracking-[0.2em] uppercase m-0 leading-none mt-1 drop-shadow-[0_2px_5px_rgba(0,0,0,0.45)]">Radius</p>
        </div>

        <div className="w-full bg-[#eef3f7] rounded-sm shadow-[0_20px_45px_rgba(0,0,0,0.4)] overflow-hidden border border-white/10">
          <div className="p-9 space-y-5">
            <div>
              <h2 className="text-[32px] font-semibold text-[#333333] tracking-tight">Login</h2>
              <p className="text-[#777777] text-sm mt-0.5 font-normal">Sign In to your account</p>
            </div>

            <form className="space-y-4" onSubmit={handleLogin}>
              {error && <div className="text-red-600 text-sm bg-red-50 p-3 rounded border border-red-200">{error}</div>}
              
              <div className="relative">
                <div className="absolute left-0 top-0 bottom-0 w-11 flex items-center justify-center bg-[#f7f9fa] border border-gray-300 rounded-l border-r-0"><User className="h-4 w-4 text-[#555555]" /></div>
                <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full pl-14 pr-4 py-2.5 bg-white border border-gray-300 rounded focus:outline-none focus:border-[#009cdb] text-gray-800 text-sm" placeholder="Username" />
              </div>

              <div className="relative">
                <div className="absolute left-0 top-0 bottom-0 w-11 flex items-center justify-center bg-[#f7f9fa] border border-gray-300 rounded-l border-r-0"><Lock className="h-4 w-4 text-[#555555]" /></div>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full pl-14 pr-4 py-2.5 bg-white border border-gray-300 rounded focus:outline-none focus:border-[#009cdb] text-gray-800 text-sm" placeholder="Password" />
              </div>

              <div className="relative">
                <div className="absolute left-0 top-0 bottom-0 w-11 flex items-center justify-center bg-[#f7f9fa] border border-gray-300 rounded-l border-r-0"><Globe className="h-4 w-4 text-[#555555]" /></div>
                <select className="w-full pl-14 pr-10 py-2.5 bg-white border border-gray-300 rounded focus:outline-none focus:border-[#009cdb] text-gray-700 text-sm appearance-none cursor-pointer">
                  <option>English</option>
                  <option>Persian</option>
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none border-l-[5px] border-r-[5px] border-t-[5px] border-transparent border-t-[#666666] w-0 h-0"></div>
              </div>

              <button disabled={loading} type="submit" className="w-full flex items-center justify-center py-2.5 px-4 rounded text-sm font-semibold text-white bg-[#009cdb] hover:bg-[#0089c2] focus:outline-none transition-colors mt-6 tracking-wide shadow-sm">
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Login'}
              </button>
            </form>
          </div>
        </div>

        <div className="flex justify-center items-center gap-2.5 mt-6 opacity-90 w-full">
          <div className="flex items-center bg-[#091522] text-white px-3 py-1 rounded border border-white/10 cursor-pointer hover:bg-black transition-all">
            <svg className="w-4 h-4 mr-2 fill-current text-white" viewBox="0 0 24 24"><path d="M3,5.27V18.73L16.55,12 L3,5.27 M17.87,11.33 L19.5,12.16 L17.87,13 L16.55,12 L17.87,11.33 Z" /></svg>
            <div className="text-left leading-none"><span className="block text-[7px] uppercase font-light text-gray-400">GET IT ON</span><span className="block text-[11px] font-bold tracking-tight">Google Play</span></div>
          </div>
          <div className="flex items-center bg-[#091522] text-white px-3 py-1 rounded border border-white/10 cursor-pointer hover:bg-black transition-all">
            <svg className="w-4 h-4 mr-2 fill-current text-white" viewBox="0 0 24 24"><path d="M18.71,19.5 C17.88,20.74 17,21.95 15.66,22 C14.32,22.05 13.89,21.24 12.37,21.24 C10.84,21.24 10.37,21.97 9.1,22 C7.79,22.05 6.8,20.68 5.96,19.47 C4.25,17 2.94,12.45 4.7,9.39 C5.57,7.87 7.13,6.91 8.82,6.88 C10.1,6.86 11.32,7.75 12.11,7.75 C12.89,7.75 14.37,6.68 15.92,6.84 C16.57,6.87 18.39,7.1 19.56,8.82 C19.47,8.88 17.39,10.1 17.41,12.63 C17.44,15.65 20.06,16.66 20.1,16.67 C20.08,16.74 19.67,18.11 18.71,19.5 M15.97,4.17 C16.63,3.37 17.07,2.28 16.95,1 C16,1.04 14.9,1.6 14.24,2.38 C13.68,3.04 13.19,4.14 13.34,5.39 C14.39,5.47 15.4,4.88 15.97,4.17 Z" /></svg>
            <div className="text-left leading-none"><span className="block text-[7px] font-light text-gray-400">Download on the</span><span className="block text-[11px] font-bold tracking-tight">App Store</span></div>
          </div>
        </div>

      </div>
    </div>
  );
}
