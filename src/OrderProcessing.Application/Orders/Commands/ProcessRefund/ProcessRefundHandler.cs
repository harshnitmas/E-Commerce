using MediatR;
using Microsoft.Extensions.Logging;
using OrderProcessing.Application.DTOs;
using OrderProcessing.Application.Interfaces;
using OrderProcessing.Domain.Common;
using OrderProcessing.Domain.Entities;
using OrderProcessing.Domain.Errors;

namespace OrderProcessing.Application.Orders.Commands.ProcessRefund;

public class ProcessRefundHandler(
    IOrderRepository orderRepository,
    IProductRepository productRepository,
    ILogger<ProcessRefundHandler> logger)
    : IRequestHandler<ProcessRefundCommand, Result<OrderDto, DomainError>>
{
    public async Task<Result<OrderDto, DomainError>> Handle(
        ProcessRefundCommand command, CancellationToken ct)
    {
        Order? order = await orderRepository.GetByIdAsync(command.OrderId, ct).ConfigureAwait(false);
        if (order is null) return DomainErrors.Order.NotFound;

        Result<Order, DomainError> result = command.Approve
            ? order.ApproveRefund()
            : order.RejectRefund();

        if (result.IsFailure) return result.Error;

        if (command.Approve)
            await RestoreStockAsync(order, ct).ConfigureAwait(false);

        await orderRepository.UpdateAsync(order, ct).ConfigureAwait(false);

        return order.ToDto();
    }

    private async Task RestoreStockAsync(Order order, CancellationToken ct)
    {
        List<string> productIds = order.Items.Select(i => i.ProductId).ToList();
        List<Product> products = await productRepository
            .GetByExternalIdsAsync(productIds, ct).ConfigureAwait(false);

        foreach (OrderItem item in order.Items)
        {
            Product? product = products.FirstOrDefault(p => p.ExternalId == item.ProductId);
            if (product is null)
            {
                logger.LogWarning("Refund stock restore: product {ProductId} not found for order {OrderId}",
                    item.ProductId, order.Id);
                continue;
            }
            product.RestoreStock(item.Quantity);
        }

        await productRepository.UpdateRangeAsync(products, ct).ConfigureAwait(false);
    }
}
