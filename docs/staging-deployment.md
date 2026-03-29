# Staging Environment Setup

## Overview

Stage environment deployed on **192.168.1.58** using Docker Compose.

## Infrastructure

- **Host**: 192.168.1.58
- **Services**: PostgreSQL 16 + Node.js app
- **Orchestration**: Docker Compose
- **Deployment**: Automated via `deploy-staging.sh`

## Prerequisites

1. Docker and Docker Compose installed on staging server
2. SSH access to 192.168.1.58
3. `.env.staging` configured with production secrets

## Deployment

### Initial Setup

```bash
# 1. Configure secrets in .env.staging
cp .env.staging .env.staging.local
# Edit .env.staging with real DB_PASSWORD and JWT_SECRET

# 2. Deploy
./deploy-staging.sh
```

### Environment Variables

Required in `.env.staging`:

- `DB_PASSWORD` - PostgreSQL password
- `JWT_SECRET` - JWT signing key (min 32 chars)
- `ALLOWED_ORIGINS` - CORS origins

### Deployment Process

The script performs:

1. Build Docker image locally
2. Transfer image to staging server
3. Load and start services via Docker Compose
4. Run database migrations
5. Health check verification

### Access

- **Application**: http://192.168.1.58:3000
- **Health endpoint**: http://192.168.1.58:3000/health

## Operations

### View Logs

```bash
ssh root@192.168.1.58 'cd /opt/omni && docker-compose logs -f'
```

### Restart Services

```bash
ssh root@192.168.1.58 'cd /opt/omni && docker-compose restart'
```

### Rollback

```bash
ssh root@192.168.1.58 'cd /opt/omni && docker-compose down && docker-compose up -d'
```

### Database Access

```bash
ssh root@192.168.1.58 'cd /opt/omni && docker-compose exec postgres psql -U omni -d omni_staging'
```

## Monitoring

### Health Check

```bash
curl http://192.168.1.58:3000/health
```

Expected response:

```json
{ "status": "ok", "timestamp": "2026-03-29T15:05:00.000Z" }
```

### Container Status

```bash
ssh root@192.168.1.58 'cd /opt/omni && docker-compose ps'
```

## Security Notes

- `.env.staging` contains secrets - **never commit to git**
- Change default passwords before deployment
- Use strong JWT_SECRET (32+ random characters)
- Firewall rules should restrict access to staging IP range

## Troubleshooting

### Service won't start

```bash
ssh root@192.168.1.58 'cd /opt/omni && docker-compose logs app'
```

### Database connection issues

```bash
ssh root@192.168.1.58 'cd /opt/omni && docker-compose logs postgres'
```

### Migration failures

```bash
ssh root@192.168.1.58 'cd /opt/omni && docker-compose exec app npm run migrate'
```
