'use client';

import { useEffect } from 'react';
import { useStore } from '@/store/useStore';

export default function StoreInitializer() {
  const fetchSupabaseData = useStore((s) => s.fetchSupabaseData);

  useEffect(() => {
    fetchSupabaseData();
  }, [fetchSupabaseData]);

  return null;
}
