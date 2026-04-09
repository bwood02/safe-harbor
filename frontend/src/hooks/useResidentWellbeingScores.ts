import { useEffect, useState } from 'react';
import { apiGet } from '@/lib/api';
import type { ResidentWellbeingScoreRow } from '@/types/ml';

function normalizeRow(raw: Record<string, unknown>): ResidentWellbeingScoreRow {
  return {
    residentId: Number(raw.residentId ?? raw.resident_id),
    predictedWellbeingNext: Number(raw.predictedWellbeingNext ?? raw.predicted_wellbeing_next ?? 0),
    wellbeingLag: Number(raw.wellbeingLag ?? raw.wellbeing_lag ?? 0),
    error: raw.error != null ? String(raw.error) : null,
  };
}

/** Loads full DB snapshot via .NET → FastAPI for the given feature month (defaults on server to latest health month). */
export function useResidentWellbeingScores(asOf?: string) {
  const [rows, setRows] = useState<ResidentWellbeingScoreRow[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const qs = new URLSearchParams();
      if (asOf) qs.set('asOf', asOf);
      const q = qs.toString();
      const res = await apiGet<unknown[]>(`/api/Ml/resident-wellbeing-scores${q ? `?${q}` : ''}`);
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
