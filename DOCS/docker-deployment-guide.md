# Docker Deployment Guide

## Overview

This guide consolidates Docker deployment patterns from legacy architecture with current implementation, providing a comprehensive deployment checklist for all environments.

## Current Docker Setup

### Multi-Stage Build (Dockerfile)

- **Builder stage**: Node.js 20 Alpine, installs dependencies, builds client and server
- **Runtime stage**: Node.js 20 Alpine, production dependencies only, includes migrations
- **Health check**: HTTP GET to `/health` endpoint (30s interval, 3s timeout, 3 retries)
- **Exposed port**: 3000

### Environment Configurations

#### Staging (docker-compose.staging.yml)

**PostgreSQL Service:**

- Image: `postgres:16-alpine`
- Database: `omni_staging`
- Health check: `pg_isready` (10s interval, 5s timeout, 5 retries)
- Volume: `postgres_data` for persistence
- Restart policy: `unless-stopped`

**Application Service:**

- Build: Local Dockerfile
- Image tag: `omni:staging`
- Port: 3000
- Depends on: PostgreSQL (waits for healthy status)
- Health check: HTTP GET to `/health` (30s interval, 10s timeout, 3 retries, 40s start period)
- Restart policy: `unless-stopped`
- Environment variables: `NODE_ENV=production`, database connection, JWT secret, CORS origins

#### Production (docker-compose.prod.yml)

**PostgreSQL Service:**

- Image: `postgres:16-alpine`
- Health check: `pg_isready` (10s interval, 5s timeout, 5 retries)
- Volume: `postgres_data_prod` for persistence
- Resource limits: 512M max, 256M reserved
- Restart policy: `unless-stopped`

**Application Service:**

- Image: Registry-based (e.g., `ghcr.io/omni/omni:latest`)
- Port: 3000
- Depends on: PostgreSQL (waits for healthy status)
- Health check: HTTP GET to `/health` (30s interval, 10s timeout, 3 retries, 40s start period)
- Resource limits: 1G max, 512M reserved
- Restart policy: `on-failure` (5s delay, 3 max attempts, 120s window)

**NGINX Service:**

- Image: `nginx:alpine`
- Ports: 80, 443
- Configuration: Mounted from `./nginx.conf`
- Depends on: Application service
- Health check: `nginx -t` (30s interval, 10s timeout, 3 retries)
- Restart policy: `unless-stopped`

## Legacy Architecture Patterns

From `archive/architecture_legacy.md`:

### Deployment Strategy Components

1. **Containerization**: Docker-based deployment ✓ (Implemented)
2. **Environment-specific configurations**: ✓ (Implemented via docker-compose files)
3. **Automated testing in CI pipeline**: ⚠️ (Documented in DOCS/cicd-pipeline.md, needs verification)
4. **Blue-green deployment approach**: ⚠️ (Documented in DOCS/rollback.md, not yet implemented)
5. **Health checks and monitoring**: ✓ (Implemented in Docker configs)
6. **Backup and recovery procedures**: ⚠️ (Needs implementation)

## Deployment Checklist

### Pre-Deployment

- [ ] All tests pass in CI pipeline
- [ ] Environment variables configured and validated
- [ ] Database migrations reviewed and tested
- [ ] Health check endpoints verified
- [ ] Rollback plan documented
- [ ] Monitoring and alerting configured
- [ ] Backup procedures verified

### Deployment Steps

#### Staging Deployment

```bash
# 1. Pull latest code
git checkout staging
git pull origin staging

# 2. Build and start services
docker-compose -f docker-compose.staging.yml build
docker-compose -f docker-compose.staging.yml up -d

# 3. Verify health
docker-compose -f docker-compose.staging.yml ps
curl http://localhost:3000/health

# 4. Check logs
docker-compose -f docker-compose.staging.yml logs -f app

# 5. Run smoke tests
npm run test:smoke
```

#### Production Deployment

```bash
# 1. Tag and push image to registry
docker build -t ghcr.io/omni/omni:${VERSION} .
docker push ghcr.io/omni/omni:${VERSION}

# 2. Update production environment
export IMAGE_TAG=${VERSION}
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d

# 3. Verify health
docker-compose -f docker-compose.prod.yml ps
curl http://localhost:3000/health

# 4. Monitor metrics
# Check Grafana dashboards, error rates, latency

# 5. Validate business metrics
# Confirm critical user flows working
```

### Post-Deployment

