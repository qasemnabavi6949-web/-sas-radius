import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const policies = await query(
      `SELECT * FROM profile_policies WHERE profile_id = ? ORDER BY id`,
      [id]
    );
    // اطمینان از خروجی آرایه
    return NextResponse.json(policies || []);
  } catch (error: any) {
    console.error('Error fetching policies:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const {
      type, start_time, end_time, days_of_week, target,
      download_rate, upload_rate, download_ratio, upload_ratio,
      enable_burst, traffic_threshold_mb
    } = body;

    const daysJson = JSON.stringify(days_of_week || []);

    if (type === 'time') {
      await query(
        `INSERT INTO profile_policies (
          profile_id, type, start_time, end_time, days_of_week,
          target, download_rate, upload_rate, download_ratio, upload_ratio, enable_burst
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, type, start_time || null, end_time || null, daysJson,
         target || 'bandwidth', download_rate || 0, upload_rate || 0,
         download_ratio || 100, upload_ratio || 100, enable_burst ? 1 : 0]
      );
    } else {
      await query(
        `INSERT INTO profile_policies (
          profile_id, type, traffic_threshold_mb, days_of_week,
          target, download_rate, upload_rate, download_ratio, upload_ratio, enable_burst
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, type, traffic_threshold_mb || 0, daysJson,
         target || 'bandwidth', download_rate || 0, upload_rate || 0,
         download_ratio || 100, upload_ratio || 100, enable_burst ? 1 : 0]
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error creating policy:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
