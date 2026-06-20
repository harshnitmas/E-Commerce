using System.Security.Cryptography;
using OrderProcessing.Application.Interfaces;

namespace OrderProcessing.Infrastructure.Security;

public class PasswordHasher : IPasswordHasher
{
    private const int SALT_SIZE = 16;
    private const int KEY_SIZE = 32;
    private const int ITERATIONS = 100_000;
    private static readonly HashAlgorithmName ALGORITHM = HashAlgorithmName.SHA256;

    public string Hash(string password)
    {
        byte[] salt = RandomNumberGenerator.GetBytes(SALT_SIZE);
        byte[] key = Rfc2898DeriveBytes.Pbkdf2(password, salt, ITERATIONS, ALGORITHM, KEY_SIZE);
        return $"{Convert.ToBase64String(salt)}.{Convert.ToBase64String(key)}";
    }

    public bool Verify(string password, string hash)
    {
        string[] parts = hash.Split('.');
        if (parts.Length != 2) return false;
        byte[] salt = Convert.FromBase64String(parts[0]);
        byte[] expectedKey = Convert.FromBase64String(parts[1]);
        byte[] actualKey = Rfc2898DeriveBytes.Pbkdf2(password, salt, ITERATIONS, ALGORITHM, KEY_SIZE);
        return CryptographicOperations.FixedTimeEquals(actualKey, expectedKey);
    }
}
