import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    let sqlCommands = buffer.toString('utf8');
    
    // Replace INSERT INTO with REPLACE INTO to avoid Duplicate Entry errors
    sqlCommands = sqlCommands.replace(/INSERT INTO/g, 'REPLACE INTO');

    // Create a temporary connection with multipleStatements enabled
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'radius',
      password: process.env.DB_PASSWORD || 'radpass',
      database: process.env.DB_NAME || 'radius',
      multipleStatements: true,
      charset: 'utf8mb4'
    });

    try {
      await connection.query(sqlCommands);
    } catch (err: any) {
      console.error('Error executing restore statement:', err.message);
      connection.destroy();
      return NextResponse.json({ error: 'SQL Execution Error: ' + err.message }, { status: 500 });
    }

    connection.destroy();
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Restore Error:', error);
    return NextResponse.json({ error: 'System Error: ' + error.message }, { status: 500 });
  }
}
