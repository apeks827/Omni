# Omni: User Flows and System Requirements Specification

## Document Purpose

This document translates the product vision and architecture into detailed user flows, system requirements, and edge cases that engineering can execute against without ambiguity. It serves as the bridge between product vision and technical implementation for Phase 2 of the Omni task manager.

## Product Context

Omni is building toward an AI-first personal operating system that transforms the chaos of tasks, habits, and routines into an optimized, adaptive Flow. The product direction is a "Personal COO": the user provides intent, and Omni handles classification, prioritization, scheduling, and explanation.

### Core Product Vision

Omni becomes the "personal COO" that transforms chaotic incoming tasks, habits, and routines into a perfectly balanced flow, allowing users to focus on strategic thinking while the system handles execution logistics.

---

## 1. User Flows for Core Features

### 1.1 Intent Processing Flow

**User Goal**: Quickly input tasks, habits, or routines using natural language without worrying about formatting.

#### Main Flow:

1. User opens Omni interface (web/mobile)
2. User enters natural language input in the intent processing field (e.g., "Remind me to call John every Tuesday at 3 PM" or "Schedule a meeting with the team to discuss Q1 goals sometime next week")
3. System processes the input in real-time
4. System extracts intent type (task/habit/routine), entities (dates, people, locations), and context
5. System presents a confirmation screen showing:
   - Parsed intent type
   - Extracted entities
   - Estimated duration
   - Suggested priority
6. User confirms, modifies, or rejects the interpretation
7. If confirmed, system proceeds to scheduling
8. If modified, user makes changes and confirms
9. If rejected, user can rephrase or enter structured input

#### Alternative Flow - Ambiguous Input:

1. System identifies ambiguity in the input
2. System presents interpretation cards showing:
   - Top 2-3 possible interpretations
   - Confidence score for each
   - Key extracted entities for each option
   - "Not sure? Here's what I understood" context help
3. User selects correct interpretation OR rephrases input
4. User can select multiple interpretations to create multiple tasks
5. Proceeds to confirmation screen

**Disambiguation UX Specifications:**

- **Card Presentation**:
  - Horizontal scrollable cards on mobile
  - Side-by-side comparison on desktop
  - Each card shows: interpretation type, key entities, confidence indicator
- **Context Help**:
  - "Why this?" expandable section on each card
  - Shows which words triggered this interpretation
  - Example: "I interpreted 'review' as a task because of the word 'to' before it"
- **Multi-Select Capability**:
  - Checkbox on each card for bulk selection
  - "Create all selected" button appears when >1 selected
  - Individual confirmations still shown for each selected item
  - User can create 1-N tasks from single ambiguous input

#### Alternative Flow - Missing Information:

1. System identifies missing critical information
2. System asks clarifying questions (e.g., "How long do you think this will take?")
3. User provides missing information
4. Proceeds to confirmation screen

### 1.2 Adaptive Scheduling Flow

**User Goal**: Have tasks automatically scheduled in optimal time slots without manual intervention.

#### Main Flow:

1. System receives processed intent
2. System analyzes user's calendar, productivity patterns, and preferences
3. System generates potential time slots for the task
4. System evaluates slots based on:
   - Task priority
   - Required context (location, tools)
   - User's historical performance
   - Energy levels at different times
5. System assigns task to optimal slot
6. System notifies user of the scheduled time
7. User can accept, reschedule, or decline
8. If accepted, task appears in the user's calendar
9. If declined, user can manually schedule or postpone

#### Alternative Flow - Schedule Conflict:

1. System detects conflict with existing commitments
2. System evaluates importance of conflicting items
3. System suggests resolution:
   - Move lower-priority item
   - Split task into smaller chunks
   - Find alternative time slot
4. User approves suggestion or chooses manual override
5. System updates schedule accordingly

#### Alternative Flow - Real-Time Adjustment:

1. User's context changes (e.g., unexpected meeting, travel)
2. System detects change through various signals
3. System evaluates impact on scheduled tasks
4. System automatically reschedules affected tasks if appropriate
5. System notifies user of changes with explanations
6. User can approve changes or revert if desired

### 1.3 Context Awareness Flow

**User Goal**: Have the system adapt to their current situation without manual input.

#### Main Flow:

1. System continuously monitors available context signals:
   - Location data (with permission)
   - Device type and usage patterns
   - Calendar events
   - Time of day
   - Historical behavior patterns
