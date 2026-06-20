using System.Net;
using System.Text;
using System.Text.Json;
using FluentAssertions;
using OrderProcessing.IntegrationTests.Infrastructure;

namespace OrderProcessing.IntegrationTests.Orders;

public class OrdersEndpointsTests : IClassFixture<OrderProcessingWebApplicationFactory>
{
    private readonly HttpClient _client;

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    public OrdersEndpointsTests(OrderProcessingWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    private static StringContent JsonBody(object payload) =>
        new(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");

    private static object ValidOrderPayload(string customerId = "cust-test-1") => new
    {
        customerId,
        items = new[]
        {
            new
            {
                productId = "prod-001",
                productName = "Test Widget",
                quantity = 2,
                unitPrice = 12.50m
            }
        }
    };

    private async Task<Guid> CreateOrderAndGetIdAsync(string customerId = "cust-test-1")
    {
        HttpResponseMessage response = await _client.PostAsync("/api/v1/orders", JsonBody(ValidOrderPayload(customerId)));
        response.StatusCode.Should().Be(HttpStatusCode.Created);

        string body = await response.Content.ReadAsStringAsync();
        using JsonDocument doc = JsonDocument.Parse(body);
        string? orderIdStr = doc.RootElement.GetProperty("data").GetProperty("orderId").GetString();
        orderIdStr.Should().NotBeNullOrEmpty();
        return Guid.Parse(orderIdStr!);
    }

    [Fact]
    public async Task CreateOrder_WithValidPayload_Returns201WithOrderId()
    {
        // Act
        HttpResponseMessage response = await _client.PostAsync("/api/v1/orders", JsonBody(ValidOrderPayload()));

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Created);

        string body = await response.Content.ReadAsStringAsync();
        using JsonDocument doc = JsonDocument.Parse(body);
        JsonElement data = doc.RootElement.GetProperty("data");
        string? orderId = data.GetProperty("orderId").GetString();
        orderId.Should().NotBeNullOrEmpty();
        Guid.TryParse(orderId, out _).Should().BeTrue();
    }

    [Fact]
    public async Task CreateOrder_WithEmptyItemsList_Returns400()
    {
        // Arrange
        object payload = new { customerId = "cust-test-1", items = Array.Empty<object>() };

        // Act
        HttpResponseMessage response = await _client.PostAsync("/api/v1/orders", JsonBody(payload));

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task GetOrder_WithValidId_Returns200WithMatchingOrderId()
    {
        // Arrange
        Guid createdId = await CreateOrderAndGetIdAsync();

        // Act
        HttpResponseMessage response = await _client.GetAsync($"/api/v1/orders/{createdId}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        string body = await response.Content.ReadAsStringAsync();
        using JsonDocument doc = JsonDocument.Parse(body);
        string? returnedId = doc.RootElement.GetProperty("data").GetProperty("orderId").GetString();
        returnedId.Should().Be(createdId.ToString());
    }

    [Fact]
    public async Task GetOrder_WithNonexistentId_Returns404()
    {
        // Arrange
        Guid randomId = Guid.NewGuid();

        // Act
        HttpResponseMessage response = await _client.GetAsync($"/api/v1/orders/{randomId}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task CancelOrder_WithValidPendingOrderId_Returns200WithCancelledStatus()
    {
        // Arrange
        Guid orderId = await CreateOrderAndGetIdAsync();
        object cancelRequest = new { reason = "Customer no longer needs this item" };

        // Act
        HttpResponseMessage response = await _client.PostAsync(
            $"/api/v1/orders/{orderId}/cancel", JsonBody(cancelRequest));

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        string body = await response.Content.ReadAsStringAsync();
        using JsonDocument doc = JsonDocument.Parse(body);
        string? status = doc.RootElement.GetProperty("data").GetProperty("status").GetString();
        status.Should().Be("Cancelled");
    }
}
