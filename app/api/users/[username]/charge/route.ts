import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(req: Request, { params }: { params: Promise<{ username: string }> }) {
  try {
    const { username } = await params;
    
    let body: any = {};
    try { body = await req.json(); } catch { /* ignore */ }
    
    const action = body.action || 'charge';

    if (action === 'add_traffic') {
       if (!body.bytes) return NextResponse.json({ error: 'Missing bytes' }, { status: 400 });
       await query(`
         UPDATE dashboard_users 
         SET dataLimitBytes = COALESCE(dataLimitBytes, 0) + ?,
             dataLimitString = CONCAT(CAST((COALESCE(dataLimitBytes, 0) + ?) / (1024*1024) AS UNSIGNED), ' MB')
         WHERE username = ?
       `, [body.bytes, body.bytes, username]);
       
       await query(`UPDATE dashboard_users SET accountStatus = 'Active' WHERE username = ?`, [username]);
       await query(`DELETE FROM radcheck WHERE username = ? AND attribute = 'Auth-Type'`, [username]);
       
       return NextResponse.json({ success: true, message: 'Traffic added' });
    }

    if (action === 'reset_stats') {
       await query(`
         UPDATE dashboard_users 
         SET chargedAt = CURRENT_TIMESTAMP, accountStatus = 'Active'
         WHERE username = ?
       `, [username]);
       await query(`DELETE FROM radcheck WHERE username = ? AND attribute = 'Auth-Type'`, [username]);
       return NextResponse.json({ success: true, message: 'Stats reset' });
    }

    // Action === 'charge'
    await query(`
      CREATE TABLE IF NOT EXISTS dashboard_activations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(64) NOT NULL,
        firstName VARCHAR(64),
        lastName VARCHAR(64),
        manager VARCHAR(64) DEFAULT 'admin',
        profile VARCHAR(64),
        price DECIMAL(10,2),
        totalPrice DECIMAL(10,2),
        userPrice DECIMAL(10,2),
        oldExpiration VARCHAR(64),
        newExpiration VARCHAR(64),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Reset traffic usage counting to from now
    await query(`
      UPDATE dashboard_users 
      SET chargedAt = CURRENT_TIMESTAMP, accountStatus = 'Active'
      WHERE username = ?
    `, [username]);
    
    await query(`DELETE FROM radcheck WHERE username = ? AND attribute = 'Auth-Type'`, [username]);

    const userResult: any = await query(`SELECT firstName, lastName, \`group\`, expiration FROM dashboard_users WHERE username = ? LIMIT 1`, [username]);
    if (userResult && userResult.length > 0) {
       const u = userResult[0];
       let price = 0;
       let validityDays = 30;
       
       let dataLimitBytes = 0;
       let dataLimitString = 'Unlimited';
       
       if (u.group) {
          const profileResult: any = await query(`SELECT price, validityDays, totalTraffic FROM dashboard_profiles WHERE name = ? LIMIT 1`, [u.group]);
          if (profileResult && profileResult.length > 0) {
             const p = profileResult[0];
             price = parseFloat(p.price) || 0;
             if (p.validityDays !== null && p.validityDays !== undefined && p.validityDays !== '') {
               const parsedDays = parseInt(p.validityDays);
               validityDays = isNaN(parsedDays) ? 30 : parsedDays;
             }
             if (p.totalTraffic && !isNaN(parseFloat(p.totalTraffic))) {
               dataLimitBytes = parseFloat(p.totalTraffic) * 1024 * 1024;
               dataLimitString = `${p.totalTraffic} MB`;
             }
          }
       }
       
       let newExp = new Date();
       if (u.expiration) {
         const currentExp = new Date(u.expiration);
         if (!isNaN(currentExp.getTime()) && currentExp > new Date()) {
            newExp = currentExp;
         }
       }
       newExp.setDate(newExp.getDate() + validityDays);
       const newExpStr = newExp.toISOString().slice(0, 10); 

       await query(`
         UPDATE dashboard_users 
         SET expiration = ?, dataLimitBytes = ?, dataLimitString = ?
         WHERE username = ?
       `, [newExpStr, dataLimitBytes, dataLimitString, username]);

       const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
       const radExpStr = `${newExp.getDate().toString().padStart(2, '0')} ${months[newExp.getMonth()]} ${newExp.getFullYear()} 23:59:00`;
       await query(`DELETE FROM radcheck WHERE username = ? AND attribute = 'Expiration'`, [username]);
       await query(`INSERT INTO radcheck (username, attribute, op, value) VALUES (?, 'Expiration', ':=', ?)`, [username, radExpStr]);

       await query(`
         INSERT INTO dashboard_activations (username, firstName, lastName, profile, price, totalPrice, userPrice, oldExpiration, newExpiration)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       `, [username, u.firstName || '', u.lastName || '', u.group || '', price, price, price, u.expiration || 'N/A', newExpStr]);
    }

    return NextResponse.json({ success: true, message: 'User charged successfully' });
  } catch (error: any) {
    console.error('Charge Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
