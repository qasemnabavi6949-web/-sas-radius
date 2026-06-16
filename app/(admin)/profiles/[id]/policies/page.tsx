'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Plus, Edit2, Trash2, ArrowLeft, ArrowRight, Clock } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

interface Policy {
  id: number;
  type: 'time' | 'traffic';
  start_time?: string;
  end_time?: string;
  days_of_week?: string[];
  target?: 'bandwidth' | 'accounting';
  download_rate?: number;
  upload_rate?: number;
  download_ratio?: number;
  upload_ratio?: number;
  enable_burst?: boolean;
  traffic_threshold_mb?: number;
}

export default function PoliciesPage() {
  const router = useRouter();
  const params = useParams();
  const profileId = params.id as string;
  const [viewMode, setViewMode] = useState<'list' | 'form'>('list');
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPolicy, setEditingPolicy] = useState<Policy | null>(null);

  const fetchPolicies = async () => {
    if (!profileId) return;
    try {
      const res = await fetch(`/api/profiles/${profileId}/policies`);
      const data = await res.json();
      if (Array.isArray(data)) {
        const converted = data.map((item: any) => ({
          ...item,
          days_of_week: (() => {
            if (!item.days_of_week) return [];
            try {
              let parsed = JSON.parse(item.days_of_week);
              if (typeof parsed === 'string') parsed = JSON.parse(parsed);
              return Array.isArray(parsed) ? parsed : [];
            } catch { return []; }
          })(),
          enable_burst: item.enable_burst === 1,
          download_rate: Number(item.download_rate),
          upload_rate: Number(item.upload_rate),
          download_ratio: Number(item.download_ratio),
          upload_ratio: Number(item.upload_ratio),
          traffic_threshold_mb: item.traffic_threshold_mb ? Number(item.traffic_threshold_mb) : undefined,
        }));
        setPolicies(converted);
      } else setPolicies([]);
    } catch (err) { console.error(err); setPolicies([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchPolicies(); }, [profileId]);

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this policy?')) return;
    await fetch(`/api/profiles/${profileId}/policies/${id}`, { method: 'DELETE' });
    fetchPolicies();
  };

  const handleSave = async (body: any) => {
    const url = editingPolicy ? `/api/profiles/${profileId}/policies/${editingPolicy.id}` : `/api/profiles/${profileId}/policies`;
    const method = editingPolicy ? 'PUT' : 'POST';
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (res.ok) { setViewMode('list'); fetchPolicies(); }
    else alert('Error saving policy');
  };

  const getRow = (p: Policy) => {
    const daysStr = p.days_of_week?.map(d => d.slice(0, 3)).join(', ') || 'Everyday';
    if (p.type === 'time') {
      return {
        from: p.start_time || '',
        to: p.end_time || '',
        threshold: '-',
        days: daysStr,
        target: p.target === 'bandwidth' ? 'Bandwidth' : 'Accounting',
        details: p.target === 'bandwidth'
          ? `${p.download_rate}/${p.upload_rate} kbps${p.enable_burst ? ' + Burst' : ''}`
          : `${p.download_ratio}% / ${p.upload_ratio}%`
      };
    }
    return {
      from: `${p.traffic_threshold_mb} MB`,
      to: '-',
      threshold: p.traffic_threshold_mb || 0,
      days: daysStr,
      target: p.target === 'bandwidth' ? 'Bandwidth' : 'Accounting',
      details: p.target === 'bandwidth'
        ? `${p.download_rate}/${p.upload_rate} kbps${p.enable_burst ? ' + Burst' : ''}`
        : `${p.download_ratio}% / ${p.upload_ratio}%`
    };
  };

  const handleEditClick = (policy: Policy) => {
    setEditingPolicy(policy);
    setViewMode('form');
  };

  const handleNewClick = () => {
    setEditingPolicy(null);
    setViewMode('form');
  };

  const handleCancelForm = () => {
    setViewMode('list');
    setEditingPolicy(null);
  };

  if (!profileId) return <div className="p-6 text-red-400">Invalid profile ID.</div>;

  if (viewMode === 'form') {
    return (
      <PolicyForm
        profileId={profileId}
        policy={editingPolicy}
        onCancel={handleCancelForm}
        onSave={handleSave}
      />
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <h1 className="text-2xl font-bold text-gray-800">Profile Policies</h1>
        </div>
        <Button onClick={handleNewClick}>
          <Plus className="mr-2 h-4 w-4" /> Add Policy
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-10">Loading...</div>
      ) : policies.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-gray-500">
            No policies defined for this profile.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Policies List</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>From / Threshold</TableHead>
                  <TableHead>To</TableHead>
                  <TableHead>Threshold (MB)</TableHead>
                  <TableHead>Days</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {policies.map(p => {
                  const row = getRow(p);
                  return (
                    <TableRow key={p.id}>
                      <TableCell>{row.from}</TableCell>
                      <TableCell>{row.to}</TableCell>
                      <TableCell>{row.threshold}</TableCell>
                      <TableCell>{row.days}</TableCell>
                      <TableCell>{row.target}</TableCell>
                      <TableCell className="text-gray-600">{row.details}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEditClick(p)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(p.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ---------- Policy Form Component (Full Page) ----------
function PolicyForm({ profileId, policy, onCancel, onSave }: any) {
  const [type, setType] = useState<'time' | 'traffic'>(policy?.type || 'time');
  const [startTime, setStartTime] = useState(policy?.start_time || '00:00');
  const [endTime, setEndTime] = useState(policy?.end_time || '23:59');
  const [daysOfWeek, setDaysOfWeek] = useState<string[]>(policy?.days_of_week || []);
  const [target, setTarget] = useState<'bandwidth' | 'accounting'>(policy?.target || 'bandwidth');
  const [downloadRate, setDownloadRate] = useState(policy?.download_rate || 0);
  const [uploadRate, setUploadRate] = useState(policy?.upload_rate || 0);
  const [downloadRatio, setDownloadRatio] = useState(policy?.download_ratio || 100);
  const [uploadRatio, setUploadRatio] = useState(policy?.upload_ratio || 100);
  const [enableBurst, setEnableBurst] = useState(policy?.enable_burst || false);
  const [trafficThreshold, setTrafficThreshold] = useState(policy?.traffic_threshold_mb || 1000);
  const weekDays = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const body: any = { type, target, days_of_week: JSON.stringify(daysOfWeek) };
    if (type === 'time') { body.start_time = startTime; body.end_time = endTime; }
    else { body.traffic_threshold_mb = trafficThreshold; }
    if (target === 'bandwidth') { body.download_rate = downloadRate; body.upload_rate = uploadRate; body.enable_burst = enableBurst ? 1 : 0; }
    else { body.download_ratio = downloadRatio; body.upload_ratio = uploadRatio; body.enable_burst = 0; }
    await onSave(body);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="outline" onClick={onCancel}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Policies
          </Button>
          <h1 className="text-2xl font-bold text-gray-800">
            {policy ? 'Edit Policy' : 'Add Policy'}
          </h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Policy Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Policy Type</Label>
                  <Select value={type} onValueChange={(v) => setType(v as any)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="time">Time Based</SelectItem>
                      <SelectItem value="traffic">Traffic Based</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Target</Label>
                  <Select value={target} onValueChange={(v) => setTarget(v as any)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select target" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bandwidth">Bandwidth</SelectItem>
                      <SelectItem value="accounting">Accounting</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Days of Week</Label>
                <div className="flex flex-wrap gap-4">
                  {weekDays.map((day) => (
                    <div key={day} className="flex items-center space-x-2">
                      <Checkbox
                        id={day}
                        checked={daysOfWeek.includes(day)}
                        onCheckedChange={(checked) => {
                          if (checked) setDaysOfWeek([...daysOfWeek, day]);
                          else setDaysOfWeek(daysOfWeek.filter(d => d !== day));
                        }}
                      />
                      <Label htmlFor={day} className="text-sm capitalize">{day.slice(0, 3)}</Label>
                    </div>
                  ))}
                </div>
              </div>

              {type === 'time' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Start Time</Label>
                    <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>End Time</Label>
                    <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
                  </div>
                </div>
              )}

              {type === 'traffic' && (
                <div className="space-y-2">
                  <Label>Traffic Threshold (MB)</Label>
                  <Input type="number" value={trafficThreshold} onChange={(e) => setTrafficThreshold(Number(e.target.value))} />
                </div>
              )}

              {target === 'bandwidth' && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Download Rate (kbps)</Label>
                      <Input type="number" value={downloadRate} onChange={(e) => setDownloadRate(Number(e.target.value))} />
                    </div>
                    <div className="space-y-2">
                      <Label>Upload Rate (kbps)</Label>
                      <Input type="number" value={uploadRate} onChange={(e) => setUploadRate(Number(e.target.value))} />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="burst" checked={enableBurst} onCheckedChange={(checked) => setEnableBurst(!!checked)} />
                    <Label htmlFor="burst">Enable Burst</Label>
                  </div>
                </>
              )}

              {target === 'accounting' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Download Ratio (%)</Label>
                    <Input type="number" value={downloadRatio} onChange={(e) => setDownloadRatio(Number(e.target.value))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Upload Ratio (%)</Label>
                    <Input type="number" value={uploadRatio} onChange={(e) => setUploadRatio(Number(e.target.value))} />
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
                <Button type="submit">
                  Save Policy
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
