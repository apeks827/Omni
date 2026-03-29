# Omni Core State Models

## 1. Intent Processing State Model

The Intent Processing Service transforms raw natural language input into structured data for the Scheduling Engine.

### State Diagram: Intent Processing

```mermaid
stateDiagram-v2
    [*] --> RawInput: User enters text
    RawInput --> Processing: System processes text
    Processing --> Ambiguous: Low confidence / multiple interpretations
    Processing --> Confirmed: High confidence / single interpretation
    Ambiguous --> Processing: User provides clarification
    Confirmed --> ConfirmationScreen: Present to user
    ConfirmationScreen --> Modified: User makes changes
    Modified --> ConfirmationScreen: Present updated data
    ConfirmationScreen --> Accepted: User confirms
    ConfirmationScreen --> Rejected: User cancels
    Accepted --> Scheduling: Send to engine
    Rejected --> [*]: End session
    Scheduling --> [*]: Task scheduled
```

### State Transitions: Intent Processing

| Current State      | Event              | Action                 | Next State         |
| ------------------ | ------------------ | ---------------------- | ------------------ |
| [*]                | User Input         | Receive raw text       | RawInput           |
| RawInput           | NLP Analysis       | Run NLP models         | Processing         |
| Processing         | High Confidence    | Extract entities       | Confirmed          |
| Processing         | Low Confidence     | Generate questions     | Ambiguous          |
| Ambiguous          | User Clarification | Update context         | Processing         |
| Confirmed          | UI Render          | Show extracted data    | ConfirmationScreen |
| ConfirmationScreen | User Edit          | Apply changes          | Modified           |
| Modified           | UI Update          | Re-render data         | ConfirmationScreen |
| ConfirmationScreen | User Confirm       | Save structured intent | Accepted           |
| ConfirmationScreen | User Reject        | Clear input            | Rejected           |
| Accepted           | Schedule Trigger   | Call scheduling engine | Scheduling         |

---

## 2. Task Lifecycle State Model

The lifecycle of a task from creation to completion, including its status in the adaptive schedule.

### State Diagram: Task Lifecycle

```mermaid
stateDiagram-v2
    [*] --> Pending: Created (Intent Accepted)
    Pending --> Scheduled: Assigned to time slot
    Scheduled --> Active: Current time in slot
    Active --> Completed: User confirms completion
    Active --> Overdue: Time elapsed, no completion
    Scheduled --> Rescheduled: Conflict / Context change
    Rescheduled --> Scheduled: New slot found
    Overdue --> Rescheduled: Re-prioritized
    Active --> Paused: User stops temporarily
    Paused --> Active: User resumes
    AnyState --> Cancelled: User deletes task
    Completed --> [*]
    Cancelled --> [*]
```

### State Transitions: Task Lifecycle

| Current State | Event              | Action                     | Next State  |
| ------------- | ------------------ | -------------------------- | ----------- |
| [*]           | Intent Confirmed   | Create task record         | Pending     |
| Pending       | Schedule Run       | Assign start/end time      | Scheduled   |
| Scheduled     | Start Time Reach   | Update status, notify user | Active      |
| Active        | User Complete      | Record actual duration     | Completed   |
| Active        | Slot End (No Comp) | Flag as overdue            | Overdue     |
| Scheduled     | Context Change     | Re-evaluate slot           | Rescheduled |
| Rescheduled   | New Slot Found     | Update start/end time      | Scheduled   |
| Overdue       | Reprioritize       | Re-run scheduling          | Rescheduled |
| Active        | User Pause         | Suspend timer              | Paused      |
| Paused        | User Resume        | Restart timer              | Active      |
| AnyState      | User Delete        | Remove from schedule       | Cancelled   |

---

## 3. Scheduling Engine State Model

How the engine handles continuous rebalancing of the user's day.

### State Diagram: Scheduling Engine

```mermaid
stateDiagram-v2
    [*] --> Idle: Waiting for trigger
    Idle --> Analyzing: Intent / Context / Timer trigger
    Analyzing --> ConflictDetected: Overlapping tasks
    Analyzing --> OptimalFound: Best slot(s) identified
    ConflictDetected --> Resolving: Apply priority rules
    Resolving --> Analyzing: Updated constraints
    OptimalFound --> Applying: Update database records
    Applying --> Notifying: Send WebSocket updates
    Notifying --> Idle: Process complete
```

### State Transitions: Scheduling Engine

| Current State    | Event             | Action                | Next State       |
| ---------------- | ----------------- | --------------------- | ---------------- |
| [*]              | System Start      | Initialize engine     | Idle             |
| Idle             | New Trigger       | Gather constraints    | Analyzing        |
| Analyzing        | Detect Overlap    | Identify conflicts    | ConflictDetected |
| Analyzing        | No Conflict       | Select best slots     | OptimalFound     |
| ConflictDetected | Rule Application  | Move/split tasks      | Resolving        |
| Resolving        | Constraint Update | Re-analyze schedule   | Analyzing        |
| OptimalFound     | Transaction Start | Update slot records   | Applying         |
| Applying         | WebSocket Send    | Push update to client | Notifying        |
| Notifying        | Success           | Clear event queue     | Idle             |

---

## 4. Context Service State Model

Processing incoming signals to inform scheduling.

### State Diagram: Context Service

```mermaid
stateDiagram-v2
    [*] --> Monitoring: System active
    Monitoring --> SignalReceived: Data from sensor/API
    SignalReceived --> Filtering: Validate and normalize
    Filtering --> PatternRecognized: Match historical behavior
    Filtering --> EventTriggered: Significant change detected
    PatternRecognized --> Updating: Send signal to Scheduler
    EventTriggered --> Updating: Send signal to Scheduler
    Updating --> Monitoring: Resume collection
```

---

This document provides technical clarity on how data flows and transitions between states in the Omni ecosystem. Engineering should use these models when implementing state management in the backend (services/models) and frontend (Redux/Context API).
