"use client";

import { useEffect } from 'react';

// A UI preference only: browser developer tools remain accessible.
export default function ContextMenuGuard() {
  useEffect(() => {
    const preventContextMenu = event => event.preventDefault();
    document.addEventListener('contextmenu', preventContextMenu);
    return () => document.removeEventListener('contextmenu', preventContextMenu);
  }, []);
  return null;
}
