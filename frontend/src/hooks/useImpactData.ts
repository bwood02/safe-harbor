import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { ImpactSummary, OutcomeRow, MonthlyDonation } from '../types/impact'

interface State<T> {
  data: T | null
  loading: boolean
  error: string | null
}

function useRpc<T>(fn: string, single = false): State<T> {
  const [state, setState] = useState<State<T>>({ data: null, loading: true, error: null })
  useEffect(() => {
    let cancelled = false
    supabase.rpc(fn).then(({ data, error }) => {
      if (cancelled) return
      if (error) {
        setState({ data: null, loading: false, error: error.message })
        return
      }
      const value = single && Array.isArray(data) ? (data[0] as T) : (data as T)
      setState({ data: value ?? null, loading: false, error: null })
    })
    return () => {
      cancelled = true
    }
  }, [fn, single])
  return state
}

export function useImpactSummary() {
  return useRpc<ImpactSummary>('impact_summary', true)
}

export function useOutcomeDistribution() {
  return useRpc<OutcomeRow[]>('outcome_distribution')
}

export function useDonationsMonthlyTrend() {
  return useRpc<MonthlyDonation[]>('donations_monthly_trend')
}
