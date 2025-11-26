import { useState, useCallback } from "react";
import { 
  API_BASE_URL, PAGE_SIZE, ES_DOCTYPE_FIELD, ES_BRANCH_FIELD, ES_EXTENSION_FIELD 
} from '../constant';
import { Document, BackendResponse } from '../types';

// Helper: Data Adapter
const adaptDocs = (data: BackendResponse): Document[] => {
  if (!data || !Array.isArray(data.documents)) {
    console.error("adaptDocs error: invalid data structure", data);
    return [];
  }
  return data.documents.map((Doc) => {
    const isAttachmentBool = Doc.IsAttachment === true || String(Doc.IsAttachment).toLowerCase() === "true";
    return {
      DocType: Doc.DocType || Doc.DocumentType || Doc.Branch,
      Text: Doc.Text || "No text found",
      From: Doc.From || Doc.Branch,
      To: Doc.To,
      ReportNumber: Doc.ReportNumber,
      IngestionDate: Doc.IngestionDate,
      DocumentDate: Doc.DocumentDate,
      FileName: Doc.FileName,
      IsAttachment: isAttachmentBool,
      ...Doc,
    };
  });
};

export const useDocumentApi = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchAfter, setSearchAfter] = useState<any[] | null>(null);
  const [totalDocuments, setTotalDocuments] = useState(0);

  // Counts
  const [docTypeCounts, setDocTypeCounts] = useState<{ [key: string]: number } | null>(null);
  const [branchTypeCounts, setBranchTypeCounts] = useState<{ [key: string]: number } | null>(null);
  const [extensionTypeCounts, setExtensionTypeCounts] = useState<{ [key: string]: number } | null>(null);

  const fetchDocs = useCallback(async (
    params: {
      queries: string[];
      simpleFilters: Record<string, string>;
      filtersState: any; // The state object from useFilterState
      viewState: { view: string; currentPage: number; gridPageSize: number; searchAfter: any[] | null };
      isLoadMore?: boolean;
      attachmentQuery?: { ProphecyId: string; ParentProphecyId: string; isAttachment: boolean };
    }
  ) => {
    const { queries, simpleFilters, filtersState, viewState, isLoadMore, attachmentQuery } = params;

    // Validation
    if (!attachmentQuery && queries.length === 0 && Object.keys(simpleFilters).length === 0) {
      setDocuments([]);
      setError("Please enter a search query or apply filters to begin.");
      return;
    }
    if ((filtersState.fromDate && !filtersState.toDate) || (!filtersState.fromDate && filtersState.toDate)) {
      setError("Please provide a complete date range (both start and end dates).");
      return;
    }

    setLoading(true);
    if (!isLoadMore) setError(null);

    // 1. Prepare Filters
    const activeFilters: { [key: string]: string[] } = {};
    
    const addSetFilter = (field: string, values: Set<string>) => {
      const arr = Array.from(values);
      if (arr.length > 0) activeFilters[field] = arr;
    };
    
    addSetFilter(ES_DOCTYPE_FIELD, filtersState.selectedDocTypeValues);
    addSetFilter(ES_BRANCH_FIELD, filtersState.selectedBranchTypeValues);
    addSetFilter(ES_EXTENSION_FIELD, filtersState.selectedExtensionTypeValues);

    // Merge Simple Filters
    Object.keys(simpleFilters).forEach(key => {
      activeFilters[key] = [simpleFilters[key]];
    });

    // 2. Date Range
    const activeDateRange: { from?: string; to?: string } = {};
    if (filtersState.yearFilter) {
      activeDateRange.from = `${filtersState.yearFilter}-01-01`;
      activeDateRange.to = `${filtersState.yearFilter}-12-31`;
    } else {
      if (filtersState.fromDate) activeDateRange.from = filtersState.fromDate;
      if (filtersState.toDate) activeDateRange.to = filtersState.toDate;
    }

    // 3. Construct Payload
    const endpoint = attachmentQuery ? '/handle-attachment-link' : '/search';
    const currentSearchAfter = isLoadMore ? viewState.searchAfter : null;
    const fromOffset = viewState.view === 'grid' ? (viewState.currentPage - 1) * viewState.gridPageSize : 0;

    const basePayload = {
      queries: queries,
      size: viewState.view === 'grid' ? viewState.gridPageSize : PAGE_SIZE,
      search_type: filtersState.searchType,
      stream: false,

        // ✅ NEW: Send fuzzy flag to backend
      enable_fuzzy: filtersState.enableFuzzy,
      ...(Object.keys(activeFilters).length > 0 && { filters: activeFilters }),
      ...(Object.keys(activeDateRange).length > 0 && { date_range: activeDateRange }),
      ...(currentSearchAfter !== null && { search_after: currentSearchAfter }),
      ...(filtersState.parentsOnly ? { parents_only: true } : {}),
      ...(viewState.view === 'grid' && { from: fromOffset })
    };

    const attachmentPayload = {
      app_id: attachmentQuery?.ProphecyId,
      parent_app_id: attachmentQuery?.ParentProphecyId,
      is_attachment: attachmentQuery?.isAttachment
    };

    const finalBody = attachmentQuery ? attachmentPayload : basePayload;

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(finalBody),
      });

      if (!response.ok) throw new Error(`API Error: ${response.status} - ${response.statusText}.`);

      const data: BackendResponse = await response.json();

      if (data && Array.isArray(data.documents)) {
        const adaptedDocuments = adaptDocs(data);

        if (viewState.view === 'grid') {
          setDocuments(adaptedDocuments);
          setTotalDocuments(data.total || 0);
        } else {
          setDocuments(prev => isLoadMore && !attachmentQuery ? [...prev, ...adaptedDocuments] : adaptedDocuments);
        }

        setSearchAfter(attachmentQuery ? null : (data.next_search_after || null));

        if (!attachmentQuery && !isLoadMore) {
             setDocTypeCounts(data.aggregations?.doctype_counts || {});
             setBranchTypeCounts(data.aggregations?.branchtype_counts || {});
             setExtensionTypeCounts(data.aggregations?.extensiontype_counts || {});
        }
      } else {
        setError("Failed to fetch documents.");
        setDocuments([]);
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch documents.");
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    documents, setDocuments,
    error, setError,
    loading,
    searchAfter, setSearchAfter,
    totalDocuments,
    docTypeCounts,
    branchTypeCounts,
    extensionTypeCounts,
    fetchDocs
  };
};