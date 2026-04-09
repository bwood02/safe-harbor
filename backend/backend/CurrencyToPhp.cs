namespace backend;

/// <summary>
/// Converts gift amounts to PHP for aggregated reporting. Rates are approximate reference values;
/// keep in sync with <c>frontend/src/lib/currencyPhp.ts</c>.
/// </summary>
public static class CurrencyToPhp
{
    public static double Convert(double amount, string? currencyCode)
    {
        var c = string.IsNullOrWhiteSpace(currencyCode) ? "PHP" : currencyCode.Trim().ToUpperInvariant();
        var mult = c switch
        {
            "PHP" => 1.0,
            "USD" => 58.0,
            "EUR" => 62.0,
            "GBP" => 75.0,
            "JPY" => 0.39,
            "CAD" => 42.0,
            "AUD" => 38.0,
            "CHF" => 65.0,
            "CNY" => 8.0,
            "HKD" => 7.4,
            "SGD" => 43.0,
            "INR" => 0.69,
            "KRW" => 0.042,
            "MXN" => 3.2,
            "BRL" => 10.5,
            "ZAR" => 3.1,
            _ => 1.0,
        };
        return amount * mult;
    }
}
