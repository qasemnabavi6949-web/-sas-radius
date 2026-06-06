#!/bin/sh
node background_job.js &
exec node server.js
