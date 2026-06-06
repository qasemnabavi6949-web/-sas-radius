import { NextResponse } from 'next/server';
import { query, initDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await initDb();
    const radacct = await query('SELECT * FROM radacct ORDER BY radacctid DESC LIMIT 10');
    const radcheck = await query('SELECT * FROM radcheck');
    const radreply = await query('SELECT * FROM radreply');
    const radusergroup = await query('SELECT * FROM radusergroup');
    const radgroupreply = await query('SELECT * FROM radgroupreply');
    return NextResponse.json({ radacct, radcheck, radreply, radusergroup, radgroupreply });
  } catch (error: any) {
    console.error("DEBUG ERR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
