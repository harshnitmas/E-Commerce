using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OrderProcessing.Domain.Entities;

namespace OrderProcessing.Infrastructure.Persistence.PostgreSQL.Configurations;

public class ProductConfiguration : IEntityTypeConfiguration<Product>
{
    public void Configure(EntityTypeBuilder<Product> builder)
    {
        builder.ToTable("products");
        builder.HasKey(p => p.Id);

        builder.Property(p => p.ExternalId).HasMaxLength(50).IsRequired();
        builder.HasIndex(p => p.ExternalId).IsUnique();

        builder.Property(p => p.Name).HasMaxLength(200).IsRequired();
        builder.Property(p => p.Sku).HasMaxLength(100).IsRequired();
        builder.Property(p => p.Price).HasPrecision(18, 2).IsRequired();
        builder.Property(p => p.Category).HasMaxLength(100).IsRequired();
        builder.Property(p => p.ImageUrl).HasMaxLength(500).IsRequired();

        builder.Property(p => p.StockQuantity).IsRequired();
        builder.Property(p => p.ReservedQuantity).IsRequired();

        builder.Ignore(p => p.AvailableQuantity);
        builder.Ignore(p => p.InStock);
        builder.Ignore(p => p.DomainEvents);
    }
}
