import apiClient from '@/api/client'
import type { ProductDto, ReservationDto } from '@/api/types'

export const productsApi = {
  getAll: async (): Promise<ProductDto[]> => {
    const res = await apiClient.get<ProductDto[]>('/products')
    return res.data
  },

  reserveStock: async (customerId: string, items: { externalProductId: string; quantity: number }[]): Promise<ReservationDto[]> => {
    const res = await apiClient.post<ReservationDto[]>('/products/reserve', { customerId, items })
    return res.data
  },

  releaseReservations: async (reservationIds: string[]): Promise<void> => {
    await apiClient.post('/products/release', { reservationIds })
  },

  requestRefund: async (orderId: string, customerId: string): Promise<void> => {
    await apiClient.post(`/orders/${orderId}/refund/request`, { customerId })
  },

  processRefund: async (orderId: string, approve: boolean): Promise<void> => {
    await apiClient.post(`/orders/${orderId}/refund/process`, { approve })
  },
}
