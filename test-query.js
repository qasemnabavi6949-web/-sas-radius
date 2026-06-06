const mysql = require('mysql2/promise');
async function run() {
  const db = await mysql.createConnection({
    host: 'localhost',
    user: 'radius',
    password: 'radpass',
    database: 'radius'
  });
  try {
    const [rows] = await db.query(`
      SELECT du.username, du.dataLimitBytes, du.accountStatus,
             COALESCE((SELECT SUM(acctinputoctets + acctoutputoctets) 
                       FROM radacct WHERE username = du.username), 0) as totalBytesUsed
      FROM dashboard_users du
    `);
    console.log(rows);
  } catch(e) {
    console.log(e);
  }
  process.exit(0);
}
run();
