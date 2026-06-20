using MediatR;
using OrderProcessing.Application.DTOs;
using OrderProcessing.Domain.Common;

namespace OrderProcessing.Application.Users.Queries.LoginUser;

public record LoginUserQuery(string Username, string Password)
    : IRequest<Result<UserDto, DomainError>>;
