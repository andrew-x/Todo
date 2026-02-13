import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore'

import dayjs from '@/lib/dayjs'
import { db } from '@/lib/firebase'
import logger from '@/lib/logger'
import type { Profile } from '@/lib/types'
import { api, toFirestoreError } from '@/store/api'

const profileDoc = (userId: string) => doc(db, 'users', userId)

const profileApi = api.injectEndpoints({
  endpoints: (build) => ({
    getProfile: build.query<Profile, string>({
      queryFn: async (userId) => {
        try {
          const snap = await getDoc(profileDoc(userId))

          if (snap.exists()) {
            const profile = { id: snap.id, ...snap.data() } as Profile
            logger.info('getProfile', { id: profile.id })
            return { data: profile }
          }

          const now = dayjs().valueOf()
          const profile: Profile = {
            id: userId,
            categories: [],
            createdAt: now,
            updatedAt: now,
          }
          await setDoc(profileDoc(userId), profile)
          logger.info('getProfile: created default profile', { id: userId })
          return { data: profile }
        } catch (e) {
          logger.error('getProfile failed', e)
          return { error: toFirestoreError(e) }
        }
      },
      providesTags: (_result, _error, userId) => [
        { type: 'Profile', id: userId },
      ],
    }),

    updateProfile: build.mutation<
      void,
      { userId: string } & Partial<Omit<Profile, 'id' | 'createdAt'>>
    >({
      queryFn: async ({ userId, ...patch }) => {
        try {
          await updateDoc(profileDoc(userId), {
            ...patch,
            updatedAt: dayjs().valueOf(),
          })
          logger.info('updateProfile', {
            id: userId,
            fields: Object.keys(patch),
          })
          return { data: undefined }
        } catch (e) {
          logger.error('updateProfile failed', { id: userId }, e)
          return { error: toFirestoreError(e) }
        }
      },
      invalidatesTags: (_result, _error, { userId }) => [
        { type: 'Profile', id: userId },
      ],
    }),
  }),
})

export const { useGetProfileQuery, useUpdateProfileMutation } = profileApi
