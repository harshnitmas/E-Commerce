using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace OrderProcessing.Infrastructure.Persistence.PostgreSQL;

public class AppDbContextFactory : IDesignTimeDbContextFactory<AppDbContext>
{
    public AppDbContext CreateDbContext(string[] args)
    {
        DbContextOptionsBuilder<AppDbContext> optionsBuilder = new();
        optionsBuilder.UseNpgsql(
            "Host=localhost;Port=5432;Database=order_processing;Username=order_user;Password=order_pass");
        return new AppDbContext(optionsBuilder.Options);
    }
}
