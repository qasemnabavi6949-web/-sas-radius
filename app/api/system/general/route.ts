import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import util from 'util';

const execAsync = util.promisify(exec);

export async function GET() {
  try {
    let hostname = 'SAS RADIUS Primary';
    let timezone = 'Etc/UTC';

    try {
      const { stdout: hnStdout } = await execAsync("nsenter -t 1 -m -u -n -i -- hostname");
      hostname = hnStdout.trim();
    } catch {
      // Ignored
    }

    try {
      const { stdout: tzStdout } = await execAsync("nsenter -t 1 -m -u -n -i -- cat /etc/timezone");
      timezone = tzStdout.trim();
    } catch {
      // Ignored
    }

    return NextResponse.json({ serverName: hostname, timezone });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { serverName, timezone } = await req.json();

    if (serverName) {
      await execAsync(`nsenter -t 1 -m -u -n -i -- hostnamectl set-hostname "${serverName.replace(/"/g, '')}"`);
    }

    if (timezone) {
      await execAsync(`nsenter -t 1 -m -u -n -i -- timedatectl set-timezone "${timezone.replace(/"/g, '')}"`);
    }

    return NextResponse.json({ success: true, message: 'General settings updated successfully.' });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to update General Config: ' + error.message }, { status: 500 });
  }
}
