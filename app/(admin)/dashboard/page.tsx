'use client';

import { useState, useEffect } from 'react';
import AdminTrafficChart from '../AdminTrafficChart';
import { cn } from '@/lib/utils';

function SemiCircleGauge({ value, label, colorClass }: { value: number, label: string, colorClass: string }) {
  const radius = 80;
  const circumference = Math.PI * radius;
  const strokeDashoffset = circumference - (value / 100) * circumference;
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-48 h-28 overflow-hidden flex items-end justify-center">
        <svg className="absolute top-0 left-0 w-full h-full" viewBox="0 0 200 110">
          <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="#e2e8f0" strokeWidth="16" strokeLinecap="round" />
          <path 
            d="M 20 100 A 80 80 0 0 1 180 100" 
            fill="none" 
            className={colorClass} 
            stroke="currentColor" 
            strokeWidth="16" 
            strokeLinecap="round" 
            strokeDasharray={circumference} 
            strokeDashoffset={strokeDashoffset} 
            style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
          />
        </svg>
        <div className="mb-2 text-center">
          <span className="text-3xl font-bold text-slate-200">{value}%</span>
        </div>
      </div>
      <span className="mt-2 text-sm font-semibold text-slate-400 uppercase tracking-wider">{label}</span>
    </div>
  );
}

