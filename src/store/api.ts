import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react'
import type { FirebaseError } from 'firebase/app'

export type FirestoreError = {
  code: string
  message: string
}

export function toFirestoreError(e: unknown): FirestoreError {
  const err = e as FirebaseError
  return { code: err.code ?? 'unknown', message: err.message ?? String(e) }
}

export const api = createApi({
  baseQuery: fakeBaseQuery<FirestoreError>(),
  tagTypes: ['Task', 'Profile'],
  endpoints: () => ({}),
})
