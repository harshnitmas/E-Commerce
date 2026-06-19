namespace OrderProcessing.API.Models;

public record ApiResponse<T>(T? Data, List<string>? Errors, ApiMetadata Metadata)
{
    public static ApiResponse<T> Ok(T data, string correlationId) =>
        new(data, null, new ApiMetadata(correlationId, DateTimeOffset.UtcNow));

    public static ApiResponse<T> Fail(List<string> errors, string correlationId) =>
        new(default, errors, new ApiMetadata(correlationId, DateTimeOffset.UtcNow));
}

public record ApiMetadata(string CorrelationId, DateTimeOffset Timestamp);
