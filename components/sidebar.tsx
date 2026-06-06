'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, FileText, 
  Users, 
  UserCog, 
  Server, 
  Settings, 
  FileBadge,
  Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'User List', href: '/users', icon: Users },
  { name: 'Manager', href: '/managers', icon: UserCog },
  { name: 'NAS', href: '/nas', icon: Server },
  { name: 'Profile', href: '/profiles', icon: FileBadge },
  { name: 'Report', href: '/report', icon: FileText },
  { name: 'System', href: '/system', icon: Settings },
  ];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-64 flex-col border-r border-slate-700 bg-slate-900 text-slate-300">
      <div className="flex h-16 items-center gap-2 border-b border-slate-800 px-6">
        <Activity className="h-6 w-6 text-blue-500" />
        <span className="text-lg font-bold text-white tracking-tight">SAS RADIUS</span>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href));
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive 
                  ? "bg-blue-600 text-white" 
                  : "hover:bg-slate-800 hover:text-white"
              )}
            >
              <item.icon className={cn("h-5 w-5", isActive ? "text-white" : "text-slate-400 group-hover:text-white")} />
              {item.name}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-slate-800 p-4">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-slate-700 flex items-center justify-center text-sm font-bold text-white">
            A
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-white">Admin</span>
            <span className="text-xs text-slate-400">admin@radius.local</span>
          </div>
        </div>
      </div>
    </div>
  );
}
