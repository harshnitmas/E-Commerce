using MediatR;
using OrderProcessing.Application.DTOs;
using OrderProcessing.Application.Interfaces;
using OrderProcessing.Domain.Common;

namespace OrderProcessing.Application.Products.Queries.GetProducts;

public class GetProductsHandler(IProductRepository productRepository)
    : IRequestHandler<GetProductsQuery, Result<List<ProductDto>, DomainError>>
{
    public async Task<Result<List<ProductDto>, DomainError>> Handle(
        GetProductsQuery request, CancellationToken ct)
    {
        List<Domain.Entities.Product> products = await productRepository.GetAllAsync(ct).ConfigureAwait(false);
        return products.Select(p => p.ToDto()).ToList();
    }
}