2. System identifies relevant context change
3. System evaluates potential impact on tasks
4. System triggers appropriate action:
   - Surface location-relevant tasks
   - Adjust schedule based on available time
   - Suggest context-appropriate tasks
5. System notifies user of changes or suggestions
6. User can accept or modify the system's recommendations

#### Alternative Flow - Privacy-Conscious Mode:

1. User has limited data sharing enabled
2. System relies primarily on explicit user input and basic calendar data
3. System makes conservative scheduling decisions
4. System asks for permission for additional context when needed

### 1.4 Transparency and Explanation Flow

**User Goal**: Understand why the system made specific decisions and be able to adjust preferences.

#### Main Flow:

1. User views a scheduled task or system decision
2. User clicks "Explain" button or similar interface element
3. System provides clear explanation of:
   - Why this time was chosen
   - Factors considered in the decision
   - How it fits with other tasks
   - What data influenced the decision
4. User can view additional details or adjust preferences
5. User can provide feedback on the decision
6. System learns from feedback for future decisions

#### Alternative Flow - Override and Learning:

1. User overrides a system decision
2. System records the override
3. System asks for reason for override (optional)
4. System adjusts future decisions based on user preference
5. System provides explanation of how it will apply this learning

### 1.5 First-Time User Experience

**User Goal**: Get started quickly with Omni and understand core value within first session.

#### Onboarding Flow:

1. **Welcome Screen**
   - Brief 3-step introduction highlighting key value propositions
   - "Get Started" CTA to begin setup
2. **Initial Data Collection** (optional, clearly marked)
   - Calendar integration prompt (Google/Outlook/Apple)
   - Notification permission request
   - Energy level preferences initial survey (3-5 questions)
3. **First Task Creation**
   - Guided natural language input experience
   - System demonstrates parsing and confirmation UI
   - User creates first task with real-time feedback
4. **Schedule Overview**
   - Show user's calendar with Omni-suggested task placement
   - Explain how system will learn from behavior
   - Highlight "Explain" button on first schedule

#### Bootstrap Period (First 14 Days):

- **Learning Phase**: System uses conservative defaults
  - Duration estimates use category averages only
  - Scheduling is conservative (more padding between tasks)
  - Energy level defaults to Medium until user provides signals
- **Quick Wins**: System prioritizes helping user complete tasks
  - Lower task volume suggestions until confidence builds
  - Celebrate completions to establish positive reinforcement
- **Feedback Collection**: Active learning prompts
  - "Was this time estimate accurate?" after each task
  - "How did this schedule feel?" weekly prompt
  - "Adjust energy level" quick action in UI

#### Empty State Handling:

- **No Tasks Yet**: Motivational message + "Add your first task" prompt
  - Example tasks shown as suggestions (not pre-populated)
  - Clear call-to-action: "Try saying 'Schedule a 30-minute walk tomorrow morning'"
- **No Historical Data**: Transparent messaging
  - "We're still learning your patterns. Here's our initial suggestion based on typical schedules."
  - Explain what data will improve suggestions
  - Easy way to provide feedback

---

## 2. System Requirements

### 2.1 Functional Requirements

#### FR-1: Intent Processing Service

- **FR-1.1**: Parse natural language input and extract task, habit, or routine intent
- **FR-1.2**: Identify and extract entities (dates, times, people, locations, priorities)
- **FR-1.3**: Classify intent type with 90%+ accuracy for common patterns
- **FR-1.4**: Handle ambiguous inputs by presenting disambiguation options
- **FR-1.5**: Support offline/fallback parsing for basic patterns when AI unavailable
- **FR-1.6**: Estimate task duration based on historical data and task characteristics

**FR-1.6 Duration Estimation Logic:**

- **Algorithm**: Duration estimation uses a weighted combination of:
  - User's historical completion time for similar tasks (50% weight)
  - Task category average from anonymized cohort data (25% weight)
  - User's explicit duration input or adjustment (25% weight)
- **Similarity Matching**: Tasks are matched using:
  - Keyword similarity in task title/description (TF-IDF cosine similarity > 0.7)
  - Same task category/type
  - Similar context tags (location, energy level)
  - Time-of-day pattern matching
- **New User Fallback**: When no historical data exists:
  - Use category-based defaults (e.g., "Email": 15 min, "Meeting": 30-60 min)
  - Prompt user for estimated duration during task creation
  - Apply conservative estimate (slightly over-estimate) until data accumulates
