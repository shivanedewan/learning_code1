"use client";

import React, { useEffect, useState, useCallback,useMemo ,FormEvent} from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { DocumentButton } from "./../components/DocumentButton"; // Assuming this component exists
import DateFormatter from './../components/DateFormatter'; // adjust path as needed
import FiltersSidebar from "../components/FiltersSidebar";
import SearchResultsArea from "../components/SearchResultsArea";
import Header from "../components/Header";
import GridView2 from "../components/GridView2";

import GridView1 from "../components/GridView1";

// --- Configuration ---
import { FaList, FaTh } from 'react-icons/fa';


// --- Configuration ---
import {API_BASE_URL, PAGE_SIZE, DOCTYPES_MAP, ES_DOCTYPE_FIELD, BRANCHES_MAP, ES_BRANCH_FIELD,SEARCH_TYPES,ES_EXTENSION_FIELD,EXTENSIONS_MAP} from '../constant'; // Assuming constants are in ../constants.ts


// --- Interface
import { Document, BackendResponse } from '../types'; // Assuming types are in ../types.ts

// --- Component ---
const DocumentList = () => {
  const searchParams = useSearchParams();
  const router = useRouter();


  const initialSearchTypeFromUrl = searchParams.get("type") as "any" | "all" | null;
  const rawQueryFromUrl = searchParams.get("q") || ""; // Query as a JSON string or simple string

  
  const docIdFromUrl=searchParams.get("ProphecyId");
  const parentIdFromUrl=searchParams.get("ParentProphecyId") || "";
  const IsAttachmentFromUrl=searchParams.get("isAttachment")==="true" ;   // the case has to be handled where this might be string

  


  // State  
  const [documents, setDocuments] = useState<Document[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchAfter, setSearchAfter] = useState<any[] | null>(null); // For pagination
  const [currentViewTitle, setCurrentViewTitle] = useState<string | null>(null);
  const [view, setView] = useState('reader'); // Add this line
  const [gridPageSize, setGridPageSize] = useState(100);


  // ★ NEW: parent-docs-only toggle
  const [parentsOnly, setParentsOnly] = useState<boolean>(false);

  // *** NEW: State for filters from the Simple Search Dialog ***
  const [simpleSearchFilters, setSimpleSearchFilters] = useState<Record<string, string>>({});


  // Filter State
  const [yearFilter, setYearFilter] = useState<string>(""); // Use string to easily match select value

  // changed
  const [selectedDocTypeValues, setSelectedDocTypeValues] = useState<Set<string>>(new Set());
  const [selectedBranchTypeValues, setSelectedBranchTypeValues] = useState<Set<string>>(new Set());
  const [selectedExtensionTypeValues, setSelectedExtensionTypeValues] = useState<Set<string>>(new Set());
     // *** NEW ***: State for DocType Counts received from backend
  const [docTypeCounts, setDocTypeCounts] = useState<{ [key: string]: number } | null>(null);
  const [branchTypeCounts, setBranchTypeCounts] = useState<{ [key: string]: number } | null>(null);
   

  const [extensionTypeCounts, setExtensionTypeCounts] = useState<{ [key: string]: number } | null>(null);
   

 
  // Initialize searchType from URL parameter, default to "any" (or "all" if preferred)
  const [searchType, setSearchType] = useState<"any" | "all">(initialSearchTypeFromUrl || "any");
//   const [searchType, setSearchType] = useState<"any" | "all">("any"); // Radio buttons recommended
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");


  // --- ADDED: Helper to parse query string from URL ---
  const getParsedQueries = useCallback((queryStr: string): string[] => {
    if (!queryStr) return [];
    try {
        const parsed = JSON.parse(queryStr);
        if (Array.isArray(parsed) && parsed.every(q => typeof q === 'string')) {
            return parsed.filter(q => q.trim() !== ""); // Filter out empty strings again just in case
        }
        // If not a JSON array of strings, treat the original string as a single query.
        // This handles cases where q is not a JSON array (e.g. q=term1 or q="term1,term2" from old system/manual URL)
        console.warn("Query parameter 'q' is not a valid JSON array of strings. Treating as a single query term:", queryStr);
        return queryStr.trim() ? [queryStr] : [];
    } catch (e) {
        // If JSON.parse fails, it's not a JSON string. Treat as a single query.
        console.warn("Failed to parse query parameter 'q' as JSON. Treating as a single query term:", queryStr, e);
        return queryStr.trim() ? [queryStr] : []; // Fallback: treat as a single query string if not empty
    }
  }, []);

  const parsedApiQueries = useMemo(() => getParsedQueries(rawQueryFromUrl), [rawQueryFromUrl, getParsedQueries]);

  const [headerSearchQuery, setHeaderSearchQuery] = useState('');

  useEffect(() => {
    const formattedQuery = parsedApiQueries.map(q => `"${q}"`).join(', ');
    setHeaderSearchQuery(formattedQuery);
  }, [parsedApiQueries]);

  const handleHeaderSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // *** NEW: Clear simple search filters when a new text search is submitted ***
    setSimpleSearchFilters({});

    if (!headerSearchQuery.trim()) {
      router.push(`/SearchTest`);
      return;
    }

    const phraseMatches = headerSearchQuery.matchAll(/"([^"]*)"/g);
    let extractedPhrases = Array.from(phraseMatches, match => match[1])
                                 .filter(phrase => phrase.trim() !== "");

    if (extractedPhrases.length === 0 && headerSearchQuery.trim() !== "") {
        extractedPhrases = [headerSearchQuery.trim()];
    }

    if (extractedPhrases.length === 0) {
         alert('Please enter search terms enclosed in double quotes, e.g., "term one" "term two".');
         return;
    }

    const params = new URLSearchParams({
        q: JSON.stringify(extractedPhrases),
        type: searchType,
    });
    router.push(`/SearchTest?${params.toString()}`);
  };

  // *** NEW: Handler for the Simple Search submission ***
  const handleSimpleSearchSubmit = (filters: Record<string, string>) => {
    // When a simple search is applied, we clear the main query bar
    // and push an empty query to the URL, letting the filters drive the search.
    setHeaderSearchQuery('');
    setSimpleSearchFilters(filters);
    router.push(`/SearchTest`); // Navigate to a clean URL, useEffect will pick up the filter change
  };


  //data adaptation helper function
  const adaptDocs=(docs: Document[]): Document[]=>{
      if (!Array.isArray(docs)){
        console.error("adaptdocs functione error", docs);
        return [];  // empty array if input not valid
      }

      return docs.map((Doc)=>{

        const bool=Doc.IsAttachment===true|| String(Doc.IsAttachment).toLowerCase()==="true"
        return{
          DocType: Doc.DocType || Doc.DocumentType || Doc.Branch,
        Text: Doc.Text || "No text found",       
        From: Doc.From || Doc.Branch,
        To: Doc.To,
        ReportNumber: Doc.ReportNumber,
        IngestionDate: Doc.IngestionDate, // Rename 'doc_date' to 'document_date'
        DocumentDate: Doc.DocumentDate,
        FileName: Doc.FileName,
        IsAttachment: bool,
        ...Doc, // Spread any other properties the backend sends
        }
      });


      
  }



  const fetchDocuments = useCallback(async (isLoadMore = false,attachmentQuery?: {ProphecyId: string,ParentProphecyId: string, isAttachment: boolean}) => {
    // *** MODIFIED: Check if there are any search criteria ***
    if (parsedApiQueries.length === 0 && Object.keys(simpleSearchFilters).length === 0) {
      // No regular query and no simple filters, so don't fetch.
      // You might want to clear documents or show a message.
      setDocuments([]);
      setError("Please enter a search query or apply filters to begin.");
      return;
    }

    if ((fromDate && !toDate) || (!fromDate && toDate)) {
        setError("Please provide a complete date range (both start and end dates).");
        return;
    }

    setLoading(true);
    if (!isLoadMore) {
      setError(null);
    }

    const currentSearchAfter = isLoadMore ? searchAfter : null;
    let endpoint="/search"
    let body2={}

    // --- Prepare Payload Data (intermediate steps) ---
    // 1. Filters
    const activeFilters: { [key: string]: string[] } = {}; // Renamed for clarity

    // new
    const activeDocTypes = Array.from(selectedDocTypeValues); // Convert Set to Array
    if (activeDocTypes.length > 0) {
        activeFilters[ES_DOCTYPE_FIELD] = activeDocTypes;
    }

    const activeBranchTypes = Array.from(selectedBranchTypeValues); // Convert Set to Array
    if (activeBranchTypes.length > 0) {
        activeFilters[ES_BRANCH_FIELD] = activeBranchTypes;
    }

    const activeExtensionTypes = Array.from(selectedExtensionTypeValues); // Convert Set to Array
    if (activeExtensionTypes.length > 0) {
        activeFilters[ES_EXTENSION_FIELD] = activeExtensionTypes;
    }

    // *** NEW: Merge filters from the Simple Search Dialog ***
    for (const field in simpleSearchFilters) {
      if (Object.prototype.hasOwnProperty.call(simpleSearchFilters, field)) {
        // The backend expects an array of values for each filter key
        activeFilters[field] = [simpleSearchFilters[field]];
      }
    }
   

    // 2. Date Range
    const activeDateRange: { from?: string; to?: string } = {}; // Renamed for clarity
    const tempRange: { gte?: string; lte?: string } = {};
     if (yearFilter) {
        tempRange.gte = `${yearFilter}-01-01`;
        tempRange.lte = `${yearFilter}-12-31`;
    } else {
        if (fromDate) tempRange.gte = fromDate;
        if (toDate) tempRange.lte = toDate;
    }
    // Map to 'from'/'to' if they exist
    if (tempRange.gte) activeDateRange.from = tempRange.gte;
    if (tempRange.lte) activeDateRange.to = tempRange.lte;


    // --- Define Payload Type Explicitly ---
    type PayloadToSend = {
      queries: string[];
      size: number;
      search_type: "any" | "all";
      filters?: { [key: string]: string[] }; // Optional
      date_range?: { from?: string; to?: string }; // Optional
      search_after?: any[] | null; // Optional (null is valid for backend)
      stream: boolean;
      parents_only?: boolean; // New optional field
    };

    // --- Construct the Payload Object ---
    // Include properties conditionally to avoid undefined where possible
    const payload: PayloadToSend = {
      queries: parsedApiQueries,
      size: view === 'grid' ? 10000 : PAGE_SIZE,
      search_type: searchType,
      stream: false, // Explicitly false
      ...(Object.keys(activeFilters).length > 0 && { filters: activeFilters }), // Add filters only if they exist
      ...(Object.keys(activeDateRange).length > 0 && { date_range: activeDateRange }), // Add date_range only if it exists
      ...(currentSearchAfter !== null && { search_after: currentSearchAfter }), // Add search_after only if not null
      ...(parentsOnly ? { parents_only: true } : {}), // Include only if true
    };
    if(attachmentQuery){
      endpoint='/handle-attachment-link'
       body2={
        app_id: attachmentQuery?.ProphecyId,
        parent_app_id: attachmentQuery?.ParentProphecyId,
        is_attachment: attachmentQuery?.isAttachment
      }
      console.log("ih")
    }
    
    const body1=attachmentQuery?  body2: payload
    console.log("hi")

    // --- Fetch ---
    try {
      console.log("Constructed Payload:", body1) // Log the payload for debugging
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        // Send the cleanly constructed pay
        body: JSON.stringify(body1),
      });

      

       // ... (rest of the response handling remains the same) ...
       if (!response.ok) {
         // ... (error handling) ...
         throw new Error(`API Error: ${response.status} - ${response.statusText}.`);
       }
       const data: BackendResponse = await response.json();
           // --- Adapt the backend data ---
      
      if (data && Array.isArray(data.documents)){
        
        const adaptedDocuments=adaptDocs(data.documents)
        // setDocuments((prevDocs) =>
        //   isLoadMore ? [...prevDocs, ...adaptedDocuments] : adaptedDocuments
        // );

        setDocuments(isLoadMore && !attachmentQuery ? [...documents,...adaptedDocuments]: adaptedDocuments )

        setSearchAfter(attachmentQuery? null : (data.next_search_after || null));

        // *** NEW *** Store the aggregation counts if available
        if(!attachmentQuery){
          if(data.aggregations?.doctype_counts){
            setDocTypeCounts(data.aggregations.doctype_counts)
          }
          else if(!isLoadMore){
            setDocTypeCounts({})
          }

          // for branch
          if(data.aggregations?.branchtype_counts){
            setBranchTypeCounts(data.aggregations.branchtype_counts)
          } else if(!isLoadMore){
            setBranchTypeCounts({})
          }

          // for branch
          if(data.aggregations?.extensiontype_counts){
            setExtensionTypeCounts(data.aggregations.extensiontype_counts)
          } else if(!isLoadMore){
            setExtensionTypeCounts({})
          }
        }
      // Do not update counts if it was an attachment view or load more action without new counts

      }
      else{
        console.error("unexpexte resposne structure",data)
        setError( "Failed to fetch documents.");
        setDocuments([])
      }
      

    } catch (err: any) {
       // ... (catch block remains the same) ...
       setError(err.message || "Failed to fetch documents.");
       setDocuments([])
    } finally {
      setLoading(false);
    }
  }, [
      // *** MODIFIED: Added simpleSearchFilters to dependencies ***
      parsedApiQueries, searchAfter, yearFilter, selectedDocTypeValues, 
      selectedBranchTypeValues, selectedExtensionTypeValues, searchType, 
      fromDate, toDate, documents, adaptDocs, view, gridPageSize, parentsOnly,
      simpleSearchFilters
    ]
  );





  // handle attachment/parenyt link



  const handleAttachmentLinkClick = useCallback(async (clickedDoc: Document) => {
    const ProphecyId = clickedDoc.ProphecyId || ""
    const is_attachment = clickedDoc.IsAttachment === true || String(clickedDoc.IsAttachment).toLowerCase() === "true";
    const parentProphecyId = clickedDoc.ParentProphecyId || ""
    
    const newUrl = `${window.location.origin}${window.location.pathname}?ProphecyId=${encodeURIComponent(ProphecyId)}&ParentProphecyId=${encodeURIComponent(parentProphecyId)}&isAttachment=${encodeURIComponent(is_attachment)}`
    console.log(newUrl)
  
  window.open(newUrl,'_blank');
  },[]);

  // effect for handling attachment or parents
  useEffect(() => {
    if(docIdFromUrl){
    setDocuments([]);
    setSearchAfter(null);
    fetchDocuments(false,{ProphecyId: docIdFromUrl,ParentProphecyId: parentIdFromUrl,isAttachment: IsAttachmentFromUrl}); // false indicates it's not a "Load More" action
    }
    
  }, [docIdFromUrl,parentIdFromUrl,IsAttachmentFromUrl ]);

  // --- Effects ---
  // Effect for initial load and changes in search query or filters
  useEffect(() => {

    if (docIdFromUrl) return; // Don't run if we are in attachment/parent view

    // *** MODIFIED: Logic to decide when to fetch ***
    // Fetch if we have URL query, or if we have simple filters.
    if (parsedApiQueries.length > 0 || Object.keys(simpleSearchFilters).length > 0) {
      setDocuments([]);
      setSearchAfter(null);
      fetchDocuments(false); // false indicates it's not a "Load More" action
    }
    // This case handles when a query like "[]" is in the URL, but there are no simple filters.
    else if (rawQueryFromUrl && parsedApiQueries.length === 0) {
      setDocuments([]);
      setSearchAfter(null);
      setError("Invalid or empty search query provided.");
    }
    // This case handles a fresh page load with no query in the URL and no simple filters yet.
    else if (!rawQueryFromUrl) {
      setDocuments([]);
      setSearchAfter(null);
      setError(null);
    }
  }, [
      // *** MODIFIED: Added simpleSearchFilters to dependencies ***
      parsedApiQueries, 
      yearFilter,
      rawQueryFromUrl,
      selectedDocTypeValues,
      selectedBranchTypeValues,
      selectedExtensionTypeValues,
      searchType,
      fromDate,
      toDate,
      docIdFromUrl,
      gridPageSize,
      view,
      parentsOnly,
      simpleSearchFilters
  ]);


  // --- Event Handlers ---
  // --- Filter Change Handlers ---
    // *** CHANGED ***: Handler now accepts the DocType 'value' (string)
    const handleDocTypeChange = useCallback((docTypeValue: string) => {
      setSelectedDocTypeValues(prev => {
          const newSet = new Set(prev);
          if (newSet.has(docTypeValue)) {
              newSet.delete(docTypeValue); // Uncheck
          } else {
              newSet.add(docTypeValue);    // Check
          }
          return newSet;
      });
      // Search is triggered by useEffect dependency change
  }, []);

  const handleBranchTypeChange = useCallback((branchTypeValue: string) => {
    setSelectedBranchTypeValues(prev => {
        const newSet = new Set(prev);
        if (newSet.has(branchTypeValue)) {
            newSet.delete(branchTypeValue); // Uncheck
        } else {
            newSet.add(branchTypeValue);    // Check
        }
        return newSet;
    });
    // Search is triggered by useEffect dependency change
}, []);

