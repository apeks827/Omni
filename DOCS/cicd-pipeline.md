# CI/CD Pipeline Configuration

## Overview

This configuration defines the CI/CD pipeline for the three-tier environment strategy using GitHub Actions.

## GitHub Actions Workflows

### Continuous Integration (.github/workflows/ci.yml)

```yaml
name: CI

on:
  push:
    branches: [dev, staging, main]
  pull_request:
    branches: [dev, staging, main]

env:
  NODE_VERSION: '20'
  DATABASE_URL: postgres://localhost:5432/omni_test

jobs:
  lint:
    name: Lint
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      - run: npm ci
      - run: npm run lint

  test:
    name: Test
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_PASSWORD: test_password
          POSTGRES_DB: omni_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      - run: npm ci
      - run: npm run db:migrate
      - run: npm run test
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: test-results
          path: coverage/

  build:
    name: Build
    runs-on: ubuntu-latest
    needs: [lint, test]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-artifact@v4
        with:
          name: dist
          path: dist/
```

### Development Deployment (.github/workflows/deploy-dev.yml)

```yaml
name: Deploy Dev

on:
  push:
    branches: [dev]

jobs:
  deploy:
    name: Deploy to Development
    runs-on: ubuntu-latest
    environment: development
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run build

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1

      - name: Deploy to ECS
        run: |
          aws ecs update-service --cluster omni-dev --service omni-api --force-new-deployment
          aws ecs wait services-stable --cluster omni-dev --services omni-api

  smoke-test:
    name: Smoke Tests
    runs-on: ubuntu-latest
    needs: deploy
    steps:
      - name: Run smoke tests
        run: |
          curl -f https://api.dev.omni.app/health || exit 1
```

### Staging Deployment (.github/workflows/deploy-staging.yml)

```yaml
name: Deploy Staging

on:
  push:
    branches: [staging]

jobs:
  deploy:
    name: Deploy to Staging
    runs-on: ubuntu-latest
    environment: staging
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run build

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1

      - name: Deploy to ECS
        run: |
          aws ecs update-service --cluster omni-staging --service omni-api --force-new-deployment
          aws ecs wait services-stable --cluster omni-staging --services omni-api

  integration-tests:
    name: Integration Tests
    runs-on: ubuntu-latest
    needs: deploy
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run test:integration
        env:
          API_URL: https://api.staging.omni.app
```

### Production Deployment (.github/workflows/deploy-prod.yml)

```yaml
name: Deploy Production

on:
  push:
    branches: [main]
  workflow_dispatch:
    inputs:
      skip_tests:
        description: 'Skip tests (emergency only)'
        required: false
        default: 'false'

jobs:
  approve:
    name: Approval
    runs-on: ubuntu-latest
    environment: production
    steps:
      - run: echo "Production deployment approved"

  deploy:
    name: Deploy to Production
    runs-on: ubuntu-latest
    needs: approve
    environment: production
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run build

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1

      - name: Deploy to ECS
        run: |
          aws ecs update-service --cluster omni-prod --service omni-api --force-new-deployment
          aws ecs wait services-stable --cluster omni-prod --services omni-api

      - name: Store deployment timestamp
        run: echo $(date -u) > deployment_timestamp.txt

      - name: Upload deployment record
        uses: actions/upload-artifact@v4
        with:
          name: deployment-${{ github.sha }}
          path: deployment_timestamp.txt

  smoke-test:
    name: Smoke Tests
    runs-on: ubuntu-latest
    needs: deploy
    steps:
      - name: Run smoke tests
        run: |
          curl -f https://api.omni.app/health || exit 1
          curl -f https://api.omni.app/api/v1/tasks -H "Authorization: Bearer ${{ secrets.SMOKE_TEST_TOKEN }}" || exit 1
```

## Deployment Infrastructure

### AWS ECS Configuration

**Clusters:**

- `omni-dev` - Development cluster
- `omni-staging` - Staging cluster
- `omni-prod` - Production cluster

**Services:**

- `omni-api` - Node.js API service
- `omni-worker` - Background job processor
- `omni-scheduler` - Task scheduling engine

**Task Definitions:**

- Fargate launch type for serverless container management
- 2 vCPU, 4GB memory for API
- 1 vCPU, 2GB memory for workers
- Auto-scaling: 2-10 instances based on CPU/memory metrics

### Database

- Amazon RDS PostgreSQL 16
- Multi-AZ deployment for production
- Automated backups with 30-day retention
- PgBouncer for connection pooling

### Networking

- Application Load Balancer with SSL termination
- CloudFront CDN for static assets
- VPC with public, private, and database subnets
- Security groups limiting access to necessary ports

## Secret Management

Secrets are managed via AWS Secrets Manager with GitHub Actions integration:

| Secret                  | Description                  | Rotation |
| ----------------------- | ---------------------------- | -------- |
| `DATABASE_URL`          | PostgreSQL connection string | 90 days  |
| `JWT_SECRET`            | JWT signing key              | 30 days  |
| `AWS_ACCESS_KEY_ID`     | Deploy credentials           | 90 days  |
| `AWS_SECRET_ACCESS_KEY` | Deploy credentials           | 90 days  |
| `SMTP_PASSWORD`         | Email service password       | 30 days  |
| `OPENAI_API_KEY`        | AI service key               | 90 days  |

**GitHub Actions Integration:**

- Uses `aws-actions/aws-secrets-manager-get-secrets-v2` action
- Secrets fetched at runtime, not stored in environment
- Audit logging via CloudTrail

## Environment Variables

Each environment has its own set of variables:

| Variable       | Dev          | Staging          | Production |
| -------------- | ------------ | ---------------- | ---------- |
| `NODE_ENV`     | development  | staging          | production |
| `LOG_LEVEL`    | debug        | info             | warn       |
| `RATE_LIMIT`   | 1000/hour    | 500/hour         | 100/hour   |
| `CORS_ORIGINS` | localhost:\* | staging.omni.app | omni.app   |

## Notifications

- Development: Slack #dev-deployments
- Staging: Slack #staging-deployments
- Production: Slack #prod-deployments + PagerDuty on failure

## Rollback Capability

Every deployment preserves the ability to rollback:

1. **Automatic rollback on health check failure:**

   ```bash
   aws ecs update-service --cluster omni-prod --service omni-api --task-definition omni-api:PREVIOUS_VERSION
   ```

2. **Manual rollback:**
   - Navigate to ECS service
   - Select previous task definition
   - Force new deployment

3. **Rollback SLA:** Target 60 seconds, maximum 5 minutes
