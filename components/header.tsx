'use client';

import { Bell, Search, LogOut, UserCircle } from 'lucide-react';

export function Header() {
  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-700 bg-slate-800 px-6">
      <div className="flex items-center gap-4 flex-1">
        <div className="relative w-full max-w-md hidden sm:block">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search users, IP, or MAC address..."
            className="h-9 w-full rounded-md border border-slate-700 bg-slate-900/40 pl-9 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
          />
        </div>
      </div>
      <div className="flex items-center gap-4">
        <button className="relative rounded-full p-2 text-slate-400 hover:bg-slate-700 hover:text-slate-200 transition-colors">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 flex h-2 w-2 rounded-full border-2 border-slate-800 bg-red-500"></span>
        </button>
        <div className="h-6 w-px bg-slate-700"></div>
        <div className="flex items-center gap-3">
          <div className="flex flex-col text-right hidden sm:flex">
            <span className="text-sm font-medium text-slate-100">Admin User</span>
            <span className="text-xs text-slate-400">Super Administrator</span>
          </div>
          <div className="h-8 w-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
            <UserCircle className="h-5 w-5" />
          </div>
          <button onClick={() => { 
            try { localStorage.removeItem('admin_auth'); } catch{} 
            document.cookie = 'admin_auth=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
            window.location.href = '/login'; 
          }} className="ml-2 text-slate-400 hover:text-red-600 transition-colors" title="Logout">
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
