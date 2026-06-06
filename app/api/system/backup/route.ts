import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import mysqldump from 'mysqldump';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const dateStr = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `freeradius-backup-${dateStr}.sql`;
    const tempDir = '/tmp';
    const outputPath = path.join(tempDir, backupFileName);

    await mysqldump({
      connection: {
        host: process.env.DB_HOST || '127.0.0.1',
        user: process.env.DB_USER || 'radius',
        password: process.env.DB_PASSWORD || 'radpass',
        database: process.env.DB_NAME || 'radius',
      },
      dumpToFile: outputPath,
      dump: {
        schema: {
          table: {
            dropIfExist: true
          }
        }
      }
    });

    const fileBuffer = fs.readFileSync(outputPath);
    fs.unlinkSync(outputPath);

    // Save a copy to the server's local 'backups' directory
    const backupsDir = path.join(process.cwd(), 'backups');
    if (!fs.existsSync(backupsDir)) {
      fs.mkdirSync(backupsDir, { recursive: true });
    }
    const localBackupPath = path.join(backupsDir, backupFileName);
    fs.writeFileSync(localBackupPath, fileBuffer);

    return new Response(fileBuffer, {
      headers: {
        'Content-Type': 'application/sql',
        'Content-Disposition': `attachment; filename="${backupFileName}"`,
      },
    });
  } catch (error: any) {
    console.error('Backup error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
