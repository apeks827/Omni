# Legacy Architecture Snapshot for Omni Task Manager

## Overview

Omni is a task management system designed to be the best in the world. This document outlines the technical architecture for Phase 1 implementation.

## Tech Stack

- **Backend**: Node.js with Express framework
- **Database**: PostgreSQL for relational data
- **Frontend**: React with TypeScript
- **Authentication**: JWT-based authentication system
- **Testing**: Jest for unit tests, Cypress for end-to-end tests
- **Deployment**: Docker containers with CI/CD pipeline

**Note**: This legacy document referenced Redis for caching/session storage, but Redis was never implemented in the actual codebase.

## Database Schema

### Users Table

- id (UUID, primary key)
- email (VARCHAR, unique, not null)
- password_hash (VARCHAR, not null)
- name (VARCHAR)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

### Tasks Table

- id (UUID, primary key)
- title (VARCHAR, not null)
- description (TEXT)
- status (ENUM: todo, in_progress, done)
- priority (ENUM: low, medium, high, critical)
- project_id (UUID, foreign key)
- assignee_id (UUID, foreign key)
- creator_id (UUID, foreign key)
- due_date (TIMESTAMP)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

### Projects Table

- id (UUID, primary key)
- name (VARCHAR, not null)
- description (TEXT)
- owner_id (UUID, foreign key)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

### Labels Table

- id (UUID, primary key)
- name (VARCHAR, not null)
- color (VARCHAR)
- project_id (UUID, foreign key)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

### Task_Labels Junction Table

- task_id (UUID, foreign key)
- label_id (UUID, foreign key)

## API Structure

### Authentication Endpoints

- POST /api/auth/login
- POST /api/auth/register
- POST /api/auth/logout
- GET /api/auth/me

### User Endpoints

- GET /api/users/:id
- PUT /api/users/:id
- DELETE /api/users/:id

### Task Endpoints

- GET /api/tasks
- GET /api/tasks/:id
- POST /api/tasks
- PUT /api/tasks/:id
- DELETE /api/tasks/:id

### Project Endpoints

- GET /api/projects
- GET /api/projects/:id
- POST /api/projects
- PUT /api/projects/:id
- DELETE /api/projects/:id

### Label Endpoints

- GET /api/labels
- GET /api/labels/:id
- POST /api/labels
- PUT /api/labels/:id
- DELETE /api/labels/:id

## Deployment Strategy

- Containerized with Docker
- Environment-specific configurations
- Automated testing in CI pipeline
- Blue-green deployment approach
- Health checks and monitoring
- Backup and recovery procedures
