import { api } from './client'
import type { MapWithTree, ShareLink } from '../types/api'

export const shareApi = {
  create: (mapId: string) => api.post<ShareLink>(`/maps/${mapId}/share`),
  revoke: (mapId: string) => api.delete<void>(`/maps/${mapId}/share`),
  getShared: (token: string) =>
    api.getPublic<MapWithTree>(`/shared/${token}`),
}
