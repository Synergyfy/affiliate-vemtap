import { useState, useEffect } from 'react';
import { api } from '@/lib/api-client';

export interface ReferralStats {
  linkClicks: number;
  qrScans: number;
}

export function useReferralStats() {
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      const data = await api.get<ReferralStats>('/tracking/stats');
      setStats(data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch referral stats:', err);
      setError('Could not load referral stats');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  return { stats, isLoading, error, refresh: fetchStats };
}
