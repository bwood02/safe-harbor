import { useEffect, useState } from 'react';
import { apiGet } from '@/lib/api';
import type { DonorHighValueScoreRow } from '@/types/ml';

function normalizeRow(raw: Record<string, unknown>): DonorHighValueScoreRow {
  return {
    supporterId: Number(raw.supporterId ?? raw.supporter_id),
    highValueProbability: Number(raw.highValueProbability ?? raw.high_value_probability ?? 0),
    error: raw.error != null ? String(raw.error) : null,
  };
}

export function useMlDonorHighValueScores(page: number, pageSize: number, asOf?: string) {
  const [rows, setRows] = useState<DonorHighValueScoreRow[] | null>(null);
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
      const res = await apiGet<unknown[]>(`/api/Ml/donor-high-value-scores?${qs}`);
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
