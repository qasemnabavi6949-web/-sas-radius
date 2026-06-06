'use client';

import { useState } from 'react';
import { Plus, Shield, X, Save } from 'lucide-react';

const initialManagers = [
  { id: 1, name: 'Super Admin', username: 'admin', role: 'Full Access', lastLogin: '2 mins ago' },
  { id: 2, name: 'Support Team', username: 'support_1', role: 'Read Only', lastLogin: '1 hour ago' },
  { id: 3, name: 'Billing Dept', username: 'billing_admin', role: 'Billing Access', lastLogin: '1 day ago' },
];

export default function Managers() {
  const [managers, setManagers] = useState(initialManagers);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingManager, setEditingManager] = useState<any>(null);

  const handleOpenAdd = () => {
    setEditingManager(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (manager: any) => {
    setEditingManager(manager);
    setIsModalOpen(true);
  };

  const handleDelete = (id: number) => {
    setManagers(managers.filter(m => m.id !== id));
  };

  const handleSave = () => {
    const nameInput = document.getElementById('mgr-name') as HTMLInputElement;
    const usernameInput = document.getElementById('mgr-username') as HTMLInputElement;
    const roleInput = document.getElementById('mgr-role') as HTMLSelectElement;

    if (!nameInput?.value || !usernameInput?.value) return;

    if (editingManager) {
      setManagers(managers.map(m => {
        if (m.id === editingManager.id) {
          return {
            ...m,
            name: nameInput.value,
            username: usernameInput.value,
            role: roleInput.value
          };
        }
        return m;
      }));
    } else {
      setManagers([
        ...managers,
        {
          id: Date.now(),
          name: nameInput.value,
          username: usernameInput.value,
          role: roleInput.value,
          lastLogin: 'Never'
        }
      ]);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">Managers</h1>
          <p className="text-sm text-slate-400">Manage administrator accounts and their permissions.</p>
        </div>
        <button 
          onClick={handleOpenAdd}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Manager
        </button>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {managers.map((manager) => (
          <div key={manager.id} className="rounded-xl border border-slate-700 bg-slate-800 p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10 text-blue-400">
                  <Shield className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-medium text-slate-100">{manager.name}</h3>
                  <p className="text-sm text-slate-400">@{manager.username}</p>
                </div>
              </div>
            </div>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Role</span>
                <span className="font-medium text-slate-100">{manager.role}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Last Login</span>
                <span className="text-slate-100">{manager.lastLogin}</span>
              </div>
            </div>
            <div className="mt-6 flex gap-2">
              <button onClick={() => handleOpenEdit(manager)} className="flex-1 rounded-md border border-slate-700 py-1.5 text-sm font-medium text-slate-300 hover:bg-slate-700/50">Edit</button>
              <button 
                onClick={() => handleDelete(manager.id)}
                className="flex-1 rounded-md border border-red-500/20 text-red-400 py-1.5 text-sm font-medium hover:bg-red-500/10"
              >
                Disable
              </button>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-6">
          <div className="w-full max-w-md rounded-xl bg-slate-800 shadow-xl flex flex-col border border-slate-700 max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-slate-700 px-6 py-4">
              <h2 className="text-lg font-bold text-slate-100">
                {editingManager ? 'Edit Manager' : 'Add New Manager'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-200 focus:outline-none">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Full Name</label>
                <input 
                  id="mgr-name" 
                  type="text" 
                  defaultValue={editingManager?.name || ''} 
                  className="w-full rounded-md border border-slate-700 bg-slate-900/40 px-3 py-2 text-sm text-slate-100 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" 
                  placeholder="e.g. John Doe" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Username</label>
                <input 
                  id="mgr-username" 
                  type="text" 
                  defaultValue={editingManager?.username || ''} 
                  className="w-full rounded-md border border-slate-700 bg-slate-900/40 px-3 py-2 text-sm text-slate-100 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" 
                  placeholder="e.g. jdoe" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Password</label>
                <input 
                  id="mgr-password" 
                  type="password" 
                  className="w-full rounded-md border border-slate-700 bg-slate-900/40 px-3 py-2 text-sm text-slate-100 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" 
                  placeholder={editingManager ? 'Leave blank to keep current' : '••••••••'} 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Access Role</label>
                <select 
                  id="mgr-role" 
                  defaultValue={editingManager?.role || 'Read Only'} 
                  className="w-full rounded-md border border-slate-700 bg-slate-900/40 px-3 py-2 text-sm text-slate-100 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="Full Access">Full Access</option>
                  <option value="Operator">Operator</option>
                  <option value="Billing Access">Billing Access</option>
                  <option value="Read Only">Read Only</option>
                </select>
              </div>
            </div>
            
            <div className="border-t border-slate-700 bg-slate-900/40 px-6 py-4 rounded-b-xl flex justify-end gap-3 shrink-0">
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="rounded-md px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleSave} 
                className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
              >
                <Save className="h-4 w-4" />
                Save Manager
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
