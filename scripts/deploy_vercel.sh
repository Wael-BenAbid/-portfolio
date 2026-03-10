#!/usr/bin/env bash
set -euo pipefail

echo "Deploying frontend to Vercel..."
if ! command -v vercel >/dev/null 2>&1; then
  echo "Vercel CLI not found. Install: npm i -g vercel"
  exit 1
fi

cd frontend
vercel --prod

echo "Vercel deployment completed."
