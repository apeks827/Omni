#!/bin/bash
set -euo pipefail

FEATURE_BRANCH="${1:-}"
DEPLOY_HOST="${FEATURE_DEPLOY_HOST:-localhost}"
DEPLOY_PORT="${FEATURE_DEPLOY_PORT:-3001}"
DEPLOY_DIR="/opt/omni-feature"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

fail() {
	echo -e "${RED}[ERROR]${NC} $1"
	exit 1
}

pass() {
	echo -e "${GREEN}[OK]${NC} $1"
}

warn() {
	echo -e "${YELLOW}[WARN]${NC} $1"
}

if [ -z "$FEATURE_BRANCH" ]; then
	FEATURE_BRANCH=$(git rev-parse --abbrev-ref HEAD)
fi

if [ ! "$FEATURE_BRANCH" =~ ^feat/.* ]; then
	fail "This script is for feature branches only. Current branch: $FEATURE_BRANCH"
fi

BRANCH_SLUG=$(echo "$FEATURE_BRANCH" | sed 's/[^a-zA-Z0-9]/-/g')
IMAGE_TAG="feature-$BRANCH_SLUG"
CONTAINER_NAME="omni-feature-$BRANCH_SLUG"

echo "=== Omni Feature Deploy ==="
echo "Feature branch: $FEATURE_BRANCH"
echo "Image tag: $IMAGE_TAG"
echo "Container name: $CONTAINER_NAME"
echo ""

if [ -n "$(git status --porcelain)" ]; then
	warn "Uncommitted changes detected"
	git status --short
	echo ""
fi

echo "Step 1: Building Docker image..."
docker build -t "omni:$IMAGE_TAG" .
pass "Docker image built"

echo ""
echo "Step 2: Stopping existing feature deployment (if any)..."
ssh "${FEATURE_DEPLOY_USER:-root}@${FEATURE_DEPLOY_HOST:-localhost}" <<ENDSSH 2>/dev/null || true
set -e
cd $DEPLOY_DIR
docker-compose -f docker-compose.feature.yml down 2>/dev/null || true
ENDSSH
pass "Clean slate"

echo ""
echo "Step 3: Creating feature deployment config..."
ssh "${FEATURE_DEPLOY_USER:-root}@${FEATURE_DEPLOY_HOST:-localhost}" <<ENDSSH
set -e
mkdir -p $DEPLOY_DIR

cat > $DEPLOY_DIR/docker-compose.feature.yml <<EOF
version: '3.8'

services:
  postgres-feature:
    image: postgres:16-alpine
    container_name: postgres-$CONTAINER_NAME
    environment:
      POSTGRES_DB: omni_feature_${BRANCH_SLUG}
      POSTGRES_USER: omni
      POSTGRES_PASSWORD: \${DB_PASSWORD}
    volumes:
      - postgres_feature_${BRANCH_SLUG}:/var/lib/postgresql/data
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U omni']
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  app-feature:
    image: omni:$IMAGE_TAG
    container_name: $CONTAINER_NAME
    environment:
      NODE_ENV: production
      PORT: $DEPLOY_PORT
      DB_HOST: postgres-feature
      DB_PORT: 5432
      DB_NAME: omni_feature_${BRANCH_SLUG}
      DB_USER: omni
      DB_PASSWORD: \${DB_PASSWORD}
      JWT_SECRET: \${JWT_SECRET}
      ALLOWED_ORIGINS: \${ALLOWED_ORIGINS}
      FEATURE_BRANCH: $FEATURE_BRANCH
    ports:
      - '$DEPLOY_PORT:3000'
    depends_on:
      postgres-feature:
        condition: service_healthy
    restart: unless-stopped
    healthcheck:
      test:
        [
          'CMD',
          'node',
          '-e',
          "require('http').get('http://localhost:3000/health', (r) => { process.exit(r.statusCode === 200 ? 0 : 1); }).on('error', () => process.exit(1));",
        ]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

volumes:
  postgres_feature_${BRANCH_SLUG}:
EOF
echo "Config created"
ENDSSH
pass "Deployment config created"

echo ""
echo "Step 4: Copying Docker image..."
docker save "omni:$IMAGE_TAG" | ssh "${FEATURE_DEPLOY_USER:-root}@${FEATURE_DEPLOY_HOST:-localhost}" "docker load"
pass "Image copied"

echo ""
echo "Step 5: Starting feature deployment..."
ssh "${FEATURE_DEPLOY_USER:-root}@${FEATURE_DEPLOY_HOST:-localhost}" <<ENDSSH
set -e
cd $DEPLOY_DIR
docker-compose -f docker-compose.feature.yml up -d
echo "Waiting for services to start..."
sleep 20
docker-compose -f docker-compose.feature.yml ps
ENDSSH
pass "Feature deployment started"

echo ""
echo "Step 6: Health check..."
sleep 5
HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://${FEATURE_DEPLOY_HOST}:${DEPLOY_PORT}/health" 2>/dev/null || echo "000")

if [ "$HEALTH_STATUS" = "200" ]; then
	pass "Health check passed"
else
	warn "Health check returned HTTP $HEALTH_STATUS"
fi

echo ""
echo "=== Feature Deploy Complete ==="
echo "Feature: $FEATURE_BRANCH"
echo "URL: http://${FEATURE_DEPLOY_HOST}:${DEPLOY_PORT}"
echo "Container: $CONTAINER_NAME"
echo ""
echo "To stop the feature deployment:"
echo "  ./scripts/stop-feature.sh $FEATURE_BRANCH"
echo ""
echo "To view logs:"
echo "  ssh ${FEATURE_DEPLOY_USER:-root}@${FEATURE_DEPLOY_HOST:-localhost} 'docker logs -f $CONTAINER_NAME'"
