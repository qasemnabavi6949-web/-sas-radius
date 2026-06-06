import { NextResponse } from 'next/server';
import { query, initDb } from '@/lib/db';
import net from 'net';

export const dynamic = 'force-dynamic';

function checkPort(ip: string, port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(1000);
    socket.on('connect', () => { socket.destroy(); resolve(true); });
    socket.on('timeout', () => { socket.destroy(); resolve(false); });
    socket.on('error', () => { socket.destroy(); resolve(false); });
    socket.connect(port, ip);
  });
}

export async function GET() {
  try {
    await initDb();
    
    // Auto-fix server column if it was erroneously set
    try { await query("UPDATE nas SET server = NULL WHERE server = 'Added via Dashboard'"); } catch {}
    
    const nas: any = await query('SELECT * FROM dashboard_nas ORDER BY id DESC');
    
    // Check real status async
    const nasWithStatus = await Promise.all(nas.map(async (n: any) => {
      // Try winbox (8291), API (8728), or web (80)
      const isOnline = await checkPort(n.ip, 8291) || await checkPort(n.ip, 8728) || await checkPort(n.ip, 80);
      return { ...n, status: isOnline ? 'Online' : 'Offline' };
    }));

    return NextResponse.json(nasWithStatus);
  } catch (error: any) {
    console.error('DB Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await initDb();
    const data = await req.json();
    
    // Insert into Dashboard DB
    await query(`
      INSERT INTO dashboard_nas (name, ip, type, secret, coaPort)
      VALUES (?, ?, ?, ?, ?)
    `, [data.name ?? null, data.ip ?? null, data.type ?? null, data.secret ?? '', data.coaPort ?? '3799']);

    // Insert into FreeRADIUS standard 'nas' table
    await query(`
      INSERT INTO nas (nasname, shortname, type, secret, description)
      VALUES (?, ?, ?, ?, ?)
    `, [data.ip ?? null, data.name ?? null, data.type ?? null, data.secret ?? '', 'Added via Dashboard']);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('DB Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