- **User Override Capability**:
  - Users can manually set duration at task creation
  - Users can adjust duration in confirmation screen
  - System learns from overrides to improve future estimates
  - Override feedback loop: if user consistently halves estimated time, system recalibrates

#### FR-2: Adaptive Scheduling Engine

- **FR-2.1**: Generate optimized daily schedules considering all user commitments
- **FR-2.2**: Adjust schedules in real-time based on user behavior and context changes
- **FR-2.3**: Balance tasks, habits, and routines according to user preferences
- **FR-2.4**: Respect user-defined constraints and hard stops
- **FR-2.5**: Learn from historical completion patterns to improve future scheduling

**FR-2.5 Energy Level Signal Definitions:**

- **Direct Signals** (explicit user input):
  - Manual energy level toggle (Low/Medium/High)
  - Task completion rate in current session
  - Time since last break
- **Indirect Signals** (inferred from behavior):
  - Typing speed and pattern changes
  - Time spent on similar tasks
  - Error rates and corrections
  - Session duration without breaks
- **Quantification Method**:
  - Energy scored on 1-10 scale (1-3: Low, 4-6: Medium, 7-10: High)
  - Rolling weighted average of last 10 session signals
  - Time decay applied: recent signals weighted 2x older signals
  - Anomaly detection: spike in low-energy signals triggers recalibration
- **High/Low Energy Indicators**:
  - High energy: Fast task completion, low error rates, extended focus time
  - Low energy: Slow response times, frequent breaks, task switching
- **User Correction**:
  - Users can manually override energy level at any time
  - System logs corrections and adjusts weight distribution
  - User-corrected signals weighted 3x for future calibration

#### FR-3: Context Service

- **FR-3.1**: Collect and process contextual information (location, time, calendar)
- **FR-3.2**: Provide privacy controls for context data collection
- **FR-3.3**: Integrate with external calendar systems (Google, Outlook)
- **FR-3.4**: Monitor energy and productivity patterns over time
- **FR-3.5**: Detect significant context changes and adapt accordingly

#### FR-4: Transparency Engine

- **FR-4.1**: Generate human-readable explanations for all scheduling decisions

**FR-4.1 Transparency Deep-Link Specifications:**

- **Depth Levels**:
  - **Brief (Default)**: 1-2 sentence summary of decision rationale
    - Example: "Scheduled at 2 PM because you're typically most productive then and have no conflicts."
  - **Detailed**: Full breakdown of factors and weights
    - Shows all considered factors with percentage contribution
    - Lists alternative times that were considered and why rejected
  - **Comparison View**: Side-by-side "Why this time vs. that time"
    - User can select alternative time slot to see comparison
    - Highlights key differences in scoring factors
- **UI Placement**:
  - "Explain" icon button next to each scheduled task
  - Tooltip on hover shows brief explanation
  - Click opens modal/drawer with detailed view
  - Deep-link format: `/schedule/{taskId}/explain?depth=detailed`
- **Comparison View**:
  - Accessible from detailed explanation modal
  - "Compare with..." dropdown showing alternative slots
  - Two-column layout: "Chosen Time" vs "Alternative Time"
  - Factor-by-factor comparison with visual indicators (✓/✗/~)
  - "Use this instead" button to reschedule to alternative

- **FR-4.2**: Maintain audit trail of all system decisions
- **FR-4.3**: Allow user feedback on system decisions
- **FR-4.4**: Incorporate user feedback into future decision-making
- **FR-4.5**: Provide interface for viewing decision history

#### FR-5: Notification Service

- **FR-5.1**: Send timely reminders based on optimal timing algorithms
- **FR-5.2**: Notify users of schedule changes with explanations
- **FR-5.3**: Deliver habit prompts during appropriate windows
- **FR-5.4**: Respect user notification preferences and quiet hours
- **FR-5.5**: Support multiple notification channels (push, email, SMS)
- **FR-5.6**: Prioritize and batch notifications to avoid user fatigue

**FR-5.6 Notification Prioritization System:**

- **Priority Levels**:
  - **Critical (P1)**: Immediate safety/urgent matters, calendar conflicts, missed deadlines
  - **High (P2)**: Habit reminders, high-priority task due soon, significant schedule changes
  - **Medium (P3)**: Regular task reminders, routine follow-ups, low-priority suggestions
  - **Low (P4)**: Tips, optional insights, delayed/deferrable items
