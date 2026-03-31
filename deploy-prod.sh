#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VERSION="${1:-latest}"

echo "=== Deploying to Production ==="
echo "Version: $VERSION"
echo ""

echo "Step 0: Running G1 pre-deploy gate checks..."
echo "Running lint..."
if ! npm run lint; then
	echo "ERROR: Lint check failed. Fix errors before deploying."
	exit 1
fi

echo "Running typecheck..."
if ! npm run typecheck; then
	echo "ERROR: Type check failed. Fix errors before deploying."
	exit 1
fi

echo "Running tests..."
if ! npm run test:run; then
	echo "ERROR: Tests failed. Fix failing tests before deploying."
	exit 1
fi

echo "✓ All G1 gate checks passed"
echo ""

if [ -n "$(git status --porcelain)" ]; then
	echo "ERROR: Uncommitted changes detected. Commit or stash before deploying."
	git status
	exit 1
fi

echo "Running pre-deploy checks..."
if [ -f "$SCRIPT_DIR/scripts/pre-deploy-check.sh" ]; then
	bash "$SCRIPT_DIR/scripts/pre-deploy-check.sh" production
else
	echo "WARNING: Pre-deploy check script not found"
fi

echo ""
echo "Deploying to production server..."

if [ -z "${PROD_HOST:-}" ] || [ -z "${PROD_USER:-}" ]; then
	echo "ERROR: PROD_HOST and PROD_USER must be set"
	exit 1
fi

ssh "${PROD_USER}@${PROD_HOST}" <<EOF
  set -e
  cd /opt/omni || exit 1
  
  echo "Pulling latest changes..."
  git pull origin main
  
  echo "Pulling Docker image..."
  docker pull ${IMAGE_TAG:-ghcr.io/omni/omni:$VERSION}
  
  echo "Stopping current deployment..."
  docker-compose -f docker-compose.prod.yml down
  
  echo "Starting new deployment..."
  docker-compose -f docker-compose.prod.yml up -d
  
  echo "Waiting for services to be ready..."
  sleep 15
  
  echo "Checking health..."
  curl -f http://localhost:3000/health || exit 1
  
  echo "Checking observability endpoints..."
  curl -f http://localhost:3000/metrics > /dev/null && echo "✓ Metrics endpoint healthy" || echo "⚠ Metrics endpoint check failed"
EOF

echo ""
echo "Deployment completed successfully"
echo ""
echo "Running post-deployment smoke tests..."
if [ -f "$SCRIPT_DIR/scripts/smoke-test.sh" ]; then
	bash "$SCRIPT_DIR/scripts/smoke-test.sh" production
fi

echo ""
echo "=== Production Deployment Complete ==="