const handleExtensionTypeChange = useCallback((extensionTypeValue: string) => {
  setSelectedExtensionTypeValues(prev => {
      const newSet = new Set(prev);
      if (newSet.has(extensionTypeValue)) {
          newSet.delete(extensionTypeValue); // Uncheck
      } else {
          newSet.add(extensionTypeValue);    // Check
      }
      return newSet;
  });
  // Search is triggered by useEffect dependency change
}, []);

  // Consider using Radio buttons for Search Type for single selection
  const handleSearchTypeChange = (type: "any" | "all") => {
      setSearchType(type);
  }

  const handleClearAllFilters = () => {
    setYearFilter('');
    setFromDate('');
    setToDate('');
    setSearchType('any'); // Reset to default
    setSelectedDocTypeValues(new Set());
    setSelectedBranchTypeValues(new Set());
    setParentsOnly(false);
    setSimpleSearchFilters({}); // *** NEW: Clear simple search filters as well ***
    // You might also want to trigger a new search with cleared filters here
    // or reset pagination, etc.
    console.log("All filters cleared!");
  };

  
  // --- Render ---
  return (
    <div className="bg-white text-black">
      {/* *** MODIFIED: Pass the new handler to the Header *** */}
      <Header 
        searchQuery={headerSearchQuery}
        onSearchQueryChange={setHeaderSearchQuery}
        onSearchSubmit={handleHeaderSearchSubmit}
        onSimpleSearchSubmit={handleSimpleSearchSubmit}
      />
      <div className="flex h-[calc(100vh-4rem)]">
        {view === 'reader' && (
          <FiltersSidebar
            // Pass all filter states and handlers
            searchQueries={parsedApiQueries}
            handleClearAllFilters={handleClearAllFilters}
            yearFilter={yearFilter} setYearFilter={setYearFilter}
            fromDate={fromDate} setFromDate={setFromDate}
            toDate={toDate} setToDate={setToDate}
            searchType={searchType} handleSearchTypeChange={handleSearchTypeChange}
            selectedDocTypeValues={selectedDocTypeValues} handleDocTypeChange={handleDocTypeChange}
            docTypeCounts={docTypeCounts}
            selectedBranchTypeValues={selectedBranchTypeValues} handleBranchTypeChange={handleBranchTypeChange}
            branchTypeCounts={branchTypeCounts}
            selectedExtensionTypeValues={selectedExtensionTypeValues} handleExtensionTypeChange={handleExtensionTypeChange}
            extensionTypeCounts={extensionTypeCounts}
            
            // new: parent-docs-only toggle
            parentsOnly={parentsOnly}
            onToggleParentsOnly={setParentsOnly}
            // Pass constants
            DOCTYPES_MAP={DOCTYPES_MAP}
            BRANCHES_MAP={BRANCHES_MAP}
            EXTENSIONS_MAP={EXTENSIONS_MAP}
            SEARCH_TYPES={SEARCH_TYPES}
            isLoading={loading}
          />
        )}

        {/* Document List Section */}
        <div className={`${view === 'reader' ? 'w-5/6' : 'w-full'} p-4 h-full flex flex-col`}>
          <div className="flex justify-end mb-4 flex-shrink-0">
            <button onClick={() => setView('reader')} className={`p-2 ${view === 'reader' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`} title="Reader View"><FaList /></button>
            <button onClick={() => setView('grid')} className={`p-2 ${view === 'grid' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`} title="Grid View"><FaTh /></button>
          </div>
          <div className="flex-grow min-h-0">
            {view === 'reader' ? (
              <SearchResultsArea
                // Pass data, loading/error states, and action handlers
                loading={loading}
                error={error}
                documents={documents}
                searchQuery={parsedApiQueries}
                searchAfter={searchAfter}
                fetchDocuments={fetchDocuments} // For Load More button
                handleAttachmentLinkClick={handleAttachmentLinkClick} // For DocumentCard
                currentViewTitle={currentViewTitle} // Pass context title
              />
            ) : (
              <div className="h-full">
                <GridView1 
                  documents={documents} 
                  pageSize={gridPageSize} 
                  onPageSizeChange={setGridPageSize} 
                  isLoading={loading} 
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentList;