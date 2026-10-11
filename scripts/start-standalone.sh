#!/usr/bin/env sh
# Run the standalone build locally (used by the E2E tests): copies static assets next to server.js.
set -e
cp -r public .next/standalone/ 2>/dev/null || true
mkdir -p .next/standalone/.next
cp -r .next/static .next/standalone/.next/
exec node .next/standalone/server.js
