import { useEffect, useState } from 'react';
import { apiGet } from '@/lib/api';

export interface HomepageStats {
  girlsSupported: number;
  safehouses: number;
  donors: number;
  headline?: string | null;
  summary?: string | null;
}

export const homepageStatsMock: HomepageStats = {
  girlsSupported: 312,
  safehouses: 7,
  donors: 1284,
  headline: 'Every girl deserves a safe harbor',
  summary:
    'Restoring dignity, healing trauma, and building futures for survivors of exploitation.',
};

interface State {
  data: HomepageStats;
  loading: boolean;
  isMock: boolean;
  error: string | null;
}

export function useHomepageStats(): State {
  const [state, setState] = useState<State>({
    data: homepageStatsMock,
    loading: true,
    isMock: false,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await apiGet<{
        girlsSupported: number;
        safehouses: number;
        donors: number;
        headline?: string | null;
        summary?: string | null;
      }>('/api/PublicImpact/snapshot');
      if (cancelled) return;
      if (data) {
        setState({ data, loading: false, isMock: false, error: null });
      } else {
        setState({
          data: homepageStatsMock,
          loading: false,
          isMock: true,
          error,
        });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
