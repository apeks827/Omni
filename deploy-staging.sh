#!/bin/bash
set -e

STAGING_HOST="192.168.1.58"
STAGING_USER="${STAGING_USER:-root}"
DEPLOY_DIR="/opt/omni"

echo "=== Omni Staging Deployment ==="
echo "Target: $STAGING_USER@$STAGING_HOST"
echo "Deploy directory: $DEPLOY_DIR"
echo ""

if [ ! -f ".env.staging" ]; then
	echo "ERROR: .env.staging not found"
	exit 1
fi

echo "Step 1: Building Docker image locally..."
docker build -t omni:staging .

echo ""
echo "Step 2: Saving Docker image..."
docker save omni:staging | gzip >omni-staging.tar.gz

echo ""
echo "Step 3: Copying files to staging server..."
ssh "$STAGING_USER@$STAGING_HOST" "mkdir -p $DEPLOY_DIR"
scp omni-staging.tar.gz "$STAGING_USER@$STAGING_HOST:$DEPLOY_DIR/"
scp docker-compose.staging.yml "$STAGING_USER@$STAGING_HOST:$DEPLOY_DIR/docker-compose.yml"
scp .env.staging "$STAGING_USER@$STAGING_HOST:$DEPLOY_DIR/.env"

echo ""
echo "Step 4: Loading image and starting services on staging..."
ssh "$STAGING_USER@$STAGING_HOST" <<'ENDSSH'
cd /opt/omni
docker load < omni-staging.tar.gz
rm omni-staging.tar.gz
docker-compose down
docker-compose up -d
echo "Waiting for services to start..."
sleep 15
docker-compose ps
ENDSSH

echo ""
echo "Step 5: Running database migrations..."
ssh "$STAGING_USER@$STAGING_HOST" <<'ENDSSH'
cd /opt/omni
docker-compose exec -T app npm run migrate
ENDSSH

echo ""
echo "Step 6: Health check..."
sleep 5
HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://$STAGING_HOST:3000/health || echo "000")

if [ "$HEALTH_STATUS" = "200" ]; then
	echo "✓ Deployment successful!"
	echo "✓ Application is healthy at http://$STAGING_HOST:3000"
else
	echo "✗ Health check failed (HTTP $HEALTH_STATUS)"
	echo "Check logs with: ssh $STAGING_USER@$STAGING_HOST 'cd $DEPLOY_DIR && docker-compose logs'"
	exit 1
fi

echo ""
echo "Cleaning up local artifacts..."
rm omni-staging.tar.gz

echo ""
echo "=== Deployment Complete ==="
echo "Access URL: http://$STAGING_HOST:3000"
echo "View logs: ssh $STAGING_USER@$STAGING_HOST 'cd $DEPLOY_DIR && docker-compose logs -f'"
echo "Rollback: ssh $STAGING_USER@$STAGING_HOST 'cd $DEPLOY_DIR && docker-compose down && docker-compose up -d'"
