import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { disconnectUserFromNas } from '@/lib/radius_pod';

export async function POST(req: Request, { params }: { params: Promise<{ username: string }> }) {
  try {
    const { username } = await params;
    
    await disconnectUserFromNas(username);

    // Set acctstoptime to NOW() for any open sessions for this username
    await query(`
      UPDATE radacct 
      SET acctstoptime = NOW(), acctterminatecause = 'Admin-Reset' 
      WHERE username = ? AND (acctstoptime IS NULL OR acctstoptime = '0000-00-00 00:00:00' OR acctterminatecause = '')
    `, [username]);

    return NextResponse.json({ success: true, message: 'Sessions cleared and Disconnect-Request sent successfully' });
  } catch (error: any) {
    console.error('Disconnect error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
