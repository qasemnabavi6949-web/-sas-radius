import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();

    const nasInfo: any = await query('SELECT ip FROM dashboard_nas WHERE id = ?', [id]);
    const oldIp = nasInfo?.[0]?.ip;

    await query(`
      UPDATE dashboard_nas
      SET name = ?, ip = ?, type = ?, secret = ?, coaPort = ?
      WHERE id = ?
    `, [body.name ?? null, body.ip ?? null, body.type ?? null, body.secret ?? null, body.coaPort ?? null, id]);

    if (oldIp) {
      // FreeRADIUS uses 'nasname' for the IP
      await query(`
        UPDATE nas
        SET nasname = ?, shortname = ?, type = ?, secret = ?
        WHERE nasname = ?
      `, [body.ip ?? null, body.name ?? null, body.type ?? null, body.secret ?? null, oldIp]);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('DB Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    // Find the IP to delete from the native RADIUS nas table too
    const nasInfo: any = await query('SELECT ip FROM dashboard_nas WHERE id = ?', [id]);
    if (nasInfo && nasInfo.length > 0) {
       await query('DELETE FROM nas WHERE nasname = ?', [nasInfo[0].ip]);
    }

    await query('DELETE FROM dashboard_nas WHERE id = ?', [id]);
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('DB Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
