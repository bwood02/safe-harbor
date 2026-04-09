import { useEffect, useState } from 'react';
import { apiGet } from '@/lib/api';
import type { DonorChurnScoreRow } from '@/types/ml';

/** Maps API PascalCase to camelCase for UI */
function normalizeRow(raw: Record<string, unknown>): DonorChurnScoreRow {
  return {
    supporterId: Number(raw.supporterId ?? raw.supporter_id),
    churnProbability: Number(raw.churnProbability ?? raw.churn_probability ?? 0),
    tier: String(raw.tier ?? ''),
    recommendedAction: String(raw.recommendedAction ?? raw.recommended_action ?? ''),
    error: raw.error != null ? String(raw.error) : null,
  };
}

export function useMlDonorChurnScores(page: number, pageSize: number, asOf?: string) {
  const [rows, setRows] = useState<DonorChurnScoreRow[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const qs = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      });
      if (asOf) qs.set('asOf', asOf);
      const res = await apiGet<unknown[]>(`/api/Ml/donor-churn-scores?${qs}`);
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
  }, [page, pageSize, asOf]);

  return { rows, loading, error: fetchError };
}
