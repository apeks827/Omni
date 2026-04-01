#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

ENVIRONMENT="${1:-production}"
ROLLBACK_TO="${2:-previous}"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${RED}=== ROLLBACK INITIATED ===${NC}"
echo "Environment: $ENVIRONMENT"
echo "Target: $ROLLBACK_TO"
echo ""

if [ "$ENVIRONMENT" != "production" ] && [ "$ENVIRONMENT" != "staging" ]; then
	echo -e "${RED}ERROR: Invalid environment. Use 'staging' or 'production'${NC}"
	exit 1
fi

read -p "Are you sure you want to rollback $ENVIRONMENT? (yes/no): " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
	echo "Rollback cancelled"
	exit 0
fi

echo ""
echo "Step 1: Identifying last known good deployment..."

if command -v docker &>/dev/null; then
	echo "Checking Docker images..."
	docker images | grep omni | head -5

	if [ "$ROLLBACK_TO" = "previous" ]; then
		PREVIOUS_IMAGE=$(docker images --format "{{.Repository}}:{{.Tag}}" | grep omni | sed -n '2p')
		if [ -z "$PREVIOUS_IMAGE" ]; then
			echo -e "${RED}ERROR: No previous image found${NC}"
			exit 1
		fi
		echo "Previous image: $PREVIOUS_IMAGE"
	else
		PREVIOUS_IMAGE="$ROLLBACK_TO"
	fi
else
	echo -e "${YELLOW}WARNING: Docker not available${NC}"
	PREVIOUS_IMAGE="$ROLLBACK_TO"
fi

echo ""
echo "Step 2: Stopping current deployment..."

if [ -f "docker-compose.$ENVIRONMENT.yml" ]; then
	docker-compose -f "docker-compose.$ENVIRONMENT.yml" down || true
elif [ -f "docker-compose.yml" ]; then
	docker-compose down || true
else
	echo -e "${YELLOW}WARNING: No docker-compose file found${NC}"
fi

echo ""
echo "Step 3: Rolling back to previous version..."

if [ -n "${PROD_HOST:-}" ] && [ -n "${PROD_USER:-}" ]; then
	echo "Rolling back on remote server: $PROD_HOST"

	ssh "${PROD_USER}@${PROD_HOST}" <<EOF
    cd /opt/omni || exit 1
    docker-compose down
    docker pull $PREVIOUS_IMAGE
    docker-compose up -d
    sleep 5
    curl -f http://localhost:3000/health || exit 1
EOF

	echo -e "${GREEN}Remote rollback completed${NC}"
else
	echo "Rolling back locally..."

	if [ -f "docker-compose.$ENVIRONMENT.yml" ]; then
		docker-compose -f "docker-compose.$ENVIRONMENT.yml" pull
		docker-compose -f "docker-compose.$ENVIRONMENT.yml" up -d
	else
		echo -e "${YELLOW}WARNING: Manual rollback required${NC}"
	fi
fi

echo ""
echo "Step 4: Verifying rollback..."

sleep 10

HEALTH_URL="${SMOKE_TEST_URL:-http://localhost:3000}"
if curl -sf "${HEALTH_URL}/health" | grep -q '"status":"ok"'; then
	echo -e "${GREEN}Health check PASSED${NC}"
else
	echo -e "${RED}Health check FAILED${NC}"
	echo "Manual intervention required"
	exit 1
fi

echo ""
echo "Step 5: Running smoke tests..."

if [ -f "$SCRIPT_DIR/smoke-test.sh" ]; then
	bash "$SCRIPT_DIR/smoke-test.sh" "$ENVIRONMENT"
else
	echo -e "${YELLOW}WARNING: Smoke test script not found${NC}"
fi

echo ""
echo -e "${GREEN}=== ROLLBACK COMPLETED ===${NC}"
echo ""
echo "Next steps:"
echo "1. Verify application functionality"
echo "2. Check logs for errors"
echo "3. Document incident"
echo "4. Investigate root cause"
echo "5. Update deployment gates if needed"
