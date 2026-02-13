import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  setDoc,
  startAfter,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore'

import dayjs from '@/lib/dayjs'
import { db } from '@/lib/firebase'
import { generateId } from '@/lib/id'
import logger from '@/lib/logger'
import type { Task } from '@/lib/types'
import { api, toFirestoreError } from '@/store/api'

const tasksCollection = (userId: string) =>
  collection(db, 'users', userId, 'tasks')

const taskDoc = (userId: string, taskId: string) =>
  doc(db, 'users', userId, 'tasks', taskId)

const todosApi = api.injectEndpoints({
  endpoints: (build) => ({
    listActiveTasks: build.query<Task[], string>({
      queryFn: async (userId) => {
        try {
          const oneMonthAgo = dayjs().subtract(1, 'month').valueOf()

          // Incomplete tasks + recently completed tasks (within last month)
          const [todoSnap, recentDoneSnap] = await Promise.all([
            getDocs(
              query(
                tasksCollection(userId),
                where('isDone', '==', false),
                orderBy('createdAt', 'desc'),
              ),
            ),
            getDocs(
              query(
                tasksCollection(userId),
                where('isDone', '==', true),
                where('updatedAt', '>=', oneMonthAgo),
                orderBy('updatedAt', 'desc'),
              ),
            ),
          ])

          const tasks = [
            ...todoSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as Task),
            ...recentDoneSnap.docs.map(
              (d) => ({ id: d.id, ...d.data() }) as Task,
            ),
          ]
          logger.info('listActiveTasks', { count: tasks.length })
          return { data: tasks }
        } catch (e) {
          logger.error('listActiveTasks failed', e)
          return { error: toFirestoreError(e) }
        }
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Task' as const, id })),
              { type: 'Task', id: 'ACTIVE_LIST' },
            ]
          : [{ type: 'Task', id: 'ACTIVE_LIST' }],
    }),

    listInactiveTasks: build.query<Task[], string>({
      queryFn: async (userId) => {
        try {
          const oneMonthAgo = dayjs().subtract(1, 'month').valueOf()

          const q = query(
            tasksCollection(userId),
            where('isDone', '==', true),
            where('updatedAt', '<', oneMonthAgo),
            orderBy('updatedAt', 'desc'),
          )
          const snap = await getDocs(q)
          const tasks = snap.docs.map(
            (d) => ({ id: d.id, ...d.data() }) as Task,
          )
          logger.info('listInactiveTasks', { count: tasks.length })
          return { data: tasks }
        } catch (e) {
          logger.error('listInactiveTasks failed', e)
          return { error: toFirestoreError(e) }
        }
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Task' as const, id })),
              { type: 'Task', id: 'INACTIVE_LIST' },
            ]
          : [{ type: 'Task', id: 'INACTIVE_LIST' }],
    }),

    listCompletedTasks: build.query<
      { tasks: Task[]; hasMore: boolean },
      { userId: string; afterUpdatedAt?: number }
    >({
      queryFn: async ({ userId, afterUpdatedAt }) => {
        try {
          const PAGE_SIZE = 100

          const q =
            afterUpdatedAt !== undefined
              ? query(
                  tasksCollection(userId),
                  where('isDone', '==', true),
                  orderBy('updatedAt', 'desc'),
                  startAfter(afterUpdatedAt),
                  limit(PAGE_SIZE + 1),
                )
              : query(
                  tasksCollection(userId),
                  where('isDone', '==', true),
                  orderBy('updatedAt', 'desc'),
                  limit(PAGE_SIZE + 1),
                )

          const snap = await getDocs(q)
          const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Task)

          const hasMore = docs.length > PAGE_SIZE
          const tasks = hasMore ? docs.slice(0, PAGE_SIZE) : docs

          logger.info('listCompletedTasks', {
            count: tasks.length,
            hasMore,
          })
          return { data: { tasks, hasMore } }
        } catch (e) {
          logger.error('listCompletedTasks failed', e)
          return { error: toFirestoreError(e) }
        }
      },
      providesTags: (result) =>
        result
          ? [
              ...result.tasks.map(({ id }) => ({
                type: 'Task' as const,
                id,
              })),
              { type: 'Task', id: 'COMPLETED_LIST' },
            ]
          : [{ type: 'Task', id: 'COMPLETED_LIST' }],
    }),

    createTask: build.mutation<
      Task,
      { userId: string; title: string } & Partial<
        Omit<Task, 'id' | 'title' | 'createdAt' | 'updatedAt'>
      >
    >({
      queryFn: async ({ userId, ...fields }) => {
        try {
          const now = dayjs().valueOf()
          const task: Task = {
            id: generateId('task'),
            userId,
            title: fields.title,
            description: fields.description ?? '',
            isDone: fields.isDone ?? false,
            category: fields.category ?? null,
            queue: fields.queue ?? null,
            priority: fields.priority ?? null,
            order: fields.order ?? null,
            dueDate: fields.dueDate ?? null,
            createdAt: now,
            updatedAt: now,
          }
          await setDoc(taskDoc(userId, task.id), task)
          logger.info('createTask', { id: task.id, title: task.title })
          return { data: task }
        } catch (e) {
          logger.error('createTask failed', e)
          return { error: toFirestoreError(e) }
        }
      },
      invalidatesTags: [{ type: 'Task', id: 'ACTIVE_LIST' }],
    }),

    updateTask: build.mutation<
      void,
      { userId: string; id: string } & Partial<Omit<Task, 'id' | 'createdAt'>>
    >({
      queryFn: async ({ userId, id, ...patch }) => {
        try {
          await updateDoc(taskDoc(userId, id), {
            ...patch,
            updatedAt: dayjs().valueOf(),
          })
          logger.info('updateTask', { id, fields: Object.keys(patch) })
          return { data: undefined }
        } catch (e) {
          logger.error('updateTask failed', { id }, e)
          return { error: toFirestoreError(e) }
        }
      },
      invalidatesTags: (_result, _error, arg) => {
        const tags: { type: 'Task'; id: string }[] = [
          { type: 'Task', id: arg.id },
        ]
        if ('isDone' in arg) {
          tags.push(
            { type: 'Task', id: 'ACTIVE_LIST' },
            { type: 'Task', id: 'INACTIVE_LIST' },
            { type: 'Task', id: 'COMPLETED_LIST' },
          )
        }
        return tags
      },
    }),

    deleteTask: build.mutation<void, { userId: string; id: string }>({
      queryFn: async ({ userId, id }) => {
        try {
          await deleteDoc(taskDoc(userId, id))
          logger.info('deleteTask', { id })
          return { data: undefined }
        } catch (e) {
          logger.error('deleteTask failed', { id }, e)
          return { error: toFirestoreError(e) }
        }
      },
      invalidatesTags: (_result, _error, arg) => [
        { type: 'Task', id: arg.id },
        { type: 'Task', id: 'ACTIVE_LIST' },
        { type: 'Task', id: 'INACTIVE_LIST' },
        { type: 'Task', id: 'COMPLETED_LIST' },
      ],
    }),
  }),
})

