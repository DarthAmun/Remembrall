import { ref } from 'vue'
import type { Task, TaskStatus } from './useDb'

const DAY = 86_400_000

const _tasks = ref<Task[]>([])
let _initPromise: Promise<void> | null = null

export function daysOffset(nextDue: number): number {
  return Math.round((nextDue - Date.now()) / DAY)
}

export function computeStatus(nextDue: number, snoozeUntil: number | null): TaskStatus {
  const now = Date.now()
  if (snoozeUntil && snoozeUntil > now) return 'snoozed'
  const diff = nextDue - now
  if (diff < 0) return 'overdue'
  if (diff < 2 * DAY) return 'due'
  return 'idle'
}

const SEED_TASKS = [
  { icon: '🍊', title: 'Take vitamins',  category: 'health',  intervalDays: 1,  offsetDays: -3, historyOffsets: [-3,-4,-5,-6,-7] },
  { icon: '🌱', title: 'Water the plants', category: 'home',   intervalDays: 3,  offsetDays: -1, historyOffsets: [-1,-4,-7,-10] },
  { icon: '📞', title: 'Call mom',        category: 'social',  intervalDays: 7,  offsetDays: 0,  historyOffsets: [-7,-14,-21,-28] },
  { icon: '🧾', title: 'Review budget',   category: 'finance', intervalDays: 14, offsetDays: 1,  historyOffsets: [-14,-28,-42] },
  { icon: '🏋️', title: 'Gym session',    category: 'health',  intervalDays: 2,  offsetDays: 3,  historyOffsets: [-3,-5,-7,-9] },
  { icon: '🧹', title: 'Clean kitchen',   category: 'home',    intervalDays: 7,  offsetDays: 5,  historyOffsets: [-5,-12,-19] },
  { icon: '📖', title: 'Read 20 pages',   category: 'growth',  intervalDays: 1,  offsetDays: 2,  historyOffsets: [-2,-3,-4,-5,-6] },
  { icon: '🦷', title: 'Floss teeth',     category: 'health',  intervalDays: 1,  offsetDays: 4,  historyOffsets: [-4,-5,-6,-7,-8,-9] },
]

async function seed(db: ReturnType<typeof useDb>) {
  const now = Date.now()
  for (const s of SEED_TASKS) {
    const baseInterval = s.intervalDays * DAY
    const nextDue = now + s.offsetDays * DAY
    const id = crypto.randomUUID()
    await db.tasks.add({
      id,
      title: s.title,
      icon: s.icon,
      category: s.category,
      baseInterval,
      learnedInterval: baseInterval,
      nextDue,
      status: computeStatus(nextDue, null),
      snoozeUntil: null,
      createdAt: now - 30 * DAY,
    })
    for (let i = 0; i < s.historyOffsets.length; i++) {
      const confirmedAt = now + s.historyOffsets[i] * DAY
      const prevAt = i < s.historyOffsets.length - 1
        ? now + s.historyOffsets[i + 1] * DAY
        : confirmedAt - baseInterval
      await db.completions.add({
        id: crypto.randomUUID(),
        taskId: id,
        type: 'done',
        dueAt: confirmedAt,
        confirmedAt,
        actualInterval: confirmedAt - prevAt,
        snoozeMs: null,
        note: null,
      })
    }
  }
}

async function load() {
  const db = useDb()
  if ((await db.tasks.count()) === 0) await seed(db)
  _tasks.value = await db.tasks.orderBy('nextDue').toArray()
}

export async function reloadTasks() {
  _tasks.value = await useDb().tasks.orderBy('nextDue').toArray()
}

export function useTasks() {
  function init(): Promise<void> {
    if (import.meta.server) return Promise.resolve()
    if (!_initPromise) _initPromise = load()
    return _initPromise
  }

  async function reload() {
    _tasks.value = await useDb().tasks.orderBy('nextDue').toArray()
  }

  async function completeTask(id: string) {
    const db = useDb()
    const task = _tasks.value.find(t => t.id === id)
    if (!task) return
    const now = Date.now()
    await db.completions.add({
      id: crypto.randomUUID(),
      taskId: id,
      type: 'done',
      dueAt: task.nextDue,
      confirmedAt: now,
      actualInterval: now - (task.nextDue - task.learnedInterval),
      snoozeMs: null,
      note: null,
    })
    const learned = await useIntervalLearning(id)
    const nextDue = now + learned
    await db.tasks.update(id, {
      learnedInterval: learned,
      nextDue,
      status: computeStatus(nextDue, null),
      snoozeUntil: null,
    })
    await reload()
  }

  async function snoozeTask(id: string, ms: number) {
    const db = useDb()
    const task = _tasks.value.find(t => t.id === id)
    if (!task) return
    const now = Date.now()
    await db.completions.add({
      id: crypto.randomUUID(),
      taskId: id,
      type: 'snoozed',
      dueAt: task.nextDue,
      confirmedAt: now,
      actualInterval: 0,
      snoozeMs: ms,
      note: null,
    })
    await db.tasks.update(id, { snoozeUntil: now + ms, status: 'snoozed' })
    await reload()
  }

  async function skipTask(id: string) {
    const db = useDb()
    const task = _tasks.value.find(t => t.id === id)
    if (!task) return
    const nextDue = Date.now() + task.learnedInterval
    await db.tasks.update(id, {
      nextDue,
      status: computeStatus(nextDue, null),
      snoozeUntil: null,
    })
    await reload()
  }

  async function renameTask(id: string, title: string) {
    await useDb().tasks.update(id, { title })
    await reload()
  }

  async function deleteTask(id: string) {
    const db = useDb()
    await db.completions.where('taskId').equals(id).delete()
    await db.tasks.delete(id)
    await reload()
  }

  async function updateTask(id: string, data: { icon: string; title: string; intervalDays: number; category: string }) {
    const db = useDb()
    const task = _tasks.value.find(t => t.id === id)
    if (!task) return
    const baseInterval = data.intervalDays * DAY
    const update: Partial<Task> = { icon: data.icon, title: data.title, category: data.category, baseInterval }
    if (baseInterval !== task.baseInterval) {
      const nextDue = Date.now() + baseInterval
      update.learnedInterval = baseInterval
      update.nextDue = nextDue
      update.status = computeStatus(nextDue, task.snoozeUntil)
    }
    await db.tasks.update(id, update)
    await reload()
  }

  async function addTask(data: { icon: string; title: string; intervalDays: number; category: string; firstDueAt?: number }) {
    const db = useDb()
    const now = Date.now()
    const baseInterval = data.intervalDays * DAY
    const nextDue = data.firstDueAt ?? now + baseInterval
    await db.tasks.add({
      id: crypto.randomUUID(),
      title: data.title,
      icon: data.icon,
      category: data.category,
      baseInterval,
      learnedInterval: baseInterval,
      nextDue,
      status: computeStatus(nextDue, null),
      snoozeUntil: null,
      createdAt: now,
    })
    await reload()
  }

  return { tasks: _tasks, init, addTask, updateTask, completeTask, snoozeTask, skipTask, renameTask, deleteTask }
}
