'use client';

import { useEffect } from 'react';
import { useStore } from '@/store/useStore';

export default function IpcView() {
  const { setActiveTab } = useStore();

  useEffect(() => {
    setActiveTab('ipc-du-kien');
  }, [setActiveTab]);

  return null;
}
