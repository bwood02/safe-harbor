import { useEffect, useState } from 'react';
import { apiGet } from '@/lib/api';
import type { MlDeploymentStatus } from '@/types/ml';

export function useMlDeploymentStatus() {
  const [data, setData] = useState<MlDeploymentStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      const res = await apiGet<MlDeploymentStatus>('/api/Ml/deployment-status');
      if (!cancelled) {
        setData(res.data);
        setError(res.error);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { data, loading, error };
}
