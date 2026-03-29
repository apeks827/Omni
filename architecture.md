# Omni Target Architecture

## Overview

This document proposes the technical architecture for Omni, a personal operating system that transforms tasks, habits, and routines into an optimized flow. The architecture is designed to support intelligent scheduling, context awareness, and real-time adaptivity while maintaining transparency and user control.

## Architecture Principles

1. **AI-First Design**: Built from the ground up to support intelligent automation and decision-making
2. **Real-Time Adaptivity**: System responds immediately to changes in user behavior and context
3. **Privacy by Design**: User data remains secure with opt-in contextual features
4. **Scalability**: Architecture supports growth from single-user MVP to multi-tenant platform
5. **Transparency**: All system decisions are explainable and auditable

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                          │
│  (React + TypeScript, Mobile Apps, Browser Extensions)      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      API Gateway Layer                       │
│         (Express.js, Rate Limiting, Authentication)          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Application Services                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Intent     │  │  Scheduling  │  │   Context    │      │
│  │  Processing  │  │    Engine    │  │   Service    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Transparency │  │ Notification │  │ Integration  │      │
│  │    Engine    │  │   Service    │  │   Service    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                       Data Layer                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  PostgreSQL  │  │    Redis     │  │  Vector DB   │      │
│  │  (Primary)   │  │   (Cache)    │  │  (Embeddings)│      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   External Services                          │
│  (Calendar APIs, Location Services, ML Models, Webhooks)    │
└─────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. Intent Processing Service

**Purpose**: Parse and understand user inputs to classify them as tasks, habits, or routines.

**Technology Stack**:

- NLP Engine: OpenAI GPT-4 or similar LLM for intent classification
- Entity Extraction: Custom models for extracting dates, priorities, contexts
- Fallback: Rule-based parser for offline/low-latency scenarios

**Key Responsibilities**:

- Parse natural language input
- Extract entities (due dates, priorities, contexts, categories)
- Classify intent type (task, habit, routine)
- Infer urgency and importance from text and user history

### 2. Scheduling Engine

**Purpose**: Dynamically allocate time slots for tasks, habits, and routines based on priorities, user patterns, and context.

**Technology Stack**:

- Algorithm: Constraint satisfaction with machine learning optimization
- Real-Time Processing: Event-driven architecture with message queues
- Prediction Models: Time-series forecasting for task duration and energy levels

**Key Responsibilities**:

- Generate optimal daily schedules
- Adjust schedules in real-time based on user behavior
- Balance tasks, habits, and routines
- Respect user-defined constraints and preferences
- Learn from historical completion patterns

### 3. Context Service

**Purpose**: Gather and process contextual information to inform scheduling decisions.

**Technology Stack**:

- Location: Geolocation APIs (opt-in)
- Device Detection: User agent parsing and session tracking
- Biometric Integration: APIs for health/fitness wearables (opt-in)
- Time-Based Context: Timezone handling and circadian rhythm modeling

**Key Responsibilities**:

- Track user location and proximity to relevant places
- Detect current device and available tools
- Monitor energy levels and productivity patterns
- Provide context signals to scheduling engine

### 4. Transparency Engine

**Purpose**: Explain scheduling decisions and system behavior to users.

**Technology Stack**:

- Explanation Generation: Template-based with dynamic data insertion
- Decision Logging: Audit trail of all scheduling decisions
- User Feedback Loop: Capture user reactions to explanations

**Key Responsibilities**:

- Generate human-readable explanations for schedule decisions
- Provide "why" answers for task placement
- Log decision factors for audit and improvement
- Enable user overrides with learning feedback

### 5. Notification Service

**Purpose**: Deliver timely reminders and updates across devices.

**Technology Stack**:

- Push Notifications: Firebase Cloud Messaging, APNs
- Email: SendGrid or similar
- In-App Notifications: WebSocket connections for real-time updates

**Key Responsibilities**:

