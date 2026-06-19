export type OrderStatus = 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled'

export interface OrderItemDto {
  orderItemId: string
  productId: string
  productName: string
  quantity: number
  unitPrice: number
  subtotal: number
}

export interface OrderDto {
  orderId: string
  customerId: string
  status: OrderStatus
  totalAmount: number
  createdAt: string
  updatedAt: string
  cancelledAt?: string
  cancellationReason?: string
  items: OrderItemDto[]
}

export interface PagedResult<T> {
  items: T[]
  page: number
  pageSize: number
  totalCount: number
  totalPages: number
}

export interface AuditEventDto {
  id: string
  orderId: string
  eventType: string
  previousStatus?: string
  newStatus: string
  triggeredBy: string
  occurredAt: string
}

export interface ApiResponse<T> {
  data: T
  errors: string[] | null
  metadata: { correlationId: string; timestamp: string }
}

export interface ApiError {
  title: string
  status: number
  detail?: string
  errors?: string[]
  correlationId?: string
}

export interface CreateOrderRequest {
  customerId: string
  items: {
    productId: string
    productName: string
    quantity: number
    unitPrice: number
  }[]
}
