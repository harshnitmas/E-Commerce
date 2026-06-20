import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ordersApi } from '@/api/orders.api'
import type { CreateOrderRequest, OrderStatus } from '@/api/types'

export const ORDER_KEYS = {
  all: ['orders'] as const,
  list: (params: object) => ['orders', 'list', params] as const,
  detail: (id: string) => ['orders', id] as const,
  audit: (id: string) => ['orders', id, 'audit'] as const,
}

export function useOrdersList(params: { status?: OrderStatus; customerId?: string; page?: number; pageSize?: number }) {
  return useQuery({
    queryKey: ORDER_KEYS.list(params),
    queryFn: () => ordersApi.list(params),
    staleTime: 30_000,
  })
}

export function useOrder(id: string, customerId?: string) {
  return useQuery({
    queryKey: ORDER_KEYS.detail(id),
    queryFn: () => ordersApi.getById(id, customerId),
    staleTime: 30_000,
    enabled: !!id,
  })
}

export function useOrderAudit(id: string) {
  return useQuery({
    queryKey: ORDER_KEYS.audit(id),
    queryFn: () => ordersApi.getAudit(id),
    staleTime: 60_000,
    enabled: !!id,
  })
}

export function useCreateOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateOrderRequest) => ordersApi.create(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ORDER_KEYS.all })
    },
  })
}

export function useCancelOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      ordersApi.cancel(id, reason),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ORDER_KEYS.all })
    },
  })
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatus }) =>
      ordersApi.updateStatus(id, status),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ORDER_KEYS.all })
    },
  })
}
