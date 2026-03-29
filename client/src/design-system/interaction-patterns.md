# Interaction Patterns for Phase 2

This document defines the core interaction patterns that embody the **Zero-Friction Input** and **Fluid Calendar** principles of the Omni Task Manager.

## 1. Zero-Friction Input Principle

> "От пользователя требуется только одно действие: **выгрузить намерение**."

### Core Behaviors:

1. **Single-Action Intent Capture**
   - Users enter intentions via a global command palette (`Cmd/Ctrl + K`)
   - No initial categorization required (task/habit/routine determined by system)
   - Context (location, device, time) inferred automatically
   - Deadlines and folders never entered manually

2. **Smart Intent Parsing**
   - Natural language processing extracts:
     - Action verbs (купить, написать, начать)
     - Time references (утром, после работы, через час)
     - Location cues (дом, работа, магазин)
     - Priority indicators (срочно, важно, позже)
   - Examples:
     - "Купить продукты по пути домой" → Grocery task, triggered when near home
     - "Написать отчет к пятнице" → Report task, auto-scheduled for Thursday evening
     - "Начать бегать по утрам" → Running habit, scheduled for weekday mornings

### UI Components:

- **Command Palette** (global shortcut)
- **Quick Add Bar** (always-visible on mobile)
- **Voice Input** (microphone toggle in input fields)
- **Intent Chips** (visual parsing feedback)

## 2. Fluid Calendar Experience

> "Календарь — это не статичная сетка, а **динамическая река**."

### Core Behaviors:

1. **Automatic Time-Blocking**
   - Focus work scheduled during user's peak productivity hours
   - Low-energy tasks moved to natural breaks
   - Buffer time automatically added between context switches
   - Travel time calculated and reserved

2. **Real-Time Adaptation**
   - If user misses a time block, system flows remaining tasks forward
   - Low-priority routines shift to make room for high-focus work
   - Calendar maintains 100% utilization through elastic rescheduling
   - "Time to think" buffers inserted before complex tasks

3. **Context-Aware Adjustments**
   - Geolocation: Shopping lists appear near stores
   - Device detection: IDE opens trigger coding sessions
   - Biometrics: Poor sleep automatically reduces cognitive load
   - Weather: Outdoor tasks shifted based on conditions

### UI Components:

- **Elastic Time Blocks** (visual dragging with smart snapping)
- **Flow Indicators** (subtle arrows showing task movement)
- **Energy Level Overlay** (color-coded daily capacity)
- **Context Badges** (location/device/timezone tags on tasks)

## 3. Integration Patterns

### Habits as Connective Tissue

- Habits automatically inserted between focused work blocks
- Examples: Hydration prompts, stretch breaks, mindfulness moments
- Visualized as small dots or thin bands on timeline

### Pomodoro 2.0

- Timer starts when relevant tools are opened (IDE, editor, design software)
- Break suggestions based on actual work intensity, not fixed intervals
- Long breaks proposed after 90-minute focus sessions

### Home/Awareness Routines

- Location-triggered reminders (water plants when home Thursday evening)
- Context-sensitive suggestions (read articles when on couch with phone)

## 4. Glass Box Transparency

> "Система максимально проста, но **никогда не бывает «черным ящиком»**."

### Explanation Surfaces:

- **Why This Time?** tooltip on any calendar item
- **Schedule Breakdown** view (tap day header to see influencing factors)
- **Energy Forecast** (predicted focus/energy levels throughout day)
- **Control Sliders** (manual adjustment of system aggressiveness)

### User Overrides:

- "Сегодня я ленюсь" button → instantly switches to Low Energy Mode
- Manual rescheduling with one drag preserves all smart features
- Focus mode toggle disables all non-critical interruptions

## 5. Implementation Guidelines

### For Developers:

1. **Intent Parser Service**
   - Separate microservice for NLU processing
   - Configurable rules for different languages/cultures
   - Confidence scoring for fallback to manual entry

2. **Calendar Engine**
   - Constraint-based solver (not simple slot filling)
   - User preference weights (focus time vs admin time)
   - Real-time re-solver (<100ms response time)

3. **Context Sensors**
   - Abstract sensor API (location, device, biometrics, weather)
   - Privacy-first design (local processing when possible)
   - Opt-in permissions with clear value exchange

### For Designers:

1. **Progressive Disclosure**
   - Advanced settings hidden by default
   - Power-user features accessible via settings/search
   - Empty states educate about system intelligence

2. **Feedback Loops**
   - Confirmation toast when intentions are parsed
   - Undo available for 5 seconds after automatic scheduling
   - Weekly insights email showing prediction accuracy

3. **Accessibility**
   - All interactions keyboard-navigable
   - Screen reader announcements for schedule changes
   - High contrast modes for energy visualization
   - Reduced motion preferences respected
