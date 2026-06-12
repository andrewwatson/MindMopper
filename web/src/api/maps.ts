import { api } from './client'
import type { MapSummary, MapWithTree } from '../types/api'

export const mapsApi = {
  list: () => api.get<{ maps: MapSummary[] }>('/maps').then(r => r.maps),
  create: (title: string) => api.post<MapSummary>('/maps', { title }),
  get: (id: string) => api.get<MapWithTree>(`/maps/${id}`),
  rename: (id: string, title: string) => api.patch<MapSummary>(`/maps/${id}`, { title }),
  delete: (id: string) => api.delete<void>(`/maps/${id}`),
  saveTree: (id: string, rootId: string, nodes: unknown[]) =>
    api.put<{ savedAt: string }>(`/maps/${id}/tree`, { rootId, nodes }),
}
