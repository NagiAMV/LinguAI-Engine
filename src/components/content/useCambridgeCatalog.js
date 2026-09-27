"use client";

import { useEffect, useMemo, useState } from "react";

import {
  countLinkedTests,
  createCambridgeBooks,
} from "@/lib/cambridge-catalog";

export function useCambridgeCatalog(resource) {
  const [payload, setPayload] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadCatalog() {
      setIsLoading(true);
      setError("");

      try {
        const response = await fetch(
          `/api/content/catalog?type=${resource}&query=cambridge`,
        );
        const nextPayload = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            nextPayload.error || "Content catalog is unavailable.",
          );
        }

        if (isMounted) setPayload(nextPayload);
      } catch (catalogError) {
        if (isMounted) {
          setPayload(null);
          setError(catalogError.message || "Content catalog is unavailable.");
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadCatalog();

    return () => {
      isMounted = false;
    };
  }, [resource]);

  const books = useMemo(
    () => createCambridgeBooks(resource, payload?.items || []),
    [payload?.items, resource],
  );
  const linkedTestCount = useMemo(() => countLinkedTests(books), [books]);

  return {
    books,
    catalogSource: payload?.source || "local-index",
    error,
    isLoading,
    linkedTestCount,
  };
}
