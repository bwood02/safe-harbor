import { useEffect, useState } from 'react';
import { apiGet } from '@/lib/api';
import type { SocialInsightsSummary } from '@/types/socialInsights';

export function useSocialInsightsSummary() {
  const [data, setData] = useState<SocialInsightsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const res = await apiGet<SocialInsightsSummary>('/api/SocialMedia/insights-summary');
      if (cancelled) return;
      if (res.error) {
        setError(res.error);
        setData(null);
      } else {
        setError(null);
        setData(res.data ?? null);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { data, loading, error };
}
