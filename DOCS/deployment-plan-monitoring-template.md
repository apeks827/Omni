# Deployment Plan + Monitoring

## Overview

- **Deployment Strategy:** Blue/Green (preferred) or Rolling Update
- **Target Environment:** [Stage / Production]
- **Release Version:** [version/commit-hash]

## Pre-Deployment Steps

- [ ] Code is reviewed and merged to staging/main
- [ ] Database migrations are reviewed (Rollback scripts verified)
- [ ] Secrets/Environment variables are updated

## Deployment Procedure

1. ...
2. ...

## Rollback Plan

- **Trigger:** Error Rate > X%, Latency > Ys, or explicit command failure
- **Action:** Revert to previous build/container image and run rollback migration if necessary

## Monitoring & Observability

- **Key Metrics:** Request rate, Error rate, Latency, Resource utilization
- **Logging:** Verify logs are aggregated and alerts are set for critical errors
- **Alerting:** PagerDuty/Slack notification on critical failures
