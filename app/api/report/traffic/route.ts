import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year');
    const month = searchParams.get('month'); // 1-12
    const username = searchParams.get('username');

    if (!year || !month) {
      return NextResponse.json({ error: 'Year and month are required' }, { status: 400 });
    }

    // Get number of days in the month
    const daysInMonth = new Date(parseInt(year), parseInt(month), 0).getDate();
    
    // Create an array of days
    const dailyData: any[] = [];
    for (let i = 1; i <= daysInMonth; i++) {
        dailyData.push({
            day: i,
            date: `${year}-${month}-${i}`,
            download: 0,
            upload: 0,
            total: 0,
            realTraffic: 0
        });
    }

    const startDate = `${year}-${month.padStart(2, '0')}-01 00:00:00`;
    const endDate = `${year}-${month.padStart(2, '0')}-${daysInMonth} 23:59:59`;

    // Query radacct to sum acctinputoctets and acctoutputoctets per day
    let queryStr = `
        SELECT 
            EXTRACT(DAY FROM COALESCE(acctupdatetime, acctstoptime, acctstarttime)) as day,
            SUM(acctoutputoctets) as downloadTraffic,
            SUM(acctinputoctets) as uploadTraffic
        FROM radacct
        WHERE ((COALESCE(acctupdatetime, acctstoptime, acctstarttime) >= ? 
          AND COALESCE(acctupdatetime, acctstoptime, acctstarttime) <= ?)
          OR (acctstoptime IS NULL AND acctstarttime <= ?))
    `;
    const params: any[] = [startDate, endDate, endDate];
    
    if (username) {
        queryStr += ` AND username = ?`;
        params.push(username);
    }
    
    queryStr += ` GROUP BY day`;

    const rows = await query(queryStr, params);

    if (Array.isArray(rows)) {
        rows.forEach((row: any) => {
            let dayIndex = row.day - 1;
            
            // If the session started before the month or day is weird, just assign to day 1 or today
            if (isNaN(dayIndex) || dayIndex < 0 || dayIndex >= daysInMonth) {
                // If the month being viewed is the current month, map to today's date if possible
                const now = new Date();
                if (now.getFullYear().toString() === year && (now.getMonth() + 1).toString() === month) {
                    dayIndex = now.getDate() - 1;
                } else {
                    dayIndex = 0; // fallback to 1st of the month
                }
            }
            
            if (dayIndex >= 0 && dayIndex < daysInMonth) {
                const dl = parseFloat(row.downloadTraffic) || 0;
                const ul = parseFloat(row.uploadTraffic) || 0;
                
                dailyData[dayIndex].download += dl;
                dailyData[dayIndex].upload += ul;
                dailyData[dayIndex].total += dl + ul;
                dailyData[dayIndex].realTraffic += dl + ul;
            }
        });
    }

    // Also look at ongoing sessions (acctstoptime is null but started in this month or earlier, we can estimate somewhat, but typical RADIUS reporting only uses stopped sessions or interim updates)
    // For simplicity, we just use the grouped query above which is standard for daily traffic reports.

    return NextResponse.json({ data: dailyData });

  } catch (error: any) {
    console.error('Traffic report error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
