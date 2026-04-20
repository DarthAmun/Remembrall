import Dexie, { type EntityTable } from 'dexie'

export type TaskStatus = 'idle' | 'due' | 'snoozed' | 'overdue'
export type CompletionType = 'done' | 'snoozed'

export interface Task {
  id: string
  title: string
  icon: string
  category: string
  baseInterval: number
  learnedInterval: number
  nextDue: number
  status: TaskStatus
  snoozeUntil: number | null
  createdAt: number
}

export interface Completion {
  id: string
  taskId: string
  type: CompletionType
  dueAt: number
  confirmedAt: number
  actualInterval: number
  snoozeMs: number | null
  note: string | null
}

class RemembrallDB extends Dexie {
  tasks!: EntityTable<Task, 'id'>
  completions!: EntityTable<Completion, 'id'>

  constructor() {
    super('remembrall')
    this.version(1).stores({
      tasks: 'id, status, nextDue, createdAt',
      completions: 'id, taskId, type, dueAt, confirmedAt',
    })
    this.version(2).stores({
      tasks: 'id, status, nextDue, createdAt, category',
      completions: 'id, taskId, type, dueAt, confirmedAt',
    })
  }
}

const db = new RemembrallDB()

export function useDb() {
  return db
}
