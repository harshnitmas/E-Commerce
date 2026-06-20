namespace OrderProcessing.Application.DTOs;

public record UserDto(
    string Username,
    string DisplayName,
    string Email,
    string Role,
    string CustomerId);
