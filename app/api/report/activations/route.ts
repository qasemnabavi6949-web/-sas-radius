import { NextResponse } from 'next/server';
import { query, initDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    await initDb();
    
    // Auto-migrate
    try { await query(`
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
    `); } catch {}

    const { searchParams } = new URL(req.url);
    const month = searchParams.get('month');
    const year = searchParams.get('year');

    let dateFilter = '';
    const params: any[] = [];

    if (month && year) {
       dateFilter = 'WHERE MONTH(created_at) = ? AND YEAR(created_at) = ?';
       params.push(month, year);
    }

    const activations: any = await query(`
      SELECT 
        id, 
        created_at as \`date\`, 
        username, 
        firstName, 
        lastName, 
        manager, 
        profile, 
        price, 
        totalPrice, 
        userPrice, 
        oldExpiration, 
        newExpiration
      FROM dashboard_activations
      ${dateFilter}
      ORDER BY created_at DESC
    `, params);

    // Group by day for the chart
    const dailyData: any = {};
    let totalRevenue = 0;

    let daysInMonth = 30; // default
    if (year && month) {
       daysInMonth = new Date(parseInt(year), parseInt(month), 0).getDate();
    }
    
    for (let i = 1; i <= daysInMonth; i++) {
        const fullDateStr = `${year}-${String(month).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        dailyData[fullDateStr] = {
            day: i,
            date: fullDateStr,
            activations: 0,
            amountAFN: 0
        };
    }

    const detailedMap = activations.map((a: any) => {
        const rowDate = new Date(a.date);
        const dayStr = rowDate.toISOString().split('T')[0];
        
        if (dailyData[dayStr]) {
            dailyData[dayStr].activations += 1;
            dailyData[dayStr].amountAFN += parseFloat(a.price || 0);
        }
        totalRevenue += parseFloat(a.price || 0);

        return {
            ...a,
            date: rowDate.toLocaleString(),
            price: parseFloat(a.price || 0),
            totalPrice: parseFloat(a.totalPrice || 0),
            userPrice: parseFloat(a.userPrice || 0)
        };
    });

    return NextResponse.json({
       dailyData: Object.values(dailyData),
       detailed: detailedMap,
       totalRevenue
    });
  } catch (error: any) {
    console.error('Activations Report Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
