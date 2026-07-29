'use client';

import { MarketMappingProvider } from '@/components/dashboard/market-mapping/MarketMappingContext';

export default function MarketMappingLayout({ children }: { children: React.ReactNode }) {
  return (
    <MarketMappingProvider>
      {children}
    </MarketMappingProvider>
  );
}
