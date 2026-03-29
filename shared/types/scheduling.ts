export interface ScheduleExplanation {
  taskId: string;
  suggestedTime: {
    start: string;
    end: string;
    duration: number;
  };
  factors: SchedulingFactor[];
}

export interface SchedulingFactor {
  type: 'deadline' | 'priority' | 'energy' | 'available_time' | 'user_preference' | 'context';
  weight: number;
  reason: string;
}

export interface RescheduleRequest {
  suggestedTime?: string;
  mode?: 'accept' | 'resuggest' | 'low_energy';
}

export interface LowEnergyModeRequest {
  enabled: boolean;
}
