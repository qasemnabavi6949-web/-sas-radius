'use client';

import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function TrafficReportChart({ data }: { data: any[] }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex h-72 items-center justify-center rounded-lg border border-dashed border-slate-700 bg-slate-800/40 p-6 text-slate-400 text-sm">
        در حال بارگذاری نمودار ترافیک...
      </div>
    );
  }

  // Calculate max MB to format YAxis
  const maxBytes = Math.max(...(data || []).map(d => d.total || 0), 1);
  const isBytes = maxBytes < 1024;
  const isKB = maxBytes >= 1024 && maxBytes < 1024 * 1024;
  const divisor = isBytes ? 1 : isKB ? 1024 : 1024 * 1024;
  const suffix = isBytes ? 'B' : isKB ? 'KB' : 'MB';

  const chartData = (data || []).map(d => ({
    ...d,
    download: parseFloat(((d.download || 0) / divisor).toFixed(2)),
    upload: parseFloat(((d.upload || 0) / divisor).toFixed(2)),
    total: parseFloat(((d.total || 0) / divisor).toFixed(2)),
    realTraffic: parseFloat(((d.realTraffic || 0) / divisor).toFixed(2))
  }));

  const formatYAxis = (tickItem: any) => {
    return `${tickItem} ${suffix}`;
  };

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={true} stroke="#334155" />
          <XAxis 
            dataKey="day" 
            axisLine={true} 
            tickLine={false} 
            tick={{ fontSize: 11, fill: '#94a3b8' }} 
            dy={10} 
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 11, fill: '#94a3b8' }} 
            tickFormatter={formatYAxis}
          />
          <Tooltip 
            contentStyle={{ borderRadius: '6px', border: '1px solid #475569', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: '#1e293b', color: '#f8fafc', fontSize: '12px' }}
            itemStyle={{ color: '#f8fafc' }}
          />
          <Legend iconType="square" wrapperStyle={{ paddingTop: '15px', fontSize: '11px', color: '#94a3b8' }} />
          <Line type="monotone" dataKey="download" name="Download" stroke="#94a3b8" strokeWidth={2} dot={{ r: 2, fill: '#94a3b8' }} />
          <Line type="monotone" dataKey="upload" name="Upload" stroke="#64748b" strokeWidth={2} dot={{ r: 2, fill: '#64748b' }} />
          <Line type="monotone" dataKey="total" name="Total" stroke="#22c55e" strokeWidth={2} dot={{ r: 3, fill: '#22c55e', strokeWidth: 0 }} />
          <Line type="monotone" dataKey="realTraffic" name="Real Traffic" stroke="#f97316" strokeWidth={2} dot={{ r: 3, fill: '#f97316', strokeWidth: 0 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
