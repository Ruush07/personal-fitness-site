export type PlannedExercise = {
  name: string;
  sets: number;
  reps: number;
  weight: number;
  restSeconds?: number;
  reason?: string;
  completed?: boolean;
};

export type FitnessRoutine = {
  id: string;
  routine_name: string;
  exercises: unknown;
  created_at?: string;
};

export type WorkoutLog = {
  id?: string;
  split_name?: string;
  exercises: unknown;
  created_at?: string;
};

export function normalizeExercises(value: unknown): PlannedExercise[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (typeof item === "string" && item.trim()) {
      return [{ name: item.trim(), sets: 3, reps: 10, weight: 0 }];
    }
    if (!item || typeof item !== "object") return [];
    const exercise = item as Partial<PlannedExercise>;
    if (typeof exercise.name !== "string" || !exercise.name.trim()) return [];
    return [{
      name: exercise.name.trim(),
      sets: clampNumber(exercise.sets, 1, 10, 3),
      reps: clampNumber(exercise.reps, 1, 30, 10),
      weight: clampNumber(exercise.weight, 0, 1000, 0),
      restSeconds: clampNumber(exercise.restSeconds, 0, 600, 90),
      reason: typeof exercise.reason === "string" ? exercise.reason : undefined,
      completed: typeof exercise.completed === "boolean" ? exercise.completed : undefined,
    }];
  });
}

export function clampNumber(value: unknown, min: number, max: number, fallback: number) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.min(max, Math.max(min, number)) : fallback;
}

export function workoutScore(exercises: PlannedExercise[]) {
  const plannedSets = exercises.reduce((sum, exercise) => sum + exercise.sets, 0);
  if (!plannedSets) return 0;
  const completedSets = exercises.reduce((sum, exercise) => sum + (exercise.completed ? exercise.sets : 0), 0);
  return Math.round((completedSets / plannedSets) * 100);
}

export function getProgressionHint(exercise: PlannedExercise, logs: WorkoutLog[]) {
  const latest = [...logs]
    .sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""))
    .flatMap((log) => normalizeExercises(log.exercises))
    .find((logged) => logged.name.toLowerCase() === exercise.name.toLowerCase() && logged.weight > 0);

  if (!latest) return "No previous logged weight. Start conservatively and record how it feels.";
  if (latest.reps >= exercise.reps && latest.weight >= exercise.weight) {
    const next = Math.round((latest.weight + 2.5) * 10) / 10;
    return `Last logged ${latest.weight} kg × ${latest.reps}. If those sets felt controlled, consider ${next} kg; otherwise repeat ${latest.weight} kg.`;
  }
  return `Last logged ${latest.weight} kg × ${latest.reps}. Repeat that load and aim for clean reps.`;
}

export function getPersonalRecordHint(exercise: PlannedExercise, logs: WorkoutLog[]) {
  const previousLoads = logs
    .flatMap((log) => normalizeExercises(log.exercises))
    .filter((logged) => logged.name.toLowerCase() === exercise.name.toLowerCase() && logged.weight > 0)
    .map((logged) => logged.weight);
  if (!previousLoads.length) return "No logged personal best yet. This session can set your baseline.";
  const best = Math.max(...previousLoads);
  if (exercise.weight > best) return `Potential personal best: ${exercise.weight} kg is above your logged best of ${best} kg. Count it only if you complete the planned reps with controlled form.`;
  return `Logged best: ${best} kg. A small increase may be an option if your warm-up and working sets feel controlled.`;
}
