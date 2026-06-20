using MediatR;
using OrderProcessing.Application.DTOs;
using OrderProcessing.Domain.Common;

namespace OrderProcessing.Application.Users.Commands.RegisterUser;

public record RegisterUserCommand(
    string DisplayName,
    string Username,
    string Email,
    string Password) : IRequest<Result<UserDto, DomainError>>;
