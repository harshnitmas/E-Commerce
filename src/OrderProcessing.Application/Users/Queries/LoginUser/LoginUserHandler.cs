using MediatR;
using OrderProcessing.Application.DTOs;
using OrderProcessing.Application.Interfaces;
using OrderProcessing.Domain.Common;
using OrderProcessing.Domain.Entities;
using OrderProcessing.Domain.Errors;

namespace OrderProcessing.Application.Users.Queries.LoginUser;

public class LoginUserHandler(IUserRepository userRepository, IPasswordHasher passwordHasher)
    : IRequestHandler<LoginUserQuery, Result<UserDto, DomainError>>
{
    public async Task<Result<UserDto, DomainError>> Handle(LoginUserQuery query, CancellationToken ct)
    {
        User? user = await userRepository.GetByUsernameAsync(query.Username, ct).ConfigureAwait(false);
        if (user is null) return DomainErrors.User.InvalidCredentials;

        bool valid = passwordHasher.Verify(query.Password, user.PasswordHash);
        if (!valid) return DomainErrors.User.InvalidCredentials;

        return new UserDto(user.Username, user.DisplayName, user.Email, user.Role, user.CustomerId);
    }
}
