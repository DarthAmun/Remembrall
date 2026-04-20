import { useDb } from './useDb'

const MIN_SAMPLES = 5
const TRIM_FRACTION = 0.15

function trimmedMean(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b)
  const cut = Math.floor(sorted.length * TRIM_FRACTION)
  const trimmed = sorted.slice(cut, sorted.length - cut)
  return trimmed.reduce((sum, v) => sum + v, 0) / trimmed.length
}

export async function useIntervalLearning(taskId: string): Promise<number> {
  const db = useDb()

  const task = await db.tasks.get(taskId)
  if (!task) throw new Error(`Task ${taskId} not found`)

  const doneCompletions = await db.completions
    .where('taskId')
    .equals(taskId)
    .filter((c) => c.type === 'done')
    .toArray()

  if (doneCompletions.length < MIN_SAMPLES) {
    return task.baseInterval
  }

  return trimmedMean(doneCompletions.map((c) => c.actualInterval))
}
