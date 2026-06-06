import { NextResponse } from 'next/server';
import { query, initDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await initDb();
    
    // Auto-migrate to add new columns if they don't exist
    try { await query("ALTER TABLE dashboard_profiles ADD COLUMN type VARCHAR(32) DEFAULT 'data'"); } catch {}
    try { await query("ALTER TABLE dashboard_profiles ADD COLUMN validityDays INT DEFAULT 30"); } catch {}

    const profiles = await query('SELECT * FROM dashboard_profiles ORDER BY id DESC');
    return NextResponse.json(profiles);
  } catch (error: any) {
    console.error('DB Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await initDb();
    
    // Auto-migrate
    try { await query("ALTER TABLE dashboard_profiles ADD COLUMN type VARCHAR(32) DEFAULT 'data'"); } catch {}
    try { await query("ALTER TABLE dashboard_profiles ADD COLUMN validityDays INT DEFAULT 30"); } catch {}
    try { await query("ALTER TABLE dashboard_profiles ADD COLUMN speedLimit VARCHAR(64)"); } catch {}
    try { await query("ALTER TABLE dashboard_profiles ADD COLUMN description VARCHAR(255)"); } catch {}

    const data = await req.json();
    
    // Insert into Dashboard DB
    await query(`
      INSERT INTO dashboard_profiles (name, price, downloadSpeed, uploadSpeed, totalTraffic, downloadTraffic, uploadTraffic, dailyQuota, nextPackage, type, validityDays, speedLimit, description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      data.description ?? null
    ]);

    // Add speed limits to FreeRADIUS group tables if it's a data profile
    if (data.type === 'data') {
        const radGroupUpload = parseInt(data.uploadSpeed || '0') * 1024 * 1024;
        const radGroupDownload = parseInt(data.downloadSpeed || '0') * 1024 * 1024;
        
        if (!isNaN(radGroupUpload) && !isNaN(radGroupDownload) && (radGroupUpload > 0 || radGroupDownload > 0)) {
            const mikrotikRateLimit = `${radGroupUpload}/${radGroupDownload}`;
            await query(`
              INSERT INTO radgroupreply (groupname, attribute, op, value)
              VALUES (?, 'MikroTik-Rate-Limit', '=', ?)
            `, [data.name ?? '', mikrotikRateLimit]);
        }

        // Request NAS to send Volume Updates every 60 seconds
        await query(`
          INSERT INTO radgroupreply (groupname, attribute, op, value)
          VALUES (?, 'Acct-Interim-Interval', '=', '60')
        `, [data.name ?? '']);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('DB Error:', error);
    return NextResponse.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
}
