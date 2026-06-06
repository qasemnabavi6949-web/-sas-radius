import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function PUT(req: Request, { params }: { params: Promise<{ username: string }> }) {
  try {
    const { username } = await params;
    const data = await req.json();
    const { currentPassword, newPassword } = data;

    // Check current password
    const users: any = await query('SELECT password FROM dashboard_users WHERE username = ?', [username]);
    if (!users || users.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (users[0].password !== currentPassword) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
    }

    // Update password in dashboard_users
    await query('UPDATE dashboard_users SET password = ? WHERE username = ?', [newPassword, username]);

    // Update password in radcheck
    await query('UPDATE radcheck SET value = ? WHERE username = ? AND attribute = "Cleartext-Password"', [newPassword, username]);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('DB Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
