import { useEffect, useState } from 'react';
import { apiGet } from '@/lib/api';
import type { EarlyWarningScoreRow } from '@/types/ml';

function pickResidentName(raw: Record<string, unknown>): string {
  const v =
    raw.residentName ??
    raw.resident_name ??
    raw.caseControlNo ??
    raw.case_control_no;
  return v != null ? String(v).trim() : '';
}

function normalizeRow(raw: Record<string, unknown>): EarlyWarningScoreRow {
  return {
    residentId: Number(raw.residentId ?? raw.resident_id),
    residentName: pickResidentName(raw),
    struggleProbability: Number(raw.struggleProbability ?? raw.struggle_probability ?? 0),
    error: raw.error != null ? String(raw.error) : null,
  };
}

export function useMlEarlyWarningScores(asOf?: string) {
  const [rows, setRows] = useState<EarlyWarningScoreRow[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const qs = new URLSearchParams();
      if (asOf) qs.set('asOf', asOf);
      const q = qs.toString();
      const res = await apiGet<unknown[]>(`/api/Ml/early-warning-scores${q ? `?${q}` : ''}`);
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
