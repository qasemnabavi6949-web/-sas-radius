const { execSync } = require('child_process');
try {
  const result = execSync('docker logs sas-radius-app', { encoding: 'utf8' });
  console.log(result);
} catch (e) {
  console.error(e.stderr);
}
