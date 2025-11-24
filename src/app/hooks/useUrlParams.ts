import { useMemo, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export const useUrlParams = () => {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Extract params
  const rawQueryFromUrl = searchParams.get("q") || "";
  const initialSearchType = searchParams.get("type") as "any" | "all" | null;
  
  // Attachment View Params
  const docIdFromUrl = searchParams.get("ProphecyId");
  const parentIdFromUrl = searchParams.get("ParentProphecyId") || "";
  const IsAttachmentFromUrl = searchParams.get("isAttachment") === "true";

  // Helper: Parse JSON query string
  const parsedApiQueries = useMemo(() => {
    if (!rawQueryFromUrl) return [];
    try {
      const parsed = JSON.parse(rawQueryFromUrl);
      if (Array.isArray(parsed) && parsed.every(q => typeof q === 'string')) {
        return parsed.filter((q: string) => q.trim() !== "");
      }
      return rawQueryFromUrl.trim() ? [rawQueryFromUrl] : [];
    } catch (e) {
      return rawQueryFromUrl.trim() ? [rawQueryFromUrl] : [];
    }
  }, [rawQueryFromUrl]);

  // Helper: Update URL
  const updateUrlWithQuery = useCallback((query: string, searchType: string) => {
    if (!query.trim()) {
      router.push(`/SearchTest`);
      return;
    }
    
    // Extract quoted phrases or treat as single term
    let extractedPhrases = Array.from(query.matchAll(/"([^"]*)"/g), m => m[1]).filter(p => p.trim() !== "");
    if (extractedPhrases.length === 0 && query.trim() !== "") {
      extractedPhrases = [query.trim()];
    }

    if (extractedPhrases.length === 0) {
      router.push(`/SearchTest`);
      return;
    }

    const params = new URLSearchParams({
      q: JSON.stringify(extractedPhrases),
      type: searchType,
    });
    router.push(`/SearchTest?${params.toString()}`);
  }, [router]);

  return {
    rawQueryFromUrl,
    initialSearchType,
    docIdFromUrl,
    parentIdFromUrl,
    IsAttachmentFromUrl,
    parsedApiQueries,
    updateUrlWithQuery
  };
};