import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { MarketMappingConfig } from '@/types/api';
import { mockMarketMappingConfig } from '@/lib/admin-mock-data';

const IS_MOCK = process.env.NEXT_PUBLIC_ADMIN_MOCK === 'true';

export function useMarketMappingConfig() {
  return useQuery<MarketMappingConfig>({
    queryKey: ['market-mapping-config'],
    queryFn: async () => {
      if (IS_MOCK) return mockMarketMappingConfig;
      const { data } = await api.get('/market-mapping/config');
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });
}
