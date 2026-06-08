'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X, Package, Activity, WifiOff, Zap, RefreshCw, Edit2, Plus, Trash2,
  FileClock, Search, ArrowLeft, UserPlus, Upload, Key,
  ToggleLeft, PenLine, ChevronDown, CheckCircle, Ban, Clock, Users
} from 'lucide-react';
import dynamic from 'next/dynamic';

const UserTrafficChart = dynamic(() => import('../report/TrafficReportChart'), { ssr: false });

function generateAvatarSVG(username: string): string {
  const firstLetter = username.charAt(0).toUpperCase();
  const hue = (username.charCodeAt(0) * 7 + (username.charCodeAt(1) || 0) * 13) % 360;
  const grad1 = `hsl(${hue}, 75%, 55%)`;
  const grad2 = `hsl(${hue + 35}, 80%, 45%)`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
    <defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="${grad1}"/><stop offset="100%" stop-color="${grad2}"/></linearGradient></defs>
    <circle cx="50" cy="50" r="50" fill="url(#g)"/>
    <text x="50" y="68" font-size="42" font-family="Arial, sans-serif" font-weight="bold" fill="white" text-anchor="middle">${firstLetter}</text>
  </svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export default function UserList() {
  const [viewMode, setViewMode] = useState<'list' | 'manage'>('list');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [manageUser, setManageUser] = useState<any>(null);
  const [manageTab, setManageTab] = useState<'overview' | 'edit' | 'traffic' | 'history'>('overview');

  const [users, setUsers] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);

  const [userTrafficData, setUserTrafficData] = useState<any[]>([]);
  const [isUserTrafficLoading, setIsUserTrafficLoading] = useState(false);
  const [userHistoryData, setUserHistoryData] = useState<any[]>([]);

  const [userTrafficMonth, setUserTrafficMonth] = useState((new Date().getMonth() + 1).toString().padStart(2, '0'));
  const [userTrafficYear, setUserTrafficYear] = useState(new Date().getFullYear().toString());

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newProfile, setNewProfile] = useState('');
  const [newStaticIp, setNewStaticIp] = useState('');
  const [newFirstName, setNewFirstName] = useState('');
  const [newLastName, setNewLastName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newNationalId, setNewNationalId] = useState('');

  const [editUsername, setEditUsername] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedProfile, setSelectedProfile] = useState('');
  const [editStaticIp, setEditStaticIp] = useState('');
  const [editExpiration, setEditExpiration] = useState('');
  const [userEnabled, setUserEnabled] = useState(true);
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editNationalId, setEditNationalId] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [bulkDropdownOpen, setBulkDropdownOpen] = useState(false);
  const bulkDropdownRef = useRef<HTMLDivElement>(null);
  const [selectedUsernames, setSelectedUsernames] = useState<Set<string>>(new Set());
  const [sortColumn, setSortColumn] = useState<'username' | 'status' | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const currentUsernameRef = useRef<string>('');

  useEffect(() => {
    fetchUsers();
    fetchProfiles();
  }, []);

  useEffect(() => {
    if (manageUser?.username) {
      currentUsernameRef.current = manageUser.username;
    }
  }, [manageUser]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (bulkDropdownRef.current && !bulkDropdownRef.current.contains(event.target as Node)) {
        setBulkDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatBytes = (bytes: number) => {
    if (!bytes || isNaN(bytes) || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getTotalLimitBytes = (user: any) => {
    const dataLimit = user.dataLimitBytes || 0;
    const bonus = user.bonusBytes || 0;
    return dataLimit + bonus;
  };

  const getRemainingBytes = (user: any) => {
    const totalLimit = getTotalLimitBytes(user);
    const used = user.usedBytes || 0;
    const remaining = totalLimit - used;
    return remaining > 0 ? remaining : 0;
  };

  const fetchProfiles = async () => {
    try {
      const res = await fetch('/api/profiles', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setProfiles(Array.isArray(data) ? data : []);
      }
    } catch (e) { console.error(e); }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setUsers(Array.isArray(data) ? data : data.data || []);
      }
    } catch (error) { console.error("Error fetching users", error); }
  };

  useEffect(() => {
    if (manageUser && viewMode === 'manage') {
      if (manageTab === 'traffic') fetchUserTraffic();
      if (manageTab === 'history') fetchUserHistory();
    }
  }, [manageTab, manageUser, userTrafficYear, userTrafficMonth, viewMode]);

  const fetchUserTraffic = async () => {
    if (!manageUser) return;
    setIsUserTrafficLoading(true);
    try {
      const res = await fetch(`/api/report/traffic?year=${userTrafficYear}&month=${userTrafficMonth}&username=${manageUser.username}`);
      const json = await res.json();
      if (json.data && Array.isArray(json.data)) setUserTrafficData(json.data);
      else if (Array.isArray(json)) setUserTrafficData(json);
      else setUserTrafficData([]);
    } catch (e) {
      console.error("Error fetching traffic", e);
      setUserTrafficData([]);
    }
    setIsUserTrafficLoading(false);
  };

  const fetchUserHistory = async () => {
    if (!manageUser) return;
    try {
      const res = await fetch(`/api/users/${manageUser.username}/history`, { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        const serverLogs = json.history || json.data || (Array.isArray(json) ? json : []);
        setUserHistoryData(Array.isArray(serverLogs) ? serverLogs : []);
      }
    } catch (e) {
      console.error(e);
      setUserHistoryData([]);
    }
  };

  const calculateDaysValue = (expiryStr: string) => {
    if (!expiryStr) return 999;
    const expiryDate = new Date(expiryStr);
    const today = new Date();
    expiryDate.setHours(0,0,0,0);
    today.setHours(0,0,0,0);
    const diffTime = expiryDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const getUserStatus = (user: any) => {
    if (!user) return 'Disabled';
    const remainingBytes = getRemainingBytes(user);
    const daysLeft = calculateDaysValue(user.expiration);
    const isOnline = (user.isOnline === 1 || user.status === 'Online');

    if (remainingBytes === 0 && daysLeft > 0) return 'Depleted';
    if (daysLeft === 0) return 'Expired';
    if (isOnline) return 'Online';
    if (user.status === 'Disabled' || user.accountStatus === 'Disabled') return 'Disabled';
    return 'Active';
  };

  const countStatus = (statusType: 'Online' | 'Active' | 'Expired' | 'Depleted' | 'Disabled') => {
    if (!Array.isArray(users)) return 0;
    return users.filter(u => getUserStatus(u) === statusType).length;
  };

  const bulkDelete = async () => {
    if (selectedUsernames.size === 0) return alert('No users selected.');
    if (!confirm(`Delete ${selectedUsernames.size} user(s)?`)) return;
    for (const username of selectedUsernames) {
      await fetch(`/api/users/${username}`, { method: 'DELETE' }).catch(console.error);
    }
    fetchUsers();
    setSelectedUsernames(new Set());
    setBulkDropdownOpen(false);
  };

  const bulkEnableDisable = async (enable: boolean) => {
    if (selectedUsernames.size === 0) return alert('No users selected.');
    const newStatus = enable ? 'Active' : 'Disabled';
    if (!confirm(`Set ${selectedUsernames.size} user(s) to ${newStatus}?`)) return;
    for (const username of selectedUsernames) {
      await fetch(`/api/users/${username}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      }).catch(console.error);
    }
    fetchUsers();
    setSelectedUsernames(new Set());
    setBulkDropdownOpen(false);
  };

  const bulkAddTraffic = async () => {
    if (selectedUsernames.size === 0) return alert('No users selected.');
    const mb = prompt('Enter traffic amount to ADD (in MB) for each selected user:', '1024');
    if (!mb || isNaN(Number(mb))) return;
    const bytes = parseFloat(mb) * 1024 * 1024;
    let successCount = 0;
    for (const username of selectedUsernames) {
      try {
        const res = await fetch(`/api/users/${username}/charge`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'add_traffic', bytes, traffic_mb: parseFloat(mb) })
        });
        if (res.ok) successCount++;
      } catch (err) { console.error(err); }
    }
    alert(`${successCount} out of ${selectedUsernames.size} users received ${mb} MB.`);
    await fetchUsers();
    setBulkDropdownOpen(false);
  };

  const bulkChangeProfile = async () => {
    if (selectedUsernames.size === 0) return alert('No users selected.');
    const profileName = prompt('Enter new profile name for all selected users:', profiles[0]?.name || '');
    if (!profileName) return;
    for (const username of selectedUsernames) {
      await fetch(`/api/users/${username}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ group: profileName })
      }).catch(console.error);
    }
    alert(`Profile changed to "${profileName}" for ${selectedUsernames.size} user(s).`);
    fetchUsers();
    setSelectedUsernames(new Set());
    setBulkDropdownOpen(false);
  };

  const bulkChargeRenew = async () => {
    if (selectedUsernames.size === 0) return alert('No users selected.');
    if (!confirm(`Charge/renew package for ${selectedUsernames.size} user(s)?`)) return;
    for (const username of selectedUsernames) {
      await fetch(`/api/users/${username}/charge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'charge' })
      }).catch(console.error);
    }
    alert('Package charged/renewed for selected users.');
    fetchUsers();
    setSelectedUsernames(new Set());
    setBulkDropdownOpen(false);
  };

  const handleOpenManageFromList = (user: any) => {
    setManageUser(user);
    setEditUsername(user?.username || '');
    setEditPassword(user?.password || '');
    setConfirmPassword(user?.password || '');
    setSelectedProfile(user?.group || '');
    setEditStaticIp(user?.staticIp || user?.static_ip || '');
    setEditExpiration(user?.expiration || '');
    setEditFirstName(user?.firstName || '');
    setEditLastName(user?.lastName || '');
    setEditEmail(user?.email || '');
    setEditPhone(user?.phone || '');
    setEditAddress(user?.address || '');
    setEditNationalId(user?.nationalId || '');
    setUserEnabled(user?.status !== 'Disabled');
    setManageTab('overview');
    setViewMode('manage');
  };

  const handleAddUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername || !newProfile) {
      alert("Username and Profile are required!");
      return;
    }
    fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: newUsername,
        password: newPassword,
        group: newProfile,
        staticIp: newStaticIp,
        firstName: newFirstName,
        lastName: newLastName,
        email: newEmail,
        phone: newPhone,
        address: newAddress,
        nationalId: newNationalId
      })
    }).then(res => {
      if (res.ok) {
        alert("User added successfully!");
        setIsAddModalOpen(false);
        setNewUsername('');
        setNewPassword('');
        setNewProfile('');
        setNewStaticIp('');
        setNewFirstName('');
        setNewLastName('');
        setNewEmail('');
        setNewPhone('');
        setNewAddress('');
        setNewNationalId('');
        fetchUsers();
      } else {
        alert("Failed to add user.");
      }
    });
  };

  const handleToggleStatusManage = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!manageUser) return;
    const newStatus = manageUser.status === 'Disabled' ? 'Active' : 'Disabled';
    if (confirm(`Are you sure you want to change status to ${newStatus}?`)) {
      fetch(`/api/users/${manageUser.username}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      }).then(res => {
        if (res.ok) {
          fetchUsers();
          setManageUser({ ...manageUser, status: newStatus });
        }
      });
    }
  };

  const handleDisconnectUser = (e: React.MouseEvent) => {
    e.preventDefault();
    if (manageUser && confirm(`Disconnect ${manageUser.username}?`)) {
      fetch(`/api/users/${manageUser.username}/disconnect`, { method: 'POST' }).then(res => {
        if (res.ok) {
          alert('User disconnected.');
          fetchUsers();
        }
      });
    }
  };

  const handleChargeUserManage = (e: React.MouseEvent) => {
    e.preventDefault();
    if (manageUser && confirm(`Renew profile package for ${manageUser.username}?`)) {
      fetch(`/api/users/${manageUser.username}/charge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'charge' })
      }).then(res => {
        if (res.ok) {
          alert('User package charged successfully!');
          fetchUsers();
          setViewMode('list');
        }
      });
    }
  };

  const handleResetTraffic = (e: React.MouseEvent) => {
    e.preventDefault();
    if (manageUser && confirm(`Reset traffic statistics for ${manageUser.username}?`)) {
      fetch(`/api/users/${manageUser.username}/charge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset_stats' })
      }).then(res => {
        if (res.ok) {
          alert('Traffic statistics reset successfully!');
          fetchUsers();
        }
      });
    }
  };

  const handleAddTrafficCustomMB = async (e: React.MouseEvent) => {
    e.preventDefault();
    let username = currentUsernameRef.current || manageUser?.username;
    if (!username) {
      alert("User information missing. Please go back and select a user again.");
      return;
    }
    const inputMb = prompt("Enter traffic amount to ADD (in MB):", "1024");
    if (!inputMb || isNaN(Number(inputMb))) return;
    const mb = parseFloat(inputMb);
    const bytes = mb * 1024 * 1024;
    try {
      let res = await fetch(`/api/users/${username}/charge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add_traffic', bytes, traffic_mb: mb })
      });
      let data = await res.json();
      if (!res.ok) {
        console.warn("Fallback to action 'add'", data);
        res = await fetch(`/api/users/${username}/charge`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'add', bytes, traffic_mb: mb })
        });
        data = await res.json();
      }
      if (res.ok) {
        alert(`${mb} MB added successfully to ${username}!`);
        await fetchUsers();
        const singleRes = await fetch(`/api/users/${username}`, { cache: 'no-store' });
        if (singleRes.ok) {
          const updated = await singleRes.json();
          setManageUser(updated);
          currentUsernameRef.current = updated.username;
        }
      } else {
        alert(`Server error: ${JSON.stringify(data)}`);
      }
    } catch (err) {
      alert(`Error: ${err}`);
    }
  };

  const handleRenameUserManage = (e: React.MouseEvent) => {
    e.preventDefault();
    const newName = prompt("Enter new username:", manageUser.username);
    if (!newName || newName === manageUser.username) return;
    fetch(`/api/users/${manageUser.username}/rename`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newUsername: newName })
    }).then(res => {
      if (res.ok) {
        alert("Username updated!");
        fetchUsers();
        setViewMode('list');
      }
    });
  };

  const handleDeleteUser = (e: React.MouseEvent) => {
    e.preventDefault();
    if (manageUser && confirm(`Are you sure you want to delete ${manageUser.username}?`)) {
      fetch(`/api/users/${manageUser.username}`, { method: 'DELETE' }).then(res => {
        if (res.ok) {
          alert("User deleted.");
          fetchUsers();
          setViewMode('list');
        }
      });
    }
  };

  const handleSaveUserEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editPassword && editPassword !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }
    fetch(`/api/users/${manageUser.username}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: editUsername,
        password: editPassword || manageUser.password,
        group: selectedProfile,
        staticIp: editStaticIp,
        expiration: editExpiration,
        status: userEnabled ? 'Active' : 'Disabled',
        firstName: editFirstName,
        lastName: editLastName,
        email: editEmail,
        phone: editPhone,
        address: editAddress,
        nationalId: editNationalId
      })
    }).then(res => {
      if (res.ok) {
        alert("User details saved successfully!");
        fetchUsers();
        setViewMode('list');
      }
    });
  };

  const filteredUsers = users.filter(u =>
    u.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.group?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    if (!sortColumn) return 0;
    let valA = sortColumn === 'username' ? a.username : getUserStatus(a);
    let valB = sortColumn === 'username' ? b.username : getUserStatus(b);
    if (sortOrder === 'asc') return valA.localeCompare(valB);
    else return valB.localeCompare(valA);
  });

  const handleSort = (col: 'username' | 'status') => {
    if (sortColumn === col) setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    else { setSortColumn(col); setSortOrder('asc'); }
  };

  const toggleSelectAll = () => {
    if (selectedUsernames.size === sortedUsers.length) {
      setSelectedUsernames(new Set());
    } else {
      setSelectedUsernames(new Set(sortedUsers.map(u => u.username)));
    }
  };

  const toggleSelectOne = (username: string) => {
    const newSet = new Set(selectedUsernames);
    if (newSet.has(username)) newSet.delete(username);
    else newSet.add(username);
    setSelectedUsernames(newSet);
  };

  const StatusBadge = ({ status }: { status: string }) => {
    const config: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
      Online: { bg: 'bg-blue-100', text: 'text-blue-800', icon: <Zap size={12} className="inline mr-1" /> },
      Active: { bg: 'bg-green-100', text: 'text-green-800', icon: <CheckCircle size={12} className="inline mr-1" /> },
      Expired: { bg: 'bg-orange-100', text: 'text-orange-800', icon: <Clock size={12} className="inline mr-1" /> },
      Depleted: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: <Ban size={12} className="inline mr-1" /> },
      Disabled: { bg: 'bg-red-100', text: 'text-red-800', icon: <X size={12} className="inline mr-1" /> },
    };
    const { bg, text, icon } = config[status] || config.Disabled;
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${bg} ${text}`}>
        {icon} {status}
      </span>
    );
  };

  // ======================= MANAGE VIEW (بدون تغییر) =======================
  if (viewMode === 'manage' && manageUser) {
    const totalLimit = getTotalLimitBytes(manageUser);
    const used = manageUser.usedBytes || 0;
    const remaining = totalLimit - used;
    const trafficUsedStr = used > 0 ? formatBytes(used) : '0 B';
    const totalLimitStr = totalLimit > 0 ? formatBytes(totalLimit) : 'Unlimited';
    const remainingStr = totalLimit > 0 ? formatBytes(remaining) : (remaining === 0 ? '0 B' : '∞');

    return (
      <div className="space-y-4 p-6 bg-gray-50 min-h-screen text-gray-800 font-sans">
        <button
          onClick={() => setViewMode('list')}
          className="flex items-center gap-2 bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 px-4 py-2 rounded-lg shadow-sm transition mb-4"
        >
          <ArrowLeft size={18} /> Back to User List
        </button>
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Activity size={18} className="text-blue-600"/>
              User Management: {manageUser.username}
            </h2>
          </div>
          <div className="flex border-b border-gray-200 bg-gray-50 px-2 gap-1 overflow-x-auto">
            {(['overview', 'edit', 'traffic', 'history'] as const).map((tab) => (
              <button key={tab} type="button" onClick={() => setManageTab(tab)} className={`px-4 py-3 text-sm font-bold capitalize transition border-b-2 whitespace-nowrap ${manageTab === tab ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400 hover:text-gray-700'}`}>{tab}</button>
            ))}
          </div>
          <div className="p-6 bg-white">
            {manageTab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-5 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <button type="button" onClick={handleToggleStatusManage} className="flex flex-col items-center justify-center p-3 bg-slate-700 hover:bg-slate-800 text-white rounded-xl text-[11px] font-bold gap-2 transition min-h-[85px] shadow-sm"><Zap size={20} className={manageUser.status === 'Disabled' ? 'text-green-400' : 'text-red-400'} /> {manageUser.status === 'Disabled' ? 'ACTIVATE' : 'DEACTIVATE'}</button>
                    <button type="button" onClick={handleChargeUserManage} className="flex flex-col items-center justify-center p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[11px] font-bold gap-2 transition min-h-[85px] shadow-sm"><RefreshCw size={20} /> CHARGE / RENEW</button>
                    <button type="button" onClick={() => setManageTab('edit')} className="flex flex-col items-center justify-center p-3 bg-slate-100 hover:bg-gray-200 text-slate-800 border border-gray-200 rounded-xl text-[11px] font-bold gap-2 transition min-h-[85px] shadow-sm"><Package size={20} className="text-blue-600" /> CHANGE PROFILE</button>
                    <button type="button" onClick={handleDisconnectUser} className="flex flex-col items-center justify-center p-3 bg-slate-100 hover:bg-gray-200 text-slate-800 border border-gray-200 rounded-xl text-[11px] font-bold gap-2 transition min-h-[85px] shadow-sm"><WifiOff size={20} className="text-orange-500" /> DISCONNECT</button>
                    <button type="button" onClick={handleResetTraffic} className="flex flex-col items-center justify-center p-3 bg-slate-100 hover:bg-gray-200 text-slate-800 border border-gray-200 rounded-xl text-[11px] font-bold gap-2 transition min-h-[85px] shadow-sm"><FileClock size={20} className="text-purple-600" /> RESET STATS</button>
                    <button type="button" onClick={handleRenameUserManage} className="flex flex-col items-center justify-center p-3 bg-slate-100 hover:bg-gray-200 text-slate-800 border border-gray-200 rounded-xl text-[11px] font-bold gap-2 transition min-h-[85px] shadow-sm"><Edit2 size={20} className="text-emerald-600" /> RENAME</button>
                  </div>
                  <button type="button" onClick={handleAddTrafficCustomMB} className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-bold text-xs transition shadow-md"><Plus size={18} /> ADD EXTRA TRAFFIC (MB)</button>
                  <button type="button" onClick={handleDeleteUser} className="w-full flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 py-3 rounded-xl font-bold text-xs transition border border-red-200 uppercase tracking-wide"><Trash2 size={16} /> Delete Account</button>
                </div>
                <div className="lg:col-span-7 border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                  <table className="w-full text-left text-sm text-gray-900 bg-white">
                    <tbody className="divide-y divide-gray-100">
                      <tr><td className="p-4 font-bold text-gray-500 bg-gray-50/50 w-1/3 uppercase text-[10px]">Username</td><td className="p-4 font-bold text-blue-600">{manageUser.username}</td></tr>
                      <tr><td className="p-4 font-bold text-gray-500 bg-gray-50/50 uppercase text-[10px]">Password</td><td className="p-4 font-mono font-medium">{manageUser.password || '•••••'}</td></tr>
                      <tr><td className="p-4 font-bold text-gray-500 bg-gray-50/50 uppercase text-[10px]">First Name</td><td className="p-4 font-bold text-gray-900">{manageUser.firstName || '-'}</td></tr>
                      <tr><td className="p-4 font-bold text-gray-500 bg-gray-50/50 uppercase text-[10px]">Last Name</td><td className="p-4 font-bold text-gray-900">{manageUser.lastName || '-'}</td></tr>
                      <tr><td className="p-4 font-bold text-gray-500 bg-gray-50/50 uppercase text-[10px]">Email</td><td className="p-4 font-bold text-gray-900">{manageUser.email || '-'}</td></tr>
                      <tr><td className="p-4 font-bold text-gray-500 bg-gray-50/50 uppercase text-[10px]">Phone</td><td className="p-4 font-bold text-gray-900">{manageUser.phone || '-'}</td></tr>
                      <tr><td className="p-4 font-bold text-gray-500 bg-gray-50/50 uppercase text-[10px]">Address</td><td className="p-4 font-bold text-gray-900">{manageUser.address || '-'}</td></tr>
                      <tr><td className="p-4 font-bold text-gray-500 bg-gray-50/50 uppercase text-[10px]">National ID</td><td className="p-4 font-bold text-gray-900">{manageUser.nationalId || '-'}</td></tr>
                      <tr><td className="p-4 font-bold text-gray-500 bg-gray-50/50 uppercase text-[10px]">Static IP</td><td className="p-4 text-indigo-600 font-bold">{manageUser.staticIp || manageUser.static_ip || 'Dynamic'}</td></tr>
                      <tr><td className="p-4 font-bold text-gray-500 bg-gray-50/50 uppercase text-[10px]">Profile / Package</td><td className="p-4 text-blue-600 font-bold">{manageUser.group || 'None'}</td></tr>
                      <tr><td className="p-4 font-bold text-gray-500 bg-gray-50/50 uppercase text-[10px]">Expiration</td><td className="p-4 text-gray-700 font-mono font-bold">{manageUser.expiration || 'Permanent'}</td></tr>
                      <tr><td className="p-4 font-bold text-gray-500 bg-gray-50/50 uppercase text-[10px]">Traffic Used</td><td className="p-4 font-bold text-gray-900">{trafficUsedStr} / {totalLimitStr}</td></tr>
                      <tr><td className="p-4 font-bold text-gray-500 bg-gray-50/50 uppercase text-[10px]">Remaining</td><td className="p-4 font-bold text-green-600">{remainingStr}</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {manageTab === 'edit' && (
              <form onSubmit={handleSaveUserEdit} className="space-y-4 mx-auto bg-gray-50 p-6 rounded-2xl border border-gray-200">
                <div className="text-xs font-black text-gray-400 uppercase tracking-widest border-b pb-2 mb-4">Edit Configuration</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><label className="block text-[10px] font-black text-gray-500 mb-1 uppercase">Username</label><input type="text" value={editUsername} onChange={(e)=>setEditUsername(e.target.value)} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white font-bold" /></div>
                  <div><label className="block text-[10px] font-black text-gray-500 mb-1 uppercase">Profile / Package</label><select value={selectedProfile} onChange={(e)=>setSelectedProfile(e.target.value)} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white font-bold"><option value="">Select Profile</option>{profiles.map((p: any) => <option key={p.id} value={p.name}>{p.name}</option>)}</select></div>
                  <div><label className="block text-[10px] font-black text-gray-500 mb-1 uppercase">First Name</label><input type="text" value={editFirstName} onChange={(e)=>setEditFirstName(e.target.value)} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white" /></div>
                  <div><label className="block text-[10px] font-black text-gray-500 mb-1 uppercase">Last Name</label><input type="text" value={editLastName} onChange={(e)=>setEditLastName(e.target.value)} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white" /></div>
                  <div><label className="block text-[10px] font-black text-gray-500 mb-1 uppercase">Email</label><input type="email" value={editEmail} onChange={(e)=>setEditEmail(e.target.value)} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white" /></div>
                  <div><label className="block text-[10px] font-black text-gray-500 mb-1 uppercase">Phone</label><input type="text" value={editPhone} onChange={(e)=>setEditPhone(e.target.value)} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white" /></div>
                  <div><label className="block text-[10px] font-black text-gray-500 mb-1 uppercase">National ID</label><input type="text" value={editNationalId} onChange={(e)=>setEditNationalId(e.target.value)} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white" /></div>
                  <div><label className="block text-[10px] font-black text-gray-500 mb-1 uppercase">Static IP</label><input type="text" value={editStaticIp} onChange={(e)=>setEditStaticIp(e.target.value)} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white font-bold" /></div>
                  <div><label className="block text-[10px] font-black text-gray-500 mb-1 uppercase">Expiration (YYYY-MM-DD)</label><input type="text" value={editExpiration} onChange={(e)=>setEditExpiration(e.target.value)} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white font-mono font-bold" placeholder="2026-12-31" /></div>
                  <div><label className="block text-[10px] font-black text-gray-500 mb-1 uppercase">New Password</label><input type="password" value={editPassword} onChange={(e)=>setEditPassword(e.target.value)} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white font-bold" placeholder="Leave empty to keep same" /></div>
                  <div className="md:col-span-2"><label className="block text-[10px] font-black text-gray-500 mb-1 uppercase">Address</label><input type="text" value={editAddress} onChange={(e)=>setEditAddress(e.target.value)} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white" /></div>
                </div>
                <div className="pt-4"><button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-lg transition">Save Changes</button></div>
              </form>
            )}
            {manageTab === 'traffic' && (
              <div className="space-y-6">
                <div className="flex flex-wrap justify-between items-center bg-gray-50 border border-gray-200 p-4 rounded-xl gap-4">
                  <h3 className="text-sm font-black text-gray-900 uppercase">Consumption Statistics</h3>
                  <div className="flex gap-2">
                    <select value={userTrafficMonth} onChange={(e)=>setUserTrafficMonth(e.target.value)} className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-bold bg-white outline-none">
                      <option value="01">Jan</option><option value="02">Feb</option><option value="03">Mar</option><option value="04">Apr</option><option value="05">May</option><option value="06">Jun</option><option value="07">Jul</option><option value="08">Aug</option><option value="09">Sep</option><option value="10">Oct</option><option value="11">Nov</option><option value="12">Dec</option>
                    </select>
                    <select value={userTrafficYear} onChange={(e)=>setUserTrafficYear(e.target.value)} className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-bold bg-white outline-none">
                      <option value="2026">2026</option><option value="2025">2025</option>
                    </select>
                    <button type="button" onClick={fetchUserTraffic} className="p-2 border border-gray-300 rounded-lg bg-white text-gray-700 hover:bg-gray-100 transition"><RefreshCw size={14}/></button>
                  </div>
                </div>
                {isUserTrafficLoading ? <div className="text-center py-20 text-gray-400 font-medium italic">Generating charts...</div> : (
                  <div className="space-y-4">
                    <div className="border border-gray-200 rounded-2xl p-4 bg-white shadow-sm"><UserTrafficChart data={userTrafficData} /></div>
                    {userTrafficData && userTrafficData.length > 0 && (
                      <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                        <table className="w-full text-left text-sm text-gray-900 bg-white">
                          <thead className="bg-gray-50 text-[10px] font-black uppercase text-gray-500 border-b border-gray-200"><tr><th className="p-4">Day</th><th className="p-4">Download</th><th className="p-4">Upload</th><th className="p-4">Total</th><th className="p-4">Real Traffic</th></tr></thead>
                          <tbody className="divide-y divide-gray-100">
                            {userTrafficData.map((row: any, i: number) => (
                              <tr key={i} className="hover:bg-gray-50"><td className="p-4 text-gray-700 font-mono text-xs">{row.date}</td><td className="p-4 text-gray-700 font-mono text-xs">{formatBytes(row.download)}</td><td className="p-4 text-gray-700 font-mono text-xs">{formatBytes(row.upload)}</td><td className="p-4 text-blue-600 font-mono font-bold text-xs">{formatBytes(row.total)}</td><td className="p-4 text-orange-500 font-mono font-bold text-xs">{formatBytes(row.realTraffic)}</td></tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            {manageTab === 'history' && (
              <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-left text-sm text-gray-900 bg-white">
                  <thead className="bg-gray-50 text-[10px] font-black uppercase text-gray-500 border-b border-gray-200"><tr><th className="p-4">Package / Profile</th><th className="p-4">Old Exp</th><th className="p-4">New Exp</th><th className="p-4">Price</th><th className="p-4 text-right">Date</th></tr></thead>
                  <tbody className="divide-y divide-gray-100">
                    {Array.isArray(userHistoryData) && userHistoryData.length === 0 ? (
                      <tr><td colSpan={5} className="p-10 text-center text-gray-400 font-medium italic">No activation history found for this account.</td></tr>
                    ) : (
                      userHistoryData.map((h: any, i) => (
                        <tr key={i}><td className="p-4 font-bold text-blue-600">{h.profile}</td><td className="p-4 text-gray-400 font-mono text-xs">{h.oldExpiration}</td><td className="p-4 text-gray-700 font-mono text-xs font-bold">{h.newExpiration}</td><td className="p-4 text-green-600 font-bold">{h.price}</td><td className="p-4 text-gray-400 text-right text-xs font-medium">{new Date(h.created_at).toLocaleString()}</td></tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ======================= LIST VIEW (با تغییرات اعمال شده) =======================
  return (
    <div className="space-y-4 p-6 bg-gray-50 min-h-screen text-gray-800 font-sans">
      <div className="flex flex-wrap gap-6 bg-white p-4 border border-gray-200 rounded-xl shadow-sm text-sm font-medium">
        <div className="flex items-center gap-2"><span className="w-3 h-3 bg-blue-500 rounded-sm"></span> Online ({countStatus('Online')})</div>
        <div className="flex items-center gap-2"><span className="w-3 h-3 bg-green-500 rounded-sm"></span> Active ({countStatus('Active')})</div>
        <div className="flex items-center gap-2"><span className="w-3 h-3 bg-orange-500 rounded-sm"></span> Expired ({countStatus('Expired')})</div>
        <div className="flex items-center gap-2"><span className="w-3 h-3 bg-yellow-400 rounded-sm"></span> Depleted ({countStatus('Depleted')})</div>
        <div className="flex items-center gap-2"><span className="w-3 h-3 bg-red-500 rounded-sm"></span> Disabled ({countStatus('Disabled')})</div>
      </div>

      <div className="flex justify-between items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2 bg-white border border-gray-200 px-3 py-2 rounded-lg shadow-sm w-full max-w-md focus-within:ring-2 focus-within:ring-blue-500 transition">
          <Search size={18} className="text-gray-400" />
          <input type="text" placeholder="Search username or profile..." className="bg-transparent outline-none text-sm w-full" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        {/* دکمه Actions به همراه منوی کشویی - شامل گزینه New User */}
        <div className="relative" ref={bulkDropdownRef}>
          <button onClick={() => setBulkDropdownOpen(!bulkDropdownOpen)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-bold text-sm shadow-sm transition">
            <Users size={18} /> Actions <ChevronDown size={16} />
          </button>
          {bulkDropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg z-10 border border-gray-200">
              <div className="py-1">
                <button onClick={() => { setIsAddModalOpen(true); setBulkDropdownOpen(false); }} className="flex items-center gap-3 w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                  <UserPlus size={16} /> New User
                </button>
                <hr className="my-1" />
                <button onClick={bulkDelete} className="flex items-center gap-3 w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"><Trash2 size={16} /> Delete selected</button>
                <button onClick={() => bulkEnableDisable(true)} className="flex items-center gap-3 w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"><CheckCircle size={16} /> Enable selected</button>
                <button onClick={() => bulkEnableDisable(false)} className="flex items-center gap-3 w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"><Ban size={16} /> Disable selected</button>
                <button onClick={bulkAddTraffic} className="flex items-center gap-3 w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"><Upload size={16} /> Add traffic (MB)</button>
                <button onClick={bulkChangeProfile} className="flex items-center gap-3 w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"><Package size={16} /> Change Profile</button>
                <button onClick={bulkChargeRenew} className="flex items-center gap-3 w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"><RefreshCw size={16} /> Charge / Renew</button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-between items-center bg-slate-800 text-white p-3 rounded-t-lg shadow-sm">
        <span className="text-sm font-semibold">Users Table | Found {sortedUsers.length} record(s)</span>
        <span className="text-xs bg-slate-700 px-2 py-1 rounded-full">{selectedUsernames.size} selected</span>
      </div>

      <div className="bg-white border border-gray-200 rounded-b-lg overflow-x-auto shadow-sm">
        <table className="w-full text-left text-xs text-gray-700 divide-y divide-gray-200">
          <thead className="bg-gray-100 text-gray-600 font-bold uppercase border-b border-gray-200 text-[11px]">
            <tr>
              <th className="p-3 w-8"><input type="checkbox" className="rounded border-gray-300" checked={selectedUsernames.size === sortedUsers.length && sortedUsers.length > 0} onChange={toggleSelectAll} /></th>
              <th className="p-3">Avatar</th>
              <th className="p-3 cursor-pointer select-none" onClick={() => handleSort('status')}>STATUS {sortColumn === 'status' && (sortOrder === 'asc' ? '↑' : '↓')}</th>
              <th className="p-3 cursor-pointer select-none" onClick={() => handleSort('username')}>USERNAME {sortColumn === 'username' && (sortOrder === 'asc' ? '↑' : '↓')}</th>
              <th className="p-3">EXPIRATION</th>
              <th className="p-3">PROFILE</th>
              <th className="p-3">TRAFFIC (USED / LIMIT)</th>
              <th className="p-3">REMAINING DAYS</th>
              <th className="p-3 text-right">ACTION</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {sortedUsers.map((user, idx) => {
              const currentStatus = getUserStatus(user);
              const daysLeft = calculateDaysValue(user.expiration);
              const isSelected = selectedUsernames.has(user.username);
              const totalLimit = getTotalLimitBytes(user);
              const used = user.usedBytes || 0;
              const trafficUsedStr = used > 0 ? formatBytes(used) : '0 B';
              const totalLimitStr = totalLimit > 0 ? formatBytes(totalLimit) : 'Unlimited';
              return (
                <tr key={user.username || idx} className={`hover:bg-gray-50 transition cursor-pointer ${isSelected ? 'bg-blue-50' : ''}`} onDoubleClick={() => handleOpenManageFromList(user)}>
                  <td className="p-3" onClick={(e) => e.stopPropagation()}><input type="checkbox" className="rounded border-gray-300" checked={isSelected} onChange={() => toggleSelectOne(user.username)} /></td>
                  <td className="p-3"><img src={generateAvatarSVG(user.username)} alt="avatar" className="w-8 h-8 rounded-full object-cover shadow-sm border border-white" /></td>
                  <td className="p-3"><StatusBadge status={currentStatus} /></td>
                  <td className="p-3 font-bold text-blue-600">{user.username}</td>
                  <td className="p-3 text-gray-500 font-mono">{user.expiration || 'Permanent'}</td>
                  <td className="p-3 text-blue-600 font-semibold">{user.group || 'None'}</td>
                  <td className="p-3 font-semibold text-gray-900">{trafficUsedStr} / {totalLimitStr}</td>
                  <td className="p-3"><span className="bg-gray-100 border border-gray-300 px-2 py-0.5 rounded font-bold text-gray-800">{user.expiration ? `${daysLeft} Days` : '∞'}</span></td>
                  <td className="p-3 text-right">
                    <button onClick={(e) => { e.stopPropagation(); handleOpenManageFromList(user); }} className="text-gray-400 hover:text-blue-600 p-1"><Edit2 size={16}/></button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* مودال افزودن کاربر (بدون تغییر) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg border border-gray-200 overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-gray-50">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2"><Plus size={18} className="text-blue-600"/> Create New User</h2>
              <button type="button" onClick={() => setIsAddModalOpen(false)} className="text-gray-500 hover:text-gray-700"><X size={20}/></button>
            </div>
            <form onSubmit={handleAddUserSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">Username *</label><input type="text" required value={newUsername} onChange={(e) => setNewUsername(e.target.value)} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-gray-50/50" /></div>
                <div><label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">Password</label><input type="text" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-gray-50/50" /></div>
                <div><label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">First Name</label><input type="text" value={newFirstName} onChange={(e) => setNewFirstName(e.target.value)} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-gray-50/50" /></div>
                <div><label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">Last Name</label><input type="text" value={newLastName} onChange={(e) => setNewLastName(e.target.value)} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-gray-50/50" /></div>
                <div><label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">Email</label><input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-gray-50/50" /></div>
                <div><label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">Phone</label><input type="text" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-gray-50/50" /></div>
                <div><label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">National ID</label><input type="text" value={newNationalId} onChange={(e) => setNewNationalId(e.target.value)} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-gray-50/50" /></div>
                <div className="md:col-span-2"><label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">Address</label><input type="text" value={newAddress} onChange={(e) => setNewAddress(e.target.value)} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-gray-50/50" /></div>
                <div><label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">Profile / Package *</label><select required value={newProfile} onChange={(e) => setNewProfile(e.target.value)} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-gray-50/50"><option value="">Select Profile</option>{profiles.map((p: any) => <option key={p.id} value={p.name}>{p.name}</option>)}</select></div>
                <div><label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">Static IP Address</label><input type="text" value={newStaticIp} onChange={(e) => setNewStaticIp(e.target.value)} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-gray-50/50" placeholder="Optional (e.g. 10.0.0.5)" /></div>
              </div>
              <div className="pt-4 flex gap-3">
                <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg font-bold text-sm shadow-md transition">Create User</button>
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-6 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
