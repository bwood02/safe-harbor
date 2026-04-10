using Microsoft.Extensions.Configuration;

namespace backend.Infrastructure;

/// <summary>
<<<<<<< HEAD
/// Resolves ML FastAPI base URL and API key from configuration and environment.
/// Azure App Service maps <c>Ml__BaseUrl</c> to <c>Ml:BaseUrl</c>; typo keys are checked explicitly.
/// In Production/Staging, a loopback <c>Ml:BaseUrl</c> from published JSON is ignored so a real app setting can win.
/// </summary>
public static class MlAppSettings
{
    public static string? ResolveBaseUrl(IConfiguration configuration)
    {
        var raw = configuration["Ml:BaseUrl"]?.Trim();
        if (!string.IsNullOrEmpty(raw))
        {
            if (!(IsProductionLike() && IsLoopbackUrl(raw)))
                return NormalizeBaseUrl(raw);
        }

        foreach (var key in new[] { "Ml__BaseUrl", "APPSETTING_Ml__BaseUrl", "Ml_BaseUrl" })
        {
            var v = Environment.GetEnvironmentVariable(key)?.Trim();
            if (!string.IsNullOrEmpty(v))
                return NormalizeBaseUrl(v);
=======
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
>>>>>>> fb4915e56c7a820857e136dab9efb889a3bc9102
        }

        return null;
    }

    public static string? ResolveApiKey(IConfiguration configuration)
    {
<<<<<<< HEAD
        var k = configuration["Ml:ApiKey"]?.Trim();
        if (!string.IsNullOrEmpty(k))
            return k;

        foreach (var key in new[] { "Ml__ApiKey", "APPSETTING_Ml__ApiKey", "Ml_ApiKey" })
        {
            var v = Environment.GetEnvironmentVariable(key)?.Trim();
            if (!string.IsNullOrEmpty(v))
                return v;
=======
        var fromConfig = configuration["Ml:ApiKey"]?.Trim();
        if (!string.IsNullOrWhiteSpace(fromConfig))
            return fromConfig;

        foreach (var key in new[] { "Ml__ApiKey", "APPSETTING_Ml__ApiKey" })
        {
            var v = Environment.GetEnvironmentVariable(key)?.Trim();
            if (!string.IsNullOrWhiteSpace(v)) return v;
>>>>>>> fb4915e56c7a820857e136dab9efb889a3bc9102
        }

        return null;
    }
<<<<<<< HEAD

    private static string NormalizeBaseUrl(string url) => url.TrimEnd('/');

    private static bool IsProductionLike()
    {
        var env = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT");
        return string.Equals(env, "Production", StringComparison.OrdinalIgnoreCase)
            || string.Equals(env, "Staging", StringComparison.OrdinalIgnoreCase);
    }

    private static bool IsLoopbackUrl(string url)
    {
        if (!Uri.TryCreate(url, UriKind.Absolute, out var uri))
            return false;
        return uri.IsLoopback;
    }
=======
>>>>>>> fb4915e56c7a820857e136dab9efb889a3bc9102
}
