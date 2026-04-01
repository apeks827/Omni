# API Performance Benchmarks

## Overview

This document defines performance targets, benchmarking procedures, and baseline results for the Omni task manager API.

## Performance Targets

| Endpoint              | Target Latency (avg) | Target Latency (p99) |
| --------------------- | -------------------- | -------------------- |
| GET /api/tasks (list) | <50ms                | <100ms               |
| GET /api/tasks/:id    | <100ms               | <200ms               |
| POST /api/tasks       | <200ms               | <400ms               |
| PATCH /api/tasks/:id  | <150ms               | <300ms               |
| DELETE /api/tasks/:id | <100ms               | <200ms               |
| GET /api/projects     | <50ms                | <100ms               |
| GET /api/goals        | <50ms                | <100ms               |

## Load Test Scenarios

### 1. Single User Operations

- **Connections**: 10 concurrent
- **Duration**: 10 seconds
- **Purpose**: Baseline performance under normal load

### 2. Concurrent Users (100)

- **Connections**: 100 concurrent
- **Duration**: 30 seconds
- **Purpose**: Simulate typical production load

### 3. Stress Test (10x Normal)

- **Connections**: 100 concurrent
- **Pipelining**: 10 requests per connection
- **Duration**: 30 seconds
- **Purpose**: Identify breaking points and degradation patterns

## Running Benchmarks

### Prerequisites

```bash
npm install autocannon
```

### Setup

1. Start the server:

```bash
npm run server
```

2. Get an auth token:

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your@email.com","password":"yourpassword"}'
```

3. Run benchmarks:

```bash
AUTH_TOKEN=<your-token> node benchmarks/api-load-test.js
```

### Database Benchmark

Run the database-level benchmark:

```bash
npm run benchmark:db
```

## Baseline Results

### Environment

- **Date**: 2026-03-30
- **Hardware**: [To be filled after first run]
- **Database**: PostgreSQL 14+
- **Node**: v22.22.1

### Results

[To be filled after first benchmark run]

## Performance Optimization History

### 2026-03-30: Initial Optimizations (OMN-636)

- Added database indexes for common queries
- Implemented query optimization in task service
- Refactored routes to use service layer (OMN-646, OMN-647)

## Monitoring

### Key Metrics

- **Response Time**: Track p50, p95, p99 latencies
- **Throughput**: Requests per second
- **Error Rate**: Failed requests / total requests
- **Database Query Time**: Slow query log (>100ms)

### Alerts

- p99 latency >500ms for any endpoint
- Error rate >1%
- Database connection pool exhaustion

## Performance Troubleshooting

See [performance-runbook.md](./performance-runbook.md) for detailed troubleshooting procedures.
