using Microsoft.Extensions.Configuration;

namespace backend.Infrastructure;

/// <summary>
/// Resolves ML URL and API key from IConfiguration plus raw env (Azure sometimes differs from config binding).
/// On Azure or in Production/Staging, ignores loopback BaseUrl from JSON so a real app setting can win.
/// </summary>
public static class MlAppSettings
{
    private static bool IsRunningOnAzureAppService() =>
        !string.IsNullOrEmpty(Environment.GetEnvironmentVariable("WEBSITE_INSTANCE_ID"));

    private static bool IsProductionLike()
    {
        var env = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT");
        return string.Equals(env, "Production", StringComparison.OrdinalIgnoreCase)
            || string.Equals(env, "Staging", StringComparison.OrdinalIgnoreCase);
    }

    private static bool IsLoopbackMlBase(string? url)
    {
        var t = url?.Trim();
        if (string.IsNullOrWhiteSpace(t)) return false;
        if (!Uri.TryCreate(t, UriKind.Absolute, out var u))
            return t.Contains("localhost", StringComparison.OrdinalIgnoreCase)
                || t.Contains("127.0.0.1", StringComparison.OrdinalIgnoreCase);
        return u.IsLoopback;
    }

    public static string? ResolveBaseUrl(IConfiguration configuration)
    {
        var fromConfig = configuration["Ml:BaseUrl"]?.Trim();
        if (!string.IsNullOrWhiteSpace(fromConfig))
        {
            var rejectLoopback = IsRunningOnAzureAppService() || IsProductionLike();
            if (!(rejectLoopback && IsLoopbackMlBase(fromConfig)))
                return fromConfig.TrimEnd('/');
        }

        foreach (var key in new[]
                 {
                     "Ml__BaseUrl",
                     "APPSETTING_Ml__BaseUrl",
                     "Ml_BaseUrl",
                     "APPSETTING_Ml_BaseUrl",
                 })
        {
            var v = Environment.GetEnvironmentVariable(key)?.Trim();
            if (string.IsNullOrWhiteSpace(v)) continue;
            if (IsRunningOnAzureAppService() && IsLoopbackMlBase(v)) continue;
            return v.TrimEnd('/');
        }

        return null;
    }

    public static string? ResolveApiKey(IConfiguration configuration)
    {
        var fromConfig = configuration["Ml:ApiKey"]?.Trim();
        if (!string.IsNullOrWhiteSpace(fromConfig))
            return fromConfig;

        foreach (var key in new[] { "Ml__ApiKey", "APPSETTING_Ml__ApiKey", "Ml_ApiKey" })
        {
            var v = Environment.GetEnvironmentVariable(key)?.Trim();
            if (!string.IsNullOrWhiteSpace(v)) return v;
        }

        return null;
    }
}
