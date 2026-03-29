# Deploy Strategy

## Overview

This project uses a three-tier environment strategy to support safe, continuous delivery:

- **Development (`dev/`)**: Active development, feature branches, frequent commits
- **Staging (`staging/`)**: QA/testing, mirrors production configuration
- **Production (`prod/`)**: Stable live environment with manual promotion

## Branching Model

- `dev`: integration branch for active development
- `staging`: release candidate branch for QA
- `main`/`prod`: production branch for stable releases
- `feature/*`: short-lived branches created from `dev`

## Promotion Flow

1. Developers branch from `dev`
2. Merge completed work into `dev`
3. CI validates and deploys `dev`
4. Promote to `staging` for QA and validation
5. After approval, manually promote to `prod`

## Deployment Controls

- Automated tests run on every change
- Staging must maintain parity with production
- Production deployments require validation and manual approval
- Rollback path must be documented before each release