- Send task reminders at optimal times
- Notify users of schedule changes
- Deliver habit prompts during appropriate windows
- Respect user notification preferences

### 6. Integration Service

**Purpose**: Connect with external calendars, email, and productivity tools.

**Technology Stack**:

- Calendar Sync: Google Calendar API, Microsoft Graph API
- Email Integration: IMAP/SMTP for email-to-task conversion
- Webhooks: Bidirectional sync with third-party tools

**Key Responsibilities**:

- Sync with external calendars
- Import tasks from email and other sources
- Export schedules to external systems
- Maintain data consistency across platforms

## Data Architecture

### Primary Database (PostgreSQL)

**Core Tables**:

```sql
-- Users
users (
  id UUID PRIMARY KEY,
  email VARCHAR UNIQUE NOT NULL,
  password_hash VARCHAR NOT NULL,
  name VARCHAR,
  timezone VARCHAR,
  preferences JSONB,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)

-- Tasks
tasks (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  title VARCHAR NOT NULL,
  description TEXT,
  type ENUM('task', 'habit', 'routine'),
  status ENUM('pending', 'scheduled', 'in_progress', 'completed', 'cancelled'),
  priority ENUM('low', 'medium', 'high', 'critical'),
  context JSONB,
  estimated_duration INTEGER,
  actual_duration INTEGER,
  due_date TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)

-- Schedule Slots
schedule_slots (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  task_id UUID REFERENCES tasks(id),
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  status ENUM('scheduled', 'active', 'completed', 'skipped'),
  context_snapshot JSONB,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)

-- User Context
user_context (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  context_type VARCHAR NOT NULL,
  context_data JSONB,
  recorded_at TIMESTAMP,
  created_at TIMESTAMP
)

-- Decision Log
decision_log (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  decision_type VARCHAR NOT NULL,
  input_data JSONB,
  output_data JSONB,
  explanation TEXT,
  created_at TIMESTAMP
)
```

### Cache Layer (Redis)

**Use Cases**:

- Session storage
- Real-time schedule state
- Rate limiting counters
- Temporary context data
- WebSocket connection management

### Vector Database (Pinecone/Weaviate)

**Use Cases**:

- Task similarity search
- Intent classification embeddings
- User behavior pattern matching
- Semantic search for tasks and habits

## API Design

### RESTful Endpoints

```
Authentication:
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me

Intent Processing:
POST   /api/intents              # Submit new intent
GET    /api/intents/:id          # Get parsed intent

Tasks:
GET    /api/tasks                # List tasks
GET    /api/tasks/:id            # Get task details
POST   /api/tasks                # Create task (alternative to intent)
PUT    /api/tasks/:id            # Update task
DELETE /api/tasks/:id            # Delete task

Schedule:
GET    /api/schedule             # Get current schedule
GET    /api/schedule/today       # Today's schedule
GET    /api/schedule/week        # Week view
POST   /api/schedule/regenerate  # Force schedule regeneration
PUT    /api/schedule/slots/:id   # Update slot (reschedule)

Context:
GET    /api/context              # Get current context
POST   /api/context              # Update context manually
GET    /api/context/history      # Context history

Transparency:
GET    /api/explanations/:decision_id  # Get explanation for decision
POST   /api/feedback                   # Submit feedback on decision

Integrations:
GET    /api/integrations         # List connected integrations
POST   /api/integrations/calendar/sync  # Sync calendar
DELETE /api/integrations/:id     # Disconnect integration
```

### WebSocket Events

```
Client → Server:
- context.update          # Real-time context updates
- task.start              # User started a task
- task.complete           # User completed a task
- schedule.request        # Request schedule update

Server → Client:
- schedule.updated        # Schedule changed
- task.reminder           # Task reminder
- context.changed         # Context change detected
- notification.new        # New notification
```

## Security Architecture

### Authentication & Authorization

