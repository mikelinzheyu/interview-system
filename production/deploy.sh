#!/bin/bash
set -e
echo "[INFO] Starting deployment..."
cd "$(dirname "$0")"
docker-compose -f docker-compose.production.yml up -d --build
echo "[INFO] Deployment complete!"
