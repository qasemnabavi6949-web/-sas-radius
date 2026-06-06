'use client';

import { useState, useEffect } from 'react';
import { Plus, Server, X, Trash2 } from 'lucide-react';

export default function NAS() {
  const [nasList, setNasList] = useState<any[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedNasId, setSelectedNasId] = useState<number | null>(null);

  // Form states
  const [nasName, setNasName] = useState('');
  const [nasIp, setNasIp] = useState('');
  const [nasType, setNasType] = useState('MikroTik');
  const [nasSecret, setNasSecret] = useState('');
  const [nasCoaPort, setNasCoaPort] = useState('3799');

  const [isSetupGuideOpen, setIsSetupGuideOpen] = useState(false);
  const [setupNasInfo, setSetupNasInfo] = useState<any>(null);

  useEffect(() => {
    fetchNas();
  }, []);

  const fetchNas = async () => {
    try {
      const res = await fetch('/api/nas');
      if (res.ok) {
         const data = await res.json();
         setNasList(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddNas = async () => {
    try {
      await fetch('/api/nas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: nasName,
          ip: nasIp,
          type: nasType,
          secret: nasSecret,
          coaPort: nasCoaPort
        })
      });
      fetchNas();
    } catch (e) {
      console.error(e);
    }
    
    setIsAddModalOpen(false);
    // Reset form
    setNasName('');
    setNasIp('');
    setNasType('MikroTik');
    setNasSecret('');
    setNasCoaPort('3799');
  };

  const handleEditNas = async () => {
    try {
      await fetch(`/api/nas/${selectedNasId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: nasName,
          ip: nasIp,
          type: nasType,
          secret: nasSecret,
          coaPort: nasCoaPort
        })
      });
      fetchNas();
    } catch (e) {
      console.error(e);
    }
    
    setIsEditModalOpen(false);
  };

  const openEditModal = (nas: any) => {
    setSelectedNasId(nas.id);
    setNasName(nas.name);
    setNasIp(nas.ip);
    setNasType(nas.type);
    setNasSecret(nas.secret);
    setNasCoaPort(nas.coaPort);
    setIsEditModalOpen(true);
  };

  const handleDeleteNas = async (id: number) => {
    try {
      await fetch(`/api/nas/${id}`, { method: 'DELETE' });
      fetchNas();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">Network Access Servers (NAS)</h1>
          <p className="text-sm text-slate-400">Configure routers, switches, and access servers.</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add NAS
        </button>
      </div>

      <div className="rounded-xl border border-slate-700 bg-slate-800 shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm text-slate-400">
          <thead className="bg-slate-900/40 text-xs uppercase text-slate-400 border-b border-slate-700">
            <tr>
              <th className="px-6 py-3 font-medium">NAS Name</th>
              <th className="px-6 py-3 font-medium">IP Address</th>
              <th className="px-6 py-3 font-medium">Type</th>
              <th className="px-6 py-3 font-medium">Secret</th>
              <th className="px-6 py-3 font-medium">CoA Port</th>
              <th className="px-6 py-3 font-medium">Status</th>
              <th className="px-6 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700 bg-slate-800">
            {nasList.map((nas) => (
              <tr key={nas.id} className="hover:bg-slate-700/50 transition-colors">
                <td className="px-6 py-4 font-medium text-slate-100 flex items-center gap-2">
                  <Server className="h-4 w-4 text-slate-400" />
                  {nas.name}
                </td>
                <td className="px-6 py-4 font-mono text-xs">{nas.ip}</td>
                <td className="px-6 py-4">{nas.type}</td>
                <td className="px-6 py-4 font-mono text-xs">{nas.secret}</td>
                <td className="px-6 py-4 font-mono text-xs">{nas.coaPort}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${
                    nas.status === 'Online' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                  }`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${nas.status === 'Online' ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                    {nas.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => { setSetupNasInfo(nas); setIsSetupGuideOpen(true); }} className="text-emerald-400 hover:text-emerald-500 transition-colors p-1 mr-2" title="Setup Guide">
                    Guide
                  </button>
                  <button onClick={() => openEditModal(nas)} className="text-blue-400 hover:text-blue-500 transition-colors p-1 mr-2" title="Edit">
                    Edit
                  </button>
                  <button onClick={() => handleDeleteNas(nas.id)} className="text-slate-400 hover:text-red-500 transition-colors p-1" title="Delete">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add NAS Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl bg-slate-800 p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6 border-b border-slate-800 pb-4">
              <h2 className="text-lg font-bold text-slate-100">Add New NAS</h2>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-400">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">NAS Name</label>
                <input 
                  type="text" 
                  value={nasName}
                  onChange={(e) => setNasName(e.target.value)}
                  className="w-full rounded-md border border-slate-600 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" 
                  placeholder="e.g. Main Router" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">IP Address</label>
                <input 
                  type="text" 
                  value={nasIp}
                  onChange={(e) => setNasIp(e.target.value)}
                  className="w-full rounded-md border border-slate-600 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono" 
                  placeholder="e.g. 192.168.1.1" 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">NAS Type</label>
                  <select 
                    value={nasType}
                    onChange={(e) => setNasType(e.target.value)}
                    className="w-full rounded-md border border-slate-600 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option>MikroTik</option>
                    <option>Cisco</option>
                    <option>OpenVPN</option>
                    <option>ChilliSpot</option>
                    <option>Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Incoming (COA) Port</label>
                  <input 
                    type="text" 
                    value={nasCoaPort}
                    onChange={(e) => setNasCoaPort(e.target.value)}
                    className="w-full rounded-md border border-slate-600 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono" 
                    placeholder="3799" 
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">RADIUS Secret</label>
                <input 
                  type="password" 
                  value={nasSecret}
                  onChange={(e) => setNasSecret(e.target.value)}
                  className="w-full rounded-md border border-slate-600 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" 
                  placeholder="Shared secret key" 
                />
              </div>
              <div className="pt-4 flex justify-end gap-3 border-t border-slate-800">
                <button onClick={() => setIsAddModalOpen(false)} className="rounded-md px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-700">Cancel</button>
                <button onClick={handleAddNas} className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">Add NAS</button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Edit NAS Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl bg-slate-800 p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6 border-b border-slate-800 pb-4">
              <h2 className="text-lg font-bold text-slate-100">Edit NAS</h2>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-400">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">NAS Name</label>
                <input 
                  type="text" 
                  value={nasName}
                  onChange={(e) => setNasName(e.target.value)}
                  className="w-full rounded-md border border-slate-600 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" 
                  placeholder="e.g. Main Router" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">IP Address</label>
                <input 
                  type="text" 
                  value={nasIp}
                  onChange={(e) => setNasIp(e.target.value)}
                  className="w-full rounded-md border border-slate-600 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono" 
                  placeholder="e.g. 192.168.1.1" 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">NAS Type</label>
                  <select 
                    value={nasType}
                    onChange={(e) => setNasType(e.target.value)}
                    className="w-full rounded-md border border-slate-600 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option>MikroTik</option>
                    <option>Cisco</option>
                    <option>OpenVPN</option>
                    <option>ChilliSpot</option>
                    <option>Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Incoming (COA) Port</label>
                  <input 
                    type="text" 
                    value={nasCoaPort}
                    onChange={(e) => setNasCoaPort(e.target.value)}
                    className="w-full rounded-md border border-slate-600 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono" 
                    placeholder="3799" 
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">RADIUS Secret</label>
                <input 
                  type="text" 
                  value={nasSecret}
                  onChange={(e) => setNasSecret(e.target.value)}
                  className="w-full rounded-md border border-slate-600 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" 
                  placeholder="Shared secret key" 
                />
              </div>
              <div className="pt-4 flex justify-end gap-3 border-t border-slate-800">
                <button onClick={() => setIsEditModalOpen(false)} className="rounded-md px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-700">Cancel</button>
                <button onClick={handleEditNas} className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">Save</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Setup Guide Modal */}
      {isSetupGuideOpen && setupNasInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl rounded-xl bg-slate-800 p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6 border-b border-slate-800 pb-4">
              <h2 className="text-lg font-bold text-slate-100">Setup Guide: {setupNasInfo.name} ({setupNasInfo.type})</h2>
              <button onClick={() => setIsSetupGuideOpen(false)} className="text-slate-400 hover:text-slate-400">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-6">
              <div className="text-slate-300 text-sm">
                <p className="mb-2">To connect your MikroTik router to this RADIUS server, please follow these steps.</p>
                <p>Run the following command in your MikroTik terminal:</p>
              </div>

              <div className="bg-slate-900 rounded-md p-4 font-mono text-sm border border-slate-700 relative group">
                <code className="text-emerald-400 block whitespace-pre-wrap">
                  {`/radius add address=<RADIUS_SERVER_IP> secret="${setupNasInfo.secret}" service=hotspot authentication-port=1812 accounting-port=1813 timeout=3s`}
                </code>
                <p className="text-slate-500 text-xs mt-2 italic">Note: Replace &lt;RADIUS_SERVER_IP&gt; with the IP address of this server.</p>
              </div>

              <div>
                 <h3 className="text-md font-medium text-slate-200 mb-2">GUI (WinBox) Instructions:</h3>
                 <ol className="list-decimal list-inside space-y-2 text-sm text-slate-400">
                   <li>Open <strong>WinBox</strong> and go to <strong>RADIUS</strong> in the left menu.</li>
                   <li>Click the <strong>+ (Add)</strong> button to add a new server.</li>
                   <li>Check the <strong>hotspot</strong> service box (or ppp/wireless depending on your use case).</li>
                   <li>Set Address to your RADIUS Server IP.</li>
                   <li>Set Protocol to <strong>udp</strong>.</li>
                   <li>Set Secret to: <strong className="text-emerald-400">{setupNasInfo.secret}</strong></li>
                   <li>Ensure Authentication Port is <strong>1812</strong> and Accounting Port is <strong>1813</strong>.</li>
                   <li>Set Timeout to <strong>3000 ms</strong>.</li>
                   <li>Click <strong>Apply</strong> and <strong>OK</strong>.</li>
                 </ol>
              </div>

              {setupNasInfo.coaPort && (
                <div>
                  <h3 className="text-md font-medium text-slate-200 mb-2">Incoming (Change of Authorization) Setup:</h3>
                  <div className="bg-slate-900 rounded-md p-4 font-mono text-sm border border-slate-700">
                     <code className="text-blue-400 block break-all">
                       {`/radius incoming set accept=yes port=${setupNasInfo.coaPort}`}
                     </code>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-6 mt-6 flex justify-end gap-3 border-t border-slate-800">
              <button onClick={() => setIsSetupGuideOpen(false)} className="rounded-md bg-slate-700 px-4 py-2 text-sm font-medium text-white hover:bg-slate-600 transition-colors">Close Guide</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
