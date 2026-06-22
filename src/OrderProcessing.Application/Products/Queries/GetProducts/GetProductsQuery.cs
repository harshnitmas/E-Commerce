using MediatR;
using OrderProcessing.Application.DTOs;
using OrderProcessing.Domain.Common;

namespace OrderProcessing.Application.Products.Queries.GetProducts;

public record GetProductsQuery : IRequest<Result<List<ProductDto>, DomainError>>;
