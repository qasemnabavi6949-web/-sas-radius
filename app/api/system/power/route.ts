import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import util from 'util';

const execAsync = util.promisify(exec);

export async function POST(req: Request) {
  try {
    const { action } = await req.json();

    if (action === 'restart') {
      execAsync('nsenter -t 1 -m -u -i -n reboot').catch((e) => console.error("Reboot error:", e));
      setTimeout(() => {
        process.exit(1);
      }, 2000);
      return NextResponse.json({ success: true, message: 'Restarting server...' });
    } 
    
    if (action === 'shutdown') {
      execAsync('nsenter -t 1 -m -u -i -n poweroff').catch((e) => console.error("Shutdown error:", e));
      setTimeout(() => {
        process.exit(0);
      }, 2000);
      return NextResponse.json({ success: true, message: 'Shutting down server...' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
