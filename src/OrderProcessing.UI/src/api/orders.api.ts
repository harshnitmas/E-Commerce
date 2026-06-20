import apiClient from './client'
import type {
  AuditEventDto, CreateOrderRequest, OrderDto, OrderStatus, PagedResult
} from './types'

export const ordersApi = {
  create: async (payload: CreateOrderRequest): Promise<OrderDto> => {
    const res = await apiClient.post<OrderDto>('/api/v1/orders', payload)
    return res.data
  },

  getById: async (id: string, customerId?: string): Promise<OrderDto> => {
    const res = await apiClient.get<OrderDto>(`/api/v1/orders/${id}`, {
      params: customerId ? { customerId } : undefined,
    })
    return res.data
  },

  list: async (params: {
    status?: OrderStatus
    customerId?: string
    page?: number
    pageSize?: number
  }): Promise<PagedResult<OrderDto>> => {
    const res = await apiClient.get<PagedResult<OrderDto>>('/api/v1/orders', { params })
    return res.data
  },

  updateStatus: async (id: string, status: OrderStatus): Promise<OrderDto> => {
    const res = await apiClient.patch<OrderDto>(`/api/v1/orders/${id}/status`, { status })
    return res.data
  },

  cancel: async (id: string, reason: string): Promise<OrderDto> => {
    const res = await apiClient.post<OrderDto>(`/api/v1/orders/${id}/cancel`, { reason })
    return res.data
  },

  getAudit: async (id: string): Promise<AuditEventDto[]> => {
    const res = await apiClient.get<AuditEventDto[]>(`/api/v1/orders/${id}/audit`)
    return res.data
  },
}
