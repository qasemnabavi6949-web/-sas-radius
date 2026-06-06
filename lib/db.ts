import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'radius',
  password: process.env.DB_PASSWORD || 'radpass',
  database: process.env.DB_NAME || 'radius',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4',
  connectTimeout: 2000
});

let useSimulation = false;

const simulatedDb: { [key: string]: any[] } = {
  dashboard_users: [
    {
      id: 1,
      username: 'ali_reza',
      password: 'userpass123',
      firstName: 'علی',
      lastName: 'رضایی',
      email: 'ali@example.com',
      phone: '0799123456',
      address: 'کابل، افغانستان',
      nationalId: '123456',
      staticIp: '192.168.88.2',
      group: 'Business-10G',
      status: 'Online',
      expiration: '2026-12-31',
      traffic: '4.5 GB Used / 10 GB',
      balance: '1500 ؋',
      mikrotikRateLimit: '5M/10M',
      created_at: new Date().toISOString()
    },
    {
      id: 2,
      username: 'sara_ahmadi',
      password: 'userpass456',
      firstName: 'سارا',
      lastName: 'احمدی',
      email: 'sara@example.com',
      phone: '0788123456',
      address: 'هرات، افغانستان',
      nationalId: '789101',
      staticIp: '192.168.88.3',
      group: 'Unlimited-Package',
      status: 'Offline',
      expiration: '2026-10-15',
      traffic: '124 GB / Unlimited',
      balance: '0 ؋',
      mikrotikRateLimit: '10M/20M',
      created_at: new Date().toISOString()
    }
  ],
  dashboard_nas: [
    {
      id: 1,
      name: 'Kabul_NAS',
      ip: '192.168.88.1',
      type: 'Mikrotik',
      secret: 'testing123',
      coaPort: '3799',
      status: 'Online',
      created_at: new Date().toISOString()
    },
    {
      id: 2,
      name: 'Herat_Edge',
      ip: '10.0.0.1',
      type: 'Cisco',
      secret: 'heratpass',
      coaPort: '1700',
      status: 'Online',
      created_at: new Date().toISOString()
    }
  ],
  dashboard_profiles: [
    {
      id: 1,
      name: 'Business-10G',
      price: '1000',
      downloadSpeed: '10',
      uploadSpeed: '5',
      totalTraffic: '10',
      downloadTraffic: '10',
      uploadTraffic: '10',
      dailyQuota: 'Unlimited',
      nextPackage: 'None',
      type: 'data',
      validityDays: 30,
      speedLimit: '10M/5M',
      mikrotikRateLimit: '5M/10M',
      description: 'پکیج ده جی بی تجاری',
      created_at: new Date().toISOString()
    },
    {
      id: 2,
      name: 'Unlimited-Package',
      price: '3000',
      downloadSpeed: '20',
      uploadSpeed: '10',
      totalTraffic: 'Unlimited',
      downloadTraffic: 'Unlimited',
      uploadTraffic: 'Unlimited',
      dailyQuota: 'Unlimited',
      nextPackage: 'None',
      type: 'data',
      validityDays: 30,
      speedLimit: '20M/10M',
      mikrotikRateLimit: '10M/20M',
      description: 'پکیج نامحدود ماهانه',
      created_at: new Date().toISOString()
    }
  ],
  dashboard_activations: [
    {
      id: 1,
      username: 'ali_reza',
      firstName: 'علی',
      lastName: 'رضایی',
      manager: 'admin',
      profile: 'Business-10G',
      price: 1000,
      totalPrice: 1000,
      userPrice: 1000,
      oldExpiration: '2026-05-01',
      newExpiration: '2026-06-01',
      created_at: new Date().toISOString()
    }
  ],
  radacct: [
    {
      radacctid: 1,
      username: 'ali_reza',
      framedipaddress: '192.168.88.2',
      callingstationid: '00:11:22:33:44:55',
      acctstarttime: new Date(Date.now() - 3600000).toISOString(),
      acctstoptime: null,
      acctinputoctets: 1572864000,
      acctoutputoctets: 3145728000
    }
  ],
  radpostauth: [
    {
      id: 1,
      username: 'ali_reza',
      pass: 'userpass123',
      reply: 'Access-Accept',
      authdate: new Date().toISOString()
    }
  ],
  radcheck: [],
  radreply: [],
  radgroupreply: [
    { id: 1, groupname: 'Business-10G', attribute: 'MikroTik-Rate-Limit', op: '=', value: '5M/10M' },
    { id: 2, groupname: 'Business-10G', attribute: 'Acct-Interim-Interval', op: '=', value: '60' },
    { id: 3, groupname: 'Unlimited-Package', attribute: 'MikroTik-Rate-Limit', op: '=', value: '10M/20M' },
    { id: 4, groupname: 'Unlimited-Package', attribute: 'Acct-Interim-Interval', op: '=', value: '60' }
  ],
  radgroupcheck: [],
  radusergroup: [],
  nas: []
};