// Second injection: batchUpdateTasks needs to reference listActiveTasks for optimistic updates
const todosApiExtended = todosApi.injectEndpoints({
  endpoints: (build) => ({
    batchUpdateTasks: build.mutation<
      void,
      {
        userId: string
        updates: Array<
          { id: string } & Partial<
            Pick<Task, 'queue' | 'priority' | 'order' | 'dueDate'>
          >
        >
      }
    >({
      queryFn: async ({ userId, updates }) => {
        try {
          const batch = writeBatch(db)
          const now = dayjs().valueOf()
          for (const { id, ...patch } of updates) {
            batch.update(taskDoc(userId, id), { ...patch, updatedAt: now })
          }
          await batch.commit()
          logger.info('batchUpdateTasks', {
            count: updates.length,
            ids: updates.map((u) => u.id),
          })
          return { data: undefined }
        } catch (e) {
          logger.error('batchUpdateTasks failed', e)
          return { error: toFirestoreError(e) }
        }
      },
      async onQueryStarted({ userId, updates }, { dispatch, queryFulfilled }) {
        const now = dayjs().valueOf()
        const patchResult = dispatch(
          todosApi.util.updateQueryData('listActiveTasks', userId, (draft) => {
            for (const { id, ...patch } of updates) {
              const task = draft.find((t) => t.id === id)
              if (task) {
                Object.assign(task, patch)
                task.updatedAt = now
              }
            }
          }),
        )
        queryFulfilled.catch(patchResult.undo)
      },
    }),
  }),
})

export const {
  useListActiveTasksQuery,
  useListInactiveTasksQuery,
  useLazyListCompletedTasksQuery,
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useDeleteTaskMutation,
} = todosApi

export const { useBatchUpdateTasksMutation } = todosApiExtended
