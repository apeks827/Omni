#!/bin/bash
set -euo pipefail

FEATURE_BRANCH="${1:-}"

RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

fail() {
	echo -e "${RED}[ERROR]${NC} $1"
	exit 1
}

pass() {
	echo -e "${GREEN}[OK]${NC} $1"
}

if [ -z "$FEATURE_BRANCH" ]; then
	FEATURE_BRANCH=$(git rev-parse --abbrev-ref HEAD)
fi

BRANCH_SLUG=$(echo "$FEATURE_BRANCH" | sed 's/[^a-zA-Z0-9]/-/g')
CONTAINER_NAME="omni-feature-$BRANCH_SLUG"
DEPLOY_DIR="/opt/omni-feature"

echo "=== Stopping Feature Deployment ==="
echo "Feature: $FEATURE_BRANCH"
echo "Container: $CONTAINER_NAME"
echo ""

ssh "${FEATURE_DEPLOY_USER:-root}@${FEATURE_DEPLOY_HOST:-localhost}" <<ENDSSH
set -e
cd $DEPLOY_DIR

echo "Stopping containers..."
docker-compose -f docker-compose.feature.yml down 2>/dev/null || true

echo "Removing image..."
docker rmi "omni:feature-$BRANCH_SLUG" 2>/dev/null || true

echo "Removing volumes..."
docker volume rm "deploy_postgres_feature_${BRANCH_SLUG}" 2>/dev/null || true

echo "Cleanup complete"
ENDSSH

pass "Feature deployment stopped and cleaned up"
