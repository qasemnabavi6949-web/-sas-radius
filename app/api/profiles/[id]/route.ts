import { NextResponse } from 'next/server';
import { query, initDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = await req.json();
    await initDb();
    
    // Find old profile name
    const profileInfo: any = await query('SELECT name, type FROM dashboard_profiles WHERE id = ?', [id]);
    if (!profileInfo || profileInfo.length === 0) {
       return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }
    const oldProfileName = profileInfo[0].name;

    await query(`
      UPDATE dashboard_profiles 
      SET name=?, price=?, downloadSpeed=?, uploadSpeed=?, totalTraffic=?, downloadTraffic=?, uploadTraffic=?, dailyQuota=?, nextPackage=?, type=?, validityDays=?, speedLimit=?, description=?
      WHERE id=?
    `, [
      data.name ?? null, 
      data.price ?? null, 
      data.downloadSpeed ?? null, 
      data.uploadSpeed ?? null, 
      data.totalTraffic ?? null, 
      data.downloadTraffic ?? null, 
      data.uploadTraffic ?? null, 
      data.dailyQuota ?? null, 
      data.nextPackage ?? null, 
      data.type ?? 'data', 
      (typeof data.validityDays === 'number' && !isNaN(data.validityDays)) ? data.validityDays : 30,
      data.speedLimit ?? null,
      data.description ?? null,
      id
    ]);

    // Update existing users in dashboard_users who have this profile
    let dataLimitBytes = 0;
    let dataLimitString = 'Unlimited';
    let newSpeedLimit = '';

    const type = data.type || ('type' in (profileInfo[0] || {}) ? profileInfo[0].type : 'data');

    if (type === 'data') {
        if (data.totalTraffic && !isNaN(parseFloat(data.totalTraffic))) {
           dataLimitBytes = parseFloat(data.totalTraffic) * 1024 * 1024;
           dataLimitString = `${data.totalTraffic} MB`;
        }
        if (data.downloadSpeed || data.uploadSpeed) {
           newSpeedLimit = `${data.downloadSpeed || 0} / ${data.uploadSpeed || 0} Kbps`;
        }
    }
    
    // Auto-migrate if speedLimit is not there yet (just in case)
    try { await query("ALTER TABLE dashboard_users ADD COLUMN speedLimit VARCHAR(32) DEFAULT ''"); } catch {}

    // Update users' limit to match new profile limits
    await query(`
      UPDATE dashboard_users 
      SET \`group\` = ?, dataLimitBytes = ?, dataLimitString = ?, speedLimit = ?
      WHERE \`group\` = ?
    `, [data.name ?? oldProfileName, dataLimitBytes, dataLimitString, newSpeedLimit, oldProfileName]);

    // Update FreeRADIUS group name if it changed

    if (oldProfileName !== data.name) {
       await query('UPDATE radgroupreply SET groupname = ? WHERE groupname = ?', [data.name ?? '', oldProfileName]);
       await query('UPDATE radgroupcheck SET groupname = ? WHERE groupname = ?', [data.name ?? '', oldProfileName]);
       await query('UPDATE radusergroup SET groupname = ? WHERE groupname = ?', [data.name ?? '', oldProfileName]);
    }

    // Refresh limits in FreeRADIUS group tables
    if (type === 'data') {
        const radGroupUpload = parseInt(data.uploadSpeed || '0') * 1024 * 1024;
        const radGroupDownload = parseInt(data.downloadSpeed || '0') * 1024 * 1024;
        
        await query('DELETE FROM radgroupreply WHERE groupname = ? AND attribute = ?', [data.name ?? '', 'MikroTik-Rate-Limit']);
        if (!isNaN(radGroupUpload) && !isNaN(radGroupDownload) && (radGroupUpload > 0 || radGroupDownload > 0)) {
            const mikrotikRateLimit = `${radGroupUpload}/${radGroupDownload}`;
            await query(`
              INSERT INTO radgroupreply (groupname, attribute, op, value)
              VALUES (?, 'MikroTik-Rate-Limit', '=', ?)
            `, [data.name ?? '', mikrotikRateLimit]);
        }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('DB Error:', error);
    return NextResponse.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    // Find profile name
    const profileInfo: any = await query('SELECT name FROM dashboard_profiles WHERE id = ?', [id]);
    if (profileInfo && profileInfo.length > 0) {
       const profileName = profileInfo[0].name;
       await query('DELETE FROM radgroupreply WHERE groupname = ?', [profileName]);
       await query('DELETE FROM radgroupcheck WHERE groupname = ?', [profileName]);
    }

    await query('DELETE FROM dashboard_profiles WHERE id = ?', [id]);
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('DB Error:', error);
    return NextResponse.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
}
