import { useState, useEffect } from 'react';
import { api } from '@/lib/api-client';

export type ToolType = 'BANNER' | 'EMAIL_SWIPE' | 'SOCIAL_POST' | 'VIDEO' | 'PDF_GUIDE' | 'LOGO' | 'FLYER' | 'COPY_TEMPLATE';

export interface MarketingTool {
  id: string;
  title: string;
  description: string | null;
  type: ToolType;
  category: string | null;
  content: string;
  previewUrl: string | null;
  createdAt: string;
}

export function useMarketingTools() {
  const [tools, setTools] = useState<MarketingTool[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTools() {
      try {
        setIsLoading(true);
        const response = await api.get<{ data: MarketingTool[] }>('/tools');
        setTools(response.data);
        setError(null);
      } catch (err: any) {
        console.error('Failed to fetch marketing tools:', err);
        setError(err.message || 'Failed to fetch marketing tools');
      } finally {
        setIsLoading(false);
      }
    }
    fetchTools();
  }, []);

  return { tools, isLoading, error };
}