export default function Dashboard() {
  const [mounted, setMounted] = useState(false);
  const [stats, setStats] = useState<any>({
    totalUsers: 0,
    onlineUsers: 0,
    managers: 1,
    trafficData: [
      { time: '00:00', in: 0, out: 0 }
    ],
    recentAuths: [],
    system: { cpuLoad: 0, memUsage: 0, diskUsage: 45, uptime: 'Loading...' }
  });

  useEffect(() => {
    setMounted(true);
    fetch('/api/dashboard')
      .then(r => r.json())
      .then(data => {
        if (!data.error) setStats(data);
      })
      .catch(console.error);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-100">Dashboard</h1>
        <p className="text-sm text-slate-400">Overview of your RADIUS server performance and active sessions.</p>
      </div>

      {/* Gauges Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-700 bg-slate-800 p-6 shadow-sm flex justify-center">
          <SemiCircleGauge value={stats.system?.cpuLoad || 0} label="CPU Load" colorClass="text-blue-500" />
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-800 p-6 shadow-sm flex justify-center">
          <SemiCircleGauge value={stats.system?.memUsage || 0} label="Memory Usage" colorClass="text-emerald-500" />
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-800 p-6 shadow-sm flex justify-center">
          <SemiCircleGauge value={stats.system?.diskUsage || 0} label="Disk Usage" colorClass="text-amber-500" />
        </div>
      </div>

      {/* Info & Stats Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* System Info */}
        <div className="rounded-xl border border-slate-700 bg-slate-800 shadow-sm overflow-hidden">
          <div className="border-b border-slate-700 bg-slate-900/40 px-6 py-4">
            <h2 className="font-semibold text-slate-100">System Information</h2>
          </div>
          <div className="p-0">
            <table className="w-full text-sm text-left">
              <tbody className="divide-y divide-slate-800">
                <tr className="hover:bg-slate-700/50"><td className="px-6 py-3 text-slate-400">Uptime</td><td className="px-6 py-3 font-medium text-slate-100">{stats.system?.uptime || 'Loading...'}</td></tr>
                <tr className="hover:bg-slate-700/50"><td className="px-6 py-3 text-slate-400">Backup Disk</td><td className="px-6 py-3 font-medium text-slate-100">None, using system disk</td></tr>
                <tr className="hover:bg-slate-700/50"><td className="px-6 py-3 text-slate-400">Network Status</td><td className="px-6 py-3 font-medium text-emerald-600">Internet Reachable</td></tr>
                <tr className="hover:bg-slate-700/50"><td className="px-6 py-3 text-slate-400">Database Time</td><td className="px-6 py-3 font-medium text-slate-100">{new Date().toLocaleString()}</td></tr>
                <tr className="hover:bg-slate-700/50"><td className="px-6 py-3 text-slate-400">Time Zone</td><td className="px-6 py-3 font-medium text-slate-100">{Intl.DateTimeFormat().resolvedOptions().timeZone}</td></tr>
                <tr className="hover:bg-slate-700/50"><td className="px-6 py-3 text-slate-400">System Version</td><td className="px-6 py-3 font-medium text-slate-100">4.58.2</td></tr>
                <tr className="hover:bg-slate-700/50"><td className="px-6 py-3 text-slate-400">License Status</td><td className="px-6 py-3 font-medium text-emerald-600">active</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* User Stats */}
        <div className="rounded-xl border border-slate-700 bg-slate-800 shadow-sm overflow-hidden">
          <div className="border-b border-slate-700 bg-slate-900/40 px-6 py-4">
            <h2 className="font-semibold text-slate-100">User Statistics</h2>
          </div>
          <div className="p-0">
            <table className="w-full text-sm text-left">
              <tbody className="divide-y divide-slate-800">
                <tr className="hover:bg-slate-700/50"><td className="px-6 py-3 text-slate-400">Total Users</td><td className="px-6 py-3 font-medium text-slate-100">{stats.totalUsers}</td></tr>
                <tr className="hover:bg-slate-700/50"><td className="px-6 py-3 text-slate-400">Online Users</td><td className="px-6 py-3 font-medium text-blue-600">{stats.onlineUsers}</td></tr>
                <tr className="hover:bg-slate-700/50"><td className="px-6 py-3 text-slate-400">Active Users</td><td className="px-6 py-3 font-medium text-emerald-600">{stats.totalUsers}</td></tr>
                <tr className="hover:bg-slate-700/50"><td className="px-6 py-3 text-slate-400">Expired Users</td><td className="px-6 py-3 font-medium text-red-600">0</td></tr>
                <tr className="hover:bg-slate-700/50"><td className="px-6 py-3 text-slate-400">Expiring Today</td><td className="px-6 py-3 font-medium text-amber-600">0</td></tr>
                <tr className="hover:bg-slate-700/50"><td className="px-6 py-3 text-slate-400">About to Expire</td><td className="px-6 py-3 font-medium text-amber-600">0</td></tr>
                <tr className="hover:bg-slate-700/50"><td className="px-6 py-3 text-slate-400">Online FUP</td><td className="px-6 py-3 font-medium text-slate-100">0</td></tr>
                <tr className="hover:bg-slate-700/50"><td className="px-6 py-3 text-slate-400">Managers</td><td className="px-6 py-3 font-medium text-slate-100">{stats.managers}</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Charts Area */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="col-span-1 lg:col-span-2 rounded-xl border border-slate-700 bg-slate-800 p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-100">Network Traffic (Mbps)</h2>
            <select className="rounded-md border border-slate-700 bg-slate-900/40 px-3 py-1 text-sm outline-none">
              <option>Last 24 Hours</option>
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
            </select>
          </div>
          <div className="h-[300px] w-full">
            {mounted && (
              <AdminTrafficChart data={stats.trafficData} />
            )}
          </div>
        </div>

        <div className="rounded-xl border border-slate-700 bg-slate-800 p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-slate-100">Recent Authentications</h2>
          <div className="space-y-4">
            {stats.recentAuths && stats.recentAuths.length > 0 ? stats.recentAuths.map((log: any, i: number) => (
              <div key={i} className="flex items-center justify-between border-b border-slate-800 pb-4 last:border-0 last:pb-0">
                <div>
                  <p className="text-sm font-medium text-slate-100">{log.user}</p>
                  <p className="font-mono text-xs text-slate-400">{log.ip}</p>
                </div>
                <div className="text-right">
                  <span className={cn(
                    "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                    log.status === 'Accept' ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                  )}>
                    {log.status}
                  </span>
                  <p className="mt-1 text-xs text-slate-400">{log.time}</p>
                </div>
              </div>
            )) : <p className="text-sm text-slate-400">No recent authentications.</p>}
          </div>
        </div>
      </div>

      {/* Online Users Active Sessions */}
      <div className="rounded-xl border border-slate-700 bg-slate-800 shadow-sm overflow-hidden">
        <div className="border-b border-slate-700 bg-slate-900/40 px-6 py-4 flex justify-between items-center">
          <h2 className="font-semibold text-slate-100">Active Sessions (Online Users)</h2>
          <span className="bg-blue-600 text-white rounded-full px-3 py-0.5 text-xs font-medium">
            {stats.onlineUsers || 0} Online
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
             <thead className="bg-slate-900/40 text-xs uppercase text-slate-400 border-b border-slate-700">
                <tr>
                  <th className="px-6 py-3 font-medium">Username</th>
                  <th className="px-6 py-3 font-medium">IP Address</th>
                  <th className="px-6 py-3 font-medium">MAC Address</th>
                  <th className="px-6 py-3 font-medium text-right">Start Time</th>
                </tr>
             </thead>
             <tbody className="divide-y divide-slate-800">
               {stats.activeSessions && stats.activeSessions.length > 0 ? stats.activeSessions.map((session: any, i: number) => (
                 <tr key={i} className="hover:bg-slate-700/50">
                    <td className="px-6 py-3 font-medium text-slate-100">{session.user}</td>
                    <td className="px-6 py-3 font-mono text-slate-400 text-xs">{session.ip || '-'}</td>
                    <td className="px-6 py-3 font-mono text-slate-400 text-xs">{session.mac || '-'}</td>
                    <td className="px-6 py-3 text-right text-slate-400">{session.time}</td>
                 </tr>
               )) : (
                 <tr>
                   <td colSpan={4} className="px-6 py-8 text-center text-slate-400">
                     No users are currently online. Make sure NAS is properly sending Accounting Packets.
                   </td>
                 </tr>
               )}
             </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
