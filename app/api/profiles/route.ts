import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const profiles = await query(`SELECT * FROM dashboard_profiles ORDER BY id`);
    return NextResponse.json(profiles);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      name, price, downloadSpeed, uploadSpeed, totalTraffic, validityDays,
      enabled, vat, short_description, profile_type,
      limit_expiration_value, limit_expiration_unit, limit_uptime_value,
      limit_download_mb, limit_upload_mb, limit_traffic_mb,
      daily_download_limit_mb, daily_traffic_limit_mb, daily_uptime_minutes,
      fup_daily_quota_mb, fup_speed_after_quota_kbps, fup_free_start, fup_free_end, fup_reset_time,
      expired_next_profile, daily_limit_next_profile
    } = body;

    const result = await query(
      `INSERT INTO dashboard_profiles (
        name, price, downloadSpeed, uploadSpeed, totalTraffic, validityDays,
        enabled, vat, short_description, profile_type,
        limit_expiration_value, limit_expiration_unit, limit_uptime_value,
        limit_download_mb, limit_upload_mb, limit_traffic_mb,
        daily_download_limit_mb, daily_traffic_limit_mb, daily_uptime_minutes,
        fup_daily_quota_mb, fup_speed_after_quota_kbps, fup_free_start, fup_free_end, fup_reset_time,
        expired_next_profile, daily_limit_next_profile
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name, price, downloadSpeed, uploadSpeed, totalTraffic, validityDays,
        enabled ?? 1, vat ?? 0, short_description || null, profile_type || 'prepaid',
        limit_expiration_value || null, limit_expiration_unit || null, limit_uptime_value || null,
        limit_download_mb || null, limit_upload_mb || null, limit_traffic_mb || null,
        daily_download_limit_mb || null, daily_traffic_limit_mb || null, daily_uptime_minutes || null,
        fup_daily_quota_mb ?? 2560, fup_speed_after_quota_kbps ?? 300, fup_free_start || '00:00:00', fup_free_end || '08:00:00', fup_reset_time || '00:00:00',
        expired_next_profile || null, daily_limit_next_profile || null
      ]
    );
    return NextResponse.json({ id: result.insertId, ...body });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
