import { NextResponse } from 'next/server';
import { query, initDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await initDb();
    
    // First, clear radcheck and radusergroup to avoid duplicates
    await query('DELETE FROM radcheck');
    await query('DELETE FROM radusergroup');
    await query('DELETE FROM radreply WHERE attribute = "Framed-IP-Address"');

    // Get all users from dashboard
    const users: any = await query('SELECT * FROM dashboard_users');

    let count = 0;
    for (const user of users) {
      // Re-insert into radcheck
      await query(`
        INSERT INTO radcheck (username, attribute, op, value)
        VALUES (?, 'Cleartext-Password', ':=', ?)
      `, [user.username, user.password]);

      // Re-insert into radusergroup
      if (user.group) {
        await query(`
          INSERT INTO radusergroup (username, groupname, priority)
          VALUES (?, ?, 1)
        `, [user.username, user.group]);
      }

      // Re-insert Static IP if present
      if (user.staticIp) {
        await query(`
          INSERT INTO radreply (username, attribute, op, value)
          VALUES (?, 'Framed-IP-Address', '=', ?)
        `, [user.username, user.staticIp]);
      }
      count++;
    }

    return NextResponse.json({ success: true, message: `Synced ${count} users to RADIUS.` });
  } catch (error: any) {
    console.error('Sync Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
