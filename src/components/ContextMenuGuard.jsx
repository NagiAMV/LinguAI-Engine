"use client";

import { useEffect } from 'react';
import { installContentCopyGuard } from '@/lib/content-copy-guard.mjs';

// A UI preference only: browser developer tools remain accessible.
export default function ContextMenuGuard() {
  useEffect(() => {
    const preventContextMenu = event => event.preventDefault();
    document.addEventListener('contextmenu', preventContextMenu);
    const removeCopyGuard = installContentCopyGuard(document);
    return () => {
      document.removeEventListener('contextmenu', preventContextMenu);
      removeCopyGuard();
    };
  }, []);
  return null;
}
