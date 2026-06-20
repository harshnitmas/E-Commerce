using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using OrderProcessing.Application.DTOs;
using OrderProcessing.Application.Interfaces;
using OrderProcessing.Application.Users.Commands.RegisterUser;
using OrderProcessing.Domain.Common;
using OrderProcessing.Domain.Entities;
using OrderProcessing.Domain.Errors;

namespace OrderProcessing.UnitTests.Users;

public class RegisterUserHandlerTests
{
    private readonly Mock<IUserRepository> _userRepositoryMock = new();
    private readonly Mock<IPasswordHasher> _passwordHasherMock = new();

    private RegisterUserHandler CreateHandler() =>
        new(_userRepositoryMock.Object, _passwordHasherMock.Object);

    [Fact]
    public async Task Handle_WhenUsernameAlreadyTaken_ReturnsUsernameTakenConflictError()
    {
        // Arrange
        _userRepositoryMock
            .Setup(r => r.ExistsAsync("existinguser", It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        RegisterUserCommand command = new("Existing User", "existinguser", "existing@test.com", "Password1!");
        RegisterUserHandler handler = CreateHandler();

        // Act
        Result<UserDto, DomainError> result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsFailure.Should().BeTrue();
        result.Error.Code.Should().Be(DomainErrors.User.UsernameTaken.Code);
        result.Error.Type.Should().Be(ErrorType.Conflict);
    }

    [Fact]
    public async Task Handle_WhenUsernameAvailable_HashesPasswordCreatesUserAndReturnsCorrectDto()
    {
        // Arrange
        const string plainPassword = "SecurePass1!";
        const string hashedPassword = "hashed_SecurePass1!";

        _userRepositoryMock
            .Setup(r => r.ExistsAsync("newuser", It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        _passwordHasherMock
            .Setup(h => h.Hash(plainPassword))
            .Returns(hashedPassword);

        _userRepositoryMock
            .Setup(r => r.AddAsync(It.IsAny<User>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        RegisterUserCommand command = new("New User", "newuser", "new@test.com", plainPassword);
        RegisterUserHandler handler = CreateHandler();

        // Act
        Result<UserDto, DomainError> result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();

        UserDto dto = result.Value;
        dto.Username.Should().Be("newuser");
        dto.DisplayName.Should().Be("New User");
        dto.Email.Should().Be("new@test.com");
        dto.Role.Should().Be("customer");

        _passwordHasherMock.Verify(h => h.Hash(plainPassword), Times.Once);
        _userRepositoryMock.Verify(r => r.AddAsync(It.IsAny<User>(), It.IsAny<CancellationToken>()), Times.Once);
    }
}
