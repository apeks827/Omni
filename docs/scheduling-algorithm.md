# Scheduling Engine - Algorithm Specification

## Overview

The scheduling engine generates optimal time slots for tasks based on deadlines, dependencies, estimated duration, and user context. This document specifies the algorithm for MVP implementation.

## Algorithm Decision

**MVP Decision:** Use **Greedy with Priority Queue** for MVP.

**Rationale:**

- Satisfies <2s latency requirement for 100+ tasks
- Handles deadlines and priorities correctly
- Simple to implement and debug
- Produces acceptable results for MVP

**Post-MVP Enhancement:** Implement constraint satisfaction (CSP) or mixed-integer programming (MIP) for optimal scheduling when latency requirements can be relaxed.

## Greedy Scheduling Algorithm

### Core Algorithm

```typescript
interface ScheduledTask {
  taskId: string
  startTime: Date
  endTime: Date
  scheduledDuration: number
  confidence: number // 0-1 score for scheduling quality
}

interface SchedulingInput {
  tasks: Task[]
  workingHours: {
    start: string // "09:00"
    end: string // "17:00"
  }
  availableSlots: TimeSlot[]
  calendarBlocks: CalendarBlock[]
}

interface TimeSlot {
  start: Date
  end: Date
}

interface CalendarBlock {
  start: Date
  end: Date
  type: 'meeting' | 'focus' | 'blocked'
}

interface Task {
  id: string
  title: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  dueDate?: Date
  estimatedDuration: number // minutes
  dependencies: string[] // task IDs that must complete first
  context: {
    energy?: 'low' | 'medium' | 'high'
    type?: 'creative' | 'routine' | 'complex'
  }
}

class SchedulingEngine {
  private priorityWeights = {
    critical: 1000,
    high: 100,
    medium: 10,
    low: 1,
  }

  schedule(input: SchedulingInput): ScheduledTask[] {
    const { tasks, workingHours, availableSlots, calendarBlocks } = input

    // 1. Filter available slots (remove calendar blocks)
    const freeSlots = this.subtractCalendarBlocks(
      availableSlots,
      calendarBlocks
    )

    // 2. Topological sort for dependencies
    const sortedTasks = this.topologicalSort(tasks)

    // 3. Filter tasks that can be scheduled (dependencies met)
    const schedulableTasks = sortedTasks.filter(task =>
      task.dependencies.every(
        depId => tasks.find(t => t.id === depId)?.completedAt
      )
    )

    // 4. Sort by priority and deadline (priority queue style)
    const prioritizedTasks = schedulableTasks.sort(
      (a, b) => this.calculateUrgency(b) - this.calculateUrgency(a)
    )

    // 5. Greedy scheduling
    const scheduled: ScheduledTask[] = []
    let currentSlotIndex = 0

    for (const task of prioritizedTasks) {
      const slot = this.findNextAvailableSlot(
        freeSlots,
        currentSlotIndex,
        task.estimatedDuration
      )

      if (slot) {
        scheduled.push({
          taskId: task.id,
          startTime: slot.start,
          endTime: new Date(
            slot.start.getTime() + task.estimatedDuration * 60000
          ),
          scheduledDuration: task.estimatedDuration,
          confidence: this.calculateConfidence(task, slot),
        })

        // Update slot index
        currentSlotIndex = this.findSlotIndex(freeSlots, slot.end)
      }
    }

    return scheduled
  }

  private calculateUrgency(task: Task): number {
    let score = this.priorityWeights[task.priority] * 1000

    if (task.dueDate) {
      const hoursUntilDue =
        (task.dueDate.getTime() - Date.now()) / (1000 * 60 * 60)
      if (hoursUntilDue < 0) {
        score += 100000 // Overdue
      } else if (hoursUntilDue < 24) {
        score += 50000 // Due within 24 hours
      } else if (hoursUntilDue < 72) {
        score += 25000 // Due within 72 hours
      }
    }

    // Factor in energy requirements (higher energy tasks scheduled during peak hours)
    if (task.context?.energy === 'high') {
      score += 5000
    }

    return score
  }

  private topologicalSort(tasks: Task[]): Task[] {
    const visited = new Set<string>()
    const result: Task[] = []

    const visit = (taskId: string) => {
      if (visited.has(taskId)) return
      visited.add(taskId)

      const task = tasks.find(t => t.id === taskId)
      if (task) {
        task.dependencies.forEach(depId => visit(depId))
        result.push(task)
      }
    }

    tasks.forEach(task => visit(task.id))
    return result
  }

  private subtractCalendarBlocks(
    slots: TimeSlot[],
    blocks: CalendarBlock[]
  ): TimeSlot[] {
    // Implementation: split slots around calendar blocks
    // Returns array of TimeSlots excluding blocked periods
    return slots // Simplified for documentation
  }

  private findNextAvailableSlot(
    slots: TimeSlot[],
    startIndex: number,
    durationMinutes: number
  ): TimeSlot | null {
    for (let i = startIndex; i < slots.length; i++) {
      const slot = slots[i]
      const slotDuration = (slot.end.getTime() - slot.start.getTime()) / 60000

      if (slotDuration >= durationMinutes) {
        return {
          start: slot.start,
          end: new Date(slot.start.getTime() + durationMinutes * 60000),
        }
      }
    }
    return null
  }

  private calculateConfidence(task: Task, slot: TimeSlot): number {
    // Score how well the slot matches task requirements
    let confidence = 1.0

    // Penalize if slot is near end of day
    const slotHour = slot.start.getHours()
    if (slotHour > 15 && task.context?.energy === 'high') {
      confidence -= 0.3
    }

    // Boost if deadline alignment is good
    if (task.dueDate) {
      const hoursUntilDue =
        (task.dueDate.getTime() - slot.end.getTime()) / (1000 * 60 * 60)
      if (hoursUntilDue >= 2 && hoursUntilDue <= 24) {
        confidence += 0.2
      }
    }

    return Math.max(0, Math.min(1, confidence))
  }

  private findSlotIndex(slots: TimeSlot[], time: Date): number {
    return slots.findIndex(s => s.start >= time)
  }
}
```

