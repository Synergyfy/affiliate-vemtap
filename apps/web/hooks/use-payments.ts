import { useState, useEffect } from 'react';
import { api } from '@/lib/api-client';

export interface Bank {
  name: string;
  code: string;
  longcode: string;
  gateway: string;
  active: boolean;
  is_deleted: boolean;
  country: string;
  currency: string;
  type: string;
  id: number;
}

export function useBanks() {
  const [banks, setBanks] = useState<Bank[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBanks() {
      try {
        const data = await api.get('/payments/banks');
        if (data) {
          setBanks(data);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to fetch banks');
      } finally {
        setIsLoading(false);
      }
    }
    fetchBanks();
  }, []);

  return { banks, isLoading, error };
}

export function useResolveAccount() {
  const [isVerifying, setIsVerifying] = useState(false);

  const resolveAccount = async (accountNumber: string, bankCode: string) => {
    if (accountNumber.length !== 10 || !bankCode) return null;
    
    setIsVerifying(true);
    try {
      const data = await api.get(`/payments/verify-account?accountNumber=${accountNumber}&bankCode=${bankCode}`);
      return data; // { account_number, account_name, bank_id }
    } catch (err) {
      return null;
    } finally {
      setIsVerifying(false);
    }
  };

  return { resolveAccount, isVerifying };
}
