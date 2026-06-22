namespace OrderProcessing.Application.DTOs;

public record ReservationDto(
    Guid ReservationId,
    string ExternalProductId,
    int Quantity,
    DateTimeOffset ExpiresAt);
