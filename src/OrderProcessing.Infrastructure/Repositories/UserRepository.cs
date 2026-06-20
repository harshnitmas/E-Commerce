using Microsoft.EntityFrameworkCore;
using OrderProcessing.Application.Interfaces;
using OrderProcessing.Domain.Entities;
using OrderProcessing.Infrastructure.Persistence.PostgreSQL;

namespace OrderProcessing.Infrastructure.Repositories;

public class UserRepository(AppDbContext db) : IUserRepository
{
    public async Task<User?> GetByUsernameAsync(string username, CancellationToken ct = default) =>
        await db.Users
            .FirstOrDefaultAsync(u => u.Username.ToLower() == username.ToLower(), ct)
            .ConfigureAwait(false);

    public async Task<bool> ExistsAsync(string username, CancellationToken ct = default) =>
        await db.Users
            .AnyAsync(u => u.Username.ToLower() == username.ToLower(), ct)
            .ConfigureAwait(false);

    public async Task AddAsync(User user, CancellationToken ct = default)
    {
        await db.Users.AddAsync(user, ct).ConfigureAwait(false);
        await db.SaveChangesAsync(ct).ConfigureAwait(false);
    }
}
