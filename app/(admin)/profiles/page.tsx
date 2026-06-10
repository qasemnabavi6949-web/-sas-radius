'use client';

import { useState, useEffect } from 'react';
import { Plus, FileBadge, Edit2, Trash2, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function Profiles() {
  const router = useRouter();
  const [dataProfiles, setDataProfiles] = useState<any[]>([]);
  const [isDataModalOpen, setIsDataModalOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<any>(null);

  useEffect(() => { fetchProfiles(); }, []);

  const fetchProfiles = async () => {
    try {
      const res = await fetch('/api/profiles');
      if (res.ok) {
        const data = await res.json();
        setDataProfiles(data.filter((p: any) => p.type === 'data' || !p.type));
      }
    } catch (e) { console.error(e); }
  };

  const handleOpenDataModal = (profile: any = null) => {
    setEditingProfile(profile);
    setIsDataModalOpen(true);
  };

  const handleSaveDataProfile = async () => {
    const newDataProfile = {
      name: (document.getElementById('data-name') as HTMLInputElement)?.value || 'New Plan',
      price: (document.getElementById('data-price') as HTMLInputElement)?.value || '0',
      downloadSpeed: (document.getElementById('data-dl-speed') as HTMLInputElement)?.value || '',
      uploadSpeed: (document.getElementById('data-ul-speed') as HTMLInputElement)?.value || '',
      totalTraffic: (document.getElementById('data-total-traffic') as HTMLInputElement)?.value || '',
      validityDays: parseInt((document.getElementById('data-validity-days') as HTMLInputElement)?.value || '30'),
      type: 'data'
    };
    try {
      const url = editingProfile ? `/api/profiles/${editingProfile.id}` : '/api/profiles';
      const method = editingProfile ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newDataProfile) });
      if (!res.ok) throw new Error(await res.text());
      const saved = await res.json();
      fetchProfiles();
      if (!editingProfile) router.push(`/profiles/${saved.id}/policies`);
      else setIsDataModalOpen(false);
    } catch (err: any) { alert(err.message); }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen text-gray-800">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Data Profiles</h1>
        <button onClick={() => handleOpenDataModal()} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-sm">
          <Plus size={18} /> Add Profile
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm text-gray-700">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500 border-b">
            <tr>
              <th className="px-6 py-3">Name</th>
              <th className="px-6 py-3">Price (AFN)</th>
              <th className="px-6 py-3">Download Speed</th>
              <th className="px-6 py-3">Upload Speed</th>
              <th className="px-6 py-3">Validity (Days)</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {dataProfiles.map(p => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium">{p.name}</td>
                <td className="px-6 py-4">{p.price} ؋</td>
                <td className="px-6 py-4">{p.downloadSpeed} Kbps</td>
                <td className="px-6 py-4">{p.uploadSpeed} Kbps</td>
                <td className="px-6 py-4">{p.validityDays || 30} days</td>
                <td className="px-6 py-4 text-right space-x-2">
                  <button onClick={() => handleOpenDataModal(p)} className="text-gray-400 hover:text-blue-600"><Edit2 size={16} /></button>
                  <button onClick={() => router.push(`/profiles/${p.id}/policies`)} className="text-gray-400 hover:text-indigo-600"><Clock size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isDataModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl">
            <div className="flex justify-between items-center border-b p-4">
              <h2 className="text-lg font-bold">{editingProfile ? 'Edit Profile' : 'New Profile'}</h2>
              {editingProfile && (
                <button onClick={() => router.push(`/profiles/${editingProfile.id}/policies`)} className="flex items-center gap-1 text-indigo-600">
                  <Clock size={16} /> Daily Policies
                </button>
              )}
              <button onClick={() => setIsDataModalOpen(false)} className="text-gray-400">&times;</button>
            </div>
            <div className="p-6 space-y-4">
              <input id="data-name" type="text" defaultValue={editingProfile?.name || ''} placeholder="Profile Name" className="w-full border rounded-md p-2" />
              <input id="data-price" type="text" defaultValue={editingProfile?.price || '0'} placeholder="Price" className="w-full border rounded-md p-2" />
              <input id="data-dl-speed" type="number" defaultValue={editingProfile?.downloadSpeed || ''} placeholder="Download Speed (kbps)" className="w-full border rounded-md p-2" />
              <input id="data-ul-speed" type="number" defaultValue={editingProfile?.uploadSpeed || ''} placeholder="Upload Speed (kbps)" className="w-full border rounded-md p-2" />
              <input id="data-total-traffic" type="number" defaultValue={editingProfile?.totalTraffic || ''} placeholder="Total Traffic (MB)" className="w-full border rounded-md p-2" />
              <input id="data-validity-days" type="number" defaultValue={editingProfile?.validityDays || 30} placeholder="Validity (Days)" className="w-full border rounded-md p-2" />
            </div>
            <div className="border-t p-4 flex justify-end gap-3">
              <button onClick={() => setIsDataModalOpen(false)} className="px-4 py-2 border rounded-md">Cancel</button>
              <button onClick={handleSaveDataProfile} className="px-4 py-2 bg-blue-600 text-white rounded-md">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
