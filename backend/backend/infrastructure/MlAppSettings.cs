using Microsoft.Extensions.Configuration;

namespace backend.Infrastructure;

/// <summary>
/// Resolves ML URL and API key from IConfiguration plus raw env (Azure sometimes differs from config binding).
/// On Azure, ignores loopback BaseUrl from JSON so old published appsettings cannot override App Settings.
/// </summary>
public static class MlAppSettings
{
    private static bool IsRunningOnAzureAppService() =>
        !string.IsNullOrEmpty(Environment.GetEnvironmentVariable("WEBSITE_INSTANCE_ID"));

    private static bool IsLoopbackMlBase(string? url)
    {
        var t = url?.Trim();
        if (string.IsNullOrWhiteSpace(t)) return false;
        if (!Uri.TryCreate(t, UriKind.Absolute, out var u))
            return t.Contains("localhost", StringComparison.OrdinalIgnoreCase)
                || t.Contains("127.0.0.1", StringComparison.OrdinalIgnoreCase);
        return u.IsLoopback;
    }

    /// <summary>Effective ML base URL for HttpClient and diagnostics.</summary>
    public static string? ResolveBaseUrl(IConfiguration configuration)
    {
        var fromConfig = configuration["Ml:BaseUrl"]?.Trim();
        if (IsRunningOnAzureAppService() && IsLoopbackMlBase(fromConfig))
            fromConfig = null;
        if (!string.IsNullOrWhiteSpace(fromConfig))
            return fromConfig.TrimEnd('/');

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
            v = v.TrimEnd('/');
            if (IsRunningOnAzureAppService() && IsLoopbackMlBase(v)) continue;
            return v;
        }

        return null;
    }

    public static string? ResolveApiKey(IConfiguration configuration)
    {
        var fromConfig = configuration["Ml:ApiKey"]?.Trim();
        if (!string.IsNullOrWhiteSpace(fromConfig))
            return fromConfig;

        foreach (var key in new[] { "Ml__ApiKey", "APPSETTING_Ml__ApiKey" })
        {
            var v = Environment.GetEnvironmentVariable(key)?.Trim();
            if (!string.IsNullOrWhiteSpace(v)) return v;
        }

        return null;
    }
}
