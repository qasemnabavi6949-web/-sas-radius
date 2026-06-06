import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { disconnectUserFromNas } from '@/lib/radius_pod';


export const dynamic = 'force-dynamic';

export async function GET(req: Request, { params }: { params: Promise<{ username: string }> }) {
  try {
    const { username } = await params;
    const users: any = await query(`
      SELECT du.*, 
             COALESCE((SELECT SUM(COALESCE(acctinputoctets, 0)) FROM radacct WHERE username = du.username AND acctstarttime >= COALESCE(du.chargedAt, '2000-01-01 00:00:00')), 0) as totalInputBytes,
             COALESCE((SELECT SUM(COALESCE(acctoutputoctets, 0)) FROM radacct WHERE username = du.username AND acctstarttime >= COALESCE(du.chargedAt, '2000-01-01 00:00:00')), 0) as totalOutputBytes,
             COALESCE((SELECT SUM(COALESCE(acctinputoctets, 0) + COALESCE(acctoutputoctets, 0)) FROM radacct WHERE username = du.username AND acctstarttime >= COALESCE(du.chargedAt, '2000-01-01 00:00:00')), 0) as totalBytesUsed,
             COALESCE((SELECT SUM(COALESCE(acctsessiontime, 0)) FROM radacct WHERE username = du.username AND acctstarttime >= COALESCE(du.chargedAt, '2000-01-01 00:00:00')), 0) as totalUptime,
             (SELECT acctstoptime FROM radacct WHERE username = du.username ORDER BY radacctid DESC LIMIT 1) as lastSeenOnline,
             CASE WHEN EXISTS (SELECT 1 FROM radacct WHERE username = du.username AND (acctstoptime IS NULL OR acctstoptime = '0000-00-00 00:00:00' OR acctterminatecause = '')) THEN 1 ELSE 0 END as isOnline
      FROM dashboard_users du
      WHERE du.username = ?
    `, [username]);
    
    if (!users || users.length === 0) {
       return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    const u = users[0];
    const bytes = parseInt(u.totalBytesUsed) || 0;
    const inputBytes = parseInt(u.totalInputBytes) || 0;
    const outputBytes = parseInt(u.totalOutputBytes) || 0;
    
    // We send back numeric limits and raw bytes to let UI handle "Remaining" math nicely,
    // though we can also pre-format.
    const limitBytes = parseInt(u.dataLimitBytes) || 0;
    const limitStr = u.dataLimitString || 'Unlimited';

    const formatBytes = (b: number) => {
      if (b > 1024 * 1024 * 1024) return (b / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
      return (b / (1024 * 1024)).toFixed(2) + ' MB';
    };

    u.trafficUsage = `${formatBytes(bytes)} / ${limitStr}`;
    u.bytes = bytes;
    u.inputBytes = inputBytes;
    u.outputBytes = outputBytes;
    u.limitBytes = limitBytes;
    u.formattedInput = formatBytes(inputBytes);
    u.formattedOutput = formatBytes(outputBytes);
    
    // Calculate remaining
    if (limitBytes > 0) {
       u.remainingBytes = Math.max(0, limitBytes - bytes);
       u.remainingStr = formatBytes(u.remainingBytes);
    } else {
       u.remainingBytes = -1; // Unlimited
       u.remainingStr = 'Unlimited';
    }

    // Uptime is in seconds
    u.totalUptimeSec = parseInt(u.totalUptime) || 0;

    
    // Also fetch recent sessions
    const sessions = await query(`
      SELECT acctstarttime, acctsessiontime, framedipaddress, acctinputoctets, acctoutputoctets 
      FROM radacct 
      WHERE username = ? 
      ORDER BY radacctid DESC 
      LIMIT 10
    `, [username]);
    
    return NextResponse.json({ user: u, sessions });
  } catch (error: any) {
    console.error('DB Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ username: string }> }) {
  try {
    const { username } = await params;
    
    // Disconnect user before deleting
    await disconnectUserFromNas(username);
    
    // Delete from all tables
    await query('DELETE FROM dashboard_users WHERE username = ?', [username]);
    await query('DELETE FROM radcheck WHERE username = ?', [username]);
    await query('DELETE FROM radreply WHERE username = ?', [username]);
    await query('DELETE FROM radusergroup WHERE username = ?', [username]);
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('DB Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ username: string }> }) {
  try {
    const { username } = await params;
    const data = await req.json();

    // Re-calculate group limits if group changed
    let profileUpdates = '';
    const updateParams: any[] = [];
    
    if (data.group) {
        const groups: any = await query(`SELECT totalTraffic, downloadSpeed, uploadSpeed FROM dashboard_profiles WHERE name = ? LIMIT 1`, [data.group]);
        if (groups && groups.length > 0) {
           const g = groups[0];
           let dataLimitBytes = 0;
           let dataLimitString = 'Unlimited';
           let speedLimit = '';

           if (g.totalTraffic && !isNaN(parseFloat(g.totalTraffic))) {
              dataLimitBytes = parseFloat(g.totalTraffic) * 1024 * 1024;
              dataLimitString = `${g.totalTraffic} MB`;
           }
           if (g.downloadSpeed || g.uploadSpeed) {
              speedLimit = `${g.downloadSpeed || 0} / ${g.uploadSpeed || 0} Kbps`;
           }
           profileUpdates = `, dataLimitBytes=?, dataLimitString=?, speedLimit=?`;
           updateParams.push(dataLimitBytes, dataLimitString, speedLimit);
        }
    }
    
    // Gifting traffic?
    if (data.traffic && data.traffic.includes('(Gifted)')) {
        // e.g., "1.23 MB / 55 MB (Gifted)"
        try {
           const parts = data.traffic.split(' / ');
           if (parts.length > 1) {
              const rightPart = parts[1]; // "55 MB (Gifted)"
              const limitStr = rightPart.split(' ')[0]; // "55"
              const newLimitMB = parseInt(limitStr);
              if (!isNaN(newLimitMB)) {
                 profileUpdates += `, dataLimitBytes=?, dataLimitString=?`;
                 updateParams.push(newLimitMB * 1024 * 1024, `${newLimitMB} MB`);
              }
           }
        } catch {}
    }

    const existingUsers: any = await query(`SELECT * FROM dashboard_users WHERE username = ?`, [username]);
    if (!existingUsers || existingUsers.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    const eu = existingUsers[0];

    const updatedUser = {
      firstName: data.firstName !== undefined ? data.firstName : eu.firstName,
      lastName: data.lastName !== undefined ? data.lastName : eu.lastName,
      email: data.email !== undefined ? data.email : eu.email,
      phone: data.phone !== undefined ? data.phone : eu.phone,
      address: data.address !== undefined ? data.address : eu.address,
      nationalId: data.nationalId !== undefined ? data.nationalId : eu.nationalId,
      staticIp: data.staticIp !== undefined ? data.staticIp : eu.staticIp,
      group: data.group !== undefined ? data.group : eu.group,
      traffic: data.traffic !== undefined ? data.traffic : eu.traffic,
      balance: data.balance !== undefined ? data.balance : eu.balance,
      expiration: data.expiration !== undefined ? data.expiration : eu.expiration,
      status: data.status !== undefined ? data.status : eu.status
    };

    const baseQuery = `
      UPDATE dashboard_users 
      SET firstName=?, lastName=?, email=?, phone=?, address=?, nationalId=?, staticIp=?, \`group\`=?, traffic=?, balance=?, expiration=?, status=?
      ${data.password ? ', password=?' : ''}
      ${profileUpdates}
      WHERE username=?
    `;
    
    const baseParams = [
      updatedUser.firstName, updatedUser.lastName, updatedUser.email, updatedUser.phone, 
      updatedUser.address, updatedUser.nationalId,
      updatedUser.staticIp, updatedUser.group, updatedUser.traffic, updatedUser.balance, 
      updatedUser.expiration, updatedUser.status
    ];
    if (data.password) baseParams.push(data.password);
    baseParams.push(...updateParams);
    baseParams.push(username);
    
    await query(baseQuery, baseParams);

    if (data.password) {
      await query(`UPDATE radcheck SET value=? WHERE username=? AND attribute='Cleartext-Password'`, [data.password, username]);
    }

    // Ensure group is updated in radusergroup
    await query('DELETE FROM radusergroup WHERE username = ?', [username]);
    if (data.group) {
        await query(`INSERT INTO radusergroup (username, groupname, priority) VALUES (?, ?, 1)`, [username, data.group]);
    }

    // Ensure IP is correctly updated in radreply
    await query('DELETE FROM radreply WHERE username = ? AND attribute = "Framed-IP-Address"', [username]);
    if (data.staticIp) {
        await query(`INSERT INTO radreply (username, attribute, op, value) VALUES (?, 'Framed-IP-Address', '=', ?)`, [username, data.staticIp]);
    }

    if (updatedUser.expiration) {
        const expD = new Date(updatedUser.expiration);
        if (!isNaN(expD.getTime())) {
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const radExpStr = `${expD.getDate().toString().padStart(2, '0')} ${months[expD.getMonth()]} ${expD.getFullYear()} 23:59:00`;
            await query(`DELETE FROM radcheck WHERE username = ? AND attribute = 'Expiration'`, [username]);
            await query(`INSERT INTO radcheck (username, attribute, op, value) VALUES (?, 'Expiration', ':=', ?)`, [username, radExpStr]);
        }
    } else if (data.expiration === '') { // manually cleared
        await query(`DELETE FROM radcheck WHERE username = ? AND attribute = 'Expiration'`, [username]);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('DB Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
