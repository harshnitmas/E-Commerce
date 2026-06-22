using OrderProcessing.Domain.Common;

namespace OrderProcessing.Domain.Errors;

public static class DomainErrors
{
    public static class Order
    {
        public static readonly DomainError NotFound =
            DomainError.NotFound("Order.NotFound", "Order was not found.");

        public static readonly DomainError AccessDenied =
            DomainError.NotFound("Order.NotFound", "Order was not found.");

        public static readonly DomainError MustHaveItems =
            DomainError.Validation("Order.MustHaveItems", "An order must contain at least one item.");

        public static readonly DomainError CanOnlyCancelPending =
            DomainError.BusinessRule("Order.CanOnlyCancelPending", "Only orders in PENDING status can be cancelled.");

        public static readonly DomainError CancellationReasonRequired =
            DomainError.Validation("Order.CancellationReasonRequired", "A cancellation reason is required.");

        public static DomainError InvalidStatusTransition(string from, string to) =>
            DomainError.BusinessRule("Order.InvalidStatusTransition",
                $"Cannot transition order from {from} to {to}.");

        public static readonly DomainError AlreadyCancelled =
            DomainError.BusinessRule("Order.AlreadyCancelled", "A cancelled order cannot be modified.");

        public static readonly DomainError RefundOnlyForDelivered =
            DomainError.BusinessRule("Order.RefundOnlyForDelivered", "Refunds can only be requested for delivered orders.");

        public static readonly DomainError RefundNotRequested =
            DomainError.BusinessRule("Order.RefundNotRequested", "Order does not have a pending refund request.");
    }

    public static class User
    {
        public static readonly DomainError UsernameTaken =
            DomainError.Conflict("User.UsernameTaken", "Username is already taken.");

        public static readonly DomainError InvalidCredentials =
            DomainError.Validation("User.InvalidCredentials", "Invalid username or password.");
    }

    public static class OrderItem
    {
        public static readonly DomainError ProductNameRequired =
            DomainError.Validation("OrderItem.ProductNameRequired", "Product name is required.");

        public static readonly DomainError QuantityMustBePositive =
            DomainError.Validation("OrderItem.QuantityMustBePositive", "Quantity must be at least 1.");

        public static readonly DomainError PriceMustBePositive =
            DomainError.Validation("OrderItem.PriceMustBePositive", "Unit price must be greater than 0.");
    }

    public static class Inventory
    {
        public static readonly DomainError QuantityMustBePositive =
            DomainError.Validation("Inventory.QuantityMustBePositive", "Quantity must be at least 1.");

        public static readonly DomainError ReservationNotFound =
            DomainError.NotFound("Inventory.ReservationNotFound", "Reservation was not found or has already expired.");

        public static readonly DomainError ProductNotFound =
            DomainError.NotFound("Inventory.ProductNotFound", "Product was not found in inventory.");

        public static DomainError InsufficientStock(string productName, int available) =>
            DomainError.BusinessRule("Inventory.InsufficientStock",
                $"'{productName}' has only {available} unit(s) available.");
    }
}