function simulateQuery(sql: string, values?: any[]): any {
  const norm = sql.trim().replace(/\s+/g, ' ');
  const normUpper = norm.toUpperCase();

  // COUNT users
  if (normUpper.includes('COUNT(*) AS COUNT FROM DASHBOARD_USERS') || normUpper.includes('COUNT(*) as count FROM dashboard_users')) {
    return [{ count: simulatedDb.dashboard_users.length }];
  }

  // COUNT online users in radacct
  if (normUpper.includes('COUNT(DISTINCT USERNAME) AS COUNT FROM RADACCT') || normUpper.includes('COUNT(DISTINCT username) as count FROM radacct')) {
    const active = simulatedDb.radacct.filter(r => r.acctstoptime === null || r.acctstoptime === '0000-00-00 00:00:00');
    return [{ count: active.length }];
  }

  // SELECT Hour statistics for traffic charts
  if (normUpper.includes('HOUR(ACCTSTARTTIME)') && normUpper.includes('FROM RADACCT')) {
    const buckets: any[] = [];
    // Generate simulated hourly stats
    const currentHour = new Date().getHours();
    for (let i = 0; i < 24; i++) {
      buckets.push({
        h: i,
        in: i === currentHour ? 1200 * 1024 * 1024 : Math.floor(Math.random() * 500) * 1024 * 1024,
        out: i === currentHour ? 2400 * 1024 * 1024 : Math.floor(Math.random() * 900) * 1024 * 1024
      });
    }
    return buckets;
  }

  // General SELECT
  if (normUpper.startsWith('SELECT')) {
    for (const tableName of Object.keys(simulatedDb)) {
      if (normUpper.includes(`FROM ${tableName.toUpperCase()}`)) {
        let results = [...simulatedDb[tableName]];

        // Filter radacct where acctstoptime is null
        if (tableName === 'radacct' && (normUpper.includes('ACCTSTOPTIME IS NULL') || normUpper.includes("ACCTSTOPTIME = '0000-00-00 00:00:00'"))) {
          results = results.filter(r => r.acctstoptime === null || r.acctstoptime === '0000-00-00 00:00:00');
        }

        // Apply where filtering (mock simple username checking)
        if (normUpper.includes('WHERE USERNAME = ?') || normUpper.includes('WHERE username = ?')) {
          if (values && values.length > 0) {
            results = results.filter(item => item.username === values[0]);
          }
        } else if (normUpper.includes('WHERE GROUPNAME = ?') || normUpper.includes('WHERE groupname = ?')) {
          if (values && values.length > 0) {
            results = results.filter(item => item.groupname === values[0]);
          }
        }

        if (normUpper.includes('ORDER BY')) {
          results.reverse();
        }

        // LIMIT check
        const limitMatch = normUpper.match(/LIMIT\s+(\d+)/);
        if (limitMatch) {
          const limit = parseInt(limitMatch[1]);
          results = results.slice(0, limit);
        }

        return results;
      }
    }
    return [];
  }

  // INSERT INTO
  if (normUpper.startsWith('INSERT INTO')) {
    for (const tableName of Object.keys(simulatedDb)) {
      if (normUpper.includes(`INSERT INTO ${tableName.toUpperCase()}`)) {
        // Extract field names
        const fieldsMatch = norm.replace(/\`/g, '').match(/\(([^)]+)\)/);
        if (fieldsMatch && values && values.length > 0) {
          const fields = fieldsMatch[1].split(',').map(s => s.trim());
          const newRow: any = { id: simulatedDb[tableName].length + 1 };
          fields.forEach((field, idx) => {
            newRow[field] = values[idx] !== undefined ? values[idx] : null;
          });
          newRow.created_at = new Date().toISOString();
          simulatedDb[tableName].push(newRow);
        } else {
          simulatedDb[tableName].push({ id: simulatedDb[tableName].length + 1, created_at: new Date().toISOString() });
        }
        return { insertId: simulatedDb[tableName].length, affectedRows: 1 };
      }
    }
    return { affectedRows: 1 };
  }

  // UPDATE
  if (normUpper.startsWith('UPDATE')) {
    for (const tableName of Object.keys(simulatedDb)) {
      if (normUpper.includes(`UPDATE ${tableName.toUpperCase()}`)) {
        if (values && values.length > 0) {
          const criteriaVal = values[values.length - 1];
          const record = simulatedDb[tableName].find(r => r.username === criteriaVal || r.id === criteriaVal);
          if (record) {
            if (tableName === 'dashboard_users') {
              record.status = 'Online';
            }
          }
        }
        return { affectedRows: 1 };
      }
    }
    return { affectedRows: 1 };
  }

  // DELETE
  if (normUpper.startsWith('DELETE')) {
    for (const tableName of Object.keys(simulatedDb)) {
      if (normUpper.includes(`FROM ${tableName.toUpperCase()}`)) {
        if (values && values.length > 0) {
          const criteriaVal = values[0];
          simulatedDb[tableName] = simulatedDb[tableName].filter(r => r.username !== criteriaVal && r.id !== criteriaVal && r.name !== criteriaVal);
        }
        return { affectedRows: 1 };
      }
    }
    return { affectedRows: 1 };
  }

  return [];
}

export async function query(sql: string, values?: any[]): Promise<any> {
  if (useSimulation) {
    return simulateQuery(sql, values);
  }
  try {
    const [results] = await pool.execute(sql, values || []);
    return results;
  } catch (error: any) {
    const isNetworkError = error.code === 'ETIMEDOUT' || 
                           error.code === 'ECONNREFUSED' || 
                           error.code === 'ENOTFOUND' ||
                           error.code === 'EADDRNOTAVAIL' ||
                           error.message?.includes('ETIMEDOUT') || 
                           error.message?.includes('ECONNREFUSED') ||
                           error.message?.includes('unreachable');
    if (isNetworkError) {
      console.warn("MariaDB server is offline/unreachable in preview env. Switching to Local Simulator fallback.");
      useSimulation = true;
      return simulateQuery(sql, values);
    }
    throw error;
  }
}

let dbInitialized = false;
export async function initDb() {
  if (dbInitialized) return;
  dbInitialized = true;
  try {
  await query(`
    CREATE TABLE IF NOT EXISTS dashboard_users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(64) UNIQUE NOT NULL,
      password VARCHAR(64) NOT NULL,
      firstName VARCHAR(64),
      lastName VARCHAR(64),
      email VARCHAR(128),
      phone VARCHAR(32),
      address VARCHAR(255),
      nationalId VARCHAR(32),
      staticIp VARCHAR(32),
      \`group\` VARCHAR(64),
      status VARCHAR(20) DEFAULT 'Offline',
      expiration VARCHAR(64) DEFAULT '2026-12-31',
      traffic VARCHAR(64) DEFAULT '0 GB / Unlimited',
      balance VARCHAR(64) DEFAULT '0 ؋',
      mikrotikRateLimit VARCHAR(128) DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

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

  await query(`
    CREATE TABLE IF NOT EXISTS dashboard_nas (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(64) NOT NULL,
      ip VARCHAR(64) NOT NULL,
      type VARCHAR(64) NOT NULL,
      secret VARCHAR(64) NOT NULL,
      coaPort VARCHAR(32) NOT NULL,
      status VARCHAR(20) DEFAULT 'Offline',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS dashboard_profiles (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(64) NOT NULL,
      price VARCHAR(32),
      downloadSpeed VARCHAR(32),
      uploadSpeed VARCHAR(32),
      totalTraffic VARCHAR(32),
      downloadTraffic VARCHAR(32),
      uploadTraffic VARCHAR(32),
      dailyQuota VARCHAR(32),
      nextPackage VARCHAR(64),
      type VARCHAR(20) DEFAULT 'data',
      validityDays INT DEFAULT 30,
      speedLimit VARCHAR(64),
      mikrotikRateLimit VARCHAR(128) DEFAULT NULL,
      description VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Auto migrate existing dashboard_profiles
  try { await query("ALTER TABLE dashboard_profiles ADD COLUMN downloadSpeed VARCHAR(50)"); } catch {}
  try { await query("ALTER TABLE dashboard_profiles ADD COLUMN uploadSpeed VARCHAR(50)"); } catch {}
  try { await query("ALTER TABLE dashboard_profiles ADD COLUMN totalTraffic VARCHAR(32)"); } catch {}
  try { await query("ALTER TABLE dashboard_profiles ADD COLUMN downloadTraffic VARCHAR(32)"); } catch {}
  try { await query("ALTER TABLE dashboard_profiles ADD COLUMN uploadTraffic VARCHAR(32)"); } catch {}
  try { await query("ALTER TABLE dashboard_profiles ADD COLUMN dailyQuota VARCHAR(32)"); } catch {}
  try { await query("ALTER TABLE dashboard_profiles ADD COLUMN nextPackage VARCHAR(64)"); } catch {}
  try { await query("ALTER TABLE dashboard_profiles ADD COLUMN type VARCHAR(20) DEFAULT 'data'"); } catch {}
  try { await query("ALTER TABLE dashboard_profiles ADD COLUMN validityDays INT DEFAULT 30"); } catch {}
  try { await query("ALTER TABLE dashboard_profiles ADD COLUMN speedLimit VARCHAR(64)"); } catch {}
  try { await query("ALTER TABLE dashboard_profiles ADD COLUMN mikrotikRateLimit VARCHAR(128)"); } catch {}
  try { await query("ALTER TABLE dashboard_profiles ADD COLUMN description VARCHAR(255)"); } catch {}
  try { await query("ALTER TABLE dashboard_users ADD COLUMN mikrotikRateLimit VARCHAR(128)"); } catch {}
  try { await query("ALTER TABLE dashboard_users ADD COLUMN address VARCHAR(255)"); } catch {}
  try { await query("ALTER TABLE dashboard_users ADD COLUMN nationalId VARCHAR(32)"); } catch {}
  
  // FreeRADIUS default tables
  await query(`
    CREATE TABLE IF NOT EXISTS nas (
      id int(10) NOT NULL auto_increment,
      nasname varchar(128) NOT NULL,
      shortname varchar(32),
      type varchar(30) DEFAULT 'other',
      ports int(5),
      secret varchar(60) DEFAULT 'secret' NOT NULL,
      server varchar(64) DEFAULT NULL,
      community varchar(50) DEFAULT NULL,
      description varchar(200) DEFAULT 'RADIUS Client',
      PRIMARY KEY (id),
      KEY nasname (nasname)
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS radcheck (
      id int(11) unsigned NOT NULL auto_increment,
      username varchar(64) NOT NULL default '',
      attribute varchar(64)  NOT NULL default '',
      op char(2) NOT NULL DEFAULT '==',
      value varchar(253) NOT NULL default '',
      PRIMARY KEY  (id),
      KEY username (username(32))
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS radreply (
      id int(11) unsigned NOT NULL auto_increment,
      username varchar(64) NOT NULL default '',
      attribute varchar(64) NOT NULL default '',
      op char(2) NOT NULL DEFAULT '=',
      value varchar(253) NOT NULL default '',
      PRIMARY KEY  (id),
      KEY username (username(32))
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS radgroupcheck (
      id int(11) unsigned NOT NULL auto_increment,
      groupname varchar(64) NOT NULL default '',
      attribute varchar(64)  NOT NULL default '',
      op char(2) NOT NULL DEFAULT '==',
      value varchar(253)  NOT NULL default '',
      PRIMARY KEY  (id),
      KEY groupname (groupname(32))
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS radgroupreply (
      id int(11) unsigned NOT NULL auto_increment,
      groupname varchar(64) NOT NULL default '',
      attribute varchar(64)  NOT NULL default '',
      op char(2) NOT NULL DEFAULT '=',
      value varchar(253)  NOT NULL default '',
      PRIMARY KEY  (id),
      KEY groupname (groupname(32))
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS radusergroup (
      id int(11) unsigned NOT NULL auto_increment,
      username varchar(64) NOT NULL default '',
      groupname varchar(64) NOT NULL default '',
      priority int(11) NOT NULL default '1',
      PRIMARY KEY  (id),
      KEY username (username(32))
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS radacct (
      radacctid bigint(21) NOT NULL auto_increment,
      acctsessionid varchar(64) NOT NULL default '',
      acctuniqueid varchar(32) NOT NULL default '',
      username varchar(64) NOT NULL default '',
      groupname varchar(64) NOT NULL default '',
      realm varchar(64) default '',
      nasipaddress varchar(15) NOT NULL default '',
      nasportid varchar(32) default null,
      nasporttype varchar(32) default null,
      acctstarttime datetime NULL default null,
      acctupdatetime datetime NULL default null,
      acctstoptime datetime NULL default null,
      acctinterval int(12) default null,
      acctsessiontime int(12) unsigned default null,
      acctauthentic varchar(32) default null,
      connectinfo_start varchar(120) default null,
      connectinfo_stop varchar(120) default null,
      acctinputoctets bigint(20) default null,
      acctoutputoctets bigint(20) default null,
      calledstationid varchar(50) NOT NULL default '',
      callingstationid varchar(50) NOT NULL default '',
      acctterminatecause varchar(32) NOT NULL default '',
      servicetype varchar(32) default null,
      framedprotocol varchar(32) default null,
      framedipaddress varchar(15) NOT NULL default '',
      framedipv6address varchar(45) NOT NULL default '',
      framedipv6prefix varchar(45) NOT NULL default '',
      framedinterfaceid varchar(44) NOT NULL default '',
      delegatedipv6prefix varchar(45) NOT NULL default '',
      PRIMARY KEY (radacctid),
      UNIQUE KEY acctuniqueid (acctuniqueid),
      KEY username (username)
    )
  `);
  await query(`
    CREATE TABLE IF NOT EXISTS radpostauth (
      id int(11) NOT NULL auto_increment,
      username varchar(64) NOT NULL default '',
      pass varchar(64) NOT NULL default '',
      reply varchar(32) NOT NULL default '',
      authdate timestamp NOT NULL default CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY  (id),
      KEY username (username)
    )
  `);

  try { await query("ALTER TABLE radacct ADD COLUMN framedipv6address varchar(45) NOT NULL default ''"); } catch {}
  try { await query("ALTER TABLE radacct ADD COLUMN framedipv6prefix varchar(45) NOT NULL default ''"); } catch {}
  try { await query("ALTER TABLE radacct ADD COLUMN framedinterfaceid varchar(44) NOT NULL default ''"); } catch {}
  
  try {
    const groupsToFix: any = await query("SELECT DISTINCT groupname FROM radgroupreply");
    if (Array.isArray(groupsToFix)) {
      for (const row of groupsToFix) {
        const groupName = row.groupname;
        const exist: any = await query("SELECT * FROM radgroupreply WHERE groupname = ? AND attribute = 'Acct-Interim-Interval'", [groupName]);
        if (Array.isArray(exist) && exist.length === 0) {
          await query("INSERT INTO radgroupreply (groupname, attribute, op, value) VALUES (?, 'Acct-Interim-Interval', '=', '60')", [groupName]);
        }
      }
    }
  } catch {}

  try { await query("ALTER TABLE radacct ADD COLUMN delegatedipv6prefix varchar(45) NOT NULL default ''"); } catch {}
  try { await query("CREATE INDEX acctstarttime_idx ON radacct (acctstarttime);"); } catch {}
  try { await query("CREATE INDEX acctstoptime_idx ON radacct (acctstoptime);"); } catch {}
  try { await query("CREATE INDEX acctupdatetime_idx ON radacct (acctupdatetime);"); } catch {}
  try { await query("CREATE INDEX framedipaddress_idx ON radacct (framedipaddress);"); } catch {}
  } catch (error: any) {
    console.warn("Database initialization failed. Falling back to local in-memory simulation mode.", error.message);
    useSimulation = true;
  }
}

export default pool;
