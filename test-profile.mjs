const { initDb, query } = require('./lib/db');
async function test() {
  await initDb();
  console.log('Inserting profile');
  try {
     await query("INSERT INTO dashboard_profiles (name, price, downloadSpeed, uploadSpeed, totalTraffic, downloadTraffic, uploadTraffic, dailyQuota, nextPackage, type, validityDays, speedLimit, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", 
     ['Test Profile', '10', '10', '10', '', '', '', '', '', 'data', 30, '', '']);
     console.log('Inserted');
  } catch(e) {
     console.error('Error:', e);
  }
}
test();
