using Microsoft.Extensions.Diagnostics.HealthChecks;
using MongoDB.Bson;
using MongoDB.Driver;

namespace OrderProcessing.API.Middleware;

public class MongoDbHealthCheck(IMongoClient mongoClient) : IHealthCheck
{
    public async Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context, CancellationToken ct = default)
    {
        try
        {
            await mongoClient.GetDatabase("admin")
                .RunCommandAsync<BsonDocument>(new JsonCommand<BsonDocument>("{ping:1}"), cancellationToken: ct);
            return HealthCheckResult.Healthy();
        }
        catch (Exception ex)
        {
            return HealthCheckResult.Unhealthy(ex.Message);
        }
    }
}
