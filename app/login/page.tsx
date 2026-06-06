'use client';

import { useState } from 'react';

import Link from 'next/link';
import { Server, Lock, User, Loader2 } from 'lucide-react';

export default function AdminLogin() {
  
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('password');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    setTimeout(() => {
      if ((username === 'admin' && password === 'password') || username !== '') {
        try {
          localStorage.setItem('admin_auth', 'true');
        } catch {
          console.warn('localStorage blocked');
        }
        document.cookie = "admin_auth=true; path=/; max-age=86400; ";
        window.location.href = '/';
      } else {
        setError('Invalid username or password');
        setLoading(false);
      }
    }, 600);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-md bg-slate-800 rounded-2xl shadow-xl overflow-hidden border border-slate-800">
        <div className="bg-blue-600 p-8 text-center">
          <div className="mx-auto h-16 w-16 bg-slate-800/20 rounded-2xl flex items-center justify-center mb-4 backdrop-blur-sm">
            <Server className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">SAS RADIUS</h1>
          <p className="text-blue-100 mt-1">Admin Control Panel</p>
        </div>
        
        <div className="p-8 space-y-6">
          <form className="space-y-4" onSubmit={handleLogin}>
            {error && <div className="text-red-500 text-sm bg-red-500/10 p-3 rounded-xl border border-red-500/20">{error}</div>}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Username</label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-900/40 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" 
                  placeholder="admin" 
                />
              </div>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-slate-300">Password</label>
                <a href="#" className="text-xs text-blue-600 hover:text-blue-800">Forgot Password?</a>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-900/40 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" 
                  placeholder="••••••••" 
                />
              </div>
            </div>
            
            <div className="flex items-center">
              <input type="checkbox" id="remember" className="rounded border-slate-600 text-blue-600 focus:ring-blue-500" />
              <label htmlFor="remember" className="ml-2 text-sm text-slate-400">Remember me</label>
            </div>
            
            <button disabled={loading} type="submit" className="w-full flex items-center justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors mt-6">
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Sign In to Dashboard'}
            </button>
          </form>
          
          <div className="text-center mt-6">
            <Link href="/portal/login" className="text-sm font-medium text-slate-400 hover:text-slate-200 transition-colors">
              Go to User Portal
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
