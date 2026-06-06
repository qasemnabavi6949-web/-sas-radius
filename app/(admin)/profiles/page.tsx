'use client';

import { useState, useEffect } from 'react';
import { Plus, FileBadge, X, Clock, Moon, Zap, ShieldAlert, Edit2, Trash2, ArrowDownToLine, ArrowUpFromLine, Activity } from 'lucide-react';

export default function Profiles() {
  const [activeTab, setActiveTab] = useState<'data' | 'fup'>('data');
  
  const [dataProfiles, setDataProfiles] = useState<any[]>([]);
  const [fupProfiles, setFupProfiles] = useState<any[]>([]);
  
  const [isDataModalOpen, setIsDataModalOpen] = useState(false);
  const [isFupModalOpen, setIsFupModalOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<any>(null);

  // Global Policy Modals
  const [isDailyPolicyModalOpen, setIsDailyPolicyModalOpen] = useState(false);
  const [isNightFreeModalOpen, setIsNightFreeModalOpen] = useState(false);

  // Selection and Context Menu
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [contextMenu, setContextMenu] = useState<{ visible: boolean, x: number, y: number, profile: any, type: 'data' | 'fup' } | null>(null);

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    try {
      const res = await fetch('/api/profiles');
      if (res.ok) {
         const data = await res.json();
         setDataProfiles(data.filter((p: any) => p.type === 'data' || !p.type));
         setFupProfiles(data.filter((p: any) => p.type === 'fup'));
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Close context menu on click outside
  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  const handleContextMenu = (e: React.MouseEvent, profile: any, type: 'data' | 'fup') => {
    e.preventDefault();
    if (!selectedIds.includes(profile.id)) {
      setSelectedIds([profile.id]);
    }
    setContextMenu({
      visible: true,
      x: e.pageX,
      y: e.pageY,
      profile,
      type
    });
  };

  const toggleSelection = (id: number) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(selectedId => selectedId !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const toggleAllSelection = (list: any[]) => {
    if (selectedIds.length === list.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(list.map(p => p.id));
    }
  };

  const handleOpenDataModal = (profile: any = null) => {
    setEditingProfile(profile);
    setIsDataModalOpen(true);
    setContextMenu(null);
  };

  const handleOpenFupModal = (profile: any = null) => {
    setEditingProfile(profile);
    setIsFupModalOpen(true);
    setContextMenu(null);
  };

  const handleDeleteProfile = async (profileToDelete?: any) => {
    const targetProfile = profileToDelete || (contextMenu?.profile);
    
    if (targetProfile) {
      try {
        await fetch(`/api/profiles/${targetProfile.id}`, { method: 'DELETE' });
        fetchProfiles();
        setSelectedIds(selectedIds.filter(id => id !== targetProfile.id));
      } catch (err) {
        console.error(err);
      }
    }
    setContextMenu(null);
  };

  const handleDeleteSelected = async () => {
    const targetProfiles = activeTab === 'data' ? dataProfiles : fupProfiles;
    const itemsToDelete = targetProfiles.filter(p => selectedIds.includes(p.id));
    
    for (const item of itemsToDelete) {
       try {
         await fetch(`/api/profiles/${item.id}`, { method: 'DELETE' });
       } catch (err) {
         console.error(err);
       }
    }
    fetchProfiles();
    setSelectedIds([]);
    setContextMenu(null);
  };

  return (
    <div className="space-y-6 relative">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">Profiles & Groups</h1>
          <p className="text-sm text-slate-400">Define billing plans, speed limits, and FUP policies.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Global Policy Buttons */}
          <button 
            onClick={() => setIsDailyPolicyModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-700/50 transition-colors"
          >
            <Clock className="h-4 w-4 text-blue-500" />
            Daily Policy
          </button>
          <button 
            onClick={() => setIsNightFreeModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-700/50 transition-colors"
          >
            <Moon className="h-4 w-4 text-indigo-500" />
            Night Free
          </button>

          <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block"></div>

          {selectedIds.length > 0 && (
            <button 
              onClick={handleDeleteSelected}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-red-500/10 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-900/50 transition-colors border border-red-500/20"
            >
              <Trash2 className="h-4 w-4" />
              Delete ({selectedIds.length})
            </button>
          )}
          <button 
            onClick={() => activeTab === 'data' ? handleOpenDataModal() : handleOpenFupModal()}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add {activeTab === 'data' ? 'Data Profile' : 'FUP Profile'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-700">
        <button
          onClick={() => { setActiveTab('data'); setSelectedIds([]); }}
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'data' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-600'
          }`}
        >
          Data Profiles
        </button>
        <button
          onClick={() => { setActiveTab('fup'); setSelectedIds([]); }}
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'fup' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-600'
          }`}
        >
          FUP Profiles (Fair Usage)
        </button>
      </div>

      {/* Data Profiles Table */}
      {activeTab === 'data' && (
        <div className="rounded-xl border border-slate-700 bg-slate-800 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-400">
              <thead className="bg-slate-900/60 text-xs uppercase text-slate-400 border-b border-slate-700">
                <tr>
                  <th className="px-6 py-3 font-medium w-10">
                    <input 
                      type="checkbox" 
                      className="rounded border-slate-600 text-blue-600 focus:ring-blue-500"
                      checked={selectedIds.length === dataProfiles.length && dataProfiles.length > 0}
                      onChange={() => toggleAllSelection(dataProfiles)}
                    />
                  </th>
                  <th className="px-6 py-3 font-medium">Profile Name</th>
                  <th className="px-6 py-3 font-medium">Price (AFN)</th>
                  <th className="px-6 py-3 font-medium">Speed (DL / UL)</th>
                  <th className="px-6 py-3 font-medium">Traffic (Total / DL / UL)</th>
                  <th className="px-6 py-3 font-medium">Validity</th>
                  <th className="px-6 py-3 font-medium">Next Package</th>
                  <th className="px-6 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700 bg-slate-800">
                {dataProfiles.map((profile) => (
                  <tr 
                    key={profile.id} 
                    className={`hover:bg-slate-700/50 transition-colors cursor-pointer ${selectedIds.includes(profile.id) ? 'bg-blue-500/30' : ''}`}
                    onClick={() => toggleSelection(profile.id)}
                    onContextMenu={(e) => handleContextMenu(e, profile, 'data')}
                  >
                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                      <input 
                        type="checkbox" 
                        className="rounded border-slate-600 text-blue-600 focus:ring-blue-500"
                        checked={selectedIds.includes(profile.id)}
                        onChange={() => toggleSelection(profile.id)}
                      />
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-100 flex items-center gap-2">
                      <FileBadge className="h-4 w-4 text-amber-500" />
                      {profile.name}
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-100">{profile.price} ؋</td>
                    <td className="px-6 py-4 font-mono text-xs">
                      <span className="text-blue-600">{profile.downloadSpeed}</span> / <span className="text-emerald-600">{profile.uploadSpeed}</span> Kbps
                    </td>
                    <td className="px-6 py-4 font-mono text-xs">
                      <div className="font-semibold text-slate-100 mb-1">Total: {profile.totalTraffic ? `${profile.totalTraffic} MB` : 'Unlimited'}</div>
                      <div className="text-slate-400">
                        DL: {profile.downloadTraffic ? `${profile.downloadTraffic} MB` : '∞'} | UL: {profile.uploadTraffic ? `${profile.uploadTraffic} MB` : '∞'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-slate-300">{profile.validityDays ? `${profile.validityDays} Days` : '30 Days'}</td>
                    <td className="px-6 py-4 text-orange-600 text-xs font-medium">{profile.nextPackage}</td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleOpenDataModal(profile); }}
                        className="text-slate-400 hover:text-blue-600 transition-colors p-1 rounded-md hover:bg-blue-500/10"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* FUP Profiles Table */}
      {activeTab === 'fup' && (
        <div className="rounded-xl border border-slate-700 bg-slate-800 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-400">
              <thead className="bg-slate-900/60 text-xs uppercase text-slate-400 border-b border-slate-700">
                <tr>
                  <th className="px-6 py-3 font-medium w-10">
                    <input 
                      type="checkbox" 
                      className="rounded border-slate-600 text-blue-600 focus:ring-blue-500"
                      checked={selectedIds.length === fupProfiles.length && fupProfiles.length > 0}
                      onChange={() => toggleAllSelection(fupProfiles)}
                    />
                  </th>
                  <th className="px-6 py-3 font-medium">FUP Profile Name</th>
                  <th className="px-6 py-3 font-medium">Restricted Speed Limit</th>
                  <th className="px-6 py-3 font-medium">Description</th>
                  <th className="px-6 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700 bg-slate-800">
                {fupProfiles.map((profile) => (
                  <tr 
                    key={profile.id} 
                    className={`hover:bg-slate-700/50 transition-colors cursor-pointer ${selectedIds.includes(profile.id) ? 'bg-blue-500/30' : ''}`}
                    onClick={() => toggleSelection(profile.id)}
                    onContextMenu={(e) => handleContextMenu(e, profile, 'fup')}
                  >
                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                      <input 
                        type="checkbox" 
                        className="rounded border-slate-600 text-blue-600 focus:ring-blue-500"
                        checked={selectedIds.includes(profile.id)}
                        onChange={() => toggleSelection(profile.id)}
                      />
                    </td>
                    <td className="px-6 py-4 font-medium text-orange-700 flex items-center gap-2">
                      <ShieldAlert className="h-4 w-4 text-orange-500" />
                      {profile.name}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs font-semibold text-slate-100">{profile.speedLimit}</td>
                    <td className="px-6 py-4">{profile.description}</td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleOpenFupModal(profile); }}
                        className="text-slate-400 hover:text-blue-600 transition-colors p-1 rounded-md hover:bg-blue-500/10"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Context Menu */}
      {contextMenu && contextMenu.visible && (
        <div 
          className="absolute z-50 w-48 rounded-md bg-slate-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="py-1">
            <button
              onClick={() => contextMenu.type === 'data' ? handleOpenDataModal(contextMenu.profile) : handleOpenFupModal(contextMenu.profile)}
              className="flex w-full items-center px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white"
            >
              <Edit2 className="mr-3 h-4 w-4 text-slate-400" />
              Rename / Edit
            </button>
            <button
              onClick={() => handleDeleteProfile(contextMenu.profile)}
              className="flex w-full items-center px-4 py-2 text-sm text-red-600 hover:bg-red-500/10"
            >
              <Trash2 className="mr-3 h-4 w-4 text-red-500" />
              Delete Profile
            </button>
          </div>
        </div>
      )}

      {/* Data Profile Modal (Add / Edit) */}
      {isDataModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-6">
          <div className="w-full max-w-3xl rounded-xl bg-slate-800 shadow-xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-slate-700 px-6 py-4">
              <h2 className="text-lg font-bold text-slate-100">
                {editingProfile ? `Edit Data Profile: ${editingProfile.name}` : 'Create New Data Profile'}
              </h2>
              <button onClick={() => setIsDataModalOpen(false)} className="text-slate-400 hover:text-slate-400 focus:outline-none">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-8 overflow-y-auto flex-1">
              {/* Basic Settings */}
              <div>
                <h3 className="text-sm font-semibold text-slate-100 mb-4">Basic Settings</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Profile Name</label>
                    <input id="data-name" type="text" defaultValue={editingProfile?.name || ''} className="w-full rounded-md border border-slate-600 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="e.g. VIP Plan" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Price (AFN)</label>
                    <input id="data-price" type="text" defaultValue={editingProfile?.price?.replace(' ؋', '') || ''} className="w-full rounded-md border border-slate-600 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="e.g. 1000" />
                  </div>
                </div>
              </div>

              {/* Speed Limits */}
              <div className="border-t border-slate-800 pt-6">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-100 mb-4">
                  <Activity className="h-4 w-4 text-blue-500" />
                  Speed Limits
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="flex items-center gap-1 text-sm font-medium text-slate-300 mb-1">
                      <ArrowDownToLine className="h-3 w-3 text-blue-500" /> Download Speed (Kbps)
                    </label>
                    <input id="data-dl-speed" type="number" defaultValue={editingProfile?.downloadSpeed || ''} className="w-full rounded-md border border-slate-600 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="e.g. 1000" />
                  </div>
                  <div>
                    <label className="flex items-center gap-1 text-sm font-medium text-slate-300 mb-1">
                      <ArrowUpFromLine className="h-3 w-3 text-emerald-500" /> Upload Speed (Kbps)
                    </label>
                    <input id="data-ul-speed" type="number" defaultValue={editingProfile?.uploadSpeed || ''} className="w-full rounded-md border border-slate-600 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="e.g. 500" />
                  </div>
                </div>
              </div>

              {/* Traffic Limits */}
              <div className="border-t border-slate-800 pt-6">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-100 mb-4">
                  <Activity className="h-4 w-4 text-purple-500" />
                  Traffic Volume Limits
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Total Traffic (MB)</label>
                    <input id="data-total-traffic" type="number" defaultValue={editingProfile?.totalTraffic || ''} className="w-full rounded-md border border-slate-600 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="e.g. 1000 (Leave empty for unlimited)" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Validity (Days)</label>
                    <input id="data-validity-days" type="number" defaultValue={editingProfile?.validityDays || 30} className="w-full rounded-md border border-slate-600 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="e.g. 30" />
                  </div>
                  <div>
                    <label className="flex items-center gap-1 text-sm font-medium text-slate-300 mb-1">
                      <ArrowDownToLine className="h-3 w-3 text-blue-500" /> Download Traffic (MB)
                    </label>
                    <input id="data-dl-traffic" type="number" defaultValue={editingProfile?.downloadTraffic || ''} className="w-full rounded-md border border-slate-600 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="Optional" />
                  </div>
                  <div>
                    <label className="flex items-center gap-1 text-sm font-medium text-slate-300 mb-1">
                      <ArrowUpFromLine className="h-3 w-3 text-emerald-500" /> Upload Traffic (MB)
                    </label>
                    <input id="data-ul-traffic" type="number" defaultValue={editingProfile?.uploadTraffic || ''} className="w-full rounded-md border border-slate-600 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="Optional" />
                  </div>
                </div>
              </div>

              {/* Next Package (FUP) */}
              <div className="rounded-lg border border-orange-100 bg-orange-50/30 p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-orange-900">
                      <ShieldAlert className="h-4 w-4 text-orange-600" />
                      Next Package (FUP Fallback)
                    </h3>
                    <p className="text-xs text-orange-700 mt-1">When the user consumes their traffic volume, they will be automatically moved to this package.</p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-4 mt-4 border-t border-orange-100 pt-4">
                  <div className="flex-1 w-full">
                    <label className="block text-xs font-medium text-slate-400 mb-1">Daily High-Speed Quota (Optional)</label>
                    <input id="data-daily-quota" type="text" defaultValue={editingProfile?.dailyQuota || ''} className="w-full rounded-md border border-slate-700 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none" placeholder="e.g. 2000 MB" />
                  </div>
                  <div className="flex-1 w-full">
                    <label className="block text-xs font-medium text-slate-400 mb-1">Next Package</label>
                    <select id="data-next-package" defaultValue={editingProfile?.nextPackage || ''} className="w-full rounded-md border border-slate-700 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none">
                      <option value="">No Fallback (Disconnect)</option>
                      {fupProfiles.map(fup => (
                        <option key={fup.id} value={fup.name}>{fup.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="border-t border-slate-700 bg-slate-900/60 px-6 py-4 rounded-b-xl flex justify-end gap-3 Shrink-0">
              <button onClick={() => setIsDataModalOpen(false)} className="rounded-md px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-600 transition-colors">Cancel</button>
              <button onClick={async () => {
                const newDataProfile = {
                  name: (document.getElementById('data-name') as HTMLInputElement)?.value || 'New Plan',
                  price: (document.getElementById('data-price') as HTMLInputElement)?.value || '0',
                  downloadSpeed: (document.getElementById('data-dl-speed') as HTMLInputElement)?.value || '',
                  uploadSpeed: (document.getElementById('data-ul-speed') as HTMLInputElement)?.value || '',
                  totalTraffic: (document.getElementById('data-total-traffic') as HTMLInputElement)?.value || '',
                  downloadTraffic: (document.getElementById('data-dl-traffic') as HTMLInputElement)?.value || '',
                  uploadTraffic: (document.getElementById('data-ul-traffic') as HTMLInputElement)?.value || '',
                  validityDays: parseInt((document.getElementById('data-validity-days') as HTMLInputElement)?.value || '30'),
                  dailyQuota: (document.getElementById('data-daily-quota') as HTMLInputElement)?.value || '',
                  nextPackage: (document.getElementById('data-next-package') as HTMLSelectElement)?.value || '',
                  type: 'data'
                };
                
                try {
                  const url = editingProfile ? `/api/profiles/${editingProfile.id}` : '/api/profiles';
                  const method = editingProfile ? 'PUT' : 'POST';
                  const res = await fetch(url, {
                    method: method,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newDataProfile)
                  });
                  if (!res.ok) {
                    const text = await res.text();
                    alert('Error saving profile: ' + text);
                  } else {
                    fetchProfiles();
                    setIsDataModalOpen(false);
                  }
                } catch (err: any) {
                  alert(err.message);
                }
              }} className="rounded-md bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors">Save Profile</button>
            </div>
          </div>
        </div>
      )}

      {/* FUP Profile Modal (Add / Edit) */}
      {isFupModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-6">
          <div className="w-full max-w-md rounded-xl bg-slate-800 shadow-xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-slate-700 px-6 py-4">
              <h2 className="text-lg font-bold text-slate-100">
                {editingProfile ? `Edit FUP Profile: ${editingProfile.name}` : 'Create FUP Profile'}
              </h2>
              <button onClick={() => setIsFupModalOpen(false)} className="text-slate-400 hover:text-slate-400 focus:outline-none">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">FUP Profile Name</label>
                <input id="fup-name" type="text" defaultValue={editingProfile?.name || ''} className="w-full rounded-md border border-slate-600 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500" placeholder="e.g. FUP - 512 Kbps" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Restricted Speed Limit</label>
                <input id="fup-speed" type="text" defaultValue={editingProfile?.speedLimit || ''} className="w-full rounded-md border border-slate-600 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500" placeholder="e.g. 512 Kbps" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Description (Optional)</label>
                <textarea id="fup-desc" defaultValue={editingProfile?.description || ''} className="w-full rounded-md border border-slate-600 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500" placeholder="e.g. Fallback for Bronze Plan" rows={3}></textarea>
              </div>
            </div>
            
            <div className="border-t border-slate-700 bg-slate-900/60 px-6 py-4 rounded-b-xl flex justify-end gap-3">
              <button onClick={() => setIsFupModalOpen(false)} className="rounded-md px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-600 transition-colors">Cancel</button>
              <button onClick={async () => {
                const newFupProfile = {
                  name: (document.getElementById('fup-name') as HTMLInputElement)?.value || 'New FUP',
                  speedLimit: (document.getElementById('fup-speed') as HTMLInputElement)?.value || '0',
                  description: (document.getElementById('fup-desc') as HTMLTextAreaElement)?.value || '',
                  type: 'fup'
                };
                
                try {
                  const url = editingProfile ? `/api/profiles/${editingProfile.id}` : '/api/profiles';
                  const method = editingProfile ? 'PUT' : 'POST';
                  const res = await fetch(url, {
                    method: method,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newFupProfile)
                  });
                  if (!res.ok) {
                    const text = await res.text();
                    alert('Error saving FUP profile: ' + text);
                  } else {
                    fetchProfiles();
                    setIsFupModalOpen(false);
                  }
                } catch (err: any) {
                  alert(err.message);
                }
              }} className="rounded-md bg-orange-600 px-6 py-2 text-sm font-medium text-white hover:bg-orange-700 transition-colors">Save FUP Profile</button>
            </div>
          </div>
        </div>
      )}

      {/* Global Daily Policy Modal */}
      {isDailyPolicyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-6">
          <div className="w-full max-w-2xl rounded-xl bg-slate-800 shadow-xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-slate-700 px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-500" /> Global Daily Policy
                </h2>
                <p className="text-sm text-slate-400 mt-1">Set time-based speed rules that apply across the system or specific profiles.</p>
              </div>
              <button onClick={() => setIsDailyPolicyModalOpen(false)} className="text-slate-400 hover:text-slate-400 focus:outline-none">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              <div className="relative flex items-center gap-3 bg-slate-900/60 p-4 rounded-md border border-slate-700 shadow-sm flex-wrap">
                <div className="flex-1 min-w-[120px]">
                  <label className="block text-xs font-medium text-slate-400 mb-1">Start Time</label>
                  <input type="time" defaultValue="10:00" className="w-full rounded-md border border-slate-600 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none" />
                </div>
                <div className="flex-1 min-w-[120px]">
                  <label className="block text-xs font-medium text-slate-400 mb-1">End Time</label>
                  <input type="time" defaultValue="16:00" className="w-full rounded-md border border-slate-600 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none" />
                </div>
                <div className="flex-1 min-w-[120px]">
                  <label className="block text-xs font-medium text-slate-400 mb-1">Custom Speed</label>
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-amber-500" />
                    <input type="text" defaultValue="512 Kbps" className="w-full rounded-md border border-slate-600 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none" />
                  </div>
                </div>
                <div className="w-full mt-2">
                  <label className="block text-xs font-medium text-slate-400 mb-1">Apply to Profiles</label>
                  <select className="w-full rounded-md border border-slate-600 px-2 py-2 text-sm focus:border-blue-500 focus:outline-none" multiple defaultValue={['1', '2']}>
                     {dataProfiles.map(p => (
                       <option key={p.id} value={p.id.toString()}>{p.name}</option>
                     ))}
                  </select>
                  <p className="text-xs text-slate-400 mt-1">Hold the Ctrl (Windows) or Cmd (Mac) key to select multiple profiles.</p>
                </div>
                <div className="absolute top-2 right-2">
                  <button className="text-red-500 hover:text-red-700 p-1 bg-slate-800 rounded shadow-sm border border-slate-700"><X className="h-4 w-4" /></button>
                </div>
              </div>
              <button className="text-sm font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1">
                <Plus className="h-4 w-4" /> Add another time slot
              </button>
            </div>
            
            <div className="border-t border-slate-700 bg-slate-900/60 px-6 py-4 rounded-b-xl flex justify-end gap-3">
              <button onClick={() => setIsDailyPolicyModalOpen(false)} className="rounded-md px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-600 transition-colors">Close</button>
              <button onClick={() => setIsDailyPolicyModalOpen(false)} className="rounded-md bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors">Save Policies</button>
            </div>
          </div>
        </div>
      )}

      {/* Global Night Free Modal */}
      {isNightFreeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-6">
          <div className="w-full max-w-md rounded-xl bg-slate-800 shadow-xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-slate-700 px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  <Moon className="h-5 w-5 text-indigo-500" /> Global Night Free
                </h2>
                <p className="text-sm text-slate-400 mt-1">Configure unmetered traffic hours.</p>
              </div>
              <button onClick={() => setIsNightFreeModalOpen(false)} className="text-slate-400 hover:text-slate-400 focus:outline-none">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-slate-300">Enable Night Free System-wide</span>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input type="checkbox" className="peer sr-only" defaultChecked />
                  <div className="peer h-6 w-11 rounded-full bg-slate-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-slate-800 after:transition-all after:content-[''] peer-checked:bg-indigo-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300"></div>
                </label>
              </div>

              <div className="flex items-center gap-4 border-t border-slate-800 pt-4 mb-4">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-slate-400 mb-1">Free Time Start</label>
                  <input type="time" defaultValue="02:00" className="w-full rounded-md border border-slate-600 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-medium text-slate-400 mb-1">Free Time End</label>
                  <input type="time" defaultValue="07:00" className="w-full rounded-md border border-slate-600 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
                </div>
              </div>

              <div className="border-t border-slate-800 pt-4">
                <label className="block text-sm font-medium text-slate-300 mb-2">Apply this policy to specific packages</label>
                <div className="bg-slate-900/60 border border-slate-700 rounded-md p-3 max-h-40 overflow-y-auto space-y-2">
                  {dataProfiles.map(p => (
                    <div key={p.id} className="flex items-center gap-2">
                      <input type="checkbox" id={`night-free-profile-${p.id}`} defaultChecked={p.id === 1} className="rounded border-slate-600 text-indigo-600 focus:ring-indigo-500" />
                      <label htmlFor={`night-free-profile-${p.id}`} className="text-sm text-slate-300 cursor-pointer">{p.name}</label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="border-t border-slate-700 bg-slate-900/60 px-6 py-4 rounded-b-xl flex justify-end gap-3">
              <button onClick={() => setIsNightFreeModalOpen(false)} className="rounded-md px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-600 transition-colors">Close</button>
              <button onClick={() => setIsNightFreeModalOpen(false)} className="rounded-md bg-indigo-600 px-6 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors">Save Settings</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
