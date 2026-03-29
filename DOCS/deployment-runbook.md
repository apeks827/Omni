# Deployment Runbook

## Pre-Deployment Checklist

- All tests passing in CI
- Security scan clean
- Staging validation complete
- Rollback plan confirmed
- Monitoring dashboards reviewed
- On-call aware of deployment window

## Development Deployment

1. Merge feature branch into `dev`
2. CI runs tests/lint/build
3. Auto-deploy to development environment
4. Verify smoke checks

## Staging Deployment

1. Promote `dev` changes to `staging`
2. CI deploys to staging
3. Run regression, smoke, and performance tests
4. QA validates release candidate

## Production Deployment

1. Approve release from validated staging build
2. Deploy using blue/green or rolling strategy
3. Run production smoke tests
4. Confirm health metrics remain within thresholds
5. Announce successful deployment

## Incident / Rollback

1. Trigger rollback if health or business metrics degrade
2. Restore prior stable version
3. Validate service recovery
4. Open incident follow-up and document lessons learned
