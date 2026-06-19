namespace OrderProcessing.Domain.Common;

public enum ErrorType { Validation, NotFound, BusinessRule, Conflict }

public record DomainError(string Code, string Message, ErrorType Type)
{
    public static DomainError Validation(string code, string message) =>
        new(code, message, ErrorType.Validation);

    public static DomainError NotFound(string code, string message) =>
        new(code, message, ErrorType.NotFound);

    public static DomainError BusinessRule(string code, string message) =>
        new(code, message, ErrorType.BusinessRule);

    public static DomainError Conflict(string code, string message) =>
        new(code, message, ErrorType.Conflict);
}
