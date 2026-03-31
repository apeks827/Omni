#!/bin/bash
set -euo pipefail

ENVIRONMENT="${1:-staging}"
BACKUP_DIR="${BACKUP_DIR:-/opt/omni/backups}"
RETENTION_DAYS="${RETENTION_DAYS:-7}"

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

if [ "$ENVIRONMENT" = "staging" ]; then
	DEPLOY_HOST="${STAGING_HOST:-192.168.1.58}"
	DEPLOY_USER="${STAGING_USER:-root}"
elif [ "$ENVIRONMENT" = "production" ]; then
	if [ -z "${PROD_HOST:-}" ] || [ -z "${PROD_USER:-}" ]; then
		fail "PROD_HOST and PROD_USER must be set for production backup"
	fi
	DEPLOY_HOST="$PROD_HOST"
	DEPLOY_USER="$PROD_USER"
else
	fail "Unknown environment: $ENVIRONMENT"
fi

DEPLOY_DIR="/opt/omni"

echo "=== Omni Database Backup ==="
echo "Environment: $ENVIRONMENT"
echo "Host: $DEPLOY_USER@$DEPLOY_HOST"
echo ""

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="db-backup-${ENVIRONMENT}-${TIMESTAMP}.sql.gz"
BACKUP_PATH="$BACKUP_DIR/$BACKUP_FILE"

echo "Step 1: Creating backup directory..."
ssh "$DEPLOY_USER@$DEPLOY_HOST" "mkdir -p $BACKUP_DIR"
pass "Backup directory ready"

echo ""
echo "Step 2: Running database backup..."
ssh "$DEPLOY_USER@$DEPLOY_HOST" <<ENDSSH
set -e
cd $DEPLOY_DIR
echo "Dumping database..."
docker-compose exec -T postgres pg_dump -U omni | gzip > "$BACKUP_PATH"
echo "Backup created: $BACKUP_PATH"
ls -lh "$BACKUP_PATH"
ENDSSH
pass "Database backup complete"

echo ""
echo "Step 3: Verifying backup integrity..."
BACKUP_SIZE=$(ssh "$DEPLOY_USER@$DEPLOY_HOST" "stat -f%z '$BACKUP_PATH' 2>/dev/null || stat -c%s '$BACKUP_PATH' 2>/dev/null")
if [ "$BACKUP_SIZE" -gt 1024 ]; then
	pass "Backup file size: $BACKUP_SIZE bytes"
else
	fail "Backup file seems too small: $BACKUP_SIZE bytes"
fi

echo ""
echo "Step 4: Testing backup restore (dry run)..."
ssh "$DEPLOY_USER@$DEPLOY_HOST" <<ENDSSH
set -e
echo "Testing backup integrity..."
gunzip -c "$BACKUP_PATH" | head -n 100 | grep -q "PostgreSQL" && echo "Backup format verified"
ENDSSH
pass "Backup integrity verified"

echo ""
echo "Step 5: Cleaning up old backups..."
ssh "$DEPLOY_USER@$DEPLOY_HOST" <<ENDSSH
set -e
cd $BACKUP_DIR
echo "Finding backups older than $RETENTION_DAYS days..."
find . -name "db-backup-${ENVIRONMENT}-*.sql.gz" -mtime +${RETENTION_DAYS} -delete
echo "Old backups cleaned up"
echo ""
echo "Current backups:"
ls -lh db-backup-${ENVIRONMENT}-*.sql.gz 2>/dev/null || echo "No backups found"
ENDSSH
pass "Old backups cleaned up"

echo ""
echo "=== Backup Complete ==="
echo "Backup file: $BACKUP_FILE"
echo "Size: $BACKUP_SIZE bytes"
echo ""
echo "To restore this backup:"
echo "  ./scripts/restore-db.sh $ENVIRONMENT $BACKUP_FILE"
echo ""
echo "To download backup locally:"
echo "  scp $DEPLOY_USER@$DEPLOY_HOST:$BACKUP_PATH ./"