- **Batching Strategy**:
  - Collect P3/P4 notifications into 30-minute batches
  - Batch window starts at user's typical notification peak time
  - Critical/High notifications sent immediately regardless of batching
  - Batching respects quiet hours (no batch delivery during quiet time)
- **Daily Limits**:
  - Maximum 20 notifications per day per user
  - P1/P2: Unlimited (critical alerts always through)
  - P3: Max 10 per day
  - P4: Max 5 per day
  - Grace period: If limit reached, new P3/P4 held until next day
- **Quiet Hours Integration**:
  - User-configurable quiet hours (default: 10 PM - 7 AM)
  - During quiet hours: Only P1 notifications delivered
  - All other notifications queued and delivered after quiet hours end
  - "Snooze" option: Extend quiet hours by 30/60/120 minutes

#### FR-6: Integration Service

- **FR-6.1**: Sync with external calendar systems bidirectionally
- **FR-6.2**: Import tasks from email and other productivity tools
- **FR-6.3**: Export schedules to external systems
- **FR-6.4**: Maintain data consistency across platforms
- **FR-6.5**: Support webhook-based real-time synchronization

### 2.2 Non-Functional Requirements

#### NFR-1: Performance

- **NFR-1.1**: API response time < 200ms for 95th percentile
- **NFR-1.2**: Schedule generation time < 2 seconds for daily schedule
- **NFR-1.3**: Real-time updates < 500ms latency for WebSocket events
- **NFR-1.4**: Database queries < 100ms for common operations
- **NFR-1.5**: Support 10,000+ concurrent users in future phases

#### NFR-2: Availability

- **NFR-2.1**: 99.9% uptime availability
- **NFR-2.2**: Graceful degradation when AI services unavailable
- **NFR-2.3**: Backup and recovery procedures for user data
- **NFR-2.4**: Load balancing across multiple instances

#### NFR-3: Security & Privacy

- **NFR-3.1**: End-to-end encryption for sensitive user data
- **NFR-3.2**: Granular opt-in controls for contextual features
- **NFR-3.3**: Compliance with data protection regulations (GDPR, CCPA)
- **NFR-3.4**: Secure authentication with multi-factor options
- **NFR-3.5**: Regular security audits and penetration testing

#### NFR-4: Scalability

- **NFR-4.1**: Horizontal scaling for API servers
- **NFR-4.2**: Database read replicas for query performance
- **NFR-4.3**: Distributed caching with Redis cluster
- **NFR-4.4**: Auto-scaling based on demand
- **NFR-4.5**: Microservices architecture for independent scaling

---

## 3. Edge Cases and Failure Modes

### 3.1 Intent Processing Edge Cases

- **EC-1.1**: Completely nonsensical input ("purple elephant dancing")
  - System should detect low confidence and ask for clarification
- **EC-1.2**: Multiple intents in single input ("Buy groceries and call mom tomorrow")
  - System should split into separate intents or ask for confirmation
- **EC-1.3**: Ambiguous time references ("next Friday" when today is Friday)
  - System should clarify the intended date
- **EC-1.4**: Cultural/timezone differences in language
  - System should adapt to user's locale settings

### 3.2 Scheduling Edge Cases

- **EC-2.1**: Overbooked schedule with no available time slots
  - System should suggest spreading tasks over multiple days
- **EC-2.2**: Conflicting user preferences (e.g., "work mornings" vs. "schedule important tasks early")
  - System should present trade-offs for user decision
- **EC-2.3**: Unexpected schedule disruption affecting many tasks
  - System should prioritize critical tasks and defer others
- **EC-2.4**: User goes offline for extended period
  - System should queue changes and sync when online

### 3.3 Context Service Edge Cases

- **EC-3.1**: Location services unavailable or inaccurate
  - System should fall back to calendar-based context
- **EC-3.2**: Calendar sync failure
  - System should cache last known calendar state temporarily
- **EC-3.3**: Multiple conflicting calendar systems
  - System should allow user to designate primary calendar
- **EC-3.4**: Privacy setting changes mid-session
  - System should immediately respect new privacy settings

### 3.4 Failure Modes

- **FM-1**: AI/ML service unavailability
  - System should fall back to rule-based processing
  - Continue with reduced functionality
  - Queue requests for processing when service returns
- **FM-2**: Database connectivity loss
  - System should serve cached data where possible
  - Queue writes for when connection is restored
  - Inform users of limited functionality
