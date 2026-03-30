# Omni: The Personal COO

Omni is an AI-first personal operating system that transforms the chaos of tasks, habits, and routines into an optimized, adaptive Flow.

## Overview

The product direction is a "Personal COO": the user provides intent, and Omni handles classification, prioritization, scheduling, and explanation. This repository contains the foundational implementation of that vision, with ongoing work toward the full target architecture.

### Product Direction

- **Zero-Friction Input**: Accept natural-language intentions instead of rigid manual task entry.
- **Fluid Calendar**: Continuously rebalance the day around priority, context, and energy.
- **Context Awareness**: Use signals like device, location, and routines to shape execution.
- **Transparency Engine**: Explain why something is scheduled now and what changed.

## Current Repository Stack

- **Backend**: Node.js with Express
- **Frontend**: React with TypeScript
- **Database**: PostgreSQL
- **Authentication**: JWT-based
- **Testing/Tooling**: TypeScript, ESLint, Prettier, Vite

## Target Architecture

The canonical target architecture is documented in [architecture.md](./architecture.md). It covers the planned scheduling engine, context services, explainability layer, and future infrastructure such as vector search.

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL

### Installation

1. Clone the repository:

   ```bash
   git clone <repository-url>
   cd Omni
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Set up environment variables:

   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. Set up the database:

   ```bash
   # Run migrations
   npm run migrate
   ```

5. Start the development servers:

   Terminal 1:

   ```bash
   npm run server
   ```

   Terminal 2:

   ```bash
   npm run dev
   ```

## Development

See [CONTRIBUTING.md](./CONTRIBUTING.md) for detailed information about the development workflow, branching strategy, and code standards.

## Scripts

- `npm run dev` - Start client development server
- `npm run build` - Build client for production
- `npm run server` - Start server in watch mode
- `npm run server:build` - Compile server TypeScript
- `npm run typecheck` - Type check the codebase
- `npm run test:run` - Run the test suite
- `npm run migrate` - Run pending database migrations

## Deployment

Deployment automation is documented in [docs/deployment.md](./docs/deployment.md). It covers CI/CD, staging deployment, required secrets, health checks, and rollback procedures.

## Project Structure

```
src/
├── config/          # Configuration files
├── middleware/      # Express middleware
├── models/          # Database models
├── routes/          # API route handlers
├── services/        # Business logic
└── server.ts        # Application entry point
```

## Contributing

We welcome contributions! Please read [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines on how to contribute to this project.

## Additional Documentation

- [Architecture](./architecture.md)
- [Competitive Analysis Report](./competitive_analysis_report.md)
- [Phase 1 Report](./phase_1_report.md)

## License

This project is licensed under the ISC License.
