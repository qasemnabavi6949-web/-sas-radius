'use client';

import { Sidebar } from '@/components/sidebar';
import { Header } from '@/components/header';
import { useEffect, useState } from 'react';

import { Loader2 } from 'lucide-react';

export default function AdminLayout({children}: {children: React.ReactNode}) {
  
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    let hasAuth = false;
    try {
      hasAuth = !!localStorage.getItem('admin_auth');
    } catch {
      console.warn('localStorage blocked');
    }
    hasAuth = hasAuth || document.cookie.includes('admin_auth=true');

    if (!hasAuth) {
      window.location.href = '/login';
    } else {
      setAuthorized(true);
    }
  }, []);

  if (!authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-900 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden text-slate-100">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