- **FM-3**: Third-party integration failures
  - System should isolate the failed integration
  - Continue with other functionality
  - Retry integration periodically
- **FM-4**: High load conditions
  - System should prioritize critical functions
  - Implement graceful degradation
  - Queue non-critical operations

---

## 4. Integration Interfaces

### 4.1 Internal Service Interfaces

- **Intent Processing ↔ Scheduling**: Event-based communication for processed intents
- **Context Service ↔ Scheduling**: Real-time context updates via message queue
- **Scheduling ↔ Transparency**: Decision logging for explanation generation
- **Notification ↔ All Services**: Event subscription for user notifications

### 4.2 External API Contracts

- **Calendar Integration API**: Standard calendar sync protocols (Google Calendar API, Microsoft Graph)
- **AI/ML Provider API**: OpenAI-compatible interface for NLP processing
- **Notification Gateway API**: Standard push notification protocols
- **Third-party App API**: OAuth 2.0 for secure integration

---

## 5. Validation Checklist for Engineering Team

### Pre-Implementation Validation:

- [ ] Requirements reviewed and understood by all team members
- [ ] Technical feasibility assessed for each requirement
- [ ] Dependencies identified and sequenced appropriately
- [ ] Performance requirements achievable with selected technologies
- [ ] Security requirements aligned with architecture
- [ ] Edge cases and failure modes understood and planned for

### Implementation Validation:

- [ ] Intent processing achieves 90%+ accuracy threshold
- [ ] Scheduling algorithm respects all user constraints
- [ ] Privacy controls properly implemented and tested
- [ ] Performance benchmarks met consistently
- [ ] Failure modes handled gracefully
- [ ] All edge cases addressed in implementation

### Post-Implementation Validation:

- [ ] User acceptance testing completed
- [ ] Performance under load verified
- [ ] Security audit passed
- [ ] Privacy compliance verified
- [ ] Integration with external services stable

---

## 6. Success Metrics and KPIs

### User Engagement Metrics:

- Daily Active Users (DAU)
- Session duration and frequency
- Task completion rate
- User satisfaction score (NPS)

### System Performance Metrics:

- Intent processing accuracy
- Schedule adherence rate
- User override frequency
- Response time percentiles

### Quality Metrics:

- System uptime
- Error rate
- User-reported issues
- Feature adoption rate

---

## 7. Product Critic Addendum (Phase 2 Review)

**Reviewed**: 2026-03-31  
**Reviewer**: Product Critic

### Additional Edge Cases (Post-Phase 2)

- **EC-7.1**: Profanity/inappropriate content input
  - System should detect and filter inappropriate content
  - Present user with "Please rephrase" message
  - Log attempt for moderation review

- **EC-7.2**: Voice input for mobile users
  - Consider as Phase 2.5 scope
  - Speech-to-text integration required

### Accessibility Requirements

- **AR-1**: All user flows must comply with WCAG 2.1 AA
  - Screen reader compatibility for all flows
  - Keyboard navigation for all interactions
  - Color contrast ratios (5:1 minimum)
  - Focus indicators on all interactive elements

### Mobile-First Considerations

- **MF-1**: Voice input as primary mobile input method
- **MF-2**: Touch targets minimum 48x48dp
- **MF-3**: Offline-first architecture for mobile
- **MF-4**: Gesture-based navigation for common actions

### Undo/Redo Specification

- **UR-1**: All user actions must be reversible
  - "Undo" available for 30 seconds after action
  - "Undo" available in notification for 5 minutes
  - Batch undo for bulk operations
  - Clear "Action completed" confirmation with undo link

### Bulk Operations Flow

1. User selects multiple tasks (checkbox or swipe gesture)
2. Bulk action bar appears: Edit, Delete, Move, Reschedule
3. User selects action and provides new value
4. Confirmation modal shows affected tasks count
5. Execute action with progress indicator
6. Success notification with "Undo" option

### Notification Enhancement

- **NE-1**: Do Not Disturb (DND) mode
  - User-configurable DND hours
  - P1 notifications can break through DND
  - "Emergency contact" can trigger P1 notifications

---

_This addendum was added by Product Critic review and does not replace the core specification above._

This specification provides the executable requirements needed for Phase 2 development of Omni's core features. It bridges the gap between the product vision outlined in Phase 1 and the technical implementation needed to deliver the "Personal COO" experience.
