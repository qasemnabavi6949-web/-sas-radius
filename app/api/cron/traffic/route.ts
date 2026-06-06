import { NextResponse } from 'next/server';
import { query, initDb } from '@/lib/db';
import { disconnectUserFromNas } from '@/lib/radius_pod';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await initDb();
    
    // Get all users
    const users: any = await query(`
      SELECT du.username, du.dataLimitBytes, du.accountStatus,
             COALESCE((SELECT SUM(COALESCE(acctinputoctets, 0) + COALESCE(acctoutputoctets, 0)) 
                       FROM radacct WHERE username = du.username AND acctstarttime >= COALESCE(du.chargedAt, '2000-01-01 00:00:00')), 0) as totalBytesUsed
      FROM dashboard_users du
    `);

    let disconnectedCount = 0;

    for (const user of users) {
       try {
           const limit = parseInt(user.dataLimitBytes) || 0;
           const used = parseInt(user.totalBytesUsed) || 0;

           if (limit > 0 && used >= limit) {
               if (user.accountStatus !== 'Disabled') {
                   console.log(`User ${user.username} exceeded traffic limit (${used} >= ${limit}). Disconnecting & Disabling...`);
                   
                   // Mark as disabled in our dashboard
                   await query(`UPDATE dashboard_users SET accountStatus = 'Disabled' WHERE username = ?`, [user.username]);
                   
                   // Block from FreeRADIUS
                   const blockExists: any = await query(`SELECT id FROM radcheck WHERE username = ? AND attribute = 'Auth-Type' AND value = 'Reject'`, [user.username]);
                   if (!blockExists || blockExists.length === 0) {
                       await query(`INSERT INTO radcheck (username, attribute, op, value) VALUES (?, 'Auth-Type', ':=', 'Reject')`, [user.username]);
                   }

                   // Disconnect them actively
                   await disconnectUserFromNas(user.username);
                   disconnectedCount++;
               }
           } else if (limit > 0 && used < limit) {
               // Ensure they are NOT rejected (e.g., if they were recharged and got un-disabled, or we just want to fail-safe)
               if (user.accountStatus === 'Active' || user.accountStatus === 'Online') {
                   await query(`DELETE FROM radcheck WHERE username = ? AND attribute = 'Auth-Type' AND value = 'Reject'`, [user.username]);
               }
           }
       } catch (err) {
           console.error(`Error processing user ${user.username}:`, err);
       }
    }

    return NextResponse.json({ success: true, disconnectedCount });
  } catch (error: any) {
    if (error.code === 'ETIMEDOUT' || error.code === 'ECONNREFUSED' || error.message.includes('ETIMEDOUT') || error.message.includes('ECONNREFUSED')) {
       console.log('Cron skipped: Database unreachable. Typical if running Next.js without MySQL DB.');
       return NextResponse.json({ success: false, reason: "Database unreachable or not configured" }, { status: 200 }); // Return 200 to not spam logs
    }
    console.error('Cron Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
