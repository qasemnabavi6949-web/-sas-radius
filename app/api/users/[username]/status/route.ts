import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { disconnectUserFromNas } from '@/lib/radius_pod';

export async function POST(req: Request, { params }: { params: Promise<{ username: string }> }) {
  try {
    const { username } = await params;
    const { status } = await req.json(); // 'Active' or 'Disabled'

    if (status !== 'Active' && status !== 'Disabled') {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // Update in dashboard_users
    await query(`
      UPDATE dashboard_users 
      SET accountStatus = ?
      WHERE username = ?
    `, [status, username]);

    // Handle Radius Auth-Type Reject
    if (status === 'Disabled') {
      await disconnectUserFromNas(username);

      // Disconnect ghost sessions in DB
      await query(`
        UPDATE radacct 
        SET acctstoptime = NOW(), acctterminatecause = 'Admin-Reset' 
        WHERE username = ? AND (acctstoptime IS NULL OR acctstoptime = '0000-00-00 00:00:00' OR acctterminatecause = '')
      `, [username]);

      // Block authentication
      await query(`DELETE FROM radcheck WHERE username = ? AND attribute = 'Auth-Type'`, [username]);
      await query(`INSERT INTO radcheck (username, attribute, op, value) VALUES (?, 'Auth-Type', ':=', 'Reject')`, [username]);
    } else {
      // Allow authentication
      await query(`DELETE FROM radcheck WHERE username = ? AND attribute = 'Auth-Type' AND value = 'Reject'`, [username]);
    }

    return NextResponse.json({ success: true, status });
  } catch (error: any) {
    console.error('Status Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
