# Deployment Guide

## Overview

This document describes the deployment process for Omni, including CI/CD pipelines, environment configuration, and rollback procedures.

## Environments

### Development

- Local development environment
- Database: Local PostgreSQL instance
- No automated deployments

### Staging

- Pre-production environment for testing
- Automatically deploys on merge to `main` branch
- Database: Staging PostgreSQL instance
- URL: Configure via `STAGING_URL` secret

### Production

- Live production environment
- Manual deployment trigger (future: automated with approval gates)
- Database: Production PostgreSQL instance
- URL: Production domain

## CI/CD Pipeline

### Continuous Integration (CI)

Triggered on: Pull requests and pushes to `main`

**Pipeline steps:**

1. Install dependencies (`npm ci`)
2. Format check (`npm run format:check`)
3. Lint (`npm run lint`)
4. Type check (`npm run typecheck`)
5. Build client (`npm run build`)
6. Build server (`npm run server:build`)
7. Setup PostgreSQL test database
8. Run database migrations
9. Run tests (`npm run test:run`)

**Configuration:** `.github/workflows/ci.yml`

### Continuous Deployment (CD)

Triggered on: Push to `main` branch

**Pipeline steps:**

1. Install dependencies
2. Build client and server
3. Run database migrations on staging
4. Deploy to staging server
5. Health check verification
6. Deployment notification

**Configuration:** `.github/workflows/deploy-staging.yml`

## Environment Variables

### Required Secrets (GitHub Actions)

**Staging:**

- `STAGING_DB_HOST` - Database host
- `STAGING_DB_PORT` - Database port (default: 5432)
- `STAGING_DB_NAME` - Database name
- `STAGING_DB_USER` - Database user
- `STAGING_DB_PASSWORD` - Database password
- `STAGING_HOST` - Deployment target host
- `STAGING_USER` - SSH user for deployment
- `STAGING_SSH_KEY` - SSH private key for deployment
- `STAGING_URL` - Staging application URL (for health checks)

**Production:**

- `PROD_DB_HOST`
- `PROD_DB_PORT`
- `PROD_DB_NAME`
- `PROD_DB_USER`
- `PROD_DB_PASSWORD`
- `PROD_HOST`
- `PROD_USER`
- `PROD_SSH_KEY`
- `PROD_URL`

### Application Environment Variables

Required in `.env` file on deployment targets:

```bash
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=omni
DB_USER=postgres
DB_PASSWORD=<secure_password>

# Application
JWT_SECRET=<secure_random_string>
PORT=3000
NODE_ENV=production

# CORS (production only)
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

## Database Migrations

### Automated Migration

Migrations run automatically during deployment via `npm run migrate`.

The migration script:

- Tracks applied migrations in `schema_migrations` table
- Runs migrations in alphabetical order
- Skips already-applied migrations
- Uses transactions for safety (rollback on failure)

### Manual Migration

To run migrations manually on a server:

```bash
# SSH into the server
ssh user@server

# Navigate to application directory
cd /path/to/omni

# Run migrations
npm run migrate
```

### Creating New Migrations

1. Create a new SQL file in `migrations/` directory
2. Use sequential numbering: `17_description.sql`
3. Write idempotent SQL when possible
4. Test locally before committing

## Rollback Procedures

### Application Rollback

**Time target: < 5 minutes**

#### Option 1: Revert via Git (Recommended)

```bash
# 1. Identify the last working commit
git log --oneline

# 2. Revert to previous commit
git revert <commit-hash>

# 3. Push revert commit
git push origin main

# 4. Deployment pipeline will automatically deploy the reverted version
```

#### Option 2: Manual Rollback

```bash
# 1. SSH into the server
ssh user@server

# 2. Navigate to application directory
cd /path/to/omni

# 3. Checkout previous working commit
git checkout <previous-commit-hash>

# 4. Rebuild application
npm ci
npm run build
npm run server:build

# 5. Restart application
pm2 restart omni
# OR
systemctl restart omni
```

### Database Rollback

**Warning:** Database rollbacks are more complex and risky.

#### Before Migration Rollback

1. **Backup the database:**

   ```bash
   pg_dump -h localhost -U postgres -d omni > backup_$(date +%Y%m%d_%H%M%S).sql
   ```

2. **Document current state:**
   ```bash
   psql -h localhost -U postgres -d omni -c "SELECT * FROM schema_migrations ORDER BY version;"
   ```

#### Rolling Back a Migration

```bash
# 1. Connect to database
psql -h localhost -U postgres -d omni

# 2. Begin transaction
BEGIN;

# 3. Manually reverse the migration changes
# (Write reverse SQL based on the migration file)

# 4. Remove migration record
DELETE FROM schema_migrations WHERE version = '17_problematic_migration.sql';

# 5. Commit if successful, rollback if issues
COMMIT;
# OR
ROLLBACK;
```

#### Database Restore from Backup

```bash
# 1. Stop application
pm2 stop omni

# 2. Drop and recreate database
psql -h localhost -U postgres -c "DROP DATABASE omni;"
psql -h localhost -U postgres -c "CREATE DATABASE omni;"

# 3. Restore from backup
psql -h localhost -U postgres -d omni < backup_file.sql

# 4. Restart application
pm2 start omni
```

## Health Checks

### Endpoint

`GET /health`

**Healthy response (200):**

```json
{
  "status": "ok",
  "timestamp": "2026-03-29T14:58:10.409Z"
}
```

**Unhealthy response (503):**

```json
{
  "status": "error",
  "error": "Connection refused"
}
```

### Monitoring

The health check endpoint:

- Verifies database connectivity
- Returns 503 if database is unreachable
- Includes timestamp for debugging

Use this endpoint for:

- Load balancer health checks
- Uptime monitoring (e.g., UptimeRobot, Pingdom)
- Post-deployment verification
- Automated alerting

## Deployment Checklist

### Pre-Deployment

- [ ] All tests pass locally
- [ ] Code reviewed and approved
- [ ] Database migrations tested locally
- [ ] Environment variables configured
- [ ] Backup current production database
- [ ] Notify team of deployment window

### During Deployment

- [ ] Monitor CI/CD pipeline
- [ ] Watch application logs
- [ ] Verify health check passes
- [ ] Test critical user flows
- [ ] Monitor error rates

### Post-Deployment

- [ ] Verify all features work as expected
- [ ] Check database migration status
- [ ] Monitor performance metrics
- [ ] Watch for error spikes
- [ ] Update deployment log
- [ ] Notify team of completion

### Rollback Decision Criteria

Initiate rollback if:

- Health check fails after deployment
- Error rate increases > 5%
- Critical feature is broken
- Database migration fails
- Performance degrades significantly

## Troubleshooting

### Deployment Fails

1. Check GitHub Actions logs
2. Verify all secrets are configured
3. Ensure server is accessible via SSH
4. Check disk space on target server
5. Verify database credentials

### Migration Fails

1. Check migration SQL syntax
2. Verify database connectivity
3. Check for conflicting schema changes
4. Review migration logs
5. Restore from backup if needed

### Health Check Fails

1. Check database connectivity
2. Verify environment variables
3. Check application logs
4. Ensure PostgreSQL is running
5. Verify network connectivity

## Future Enhancements

- [ ] Blue-green deployments
- [ ] Canary releases
- [ ] Automated performance testing
- [ ] Database migration preview/dry-run
- [ ] Automated rollback on failure detection
- [ ] Deployment approval gates for production
- [ ] Slack/email deployment notifications
- [ ] Deployment metrics dashboard
