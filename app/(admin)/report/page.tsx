'use client';

import { useState, useEffect } from 'react';
import { FileText, Download, RefreshCw } from 'lucide-react';
import dynamic from 'next/dynamic';

const PackageActivationChart = dynamic(() => import('./PackageActivationChart'), { ssr: false });

export default function ReportPage() {
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [month, setMonth] = useState((new Date().getMonth() + 1).toString());
  const [reportType, setReportType] = useState('Daily');
  const [activationData, setActivationData] = useState<any[]>([]);
  const [detailedActivations, setDetailedActivations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const years = Array.from({ length: 5 }, (_, i) => (new Date().getFullYear() - 2 + i).toString());

  const [totalRevenue, setTotalRevenue] = useState(0);

  const fetchActivationData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/report/activations?year=${year}&month=${month}`);
      const data = await res.json();
      if (data.dailyData) {
        setActivationData(data.dailyData);
        setDetailedActivations(data.detailed);
        setTotalRevenue(data.totalRevenue || 0);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivationData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, month]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">Package Reports</h1>
          <p className="text-sm text-slate-400">View and export reports of package activations by customers.</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors">
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-700 bg-slate-800 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-slate-400">Total Revenue</h3>
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <FileText className="h-4 w-4 text-emerald-500" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-100">{totalRevenue.toLocaleString()} ؋</div>
          <p className="text-xs text-emerald-500 mt-2">+14% from last month</p>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-800 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-slate-400">Total Activations</h3>
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <FileText className="h-4 w-4 text-blue-500" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-100">
            {activationData.reduce((acc, curr) => acc + curr.activations, 0)}
          </div>
          <p className="text-xs text-blue-500 mt-2">In the selected period</p>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-800 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-slate-400">Avg Activations/Day</h3>
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <FileText className="h-4 w-4 text-purple-500" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-100">
            {activationData.length > 0 ? Math.round(activationData.reduce((acc, curr) => acc + curr.activations, 0) / activationData.length) : 0}
          </div>
          <p className="text-xs text-slate-400 mt-2">Historical average</p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-700 bg-slate-800 shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-medium text-slate-100">Daily Package Activations</h2>
          <div className="flex gap-2 items-center">
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="rounded-md border border-slate-600 bg-slate-700 px-3 py-1.5 text-sm text-slate-200 focus:border-blue-500 focus:outline-none"
            >
              <option value="Daily">Daily</option>
              <option value="Monthly">Monthly</option>
            </select>
            <select
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="rounded-md border border-slate-600 bg-slate-700 px-3 py-1.5 text-sm text-slate-200 focus:border-blue-500 focus:outline-none"
            >
              {months.map((m, i) => (
                <option key={m} value={(i + 1).toString()}>{m}</option>
              ))}
            </select>
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="rounded-md border border-slate-600 bg-slate-700 px-3 py-1.5 text-sm text-slate-200 focus:border-blue-500 focus:outline-none"
            >
              {years.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <button onClick={fetchActivationData} className="p-1.5 rounded-md hover:bg-slate-700 text-slate-400">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        <div className="min-h-[300px] mb-8 bg-slate-50 text-slate-900 rounded-lg p-4">
          {activationData.length > 0 ? (
            <PackageActivationChart data={activationData} />
          ) : (
            <div className="flex items-center justify-center h-full text-slate-500">
              {loading ? 'Loading chart...' : 'No data available'}
            </div>
          )}
        </div>

        <div className="flex justify-between items-center mb-4 mt-8">
          <h2 className="text-lg font-medium text-slate-100">Activations Report <span className="text-sm font-normal text-slate-400">| Found {detailedActivations.length} record(s)</span></h2>
        </div>
        <div className="overflow-x-auto bg-slate-50 rounded-lg">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-100 text-slate-900 border-b border-slate-300">
              <tr>
                <th className="px-4 py-3 font-semibold uppercase text-xs">Date</th>
                <th className="px-4 py-3 font-semibold uppercase text-xs">Username</th>
                <th className="px-4 py-3 font-semibold uppercase text-xs">First Name</th>
                <th className="px-4 py-3 font-semibold uppercase text-xs">Last Name</th>
                <th className="px-4 py-3 font-semibold uppercase text-xs">Manager</th>
                <th className="px-4 py-3 font-semibold uppercase text-xs">Profile</th>
                <th className="px-4 py-3 font-semibold uppercase text-xs">Price</th>
                <th className="px-4 py-3 font-semibold uppercase text-xs">Total Price</th>
                <th className="px-4 py-3 font-semibold uppercase text-xs whitespace-nowrap">User Price</th>
                <th className="px-4 py-3 font-semibold uppercase text-xs whitespace-nowrap">Old Expiration</th>
                <th className="px-4 py-3 font-semibold uppercase text-xs whitespace-nowrap">New Expiration</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {detailedActivations.map((row, i) => (
                <tr key={i} className="hover:bg-slate-50">
                  <td className="px-4 py-4 whitespace-nowrap text-xs">{row.date}</td>
                  <td className="px-4 py-4 font-medium">{row.username}</td>
                  <td className="px-4 py-4">{row.firstName}</td>
                  <td className="px-4 py-4">{row.lastName}</td>
                  <td className="px-4 py-4">{row.manager}</td>
                  <td className="px-4 py-4 whitespace-nowrap">{row.profile}</td>
                  <td className="px-4 py-4 whitespace-nowrap">$ {row.price.toFixed(2)}</td>
                  <td className="px-4 py-4 whitespace-nowrap">$ {row.totalPrice.toFixed(2)}</td>
                  <td className="px-4 py-4 whitespace-nowrap">$ {row.userPrice.toFixed(2)}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-xs">{row.oldExpiration}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-xs">{row.newExpiration}</td>
                </tr>
              ))}
              {detailedActivations.length === 0 && !loading && (
                <tr>
                  <td colSpan={11} className="px-6 py-8 text-center text-slate-500">No activation data found for this period</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
