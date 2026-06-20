namespace OrderProcessing.Domain.Entities;

public sealed class User
{
    public Guid Id { get; private set; }
    public string Username { get; private set; } = string.Empty;
    public string DisplayName { get; private set; } = string.Empty;
    public string Email { get; private set; } = string.Empty;
    public string PasswordHash { get; private set; } = string.Empty;
    public string Role { get; private set; } = string.Empty;
    public string CustomerId { get; private set; } = string.Empty;
    public DateTimeOffset CreatedAt { get; private set; }

    private User() { } // required by EF Core

    public static User Create(
        string username,
        string displayName,
        string email,
        string passwordHash,
        string role = "customer",
        string? customerId = null)
    {
        return new User
        {
            Id = Guid.NewGuid(),
            Username = username,
            DisplayName = displayName,
            Email = email,
            PasswordHash = passwordHash,
            Role = role,
            CustomerId = customerId ?? $"cust-{Guid.NewGuid()}",
            CreatedAt = DateTimeOffset.UtcNow,
        };
    }
}
