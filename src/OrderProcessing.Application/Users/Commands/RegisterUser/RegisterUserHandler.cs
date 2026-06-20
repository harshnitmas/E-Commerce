using MediatR;
using OrderProcessing.Application.DTOs;
using OrderProcessing.Application.Interfaces;
using OrderProcessing.Domain.Common;
using OrderProcessing.Domain.Entities;
using OrderProcessing.Domain.Errors;

namespace OrderProcessing.Application.Users.Commands.RegisterUser;

public class RegisterUserHandler(IUserRepository userRepository, IPasswordHasher passwordHasher)
    : IRequestHandler<RegisterUserCommand, Result<UserDto, DomainError>>
{
    public async Task<Result<UserDto, DomainError>> Handle(RegisterUserCommand command, CancellationToken ct)
    {
        bool taken = await userRepository.ExistsAsync(command.Username, ct).ConfigureAwait(false);
        if (taken) return DomainErrors.User.UsernameTaken;

        string hash = passwordHasher.Hash(command.Password);
        User user = User.Create(command.Username, command.DisplayName, command.Email, hash);
        await userRepository.AddAsync(user, ct).ConfigureAwait(false);

        return new UserDto(user.Username, user.DisplayName, user.Email, user.Role, user.CustomerId);
    }
}
