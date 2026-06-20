using FluentAssertions;
using Moq;
using OrderProcessing.Application.DTOs;
using OrderProcessing.Application.Interfaces;
using OrderProcessing.Application.Users.Queries.LoginUser;
using OrderProcessing.Domain.Common;
using OrderProcessing.Domain.Entities;
using OrderProcessing.Domain.Errors;

namespace OrderProcessing.UnitTests.Users;

public class LoginUserHandlerTests
{
    private readonly Mock<IUserRepository> _userRepositoryMock = new();
    private readonly Mock<IPasswordHasher> _passwordHasherMock = new();

    private LoginUserHandler CreateHandler() =>
        new(_userRepositoryMock.Object, _passwordHasherMock.Object);

    [Fact]
    public async Task Handle_WhenUserNotFound_ReturnsInvalidCredentialsError()
    {
        // Arrange
        _userRepositoryMock
            .Setup(r => r.GetByUsernameAsync("ghost", It.IsAny<CancellationToken>()))
            .ReturnsAsync((User?)null);

        LoginUserQuery query = new("ghost", "anypassword");
        LoginUserHandler handler = CreateHandler();

        // Act
        Result<UserDto, DomainError> result = await handler.Handle(query, CancellationToken.None);

        // Assert
        result.IsFailure.Should().BeTrue();
        result.Error.Code.Should().Be(DomainErrors.User.InvalidCredentials.Code);
    }

    [Fact]
    public async Task Handle_WhenPasswordIsInvalid_ReturnsInvalidCredentialsError()
    {
        // Arrange
        User user = User.Create("validuser", "Valid User", "valid@test.com", "hashed_correctpass");

        _userRepositoryMock
            .Setup(r => r.GetByUsernameAsync("validuser", It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);

        _passwordHasherMock
            .Setup(h => h.Verify("wrongpassword", user.PasswordHash))
            .Returns(false);

        LoginUserQuery query = new("validuser", "wrongpassword");
        LoginUserHandler handler = CreateHandler();

        // Act
        Result<UserDto, DomainError> result = await handler.Handle(query, CancellationToken.None);

        // Assert
        result.IsFailure.Should().BeTrue();
        result.Error.Code.Should().Be(DomainErrors.User.InvalidCredentials.Code);
    }

    [Fact]
    public async Task Handle_WhenCredentialsAreValid_ReturnsUserDtoWithCorrectFields()
    {
        // Arrange
        User user = User.Create("validuser", "Valid User", "valid@test.com", "hashed_correctpass");

        _userRepositoryMock
            .Setup(r => r.GetByUsernameAsync("validuser", It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);

        _passwordHasherMock
            .Setup(h => h.Verify("correctpass", user.PasswordHash))
            .Returns(true);

        LoginUserQuery query = new("validuser", "correctpass");
        LoginUserHandler handler = CreateHandler();

        // Act
        Result<UserDto, DomainError> result = await handler.Handle(query, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();

        UserDto dto = result.Value;
        dto.Username.Should().Be("validuser");
        dto.DisplayName.Should().Be("Valid User");
        dto.Email.Should().Be("valid@test.com");
        dto.Role.Should().Be("customer");
    }
}
