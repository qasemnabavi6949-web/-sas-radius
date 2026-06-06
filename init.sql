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
);

CREATE TABLE IF NOT EXISTS dashboard_nas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(64) NOT NULL,
  ip VARCHAR(64) NOT NULL,
  type VARCHAR(64) NOT NULL,
  secret VARCHAR(64) NOT NULL,
  coaPort VARCHAR(32) NOT NULL,
  status VARCHAR(20) DEFAULT 'Offline',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

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
  validityDays INT(11) DEFAULT 30,
  speedLimit VARCHAR(64),
  mikrotikRateLimit VARCHAR(128) DEFAULT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

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
);

CREATE TABLE IF NOT EXISTS radcheck (
  id int(11) unsigned NOT NULL auto_increment,
  username varchar(64) NOT NULL default '',
  attribute varchar(64)  NOT NULL default '',
  op char(2) NOT NULL DEFAULT '==',
  value varchar(253) NOT NULL default '',
  PRIMARY KEY  (id),
  KEY username (username(32))
);

CREATE TABLE IF NOT EXISTS radreply (
  id int(11) unsigned NOT NULL auto_increment,
  username varchar(64) NOT NULL default '',
  attribute varchar(64) NOT NULL default '',
  op char(2) NOT NULL DEFAULT '=',
  value varchar(253) NOT NULL default '',
  PRIMARY KEY  (id),
  KEY username (username(32))
);

CREATE TABLE IF NOT EXISTS radgroupcheck (
  id int(11) unsigned NOT NULL auto_increment,
  groupname varchar(64) NOT NULL default '',
  attribute varchar(64)  NOT NULL default '',
  op char(2) NOT NULL DEFAULT '==',
  value varchar(253)  NOT NULL default '',
  PRIMARY KEY  (id),
  KEY groupname (groupname(32))
);

CREATE TABLE IF NOT EXISTS radgroupreply (
  id int(11) unsigned NOT NULL auto_increment,
  groupname varchar(64) NOT NULL default '',
  attribute varchar(64)  NOT NULL default '',
  op char(2) NOT NULL DEFAULT '=',
  value varchar(253)  NOT NULL default '',
  PRIMARY KEY  (id),
  KEY groupname (groupname(32))
);

CREATE TABLE IF NOT EXISTS radusergroup (
  id int(11) unsigned NOT NULL auto_increment,
  username varchar(64) NOT NULL default '',
  groupname varchar(64) NOT NULL default '',
  priority int(11) NOT NULL default '1',
  PRIMARY KEY  (id),
  KEY username (username(32))
);

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
);

CREATE TABLE IF NOT EXISTS radpostauth (
  id int(11) NOT NULL auto_increment,
  username varchar(64) NOT NULL default '',
  pass varchar(64) NOT NULL default '',
  reply varchar(32) NOT NULL default '',
  authdate timestamp NOT NULL default CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY  (id),
  KEY username (username)
);

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
);
