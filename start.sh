#!/bin/bash
cd /Users/jenny/.openclaw/workspace-app-venture/paprika-mvp
PORT=3000 node src/server.js > /tmp/paprika-server.log 2>&1 &
echo "Paprika MVP started on http://localhost:3000"
echo "PID: $!"
