'use client';

import { useState } from 'react';

import Link from 'next/link';
import { Wifi, User, Lock, Loader2 } from 'lucide-react';

export default function PortalLogin() {
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: any) => {
    e.preventDefault();
    setError('');
    
    if (!username || !password) {
      setError('Please enter username and password');
      return;
    }
    
    setLoading(true);
    
    // Simplistic mockup login locally against dashboard API to verify existence
    try {
      const res = await fetch(`/api/users/${username}`);
      if (res.ok) {
        const data = await res.json();
        if (data.user && data.user.password === password) {
           localStorage.setItem('portal_username', username);
           window.location.href = '/portal';
        } else {
           setError('Invalid credentials');
        }
      } else {
        setError('Invalid credentials');
      }
    } catch {
      setError('Error connecting to server');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-900/40 p-4 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 left-0 w-full h-96 bg-emerald-600 rounded-b-[100%] scale-150 -translate-y-1/2 opacity-20 hidden md:block"></div>
      
      <div className="w-full max-w-md z-10">
        <div className="text-center mb-8">
          <div className="mx-auto h-16 w-16 bg-emerald-600 rounded-full flex items-center justify-center mb-4 shadow-lg">
            <Wifi className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-100">User Portal</h1>
          <p className="text-slate-400 mt-2">Manage your internet account</p>
        </div>
        
        <div className="bg-slate-800 rounded-2xl shadow-xl p-8 border border-slate-800">
          <form onSubmit={handleLogin} className="space-y-5">
            {error && <div className="text-red-500 text-sm bg-red-500/10 p-3 rounded-xl border border-red-500/20">{error}</div>}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Username</label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-900/40 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all" 
                  placeholder="Enter your username" 
                />
              </div>
            </div>
            
            <div>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-900/40 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all" 
                  placeholder="••••••••" 
                />
              </div>
            </div>
            
            <button disabled={loading} type="submit" className="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors">
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Login to My Account'}
            </button>
          </form>
        </div>
        
        <div className="text-center mt-8">
          <Link href="/login" className="text-sm font-medium text-slate-400 hover:text-slate-400 transition-colors">
            Admin Login
          </Link>
        </div>
      </div>
    </div>
  );
}
