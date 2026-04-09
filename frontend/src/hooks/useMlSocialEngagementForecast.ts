import { useEffect, useState } from 'react';
import { apiGet } from '@/lib/api';
import type { SocialEngagementScoreRow } from '@/types/ml';

function normalizeRow(raw: Record<string, unknown>): SocialEngagementScoreRow {
  return {
    month: String(raw.month ?? ''),
    predictedNextMonetary: Number(raw.predictedNextMonetary ?? raw.predicted_next_monetary ?? 0),
    error: raw.error != null ? String(raw.error) : null,
  };
}

export function useMlSocialEngagementForecast(asOf?: string) {
  const [rows, setRows] = useState<SocialEngagementScoreRow[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const qs = new URLSearchParams();
      if (asOf) qs.set('asOf', asOf);
      const q = qs.toString();
      const res = await apiGet<unknown[]>(`/api/Ml/social-engagement-forecast${q ? `?${q}` : ''}`);
      if (cancelled) return;
      if (res.error) {
        setFetchError(res.error);
        setRows(null);
      } else if (Array.isArray(res.data)) {
        setFetchError(null);
        setRows(res.data.map((r) => normalizeRow(r as Record<string, unknown>)));
      } else {
        setRows([]);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [asOf]);

  return { rows, loading, error: fetchError };
}
