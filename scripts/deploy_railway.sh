#!/usr/bin/env bash
set -euo pipefail

echo "Deploying backend to Railway..."
if ! command -v railway >/dev/null 2>&1; then
  echo "Railway CLI not found. Install: npm i -g @railway/cli"
  exit 1
fi

railway up --service backend

echo "Railway deployment triggered successfully."
