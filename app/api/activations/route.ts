import { NextResponse } from 'next/server';
import { query, initDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await initDb();
    
    await query(`
      CREATE TABLE IF NOT EXISTS dashboard_activations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(64) NOT NULL,
        firstName VARCHAR(64),
        lastName VARCHAR(64),
        manager VARCHAR(64) DEFAULT 'admin',
        profile VARCHAR(64),
        price DECIMAL(10,2),
        totalPrice DECIMAL(10,2),
        userPrice DECIMAL(10,2),
        oldExpiration VARCHAR(64),
        newExpiration VARCHAR(64),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const activations = await query(`
      SELECT * FROM dashboard_activations ORDER BY id DESC
    `);

    return NextResponse.json(activations);
  } catch (error: any) {
    console.error('Activations fetching Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
