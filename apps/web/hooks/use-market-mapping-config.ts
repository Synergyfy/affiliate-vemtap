import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { MarketMappingConfig } from '@/types/api';

export function useMarketMappingConfig() {
  return useQuery<MarketMappingConfig>({
    queryKey: ['market-mapping', 'config'],
    queryFn: async () => {
      const { data } = await api.get('/market-mapping/config');
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });
}