- JWT-based authentication with refresh tokens
- Role-based access control (future multi-user support)
- API key management for integrations
- OAuth 2.0 for third-party integrations

### Data Protection

- Encryption at rest (database-level encryption)
- Encryption in transit (TLS 1.3)
- Sensitive data tokenization
- Regular security audits

### Privacy Controls

- Granular opt-in for contextual features
- Data retention policies
- User data export and deletion
- Anonymized analytics

## Deployment Architecture

### Infrastructure

- **Containerization**: Docker containers for all services
- **Orchestration**: Kubernetes for production deployment
- **CI/CD**: GitHub Actions for automated testing and deployment
- **Monitoring**: Prometheus + Grafana for metrics, Sentry for error tracking

### Environments

- **Development**: Local Docker Compose setup
- **Staging**: Kubernetes cluster with production-like configuration
- **Production**: Multi-region Kubernetes deployment with auto-scaling

### Scalability Strategy

- Horizontal scaling for API servers
- Database read replicas for query performance
- Redis cluster for distributed caching
- CDN for static assets
- Message queue (RabbitMQ/Kafka) for async processing

## Technology Stack Summary

| Layer             | Technology            | Rationale                                     |
| ----------------- | --------------------- | --------------------------------------------- |
| Frontend          | React + TypeScript    | Modern, type-safe, component-based            |
| Mobile            | React Native          | Code sharing with web frontend                |
| API Gateway       | Express.js            | Mature, flexible, extensive ecosystem         |
| Intent Processing | OpenAI GPT-4          | State-of-art NLP capabilities                 |
| Scheduling        | Custom Algorithm + ML | Domain-specific optimization                  |
| Database          | PostgreSQL            | Robust, ACID-compliant, JSON support          |
| Cache             | Redis                 | Fast, versatile, pub/sub support              |
| Vector DB         | Pinecone              | Managed, scalable, easy integration           |
| Message Queue     | RabbitMQ              | Reliable, flexible routing                    |
| Monitoring        | Prometheus + Grafana  | Industry standard, powerful                   |
| Deployment        | Kubernetes            | Scalable, resilient, cloud-agnostic           |
| Agent Runtime     | Node.js/TypeScript    | Consistent with API layer, good async support |
| Task Management   | Paperclip             | Integrated task management and orchestration  |

## Migration Path from Current Architecture

### Phase 1 (Current State)

- Basic CRUD API for tasks and projects
- Simple authentication
- PostgreSQL + Redis

### Phase 2 (Proposed Enhancements)

- Add Intent Processing Service
- Implement basic Scheduling Engine
- Introduce Context Service (time-based only)
- Add Transparency Engine
- Implement Agent Runtime for autonomous task execution
- Add real-time WebSocket communication for live updates
- Introduce Paperclip integration for task management workflow

### Phase 3 (Advanced Features)

- Integrate Vector DB for semantic search
- Add biometric and location context
- Implement advanced ML models for scheduling
- Build comprehensive integration ecosystem

## Performance Targets

- **API Response Time**: < 200ms for 95th percentile
- **Schedule Generation**: < 2 seconds for daily schedule
- **Real-Time Updates**: < 500ms latency for WebSocket events
- **Database Queries**: < 100ms for common queries
- **Uptime**: 99.9% availability

## Monitoring & Observability

### Key Metrics

- Request latency and throughput
- Schedule generation time
- Intent processing accuracy
- User engagement metrics
- Error rates and types
- Resource utilization

### Logging Strategy

- Structured logging (JSON format)
- Centralized log aggregation (ELK stack)
- Log levels: DEBUG, INFO, WARN, ERROR
- Sensitive data redaction

### Alerting

- API error rate thresholds
- Database connection pool exhaustion
- High latency alerts
- Service health checks
- Anomaly detection for user behavior

---

_This architecture proposal provides a foundation for building Omni as a scalable, intelligent personal operating system while maintaining flexibility for future enhancements._
