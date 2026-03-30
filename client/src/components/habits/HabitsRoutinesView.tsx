import React, { useState } from 'react'
import {
  Habit,
  HabitCompletion,
  Routine,
  CreateHabitInput,
  CreateRoutineInput,
} from '../../../../shared/types/habits'
import { Button, Text } from '../../design-system'
import { spacing } from '../../design-system/tokens'
import HabitList from './HabitList'
import HabitForm from './HabitForm'
import RoutineList from './RoutineList'
import RoutineBuilder from './RoutineBuilder'
import RoutinePlayer from './RoutinePlayer'

interface HabitsRoutinesViewProps {
  habits: Habit[]
  habitCompletions: HabitCompletion[]
  routines: Routine[]
  onCreateHabit: (data: CreateHabitInput) => void
  onUpdateHabit: (id: string, data: CreateHabitInput) => void
  onCompleteHabit: (habitId: string) => void
  onSkipHabit: (habitId: string) => void
  onCreateRoutine: (data: CreateRoutineInput) => void
  onUpdateRoutine: (id: string, data: CreateRoutineInput) => void
  onCompleteRoutine: (routineId: string, completedSteps: number) => void
}

type View = 'list' | 'habit-form' | 'routine-builder' | 'routine-player'

const HabitsRoutinesView: React.FC<HabitsRoutinesViewProps> = ({
  habits,
  habitCompletions,
  routines,
  onCreateHabit,
  onUpdateHabit,
  onCompleteHabit,
  onSkipHabit,
  onCreateRoutine,
  onUpdateRoutine,
  onCompleteRoutine,
}) => {
  const [view, setView] = useState<View>('list')
  const [activeTab, setActiveTab] = useState<'habits' | 'routines'>('habits')
  const [editingHabitId, setEditingHabitId] = useState<string | null>(null)
  const [editingRoutineId, setEditingRoutineId] = useState<string | null>(null)
  const [playingRoutineId, setPlayingRoutineId] = useState<string | null>(null)

  const handleCreateHabit = () => {
    setEditingHabitId(null)
    setView('habit-form')
  }

  const handleEditHabit = (habitId: string) => {
    setEditingHabitId(habitId)
    setView('habit-form')
  }

  const handleSaveHabit = (data: CreateHabitInput) => {
    if (editingHabitId) {
      onUpdateHabit(editingHabitId, data)
    } else {
      onCreateHabit(data)
    }
    setView('list')
    setEditingHabitId(null)
  }

  const handleCreateRoutine = () => {
    setEditingRoutineId(null)
    setView('routine-builder')
  }

  const handleEditRoutine = (routineId: string) => {
    setEditingRoutineId(routineId)
    setView('routine-builder')
  }

  const handleSaveRoutine = (data: CreateRoutineInput) => {
    if (editingRoutineId) {
      onUpdateRoutine(editingRoutineId, data)
    } else {
      onCreateRoutine(data)
    }
    setView('list')
    setEditingRoutineId(null)
  }

  const handlePlayRoutine = (routineId: string) => {
    setPlayingRoutineId(routineId)
    setView('routine-player')
  }

  const handleRoutineComplete = (routineId: string, completedSteps: number) => {
    onCompleteRoutine(routineId, completedSteps)
    setView('list')
    setPlayingRoutineId(null)
  }

  const editingHabit = editingHabitId
    ? habits.find(h => h.id === editingHabitId)
    : undefined
  const editingRoutine = editingRoutineId
    ? routines.find(r => r.id === editingRoutineId)
    : undefined
  const playingRoutine = playingRoutineId
    ? routines.find(r => r.id === playingRoutineId)
    : undefined

  if (view === 'habit-form') {
    return (
      <div>
        <Text
          style={{
            fontSize: '24px',
            fontWeight: 600,
            marginBottom: spacing.lg,
          }}
        >
          {editingHabitId ? 'Edit Habit' : 'Create Habit'}
        </Text>
        <HabitForm
          initialData={editingHabit}
          onSubmit={handleSaveHabit}
          onCancel={() => setView('list')}
        />
      </div>
    )
  }

  if (view === 'routine-builder') {
    return (
      <div>
        <Text
          style={{
            fontSize: '24px',
            fontWeight: 600,
            marginBottom: spacing.lg,
          }}
        >
          {editingRoutineId ? 'Edit Routine' : 'Create Routine'}
        </Text>
        <RoutineBuilder
          routine={editingRoutine}
          onSave={handleSaveRoutine}
          onCancel={() => setView('list')}
        />
      </div>
    )
  }

  if (view === 'routine-player' && playingRoutine) {
    return (
      <div>
        <RoutinePlayer
          routine={playingRoutine}
          onComplete={handleRoutineComplete}
          onCancel={() => setView('list')}
        />
      </div>
    )
  }

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: spacing.lg,
        }}
      >
        <Text style={{ fontSize: '24px', fontWeight: 600 }}>
          Habits & Routines
        </Text>
        <Button
          variant="primary"
          onClick={
            activeTab === 'habits' ? handleCreateHabit : handleCreateRoutine
          }
        >
          + {activeTab === 'habits' ? 'New Habit' : 'New Routine'}
        </Button>
      </div>

      <div
        style={{
          display: 'flex',
          gap: spacing.md,
          marginBottom: spacing.lg,
          borderBottom: '2px solid #e9ecef',
        }}
      >
        <button
          onClick={() => setActiveTab('habits')}
          style={{
            padding: `${spacing.sm} ${spacing.md}`,
            background: 'none',
            border: 'none',
            borderBottom:
              activeTab === 'habits'
                ? '2px solid #007bff'
                : '2px solid transparent',
            color: activeTab === 'habits' ? '#007bff' : '#6c757d',
            fontWeight: activeTab === 'habits' ? 600 : 400,
            cursor: 'pointer',
            marginBottom: '-2px',
          }}
        >
          Habits ({habits.length})
        </button>
        <button
          onClick={() => setActiveTab('routines')}
          style={{
            padding: `${spacing.sm} ${spacing.md}`,
            background: 'none',
            border: 'none',
            borderBottom:
              activeTab === 'routines'
                ? '2px solid #007bff'
                : '2px solid transparent',
            color: activeTab === 'routines' ? '#007bff' : '#6c757d',
            fontWeight: activeTab === 'routines' ? 600 : 400,
            cursor: 'pointer',
            marginBottom: '-2px',
          }}
        >
          Routines ({routines.length})
        </button>
      </div>

      {activeTab === 'habits' ? (
        habits.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: spacing.xl,
              color: '#6c757d',
            }}
          >
            <Text>No habits yet. Create your first habit to get started!</Text>
          </div>
        ) : (
          <HabitList
            habits={habits}
            completions={habitCompletions}
            onComplete={onCompleteHabit}
            onSkip={onSkipHabit}
            onEdit={handleEditHabit}
          />
        )
      ) : routines.length === 0 ? (
        <div
          style={{ textAlign: 'center', padding: spacing.xl, color: '#6c757d' }}
        >
          <Text>
            No routines yet. Create your first routine to get started!
          </Text>
        </div>
      ) : (
        <RoutineList
          routines={routines}
          onPlay={handlePlayRoutine}
          onEdit={handleEditRoutine}
        />
      )}
    </div>
  )
}

export default HabitsRoutinesView
