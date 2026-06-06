const http = require('http');

process.on('uncaughtException', (err) => {
  console.error('Unhandled Exception in background_job:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection in background_job:', reason);
});

function pollCron() {
  try {
    http.get('http://127.0.0.1:3000/api/cron/traffic', (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        console.log('Cron response:', data);
      });
    }).on('error', (err) => {
      console.error('Cron request failed:', err.message);
    });
  } catch (err) {
    console.error('pollCron synchronous error:', err);
  }
}

// Check every 60 seconds
setInterval(pollCron, 60000);
console.log('Scheduled traffic cron running every 60s');
setTimeout(pollCron, 5000); // initial run
