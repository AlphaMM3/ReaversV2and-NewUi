import { useQuery } from '@tanstack/react-query'
import { api } from './api'
import type { SupportTicket } from './superAdminStore'

export const supportApi = {
  create: (body: unknown) => api.post<{ id: string; token: string }>('/support/tickets', body),
  reply: (id: string, body: unknown) => api.post('/support/tickets/' + id + '/reply', body),
  status: (id: string, status: SupportTicket['status']) => api.post('/support/tickets/' + id + '/status', { status }),
}

export function useSupportTickets() {
  return useQuery({
    queryKey: ['support-tickets'],
    queryFn: () => api.get<SupportTicket[]>('/support/tickets'),
    refetchInterval: 5000,
  })
}
