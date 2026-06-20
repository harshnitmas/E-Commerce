using System.Net;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using FluentAssertions;
using OrderProcessing.IntegrationTests.Infrastructure;

namespace OrderProcessing.IntegrationTests.Auth;

public class AuthEndpointsTests : IClassFixture<OrderProcessingWebApplicationFactory>
{
    private readonly HttpClient _client;

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    public AuthEndpointsTests(OrderProcessingWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    private static StringContent JsonBody(object payload) =>
        new(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");

    [Fact]
    public async Task Register_WithValidData_Returns201WithUsernameInData()
    {
        // Arrange
        object request = new
        {
            displayName = "Test User",
            username = $"testuser_{Guid.NewGuid():N}",
            email = "testuser@example.com",
            password = "Password1!"
        };

        // Act
        HttpResponseMessage response = await _client.PostAsync("/api/v1/auth/register", JsonBody(request));

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Created);

        string body = await response.Content.ReadAsStringAsync();
        using JsonDocument doc = JsonDocument.Parse(body);
        JsonElement data = doc.RootElement.GetProperty("data");
        data.GetProperty("username").GetString().Should().NotBeNullOrEmpty();
    }

    [Fact]
    public async Task Register_WithDuplicateUsername_Returns409OnSecondRequest()
    {
        // Arrange
        string username = $"dupuser_{Guid.NewGuid():N}";
        object request = new
        {
            displayName = "Dup User",
            username,
            email = "dup@example.com",
            password = "Password1!"
        };

        // Act — first registration succeeds
        HttpResponseMessage first = await _client.PostAsync("/api/v1/auth/register", JsonBody(request));
        first.StatusCode.Should().Be(HttpStatusCode.Created);

        // Act — second registration with same username
        HttpResponseMessage second = await _client.PostAsync("/api/v1/auth/register", JsonBody(request));

        // Assert
        second.StatusCode.Should().Be(HttpStatusCode.Conflict);
    }

    [Fact]
    public async Task Login_WithValidCredentials_Returns200WithDisplayNameInData()
    {
        // Arrange — register a user first
        string username = $"loginuser_{Guid.NewGuid():N}";
        object registerRequest = new
        {
            displayName = "Login Test User",
            username,
            email = "logintest@example.com",
            password = "Password1!"
        };

        HttpResponseMessage registerResponse = await _client.PostAsync("/api/v1/auth/register", JsonBody(registerRequest));
        registerResponse.StatusCode.Should().Be(HttpStatusCode.Created);

        object loginRequest = new { username, password = "Password1!" };

        // Act
        HttpResponseMessage response = await _client.PostAsync("/api/v1/auth/login", JsonBody(loginRequest));

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        string body = await response.Content.ReadAsStringAsync();
        using JsonDocument doc = JsonDocument.Parse(body);
        JsonElement data = doc.RootElement.GetProperty("data");
        data.GetProperty("displayName").GetString().Should().Be("Login Test User");
    }

    [Fact]
    public async Task Login_WithWrongPassword_Returns401()
    {
        // Arrange — register a user first
        string username = $"wrongpass_{Guid.NewGuid():N}";
        object registerRequest = new
        {
            displayName = "Wrong Pass User",
            username,
            email = "wrongpass@example.com",
            password = "CorrectPass1!"
        };

        HttpResponseMessage registerResponse = await _client.PostAsync("/api/v1/auth/register", JsonBody(registerRequest));
        registerResponse.StatusCode.Should().Be(HttpStatusCode.Created);

        object loginRequest = new { username, password = "WrongPass1!" };

        // Act
        HttpResponseMessage response = await _client.PostAsync("/api/v1/auth/login", JsonBody(loginRequest));

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Login_WithNonexistentUser_Returns401()
    {
        // Arrange
        object loginRequest = new { username = "no_such_user_xyz", password = "AnyPass1!" };

        // Act
        HttpResponseMessage response = await _client.PostAsync("/api/v1/auth/login", JsonBody(loginRequest));

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }
}
