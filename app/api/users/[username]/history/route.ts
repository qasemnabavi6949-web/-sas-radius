import { NextResponse } from 'next/server';
import { query, initDb } from '@/lib/db';

export async function GET(req: Request, { params }: { params: Promise<{ username: string }> }) {
  try {
    await initDb();
    const { username } = await params;
    const history = await query(`
      SELECT * FROM dashboard_activations 
      WHERE username = ?
      ORDER BY id DESC
    `, [username]);
    
    return NextResponse.json({ history });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