- [ ] Health checks passing
- [ ] Application logs show no errors
- [ ] Database connections stable
- [ ] Response times within SLA
- [ ] Error rates below threshold (< 1%)
- [ ] Business metrics validated
- [ ] Monitoring dashboards reviewed

## Health Check Configuration

All services implement health checks:

**Application Health Check:**

- Endpoint: `GET /health`
- Expected response: HTTP 200
- Interval: 30s
- Timeout: 10s
- Retries: 3
- Start period: 40s (allows for initialization)

**Database Health Check:**

- Command: `pg_isready -U ${DB_USER}`
- Interval: 10s
- Timeout: 5s
- Retries: 5

**NGINX Health Check:**

- Command: `nginx -t`
- Interval: 30s
- Timeout: 10s
- Retries: 3

## Environment-Specific Configurations

### Development

- Fast iteration, verbose logging
- No resource limits
- Local volumes for hot-reload

### Staging

- Production parity
- Same resource constraints as production
- Full monitoring enabled
- Test data seeding available

### Production

- Resource limits enforced (1G app, 512M DB)
- Registry-based images (no local builds)
- NGINX reverse proxy for SSL termination
- Automated restart policies
- Full observability stack

## Backup and Recovery

### Database Backups

**Automated Backups:**

```bash
# Daily backup script (should be in cron)
docker exec omni-postgres-prod pg_dump -U ${DB_USER} ${DB_NAME} | gzip > backup_$(date +%Y%m%d).sql.gz
```

**Restore Procedure:**

```bash
# Stop application
docker-compose -f docker-compose.prod.yml stop app

# Restore database
gunzip -c backup_YYYYMMDD.sql.gz | docker exec -i omni-postgres-prod psql -U ${DB_USER} ${DB_NAME}

# Restart application
docker-compose -f docker-compose.prod.yml start app
```

### Volume Backups

```bash
# Backup PostgreSQL data volume
docker run --rm -v postgres_data_prod:/data -v $(pwd):/backup alpine tar czf /backup/postgres_data_backup.tar.gz /data
```

## Rollback Procedures

### Quick Rollback (Blue-Green)

**Not yet implemented** - See DOCS/rollback.md for planned implementation.

### Version Rollback

```bash
# 1. Identify previous working version
export PREVIOUS_VERSION=v1.2.3

# 2. Deploy previous version
export IMAGE_TAG=${PREVIOUS_VERSION}
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d

# 3. Verify health
curl http://localhost:3000/health

# 4. Monitor for stability
docker-compose -f docker-compose.prod.yml logs -f app
```

### Emergency Rollback

```bash
# Stop all services
docker-compose -f docker-compose.prod.yml down

# Restore from backup if needed
# (see Backup and Recovery section)

# Start with previous configuration
git checkout ${PREVIOUS_COMMIT}
docker-compose -f docker-compose.prod.yml up -d
```

## Gaps and Recommendations

### Implemented ✓

1. Docker containerization with multi-stage builds
2. Environment-specific configurations (staging, production)
3. Health checks for all services
4. Restart policies for resilience
5. Resource limits in production
6. Database persistence with volumes

### Needs Implementation ⚠️

1. **Blue-Green Deployment**
   - Current: Direct deployment with restart
   - Needed: Load balancer with traffic switching
   - Benefit: Zero-downtime deployments, instant rollback

2. **Automated Backup System**
   - Current: Manual backup procedures documented
   - Needed: Automated daily backups with retention policy
   - Benefit: Data protection, disaster recovery

3. **CI/CD Integration**
   - Current: Manual deployment scripts
   - Needed: GitHub Actions or similar for automated deployments
   - Benefit: Consistent deployments, reduced human error

4. **Monitoring Stack**
   - Current: Health checks only
   - Needed: Prometheus + Grafana + AlertManager
   - Benefit: Proactive issue detection, performance insights

5. **Secret Management**
   - Current: Environment variables in .env files
   - Needed: Vault or similar secret management
   - Benefit: Secure credential rotation, audit trail

6. **Database Migration Automation**
   - Current: Migrations included in image
   - Needed: Automated migration execution with rollback support
   - Benefit: Safe schema changes, version control

## Next Steps

1. Implement automated backup system with retention policy
2. Set up blue-green deployment infrastructure
3. Configure monitoring stack (Prometheus/Grafana)
4. Integrate CI/CD pipeline with GitHub Actions
5. Implement secret management solution
6. Document and test disaster recovery procedures