## Complexity Analysis

| Operation        | Time Complexity         | Space Complexity |
| ---------------- | ----------------------- | ---------------- |
| Topological Sort | O(V + E)                | O(V)             |
| Priority Sorting | O(V log V)              | O(V)             |
| Slot Finding     | O(S \* T)               | O(1)             |
| **Total**        | O(V log V + E + S \* T) | O(V)             |

Where:

- V = number of tasks
- E = number of dependency edges
- S = number of available slots
- T = average task duration in slots

**MVP Target:** < 2s for 100 tasks, 50 slots = O(100 log 100 + 100 + 50\*100) ≈ 5000 operations ✓

## API Contract

### POST /api/scheduling/suggest

```typescript
interface SchedulingRequest {
  workspaceId: string
  tasks: {
    id: string
    estimatedDuration: number
    priority: 'low' | 'medium' | 'high' | 'critical'
    dueDate?: string // ISO date
    dependencies?: string[]
    context?: {
      energy?: 'low' | 'medium' | 'high'
      type?: 'creative' | 'routine' | 'complex'
    }
  }[]
  dateRange: {
    start: string // ISO date
    end: string // ISO date
  }
  workingHours?: {
    start: string // "09:00"
    end: string // "17:00"
  }
}

interface SchedulingResponse {
  scheduled: {
    taskId: string
    startTime: string
    endTime: string
    confidence: number
  }[]
  unscheduled: {
    taskId: string
    reason: 'no_slot' | 'dependency_not_met' | 'no_duration'
  }[]
  optimizationScore: number // 0-100
}
```

## Post-MVP Considerations

### Constraint Satisfaction (CSP)

For Phase 2+, consider implementing a CSP solver:

```typescript
// Using a library like js-constraint or custom backtracking
interface CSPSchedulingProblem {
  variables: Task[]
  domain: TimeSlot[]
  constraints: Constraint[]
}

interface Constraint {
  type: 'deadline' | 'dependency' | 'energy' | 'duration'
  check: (task: Task, slot: TimeSlot) => boolean
}

// Benefits: Optimal solution, handles complex constraints
// Costs: Higher latency, more complex implementation
```

### Mixed-Integer Programming (MIP)

For optimal scheduling with objective functions:

```typescript
// Using a library like JavaScript-IPL or calling an external solver
interface MIPProblem {
  objective: 'minimize_overdue' | 'maximize_completion'
  variables: {
    taskId: string
    startTime: number
    endTime: number
  }[]
  constraints: LinearConstraint[]
}

// Benefits: Global optimum
// Costs: External solver dependency, milliseconds to seconds latency
```

## Performance Benchmarks

Target metrics for 100 tasks:

| Metric      | Target  | Algorithm Headroom |
| ----------- | ------- | ------------------ |
| Latency p50 | 200ms   | 1.8s budget        |
| Latency p95 | 500ms   | 1.5s budget        |
| Latency p99 | 1s      | 1s budget          |
| Memory      | <50MB   | -                  |
| CPU         | <1 core | -                  |

## Testing Strategy

1. **Unit tests:** Algorithm correctness with mock tasks
2. **Property-based tests:** Random task sets, verify constraints
3. **Integration tests:** Full scheduling with real database
4. **Performance tests:** 100, 500, 1000 tasks, verify latency
5. **Chaos tests:** Missing dependencies, overlapping slots, etc.
