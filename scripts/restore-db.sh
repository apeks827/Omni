#!/bin/bash
set -euo pipefail

ENVIRONMENT="${1:-staging}"
BACKUP_FILE="${2:-}"
SKIP_CONFIRM="${3:-}"

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

if [ "$ENVIRONMENT" = "staging" ]; then
	DEPLOY_HOST="${STAGING_HOST:-192.168.1.58}"
	DEPLOY_USER="${STAGING_USER:-root}"
elif [ "$ENVIRONMENT" = "production" ]; then
	if [ -z "${PROD_HOST:-}" ] || [ -z "${PROD_USER:-}" ]; then
		fail "PROD_HOST and PROD_USER must be set for production restore"
	fi
	DEPLOY_HOST="$PROD_HOST"
	DEPLOY_USER="$PROD_USER"
else
	fail "Unknown environment: $ENVIRONMENT"
fi

DEPLOY_DIR="/opt/omni"
BACKUP_DIR="/opt/omni/backups"

if [ -z "$BACKUP_FILE" ]; then
	echo "Available backups:"
	ssh "$DEPLOY_USER@$DEPLOY_HOST" "ls -lh $BACKUP_DIR/db-backup-${ENVIRONMENT}-*.sql.gz 2>/dev/null" || echo "No backups found"
	echo ""
	echo "Usage: $0 <environment> <backup-file>"
	echo "Example: $0 staging db-backup-staging-20260331_120000.sql.gz"
	exit 1
fi

BACKUP_PATH="$BACKUP_DIR/$BACKUP_FILE"

echo "=== Omni Database Restore ==="
echo "Environment: $ENVIRONMENT"
echo "Backup file: $BACKUP_FILE"
echo ""

if [ "$ENVIRONMENT" = "production" ] && [ "$SKIP_CONFIRM" != "--force" ]; then
	warn "This will overwrite the production database!"
	read -p "Are you sure? Type 'yes' to confirm: " confirm
	if [ "$confirm" != "yes" ]; then
		echo "Restore cancelled"
		exit 1
	fi
fi

echo "Step 1: Verifying backup file exists..."
if ! ssh "$DEPLOY_USER@$DEPLOY_HOST" "test -f $BACKUP_PATH"; then
	fail "Backup file not found: $BACKUP_PATH"
fi
BACKUP_SIZE=$(ssh "$DEPLOY_USER@$DEPLOY_HOST" "stat -f%z '$BACKUP_PATH' 2>/dev/null || stat -c%s '$BACKUP_PATH' 2>/dev/null")
pass "Backup file verified ($BACKUP_SIZE bytes)"

echo ""
echo "Step 2: Creating pre-restore backup..."
PRE_RESTORE_BACKUP="db-pre-restore-${ENVIRONMENT}-$(date +%Y%m%d_%H%M%S).sql.gz"
ssh "$DEPLOY_USER@$DEPLOY_HOST" <<ENDSSH
set -e
cd $DEPLOY_DIR
echo "Creating pre-restore backup..."
docker-compose exec -T postgres pg_dump -U omni | gzip > "$BACKUP_DIR/$PRE_RESTORE_BACKUP"
echo "Pre-restore backup: $PRE_RESTORE_BACKUP"
ENDSSH
pass "Pre-restore backup created"

echo ""
echo "Step 3: Stopping application..."
ssh "$DEPLOY_USER@$DEPLOY_HOST" <<ENDSSH
set -e
cd $DEPLOY_DIR
docker-compose stop app
echo "Application stopped"
ENDSSH
pass "Application stopped"

echo ""
echo "Step 4: Dropping and recreating database..."
ssh "$DEPLOY_USER@$DEPLOY_HOST" <<ENDSSH
set -e
cd $DEPLOY_DIR
echo "Dropping existing database..."
docker-compose exec -T postgres psql -U omni -c "DROP DATABASE IF EXISTS omni_staging;" 2>/dev/null || \
docker-compose exec -T postgres psql -U omni -c "DROP DATABASE IF EXISTS omni_prod;" 2>/dev/null || true

echo "Creating fresh database..."
docker-compose exec -T postgres psql -U omni -c "CREATE DATABASE omni_staging;" 2>/dev/null || \
docker-compose exec -T postgres psql -U omni -c "CREATE DATABASE omni_prod;"
echo "Database prepared"
ENDSSH
pass "Database prepared"

echo ""
echo "Step 5: Restoring from backup..."
ssh "$DEPLOY_USER@$DEPLOY_HOST" <<ENDSSH
set -e
cd $DEPLOY_DIR
echo "Restoring database..."
gunzip -c "$BACKUP_PATH" | docker-compose exec -T postgres psql -U omni
echo "Database restored"
ENDSSH
pass "Database restored"

echo ""
echo "Step 6: Starting application..."
ssh "$DEPLOY_USER@$DEPLOY_HOST" <<ENDSSH
set -e
cd $DEPLOY_DIR
docker-compose up -d app
echo "Application started"
ENDSSH
pass "Application started"

echo ""
echo "Step 7: Running health check..."
sleep 10
HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://$DEPLOY_HOST:3000/health" 2>/dev/null || echo "000")
if [ "$HEALTH_STATUS" = "200" ]; then
	pass "Health check passed"
else
	warn "Health check returned HTTP $HEALTH_STATUS"
fi

echo ""
echo "=== Restore Complete ==="
echo "Environment: $ENVIRONMENT"
echo "Restored from: $BACKUP_FILE"
echo "Pre-restore backup: $PRE_RESTORE_BACKUP"
echo ""
echo "To verify the restore:"
echo "  curl http://$DEPLOY_HOST:3000/api/health"
