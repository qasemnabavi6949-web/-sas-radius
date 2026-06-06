'use client';

import { useState, useEffect, useRef } from 'react';
import { Settings, Database, Power, RotateCcw, Network } from 'lucide-react';

export default function System() {
  const [networkInfo, setNetworkInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Custom dialog state
  const [dialog, setDialog] = useState<{isOpen: boolean, message: string, onConfirm?: () => void, isAlert?: boolean}>({ isOpen: false, message: '' });
  const [notification, setNotification] = useState<string | null>(null);

  // New states for missing functionality
  const [serverName, setServerName] = useState('SAS RADIUS Primary');
  const [timezone, setTimezone] = useState('UTC (Coordinated Universal Time)');
  const [autoBackup, setAutoBackup] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const showConfirm = (message: string, onConfirm: () => void) => {
    setDialog({ isOpen: true, message, onConfirm, isAlert: false });
  };

  const showAlert = (message: string) => {
    setDialog({ isOpen: true, message, isAlert: true });
  };

  useEffect(() => {
    fetchNetwork();
    fetchGeneral();
  }, []);

  const fetchGeneral = async () => {
    try {
      const res = await fetch('/api/system/general');
      const data = await res.json();
      if (data.serverName) setServerName(data.serverName);
      if (data.timezone) setTimezone(data.timezone);
    } catch {}
  };

  const fetchNetwork = async () => {
    try {
      const res = await fetch('/api/system/network');
      const data = await res.json();
      setNetworkInfo(data);
      setLoading(false);
    } catch {
      setLoading(false);
    }
  };

  const handlePowerAction = async (action: 'restart' | 'shutdown') => {
    showConfirm(`Are you sure you want to ${action} the server?`, async () => {
      try {
        await fetch('/api/system/power', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action })
        });
        showNotification(`Server is ${action === 'restart' ? 'restarting' : 'shutting down'}...`);
      } catch {
        showAlert('Failed to send power command');
      }
    });
  };

  const handleSaveNetwork = async () => {
    try {
      const res = await fetch('/api/system/network', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ip: networkInfo.ip, 
          subnet: networkInfo.subnet,
          dns1: networkInfo.dns1, 
          dns2: networkInfo.dns2, 
          gateway: networkInfo.gateway 
        })
      });
      const data = await res.json();
      showNotification(data.message || 'Settings updated');
    } catch {
      showAlert('Failed to update network settings');
    }
  };

  const handleSaveGeneral = async () => {
    if (!serverName) {
      showAlert('Server name cannot be empty');
      return;
    }
    try {
      const res = await fetch('/api/system/general', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serverName, timezone })
      });
      const data = await res.json();
      showNotification(data.message || 'General configuration saved successfully');
    } catch {
      showAlert('Failed to update general configuration');
    }
  };

  const handleRestoreFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    showConfirm(`Are you sure you want to restore from ${file.name}? This will overwrite existing data.`, async () => {
      const formData = new FormData();
      formData.append('file', file);

      try {
        const res = await fetch('/api/system/restore', {
          method: 'POST',
          body: formData,
        });
        
        if (res.ok) {
          showNotification('Database restored successfully');
        } else {
          const data = await res.json();
          showAlert(`Failed to restore: ${data.error}`);
        }
      } catch {
        showAlert('Failed to upload file');
      }
      
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    });
    
    // Clear value so the same file can be selected again if needed
    e.target.value = '';
  };

  return (
    <div className="space-y-6 pb-20 relative">
      {notification && (
        <div className="fixed top-4 right-4 z-[60] bg-emerald-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2">
          {notification}
        </div>
      )}

      {dialog.isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-slate-800 rounded-xl max-w-sm w-full p-6 border border-slate-700 shadow-xl">
            <h3 className="text-lg font-bold text-slate-100 mb-4">{dialog.isAlert ? 'Notice' : 'Confirmation'}</h3>
            <p className="text-slate-300 mb-6">{dialog.message}</p>
            <div className="flex justify-end gap-3">
              {!dialog.isAlert && (
                <button 
                  onClick={() => setDialog({ isOpen: false, message: '' })}
                  className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 outline-none"
                >
                  Cancel
                </button>
              )}
              <button 
                onClick={() => {
                  if (dialog.onConfirm) dialog.onConfirm();
                  setDialog({ isOpen: false, message: '' });
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 outline-none"
              >
                {dialog.isAlert ? 'OK' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-100">System Settings</h1>
        <p className="text-sm text-slate-400">Configure global server parameters, backups, network, and security.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* General Settings */}
        <div className="rounded-xl border border-slate-700 bg-slate-800 shadow-sm">
          <div className="border-b border-slate-700 px-6 py-4 flex items-center gap-2">
            <Settings className="h-5 w-5 text-slate-400" />
            <h2 className="font-semibold text-slate-100">General Configuration</h2>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300">Server Name</label>
              <input type="text" value={serverName} onChange={e => setServerName(e.target.value)} className="mt-1 block w-full bg-slate-700 rounded-md border border-slate-600 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300">Timezone</label>
              <select value={timezone} onChange={e => setTimezone(e.target.value)} className="mt-1 block w-full bg-slate-700 rounded-md border border-slate-600 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
                <option>UTC (Coordinated Universal Time)</option>
                <option>Asia/Kabul</option>
                <option>Asia/Tehran</option>
                <option>America/New_York</option>
              </select>
            </div>
            <button onClick={handleSaveGeneral} className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">Save Changes</button>
          </div>
        </div>

        {/* Network Array */}
        <div className="rounded-xl border border-slate-700 bg-slate-800 shadow-sm">
          <div className="border-b border-slate-700 px-6 py-4 flex items-center gap-2">
            <Network className="h-5 w-5 text-slate-400" />
            <h2 className="font-semibold text-slate-100">Network & DNS</h2>
          </div>
          <div className="p-6 space-y-4">
            {loading ? (
              <p className="text-sm text-slate-400">Loading network info...</p>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-300">Server IP Address</label>
                  <input 
                    type="text" 
                    value={networkInfo?.ip || ''} 
                    onChange={e => setNetworkInfo({ ...networkInfo, ip: e.target.value })}
                    className="mt-1 block w-full bg-slate-700 rounded-md border border-slate-600 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none" 
                  />
                  <p className="mt-1 text-xs text-slate-400">Note: Modifying IP might disconnect existing sessions.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300">Subnet Mask</label>
                  <input 
                    type="text" 
                    value={networkInfo?.subnet || ''} 
                    onChange={e => setNetworkInfo({ ...networkInfo, subnet: e.target.value })}
                    placeholder="e.g. 255.255.255.0"
                    className="mt-1 block w-full bg-slate-700 rounded-md border border-slate-600 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300">Gateway</label>
                  <input 
                    type="text" 
                    value={networkInfo?.gateway || ''} 
                    onChange={e => setNetworkInfo({ ...networkInfo, gateway: e.target.value })}
                    placeholder="e.g. 192.168.1.1"
                    className="mt-1 block w-full bg-slate-700 rounded-md border border-slate-600 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none" 
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300">DNS 1</label>
                    <input 
                      type="text" 
                      value={networkInfo?.dns1 || ''} 
                      onChange={e => setNetworkInfo({ ...networkInfo, dns1: e.target.value })}
                      placeholder="e.g. 8.8.8.8"
                      className="mt-1 block w-full bg-slate-700 rounded-md border border-slate-600 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300">DNS 2</label>
                    <input 
                      type="text" 
                      value={networkInfo?.dns2 || ''} 
                      onChange={e => setNetworkInfo({ ...networkInfo, dns2: e.target.value })}
                      placeholder="e.g. 1.1.1.1"
                      className="mt-1 block w-full bg-slate-700 rounded-md border border-slate-600 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none" 
                    />
                  </div>
                </div>
                <button onClick={handleSaveNetwork} className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
                  Update Network
                </button>
              </>
            )}
          </div>
        </div>

        {/* Database & Backup */}
        <div className="rounded-xl border border-slate-700 bg-slate-800 shadow-sm">
          <div className="border-b border-slate-700 px-6 py-4 flex items-center gap-2">
            <Database className="h-5 w-5 text-slate-400" />
            <h2 className="font-semibold text-slate-100">Database & Backup</h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between rounded-lg border border-slate-700 p-4">
              <div>
                <p className="font-medium text-slate-100">Auto Backup</p>
                <p className="text-sm text-slate-400">Daily database snapshot</p>
              </div>
              <button 
                onClick={() => setAutoBackup(!autoBackup)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${autoBackup ? 'bg-blue-600' : 'bg-slate-600'}`}
              >
                <span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${autoBackup ? 'translate-x-6' : 'translate-x-1'}`}></span>
              </button>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={async () => {
                  try {
                    const res = await fetch('/api/system/backup');
                    if (!res.ok) throw new Error('Backup failed');
                    const blob = await res.blob();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `radius_backup_${new Date().toISOString().split('T')[0]}.sql`;
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(url);
                    document.body.removeChild(a);
                    showNotification('Backup downloaded successfully');
                  } catch {
                    showAlert('Error downloading backup');
                  }
                }} 
                className="flex-1 rounded-md border border-slate-700 py-2 text-sm font-medium text-slate-300 hover:bg-slate-700/50"
              >
                Manual Backup
              </button>
              <label className="flex-1 rounded-md border border-slate-700 py-2 text-sm font-medium text-slate-300 hover:bg-slate-700/50 text-center cursor-pointer">
                Restore
                <input 
                  type="file" 
                  ref={fileInputRef}
                  className="hidden" 
                  accept=".sql" 
                  onChange={handleRestoreFileChange} 
                />
              </label>
            </div>
          </div>
        </div>

        {/* Power Management */}
        <div className="rounded-xl border border-red-100/10 bg-slate-800 shadow-sm">
          <div className="border-b border-red-100/10 px-6 py-4 flex items-center gap-2">
            <Power className="h-5 w-5 text-red-500" />
            <h2 className="font-semibold text-slate-100">Power Management</h2>
          </div>
          <div className="p-6 space-y-4">
            <p className="text-sm text-slate-400">Restarting or shutting down the server will disconnect all active users and stop the RADIUS service.</p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button onClick={() => handlePowerAction('restart')} className="flex-1 inline-flex items-center justify-center gap-2 rounded-md bg-amber-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-amber-600 transition-colors">
                <RotateCcw className="h-4 w-4" /> 
                Restart Server
              </button>
              <button onClick={() => handlePowerAction('shutdown')} className="flex-1 inline-flex items-center justify-center gap-2 rounded-md bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 transition-colors">
                <Power className="h-4 w-4" /> 
                Shutdown
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
