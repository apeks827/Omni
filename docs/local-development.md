# Local Development Setup

## Overview

This guide covers setting up a local development environment for Omni task manager. The application consists of a Node.js backend and React frontend.

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL 16 (or Docker)
- Git
- SSH access to staging server (for shared resources)

## Repository Setup

```bash
# Clone the repository
git clone https://github.com/apeks827/Omni.git
cd Omni

# Install dependencies
npm install
```

## Environment Configuration

1. Copy the example environment file:

```bash
cp .env.example .env
```

2. Configure the following variables in `.env`:

| Variable          | Description                    | Example                                          |
| ----------------- | ------------------------------ | ------------------------------------------------ |
| `DATABASE_URL`    | PostgreSQL connection string   | `postgresql://user:pass@localhost:5432/omni_dev` |
| `JWT_SECRET`      | JWT signing key (min 32 chars) | `your-secret-key-here`                           |
| `ALLOWED_ORIGINS` | CORS allowed origins           | `http://localhost:5173`                          |

## Database Setup

### Option 1: Local PostgreSQL

1. Install PostgreSQL 16 locally
2. Create the database:

```bash
createdb omni_dev
```

3. Run migrations:

```bash
npm run migrate
```

### Option 2: Docker

```bash
docker run -d \
  --name omni-postgres \
  -e POSTGRES_DB=omni_dev \
  -e POSTGRES_USER=omni \
  -e POSTGRES_PASSWORD=dev_password \
  -p 5432:5432 \
  postgres:16
```

## Running Development Servers

### Backend Server

```bash
npm run server
```

The API will be available at `http://localhost:3000`.

### Frontend Development Server

```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`.

## Quality Checks

Before committing, run these checks:

```bash
# Type check
npm run typecheck

# Lint
npm run lint

# Build
npm run build
npm run server:build
```

## Common Tasks

### Running Tests

```bash
npm test
```

### Database Migrations

```bash
# Run pending migrations
npm run migrate

# Create new migration
npm run migrate:create -- --name add_new_table
```

### Reset Database

```bash
# Drop and recreate
npm run migrate:reset
```

## Troubleshooting

### Port Already in Use

```bash
# Find and kill the process using the port
lsof -i :3000  # for backend
lsof -i :5173  # for frontend
```

### Database Connection Issues

1. Verify PostgreSQL is running
2. Check `DATABASE_URL` in `.env`
3. Ensure database exists

### Dependency Issues

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

## Network Access

For accessing staging resources during development:

```bash
# SSH to staging server
ssh claw@192.168.1.58
```

Note: Ensure you're on the 192.168.1.x network range for staging access.

## Additional Resources

- [CONTRIBUTING.md](../CONTRIBUTING.md) - Git workflow and code standards
- [docs/staging-deployment.md](./staging-deployment.md) - Staging environment details
