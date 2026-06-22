using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using OrderProcessing.Domain.Entities;

namespace OrderProcessing.Infrastructure.Persistence.PostgreSQL;

public static class ProductSeeder
{
    public static async Task SeedAsync(AppDbContext db, ILogger logger, CancellationToken ct = default)
    {
        if (await db.Products.AnyAsync(ct).ConfigureAwait(false)) return;

        List<Product> products =
        [
            Product.Create("prod-001", "UltraBook Pro 15\"", "TP-UB-15-001", 1299m, "Electronics", "https://picsum.photos/seed/prod001/400/400", 12),
            Product.Create("prod-002", "ProSound Headphones X1", "AE-X1-BLK", 299m, "Electronics", "https://picsum.photos/seed/prod002/400/400", 45),
            Product.Create("prod-003", "SmartPhone Z9 Ultra", "NT-Z9U-256", 999m, "Electronics", "https://picsum.photos/seed/prod003/400/400", 23),
            Product.Create("prod-004", "TabView Pro 12\"", "TP-TAB-12-256", 799m, "Electronics", "https://picsum.photos/seed/prod004/400/400", 8),
            Product.Create("prod-005", "MirrorLens DSLR 4K", "OP-ML4K-BODY", 2499m, "Electronics", "https://picsum.photos/seed/prod005/400/400", 5),
            Product.Create("prod-006", "WristTech Smart 3", "WT-S3-45MM", 349m, "Electronics", "https://picsum.photos/seed/prod006/400/400", 34),
            Product.Create("prod-007", "Clean Code (2nd Ed)", "BK-CC-2ED", 49m, "Books", "https://picsum.photos/seed/prod007/400/400", 100),
            Product.Create("prod-008", "System Design Interview", "BK-SDI-V2", 39m, "Books", "https://picsum.photos/seed/prod008/400/400", 200),
            Product.Create("prod-009", "Atomic Habits", "BK-AH-HC", 27m, "Books", "https://picsum.photos/seed/prod009/400/400", 500),
            Product.Create("prod-010", "Designing Data-Intensive Apps", "BK-DDIA-1ED", 59m, "Books", "https://picsum.photos/seed/prod010/400/400", 150),
            Product.Create("prod-011", "UrbanFlex Jogger Pants", "UF-JP-M-BLK", 79m, "Clothing", "https://picsum.photos/seed/prod011/400/400", 67),
            Product.Create("prod-012", "Alpine Waterproof Jacket", "AG-WJ-M-NVY", 189m, "Clothing", "https://picsum.photos/seed/prod012/400/400", 23),
            Product.Create("prod-013", "ComfortFit Classic Tee", "EW-CFT-L-WHT", 35m, "Clothing", "https://picsum.photos/seed/prod013/400/400", 200),
            Product.Create("prod-014", "SlimFit Chino Pants", "UF-SFC-32-KHK", 89m, "Clothing", "https://picsum.photos/seed/prod014/400/400", 45),
            Product.Create("prod-015", "SmartChef Air Fryer 6L", "SC-AF6L-BLK", 129m, "Home & Kitchen", "https://picsum.photos/seed/prod015/400/400", 34),
            Product.Create("prod-016", "ErgoDesk Standing Mat", "EL-SDM-BLK", 89m, "Home & Kitchen", "https://picsum.photos/seed/prod016/400/400", 56),
            Product.Create("prod-017", "PressoPro Espresso Machine", "PP-EM-1500-SS", 399m, "Home & Kitchen", "https://picsum.photos/seed/prod017/400/400", 18),
            Product.Create("prod-018", "OmniBlend Pro Blender", "OB-PRO-1800", 159m, "Home & Kitchen", "https://picsum.photos/seed/prod018/400/400", 29),
            Product.Create("prod-019", "TrailRunner X5 Shoes", "TP-TX5-10-GRY", 139m, "Sports", "https://picsum.photos/seed/prod019/400/400", 34),
            Product.Create("prod-020", "PowerFlex Resistance Bands", "PF-RB5-SET", 49m, "Sports", "https://picsum.photos/seed/prod020/400/400", 200),
            Product.Create("prod-021", "YogaFlow Premium Mat", "YF-PM-6MM-GRN", 79m, "Sports", "https://picsum.photos/seed/prod021/400/400", 67),
            Product.Create("prod-022", "GlowSerum Vitamin C", "GL-VCS-30ML", 59m, "Beauty", "https://picsum.photos/seed/prod022/400/400", 89),
            Product.Create("prod-023", "HydraFusion Moisturizer", "HL-HFM-50ML", 45m, "Beauty", "https://picsum.photos/seed/prod023/400/400", 120),
            Product.Create("prod-024", "SunShield SPF 50+ Sunscreen", "SG-SS50-100ML", 29m, "Beauty", "https://picsum.photos/seed/prod024/400/400", 234),
        ];

        await db.Products.AddRangeAsync(products, ct).ConfigureAwait(false);
        await db.SaveChangesAsync(ct).ConfigureAwait(false);
        logger.LogInformation("ProductSeeder: seeded {Count} products", products.Count);
    }
}
