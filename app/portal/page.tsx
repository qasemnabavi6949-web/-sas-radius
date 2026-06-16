'use client';
import { useState, useEffect } from 'react';
import { LogOut, Package, Clock, Activity, Zap, CreditCard, Calendar, Settings, Shield, Plus, User, FileText } from 'lucide-react';
import Link from 'next/link';
import PortalUsageChart from './PortalUsageChart';

export default function UserPortal() {
  const [activeTab, setActiveTab] = useState<'overview' | 'usage' | 'settings'>('overview');
  const [mounted, setMounted] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordStatus, setPasswordStatus] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    const uname = localStorage.getItem('portal_username') || 'User';
    fetch(`/api/users/${uname}`)
      .then(r => r.json())
      .then(d => {
         if (d && d.user) {
           setUserData(d.user);
           setSessions(d.sessions || []);
         } else {
           setUserData({ username: uname, id: '14', profile: 'Standard Plan', balance: '0', bytes: 0, status: 'OFFLINE' });
         }
      })
      .catch(() => {
         setUserData({ username: uname, id: '14', profile: 'Standard Plan', balance: '0', bytes: 0, status: 'OFFLINE' });
      });
  }, []);

  if (!mounted || !userData) return <div className="min-h-screen bg-[#1c4765] flex items-center justify-center"><div className="text-white text-sm font-semibold animate-pulse">Loading QASEM Portal...</div></div>;

  const getDaysInMonth = (year: number, month: number) => new Date(year, month, 0).getDate();
  const dailyUsageData = (() => {
    const daysCount = getDaysInMonth(selectedYear, selectedMonth);
    const result = [];
    const inputMap = new Map<number, number>();
    const outputMap = new Map<number, number>();
    if (sessions && Array.isArray(sessions)) {
      sessions.forEach(s => {
        if (s.acctstarttime) {
          const date = new Date(s.acctstarttime);
          if (date.getFullYear() === selectedYear && (date.getMonth() + 1) === selectedMonth) {
            const day = date.getDate();
            inputMap.set(day, (inputMap.get(day) || 0) + parseInt(s.acctinputoctets || 0));
            outputMap.set(day, (outputMap.get(day) || 0) + parseInt(s.acctoutputoctets || 0));
          }
        }
      });
    }
    for (let d = 1; d <= daysCount; d++) {
      const upGB = (inputMap.get(d) || 0) / (1024 * 1024 * 1024);
      const downGB = (outputMap.get(d) || 0) / (1024 * 1024 * 1024);
      result.push({ day: d, dateString: `${selectedYear}-${selectedMonth}-${d}`, download: Number(downGB.toFixed(2)), upload: Number(upGB.toFixed(2)), usage: Number((upGB + downGB).toFixed(2)) });
    }
    return result;
  })();
  const totalUsedBytes = userData?.bytes || 0;
  const dataLimitStr = userData?.dataLimitString || 'Unlimited';
  const dataLimitGB = dataLimitStr.includes('GB') ? parseFloat(dataLimitStr) : (dataLimitStr.includes('MB') ? parseFloat(dataLimitStr) / 1024 : 0);
  const usedGB = totalUsedBytes / (1024 * 1024 * 1024);
  const remainingTrafficGB = dataLimitGB > 0 ? Math.max(dataLimitGB - usedGB, 0) : 0;
  const percentUsed = dataLimitGB > 0 ? Math.min((usedGB / dataLimitGB) * 100, 100) : 0;
  const remainingPercent = 100 - percentUsed;
  const balanceStr = userData?.balance?.replace(' ؋', '') || '0';
  const remainingDays = userData?.remainingDays || 'N/A';

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) { setPasswordStatus('New passwords do not match'); return; }
    if (newPassword.length < 6) { setPasswordStatus('Password must be at least 6 characters'); return; }
    try {
      setPasswordStatus('Updating...');
      const res = await fetch(`/api/users/${userData.username}/password`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ currentPassword, newPassword }) });
      if (res.ok) { setPasswordStatus('Password updated successfully!'); setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); }
      else { setPasswordStatus('Failed to update password'); }
    } catch { setPasswordStatus('An error occurred'); }
  };

  const isUserOnline = userData?.status?.toUpperCase() === 'ONLINE';

  return (
    <div className="min-h-screen w-full bg-[#1c4765] flex flex-col font-sans text-gray-100 overflow-y-auto relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(43,107,148,0.55)_0%,rgba(24,63,91,1)_80%)] pointer-events-none z-0" />
      <header className="bg-[#13334c]/80 border-b border-white/10 sticky top-0 z-20 shadow-lg backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-black text-2xl tracking-wide text-[#f17a22]">QASEM</span>
            <div className="h-4 w-[1px] bg-white/20" /><span className="font-bold text-sm tracking-widest uppercase text-white/80">Radius</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right"><div className="text-sm font-semibold text-white">{userData.firstName || userData.username}</div></div>
            <button onClick={() => setActiveTab('settings')} className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-all"><Settings className="h-5 w-5" /></button>
            <Link href="/portal/login" onClick={() => localStorage.removeItem('portal_username')} className="p-2 text-white/70 hover:text-red-400 hover:bg-red-500/20 rounded-full transition-all"><LogOut className="h-5 w-5" /></Link>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-6 z-10">
        <div className="flex border-b border-white/10 mb-6 gap-2">
          {(['overview', 'usage', 'settings'] as const).map((t) => (
            <button key={t} onClick={() => setActiveTab(t)} className={`pb-3 px-6 text-sm font-bold uppercase tracking-wider transition-all relative ${activeTab === t ? 'text-[#009cdb]' : 'text-white/50 hover:text-white'}`}>{t}{activeTab === t && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#009cdb]"></div>}</button>
          ))}
        </div>
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white/90 backdrop-blur-md rounded p-4 border border-white/30 shadow-lg text-gray-800 flex items-center justify-between">
                <div><div className="text-xl font-bold text-gray-900">{remainingDays} day(s)</div><div className="text-[10px] font-bold text-gray-400 uppercase mt-0.5">Remaining Days</div></div><Calendar className="h-5 w-5 text-gray-400" />
              </div>
              <div className="bg-white/90 backdrop-blur-md rounded p-4 border border-white/30 shadow-lg text-gray-800 flex items-center justify-between">
                <div><div className="text-xl font-bold text-gray-900">{remainingTrafficGB > 0 ? `${remainingTrafficGB.toFixed(2)} GB` : dataLimitStr}</div><div className="text-[10px] font-bold text-gray-400 uppercase mt-0.5">Remaining Traffic</div></div><Activity className="h-5 w-5 text-gray-400" />
              </div>
              <div className="bg-white/90 backdrop-blur-md rounded p-4 border border-white/30 shadow-lg text-gray-800 flex items-center justify-between">
                <div><div className="text-xl font-bold text-gray-900">؋ {balanceStr}</div><div className="text-[10px] font-bold text-gray-400 uppercase mt-0.5">Account Balance</div></div><CreditCard className="h-5 w-5 text-gray-400" />
              </div>
              <div className="bg-white/90 backdrop-blur-md rounded p-4 border border-white/30 shadow-lg text-gray-800 flex items-center justify-between">
                <div><div className="text-xl font-bold text-gray-900">{userData.unpaidInvoices || 0}</div><div className="text-[10px] font-bold text-gray-400 uppercase mt-0.5">Unpaid Invoices</div></div><FileText className="h-5 w-5 text-gray-400" />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white/90 backdrop-blur-md rounded p-6 border border-white/30 shadow-2xl text-gray-800">
                <div className="flex items-center gap-3 border-b border-gray-200 pb-4 mb-4"><div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600"><User className="h-5 w-5" /></div><h3 className="text-lg font-bold text-gray-900">Customer Information</h3></div>
                <div className="space-y-3 text-sm font-medium">
                  <div className="flex justify-between border-b border-gray-100 pb-1"><span className="text-gray-400">ID</span><span className="text-gray-800 font-bold">{userData.id}</span></div>
                  <div className="flex justify-between border-b border-gray-100 pb-1"><span className="text-gray-400">Customer Name</span><span className="text-gray-800">{userData.firstName || 'N/A'} {userData.lastName || ''}</span></div>
                  <div className="flex justify-between border-b border-gray-100 pb-1"><span className="text-gray-400">Username</span><span className="text-gray-800 font-bold">{userData.username}</span></div>
                  <div className="flex justify-between border-b border-gray-100 pb-1"><span className="text-gray-400">Account Balance</span><span className="text-gray-900 font-bold">؋ {balanceStr}</span></div>
                  <div className="flex justify-between border-b border-gray-100 pb-1"><span className="text-gray-400">Debts</span><span className="text-gray-900 font-bold">؋ {userData.debts || '0.00'}</span></div>
                  <div className="flex justify-between border-b border-gray-100 pb-1"><span className="text-gray-400">Email</span><span className="text-gray-800 Ram">{userData.email || 'N/A'}</span></div>
                  <div className="flex justify-between border-b border-gray-100 pb-1"><span className="text-gray-400">Phone</span><span className="text-gray-800">{userData.phone || 'N/A'}</span></div>
                  <div className="flex justify-between"><span className="text-gray-400">Address</span><span className="text-gray-800">{userData.address || 'N/A'}</span></div>
                </div>
              </div>
              <div className="bg-white/90 backdrop-blur-md rounded p-6 border border-white/30 shadow-2xl text-gray-800">
                <div className="flex items-center gap-3 border-b border-gray-200 pb-4 mb-4"><div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600"><Package className="h-5 w-5" /></div><h3 className="text-lg font-bold text-gray-900">Service Information</h3></div>
                <div className="space-y-3 text-sm font-medium">
                  <div className="flex justify-between border-b border-gray-100 pb-1"><span className="text-gray-400">Current Service</span><span className="text-gray-900 font-bold">{userData.profile || 'Standard Plan'}</span></div>
                  <div className="flex justify-between border-b border-gray-100 pb-1"><span className="text-gray-400">Connection Type</span><span className="text-gray-800">{userData.connectionType || 'N/A'}</span></div>
                  <div className="flex justify-between border-b border-gray-100 pb-1"><span className="text-gray-400">Subscription</span><span className="text-green-600 font-bold uppercase">Active</span></div>
                  <div className="flex justify-between border-b border-gray-100 pb-1"><span className="text-gray-400">Expiration</span><span className="text-gray-800 font-semibold">{userData.expiration || 'N/A'}</span></div>
                  <div className="flex justify-between border-b border-gray-100 pb-1">
                    <span className="text-gray-400">Status</span>
                    <span className={`font-bold uppercase ${isUserOnline ? 'text-green-600' : 'text-red-500'}`}>{userData.status || 'OFFLINE'}</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-100 pb-1"><span className="text-gray-400">Service Price</span><span className="text-gray-900 font-bold">؋ {userData.price || '0.00'}</span></div>
                  <div className="flex flex-col border-b border-gray-100 pb-2"><div className="flex justify-between mb-1.5"><span className="text-gray-400">Remaining Traffic</span><span className="text-[#009cdb] font-bold">{remainingPercent.toFixed(1)}%</span></div><div className="w-full bg-gray-200 h-3 rounded-full overflow-hidden"><div className="bg-[#009cdb] h-full" style={{ width: `${remainingPercent}%` }}></div></div></div>
                  <div className="flex justify-between border-b border-gray-100 pb-1"><span className="text-gray-400">Static IP</span><span className="text-gray-800 font-mono text-xs">{userData.staticIp || 'N/A'}</span></div>
                  <div className="flex justify-between"><span className="text-gray-400">MAC Address</span><span className="text-gray-800 font-mono text-xs">{userData.macAddress || 'N/A'}</span></div>
                </div>
              </div>
            </div>
          </div>
        )}
        {activeTab === 'usage' && (
          <div className="space-y-6">
            <div className="bg-white/85 backdrop-blur-md rounded-md p-6 border border-white/40 shadow-2xl text-gray-800">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2"><Activity className="h-5 w-5 text-[#009cdb]" /> Daily Traffic Statistics</h3>
                <div className="flex items-center gap-2 bg-gray-100 p-1.5 rounded border border-gray-200">
                  <select value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))} className="bg-white px-3 py-1 text-sm font-semibold text-gray-700 border border-gray-300 rounded focus:outline-none">
                    {Array.from({ length: 12 }, (_, i) => (<option key={i+1} value={i+1}>Month: {i+1}</option>))}
                  </select>
                </div>
              </div>
              <div className="h-80 w-full bg-gray-50 rounded p-4 border border-gray-200"><PortalUsageChart data={dailyUsageData} /></div>
            </div>
            <div className="bg-white/85 backdrop-blur-md rounded-md p-6 border border-white/40 shadow-2xl text-gray-800">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Detailed Monthly Traffic Table</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 text-xs font-bold uppercase tracking-wider text-gray-400"><th className="py-3 px-4">Day/Month</th><th className="py-3 px-4">Download</th><th className="py-3 px-4">Upload</th><th className="py-3 px-4">Total</th><th className="py-3 px-4">Real Traffic</th></tr>
                  </thead>
                  <tbody className="text-sm divide-y divide-gray-100 text-gray-700">
                    {dailyUsageData.filter(d => d.usage > 0).map((d: any, i: number) => (
                      <tr key={i} className="hover:bg-gray-50 transition-colors"><td className="py-3 px-4 font-bold text-gray-800">{d.dateString}</td><td className="py-3 px-4 font-medium text-gray-600">{d.download} GB</td><td className="py-3 px-4 font-medium text-gray-600">{d.upload} GB</td><td className="py-3 px-4 font-bold text-gray-900">{d.usage} GB</td><td className="py-3 px-4 font-bold text-[#009cdb]">{d.usage} GB</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="bg-white/85 backdrop-blur-md rounded-md p-6 border border-white/40 shadow-2xl max-w-xl text-gray-800">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2"><Shield className="h-5 w-5 text-[#f17a22]" /> Change Password</h3>
            <div className="space-y-4">
              {passwordStatus && <div className="text-sm bg-blue-50 p-3 rounded border border-blue-100 text-[#009cdb] font-medium">{passwordStatus}</div>}
              <div><label className="block text-xs font-bold uppercase text-gray-500 mb-1">Current Password</label><input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded focus:outline-none focus:border-[#009cdb] text-gray-800 text-sm" placeholder="••••••••" /></div>
              <div><label className="block text-xs font-bold uppercase text-gray-500 mb-1">New Password</label><input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded focus:outline-none focus:border-[#009cdb] text-white text-sm" placeholder="••••••••" /></div>
              <div><label className="block text-xs font-bold uppercase text-gray-500 mb-1">Confirm New Password</label><input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded focus:outline-none focus:border-[#009cdb] text-white text-sm" placeholder="••••••••" /></div>
              <button onClick={handleChangePassword} className="px-6 py-2.5 rounded text-sm font-bold text-white bg-[#009cdb] hover:bg-[#0089c2] transition-colors uppercase tracking-wide mt-2 shadow">Update Password</button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
