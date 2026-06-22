namespace OrderProcessing.Domain.Enums;

public enum OrderStatus
{
    Pending,
    Processing,
    Shipped,
    Delivered,
    Cancelled,
    RefundRequested,
    RefundApproved,
    RefundRejected
}
