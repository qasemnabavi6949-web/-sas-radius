import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string; policyId: string }> }
) {
  try {
    const { id, policyId } = await params;
    const body = await req.json();
    const {
      type, start_time, end_time, days_of_week, target,
      download_rate, upload_rate, download_ratio, upload_ratio,
      enable_burst, traffic_threshold_mb
    } = body;

    const daysJson = JSON.stringify(days_of_week || []);

    if (type === 'time') {
      await query(
        `UPDATE profile_policies SET
          start_time = ?, end_time = ?, days_of_week = ?,
          target = ?, download_rate = ?, upload_rate = ?,
          download_ratio = ?, upload_ratio = ?, enable_burst = ?
        WHERE id = ? AND profile_id = ?`,
        [start_time || null, end_time || null, daysJson,
         target || 'bandwidth', download_rate || 0, upload_rate || 0,
         download_ratio || 100, upload_ratio || 100, enable_burst ? 1 : 0,
         policyId, id]
      );
    } else {
      await query(
        `UPDATE profile_policies SET
          traffic_threshold_mb = ?, days_of_week = ?,
          target = ?, download_rate = ?, upload_rate = ?,
          download_ratio = ?, upload_ratio = ?, enable_burst = ?
        WHERE id = ? AND profile_id = ?`,
        [traffic_threshold_mb || 0, daysJson,
         target || 'bandwidth', download_rate || 0, upload_rate || 0,
         download_ratio || 100, upload_ratio || 100, enable_burst ? 1 : 0,
         policyId, id]
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating policy:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; policyId: string }> }
) {
  try {
    const { id, policyId } = await params;
    await query(`DELETE FROM profile_policies WHERE id = ? AND profile_id = ?`, [policyId, id]);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
