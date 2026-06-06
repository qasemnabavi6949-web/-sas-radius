'use client';

import { useState, useEffect } from 'react';

import { Wifi, LogOut, Package, Clock, Activity, Zap, CreditCard, Calendar, Settings, Shield, Plus } from 'lucide-react';
import Link from 'next/link';
import PortalUsageChart from './PortalUsageChart';

export default function UserPortal() {
  
  const [activeTab, setActiveTab] = useState<'overview' | 'usage' | 'settings'>('overview');
  const [mounted, setMounted] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordStatus, setPasswordStatus] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    const uname = localStorage.getItem('portal_username');
    if (uname) {
      fetch(`/api/users/${uname}`)
        .then(r => r.json())
        .then(d => {
           if (d.user) {
             setUserData(d.user);
             setSessions(d.sessions || []);
           }
        }).catch(err => console.log(err));
    }
  }, []);

  if (!mounted || !userData) {
    return <div className="min-h-screen bg-slate-900 animate-pulse" />;
  }

  // Calculate dynamic chart data from sessions
  const dynamicUsageData = (() => {
    if (!sessions || sessions.length === 0) return [
      { day: 'Mon', usage: 0 }, { day: 'Tue', usage: 0 }, { day: 'Wed', usage: 0 },
      { day: 'Thu', usage: 0 }, { day: 'Fri', usage: 0 }, { day: 'Sat', usage: 0 }, { day: 'Sun', usage: 0 }
    ];
    
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const usageMap = new Map<string, number>();
    
    sessions.forEach(session => {
      if (session.acctstarttime) {
        const date = new Date(session.acctstarttime);
        const dayStr = days[date.getDay()];
        const totalMB = (parseInt(session.acctinputoctets || 0) + parseInt(session.acctoutputoctets || 0)) / (1024 * 1024);
        usageMap.set(dayStr, (usageMap.get(dayStr) || 0) + (totalMB / 1024)); // Store as GB for chart
      }
    });

    return [
      { day: 'Mon', usage: Number((usageMap.get('Mon') || 0).toFixed(2)) },
      { day: 'Tue', usage: Number((usageMap.get('Tue') || 0).toFixed(2)) },
      { day: 'Wed', usage: Number((usageMap.get('Wed') || 0).toFixed(2)) },
      { day: 'Thu', usage: Number((usageMap.get('Thu') || 0).toFixed(2)) },
      { day: 'Fri', usage: Number((usageMap.get('Fri') || 0).toFixed(2)) },
      { day: 'Sat', usage: Number((usageMap.get('Sat') || 0).toFixed(2)) },
      { day: 'Sun', usage: Number((usageMap.get('Sun') || 0).toFixed(2)) },
    ];
  })();

  // Parse usage and limits
  const totalUsedBytes = userData?.bytes || 0;
  const dataLimitStr = userData?.dataLimitString || 'Unlimited';
  const dataLimitGB = dataLimitStr.includes('GB') ? parseFloat(dataLimitStr) : (dataLimitStr.includes('MB') ? parseFloat(dataLimitStr) / 1024 : 0);
  const usedGB = totalUsedBytes / (1024 * 1024 * 1024);
  
  const percentUsed = dataLimitGB > 0 ? Math.min((usedGB / dataLimitGB) * 100, 100) : 0;
  const remainingPercent = 100 - percentUsed;
  
  const balanceStr = userData?.balance?.replace(' ؋', '') || '0';

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      setPasswordStatus('New passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordStatus('Password must be at least 6 characters');
      return;
    }

    try {
      setPasswordStatus('Updating...');
      const res = await fetch(`/api/users/${userData.username}/password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      const json = await res.json();
      if (res.ok) {
        setPasswordStatus('Password updated successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPasswordStatus(json.error || 'Failed to update password');
      }
    } catch {
      setPasswordStatus('An error occurred');
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-900/40 flex flex-col font-sans overflow-y-auto">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 sticky top-0 z-10 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-emerald-100 rounded-lg flex items-center justify-center">
              <Wifi className="h-5 w-5 text-emerald-600" />
            </div>
            <span className="font-bold text-slate-200 text-lg">My Internet</span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden sm:block text-right">
              <div className="text-sm font-medium text-slate-100">{userData.firstName || userData.username} {userData.lastName}</div>
              <div className="text-xs text-slate-400">ID: USER-{userData.id}</div>
            </div>
            <div className="h-9 w-9 rounded-full bg-slate-900/60 border border-slate-700 flex items-center justify-center text-slate-400 font-medium uppercase">
              {(userData.firstName?.[0] || userData.username[0])}{(userData.lastName?.[0] || '')}
            </div>
            <button onClick={() => setActiveTab('settings')} className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-500/10 rounded-full transition-colors ml-1" title="Settings">
              <Settings className="h-5 w-5" />
            </button>
            <Link href="/portal/login" onClick={() => localStorage.removeItem('portal_username')} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-500/10 rounded-full transition-colors" title="Logout">
              <LogOut className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-100">Welcome back, {userData.firstName || userData.username}!</h1>
          <p className="text-slate-400 mt-1">Here is the overview of your internet subscription.</p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-700 mb-6">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-4 px-4 text-sm font-medium transition-colors relative ${activeTab === 'overview' ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Overview
            {activeTab === 'overview' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-emerald-600"></div>}
          </button>
          <button
            onClick={() => setActiveTab('usage')}
            className={`pb-4 px-4 text-sm font-medium transition-colors relative ${activeTab === 'usage' ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Usage History
            {activeTab === 'usage' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-emerald-600"></div>}
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`pb-4 px-4 text-sm font-medium transition-colors relative ${activeTab === 'settings' ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Settings
            {activeTab === 'settings' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-emerald-600"></div>}
          </button>
        </div>

        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Active Plan Card */}
            <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-sm overflow-hidden relative">
              <div className="absolute top-0 right-0 p-4">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                  Active
                </span>
              </div>
              <div className="p-6 md:p-8">
                <div className="flex items-start gap-4 mb-6">
                  <div className="h-12 w-12 bg-blue-500/10 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
                    <Package className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-100">{userData.group} Plan</h2>
                    <p className="text-slate-400 text-sm mt-1">Up to {userData.speedLimit || '100 Mbps'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-6 border-y border-slate-800">
                  <div>
                    <div className="flex items-center gap-1.5 text-slate-400 text-sm mb-1">
                      <Calendar className="h-4 w-4" /> Activated On
                    </div>
                    <div className="font-semibold text-slate-100">Active Now</div>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 text-slate-400 text-sm mb-1">
                      <Clock className="h-4 w-4" /> Expires In
                    </div>
                    <div className="font-semibold text-slate-100">N/A</div>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 text-slate-400 text-sm mb-1">
                      <Zap className="h-4 w-4" /> Max Speed
                    </div>
                    <div className="font-semibold text-slate-100">{userData.speedLimit || 'Unlimited'}</div>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 text-slate-400 text-sm mb-1">
                      <Activity className="h-4 w-4" /> FUP Limit
                    </div>
                    <div className="font-semibold text-slate-100">{userData.dataLimitString || 'Unlimited'}</div>
                  </div>
                </div>

                <div className="mt-6 flex flex-col sm:flex-row gap-3">
                  <button className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-medium text-sm hover:bg-emerald-700 transition-colors">
                    Renew Plan
                  </button>
                  <button className="px-5 py-2.5 bg-slate-800 border border-slate-700 text-slate-300 rounded-xl font-medium text-sm hover:bg-slate-700/50 transition-colors">
                    Change Package
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Traffic Usage Gauge/Progress */}
              <div className="md:col-span-2 bg-slate-800 rounded-2xl border border-slate-700 shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-bold text-slate-100 text-lg">Traffic Volume</h3>
                  <span className="text-sm font-medium text-emerald-600 bg-emerald-500/10 px-2 py-1 rounded-md">{remainingPercent.toFixed(1)}% Remaining</span>
                </div>
                
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-400">Used: <span className="font-bold text-slate-100">{(usedGB * 1024 > 1024 ? usedGB.toFixed(2) : (usedGB * 1024).toFixed(2))} {(usedGB * 1024 > 1024 ? 'GB' : 'MB')}</span></span>
                    <span className="text-slate-400">Total: <span className="font-bold text-slate-100">{dataLimitStr}</span></span>
                  </div>
                  <div className="w-full h-4 bg-slate-900/60 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${percentUsed}%` }}></div>
                  </div>
                </div>
              </div>

              {/* Wallet / Balance */}
              <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-sm p-6 flex flex-col">
                <div className="flex items-center gap-2 mb-4">
                  <CreditCard className="h-5 w-5 text-slate-400" />
                  <h3 className="font-bold text-slate-100 text-lg">My Wallet</h3>
                </div>
                <div className="flex-1 flex flex-col justify-center">
                  <span className="text-sm text-slate-400">Current Balance</span>
                  <div className="text-3xl font-bold text-slate-100 mt-1 mb-6">{balanceStr} <span className="text-lg text-slate-400 font-normal">؋</span></div>
                  
                  <button className="w-full py-2.5 border-2 border-emerald-600 text-emerald-700 rounded-xl font-medium text-sm hover:bg-emerald-500/10 transition-colors flex items-center justify-center gap-2">
                    <Plus className="h-4 w-4" /> Add Funds
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'usage' && (
          <div className="space-y-6">
             <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-sm p-6">
               <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="font-bold text-slate-100 text-lg">Daily Usage (This Week)</h3>
                  <p className="text-sm text-slate-400">Total accumulated: {(usedGB).toFixed(2)} GB</p>
                </div>
                <select className="bg-slate-900/40 border border-slate-700 text-sm rounded-lg px-3 py-2 text-slate-300 outline-none">
                  <option>This Week</option>
                  <option>Last Week</option>
                  <option>This Month</option>
                </select>
               </div>

               <div className="h-72 w-full">
                {mounted && (
                  <PortalUsageChart data={dynamicUsageData} />
                )}
               </div>
             </div>

             <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-800">
                  <h3 className="font-bold text-slate-100 text-lg">Recent Sessions</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-400">
                    <thead className="bg-slate-900/40 text-xs uppercase text-slate-400 border-b border-slate-700">
                      <tr>
                        <th className="px-6 py-3 font-medium">Date & Time</th>
                        <th className="px-6 py-3 font-medium">Duration</th>
                        <th className="px-6 py-3 font-medium">IP Address</th>
                        <th className="px-6 py-3 font-medium text-right">Data Transferred</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {sessions && sessions.length > 0 ? (
                        sessions.map((session, i) => (
                          <tr key={i} className="hover:bg-slate-700/50">
                            <td className="px-6 py-4">{new Date(session.acctstarttime).toLocaleString()}</td>
                            <td className="px-6 py-4">{Math.round(session.acctsessiontime / 60)} min</td>
                            <td className="px-6 py-4 font-mono text-xs">{session.framedipaddress || '-'}</td>
                            <td className="px-6 py-4 text-right font-medium">
                              {((parseInt(session.acctinputoctets || 0) + parseInt(session.acctoutputoctets || 0)) / (1024 * 1024)).toFixed(2)} MB
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                            No session history found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
             </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="max-w-2xl">
            <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-800 flex items-center gap-3">
                <Shield className="h-6 w-6 text-emerald-600" />
                <h3 className="font-bold text-slate-100 text-lg">Change Password</h3>
              </div>
              <div className="p-6 space-y-5">
                <div className="bg-slate-900/40 p-4 rounded-xl text-sm text-slate-400 mb-2 border border-slate-800">
                  <p>Choose a strong password with at least 8 characters. You will be logged out of your other devices after changing the password.</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Current Password</label>
                  <input 
                    type="password" 
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-800 border border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-sm" 
                    placeholder="Enter your current password" 
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">New Password</label>
                  <input 
                    type="password" 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-800 border border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-sm" 
                    placeholder="Enter a new password" 
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Confirm New Password</label>
                  <input 
                    type="password" 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-800 border border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-sm" 
                    placeholder="Repeat new password" 
                  />
                </div>
                
                {passwordStatus && (
                  <div className={`text-sm ${passwordStatus.includes('success') ? 'text-emerald-500' : 'text-red-500'}`}>
                    {passwordStatus}
                  </div>
                )}
                
                <div className="pt-4 border-t border-slate-800 flex justify-end">
                  <button onClick={handleChangePassword} className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-medium text-sm hover:bg-emerald-700 transition-colors shadow-sm">
                    Update Password
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
